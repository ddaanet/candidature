import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  initState, setCurrent, addShortlist, addDismiss, addSeen, targetMet, loadState, saveState,
} from '../lib/state.mjs';

const base = () => initState({ stream: 'recommended', target: 3, root: 'root1', startedAt: '2026-06-09T00:00:00Z' });

test('initState pose la forme de départ', () => {
  const s = base();
  assert.deepEqual(s, {
    stream: 'recommended', target: 3, root: 'root1', startedAt: '2026-06-09T00:00:00Z',
    dismissed: 0, accepted: [], seen: [], current: null,
  });
});

test('addSeen ajoute le jobId sans doublon ni mutation', () => {
  const s = base();
  const s2 = addSeen(s, '111');
  assert.deepEqual(s.seen, []);
  assert.deepEqual(s2.seen, ['111']);
  assert.equal(addSeen(s2, '111'), s2);
  assert.deepEqual(addSeen(s2, '222').seen, ['111', '222']);
  assert.equal(addSeen(s, null), s);
});

test('setCurrent ne mute pas l’entrée', () => {
  const s = base();
  const s2 = setCurrent(s, { title: 'A' });
  assert.equal(s.current, null);
  assert.deepEqual(s2.current, { title: 'A' });
});

test('addShortlist ajoute sans muter', () => {
  const s = base();
  const s2 = addShortlist(s, { title: 'A', notionPageId: 'p1' });
  assert.equal(s.accepted.length, 0);
  assert.equal(s2.accepted.length, 1);
  assert.equal(s2.accepted[0].notionPageId, 'p1');
});

test('addDismiss incrémente', () => {
  assert.equal(addDismiss(base()).dismissed, 1);
});

test('targetMet vrai quand accepted atteint la cible', () => {
  let s = base();
  assert.equal(targetMet(s), false);
  s = addShortlist(addShortlist(addShortlist(s, {}), {}), {});
  assert.equal(targetMet(s), true);
});

test('saveState puis loadState rend le même état', () => {
  const dir = mkdtempSync(join(tmpdir(), 'walk-state-'));
  const path = join(dir, 'run.json');
  const s = addShortlist(base(), { title: 'A', notionPageId: 'p1' });
  saveState(path, s);
  assert.deepEqual(loadState(path), s);
  rmSync(dir, { recursive: true, force: true });
});

test('loadState sur chemin absent jette un message clair', () => {
  assert.throws(() => loadState('/non/existant/run.json'), /Lancer d'abord walk.mjs start/);
});
