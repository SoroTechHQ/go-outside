import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { getSupabaseUserIdByClerkId } from "../../../../lib/db/users";

// POST /api/analytics/collect — receives fingerprint + behavioral events
// Returns 200 immediately; DB writes are fire-and-forget
export async function POST(req: NextRequest) {
  const { userId: clerkUserId } = await auth();
  const body = await req.json().catch(() => null);
  if (!body?.type) return NextResponse.json({ ok: true });

  // Resolve Supabase user ID in background — don't block response
  void (async () => {
    try {
      let userId: string | null = null;
      if (clerkUserId) {
        userId = await getSupabaseUserIdByClerkId(clerkUserId);
      }

      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        req.headers.get("x-real-ip") ??
        null;

      const ua = req.headers.get("user-agent") ?? null;

      switch (body.type) {
        case "session_start": {
          const { session_token, device_type, referrer, browser, os } = body;
          if (!session_token) break;
          await supabaseAdmin.from("interaction_sessions").upsert(
            {
              session_token,
              user_id: userId,
              device_type: device_type ?? "desktop",
              referrer: referrer ?? null,
              browser: browser ?? null,
              os: os ?? null,
              ip_address: ip,
              user_agent: ua,
              started_at: new Date().toISOString(),
              last_seen_at: new Date().toISOString(),
              is_active: true,
              page_count: 0,
            },
            { onConflict: "session_token", ignoreDuplicates: false }
          );
          break;
        }

        case "session_ping": {
          const { session_token } = body;
          if (!session_token) break;
          await supabaseAdmin
            .from("interaction_sessions")
            .update({ last_seen_at: new Date().toISOString() })
            .eq("session_token", session_token);
          break;
        }

        case "session_end": {
          const { session_token, duration_seconds } = body;
          if (!session_token) break;
          await supabaseAdmin
            .from("interaction_sessions")
            .update({
              ended_at: new Date().toISOString(),
              is_active: false,
              interaction_count: duration_seconds ?? 0,
            })
            .eq("session_token", session_token);
          break;
        }

        case "fingerprint": {
          const { session_token, data } = body;
          if (!data) break;

          // Resolve session_id from token
          const { data: session } = await supabaseAdmin
            .from("interaction_sessions")
            .select("id")
            .eq("session_token", session_token)
            .single();

          await supabaseAdmin.from("user_fingerprints").insert({
            user_id: userId,
            session_id: session?.id ?? null,
            fingerprint_hash: data.fingerprint_hash,
            canvas_hash: data.canvas_hash,
            webgl_hash: data.webgl_hash,
            audio_hash: data.audio_hash,
            cpu_cores: data.cpu_cores,
            ram_gb: data.ram_gb,
            gpu_vendor: data.gpu_vendor,
            gpu_renderer: data.gpu_renderer,
            screen_width: data.screen_width,
            screen_height: data.screen_height,
            pixel_ratio: data.pixel_ratio,
            color_depth: data.color_depth,
            timezone: data.timezone,
            language: data.language,
            platform: data.platform,
            touch_points: data.touch_points,
            fonts_count: data.fonts_count,
            has_ad_blocker: data.has_ad_blocker,
            has_do_not_track: data.has_do_not_track,
            is_incognito: data.is_incognito,
            has_webrtc: data.has_webrtc,
            connection_type: data.connection_type,
            downlink_mbps: data.downlink_mbps,
            battery_level: data.battery_level,
            is_charging: data.is_charging,
            webgl_vendor: data.gpu_vendor,
            webgl_renderer: data.gpu_renderer,
            device_memory_gb: data.ram_gb,
            browser_name: data.browser_name,
            browser_version: data.browser_version,
            os_name: data.os_name,
            raw_data: data.raw_data,
          });

          // Update behavioral signals cache
          if (userId) {
            await supabaseAdmin
              .from("user_behavioral_signals")
              .upsert(
                {
                  user_id: userId,
                  device_type: data.device_type,
                  last_fingerprint_hash: data.fingerprint_hash,
                  last_active_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id", ignoreDuplicates: false }
              );
          }
          break;
        }

        case "page_view": {
          const { session_token, page_path, page_title, referrer, entered_at } = body;
          if (!page_path) break;

          const { data: session } = await supabaseAdmin
            .from("interaction_sessions")
            .select("id")
            .eq("session_token", session_token)
            .maybeSingle();

          await supabaseAdmin.from("user_page_views").insert({
            user_id: userId,
            session_id: session?.id ?? null,
            page_path,
            page_title: page_title ?? null,
            referrer: referrer ?? null,
            entered_at: entered_at ?? new Date().toISOString(),
          });

          // Increment page_count on session (best-effort)
          if (session?.id) {
            try {
              const { data: s } = await supabaseAdmin
                .from("interaction_sessions")
                .select("page_count")
                .eq("id", session.id)
                .single();
              await supabaseAdmin
                .from("interaction_sessions")
                .update({ page_count: (s?.page_count ?? 0) + 1 })
                .eq("id", session.id);
            } catch {
              // best-effort
            }
          }
          break;
        }

        case "page_exit": {
          const { page_view_id, time_on_page_ms, scroll_depth_pct, click_count } = body;
          if (!page_view_id) break;
          await supabaseAdmin
            .from("user_page_views")
            .update({
              exited_at: new Date().toISOString(),
              time_on_page_ms: time_on_page_ms ?? null,
              scroll_depth_pct: scroll_depth_pct ?? 0,
              max_scroll_pct: scroll_depth_pct ?? 0,
              click_count: click_count ?? 0,
              is_bounce: (time_on_page_ms ?? 0) < 10_000,
            })
            .eq("id", page_view_id);
          break;
        }

        case "events_batch": {
          const { session_token, events } = body;
          if (!Array.isArray(events) || events.length === 0) break;

          const { data: session } = await supabaseAdmin
            .from("interaction_sessions")
            .select("id")
            .eq("session_token", session_token)
            .maybeSingle();

          const rows = events.map((e: Record<string, unknown>) => ({
            user_id: userId,
            session_id: session?.id ?? null,
            event_type: e.event_type as string,
            page_path: e.page_path as string ?? null,
            target_element: e.target_element as string ?? null,
            target_entity_id: e.target_entity_id as string ?? null,
            entity_type: e.entity_type as string ?? null,
            hover_duration_ms: e.hover_duration_ms as number ?? null,
            x_position: e.x as number ?? null,
            y_position: e.y as number ?? null,
            scroll_depth_pct: e.scroll_depth_pct as number ?? null,
            payload: e.payload as Record<string, unknown> ?? null,
            created_at: e.ts as string ?? new Date().toISOString(),
          }));

          await supabaseAdmin.from("user_micro_events").insert(rows);

          // Update aggregate signals for meaningful events
          if (userId) {
            const saves = events.filter((e: Record<string, unknown>) => e.event_type === 'save_event').length;
            const searches = events.filter((e: Record<string, unknown>) => e.event_type === 'search').length;
            const rageClicks = events.filter((e: Record<string, unknown>) => e.event_type === 'rage_click').length;
            const hoverEvents = events.filter((e: Record<string, unknown>) => e.event_type === 'hover_event') as { hover_duration_ms?: number }[];
            const avgHover = hoverEvents.length > 0
              ? Math.round(hoverEvents.reduce((s, e) => s + (e.hover_duration_ms ?? 0), 0) / hoverEvents.length)
              : 0;

            if (saves > 0 || searches > 0 || rageClicks > 0 || hoverEvents.length > 0) {
              await supabaseAdmin
                .from("user_behavioral_signals")
                .upsert(
                  {
                    user_id: userId,
                    save_count: saves,
                    search_count: searches,
                    rage_click_count: rageClicks,
                    event_hover_count: hoverEvents.length,
                    avg_event_hover_ms: avgHover,
                    last_active_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                  { onConflict: "user_id", ignoreDuplicates: false }
                );
            }
          }
          break;
        }
      }
    } catch {
      // Intentionally swallow — analytics must never break the app
    }
  })();

  return NextResponse.json({ ok: true });
}
