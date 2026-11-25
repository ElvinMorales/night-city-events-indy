import { dayKey, deduplicate, filterEvents, type Event } from '../../src/events';
import { dayMs, discoveryWindow, inRadius, type Observation, type readTavernFinder } from './source';

type Venue = {
  key: string;
  name: string;
  city: string;
  activeDiscovery: boolean;
  address?: string;
  organizerUrl?: string;
  lat: number;
  lng: number;
};

const aliases = new Map([
  ['magescomicsandgamesinc', 'magescomics'],
  ['tarnishedtabletopgamingcenter', 'tarnishedtabletopgaming'],
  ['thekingdomcardsandgames', 'thekingdomcardsgames'],
]);
const nameKey = (name: string) => name.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const venueKey = (name: string) => aliases.get(nameKey(name)) ?? nameKey(name);

export function review(
  source: Awaited<ReturnType<typeof readTavernFinder>>, catalog: readonly Event[], registry: readonly Venue[],
) {
  const now = new Date(source.checkedAt);
  const window = discoveryWindow(now);
  const venues = registry.filter(venue => venue.activeDiscovery);
  const canonical = deduplicate([...catalog].filter(event => !event.sample));
  const upcoming = filterEvents(canonical.filter(event => event.status !== 'cancelled'), {
    from: window.from, to: window.through, type: '', venue: '', query: '', radius: window.radiusMiles,
  }, now).filter(event => Date.parse(event.start) >= +now);
  // Keep cancelled catalog entries available for identity checks and preserve their state.
  const comparable = canonical.filter(event => inRadius(event) && dayKey(event.start) >= window.from
    && dayKey(event.start) <= window.through);
  const sourceVenueLabels = new Map<string, Set<string>>();
  const sourceIdVenues = new Map<string, Set<string>>();
  const observedCounts = new Map<string, number>();
  for (const observation of source.observations) {
    const labels = sourceVenueLabels.get(observation.sourceVenueId) ?? new Set<string>();
    labels.add(venueKey(observation.venueName));
    sourceVenueLabels.set(observation.sourceVenueId, labels);
    const ids = sourceIdVenues.get(venueKey(observation.venueName)) ?? new Set<string>();
    ids.add(observation.sourceVenueId);
    sourceIdVenues.set(venueKey(observation.venueName), ids);
    observedCounts.set(observation.sourceId, (observedCounts.get(observation.sourceId) ?? 0) + 1);
  }

  function venueMatches(observation: Observation) {
    return venues.filter(venue => venueKey(venue.name) === venueKey(observation.venueName)
      && (!observation.venueCity || nameKey(venue.city) === nameKey(observation.venueCity)));
  }

  const represented = new Set<string>();
  const findings = [];
  let outOfWindow = 0;
  let outsideRadius = 0;
  let inCoverage = 0;
  for (const observation of source.observations) {
    if (Date.parse(observation.start) < +now || observation.date > window.through) {
      outOfWindow++;
      continue;
    }
    const possibleVenues = venueMatches(observation);
    const identityConflict = sourceVenueLabels.get(observation.sourceVenueId)!.size > 1
      || sourceIdVenues.get(venueKey(observation.venueName))!.size > 1;
    const venue = possibleVenues.length === 1 && !identityConflict ? possibleVenues[0] : null;
    const point = observation.lat !== null && observation.lng !== null
      ? { lat: observation.lat, lng: observation.lng } : venue;
    if (point && !inRadius(point)) {
      outsideRadius++;
      continue;
    }
    if (point) inCoverage++;
    if (venue && point) represented.add(venue.key);
    const base = { observation, registryKey: venue?.key ?? null, venue: venue ? { name: venue.name, address: venue.address, lat: venue.lat, lng: venue.lng, organizerUrl: venue.organizerUrl } : undefined, withinRadius: point ? true : null };
    const atVenue = venue
      ? comparable.filter(event => venueKey(event.venue) === venueKey(venue.name)) : [];
    const observedStart = Date.parse(observation.start);
    const exactSlot = atVenue.filter(event => Date.parse(event.start) === observedStart);
    const sameTitle = atVenue.filter(event => nameKey(event.name) === nameKey(observation.title));
    const exact = exactSlot.filter(event => sameTitle.includes(event));
    const nearby = sameTitle.filter(event => Math.abs(Date.parse(event.start) - observedStart) <= 1.5 * dayMs);
    const related = (events: Event[]) => events.map(event => ({ id: event.id, start: event.start, status: event.status, catalogRecord: event }));

    if (exact.length === 1) {
      findings.push({ ...base, kind: 'existing-match' as const, canonicalId: exact[0].id, related: related(exactSlot) });
    } else if (exactSlot.length) {
      findings.push({ ...base, kind: 'cross-source-duplicate' as const, canonicalId: null, related: related(exactSlot) });
    } else if (nearby.length) {
      findings.push({ ...base, kind: nearby.length === 1 ? 'potential-schedule-change' as const : 'ambiguous-match' as const,
        canonicalId: null, related: related(nearby) });
    } else {
      findings.push({ ...base, kind: venue && point ? 'new-lead' as const : 'unresolved-venue' as const,
        canonicalId: null, related: [] });
    }
  }

  const slotGroups = new Map<string, typeof findings>();
  for (const finding of findings) {
    const { observation, registryKey } = finding;
    const slot = (registryKey ?? observation.sourceVenueId) + '/' + Date.parse(observation.start);
    const group = slotGroups.get(slot) ?? [];
    group.push(finding);
    slotGroups.set(slot, group);
  }
  const duplicateCandidates: { reason: 'shared-venue-and-start' | 'repeated-source-id'; sourceIds: string[] }[] = [];
  for (const group of slotGroups.values()) {
    const sourceIds = [...new Set(group.map(finding => finding.observation.sourceId))];
    if (sourceIds.length > 1) duplicateCandidates.push({ reason: 'shared-venue-and-start', sourceIds });
  }
  for (const [sourceId, count] of observedCounts) {
    if (count > 1) duplicateCandidates.push({ reason: 'repeated-source-id', sourceIds: [sourceId] });
  }
  const duplicateIds = new Set(duplicateCandidates.flatMap(candidate => candidate.sourceIds));
  const matched = new Set(findings.flatMap(finding => finding.canonicalId ? [finding.canonicalId] : []));
  const matchedUpcoming = upcoming.filter(event => matched.has(event.id)).length;
  const metrics = {
    returnedRows: source.returnedRows,
    inCoverage,
    outOfWindow,
    outsideRadius,
    activeVenuesRepresented: represented.size,
    activeRegistryVenues: venues.length,
    knownUpcoming: upcoming.length,
    matchedUpcoming,
    rediscoveryPercent: source.outcome === 'success' && upcoming.length ? 100 * matchedUpcoming / upcoming.length : null,
    newDatedLeads: findings.filter(finding => (finding.kind === 'new-lead'
      || finding.kind === 'unresolved-venue' && finding.withinRadius) && !duplicateIds.has(finding.observation.sourceId)).length,
    potentialScheduleChanges: findings.filter(finding => finding.kind === 'potential-schedule-change').length,
    ambiguousMatches: findings.filter(finding => finding.kind === 'ambiguous-match').length,
    crossSourceDuplicates: findings.filter(finding => finding.kind === 'cross-source-duplicate' || finding.related.length > 1).length,
    duplicateGroups: duplicateCandidates.length,
    unresolvedVenueRows: findings.filter(finding => !finding.registryKey).length,
    missingOrganizerEvidence: findings.length,
  };
  const { observations: _, ...check } = source;
  return { window, check, metrics, findings, duplicateCandidates };
}

