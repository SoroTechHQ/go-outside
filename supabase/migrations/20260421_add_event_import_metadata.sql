create table if not exists public.event_import_runs (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_file text,
  notes text,
  dry_run boolean not null default false,
  imported_count integer not null default 0,
  skipped_count integer not null default 0,
  failed_count integer not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.event_import_sources (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  import_run_id uuid references public.event_import_runs(id) on delete set null,
  source_platform text not null,
  source_url text not null,
  source_event_slug text,
  source_organizer_name text,
  source_organizer_url text,
  source_payload jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'superseded', 'ignored')),
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_platform, source_url)
);

create index if not exists idx_event_import_sources_event_id
  on public.event_import_sources (event_id);

create index if not exists idx_event_import_sources_platform_slug
  on public.event_import_sources (source_platform, source_event_slug);

create table if not exists public.event_image_assets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  import_run_id uuid references public.event_import_runs(id) on delete set null,
  bucket_name text not null,
  object_path text not null,
  public_url text not null,
  source_url text,
  kind text not null default 'gallery' check (kind in ('banner', 'gallery')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (bucket_name, object_path),
  unique (event_id, kind, sort_order)
);

create index if not exists idx_event_image_assets_event_id
  on public.event_image_assets (event_id);

create table if not exists public.event_import_candidates (
  id uuid primary key default gen_random_uuid(),
  requested_title text not null,
  requested_source_file text,
  notes text,
  candidate_payload jsonb not null default '{}'::jsonb,
  matched_event_id uuid references public.events(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'matched', 'imported', 'skipped')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (requested_title)
);

create index if not exists idx_event_import_candidates_status
  on public.event_import_candidates (status);
