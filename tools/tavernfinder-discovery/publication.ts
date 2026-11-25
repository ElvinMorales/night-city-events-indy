import { z } from 'zod';
import { promoteCatalogRef } from './promote';
import { catalogPath, digest, requireReview, revision, ReviewError } from './catalog-update';

export type Proposal = { base: string; content: string; createdAt: string };
export type StagedCommit = { branch: string; sha: string };
export type Run = { status: string; conclusion: string | null; html_url: string; id: number };
const oid = z.object({ sha: revision });
const ref = z.object({ object: oid });
const runs = z.object({ workflow_runs: z.array(z.object({
  head_sha: revision, head_branch: z.string(), event: z.string(), status: z.string(),
  conclusion: z.string().nullable(), html_url: z.url(), id: z.number().int().positive(),
})) });

export interface Publication {
  main(): Promise<string>;
  catalog(base: string): Promise<unknown>;
  stage(proposal: Proposal): Promise<StagedCommit>;
  validation(commit: StagedCommit): Promise<Run | undefined>;
  deployment(commit: StagedCommit): Promise<Run | undefined>;
  release(commit: StagedCommit, base: string): Promise<void>;
  retryDeployment(commit: StagedCommit): Promise<void>;
}

export class GitHubPublication implements Publication {
  constructor(private repo: string, private token: string, private request = fetch, private promote = promoteCatalogRef) {
    requireReview(/^[\w.-]+\/[\w.-]+$/.test(repo) && token, 'GitHub publication is not configured.');
  }

  private async api(path: string, method = 'GET', body?: unknown, allowed: number[] = []) {
    const response = await this.request('https://api.github.com/repos/' + this.repo + '/' + path, {
      method, redirect: 'error', signal: AbortSignal.timeout(10_000),
      headers: {
        Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28',
        Authorization: 'Bearer ' + this.token, 'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (allowed.includes(response.status)) return undefined;
    if (!response.ok) throw new ReviewError('GitHub could not complete the request (HTTP ' + response.status + ').');
    return response.status === 204 ? undefined : await response.json() as unknown;
  }

  async main() {
    return ref.parse(await this.api('git/ref/heads/main')).object.sha;
  }

  async catalog(base: string) {
    const value = z.object({ encoding: z.literal('base64'), content: z.string() })
      .parse(await this.api('contents/' + catalogPath + '?ref=' + revision.parse(base)));
    return JSON.parse(Buffer.from(value.content, 'base64').toString('utf8')) as unknown;
  }

  async stage(proposal: Proposal) {
    requireReview(await this.main() === proposal.base, 'Main advanced. Prepare a new proposal after reviewing the updated catalog.');
    const branch = 'indy-catalog/' + digest(JSON.stringify([proposal.base, proposal.content, proposal.createdAt]));
    const parent = z.object({ tree: oid }).parse(await this.api('git/commits/' + revision.parse(proposal.base)));
    const tree = oid.parse(await this.api('git/trees', 'POST', {
      base_tree: parent.tree.sha,
      tree: [{ path: catalogPath, mode: '100644', type: 'blob', content: proposal.content }],
    }));
    const author = { name: 'Night City Events catalog', email: 'indy-catalog@users.noreply.github.com', date: proposal.createdAt };
    const { sha } = oid.parse(await this.api('git/commits', 'POST', {
      parents: [proposal.base], tree: tree.sha, message: 'Update independently verified Indy events', author, committer: author,
    }));
    const created = await this.api('git/refs', 'POST', { ref: 'refs/heads/' + branch, sha }, [422]);
    const staged = ref.parse(created ?? await this.api('git/ref/heads/' + branch));
    requireReview(staged.object.sha === sha, 'The staging branch no longer points to the proposed revision.');
    const commit = { branch, sha };
    if (!await this.validation(commit)) {
      await this.api('actions/workflows/catalog-proposal.yml/dispatches', 'POST', {
        ref: branch, inputs: { proposal_sha: sha },
      });
    }
    return commit;
  }

  private async run(workflow: string, branch: string, sha: string, event: 'workflow_dispatch') {
    const query = new URLSearchParams({ branch, head_sha: revision.parse(sha), event, per_page: '20' });
    return runs.parse(await this.api('actions/workflows/' + workflow + '/runs?' + query)).workflow_runs
      .find(run => run.head_sha === sha && run.head_branch === branch && run.event === event);
  }

  validation(commit: StagedCommit) {
    return this.run('catalog-proposal.yml', commit.branch, commit.sha, 'workflow_dispatch');
  }

  deployment(commit: StagedCommit) {
    return this.run('pages.yml', 'main', commit.sha, 'workflow_dispatch');
  }

  async retryDeployment(commit: StagedCommit) {
    requireReview(await this.main() === commit.sha, 'Main advanced. This release cannot be retried.');
    const run = await this.deployment(commit);
    requireReview(run?.status === 'completed' && (run.conclusion === 'failure' || run.conclusion === 'cancelled'),
      'Only a failed or cancelled Pages run can be retried.');
    await this.api('actions/runs/' + run.id + '/rerun', 'POST');
  }

  async release(commit: StagedCommit, base: string) {
    const main = await this.main();
    requireReview(main === commit.sha || main === base, 'Main advanced. This approval cannot replace a newer revision.');
    if (main === base) {
      const check = await this.validation(commit);
      requireReview(check?.status === 'completed' && check.conclusion === 'success', 'GitHub validation must succeed for this exact proposal.');
      const staged = ref.parse(await this.api('git/ref/heads/' + commit.branch));
      requireReview(staged.object.sha === commit.sha, 'The staging branch changed.');
      await this.promote('https://github.com/' + this.repo + '.git', commit, base, this.token);
    }
    if (await this.deployment(commit)) return;
    requireReview(await this.main() === commit.sha, 'Main advanced before Pages dispatch.');
    await this.api('actions/workflows/pages.yml/dispatches', 'POST', {
      ref: 'main', inputs: { release_sha: commit.sha, moderator_release: 'true' },
    });
  }
}
