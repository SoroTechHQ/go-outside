import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — GoOutside",
  description: "The terms and conditions governing your use of GoOutside. Operated by Soro Technologies, governed by the laws of Ghana.",
};

const LAST_UPDATED = "June 12, 2026";
const VERSION = "1.0";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="mb-4 text-[22px] font-bold text-[#0f110f]">{title}</h2>
      <div className="space-y-4 text-[15px] leading-[1.75] text-[#374151]">{children}</div>
    </section>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-black/[0.08]">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-black/[0.06] bg-[#f9fafb]">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-[#6b7280]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i < rows.length - 1 ? "border-b border-black/[0.04]" : ""}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 align-top text-[13px] text-[#374151]">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#c8e8ce] bg-[#f0f9f2] p-4 text-[14px] leading-relaxed text-[#1a4a24]">
      {children}
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#fde68a] bg-[#fffbeb] p-4 text-[14px] leading-relaxed text-[#92400e]">
      {children}
    </div>
  );
}

const TOC = [
  { id: "acceptance", label: "1. Acceptance of Terms" },
  { id: "what-gooutside-is", label: "2. What GoOutside Is" },
  { id: "account", label: "3. Account Registration" },
  { id: "conduct", label: "4. User Conduct" },
  { id: "content", label: "5. User-Generated Content" },
  { id: "tickets", label: "6. Ticket Purchases and Payments" },
  { id: "organizers", label: "7. Event Organizers" },
  { id: "pulse", label: "8. Pulse Points and Rewards" },
  { id: "ai", label: "9. AI Features" },
  { id: "ip", label: "10. Intellectual Property" },
  { id: "third-party", label: "11. Third-Party Services" },
  { id: "privacy", label: "12. Privacy" },
  { id: "liability", label: "13. Disclaimers & Liability" },
  { id: "indemnification", label: "14. Indemnification" },
  { id: "governing-law", label: "15. Governing Law" },
  { id: "termination", label: "16. Termination" },
  { id: "changes", label: "17. Changes to Terms" },
  { id: "contact", label: "18. Contact Us" },
];

