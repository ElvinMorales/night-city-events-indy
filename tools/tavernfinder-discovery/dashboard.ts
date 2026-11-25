import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { createServer, type IncomingMessage } from 'node:http';
import { types, TZ, type Event } from '../../src/events';
import { ZodError } from 'zod';
import { ReviewError, organizerUrl, type CatalogChange } from './catalog-update';
import { candidateKey, Moderation, needsIdentityChoice, reviewValues, venueEvidence, type Finding } from './moderation';
import type { Run } from './publication';

const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
function link(value: string | undefined, label: string, external = false) {
  if (!value) return '';
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return '';
    return '<a href="' + escape(url.href) + '" rel="noreferrer"' + (external ? ' target="_blank"' : '') + '>' + escape(label) + '</a>';
  } catch {
    return '';
  }
}
const timestamp = (value?: string | null) => value ? escape(value) : 'Unavailable';
const hidden = (key: string, value: unknown) => '<input type="hidden" name="' + key + '" value="' + escape(value) + '">';
const button = (label: string, name: string, value: string, style = '', skipValidation = false) =>
  '<button name="' + name + '" value="' + value + '"' + (style ? ' class="' + style + '"' : '') +
  (skipValidation ? ' formnovalidate' : '') + '>' + label + '</button>';
const form = (path: string, token: string, version: number, inner: string) =>
  '<form method="post" action="' + path + '">' + hidden('csrf', token) + hidden('version', version) + inner + '</form>';
const displayTime = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: TZ,
});
const localTime = (value: string) => escape(displayTime.format(new Date(value)));

function input(values: Record<string, string>, name: string, label: string, attrs = '') {
  return '<label>' + label + '<input name="' + name + '" value="' + escape(values[name]) + '" ' + attrs + '></label>';
}

function locationFields(values: Record<string, string>, missing: string[], visible: boolean) {
  const labels = { address: 'Public street address', lat: 'Latitude', lng: 'Longitude' };
  return (Object.keys(labels) as (keyof typeof labels)[]).filter(name => missing.includes(name) === visible)
    .map(name => input(values, name, labels[name], (name === 'address' ? 'maxlength="300"' : 'inputmode="decimal"') +
      (visible ? ' required' : ''))).join('');
}

function editor(values: Record<string, string>, missing: string[], attempted: boolean, evidenceField: string) {
  const field = (name: string, label: string, attrs = '') => input(values, name, label, attrs);
  return '<details class="editor"' + (attempted ? ' open' : '') + '><summary>Edit</summary>' +
    field('name', 'Event title', 'maxlength="200"') + field('venue', 'Venue', 'maxlength="200"') +
    field('start', 'Starts in Indianapolis', 'placeholder="2027-01-09T18:00"') +
    field('end', 'Ends in Indianapolis, if known', 'placeholder="2027-01-09T20:00"') +
    '<label>Event type<select name="type"><option value="">Unknown</option>' +
    types.map(type => '<option' + (values.type === type ? ' selected' : '') + '>' + escape(type) + '</option>').join('') + '</select></label>' +
    field('format', 'Game format, if known', 'maxlength="200"') + field('fee', 'Fee, if known', 'maxlength="100"') +
    '<label>Public description<textarea name="description" maxlength="1000">' + escape(values.description) + '</textarea></label>' +
    evidenceField +
    field('registrationUrl', 'Registration URL, if known', urlAttrs) +
    '<details><summary>Advanced editing</summary>' +
    locationFields(values, missing, false) +
    (values.targetId ? '<p>Catalog ID <code>' + escape(values.targetId) + '</code></p>' : '') +
    (values.start ? '<p>Time zone · America/Indiana/Indianapolis</p>' : '') + '</details></details>';
}

const urlAttrs = 'type="url" inputmode="url" autocapitalize="off" maxlength="2048"';

