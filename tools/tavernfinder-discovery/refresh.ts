import { mkdtempSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import catalog from '../../src/data/events.json';
import registry from '../../docs/sources/melee-locations.json';
import { loadCatalog } from '../../src/catalog';
import { markdown, review } from './review';
import { readTavernFinder } from './source';
import { readLastSuccess, refreshHealth, refreshQueue, writeLastSuccess } from './queue';

const [mode, directory, ...extra] = process.argv.slice(2);
if (extra.length || (mode === '--hosted' ? !directory : directory || !['--local', '--queue', '--summary-only'].includes(mode))) {
  console.error('Usage: refresh.ts <--local|--queue|--summary-only|--hosted health-directory>');
  process.exit(2);
}

const { events, errors } = loadCatalog(catalog);
if (errors.length) {
  console.error('Production catalog validation failed');
  process.exit(1);
}

async function retrieve() {
  const source = await readTavernFinder({
    globalEnabled: process.env.DISCOVERY_RETRIEVAL_ENABLED === 'true',
    sourceEnabled: process.env.TAVERNFINDER_RETRIEVAL_ENABLED === 'true',
  });
  return review(source, events, registry.locations);
}

async function run() {
  if (mode === '--queue') {
    const state = join(homedir(), '.night-city-events-indy', 'tavernfinder');
    return refreshQueue(state, retrieve);
  }

  const previous = mode === '--hosted' ? readLastSuccess(join(directory, 'last-success.json')) : null;
  const report = await retrieve();
  const health = refreshHealth(report, previous);
  if (mode === '--local') {
    const target = mkdtempSync(join(tmpdir(), 'night-city-tavernfinder-'));
    writeFileSync(join(target, 'review.json'), JSON.stringify(report, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
    writeFileSync(join(target, 'review.md'), markdown(report), { mode: 0o600, flag: 'wx' });
    console.log('Private review directory ' + target);
  }
  if (mode === '--hosted' && health.lastSuccessfulStateUpdated && health.lastSuccessfulRefresh) {
    writeLastSuccess(directory, health.lastSuccessfulRefresh);
  }
  return health;
}

try {
  const health = await run();
  console.log(JSON.stringify(health, null, 2));
  if (health.outcome !== 'success' && health.outcome !== 'disabled') process.exitCode = 1;
} catch {
  console.error('TavernFinder refresh could not read or update its local state.');
  process.exitCode = 1;
}
