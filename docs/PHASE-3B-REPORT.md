# Phase 3B — candidate verification and schema review

Worked locally as `agentdev` in `/home/agentdev/projects/night-city-events`, on branch `phase-3b-verification` from Phase 3A commit `5372b90`. Research occurred November 7, 2026 UTC in two sessions (01:44–01:45 and 13:00–13:02); timestamps below are actual checks, not crawl dates. Earlier Phase 3A reports remain historical snapshots; this report and the updated verification policy supersede their end-required and empty-review-array conclusions.

## Decisions

- **Publishable as a listing after normal approval/freshness review: one** — Carmel, November 10. Organizer-confirmed occurrence, unknown end; list/month/details ready, ICS unavailable. Stored only in [`review/events.candidates.json`](review/events.candidates.json).
- **Awaiting occurrence confirmation: three** — Mage's November 7, Good Games November 8, Bulldog November 12. These have evidence gaps beyond missing ends. No schema-shaped placeholders were made for them.
- **Rejected as corroboration:** Good Games' Riftbound Nexus Nights and Mage's Magic prerelease are different games, not substitutes for Cyberpunk evidence. No priority Cyberpunk occurrence was proven cancelled or definitively rejected as nonexistent.
- **Production remains `[]`.** No event promotion, outreach, registration, external commitment, deployment, remote creation or push.

## Prioritized evidence review

### 1. Mage's — November 7

