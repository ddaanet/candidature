// Bootstrap partage : se connecte au chromium en tete deja lance via CDP.
// Ne lance pas de navigateur, ne touche jamais aux identifiants.
import { chromium } from 'playwright-core';

const PORT = process.env.LINKEDIN_HARNESS_CDP_PORT ?? '9222';
const CDP = process.env.LINKEDIN_HARNESS_CDP_URL ?? `http://127.0.0.1:${PORT}`;

// Attache Playwright a la session ouverte. Retourne le navigateur, le contexte
// authentifie et la page de premier plan.
export async function attach() {
  const browser = await chromium.connectOverCDP(CDP);
  const ctx = browser.contexts()[0];
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  await page.bringToFront();
  return { browser, ctx, page };
}

// Vrai si l'URL n'est pas une page de connexion ou de controle LinkedIn.
export function isAuthenticated(url) {
  return !/\/(login|checkpoint|authwall|signup)/.test(url);
}
