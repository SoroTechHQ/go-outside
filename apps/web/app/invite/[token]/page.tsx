import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabaseAdmin } from "../../../lib/supabase";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params;

  const { data: invite } = await supabaseAdmin
    .from("organizer_invites")
    .select("id, first_name, business_name, email_sent, clicked_at")
    .eq("token", token)
    .maybeSingle();

  if (!invite || !invite.email_sent) {
    notFound();
  }

  // Mark as clicked if first time
  if (!invite.clicked_at) {
    await supabaseAdmin
      .from("organizer_invites")
      .update({ clicked_at: new Date().toISOString() })
      .eq("token", token);
  }

  const firstName    = invite.first_name    ?? "there";
  const businessName = invite.business_name ?? "your business";

  const benefits = [
    {
      label: "Founding Organizer badge",
      body:  "Permanently displayed on your organizer profile. Exclusive to the first wave — no one joining after launch gets this.",
    },
    {
      label: "Free platform access during launch",
      body:  "No listing fees or platform cuts on your first events. You build your audience; we handle the tech.",
    },
    {
      label: "Priority feed placement",
      body:  "Your events surface first to Accra's most engaged audience before the platform opens widely.",
    },
    {
      label: "Organizer analytics — early access",
      body:  "Audience demographics, attendance patterns, and Pulse data from day one.",
    },
    {
      label: "Direct line to the team",
      body:  "Shape what we build. Your feedback during the founding period carries real weight.",
    },
  ];

  return (
    <main style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" }}
      className="min-h-screen bg-[#f4f4f4] py-12 px-4">

      <div className="max-w-[560px] mx-auto">

        {/* Wordmark */}
        <div className="mb-6">
          <Image src="/logo-full.png" alt="GoOutside" width={120} height={36} style={{ objectFit: "contain" }} />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#e8e8e8] p-8 mb-4">

          {/* Eyebrow */}
          <p className="text-[9px] font-black tracking-[0.2em] uppercase text-[#888888] mb-3">
            Founding Organizer Invitation
          </p>

          {/* Headline */}
          <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-[#111111] mb-4">
            Hi {firstName}, welcome to GoOutside.
          </h1>

          <p className="text-[14px] leading-relaxed text-[#444444] mb-4">
            You've been personally invited to join as a <strong>Founding Organizer</strong> —
            the first wave of event organizers on the platform.
          </p>

          {/* Business callout */}
          <div className="bg-[#edf7f0] border border-[#b8dfc5] rounded-2xl px-5 py-4 mb-6">
            <p className="text-[9px] font-black tracking-[0.2em] uppercase text-[#4a9f63] mb-1">Your organizer</p>
            <p className="text-[16px] font-extrabold text-[#111111]">{businessName}</p>
            <p className="text-[12px] text-[#2d6e45] mt-1 leading-relaxed">
              This invitation was sent specifically for your account. The link is personal to you.
            </p>
          </div>

          {/* Divider */}
          <hr className="border-[#e8e8e8] my-6" />

          <p className="text-[9px] font-black tracking-[0.2em] uppercase text-[#888888] mb-4">
            Your founding benefits
          </p>

          <ul className="space-y-0 divide-y divide-[#e8e8e8]">
            {benefits.map((b) => (
              <li key={b.label} className="py-4 flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-[#edf7f0] border border-[#b8dfc5] flex items-center justify-center flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5 3.5-4" stroke="#4a9f63" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#111111] mb-0.5">{b.label}</p>
                  <p className="text-[12px] text-[#888888] leading-relaxed">{b.body}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Divider */}
          <hr className="border-[#e8e8e8] my-6" />

          {/* CTA */}
          <Link
            href="/sign-up"
            className="block w-full text-center bg-[#4a9f63] text-white text-[14px] font-extrabold py-3.5 rounded-full hover:bg-[#3d8c55] transition-colors"
          >
            Create your organizer account
          </Link>

          <p className="text-[12px] text-[#888888] text-center mt-3 leading-relaxed">
            Takes about 5 minutes. Once you sign up, we'll set up your organizer profile and you're ready to create your first event.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-[11px] text-[#aaaaaa] leading-relaxed">
            GoOutside &nbsp;·&nbsp; Accra, Ghana<br />
            Questions? Reply to your invitation email — it goes straight to us.
          </p>
        </div>
      </div>
    </main>
  );
}
