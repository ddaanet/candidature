#!/usr/bin/env node
// Onglets nommés par propriétaire sur le chromium du harnais. Plusieurs agents
// pilotent le même navigateur sans se marcher dessus, chacun dans ses onglets.
// open, adopt, list, show et close passent par le point HTTP du navigateur.
// goto, text, links et eval attachent Playwright, qui expire dès qu'un onglet à
// iframe tiers est ouvert. cdp.mjs prend alors le relais sur la page seule.
import { chromium } from 'playwright-core';
import {
  CDP, readRegistry, writeRegistry, liveTab, findByUrl,
  listTargets, newTab, closeTab, activateTab,
} from './lib/tabs.mjs';
import { connectTarget } from './lib/cdp-client.mjs';

const SETTLE_MS = Number(process.env.TAB_SETTLE_MS ?? 2500);

const HELP = `tab.mjs, onglets nommés, un jeu par propriétaire, sur le chromium CDP ${CDP}

Usage : node tab.mjs --owner <proprio> [--tab <nom>] <commande> [args]

Options globales
  --owner <proprio>   obligatoire, isole votre registre des autres agents
  --tab <nom>         nom de l'onglet (défaut : navette)
  --help              cette aide

Commandes
  open [url]          crée l'onglet nommé par /json/new, ou le reprend s'il vit, navigue si url donnée
  adopt <fragment>    inscrit sous ce nom la page vivante dont l'URL contient le fragment
  goto <url>          navigue dans l'onglet nommé, affiche titre et URL finale
  text [sélecteur]    innerText du sélecteur, sinon de <main>, sinon de <body>
  links [filtre]      liens (texte + href), filtrés par sous-chaîne optionnelle
  eval <js>           évalue une expression dans la page, résultat en JSON
  show                met l'onglet au premier plan
  list                onglets du propriétaire : vivant ou mort, titre, URL
  close               ferme l'onglet nommé (refusé si c'est le dernier du navigateur)

Exemples
  node tab.mjs --owner wwr --tab listing open https://weworkremotely.com/
  node tab.mjs --owner wwr --tab listing links /remote-jobs/
  node tab.mjs --owner wwr --tab listing close
`;

