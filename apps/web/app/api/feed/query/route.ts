import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { normalizeFeedFilters, type FeedFilters } from "../../../../lib/app-contracts";
import { enforceRateLimit, getActorKey, jsonError, jsonNoStore } from "../../../../lib/api-security";
import { loadFeedPage } from "../../../../lib/server/home-data";

type FeedQueryBody = {
  filters?: Partial<FeedFilters>;
  page?: number;
  featuredOnly?: boolean;
  limit?: number;
};

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  const rateLimitResponse = enforceRateLimit({
    bucket: "feed-query",
    key: getActorKey(request, userId),
    limit: 90,
    windowMs: 60_000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  let body: FeedQueryBody;

  try {
    body = await request.json() as FeedQueryBody;
  } catch {
    return jsonError(400, "Invalid request");
  }

  const page = typeof body.page === "number" && Number.isFinite(body.page) && body.page >= 0
    ? Math.floor(body.page)
    : 0;
  const limit = typeof body.limit === "number" && Number.isFinite(body.limit) ? Math.floor(body.limit) : -1;

  const filters = normalizeFeedFilters({
    categories: Array.isArray(body.filters?.categories) ? body.filters.categories : [],
    query: typeof body.filters?.query === "string" ? body.filters.query : "",
    when: typeof body.filters?.when === "string" ? body.filters.when : "",
  });

  const feed = await loadFeedPage({
    clerkId: userId,
    filters,
    page,
    featuredOnly: body.featuredOnly === true,
    limit,
  });

  return jsonNoStore(feed);
}
