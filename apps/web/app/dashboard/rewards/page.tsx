import { RewardsClient } from "./RewardsClient";

export const metadata = { title: "My Rewards · GoOutside" };

export default function RewardsPage() {
  // TODO: fetch real data from Supabase
  // const user = await getOrCreateSupabaseUser();
  // const ppBalance = user.pulse_points_balance ?? 0;
  // const ppLifetime = user.pulse_points_lifetime ?? 0;
  // const badges = await getUserRewardsBadges(user.id);
  // const ledger = await getPPLedger(user.id);

  return <RewardsClient />;
}
