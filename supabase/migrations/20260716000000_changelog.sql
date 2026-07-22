-- Audit log of create/update/delete actions across a user's data.
-- Apply via the Supabase MCP (apply_migration) or the SQL editor.

create table if not exists public.changelog (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entity text not null check (
    entity in ('transaction', 'budget', 'saving', 'goal', 'holding', 'profile')
  ),
  action text not null check (action in ('created', 'updated', 'deleted')),
  summary text not null,
  created_at timestamptz not null default now()
);

create index if not exists changelog_user_created_idx
  on public.changelog (user_id, created_at desc);

alter table public.changelog enable row level security;

-- Users can read and append their own entries. No update/delete policy: the
-- log is append-only from the app's perspective.
create policy "changelog_select_own"
  on public.changelog for select
  using (auth.uid() = user_id);

create policy "changelog_insert_own"
  on public.changelog for insert
  with check (auth.uid() = user_id);
