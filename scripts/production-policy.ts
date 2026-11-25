import { readFileSync } from 'node:fs';
import { loadCatalog } from '../src/catalog';

// Node/build tooling only. Never import this module into the client application.
const fixtures = JSON.parse(readFileSync(new URL('../src/data/samples.json', import.meta.url), 'utf8')) as {
  id: string; name: string; venue: string; address: string;
}[];
const normalize = (value: string) => value.trim().toLowerCase();

export function validateProductionCatalog(input: unknown, now = new Date()) {
  const result = loadCatalog(input, { now });
  // Check every revision, including records deduplicate() would hide.
  if (!result.errors.length && Array.isArray(input)) {
    for (const event of input) {
      if (/^(sample|demo|fixture|qa)(?:[-_]|$)/i.test(event.id) || fixtures.some(fixture =>
        ['id', 'name', 'venue', 'address'].some(key =>
          normalize(event[key]) === normalize(fixture[key as keyof typeof fixture])))) {
        result.errors.push(`${event.id}: development fixture identity is forbidden in production, even with sample: false`);
      }
      for (const key of ['sourceUrl', 'registrationUrl']) {
        if (key === 'registrationUrl' && event[key] === undefined) continue;
        const host = new URL(event[key]).hostname;
        if (/(^|\.)(example\.(com|net|org)|test|invalid|localhost)$/.test(host)) {
          result.errors.push(`${event.id}: ${key} uses a placeholder hostname`);
        }
      }
    }
  }
  if (result.errors.length) result.events = [];
  return result;
}

export function assertProductionCatalog() {
  const input: unknown = JSON.parse(readFileSync(new URL('../src/data/events.json', import.meta.url), 'utf8'));
  const result = validateProductionCatalog(input);
  if (result.errors.length) throw new Error(result.errors.join('\n'));
  return result;
}
