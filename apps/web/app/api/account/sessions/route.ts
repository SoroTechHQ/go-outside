import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

type ParsedUA = {
  device:  string;
  browser: string;
  os:      string;
};

function parseUserAgent(ua: string): ParsedUA {
  let browser = "Unknown browser";
  let os      = "Unknown OS";
  let device  = "Desktop";

  if (/mobile|android|iphone|ipad|ipod/i.test(ua)) device = "Mobile";
  else if (/tablet/i.test(ua))                       device = "Tablet";

  if (/CriOS/i.test(ua))          browser = "Chrome (iOS)";
  else if (/FxiOS/i.test(ua))     browser = "Firefox (iOS)";
  else if (/EdgA/i.test(ua))      browser = "Edge (Android)";
  else if (/OPR|Opera/i.test(ua)) browser = "Opera";
  else if (/Edg\//i.test(ua))     browser = "Edge";
  else if (/Chrome/i.test(ua))    browser = "Chrome";
  else if (/Safari/i.test(ua))    browser = "Safari";
  else if (/Firefox/i.test(ua))   browser = "Firefox";

  if (/Windows NT 10/i.test(ua))      os = "Windows 10";
  else if (/Windows NT/i.test(ua))    os = "Windows";
  else if (/Mac OS X/i.test(ua))      os = "macOS";
  else if (/Android (\d+)/i.test(ua)) os = `Android ${ua.match(/Android (\d+)/i)?.[1] ?? ""}`.trim();
  else if (/iPhone OS ([\d_]+)/i.test(ua)) {
    const v = ua.match(/iPhone OS ([\d_]+)/i)?.[1]?.replace(/_/g, ".") ?? "";
    os = `iOS ${v}`.trim();
  } else if (/iPad; CPU OS ([\d_]+)/i.test(ua)) {
    const v = ua.match(/iPad; CPU OS ([\d_]+)/i)?.[1]?.replace(/_/g, ".") ?? "";
    os = `iPadOS ${v}`.trim();
  } else if (/Linux/i.test(ua)) {
    os = "Linux";
  }

  return { device, browser, os };
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client   = await clerkClient();
    const sessions = await client.sessions.getSessionList({ userId, status: "active" });

    const result = sessions.data.map((s) => ({
      id:           s.id,
      status:       s.status,
      lastActiveAt: s.lastActiveAt,
      createdAt:    s.createdAt,
      latestActivity: s.latestActivity
        ? {
            deviceType:  (s.latestActivity as unknown as Record<string, unknown>).deviceType   ?? null,
            browserName: (s.latestActivity as unknown as Record<string, unknown>).browserName  ?? null,
            country:     (s.latestActivity as unknown as Record<string, unknown>).country      ?? null,
            city:        (s.latestActivity as unknown as Record<string, unknown>).city         ?? null,
            ipAddress:   (s.latestActivity as unknown as Record<string, unknown>).ipAddress    ?? null,
            isMobile:    (s.latestActivity as unknown as Record<string, unknown>).isMobile     ?? null,
          }
        : null,
    }));

    return NextResponse.json({ sessions: result });
  } catch (err) {
    console.error("[account/sessions GET]", err);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ua = req.headers.get("user-agent") ?? "";
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "—";

  const parsed = parseUserAgent(ua);

  return NextResponse.json({
    sessionId: null,
    device:    parsed.device,
    browser:   parsed.browser,
    os:        parsed.os,
    ip,
    userAgent: ua,
  });
}
