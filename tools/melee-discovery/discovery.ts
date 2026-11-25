import { z } from 'zod';

const timezone = 'America/Indiana/Indianapolis';
const clock = new Intl.DateTimeFormat('en-CA', {
  timeZone: timezone, timeZoneName: 'longOffset', hourCycle: 'h23',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
});
const iso = z.iso.datetime({ offset: true });
const id = z.union([z.number().int().positive().safe().transform(String), z.string().regex(/^[1-9]\d*$/)]);
const game = 'CyberpunkTCG';
export const maxSources = 3;
export const maxPages = 4;
export const pageSize = 50;

const text = (value: unknown) => typeof value === 'string' ? value.replace(/[\p{Cc}\p{Cf}]/gu, ' ').trim().slice(0, 300) || null : null;
const normalizedName = (value: string) => value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const readId = (value: unknown) => id.safeParse(value).data ?? null;

export function indianapolisStart(value: unknown) {
  if (typeof value !== 'string' || !iso.safeParse(value).success || value.endsWith('-00:00')) return null;
  const instant = new Date(value);
  if (!Number.isFinite(instant.getTime())) return null;
  const parts = Object.fromEntries(clock.formatToParts(instant).map(({ type, value }) => [type, value]));
  // Melee can supply .NET timestamps with seven fractional digits.
  const digits = /\.(\d+)/.exec(value)?.[1].replace(/0+$/, '');
  const fraction = digits ? `.${digits}` : '';
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${fraction}${parts.timeZoneName.slice(3)}`;
}

function httpsUrl(value: unknown) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value, 'https://melee.gg');
    return (value.startsWith('/') && !value.startsWith('//') || /^https:\/\//i.test(value))
      && url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

function tournamentIdFromUrl(value: string | null | undefined) {
  if (!value) return null;
  const url = new URL(value);
  if (url.origin !== 'https://melee.gg') return null;
  return /^\/Tournament\/View\/([1-9]\d*)\/?$/i.exec(url.pathname)?.[1] ?? null;
}

const sourceSchema = z.object({
  label: z.string(),
  hub: z.discriminatedUnion('kind', [
    z.strictObject({ kind: z.literal('organization'), organizationId: id }),
    z.strictObject({ kind: z.literal('location'), locationId: id }),
    z.strictObject({ kind: z.literal('unresolved') }),
  ]),
});
const responseSchema = z.object({ recordsFiltered: z.number().int().nonnegative().safe(), data: z.array(z.unknown()) });
const rowSchema = z.record(z.string(), z.unknown());
export const fixtureSchema = z.object({
  label: z.string(),
  sources: z.array(sourceSchema.extend({
    responses: z.record(z.string(), z.object({ status: z.number().int(), body: z.unknown().optional() })),
  })).max(maxSources),
});

type Source = z.output<typeof sourceSchema>;
export type RequestPage = (query: { organizationId: string; start: number; length: number }) =>
  Promise<{ status: number; body?: unknown; nonJson?: boolean }>;

function normalize(row: Record<string, unknown>, tournamentId: string) {
  const registrationUrl = tournamentIdFromUrl(httpsUrl(row.RegistrationUrl)) === tournamentId
    ? `https://melee.gg/Tournament/View/${tournamentId}` : null;
  return {
    tournamentId, name: text(row.Name), start: indianapolisStart(row.StartDate),
    timezone, locationId: readId(row.LocationId),
    fee: text(row.EntryFeeString), entryType: text(row.EntryTypeDescription),
    status: text(row.StatusDescription),
    tournamentUrl: `https://melee.gg/Tournament/View/${tournamentId}`,
    registrationUrl,
  };
}

type Tournament = ReturnType<typeof normalize>;

