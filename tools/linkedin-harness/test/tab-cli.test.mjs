import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const TAB = join(dirname(fileURLToPath(import.meta.url)), '..', 'tab.mjs');

// Faux point HTTP du navigateur. Il sert /json/list, /json/new, /json/close et
// /json/activate, et journalise les requêtes. Aucun websocket : une commande
// qui passerait par connectOverCDP échouerait au lieu de rendre la main.
let server;
let cdpUrl;
let pages;
let calls;
let nextId;

before(async () => {
  server = createServer((req, res) => {
    calls.push(`${req.method} ${req.url}`);
    const [path, query] = req.url.split('?');
    const json = (body, status = 200) => {
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(body));
    };
    if (path === '/json/list') return json(pages);
    if (path === '/json/new') {
      if (req.method !== 'PUT') return json({ error: 'Using unsafe HTTP verb GET' }, 405);
      const page = { type: 'page', id: `T${nextId++}`, url: decodeURIComponent(query ?? 'about:blank'), title: '' };
      pages.push(page);
      return json(page);
    }
    const close = path.match(/^\/json\/close\/(.+)$/);
    if (close) {
      pages = pages.filter((p) => p.id !== close[1]);
      res.end('Target is closing');
      return;
    }
    if (path.startsWith('/json/activate/')) { res.end('Target activated'); return; }
    res.writeHead(404);
    res.end();
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  cdpUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

let regDir;
beforeEach(() => {
  pages = [{ type: 'page', id: 'CAND', url: 'https://www.linkedin.com/messaging/compose/', title: 'Messaging' }];
  calls = [];
  nextId = 1;
  regDir = mkdtempSync(join(tmpdir(), 'tabs-'));
});

const run = (...args) => new Promise((resolve) => {
  const child = spawn(process.execPath, [TAB, ...args], {
    env: { ...process.env, LINKEDIN_HARNESS_CDP_URL: cdpUrl, LINKEDIN_HARNESS_TAB_DIR: regDir, TAB_SETTLE_MS: '0' },
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (d) => { stdout += d; });
  child.stderr.on('data', (d) => { stderr += d; });
  child.on('close', (status) => resolve({ status, stdout, stderr }));
});

const registry = (owner) => JSON.parse(readFileSync(join(regDir, `${owner}.json`), 'utf8'));

test('open crée l\'onglet par PUT /json/new et l\'inscrit au registre', async () => {
  const r = await run('--owner', 'wwr', '--tab', 'listing', 'open', 'https://weworkremotely.com/?a=1&b=2');
  assert.equal(r.status, 0, r.stderr);
  assert.ok(calls.some((c) => c.startsWith('PUT /json/new?')));
  assert.deepEqual(registry('wwr'), { listing: 'T1' });
  assert.equal(pages.find((p) => p.id === 'T1').url, 'https://weworkremotely.com/?a=1&b=2');
});

test('open reprend un onglet inscrit et vivant sans en créer', async () => {
  pages.push({ type: 'page', id: 'OWN', url: 'about:blank', title: '' });
  writeFileSync(join(regDir, 'wwr.json'), JSON.stringify({ navette: 'OWN' }));
  const r = await run('--owner', 'wwr', 'open');
  assert.equal(r.status, 0, r.stderr);
  assert.ok(!calls.some((c) => c.includes('/json/new')));
  assert.match(r.stdout, /réutilisé/);
});

test('open remplace une inscription morte par un onglet neuf', async () => {
  writeFileSync(join(regDir, 'wwr.json'), JSON.stringify({ navette: 'DEAD' }));
  const r = await run('--owner', 'wwr', 'open');
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(registry('wwr'), { navette: 'T1' });
});

test('adopt inscrit la page vivante qui porte le fragment d\'URL', async () => {
  pages.push({ type: 'page', id: 'FORM', url: 'https://hostaway.recruitee.com/o/backend/c/new', title: 'Apply' });
  const r = await run('--owner', 'hostaway', 'adopt', 'recruitee.com/o/backend');
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(registry('hostaway'), { navette: 'FORM' });
  assert.ok(!calls.some((c) => c.includes('/json/new')));
});

test('adopt refuse un fragment ambigu', async () => {
  pages.push({ type: 'page', id: 'X1', url: 'https://www.linkedin.com/jobs/view/1/', title: '' });
  const r = await run('--owner', 'o', 'adopt', 'linkedin.com');
  assert.notEqual(r.status, 0);
  assert.ok(!existsSync(join(regDir, 'o.json')));
});

test('close ferme par /json/close et retire l\'inscription', async () => {
  pages.push({ type: 'page', id: 'OWN', url: 'about:blank', title: '' });
  writeFileSync(join(regDir, 'wwr.json'), JSON.stringify({ navette: 'OWN', listing: 'CAND' }));
  const r = await run('--owner', 'wwr', 'close');
  assert.equal(r.status, 0, r.stderr);
  assert.ok(calls.includes('GET /json/close/OWN'));
  assert.deepEqual(registry('wwr'), { listing: 'CAND' });
});

test('close refuse de fermer le dernier onglet du navigateur', async () => {
  writeFileSync(join(regDir, 'wwr.json'), JSON.stringify({ navette: 'CAND' }));
  const r = await run('--owner', 'wwr', 'close');
  assert.notEqual(r.status, 0);
  assert.ok(!calls.some((c) => c.includes('/json/close')));
});

test('list lit le registre contre /json/list', async () => {
  writeFileSync(join(regDir, 'wwr.json'), JSON.stringify({ navette: 'CAND', vieux: 'DEAD' }));
  const r = await run('--owner', 'wwr', 'list');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /navette\t\[vivant\]/);
  assert.match(r.stdout, /vieux\t\[mort\]/);
});

test('sans --owner, la commande est refusée', async () => {
  const r = await run('open');
  assert.equal(r.status, 2);
  assert.equal(calls.length, 0);
});
