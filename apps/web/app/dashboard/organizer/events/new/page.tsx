import { redirect } from "next/navigation";

export default function LegacyOrganizerNewEventPage() {
  redirect("/organizer/events/new");
}
