import { setTimeout as delay } from 'node:timers/promises';
import { z } from 'zod';
import { maxSources, pageSize, readSource, type RequestPage } from './discovery';

const origin = 'https://melee.gg';
const numericId = z.string().regex(/^[1-9]\d{0,19}$/);
export const liveSourcesSchema = z.array(z.strictObject({
  label: z.string(),
  organizationId: numericId.nullable(),
  locationIds: z.array(numericId),
  enabled: z.boolean(),
  provenance: z.array(z.string()).min(1),
})).max(maxSources).refine(sources => {
  const ids = sources.flatMap(source => source.organizationId ? [source.organizationId] : []);
  return new Set(ids).size === ids.length &&
    sources.every(source => !source.enabled || (source.organizationId && source.locationIds.length));
}, 'Use one source per organization and verify location IDs before enabling it');

export async function requestLivePage(
  { organizationId, start, length }: Parameters<RequestPage>[0], fetchPage = fetch,
): ReturnType<RequestPage> {
  const response = await fetchPage(`${origin}/Hub/SearchOrganizationTournaments/${numericId.parse(organizationId)}`, {
    method: 'POST',
    headers: {
      'User-Agent': 'NightCityEventsIndy/1.0 (+https://github.com/ElvinMorales/night-city-events-indy)',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      Origin: origin,
      Referer: `${origin}/Hub/Organization/${organizationId}`,
    },
    body: new URLSearchParams({ draw: '1', start: String(start), length: String(length) }),
    credentials: 'omit',
    redirect: 'manual',
    signal: AbortSignal.timeout(8000),
  });
  if (response.status !== 200 || !/^application\/json\b/i.test(response.headers.get('content-type') ?? '')) {
    await response.body?.cancel();
    return { status: response.status, nonJson: response.status === 200 };
  }
  const reader = response.body?.getReader();
  if (!reader) return { status: 200 };
  const decoder = new TextDecoder();
  let size = 0;
  let json = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 512 * 1024) {
        await reader.cancel();
        return { status: 200 };
      }
      json += decoder.decode(value, { stream: true });
    }
    return { status: 200, body: JSON.parse(json + decoder.decode()) };
  } catch {
    return { status: 200 };
  } finally {
    reader.releaseLock();
  }
}

export async function readLiveSources(
  configuration: unknown, enabled: boolean, pilot: boolean,
  request: RequestPage = requestLivePage, pause = () => delay(2000),
) {
  const configured = liveSourcesSchema.parse(configuration);
  const selected = pilot ? configured.filter(source => source.organizationId === '19843') : configured;
  const budget = pilot ? 1 : 6;
  let requests = 0;
  let stopped = false;
  const results = [];
  const skipped: { label: string; reason: string }[] = [];
  for (const source of selected) {
    const { label, organizationId, locationIds } = source;
    const reason = !enabled ? 'global switch off' : !organizationId ? 'unresolved organization'
      : !source.enabled ? 'source disabled' : stopped ? 'refresh stopped after source failure'
      : requests === budget ? 'request budget exhausted' : null;
    if (reason || !organizationId) {
      skipped.push({ label, reason: reason ?? 'unresolved organization' });
      continue;
    }
    const result = await readSource({ label, hub: { kind: 'organization', organizationId } }, async query => {
      if (requests) await pause();
      requests++;
      return request(query);
    }, { pageLimit: budget - requests, requestLength: pilot ? 10 : pageSize });
    stopped = result.outcome === 'inaccessible' || result.outcome === 'malformed';
    const rows = result.rows.filter(row => row.locationId && locationIds.includes(row.locationId));
    const unmapped = result.rows.length - rows.length;
    results.push({ ...result, rows, issues: unmapped
      ? [...result.issues, `${unmapped} target-game rows omitted for missing or unreviewed location`] : result.issues });
  }
  return { results, skipped, requests, stopped };
}
