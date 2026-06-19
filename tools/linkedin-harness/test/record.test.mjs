import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRecord } from '../lib/record.mjs';

const valid = () => ({
  title: 'Ornikar — Data Software Engineer',
  company: 'Ornikar', role: 'Data Software Engineer',
  location: 'Paris', workplace: 'hybrid',
  url: 'https://www.linkedin.com/jobs/view/123',
  summary: 'Data Software Engineer, Python, Paris hybrid. Via LinkedIn.',
  slug: 'ornikar-data-software-engineer',
  analysis: { fit: 'forte correspondance Python', company: 'mission édutech', differentiation: 'profil agentic' },
});

test('un dossier complet passe et est rendu', () => {
  const r = valid();
  assert.equal(validateRecord(r), r);
});

test('un champ chaîne manquant est listé', () => {
  const r = valid(); delete r.summary;
  assert.throws(() => validateRecord(r), /summary/);
});

test('le slug manquant est listé', () => {
  const r = valid(); delete r.slug;
  assert.throws(() => validateRecord(r), /slug/);
});

test('un champ chaîne vide est rejeté', () => {
  const r = valid(); r.company = '   ';
  assert.throws(() => validateRecord(r), /company/);
});

test('un sous-champ analysis manquant est listé avec son préfixe', () => {
  const r = valid(); delete r.analysis.fit;
  assert.throws(() => validateRecord(r), /analysis\.fit/);
});

test('analysis absent est listé', () => {
  const r = valid(); delete r.analysis;
  assert.throws(() => validateRecord(r), /analysis/);
});
