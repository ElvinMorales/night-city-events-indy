# Indy publication readiness

The implementation extends the current Unix-socket report and uses a private JSON decision ledger in the existing state directory. The six-hour discovery service, the queue format, public app entry point and existing manual Pages release path retain their current operating roles. Routine operation uses the existing host and GitHub Actions.

## Isolated demonstration

Run from the repository root.

```sh
npm exec vitest -- run src/moderator-publication.test.ts
npm test
npm run typecheck
npm run build
```

The dashboard fixture sends the same authenticated form requests as the server, using a disposable queue, a fixed clock and a simulated GitHub service. It exercises defer and dismiss across refresh, organizer verification, preview, staging, failed validation, explicit publication of the validated SHA, deployment status and recorded completion. A second test runs the Git promotion against a real bare test repo and verifies that concurrent or missing main refs block promotion. A transition test independently regenerates the proposed catalog and detects a reordered record, missing provenance or a leaked field. The existing operational tests exercise preservation of the last successful queue on failed discovery.

## Results

All 89 tests passed, including the 70 existing tests. TypeScript, the production build and the Pages artifact audit passed. The isolated proposal added one synthetic event to the 38-record catalog. The one-file commit passed the same parent-transition check, all 89 tests, typecheck and the Pages build. The built bundle contained the authorized fixture event and no private queue or credential markers. The rehearsal also exposed historical discovery tests coupled to mutable production data. Those comparisons now use four fixed historical records while the production checks continue to validate the actual catalog.

The fixture does not contact TavernFinder, modify the production catalog, create a GitHub branch or request a live deployment. Chromium, WebKit and local socket runs were blocked by this workspace's process restrictions. The dashboard layout and handlers have been exercised without a live browser. Verify mobile form layout, the Tailscale reverse proxy and its forwarded identity and Origin behavior during the supervised post-approval check. Live GitHub Actions permissions, main rules and Pages behavior also require that check.

## Activation decision

Server installation, repository write credentials, enabling automated deployment and any production catalog release require approval. The [operations guide](PUBLICATION.md) carries the activation order, stop controls and rollback commands.

A future organizer feed can supply a new evidence producer through the typed approval input and a corresponding verifier in the transition policy. Review and publish remain distinct. An unattended producer would require dated, game-specific organizer evidence, a stable occurrence identifier, independent verification and permission to redistribute the relevant data. TavernFinder remains a discovery source only.