export default function TermsOfServicePage() {
  return (
    <>
      {/* Header */}
      <div className="mb-10">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#c8e8ce] bg-[#f0f9f2] px-3 py-1.5 text-[12px] font-semibold text-[#2f8f45]">
          Legal Document
        </div>
        <h1 className="mb-2 text-[36px] font-bold leading-tight tracking-tight text-[#0f110f] md:text-[44px]">
          Terms of Service
        </h1>
        <p className="text-[14px] text-[#6b7280]">
          Last updated: {LAST_UPDATED} · Version {VERSION} · Estimated reading time: 10 minutes
        </p>
      </div>

      {/* At a glance */}
      <Highlight>
        <p className="mb-2 font-bold text-[#1a4a24]">At a glance</p>
        <ul className="space-y-1 text-[14px]">
          <li>• GoOutside is a technology platform — we do not organise events or guarantee their quality</li>
          <li>• You must be 18 or older to use the platform</li>
          <li>• GoOutside charges a 5% platform fee on paid ticket sales</li>
          <li>• Pulse Points are not money and have no cash value</li>
          <li>• Governing law: Republic of Ghana</li>
        </ul>
      </Highlight>

      {/* TOC */}
      <nav className="my-8 rounded-xl border border-black/[0.08] bg-[#f9fafb] p-5">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#6b7280]">Table of Contents</p>
        <ol className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {TOC.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className="text-[13px] text-[#2f8f45] transition hover:underline">
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-12">

        <Section id="acceptance" title="1. Acceptance of Terms">
          <p>By creating a GoOutside account or using any GoOutside service, you agree to these Terms of Service and our <Link href="/privacy" className="text-[#2f8f45] underline">Privacy Policy</Link>. If you do not agree, you may not use GoOutside.</p>
          <p>These Terms form a legally binding contract between you and <strong>Soro Technologies</strong> ("GoOutside", "we", "us", "our"), a company incorporated in Ghana. If you are using GoOutside on behalf of a business or organisation, you represent that you have authority to bind that entity to these Terms.</p>
          <Warning>
            GoOutside is not available to minors. By using GoOutside, you confirm you are at least <strong>18 years old</strong>.
          </Warning>
        </Section>

        <Section id="what-gooutside-is" title="2. What GoOutside Is">
          <p>GoOutside is a social event discovery platform for Ghana. It enables you to discover and attend events, purchase tickets via Paystack, follow organisers and users, earn and redeem Pulse Points, send direct messages, post reviews and content, and — if you are an organiser — create events and view analytics.</p>
          <Warning>
            <strong>GoOutside is not an event organiser.</strong> We are a technology platform that facilitates connections between event organisers and attendees. We are not responsible for the quality, safety, accuracy, legality, or cancellation of any event listed on the platform.
          </Warning>
        </Section>

        <Section id="account" title="3. Account Registration">
          <p>You may sign up using Google OAuth or with an email and password. You agree to: provide accurate and complete information, keep your account information current, maintain the confidentiality of your password, not share your account with others, and notify us immediately if you suspect unauthorised access at <a href="mailto:privacy@gooutside.app" className="text-[#2f8f45] underline">privacy@gooutside.app</a>.</p>
          <p><strong>One account per person.</strong> Operating multiple accounts may result in the additional accounts being merged or terminated.</p>
          <p><strong>Account security.</strong> You are responsible for all activity that occurs under your account. GoOutside is not liable for losses caused by unauthorised use of your account resulting from your failure to secure your credentials.</p>
        </Section>

        <Section id="conduct" title="4. User Conduct">
          <p>By using GoOutside, you agree not to:</p>
          <Table
            headers={["Category", "Prohibited Actions"]}
            rows={[
              ["Content", "Post false, misleading, defamatory, obscene, harassing, or harmful content; post content that infringes third-party intellectual property rights; post content promoting violence or hate based on protected characteristics; spam"],
              ["Account", "Impersonate another person or organisation; collect user data without authorisation; create fraudulent event listings to collect payments"],
              ["Technical", "Attempt to hack or disrupt GoOutside's systems; use automated bots or scrapers without written consent; attempt to reverse engineer GoOutside's algorithms; interfere with other users' access"],
              ["Tickets", "Purchase tickets for scalping without organiser consent; counterfeit or alter QR code tickets; use another person's ticket for entry"],
            ]}
          />
          <p className="text-[14px] text-[#6b7280]">We reserve the right to remove content and suspend or terminate accounts that violate these rules, without advance notice.</p>
        </Section>

        <Section id="content" title="5. User-Generated Content">
          <p><strong>You own the content you post on GoOutside.</strong> You are responsible for ensuring your content complies with applicable Ghanaian law and these Terms.</p>
          <p><strong>License to GoOutside:</strong> By posting content, you grant Soro Technologies a non-exclusive, royalty-free, worldwide license to display, store, and format your content for GoOutside's purposes. This license ends when you delete the content or your account, subject to backup retention periods.</p>
          <p><strong>We may remove any content</strong> that violates these Terms, our community standards, or Ghanaian law, without advance notice. The presence of content on GoOutside does not constitute our endorsement of it.</p>
        </Section>

        <Section id="tickets" title="6. Ticket Purchases and Payments">
          <Table
            headers={["Topic", "Detail"]}
            rows={[
              ["How it works", "Select ticket type and quantity → Pay via Paystack (card, mobile money, bank) → QR-coded ticket generated at Dashboard → Tickets → Present QR at the event"],
              ["Platform fee", "5% on all paid ticket sales — included in the displayed price, no hidden fees. Free events: no fee."],
              ["Payment processing", "Paystack (PCI-DSS compliant). We do not store your card details."],
              ["Ticket delivery", "Digital, within the app. If delivery fails after successful payment, contact support@gooutside.app for manual issue within 24 hours."],
              ["GoOutside platform fee", "Non-refundable"],
              ["Event refunds", "At organiser's discretion — check the event page. GoOutside facilitates refunds if the organiser approves."],
              ["Event cancellation by organiser", "Full refund of ticket price (excluding Paystack fees) within 10 business days"],
              ["Fraudulent events", "Full immediate refund + organiser reported to authorities"],
            ]}
          />
        </Section>

        <Section id="organizers" title="7. Event Organizers">
          <p>Any GoOutside user can access the organiser dashboard. By creating an event listing, you agree to this section.</p>

          <p><strong>Event listing requirements:</strong> Your listing must accurately describe the event, use images you have rights to, not deceive attendees, and comply with all applicable Ghanaian laws (entertainment regulations, venue permits, health and safety).</p>

          <p><strong>Payouts:</strong> Proceeds minus GoOutside's 5% fee and Paystack's transaction fee go to your Paystack subaccount. You are responsible for KYC verification and paying all applicable taxes on event revenue including VAT and income tax.</p>

          <p><strong>Attendee data:</strong> You receive attendees' names, emails, and ticket details. You must use this data only for legitimate event management purposes, not sell or share it with third parties, comply with Ghana's Data Protection Act 2012, and maintain your own attendee privacy notice.</p>

          <p><strong>Cancellations:</strong> If you cancel an event, notify GoOutside immediately at <a href="mailto:support@gooutside.app" className="text-[#2f8f45] underline">support@gooutside.app</a>, communicate to all ticket purchasers, and cooperate to process refunds within 10 business days. Repeated cancellations or refund failures may result in account suspension.</p>

          <Warning>
            <strong>Prohibited events:</strong> You may not list events that are illegal under Ghanaian law, promote violence or illegal substances, constitute fraud, or are not real events intended to collect payments.
          </Warning>
        </Section>

        <Section id="pulse" title="8. Pulse Points and Rewards">
          <Table
            headers={["Topic", "Detail"]}
            rows={[
              ["What they are", "A digital rewards currency representing engagement. Not money. Not a financial instrument."],
              ["Earning", "Buying tickets (+25 PP), check-ins (+50 PP), posts (+10 PP), saving events (+5 PP), referrals (+100 PP), milestone bonuses, and monthly streaks"],
              ["Redemption", "Redeemed in the Rewards shop (Dashboard → Rewards). Coupon codes valid for 90 days — not extendable."],
              ["Cannot be", "Sold, transferred to another account, combined with another user's balance, or redeemed for cash — ever"],
              ["Forfeited on", "Account deletion. Spendable balance may be reset after 12 months of account inactivity (lifetime total preserved for tier purposes)."],
              ["Modification", "GoOutside may modify the program with 30 days' notice. Discontinuation: 60 days' notice with a redemption window."],
              ["Founding Explorer", "First 1,000 users to complete onboarding receive 2× multiplier for 90 days. Non-transferable. Non-reinstatable."],
            ]}
          />
        </Section>

        <Section id="ai" title="9. AI Features">
          <p>GoOutside offers AI Chat, Weekend Assistant, and "Why This?" features powered by Groq's AI infrastructure. Your queries and profile context are sent to Groq's US servers for processing — see our <Link href="/privacy" className="text-[#2f8f45] underline">Privacy Policy Section 3.11</Link> for full details.</p>
          <p><strong>No guarantee of accuracy.</strong> AI responses are for discovery purposes only and may contain inaccuracies. Always verify event details on the event detail page.</p>
          <p><strong>Responsible use.</strong> You agree not to use AI features to generate harmful, illegal, or misleading content, or to attempt to extract other users' information through AI queries.</p>
        </Section>

        <Section id="ip" title="10. Intellectual Property">
          <p><strong>GoOutside's IP:</strong> The GoOutside brand, logo, platform software, UI design, and all proprietary technology (Pulse Score algorithm, recommendation engine, all associated software) are owned by Soro Technologies or its licensors. You may not copy, reproduce, or create derivative works from GoOutside's technology or brand assets without written permission.</p>
          <p><strong>Your IP:</strong> You retain ownership of all original content you create. See Section 5 for the limited license you grant us.</p>
          <p><strong>Copyright claims:</strong> Email <a href="mailto:legal@gooutside.app" className="text-[#2f8f45] underline">legal@gooutside.app</a> with: description of the copyrighted work, URL of the alleged infringing content, your contact information, and a good-faith statement.</p>
        </Section>

        <Section id="third-party" title="11. Third-Party Services and Links">
          <p>GoOutside integrates with Paystack, Clerk, Stream Chat, Groq, and Google Maps. Your use of these services is governed by their own terms and privacy policies. GoOutside is not responsible for the practices of third-party services.</p>
          <p>GoOutside may contain links to external websites. We do not endorse and are not responsible for linked external sites.</p>
        </Section>

        <Section id="privacy" title="12. Privacy">
          <p>Our <Link href="/privacy" className="text-[#2f8f45] underline">Privacy Policy</Link> governs our collection, use, and sharing of your personal data and is incorporated into these Terms by reference.</p>
        </Section>

        <Section id="liability" title="13. Disclaimers and Limitation of Liability">
          <Warning>
            <strong>GoOutside is a technology platform.</strong> We do not organise events, employ event staff, or guarantee the quality, safety, accuracy, or legality of any event on our platform. <strong>You attend events at your own risk.</strong> GoOutside is not liable for any injury, loss, or damage arising from attendance at any event discovered through the platform.
          </Warning>
          <p>We provide GoOutside on an "as is" and "as available" basis with no warranty that the platform will be available, error-free, or that event information is accurate.</p>
          <p><strong>Limitation of liability:</strong> To the maximum extent permitted by Ghanaian law, Soro Technologies' total liability for any claim shall not exceed the greater of: (a) total platform fees you paid in the 12 months preceding the claim, or (b) GHS 500.</p>
          <p>We are not liable for indirect, incidental, punitive, or consequential damages including loss of profits, data, business opportunity, or goodwill.</p>
          <p className="text-[13px] text-[#6b7280]">Nothing in this section limits our liability for death or personal injury caused by our negligence, fraud, or any liability that cannot be excluded under Ghanaian law.</p>
        </Section>

        <Section id="indemnification" title="14. Indemnification">
          <p>You agree to indemnify, defend, and hold harmless Soro Technologies and its employees, directors, officers, and agents from claims, liabilities, damages, and expenses (including reasonable legal fees) arising from: your use of GoOutside in violation of these Terms, content you post, your violation of applicable law, your violation of third-party rights, or any event you organise through the platform.</p>
        </Section>

        <Section id="governing-law" title="15. Governing Law and Dispute Resolution">
          <p>These Terms are governed by the laws of the <strong>Republic of Ghana</strong>.</p>
          <p><strong>Informal resolution:</strong> Before filing any formal legal claim, contact GoOutside at <a href="mailto:legal@gooutside.app" className="text-[#2f8f45] underline">legal@gooutside.app</a> and attempt to resolve the dispute informally for 30 days.</p>
          <p><strong>Formal disputes:</strong> Subject to the exclusive jurisdiction of the courts of Ghana.</p>
          <p className="text-[14px] text-[#6b7280]">Nothing in these Terms affects your statutory rights as a consumer under Ghanaian consumer protection law.</p>
        </Section>

        <Section id="termination" title="16. Termination">
          <p><strong>By you:</strong> Delete your account at Dashboard → Profile → Settings → Delete Account at any time. Deletion terminates your access immediately.</p>
          <p><strong>By GoOutside:</strong> We may suspend or terminate your account, with or without notice, if you breach these Terms, use GoOutside for fraudulent or illegal activity, or where required by law.</p>
          <p><strong>Effect:</strong> Access ceases immediately. Unredeemed Pulse Points are forfeited. Sections 5, 10, 13, 14, and 15 survive termination.</p>
        </Section>

        <Section id="changes" title="17. Changes to These Terms">
          <p>When we make material changes, we will: (1) post updated Terms at gooutside.club/terms, (2) update the "Last updated" date, and (3) send email notification at least <strong>14 days before</strong> changes take effect. Your continued use after the effective date constitutes acceptance.</p>
        </Section>

        <Section id="contact" title="18. Contact Us">
          <Table
            headers={["Type", "Contact"]}
            rows={[
              ["General legal queries", <a href="mailto:legal@gooutside.app" className="text-[#2f8f45] underline">legal@gooutside.app</a>],
              ["Payment and ticket support", <a href="mailto:support@gooutside.app" className="text-[#2f8f45] underline">support@gooutside.app</a>],
              ["Privacy and data", <a href="mailto:privacy@gooutside.app" className="text-[#2f8f45] underline">privacy@gooutside.app</a>],
              ["Copyright claims", <a href="mailto:legal@gooutside.app" className="text-[#2f8f45] underline">legal@gooutside.app</a>],
              ["Mailing address", "Soro Technologies, Accra, Ghana"],
            ]}
          />
        </Section>

      </div>

      {/* Footer note */}
      <div className="mt-12 border-t border-black/[0.06] pt-8 text-center text-[12px] text-[#a9a9a9]">
        <p>GoOutside Terms of Service — Version {VERSION} · {LAST_UPDATED}</p>
        <p className="mt-1">© 2026 Soro Technologies · Built in Accra, Ghana</p>
        <div className="mt-4 flex items-center justify-center gap-4">
          <Link href="/privacy" className="text-[#2f8f45] transition hover:underline">Privacy Policy</Link>
          <Link href="/cookies" className="text-[#2f8f45] transition hover:underline">Cookie Policy</Link>
        </div>
      </div>
    </>
  );
}