export type Review = ReturnType<typeof review>;

export function summary(report: Review) {
  return { source: 'tavernfinder', ...report.check, window: report.window, metrics: report.metrics };
}

export function markdown(report: Review) {
  const literal = (value: string) => '`' + JSON.stringify(value).replaceAll('`', '\\u0060') + '`';
  const lines = ['# TavernFinder discovery review', '',
    'Discovery observations require organizer evidence. Catalog changes require separate moderator review.', '',
    '## Source check', '', ...Object.entries(summary(report)).filter(([key]) => key !== 'metrics')
      .map(([key, value]) => '- ' + key + ' ' + (JSON.stringify(value) ?? '')),
    '', '## Coverage', '', ...Object.entries(report.metrics).map(([key, value]) => '- ' + key + ' ' + (value ?? 'unavailable')),
    '', '## Findings', '',
    ...report.findings.map(({ observation, kind, registryKey, canonicalId, related, withinRadius }) =>
      '- **' + kind + '** · ' + literal(observation.title) + ' · ' + literal(observation.venueName)
      + ' · ' + observation.start + ' · observed ' + observation.observedAt + ' · ' + observation.sourceId
      + (registryKey ? ' · registry ' + registryKey : ' · unresolved venue')
      + (withinRadius ? '' : ' · radius unverified')
      + (canonicalId ? ' · catalog ' + literal(canonicalId) : '')
      + (related.length ? ' · catalog evidence ' + literal(JSON.stringify(related)) : '')
      + ' · organizer evidence missing'),
    '', '## Duplicate candidates', '',
    ...report.duplicateCandidates.map(candidate => '- ' + candidate.reason + ' · ' + candidate.sourceIds.join(', ')),
  ];
  return lines.join('\n') + '\n';
}
