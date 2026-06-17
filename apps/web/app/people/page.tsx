import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { Suspense } from "react";
import PeopleClient from "./PeopleClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "People | GoOutside",
  description: "Discover and connect with people sharing your scene in Accra.",
};

export default async function PeoplePage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return (
    <Suspense fallback={<PeoplePageSkeleton />}>
      <PeopleClient />
    </Suspense>
  );
}

function PeoplePageSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-20 rounded-2xl bg-[var(--bg-card)] animate-pulse" />
      ))}
    </div>
  );
}
