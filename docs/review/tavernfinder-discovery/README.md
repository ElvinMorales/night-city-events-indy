# TavernFinder discovery pilot

From the project root, using Node.js 22 or newer and the installed dependencies:

```sh
DISCOVERY_RETRIEVAL_ENABLED=true TAVERNFINDER_RETRIEVAL_ENABLED=true \
  node --import tsx tools/tavernfinder-discovery/refresh.ts --local
```

Both switches must be exactly `true`. With either switch unset or off, the adapter makes zero requests. The proposed workflow uses the same switches. The existing Melee adapter retains its separate controls and is outside this command.

Local mode writes `review.json` and `review.md` into a new owner-only OS temporary directory and prints its path. These reports include selected listing fields and are for private moderator review. Keep them outside site inputs, Git, and public workflow artifacts. The [sanitized example](example.md) shows aggregate metrics and redacted findings. Use `--summary-only` for operational checks. It prints outcomes, HTTP status, timestamps and aggregate counts and does not write detailed reports. The CLI exits with status 1 for incomplete, malformed, or inaccessible refreshes.

## Request and comparison limits

- The adapter uses the [public REST discovery endpoint](https://tavernfinder.com/pt/docs/api) with TavernFinder’s custom Cyberpunk TCG ID `900000114`, downtown Indianapolis as the center, and `type=event`. It requests at most four pages of 100 rows, with an eight-second timeout including body reads and a 1 MiB response cap per request. It follows no redirects and makes no retries.
- The review uses a 100-mile straight-line radius and begins at the run timestamp, through the Indianapolis calendar date 60 days later. November 24 responses reported a server-side 150 km bound, so the client filter does not establish coverage of the full local radius. Source time fields carry no timezone. The adapter interprets them as Indianapolis wall times, checks the seasonal offset and rejects ambiguous or nonexistent DST times.
- Active registry venue names and explicit aliases are matched with city when available. Missing coordinates can use a resolved registry venue's coordinates for the radius check. Unresolved venue candidates are separate from the registry and geographic eligibility is marked unknown if coordinates are unavailable.
- Exact matches use venue, absolute start and normalized title. A matching title at the same venue within 36 hours is a possible schedule change when no exact slot exists. Multiple plausible catalog rows and same-slot mismatches require review. Distinct TavernFinder IDs in one venue/time slot and repeated source IDs are flagged. None of these heuristics merges or revises entries. The rediscovery percentage is suppressed on partial or failed results.
- Every returned listing is a discovery observation. The adapter discards end times, descriptions, fee, format and registration fields. It assigns no verification timestamp or event status. An absent row generates no cancellation or other change. Moderators verify the dated occurrence and facts from the original organizer under the [existing policy](../../VERIFICATION.md), then use the separate publication process if evidence supports it.

## Private moderator queue

From the project root, use:

```sh
DISCOVERY_RETRIEVAL_ENABLED=true TAVERNFINDER_RETRIEVAL_ENABLED=true \
  node --import tsx tools/tavernfinder-discovery/refresh.ts --queue
```

The CLI maintains `~/.night-city-events-indy/tavernfinder/queue.json` in an owner-only directory. View `lastSuccessfulReview.findings` and `duplicateCandidates` alongside the IDs in `lastSuccessfulReview.moderatorQueue`. The queue includes actionable leads, potential shifts, unresolved venues and duplicate candidates. `lastAttempt` describes the current source health and `lastSuccessfulRefresh` indicates the last complete check. Disabled, inaccessible, malformed and incomplete attempts leave the last successful observations intact. A successful empty feed clears the current discovery queue without changing the catalog. One process at a time can update the queue. If a process was forcibly interrupted and left a `.refresh-lock`, confirm no refresh is running before removing that directory.

This file contains selected third-party listing facts. Keep it private. For an ad hoc Markdown review, the earlier `--local` command writes private JSON and Markdown snapshots. Moderators follow the existing catalog workflow for independently verified occurrences. The public application continues to read the confirmed catalog independently of discovery.

## GitHub-hosted operation

The [workflow](../../../.github/workflows/tavernfinder-discovery.yml) is prepared locally and supports manual dispatch and a six-hour UTC cadence. It uses read-only repository and Actions permissions. Each hosted run processes the catalog comparison in memory and emits aggregate counts and source health in the job summary. The only uploaded artifact is a timestamp for the last successful check, retained for 30 days. If a run fails, it leaves the earlier timestamp artifact intact. The detailed queue is refreshed on a moderator-controlled machine using `--queue`. GitHub-hosted execution does not synchronize private queue records.

After approval and once the workflow is on the default branch:

1. Leave `TAVERNFINDER_SCHEDULE_ENABLED` unset or `false`. Set `DISCOVERY_RETRIEVAL_ENABLED` and `TAVERNFINDER_RETRIEVAL_ENABLED` to `true`.
2. Manually run **TavernFinder discovery** on the default branch. Check for a successful API response, a fresh last-success timestamp, and the timestamp-only artifact.
3. After approval to schedule, set `TAVERNFINDER_SCHEDULE_ENABLED=true`. Review the first week’s run outcomes, coverage, new leads, and moderator effort. Hosted discovery uses the existing GitHub Actions runner.

To stop scheduled retrieval, set `TAVERNFINDER_SCHEDULE_ENABLED=false`. To also block manual retrieval, set the global switch `DISCOVERY_RETRIEVAL_ENABLED=false` or the TavernFinder switch `TAVERNFINDER_RETRIEVAL_ENABLED=false`. Cancel a run already in progress in Actions. The local CLI uses its own environment, so unset the same switches on the moderator machine to stop local retrieval. The catalog and site need no rollback. Disabling the workflow entirely is also available in Actions.

The [terms of service](https://tavernfinder.com/en/terms) acknowledge third-party ownership. The reviewed materials provide no explicit license to redistribute listing content. Keep selected records private while reuse rights remain unresolved.
