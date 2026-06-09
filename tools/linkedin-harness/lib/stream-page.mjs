// Actions Playwright sur la page d'un flux d'offres. Navigation par l'arbre
// d'accessibilité, jamais par les classes CSS. Sélecteurs vérifiés par la sonde.
import { isAuthenticated } from '../attach.mjs';

const streamUrl = (slug) => `https://www.linkedin.com/jobs/collections/${slug}/`;

// Bannière de consentement aux cookies. Boutons globaux Accept et Reject, hors
// du repère principal. On refuse, choix respectueux, et la bannière disparaît.
export async function dismissConsent(page) {
  const reject = page.getByRole('button', { name: /^reject$/i });
  if (await reject.count()) {
    await reject.first().click().catch(() => {});
    await page.waitForTimeout(800);
  }
}

export async function gotoStream(page, slug) {
  await page.goto(streamUrl(slug), { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForLoadState('networkidle').catch(() => {});
  await dismissConsent(page);
  return isAuthenticated(page.url());
}

// Carte au focus = item de liste sélectionné dans le repère principal. Lit le
// titre depuis la carte, le détail depuis le panneau de droite.
export async function readFocusedCard(page) {
  const main = page.getByRole('main');
  const detail = main.getByRole('heading', { level: 1 });
  const title = ((await detail.first().textContent().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
  const url = page.url();
  const jobId = (url.match(/currentJobId=(\d+)/) || [])[1] ?? null;
  const snap = await main.ariaSnapshot().catch(() => '');
  return { jobId, title, url, snapshot: snap };
}

export async function dismissCard(page, title) {
  await page.getByRole('button', { name: `Dismiss ${title}` }).first().click();
  await page.waitForTimeout(600);
}

// Avance à la carte suivante. Si la liste est épuisée, page suivante, sinon
// rechargement pour réalimenter la première page après des Dismiss.
export async function advance(page, slug) {
  const items = page.getByRole('main').getByRole('listitem');
  const count = await items.count();
  if (count > 0) {
    await items.first().click();
    await page.waitForTimeout(800);
    return { done: false };
  }
  const next = page.getByRole('button', { name: /next page/i });
  if (await next.count()) {
    await next.first().click();
    await page.waitForTimeout(1200);
    return { done: false };
  }
  await gotoStream(page, slug);
  if (await page.getByRole('main').getByRole('listitem').count()) return { done: false };
  return { done: true, reason: 'exhausted' };
}
