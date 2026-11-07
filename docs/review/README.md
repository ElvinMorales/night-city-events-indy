# Review-only event candidates

`events.candidates.json` is a JSON array of complete records following the existing `src/events.ts` Zod schema. It is outside the application source and is not a publication queue processed by automation.

The Phase 3A file is intentionally **empty**. All discovered occurrences lack required verification facts or link checks; incomplete leads belong in [`../EVENT-SOURCE-REPORT.md`](../EVENT-SOURCE-REPORT.md), not this array. Do not fill required fields with placeholders or estimated end times.

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
