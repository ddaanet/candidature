import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPagePayload, buildIndexParagraph } from '../lib/notion.mjs';

const record = {
  title: 'Ornikar — Data Software Engineer',
  company: 'Ornikar', role: 'Data Software Engineer',
  location: 'Paris', workplace: 'hybrid',
  url: 'https://www.linkedin.com/jobs/view/123',
  summary: 'Data Software Engineer, Python, Paris hybrid. Via LinkedIn.',
  analysis: { fit: 'forte correspondance Python', company: 'mission édutech', differentiation: 'profil agentic' },
};

test('buildPagePayload pose le parent et le titre', () => {
  const p = buildPagePayload('root1', record);
  assert.equal(p.parent.page_id, 'root1');
  assert.equal(p.properties.title.title[0].text.content, record.title);
});

test('buildPagePayload rend trois sections d’analyse', () => {
  const p = buildPagePayload('root1', record);
  const headings = p.children.filter((b) => b.type === 'heading_2').map((b) => b.heading_2.rich_text[0].text.content);
  assert.equal(headings.length, 3);
  const bodies = p.children.filter((b) => b.type === 'paragraph').map((b) => b.paragraph.rich_text[0].text.content);
  assert.ok(bodies.some((t) => t.includes('forte correspondance Python')));
  assert.ok(bodies.some((t) => t.includes('Ornikar') && t.includes(record.url)));
});

test('buildIndexParagraph préfixe la date', () => {
  const b = buildIndexParagraph(record, '2026-06-09');
  assert.equal(b.type, 'paragraph');
  assert.equal(b.paragraph.rich_text[0].text.content, '2026-06-09. Data Software Engineer, Python, Paris hybrid. Via LinkedIn.');
});

import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join as pjoin } from 'node:path';
import { loadToken } from '../lib/notion.mjs';

test('loadToken lit la variable d’environnement en priorité', () => {
  assert.equal(loadToken({ env: { NOTION_TOKEN: 'ntn_env' }, file: '/non/existant' }), 'ntn_env');
});

test('loadToken lit le fichier en repli', () => {
  const dir = mkdtempSync(pjoin(tmpdir(), 'walk-tok-'));
  const f = pjoin(dir, 'notion.env');
  writeFileSync(f, 'NOTION_TOKEN=ntn_file\n');
  assert.equal(loadToken({ env: {}, file: f }), 'ntn_file');
  rmSync(dir, { recursive: true, force: true });
});

test('loadToken sans source jette les instructions', () => {
  assert.throws(() => loadToken({ env: {}, file: '/non/existant' }), /Définir NOTION_TOKEN/);
});

import { createShortlistPage } from '../lib/notion.mjs';

function stubFetch(responses) {
  const calls = [];
  const fetch = async (url, opts) => {
    calls.push({ url, opts });
    const r = responses.shift();
    return { ok: r.ok ?? true, status: r.status ?? 200, json: async () => r.json ?? {} };
  };
  return { fetch, calls };
}

test('createShortlistPage poste la page puis ajoute l’index', async () => {
  const { fetch, calls } = stubFetch([
    { json: { id: 'page123', url: 'https://notion.so/page123' } },
    { json: {} },
  ]);
  const out = await createShortlistPage(record, { rootId: 'root1', token: 'ntn_x', dateStr: '2026-06-09', fetch });
  assert.deepEqual(out, { pageId: 'page123', url: 'https://notion.so/page123' });
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /\/v1\/pages$/);
  assert.equal(calls[0].opts.method, 'POST');
  assert.equal(JSON.parse(calls[0].opts.body).parent.page_id, 'root1');
  assert.equal(calls[0].opts.headers.Authorization, 'Bearer ntn_x');
  assert.equal(calls[0].opts.headers['Notion-Version'], '2022-06-28');
  assert.match(calls[1].url, /\/v1\/blocks\/root1\/children$/);
  assert.equal(calls[1].opts.method, 'PATCH');
  assert.equal(JSON.parse(calls[1].opts.body).children.length, 1);
});

test('createShortlistPage jette sur réponse non ok', async () => {
  const { fetch } = stubFetch([{ ok: false, status: 401, json: { message: 'unauthorized' } }]);
  await assert.rejects(
    () => createShortlistPage(record, { rootId: 'root1', token: 'bad', dateStr: '2026-06-09', fetch }),
    /401/,
  );
});
