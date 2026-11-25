import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const readJSON = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const production = readJSON('src/data/events.json');
const samples = readJSON('src/data/samples.json');
const candidates = [
  ...readJSON('docs/review/events.candidates.json'),
  ...readJSON('docs/release-candidate/events.json'),
].filter(event => !production.some(published => published.id === event.id));
const forbidden = [...samples.flatMap(event => [event.id, event.name, event.venue, event.address]), ...candidates.map(event => event.id)];
const files = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    assert(!entry.isSymbolicLink(), `Artifact contains a symlink: ${file}`);
    if (entry.isDirectory()) walk(file);
    else files.push(path.relative(dist, file).split(path.sep).join('/'));
  }
}
walk(dist);
assert(files.includes('index.html'), 'Missing dist/index.html');
for (const file of files) {
  assert(file === 'index.html' || /^assets\/[\w-]+\.(js|css)$/.test(file), `Unexpected public artifact: ${file}`);
  const text = fs.readFileSync(path.join(dist, file), 'utf8');
  for (const value of forbidden) assert(!text.includes(value), `Review/demo record leaked into ${file}: ${value}`);
  for (const marker of ['tailscale-user-login', 'indy-github-token', 'INDY_GITHUB_PUBLICATION', '/var/lib/indy-discovery', 'lastSuccessfulReview']) {
    assert(!text.includes(marker), `Moderator tooling leaked into ${file}`);
  }
  assert(!text.includes('sourceMappingURL='), `Source map exposed by ${file}`);
}
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]);
assert(assets.some(file => file.endsWith('.js')), 'Missing JS entry');
assert(assets.some(file => file.endsWith('.css')), 'Missing CSS entry');
for (const asset of assets) {
  assert(asset.startsWith('/night-city-events-indy/assets/'), `Asset does not use the Pages base: ${asset}`);
  assert(files.includes(asset.slice('/night-city-events-indy/'.length)), `Missing asset: ${asset}`);
}
console.log(`Pages artifact valid: ${files.length} files; /night-city-events-indy/ assets resolve; no demo or unpromoted candidate records.`);