export async function readSource(source: Source, request: RequestPage,
  { pageLimit = maxPages, requestLength = pageSize } = {},
) {
  const { label, hub } = source;
  const rows: Tournament[] = [];
  const issues: string[] = [];
  let requests = 0;
  let excluded = 0;
  let start = 0;
  let total: number | undefined;
  function finish(outcome: 'complete' | 'empty' | 'malformed' | 'inaccessible' | 'incomplete', detail?: string) {
    return {
      label, hub, outcome,
      ...(outcome === 'inaccessible' ? { classification: 'inaccessible-source' as const } : {}),
      requests, excluded, issues, detail, rows,
    };
  }

  if (hub.kind !== 'organization') return finish('inaccessible', `No verified organization list for ${hub.kind} source`);
  while (requests < Math.min(maxPages, pageLimit)) {
    requests++;
    let response;
    try {
      response = await request({ organizationId: hub.organizationId, start, length: requestLength });
    } catch {
      return finish('inaccessible', `No response at offset ${start}`);
    }
    if (response.status !== 200) return finish('inaccessible', `HTTP ${response.status} at offset ${start}`);
    if (response.nonJson) return finish('inaccessible', `Expected JSON at offset ${start}`);
    const parsed = responseSchema.safeParse(response.body);
    if (!parsed.success) return finish('malformed', `Invalid list envelope at offset ${start}`);
    const { data, recordsFiltered } = parsed.data;
    if ((total !== undefined && total !== recordsFiltered) || data.length > requestLength || start + data.length > recordsFiltered) {
      return finish('incomplete', `Inconsistent pagination at offset ${start}`);
    }
    total = recordsFiltered;
    if (!data.length && start < total) return finish('incomplete', `Empty page before reported end at offset ${start}`);
    for (const [index, raw] of data.entries()) {
      const row = rowSchema.safeParse(raw).data;
      const ordinal = start + index;
      if (!row || !text(row.Game)) {
        issues.push(`Row ${ordinal}: missing game`);
        continue;
      }
      if (row.Game !== game) {
        excluded++;
        continue;
      }
      const tournamentId = readId(row.ID);
      if (!tournamentId) {
        issues.push(`Row ${ordinal}: missing or invalid tournament ID`);
        continue;
      }
      const tournament = normalize(row, tournamentId);
      if (!tournament.start) issues.push(`Tournament ${tournamentId}: missing or invalid dated start`);
      rows.push(tournament);
    }
    start += data.length;
    if (start === total) return finish(issues.length ? 'incomplete' : total ? 'complete' : 'empty');
  }
  return finish('incomplete', `Page limit reached at offset ${start}`);
}

type SourceResult = Awaited<ReturnType<typeof readSource>>;
type CatalogEvent = {
  id: string; name: string; start: string; fee?: string; status: string;
  venue: string; sourceUrl?: string; registrationUrl?: string;
};

export function compareCatalog(results: readonly SourceResult[], catalog: readonly CatalogEvent[], venues: ReadonlyMap<string, string>) {
  const byId = new Map<string, Map<string, { tournament: Tournament; sources: Set<string> }>>();
  for (const source of results) {
    for (const tournament of source.rows) {
      const versions = byId.get(tournament.tournamentId) ?? new Map();
      byId.set(tournament.tournamentId, versions);
      const key = JSON.stringify(tournament);
      const version = versions.get(key) ?? { tournament, sources: new Set<string>() };
      version.sources.add(source.label);
      versions.set(key, version);
    }
  }
  return Array.from(byId, ([tournamentId, versions]) => {
    const observations = Array.from(versions.values(), ({ tournament, sources }) => ({ ...tournament, sources: [...sources] }));
    const current = observations[0];
    const matches = catalog.filter(event => [event.sourceUrl, event.registrationUrl]
      .some(url => tournamentIdFromUrl(httpsUrl(url)) === tournamentId));
    const canonicalEventId = matches.length === 1 ? matches[0].id : null;
    const venue = current.locationId ? venues.get(current.locationId) : undefined;
    const possibleMatches = !matches.length && venue && current.name && current.start ? catalog.filter(event =>
      normalizedName(event.venue) === normalizedName(venue)
      && normalizedName(event.name) === normalizedName(current.name!)
      && indianapolisStart(event.start) === current.start) : [];
    const diff: Record<string, { catalog: string | null; observed: string }> = {};
    const base = { tournamentId, canonicalEventId, observations, diff };
    const [match] = matches;

    if (observations.length > 1 || matches.length > 1 || possibleMatches.length || !current.start ||
        (match && venue && normalizedName(match.venue) !== normalizedName(venue))) {
      return { ...base, classification: 'conflicting' as const, relatedCatalogIds: [...matches, ...possibleMatches].map(event => event.id) };
    }
    if (!match) return { ...base, classification: 'new' as const };

    const compare = (field: string, prior: string | null, next: string | null) => {
      if (next !== null && prior !== next) diff[field] = { catalog: prior, observed: next };
    };
    compare('name', match.name, current.name);
    compare('start', indianapolisStart(match.start), current.start);
    compare('fee', match.fee ?? null, current.fee);
    compare('registrationUrl', httpsUrl(match.registrationUrl), current.registrationUrl);
    if (/^cancel(?:led|ed)$/i.test(current.status ?? '')) compare('status', match.status, 'cancelled');
    return { ...base, classification: Object.keys(diff).length ? 'changed' as const : 'unchanged' as const };
  });
}
