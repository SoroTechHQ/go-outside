# GoOutside Search Product, Infrastructure, And DevOps Strategy

Date: 2026-06-17

## Purpose

This document is broader than the search bug audit. It describes what search should become inside GoOutside: a product experience, a ranking system, an AI planning interface, a data platform, and an operational surface that can be measured and improved.

Search should not be treated as a single input box. For GoOutside, search is the moment where users say what kind of life they want this week: "something chill tonight", "free music near Osu", "where are my friends going", "tech networking under GHS 100", or "surprise me". The system should translate that intent into events, people, posts, social context, and an AI-guided plan.

## Product Vision

Search should have two connected modes:

- Browse Search: fast, filterable, visually scannable results at `/search`.
- AI Search: conversational planning at `/ai`, with prompt handoff from search.

The user should never need to understand the implementation difference. They should only feel that keyword search is quick, while AI search is deeper and more personal.

## Real-Life User Scenarios

### Scenario 1: "I am bored tonight"

User query:

```text
something fun tonight
```

Expected behavior:

- `/search` recognizes time intent: tonight.
- Results prioritize events starting today, especially evening events.
- Search chips appear: Tonight, Free, Near me, Friends going, Music, Food and drink.
- A top "Ask AI to plan tonight" CTA sends the prompt to `/ai?prompt=something+fun+tonight&autosend=1`.

AI response should:

- Ask no unnecessary setup question.
- Pull live events.
- Show 3 to 5 event cards.
- Explain each match: "starts late enough", "popular with people near Accra", "low ticket cost", "matches your music interest".
- Offer follow-ups: "Free only", "Near Osu", "Bring friends", "Make it chill".

Infrastructure required:

- Event time indexing.
- Neighborhood/city fields.
- Search analytics for no-click/no-result queries.
- AI tool access to the same event search backend.

### Scenario 2: "I have a fixed budget"

User query:

```text
events under 100 cedis this weekend
```

Expected behavior:

- Search extracts budget and date.
- `/search` applies a visible `Under GHS 100` chip.
- Ranking considers total estimated outing cost, not just ticket price.
- AI search uses budget tools and includes ticket plus estimated transport/extras.

Why this matters:

An event with a free ticket but expensive drinks and transport may be a bad match. For Ghana event discovery, "affordable" should mean the total night out is realistic.

Infrastructure required:

- Ticket price index.
- Estimated extras by category and location.
- Optional user home area or preferred city.
- AI budget tool using the same scoring assumptions as search.

### Scenario 3: "I want what my friends are doing"

User query:

```text
where are my friends going this weekend
```

Expected behavior:

- Search returns events with social proof first.
- Cards show "3 people you follow are going" or "popular with your network".
- If user is not authenticated, fallback to trending and prompt sign-in for social search.

Infrastructure required:

- Graph edges for follows, saves, ticket purchases, RSVPs.
- A denormalized event social summary table.
- Privacy rules so users only see allowed social signals.
- Batch jobs to refresh social counts.

### Scenario 4: "I know the vibe, not the category"

User query:

```text
date night with drinks
```

Expected behavior:

- Search maps "date night" to food-drink, rooftop, jazz, lounge, arts, low-noise, evening time.
- Results include exact text matches and semantic matches.
- The UI lets the user narrow: Romantic, Drinks, Quiet, Rooftop, Live music.

Infrastructure required:

- Synonym dictionary.
- Vibe taxonomy.
- Full-text search plus trigram matching.
- Later: embeddings for semantic recall.

### Scenario 5: "I remember part of the event name"

User query:

```text
afro future
```

Expected behavior:

- Typo and spacing tolerant search.
- Exact title matches rank first.
- Known events rank above generic posts.
- If no exact current event exists, show old/past matches separately and suggest similar upcoming events.

Infrastructure required:

- `pg_trgm` similarity.
- Normalized titles.
- Past/upcoming event separation.
- Query rewrites for common spelling variants.

### Scenario 6: Organizer search

User query:

```text
events by Palm Moments
```

Expected behavior:

- Recognize organizer intent.
- Show organizer profile and upcoming events.
- Allow "follow organizer" directly from results.

Infrastructure required:

- Organizer name search.
- Organizer/event relationship index.
- Result blending that can mix organizer, event, and post entities.

