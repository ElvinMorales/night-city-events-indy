import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { createServer, type IncomingMessage } from 'node:http';
import { types } from '../../src/events';
import { ZodError } from 'zod';
import { ReviewError } from './catalog-update';
import { candidateKey, Moderation, type Finding } from './moderation';
import type { Run } from './publication';

const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
function link(value: string | undefined, label: string) {
  if (!value) return '';
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return '';
    return '<a href="' + escape(url.href) + '" rel="noreferrer">' + escape(label) + '</a>';
  } catch {
    return '';
  }
}
const timestamp = (value?: string | null) => value ? escape(value) : 'Unavailable';
const hidden = (key: string, value: unknown) => '<input type="hidden" name="' + key + '" value="' + escape(value) + '">';
const button = (label: string, name: string, value: string) => '<button name="' + name + '" value="' + value + '">' + label + '</button>';
const form = (path: string, token: string, version: number, inner: string) =>
  '<form method="post" action="' + path + '">' + hidden('csrf', token) + hidden('version', version) + inner + '</form>';
const labels: Record<Finding['kind'], string> = {
  'existing-match': 'Catalog match', 'new-lead': 'New lead', 'potential-schedule-change': 'Possible schedule change',
  'ambiguous-match': 'Ambiguous match', 'cross-source-duplicate': 'Possible cross-source duplicate', 'unresolved-venue': 'Unresolved venue',
};
function card(finding: Finding, duplicates: number[], actions = '') {
  const { observation, related } = finding;
  const date = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Indiana/Indianapolis',
  }).format(new Date(observation.start));
  const links = [link(finding.discoveryUrl, 'TavernFinder listing'), link(finding.organizerUrl, 'Organizer calendar')].filter(Boolean);
  return '<article><p>' + escape(labels[finding.kind]) + (duplicates.length ? ' · Duplicate group ' + duplicates.join(', ') : '')
    + '</p><h3>' + escape(observation.title) + '</h3><p>' + escape(observation.venueName)
    + ' · ' + escape(observation.venueCity) + '<br>' + escape(date) + ' Indianapolis time</p>'
    + (links.length ? '<p>' + links.join(' · ') + '</p>' : '')
    + (related.length ? '<ul>' + related.map(item => '<li><code>' + escape(item.id) + '</code> · '
      + timestamp(item.start) + ' · ' + escape(item.status) + ' ' + link(item.catalogSourceUrl, 'Catalog evidence') + '</li>').join('') + '</ul>' : '')
    + actions + '</article>';
}

function reviewFields(values: Record<string, string>) {
  const input = (name: string, label: string, attrs = '') =>
    '<label>' + label + '<input name="' + name + '" value="' + escape(values[name]) + '" ' + attrs + '></label>';
  return input('targetId', 'Canonical ID for a correction. Leave blank for a distinct occurrence.', 'autocapitalize="off"') +
    input('sourceUrl', 'Original organizer evidence URL', 'inputmode="url" autocapitalize="off" maxlength="2048"') +
    input('registrationUrl', 'Verified registration URL', 'inputmode="url" autocapitalize="off" maxlength="2048"') +
    input('name', 'Event title', 'maxlength="200"') +
    '<label>Event type<select name="type"><option value="">Choose a type</option>' +
    types.map(type => '<option' + (values.type === type ? ' selected' : '') + '>' + escape(type) + '</option>').join('') + '</select></label>' +
    input('venue', 'Venue', 'maxlength="200"') + input('address', 'Public address', 'maxlength="300"') +
    '<div class="coordinates">' + input('lat', 'Latitude', 'inputmode="decimal"') + input('lng', 'Longitude', 'inputmode="decimal"') + '</div>' +
    input('start', 'Indianapolis start with offset', 'placeholder="2027-01-09T18:00:00-05:00"') +
    input('end', 'Indianapolis end with offset, if known') + input('format', 'Game format', 'maxlength="200"') +
    input('fee', 'Fee, if known', 'maxlength="100"') +
    '<label>Public description<textarea name="description" maxlength="1000">' + escape(values.description) + '</textarea></label>' +
    '<label class="check"><input type="checkbox" name="verified" value="yes">I checked the organizer evidence for this dated Cyberpunk TCG occurrence, the public details and the registration link.</label>' +
    '<label class="check"><input type="checkbox" name="identity" value="yes">I reviewed possible duplicates and schedule changes and selected the canonical ID or confirmed this is a distinct occurrence.</label>';
}

