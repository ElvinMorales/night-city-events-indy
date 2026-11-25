import { lstatSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { digest, generateCatalog, requireReview, revision, ReviewError, organizerUrl, verifiedDetails, type Approval, type CatalogChange } from './catalog-update';
import type { Publication, Proposal, StagedCommit } from './publication';
import { eventSchema, TZ, type Event } from '../../src/events';
import type { Review } from './review';
import registry from '../../docs/sources/melee-locations.json';
import { indianapolisStart } from '../melee-discovery/discovery';
import { indianapolisWallTime } from './source';

type ReviewFinding = Review['findings'][number];
export type Finding = Omit<ReviewFinding, 'venue' | 'related'> & {
  venue?: ReviewFinding['venue'];
  discoveryUrl?: string;
  organizerUrl?: string;
  occurrenceEvidenceUrl?: string;
  related: (Omit<ReviewFinding['related'][number], 'catalogRecord'> & {
    catalogRecord?: Event;
    catalogSourceUrl?: string;
  })[];
};
type Snapshot = Omit<Review, 'findings'> & {
  findings: Finding[];
  catalogRevision?: string;
  moderatorQueue: string[];
};
type Queue = { lastSuccessfulReview: Snapshot | null; lastSuccessfulRefresh: string | null; lastAttempt: Review['check'] };
type Status = { outcome: string; checkedAt?: string; reason?: string; catalogRevision?: string };
type Decision = {
  status: 'approved' | 'dismissed' | 'deferred' | 'released';
  at: string;
  by: string;
  title: string;
  fields: Record<string, string>;
  approval?: Approval;
};
type Release = Proposal & {
  id: string;
  keys: string[];
  changes: CatalogChange[];
  staged?: StagedCommit;
  authorizedAt?: string;
  dispatched?: boolean;
  authorizedBy?: string;
};
type State = { version: number; decisions: Record<string, Decision>; release?: Release;
  history?: { sha: string; authorizedAt: string; authorizedBy: string; outcome: 'deployed' | 'superseded' }[] };
const fields = ['targetId', 'name', 'type', 'venue', 'address', 'lat', 'lng', 'start', 'end', 'format',
  'fee', 'description', 'sourceUrl', 'registrationUrl'] as const;

const independentUrl = (url?: string) => organizerUrl.safeParse(url).data ?? '';

export function reviewDefaults(finding: Finding, targetId = finding.canonicalId ?? '') {
  const { observation } = finding;
  const venue = finding.venue ?? registry.locations.find(location => location.key === finding.registryKey);
  const match = finding.related.find(item => item.id === targetId);
  const record = match?.catalogRecord;
  const sameTime = !!match && Date.parse(match.start) === Date.parse(observation.start);
  const catalogEvidence = sameTime ? independentUrl(record?.sourceUrl ?? match?.catalogSourceUrl) : '';
  const venueUrl = venueEvidence(finding);
  return {
    targetId, name: record?.name ?? observation.title,
    venue: venue?.name ?? record?.venue ?? observation.venueName,
    address: venue?.address ?? record?.address ?? '',
    lat: String(venue?.lat ?? record?.lat ?? observation.lat ?? ''),
    lng: String(venue?.lng ?? record?.lng ?? observation.lng ?? ''),
    start: indianapolisStart(observation.start) ?? observation.start,
    end: sameTime ? indianapolisStart(record?.end) ?? '' : '',
    type: record?.type ?? '', format: record?.format ?? '', fee: record?.fee ?? '',
    description: record?.description ?? '',
    sourceUrl: independentUrl(finding.occurrenceEvidenceUrl)
      || (catalogEvidence === venueUrl ? '' : catalogEvidence),
    registrationUrl: sameTime ? independentUrl(record?.registrationUrl) : '',
  };
}

export function reviewValues(finding: Finding, saved?: Record<string, string>, selected?: string) {
  const initial = saved?.targetId || finding.canonicalId || '';
  const target = selected === 'distinct' ? '' : selected ?? initial;
  return target === initial ? { ...reviewDefaults(finding, target), ...saved } : reviewDefaults(finding, target);
}

export function venueEvidence(finding: Finding) {
  return independentUrl(finding.organizerUrl ?? finding.venue?.organizerUrl
    ?? registry.locations.find(location => location.key === finding.registryKey)?.organizerUrl);
}

export function needsIdentityChoice(finding: Finding) {
  return !finding.canonicalId && finding.related.length > 0;
}

export function candidateKey({ observation }: Finding) {
  return digest(JSON.stringify([observation.source, observation.sourceId, observation.sourceVenueId,
    observation.title, Date.parse(observation.start)]));
}

export function readJson<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

export class Moderation {
  constructor(private stateRoot: string, readonly publication?: Publication, private clock = () => new Date()) {}

  private path(file: string) { return join(this.stateRoot, 'moderation', file); }

  snapshot() {
    const queue = readJson<Queue>(join(this.stateRoot, 'queue', 'queue.json'));
    return { queue, report: queue?.lastSuccessfulReview, status: readJson<Status>(join(this.stateRoot, 'status.json')) };
  }

  read(): State {
    return readJson<State>(this.path('decisions.json')) ?? { version: 0, decisions: {} };
  }

  private async mutate(form: URLSearchParams, fn: (state: State, save: () => void) => Promise<void>) {
    const directory = this.path('');
    mkdirSync(directory, { mode: 0o700, recursive: true });
    const info = lstatSync(directory);
    requireReview(info.isDirectory() && (info.mode & 0o077) === 0
      && (!process.getuid || info.uid === process.getuid()), 'Moderator state requires an owner-only directory.');
    const lock = this.path('.lock');
    try {
      mkdirSync(lock, { mode: 0o700 });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw new ReviewError('Another moderator request is in progress. Reload and retry.');
      throw error;
    }
    try {
      const state = this.read();
      requireReview(String(state.version) === form.get('version'), 'Moderator state changed. Reload before submitting.');
      const save = () => {
        state.version++;
        writeFileSync(join(lock, 'decisions.json'), JSON.stringify(state, null, 2) + '\n', { mode: 0o600 });
        renameSync(join(lock, 'decisions.json'), this.path('decisions.json'));
      };
      await fn(state, save);
    } finally {
      rmSync(lock, { recursive: true, force: true });
    }
  }

  review(form: URLSearchParams, moderator: string) {
    return this.mutate(form, async (state, save) => {
      const { report } = this.snapshot();
      const key = form.get('key') ?? '';
      const finding = report?.findings.find(value => candidateKey(value) === key
        && report.moderatorQueue.includes(value.observation.sourceId));
      requireReview(report && finding && form.get('snapshot') === this.snapshotKey(report),
        'The discovery snapshot changed or the candidate is unavailable. Reload and review again.');
      const status = form.get('decision');
      requireReview(status === 'approved' || status === 'dismissed' || status === 'deferred', 'Choose a review decision.');
      requireReview(!state.release?.keys.includes(key), 'Clear the current proposal before changing a decision included in it.');
      requireReview(state.decisions[key]?.status !== 'released', 'This candidate has already been released.');
      const compact = form.get('confirmation') === 'dated-organizer-evidence';
      const selected = form.get('targetId');
      const saved = state.decisions[key]?.fields;
      const initial = reviewValues(finding, saved);
      const defaults = reviewValues(finding, saved, selected ?? undefined);
      const input = Object.fromEntries(fields.map(field => {
        const submitted = form.get(field)?.trim();
        const unchanged = defaults.targetId !== initial.targetId && submitted === initial[field];
        return [field, compact && (submitted === undefined || unchanged) ? defaults[field] : submitted ?? ''];
      }));
      if (compact) {
        input.targetId = defaults.targetId;
        for (const key of ['start', 'end']) {
          if (input[key]) input[key] = indianapolisStart(input[key]) ?? indianapolisWallTime(input[key]) ?? input[key];
        }
      }
      const now = this.clock();
      const decision: Decision = {
        status, at: now.toISOString(), by: moderator, title: finding.observation.title, fields: input,
      };
      if (status === 'approved') {
        requireReview(compact || form.get('verified') === 'yes' && form.get('identity') === 'yes',
          'Confirm the organizer evidence and the occurrence identity.');
        requireReview(typeof report.catalogRevision === 'string' && revision.safeParse(report.catalogRevision).success,
          'Wait for a discovery snapshot with a catalog revision.');
        if (compact && needsIdentityChoice(finding)) {
          requireReview(selected === 'distinct' || finding.related.some(match => match.id === selected),
            'Choose a catalog occurrence to update or confirm that this is a distinct event.');
        }
        requireReview(input.lat && input.lng, 'Enter verified public venue coordinates.');
        requireReview(!finding.canonicalId || input.targetId === finding.canonicalId,
          'Use the existing canonical ID for this matched occurrence.');
        const details = verifiedDetails.parse({
          ...input, lat: Number(input.lat), lng: Number(input.lng), end: input.end || undefined, fee: input.fee || undefined,
          type: input.type || undefined, format: input.format || undefined,
          registrationUrl: compact ? input.registrationUrl || undefined : input.registrationUrl,
        });
        eventSchema.parse({ ...details, id: details.targetId || 'pending', timezone: TZ, sample: false,
          status: 'confirmed', lastVerified: decision.at, updatedAt: decision.at });
        decision.approval = { base: report.catalogRevision, details, method: 'moderator-organizer-check', verifiedAt: decision.at };
      }
      state.decisions[key] = decision;
      save();
    });
  }

  snapshotKey(report: Snapshot) {
    return digest(JSON.stringify([report.catalogRevision, report.check.checkedAt]));
  }

  publish(form: URLSearchParams, moderator: string) {
    return this.mutate(form, async (state, save) => {
      const action = form.get('action');
      const release = state.release;
      if (action === 'clear') {
        requireReview(release?.id === form.get('proposal') && !release?.authorizedAt,
          'Only a pending proposal can be cleared.');
        delete state.release;
        save();
        return;
      }
      const publication = this.publication;
      requireReview(publication, 'GitHub publication is disabled.');
      if (action === 'prepare' || action === 'submit') {
        if (action === 'submit' && release && !release.staged && !release.authorizedAt) {
          requireReview(release.id === form.get('proposal'), 'The proposal changed. Reload before submitting.');
          release.staged = await publication.stage(release);
          save();
          return;
        }
        if (release) {
          requireReview(action === 'submit' && release.id === form.get('proposal') && release.staged &&
            release.authorizedAt && release.authorizedBy && release.dispatched,
          'Clear or complete the current proposal first.');
          const run = await publication.deployment(release.staged);
          requireReview(run?.status === 'completed' && run.conclusion === 'success',
            'The current release must finish deploying before another batch can start.');
          (state.history ??= []).push({ sha: release.staged.sha, authorizedAt: release.authorizedAt,
            authorizedBy: release.authorizedBy, outcome: 'deployed' });
        }
        const base = await publication.main();
        const approvals = Object.entries(state.decisions).filter(([, decision]) =>
          decision.status === 'approved' && decision.approval?.base === base);
        requireReview(approvals.length, 'There are no approvals for the current catalog revision. Recheck stale approvals.');
        const now = this.clock();
        const { changes, content } = generateCatalog(base, await publication.catalog(base), approvals.map(([, decision]) => decision.approval!), now);
        requireReview(changes.length, 'The approvals produce no catalog changes.');
        state.release = { id: digest(base + content), base, changes, content, keys: approvals.map(([key]) => key), createdAt: now.toISOString() };
        save();
        if (action === 'submit') {
          state.release.staged = await publication.stage(state.release);
          save();
        }
        return;
      }
      requireReview(release && release.id === form.get('proposal'), 'The proposal changed. Reload before submitting.');
      if (action === 'stage') {
        requireReview(!release.authorizedAt && !release.staged, 'This proposal is already staged.');
        release.staged = await publication.stage(release);
      } else if (action === 'authorize') {
        requireReview(release.staged && !release.dispatched, 'The proposal must be staged and awaiting publication.');
        if (!release.authorizedAt) {
          requireReview(await publication.main() === release.base, 'Main advanced. Clear and reprepare the proposal.');
          const check = await publication.validation(release.staged);
          requireReview(check?.status === 'completed' && check.conclusion === 'success', 'GitHub validation must succeed before publication.');
          const now = this.clock();
          const { content } = generateCatalog(release.base, await publication.catalog(release.base),
            release.keys.map(key => state.decisions[key].approval!), now);
          requireReview(content === release.content, 'The release no longer matches the verified preview.');
          release.authorizedAt = now.toISOString();
          release.authorizedBy = moderator;
          save();
        }
        await publication.release(release.staged, release.base);
        release.dispatched = true;
        for (const key of release.keys) state.decisions[key].status = 'released';
      } else if (action === 'retry') {
        requireReview(release.authorizedAt && release.staged, 'The proposal has not been authorized.');
        await publication.retryDeployment(release.staged);
      } else if (action === 'archive' || action === 'supersede') {
        requireReview(release.authorizedAt && release.authorizedBy && release.staged, 'The proposal has not been authorized.');
        const run = await publication.deployment(release.staged);
        const deployed = run?.status === 'completed' && run.conclusion === 'success';
        if (action === 'archive') {
          requireReview(deployed, 'Pages must succeed before archiving this release.');
        } else {
          const head = await publication.main();
          requireReview(head !== release.base && head !== release.staged.sha && (!run || run.status === 'completed'),
            'The release can be closed as superseded once main has advanced and any Pages run has finished.');
        }
        (state.history ??= []).push({ sha: release.staged.sha, authorizedAt: release.authorizedAt,
          authorizedBy: release.authorizedBy, outcome: deployed ? 'deployed' : 'superseded' });
        delete state.release;
      } else {
        throw new ReviewError('Unknown publication action.');
      }
      save();
    });
  }
}
