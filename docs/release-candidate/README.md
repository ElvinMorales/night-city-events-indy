# Phase 3C release candidate — review only

`events.json` contains **one listing-ready production-schema record**, Carmel on November 10, 2026. It is separate from `src/data/events.json`, which remains `[]`. No build imports this folder. This is an evidence-reviewed candidate, not publication approval or a deployed catalog.

The new [evidence ledger](evidence.json) records actual November 7 browser checks, public URLs, decisions and the original Carmel verification/revision times. The [Phase 3B report](../PHASE-3B-REPORT.md) and [original review array](../review/events.candidates.json) are unchanged historical evidence. Only `lastVerified` and `updatedAt` differ from that original record. The full date/start, fee, address, coordinates, source, registration entry point and stable ID are retained. Unknown `end` remains omitted. No future recurrence is inferred.

The public organizer calendar still displays the dated Carmel card and reservation button. The calendar is an entry point, not a stable occurrence permalink or a tested checkout. No cancellation notice appeared in the inspected page; later changes remain possible. Good Games November 8 and Bulldog November 12 are excluded because their evidence gaps remain unresolved.

Review screenshots: [desktop](preview-desktop.png) and [mobile](preview-mobile.png). These use browser-only candidate injection and do not show a published catalog.

For local candidate review, the optional [browser harness](../../scripts/phase-3c-browser-check.mjs) intercepts only the local browser's production-data module in memory. It never writes the production catalog. See [QA instructions](../qa/PHASE-3C.md). The ordinary production build still intentionally shows the empty catalog.

Validate without promotion from the project root:

```sh
node --import tsx --input-type=module <<'NODE'
import fs from 'node:fs';
import {eventSchema} from './src/events.ts';
import {loadCatalog, duplicateCandidates} from './src/catalog.ts';
const candidate = JSON.parse(fs.readFileSync('docs/release-candidate/events.json', 'utf8'));
const production = JSON.parse(fs.readFileSync('src/data/events.json', 'utf8'));
eventSchema.array().parse(candidate);
const loaded = loadCatalog(candidate);
if (loaded.errors.length) throw new Error(loaded.errors.join('\n'));
console.log('Candidate records:', loaded.events.length);
console.log('Review duplicates:', duplicateCandidates([...production, ...candidate]));
NODE
```

A future authorized release must recheck freshness/cancellation, select and test the actual reporting destination, resolve the launch checklist, and explicitly approve promotion. Keep all earlier evidence. An unknown end alone does not block listing; it blocks ICS. See [Phase 3C readiness](../PHASE-3C-REPORT.md).
