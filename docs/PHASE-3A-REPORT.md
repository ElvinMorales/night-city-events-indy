# Phase 3A report

Completed locally as `agentdev` in `/home/agentdev/projects/night-city-events` on **2026-11-07 UTC**.

## Results

Actual public-source research produced **16 incomplete upcoming listings within 40 miles** and **19 separately recorded listings over 40 to 100 miles**. These are source listings, not a deduplicated count of confirmed events. The [evidence report](EVENT-SOURCE-REPORT.md) records URLs, actual check timestamps, schedules as stated, address evidence, registration/fee claims, missing facts, conflicts and publication decisions. It also retains six historical occurrences, 31 official venue directory entries and three additional general venue leads.

**No events are ready for publication or complete-record approval.** The [review-only candidate array](review/events.candidates.json) is `[]`. Most primary listings omit end times and the full year, and linked Melee pages could not be verified. The Muncie aggregator lead also lacks original occurrence confirmation. No required field was invented to satisfy the schema. The production catalog remains unchanged.

The most urgent moderator investigations are Mage's November 7 listing, Good Games November 8, Next Level Games Carmel November 10, and Bulldog Community Gaming November 12. Other local follow-ups include Elf 'N Moon, Books & Brews, The Dugout and Atomic Planet. Their source links and check times are in the evidence report. No outreach was sent.

Manual duplicate review is needed for Mage's two November 28 listings at the same time and the two Books & Brews venue entries. The report distinguishes these from separately advertised weekly dates. Kokomo, Muncie and Tarnished Tabletop leads remain outside the initial 40-mile scope. A targeted external research request is included for facts unavailable through permitted public access here.

## Version control and preservation

- Inspected the original `.gitignore` before initialization; it excluded `node_modules/`, `dist/` and `*.tsbuildinfo`.
- Initialized local branch `main` and committed the existing Phase 2 source as **`bec67a9`** (`Baseline existing Phase 2 application`). Dependencies, generated output and development artifacts were excluded. Reviewed the file list and scanned source for common credential patterns before staging.
- Used the per-commit identity `agentdev <agentdev@localhost>`; no global Git identity was changed.
- Extended ignore rules for local environment files, logs, coverage and browser-test artifacts. No dependencies were installed or changed.
- All Phase 3A changes are documentation, the empty review JSON, README navigation and `.gitignore`. Application source, schema, dependencies, build configuration and CI are unchanged.
- Confirmed `src/data/events.json` has the same Git blob as baseline: `fe51488c7066f6687ef680d6bfaa4f7768ef205c`.
- No GitHub repository, Git remote, push, deployment, backend, bot, submission destination, registration or external commitment was created.

## Validation

Checks completed **2026-11-07T01:37:38Z** using Node **26.8.1** and npm **11.19.0**:

| Check | Result |
| --- | --- |
| `npm test` | 20 tests passed across two files |
| `npm run typecheck` | Passed |
| `npm run build` | Passed; includes catalog validation and TypeScript build |
| Build's `check:catalog` | 0 production records; 0 duplicate pairs; valid |
| Review JSON through `eventSchema.array().safeParse` and `loadCatalog` | Passed; 0 complete candidates |
| `duplicateCandidates` on review plus production records | 0 pairs; research-level manual flags remain in the source report |
| Baseline comparison of production JSON and application source/configuration | Unchanged |
| Git remote inspection | No remotes |

**No new test or build failures.** The previously documented non-blocking Zod/Rollup annotation warnings remain. Build output was regenerated locally and is ignored. Automated validation cannot resolve missing source evidence; manual launch/accessibility/calendar-client checks from Phase 2 remain separate launch work.

Phase 3A stops here. Any later catalog promotion must follow `VERIFICATION.md`, resolve the documented gaps and rerun checks; this research does not authorize publication.
