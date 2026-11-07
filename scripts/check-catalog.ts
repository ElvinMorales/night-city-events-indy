import fs from 'node:fs';
import { loadCatalog, duplicateCandidates } from '../src/catalog';
let input: unknown;
try { input = JSON.parse(fs.readFileSync(new URL('../src/data/events.json', import.meta.url), 'utf8')); }
catch (error) { console.error('Catalog JSON could not be read:', error); process.exit(1); }
const result = loadCatalog(input);
if (result.errors.length) { console.error(result.errors.join('\n')); process.exit(1); }
console.log(`Catalog valid: ${result.events.length} real event(s).`);
const candidates = duplicateCandidates(result.events);
for (const c of candidates) console.warn(`REVIEW DUPLICATE: ${c.first} / ${c.second}: ${c.reason}`);
console.log(`${candidates.length} possible duplicate pair(s); review manually, never auto-merge.`);
