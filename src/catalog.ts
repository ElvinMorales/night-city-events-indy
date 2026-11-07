import { z } from 'zod';
import { eventSchema, deduplicate, type Event } from './events';

export const STALE_DAYS = 14;
export function verification(e: Event, now = new Date()) {
  const timestamp = e.lastVerified ? Date.parse(e.lastVerified) : NaN;
  const stale = !Number.isFinite(timestamp) || timestamp > now.getTime() || now.getTime() - timestamp >= STALE_DAYS * 86400000;
  if (e.sample) return { label: 'Fictional sample', warning: 'Not a real event. Do not travel to this listing.', stale };
  if (e.status === 'cancelled') return { label: 'Cancelled', warning: 'This event is cancelled. Check the organizer’s source for updates.', stale };
  if (e.status === 'unverified') return { label: 'Unverified', warning: 'Organizer confirmation is missing. Check the source before making plans.', stale };
  return { label: stale ? 'Confirmation out of date' : 'Organizer confirmed', warning: stale ? `Verification is at least ${STALE_DAYS} days old, missing, or invalid. Reconfirm with the organizer before travel.` : '', stale };
}
export function loadCatalog(input: unknown, options: { allowSamples?: boolean; now?: Date } = {}) {
  const parsed = z.array(eventSchema).safeParse(input);
  if (!parsed.success) return { events: [] as Event[], errors: parsed.error.issues.map(i => `${i.path.join('.') || 'catalog'}: ${i.message}`) };
  const errors: string[] = [];
  for (const e of parsed.data) {
    if (e.sample && !options.allowSamples) errors.push(`${e.id}: fictional samples are forbidden in the real catalog`);
    if (e.lastVerified && Date.parse(e.lastVerified) > (options.now ?? new Date()).getTime()) errors.push(`${e.id}: verification timestamp is in the future`);
  }
  return { events: errors.length ? [] : deduplicate(parsed.data), errors };
}
const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
function sourceKey(value: string) {
  const url = new URL(value);
  for (const key of [...url.searchParams.keys()]) if (key.startsWith('utm_') || key === 'fbclid') url.searchParams.delete(key);
  url.hash = '';
  url.searchParams.sort();
  return url.toString().replace(/\/$/, '');
}
export function duplicateCandidates(events: Event[]) {
  const candidates: { first: string; second: string; reason: string }[] = [];
  const current = deduplicate(events);
  for (let i = 0; i < current.length; i++) for (let j = i + 1; j < current.length; j++) {
    const a = current[i], b = current[j];
    const close = Math.abs(Date.parse(a.start) - Date.parse(b.start)) <= 3600000;
    if (close && sourceKey(a.sourceUrl) === sourceKey(b.sourceUrl)) candidates.push({ first: a.id, second: b.id, reason: 'Same source and starts within one hour' });
    else if (close && normalize(a.name) === normalize(b.name) && normalize(a.address) === normalize(b.address)) candidates.push({ first: a.id, second: b.id, reason: 'Similar name, public address and start time' });
  }
  return candidates;
}