## Lessons From Real Products

### Google AI Mode

Google's AI Mode pattern is that traditional search and conversational exploration are connected but clearly distinct. Users can ask broader questions, continue with follow-ups, and still get useful links.

GoOutside implication:

- `/search` should offer fast results.
- `/ai` should take over when the query is broad, ambiguous, multi-step, personal, or planning-oriented.
- The handoff should preserve the exact prompt.

Sources:

- https://search.google/ways-to-search/ai-mode/
- https://blog.google/products-and-platforms/products/search/google-search-ai-mode-update/
- https://support.google.com/websearch/answer/16011537

### Perplexity

Perplexity's product strength is answer plus grounding: users get a synthesized answer, visible sources/results, and follow-up prompts.

GoOutside implication:

- AI answers should always include event cards or explain when no matching event exists.
- AI should show what it checked: events, budget, profile, friends, organizer, trending.
- Follow-up chips should refine the active chat, not start isolated one-off calls.

Source:

- https://wondertools.substack.com/p/the-new-perplexity

### TikTok Search And Discovery

TikTok treats search as discovery, not only retrieval. Matching the typed query matters, but content engagement, user interest, and recommendation signals shape what appears.

GoOutside implication:

- Ranking should combine query match with saves, ticket purchases, friends, organizer trust, recency, and user interests.
- Trending searches should reflect real behavior in Accra/Kumasi/Takoradi, not hardcoded examples.

Source:

- https://support.tiktok.com/en/using-tiktok/exploring-videos/how-tiktok-recommends-content

### Airbnb

Airbnb search keeps structured filters central because booking intent depends on hard constraints: place, date, availability, price, and amenities.

GoOutside implication:

- Event search must keep hard filters visible: when, city/area, category, price, free, friends going, availability.
- AI can infer filters, but `/search` should expose them so users can adjust.

Sources:

- https://www.airbnb.com/help/article/479
- https://www.airbnb.com/help/article/252

### Spotify

Spotify separates personalization/recommendation infrastructure from experimentation infrastructure and uses nearest-neighbor systems for similarity/recommendation use cases.

GoOutside implication:

- Do not mix ranking, personalization, and experiments in one unobservable blob.
- Build ranking as a service boundary with feature logging.
- Use lexical search now, hybrid/vector search later when there is enough event/user behavior data.

Sources:

- https://engineering.atspotify.com/2026/1/why-we-use-separate-tech-stacks-for-personalization-and-experimentation
- https://engineering.atspotify.com/introducing-voyager-spotifys-new-nearest-neighbor-search-library

### Elastic And Algolia

Elastic and Algolia both emphasize hybrid search, relevance tuning, personalization, analytics, and operational reliability. Elastic frames hybrid search as combining exact lexical matching with semantic understanding. Algolia case studies emphasize fast search infrastructure and scaling without application teams owning every search concern.

GoOutside implication:

- Start with Postgres/Supabase because the app already uses it.
- Add a dedicated search layer only when query volume, relevance needs, or operational constraints justify it.
- Relevance must be measured with judgment lists and analytics, not opinions.

Sources:

- https://www.elastic.co/what-is/hybrid-search
- https://www.elastic.co/search-labs/blog/judgment-lists
- https://www.algolia.com/customers/fern-case-study
- https://www.algolia.com/blog/ux/search-personalization-101

## How Search Should Work In The App

### Entry Points

Search should be available from:

- Home header.
- Bottom nav or mobile top search.
- Empty states.
- Category pages.
- Event detail "similar events".
- Organizer pages.
- AI chat follow-up links.

Each entry point should pass context:

```ts
type SearchEntryContext = {
  source: "home" | "nav" | "category" | "event_detail" | "organizer" | "ai" | "empty_state";
  query?: string;
  category?: string;
  when?: string;
  city?: string;
  eventId?: string;
  organizerId?: string;
};
```

### Query Understanding

Every query should be parsed into:

```ts
type ParsedSearchIntent = {
  rawQuery: string;
  cleanedQuery: string;
  entityIntent: "events" | "people" | "posts" | "organizers" | "mixed";
  timeIntent?: "today" | "tonight" | "tomorrow" | "weekend" | "next_week" | "month";
  budgetMaxGhs?: number;
  city?: "Accra" | "Kumasi" | "Takoradi";
  neighborhood?: string;
  categories: string[];
  vibes: string[];
  socialIntent?: "friends_going" | "popular" | "organizer";
  shouldOfferAi: boolean;
};
```

