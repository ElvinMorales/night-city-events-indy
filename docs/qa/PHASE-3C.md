# Phase 3C local QA and remaining human checks

Run as `agentdev`, November 7, 2026, on loopback only. The candidate is injected into the local browser in memory, not written to the real catalog. The browser clock is fixed at November 7, 16:00 UTC to make the November 10 fixture repeatable. Source rechecks use actual wall-clock timestamps instead. Browser locale/timezone testing uses Tokyo while event times remain Indianapolis.

## Reproducing browser checks

Use the installed project dependencies. Start `npm run dev -- --port 5177` and, after `npm run build`, `npm run preview -- --port 4177` in separate terminals. Both bind to `127.0.0.1`.

The optional [browser harness](../../scripts/phase-3c-browser-check.mjs) uses an external Playwright installation with Chromium and axe-core 4.10.3. Supply paths to those tools, not credentials:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
AXE_PATH=/absolute/path/to/axe-core/axe.min.js \
QA_OUTPUT=/tmp/night-city-phase-3c \
node scripts/phase-3c-browser-check.mjs
```

It writes JSON results and local screenshots to `QA_OUTPUT`. No project runtime dependency was added. Retained [browser results](phase-3c-browser-results.json) include the browser version, check time, assertions and axe findings. All automated checks have limits: axe's incomplete results are review items, not passes. A headless browser does not certify screen-reader announcements or real touch usability.

## Recorded result

Final Chromium 156.0.8078.4 run: **13 assertion groups passed** and **zero axe violations across 12 states** (list, details, month, filtered-empty, submission, About, mobile list/details, cancellation, empty catalog, invalid catalog, production empty). Contrast evaluation remains incomplete in 11 states; inspect the retained node-level results. Initial runs found a nested filter landmark, lost dialog-trigger focus and an out-of-order error heading; those were corrected and the full run passed afterwards. The native dialog prevents focus reaching background controls; Chromium can still traverse browser chrome.

All original **29 unit tests**, typecheck, catalog validation and the final production build passed. No page overflow was observed at 320/375/390/768 pixels; desktop/mobile one-event screenshots were visually inspected. Source rechecks and QA use separate clocks as described above.

## Calendar-client imports — not performed here

No Thunderbird, Evolution, khal, Apple Calendar, or Outlook client is installed in this Linux environment. No desktop display or screen reader is configured. Available connected Google Calendar tools create/update calendar events but do not import ICS files, so they cannot verify importer behavior. No connected calendar was modified. Parser tests and successful downloads are not actual client imports.

Four **synthetic, non-event** files in [calendar/](calendar/) were generated with the existing application `ics()` function for the next manual test session. They are outside the application source and must never enter the catalog. `sample: false` was used only inside the generation fixture to exercise the generator's `CONFIRMED` output; these are not evidence-verified events. Every title/description identifies the test.

Use a disposable **local test calendar** with notifications disabled; record client/version, timezone, observed time/status/source, and whether a duplicate or update occurs. Delete the test calendar afterwards. Do not import into a shared or production calendar.

| Fixture | Expected observation |
| --- | --- |
| [winter-confirmed.ics](calendar/winter-confirmed.ics) | November 13, 2026, 6–9 PM Indianapolis; UTC 23:00 Nov 13–02:00 Nov 14; confirmed status if client exposes it; source URL in description |
| [winter-tentative.ics](calendar/winter-tentative.ics) | Same winter times, separate UID, tentative status if exposed |
| [winter-cancelled.ics](calendar/winter-cancelled.ics) | Import after winter-confirmed; identical UID, later DTSTAMP, CANCELLED. Record whether client updates, ignores, duplicates, or removes the existing event; no universal behavior is promised |
| [summer-confirmed.ics](calendar/summer-confirmed.ics) | July 13, 2027, 6–9 PM Indianapolis (UTC 22:00 July 13–01:00 July 14), verifying the summer offset |

Repeat in the community's intended clients (at least one actual client, ideally Google Calendar and an Outlook/Apple/Thunderbird client). Inspect source, description, start/end and DST; then test re-import and cancellation. A cancelled import must not be presented as an automatic live update. Downloads have no subscription or notification channel. The generator has no `METHOD`/`SEQUENCE` update contract; retain this limitation until actual client behavior is measured.

**The Carmel candidate has no end and no ICS fixture.** Its disabled button and visible explanation are the correct result. No duration has been invented.

## Human checks still open before public launch

- Use NVDA/Firefox, VoiceOver/Safari, or another intended screen-reader/browser pairing: confirm the dialog heading, live result count, filter/form errors, status and unknown-end explanation are understandable. Check focus after Escape and Close. ARIA attributes and axe results alone do not prove spoken output.
- Check text contrast where axe reports an incomplete result (gradients, overlapping/decorative content, disabled controls), visible focus, readability at 200%/400% zoom, and forced-colors/high-contrast mode. Run the main keyboard paths in a second browser engine.
- Test real touch targets and nested calendar scrolling on a phone/tablet. Automated viewport checks do not prove touch usability.
- Run the actual calendar imports above. Until then, known-end export interoperability is unverified. This does not prevent feedback on the candidate, whose export is disabled.
- After authorization and endpoint configuration, submit a clearly labelled test issue through the actual GitHub form, including the cancellation option; verify the maintainer can receive/triage it. No endpoint exists now.
- After a future authorized deployment, check HTTPS, asset paths, the real submission link, catalog/empty/error behavior, and that `?demo=1` reveals no samples. No deployed-site check was possible in this local-only phase.

Do not mark any of these manual checks complete from automated tests or source review alone.
