// Registre d'onglets nommés et point HTTP du navigateur, partagés par attach.mjs,
// tab.mjs et cdp.mjs. Un fichier par propriétaire, un targetId par nom d'onglet.
// Ces appels ne passent jamais par connectOverCDP, qui expire dès qu'un onglet
// à iframe tiers est ouvert quelque part dans le navigateur.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PORT = process.env.LINKEDIN_HARNESS_CDP_PORT ?? '9222';
export const CDP = process.env.LINKEDIN_HARNESS_CDP_URL ?? `http://127.0.0.1:${PORT}`;
const REG_DIR = process.env.LINKEDIN_HARNESS_TAB_DIR ?? '/tmp/claude/tabs';

const registryFile = (owner) => join(REG_DIR, `${owner}.json`);

export function readRegistry(owner) {
  try {
    return JSON.parse(readFileSync(registryFile(owner), 'utf8'));
  } catch {
    return {};
  }
}

// Écriture atomique. Pas de verrou, deux commandes du même propriétaire ne
// tournent jamais en parallèle.
export function writeRegistry(owner, registry) {
  mkdirSync(REG_DIR, { recursive: true });
  const file = registryFile(owner);
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(registry, null, 2) + '\n');
  renameSync(tmp, file);
}

// targetId de l'onglet inscrit sous ce nom s'il est encore une page ouverte,
// sinon null. Aucun autre onglet n'est jamais repris, il peut porter le travail
// du candidat.
export function liveTab(registry, name, targets) {
  const id = registry[name];
  return targets.some((t) => t.type === 'page' && t.id === id) ? id : null;
}

// Pages dont l'URL contient le fragment, pour réinscrire un onglet que le
// candidat a rouvert ailleurs.
export function findByUrl(targets, fragment) {
  return targets.filter((t) => t.type === 'page' && t.url.includes(fragment));
}

export async function listTargets() {
  return (await fetch(`${CDP}/json/list`)).json();
}

// Chromium refuse GET sur /json/new, seul PUT crée l'onglet. L'onglet créé est
// activé, il bascule donc l'affichage.
export async function newTab(url = 'about:blank') {
  return (await fetch(`${CDP}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })).json();
}

export async function closeTab(targetId) {
  await fetch(`${CDP}/json/close/${targetId}`);
}

export async function activateTab(targetId) {
  await fetch(`${CDP}/json/activate/${targetId}`);
}
