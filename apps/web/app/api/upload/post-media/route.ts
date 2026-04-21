import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export async function POST(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be under 8MB" }, { status: 400 });
  }

  const ext  = file.name.split(".").pop() ?? "jpg";
  const path = `${clerk.id}/${Date.now()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from("post-media")
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabaseAdmin.storage.from("post-media").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
