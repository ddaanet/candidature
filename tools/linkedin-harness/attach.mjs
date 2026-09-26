// Bootstrap partage : se connecte au chromium en tete deja lance via CDP.
// Ne lance pas de navigateur, ne touche jamais aux identifiants.
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PORT = process.env.LINKEDIN_HARNESS_CDP_PORT ?? '9222';
const CDP = process.env.LINKEDIN_HARNESS_CDP_URL ?? `http://127.0.0.1:${PORT}`;

// Registre d'onglets partage avec les outils multi-agents, un fichier par
// proprietaire. Le harnais y inscrit son onglet sous le nom flux.
const REG_DIR = process.env.LINKEDIN_HARNESS_TAB_DIR ?? '/tmp/claude/tabs';
const REG_FILE = join(REG_DIR, 'linkedin-harness.json');
const TAB = 'flux';

// targetId de l'onglet inscrit s'il est encore une page ouverte, sinon null.
// Aucun autre onglet n'est jamais repris, il peut porter le travail du candidat.
export function liveTab(registry, targets) {
  const id = registry[TAB];
  return targets.some((t) => t.type === 'page' && t.id === id) ? id : null;
}

function readRegistry() {
  try {
    return JSON.parse(readFileSync(REG_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeRegistry(registry) {
  mkdirSync(REG_DIR, { recursive: true });
  const tmp = `${REG_FILE}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(registry, null, 2) + '\n');
  renameSync(tmp, REG_FILE);
}

// Onglet propre au harnais. Repris s'il vit encore, sinon cree par le point
// HTTP du navigateur et inscrit au registre.
async function ownTab() {
  const registry = readRegistry();
  const targets = await (await fetch(`${CDP}/json/list`)).json();
  const alive = liveTab(registry, targets);
  if (alive) return alive;
  const created = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
  writeRegistry({ ...registry, [TAB]: created.id });
  return created.id;
}

async function pageOf(ctx, targetId) {
  for (const page of ctx.pages()) {
    const session = await ctx.newCDPSession(page);
    const { targetInfo } = await session.send('Target.getTargetInfo');
    await session.detach();
    if (targetInfo.targetId === targetId) return page;
  }
  throw new Error(`Onglet du harnais ${targetId} introuvable apres attache.`);
}

// Attache Playwright a la session ouverte, sur l'onglet propre au harnais mis
// au premier plan. Retourne le navigateur, le contexte authentifie et la page.
export async function attach() {
  const targetId = await ownTab();
  const browser = await chromium.connectOverCDP(CDP);
  const ctx = browser.contexts()[0];
  const page = await pageOf(ctx, targetId);
  await page.bringToFront();
  return { browser, ctx, page };
}

// Vrai si l'URL n'est pas une page de connexion ou de controle LinkedIn.
export function isAuthenticated(url) {
  return !/\/(login|checkpoint|authwall|signup)/.test(url);
}
