// Identifie les flux d'offres sur /jobs/ par l'arbre d'accessibilite.
// Aucune hypothese sur les classes CSS : roles et noms accessibles seulement.
import { attach, isAuthenticated } from './attach.mjs';

const { browser, page } = await attach();

await page.goto('https://www.linkedin.com/jobs/', {
  waitUntil: 'domcontentloaded',
  timeout: 45_000,
});
await page.waitForLoadState('networkidle').catch(() => {});

if (!isAuthenticated(page.url())) {
  console.log('Session non connectee. Se connecter a la main dans la fenetre, puis relancer.');
  await browser.close();
  process.exit(0);
}

// Les sections se chargent au defilement. Plusieurs nudges avant de lire.
for (let i = 0; i < 5; i++) {
  await page.mouse.wheel(0, 2200);
  await page.waitForTimeout(700);
}
await page.waitForTimeout(800);

const root = (await page.getByRole('main').count())
  ? page.getByRole('main')
  : page.locator('body');

// Sections = titres de niveau 2 dans le repere principal.
const headings = [];
for (const h of await root.getByRole('heading', { level: 2 }).all()) {
  const name = ((await h.textContent().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
  if (name) headings.push(name);
}

// Collections = slugs lus dans les href /jobs/collections/<slug>/.
const hrefs = await root
  .getByRole('link')
  .evaluateAll((els) => els.map((a) => a.href).filter((h) => /\/jobs\/collections\//.test(h)));
const slugs = [
  ...new Set(
    hrefs.map((h) => (h.match(/\/jobs\/collections\/([^/?]+)/) || [])[1]).filter(Boolean),
  ),
];

console.log('Sections (titres niveau 2) :');
for (const h of headings) console.log('  ' + h);
console.log('\nFlux de collections (slugs) :');
for (const s of slugs) console.log('  ' + s);

await browser.close();
