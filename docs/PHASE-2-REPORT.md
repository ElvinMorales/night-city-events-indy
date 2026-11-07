# Phase 2 change report

## Environment

- Inspected the root shell, project permissions, existing accounts and TCP listeners under explicit bootstrap authorization.
- Copied the project to `/home/agentdev/projects/night-city-events`, owned by existing `agentdev` (UID 1001). Original `/root` copy retained unchanged. No accounts, privileges, firewall rules or unrelated services were changed.
- All application edits, package operations and checks ran as `agentdev`. The shell service itself still starts as root; switch identity explicitly for future work.
- Development and preview now default to loopback. Both returned HTTP 200 and were observed listening only on `127.0.0.1`; temporary servers were stopped.

## Application

- Empty real catalog by default; fictional fixtures available only through local development `?demo=1`.
- Build/runtime guards reject samples in the real catalog and confirmed samples everywhere. Production bundle inspection found no sample event names or addresses.
- Safe catalog loading with a visible diagnostic state; invalid catalogs fail the build.
- Full verification timestamps, visible source links, 14-day stale warnings, unverified/cancellation warnings.
- Moderator CLI flags potential cross-ID duplicates without auto-merging. Cancellation wins revision ties, including equivalent timestamps written with different offsets.
- Improved empty catalog/filter/month states, skip navigation, dialog names, date-range feedback, mobile touch targets and contained calendar scrolling. Existing list, filters, calendar, details, JSON submissions and ICS downloads retained.
- Submission limits explicit; free GitHub issue form prepared locally. No destination configured, backend added, repository created or deployment performed.

## Verification

- 20 unit tests pass (two files).
- Explicit TypeScript check passes.
- Catalog check and production build pass.
- Dependency audit reports zero vulnerabilities at check time.
- Dev/preview loopback HTTP smoke checks pass.
- All project files in the new copy are owned by agentdev.
- Browser visual, keyboard interaction, screen-reader and calendar-client import testing remain unverified; no browser tool or installed browser was available. Build emits non-blocking Zod annotation warnings.

## Remaining launch blockers

Choose a public submission destination and moderators; configure the real link; complete manual browser/accessibility/calendar-client checks; select a repository/host and obtain public-resource/deployment authorization. The empty real catalog is intentional and is not itself a launch blocker. Publish real events only after verification.

See `VERIFICATION.md` for policy and `LAUNCH.md` for the first-deployment checklist.