This parser does not need to be an LLM at first. Start with deterministic rules and synonyms. Use AI for ambiguous query expansion later.

### Result Types

Search should return a blended response:

```ts
type SearchResponse = {
  query: ParsedSearchIntent;
  modules: SearchModule[];
  diagnostics?: SearchDiagnostics;
};

type SearchModule =
  | { type: "events"; title: string; items: EventResult[] }
  | { type: "people"; title: string; items: UserResult[] }
  | { type: "posts"; title: string; items: PostResult[] }
  | { type: "organizers"; title: string; items: OrganizerResult[] }
  | { type: "suggestions"; title: string; items: SearchSuggestion[] }
  | { type: "empty_recovery"; title: string; actions: RecoveryAction[] };
```

The current API returns flat arrays. That is fine for the next fix, but the target model should be modules because real search pages need sections, explanations, fallbacks, and recovery actions.

### Ranking Formula

Initial scoring should be transparent and logged:

```text
final_score =
  lexical_match_score
  + exact_title_boost
  + time_fit_score
  + location_fit_score
  + category_fit_score
  + user_interest_score
  + social_proof_score
  + trending_score
  + organizer_quality_score
  + affordability_score
  - sold_out_penalty
  - stale_event_penalty
```

Do not over-optimize early. The first goal is explainable ranking and observability.

### AI Search Behavior

AI search should be used when:

- The query is broad: "plan my weekend".
- The query has multiple constraints: "date night under 200 cedis near Osu".
- The query is personal: "what would I like".
- The query is social: "where are my friends going".
- The result set is weak or empty.
- The user explicitly taps AI Search.

AI should not replace hard filters. It should infer filters, use tools, show cards, and let the user continue.

## Infrastructure Architecture

### Current Stack Fit

Current repo signals:

- Next.js 15 app in `apps/web`.
- Supabase/Postgres as primary database.
- Clerk auth.
- Groq SDK in AI endpoints.
- TanStack Query on the client.
- Existing analytics collection route.
- Existing interaction tracking hooks.
- Vercel cron configured in `vercel.json`.

Recommended near-term approach:

- Keep Supabase/Postgres as the source of truth and first search engine.
- Use Postgres full-text, `pg_trgm`, materialized views, and RPCs before introducing a separate search vendor.
- Centralize AI event retrieval on the same search service used by `/search`.

### Data Model Additions

Add or formalize these tables/views:

```sql
-- Query and result analytics
search_events
search_result_impressions
search_result_clicks
search_no_result_queries

-- Denormalized searchable event document
event_search_documents

-- User/query personalization signals
user_search_profiles
user_recent_searches

-- Relevance evaluation
search_judgment_lists
search_judgment_results

-- Optional later semantic layer
event_embeddings
query_embedding_cache
```

### Event Search Document

Create one document per searchable event:

```ts
type EventSearchDocument = {
  eventId: string;
  title: string;
  normalizedTitle: string;
  description: string;
  organizerName: string;
  venueName: string;
  city: string;
  neighborhood: string | null;
  categories: string[];
  tags: string[];
  vibes: string[];
  searchableText: string;
  startDatetime: string;
  minTicketPriceGhs: number;
  isFree: boolean;
  availabilityState: "available" | "low_inventory" | "sold_out";
  socialScore: number;
  trendingScore: number;
  qualityScore: number;
  updatedAt: string;
};
```

This should be regenerated when events, venues, organizers, ticket types, tags, or moderation state change.

### Search Service Boundary

Create a shared server module:

```text
apps/web/lib/search/
  parse-query.ts
  search-events.ts
  search-users.ts
  search-posts.ts
  rank-events.ts
  build-modules.ts
  analytics.ts
  types.ts
```

Both `/api/search` and AI tools should call this module. Avoid having AI search and keyword search drift into separate ranking systems.

### Search API Contract

Near-term API:

```http
GET /api/search?q=music&when=weekend&categories=music&limit=20&cursor=...
```

Target API:

