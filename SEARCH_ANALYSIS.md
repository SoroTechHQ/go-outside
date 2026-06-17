# GoOutside Search Audit And Fix Plan

Date: 2026-06-17

## Executive Summary

Search is currently split across too many surfaces:

- `/search` handles keyword results and embeds its own `AIChatPanel`.
- `MobileUnifiedSearch` has a separate AI overlay that calls `/api/ai/weekend`.
- `/ai` and `/ai/[chatId]` are the actual persistent AI chat pages, backed by `/api/ai/ask`, chat history, streamed tool status, follow-ups, and event cards.

The immediate product fix is to stop treating AI search as a mini-panel inside search. Any AI search action should open the AI chat page with the user's current search prompt handed off, then auto-send or prefill it there. Keyword search should stay on `/search`; AI search should go to `/ai`.

The deeper issue is that search has several correctness bugs: mobile suggestions are hardcoded empty, pagination cursors are calculated but not applied, fallback event search can ignore date/upcoming constraints, date range UI is unreliable, and AI routing is inconsistent.

## What Top Search Products Are Doing

Sources checked:

- Google AI Mode: https://search.google/ways-to-search/ai-mode/
- Google AI Mode product update: https://blog.google/products-and-platforms/products/search/google-search-ai-mode-update/
- Google AI Mode Help: https://support.google.com/websearch/answer/16011537
- Perplexity feature overview: https://wondertools.substack.com/p/the-new-perplexity
- TikTok recommendation/search docs: https://support.tiktok.com/en/using-tiktok/exploring-videos/how-tiktok-recommends-content
- Airbnb filters/help: https://www.airbnb.com/help/article/479
- Airbnb listing search/help: https://www.airbnb.com/help/article/252
- Meta AI Mode coverage: https://www.theverge.com/tech/950264/meta-ai-mode-search-facebook

Common patterns:

- Search and AI are converging, but users still get a clear mode switch. Google exposes AI Mode as a deeper conversational path with follow-up questions and useful links. The user does not lose context.
- AI answers need visible grounding. Perplexity's strongest pattern is answer plus sources/results plus follow-up prompts.
- Discovery search is not only typed keywords. TikTok leans on query match, engagement, creator/content signals, and search suggestions.
- Marketplace/event search still needs hard filters. Airbnb keeps date, destination, guests, map context, and filters central because intent is transactional.
- Good search remembers state. Recent searches, AI history, filters, and follow-ups are part of the product, not extras.

Implication for GoOutside:

- Keep `/search` as fast, browsable, filter-first discovery.
- Make `/ai` the canonical conversational search experience.
- Show event cards, tool status, and follow-ups in AI chat.
- Use search results to seed AI, and AI answers to link back to filtered result sets when users want browsing.

## Current Code Findings

### 1. AI Search Opens The Wrong Experience

Files:

- `apps/web/app/search/page.tsx`
- `apps/web/components/search/SearchPillExpanded.tsx`
- `apps/web/components/search/MobileUnifiedSearch.tsx`
- `apps/web/app/ai/page.tsx`
- `apps/web/app/ai/[chatId]/page.tsx`
- `apps/web/components/ai/AICoreChat.tsx`

Current behavior:

- Surprise search pushes `/search?q=Surprise...&surprise=1` and renders an embedded AI panel inside the search page.
- Normal search results show an AI banner that expands `AIChatPanel` inline instead of using the AI chat page.
- Mobile AI search opens an overlay inside `MobileUnifiedSearch`, calls `/api/ai/weekend`, and has a different result model from the real `/ai` chat.
- `/ai` already exists and is the stronger experience: persistent conversations, streaming, chat IDs, tools, event pick cards, follow-up buttons, and history.

Recommended fix:

- Add prompt handoff support to `/ai`, for example `/ai?prompt=live%20music%20in%20Osu&autosend=1`.
- Update `AIDashboardClient` to read `prompt` and `autosend` from `useSearchParams`.
- Update `AICoreChat` to accept `initialPrompt` and `autoSendInitialPrompt`, send it once, then clear the URL with `window.history.replaceState`.
- Replace all AI-search routes from `/search?...surprise=1` with `/ai?prompt=...&autosend=1`.
- Remove or deprecate `AIChatPanel` from `/search` after the AI page handoff works.

