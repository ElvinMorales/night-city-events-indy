# Review-only event candidates

`events.candidates.json` is a JSON array of schema-valid records following the `src/events.ts` Zod schema. It is outside the application source and is not a publication queue processed by automation.

Phase 3B contains **one confirmed occurrence**, Next Level Games Carmel on November 10, 2026. It is ready for list/month/detail review with an unknown end; ICS is unavailable. This is **not publication**. Evidence, link limitations and outstanding leads are in [`../PHASE-3B-REPORT.md`](../PHASE-3B-REPORT.md). Phase 3A's empty-array statements describe that earlier snapshot.

Assess occurrence confirmation separately from feature completeness. Omit an unknown `end`; never supply a placeholder or estimate. Records still missing occurrence evidence or other required fields stay in the reports, not this array. Recheck evidence before any later promotion.

From the project root, validate candidates without touching production:

```sh
node --import tsx --input-type=module <<'NODE'
import fs from 'node:fs';
import { eventSchema } from './src/events.ts';
import { loadCatalog, duplicateCandidates } from './src/catalog.ts';

const candidates = JSON.parse(fs.readFileSync('docs/review/events.candidates.json', 'utf8'));
const production = JSON.parse(fs.readFileSync('src/data/events.json', 'utf8'));
eventSchema.array().parse(candidates);
const result = loadCatalog(candidates);
if (result.errors.length) throw new Error(result.errors.join('\n'));
console.log(`Valid review records: ${candidates.length}`);
console.log('Duplicate candidates:', duplicateCandidates([...production, ...candidates]));
NODE
```

Then run `npm test`, `npm run typecheck` and `npm run build`. Validation checks structure and catalog safeguards; it does not verify an organizer's claims. Review repeated IDs and cross-source duplicates manually, including differently named events at the same venue/time. Preserve stable IDs when revising an occurrence. Keep `src/data/events.json` unchanged during review.
