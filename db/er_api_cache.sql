-- Server-only response snapshots. Applied to the EternalReturnGG Supabase project.
create table if not exists public.er_api_cache (
    cache_key text primary key check (length(cache_key) <= 512),
    body jsonb not null check (jsonb_typeof(body) = 'object'),
    fetched_at timestamptz not null default now(),
    expires_at timestamptz not null,
    retain_until timestamptz not null
);
create index if not exists er_api_cache_retention_idx on public.er_api_cache (retain_until);
alter table public.er_api_cache enable row level security;
revoke all on public.er_api_cache from anon, authenticated;
grant select, insert, update, delete on public.er_api_cache to service_role;
