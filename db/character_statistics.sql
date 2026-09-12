-- Aggregates only full match responses; personal history pages would bias the sample.
create or replace function public.er_character_statistics()
returns jsonb language sql stable security invoker set search_path = '' as $$
with entries as (
 select g from public.er_api_cache c
 cross join lateral jsonb_array_elements(case when jsonb_typeof(c.body->'userGames')='array' then c.body->'userGames' else '[]'::jsonb end) g
 where c.cache_key like '/v1/games/%' and c.retain_until > now()
), recent as (
 select g from entries where (g->>'startDtm')::timestamptz >= (date_trunc('day',now() at time zone 'Asia/Seoul') - interval '6 days') at time zone 'Asia/Seoul'
 and (g->>'startDtm')::timestamptz <= now() and (g->>'gameRank')::int > 0
), grouped as (
 select (g->>'characterNum')::int as character, (g->>'matchingMode')::int as mode,
 (g->>'seasonId')::int as season, count(*) as games,
 count(*) filter(where (g->>'gameRank')::int=1) as wins,
 count(*) filter(where (g->>'gameRank')::int<=3) as top3,
 round(avg((g->>'gameRank')::numeric),2) as rank,
 round(avg((g->>'damageToPlayer')::numeric),0) as damage,
 round(avg((g->>'playerKill')::numeric),2) as kills,
 round(avg((g->>'mmrGain')::numeric),2) as rp
 from recent group by 1,2,3
), builds as (
 select (g->>'characterNum')::int as character, (g->>'matchingMode')::int as mode,
 (g->>'seasonId')::int as season, kind, value, count(*) as games,
 count(*) filter(where (g->>'gameRank')::int=1) as wins
 from recent cross join lateral (values
 ('tactical',g->'tacticalSkillGroup'),
 ('traits',jsonb_build_object('core',g->'traitFirstCore','first',g->'traitFirstSub','second',g->'traitSecondSub')),
 ('skills',g->'skillOrderInfo')
 ) as b(kind,value) where value is not null and value <> 'null'::jsonb
 group by 1,2,3,4,5
), items as (
 select e.value as code,(g->>'matchingMode')::int as mode,(g->>'seasonId')::int as season,count(*) as games,
 count(*) filter(where (g->>'gameRank')::int=1) as wins,
 count(*) filter(where (g->>'gameRank')::int<=3) as top3, round(avg((g->>'gameRank')::numeric),2) as rank
 from recent cross join lateral jsonb_each(case when jsonb_typeof(g->'equipment')='object' then g->'equipment' else '{}'::jsonb end) e
 where e.value <> '0'::jsonb group by 1,2,3
)
select jsonb_build_object('updatedAt' ,now(),'matches',(select count(distinct g->>'gameId') from recent),
 'from',(date_trunc('day',now() at time zone 'Asia/Seoul') - interval '6 days') at time zone 'Asia/Seoul',
 'builds',coalesce((select jsonb_agg(to_jsonb(builds)) from builds),'[]'::jsonb),
 'items',coalesce((select jsonb_agg(to_jsonb(items)) from items),'[]'::jsonb),
 'rows',coalesce((select jsonb_agg(to_jsonb(grouped)) from grouped),'[]'::jsonb));
$$;
revoke all on function public.er_character_statistics() from public, anon, authenticated;
grant execute on function public.er_character_statistics() to service_role;


