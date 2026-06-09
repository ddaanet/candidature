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

// Le flux est paresseux, il charge les cartes au défilement. On déroule jusqu'à
// stabilisation du nombre de liens avant de lire la liste.
async function loadFeed(page, maxRounds = 10) {
  const links = () => page.getByRole('main').getByRole('list').first().getByRole('link');
  let prev = -1;
  for (let r = 0; r < maxRounds; r++) {
    const n = await links().count();
    if (n === prev) break;
    prev = n;
    await links().last().scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(500);
  }
}

// Cartes du flux, dans l'ordre du DOM, dédupliquées par jobId. Une carte écartée
// reste présente sous un état Undo, son lien porte toujours son jobId.
export async function listCards(page) {
  await loadFeed(page);
  const links = page.getByRole('main').getByRole('list').first().getByRole('link');
  const n = await links.count();
  const cards = [];
  const seen = new Set();
  for (let i = 0; i < n; i++) {
    const href = await links.nth(i).getAttribute('href').catch(() => null);
    const jobId = href && (href.match(/jobs\/view\/(\d+)/) || [])[1];
    if (jobId && !seen.has(jobId)) {
      seen.add(jobId);
      cards.push({ jobId, link: links.nth(i) });
    }
  }
  return cards;
}

// Met au focus la première carte non vue. Le clic sur le lien met à jour le
// panneau de détail dans la même page, sans navigation.
async function focusFirstUnseen(page, seenSet) {
  const next = (await listCards(page)).find((c) => !seenSet.has(c.jobId));
  if (!next) return false;
  await next.link.click();
  await page.waitForTimeout(900);
  return true;
}

// Avance vers la première carte non encore décidée. Page courante d'abord, puis
// page suivante, puis rechargement pour réalimenter le flux après des Dismiss.
export async function advance(page, slug, seen = []) {
  const seenSet = new Set(seen);
  if (await focusFirstUnseen(page, seenSet)) return { done: false };
  const next = page.getByRole('button', { name: /view next page/i });
  if (await next.count()) {
    await next.first().click();
    await page.waitForTimeout(1500);
    if (await focusFirstUnseen(page, seenSet)) return { done: false };
  }
  await gotoStream(page, slug);
  if (await focusFirstUnseen(page, seenSet)) return { done: false };
  return { done: true, reason: 'exhausted' };
}
