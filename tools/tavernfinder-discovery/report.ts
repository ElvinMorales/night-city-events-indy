import { chmodSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { dashboard } from './dashboard';
import { Moderation } from './moderation';
import { GitHubPublication } from './publication';

const moderator = process.env.MODERATOR_LOGIN;
if (!moderator?.includes('@')) throw new Error('Moderator identity is required');
const origin = process.env.INDY_MODERATOR_ORIGIN ?? '';
const reviewEnabled = process.env.INDY_REVIEW_WRITES === 'true';
if (reviewEnabled && (!origin || new URL(origin).origin !== origin || !origin.startsWith('https://'))) {
  throw new Error('An exact HTTPS moderator origin is required');
}
let publication: GitHubPublication | undefined;
if (reviewEnabled && process.env.INDY_GITHUB_PUBLICATION === 'true') {
  const credentials = process.env.CREDENTIALS_DIRECTORY;
  if (!credentials) throw new Error('GitHub publication requires a systemd credential');
  publication = new GitHubPublication('ElvinMorales/night-city-events-indy',
    readFileSync(join(credentials, 'indy-github-token'), 'utf8').trim());
}
const socket = '/run/indy-discovery-report/report.sock';
dashboard({ moderator, origin, reviewEnabled, moderation: new Moderation('/var/lib/indy-discovery', publication) })
  .listen(socket, () => chmodSync(socket, 0o600));
