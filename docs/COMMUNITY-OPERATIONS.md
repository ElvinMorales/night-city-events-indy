# Community operations — proposed single-maintainer workflow

This is a proposal for moderator feedback, not an active service. No public repository, reporting endpoint, maintainer commitment, or hosting has been established. `submissionUrl` remains unset. The local submission form downloads a file and has no inbox. Do not send event reports to a guessed address.

## Ownership and submissions

One named maintainer owns verification, the JSON catalog, issue triage, and the release checklist. A backup is optional for this small pilot; if the maintainer is unavailable, leave verification timestamps unchanged and let the stale warning appear. Do not promise continuous monitoring or comprehensive Indy coverage. Before public launch, name the maintainer and publish the actual reporting route and expected response window.

Use the existing [GitHub issue form](../.github/ISSUE_TEMPLATE/event.yml) as the preferred future route for new events, corrections, and cancellations. Once repository creation is separately authorized, set `submissionUrl` to `https://github.com/OWNER/REPO/issues/new?template=event.yml` with the actual owner/repository and verify it in a browser. This is a template, not a working endpoint. Filing requires a GitHub account; browsing listings does not. Issues are public: ask only for public organizer details, never attendee lists, private messages, phone numbers, or private Discord links.

For each issue, the maintainer:

1. Opens the public organizer source and checks the exact Cyberpunk TCG occurrence, full year, venue/address, start and Indianapolis offset, type/format, stated fee, and registration entry point. An unknown end may be omitted. A recurring description alone does not authorize future dates.
2. Records the URL, actual check time, facts, uncertainty, and decision in the review log. Keeps previous evidence and timestamps. Inaccessible evidence stays pending; silence or a missing calendar card is not proof of cancellation.
3. Reviews duplicates and preserves the canonical ID for corrections. Prepares a review branch with a small diff, runs catalog validation/tests/typecheck/build, and checks the listing and links locally. For a single-maintainer project, a documented self-review is sufficient; a second reviewer is welcome but not an assumed dependency.
4. Publishes only after the separately authorized release process, checks the deployed result, then closes the issue with the outcome and revision. Keep unresolved submissions open with the missing evidence stated; a GitHub issue is not organizer confirmation by itself.

For this phase, stop after the local review artifact. Do not promote `docs/release-candidate/events.json` into production yet.

## Reporting a cancellation or urgent correction

When the endpoint exists, open the same event issue form, choose **Cancellation** (or **Correction**), and include the event ID/name, exact occurrence date and venue, what changed, and a public organizer notice URL. Suggested title: `[Cancellation] Event name — YYYY-MM-DD — venue`. Reports require review; users should check the organizer before travel. Avoid private screenshots or personal contact information.

The maintainer checks cancellation reports first when available, verifies the public notice, and preserves the event ID, original schedule, source history, and any previously verified end. Set `status: cancelled`, advance `updatedAt`, and set `lastVerified` only to the actual source check. Store the cancellation evidence alongside the original evidence; a later reinstatement needs new organizer evidence and a later revision. Do not delete a cancellation to tidy the page. If a credible report cannot yet be publicly verified, record the uncertainty and reconsider a confirmed label; do not declare cancellation from an omission or 403.

Calendar downloads are snapshots. Tell affected users to check their imported entry manually; client updates and cancellation imports are not guaranteed. Carmel's end is unknown, so neither event nor cancellation ICS can be produced. Never invent a duration to enable it.

Before the endpoint exists, keep the proposed report locally. There is no operational cancellation inbox in this candidate. The moderator introduction below asks which public route the community would accept; nothing has been sent.

## Achievable weekly routine

Budget **20–30 minutes once per week**, for example Sunday evening Indianapolis time:

- 5 minutes: triage new issues, giving imminent corrections/cancellations priority.
- 10–15 minutes: recheck the next seven days against public sources; process only as many occurrences as can be verified. Keep the catalog small. Do not copy recurring dates automatically.
- 5–10 minutes: review the diff, run checks, inspect list/month/details and links, then follow the authorized release procedure. Record the check date even if the decision is “no changes”; update event verification timestamps only for sources actually checked.

If capacity allows, spend a few minutes rechecking an event within 48 hours of its start. For the November 10 Carmel candidate, that means a further check on November 8–10 before any release or travel advice. This is best effort, not an alerting service. If a weekly session is missed, do not refresh timestamps on rebuild. The existing 14-day stale rule will disclose age, and old occurrences will leave Upcoming under the documented timing policy. An empty catalog is acceptable.

## Discord moderator introduction — unsent draft

Hi! I’m preparing Night City Events — Indy, a small unofficial Cyberpunk TCG event calendar based on public organizer sources. The local review candidate has one verified occurrence: Next Level Games Carmel, November 10 at 6 PM ($11). Its end time is unknown, so calendar export is disabled. Nothing is published yet.

Would a source-linked calendar be useful to your community? I’d appreciate feedback on the one-event experience, verification wording, and a proposed public GitHub issue form for additions, corrections, and cancellations. I’m aiming for one maintainer and a modest weekly review, with no Discord bot. Before sharing a link publicly, I’d want your guidance on fit and reporting expectations. Thanks!

Recheck the dated occurrence and revise this draft before any later authorized outreach. Do not imply moderator endorsement, an operating inbox, or a live site. No message has been sent.
