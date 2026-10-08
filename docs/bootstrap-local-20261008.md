# Bootstrap CSS local asset migration — 2026-10-08

Base: main `2649d6dc82be251d1982111acaa00f85ed3a1087`.
Related: https://github.com/nakk3975/EternalReturnGG/issues/6

## Scope and dependency audit

`main.jsp`, `explorer.jsp` (all 11 menu shells), and `usersearch.jsp`
loaded Bootstrap 4.0.0 CSS from jsDelivr. The shared header uses `d-flex`,
`justify-content-between`, `align-items-center`, `p-2`, `ml-2`, `text-white`,
`nav`, `nav-item`, `nav-link`, `font-weight-bold`; the footer uses flex and
`text-secondary`. Home also uses flex/alignment utilities. Explorer and
player content are predominantly custom CSS, but Bootstrap Reboot still
provides element defaults for headings, lists, forms, tables and images.
Removing Bootstrap or purging solely from JSP class names would change
shared navigation or dynamically rendered content.

All three links now load `/static/vendor/bootstrap-4.0.0/bootstrap.min.css`
before custom styles. The original distribution was checked against the
old JSP SHA-384 SRI value. CSS selectors/declarations are unchanged. Only
the unused source-map comment was removed. MIT license, copyright and
provenance/hash are included in the vendor directory. No new Bootstrap JS
or external CSS subresources are introduced. No latency claim is based on
this change alone.

## Reproduce browser checks

```sh
npm ci
npx playwright install --with-deps chromium
bash gradlew bootWar
ER_COLLECTOR_ENABLED=false java -jar build/libs/ergg.war --spring.profiles.active=render --server.port=10000
# In a second terminal:
ER_SITE_URL=http://127.0.0.1:10000 npm run verify:bootstrap
```

The checker uses actual WAR-rendered JSPs, shared deterministic API data,
and deterministic external image fixtures. It recreates an old-CDN-link
baseline with the exact pinned CSS fulfilled by Playwright, then checks
the unchanged local path with external stylesheet hosts blocked. It does
not depend on jsDelivr being reachable. The packaged local CSS must return
HTTP 200 with bytes matching the checked-in asset and readable CSS rules.
All 11 menus plus player details are checked at 1440×1000 and 390×844,
in light/dark themes (48 paired comparisons / 96 navigations).
Exact element geometry and computed styles are compared; PNG comparison
uses pixelmatch threshold 0.1, excluding anti-aliasing differences, and
requires zero differing pixels under that rule. Baseline reproduction
validates CSS cascade/layout equivalence, not historical CDN reliability.
CI runs the checker after the existing website-page checks.

## Results in this environment

- Playwright 1.63.0 + Chromium 153.0.8010.0: 48/48 paired comparisons passed.
- Changed pages: local CSS HTTP 200, matching packaged bytes, readable rules;
  zero CSS request failures and zero external stylesheet requests in all 48.
- Exact geometry/computed styles matched; screenshot differing pixels = 0
  under the documented anti-aliasing/threshold rule.
- Existing website-page browser check: 12/12 pages passed, including filter,
  statistics sort, route-planner picker and multi-search actions.
- JS regression: 24/24 test files passed.
- Executable WAR build passed (`bootWar -x prepareOcr`; unrelated OCR asset
  preparation skipped for this CSS-only browser check).
- Java tests: 16 passed, 7 could not run successfully because Mockito's
  inline ByteBuddy agent cannot attach in this runtime. They are not marked
  passed. No Java/application logic was modified.
- Standard Playwright Chromium download returned an invalid/truncated ZIP.
  A Chromium 153 binary packaged through npm was used locally; the CI job
  retains the standard Playwright browser installation.

## Limits of timing evidence

The 2026-09-30 production measurement remains the last comparable result:
home cold p95 2675ms, warm p95 1199ms; cold CSS failures 20/20 but page
readiness 20/20. That is not evidence that CSS failure caused latency.
This branch has not been deployed, so before/after **production** network
error rates and screenComplete p50/p95 are not yet measured. Local API and
image fixtures must not be presented as production improvement.
After deployment, rerun the existing browser-performance workflow with
`menu=home`, `runs=20`, and `render_cold=false`; preserve artifacts and
confirm the deployed commit. Browser cold means a fresh browser context.
Render sleep startup still requires independently verified idle/sleep
logs and a separate first request; it is not tested by this CSS checker.
API/cache/Supabase/official-API bottlenecks remain separate open work.