function occurrence(finding: Finding, values: Record<string, string>) {
  const venue = [values.venue, values.address || finding.observation.venueCity].filter(Boolean);
  const when = Number.isFinite(Date.parse(values.start)) ? values.start : finding.observation.start;
  return '<h3>' + escape(values.name) + '</h3><p class="when">' + localTime(when) +
    (Number.isFinite(Date.parse(values.end)) ? ' – ' + localTime(values.end) : '') + ' · Indianapolis</p><p class="venue">' +
    venue.map(escape).join('<br>') + '</p>' +
    ([values.type, values.format, values.fee].some(Boolean) ?
      '<p>' + [values.type, values.format, values.fee].filter(Boolean).map(escape).join(' · ') + '</p>' : '') +
    (values.description ? '<p>' + escape(values.description) + '</p>' : '');
}

function reviewCard(finding: Finding, values: Record<string, string>, extras: string, actions: string) {
  return '<article>' + occurrence(finding, values) + extras + actions + '</article>';
}

function changeDetails(change: CatalogChange) {
  const before = change.before as Partial<Event> | null;
  const after = change.after;
  const shown = {
    name: 'Title', venue: 'Venue', address: 'Address', start: 'Starts', end: 'Ends', type: 'Event type',
    format: 'Format', fee: 'Fee', description: 'Description', sourceUrl: 'Organizer evidence', registrationUrl: 'Registration',
    status: 'Status', lat: 'Latitude', lng: 'Longitude', lastVerified: 'Verification time',
  } as const;
  type Key = keyof typeof shown;
  const field = (key: Key, value?: string | number | null) => {
    if (value === undefined || value === null || value === '') return 'Unknown';
    if (key === 'start' || key === 'end' || key === 'lastVerified') return localTime(String(value));
    if (key === 'sourceUrl' || key === 'registrationUrl') return link(String(value), String(value)) || escape(value);
    return escape(value);
  };
  return '<details class="change"><summary><strong>' + escape(after.name) + '</strong><span>' +
    (before ? 'Correction' : 'Addition') + ' · ' + localTime(after.start) + '</span></summary><dl>' +
    (Object.keys(shown) as Key[]).filter(key => before ? before[key] !== after[key] : after[key] != null && after[key] !== '')
      .map(key => '<dt>' + shown[key] + '</dt><dd>' + (before ? '<span class="old">' + field(key, before[key]) + ' → </span>' : '') +
        field(key, after[key]) + '</dd>').join('') + '</dl></details>';
}

function runLabel(run?: Run) {
  if (!run) return 'Waiting for GitHub';
  return escape((run.conclusion ?? run.status).replaceAll('_', ' '));
}

