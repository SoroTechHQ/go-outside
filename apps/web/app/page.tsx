import { Suspense } from "react";
import { cookies } from "next/headers";
import HomeClient from "../components/home/HomeClient";
import SiteGate from "../components/SiteGate";
import AppBackground from "../components/layout/AppBackground";
import AppChrome from "../components/layout/AppChrome";
import Footer from "../components/layout/Footer";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const cookieStore = await cookies();
  const isUnlocked = cookieStore.get("go_admin_auth")?.value === "authenticated";

  if (!isUnlocked) {
    return <SiteGate />;
  }

  // Authenticated: render the full app shell manually
  // (ConditionalChrome skips "/" so we provide chrome here)
  return (
    <>
      <AppBackground />
      <AppChrome />
      <div className="app-content">
        <Suspense fallback={null}>
          <HomeClient />
        </Suspense>
      </div>
      <Footer />
    </>
  );
}