```http
POST /api/search/query
Content-Type: application/json

{
  "query": "free music in Osu tonight",
  "filters": {
    "when": "tonight",
    "city": "Accra",
    "price": { "max": 0 }
  },
  "context": {
    "source": "home",
    "sessionId": "...",
    "userId": "..."
  }
}
```

Use `GET` for shareable URLs, but use `POST` internally for richer context and analytics.

### Caching

Cache only where it is safe:

- Public trending modules: cache 1 to 5 minutes.
- Category landing searches: cache 1 to 5 minutes.
- Typeahead: cache per query prefix for 30 to 120 seconds.
- Personalized results: do not globally cache; use short per-user cache only if needed.
- AI answers: do not blindly cache whole answers; cache tool results and query expansions.

If staying on Vercel:

- Use Next.js route caching carefully only for public search modules.
- Use Vercel Cron for periodic rebuilds.
- Consider a small KV/Redis layer later for hot prefixes and rate limits.

### Index Refresh

Use two refresh paths:

- Synchronous refresh for organizer edits that must appear quickly.
- Scheduled repair job to rebuild search documents and catch drift.

Suggested jobs:

```text
every 5 min: refresh recently changed event_search_documents
hourly: refresh trending/social scores
daily: rebuild all active event search documents
daily: compute no-result query report
weekly: refresh judgment list metrics
```

### Observability

Search needs product and infrastructure observability.

Product metrics:

- Query volume.
- No-result rate.
- Zero-click rate.
- Search result click-through rate.
- Query to event view.
- Query to save.
- Query to cart.
- Query to ticket purchase.
- AI handoff rate.
- AI completion and follow-up rate.

Operational metrics:

- P50/P95/P99 search latency.
- Database query duration.
- RPC error rate.
- AI route latency and token cost.
- Timeout rate.
- Rate-limit hits.
- Cache hit rate.
- Index freshness lag.

Logging:

```ts
type SearchLog = {
  requestId: string;
  sessionId: string;
  userId?: string;
  query: string;
  parsedIntent: ParsedSearchIntent;
  filters: Record<string, unknown>;
  resultCounts: Record<string, number>;
  latencyMs: number;
  backend: "postgres" | "hybrid" | "external";
  rankingVersion: string;
  experimentId?: string;
};
```

### Relevance Evaluation

Add judgment lists before heavy ML work.

Example judgment list:

```text
query: "free music tonight"
excellent: free live music events happening today/tonight
good: free music events this week
bad: paid networking events, past events, unrelated posts
```

Track metrics:

- NDCG@5
- Recall@20
- MRR
- No-result rate
- Bad top-result rate

This lets the team compare ranking versions without guessing.

## DevOps Positioning

### Environments

Use four environments:

- Local: developer data and mocks.
- Preview: Vercel preview deployments with seeded non-production data.
- Staging: production-like Supabase project, production-like search indexes, safe AI keys.
- Production: live users and live payment data.

Search needs staging because ranking changes are subtle. A change can "work" technically and still destroy discovery quality.

### Database Migrations

Use migration gates:

- Every search schema change must include rollback notes.
- Every new RPC must include expected query plan notes.
- Index creation should be concurrent where possible.
- Large backfills should be chunked.
- Search migrations should include before/after latency checks.

### Release Strategy

Use feature flags:

```text
search_v2_enabled
ai_search_handoff_enabled
hybrid_search_enabled
search_personalization_enabled
search_new_ranking_v1
```

Rollout:

1. Internal users.
2. 5 percent of authenticated users.
3. 25 percent.
4. 50 percent.
5. 100 percent.

Rollback plan:

- Keep old `/api/search` behavior behind a fallback flag.
- If latency or no-result rate spikes, disable new ranking only, not the whole search page.

### Load Testing

Create a search load test with common query patterns:

- 1 character typeahead.
- 2 to 3 character typeahead.
- Popular queries.
- Empty query discovery.
- Filter-heavy query.
- AI handoff query.

Targets:

- Typeahead P95 under 200 ms server time.
- Search results P95 under 500 ms server time.
- AI first token under 2.5 seconds where possible.
- AI complete response under 10 seconds for normal event discovery.

### Cost Controls

Search should not call AI for every keystroke.

Rules:

