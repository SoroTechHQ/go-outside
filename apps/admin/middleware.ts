import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/unauthorized"]);

type AdminUserRow = {
  id: string;
  clerk_id: string | null;
  email: string | null;
  role: string | null;
};

function getClaimEmail(sessionClaims: unknown) {
  if (!sessionClaims || typeof sessionClaims !== "object") return null;

  const claims = sessionClaims as Record<string, unknown>;
  if (typeof claims.email === "string") return claims.email;

  const primaryEmail = claims.primary_email_address;
  if (primaryEmail && typeof primaryEmail === "object") {
    const emailAddress = (primaryEmail as Record<string, unknown>).email_address;
    if (typeof emailAddress === "string") return emailAddress;
  }

  return null;
}

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  const { userId, sessionClaims } = await auth();
  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Check admin role via Supabase REST (works in Edge runtime)
  try {
    const email = getClaimEmail(sessionClaims);
    const params = new URLSearchParams({
      select: "id,clerk_id,email,role",
      limit: "2",
    });

    if (email) {
      params.set("or", `(clerk_id.eq.${userId},email.eq.${email})`);
    } else {
      params.set("clerk_id", `eq.${userId}`);
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users?${params.toString()}`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`,
        },
        cache: "no-store",
      },
    );
    if (res.ok) {
      const rows = await res.json() as AdminUserRow[];
      const matchingUser = rows.find((row) => row.clerk_id === userId)
        ?? rows.find((row) => email && row.email?.toLowerCase() === email.toLowerCase());

      if (matchingUser?.role !== "admin") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }

      if (matchingUser.clerk_id !== userId) {
        await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users?id=eq.${matchingUser.id}`,
          {
            method: "PATCH",
            headers: {
              apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify({
              clerk_id: userId,
              updated_at: new Date().toISOString(),
            }),
            cache: "no-store",
          },
        );
      }
    }
  } catch {
    // If the check fails, allow through to avoid locking out on transient errors
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
