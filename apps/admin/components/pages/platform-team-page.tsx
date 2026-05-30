import { supabaseAdmin } from '../../lib/supabase';
import { DashboardShell } from '../dashboard-shell';
import { TeamRoleEditor } from '../TeamRoleEditor';

export async function PlatformTeamPage() {
  const { data: admins } = await supabaseAdmin
    .from('users')
    .select('clerk_id, email, first_name, last_name, username, role, avatar_url, created_at')
    .eq('role', 'admin')
    .order('created_at', { ascending: true });

  return (
    <DashboardShell
      mode="admin"
      title="Team"
      subtitle="Manage admin and organizer access across the platform."
    >
      <div className="max-w-3xl">
        <TeamRoleEditor admins={admins ?? []} />
      </div>
    </DashboardShell>
  );
}
