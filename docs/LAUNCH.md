# First public deployment checklist

No public resources have been created or deployed as part of Phase 2.

## Workspace and local operation

The active working copy is `/home/agentdev/projects/night-city-events`, owned by the existing `agentdev` account. The original `/root/projects/night-city-events` remains unchanged as a pre-Phase-2 copy. Work in the new copy; changes are not synchronized back.

Application edits, dependency installation, tests and builds were run as `agentdev`, using an authorized root wrapper only to switch identity. No user was created, no sudo/group privileges were granted, and `/root` permissions were not relaxed. The agent shell itself still starts as root; this setup does not change that service. Future commands must explicitly switch user, or open a new session as `agentdev`.

From an existing authorized administrative shell:

```sh
runuser -u agentdev -- bash
cd /home/agentdev/projects/night-city-events
npm run dev
```

Alternatively, log in through your existing non-root access method. No new login credentials were created. Node 22+ is expected; local checks used the system's Node 26.8.1.

Development and production preview bind to `127.0.0.1`. Do not override with `--host 0.0.0.0`, add port forwarding, or configure a tunnel for ordinary local work. Binding locally does not audit unrelated reverse proxies or host infrastructure. Existing unrelated host services were not changed.

## Submission choice (launch blocker)

Recommended minimal-maintenance workflow: use the free GitHub issue form already included at `.github/ISSUE_TEMPLATE/event.yml` when an authorized repository exists. A contributor can paste a public organizer URL and basic details; a moderator verifies and updates JSON through GitHub's editor. GitHub accounts are required to file issues, but browsing the calendar remains account-free. Submissions and discussion will be public.

No repository or issue endpoint has been created. After authorization and creation, configure `submissionUrl` in `src/config.ts` to the repository's issue-form link. Until then the UI explicitly states that no submission destination is configured. The existing local JSON download remains available as a fallback but does not deliver or store anything online. If GitHub is unsuitable for the community, choose an existing moderator contact channel and document it; do not add a backend just to receive a handful of URLs. Do not invent a contact address.

## Before deployment

- [ ] Choose a maintainer and backup moderator, an actual submission destination, and a cancellation-report process.
- [ ] Decide repository ownership and visibility; obtain authorization before creating public resources.
- [ ] Review MIT licensing and fan-project disclaimer.
- [ ] Review `docs/VERIFICATION.md`. Start with an empty real catalog if no verified events exist.
- [ ] Set the real `submissionUrl`, test it, and ensure it collects only public information.
- [ ] Run `npm ci`, `npm run check:catalog`, `npm test`, `npm run typecheck`, and `npm run build` as a non-root user.
- [ ] Complete the manual browser checks below.
- [ ] Select a static host and obtain explicit public-deployment authorization.
- [ ] Deploy only `dist/` with HTTPS. No server, auth, credentials or database are required.
- [ ] Inspect the deployed page, asset paths, empty state, and submission link. Confirm `?demo=1` does not expose sample listings in production.
- [ ] Document how to rebuild, roll back to the previous artifact, and report an incorrect listing.

GitHub Actions checks pushes and PRs; it does not deploy. Production build runs catalog validation. Invalid JSON fails the build; structurally invalid data also has a runtime error state instead of a blank application. The entire catalog is withheld when validation fails to avoid partial or misleading listings.

## Manual browser checks still required

- At 320, 375, 390 and 768 CSS pixels: no page-level horizontal overflow; readable cards and forms; calendar can scroll within its region; all controls usable by touch.
- Keyboard: skip link reaches events; every control is reachable; focus stays visible; Enter/Space activates controls; native dialog traps focus; Escape closes it and focus returns to its trigger.
- Screen reader: dialog heading announced, result counts and errors read, event status understandable without color.
- Calendar: navigate across year boundaries; no-event months announce an explanatory message.
- Dates: verify Indianapolis display on a device configured to a different timezone; inspect winter/summer timestamps.
- Submission: invalid dates/links rejected; empty destination warning visible; downloaded JSON readable; configured issue form opens when available.
- ICS: import real test fixtures into intended clients; verify time, source, tentative/confirmed status and cancellation UID handling. Downloads are not live subscriptions and cancellation import behavior varies.
- Error state: locally replace a field with an invalid value, verify the diagnostic/error screen, then restore it. Use local demo mode for sample card/detail checks.

Automated tests and HTTP smoke checks do not substitute for these visual/assistive-technology checks.
