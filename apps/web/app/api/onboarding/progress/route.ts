import { NextRequest, NextResponse } from "next/server";
import { clerkClient, currentUser } from "@clerk/nextjs/server";

type ProgressBody = {
  firstName?: string;
  lastName?: string;
  unsafeMetadata?: Record<string, unknown>;
};

export async function POST(req: NextRequest) {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as ProgressBody | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const nextUnsafeMetadata = body.unsafeMetadata;
  const hasNameUpdate = typeof body.firstName === "string" || typeof body.lastName === "string";
  const hasMetadataUpdate = !!nextUnsafeMetadata && Object.keys(nextUnsafeMetadata).length > 0;

  if (!hasNameUpdate && !hasMetadataUpdate) {
    return NextResponse.json({ error: "No onboarding updates provided" }, { status: 400 });
  }

  try {
    const client = await clerkClient();

    if (hasNameUpdate) {
      await client.users.updateUser(clerkUser.id, {
        firstName: body.firstName ?? clerkUser.firstName ?? undefined,
        lastName:  body.lastName ?? clerkUser.lastName ?? undefined,
      });
    }

    if (hasMetadataUpdate) {
      await client.users.updateUserMetadata(clerkUser.id, {
        unsafeMetadata: {
          ...(clerkUser.unsafeMetadata ?? {}),
          ...nextUnsafeMetadata,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[POST /api/onboarding/progress]", error);
    return NextResponse.json(
      { error: "Failed to update onboarding progress" },
      { status: 500 }
    );
  }
}
