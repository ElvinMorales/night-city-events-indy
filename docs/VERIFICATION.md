# Event verification and moderation policy

## Public catalog

`src/data/events.json` is the real catalog and may legitimately be `[]`. Do not fill gaps with invented events or venues. Fictional fixtures live in `src/data/samples.json`; they are only selectable with `?demo=1` on the development server. Production ignores that parameter. The real-catalog loader and build check reject all `sample: true` records. The schema rejects `sample: true` combined with `confirmed`, even in the demo.

## Evidence and status

- Prefer public, dated organizer announcements, registration pages and venue pages. Record the original public source URL, not a search result or private message. Check both source and registration links manually.
- `confirmed`: a moderator has checked the specific occurrence's venue/address, date, start/end, timezone, type, format and any stated fee against organizer-confirmed information. A missing critical detail blocks confirmation; ask the organizer rather than guess.
- `unverified`: organizer confirmation or required facts remain uncertain. Display the warning. A prior verification timestamp may be retained; use `null` if no verification has occurred.
- `cancelled`: retain the event ID, schedule and public evidence; update status and `updatedAt`. Do not delete a cancellation just to tidy the list. The upcoming view hides it after its scheduled end.
- `lastVerified`: full ISO timestamp with explicit offset, recording when a moderator actually checked the source. Never advance it just because the app was rebuilt. Do not use future timestamps.
- `updatedAt`: full ISO timestamp for the record revision. Any correction, cancellation or reinstatement requires a new timestamp. After a cancellation, reinstate only with new organizer evidence and a later revision.

Confirmation becomes stale at **14 × 24 hours** after the last check. Stale confirmed events remain visible with “Confirmation out of date,” not a fresh confirmation label. Unverified and cancelled events retain their respective warnings. Review the next week's events weekly and recheck important details within 48 hours of start when volunteer capacity allows. Those review intervals are a community policy, not an automated guarantee.

Do not scrape authenticated pages, private Discord channels, or attendee information. No Melee API access is assumed. There is no automated scraper or Discord bot.

## Dates and coordinates

Store start/end with explicit offsets and `timezone: America/Indiana/Indianapolis`. Confirm the date's seasonal offset: winter −05:00, summer −04:00. Submission form values are wall times, not publication-ready timestamps; moderators must resolve nonexistent/ambiguous DST times with the organizer. Coordinates must refer to the public venue. Do not publish private homes without an explicitly public event address.

## Duplicate review

Run `npm run check:catalog` before publication. It validates the real catalog and prints potential cross-ID duplicates with IDs and reasons. It flags shared source URLs (ignoring common tracking parameters) or normalized names/addresses when starts are within one hour. This is a heuristic, not comprehensive identity matching. Review sources manually, including reschedules outside that window.

Reuse a stable ID for revisions of the same occurrence. Assign separate IDs to recurring dates. The newest `updatedAt` wins for matching IDs; cancellation wins exact timestamp ties. Similar cross-ID records are never merged automatically. Fix duplicates deliberately, preserving the canonical ID and cancellation history.

## Review checklist

- [ ] Public organizer evidence supports this occurrence; unknown facts are not invented.
- [ ] Public address and coordinates are checked.
- [ ] Start/end, Indianapolis offset, format and fee are checked.
- [ ] Links open publicly without authentication.
- [ ] ID and potential cross-source duplicates reviewed.
- [ ] Verification status and timestamps reflect the actual evidence.
- [ ] No fictional or private information is in the real catalog.
- [ ] Catalog check, tests, typecheck and build pass.
