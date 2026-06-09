// CLI du parcours. Sous-commandes start, decide, status. L'agent appelle, lit
// le JSON rendu, décide, rappelle. Le flux de contrôle vit ici, pas dans l'agent.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { attach } from './attach.mjs';
import {
  initState, setCurrent, addShortlist, addDismiss, addSeen, targetMet, loadState, saveState,
} from './lib/state.mjs';
import { loadRecord } from './lib/record.mjs';
import { loadToken, createShortlistPage } from './lib/notion.mjs';
import { gotoStream, readFocusedCard, dismissCard, advance } from './lib/stream-page.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const STATE_PATH = join(HERE, 'tmp', 'run.json');

function flag(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

function out(obj) {
  console.log(JSON.stringify(obj, null, 2));
}

async function readAndStore(page, state) {
  const card = await readFocusedCard(page);
  const next = addSeen(setCurrent(state, card), card.jobId);
  saveState(STATE_PATH, next);
  return { card, progress: { accepted: next.accepted.length, target: next.target, dismissed: next.dismissed } };
}

async function cmdStart() {
  const stream = flag('stream', 'recommended');
  const target = Number(flag('target', '3'));
  const root = flag('root');
  if (!root) throw new Error('Passer --root <pageId> de la racine Notion.');
  const { browser, page } = await attach();
  try {
    if (!(await gotoStream(page, stream))) {
      out({ blocked: 'login', message: 'Session non connectée. Se connecter à la main, puis relancer.' });
      return;
    }
    await page.waitForTimeout(1500);
    const state = initState({ stream, target, root, startedAt: new Date().toISOString() });
    out(await readAndStore(page, state));
  } finally {
    await browser.close();
  }
}

async function cmdDecide() {
  const action = flag('action');
  const state = loadState(STATE_PATH);
  if (action === 'stop') {
    out({ done: true, reason: 'stop', summary: { stream: state.stream, accepted: state.accepted, dismissed: state.dismissed } });
    return;
  }
  const { browser, page } = await attach();
  try {
    if (action === 'reject') {
      await dismissCard(page, state.current.title);
      const after = addDismiss(state);
      const adv = await advance(page, state.stream, after.seen);
      if (adv.done) { saveState(STATE_PATH, after); out({ done: true, reason: adv.reason, progress: { accepted: after.accepted.length, target: after.target, dismissed: after.dismissed } }); return; }
      out(await readAndStore(page, after));
      return;
    }
    if (action === 'shortlist') {
      const record = loadRecord(flag('record'));
      const dateStr = new Date().toISOString().slice(0, 10);
      const created = await createShortlistPage(record, { rootId: state.root, token: loadToken(), dateStr });
      let after = addShortlist(state, { jobId: state.current?.jobId ?? null, title: record.title, url: record.url, summary: record.summary, notionPageId: created.pageId });
      if (targetMet(after)) { saveState(STATE_PATH, after); out({ done: true, reason: 'target-met', created, progress: { accepted: after.accepted.length, target: after.target, dismissed: after.dismissed } }); return; }
      const adv = await advance(page, state.stream, after.seen);
      if (adv.done) { saveState(STATE_PATH, after); out({ done: true, reason: adv.reason, created, progress: { accepted: after.accepted.length, target: after.target, dismissed: after.dismissed } }); return; }
      out({ created, ...(await readAndStore(page, after)) });
      return;
    }
    throw new Error(`Action inconnue : ${action}. Attendu reject, shortlist ou stop.`);
  } finally {
    await browser.close();
  }
}

function cmdStatus() {
  out(loadState(STATE_PATH));
}

const cmd = process.argv[2];
const run = { start: cmdStart, decide: cmdDecide, status: cmdStatus }[cmd];
if (!run) {
  console.error('Usage : walk.mjs <start|decide|status> [options]');
  process.exit(1);
}
await run();