function runLabel(run?: Run) {
  return run ? escape(run.conclusion ?? run.status) + ' ' + link(run.html_url, 'View workflow run') : 'Waiting for GitHub';
}

async function render(moderation: Moderation, token: string, reviewEnabled: boolean, message?: string, submitted?: URLSearchParams) {
  const { report, queue, status } = moderation.snapshot();
  const state = moderation.read();
  const attempt = status ?? queue?.lastAttempt;
  const metrics = report?.metrics;
  const findings = report?.findings ?? [];
  const groups = report?.duplicateCandidates ?? [];
  const groupIds = (finding: Finding) => groups.flatMap((group, index) =>
    group.sourceIds.includes(finding.observation.sourceId) ? [index + 1] : []);
  const tasks = [...new Map(findings.filter(finding => report?.moderatorQueue.includes(finding.observation.sourceId))
    .map(finding => [candidateKey(finding), finding])).values()];
  const matches = findings.filter(finding => finding.kind === 'existing-match');
  const review = tasks.map(finding => {
    const key = candidateKey(finding);
    const decision = state.decisions[key];
    const stale = decision?.status === 'approved' && decision.approval?.base !== report?.catalogRevision;
    const details = decision ? '<p>Decision: <strong>' + escape(decision.status) + '</strong> · ' + timestamp(decision.at)
      + (stale ? ' · Recheck against the new catalog revision' : '') + '</p>' : '';
    const disabled = !reviewEnabled || decision?.status === 'released' || state.release?.keys.includes(key);
    const attempted = submitted?.get('key') === key ? Object.fromEntries(submitted) : undefined;
    const actions = disabled ? '' : '<details' + (stale || attempted ? ' open' : '') + '><summary>Review occurrence</summary>' +
      form('/review', token, state.version, hidden('key', key) + hidden('snapshot', moderation.snapshotKey(report!)) +
      reviewFields(attempted ?? decision?.fields ?? { targetId: finding.canonicalId ?? '', name: finding.observation.title,
        venue: finding.observation.venueName, start: finding.observation.start }) + '<div class="buttons">' +
      button('Approve verified details', 'decision', 'approved') + button('Defer', 'decision', 'deferred') +
      button('Dismiss', 'decision', 'dismissed') + '</div>') + '</details>';
    return card(finding, groupIds(finding), details + actions);
  }).join('');
  const release = state.release;
  const publishForm = (label: string, action: string) => form('/publication', token, state.version,
    hidden('proposal', release?.id) + button(label, 'action', action));
  let publication = '<p>GitHub publication is disabled.</p>';
  if (moderation.publication) {
    publication = reviewEnabled ? publishForm('Preview eligible approvals', 'prepare') : '<p>Moderator writes are disabled.</p>';
    if (release) {
      let validation: Run | undefined;
      let deploy: Run | undefined;
      let unavailable = false;
      try {
        if (release.staged) [validation, deploy] = await Promise.all([
          moderation.publication.validation(release.staged),
          release.authorizedAt ? moderation.publication.deployment(release.staged) : undefined,
        ]);
      } catch {
        unavailable = true;
      }
      publication = '<p>Base <code>' + escape(release.base) + '</code></p>'
        + release.changes.map(change => '<details><summary>' + escape(change.after.name) + ' · ' + (change.before ? 'Correction' : 'Addition')
          + '</summary><h3>Before</h3><pre>' + escape(JSON.stringify(change.before, null, 2))
          + '</pre><h3>After</h3><pre>' + escape(JSON.stringify(change.after, null, 2)) + '</pre></details>').join('')
        + (release.staged ? '<p>Proposed commit <code>' + escape(release.staged.sha) + '</code></p><p>Validation: '
          + (unavailable ? 'GitHub status unavailable' : runLabel(validation)) + '</p>' : '')
        + (release.authorizedAt ? '<p>Authorized ' + timestamp(release.authorizedAt) + '</p><p>Pages: '
          + (unavailable ? 'GitHub status unavailable' : runLabel(deploy)) + '</p>' : '');
      if (reviewEnabled) {
        if (!release.staged) publication += publishForm('Send proposed revision to GitHub for validation', 'stage');
        if (!release.authorizedAt) publication += publishForm('Clear proposal', 'clear');
        if (!release.authorizedAt && validation?.status === 'completed' && validation.conclusion === 'success') {
          publication += publishForm('Authorize publication of this revision', 'authorize');
        }
        if (release.authorizedAt && !release.dispatched) publication += publishForm('Resume authorized publication', 'authorize');
        if (release.authorizedAt && deploy?.status === 'completed' && ['failure', 'cancelled'].includes(deploy.conclusion ?? '')) {
          publication += publishForm('Retry Pages for this authorized revision', 'retry');
        }
        if (release.authorizedAt && deploy?.conclusion === 'success') publication += publishForm('Archive completed release', 'archive');
        if (release.authorizedAt && deploy?.conclusion !== 'success' && (!deploy || deploy.status === 'completed')) {
          publication += publishForm('Close superseded release', 'supersede');
        }
        publication += '<p><a href="/">Refresh workflow status</a></p>';
      }
    }
  }
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Indy discovery review</title><style>html{color-scheme:light dark}body{font:1rem/1.5 system-ui,sans-serif;margin:auto;max-width:48rem;padding:1rem}' +
    'article,section{border:1px solid GrayText;border-radius:.65rem;padding:.85rem;margin:.75rem 0}h1,h2,h3,p{margin:.55rem 0}' +
    'label{display:block;margin:.75rem 0}input,button,select,textarea{font:inherit;box-sizing:border-box;max-width:100%;padding:.5rem;min-height:44px}' +
    'input,select,textarea{display:block;width:100%}input[type=checkbox]{display:inline-block;width:1.2rem;min-height:0;margin-right:.5rem}' +
    'button,summary{cursor:pointer}summary{padding:.7rem 0}.buttons,.coordinates{display:flex;flex-wrap:wrap;gap:.5rem}' +
    '.coordinates label{flex:1 1 8rem}pre{white-space:pre-wrap;overflow-wrap:anywhere}code{overflow-wrap:anywhere}form{margin:.55rem 0}</style>' +
    '<main><h1>Night City Events — Indy</h1>' + (message ? '<p role="alert">' + escape(message) + '</p>' : '') +
    '<section><h2>Source health</h2><p>Latest attempt: <strong>' + escape(attempt?.outcome ?? 'pending') + '</strong> · ' +
    timestamp(attempt?.checkedAt) + (attempt?.reason ? '<br>' + escape(attempt.reason) : '') + '<br>Last successful refresh: ' +
    timestamp(queue?.lastSuccessfulRefresh) + '<br>Latest attempted catalog revision: <code>' + escape(status?.catalogRevision ?? 'Unavailable') +
    '</code><br>Observation catalog revision: <code>' + escape(report?.catalogRevision ?? 'Unavailable') + '</code></p>' +
    (attempt && attempt.outcome !== 'success' ? '<p>Showing the last successful observations, if available.</p>' : '') +
    (metrics ? '<p>' + metrics.inCoverage + ' in coverage · ' + metrics.matchedUpcoming + ' of ' + metrics.knownUpcoming +
      ' catalog matches · ' + metrics.newDatedLeads + ' dated leads · ' + metrics.duplicateGroups + ' duplicate groups</p>' : '') +
    '</section><section><h2>Catalog publication</h2>' + publication + '</section>' +
    '<h2>Actionable observations (' + tasks.length + ')</h2>' + (review || '<p>No actionable observations in the displayed snapshot.</p>') +
    (groups.length ? '<details><summary>Duplicate groups</summary><ol>' + groups.map(group =>
      '<li>' + escape(group.reason.replaceAll('-', ' ')) + '<ul>' + group.sourceIds.map(id => {
        const finding = findings.find(item => item.observation.sourceId === id);
        return '<li>' + escape(finding?.observation.title ?? id) + ' ' + link(finding?.discoveryUrl, 'TavernFinder listing') + '</li>';
      }).join('') + '</ul></li>').join('') + '</ol></details>' : '') +
    '<details><summary>Catalog matches (' + matches.length + ')</summary>' + matches.map(finding => card(finding, groupIds(finding))).join('') +
    '</details><details><summary>Saved decisions</summary><ul>' + Object.values(state.decisions).map(decision =>
      '<li>' + escape(decision.title) + ' · ' + escape(decision.status) + ' · ' + timestamp(decision.at) + '</li>').join('') +
    '</ul></details><details><summary>Release history</summary><ul>' + (state.history ?? []).map(entry =>
      '<li><code>' + escape(entry.sha) + '</code> · ' + escape(entry.outcome) + ' · ' + timestamp(entry.authorizedAt) + '</li>').join('') +
    '</ul></details><p><a href="https://github.com/ElvinMorales/night-city-events-indy/blob/main/docs/VERIFICATION.md">Catalog verification policy</a></p></main></html>';
}

