import { lstatSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { summary, type Review } from './review';

const timestamp = z.iso.datetime();
const previousState = z.object({
  version: z.literal(1),
  lastSuccessfulRefresh: timestamp.nullable(),
  lastSuccessfulReview: z.object({}).passthrough().nullable(),
});

export function actionableFindings(report: Review) {
  const duplicates = new Set(report.duplicateCandidates.flatMap(candidate => candidate.sourceIds));
  return report.findings.filter(finding => finding.kind !== 'existing-match'
    || finding.related.length > 1 || duplicates.has(finding.observation.sourceId));
}

export function refreshHealth(report: Review, previous: string | null) {
  const successful = report.check.outcome === 'success';
  return {
    ...summary(report),
    lastSuccessfulRefresh: successful ? report.check.checks.at(-1)!.observedAt : previous,
    lastSuccessfulStateUpdated: successful,
  };
}

export function readLastSuccess(path: string) {
  try {
    return z.object({ lastSuccessfulRefresh: timestamp }).parse(JSON.parse(readFileSync(path, 'utf8'))).lastSuccessfulRefresh;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

export async function refreshQueue(directory: string, retrieve: () => Promise<Review>) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const info = lstatSync(directory);
  if (!info.isDirectory() || (info.mode & 0o077) !== 0 || (process.getuid && info.uid !== process.getuid())) {
    throw new Error('The moderator queue directory must be private and owned by the current user.');
  }
  const lock = join(directory, '.refresh-lock');
  mkdirSync(lock, { mode: 0o700 });
  try {
    const path = join(directory, 'queue.json');
    let previous: z.infer<typeof previousState> | undefined;
    try {
      previous = previousState.parse(JSON.parse(readFileSync(path, 'utf8')));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    const report = await retrieve();
    const health = refreshHealth(report, previous?.lastSuccessfulRefresh ?? null);
    const lastSuccessfulReview = health.lastSuccessfulStateUpdated
      ? { ...report, moderatorQueue: actionableFindings(report).map(finding => finding.observation.sourceId) }
      : previous?.lastSuccessfulReview ?? null;
    writeFileSync(join(lock, 'queue.json'), JSON.stringify({
      version: 1, lastSuccessfulRefresh: health.lastSuccessfulRefresh, lastAttempt: health, lastSuccessfulReview,
    }, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
    renameSync(join(lock, 'queue.json'), path);
    return health;
  } finally {
    rmSync(lock, { recursive: true, force: true });
  }
}

export function writeLastSuccess(directory: string, value: string) {
  const staging = mkdtempSync(join(directory, '.health-'));
  try {
    writeFileSync(join(staging, 'last-success.json'), JSON.stringify({
      lastSuccessfulRefresh: timestamp.parse(value),
    }) + '\n', { mode: 0o600 });
    renameSync(join(staging, 'last-success.json'), join(directory, 'last-success.json'));
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}
