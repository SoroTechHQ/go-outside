import { demoData, organizers } from "@gooutside/demo-data";
import { DataTable, ShellCard, StatCard, StatusPill, TextInput } from "@gooutside/ui";
import { DashboardShell } from "../../../components/dashboard-shell";

const fakeUsers = [
  { name: demoData.attendee.name, role: "Attendee", city: "Accra", joined: "Jan 2024", status: "active" },
  { name: organizers[0].name, role: "Organizer", city: organizers[0].city, joined: "Mar 2023", status: "active" },
  { name: organizers[1].name, role: "Organizer", city: organizers[1].city, joined: "Jun 2023", status: "active" },
  { name: organizers[2].name, role: "Organizer", city: organizers[2].city, joined: "Sep 2023", status: "pending" },
  { name: "Esi Badu", role: "Attendee", city: "Accra", joined: "Feb 2024", status: "active" },
  { name: "Nii Ofori", role: "Attendee", city: "Kumasi", joined: "Mar 2024", status: "active" },
];

export default function AdminUsersPage() {
  return (
    <DashboardShell
      mode="admin"
      title="Users"
      subtitle="Platform user management"
    >
      <div className="mb-6 grid gap-5 sm:grid-cols-2">
        <StatCard label="Total Users" value="89,240" trend="+8.4%" tone="neon" />
        <StatCard label="New This Week" value="1,240" trend="+12%" tone="neon" />
      </div>

      <ShellCard>
        <div className="mb-5">
          <TextInput value="Search users by name, role, or city..." />
        </div>
        <DataTable
          columns={["Name", "Role", "City", "Joined", "Status", "Actions"]}
          rows={fakeUsers.map((user) => [
            <span key={`${user.name}-name`} className="font-semibold text-[var(--text-primary)]">{user.name}</span>,
            user.role,
            user.city,
            user.joined,
            <StatusPill
              key={`${user.name}-status`}
              tone={user.status === "active" ? "live" : "pending"}
            >
              {user.status}
            </StatusPill>,
            <div key={`${user.name}-actions`} className="flex gap-2">
              <StatusPill tone="draft">View</StatusPill>
              <StatusPill tone="draft">Suspend</StatusPill>
            </div>,
          ])}
        />
      </ShellCard>
    </DashboardShell>
  );
}
