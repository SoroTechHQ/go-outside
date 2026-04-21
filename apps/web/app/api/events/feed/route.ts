import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { normalizeFeedFilters } from "../../../../lib/app-contracts";
import { jsonNoStore } from "../../../../lib/api-security";
import { loadFeedPage } from "../../../../lib/server/home-data";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  const { searchParams } = new URL(request.url);

  const page = Number.parseInt(searchParams.get("page") ?? "0", 10);
  const featuredOnly = searchParams.get("featured") === "true";
  const limit = Number.parseInt(searchParams.get("limit") ?? "-1", 10);

  const feed = await loadFeedPage({
    clerkId: userId,
    filters: normalizeFeedFilters({
      categories: searchParams.get("category")?.split(",").filter(Boolean) ?? [],
      query: searchParams.get("q") ?? "",
      when: searchParams.get("when") ?? "",
    }),
    featuredOnly,
    limit,
    page: Number.isFinite(page) && page >= 0 ? page : 0,
  });

  return jsonNoStore(feed);
}
