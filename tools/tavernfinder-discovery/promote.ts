import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { requireReview, revision, ReviewError } from './catalog-update';
import type { StagedCommit } from './publication';

const exec = promisify(execFile);

export async function promoteCatalogRef(remote: string, commit: StagedCommit, base: string, credential?: string) {
  revision.parse(base);
  revision.parse(commit.sha);
  requireReview(/^indy-catalog\/[a-z0-9-]+$/.test(commit.branch), 'Invalid catalog staging branch.');
  const directory = await mkdtemp(join(tmpdir(), 'indy-catalog-promotion-'));
  const git = (...args: string[]) => exec('/usr/bin/git', args, {
    cwd: directory, timeout: 15_000, maxBuffer: 65_536, encoding: 'utf8',
    env: {
      PATH: '/usr/bin:/bin', HOME: directory, LC_ALL: 'C', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null',
      GIT_TERMINAL_PROMPT: '0', GIT_CONFIG_COUNT: credential ? '3' : '2',
      GIT_CONFIG_KEY_0: 'http.followRedirects', GIT_CONFIG_VALUE_0: 'false',
      GIT_CONFIG_KEY_1: 'credential.helper', GIT_CONFIG_VALUE_1: '',
      ...(credential ? { GIT_CONFIG_KEY_2: 'http.https://github.com/.extraHeader',
        GIT_CONFIG_VALUE_2: 'Authorization: Basic ' + Buffer.from('x-access-token:' + credential).toString('base64') } : {}),
    },
  });
  try {
    await git('init', '--quiet', '--bare');
    const staged = 'refs/heads/' + commit.branch;
    await git('fetch', '--quiet', '--no-tags', '--depth=2', remote, staged + ':' + staged);
    const { stdout } = await git('rev-list', '--parents', '-n', '1', staged);
    requireReview(stdout.trim() === commit.sha + ' ' + base,
      'The staged commit must still be the approved revision with exactly the expected parent.');
    // The explicit lease rejects any different remote head, even a rewind. The parent check guarantees a fast-forward.
    await git('push', '--quiet', '--force-with-lease=refs/heads/main:' + base, remote, commit.sha + ':refs/heads/main');
    // Git may consider an already-present revision up-to-date. The caller checks main again before dispatch.
  } catch (error) {
    if (error instanceof ReviewError) throw error;
    // Child-process errors may contain remote output. Keep the raw error off the dashboard and logs.
    throw new ReviewError('GitHub promotion failed. Verify main, repository rules and credential access before resuming.');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
