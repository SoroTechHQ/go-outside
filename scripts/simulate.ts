/**
 * GoOutside Simulation Runner
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs a simulated session of N users browsing events, generating:
 * - interaction graph edges (card_view, save, ticket_intent, etc.)
 * - interest vectors per user
 * - scarcity states per event
 * - a ranked "for you" feed per user
 *
 * Usage:
 *   npx tsx scripts/simulate.ts
 *   npx tsx scripts/simulate.ts --users 20 --sessions 3
 *
 * Output:
 *   console — coloured simulation log
 *   scripts/simulation-output.json — full output you can inspect
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import seedData from "../packages/demo-data/src/ghana-seed.json" assert { type: "json" };

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Types ────────────────────────────────────────────────────────────────────

interface User {
  id:               string;
  firstName:        string;
  lastName:         string;
  locationCity:     string;
  interests:        string[];
  pulseScore:       number;
  pulseTier:        string;
  onboardingComplete: boolean;
}

interface SeedEvent {
  id:             string;
  slug:           string;
  title:          string;
  categorySlug:   string;
  city:           string;
  priceGHS:       number;
  capacity:       number;
  ticketsSold:    number;
  status:         string;
  featured:       boolean;
  rating:         number;
  tags:           string[];
}

interface GraphEdge {
  fromId:    string;
  toId:      string;
  edgeType:  string;
  weight:    number;
}

interface SimulatedInteraction extends GraphEdge {
  sessionId:  string;
  createdAt:  string;
}

// ── Weight map ───────────────────────────────────────────────────────────────

const WEIGHTS: Record<string, number> = {
  card_view:       0.5,
  card_hover:      1.0,
  card_long_dwell: 1.5,
  card_click:      2.0,
  peek_open:       1.5,
  save:            5.0,
  unsave:         -1.0,
  not_interested: -1.5,
  share:           4.0,
  ticket_intent:   7.0,
  keyboard_save:   5.0,
  scroll_past:    -0.3,
  registered:     10.0,
  checked_in:      8.0,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function chance(p: number) {
  return Math.random() < p;
}

function isoNow(offsetMs = 0) {
  return new Date(Date.now() - offsetMs).toISOString();
}

function matchesInterests(event: SeedEvent, interests: string[]) {
  return interests.some(
    (i) => event.categorySlug === i || event.tags.includes(i)
  );
}

// ── Scoring formula (Phase 1 SQL equivalent) ─────────────────────────────────

function scoreEvent(
  event:       SeedEvent,
  user:        User,
  interactions: SimulatedInteraction[]
): number {
  let score = 0;

  // Interest match
  const interestIdx = user.interests.indexOf(event.categorySlug);
  if (interestIdx === 0)      score += 3.0;
  else if (interestIdx === 1) score += 2.0;
  else if (interestIdx >= 2)  score += 1.0;

  // Location match
  const userCity = user.locationCity.split(",")[0]!.trim().toLowerCase();
  if (event.city.toLowerCase().includes(userCity)) score += 2.5;
  else score += 0.5;

  // Velocity (saves + ticket_intents on this event)
  const velocity = interactions.filter(
    (i) => i.toId === event.id && ["save", "ticket_intent"].includes(i.edgeType)
  ).length;
  score += velocity * 1.5;

  // Quality
  score += event.rating * 1.2;

  // Featured bonus
  if (event.featured) score += 1.5;

  // Urgency (random offset simulating time-to-event)
  score += Math.random() * 0.5;

  return score;
}

// ── Interest vector computation ──────────────────────────────────────────────

function computeInterestVector(
  userId:        string,
  interactions:  SimulatedInteraction[],
  events:        SeedEvent[]
): Record<string, number> {
  const eventMap = new Map(events.map((e) => [e.id, e]));
  const vector: Record<string, number> = {};

  for (const edge of interactions) {
    if (edge.fromId !== userId) continue;
    if (!["card_click","save","ticket_intent","registered","checked_in","peek_open"].includes(edge.edgeType)) continue;

    const event = eventMap.get(edge.toId);
    if (!event) continue;

    const slug  = event.categorySlug;
    const days  = 0; // simulation — no time decay in single-session sim
    const decay = Math.exp(-0.693 * days / 30);
    vector[slug] = (vector[slug] ?? 0) + edge.weight * decay;
  }

  // Normalize to 0–1
  const max = Math.max(...Object.values(vector), 1);
  return Object.fromEntries(
    Object.entries(vector).map(([k, v]) => [k, Math.round((v / max) * 1000) / 1000])
  );
}

// ── Scarcity state ───────────────────────────────────────────────────────────

function getScarcityState(event: SeedEvent) {
  if (!event.capacity) return { state: "normal", label: "" };
  const fill      = event.ticketsSold / event.capacity;
  const remaining = event.capacity - event.ticketsSold;

  if (fill >= 1.0)  return { state: "sold_out",        label: "Sold out" };
  if (fill >= 0.97) return { state: "final_spots",     label: `Final ${remaining} spot${remaining === 1 ? "" : "s"}` };
  if (fill >= 0.90) return { state: "almost_sold_out", label: `${remaining} tickets left` };
  if (fill >= 0.60) return { state: "selling_fast",    label: "Selling fast" };
  return                    { state: "normal",          label: "" };
}

// ── Simulate one user session ─────────────────────────────────────────────────

function simulateUserSession(
  user:        User,
  events:      SeedEvent[],
  existing:    SimulatedInteraction[],
  sessionId:   string
): SimulatedInteraction[] {
  const result: SimulatedInteraction[] = [];
  const published = events.filter((e) => e.status === "published");

  // Score and sort events for this user
  const scored = published
    .map((e) => ({ event: e, score: scoreEvent(e, user, existing) }))
    .sort((a, b) => b.score - a.score);

  const feed = scored.slice(0, 20).map((s) => s.event);
  let offsetMs = 0;

  for (const event of feed) {
    offsetMs += Math.floor(Math.random() * 8000) + 1000; // 1–9s between cards

    const relevant = matchesInterests(event, user.interests);

    // card_view — always
    result.push({ fromId: user.id, toId: event.id, edgeType: "card_view", weight: 0.5, sessionId, createdAt: isoNow(offsetMs) });

    if (chance(0.05)) {
      // scroll_past quickly
      result.push({ fromId: user.id, toId: event.id, edgeType: "scroll_past", weight: -0.3, sessionId, createdAt: isoNow(offsetMs) });
      continue;
    }

    if (relevant && chance(0.55)) {
      // card_hover
      result.push({ fromId: user.id, toId: event.id, edgeType: "card_hover", weight: 1.0, sessionId, createdAt: isoNow(offsetMs) });

      if (chance(0.5)) {
        result.push({ fromId: user.id, toId: event.id, edgeType: "card_long_dwell", weight: 1.5, sessionId, createdAt: isoNow(offsetMs) });
      }

      if (chance(0.45)) {
        result.push({ fromId: user.id, toId: event.id, edgeType: "card_click", weight: 2.0, sessionId, createdAt: isoNow(offsetMs) });

        if (chance(0.4)) {
          result.push({ fromId: user.id, toId: event.id, edgeType: "peek_open", weight: 1.5, sessionId, createdAt: isoNow(offsetMs) });
        }

        if (chance(0.35)) {
          result.push({ fromId: user.id, toId: event.id, edgeType: "save", weight: 5.0, sessionId, createdAt: isoNow(offsetMs) });
        }

        if (chance(0.15) && event.priceGHS <= 200) {
          result.push({ fromId: user.id, toId: event.id, edgeType: "ticket_intent", weight: 7.0, sessionId, createdAt: isoNow(offsetMs) });
        }
      }
    } else if (chance(0.12)) {
      result.push({ fromId: user.id, toId: event.id, edgeType: "not_interested", weight: -1.5, sessionId, createdAt: isoNow(offsetMs) });
    }
  }

  return result;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args         = process.argv.slice(2);
  const userCount    = parseInt(args[args.indexOf("--users") + 1] ?? "15");
  const sessionCount = parseInt(args[args.indexOf("--sessions") + 1] ?? "2");

  const allUsers  = seedData.users as User[];
  const allEvents = seedData.events as SeedEvent[];
  const existing  = seedData.graph_edges as SimulatedInteraction[];

  const simUsers = allUsers.slice(0, userCount);

  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║   GoOutside Simulation                   ║`);
  console.log(`╚══════════════════════════════════════════╝`);
  console.log(`  Users:   ${simUsers.length}`);
  console.log(`  Events:  ${allEvents.length}`);
  console.log(`  Sessions per user: ${sessionCount}`);
  console.log(``);

  const allInteractions: SimulatedInteraction[] = [...existing];
  const sessionLogs: Record<string, unknown>[]  = [];

  for (const user of simUsers) {
    const userName = `${user.firstName} ${user.lastName}`;
    console.log(`▶ Simulating ${userName} (${user.pulseTier}) — ${user.interests.join(", ")}`);

    const userInteractions: SimulatedInteraction[] = [];

    for (let s = 0; s < sessionCount; s++) {
      const sessionId = `sim-${user.id}-${s}`;
      const newEdges  = simulateUserSession(user, allEvents, allInteractions, sessionId);
      userInteractions.push(...newEdges);
      allInteractions.push(...newEdges);

      const saves    = newEdges.filter((e) => e.edgeType === "save").length;
      const clicks   = newEdges.filter((e) => e.edgeType === "card_click").length;
      const intents  = newEdges.filter((e) => e.edgeType === "ticket_intent").length;
      const dismiss  = newEdges.filter((e) => e.edgeType === "not_interested").length;
      console.log(`  Session ${s + 1}: ${newEdges.length} edges — ${saves} saves, ${clicks} clicks, ${intents} intents, ${dismiss} dismissed`);
    }

    // Compute interest vector
    const vector = computeInterestVector(user.id, userInteractions, allEvents);

    // Build personalised feed
    const feed = allEvents
      .filter((e) => e.status === "published")
      .map((e) => ({ event: e, score: scoreEvent(e, user, allInteractions) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((s) => `${s.event.title} (${s.score.toFixed(2)})`);

    console.log(`  Interest vector: ${JSON.stringify(vector)}`);
    console.log(`  Top feed: ${feed.slice(0, 3).join(" · ")}`);
    console.log(``);

    sessionLogs.push({
      user:          { id: user.id, name: userName, city: user.locationCity },
      interactions:  userInteractions.length,
      interestVector: vector,
      topFeed:       feed,
    });
  }

  // Scarcity summary
  console.log(`── Scarcity States ──────────────────────────`);
  for (const event of allEvents) {
    const sc = getScarcityState(event);
    if (sc.state !== "normal") {
      console.log(`  ${event.title.padEnd(40)} ${sc.state} — ${sc.label}`);
    }
  }

  // Save output
  const output = {
    meta:         { simulatedAt: new Date().toISOString(), userCount, sessionCount, totalInteractions: allInteractions.length },
    sessions:     sessionLogs,
    interactions: allInteractions.slice(-100), // last 100 for brevity
    scarcity:     allEvents.map((e) => ({ id: e.id, title: e.title, ...getScarcityState(e) })),
  };

  const outPath = resolve(__dirname, "simulation-output.json");
  writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log(``);
  console.log(`✓ Simulation complete`);
  console.log(`  Total interactions logged: ${allInteractions.length}`);
  console.log(`  Output: ${outPath}`);
  console.log(``);
}

main().catch(console.error);
