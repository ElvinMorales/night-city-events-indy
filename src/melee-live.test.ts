import { describe, expect, it, vi } from 'vitest';
import catalog from './test-fixtures/discovery-catalog.json';
import { compareCatalog } from '../tools/melee-discovery/discovery';
import { readLiveSources, requestLivePage } from '../tools/melee-discovery/live';

const books = {
  label: 'Books & Brews', organizationId: '19843', locationIds: ['18573'],
  enabled: true, provenance: ['Fixture'],
};
const second = { ...books, label: 'Second organizer', organizationId: '42' };
const row = {
  Game: 'CyberpunkTCG', ID: 480151, LocationId: 18573,
  StartDate: '2026-11-21T22:00:00Z',
  RegistrationUrl: 'https://melee.gg/Tournament/View/480151?private=secret',
  Attendees: [{ email: 'private@example.com' }],
};
const page = (recordsFiltered: number, ...data: unknown[]) => ({
  status: 200, body: { recordsFiltered, data },
});
const pause = async () => {};

describe('Melee live refresh boundaries', () => {
  it('performs no requests while globally disabled or for disabled and unresolved sources', async () => {
    const request = vi.fn();
    expect(await readLiveSources([books], false, false, request)).toMatchObject({
      requests: 0, skipped: [{ reason: 'global switch off' }],
    });
    const unresolved = { ...second, organizationId: null, enabled: false };
    expect(await readLiveSources([{ ...books, enabled: false }, unresolved], true, false, request)).toMatchObject({
      requests: 0, skipped: [{ reason: 'source disabled' }, { reason: 'unresolved organization' }],
    });
    expect(request).not.toHaveBeenCalled();
  });

  it('makes at most one Books & Brews pilot request, without claiming complete pagination', async () => {
    const request = vi.fn(async () => page(2, row));
    const run = await readLiveSources([second, books], true, true, request, pause);
    expect(request.mock.calls).toEqual([[{ organizationId: '19843', start: 0, length: 10 }]]);
    expect(run).toMatchObject({ requests: 1, results: [{ outcome: 'incomplete' }] });
  });

  it.each([{ status: 403 }, { status: 429 }, { status: 302 }, { status: 200, nonJson: true }])(
    'stops all remaining source traffic on %j',
    async response => {
      const request = vi.fn(async () => response);
      const run = await readLiveSources([books, second], true, false, request, pause);
      expect(run).toMatchObject({ requests: 1, stopped: true, skipped: [{ label: second.label }] });
      expect(compareCatalog(run.results, catalog, new Map())).toEqual([]);
    },
  );

  it('bounds sequential checks across sources and excludes unmapped venue and attendee data', async () => {
    const request = vi.fn(async () => page(20, row, { ...row, ID: 9999, LocationId: 123 }));
    const wait = vi.fn(pause);
    const run = await readLiveSources([books, second], true, false, request, wait);
    expect(run.requests).toBe(6);
    expect(wait).toHaveBeenCalledTimes(5);
    expect(request.mock.calls).toEqual([
      ...[0, 2, 4, 6].map(start => [{ organizationId: '19843', start, length: 50 }]),
      ...[0, 2].map(start => [{ organizationId: '42', start, length: 50 }]),
    ]);
    const candidates = compareCatalog(run.results, catalog, new Map());
    expect(candidates).toMatchObject([{ tournamentId: '480151', observations: [{
      registrationUrl: 'https://melee.gg/Tournament/View/480151',
    }] }]);
    expect(JSON.stringify(run)).not.toMatch(/private|Attendees|9999/);
  });

  it('uses the public form contract without following redirects or supplying credentials', async () => {
    const fetchPage = vi.fn<typeof fetch>().mockResolvedValue(new Response('challenge', {
      headers: { 'content-type': 'text/html' },
    }));
    expect(await requestLivePage({ organizationId: '19843', start: 0, length: 10 }, fetchPage))
      .toEqual({ status: 200, nonJson: true });
    const [[url, options]] = fetchPage.mock.calls;
    expect(url).toBe('https://melee.gg/Hub/SearchOrganizationTournaments/19843');
    expect(options).toMatchObject({ method: 'POST', credentials: 'omit', redirect: 'manual', signal: expect.any(AbortSignal) });
    expect(String(options?.body)).toBe('draw=1&start=0&length=10');
  });

  it('reads a bounded JSON response and rejects oversized response bodies', async () => {
    const fetchPage = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ data: [row], recordsFiltered: 1 }))
      .mockResolvedValueOnce(Response.json('x'.repeat(512 * 1024)));
    const query = { organizationId: '19843', start: 0, length: 10 };
    expect(await requestLivePage(query, fetchPage)).toEqual(page(1, row));
    expect(await requestLivePage(query, fetchPage)).toEqual({ status: 200 });
  });
});
