# Phase 3C — community launch candidate

## Readiness: NO-GO for public launch; GO for moderator feedback on the local candidate

The small review package is ready to discuss with Indy Cyberpunk TCG Discord moderators **when outreach is separately authorized**. It contains one evidence-reviewed occurrence, a single-maintainer proposal, a cancellation-report process, and an unsent introduction. It is not a live calendar. Public launch remains blocked by the absence of a named maintainer and working submission/cancellation endpoint, incomplete human accessibility and real calendar-client acceptance checks, and repository/hosting/deployment decisions that are outside this phase.

Work was performed as `agentdev` in `/home/agentdev/projects/night-city-events` on local branch **`phase-3c-community-rc`**, based on Phase 3B commit **`e30e31c`**. Phase 3B remains intact. No public repository, push, deployment, event promotion, outreach, backend or Discord bot was created.

## Event content and recheck decisions

The separate [release-candidate array](release-candidate/events.json) contains **one confirmed, production-schema listing**: `nlg-carmel-2026-11-10-cyberpunk`. Production `src/data/events.json` remains `[]`. The candidate is not imported into the application or production bundle. The [evidence ledger](release-candidate/evidence.json) records actual source-check times, URLs, findings and decisions. The original [Phase 3B report](PHASE-3B-REPORT.md), [review array](review/events.candidates.json), and [verification policy](VERIFICATION.md) are unchanged.

| Occurrence | Actual recheck (November 7, 2026 UTC) | Decision |
| --- | --- | --- |
| Carmel, November 10 | Organizer calendar **14:17:43.884Z**; public venue directory **14:17:46.186Z** | Same explicit Tuesday November 10, **2026**, **6 PM** Cyberpunk TCG Night City Brawl, **$11**, 1v1 constructed/Swiss/best-of-three, 14560 River Rd, Ste 130, Carmel, IN 46033. No relevant change or cancellation notice observed on the inspected organizer page. Listing-ready candidate only. |
| Good Games, November 8 | Original feed **14:17:46.310Z**; organizer month **14:17:52.458Z**; registration **14:17:43.791Z** | Feed still advertises Cyberpunk weekly play, November 8, 2 PM EST, constructed, fee TBD. Full occurrence year/end still absent. Melee returns 403. Rendered organizer month has no Cyberpunk text and has collapsed entries. Insufficient occurrence corroboration; excluded. |
| Bulldog, November 12 | Original feed **14:17:45.968Z**; organizer calendar **14:17:44.455Z**; registration **14:17:43.747Z** | Feed still advertises NCB 1, November 12, 6:30 PM EST, constructed, $5. Full year/end absent; abbreviated title still does not independently establish game identity. Organizer has no upcoming dates posted; Melee returns 403. Excluded. |

