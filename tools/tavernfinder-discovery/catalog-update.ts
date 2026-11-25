import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { z } from 'zod';
import { duplicateCandidates, STALE_DAYS } from '../../src/catalog';
import { eventSchema, types, TZ, type Event } from '../../src/events';
import { validateProductionCatalog } from '../../scripts/production-policy';
import { indianapolisStart } from '../melee-discovery/discovery';

export const catalogPath = 'src/data/events.json';
export const digest = (text: string) => createHash('sha256').update(text).digest('hex');
export const revision = z.string().regex(/^[0-9a-f]{40}$/);
export class ReviewError extends Error {}
export function requireReview(value: unknown, message: string): asserts value {
  if (!value) throw new ReviewError(message);
}

export const organizerUrl = z.string().refine(value => {
  const url = URL.parse(value);
  if (!url) return false;
  const host = url.hostname.replace(/\.$/, '');
  return url.protocol === 'https:' && !url.username && !url.password && url.port === ''
    && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host)
    && !/(^|\.)(tavernfinder\.com|localhost|local|internal|ts\.net|example\.(com|net|org)|test|invalid)$/i.test(host);
}, 'Enter a public HTTPS organizer or registration URL independent of TavernFinder.');
const wallTime = z.iso.datetime({ offset: true }).refine(value => {
  const seconds = value.replace(/(T\d\d:\d\d)(?=[+-])/, '$1:00');
  return indianapolisStart(seconds) === seconds;
}, 'Enter Indianapolis date, time and seasonal offset (for example 2027-01-09T18:00:00-05:00).');

export const verifiedDetails = z.strictObject({
  targetId: z.string().regex(/^(?:[a-zA-Z0-9_-]+)?$/),
  name: z.string().trim().min(3).max(200),
  type: z.enum(types).optional(),
  venue: z.string().trim().min(1).max(200),
  address: z.string().trim().min(5).max(300),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  start: wallTime,
  end: wallTime.optional(),
  format: z.string().trim().min(1).max(200).optional(),
  fee: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(1000),
  sourceUrl: organizerUrl,
  registrationUrl: organizerUrl.optional(),
});

export type Approval = {
  base: string;
  verifiedAt: string;
  method: 'moderator-organizer-check';
  details: z.infer<typeof verifiedDetails>;
};
export type CatalogChange = { before: unknown; after: Event };
const normalize = (value: string) => value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const occurrenceKey = (e: Pick<Event, 'name' | 'address' | 'start'>) =>
  JSON.stringify([normalize(e.name), normalize(e.address), Date.parse(e.start)]);
const pairKey = (pair: { first: string; second: string }) => JSON.stringify([pair.first, pair.second].sort());

export function generateCatalog(base: string, raw: unknown, approvals: readonly Approval[], now = new Date()) {
  requireReview(revision.safeParse(base).success, 'Invalid catalog revision.');
  const existing = validateProductionCatalog(raw, now);
  requireReview(Array.isArray(raw) && !existing.errors.length, 'The base catalog failed validation.');
  const rows: unknown[] = raw.slice();
  const changed = new Map<string, CatalogChange>();
  const events = new Map(existing.events.map(event => [event.id, event]));
  const priorDuplicates = new Set(duplicateCandidates(existing.events).map(pairKey));

  for (const approval of approvals) {
    requireReview(approval.base === base, 'Catalog changed. Recheck the evidence and approve against the latest discovery revision.');
    const timestamp = Date.parse(approval.verifiedAt);
    requireReview(approval.method === 'moderator-organizer-check' && Number.isFinite(timestamp)
      && timestamp <= +now && +now - timestamp < STALE_DAYS * 86400000, 'Fresh independent organizer verification is required.');
    const { targetId, ...details } = verifiedDetails.parse(approval.details);
    const id = targetId || 'indy-' + digest(occurrenceKey(details)).slice(0, 32);
    const previous = events.get(id);
    if (targetId) requireReview(previous, 'The selected canonical ID does not exist.');
    const event = eventSchema.parse({
      ...details, id, timezone: TZ, sample: false, status: 'confirmed',
      lastVerified: approval.verifiedAt, updatedAt: approval.verifiedAt, verificationMethod: approval.method,
    });
    if (previous && isDeepStrictEqual(previous, event)) continue;
    requireReview(!changed.has(id), 'Conflicting approvals target the same canonical occurrence.');
    requireReview(!previous || (targetId && Date.parse(previous.updatedAt) < timestamp),
      'This occurrence already exists or the selected catalog record has a newer revision.');
    requireReview(![...events.values()].some(other => other.id !== id && occurrenceKey(other) === occurrenceKey(event)),
      'This occurrence matches another canonical ID. Resolve the duplicate first.');
    const positions = raw.flatMap((row, index) => row.id === id ? [index] : []);
    requireReview(positions.length < 2, 'The selected ID has conflicting legacy revisions.');
    const index = positions[0];
    changed.set(id, { before: index === undefined ? null : raw[index], after: event });
    if (index === undefined) rows.push(event);
    else rows[index] = event;
    events.set(id, event);
  }
  requireReview(!duplicateCandidates([...events.values()]).some(pair =>
    (changed.has(pair.first) || changed.has(pair.second)) && !priorDuplicates.has(pairKey(pair))),
  'Proposed records look like duplicate occurrences. Select the existing canonical ID or dismiss the duplicate.');
  requireReview(!validateProductionCatalog(rows, now).errors.length, 'The proposed catalog violates production policy.');
  return { changes: [...changed.values()], content: JSON.stringify(rows, null, 2) + '\n' };
}

export function verifyCatalogTransition(base: string, before: unknown, after: unknown, now = new Date()) {
  requireReview(Array.isArray(before) && Array.isArray(after) && after.length >= before.length,
    'A catalog proposal may only add or revise records.');
  requireReview(!validateProductionCatalog(before, now).errors.length && !validateProductionCatalog(after, now).errors.length,
    'The catalog transition failed production policy.');
  const approvals: Approval[] = [];
  for (const [index, row] of after.entries()) {
    const previous = before[index];
    if (isDeepStrictEqual(previous, row)) continue;
    requireReview(!previous || row.id === previous.id, 'Existing catalog IDs and positions must be preserved.');
    const { id, timezone, sample, status, lastVerified, updatedAt, verificationMethod, ...details } = eventSchema.parse(row);
    requireReview(status === 'confirmed' && !sample && lastVerified === updatedAt
      && verificationMethod === 'moderator-organizer-check', 'Every revised record requires fresh organizer verification.');
    approvals.push({ base, verifiedAt: lastVerified, method: verificationMethod,
      details: verifiedDetails.parse({ ...details, targetId: previous ? id : '' }) });
  }
  const generated = generateCatalog(base, before, approvals, now);
  requireReview(generated.changes.length && isDeepStrictEqual(JSON.parse(generated.content), after),
    'The catalog does not reproduce the deterministic verified transition.');
}
