# Bootstrap 4.0.0 CSS

Source: https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/css/bootstrap.min.css
Upstream tag: https://github.com/twbs/bootstrap/tree/v4.0.0
License: MIT (see LICENSE; upstream copyright banner retained).

The original download was verified against the existing JSP SRI SHA-384:
`Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm`.
Only the unused `sourceMappingURL=bootstrap.min.css.map` comment was removed.
No selectors or declarations were changed. The complete distribution is retained
because shared header utility/nav classes and Reboot affect all three JSPs,
including dynamically rendered content, headings, forms and tables.

Vendored SHA-256: `f9f1ce2a9079ebe7445ff10ac12b8f049abc43c499f4978297ec5dd23283a2e5`.

Serve via `/static/vendor/bootstrap-4.0.0/bootstrap.min.css`, before custom CSS.
The versioned directory avoids stale cached content on future version upgrades.
No Bootstrap JS, fonts or CSS subresources are fetched by this asset.

Verification: start the executable WAR with the render profile (collector disabled), then run
`ER_SITE_URL=http://127.0.0.1:10000 npm run verify:bootstrap`.
External images use deterministic fixtures. PNG comparisons use pixelmatch
threshold 0.1 with anti-aliasing differences excluded, alongside exact DOM
geometry and computed-style comparisons.
This compares actual JSP rendering against a controlled old CDN-link baseline
with identical CSS, across all 11 menus and player details, desktop/mobile and
light/dark. The changed path must return HTTP 200, expose CSS rules and issue
zero external stylesheet requests even when external hosts are blocked.
This fixture-based check is not a production timing measurement.
