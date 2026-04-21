import { getOrCreateSupabaseUser } from "../../../lib/db/users";
import {
  getUserPulsePoints,
  getActiveRewards,
  getPulseLedger,
  getUserRewardsBadges,
} from "../../../lib/db/rewards";
import { RewardsClient } from "./RewardsClient";

export const metadata = { title: "Pulse Rewards · GoOutside" };

export default async function RewardsPage() {
  const user = await getOrCreateSupabaseUser();

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] text-[var(--text-secondary)]">
        <p>Please sign in to view your rewards.</p>
      </main>
    );
  }

  const [pp, rewards, ledger, badges] = await Promise.all([
    getUserPulsePoints(user.id),
    getActiveRewards(),
    getPulseLedger(user.id, 30),
    getUserRewardsBadges(user.id),
  ]);

  return (
    <RewardsClient
      pp={pp}
      rewards={rewards}
      ledger={ledger}
      badges={badges}
    />
  );
}