Implementation targets:

- `SearchPillExpanded.handleSurprise` currently routes to `/search?...&surprise=1`.
- Search result AI banner currently toggles inline `AIChatPanel`.
- `MobileUnifiedSearch` AI icon currently opens overlay mode.
- `MobileUnifiedSearch.askAssistant` currently calls `/api/ai/weekend`, not `/api/ai/ask`.

### 2. Mobile Search Suggestions Are Effectively Dead

In `MobileUnifiedSearch`, `events` is declared as an empty array and suggestions filter that empty array. This means "Matching events" cannot show live matches on mobile.

Fix:

- Remove the empty demo array.
- Fetch `/api/search?q=${query}&type=all&limit=6` with debounce and abort controller, matching `SearchPillExpanded`.
- Show event, user, and category suggestions.

### 3. Search Pagination Is Broken

`/api/search` creates a cursor with an offset, but `fetchEvents`, `fetchUsers`, and `fetchUserPosts` ignore the cursor. `Load more` can return duplicate first-page results.

Fix:

- Decode cursor once in `GET`.
- Pass `offset` into all fetchers.
- Use `.range(offset, offset + limit - 1)` or equivalent ordering-safe pagination.
- Include a stable order for every result type.

### 4. Event Fallback Search Can Leak Bad Results

The event fallback query after the RPC does not apply the same upcoming/date constraints as the main query. It also builds a PostgREST `.or(...)` filter with raw query text, which can break on commas, braces, percent signs, or other special characters.

Fix:

- Apply `gte("start_datetime", fromDate)` and optional `lte("start_datetime", toDate)` in the fallback.
- Escape or avoid raw `.or(...)` string composition for arbitrary user text.
- Prefer a database RPC for all event text search fallback paths so escaping and ranking live in SQL.

### 5. Date Search UX Is Fragile

The desktop date range stores only day numbers, not full dates. The two mini calendars are independent but both initialize to the current month, so the UI can show two identical months and produce invalid ranges across months.

Fix:

- Store selected dates as full `YYYY-MM-DD` values.
- Render a controlled two-month calendar where the second month is always the next month.
- Add explicit chips for `Today`, `Tonight`, `Tomorrow`, `This weekend`, `Next week`, and `Any time`.
- Ensure API `resolveWhen` supports the same labels the UI exposes.

### 6. Search State Sync Is Incomplete

`SearchPillExpanded` initializes `query`, `selectedCats`, and `whenChip` from props, but does not sync them when URL search params change. The page-level `localQ` syncs, but the visible pill can fall out of sync after back/forward navigation or programmatic route changes.

Fix:

- Add effects to sync `initialQuery`, `initialCategories`, and `initialWhen` into component state when those props change.
- Preserve local edits only while the segment is actively focused.

### 7. Empty Search Should Be Useful

`/api/search` returns empty arrays when there is no query, category, or date. The UI then shows a generic empty state. For a discovery product, blank search should be an entry point.

Fix:

- Return modules for empty search: trending events, this weekend, people to follow, popular categories, and recent searches.
- Keep this separate from typed query results so ranking stays clear.

### 8. Ranking Is Too Basic For Event Discovery

Current event ranking uses RPC results plus a simple personal rerank based on tags, interests, and trending score. It does not appear to account for:

- Geographic proximity or neighborhood.
- Time intent such as tonight vs weekend.
- Ticket affordability.
- Social proof from friends/follows.
- Availability or sold-out state.
- Historical clicks, saves, carts, and purchases.
- Typo tolerance and synonyms.

Fix:

- Add a unified scoring function with named components.
- Start with transparent weights, log component scores, then tune from analytics.
- Use hybrid retrieval: Postgres full-text plus trigram similarity plus structured filters.
- Add synonyms for local event language: "detty", "linkup", "chill", "rooftop", "drinks", "networking", "paint and sip", "free", "date night".

## Recommended Product Model

Use two primary modes:

### Keyword Search

Route: `/search`

Purpose:

- Fast browsing.
- Filters and facets.
- Result comparison.
- Direct event/person/post navigation.

Required UI:

- Search box with typeahead.
- Tabs: All, Events, People, Posts.
- Filter chips: date, category, price, city/neighborhood, free, friends going.
- Recent and trending searches.
- No-result recovery: "Ask AI", "broaden date", "remove filters", "try category".