- Typeahead uses lexical search only.
- AI only runs after explicit user action or clear AI intent.
- Cache query parsing if AI-based parsing is introduced.
- Rate limit `/api/ai/ask`.
- Log token usage by feature source.

### Security And Privacy

Search touches sensitive behavioral data.

Rules:

- Never expose private saved/ticket/friend data across users.
- Social proof should use aggregate or permission-safe phrasing.
- AI prompts should be treated as user data.
- Logs should avoid storing unnecessary PII.
- Admin/debug ranking diagnostics must not be exposed to normal users.

### Incident Playbook

Common incidents:

- Search returns no results for popular queries.
- Search latency spikes.
- AI returns irrelevant or invented events.
- Database RPC fails after migration.
- Trending results show stale/past events.

Response:

1. Check search API error rate and latency.
2. Check Supabase RPC logs/query duration.
3. Disable latest ranking flag if needed.
4. Fall back to simple upcoming/trending query.
5. Create no-result report for affected queries.
6. Add failing queries to judgment list.

## Build Roadmap

### Phase 0: Product Foundation

Goal: make search coherent.

- Route all AI search actions to `/ai`.
- Keep `/search` for browse search.
- Make mobile and desktop search use the same live API.
- Add recent/trending search modules.

### Phase 1: Search Backend Foundation

Goal: make search correct and observable.

- Create shared `lib/search` server module.
- Fix pagination.
- Fix fallback filtering.
- Add query parser.
- Add search analytics tables.
- Add no-result logging.
- Add latency logging.

### Phase 2: Relevance Foundation

Goal: improve result quality without ML complexity.

- Add `event_search_documents`.
- Add `pg_trgm`.
- Add synonym dictionary.
- Add ranked scoring function.
- Add judgment lists and weekly relevance report.

### Phase 3: Personalization And Social Search

Goal: make GoOutside feel local and personal.

- Add social proof summaries.
- Add user search profile.
- Use interests, saves, tickets, follows, and city.
- Add privacy-safe friends-going filters.
- Add per-user ranking boosts.

### Phase 4: AI Search As Event Planner

Goal: make `/ai` the planning layer.

- Make `/api/ai/ask` the only AI discovery endpoint.
- Give AI tools access to unified search.
- Add structured search links back to `/search`.
- Add budget-aware recommendations.
- Add plan-saving: "Save this weekend plan".

### Phase 5: Hybrid Search

Goal: improve recall for vague, vibe-based queries.

- Add embeddings for event documents.
- Add query embedding cache.
- Blend lexical, trigram, and vector results.
- Evaluate with judgment lists before full rollout.
- Consider Elastic/Algolia only if Postgres becomes operationally limiting.

## Suggested Team Ownership

Product:

- Query scenarios.
- Filter taxonomy.
- No-result recovery.
- Success metrics.

Frontend:

- Search UI.
- Filter chips.
- AI handoff.
- Result modules.
- Mobile parity.

Backend:

- Search API.
- Ranking service.
- Query parsing.
- Analytics logging.
- AI tool integration.

Data:

- Search documents.
- Synonyms.
- Judgment lists.
- Relevance reports.
- Social/trending features.

DevOps:

- Environments.
- Migrations.
- Cron jobs.
- Monitoring.
- Feature flags.
- Rollback playbooks.

## Concrete Next Actions

1. Implement AI prompt handoff to `/ai`.
2. Replace mobile AI overlay with a direct AI chat route.
3. Create `apps/web/lib/search` and move `/api/search` logic into reusable modules.
4. Add `search_events` and `search_result_clicks` analytics tables.
5. Add no-result logging.
6. Add `pg_trgm` and event title similarity ranking.
7. Create a 50-query judgment list for Accra event discovery.
8. Add Vercel/Supabase monitoring around `/api/search` and `/api/ai/ask`.
9. Add a daily no-result report to the admin dashboard.
10. Create feature flags for search v2 and AI search handoff.

## Definition Of Done

Search v2 is successful when:

- Users can search by keyword, date, budget, vibe, area, and social intent.
- AI search always opens/persists in `/ai`.
- Mobile and desktop have the same search quality.
- No-result queries are tracked and reviewed weekly.
- Ranking changes can be tested against judgment lists.
- Search latency and AI latency are visible.
- A bad ranking rollout can be disabled without redeploying.
- The system can explain why a result ranked highly.

