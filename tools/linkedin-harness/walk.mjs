// CLI du parcours. Sous-commandes start, decide, status, dismiss. L'agent
// appelle, lit le JSON rendu, décide, rappelle. Le flux de contrôle vit ici,
// pas dans l'agent. dismiss écarte une carte par jobId hors d'un parcours.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { attach } from './attach.mjs';
import {
  initState, setCurrent, addShortlist, addDismiss, addSeen, targetMet, loadState, saveState,
} from './lib/state.mjs';
import { loadRecord } from './lib/record.mjs';
import { createShortlistDossier } from './lib/dossier.mjs';
import { gotoStream, readFocusedCard, dismissCard, advance, listCards } from './lib/stream-page.mjs';

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
  if (!root) throw new Error('Passer --root <chemin> du dépôt de candidatures.');
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
      const created = createShortlistDossier(record, { root: state.root, dateStr, jobId: state.current?.jobId ?? null });
      let after = addShortlist(state, { jobId: state.current?.jobId ?? null, title: record.title, url: record.url, summary: record.summary, dossierPath: created.path });
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

// Écarte une carte par jobId hors parcours. Réutilise les helpers du harnais,
// nav robuste, résolution jobId vers carte, lecture du titre, clic Dismiss. Pas
// de fichier d'état, l'opération est indépendante d'un parcours en cours.
async function cmdDismiss() {
  const jobId = flag('jobId');
  const stream = flag('stream', 'recommended');
  if (!jobId) throw new Error('Passer --jobId <id> de la carte à écarter.');
  const { browser, page } = await attach();
  try {
    if (!(await gotoStream(page, stream))) {
      out({ blocked: 'login', message: 'Session non connectée. Se connecter à la main, puis relancer.' });
      return;
    }
    const card = (await listCards(page)).find((c) => c.jobId === String(jobId));
    if (!card) {
      out({ done: true, dismissed: false, reason: 'not-found', jobId: String(jobId), stream, message: `Carte ${jobId} absente du flux ${stream}. Déjà écartée ou hors flux.` });
      return;
    }
    await card.link.click();
    await page.waitForTimeout(900);
    const focused = await readFocusedCard(page);
    await dismissCard(page, focused.title);
    out({ done: true, dismissed: true, jobId: String(jobId), title: focused.title, stream });
  } finally {
    await browser.close();
  }
}

const cmd = process.argv[2];
const run = { start: cmdStart, decide: cmdDecide, status: cmdStatus, dismiss: cmdDismiss }[cmd];
if (!run) {
  console.error('Usage : walk.mjs <start|decide|status|dismiss> [options]');
  process.exit(1);
}
await run();
