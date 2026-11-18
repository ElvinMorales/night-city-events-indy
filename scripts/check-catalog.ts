import { duplicateCandidates } from '../src/catalog';
import { assertProductionCatalog } from './production-policy';
const result = assertProductionCatalog();
console.log(`Catalog valid: ${result.events.length} real event(s).`);
const candidates = duplicateCandidates(result.events);
for (const c of candidates) console.warn(`REVIEW DUPLICATE: ${c.first} / ${c.second}: ${c.reason}`);
console.log(`${candidates.length} possible duplicate pair(s); review manually, never auto-merge.`);
