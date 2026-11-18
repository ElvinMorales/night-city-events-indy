# Updating events through Codex

Open the existing `agentdev` project in Codex. Ask for a local event change with the public organizer URL, exact occurrence date and intended action (new event, correction, cancellation or reinstatement). State whether you want a draft for review or an already-approved catalog edit. An update request does not require a new repository or a new deployment system.

Example prompt:

> In the existing night-city-events project, prepare an event update using this public organizer source: [URL]. The occurrence is [date], and the requested change is [details or existing ID]. Follow docs/VERIFICATION.md. Verify the public facts and record the actual check timestamp. Leave missing facts unknown and keep incomplete records in review. Show me the catalog diff and check results locally. Do not push or publish.

For an approved promotion, explicitly name the candidate ID and authorize copying that reviewed occurrence into `src/data/events.json`. A record in `docs/review/` or `docs/release-candidate/` is not publication authorization. Reopen its public source to check freshness, corrections and cancellation before promotion. Never copy the whole candidate array over production: retain other records and their stable IDs.

Codex should:

1. Read [VERIFICATION.md](VERIFICATION.md), the production catalog and relevant review evidence. Check the public organizer source for game identity, exact year/date/start, venue/address, coordinates, format, stated fee and registration link. Do not access private channels or turn unavailable evidence into confirmation.
2. Record what was checked, the public source URL and actual check time. Preserve earlier evidence. Resolve Indianapolis time to the date's correct UTC offset. Omit an unknown end; never infer a duration or future recurrence. `lastVerified` changes only when a real check occurred, never just because a build ran.
3. Edit only approved records in `src/data/events.json`. Use `sample: false` for genuine events. Never adapt a fictional fixture into a real listing. Use the canonical ID for corrections/cancellations; give different recurring occurrences distinct IDs. Cancellation retains the original schedule and any verified end, sets `status: cancelled`, and advances `updatedAt`. Reinstatement needs later organizer evidence and a later revision.
4. Run `npm run check:catalog`, `npm test`, `npm run typecheck`, and `npm run build`. Resolve duplicate warnings manually. Review `git diff -- src/data/events.json` and the evidence diff; verify no other records disappeared. The build runs the Pages artifact check automatically.
5. Preview at `http://127.0.0.1:4173/night-city-events-indy/` after `npm run preview`. Inspect list/calendar/details, date/time, source/registration links, verification status and any cancellation. Check `?demo=1` too. Unknown-end ICS must stay disabled. Upcoming hides past occurrences without deleting records.
6. Report the exact change, verification evidence, unresolved facts and check results. Follow the user's publishing scope. For local-only preparation, stop with the reviewable diff. When separately authorized, integrate into the identified existing repository through its normal branch/PR process, then manually dispatch the separate Pages workflow. Ordinary source pushes do not update the site.

No source mutation, issue closure or message is required just to prepare the update. Configure the actual community issue-form URL in `src/config.ts` only after the destination is verified and approved. Never place credentials or private attendee/contact information in JSON, evidence or prompts intended for the repository.

If a check fails, correct the data or keep the event pending; do not remove the production/demo boundary to force a release. Schema checks cannot establish factual confirmation. An empty catalog is acceptable.
