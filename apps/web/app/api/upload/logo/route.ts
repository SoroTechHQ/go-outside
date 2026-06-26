import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";

const LOGO_BUCKET = "logos";

async function ensureLogoBucket() {
  const { data } = await supabaseAdmin.storage.getBucket(LOGO_BUCKET);
  if (data) return;
  const { error } = await supabaseAdmin.storage.createBucket(LOGO_BUCKET, { public: true });
  if (error && !error.message.toLowerCase().includes("already exists")) throw error;
}

export async function POST(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = file.name.split(".").pop() ?? "webp";
  const path = `${clerk.id}/${Date.now()}.${ext}`;

  try {
    await ensureLogoBucket();
  } catch (err) {
    console.error("[POST /api/upload/logo] bucket setup failed", err);
    return NextResponse.json({ error: "Logo storage is not configured" }, { status: 500 });
  }

  const { error } = await supabaseAdmin.storage
    .from(LOGO_BUCKET)
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type || "image/webp",
      upsert: true,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabaseAdmin.storage.from(LOGO_BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
