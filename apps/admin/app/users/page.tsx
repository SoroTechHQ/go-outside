import { PlatformUsersPage } from "../../components/pages/platform-users-page";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UsersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const flat = Object.fromEntries(
    Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : (v ?? "")])
  );
  return <PlatformUsersPage searchParams={flat} />;
}
