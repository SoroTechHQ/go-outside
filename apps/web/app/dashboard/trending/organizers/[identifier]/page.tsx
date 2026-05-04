import { notFound, redirect } from "next/navigation";
import { supabaseAdmin } from "../../../../../lib/supabase";

type Props = {
  params: Promise<{ identifier: string }>;
};

type OrganizerUserRow = {
  id: string;
  username: string | null;
};

async function getOrganizerProfileTarget(identifier: string) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, username")
    .or(`id.eq.${identifier},username.eq.${identifier}`)
    .maybeSingle<OrganizerUserRow>();

  if (error) {
    console.error("[trending organizer redirect] user lookup failed", error.message, identifier);
    return null;
  }

  if (!data) return null;
  if (data.username) return `/${data.username}`;
  return `/dashboard/user/${data.id}`;
}

export default async function TrendingOrganizerRedirectPage({ params }: Props) {
  const { identifier } = await params;
  const target = await getOrganizerProfileTarget(identifier);

  if (!target) notFound();

  redirect(target);
}
