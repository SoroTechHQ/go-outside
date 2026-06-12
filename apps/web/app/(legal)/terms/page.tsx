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
  { id: "eligibility", label: "2. Eligibility" },
  { id: "what-gooutside-is", label: "3. What GoOutside Is" },
  { id: "account", label: "4. Account Registration" },
  { id: "conduct", label: "5. User Conduct" },
  { id: "content", label: "6. User-Generated Content" },
  { id: "public-content", label: "7. Public Content" },
  { id: "messages", label: "8. Messaging and Social Features" },
  { id: "tickets", label: "9. Ticket Purchases and Payments" },
  { id: "refunds", label: "10. Refunds and Cancellations" },
  { id: "organizers", label: "11. Event Organizers" },
  { id: "event-safety", label: "12. Event Safety" },
  { id: "pulse", label: "13. Pulse Points and Rewards" },
  { id: "ai", label: "14. AI Features" },
  { id: "enforcement", label: "15. Enforcement" },
  { id: "ip", label: "16. Intellectual Property" },
  { id: "third-party", label: "17. Third-Party Services" },
  { id: "privacy", label: "18. Privacy" },
  { id: "availability", label: "19. Availability and Changes" },
  { id: "liability", label: "20. Disclaimers & Liability" },
  { id: "indemnification", label: "21. Indemnification" },
  { id: "governing-law", label: "22. Governing Law" },
  { id: "termination", label: "23. Termination" },
  { id: "changes", label: "24. Changes to Terms" },
  { id: "contact", label: "25. Contact Us" },
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

        <Section id="eligibility" title="2. Eligibility">
          <p>You may use GoOutside only if you can form a legally binding agreement with Soro Technologies and are not prohibited from using the service under applicable law.</p>
          <Table
            headers={["Requirement", "Meaning"]}
            rows={[
              ["Age", "You must be at least 18 years old."],
              ["Authority", "If you act for an organiser, venue, brand, or company, you must be authorised to do so."],
              ["Accuracy", "The information you provide must be true, current, and complete."],
              ["Compliance", "You must comply with Ghanaian law and any local laws that apply to you or your event."],
              ["Prior bans", "You may not create a new account if GoOutside previously suspended or terminated you unless we give written permission."],
            ]}
          />
        </Section>

        <Section id="what-gooutside-is" title="3. What GoOutside Is">
          <p>GoOutside is a social event discovery platform for Ghana. It enables you to discover and attend events, purchase tickets via Paystack, follow organisers and users, earn and redeem Pulse Points, send direct messages, post reviews and content, and — if you are an organiser — create events and view analytics.</p>
          <Warning>
            <strong>GoOutside is not an event organiser.</strong> We are a technology platform that facilitates connections between event organisers and attendees. We are not responsible for the quality, safety, accuracy, legality, or cancellation of any event listed on the platform.
          </Warning>
        </Section>

        <Section id="account" title="4. Account Registration">
          <p>You may sign up using Google OAuth or with an email and password. You agree to: provide accurate and complete information, keep your account information current, maintain the confidentiality of your password, not share your account with others, and notify us immediately if you suspect unauthorised access at <a href="mailto:privacy@gooutside.club" className="text-[#2f8f45] underline">privacy@gooutside.club</a>.</p>
          <p><strong>One account per person.</strong> Operating multiple accounts may result in the additional accounts being merged or terminated.</p>
          <p><strong>Account security.</strong> You are responsible for all activity that occurs under your account. GoOutside is not liable for losses caused by unauthorised use of your account resulting from your failure to secure your credentials.</p>
          <p>You may not transfer, sell, rent, or share your account. If we believe an account is compromised, automated, fraudulent, or used by more than one person, we may require verification, restrict features, or suspend the account.</p>
        </Section>

        <Section id="conduct" title="5. User Conduct">
          <p>By using GoOutside, you agree not to:</p>
          <Table
            headers={["Category", "Prohibited Actions"]}
            rows={[
              ["Content", "Post false, misleading, defamatory, obscene, harassing, or harmful content; post content that infringes third-party intellectual property rights; post content promoting violence or hate based on protected characteristics; spam"],
              ["Account", "Impersonate another person or organisation; collect user data without authorisation; create fraudulent event listings to collect payments"],
              ["Technical", "Attempt to hack or disrupt GoOutside systems; use automated bots or scrapers without written consent; attempt to reverse engineer GoOutside algorithms; interfere with other users access"],
              ["Tickets", "Purchase tickets for scalping without organiser consent; counterfeit or alter QR code tickets; use another person's ticket for entry"],
              ["Safety", "Use GoOutside to threaten, stalk, exploit, sexually harass, dox, blackmail, or coordinate violence against another person"],
              ["Commercial abuse", "Send unsolicited promotions, pyramid schemes, fake giveaways, fake job offers, phishing links, or malware"],
            ]}
          />
          <p className="text-[14px] text-[#6b7280]">We reserve the right to remove content and suspend or terminate accounts that violate these rules, without advance notice.</p>
        </Section>

        <Section id="content" title="6. User-Generated Content">
          <p><strong>You own the content you post on GoOutside.</strong> You are responsible for ensuring your content complies with applicable Ghanaian law and these Terms.</p>
          <p><strong>License to GoOutside:</strong> By posting content, you grant Soro Technologies a non-exclusive, royalty-free, worldwide license to display, store, and format your content for GoOutside purposes. This license ends when you delete the content or your account, subject to backup retention periods.</p>
          <p><strong>We may remove any content</strong> that violates these Terms, our community standards, or Ghanaian law, without advance notice. The presence of content on GoOutside does not constitute our endorsement of it.</p>
          <p>You represent that you have all permissions needed to post your content, including permissions from people shown in photos or videos where required. You also agree not to post private information about another person without their permission.</p>
        </Section>

        <Section id="public-content" title="7. Public Content and Visibility">
          <p>Some areas of GoOutside are public or social by design. Your name, username, avatar, bio, city, Pulse tier, posts, reviews, event snippets, followers, following, and some event activity may be visible to other users.</p>
          <Warning>
            If you post public content, other people may copy, screenshot, quote, link to, or share it outside GoOutside. We can remove content from GoOutside, but we cannot control copies that already exist elsewhere.
          </Warning>
          <p>Do not post information you are not comfortable making public. This includes private addresses, financial information, identification numbers, sensitive personal details, or confidential business information.</p>
        </Section>

        <Section id="messages" title="8. Messaging and Social Features">
          <p>GoOutside includes direct messages, follows, message requests, notifications, public profiles, and social signals such as followers attending or saving events.</p>
          <Table
            headers={["Feature", "Rules"]}
            rows={[
              ["Direct messages", "Do not harass, threaten, spam, impersonate, solicit illegally, send malware, or pressure people into unsafe situations."],
              ["Message requests", "Recipients may accept, decline, block, or report message requests."],
              ["Follows", "Following someone does not create permission to scrape, contact, or target them outside the intended GoOutside features."],
              ["Notifications", "Some notifications are transactional and required, such as receipts, ticket updates, security notices, and legal notices."],
              ["Blocking", "Do not attempt to evade a user's block through another account."],
            ]}
          />
          <p>Messages are private to conversation participants, but they are not end-to-end encrypted. GoOutside may review, preserve, or disclose message-related information where needed for safety, abuse prevention, support, or legal compliance.</p>
        </Section>

        <Section id="tickets" title="9. Ticket Purchases and Payments">
          <Table
            headers={["Topic", "Detail"]}
            rows={[
              ["How it works", "Select ticket type and quantity → Pay via Paystack (card, mobile money, bank) → QR-coded ticket generated at Dashboard → Tickets → Present QR at the event"],
              ["Platform fee", "5% on all paid ticket sales — included in the displayed price, no hidden fees. Free events: no fee."],
              ["Payment processing", "Paystack (PCI-DSS compliant). We do not store your card details."],
              ["Ticket delivery", "Digital, within the app. If delivery fails after successful payment, contact support@gooutside.club for manual issue within 24 hours."],
              ["GoOutside platform fee", "Non-refundable"],
              ["Event refunds", "At organiser discretion — check the event page. GoOutside facilitates refunds if the organiser approves."],
              ["Event cancellation by organiser", "Full refund of ticket price (excluding Paystack fees) within 10 business days"],
              ["Fraudulent events", "Full immediate refund + organiser reported to authorities"],
            ]}
          />
          <p>All prices are shown in Ghanaian cedis unless stated otherwise. Payment authorization does not guarantee event entry if the ticket is later voided for fraud, chargeback, breach of these Terms, or duplicate use.</p>
          <p>You are responsible for checking the event date, time, venue, age restriction, dress code, entry policy, and refund policy before purchase.</p>
        </Section>

        <Section id="refunds" title="10. Refunds, Cancellations, and Chargebacks">
          <p>Refund rights depend on the event, the organiser stated policy, payment processor rules, and applicable law. GoOutside may help process refunds, but the organiser is primarily responsible for event performance and event-specific refund decisions unless fraud or platform error is involved.</p>
          <Table
            headers={["Scenario", "General Rule"]}
            rows={[
              ["Organizer cancels event", "Ticket price should be refunded, excluding fees that cannot be recovered from payment processors where lawful."],
              ["Organizer changes venue, date, or headline act materially", "GoOutside may require the organiser to offer refund options."],
              ["You cannot attend", "Refund depends on the organiser policy."],
              ["Duplicate charge", "Contact support; verified duplicate charges will be reversed where possible."],
              ["Fraudulent listing", "GoOutside may cancel tickets, refund affected users, suspend the organiser, and preserve records for legal action."],
              ["Chargeback abuse", "Fraudulent or abusive chargebacks may result in account restrictions and cancellation of related tickets."],
            ]}
          />
        </Section>

        <Section id="organizers" title="11. Event Organizers">
          <p>Any GoOutside user can access the organiser dashboard. By creating an event listing, you agree to this section.</p>

          <p><strong>Event listing requirements:</strong> Your listing must accurately describe the event, use images you have rights to, not deceive attendees, and comply with all applicable Ghanaian laws (entertainment regulations, venue permits, health and safety).</p>

          <p><strong>Payouts:</strong> Proceeds minus the GoOutside 5% fee and Paystack transaction fee go to your Paystack subaccount. You are responsible for KYC verification and paying all applicable taxes on event revenue including VAT and income tax.</p>

          <p><strong>Attendee data:</strong> You receive attendees' names, emails, and ticket details. You must use this data only for legitimate event management purposes, not sell or share it with third parties, comply with Ghana's Data Protection Act 2012, and maintain your own attendee privacy notice.</p>

          <p><strong>Cancellations:</strong> If you cancel an event, notify GoOutside immediately at <a href="mailto:support@gooutside.club" className="text-[#2f8f45] underline">support@gooutside.club</a>, communicate to all ticket purchasers, and cooperate to process refunds within 10 business days. Repeated cancellations or refund failures may result in account suspension.</p>

          <Warning>
            <strong>Prohibited events:</strong> You may not list events that are illegal under Ghanaian law, promote violence or illegal substances, constitute fraud, or are not real events intended to collect payments.
          </Warning>
          <p><strong>Organizer responsibility:</strong> You are responsible for venue access, permits, performer agreements, sound restrictions, crowd control, age restrictions, security, refunds, taxes, and attendee communications. GoOutside may ask for documentation before or after publishing an event.</p>
          <p><strong>Listing review:</strong> We may review, edit, reject, unpublish, downrank, or remove event listings that appear unsafe, misleading, illegal, low quality, duplicative, or harmful to users or GoOutside.</p>
        </Section>

        <Section id="event-safety" title="12. Event Safety and Offline Conduct">
          <p>Events happen offline, outside GoOutside direct control. Use judgment before attending an event, meeting someone, or sharing personal information. Verify the venue, route, entry requirements, and transport options.</p>
          <Table
            headers={["Area", "Responsibility"]}
            rows={[
              ["Attendees", "Attend at your own risk, follow venue rules, respect other people, and report unsafe behavior."],
              ["Organizers", "Provide a real event, safe venue, lawful access, truthful details, and a reasonable plan for crowd and entry management."],
              ["GoOutside", "Provides discovery, ticketing, messaging, reporting, and platform enforcement tools, but does not supervise event venues."],
            ]}
          />
          <p>If you believe an event is fraudulent, unsafe, illegal, or materially misleading, report it through the app or email <a href="mailto:support@gooutside.club" className="text-[#2f8f45] underline">support@gooutside.club</a>.</p>
        </Section>

        <Section id="pulse" title="13. Pulse Points and Rewards">
          <Table
            headers={["Topic", "Detail"]}
            rows={[
              ["What they are", "A digital rewards currency representing engagement. Not money. Not a financial instrument."],
              ["Earning", "Buying tickets (+25 PP), check-ins (+50 PP), posts (+10 PP), saving events (+5 PP), referrals (+100 PP), milestone bonuses, and monthly streaks"],
              ["Redemption", "Redeemed in the Rewards shop (Dashboard → Rewards). Coupon codes valid for 90 days — not extendable."],
              ["Cannot be", "Sold, transferred to another account, combined with another user balance, or redeemed for cash — ever"],
              ["Forfeited on", "Account deletion. Spendable balance may be reset after 12 months of account inactivity (lifetime total preserved for tier purposes)."],
              ["Modification", "GoOutside may modify the program with 30 days' notice. Discontinuation: 60 days' notice with a redemption window."],
              ["Founding Explorer", "First 1,000 users to complete onboarding receive 2× multiplier for 90 days. Non-transferable. Non-reinstatable."],
            ]}
          />
          <p>We may reverse Pulse Points earned through fraud, bugs, automated activity, duplicate accounts, chargebacks, refunded purchases, or policy violations. Rewards may have their own limits, expiry dates, partner conditions, and availability restrictions.</p>
        </Section>

        <Section id="ai" title="14. AI Features">
          <p>GoOutside offers AI Chat, Weekend Assistant, and "Why This?" features powered by Groq's AI infrastructure. Your queries and profile context are sent to Groq's US servers for processing — see our <Link href="/privacy" className="text-[#2f8f45] underline">Privacy Policy Section 3.11</Link> for full details.</p>
          <p><strong>No guarantee of accuracy.</strong> AI responses are for discovery purposes only and may contain inaccuracies. Always verify event details on the event detail page.</p>
          <p><strong>Responsible use.</strong> You agree not to use AI features to generate harmful, illegal, or misleading content, or to attempt to extract other users' information through AI queries.</p>
          <p>AI output is not legal, medical, financial, safety, transport, venue, or emergency advice. Do not rely on AI responses as the only source for time-sensitive event details.</p>
        </Section>

        <Section id="enforcement" title="15. Enforcement, Moderation, and Investigations">
          <p>We may investigate suspected violations of these Terms, the Privacy Policy, payment rules, organiser rules, or applicable law. Depending on the situation, we may:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Remove or restrict content, events, comments, reviews, messages, images, or profile information</li>
            <li>Limit, suspend, or terminate accounts or organiser access</li>
            <li>Cancel tickets, reverse Pulse Points, pause payouts, or require identity or event verification</li>
            <li>Preserve records for fraud prevention, dispute resolution, law enforcement, or legal compliance</li>
            <li>Notify affected users, payment processors, venues, partners, or authorities where appropriate</li>
          </ul>
          <p>We are not required to disclose every enforcement signal or internal review method, especially where doing so would compromise safety, fraud prevention, or platform integrity.</p>
        </Section>

        <Section id="ip" title="16. Intellectual Property">
          <p><strong>GoOutside IP:</strong> The GoOutside brand, logo, platform software, UI design, and all proprietary technology (Pulse Score algorithm, recommendation engine, all associated software) are owned by Soro Technologies or its licensors. You may not copy, reproduce, or create derivative works from GoOutside technology or brand assets without written permission.</p>
          <p><strong>Your IP:</strong> You retain ownership of all original content you create. See Section 6 for the limited license you grant us.</p>
          <p><strong>Copyright claims:</strong> Email <a href="mailto:legal@gooutside.club" className="text-[#2f8f45] underline">legal@gooutside.club</a> with: description of the copyrighted work, URL of the alleged infringing content, your contact information, and a good-faith statement.</p>
        </Section>

        <Section id="third-party" title="17. Third-Party Services and Links">
          <p>GoOutside integrates with Paystack, Clerk, Stream Chat, Groq, and Google Maps. Your use of these services is governed by their own terms and privacy policies. GoOutside is not responsible for the practices of third-party services.</p>
          <p>GoOutside may contain links to external websites. We do not endorse and are not responsible for linked external sites.</p>
        </Section>

        <Section id="privacy" title="18. Privacy">
          <p>Our <Link href="/privacy" className="text-[#2f8f45] underline">Privacy Policy</Link> governs our collection, use, and sharing of your personal data and is incorporated into these Terms by reference.</p>
        </Section>

        <Section id="availability" title="19. Platform Availability and Product Changes">
          <p>GoOutside is currently evolving. We may add, remove, limit, rename, redesign, suspend, or discontinue features, including rewards, messaging, AI tools, organiser dashboards, analytics, ticketing flows, and experimental features.</p>
          <p>We aim to keep the platform available, but we do not guarantee uninterrupted access. Outages may occur because of maintenance, third-party provider issues, security incidents, internet failures, payment processor downtime, or events outside our control.</p>
          <p>Where practical, we will give advance notice before removing a major paid or organizer-critical feature, but urgent security, legal, or operational changes may happen immediately.</p>
        </Section>

        <Section id="liability" title="20. Disclaimers and Limitation of Liability">
          <Warning>
            <strong>GoOutside is a technology platform.</strong> We do not organise events, employ event staff, or guarantee the quality, safety, accuracy, or legality of any event on our platform. <strong>You attend events at your own risk.</strong> GoOutside is not liable for any injury, loss, or damage arising from attendance at any event discovered through the platform.
          </Warning>
          <p>We provide GoOutside on an "as is" and "as available" basis with no warranty that the platform will be available, error-free, or that event information is accurate.</p>
          <p><strong>Limitation of liability:</strong> To the maximum extent permitted by Ghanaian law, Soro Technologies' total liability for any claim shall not exceed the greater of: (a) total platform fees you paid in the 12 months preceding the claim, or (b) GHS 500.</p>
          <p>We are not liable for indirect, incidental, punitive, or consequential damages including loss of profits, data, business opportunity, or goodwill.</p>
          <p className="text-[13px] text-[#6b7280]">Nothing in this section limits our liability for death or personal injury caused by our negligence, fraud, or any liability that cannot be excluded under Ghanaian law.</p>
        </Section>

        <Section id="indemnification" title="21. Indemnification">
          <p>You agree to indemnify, defend, and hold harmless Soro Technologies and its employees, directors, officers, and agents from claims, liabilities, damages, and expenses (including reasonable legal fees) arising from: your use of GoOutside in violation of these Terms, content you post, your violation of applicable law, your violation of third-party rights, or any event you organise through the platform.</p>
        </Section>

        <Section id="governing-law" title="22. Governing Law and Dispute Resolution">
          <p>These Terms are governed by the laws of the <strong>Republic of Ghana</strong>.</p>
          <p><strong>Informal resolution:</strong> Before filing any formal legal claim, contact GoOutside at <a href="mailto:legal@gooutside.club" className="text-[#2f8f45] underline">legal@gooutside.club</a> and attempt to resolve the dispute informally for 30 days.</p>
          <p><strong>Formal disputes:</strong> Subject to the exclusive jurisdiction of the courts of Ghana.</p>
          <p className="text-[14px] text-[#6b7280]">Nothing in these Terms affects your statutory rights as a consumer under Ghanaian consumer protection law.</p>
        </Section>

        <Section id="termination" title="23. Termination">
          <p><strong>By you:</strong> Delete your account at Dashboard → Profile → Settings → Delete Account at any time. Deletion terminates your access immediately.</p>
          <p><strong>By GoOutside:</strong> We may suspend or terminate your account, with or without notice, if you breach these Terms, use GoOutside for fraudulent or illegal activity, or where required by law.</p>
          <p><strong>Effect:</strong> Access ceases immediately. Unredeemed Pulse Points are forfeited. Sections 6, 16, 20, 21, and 22 survive termination, along with any provisions that by their nature should continue.</p>
        </Section>

        <Section id="changes" title="24. Changes to These Terms">
          <p>When we make material changes, we will: (1) post updated Terms at gooutside.club/terms, (2) update the "Last updated" date, and (3) send email notification at least <strong>14 days before</strong> changes take effect. Your continued use after the effective date constitutes acceptance.</p>
        </Section>

        <Section id="contact" title="25. Contact Us">
          <Table
            headers={["Type", "Contact"]}
            rows={[
              ["General legal queries", <a href="mailto:legal@gooutside.club" className="text-[#2f8f45] underline">legal@gooutside.club</a>],
              ["Payment and ticket support", <a href="mailto:support@gooutside.club" className="text-[#2f8f45] underline">support@gooutside.club</a>],
              ["Privacy and data", <a href="mailto:privacy@gooutside.club" className="text-[#2f8f45] underline">privacy@gooutside.club</a>],
              ["Copyright claims", <a href="mailto:legal@gooutside.club" className="text-[#2f8f45] underline">legal@gooutside.club</a>],
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
