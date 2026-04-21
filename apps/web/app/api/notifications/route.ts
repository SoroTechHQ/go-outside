import { NextRequest } from "next/server";
import { jsonNoStore } from "../../../lib/api-security";
import { loadAppBootstrap } from "../../../lib/server/home-data";

export async function GET(req: NextRequest) {
  const cursor = req.nextUrl.searchParams.get("cursor");
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "20");
  const bootstrap = await loadAppBootstrap({
    notificationCursor: cursor,
    notificationLimit: Number.isFinite(limit) ? limit : 20,
  });

  return jsonNoStore(bootstrap.notifications);
}
