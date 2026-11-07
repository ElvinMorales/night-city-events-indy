import { describe, it, expect } from 'vitest';
import samples from './data/samples.json';
import realCatalog from './data/events.json';
import { eventSchema, deduplicate, filterEvents, ics, type Event } from './events';
import { loadCatalog, verification, duplicateCandidates } from './catalog';
const now = new Date('2026-11-21T12:00:00Z');
const fixture = eventSchema.parse(samples[0]);
const real: Event = { ...fixture, sample: false, status: 'confirmed', lastVerified: '2026-11-20T12:00:00Z' };
const filters = { from: '', to: '', type: '', venue: '', radius: 40, query: '' };
describe('launch catalog', () => {
  it('accepts an empty real catalog and filters it safely', () => {
    expect(loadCatalog([])).toEqual({ events: [], errors: [] });
    expect(filterEvents([], filters, now)).toEqual([]);
    expect(duplicateCandidates([])).toEqual([]);
  });
  it('validates the shipped real catalog and forbids samples', () => {
    expect(loadCatalog(realCatalog).errors).toEqual([]);
    expect(loadCatalog([fixture]).events).toEqual([]);
    expect(loadCatalog([fixture]).errors[0]).toContain('forbidden');
    expect(loadCatalog([fixture], { allowSamples: true, now }).events).toHaveLength(1);
  });
  it('rejects confirmed samples even in the demo', () => {
    expect(loadCatalog([{ ...fixture, status: 'confirmed' }], { allowSamples: true }).errors.length).toBeGreaterThan(0);
  });
  it('fails closed for malformed records and non-array catalogs', () => {
    for (const value of [null, {}, [real, { name: 'broken' }], [{ ...real, sourceUrl: 'javascript:alert(1)' }], [{ ...real, id: 'bad\r\nSTATUS:CONFIRMED' }]]) {
      const result = loadCatalog(value, { now });
      expect(result.events).toEqual([]);
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
  it('requires full, valid verification timestamps and rejects future checks', () => {
    for (const lastVerified of ['2026-02-30T10:00:00Z', '2026-11-20', '2027-01-01T10:00:00Z', null]) expect(loadCatalog([{ ...real, lastVerified }], { now }).errors.length).toBeGreaterThan(0);
    expect(loadCatalog([{ ...real, status: 'unverified', lastVerified: null }], { now }).errors).toEqual([]);
  });
});
describe('verification freshness', () => {
  it('keeps recent organizer confirmation distinct from unverified claims', () => {
    expect(verification(real, now)).toMatchObject({ label: 'Organizer confirmed', stale: false, warning: '' });
    expect(verification({ ...real, status: 'unverified' }, now).label).toBe('Unverified');
  });
  it('marks confirmation stale at exactly fourteen days', () => {
    expect(verification({ ...real, lastVerified: '2026-11-07T12:00:01Z' }, now).stale).toBe(false);
    expect(verification({ ...real, lastVerified: '2026-11-07T12:00:00Z' }, now)).toMatchObject({ label: 'Confirmation out of date', stale: true });
  });
  it('handles missing, invalid and future verification defensively', () => {
    for (const lastVerified of [null, 'invalid', '2027-01-01T00:00:00Z']) expect(verification({ ...real, lastVerified }, now).stale).toBe(true);
  });
  it('never disguises samples or cancellations as verified real events', () => {
    expect(verification(fixture, now).label).toBe('Fictional sample');
    expect(verification({ ...real, status: 'cancelled' }, now).label).toBe('Cancelled');
    expect(ics({ ...real, sample: true })).toContain('STATUS:TENTATIVE');
  });
});
describe('moderator revision checks', () => {
  const cancelled: Event = { ...real, status: 'cancelled', updatedAt: '2026-11-09T12:00:00Z' };
  it('keeps latest cancellation regardless of input order', () => {
    expect(deduplicate([cancelled, real])[0].status).toBe('cancelled');
    expect(deduplicate([real, cancelled])[0].status).toBe('cancelled');
    expect(ics(cancelled)).toContain(`UID:${real.id}@nightcityevents.example`);
  });
  it('prefers cancellation in timestamp ties and allows explicit later reinstatement', () => {
    const tied = { ...real, status: 'cancelled' as const, updatedAt: '2026-11-06T19:00:00-05:00' };
    expect(deduplicate([real, tied])[0].status).toBe('cancelled');
    expect(deduplicate([tied, real])[0].status).toBe('cancelled');
    expect(deduplicate([cancelled, { ...real, updatedAt: '2026-11-10T12:00:00Z' }])[0].status).toBe('confirmed');
  });
  it('flags cross-ID source matches without merging records', () => {
    const copy = { ...real, id: 'another-id', sourceUrl: real.sourceUrl + '?utm_source=community' };
    expect(duplicateCandidates([real, copy])).toHaveLength(1);
    expect(deduplicate([real, copy])).toHaveLength(2);
  });
  it('flags similar names and addresses but preserves recurring dates', () => {
    const copy = { ...real, id: 'another-id', name: real.name.toUpperCase(), sourceUrl: 'https://example.org/other-source' };
    expect(duplicateCandidates([real, copy])).toHaveLength(1);
    expect(duplicateCandidates([real, { ...copy, start: '2026-12-13T18:00:00-05:00' }])).toEqual([]);
    expect(duplicateCandidates([real, cancelled])).toEqual([]);
  });
});