async function publicationPanel(moderation: Moderation, token: string, reviewEnabled: boolean, state = moderation.read()) {
  const release = state.release;
  const base = moderation.snapshot().report?.catalogRevision;
  const eligible = Object.values(state.decisions).filter(decision => decision.status === 'approved' &&
    decision.approval && decision.approval.base === base).length;
  const publishForm = (label: string, action: string, primary = false) => form('/publication', token, state.version,
    hidden('proposal', release?.id) + button(label, 'action', action, primary ? 'primary' : ''));
  if (!moderation.publication) return '<p>Publication is disabled.</p>';
  if (!reviewEnabled) return '<p>Moderator writes are disabled.</p>';
  if (!release) return eligible ? '<p>' + eligible + (eligible === 1 ? ' event' : ' events') + ' approved and ready for validation.</p>' +
    publishForm('Submit approved batch', 'submit', true) : '<p>Approved events will appear here.</p>';

  let validation: Run | undefined;
  let deploy: Run | undefined;
  let unavailable = false;
  try {
    if (release.staged) {
      if (release.authorizedAt && release.dispatched) deploy = await moderation.publication.deployment(release.staged);
      else validation = await moderation.publication.validation(release.staged);
    }
  } catch {
    unavailable = true;
  }
  const active = release.staged && (unavailable || (release.authorizedAt
    ? release.dispatched && deploy?.status !== 'completed'
    : validation?.status !== 'completed'));
  const status = unavailable ? 'GitHub status temporarily unavailable' : release.authorizedAt
    ? release.dispatched ? 'Deployment · ' + runLabel(deploy) : 'Publication authorized · dispatch pending'
    : 'Validation · ' + runLabel(validation);
  let actions = '';
  if (!release.staged) actions += publishForm('Send proposed revision to GitHub for validation', 'submit', true);
  if (!release.authorizedAt && validation?.status === 'completed' && validation.conclusion === 'success') {
    actions += '<p>Review the validated changes before publishing.</p>' +
      publishForm('Authorize publication of this revision', 'authorize', true);
  }
  if (!release.authorizedAt) actions += publishForm('Clear proposal', 'clear');
  if (release.authorizedAt && !release.dispatched) actions += publishForm('Resume authorized publication', 'authorize', true);
  if (release.authorizedAt && deploy?.status === 'completed' && ['failure', 'cancelled'].includes(deploy.conclusion ?? '')) {
    actions += publishForm('Retry deployment', 'retry');
  }
  if (release.authorizedAt && deploy?.conclusion === 'success') {
    actions += eligible ? publishForm('Submit approved batch', 'submit', true) : publishForm('Archive completed release', 'archive');
  }
  if (release.authorizedAt && deploy?.conclusion !== 'success' && (!deploy || deploy.status === 'completed')) {
    actions += publishForm('Close superseded release', 'supersede');
  }
  return '<div data-publication="' + escape(release.id) + '"' + (active ? ' data-poll' : '') + '>' +
    (release.staged ? '<p class="publication-status" role="status">' + status + '</p>' : '') +
    release.changes.map(changeDetails).join('') + '<div data-publication-actions>' + actions + '</div>' +
    '<details><summary>Revision details</summary><p>Base <code>' + escape(release.base) + '</code></p>' +
    (release.staged ? '<p>Proposed commit <code>' + escape(release.staged.sha) + '</code></p>' : '') +
    '</details></div>';
}

const styles = `
:root{color-scheme:dark;--surface:#191c24;--line:#3b4050;--mute:#b7bdcd;--accent:#eefc88;--ink:#10130a}
*{box-sizing:border-box}html{background:#101219;color:#f5f6fa;scroll-padding-top:1rem}
body{font:1rem/1.5 system-ui,sans-serif;margin:0}
main{width:min(100%,44rem);margin:auto;padding:1rem 1rem 3rem}
header{display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.35rem 0 1rem;border-bottom:1px solid var(--line)}
header p{font-weight:700;line-height:1.25;margin:0}header span{display:block;color:var(--mute);font-size:.87rem;font-weight:500}
h1{font-size:clamp(1.7rem,5.8vw,2.35rem);line-height:1.1;margin:1.35rem 0 .5rem;letter-spacing:-.035em}
h2{font-size:1.3rem;margin:0 0 .6rem}h3{font-size:1.25rem;line-height:1.25;margin:0 0 .55rem;overflow-wrap:anywhere}
p{margin:.45rem 0;overflow-wrap:anywhere}
section{margin:1.5rem 0}article,#publication{background:var(--surface);border:1px solid var(--line);border-radius:1rem;padding:1rem;margin:.75rem 0}
a{color:var(--accent);text-underline-offset:.18em;overflow-wrap:anywhere}.batch-link{display:grid;place-items:center;min-height:44px;padding:.36rem .7rem;border:1px solid var(--line);border-radius:.65rem;text-decoration:none;white-space:nowrap}
.when{font-weight:650}.venue,.muted,.change span,.old{color:var(--mute)}.attention,[role=alert]{color:#ffdb91}
.evidence{margin:.85rem 0;padding:.65rem .75rem;background:#242837;border-radius:.65rem}
.evidence a{display:inline-flex;align-items:center;min-height:44px}.evidence p{margin:0}.evidence small{display:block;color:var(--mute)}
label{display:block;margin:.65rem 0;font-weight:600}
input,button,select,textarea,summary{font:inherit;min-height:44px}
input,select,textarea{display:block;width:100%;min-width:0;padding:.55rem .65rem;margin:.25rem 0;border:1px solid var(--line);border-radius:.5rem;background:#101219;color:inherit}
button,summary{cursor:pointer}summary{padding:.65rem 0}.editor summary{font-weight:650}
button{border:1px solid var(--line);background:#242837;color:inherit;padding:.55rem .7rem;border-radius:.6rem;font-weight:650;max-width:100%}
.use-evidence{background:transparent;color:var(--accent);font-size:.9rem}
.primary{background:var(--accent);color:var(--ink);border-color:var(--accent);width:100%}
.confirm{font-size:.9rem;color:var(--mute);margin:.8rem 0 .45rem}
.secondary{display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-top:.5rem}.editor{border-top:1px solid var(--line);margin-top:.7rem}
.change{border-block-start:1px solid var(--line)}.change span{display:block;margin-left:1.05rem;font-size:.9rem}
dt{font-weight:650}dd{margin:0 0 .55rem;overflow-wrap:anywhere}form{margin:.55rem 0}
code{overflow-wrap:anywhere}.publication-status{font-weight:700;color:var(--accent)}
:focus-visible{outline:2px solid #a7c9ff;outline-offset:3px}
`;

