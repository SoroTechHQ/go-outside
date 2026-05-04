import { DashboardShell } from '../dashboard-shell'
import { SectionBlock } from '../dashboard-primitives'
import { SettingsList, CategoriesTable } from '../SettingsEditor'
import { supabaseAdmin } from '../../lib/supabase'

export async function PlatformSettingsPage() {
  const [{ data: settings }, { data: categories }] = await Promise.all([
    supabaseAdmin
      .from('platform_settings')
      .select('key, value, description'),
    supabaseAdmin
      .from('categories')
      .select('id, name, slug, icon_key, is_active, sort_order')
      .order('sort_order'),
  ])

  return (
    <DashboardShell
      mode="admin"
      title="Platform Settings"
      subtitle="Feature flags, categories and configuration."
    >
      <div className="space-y-8">
        <SectionBlock title="Settings" subtitle="Platform-wide configuration keys.">
          {!settings?.length ? (
            <p className="text-sm text-[var(--text-secondary)]">No settings configured yet.</p>
          ) : (
            <SettingsList settings={settings} />
          )}
        </SectionBlock>

        <SectionBlock title="Categories" subtitle="Event categories and their active status.">
          {!categories?.length ? (
            <p className="text-sm text-[var(--text-secondary)]">No categories found.</p>
          ) : (
            <CategoriesTable categories={categories} />
          )}
        </SectionBlock>
      </div>
    </DashboardShell>
  )
}
