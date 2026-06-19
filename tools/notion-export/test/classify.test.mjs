import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify, classifyRootChild, splitTitle, parseStatusLine } from '../lib/classify.mjs';

test('slugify', () => {
  assert.equal(slugify('ABC arbitrage'), 'abc-arbitrage');
  assert.equal(slugify('Kraken Technologies France'), 'kraken-technologies-france');
  assert.equal(slugify('Criteo / Senior'), 'criteo-senior');
});

test('classifyRootChild reconnaît les sections spéciales', () => {
  assert.equal(classifyRootChild('Fiche candidat - David Allouche'), 'fiche-candidat');
  assert.equal(classifyRootChild('Recherches'), 'recherches');
  assert.equal(classifyRootChild('Tendances'), 'tendances');
  assert.equal(classifyRootChild('Passations Recherche d’emploi'), 'passations');
  assert.equal(classifyRootChild('Sites'), 'sites');
  assert.equal(classifyRootChild('Feuille de style cover letter PDF'), 'style');
  assert.equal(classifyRootChild('Style cover letter PDF'), 'style');
  assert.equal(classifyRootChild('Mirakl — Senior AI Agent Engineer'), 'candidature');
});

test('splitTitle', () => {
  assert.deepEqual(splitTitle('Mirakl — Senior AI Agent Engineer'), { entreprise: 'Mirakl', poste: 'Senior AI Agent Engineer' });
  assert.deepEqual(splitTitle('Criteo / Senior AI/LLM Engineer (r20181)'), { entreprise: 'Criteo', poste: 'Senior AI/LLM Engineer (r20181)' });
  assert.deepEqual(splitTitle('Partoo'), { entreprise: 'Partoo', poste: '' });
});

test('parseStatusLine — soumise puis refus daté avec canal', () => {
  const r = parseStatusLine('Soumise le 2026-04-09 via Greenhouse mirakllabs. Statut : refus le 2026-04-13. Senior AI Agent Engineer.');
  assert.equal(r.statut, 'refus');
  assert.equal(r.date_soumission, '2026-04-09');
  assert.equal(r.date_reponse, '2026-04-13');
  assert.equal(r.canal, 'Greenhouse mirakllabs');
});

test('parseStatusLine — refus sans date', () => {
  const r = parseStatusLine('Soumise le 2024-03-18. Statut : refus. Senior SWE CDI Paris.');
  assert.equal(r.statut, 'refus');
  assert.equal(r.date_soumission, '2024-03-18');
  assert.equal(r.date_reponse, null);
  assert.equal(r.canal, null);
});

test('parseStatusLine — shortlist sans soumission', () => {
  const r = parseStatusLine('Shortlist 2026-04-08. Data Software Engineer, Python. Canal : Teamtailor.');
  assert.equal(r.statut, 'shortlist');
  assert.equal(r.date_shortlist, '2026-04-08');
  assert.equal(r.canal, 'Teamtailor');
  assert.equal(r.date_soumission, null);
});

test('parseStatusLine — classée sans suite', () => {
  const r = parseStatusLine('Soumise le 2026-04-03. Statut : classée sans suite le 2026-06-16 (relance sans réponse). Senior SE.');
  assert.equal(r.statut, 'classée sans suite');
  assert.equal(r.date_reponse, '2026-06-16');
});

test('parseStatusLine — en attente', () => {
  const r = parseStatusLine('Soumise le 2026-06-18 via Lever (canal direct). Statut : en attente.');
  assert.equal(r.statut, 'en attente');
  assert.equal(r.canal, 'Lever (canal direct)');
});

test('parseStatusLine — soumise sans statut explicite', () => {
  const r = parseStatusLine('Soumise le 2026-04-06 via Workable. Software Engineer MLOps.');
  assert.equal(r.statut, 'soumise');
  assert.equal(r.canal, 'Workable');
});

test('parseStatusLine — prospect sans soumission ni statut', () => {
  const r = parseStatusLine('2026-06-16. Senior Backend Developer Python/Django. Via LinkedIn.');
  assert.equal(r.statut, null);
  assert.equal(r.date_soumission, null);
});
