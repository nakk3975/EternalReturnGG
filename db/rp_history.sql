-- Generate per-player chart snapshots from already cached history pages, without API fan-out.
create or replace function public.er_refresh_rp_history()
returns void language sql security invoker set search_path='' as $$
with histories as (
 select regexp_replace(cache_key,'^/v1/user/games/uid/([^?]+).*$', '\1') as uid,g
 from public.er_api_cache c cross join lateral jsonb_array_elements(case when jsonb_typeof(body->'userGames')='array' then body->'userGames' else '[]'::jsonb end) g
 where cache_key like '/v1/user/games/uid/%' and retain_until>now()
), records as (
 select distinct on(uid,g->>'gameId') uid,g from histories
 where (g->>'startDtm')::timestamptz >= (date_trunc('day',now() at time zone 'Asia/Seoul')-interval '6 days') at time zone 'Asia/Seoul'
 and (g->>'startDtm')::timestamptz <=now() and g->>'matchingMode'='3' and jsonb_typeof(g->'mmrAfter')='number'
 order by uid,g->>'gameId'
)
insert into public.er_api_cache(cache_key,body,fetched_at,expires_at,retain_until)
select '/v2/user/rp-summary/'||uid,jsonb_build_object('updatedAt',now(),'userGames',jsonb_agg(jsonb_build_object('gameId',g->'gameId','matchingMode',3,'seasonId',g->'seasonId','startDtm',g->'startDtm','mmrAfter',g->'mmrAfter','mmrGain',g->'mmrGain'))),now(),now()+interval '5 minutes',now()+interval '1 day'
from records group by uid
on conflict(cache_key) do update set body=excluded.body,fetched_at=excluded.fetched_at,expires_at=excluded.expires_at,retain_until=excluded.retain_until;
$$;
revoke all on function public.er_refresh_rp_history() from public,anon,authenticated;
grant execute on function public.er_refresh_rp_history() to service_role;
select cron.schedule('ergg-rp-history','*/5 * * * *','select public.er_refresh_rp_history();');
select public.er_refresh_rp_history();
