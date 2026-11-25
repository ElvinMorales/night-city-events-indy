import { execFileSync } from 'node:child_process';
import { promoteCatalogRef } from '../tools/tavernfinder-discovery/promote';
import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateCatalog, verifyCatalogTransition, type Approval } from '../tools/tavernfinder-discovery/catalog-update';
import { candidateKey, Moderation, type Finding } from '../tools/tavernfinder-discovery/moderation';
import { dashboard } from '../tools/tavernfinder-discovery/dashboard';
import { GitHubPublication, type Publication, type Run } from '../tools/tavernfinder-discovery/publication';
import { normalizeObservation } from '../tools/tavernfinder-discovery/source';

const base = 'a'.repeat(40), sha = 'b'.repeat(40), other = 'c'.repeat(40);
const at = '2026-11-25T12:00:00.000Z';
const clock = () => new Date(at);
const moderator = 'fixture@moderator.invalid';
const origin = 'https://private.example.invalid:10443';
const details = {
  targetId: '', name: 'Indy Organizer Convention', venue: 'Community Hall',
  address: '100 Community Road, Indianapolis', lat: 39.76, lng: -86.15,
  start: '2027-01-09T18:00:00-05:00', type: 'Tournament' as const, format: 'Constructed',
  description: '', sourceUrl: 'https://organizer.meetup.com/calendar/23879',
  registrationUrl: 'https://organizer.meetup.com/registration/23879',
};
const approval: Approval = { base, verifiedAt: at, method: 'moderator-organizer-check', details };
const catalog = (content: string) => JSON.parse(content);
const observation = normalizeObservation({
  id: '123e4567-e89b-42d3-a456-000000000001', venueId: '123e4567-e89b-42d3-a456-000000000002',
  gameBggId: 900000114, venueName: 'Private venue label', title: 'Private <observation> marker',
  date: '2027-01-09', startTime: '18:00:00',
}, at)!;
const finding: Finding = { observation, kind: 'new-lead', registryKey: null, withinRadius: true, canonicalId: null, related: [] };
const directories: string[] = [];
afterEach(() => {
  for (const dir of directories.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function privateQueue() {
  const dir = mkdtempSync(join(tmpdir(), 'indy-moderator-test-'));
  directories.push(dir);
  mkdirSync(join(dir, 'queue'), { mode: 0o700 });
  function refresh(catalogRevision: string, findings: Finding[] = [finding]) {
    writeFileSync(join(dir, 'queue', 'queue.json'), JSON.stringify({
      lastSuccessfulRefresh: at, lastAttempt: { outcome: 'success', checkedAt: at },
      lastSuccessfulReview: { catalogRevision, check: { checkedAt: at }, findings, duplicateCandidates: [],
        moderatorQueue: findings.map(({ observation }) => observation.sourceId) },
    }), { mode: 0o600 });
  }
  refresh(base);
  return { dir, refresh };
}

describe('deterministic production catalog', () => {
  it('adds independently verified details only and repeats deterministically', () => {
    const proposal = generateCatalog(base, [], [approval, approval], clock());
    expect(proposal).toEqual(generateCatalog(base, [], [approval], clock()));
    const [row] = catalog(proposal.content);
    expect(row.id).toMatch(/^indy-/);
    expect(row).toMatchObject({ sourceUrl: details.sourceUrl,
      verificationMethod: approval.method, status: 'confirmed', lastVerified: at });
    expect(row).not.toHaveProperty('end');
    expect(row).not.toHaveProperty('fee');
    expect(proposal.content).not.toContain(observation.sourceId);
    expect(generateCatalog(base, [row], [approval], clock()).changes).toEqual([]);
  });

  it('corrects the canonical ID without modifying other records or inferring cancellation', () => {
    const first = generateCatalog(base, [], [approval], clock()).changes[0].after;
    const unrelated = { ...first, id: 'older-record', start: '2026-11-20T19:00:00-05:00', status: 'cancelled', legacy: 'keep' };
    const later = new Date('2026-11-26T12:00:00Z');
    const correction = { ...approval, verifiedAt: later.toISOString(), details: {
      ...details, start: '2027-01-10T19:00:00-05:00', targetId: first.id,
    } };
    const result = generateCatalog(base, [unrelated, first], [correction], later);
    expect(catalog(result.content)[0]).toEqual(unrelated);
    expect(catalog(result.content)[1]).toMatchObject({ id: first.id, start: correction.details.start });
    expect(generateCatalog(base, [first, unrelated], [], later).changes).toEqual([]);
    expect(() => generateCatalog(base, [first], [correction, { ...correction, details }], later)).toThrow();
  });

  it.each([
    ['stale base', { base: other }],
    ['stale evidence', { verifiedAt: '2026-10-01T00:00:00Z' }],
    ['TavernFinder source', { details: { ...details, sourceUrl: 'https://tavernfinder.com/en/events/123' } }],
    ['missing registration', { details: { ...details, registrationUrl: '' } }],
    ['incorrect seasonal offset', { details: { ...details, start: '2027-01-09T18:00:00-04:00' } }],
    ['invalid end', { details: { ...details, end: '2027-01-09T17:00:00-05:00' } }],
  ])('rejects %s', (_name, patch) => {
    expect(() => generateCatalog(base, [], [{ ...approval, ...patch }], clock())).toThrow();
  });

  it('reconstructs the exact transition and rejects extra fields, missing provenance or reordered legacy rows', () => {
    const prior = generateCatalog(base, [], [approval], clock()).changes[0].after;
    const another = { ...approval, details: { ...details, start: '2027-01-10T18:00:00-05:00' } };
    const generated = catalog(generateCatalog(base, [prior], [another], clock()).content);
    expect(() => verifyCatalogTransition(base, [prior], generated, clock())).not.toThrow();
    expect(() => verifyCatalogTransition(base, [prior], [generated[1], prior], clock())).toThrow();
    expect(() => verifyCatalogTransition(base, [prior], [prior, { ...generated[1], privateSourceId: 'queue-token' }], clock())).toThrow();
    expect(() => verifyCatalogTransition(base, [prior], [prior, { ...generated[1], verificationMethod: undefined }], clock())).toThrow();
  });

  it('rejects a cross-ID duplicate and unknown targets', () => {
    const first = generateCatalog(base, [], [approval], clock()).changes[0].after;
    expect(() => generateCatalog(base, [{ ...first, id: 'canonical' }], [approval], clock())).toThrow(/duplicate|matches/);
    expect(() => generateCatalog(base, [first], [{ ...approval, details: { ...details, targetId: 'missing' } }], clock())).toThrow(/does not exist/);
  });
});

const successfulRun: Run = { id: 4, status: 'completed', conclusion: 'success', html_url: 'https://github.com/example/repo/actions/runs/4' };
async function harness(reviewEnabled = true) {
  const state = privateQueue();
  let commit = base;
  let validation: Run | undefined;
  let deployed: Run | undefined;
  const release = vi.fn(async () => { commit = sha; deployed = successfulRun; });
  const publication: Publication = {
    main: async () => commit, catalog: async () => [], stage: async () => ({ sha, branch: 'indy-catalog/isolated' }),
    validation: async () => validation, release, deployment: async () => deployed, retryDeployment: async () => {},
  };
  const store = new Moderation(state.dir, publication, clock);
  const server = dashboard({ moderator, origin, reviewEnabled, moderation: store });
  const headers = { 'tailscale-user-login': moderator };
  const request = (method: string, url: string, headers: Record<string, string>, body = '') => {
    const req = Object.assign(Readable.from([Buffer.from(body)]), {
      method, url, headers, headersDistinct: Object.fromEntries(Object.entries(headers).map(([key, value]) => [key, [value]])),
    });
    return new Promise<Response>(resolve => {
      let code: number;
      const responseHeaders = new Headers();
      const res = {
        setHeader(name: string, value: string) { responseHeaders.set(name, value); },
        writeHead(value: number, headers: Record<string, string> = {}) {
          code = value;
          for (const [name, content] of Object.entries(headers)) responseHeaders.set(name, content);
          return res;
        },
        end(payload?: string) { resolve(new Response(payload, { status: code, headers: responseHeaders })); },
      };
      server.emit('request', req as unknown as IncomingMessage, res as unknown as ServerResponse);
    });
  };
  const get = (custom = headers) => request('GET', '/', custom);
  const html = async () => (await get()).text();
  const token = (await html()).match(/name="csrf" value="([a-f0-9]+)"/)?.[1] ?? '';
  const post = (path: string, values: Record<string, unknown>, options: { token?: string; origin?: string; login?: string; site?: string } = {}) =>
    request('POST', path, { 'tailscale-user-login': options.login ?? moderator, origin: options.origin ?? origin,
      'sec-fetch-site': options.site ?? 'same-origin', 'content-type': 'application/x-www-form-urlencoded' },
      new URLSearchParams(Object.entries({ csrf: options.token ?? token, version: store.read().version, ...values })
        .map(([key, value]) => [key, String(value)])).toString());
  const review = { ...details, key: candidateKey(finding), snapshot: store.snapshotKey(store.snapshot().report!),
    decision: 'approved', verified: 'yes', identity: 'yes' };
  const publish = (action: string) => post('/publication', { action, proposal: store.read().release?.id ?? '' });
  return { ...state, store, get, html, post, review, publish, release,
    validate: (result: Run | undefined) => { validation = result; }, advance: () => { commit = other; } };
}

describe('private dashboard', () => {
  it('rejects unauthenticated, forged, cross-site and disabled writes', async () => {
    const h = await harness();
    const page = await h.get();
    expect(page.headers.get('referrer-policy')).toBe('same-origin');
    expect(page.headers.get('content-security-policy')).toContain("form-action 'self'");
    expect(page.headers.get('cache-control')).toBe('private, no-store');
    expect((await h.get({ 'tailscale-user-login': 'unknown' })).status).toBe(403);
    for (const options of [{ login: 'unknown' }, { token: 'bad' }, { site: 'cross-site' }, { origin: 'https://other.invalid' }]) {
      expect((await h.post('/review', h.review, options)).status).toBe(403);
      expect((await h.post('/publication', { action: 'prepare' }, options)).status).toBe(403);
    }
    expect(h.store.read().version).toBe(0);
    const off = await harness(false);
    expect((await off.post('/review', off.review)).status).toBe(403);
  });

  it('persists defer and dismiss across refresh, rejects stale writes and keeps private data escaped', async () => {
    const h = await harness();
    expect(await h.html()).toContain('Private &lt;observation&gt; marker');
    expect((await h.post('/review', { ...h.review, decision: 'deferred', version: 0 })).status).toBe(303);
    expect((await h.post('/review', { ...h.review, decision: 'deferred', version: 0 })).status).toBe(409);
    expect(h.store.read().version).toBe(1);
    expect((await h.post('/review', { ...h.review, decision: 'dismissed' })).status).toBe(303);
    h.refresh(base);
    expect(await h.html()).toContain('<strong>dismissed</strong>');
    h.refresh(other);
    expect((await h.post('/review', h.review)).status).toBe(409);
    expect(statSync(join(h.dir, 'moderation', 'decisions.json')).mode & 0o777).toBe(0o600);
  });

  it('requires verification, previews, validates, authorizes once, dispatches and records success', async () => {
    const h = await harness();
    expect((await h.post('/review', { ...h.review, verified: '' })).status).toBe(409);
    expect((await h.post('/review', h.review)).status).toBe(303);
    expect((await h.publish('prepare')).status).toBe(303);
    expect(await h.html()).toContain('Send proposed revision to GitHub for validation');
    expect(await h.html()).toContain(details.registrationUrl);
    expect(h.store.read().release?.content).not.toContain('Private');
    expect((await h.publish('stage')).status).toBe(303);
    h.validate({ ...successfulRun, conclusion: 'failure' });
    expect((await h.publish('authorize')).status).toBe(409);
    expect(h.release).not.toHaveBeenCalled();
    h.validate(successfulRun);
    expect(await h.html()).toContain('Authorize publication of this revision');
    expect((await h.publish('authorize')).status).toBe(303);
    expect(h.release).toHaveBeenCalledExactlyOnceWith({ sha, branch: 'indy-catalog/isolated' }, base);
    expect((await h.publish('authorize')).status).toBe(409);
    expect((await h.publish('archive')).status).toBe(303);
    expect(readFileSync(join(h.dir, 'moderation', 'decisions.json'), 'utf8')).toContain('"outcome": "deployed"');
  });

  it('refuses a validated proposal after concurrent catalog advancement', async () => {
    const h = await harness();
    await h.post('/review', h.review);
    await h.publish('prepare');
    await h.publish('stage');
    h.validate(successfulRun);
    h.advance();
    expect((await h.publish('authorize')).status).toBe(409);
    expect(h.release).not.toHaveBeenCalled();
    expect(h.store.read().release?.authorizedAt).toBeUndefined();
  });
});

describe('GitHub publication protocol', () => {
  const branch = 'indy-catalog/isolated';
  const response = (value: unknown, status = 200) => new Response(value === null ? null : JSON.stringify(value), { status });
  const run = { ...successfulRun, head_sha: sha, head_branch: branch, event: 'workflow_dispatch' };

  it('creates a one-file child, creates its staging ref and dispatches exact validation', async () => {
    const mock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(response({ object: { sha: base } }))
      .mockResolvedValueOnce(response({ tree: { sha: other } }))
      .mockResolvedValueOnce(response({ sha: other }, 201))
      .mockResolvedValueOnce(response({ sha }, 201))
      .mockResolvedValueOnce(response({ object: { sha } }, 201))
      .mockResolvedValueOnce(response({ workflow_runs: [] }))
      .mockResolvedValueOnce(response(null, 204));
    const client = new GitHubPublication('example/isolated', 'isolated-fake-token', mock);
    const result = await client.stage({ base, content: '[]\n', createdAt: at });
    expect(result.sha).toBe(sha);
    expect(JSON.parse(String(mock.mock.calls[2][1]?.body)).tree).toEqual([
      { path: 'src/data/events.json', mode: '100644', type: 'blob', content: '[]\n' },
    ]);
    expect(JSON.parse(String(mock.mock.calls[3][1]?.body)).parents).toEqual([base]);
    expect(JSON.parse(String(mock.mock.calls[6][1]?.body))).toEqual({ ref: result.branch, inputs: { proposal_sha: sha } });
  });

  it('checks exact validation before compare-and-swap promotion then dispatches Pages for the same SHA', async () => {
    const mock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(response({ object: { sha: base } }))
      .mockResolvedValueOnce(response({ workflow_runs: [{ ...run, head_sha: other }, run] }))
      .mockResolvedValueOnce(response({ object: { sha } }))
      .mockResolvedValueOnce(response({ workflow_runs: [] }))
      .mockResolvedValueOnce(response({ object: { sha } }))
      .mockResolvedValueOnce(response(null, 204));
    const promote = vi.fn(async () => {});
    const client = new GitHubPublication('example/isolated', 'isolated-fake-token', mock, promote);
    await client.release({ branch, sha }, base);
    expect(promote).toHaveBeenCalledExactlyOnceWith('https://github.com/example/isolated.git', { branch, sha }, base, 'isolated-fake-token');
    expect(JSON.parse(String(mock.mock.calls[5][1]?.body))).toEqual({ ref: 'main', inputs: { release_sha: sha, moderator_release: 'true' } });
  });

  it.each([false, true])('does not dispatch after failed validation or a lease race (race=%s)', async race => {
    const mock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(response({ object: { sha: base } }))
      .mockResolvedValueOnce(response({ workflow_runs: [{ ...run, conclusion: race ? 'success' : 'failure' }] }))
      .mockResolvedValueOnce(response({ object: { sha } }));
    const promote = vi.fn(async () => { throw new Error('stale lease'); });
    const client = new GitHubPublication('example/isolated', 'isolated-fake-token', mock, promote);
    await expect(client.release({ branch, sha }, base)).rejects.toThrow();
    expect(mock).toHaveBeenCalledTimes(race ? 3 : 2);
    expect(promote).toHaveBeenCalledTimes(race ? 1 : 0);
  });
});

it('promotes the exact staged commit in a local bare repository and refuses an unrelated concurrent main', async () => {
  const path = mkdtempSync(join(tmpdir(), 'indy-git-test-'));
  directories.push(path);
  const local = join(path, 'local');
  const remote = join(path, 'remote.git');
  const git = (cwd: string, ...args: string[]) => execFileSync('/usr/bin/git', args, {
    cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    env: { PATH: '/usr/bin:/bin', HOME: path, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null',
      GIT_AUTHOR_NAME: 'Indy fixture', GIT_AUTHOR_EMAIL: 'fixture@invalid',
      GIT_COMMITTER_NAME: 'Indy fixture', GIT_COMMITTER_EMAIL: 'fixture@invalid' },
  }).trim();
  git(path, 'init', '--bare', '--initial-branch=main', remote);
  git(path, 'init', '--initial-branch=main', local);
  git(local, 'commit', '--allow-empty', '-m', 'Base');
  const base = git(local, 'rev-parse', 'HEAD');
  git(local, 'push', remote, 'main');
  const branch = 'indy-catalog/isolated';
  git(local, 'checkout', '-b', branch);
  git(local, 'commit', '--allow-empty', '-m', 'Approved');
  const sha = git(local, 'rev-parse', 'HEAD');
  git(local, 'push', remote, branch);
  await promoteCatalogRef(remote, { branch, sha }, base);
  expect(git(remote, 'rev-parse', 'main')).toBe(sha);

  git(local, 'checkout', 'main');
  git(local, 'commit', '--allow-empty', '-m', 'Concurrent update');
  const concurrent = git(local, 'rev-parse', 'HEAD');
  git(local, 'push', '--force', remote, 'main');
  await expect(promoteCatalogRef(remote, { branch, sha }, base)).rejects.toThrow(/promotion failed/);
  expect(git(remote, 'rev-parse', 'main')).toBe(concurrent);

  git(remote, 'update-ref', '-d', 'refs/heads/main');
  await expect(promoteCatalogRef(remote, { branch, sha }, base)).rejects.toThrow(/promotion failed/);
});
