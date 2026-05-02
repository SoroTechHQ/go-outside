import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export async function POST(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = file.name.split(".").pop() ?? "webp";
  const path = `${clerk.id}/${Date.now()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from("organizer-logos")
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type || "image/webp",
      upsert: true,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabaseAdmin.storage.from("organizer-logos").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
