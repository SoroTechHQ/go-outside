import { redirect } from "next/navigation";

export default async function LegacyOrganizerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/organizers/${id}`);
}
