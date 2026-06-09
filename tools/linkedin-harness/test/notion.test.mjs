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