async function readForm(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > 16_384) throw new ReviewError('Form exceeds the size limit.');
    chunks.push(chunk);
  }
  const form = new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
  if (new Set(form.keys()).size !== form.size) throw new ReviewError('Repeated form fields are invalid.');
  return form;
}

export function dashboard(options: { moderator: string; origin: string; reviewEnabled: boolean; moderation: Moderation }) {
  const { moderator, origin, reviewEnabled, moderation } = options;
  const csrf = createHmac('sha256', randomBytes(32)).update(moderator + '\n' + origin).digest();
  const server = createServer({ requestTimeout: 20_000 }, async (req, res) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    const reject = (code: number, message: string) =>
      res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' }).end(message + '\n');
    let submitted: URLSearchParams | undefined;
    const page = async (code: number, message?: string) => {
      const html = await render(moderation, csrf.toString('hex'), reviewEnabled, message, submitted);
      res.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8' }).end(req.method === 'HEAD' ? undefined : html);
    };
    if (req.headersDistinct['tailscale-user-login']?.length !== 1 || req.headers['tailscale-user-login'] !== moderator) {
      reject(403, 'Moderator access required.');
      return;
    }
    try {
      if (req.url === '/' && (req.method === 'GET' || req.method === 'HEAD')) {
        await page(200);
        return;
      }
      if (req.method !== 'POST' || (req.url !== '/review' && req.url !== '/publication')) {
        reject(404, 'Page unavailable.');
        return;
      }
      if (!reviewEnabled || req.headersDistinct.origin?.length !== 1 || req.headers.origin !== origin ||
          (req.headers['sec-fetch-site'] && req.headers['sec-fetch-site'] !== 'same-origin')) {
        reject(403, 'Write request rejected.');
        return;
      }
      if (req.headers['content-type']?.split(';')[0].trim() !== 'application/x-www-form-urlencoded') {
        reject(415, 'Unsupported form format.');
        return;
      }
      const form = await readForm(req);
      const token = form.get('csrf') ?? '';
      if (!/^[a-f0-9]{64}$/.test(token) || !timingSafeEqual(csrf, Buffer.from(token, 'hex'))) {
        reject(403, 'Request token invalid. Reload the dashboard.');
        return;
      }
      if (req.url === '/review') {
        submitted = form;
        await moderation.review(form, moderator);
      }
      else await moderation.publish(form, moderator);
      res.writeHead(303, { Location: '/' }).end();
    } catch (error) {
      if (error instanceof ReviewError || error instanceof ZodError) {
        const message = error instanceof ZodError
          ? error.issues.map(issue => String(issue.path[0] ?? 'Event details') + ' — ' + issue.message).join('. ') : error.message;
        try {
          await page(409, message);
          return;
        } catch { /* Return the generic service error below. */ }
      }
      reject(503, 'Discovery report temporarily unavailable.');
    }
  });
  return server;
}
