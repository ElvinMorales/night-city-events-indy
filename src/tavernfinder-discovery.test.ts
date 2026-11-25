import { describe, expect, it, vi } from 'vitest';
import catalogFixture from './test-fixtures/discovery-catalog.json';
import registry from '../docs/sources/melee-locations.json';
import { loadCatalog } from './catalog';
import { gameId, maxPages, normalizeObservation, readTavernFinder, requestPage } from '../tools/tavernfinder-discovery/source';
import { markdown, review, summary } from '../tools/tavernfinder-discovery/review';

const timestamp = '2026-11-24T18:39:26.000Z';
const clock = () => new Date(timestamp);
const controls = { globalEnabled: true, sourceEnabled: true };
const id = (n: number) => '123e4567-e89b-42d3-a456-' + String(n).padStart(12, '0');
const row = (overrides = {}) => ({
  id: id(1), venueId: id(50), venueName: "Mage's Comics and Games, Inc.", venueCity: 'Indianapolis',
  venueLatitude: '39.6580446', venueLongitude: '-86.1329663',
  gameBggId: gameId, title: 'Mages Cyberpunk Brawl', date: '2026-11-28', startTime: '13:00:00',
  endTime: '14:00:00', endsAt: '2026-11-28T20:00:00Z', description: 'DO NOT DISTRIBUTE',
  entryFeeAmount: 10, registrationUrl: 'https://example.com/', gameFormatName: 'Constructed', status: 'confirmed',
  ...overrides,
});
const page = (data: unknown[], total = data.length) => ({ status: 200, body: { data, total } });
const read = (rows: unknown[]) => readTavernFinder(controls, async () => page(rows), clock);

describe('TavernFinder public discovery', () => {
  it('uses the documented unauthenticated GET with the custom ID and a bounded timeout', async () => {
    const fetchPage = vi.fn(async () => Response.json({ data: [], total: 0 }));
    expect(await requestPage(100, fetchPage)).toEqual(page([]));
    expect(fetchPage).toHaveBeenCalledWith(new URL('https://tavernfinder.com/api/v1/activities/discover?lat=39.7684&lng=-86.1581&gameBggId=900000114&type=event&limit=100&offset=100'),
      { method: 'GET', headers: { Accept: 'application/json' }, credentials: 'omit', redirect: 'manual', signal: expect.any(AbortSignal) });
  });

  it.each([{ globalEnabled: false, sourceEnabled: true }, { globalEnabled: true, sourceEnabled: false }])(
    'makes no requests when disabled %j', async disabled => {
      const request = vi.fn();
      expect(await readTavernFinder(disabled, request, clock)).toMatchObject({ outcome: 'disabled', checks: [] });
      expect(request).not.toHaveBeenCalled();
    },
  );

  it('normalizes coordinates, UUIDs and summer/winter starts and drops publication fields', () => {
    const winter = normalizeObservation(row({ id: id(1).toUpperCase() }), timestamp);
    expect(winter).toEqual({
      source: 'tavernfinder', sourceId: id(1), sourceVenueId: id(50), venueName: "Mage's Comics and Games, Inc.",
      venueCity: 'Indianapolis', lat: 39.6580446, lng: -86.1329663, title: 'Mages Cyberpunk Brawl',
      start: '2026-11-28T13:00:00-05:00', date: '2026-11-28', timezone: 'America/Indiana/Indianapolis',
      gameId, observedAt: timestamp, evidence: 'organizer-evidence-missing',
    });
    expect(normalizeObservation(row({ date: '2026-06-01', startTime: '13:00' }), timestamp)?.start)
      .toBe('2026-06-01T13:00:00-04:00');
  });

  it.each([
    { date: '2026-02-30' }, { date: '2026-03-08', startTime: '02:30' },
    { date: '2026-11-01', startTime: '01:30' }, { startTime: '24:00' },
    { gameBggId: 463317 }, { id: 'bad-id' }, { venueLatitude: '91' },
  ])('rejects malformed or ambiguous rows %j', async overrides => {
    expect(await read([row(overrides)])).toMatchObject({ outcome: 'malformed', invalidRows: 1, observations: [] });
  });

  it('distinguishes malformed bodies, inaccessible requests and partial responses', async () => {
    const malformed = await requestPage(0, async () => new Response('{broken', { headers: { 'content-type': 'application/json' } }));
    expect((await readTavernFinder(controls, async () => malformed, clock)).outcome).toBe('malformed');
    expect((await readTavernFinder(controls, async () => ({ status: 200, body: { data: [], total: '1' } }), clock)).outcome).toBe('malformed');
    expect((await readTavernFinder(controls, async () => ({ status: 429 }), clock)).outcome).toBe('inaccessible');
    expect((await readTavernFinder(controls, async () => { throw new Error('timeout'); }, clock)).outcome).toBe('inaccessible');
    expect(await read([row(), row({ date: 'unknown' })])).toMatchObject({ outcome: 'incomplete', invalidRows: 1 });
    expect(await read([])).toMatchObject({ outcome: 'success', checks: [{ observedAt: timestamp, validPage: true }] });
    const partial = await readTavernFinder(controls, async offset => offset ? { status: 503 } : page([row()], 2), clock);
    expect(partial).toMatchObject({ outcome: 'incomplete', returnedRows: 1 });
  });

  it('caps pagination and detects inconsistent totals and repeated UUIDs', async () => {
    const request = vi.fn(async offset => page([row({ id: id(offset + 1) })], 9));
    expect(await readTavernFinder(controls, request, clock)).toMatchObject({ outcome: 'incomplete', reason: 'Page budget exhausted' });
    expect(request.mock.calls).toEqual(Array.from({ length: maxPages }, (_, offset) => [offset]));
    expect(await readTavernFinder(controls, async offset => page([row()], offset ? 3 : 2), clock))
      .toMatchObject({ outcome: 'incomplete', reason: 'Inconsistent pagination' });
    expect(await read([row(), row()])).toMatchObject({ outcome: 'incomplete', repeatedIds: 1 });
  });
});

