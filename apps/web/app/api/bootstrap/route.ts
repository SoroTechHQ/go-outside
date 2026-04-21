import { NextRequest } from "next/server";
import { jsonNoStore } from "../../../lib/api-security";
import { loadAppBootstrap } from "../../../lib/server/home-data";

export async function GET(request: NextRequest) {
  const cursor = request.nextUrl.searchParams.get("cursor");
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "8");

  const bootstrap = await loadAppBootstrap({
    notificationCursor: cursor,
    notificationLimit: Number.isFinite(limit) ? limit : 8,
  });

  return jsonNoStore(bootstrap);
}
