import { describe, it, expect } from 'vitest';
import samples from '../src/data/samples.json';
import { validateProductionCatalog } from './production-policy';

describe('production publication boundary', () => {
  it('accepts the intentional empty catalog', () => {
    expect(validateProductionCatalog([])).toEqual({ events: [], errors: [] });
  });
  it('rejects demo events even if the sample flag is changed', () => {
    for (const fixture of samples) {
      for (const sample of [true, false]) {
        const result = validateProductionCatalog([{ ...fixture, sample }]);
        expect(result.events).toEqual([]);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    }
  });
  const ordinary = {
    ...samples[0], id: 'policy-test-record', name: 'Policy test record', venue: 'Policy test venue',
    address: 'Policy test address', sample: false, description: 'Unit test only',
    sourceUrl: 'https://organizer.org/event', registrationUrl: 'https://organizer.org/register',
  };
  it('checks individual fixture identifiers after other fields are changed', () => {
    expect(validateProductionCatalog([ordinary]).errors).toEqual([]);
    for (const key of ['id', 'name', 'venue', 'address'] as const) {
      expect(validateProductionCatalog([{ ...ordinary, [key]: samples[0][key] }]).errors.join()).toContain('fixture identity');
    }
  });
  it('rejects placeholder URLs and fixture IDs in older revisions too', () => {
    for (const host of ['example.com', 'www.example.org', 'example.net', 'event.test', 'event.invalid', 'localhost']) {
      expect(validateProductionCatalog([{ ...ordinary, sourceUrl: `https://${host}/event` }]).errors.join()).toContain('placeholder');
    }
    const hidden = { ...ordinary, venue: samples[0].venue, updatedAt: '2026-11-06T00:00:00Z' };
    expect(validateProductionCatalog([hidden, ordinary]).errors.join()).toContain('fixture identity');
  });
});
