# Persistent match cache

The Spring server checks memory, then the private Supabase `er_api_cache` table.
Current player pages and rank statistics are fresh for 30 seconds; historical
pages and game details for 24 hours. A stale snapshot is returned immediately
with `_cacheStale`, and a bounded, deduplicated background job refreshes it.
Player screens poll up to five times to show the refreshed snapshot without
resetting expanded or paged match lists. DB outages fall back to the official API.
Snapshots are retained for seven days; indexed expired-row cleanup runs on writes.

Render requires `ER_CACHE_URL` and `ER_CACHE_TOKEN`. The Edge Function verifies
the token's SHA-256 fingerprint before every operation; its database credential
comes from Supabase's built-in server environment. The raw cache token must never
be committed. Rotation requires replacing the function fingerprint and Render
token together. No browser, anon, or authenticated role has table privileges.

Deploy `supabase/functions/er-cache/index.ts` with `verify_jwt=false` because
this endpoint uses its own server credential check. Do not remove that check.
The reviewed schema is in `db/er_api_cache.sql`.

## Season skin aggregation

`/er/user/season-skin` schedules a background season scan. Checkpoints (cursor,
deduplicated game IDs, per-character skin counts) are saved under
`/v2/user/skin-summary/{user}/{season}` in the same private cache table.
A single worker spaces pagination requests and saves every five pages. It
resumes saved scans and stops incremental refresh at already counted matches.
Ranked-game totals are cross-checked against season stats: incomplete coverage
or missing skin fields never replaces the default hero skin with a false winner.
Ties use the lowest skin code. Completed summaries refresh after five minutes.

## Collected-match statistics and weekly charts

`character_statistics.sql` aggregates only cached full `/v1/games/` responses, not individual player pages. The public UI explicitly identifies these as a small collected sample, not server-wide statistics. It reports characters, skill orders, tactical skills, traits, and final equipment. The SQL job runs every five minutes and writes `/v2/data/statistics` through the existing cache table.

`rp_history.sql` deduplicates cached player history pages by player and game ID and writes seven-day RP snapshots. The browser combines the snapshot with newly loaded games and shows each Korean calendar day's last RP. Missing days are not fabricated. These charts reflect collected history, which may still be incomplete for a newly searched player.

Both functions use invoker privileges, deny anonymous/authenticated execution, and never expose player identifiers in the aggregate statistics. The existing `er-cache` Edge Function is unchanged; no additional public privileged endpoint is needed. JavaScript behavior checks: `node src/test/js/catalog.test.cjs` and `node src/test/js/player.test.cjs`.

Statistics filters use day (Asia/Seoul), versionSeason, matchingMode, and pre-game RP buckets. The existing five-minute job publishes them with legacy summaries. Clients merge sums using observation counts, including missing-RP handling. Non-ranked modes have no ranked tier. Current RP bands do not distinguish Mithril/Demigod/Eternity without historical ladder rank. Season-wide means retained matches only; no collector or archival retention change is included.
