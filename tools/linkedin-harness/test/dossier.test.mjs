import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderDossier, createShortlistDossier } from '../lib/dossier.mjs';

const record = () => ({
  title: 'Ornikar — Data Software Engineer',
  company: 'Ornikar', role: 'Data Software Engineer',
  location: 'Paris', workplace: 'hybrid',
  url: 'https://www.linkedin.com/jobs/view/123',
  summary: 'Data Software Engineer, Python, Paris hybrid. Via LinkedIn.',
  slug: 'ornikar-data-software-engineer',
  analysis: { fit: 'forte correspondance Python', company: 'mission édutech', differentiation: 'profil agentic' },
});

test('renderDossier pose le frontmatter de shortlist', () => {
  const md = renderDossier(record(), '2026-06-19');
  assert.match(md, /^---\n/);
  assert.match(md, /\nentreprise: Ornikar\n/);
  assert.match(md, /\nposte: Data Software Engineer\n/);
  assert.match(md, /\nstatut: shortlist\n/);
  assert.match(md, /\ndate_shortlist: 2026-06-19\n/);
});

test('renderDossier inscrit le jobId quand fourni et l’omet sinon', () => {
  assert.match(renderDossier(record(), '2026-06-19', '4417156077'), /\njobId: 4417156077\n/);
  assert.doesNotMatch(renderDossier(record(), '2026-06-19'), /jobId/);
});

test('renderDossier rend l’offre et les trois sections d’analyse', () => {
  const md = renderDossier(record(), '2026-06-19');
  assert.match(md, /# Ornikar — Data Software Engineer/);
  assert.match(md, /## Offre\nPoste : Data Software Engineer\. Lieu : Paris \(hybrid\)\. Offre : https:\/\/www\.linkedin\.com\/jobs\/view\/123/);
  assert.match(md, /## Adéquation et écarts\nforte correspondance Python/);
  assert.match(md, /## Motivation\nmission édutech/);
  assert.match(md, /## Différenciation\nprofil agentic/);
});

test('createShortlistDossier écrit le README et rend le chemin relatif', () => {
  const root = mkdtempSync(join(tmpdir(), 'cand-'));
  const { path } = createShortlistDossier(record(), { root, dateStr: '2026-06-19', jobId: '42' });
  assert.equal(path, 'candidatures/2026-06-19-ornikar-data-software-engineer/README.md');
  const written = readFileSync(join(root, path), 'utf8');
  assert.match(written, /statut: shortlist/);
  assert.match(written, /jobId: 42/);
  rmSync(root, { recursive: true, force: true });
});

test('createShortlistDossier jette si le dossier existe déjà', () => {
  const root = mkdtempSync(join(tmpdir(), 'cand-'));
  mkdirSync(join(root, 'candidatures', '2026-06-19-ornikar-data-software-engineer'), { recursive: true });
  assert.throws(
    () => createShortlistDossier(record(), { root, dateStr: '2026-06-19', jobId: '42' }),
    /déjà présent/,
  );
  rmSync(root, { recursive: true, force: true });
});
