import { NextResponse } from "next/server";
import { getPublishedEvents } from "../../../../lib/db/events";
import type { EventItem } from "@gooutside/demo-data";

const INITIAL_COUNT = 6;
const PAGE_SIZE = 4;

type Filters = { categories: string[]; query: string; when: string };

function applyFilters(source: EventItem[], { categories, query, when }: Filters) {
  return source.filter((e) => {
    if (categories.length > 0 && !categories.includes(e.categorySlug)) return false;
    if (query) {
      const haystack = `${e.title} ${e.venue} ${e.city} ${e.shortDescription ?? ""}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (when) {
      const haystack = `${e.dateLabel} ${e.eyebrow}`.toLowerCase();
      if (!haystack.includes(when)) return false;
    }
    return true;
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "0", 10);
  const categories = searchParams.get("category")?.split(",").filter(Boolean) ?? [];
  const query = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const when = searchParams.get("when")?.trim().toLowerCase() ?? "";

  try {
    const allEvents = await getPublishedEvents();
    const filtered = applyFilters(allEvents, { categories, query, when });
    const source = filtered.length > 0 ? filtered : (categories.length > 0 || query || when ? [] : allEvents);

    const limit = page === 0 ? INITIAL_COUNT : PAGE_SIZE;
    const startIdx = page === 0 ? 0 : INITIAL_COUNT + (page - 1) * PAGE_SIZE;
    const hasMore = source.length > startIdx + limit;

    const items = source.slice(startIdx, startIdx + limit).map((event, i) => ({
      ...event,
      _feedIndex: startIdx + i,
      _feedKey: `${event.id}-${startIdx + i}`,
    }));

    return NextResponse.json({ items, nextPage: page + 1, hasMore, total: source.length });
  } catch (err) {
    console.error("[/api/events/feed]", err);
    return NextResponse.json({ items: [], nextPage: 1, hasMore: false, total: 0 }, { status: 500 });
  }
}
