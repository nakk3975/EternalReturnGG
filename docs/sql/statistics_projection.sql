-- Read only projections of the existing statistics snapshot. Service-role only.
create or replace function public.er_statistics_snapshot(p_scope text, p_character integer default 0)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare
  source jsonb;
  buckets jsonb;
  fetched timestamptz;
  expiry timestamptz;
  builds jsonb := '[]'::jsonb;
  items jsonb := '[]'::jsonb;
begin
  if p_scope not in ('overview','items','character') or p_character < 0 or p_character > 10000 then
    raise exception 'Invalid statistics scope';
  end if;
  -- Materialize the TOAST-compressed JSON once instead of detoasting on every field access.
  select body || '{}'::jsonb, fetched_at, expires_at into source, fetched, expiry
    from public.er_api_cache where cache_key='/v2/data/statistics' and retain_until > now();
  if source is null then return null; end if;
  buckets := source->'buckets';
  if p_scope='character' then
    select coalesce(jsonb_agg(value),'[]'::jsonb) into builds
      from jsonb_array_elements(buckets->'builds') where (value->>'character')::integer=p_character;
  elsif p_scope='items' then
    items := coalesce(buckets->'items','[]'::jsonb);
  end if;
  return jsonb_build_object('fetched_at',fetched,'expires_at',expiry,'body',jsonb_build_object(
    'from',source->'from','updatedAt',source->'updatedAt','matches',source->'matches',
    'rows',source->'rows','builds','[]'::jsonb,'items','[]'::jsonb,
    'buckets',jsonb_build_object('from',buckets->'from','updatedAt',buckets->'updatedAt',
      'matches',buckets->'matches','rows',buckets->'rows','builds',builds,'items',items)));
end;
$$;
revoke all on function public.er_statistics_snapshot(text,integer) from public, anon, authenticated;
grant execute on function public.er_statistics_snapshot(text,integer) to service_role;
