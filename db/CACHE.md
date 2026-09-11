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
