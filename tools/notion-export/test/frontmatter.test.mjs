import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toFrontmatter } from '../lib/frontmatter.mjs';

test('rend les clés non nulles, ignore les nulles', () => {
  const fm = toFrontmatter({ entreprise: 'Mirakl', poste: 'Senior AI', statut: 'refus', date_reponse: null });
  assert.equal(fm, '---\nentreprise: Mirakl\nposte: Senior AI\nstatut: refus\n---\n');
});

test('met des guillemets quand la valeur contient deux-points', () => {
  const fm = toFrontmatter({ titre: 'a: b' });
  assert.equal(fm, '---\ntitre: "a: b"\n---\n');
});
