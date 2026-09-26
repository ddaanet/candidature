import { test } from 'node:test';
import assert from 'node:assert/strict';
import { liveTab } from '../attach.mjs';

const targets = [
  { type: 'page', id: 'AAA', url: 'https://www.linkedin.com/messaging/compose/' },
  { type: 'iframe', id: 'BBB', url: 'https://www.google.com/recaptcha/' },
  { type: 'page', id: 'CCC', url: 'https://www.linkedin.com/jobs/collections/recommended/' },
];

test('un onglet inscrit et vivant est repris', () => {
  assert.equal(liveTab({ flux: 'CCC' }, targets), 'CCC');
});

test('un onglet inscrit mais fermé n\'est pas repris', () => {
  assert.equal(liveTab({ flux: 'DDD' }, targets), null);
});

test('sans inscription, aucun onglet existant n\'est repris', () => {
  assert.equal(liveTab({}, targets), null);
});

test('une cible qui n\'est pas une page n\'est pas reprise', () => {
  assert.equal(liveTab({ flux: 'BBB' }, targets), null);
});
