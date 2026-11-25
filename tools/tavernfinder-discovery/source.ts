import { z } from 'zod';
import { dayKey, miles, TZ } from '../../src/events';
import { indianapolisStart } from '../melee-discovery/discovery';

export const gameId = 900000114;
export const pageSize = 100;
export const maxPages = 4;
export const requestTimeoutMs = 8000;
export const radiusMiles = 100;
export const dayMs = 86_400_000;

const count = z.number().int().nonnegative().safe();
const envelope = z.object({
  data: z.array(z.unknown()),
  total: count,
  nearbyCount: count.optional(),
  bounded: z.boolean().optional(),
  radiusKm: z.number().positive().nullable().optional(),
});
const label = z.string().trim().min(1).max(300).regex(/^[^\p{Cc}\p{Cf}]+$/u);
const coordinate = (max: number) => z.union([z.number(), z.string().regex(/^-?\d+(?:\.\d+)?$/).transform(Number)])
  .pipe(z.number().min(-max).max(max));
const rowSchema = z.object({
  id: z.uuid().transform(id => id.toLowerCase()),
  venueId: z.uuid().transform(id => id.toLowerCase()),
  venueName: label,
  venueCity: label.nullable().optional(),
  venueLatitude: coordinate(90).nullable().optional(),
  venueLongitude: coordinate(180).nullable().optional(),
  gameBggId: z.literal(gameId),
  title: label,
  date: z.iso.date(),
  startTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/),
});

export function indianapolisWallTime(value: string) {
  const wall = value.replace(/(T\d\d:\d\d)$/, '$1:00');
  // Accept only a unique round trip. Fall-back times need an explicit choice of offset.
  const candidates = ['-04:00', '-05:00'].map(offset => wall + offset)
    .filter(candidate => indianapolisStart(candidate) === candidate);
  return candidates.length === 1 ? candidates[0] : null;
}

export function normalizeObservation(input: unknown, observedAt: string) {
  const parsed = rowSchema.safeParse(input);
  if (!parsed.success) return null;
  const row = parsed.data;
  const start = indianapolisWallTime(row.date + 'T' + row.startTime);
  if (!start) return null;
  return {
    source: 'tavernfinder' as const,
    sourceId: row.id,
    sourceVenueId: row.venueId,
    venueName: row.venueName,
    venueCity: row.venueCity ?? null,
    lat: row.venueLatitude ?? null,
    lng: row.venueLongitude ?? null,
    gameId: row.gameBggId,
    title: row.title,
    date: row.date,
    start,
    timezone: TZ,
    observedAt,
    evidence: 'organizer-evidence-missing' as const,
  };
}

export type Observation = NonNullable<ReturnType<typeof normalizeObservation>>;
export type RequestPage = (offset: number) => Promise<{ status: number; body?: unknown }>;

export async function requestPage(offset: number, fetchPage = fetch): ReturnType<RequestPage> {
  const url = new URL('https://tavernfinder.com/api/v1/activities/discover');
  url.search = new URLSearchParams({
    lat: '39.7684', lng: '-86.1581', gameBggId: String(gameId), type: 'event',
    limit: String(pageSize), offset: String(offset),
  }).toString();
  const response = await fetchPage(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'omit',
    redirect: 'manual',
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
  const status = response.status;
  if (status !== 200 || !/^application\/json\b/i.test(response.headers.get('content-type') ?? '')) {
    await response.body?.cancel();
    return { status };
  }
  const reader = response.body?.getReader();
  if (!reader) return { status };
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0;
  let body = '';
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 1024 * 1024) {
        await reader.cancel();
        return { status };
      }
      body += decoder.decode(chunk.value, { stream: true });
    }
    return { status, body: JSON.parse(body + decoder.decode()) };
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof TypeError && 'code' in error && error.code === 'ERR_ENCODING_INVALID_ENCODED_DATA') {
      return { status };
    }
    throw error;
  } finally {
    reader.releaseLock();
  }
}

export function discoveryWindow(now: Date) {
  const from = dayKey(now);
  const through = new Date(Date.parse(from) + 60 * dayMs).toISOString().slice(0, 10);
  return { from, through, radiusMiles };
}

export async function readTavernFinder(
  controls: { globalEnabled: boolean; sourceEnabled: boolean }, request: RequestPage = requestPage,
  clock = () => new Date(),
) {
  const checkedAt = clock().toISOString();
  const observations: Observation[] = [];
  const checks: { offset: number; httpStatus: number | null; observedAt: string; validPage: boolean }[] = [];
  const ids = new Set<string>();
  let reported: Omit<z.infer<typeof envelope>, 'data'> | null = null;
  let invalidRows = 0;
  let repeatedIds = 0;
  let returnedRows = 0;
  function finish(outcome: 'disabled' | 'success' | 'malformed' | 'inaccessible' | 'incomplete', reason?: string) {
    return { outcome, reason, checkedAt, checks, reported, invalidRows, repeatedIds, returnedRows, observations };
  }

  if (!controls.globalEnabled) return finish('disabled', 'Global retrieval switch is off');
  if (!controls.sourceEnabled) return finish('disabled', 'TavernFinder retrieval switch is off');
  while (checks.length < maxPages) {
    const offset = returnedRows;
    let response;
    try {
      response = await request(offset);
    } catch {
      checks.push({ offset, httpStatus: null, observedAt: clock().toISOString(), validPage: false });
      return finish(offset ? 'incomplete' : 'inaccessible', 'Request failed or timed out');
    }
    const check = { offset, httpStatus: response.status, observedAt: clock().toISOString(), validPage: false };
    checks.push(check);
    if (response.status !== 200) return finish(offset ? 'incomplete' : 'inaccessible', 'Unexpected HTTP status');
    const parsed = envelope.safeParse(response.body);
    if (!parsed.success) return finish(offset ? 'incomplete' : 'malformed', 'Invalid JSON or discovery envelope');

    const { data, ...metadata } = parsed.data;
    if ((reported && reported.total !== metadata.total) || data.length > pageSize
      || offset + data.length > metadata.total || (!data.length && offset < metadata.total)) {
      return finish('incomplete', 'Inconsistent pagination');
    }
    reported ??= metadata;
    returnedRows += data.length;
    check.validPage = true;
    for (const input of data) {
      const observation = normalizeObservation(input, check.observedAt);
      if (!observation) {
        invalidRows++;
        continue;
      }
      if (ids.has(observation.sourceId)) repeatedIds++;
      ids.add(observation.sourceId);
      observations.push(observation);
    }
    if (returnedRows === metadata.total) {
      if (invalidRows && !observations.length) return finish('malformed', 'All rows failed validation');
      if (invalidRows || repeatedIds) return finish('incomplete', 'Invalid rows or repeated source IDs');
      return finish('success');
    }
  }
  return finish('incomplete', 'Page budget exhausted');
}

export function inRadius(point: { lat: number; lng: number }) {
  return miles(point.lat, point.lng) <= radiusMiles;
}