const dashboardScript = `
  const panel = document.querySelector('#publication-body');
  const active = () => panel.querySelector('[data-poll]');
  async function refreshStatus() {
    try {
      const res = await fetch('/publication-status');
      if (res.ok) {
        const html = await res.text();
        const current = active();
        if (current) {
          const replacement = document.createElement('template');
          replacement.innerHTML = html;
          const next = replacement.content.querySelector('[data-publication]');
          if (next?.dataset.publication === current.dataset.publication) {
            const oldStatus = current.querySelector('[role=status]');
            const newStatus = next.querySelector('[role=status]');
            if (oldStatus && newStatus && oldStatus.textContent !== newStatus.textContent) oldStatus.textContent = newStatus.textContent;
            const oldActions = current.querySelector('[data-publication-actions]');
            const newActions = next.querySelector('[data-publication-actions]');
            if (!oldActions.contains(document.activeElement)) {
              if (oldActions.innerHTML !== newActions.innerHTML) oldActions.replaceWith(newActions);
              current.toggleAttribute('data-poll', next.hasAttribute('data-poll'));
            }
          } else if (!panel.contains(document.activeElement) && !panel.querySelector('details[open]')) {
            current.replaceWith(replacement.content);
          }
        }
      }
    } catch { /* Retry transient connection errors. */ }
    if (active()) setTimeout(refreshStatus, 5000);
  }
  if (active()) setTimeout(refreshStatus, 2500);
  for (const button of document.querySelectorAll('[data-use-evidence]')) {
    button.addEventListener('click', () => {
      const field = button.form.elements.sourceUrl;
      field.value = button.dataset.useEvidence;
      field.focus();
    });
  }
  for (const select of document.querySelectorAll('[data-identity-choice]')) {
    let defaults = JSON.parse(select.selectedOptions[0].dataset.prefill);
    select.addEventListener('change', () => {
      const next = JSON.parse(select.selectedOptions[0].dataset.prefill);
      for (const [name, value] of Object.entries(next)) {
        const field = select.form.elements.namedItem(name);
        if (name !== 'targetId' && field?.value === defaults[name]) field.value = value;
      }
      defaults = next;
      select.form.querySelector('.editor').open = true;
    });
  }
`;