[Original game listing](https://cyberpunktcg.com/stores/9da8f058-8bf2-47ed-879c-016126b3d427), browser check **01:44:25.177Z**, still advertises MAGES CYBERPUNK BRAWL, Saturday November 7 at 1 PM EST, constructed, $10, at 7623 Shelby St, Indianapolis, IN 46227. Its Cyberpunk title and game-site context support game identity. Full occurrence year and end are absent. **2026 remains contextual**, not independently verified from the registration record.

[Melee 495512](https://melee.gg/Tournament/View/495512) returned **403 Forbidden** in an ordinary unauthenticated browser at **01:45:08.050Z** after the web tool could not access it. No bypass attempted.

[Organizer calendar](https://www.magescomics.com/our-events), **01:44:25.176Z**, displayed November 2026 and a November 7 noon Star Trek MTG:UB prerelease with a “+1 more” control. Follow-up at **13:01:36.097Z** did not expose the additional event's details after clicking that control. No Cyberpunk text was exposed in the inspected view. **This is incomplete calendar evidence, not proof of absence or cancellation.** The visible Magic event cannot establish Cyberpunk's schedule. Address agrees. Await organizer/full-year/current-occurrence and registration verification; end can remain unknown.

The game feed also still lists November 28 Brawl 495517 and Showdown 495520 at the same 1 PM start. Keep the Phase 3A manual duplicate/replacement flag; do not choose or merge automatically.

### 2. Good Games — November 8

[Original game listing](https://cyberpunktcg.com/stores/a90753e1-cff0-498b-9ee0-2d1652fa7a84), **01:44:25.171Z**, explicitly says CYBERPUNK TCG WEEKLY TOURNAMENT, Sunday November 8, 2 PM EST, constructed, fee TBD, 111 S Meridian St, Indianapolis, IN 46225. Year/end absent; Cyberpunk identity is explicit at this source. [Melee 460450](https://melee.gg/Tournament/View/460450) returned browser **403** at **01:45:10.311Z**.

[Organizer November calendar](https://www.goodgamesna.com/events/month/2026-11/), **01:44:25.171Z**, exposed no Cyberpunk text. It mixes Indianapolis and Chicago events and collapses some day entries, so omission is not a cancellation finding. [November 8 Nexus Nights](https://www.goodgamesna.com/event/nexus-nights-at-good-games-indianapolis/2026-11-08/) explicitly identifies **Riftbound**, noon–6 PM EST, and the Indianapolis venue; opened via web during the 01:44 research session. The day-summary URL returned 404 through that tool. **Reject Nexus Nights as Cyberpunk corroboration** and do not borrow its end time. Await full-year/current-occurrence/registration verification. The October 25 Cyberpunk historical event is not November evidence.

### 3. Next Level Games Carmel — November 10

[Organizer calendar](https://www.nextlevelgames.store/events?location=carmel), browser **01:44:25.189Z**, rechecked **13:01:37.376Z**, explicitly lists Cyberpunk TCG - Night City Brawl on **Tuesday November 10, 2026 at 6 PM**, Carmel, $11, 1v1 constructed/Swiss/best-of-three. The latest description includes **14560 River Rd, Ste 130, Carmel, IN 46033**, and Tuesday 6 PM text agrees with the dated card. The card's category and game-specific description support Cyberpunk TCG rather than RPG/another game. Browser timezone was Indianapolis; the venue-local November start is **2026-11-10T18:00:00-05:00**. No end appears.

The same public calendar shows an available reservation button on this specific card. It is a usable **registration entry point**, not a separate occurrence permalink or proof of checkout success/guaranteed seats. No button was pressed, cart changed, account used or reservation made. The candidate points both source and registration URLs to this calendar and explains how to find the dated card.

[Official venue record](https://cyberpunktcg.com/stores/11e1fd26-7413-49dc-83fa-d6a9dbdb1fdb), **01:44:25.175Z**, corroborates address/ZIP and supplies the [public map pin](https://www.google.com/maps/dir/?api=1&destination=39.998616%2C-86.034339&destination_place_id=Ei0xNDU2MCBSaXZlciBSZCBzdGUgMTMwLCBDYXJtZWwsIElOIDQ2MDMzLCBVU0EiIxohChYKFAoSCRkS5_BgsRSIEZXMIvVc9R_lEgdzdGUgMTMw), coordinates **39.998616, −86.034339**, about 17.2 straight-line miles from Indy. This is directory/map evidence, not a site visit. Unlinked Melee feed is not contradictory occurrence evidence.

**Confirmed occurrence; listing-ready candidate, not published.** `lastVerified` is the actual final organizer check, **2026-11-07T13:01:37.376Z**; `updatedAt` is the local record creation time. End omitted; no Muncie duration, recurrence expansion or invented fee. A separate registration permalink would improve stability but is not required when the public dated card supplies the entry point. End remains a blocker for ICS only.

### 4. Bulldog — November 12

[Original game listing](https://cyberpunktcg.com/stores/fe84ab19-c14f-4551-ad1e-9c0880646a19), **01:44:25.176Z**, still lists **NCB 1**, Thursday November 12, 6:30 PM EST, constructed, $5. Game-site context suggests Cyberpunk, but the abbreviated title alone does **not independently establish game identity**. Full year/end absent. [Melee 488751](https://melee.gg/Tournament/View/488751) returned browser **403** at **01:45:12.430Z**.

The [organizer homepage](https://bulldogcommunitygaming.com/) successfully rendered in a normal browser at **01:44:25.162Z**, despite web-tool failure. It gives **1060 E Main Street, Suite 302, Brownsburg, IN 46112**, adding a suite missing from the directory. [Games & Events](https://bulldogcommunitygaming.com/games), **01:45:02.862Z**, and the linked [upcoming calendar](https://bulldogcommunitygaming.com/events), **13:00:31.534Z**, show no posted upcoming dates. This is missing corroboration, not a cancellation notice. No Discord was joined. Await explicit Cyberpunk identity, full occurrence date/current schedule and registration verification; retain suite detail for review.

## Access limitations and remaining source conflicts

Web extraction failed on the three game store pages and Melee URLs; Carmel returned a JavaScript shell. Installed local Chromium rendered the public organizer/game pages successfully. Melee checks stopped at 403. Public read-only navigation only; no private channels, authenticated scraping, attendee data or Melee API. Research/browser tools were already installed outside this project; dependencies unchanged.

Priority-source checks are bounded; later local and expanded-area Phase 3A leads were not comprehensively reverified. Books & Brews venue duplication, Mage's November 28 collision, Muncie aggregator/organizer mismatch and historical prerelease contradictions remain flagged in [the original source report](EVENT-SOURCE-REPORT.md). Do not silently promote those leads under the relaxed schema. Calendar omissions and access failures are uncertainty, while the Riftbound/Magic game mismatches are definite reasons to reject those pages as corroboration.

## Optional-end implementation and feature review

`end` is optional by omission, while `start` remains required and offset-bearing. A supplied end still must be valid and strictly later than start. Empty/null/malformed ends are rejected. Existing records need no migration. Confirmation, 14-day staleness, sample segregation and future-verification guards remain independent of end completeness.

| Requirement | Result |
| --- | --- |
| Unknown-end display | List and month cells say “End time unknown”; details show it in Ends. Submission accepts a blank end and omits it from downloaded JSON. |
| Verified start preserved | No start rewrite, rounding, default duration or guessed end. Indianapolis display remains independent of device timezone. |
| Started/expired behavior | From scheduled start, unknown-end listings warn that start has passed and direct users to check the organizer. They leave Upcoming at the next Indianapolis date; this is only a display cutoff. Known-end listings expire exactly at end. |
| Long-open tabs/details | Clock updates every 30 seconds and on focus/visibility changes. Open details warn after the start date passes. Background timer throttling can delay updates until refocus. |
| ICS | Unknown-end exports disabled with visible explanation; generator throws even if called directly, including for cancellations. No implicit-duration ICS is emitted. Known-end UTC timestamps and stable cancellation UID remain. |
| Cancellation/deduplication | Cancelled records retain identity and warnings; unknown-end cancellations use the same date cutoff without deleting records. Newest revision/cancellation tie rules and cross-ID checks unchanged. |
| Validation | Updated schema, loader, timeline and feature tests; review candidate validated against production for duplicate suggestions. |

An overnight event without a known end may disappear while still running; the app does not claim completion at midnight. This conservative limitation is documented in [the verification policy](VERIFICATION.md). Calendar downloads are snapshots, not subscriptions; if a formerly known end becomes genuinely unknown, no replacement/cancellation export is fabricated. Preserve previously verified ends on cancellation unless evidence corrects them.

## Community request

A concise, prioritized [Discord moderator verification request](COMMUNITY-VERIFICATION-REQUEST.md) is prepared locally. It asks for public occurrence/game identity, full dates, venue, registration, fees and cancellation information, with end explicitly optional. **Not sent.**

## Remaining product-level blockers

- Choose moderators, submission destination and cancellation-report process; current submission form only downloads a local file.
- Complete remaining launch accessibility/assistive-technology and real calendar-client import/update checks. Targeted browser checks do not certify those broader requirements.
- Unknown-end ICS remains intentionally unavailable. An actual end is required to unlock it; overnight unknown-end display follows the documented cutoff.
- Before any authorized publication, recheck source freshness and approval, especially volatile calendar entry points. Resolve the three urgent occurrence gaps independently of the schema change.
- Repository/hosting selection and deployment authorization remain outside this phase. Empty production data is intentional.

## Validation and local Git handoff

Checks completed November 7, 2026 UTC (main suite **13:05**, candidate/bundle checks **13:06**), Node 26.8.1 / npm 11.19.0:

| Check | Result |
| --- | --- |
| `npm test` | **29 tests passed**, two files; all original tests retained |
| `npm run typecheck` | Passed |
| `npm run check:catalog` | Passed; 0 production records, 0 duplicate pairs |
| `npm run build` | Passed; existing non-blocking Zod/Rollup annotation warnings only |
| `npm audit --audit-level=low` | 0 vulnerabilities |
| Review through `eventSchema.array()`, `loadCatalog`, combined `duplicateCandidates` | Passed; 1 review record, 0 pairs |
| Local Chromium smoke checks | Passed: unknown-end list/month/details, disabled ICS/explanation, started warning, timed midnight removal, focus-refresh of open details, cancellation visibility/exports, optional-end submission and reversed-end rejection |
| Mobile/device timezone | No page-level overflow at 320/375/390/768 pixels; test device set to Tokyo, event display remained Indianapolis. Inspected unknown-end card screenshot. Fixed a date-input minimum-width overflow found at 320 pixels. |
| Production preview | Loopback only; `?demo=1` shows empty real catalog. Bundle contains neither review candidate nor fictional event names. |
| Preservation / Git | Production JSON and dependency manifests unchanged from `5372b90`; `git diff --check` clean; no remotes |

Production JSON retains blob `fe51488c7066f6687ef680d6bfaa4f7768ef205c`. Browser tests used in-memory interception of the development sample module and a controlled browser clock; no real catalog or persisted sample modifications. Existing Playwright/Chromium outside the project was used without new dependencies. Temporary loopback servers were stopped after checks.

Local work is committed on `phase-3b-verification` with per-commit identity `agentdev <agentdev@localhost>`, preserving `main` at the Phase 3A checkpoint. No push or deployment. Use `git log -1 phase-3b-verification` for the final commit; no self-referential hash is embedded here.
