// Bootstrap partage : se connecte au chromium en tete deja lance via CDP.
// Ne lance pas de navigateur, ne touche jamais aux identifiants.
import { chromium } from 'playwright-core';
import { CDP, readRegistry, writeRegistry, liveTab, listTargets, newTab } from './lib/tabs.mjs';

// Le harnais inscrit son onglet sous le nom flux, propriétaire linkedin-harness,
// dans le registre partagé avec les outils multi-agents.
const OWNER = 'linkedin-harness';
const TAB = 'flux';

// Onglet propre au harnais. Repris s'il vit encore, sinon cree par le point
// HTTP du navigateur et inscrit au registre.
async function ownTab() {
  const registry = readRegistry(OWNER);
  const alive = liveTab(registry, TAB, await listTargets());
  if (alive) return alive;
  const created = await newTab();
  writeRegistry(OWNER, { ...registry, [TAB]: created.id });
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