async function render(moderation: Moderation, token: string, reviewEnabled: boolean, nonce: string, message?: string, submitted?: URLSearchParams) {
  const { report, queue, status } = moderation.snapshot();
  const state = moderation.read();
  const attempt = status ?? queue?.lastAttempt;
  const findings = report?.findings ?? [];
  const groups = report?.duplicateCandidates ?? [];
  const tasks = [...new Map(findings.filter(finding => report?.moderatorQueue.includes(finding.observation.sourceId))
    .map(finding => [candidateKey(finding), finding])).values()];
  const pending: string[] = [];
  const reviewed: string[] = [];
  for (const finding of tasks) {
    const key = candidateKey(finding);
    const decision = state.decisions[key];
    const stale = decision?.status === 'approved' && decision.approval?.base !== report?.catalogRevision;
    const attempted = submitted?.get('key') === key ? Object.fromEntries(submitted) : undefined;
    const values = { ...reviewValues(finding, decision?.fields, attempted?.targetId), ...attempted };
    const choice = needsIdentityChoice(finding);
    const duplicate = groups.some(group => group.sourceIds.includes(finding.observation.sourceId));
    const venueUrl = venueEvidence(finding);
    const organizer = link(organizerUrl.safeParse(values.sourceUrl).data, 'Open dated organizer evidence ↗', true);
    const venueLink = link(venueUrl, 'Open venue calendar ↗', true);
    const registration = link(organizerUrl.safeParse(values.registrationUrl).data, 'Open registration ↗', true);
    const evidenceField = input(values, 'sourceUrl', 'Dated organizer evidence URL', urlAttrs + (organizer ? '' : ' required'));
    const option = (id: string, label: string) => '<option value="' + escape(id) + '"' +
      (attempted?.targetId === id || !attempted && values.targetId === id && id ? ' selected' : '') +
      ' data-prefill="' + escape(JSON.stringify(reviewValues(finding, decision?.fields, id))) + '">' + label + '</option>';
    const identity = choice ? '<label>Resolve the possible catalog match<select name="targetId" data-identity-choice required>' +
      option('', 'Choose an occurrence') + finding.related.map(item => option(item.id,
        escape(item.catalogRecord?.name ?? item.id) + ' · ' + localTime(item.start))).join('') +
      option('distinct', 'This is a distinct occurrence') + '</select></label>' : '';
    const related = choice ? '<details><summary>Related catalog evidence</summary><ul>' +
      finding.related.map(item => '<li>' + localTime(item.start) + ' · ' + escape(item.status) + ' ' +
        link(item.catalogRecord?.sourceUrl ?? item.catalogSourceUrl, 'Open catalog evidence ↗', true) + '</li>').join('') + '</ul></details>' : '';
    const missing = ['address', 'lat', 'lng'].filter(name => !values[name as keyof typeof values]?.trim());
    const extras = (decision ? '<p class="muted">Decision · <strong>' + escape(decision.status) + '</strong>' +
      (stale ? ' · Recheck against the current catalog' : '') + '</p>' : '') +
      (organizer || registration || venueLink ? '<div class="evidence">' +
        (organizer ? '<p>' + organizer + '</p>' : '') + (registration ? '<p>' + registration + '</p>' : '') +
        (venueLink ? '<p>' + venueLink + '</p>' + (!organizer ? '<small>Venue-level link. Use it as evidence if it lists this occurrence and date.</small>' : '') : '') +
        '</div>' : '') + related;
    const locked = !reviewEnabled || decision?.status === 'released' || state.release?.keys.includes(key);
    const actions = locked ? '' : form('/review', token, state.version,
      hidden('key', key) + hidden('snapshot', moderation.snapshotKey(report!)) +
      hidden('confirmation', 'dated-organizer-evidence') + identity +
      (!organizer ? evidenceField + (venueLink ? '<button type="button" class="use-evidence" data-use-evidence="' + escape(venueUrl) +
        '">Use venue calendar URL</button>' : '') : '') +
      (missing.length ? '<p class="attention">Confirm the missing venue details before approving.</p>' +
        locationFields(values, missing, true) : '') +
      '<p class="confirm">By approving, I confirm the organizer lists this dated Cyberpunk TCG event and I checked the details.' +
      (duplicate || choice ? ' I also checked for duplicate listings.' : '') + '</p>' +
      button('Approve', 'decision', 'approved', 'primary') +
      '<div class="secondary">' + button('Defer', 'decision', 'deferred', '', true) + button('Dismiss', 'decision', 'dismissed', '', true) + '</div>' +
      editor(values, missing, Boolean(attempted), organizer ? evidenceField : '') +
      (finding.discoveryUrl ? '<details><summary>Discovery listing</summary>' +
        link(finding.discoveryUrl, 'Open TavernFinder listing ↗', true) + '</details>' : ''));
    const html = reviewCard(finding, values, extras, actions);
    if (attempted) pending.unshift(html);
    else if (!decision || stale) pending.push(html);
    else reviewed.push(html);
  }
  const approved = Object.values(state.decisions).filter(decision => decision.status === 'approved').length;
  const batch = await publicationPanel(moderation, token, reviewEnabled, state);
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Review · Night City Events Indy</title><style>' + styles + '</style></head><body>' +
    '<main><header><p>Night City Events<span>Indianapolis moderator</span></p><a class="batch-link" href="#publication">Batch · ' + approved + '</a></header>' +
    '<h1 id="review">Review events</h1><p class="muted">' + pending.length + (pending.length === 1 ? ' event to review' : ' events to review') + '</p>' +
    (message ? '<p role="alert">' + escape(message) + '</p>' : '') +
    (pending.join('') || '<p>No events waiting for review.</p>') +
    '<section id="publication"><h2>Publication batch</h2><div id="publication-body">' + batch + '</div></section>' +
    (reviewed.length ? '<details><summary>Reviewed events (' + reviewed.length + ')</summary>' + reviewed.join('') + '</details>' : '') +
    '<details><summary>Source health</summary><p>Latest attempt · <strong>' + escape(attempt?.outcome ?? 'pending') + '</strong> · ' +
    timestamp(attempt?.checkedAt) + (attempt?.reason ? '<br>' + escape(attempt.reason) : '') + '<br>Last successful refresh · ' +
    timestamp(queue?.lastSuccessfulRefresh) + '<br>Observation catalog revision · <code>' + escape(report?.catalogRevision ?? 'Unavailable') +
    '</code></p></details><details><summary>Saved decisions</summary><ul>' + Object.values(state.decisions).map(decision =>
      '<li>' + escape(decision.title) + ' · ' + escape(decision.status) + ' · ' + timestamp(decision.at) + '</li>').join('') +
    '</ul></details><details><summary>Release history</summary><ul>' + (state.history ?? []).map(entry =>
      '<li><code>' + escape(entry.sha) + '</code> · ' + escape(entry.outcome) + ' · ' + timestamp(entry.authorizedAt) + '</li>').join('') +
    '</ul></details></main><script nonce="' + nonce + '">' + dashboardScript + '</script></body></html>';
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
    const nonce = randomBytes(18).toString('base64');
    res.setHeader('Content-Security-Policy', `default-src 'none'; script-src 'nonce-${nonce}'; connect-src 'self'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'`);
    const reject = (code: number, message: string) =>
      res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' }).end(message + '\n');
    let submitted: URLSearchParams | undefined;
    const page = async (code: number, message?: string) => {
      const html = await render(moderation, csrf.toString('hex'), reviewEnabled, nonce, message, submitted);
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
      if (req.url === '/publication-status' && req.method === 'GET') {
        const html = await publicationPanel(moderation, csrf.toString('hex'), reviewEnabled);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(html);
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
      res.writeHead(303, { Location: req.url === '/publication' ? '/#publication' : '/' }).end();
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
