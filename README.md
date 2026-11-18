# Night City Events — Indy

Unofficial, MIT-licensed community calendar for Indianapolis-area Cyberpunk TCG players. React + Vite + TypeScript + Tailwind; static JSON data, no browsing authentication, backend, scraper, or Discord bot.

## Current launch state

The real catalog (`src/data/events.json`) contains the approved Books & Brews tournament. Fictional fixtures live separately in `src/data/samples.json` and can only be viewed at `http://127.0.0.1:5173/night-city-events-indy/?demo=1` during development. Production ignores `?demo=1`. The real-catalog loader/build reject sample records, and samples can never have confirmed status. The build also rejects known fixture identities relabeled `sample: false`, placeholder source/registration URLs, and imports of review/demo/test content.

The current active copy is **`/home/agentdev/projects/night-city-events`**, owned by `agentdev`. The original under `/root` is an unchanged pre-Phase-2 copy; do not continue development there. See [workspace and launch instructions](docs/LAUNCH.md).

Phase 3A public-source research is recorded in [the event source report](docs/EVENT-SOURCE-REPORT.md), with [results and validation](docs/PHASE-3A-REPORT.md). Incomplete leads remain in the report. Phase 3B rechecks the four urgent leads and supports optional end times; see [the Phase 3B report](docs/PHASE-3B-REPORT.md). The [review-only candidate file](docs/review/events.candidates.json) now contains one organizer-confirmed Carmel occurrence with an unknown end. It is not loaded by the application; the production catalog is maintained separately.

## Development

Use a non-root account and Node.js 22 or newer (local checks used Node 26.8.1).

```sh
npm ci
npm run dev
npm test
npm run typecheck
npm run check:catalog
npm run build
npm run preview
```

Development and preview bind to **127.0.0.1**, not all network interfaces. Do not override the host or configure a public tunnel for ordinary local work. Preview serves `dist/`. Neither command publishes anything.

## Architecture

- `src/main.tsx`: responsive list/month views, date/type/venue/radius/search filters, accessible native dialogs, details and submission download.
- `src/events.ts`: Zod event schema, Indianapolis date/time helpers, Haversine distance, newest-ID revisions and ICS generation.
- `src/catalog.ts`: fail-closed loading, sample segregation, 14-day verification freshness and moderator duplicate candidates.
- `src/config.ts`: optional public community submission destination; currently unset.
- `src/data/events.json`: real published records; `[]` is valid.
- `src/data/samples.json`: clearly fictional development fixtures, not publishable events.
- `scripts/check-catalog.ts`: validates catalog and reports candidate duplicates without auto-merging.
- `.github/workflows/checks.yml`: tests, type checking and production build; no deployment.
- `.github/workflows/pages.yml`: separate, manually dispatched Pages build/deployment from the repository's default branch; only `dist/` is uploaded.
- `scripts/check-pages-artifact.mjs`: verifies the Pages asset prefix and excludes unexpected files, demo records and unpromoted candidate IDs from `dist/`.

Distance is straight-line miles from downtown Indianapolis (39.7684, −86.1581), default 40 miles. Date grouping and display use `America/Indiana/Indianapolis`, independent of the device timezone. Calendar layout can scroll horizontally within its region on small screens.

## Event data and moderation

Read the [verification policy](docs/VERIFICATION.md) before adding real listings. Prefer public organizer-confirmed evidence. Do not scrape authenticated pages or private Discord channels, publish private attendee information, or assume Melee API access.

Each record needs a stable ID, name/type, public venue/address and coordinates, an offset-bearing start and optional end, Indianapolis timezone, format, registration/source HTTP(S) URLs, status, sample flag, description, and `updatedAt`. Entry fee is optional. Omit unknown ends; never infer a duration. Missing an end does not by itself change occurrence confirmation. `lastVerified` is a full ISO timestamp with offset, or `null` for never-verified unverified events; confirmed records require a timestamp. Older date-only verification fields must be migrated honestly from actual evidence, not assigned an invented check time.

Confirmation becomes stale after 14 days and is visibly marked out of date. Cards show verification timestamps and source links; details show the full source URL. Known-end records leave Upcoming at their end. Unknown-end records, including cancellations, remain through the Indianapolis start date; after start they show an explicit warning and leave Upcoming the next local day. This is a visibility rule, not an assumed end. The UI refreshes every 30 seconds and on focus/visibility changes. Duplicate revisions retain the newest timestamp; cancellation wins timestamp ties. Cross-ID duplicate suggestions are advisory and require manual review.

Invalid JSON fails the build. Structurally invalid data is rejected by the build check and has an explanatory runtime error state. No partial catalog is shown when validation fails.

## Community submissions without a backend

The JSON form **only downloads a local file**. It does not send, save online, or publish anything. There is currently no configured inbox or public submission endpoint; the interface says so explicitly.

Recommended low-maintenance option: once the existing repository is identified and approved for use, use the included [GitHub issue form](.github/ISSUE_TEMPLATE/event.yml). Contributors submit a public organizer URL and basic facts; moderators verify and edit JSON through GitHub's web editor or use [the Codex event-update workflow](docs/UPDATING-EVENTS.md). Configure its real URL in `src/config.ts` after the destination is verified. No repository or other public resource has been created by this preparation. GitHub requires an account to submit issues, but calendar browsing remains account-free.

The JSON download remains a fallback for sharing through an existing moderator contact. Before publishing a submission, resolve Indianapolis wall times to explicit offsets, supply checked coordinates/verification metadata, assign an ID and review duplicates. Unreviewed submissions are not catalog-ready.

## Calendar downloads

ICS requires a known end: unknown-end downloads are disabled with an explanation and the generator rejects them, including cancellations. No duration is invented. Eligible ICS exports UTC instants, escaped/folded text, stable UIDs and tentative/confirmed/cancelled status. Fictional samples are labeled and cannot export confirmed status. Retain IDs when updating or cancelling. Downloads are not live subscriptions; import/update behavior varies between calendar clients.

## Static deployment

Publish from `main` using the **Publish GitHub Pages** workflow after selecting **GitHub Actions** under **Settings → Pages**. The workflow requires the verified commit SHA and uploads only the production artifact.

Build command: `npm run build`; output: `dist/`; CI Node: 22. Vite uses the explicit `/night-city-events-indy/` base for a project Pages site. After building, `npm run preview` serves `http://127.0.0.1:4173/night-city-events-indy/`. Upload only `dist/`. No secrets, server routes, database or SPA redirect rules are required. Ordinary pushes/PRs run checks and do not publish; publishing requires a separate manual workflow dispatch. `public/` copying and source maps are disabled. A production build refuses development mode or `NODE_ENV=development`.

Tests cover schema rejection, real/sample separation, empty/invalid catalogs, stale verification boundaries, filtering, timezone grouping, distance, duplicate candidates, cancellation revisions and ICS output. Native modal semantics, skip navigation, visible focus and reduced-motion styles are included. Visual mobile, keyboard and assistive-technology checks remain manual requirements; automated tests do not prove full accessibility.

Unofficial fan/community project, not affiliated with Cyberpunk TCG creators or rights holders. No official artwork or logos are bundled; skyline artwork is original CSS.
