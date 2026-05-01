import { redirect } from "next/navigation";

export default async function GoUserRedirect({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  redirect(`/${username}`);
}