function parseArgs(argv) {
  const out = { owner: null, tab: 'navette', help: false, rest: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--owner') out.owner = argv[++i];
    else if (a === '--tab') out.tab = argv[++i];
    else if (a.startsWith('--owner=')) out.owner = a.slice(8);
    else if (a.startsWith('--tab=')) out.tab = a.slice(6);
    else out.rest.push(a);
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
if (args.help || args.rest.length === 0) {
  console.log(HELP);
  process.exit(args.help ? 0 : 2);
}
if (!args.owner) {
  console.error('erreur : --owner est obligatoire (voir --help)');
  process.exit(2);
}
if (!/^[A-Za-z0-9._-]+$/.test(args.owner) || !/^[A-Za-z0-9._-]+$/.test(args.tab)) {
  console.error('erreur : --owner et --tab doivent être alphanumériques (. _ - autorisés)');
  process.exit(2);
}

const cmd = args.rest[0];
const cmdArgs = args.rest.slice(1);
let exitCode = 0;

function fail(message, code) {
  console.error(`erreur : ${message}`);
  exitCode = code;
}

const settle = () => new Promise((r) => setTimeout(r, SETTLE_MS));

// ---------- commandes par le point HTTP ----------

async function open() {
  const url = cmdArgs[0];
  const registry = readRegistry(args.owner);
  let targets = await listTargets();
  let id = liveTab(registry, args.tab, targets);
  const created = !id;
  if (created) {
    id = (await newTab(url)).id;
    writeRegistry(args.owner, { ...registry, [args.tab]: id });
  } else if (url) {
    const target = targets.find((t) => t.id === id);
    const client = await connectTarget(target.webSocketDebuggerUrl);
    try {
      await client.send('Page.navigate', { url });
    } finally {
      client.close();
    }
  }
  console.log(`${created ? 'créé' : 'réutilisé'} : ${args.owner}/${args.tab} = ${id}`);
  if (url) {
    await settle();
    targets = await listTargets();
    const target = targets.find((t) => t.id === id);
    if (target) console.log(`${target.title}\n${target.url}`);
  }
}

async function adopt() {
  const fragment = cmdArgs[0];
  if (!fragment) return fail('usage : adopt <fragment d\'URL>', 2);
  const found = findByUrl(await listTargets(), fragment);
  if (found.length !== 1) {
    const detail = found.map((t) => `\n  ${t.id}\t${t.url}`).join('');
    return fail(`${found.length} page(s) portent « ${fragment} », il en faut une seule.${detail}`, 3);
  }
  const registry = readRegistry(args.owner);
  writeRegistry(args.owner, { ...registry, [args.tab]: found[0].id });
  console.log(`inscrit : ${args.owner}/${args.tab} = ${found[0].id}\n${found[0].title}\n${found[0].url}`);
}

async function list() {
  const registry = readRegistry(args.owner);
  const names = Object.keys(registry).sort();
  if (names.length === 0) {
    console.log(`(aucun onglet enregistré pour « ${args.owner} »)`);
    return;
  }
  const targets = await listTargets();
  for (const name of names) {
    const id = registry[name];
    const target = targets.find((t) => t.type === 'page' && t.id === id);
    if (!target) console.log(`${name}\t[mort]\t${id}`);
    else console.log(`${name}\t[vivant]\t${id}\n\t${target.title}\n\t${target.url}`);
  }
}

// Onglet nommé et vivant, sinon code 3. Seuls open et adopt réinscrivent.
async function registered() {
  const registry = readRegistry(args.owner);
  const targets = await listTargets();
  const id = liveTab(registry, args.tab, targets);
  if (id) return { id, targets };
  if (!registry[args.tab]) fail(`aucun onglet « ${args.tab} » pour le propriétaire « ${args.owner} ». Utilisez : open`, 3);
  else fail(`l'onglet « ${args.tab} » (${registry[args.tab]}) n'existe plus. Utilisez : open, ou adopt si la page vit ailleurs`, 3);
  return null;
}

async function show() {
  const at = await registered();
  if (!at) return;
  await activateTab(at.id);
  console.log(`au premier plan : ${args.owner}/${args.tab}`);
}

async function close() {
  const at = await registered();
  if (!at) return;
  if (at.targets.filter((t) => t.type === 'page').length <= 1) {
    return fail('refus de fermer le dernier onglet du navigateur (cela arrêterait chromium)', 6);
  }
  await closeTab(at.id);
  const registry = readRegistry(args.owner);
  delete registry[args.tab];
  writeRegistry(args.owner, registry);
  console.log(`fermé : ${args.owner}/${args.tab} (${at.id})`);
}

// ---------- commandes par Playwright ----------

async function targetIdOf(page) {
  let session;
  try {
    session = await page.context().newCDPSession(page);
    const info = await session.send('Target.getTargetInfo');
    return info.targetInfo.targetId;
  } catch {
    return null;
  } finally {
    if (session) await session.detach().catch(() => {});
  }
}

async function withPage(fn) {
  const at = await registered();
  if (!at) return;
  const browser = await chromium.connectOverCDP(CDP);
  try {
    const pages = browser.contexts().flatMap((c) => c.pages());
    const ids = await Promise.all(pages.map(targetIdOf));
    const page = pages[ids.indexOf(at.id)];
    if (!page) return fail(`onglet ${at.id} introuvable après attache`, 3);
    await fn(page);
  } finally {
    await browser.close().catch(() => {});
  }
}

async function goto() {
  const url = cmdArgs[0];
  if (!url) return fail('usage : goto <url>', 2);
  await withPage(async (page) => {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await settle();
    console.log(`TITRE: ${await page.title()}`);
    console.log(`URL: ${page.url()}`);
  });
}

async function text() {
  const sel = cmdArgs[0] || null;
  await withPage(async (page) => {
    const txt = await page.evaluate((s) => {
      const el = s ? document.querySelector(s) : (document.querySelector('main') || document.body);
      return el ? el.innerText : null;
    }, sel);
    if (txt === null) return fail(`sélecteur introuvable : ${sel}`, 5);
    console.log(txt);
  });
}

async function links() {
  const filtre = (cmdArgs[0] || '').toLowerCase();
  await withPage(async (page) => {
    const all = await page.evaluate(() =>
      [...document.querySelectorAll('a')].map((a) => ({
        t: (a.innerText || '').replace(/\s+/g, ' ').trim(),
        h: a.href,
      })));
    let n = 0;
    for (const l of all) {
      if (!l.h) continue;
      if (filtre && !(l.h.toLowerCase().includes(filtre) || l.t.toLowerCase().includes(filtre))) continue;
      console.log(`${l.t || '(sans texte)'}\n  -> ${l.h}`);
      n++;
    }
    console.log(`(${n} lien(s))`);
  });
}

async function evaluate() {
  const js = cmdArgs.join(' ');
  if (!js) return fail('usage : eval <expression js>', 2);
  await withPage(async (page) => {
    console.log(JSON.stringify(await page.evaluate(js), null, 2));
  });
}

const commands = { open, adopt, list, show, close, goto, text, links, eval: evaluate };

try {
  const run = commands[cmd];
  if (!run) fail(`commande inconnue : ${cmd} (voir --help)`, 2);
  else await run();
} catch (e) {
  fail(e && e.message ? e.message : e, 1);
}
process.exit(exitCode);
