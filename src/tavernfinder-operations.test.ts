import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import production from './data/events.json';
import registry from '../docs/sources/melee-locations.json';
import { loadCatalog } from './catalog';
import { review } from '../tools/tavernfinder-discovery/review';
import { readLastSuccess, refreshHealth, refreshQueue, writeLastSuccess } from '../tools/tavernfinder-discovery/queue';
import { gameId, readTavernFinder, type RequestPage } from '../tools/tavernfinder-discovery/source';

const first = '2026-11-24T18:39:26.000Z';
const later = '2026-11-25T00:39:26.000Z';
const controls = { globalEnabled: true, sourceEnabled: true };
const eventId = '123e4567-e89b-42d3-a456-000000000001';
const observation = {
  id: eventId, venueId: '123e4567-e89b-42d3-a456-000000000002', gameBggId: gameId,
  venueName: 'Books & Brews', venueCity: 'Indianapolis', date: '2027-01-09',
  startTime: '18:00:00', title: 'Fixture Night City Brawl', description: 'Please keep this raw description out of reports.',
  endTime: '19:00:00', status: 'confirmed',
};
const directories: string[] = [];
function directory() {
  const path = mkdtempSync(join(tmpdir(), 'tavernfinder-test-'));
  directories.push(path);
  return path;
}
afterEach(() => {
  for (const path of directories.splice(0)) rmSync(path, { recursive: true, force: true });
});
const events = loadCatalog(production, { now: new Date(first) }).events;
async function result(at: string, request: RequestPage, enabled = controls) {
  return review(await readTavernFinder(enabled, request, () => new Date(at)), events, registry.locations);
}
const successful = async () => ({ status: 200, body: { data: [observation], total: 1 } });

describe('TavernFinder operational integration', () => {
  it.each([
    ['inaccessible', async () => ({ status: 503 })],
    ['malformed', async () => ({ status: 200, body: { data: null } })],
    ['incomplete', async (offset: number) => offset
      ? { status: 503 } : { status: 200, body: { data: [observation], total: 2 } }],
  ] as const)('keeps the last successful private queue after a %s refresh', async (outcome, request) => {
    const state = directory();
    const path = join(state, 'queue.json');
    const read = () => JSON.parse(readFileSync(path, 'utf8'));
    await refreshQueue(state, () => result(first, successful));
    const saved = read();
    expect(saved.lastSuccessfulReview.moderatorQueue).toEqual([eventId]);
    expect(saved.lastSuccessfulReview.findings[0]).toMatchObject({ kind: 'new-lead', canonicalId: null });
    expect(saved.lastSuccessfulReview.findings[0].observation).not.toHaveProperty('status');
    expect(readFileSync(path, 'utf8')).not.toContain(observation.description);
    expect(statSync(path).mode & 0o777).toBe(0o600);

    const health = await refreshQueue(state, () => result(later, request));
    expect(health).toMatchObject({ outcome, lastSuccessfulStateUpdated: false, lastSuccessfulRefresh: first });
    expect(read().lastSuccessfulReview).toEqual(saved.lastSuccessfulReview);
    expect(read().lastAttempt.checkedAt).toBe(later);
  });

  it('honors shutdown and replaces old discovery state only on the next complete refresh', async () => {
    const state = directory();
    await refreshQueue(state, () => result(first, successful));
    const request = vi.fn(async () => ({ status: 200, body: { data: [], total: 0 } }));
    expect(await refreshQueue(state, () => result(later, request, { ...controls, globalEnabled: false })))
      .toMatchObject({ outcome: 'disabled', lastSuccessfulRefresh: first });
    expect(request).not.toHaveBeenCalled();

    const next = await refreshQueue(state, () => result(later, request));
    expect(next).toMatchObject({ outcome: 'success', lastSuccessfulRefresh: later });
    const saved = JSON.parse(readFileSync(join(state, 'queue.json'), 'utf8'));
    expect(saved.lastSuccessfulReview.findings).toEqual([]);
    expect(saved.lastSuccessfulReview.moderatorQueue).toEqual([]);
  });

  it('exposes only approved aggregate health and a timestamp in hosted output', async () => {
    const state = directory();
    const report = await result(first, successful);
    const health = refreshHealth(report, null);
    writeLastSuccess(state, health.lastSuccessfulRefresh!);
    const path = join(state, 'last-success.json');
    expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual({ lastSuccessfulRefresh: first });
    expect(readLastSuccess(path)).toBe(first);
    const aggregate = JSON.stringify(health);
    expect(aggregate).not.toContain(eventId);
    expect(aggregate).not.toContain(observation.venueName);
    expect(aggregate).not.toContain(observation.description);
    const failed = await result(later, async () => ({ status: 429 }));
    expect(refreshHealth(failed, readLastSuccess(path)).lastSuccessfulRefresh).toBe(first);
  });
});
