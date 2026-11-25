import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import catalog from './test-fixtures/discovery-catalog.json';
import { buildReport } from '../tools/melee-discovery/report';
import fixture from '../tools/melee-discovery/refresh.fixture.json';
import {
  compareCatalog, fixtureSchema, indianapolisStart, maxPages, pageSize, readSource,
} from '../tools/melee-discovery/discovery';

const [books, goodGames] = fixtureSchema.parse(fixture).sources;
const venues = new Map([['18573', 'Books & Brews']]);
const row = {
  ID: 480151, Game: 'CyberpunkTCG', LocationId: 18573,
  StartDate: '2026-11-21T22:00:00Z',
};
const page = (recordsFiltered: number, ...data: unknown[]) => ({
  status: 200, body: { recordsFiltered, data },
});

describe('Melee organizer-list discovery', () => {
  it('keeps location IDs out of organization list requests', async () => {
    const request = vi.fn();
    expect(await readSource(goodGames, request)).toMatchObject({
      outcome: 'inaccessible', classification: 'inaccessible-source', requests: 0,
    });
    expect(request).not.toHaveBeenCalled();
    expect(fixtureSchema.safeParse({
      label: 'wrong namespace',
      sources: [{ label: 'venue', hub: { kind: 'organization', locationId: 690 }, responses: {} }],
    }).success).toBe(false);
  });

  it('follows offsets using all rows and preserves known catalog identity through a reschedule', async () => {
    const request = vi.fn(async ({ start }) => books.responses[String(start)]);
    const result = await readSource(books, request);
    expect(request.mock.calls.flat()).toEqual([
      { organizationId: '19843', start: 0, length: pageSize },
      { organizationId: '19843', start: 2, length: pageSize },
    ]);
    expect(result).toMatchObject({ outcome: 'complete', excluded: 1 });
    const candidates = compareCatalog([result], catalog, venues);
    expect(candidates.map(({ tournamentId, classification }) => [tournamentId, classification])).toEqual([
      ['480151', 'unchanged'], ['506950', 'changed'],
      ['990000002', 'new'], ['990000003', 'conflicting'],
    ]);
    expect(candidates[1]).toMatchObject({
      canonicalEventId: 'cyberpunk-night-city-brawl-books-and-brews-2026-12-05',
      diff: { start: { catalog: '2026-12-05T18:00:00-05:00', observed: '2026-12-07T18:00:00-05:00' } },
      observations: [{ fee: null, status: null, registrationUrl: null }],
    });
    expect(Object.keys(candidates[1].diff)).toEqual(['start']);
  });

  it('deduplicates repeated tournament identities without merging different listing IDs', async () => {
    const source = await readSource(books, async () => page(2, row, { ...row, ID: '480151' }));
    expect(compareCatalog([source, source], catalog, venues)).toMatchObject([
      { classification: 'unchanged', observations: [{ tournamentId: '480151' }] },
    ]);
    const existing = catalog.find(event => event.sourceUrl?.endsWith('/480151'))!;
    const possibleDuplicate = await readSource(books, async () => page(1, { ...row, ID: 990000004, Name: existing.name }));
    expect(compareCatalog([possibleDuplicate], catalog, venues)).toMatchObject([
      { classification: 'conflicting', canonicalEventId: null, relatedCatalogIds: [existing.id] },
    ]);
  });

  it('distinguishes empty, malformed, inaccessible and incomplete coverage', async () => {
    expect(await readSource(books, async () => page(0))).toMatchObject({ outcome: 'empty' });
    expect(await readSource(books, async () => ({ status: 200, body: { data: [] } }))).toMatchObject({ outcome: 'malformed' });
    expect(await readSource(books, async () => ({ status: 200, body: '<html>' }))).toMatchObject({ outcome: 'malformed' });
    expect(await readSource(books, async () => ({ status: 403 }))).toMatchObject({
      outcome: 'inaccessible', classification: 'inaccessible-source', requests: 1,
    });
    expect(await readSource(books, async () => { throw new Error('offline'); })).toMatchObject({ outcome: 'inaccessible' });
    expect(await readSource(books, async ({ start }) => start ? page(2) : page(2, row))).toMatchObject({
      outcome: 'incomplete', requests: 2, rows: [{ tournamentId: '480151' }],
    });
    expect(await readSource(books, async ({ start }) => start ? page(3, row) : page(2, row))).toMatchObject({
      outcome: 'incomplete', requests: 2,
    });
    const request = vi.fn(async () => page(1000, row));
    expect(await readSource(books, request)).toMatchObject({ outcome: 'incomplete', requests: maxPages });
    expect(request).toHaveBeenCalledTimes(maxPages);
  });

  it('keeps date-only and recurring rows undated, and never infers cancellation from absence', async () => {
    const source = await readSource(books, async () => page(2,
      { ...row, StartDate: '2026-11-21' }, { ...row, ID: 990000004, StartDate: 'Weekly at 7pm' }));
    expect(source.outcome).toBe('incomplete');
    expect(compareCatalog([source], catalog, venues)).toMatchObject([
      { classification: 'conflicting', observations: [{ start: null, status: null }] },
      { classification: 'conflicting', observations: [{ start: null, status: null }] },
    ]);
    expect(compareCatalog([await readSource(books, async () => page(0))], catalog, venues)).toEqual([]);
    expect(compareCatalog([await readSource(books, async () => page(1, { ...row, StatusDescription: 'Canceled' }))], catalog, venues))
      .toMatchObject([{ classification: 'changed', diff: { status: { catalog: 'confirmed', observed: 'cancelled' } } }]);
  });

  it('converts absolute times through Indianapolis daylight transitions', () => {
    expect(indianapolisStart('2026-07-01T16:00:00Z')).toBe('2026-07-01T12:00:00-04:00');
    expect(indianapolisStart('2026-11-01T05:30:00Z')).toBe('2026-11-01T01:30:00-04:00');
    expect(indianapolisStart('2026-11-01T06:30:00Z')).toBe('2026-11-01T01:30:00-05:00');
    expect(indianapolisStart('2026-07-01T16:00:00.1234567Z')).toBe('2026-07-01T12:00:00.1234567-04:00');
    expect(indianapolisStart('2026-07-01T16:00:00')).toBeNull();
    expect(indianapolisStart('2026-02-30T16:00:00Z')).toBeNull();
  });

  it('generates the checked-in reports and preserves the production catalog bytes', async () => {
    const before = readFileSync('src/data/events.json');
    const report = await buildReport('--json', fixture, false, catalog);
    expect(report.json).toBe(readFileSync('docs/review/melee-discovery/example.json', 'utf8'));
    expect(report.markdown).toBe(readFileSync('docs/review/melee-discovery/example.md', 'utf8'));
    expect(readFileSync('src/data/events.json').equals(before)).toBe(true);
  });
});