describe('TavernFinder moderator review', () => {
  const { events } = loadCatalog(catalogFixture, { now: clock() });

  it('preserves catalog IDs, flags the Mage’s pair and Muncie discrepancy, and isolates new venues', async () => {
    const snapshot = JSON.stringify(events);
    const source = await read([
      row(),
      row({ id: id(2), title: 'Mages Cyberpunk Showdown' }),
      row({ id: id(3), venueId: id(51), venueName: 'Next Level Games - Muncie', venueCity: 'Muncie',
        venueLatitude: 40.2196248, venueLongitude: -85.3827925, date: '2026-11-26', startTime: '10:00',
        title: 'Cyberpunk - Night City Brawl' }),
      row({ id: id(4), venueId: id(52), venueName: 'Fixture Unregistered Venue' }),
      row({ id: id(5), date: '2027-01-24' }),
      row({ id: id(6), venueLatitude: '70' }),
      row({ id: id(7), date: '2026-11-24', startTime: '08:00' }),
    ]);
    const report = review(source, events, registry.locations);
    expect(report.findings.map(({ kind, canonicalId }) => [kind, canonicalId])).toEqual([
      ['existing-match', 'cyberpunk-night-city-brawl-mages-comics-2026-11-28'],
      ['cross-source-duplicate', null], ['potential-schedule-change', null], ['unresolved-venue', null],
    ]);
    expect(report.findings[2].related[0].start).toBe('2026-11-25T19:00:00-05:00');
    expect(report.duplicateCandidates).toEqual([{ reason: 'shared-venue-and-start', sourceIds: [id(1), id(2)] }]);
    expect(report.metrics).toMatchObject({
      inCoverage: 4, outsideRadius: 1, outOfWindow: 2, activeRegistryVenues: 13,
      activeVenuesRepresented: 2, knownUpcoming: 3, matchedUpcoming: 1, newDatedLeads: 1, missingOrganizerEvidence: 4,
    });
    expect(JSON.stringify(events)).toBe(snapshot);
    expect(markdown(report)).toContain('organizer evidence missing');
    expect(JSON.stringify(report)).not.toContain('DO NOT DISTRIBUTE');
    expect(JSON.stringify(summary(report))).not.toMatch(/Mage|Muncie|Fixture Unregistered|123e4567/);
  });

  it('does not create a cancellation when a catalog event is missing', async () => {
    const report = review(await read([]), events, registry.locations);
    expect(report.findings).toEqual([]);
    expect(report.metrics).toMatchObject({ knownUpcoming: 3, matchedUpcoming: 0 });
  });

  it('flags competing canonical records without arbitrarily choosing one', async () => {
    const match = events.find(event => event.id === 'cyberpunk-night-city-brawl-mages-comics-2026-11-28')!;
    const report = review(await read([row()]), [match, { ...match, id: 'another-catalog-id' }], registry.locations);
    expect(report.findings[0]).toMatchObject({ kind: 'cross-source-duplicate', canonicalId: null });
    expect(report.findings[0].related).toHaveLength(2);
  });
});
