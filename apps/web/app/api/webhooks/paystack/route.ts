import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { supabaseAdmin } from "../../../../lib/supabase";

export const dynamic = "force-dynamic";

const SECRET = process.env.PAYSTACK_SECRET_KEY ?? "";

function verifySignature(payload: string, signature: string): boolean {
  const hash = createHmac("sha512", SECRET).update(payload).digest("hex");
  return hash === signature;
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-paystack-signature") ?? "";
  const body = await req.text();

  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event: string; data: { reference: string; status: string } };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event === "charge.success") {
    const { reference } = event.data;

    const { error } = await supabaseAdmin
      .from("tickets")
      .update({ status: "active" })
      .eq("payment_reference", reference)
      .eq("status", "pending");

    if (error) {
      console.error("[webhook/paystack] failed to confirm tickets:", error.message);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