Primary links: [Carmel organizer calendar](https://www.nextlevelgames.store/events?location=carmel), [Carmel venue record](https://cyberpunktcg.com/stores/11e1fd26-7413-49dc-83fa-d6a9dbdb1fdb), [Good Games feed](https://cyberpunktcg.com/stores/a90753e1-cff0-498b-9ee0-2d1652fa7a84), [Good Games November calendar](https://www.goodgamesna.com/events/month/2026-11/), [Good Games registration](https://melee.gg/Tournament/View/460450), [Bulldog feed](https://cyberpunktcg.com/stores/fe84ab19-c14f-4551-ad1e-9c0880646a19), [Bulldog calendar](https://bulldogcommunitygaming.com/events), [Bulldog registration](https://melee.gg/Tournament/View/488751).

Carmel's start stays `2026-11-10T18:00:00-05:00`; the end remains omitted. The dated card still has an available reservation button. The shared source/registration URL is a calendar entry point: it is not a unique occurrence permalink, tested checkout, or guarantee of seats. No reservation action was taken. Existing public map coordinates were retained from Phase 3B; the current venue address agrees. No future weekly occurrences were inferred or added.

Only the candidate's verification and revision timestamps changed from the Phase 3B record. The original `lastVerified: 2026-11-07T13:01:37.376Z` and `updatedAt: 2026-11-07T13:03:06.971Z` remain in the original array and new ledger; the candidate records the new actual check. Unknown end is a disclosed feature limitation, not a reason to downgrade occurrence confirmation. **ICS is unavailable for this candidate.**

Research was unauthenticated, public, read-only browser navigation. Web extraction returned a JavaScript shell or access failure, so existing local Chromium was used. Both Melee checks stopped at 403 without bypass. Calendar omissions and access failures are uncertainty, not proof of cancellation. No unrelated game was used as corroboration. These bounded checks cannot rule out later changes or notices elsewhere. Recheck Carmel within 48 hours of start if capacity allows, and again before any later authorized promotion. Other Phase 3A/3B leads remain outside this release candidate.

## Product and quality changes

The one-event experience keeps the existing list, month, detail, filters and source links. Its count now says “1 event.” About text explains public-source verification and the proposed GitHub route without implying organizer contact or an operational inbox.

Keyboard testing found that closing a dialog could lose the opening button's focus. The modal now explicitly restores focus to that trigger, including under React development Strict Mode. The filter controls now use a labelled search landmark, the view toggle has group semantics, the scrollable calendar/error diagnostics have explicit visible focus styles, and the catalog error heading follows the page hierarchy. These are small acceptance fixes; the Phase 3B event schema, visibility rules, optional-end behavior, ICS generator, deduplication and cancellation logic are unchanged.

Available browser checks and retained results are documented in [QA](qa/PHASE-3C.md). The harness uses in-memory interception of the local event module and leaves production/sample files untouched. It covers list, month, details, submission and About, including keyboard reachability, dialog focus, Enter/Space, Escape, filter recovery, year-boundary navigation, empty/error/cancelled states, unknown-end export prevention, mobile widths and Tokyo-device/Indianapolis-time display.

Actual ICS client imports could not be performed: no calendar client is installed, and the connected calendar tools have no ICS importer. No connected calendar was changed. [Four synthetic import fixtures and expected results](qa/PHASE-3C.md#calendar-client-imports--not-performed-here) are prepared for a disposable local test calendar. Generated ICS and unit tests do not establish client update/cancellation behavior. Human screen-reader announcements, second-browser checks, real touch, zoom/high-contrast and unresolved axe contrast review remain explicitly unperformed. Those gaps are acceptance work, not silent passes.

## Community operations

[COMMUNITY-OPERATIONS.md](COMMUNITY-OPERATIONS.md) contains the proposed workflow, exact cancellation-report information, a 20–30 minute weekly routine, and a short **unsent** Discord moderator introduction. One named maintainer can triage, check sources, prepare a small branch, self-review and run checks; a backup is optional for this pilot. The routine is best effort, with no promise of continuous monitoring. Missed sessions do not justify refreshed verification timestamps.

The existing [GitHub issue form](../.github/ISSUE_TEMPLATE/event.yml) remains the preferred future mechanism and already supports New event, Correction and Cancellation. No new intake system was added. Public GitHub issues require accounts; calendar browsing does not. `submissionUrl` is still `null`: no real repository or reporting endpoint has been created. The local form's no-inbox notice remains accurate. The launch checklist now links the operational proposal and QA results.

## Validation and preservation

Final checks on November 7, 2026: unit/type/catalog/build run **14:26 UTC**; browser run began **2026-11-07T14:26:20.603Z** and completed by **14:27 UTC**. Node 26.8.1 / npm 11.19.0; Chromium 156.0.8078.4; axe-core 4.10.3. Production remains empty by design; release-candidate validation is a separate check.

| Check | Result |
| --- | --- |
| `npm test` | **29 passed**, both original test files retained |
| `npm run typecheck` | Passed |
| `npm run check:catalog` | Passed: 0 production events, 0 duplicate pairs |
| Candidate schema, `loadCatalog`, combined duplicate review | Passed: 1 candidate, 0 errors, 0 duplicate pairs |
| `npm run build` | Passed; only the existing non-blocking Zod/Rollup annotation warnings |
| Browser acceptance | **13 check groups passed**, including all views and dialog focus restoration |
| axe WCAG 2 A/AA, 2.1 AA and best-practice scans | **0 reported violations across 12 states**; contrast checks remain incomplete in 11 states and require human review, not an accessibility certification |
| Responsive/visual review | No page overflow at 320/375/390/768; inspected desktop and mobile one-event screenshots; month region keyboard-scrolls |
| Production isolation | Preview ignores `?demo=1`; bundle excludes candidate and fictional fixture names |
| Actual calendar-client imports / assistive technology | **Not performed**; reasons, fixtures and exact remaining checks recorded in QA |
| Preservation / whitespace | Protected Phase 3B files unchanged; local diff reviewed |

The [desktop](release-candidate/preview-desktop.png) and [mobile](release-candidate/preview-mobile.png) previews show the candidate injected only in the local review browser. They are feedback artifacts, not screenshots of a deployed site. The [full browser results](qa/phase-3c-browser-results.json) preserve automated findings, including incomplete contrast nodes.

- Production catalog blob remains **`fe51488c7066f6687ef680d6bfaa4f7768ef205c`**.
- Phase 3B report, original candidate array, verification policy, event/catalog logic, dependency manifests and sample data are preserved.
- All Phase 3C changes remain on the local review branch. No remotes are configured. Local work uses `agentdev <agentdev@localhost>` for the final commit; obtain its hash with `git log -1 phase-3c-community-rc`.

## Blocking issues and next decision

1. Name the maintainer, adopt the reporting expectations, and configure/test the actual GitHub submission/cancellation route after repository authorization. The proposed process alone cannot receive a cancellation report.
2. Complete the remaining human accessibility and actual calendar-client checks in the QA document. Unknown-end Carmel export is intentionally disabled; no end should be fabricated to pass an import test. Good Games/Bulldog evidence gaps do not block a one-event release because those records are excluded.
3. Obtain separate repository/hosting/publication authorization, recheck source freshness and cancellation, explicitly approve candidate promotion, then perform deployed-site checks. No authorization or publishing action is implied by this report.

**Decision: GO for review of this local community-feedback package; NO-GO for public launch.** The package is small enough for moderator feedback while accurately disclosing its data, feature and operational limits.
