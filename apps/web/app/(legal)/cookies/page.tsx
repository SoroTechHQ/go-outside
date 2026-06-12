import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy — GoOutside",
  description: "How GoOutside uses cookies and similar tracking technologies. We use only essential and functional first-party cookies — no advertising cookies.",
};

const LAST_UPDATED = "June 12, 2026";

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

export default function CookiePolicyPage() {
  return (
    <>
      {/* Header */}
      <div className="mb-10">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#c8e8ce] bg-[#f0f9f2] px-3 py-1.5 text-[12px] font-semibold text-[#2f8f45]">
          Legal Document
        </div>
        <h1 className="mb-2 text-[36px] font-bold leading-tight tracking-tight text-[#0f110f] md:text-[44px]">
          Cookie Policy
        </h1>
        <p className="text-[14px] text-[#6b7280]">
          Last updated: {LAST_UPDATED} · Estimated reading time: 3 minutes
        </p>
      </div>

      <Highlight>
        <p className="mb-2 font-bold text-[#1a4a24]">The short version</p>
        <ul className="space-y-1 text-[14px]">
          <li>• GoOutside uses only essential and functional first-party cookies</li>
          <li>• We do not use Google Analytics, Facebook Pixel, or any advertising cookies</li>
          <li>• We also use browser fingerprinting for fraud prevention — see Section 4 for full details</li>
          <li>• You can manage cookies via your browser settings at any time</li>
        </ul>
      </Highlight>

      <div className="mt-10 space-y-12">

        <Section id="what-are-cookies" title="1. What Are Cookies?">
          <p>Cookies are small text files placed on your device when you visit a website. They help websites remember information about your visit — such as keeping you signed in, remembering your preferences, and detecting unusual activity.</p>
          <p>GoOutside uses cookies sparingly and only for the purposes listed in this policy.</p>
        </Section>

        <Section id="cookies-we-set" title="2. Cookies GoOutside Sets">
          <p className="font-semibold text-[#111827]">Essential Cookies</p>
          <p className="text-[14px] text-[#6b7280]">Required for GoOutside to function. The platform cannot operate without these.</p>
          <Table
            headers={["Cookie", "Duration", "Purpose"]}
            rows={[
              [
                <code className="rounded bg-[#f3f4f6] px-1.5 py-0.5 text-[12px] font-mono">go_vid</code>,
                "90 days",
                "A unique visitor identifier. Set when you first visit GoOutside — before you sign in. After you create an account, this cookie is linked to your user record. Used to detect fraudulent activity and to link your pre-login browsing to your account after sign-up, seeding your first personalised feed. This cookie is HttpOnly and cannot be read by JavaScript on the page."
              ],
              [
                <code className="rounded bg-[#f3f4f6] px-1.5 py-0.5 text-[12px] font-mono">go_done</code>,
                "30 days",
                "Records that you have completed the 5-step onboarding flow. Prevents you from being redirected back to onboarding on subsequent visits."
              ],
              [
                "Clerk session cookies",
                "Session / managed by Clerk",
                "Manages your authentication session. Set by Clerk (our authentication provider). Required to keep you signed in. See clerk.com/legal/privacy for details."
              ],
            ]}
          />

          <p className="mt-6 font-semibold text-[#111827]">Functional Cookies</p>
          <p className="text-[14px] text-[#6b7280]">These improve your experience but are not required. You can disable them in your browser settings.</p>
          <Table
            headers={["Cookie", "Duration", "Purpose"]}
            rows={[
              [
                <code className="rounded bg-[#f3f4f6] px-1.5 py-0.5 text-[12px] font-mono">go_prefs</code>,
                "30 days",
                <span>Stores your event interests, vibe preferences, home city, Pulse Score, and Pulse tier in your browser for fast page loads. Without this cookie, these preferences are fetched from the database on every page visit (slower but functionally identical). <strong>Note: this cookie is readable by JavaScript on the page.</strong></span>
              ],
              [
                <code className="rounded bg-[#f3f4f6] px-1.5 py-0.5 text-[12px] font-mono">go_draft</code>,
                "1 day",
                "Temporarily stores partial profile information — including any GPS coordinates you enter — during the onboarding flow. Used only to pre-fill form fields if you navigate between steps. Automatically deleted after 24 hours."
              ],
            ]}
          />
        </Section>

        <Section id="localstorage" title="3. Browser LocalStorage">
          <p>In addition to cookies, GoOutside uses your browser's <code className="rounded bg-[#f3f4f6] px-1.5 py-0.5 text-[12px] font-mono">localStorage</code> to store your <strong>shopping cart contents</strong> while you browse and add tickets. This is local to your device and is never transmitted to our servers until you proceed to checkout.</p>
          <p>Cart contents persist until you complete a purchase (cart clears on successful checkout), manually clear your browser's local storage, or your browser clears it automatically.</p>
        </Section>

        <Section id="fingerprinting" title="4. Browser Fingerprinting">
          <p>GoOutside also uses <strong>browser fingerprinting</strong> for fraud prevention and security. Unlike cookies, fingerprinting does not store a file on your device — instead, it reads technical signals about your browser configuration and combines them into a unique device identifier.</p>
          <p>Fingerprint signals include: screen resolution, GPU details, canvas and audio rendering hashes, font count, battery level, network connection type, and more. This fingerprint is stored in our database alongside your account.</p>
          <p><strong>Why we use it:</strong> To detect account takeover attempts, identify bot traffic and fraudulent sign-ups, and link anonymous pre-login browsing to your account after sign-up.</p>
          <p>For the complete list of signals collected, see <Link href="/privacy#information-we-collect" className="text-[#2f8f45] underline">Section 3.6 of our Privacy Policy</Link>.</p>
          <p className="text-[14px] text-[#6b7280]">You can limit fingerprinting effectiveness using browser extensions such as Privacy Badger or Canvas Blocker. This will not affect your ability to use GoOutside, but may occasionally trigger additional security verification.</p>
        </Section>

        <Section id="what-we-dont-use" title="5. What We Don't Use">
          <Highlight>
            <p className="mb-2 font-semibold text-[#1a4a24]">GoOutside does not use:</p>
            <ul className="space-y-1 text-[14px]">
              <li>• Google Analytics or Google Tag Manager</li>
              <li>• Facebook Pixel or Meta tracking</li>
              <li>• Hotjar, Microsoft Clarity, or session recording tools</li>
              <li>• Any advertising network cookies or tracking pixels</li>
              <li>• Cross-site behavioural tracking of any kind</li>
            </ul>
          </Highlight>
        </Section>

        <Section id="managing-cookies" title="6. Managing and Deleting Cookies">
          <p>You can view, manage, and delete cookies through your browser settings:</p>
          <Table
            headers={["Browser", "How to access cookie settings"]}
            rows={[
              ["Chrome", "Settings → Privacy and security → Cookies and other site data"],
              ["Firefox", "Settings → Privacy & Security → Cookies and Site Data"],
              ["Safari", "Preferences → Privacy → Manage Website Data"],
              ["Edge", "Settings → Cookies and site permissions"],
              ["Brave", "Settings → Privacy and security → Cookies"],
            ]}
          />
          <p className="mt-4 font-semibold text-[#111827]">What happens if you delete or block cookies:</p>
          <Table
            headers={["Cookie", "Effect of blocking or deleting"]}
            rows={[
              [<code className="rounded bg-[#f3f4f6] px-1.5 py-0.5 text-[12px] font-mono">go_vid</code>, "You may encounter more frequent security verification; pre-login browsing will not seed your feed"],
              [<code className="rounded bg-[#f3f4f6] px-1.5 py-0.5 text-[12px] font-mono">go_done</code>, "You may be redirected to onboarding on each visit until completion is re-recorded"],
              ["Clerk session cookies", "You will be signed out and must sign in again"],
              [<code className="rounded bg-[#f3f4f6] px-1.5 py-0.5 text-[12px] font-mono">go_prefs</code>, "Page loads will be slightly slower as preferences are fetched from the database on each visit"],
              [<code className="rounded bg-[#f3f4f6] px-1.5 py-0.5 text-[12px] font-mono">go_draft</code>, "Onboarding form fields will not be pre-filled; you may lose partial progress between steps"],
            ]}
          />
        </Section>

        <Section id="consent" title="7. Consent">
          <p>By using GoOutside, you acknowledge the use of essential cookies required for the platform to operate. For functional cookies, you can disable them via your browser settings at any time.</p>
          <p>We do not currently display a cookie consent banner because we use only essential and functional first-party cookies, with no advertising or third-party tracking cookies that would require explicit opt-in under most cookie regulations.</p>
          <p>If we add any analytics or optional cookies in the future, we will update this policy and implement appropriate consent mechanisms before doing so.</p>
        </Section>

        <Section id="changes" title="8. Changes to This Policy">
          <p>If we change the cookies we use, we will update this page and the "Last updated" date at the top. For material changes, we will notify you as described in our <Link href="/privacy#changes" className="text-[#2f8f45] underline">Privacy Policy Section 17</Link>.</p>
        </Section>

        <Section id="contact" title="9. Contact">
          <p>For questions about our use of cookies or tracking technologies:</p>
          <p>Email: <a href="mailto:privacy@gooutside.app" className="text-[#2f8f45] underline">privacy@gooutside.app</a></p>
        </Section>

      </div>

      {/* Footer note */}
      <div className="mt-12 border-t border-black/[0.06] pt-8 text-center text-[12px] text-[#a9a9a9]">
        <p>GoOutside Cookie Policy · {LAST_UPDATED}</p>
        <p className="mt-1">© 2026 Soro Technologies · Built in Accra, Ghana</p>
        <div className="mt-4 flex items-center justify-center gap-4">
          <Link href="/privacy" className="text-[#2f8f45] transition hover:underline">Privacy Policy</Link>
          <Link href="/terms" className="text-[#2f8f45] transition hover:underline">Terms of Service</Link>
        </div>
      </div>
    </>
  );
}
