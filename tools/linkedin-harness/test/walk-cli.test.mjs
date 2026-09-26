import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const WALK = join(dirname(fileURLToPath(import.meta.url)), '..', 'walk.mjs');

// Le CDP pointe sur un port fermé : un appel qui atteindrait le navigateur
// échouerait sur ECONNREFUSED au lieu du refus d'arguments attendu.
const run = (...args) => spawnSync(process.execPath, [WALK, ...args], {
  encoding: 'utf8',
  env: { ...process.env, LINKEDIN_HARNESS_CDP_URL: 'http://127.0.0.1:1' },
});

test('shortlist sans --record est refusé avant tout effet', () => {
  const r = run('decide', '--action', 'shortlist');
  assert.equal(r.status, 2);
  assert.match(r.stderr, /--record/);
  assert.doesNotMatch(r.stderr, /TypeError|ECONNREFUSED/);
});

test('une action inconnue est refusée avant tout effet', () => {
  const r = run('decide', '--action', 'accept');
  assert.equal(r.status, 2);
  assert.match(r.stderr, /accept/);
  assert.doesNotMatch(r.stderr, /ECONNREFUSED/);
});
