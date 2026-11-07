# Event verification and moderation policy

## Public catalog

`src/data/events.json` is the real catalog and may legitimately be `[]`. Do not fill gaps with invented events or venues. Fictional fixtures live in `src/data/samples.json`; they are only selectable with `?demo=1` on the development server. Production ignores that parameter. The real-catalog loader and build check reject all `sample: true` records. The schema rejects `sample: true` combined with `confirmed`, even in the demo.

## Evidence and status

- Prefer public, dated organizer announcements, registration pages and venue pages. Record the original public source URL, not a search result or private message. Check both source and registration links manually.
- `confirmed`: public organizer evidence supports this specific Cyberpunk TCG occurrence, venue/address, full date/year, start, timezone, type, format and any stated fee. Verify game identity explicitly; a similar name or another game at the same venue is not corroboration. A missing end alone does **not** block confirmation. Unknown occurrence identity, date/start or unresolved contradictory evidence does. Confirmation is an evidence judgment, not a schema-validation result.
- `unverified`: occurrence confirmation or critical facts other than the optional end remain uncertain. Display the warning. A prior verification timestamp may be retained; use `null` if no verification has occurred.
- `cancelled`: retain the event ID, schedule and public evidence; update status and `updatedAt`. Do not delete a cancellation just to tidy the list. The upcoming view hides it at its known end, or after its Indianapolis start date if the end is unknown. This visibility cutoff never deletes the record or implies the event ended at midnight.
- `lastVerified`: full ISO timestamp with explicit offset, recording when a moderator actually checked the source. Never advance it just because the app was rebuilt. Do not use future timestamps.
- `updatedAt`: full ISO timestamp for the record revision. Any correction, cancellation or reinstatement requires a new timestamp. After a cancellation, reinstate only with new organizer evidence and a later revision.

Confirmation becomes stale at **14 × 24 hours** after the last check. Stale confirmed events remain visible with “Confirmation out of date,” not a fresh confirmation label. Unverified and cancelled events retain their respective warnings. Review the next week's events weekly and recheck important details within 48 hours of start when volunteer capacity allows. Those review intervals are a community policy, not an automated guarantee.

Do not scrape authenticated pages, private Discord channels, or attendee information. No Melee API access is assumed. There is no automated scraper or Discord bot.

## Dates and coordinates

Store the required start and any known end with explicit offsets and `timezone: America/Indiana/Indianapolis`. Confirm the date's seasonal offset: winter −05:00, summer −04:00. Submission form values are wall times, not publication-ready timestamps; moderators must resolve nonexistent/ambiguous DST times with the organizer. Coordinates must refer to the public venue. Do not publish private homes without an explicitly public event address.

## Confirmation and feature readiness are independent

Omit `end` when unknown; do not use an empty string, `null`, estimated duration, store closing time or another occurrence's schedule. If supplied, it must be an offset-bearing valid timestamp strictly after start. Existing complete records remain valid. Submissions may leave the end blank; moderators must still resolve the start's timezone. Never downgrade a genuinely confirmed occurrence solely for lacking an end.

| Feature | Required evidence/data |
| --- | --- |
| Occurrence confirmation | Game-specific organizer evidence for the named occurrence and critical details above; actual `lastVerified` check time |
| List/month/detail display | Schema-valid record, checked public venue coordinates, source and registration entry point; end may be omitted and displays “End time unknown” |
| Registration link | Public organizer reservation entry point is acceptable; may be the source calendar with a dated event card. Do not claim a separate permalink, completed checkout, guaranteed seat or login-free checkout unless actually checked |
| Upcoming visibility | Known end: visible before end. Unknown end: visible through the Indianapolis start date, with a scheduled-start-passed warning from start onward; hidden on subsequent local dates |
| ICS download (including cancellation) | Known start **and end**; unknown-end exports disabled in UI and rejected by generator. No implicit duration, all-day substitution or fake `DTEND` |

The app refreshes its clock every 30 seconds and on focus/visibility changes. The local-date cutoff is a conservative display policy, not an inferred duration or proof of completion. An overnight occurrence with an unknown end may leave Upcoming while still running; obtain an end to support overnight display. Open details show an elapsed-date notice after the cutoff. Known ends expire exactly at end. Records and revision identity remain intact.

Preserve a previously verified end on cancellation unless evidence corrects it; do not drop it just because a cancellation notice omits it. If an end truly becomes unknown, keep the canonical ID/cancellation but disable ICS. Downloads are snapshots: users must check sources and update previously imported entries manually when no valid cancellation export can be produced. Never invent an end to enable export.

## Duplicate review

Run `npm run check:catalog` before publication. It validates the real catalog and prints potential cross-ID duplicates with IDs and reasons. It flags shared source URLs (ignoring common tracking parameters) or normalized names/addresses when starts are within one hour. This is a heuristic, not comprehensive identity matching. Review sources manually, including reschedules outside that window.

Reuse a stable ID for revisions of the same occurrence. Assign separate IDs to recurring dates. The newest `updatedAt` wins for matching IDs; cancellation wins exact timestamp ties. Similar cross-ID records are never merged automatically. Fix duplicates deliberately, preserving the canonical ID and cancellation history.

## Review checklist

- [ ] Public organizer evidence supports this occurrence; unknown facts are not invented.
- [ ] Public address and coordinates are checked.
- [ ] Start, full year, Indianapolis offset, format and any stated fee are checked; end is checked if supplied, otherwise omitted.
- [ ] Occurrence confirmation and each feature’s readiness are assessed independently; unknown end is clearly disclosed and ICS unavailable.
- [ ] Links open publicly without authentication.
- [ ] ID and potential cross-source duplicates reviewed.
- [ ] Verification status and timestamps reflect the actual evidence.
- [ ] No fictional or private information is in the real catalog.
- [ ] Catalog check, tests, typecheck and build pass.
