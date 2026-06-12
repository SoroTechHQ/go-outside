import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — GoOutside",
  description: "How GoOutside collects, uses, and protects your personal data. Compliant with Ghana's Data Protection Act 2012 (Act 843).",
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

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-[17px] font-semibold text-[#111827]">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
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
  { id: "who-we-are", label: "1. Who We Are" },
  { id: "what-this-covers", label: "2. What This Policy Covers" },
  { id: "information-we-collect", label: "3. Information We Collect" },
  { id: "why-we-collect", label: "4. Why We Collect It" },
  { id: "legal-basis", label: "5. Legal Basis for Processing" },
  { id: "how-we-share", label: "6. How We Share Your Data" },
  { id: "international-transfers", label: "7. International Data Transfers" },
  { id: "pulse-profiling", label: "8. Pulse Score & Automated Profiling" },
  { id: "cookies", label: "9. Cookies & Tracking" },
  { id: "retention", label: "10. Data Retention" },
  { id: "security", label: "11. Data Security" },
  { id: "your-rights", label: "12. Your Rights" },
  { id: "children", label: "13. Children's Privacy" },
  { id: "organizers", label: "14. For Event Organizers" },
  { id: "ghana-dpa", label: "15. Ghana Data Protection Act" },
  { id: "eea", label: "16. For EEA Users" },
  { id: "changes", label: "17. Changes to This Policy" },
  { id: "contact", label: "18. Contact Us" },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      {/* Header */}
      <div className="mb-10">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#c8e8ce] bg-[#f0f9f2] px-3 py-1.5 text-[12px] font-semibold text-[#2f8f45]">
          Legal Document
        </div>
        <h1 className="mb-2 text-[36px] font-bold leading-tight tracking-tight text-[#0f110f] md:text-[44px]">
          Privacy Policy
        </h1>
        <p className="text-[14px] text-[#6b7280]">
          Last updated: {LAST_UPDATED} · Version {VERSION} · Estimated reading time: 15 minutes
        </p>
      </div>

      {/* At a glance */}
      <Highlight>
        <p className="mb-2 font-bold text-[#1a4a24]">At a glance</p>
        <ul className="space-y-1 text-[14px]">
          <li>• We collect the data needed to run a personalised event discovery app — and nothing more</li>
          <li>• We do not sell your data and we do not run advertising networks</li>
          <li>• When you buy a ticket, the event organiser receives your name and email</li>
          <li>• Your data is stored on servers in the United States (Supabase, Clerk, Stream Chat, Groq)</li>
          <li>• You can delete your account — and your data — at any time</li>
          <li>• We are registered with (or registering with) Ghana's Data Protection Commission under Act 843</li>
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

        {/* 1 */}
        <Section id="who-we-are" title="1. Who We Are">
          <p>
            GoOutside is operated by <strong>Soro Technologies</strong> ("we", "us", "our"), a company incorporated in Ghana.
            GoOutside is a social-first event discovery platform that helps people in Ghana discover, attend, and share events.
          </p>
          <Table
            headers={["Detail", "Information"]}
            rows={[
              ["Company", "Soro Technologies"],
              ["Location", "Accra, Ghana"],
              ["Privacy email", <a href="mailto:privacy@gooutside.club" className="text-[#2f8f45] underline">privacy@gooutside.club</a>],
              ["DPC Registration", "Pending — will be published upon receipt"],
              ["Data Protection Supervisor", "To be inserted upon DPC registration"],
            ]}
          />
          <p>
            We are registered with (or in the process of registering with) the <strong>Data Protection Commission of Ghana</strong> as
            required under the <strong>Data Protection Act, 2012 (Act 843)</strong>.
          </p>
        </Section>

        {/* 2 */}
        <Section id="what-this-covers" title="2. What This Policy Covers">
          <p>This policy applies to the GoOutside web application (gooutside.club), associated subdomains, and the mobile app when available.</p>
          <p>It does not apply to: third-party websites GoOutside links to, event organisers' own data practices (they are independent data controllers), or third-party payment processors.</p>
        </Section>

        {/* 3 */}
        <Section id="information-we-collect" title="3. Information We Collect">
          <SubSection title="3.1 Account & Identity Data">
            <Table
              headers={["Data", "How Collected", "Why"]}
              rows={[
                ["Email address", "At sign-up", "Account creation, communications, ticket delivery"],
                ["First name and last name", "Sign-up or Google OAuth", "Identity, public profile, ticket name"],
                ["Password", "At sign-up", "Authentication — managed by Clerk; we never see your plain-text password"],
                ["Profile photo (avatar)", "Uploaded by you", "Public profile display"],
                ["Username (handle)", "Set during onboarding", "Public identity on the platform"],
                ["Phone number", "Optional", "Account security, event communications"],
                ["Twitter/X username", "Optional, if you connect Twitter", "Social profile linking"],
              ]}
            />
          </SubSection>

          <SubSection title="3.2 Profile & Preference Data">
            <Table
              headers={["Data", "Purpose"]}
              rows={[
                ["Bio", "Public profile display"],
                ["Home city", "Localises your event feed"],
                ["Interest categories (Music, Tech, Food, etc.)", "Feed personalisation"],
                ["Vibe preferences (frequency, crew size, time-of-day)", "Feed personalisation"],
                ["Onboarding event history ('events you've attended before')", "Calculates your starting Pulse Score"],
                ["Pulse Score and tier", "Rewards eligibility; visible on public profile"],
                ["Notification preferences", "Controls which notifications you receive"],
              ]}
            />
            <p className="text-[13px] text-[#6b7280]">
              Your interests, vibe, and city are also stored in a preference cookie (<code className="rounded bg-[#f3f4f6] px-1 py-0.5 text-[12px]">go_prefs</code>) for 30 days so the app loads quickly without a database call on each visit.
            </p>
          </SubSection>

          <SubSection title="3.3 Location Data">
            <p><strong>Type 1 — City (always collected):</strong> You select your home city during onboarding. Stored in your profile, used to filter your feed, and visible on your public profile.</p>
            <p><strong>Type 2 — GPS / Precise Location (only with your permission):</strong> If you grant location permission, we capture your GPS coordinates and send them to Google's Geocoding API to resolve to a formatted address. We only request this when you explicitly trigger a location feature. We do not track your location continuously or in the background, and do not share precise coordinates with event organisers.</p>
            <p><strong>Type 3 — IP-Derived Location (automatic):</strong> Your IP address is sent to <strong>ip-api.com</strong> to approximate your city, region, and country. Used for analytics and regional event surfacing.</p>
            <p><strong>Type 4 — Live Event Location (events only):</strong> During live events (3 hours before to 5 hours after end), your GPS may power live location features at the venue, visible to other authenticated users. Automatically deleted when the window closes.</p>
          </SubSection>

          <SubSection title="3.4 Behavioral & Interaction Data">
            <p>Signals about how you interact with content, used to power your personalised feed and Pulse Score.</p>
            <Table
              headers={["Signal Type", "Examples"]}
              rows={[
                ["Event interactions", "Card views, dwell time (ms), clicks, saves, dismissals, share, ticket intent, check-in"],
                ["Page-level data", "Pages visited, time spent, scroll depth, bounce detection"],
                ["Micro-events", "Individual clicks/hovers, cursor position, search queries, cart adds/removes"],
                ["Behavioral profile (computed)", "Device tier, price sensitivity, peak usage hours, discovery style, conversion rates — internal use only"],
              ]}
            />
          </SubSection>

          <SubSection title="3.5 Device & Technical Data">
            <Table
              headers={["Data", "Source"]}
              rows={[
                ["IP address", "Automatically, on every visit"],
                ["Browser type and version", "HTTP request"],
                ["Operating system", "HTTP request"],
                ["Device type (mobile/tablet/desktop)", "HTTP request"],
                ["Referrer URL", "HTTP request"],
                ["Session token", "Generated client-side on first visit"],
              ]}
            />
          </SubSection>

          <SubSection title="3.6 Browser Fingerprint Data">
            <Warning>
              <strong>We want to be transparent:</strong> GoOutside uses browser fingerprinting for fraud prevention and security. This collects more detailed technical signals than standard device data. Here is exactly what we collect on every page load:
            </Warning>
            <Table
              headers={["Signal", "What it captures"]}
              rows={[
                ["Canvas fingerprint", "Hash of how your browser renders 2D graphics — unique to your device/browser combination"],
                ["WebGL fingerprint", "Hash from your GPU's 3D rendering, including GPU vendor and renderer name"],
                ["Audio context fingerprint", "Hash of how your browser processes audio"],
                ["CPU cores / RAM", "Number of logical processors and approximate available RAM in GB"],
                ["Screen dimensions and resolution", "Width, height, pixel ratio, color depth"],
                ["Installed fonts count", "Number of fonts accessible to the browser"],
                ["Browser language / timezone / platform", "Language setting, device timezone, OS platform string"],
                ["Touch support", "Number of touch points supported"],
                ["Connection type and download speed", "Network category and approximate speed"],
                ["Battery level and charging state", "Battery % and charging status (where browser supports this API)"],
                ["Ad blocker / Do Not Track / Incognito mode", "Whether these browser features are active"],
                ["WebRTC support", "Whether peer-to-peer networking is supported"],
              ]}
            />
            <p><strong>Why:</strong> To detect fraud, bot traffic, and account takeover attempts. Also links pre-sign-in browsing to your account after sign-up to seed your first personalised feed.</p>
            <p>You can request deletion of fingerprint data at <a href="mailto:privacy@gooutside.club" className="text-[#2f8f45] underline">privacy@gooutside.club</a>. Privacy extensions like Canvas Blocker or Privacy Badger will limit the effectiveness of this tracking.</p>
          </SubSection>

          <SubSection title="3.7 Payment & Transaction Data">
            <Highlight>
              GoOutside uses <strong>Paystack</strong> for all payments. <strong>We do not store your card number, CVV, expiry date, or bank account details.</strong> Paystack handles all of that under PCI-DSS compliance.
            </Highlight>
            <p>What GoOutside stores after a successful payment:</p>
            <Table
              headers={["Data", "Stored in"]}
              rows={[
                ["Paystack transaction reference", "GoOutside database"],
                ["Payment amount (GHS)", "GoOutside database"],
                ["Payment channel (card / mobile money / bank)", "GoOutside database"],
                ["Payment status and timestamps", "GoOutside database"],
                ["Ticket type, quantity, attendee name and email", "GoOutside database"],
                ["Payment metadata from Paystack (may include card network type)", "GoOutside database"],
              ]}
            />
            <p className="text-[14px]">
              <strong>Pulse Points ledger:</strong> Every earn or spend is recorded as an append-only entry that is never deleted — your complete rewards transaction history.
            </p>
          </SubSection>

          <SubSection title="3.8 Social Graph Data">
            <Table
              headers={["Data", "Visibility"]}
              rows={[
                ["Users you follow", "Visible on your public profile"],
                ["Your followers", "Visible on your public profile"],
                ["Organizers you follow", "Visible on your public profile"],
                ["Friend requests", "Private — not visible to others"],
                ["Blocked users", "Strictly private"],
              ]}
            />
            <p>Your follow relationships are used as social signals in other users' feeds ("3 people you follow are going to this event").</p>
          </SubSection>

          <SubSection title="3.9 Content Data">
            <Table
              headers={["Content", "Stored", "Visibility"]}
              rows={[
                ["Posts (text ≤500 chars)", "GoOutside database", "Public by default"],
                ["Post images", "Supabase Storage", "Public by default"],
                ["Snippets (post-event reviews ≤280 chars)", "GoOutside database", "Visible on profile and event page"],
                ["Reviews and star ratings", "GoOutside database", "Publicly visible on event page"],
                ["Moderation reports you file", "GoOutside database", "Visible only to GoOutside moderation team"],
              ]}
            />
          </SubSection>

          <SubSection title="3.10 Communications Data">
            <p><strong>Direct messages</strong> are powered by <strong>Stream Chat</strong> (GetStream.io). Message content is stored on Stream Chat's servers — not on GoOutside's servers. We store only: which users have a conversation, the last message timestamp, and an 80-character message preview.</p>
            <p><strong>In-app notifications</strong> are stored in our database and visible only to you.</p>
            <p><strong>Transactional emails</strong> are sent via <strong>Resend</strong>, which receives your email and name for delivery.</p>
          </SubSection>

          <SubSection title="3.11 AI Interaction Data">
            <p>When you use <strong>AI Chat</strong>, <strong>Weekend Assistant</strong>, or <strong>"Why This?"</strong>, the following is sent to <strong>Groq</strong> (our AI provider) on US servers:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Your message text and up to 10 prior messages in the conversation</li>
              <li>Your interest categories, Pulse Score and tier, home city</li>
              <li>Titles of recently saved and attended events</li>
            </ul>
            <Highlight>
              Groq does not use your data to train AI models. Do not share sensitive personal information (health details, home address, financial details) in AI queries.
            </Highlight>
          </SubSection>
        </Section>

        {/* 4 */}
        <Section id="why-we-collect" title="4. Why We Collect It — Purposes of Processing">
          <Table
            headers={["Purpose", "Data Used"]}
            rows={[
              ["Account creation and management", "Identity data, email, password, profile data"],
              ["Personalised event feed", "Interests, vibe, location, behavioral data, social graph"],
              ["Ticket purchasing and fulfillment", "Identity, payment reference, attendee details"],
              ["Pulse Score calculation", "Event saves, check-ins, purchases, posts, referrals"],
              ["Rewards and redemption", "Pulse Points ledger, user ID, reward catalog"],
              ["Direct messaging", "User ID, conversation metadata (content via Stream Chat)"],
              ["AI-powered event discovery", "Interests, score, city, conversation history (via Groq)"],
              ["Fraud prevention and security", "IP address, browser fingerprint, device data"],
              ["Analytics and service improvement", "Behavioral data (aggregated and anonymised where possible)"],
              ["Legal compliance", "Identity, payment records, IP logs"],
              ["Transactional communications", "Email address, name, ticket details"],
              ["Marketing communications", "Email, name — only with your explicit consent"],
            ]}
          />
        </Section>

        {/* 5 */}
        <Section id="legal-basis" title="5. Legal Basis for Processing">
          <Table
            headers={["Processing Activity", "Legal Basis"]}
            rows={[
              ["Account registration and management", "Contract — necessary to provide the service"],
              ["Ticket purchasing and fulfillment", "Contract — necessary to complete the transaction"],
              ["Feed personalisation based on stated interests", "Contract / Legitimate interests"],
              ["Behavioral profiling for feed improvement", "Legitimate interests — improving platform relevance"],
              ["Browser fingerprinting", "Legitimate interests — fraud prevention and security"],
              ["Pre-login tracking via go_vid cookie", "Legitimate interests — security and fraud prevention"],
              ["GPS / precise location collection", "Consent — you explicitly grant permission"],
              ["Sending marketing emails", "Consent — you opt in (never pre-ticked)"],
              ["AI chat queries sent to Groq", "Contract — necessary to operate the AI feature"],
              ["Payment processing via Paystack", "Contract — necessary to process your payment"],
              ["Retaining payment records for 7 years", "Legal obligation — Ghana Revenue Authority tax requirements"],
              ["Legal disclosures to authorities", "Legal obligation"],
            ]}
          />
          <p className="text-[14px] text-[#6b7280]">Where we rely on <strong>legitimate interests</strong>, we have carried out a balancing test and concluded our interests do not override your rights. You may object to any such processing — see Section 12.</p>
        </Section>

        {/* 6 */}
        <Section id="how-we-share" title="6. How We Share Your Data">
          <SubSection title="6.1 Sharing With Event Organizers — Read This First">
            <Warning>
              <strong>When you purchase a ticket</strong>, the event organiser receives your <strong>name</strong>, <strong>email address</strong>, <strong>ticket type</strong>, and <strong>order reference</strong>. This is necessary for event entry management.
            </Warning>
            <p>The organiser does <strong>not</strong> receive: your payment card details, phone number, Pulse Score, behavioral data, private messages, or precise GPS location.</p>
            <p>Organizers are independent data controllers for the attendee data they receive. We recommend reviewing the organiser's own privacy notice before purchasing.</p>
          </SubSection>

          <SubSection title="6.2 Third-Party Service Providers">
            <Table
              headers={["Provider", "Data Received", "Purpose"]}
              rows={[
                ["Clerk (auth.clerk.com)", "Email, name, avatar, username", "Authentication"],
                ["Supabase (supabase.com)", "All application data", "Database and file storage"],
                ["Stream Chat (getstream.io)", "User ID, display name, avatar, all DM content", "Real-time messaging"],
                ["Paystack (paystack.com)", "Email, payment amount, ticket reference", "Payment processing"],
                ["Resend (resend.com)", "Email address, name", "Transactional email delivery"],
                ["Groq (groq.com)", "Message text, interests, city, pulse score, event history", "AI features"],
                ["Google Maps Platform", "GPS coordinates, location search text", "Reverse geocoding and location autocomplete"],
                ["ip-api.com", "Raw IP address", "IP-to-city geolocation on new sessions"],
                ["Vercel (vercel.com)", "HTTP request metadata, IP addresses", "Web hosting"],
              ]}
            />
          </SubSection>

          <SubSection title="6.3 What We Never Do">
            <Highlight>
              <ul className="space-y-1.5">
                <li>• We do <strong>not</strong> sell your personal data to any third party</li>
                <li>• We do <strong>not</strong> share your data with advertising networks</li>
                <li>• We do <strong>not</strong> use your identity (name, photo) in ads shown to other users</li>
                <li>• We do <strong>not</strong> read your private messages — DM content is processed only by Stream Chat</li>
                <li>• We do <strong>not</strong> share your precise GPS location with event organisers</li>
                <li>• We do <strong>not</strong> use your AI chat queries to train machine learning models</li>
                <li>• We do <strong>not</strong> send your payment card details to anyone other than Paystack</li>
              </ul>
            </Highlight>
          </SubSection>
        </Section>

        {/* 7 */}
        <Section id="international-transfers" title="7. International Data Transfers">
          <p>GoOutside is a Ghanaian company, but several key service providers operate primarily in the United States. Your personal data is therefore transferred outside Ghana.</p>
          <Table
            headers={["Service", "Data Transferred", "Location"]}
            rows={[
              ["Clerk", "Identity and auth data", "United States (AWS)"],
              ["Supabase", "All application data", "United States (AWS)"],
              ["Stream Chat", "All DM content", "United States"],
              ["Groq", "AI query data", "United States"],
              ["Resend", "Email delivery data", "United States"],
              ["Google Maps", "GPS coordinates, location queries", "United States (Google Cloud)"],
              ["ip-api.com", "IP addresses", "ip-api.com infrastructure"],
              ["Vercel", "HTTP request metadata", "United States / global CDN"],
            ]}
          />
          <p>By creating a GoOutside account and accepting this Privacy Policy, you consent to your personal data being transferred to and processed in the United States by the service providers listed above. If you object, contact us at <a href="mailto:privacy@gooutside.club" className="text-[#2f8f45] underline">privacy@gooutside.club</a> or delete your account.</p>
        </Section>

        {/* 8 */}
        <Section id="pulse-profiling" title="8. Pulse Score & Automated Profiling">
          <p>Your <strong>Pulse Score</strong> is calculated algorithmically from your behavior on GoOutside. This constitutes <strong>automated profiling</strong> under Act 843 and GDPR.</p>
          <Table
            headers={["Activity", "Points"]}
            rows={[
              ["Buying a ticket", "+25 PP"],
              ["Checking in at an event", "+50 PP"],
              ["Creating a post", "+10 PP"],
              ["Saving an event", "+5 PP"],
              ["Referring a friend", "+100 PP"],
              ["5th event attended (milestone)", "+150 PP"],
              ["10th event attended (milestone)", "+150 PP"],
              ["Monthly attendance streak", "+75 PP"],
            ]}
          />
          <p>Your <strong>lifetime Pulse Points</strong> determine your tier (Newcomer → Regular → Plugged In → Scene King → Legend), visible on your public profile and determining reward eligibility.</p>
          <p><strong>Your rights regarding profiling:</strong> View your full ledger at Dashboard → Rewards → Activity. Request a human review of any calculation you believe is inaccurate by emailing privacy@gooutside.club. You may object to profiling, though this may limit your access to rewards.</p>
        </Section>

        {/* 9 */}
        <Section id="cookies" title="9. Cookies & Tracking Technologies">
          <Table
            headers={["Cookie", "Type", "Duration", "Purpose"]}
            rows={[
              [<code className="rounded bg-[#f3f4f6] px-1 py-0.5 text-[12px]">go_vid</code>, "Essential", "90 days", "Visitor identifier — set before sign-in, used for fraud detection and seeding your first feed"],
              [<code className="rounded bg-[#f3f4f6] px-1 py-0.5 text-[12px]">go_done</code>, "Essential", "30 days", "Records onboarding completion"],
              [<code className="rounded bg-[#f3f4f6] px-1 py-0.5 text-[12px]">go_prefs</code>, "Functional", "30 days", "Stores city, interests, vibe, Pulse tier locally for fast page loads — readable by JavaScript"],
              [<code className="rounded bg-[#f3f4f6] px-1 py-0.5 text-[12px]">go_draft</code>, "Functional", "1 day", "Temporarily stores partial profile data including GPS coordinates during onboarding"],
              ["Clerk session cookies", "Essential", "Session", "Authentication session management"],
            ]}
          />
          <p><strong>No advertising cookies.</strong> GoOutside does not use Google Analytics, Facebook Pixel, Hotjar, or any advertising network tracking technologies.</p>
          <p>Shopping cart data is stored in browser <code className="rounded bg-[#f3f4f6] px-1 py-0.5 text-[12px]">localStorage</code> until you checkout or clear browser storage.</p>
          <p>See our <Link href="/cookies" className="text-[#2f8f45] underline">Cookie Policy</Link> for full details on managing cookies.</p>
        </Section>

        {/* 10 */}
        <Section id="retention" title="10. Data Retention">
          <Table
            headers={["Data Category", "Retention Period"]}
            rows={[
              ["Active account data (profile, preferences, posts)", "Life of your account"],
              ["Deleted posts and content", "Removed from public view immediately; purged from backups within 90 days"],
              ["Behavioral interaction data", "Life of account; anonymised if account is deleted"],
              ["Browser fingerprint data", "Life of account; deleted with account"],
              ["Payment records and ticket purchases", "7 years (Ghana Revenue Authority tax compliance)"],
              ["Pulse Points ledger", "Life of account (append-only)"],
              ["AI chat conversations", "Life of account; can be deleted on request"],
              ["IP address and session logs", "12 months"],
              ["Deleted account — profile data", "Deleted within 30 days of account deletion request"],
              ["Deleted account — payment records", "Retained 7 years (legal obligation)"],
              ["Deleted account — behavioral data", "Anonymised within 30 days"],
              ["Database backups", "Overwritten within 90 days"],
            ]}
          />
        </Section>

        {/* 11 */}
        <Section id="security" title="11. Data Security">
          <ul className="list-disc space-y-2 pl-5">
            <li>All data in transit is encrypted via HTTPS/TLS</li>
            <li>Database access is protected by Supabase Row Level Security (RLS)</li>
            <li>Server-side database client uses a service-role key never exposed to the browser</li>
            <li>Authentication (passwords, sessions) managed by Clerk using industry-standard security</li>
            <li>Payment card data is never stored on our systems — Paystack's PCI-DSS infrastructure handles this</li>
            <li>Ticket QR codes are cryptographically signed JWTs with bcrypt-hashed secrets</li>
          </ul>
          <p><strong>Breach notification:</strong> In the event of a breach posing risk to your rights, we will notify the Data Protection Commission of Ghana within 72 hours and notify affected users as soon as practicable.</p>
        </Section>

        {/* 12 */}
        <Section id="your-rights" title="12. Your Rights">
          <Table
            headers={["Right", "How to Exercise"]}
            rows={[
              ["Right to Be Informed", "This Privacy Policy is our primary disclosure"],
              ["Right of Access — request a copy of your data", "Email privacy@gooutside.club — subject: 'Data Access Request'. Response within 30 days."],
              ["Right to Correction — fix inaccurate data", "Dashboard → Profile → Edit, or email us"],
              ["Right to Deletion — delete your account and data", "Dashboard → Profile → Settings → Delete Account. Profile data deleted within 30 days."],
              ["Right to Object to direct marketing", "Use the unsubscribe link in any email, or email us. We stop immediately."],
              ["Right to Object to legitimate-interest processing", "Email privacy@gooutside.club — we will cease unless we demonstrate compelling grounds"],
              ["Right to Withdraw Consent (GPS, marketing)", "Revoke in device settings or email us. Withdrawal does not affect prior processing."],
              ["Right to Data Portability — export your data as JSON", "Email privacy@gooutside.club — subject: 'Data Export Request'"],
              ["Right to Lodge a Complaint", "Data Protection Commission Ghana — dataprotection.org.gh"],
            ]}
          />
          <p className="text-[14px] text-[#6b7280]">We acknowledge all requests within 5 business days and respond fully within 30 days.</p>
        </Section>

        {/* 13 */}
        <Section id="children" title="13. Children's Privacy">
          <p>GoOutside is intended for users aged <strong>18 and over</strong>. We do not knowingly collect personal data from anyone under 18. If you believe a person under 18 has created an account, contact <a href="mailto:privacy@gooutside.club" className="text-[#2f8f45] underline">privacy@gooutside.club</a> and we will delete it promptly.</p>
          <p className="text-[14px] text-[#6b7280]">Note: Ghana's Data Protection Bill 2025 (pending enactment) is expected to introduce parental consent requirements. We will update this policy when it comes into force.</p>
        </Section>

        {/* 14 */}
        <Section id="organizers" title="14. For Event Organizers">
          <p>When you collect attendee data through GoOutside's ticket flow, you become an <strong>independent data controller</strong> for that data. You are responsible for having your own privacy notice, using attendee data only for event management, and complying with Ghana's Data Protection Act 2012.</p>
          <p><strong>What GoOutside provides to organizers:</strong> Attendee name, email, ticket type, and order reference. Aggregate analytics (total sales, revenue, check-in rates). <strong>Not provided:</strong> payment card details, Pulse Scores, private messages, or precise GPS location.</p>
          <p>A Data Processing Agreement (DPA) is available on request at <a href="mailto:privacy@gooutside.club" className="text-[#2f8f45] underline">privacy@gooutside.club</a>.</p>
        </Section>

        {/* 15 */}
        <Section id="ghana-dpa" title="15. Ghana Data Protection Act 2012 (Act 843)">
          <p>GoOutside (operated by Soro Technologies) is registered with or registering with the Data Protection Commission of Ghana. Our DPC Registration Number will be published here upon receipt.</p>
          <Table
            headers={["Principle", "How GoOutside Complies"]}
            rows={[
              ["Accountability", "Soro Technologies takes full responsibility for all personal data held and processed"],
              ["Lawfulness", "Valid legal basis documented for every processing activity (see Section 5)"],
              ["Specification of purpose", "All purposes stated before or at the time of collection (see Section 4)"],
              ["Compatibility", "Data is not used beyond stated purposes"],
              ["Quality", "Users can update data at any time via profile settings"],
              ["Openness", "Full disclosure via this Privacy Policy"],
              ["Security safeguards", "Technical and organisational measures described in Section 11"],
              ["Data subject participation", "All rights honoured as described in Section 12"],
            ]}
          />
          <p><strong>Complaints:</strong> Data Protection Commission of Ghana — <a href="https://dataprotection.org.gh" target="_blank" rel="noopener noreferrer" className="text-[#2f8f45] underline">dataprotection.org.gh</a> · P.O. Box CT 1719, Cantonments, Accra</p>
        </Section>

        {/* 16 */}
        <Section id="eea" title="16. For Users in the European Economic Area">
          <p>If you are in the EEA, Switzerland, or the United Kingdom, you have additional rights under the GDPR: right to restriction of processing, right to object to automated decision-making (see Section 8), and the right to lodge a complaint with the supervisory authority in your country of residence.</p>
          <p>For transfers of EEA user data to the United States, we rely on <strong>Standard Contractual Clauses (SCCs)</strong> as approved by the European Commission.</p>
        </Section>

        {/* 17 */}
        <Section id="changes" title="17. Changes to This Policy">
          <p>When we make material changes, we will: (1) post the updated policy at gooutside.club/privacy, (2) update the "Last updated" date, and (3) send email notification at least <strong>14 days before</strong> changes take effect. Previous versions are available on request.</p>
        </Section>

        {/* 18 */}
        <Section id="contact" title="18. Contact Us">
          <Table
            headers={["Type", "Contact"]}
            rows={[
              ["General privacy enquiries", <a href="mailto:privacy@gooutside.club" className="text-[#2f8f45] underline">privacy@gooutside.club</a>],
              ["Data access / deletion / export requests", <span>Email privacy@gooutside.club — subject: "Data Access Request" / "Data Deletion Request" / "Data Export Request". Response within 30 days.</span>],
              ["Mailing address", "Soro Technologies, Accra, Ghana"],
              ["DPC complaints", <a href="https://dataprotection.org.gh" target="_blank" rel="noopener noreferrer" className="text-[#2f8f45] underline">dataprotection.org.gh</a>],
            ]}
          />
        </Section>

      </div>

      {/* Footer note */}
      <div className="mt-12 border-t border-black/[0.06] pt-8 text-center text-[12px] text-[#a9a9a9]">
        <p>GoOutside Privacy Policy — Version {VERSION} · {LAST_UPDATED}</p>
        <p className="mt-1">© 2026 Soro Technologies · Built in Accra, Ghana</p>
        <div className="mt-4 flex items-center justify-center gap-4">
          <Link href="/terms" className="text-[#2f8f45] transition hover:underline">Terms of Service</Link>
          <Link href="/cookies" className="text-[#2f8f45] transition hover:underline">Cookie Policy</Link>
        </div>
      </div>
    </>
  );
}
