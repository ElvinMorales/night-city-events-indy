import { compareCatalog, fixtureSchema, readSource } from './discovery';
import productionCatalog from '../../src/data/events.json';
import { readLiveSources } from './live';
import organizations from '../../docs/sources/melee-organizations.json';
import registry from '../../docs/sources/melee-locations.json';

export async function buildReport(format: string, fixtureData: unknown, enabled: boolean, catalog = productionCatalog) {
  const live = format === '--live' || format === '--pilot';
  const fixture = live ? null : fixtureSchema.parse(fixtureData);
  const liveReport = live ? await readLiveSources(organizations, enabled, format === '--pilot') : null;
  const results = liveReport?.results ?? [];
  for (const source of fixture?.sources ?? []) {
    results.push(await readSource(source, async ({ start }) => source.responses[String(start)] ?? { status: 200 }));
  }
  const venues = new Map(registry.locations.flatMap(location =>
    location.meleeLocationId === null ? [] : [[String(location.meleeLocationId), location.name] as const]));
  const candidates = compareCatalog(results, catalog, venues);
  const matchedIds = new Set(candidates.map(candidate => candidate.canonicalEventId));
  const catalogMatches = live ? catalog.filter(event => matchedIds.has(event.id)).map(event => ({
    id: event.id, name: event.name, start: event.start, fee: event.fee ?? null, status: event.status,
  })) : [];
  const sources = results.map(({ rows, ...source }) => ({ ...source, candidateRows: rows.length }));
  const report = {
    mode: fixture ? 'offline-fixture' : format === '--pilot' ? 'live-pilot' : 'live-refresh',
    ...(fixture ? { fixture: fixture.label } : {
      retrievalEnabled: enabled, catalogMatches,
      requests: liveReport?.requests, stopped: liveReport?.stopped, skipped: liveReport?.skipped,
    }),
    sources, candidates,
  };

  function literal(value: string) {
    return '\x60' + JSON.stringify(value).replaceAll('\x60', '\\u0060') + '\x60';
  }

  function markdown() {
    const lines: string[] = [];
    lines.push('# Melee candidate refresh');
    lines.push(`\nMode: ${fixture ? 'offline fixture' : report.mode}. Observations are for review only. See the JSON for full field and source evidence.`);
    if (fixture) lines.push(`\nFixture: ${literal(fixture.label)}`);
    if (liveReport) {
      lines.push(`\nRetrieval requests: ${liveReport.requests}`);
      for (const source of liveReport.skipped) lines.push(`- ${literal(source.label)} — ${source.reason}`);
    }
    lines.push('\n## Sources\n');
    for (const source of sources) {
      lines.push(`- ${literal(source.label)} — ${source.classification ?? source.outcome} · ${source.requests}${fixture ? ' fixture' : ''} page requests · ${source.excluded} other-game rows`);
      for (const issue of [source.detail, ...source.issues]) if (issue) lines.push(`  - ${literal(issue)}`);
    }
    lines.push('\n## Tournament findings\n');
    for (const candidate of candidates) {
      const link = `[${candidate.tournamentId}](${candidate.observations[0].tournamentUrl})`;
      lines.push(`- ${link} — **${candidate.classification}**${candidate.canonicalEventId ? ` · catalog ID ${literal(candidate.canonicalEventId)}` : ''}`);
      const match = catalogMatches.find(event => event.id === candidate.canonicalEventId);
      if (match) lines.push(`  - Catalog · ${literal(match.name)} · ${match.start} · ${literal(match.fee ?? 'Unknown fee')} · ${literal(match.status)}`);
      for (const observation of candidate.observations) {
        lines.push(`  - ${literal(observation.name ?? 'Unknown name')} · ${observation.start ?? 'Unknown start'} · ${literal(observation.fee ?? 'Unknown fee')} · ${literal(observation.status ?? 'Unknown status')}`);
      }
      for (const [field, { catalog, observed }] of Object.entries(candidate.diff)) {
        lines.push(`  - ${field}: ${catalog === null ? 'unknown' : literal(catalog)} → ${literal(observed)}`);
      }
    }
    lines.push(`\nCatalog entries absent from the ${fixture ? 'fixture' : 'retrieval'} generate no findings.`);
    return lines.join('\n') + '\n';
  }
  return { json: JSON.stringify(report, null, 2) + '\n', markdown: markdown() };
}