-- Filter dimensions are aggregated without exposing participant identifiers.
create or replace function public.er_statistics_buckets()
returns jsonb language sql stable security invoker set search_path = '' as $$
with entries as (
 select g from public.er_api_cache c
 cross join lateral jsonb_array_elements(case when jsonb_typeof(c.body->'userGames')='array' then c.body->'userGames' else '[]'::jsonb end) g
 where c.cache_key like '/v1/games/%' and c.retain_until > now()
), recent as (
 select g, ((g->>'startDtm')::timestamptz at time zone 'Asia/Seoul')::date as day, coalesce((g->>'versionSeason')::int,(g->>'seasonId')::int) as display_season, case when g->>'matchingMode'<>'3' or g->>'mmrBefore' is null then -1 when (g->>'mmrBefore')::numeric>=7600 then 7 when (g->>'mmrBefore')::numeric>=6400 then 6 when (g->>'mmrBefore')::numeric>=5000 then 5 when (g->>'mmrBefore')::numeric>=3600 then 4 when (g->>'mmrBefore')::numeric>=2400 then 3 when (g->>'mmrBefore')::numeric>=1400 then 2 when (g->>'mmrBefore')::numeric>=600 then 1 else 0 end as tier from entries where (g->>'startDtm')::timestamptz <= now() and (g->>'gameRank')::int > 0
), grouped as (
 select (g->>'characterNum')::int as character, (g->>'matchingMode')::int as mode,
 display_season as season, day, tier, count(*) as games,
 count(*) filter(where (g->>'gameRank')::int=1) as wins,
 count(*) filter(where (g->>'gameRank')::int<=3) as top3,
 avg((g->>'gameRank')::numeric) as rank, count(g->>'gameRank') as rankCount,
 avg((g->>'damageToPlayer')::numeric) as damage, count(g->>'damageToPlayer') as damageCount,
 avg((g->>'playerKill')::numeric) as kills, count(g->>'playerKill') as killsCount,
 avg((g->>'mmrGain')::numeric) as rp, count(g->>'mmrGain') as rpCount
 from recent group by 1,2,3,4,5
), builds as (
 select (g->>'characterNum')::int as character, (g->>'matchingMode')::int as mode,
 display_season as season, day, tier, kind, value, count(*) as games,
 count(*) filter(where (g->>'gameRank')::int=1) as wins
 from recent cross join lateral (values
 ('tactical',g->'tacticalSkillGroup'),
 ('traits',jsonb_build_object('core',g->'traitFirstCore','first',g->'traitFirstSub','second',g->'traitSecondSub')),
 ('skills',g->'skillOrderInfo')
 ) as b(kind,value) where value is not null and value <> 'null'::jsonb
 group by 1,2,3,4,5,6,7
), items as (
 select e.value as code,(g->>'matchingMode')::int as mode,display_season as season, day, tier,count(*) as games,
 count(*) filter(where (g->>'gameRank')::int=1) as wins,
 count(*) filter(where (g->>'gameRank')::int<=3) as top3, avg((g->>'gameRank')::numeric) as rank, count(g->>'gameRank') as rankCount
 from recent cross join lateral jsonb_each(case when jsonb_typeof(g->'equipment')='object' then g->'equipment' else '{}'::jsonb end) e
 where e.value <> '0'::jsonb group by 1,2,3,4,5
)
select jsonb_build_object('updatedAt' ,now(),'matches',(select count(distinct g->>'gameId') from recent),
 'from',(date_trunc('day',now() at time zone 'Asia/Seoul') - interval '6 days') at time zone 'Asia/Seoul',
 'builds',coalesce((select jsonb_agg(to_jsonb(builds)) from builds),'[]'::jsonb),
 'items',coalesce((select jsonb_agg(to_jsonb(items)) from items),'[]'::jsonb),
 'rows',coalesce((select jsonb_agg(to_jsonb(grouped)) from grouped),'[]'::jsonb));
$$;
revoke all on function public.er_statistics_buckets() from public, anon, authenticated;
grant execute on function public.er_statistics_buckets() to service_role;

-- Reuse the existing authenticated cache transport. No new public endpoint or credentials.
create extension if not exists pg_cron;
select cron.schedule('ergg-character-statistics', '*/5 * * * *', $job$
 insert into public.er_api_cache(cache_key,body,fetched_at,expires_at,retain_until)
 values('/v2/data/statistics',public.er_character_statistics() || jsonb_build_object('buckets',public.er_statistics_buckets()),now(),now()+interval '5 minutes',now()+interval '1 day')
 on conflict(cache_key) do update set body=excluded.body,fetched_at=excluded.fetched_at,expires_at=excluded.expires_at,retain_until=excluded.retain_until;
$job$);
insert into public.er_api_cache(cache_key,body,fetched_at,expires_at,retain_until)
values('/v2/data/statistics',public.er_character_statistics() || jsonb_build_object('buckets',public.er_statistics_buckets()),now(),now()+interval '5 minutes',now()+interval '1 day')
on conflict(cache_key) do update set body=excluded.body,fetched_at=excluded.fetched_at,expires_at=excluded.expires_at,retain_until=excluded.retain_until;