### AI Search

Route: `/ai`

Purpose:

- Natural language planning.
- Follow-up questions.
- Personal recommendations.
- Budget and social context.

Required UI:

- Search prompt handoff from `/search`.
- Persistent chat history.
- Event cards with reasons.
- Tool/status chips.
- Follow-up chips.
- "See all matching events" link back to `/search` with generated filters.

## Immediate Fix Plan

### Phase 1: Routing And Consolidation

1. Add `prompt` and `autosend` handling to `/ai`.
2. Change "AI Search", "Surprise me", and "Ask our personalized AI" actions to route to `/ai?prompt=...&autosend=1`.
3. Remove inline AI result handling from `MobileUnifiedSearch`.
4. Keep a small "Ask AI" CTA on `/search`, but make it a link to `/ai`.

### Phase 2: Correctness Bugs

1. Fix mobile typeahead to call `/api/search`.
2. Fix pagination cursor application.
3. Fix event fallback constraints and unsafe raw filter composition.
4. Sync search pill state from URL params.
5. Replace date range internals with full dates.

### Phase 3: Search Quality

1. Add typo tolerance with `pg_trgm`.
2. Add synonyms and normalized searchable text.
3. Add structured filters for price, city/neighborhood, availability, and friends going.
4. Return ranked result metadata internally for debugging.
5. Track analytics for query, filters, result impressions, clicks, saves, carts, and no-result queries.

### Phase 4: AI Search Quality

1. Make `/api/ai/ask` the only AI discovery endpoint.
2. Update tools to use the same search backend and filters as `/api/search`.
3. Let AI produce structured search links back to `/search`.
4. Add "why this matched" explanations to event cards.
5. Save AI prompts as recent searches or recent plans.

## Specific Code Changes To Make First

### A. Add AI Prompt Handoff

In `AIDashboardClient`:

- Import `useSearchParams`.
- Read `prompt` and `autosend`.
- Pass them to `AICoreChat`.
- After the first auto-send, clean the URL.

In `AICoreChat`:

- Add props:
  - `initialPrompt?: string`
  - `autoSendInitialPrompt?: boolean`
  - `onInitialPromptConsumed?: () => void`
- Use a ref guard so the prompt sends only once.
- If `autosend` is false, prefill the input instead.

### B. Replace AI Search Navigation

Use a helper:

```ts
function aiSearchHref(prompt: string) {
  const params = new URLSearchParams({
    prompt,
    autosend: "1",
  });
  return `/ai?${params.toString()}`;
}
```

Apply it to:

- `SearchPillExpanded.handleSurprise`
- `/search` AI banner button
- `MobileUnifiedSearch` AI icon and AI prompt chips
- Any "AI Search" copy in search surfaces

### C. Fix `/api/search` Cursor

Decode once:

```ts
const decodedCursor = cursor
  ? JSON.parse(Buffer.from(cursor, "base64").toString("utf8")) as { offset?: number }
  : null;
const offset = Math.max(0, decodedCursor?.offset ?? 0);
```

Then apply `.range(offset, offset + limit - 1)` in each query. The cursor must include enough state to avoid mismatched pagination: `q`, `type`, `when`, `categories`, and `offset`.

### D. Fix Mobile Suggestions

Replace the empty local demo `events` source with live `/api/search` suggestions. This should match desktop behavior so users do not get different search quality by device.

## Success Metrics

- [ ] AI search actions route to `/ai`, not inline search panels.
- [ ] `/api/ai/weekend` is no longer used by search UI.
- [ ] Mobile typeahead shows live event/user suggestions.
- [ ] `Load more` returns new results, not duplicates.
- [ ] No-result searches offer useful recovery paths.
- [ ] Search click-through rate improves.
- [ ] Search-to-save and search-to-ticket rates improve.
- [ ] AI chat prompt handoff creates a persistent conversation.

## Suggested Priority

Highest priority:

1. AI route handoff to `/ai`.
2. Mobile suggestions live data.
3. Pagination and fallback correctness.

Next:

1. Date picker rewrite.
2. Empty-state discovery modules.
3. Ranking improvements.

Later:

1. Full hybrid retrieval.
2. Search analytics tuning dashboard.
3. AI-generated filter links and plan saving.
