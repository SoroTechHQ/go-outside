import { NextRequest, NextResponse } from "next/server";
import { buildFoundingOrganizerEmailPreview } from "../../../../lib/email";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const firstName    = searchParams.get("firstName")    || "Kwame";
  const businessName = searchParams.get("businessName") || "Afro Night Events";
  const senderName   = searchParams.get("senderName")   || "Amoako";

  const html = buildFoundingOrganizerEmailPreview({
    firstName,
    businessName,
    senderName,
    token: "preview-00000000-0000-0000-0000-000000000000",
  });

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
