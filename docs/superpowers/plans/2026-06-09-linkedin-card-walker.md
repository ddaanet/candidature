# Parcours de cartes LinkedIn, plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire le parcours de cartes LinkedIn du harnais, une boucle qui lit chaque offre d'un flux, laisse l'agent décider shortlist, reject ou stop, écarte par Dismiss, et crée une page candidature Notion par offre retenue, jusqu'à une cible de shortlists.

**Architecture:** Un cœur pur testé unitairement (état de run, validation du dossier de décision, construction des charges Notion) est séparé des adaptateurs d'entrée-sortie vérifiés en réel (client REST Notion, actions Playwright sur la page du flux). Le CLI walk.mjs câble le tout. L'agent est le réducteur sans état, le driver tient l'état dans un fichier de run et exécute les effets.

**Tech Stack:** node 22 modules ESM, node:test pour les tests, playwright-core 1.60 attaché par CDP au chromium persistant, API REST Notion avec jeton d'intégration.

Référence de conception : `docs/superpowers/specs/2026-06-09-linkedin-card-walker-design.md`. Carte des flux et sélecteurs : `tools/linkedin-harness/DESIGN.md`.

---

## Découpage et exécution

Les tâches 1 à 3 sont le cœur pur, test rouge puis vert, sans navigateur ni réseau. Elles forment un seul lot confié à un sous-agent, sans revue par tâche, parce que le code est entièrement spécifié ici et se vérifie par la suite de tests. Les tâches 4 à 6 touchent les systèmes vivants, LinkedIn et Notion, et exigent un humain dans la boucle, lancement du navigateur, connexion à la main, vérification visuelle. Elles se font en ligne dans la session principale, pas en sous-agent. La tâche 7, la documentation, dépend du résultat de la tâche 6 et se fait en ligne.

---

## Structure de fichiers

Tout sous `tools/linkedin-harness/`.

- `lib/state.mjs`, créé. État de run, fonctions pures de réduction plus lecture et écriture du fichier de run. Une responsabilité, la forme et les transitions de l'état.
- `lib/record.mjs`, créé. Chargement et validation du dossier de décision JSON de shortlist.
- `lib/notion.mjs`, créé. Chargement du jeton, construction pure des charges Notion, et écriture REST (création de page, ajout du paragraphe d'index).
- `lib/stream-page.mjs`, créé. Actions Playwright sur la page d'un flux, navigation, lecture de la carte au focus, Dismiss, avance. Vérifié en réel.
- `walk.mjs`, créé. CLI, analyse des sous-commandes, câblage état plus page plus Notion, sortie JSON.
- `test/state.test.mjs`, `test/record.test.mjs`, `test/notion.test.mjs`, créés. Tests unitaires du cœur pur et des appels Notion avec fetch simulé.
- `package.json`, modifié. Scripts `test` et `walk`.
- `README.md`, `DESIGN.md`, modifiés. Usage du parcours et statut de FR-3.

Les actions Playwright de `stream-page.mjs` ne sont pas testables sans session vivante. Elles sont implémentées contre la structure réelle observée par la sonde, puis vérifiées à la main. Le reste suit le cycle test rouge puis vert.

---

## Task 1: Module d'état, réductions pures et fichier de run

Cœur pur. Les fonctions de réduction et la persistance du fichier de run vivent dans un même module et se testent ensemble, rouge puis vert. Pas de cycle factice, le module et ses tests arrivent d'un bloc.

**Files:**
- Modify: `tools/linkedin-harness/package.json`
- Create: `tools/linkedin-harness/lib/state.mjs`
- Test: `tools/linkedin-harness/test/state.test.mjs`

- [ ] **Step 1: Ajouter les scripts npm**

Dans `tools/linkedin-harness/package.json`, remplacer le bloc `"scripts"` :

```json
  "scripts": {
    "streams": "node streams.mjs",
    "walk": "node walk.mjs",
    "test": "node --test test/"
  },
```

- [ ] **Step 2: Écrire le test, réductions pures et aller-retour fichier**

Créer `tools/linkedin-harness/test/state.test.mjs` :

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  initState, setCurrent, addShortlist, addDismiss, targetMet, loadState, saveState,
} from '../lib/state.mjs';

const base = () => initState({ stream: 'recommended', target: 3, root: 'root1', startedAt: '2026-06-09T00:00:00Z' });

test('initState pose la forme de départ', () => {
  const s = base();
  assert.deepEqual(s, {
    stream: 'recommended', target: 3, root: 'root1', startedAt: '2026-06-09T00:00:00Z',
    dismissed: 0, accepted: [], current: null,
  });
});

test('setCurrent ne mute pas l’entrée', () => {
  const s = base();
  const s2 = setCurrent(s, { title: 'A' });
  assert.equal(s.current, null);
  assert.deepEqual(s2.current, { title: 'A' });
});

test('addShortlist ajoute sans muter', () => {
  const s = base();
  const s2 = addShortlist(s, { title: 'A', notionPageId: 'p1' });
  assert.equal(s.accepted.length, 0);
  assert.equal(s2.accepted.length, 1);
  assert.equal(s2.accepted[0].notionPageId, 'p1');
});

test('addDismiss incrémente', () => {
  assert.equal(addDismiss(base()).dismissed, 1);
});

test('targetMet vrai quand accepted atteint la cible', () => {
  let s = base();
  assert.equal(targetMet(s), false);
  s = addShortlist(addShortlist(addShortlist(s, {}), {}), {});
  assert.equal(targetMet(s), true);
});

test('saveState puis loadState rend le même état', () => {
  const dir = mkdtempSync(join(tmpdir(), 'walk-state-'));
  const path = join(dir, 'run.json');
  const s = addShortlist(base(), { title: 'A', notionPageId: 'p1' });
  saveState(path, s);
  assert.deepEqual(loadState(path), s);
  rmSync(dir, { recursive: true, force: true });
});

test('loadState sur chemin absent jette un message clair', () => {
  assert.throws(() => loadState('/non/existant/run.json'), /Lancer d'abord walk.mjs start/);
});
```

- [ ] **Step 3: Lancer le test, vérifier l'échec**

Run: `node --test tools/linkedin-harness/test/state.test.mjs`
Expected: FAIL, `Cannot find module '../lib/state.mjs'`.

- [ ] **Step 4: Écrire le module d'état**

Créer `tools/linkedin-harness/lib/state.mjs` :

```js
// État de run du parcours. Fonctions pures de réduction, plus lecture et
// écriture du fichier de run. L'agent ne retient rien, l'état vit ici.
import { readFileSync, writeFileSync } from 'node:fs';

export function initState({ stream, target, root, startedAt }) {
  return { stream, target, root, startedAt, dismissed: 0, accepted: [], current: null };
}

export function setCurrent(state, card) {
  return { ...state, current: card };
}

export function addShortlist(state, entry) {
  return { ...state, accepted: [...state.accepted, entry] };
}

export function addDismiss(state) {
  return { ...state, dismissed: state.dismissed + 1 };
}

export function targetMet(state) {
  return state.accepted.length >= state.target;
}

export function loadState(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    throw new Error(`État de run introuvable à ${path}. Lancer d'abord walk.mjs start. (${e.message})`);
  }
}

export function saveState(path, state) {
  writeFileSync(path, JSON.stringify(state, null, 2));
}
```

- [ ] **Step 5: Lancer le test, vérifier le succès**

Run: `node --test tools/linkedin-harness/test/state.test.mjs`
Expected: PASS, 7 tests.

- [ ] **Step 6: Commit**

```bash
git add tools/linkedin-harness/package.json tools/linkedin-harness/lib/state.mjs tools/linkedin-harness/test/state.test.mjs
git commit -m "✨ parcours LinkedIn : état de run, réductions pures et fichier de run"
```

---

## Task 2: Validation du dossier de décision

**Files:**
- Create: `tools/linkedin-harness/lib/record.mjs`
- Test: `tools/linkedin-harness/test/record.test.mjs`

- [ ] **Step 1: Écrire le test de validation**

Créer `tools/linkedin-harness/test/record.test.mjs` :

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRecord } from '../lib/record.mjs';

const valid = () => ({
  title: 'Ornikar — Data Software Engineer',
  company: 'Ornikar', role: 'Data Software Engineer',
  location: 'Paris', workplace: 'hybrid',
  url: 'https://www.linkedin.com/jobs/view/123',
  summary: 'Data Software Engineer, Python, Paris hybrid. Via LinkedIn.',
  analysis: { fit: 'forte correspondance Python', company: 'mission édutech', differentiation: 'profil agentic' },
});

test('un dossier complet passe et est rendu', () => {
  const r = valid();
  assert.equal(validateRecord(r), r);
});

test('un champ chaîne manquant est listé', () => {
  const r = valid(); delete r.summary;
  assert.throws(() => validateRecord(r), /summary/);
});

test('un champ chaîne vide est rejeté', () => {
  const r = valid(); r.company = '   ';
  assert.throws(() => validateRecord(r), /company/);
});

test('un sous-champ analysis manquant est listé avec son préfixe', () => {
  const r = valid(); delete r.analysis.fit;
  assert.throws(() => validateRecord(r), /analysis\.fit/);
});

test('analysis absent est listé', () => {
  const r = valid(); delete r.analysis;
  assert.throws(() => validateRecord(r), /analysis/);
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `node --test tools/linkedin-harness/test/record.test.mjs`
Expected: FAIL, `Cannot find module '../lib/record.mjs'`.

- [ ] **Step 3: Écrire le module de dossier**

Créer `tools/linkedin-harness/lib/record.mjs` :

```js
// Dossier de décision de shortlist. JSON écrit par l'agent, lu par le driver.
// Validation stricte, les champs manquants sont listés ensemble.
import { readFileSync } from 'node:fs';

const REQUIRED_STRINGS = ['title', 'company', 'role', 'location', 'workplace', 'url', 'summary'];
const REQUIRED_ANALYSIS = ['fit', 'company', 'differentiation'];

export function validateRecord(obj) {
  const missing = [];
  for (const k of REQUIRED_STRINGS) {
    if (typeof obj?.[k] !== 'string' || obj[k].trim() === '') missing.push(k);
  }
  if (typeof obj?.analysis !== 'object' || obj.analysis === null) {
    missing.push('analysis');
  } else {
    for (const k of REQUIRED_ANALYSIS) {
      if (typeof obj.analysis[k] !== 'string' || obj.analysis[k].trim() === '') {
        missing.push(`analysis.${k}`);
      }
    }
  }
  if (missing.length) {
    throw new Error(`Dossier de décision invalide, champs manquants ou vides : ${missing.join(', ')}`);
  }
  return obj;
}

export function loadRecord(path) {
  return validateRecord(JSON.parse(readFileSync(path, 'utf8')));
}
```

- [ ] **Step 4: Lancer le test, vérifier le succès**

Run: `node --test tools/linkedin-harness/test/record.test.mjs`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add tools/linkedin-harness/lib/record.mjs tools/linkedin-harness/test/record.test.mjs
git commit -m "✨ parcours LinkedIn : validation du dossier de décision"
```

---

## Task 3: Client Notion, charges pures, jeton et écriture REST

Un seul module, `lib/notion.mjs`, construit en trois cycles rouge puis vert, les constructeurs purs puis le chargement du jeton puis l'écriture REST avec fetch simulé. Trois commits, un par couche, pour garder un historique lisible.

**Files:**
- Create: `tools/linkedin-harness/lib/notion.mjs`
- Test: `tools/linkedin-harness/test/notion.test.mjs`

- [ ] **Step 1: Écrire le test des constructeurs purs**

Créer `tools/linkedin-harness/test/notion.test.mjs` :

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPagePayload, buildIndexParagraph } from '../lib/notion.mjs';

const record = {
  title: 'Ornikar — Data Software Engineer',
  company: 'Ornikar', role: 'Data Software Engineer',
  location: 'Paris', workplace: 'hybrid',
  url: 'https://www.linkedin.com/jobs/view/123',
  summary: 'Data Software Engineer, Python, Paris hybrid. Via LinkedIn.',
  analysis: { fit: 'forte correspondance Python', company: 'mission édutech', differentiation: 'profil agentic' },
};

test('buildPagePayload pose le parent et le titre', () => {
  const p = buildPagePayload('root1', record);
  assert.equal(p.parent.page_id, 'root1');
  assert.equal(p.properties.title.title[0].text.content, record.title);
});

test('buildPagePayload rend trois sections d’analyse', () => {
  const p = buildPagePayload('root1', record);
  const headings = p.children.filter((b) => b.type === 'heading_2').map((b) => b.heading_2.rich_text[0].text.content);
  assert.equal(headings.length, 3);
  const bodies = p.children.filter((b) => b.type === 'paragraph').map((b) => b.paragraph.rich_text[0].text.content);
  assert.ok(bodies.some((t) => t.includes('forte correspondance Python')));
  assert.ok(bodies.some((t) => t.includes('Ornikar') && t.includes(record.url)));
});

test('buildIndexParagraph préfixe la date', () => {
  const b = buildIndexParagraph(record, '2026-06-09');
  assert.equal(b.type, 'paragraph');
  assert.equal(b.paragraph.rich_text[0].text.content, '2026-06-09. Data Software Engineer, Python, Paris hybrid. Via LinkedIn.');
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `node --test tools/linkedin-harness/test/notion.test.mjs`
Expected: FAIL, `Cannot find module '../lib/notion.mjs'`.

- [ ] **Step 3: Écrire les constructeurs purs**

Créer `tools/linkedin-harness/lib/notion.mjs` :

```js
// Client Notion du parcours. Constructeurs purs des charges, plus écriture REST
// par jeton d'intégration. Aucun passage par le MCP.
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';
const TOKEN_FILE = join(homedir(), '.config', 'candidature', 'notion.env');

function textBlock(type, content) {
  return { object: 'block', type, [type]: { rich_text: [{ type: 'text', text: { content } }] } };
}

export function buildPagePayload(rootId, record) {
  const meta = `Entreprise : ${record.company}. Poste : ${record.role}. Lieu : ${record.location} (${record.workplace}). Offre : ${record.url}`;
  const section = (heading, body) => [textBlock('heading_2', heading), textBlock('paragraph', body)];
  return {
    parent: { page_id: rootId },
    properties: { title: { title: [{ type: 'text', text: { content: record.title } }] } },
    children: [
      textBlock('paragraph', meta),
      ...section('Adéquation et écarts', record.analysis.fit),
      ...section('Motivation pour l’entreprise', record.analysis.company),
      ...section('Différenciation', record.analysis.differentiation),
    ],
  };
}

export function buildIndexParagraph(record, dateStr) {
  return textBlock('paragraph', `${dateStr}. ${record.summary}`);
}
```

- [ ] **Step 4: Lancer le test, vérifier le succès**

Run: `node --test tools/linkedin-harness/test/notion.test.mjs`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit des constructeurs**

```bash
git add tools/linkedin-harness/lib/notion.mjs tools/linkedin-harness/test/notion.test.mjs
git commit -m "✨ parcours LinkedIn : construction des charges Notion"
```

- [ ] **Step 6: Ajouter le test du chargement de jeton**

Ajouter en fin de `tools/linkedin-harness/test/notion.test.mjs` :

```js
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join as pjoin } from 'node:path';
import { loadToken } from '../lib/notion.mjs';

test('loadToken lit la variable d’environnement en priorité', () => {
  assert.equal(loadToken({ env: { NOTION_TOKEN: 'ntn_env' }, file: '/non/existant' }), 'ntn_env');
});

test('loadToken lit le fichier en repli', () => {
  const dir = mkdtempSync(pjoin(tmpdir(), 'walk-tok-'));
  const f = pjoin(dir, 'notion.env');
  writeFileSync(f, 'NOTION_TOKEN=ntn_file\n');
  assert.equal(loadToken({ env: {}, file: f }), 'ntn_file');
  rmSync(dir, { recursive: true, force: true });
});

test('loadToken sans source jette les instructions', () => {
  assert.throws(() => loadToken({ env: {}, file: '/non/existant' }), /Définir NOTION_TOKEN/);
});
```

- [ ] **Step 7: Lancer le test, vérifier l'échec**

Run: `node --test tools/linkedin-harness/test/notion.test.mjs`
Expected: FAIL, `loadToken is not a function` (export absent).

- [ ] **Step 8: Ajouter loadToken au module**

Dans `tools/linkedin-harness/lib/notion.mjs`, ajouter après la constante `TOKEN_FILE` :

```js
export function loadToken({ env = process.env, file = TOKEN_FILE } = {}) {
  if (env.NOTION_TOKEN) return env.NOTION_TOKEN;
  try {
    const m = readFileSync(file, 'utf8').match(/^NOTION_TOKEN=(.+)$/m);
    if (m) return m[1].trim();
  } catch {
    // fichier absent ou illisible, on tombe sur l'erreur explicite ci-dessous
  }
  throw new Error(
    `Jeton Notion absent. Définir NOTION_TOKEN, ou écrire NOTION_TOKEN=ntn_... dans ${file} puis chmod 600.`,
  );
}
```

- [ ] **Step 9: Lancer le test, vérifier le succès**

Run: `node --test tools/linkedin-harness/test/notion.test.mjs`
Expected: PASS, 6 tests.

- [ ] **Step 10: Commit du jeton**

```bash
git add tools/linkedin-harness/lib/notion.mjs tools/linkedin-harness/test/notion.test.mjs
git commit -m "✨ parcours LinkedIn : chargement du jeton Notion, env puis fichier"
```

- [ ] **Step 11: Ajouter le test avec fetch simulé**

Ajouter en fin de `tools/linkedin-harness/test/notion.test.mjs` :

```js
import { createShortlistPage } from '../lib/notion.mjs';

function stubFetch(responses) {
  const calls = [];
  const fetch = async (url, opts) => {
    calls.push({ url, opts });
    const r = responses.shift();
    return { ok: r.ok ?? true, status: r.status ?? 200, json: async () => r.json ?? {} };
  };
  return { fetch, calls };
}

test('createShortlistPage poste la page puis ajoute l’index', async () => {
  const { fetch, calls } = stubFetch([
    { json: { id: 'page123', url: 'https://notion.so/page123' } },
    { json: {} },
  ]);
  const out = await createShortlistPage(record, { rootId: 'root1', token: 'ntn_x', dateStr: '2026-06-09', fetch });
  assert.deepEqual(out, { pageId: 'page123', url: 'https://notion.so/page123' });
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /\/v1\/pages$/);
  assert.equal(calls[0].opts.method, 'POST');
  assert.equal(JSON.parse(calls[0].opts.body).parent.page_id, 'root1');
  assert.equal(calls[0].opts.headers.Authorization, 'Bearer ntn_x');
  assert.equal(calls[0].opts.headers['Notion-Version'], '2022-06-28');
  assert.match(calls[1].url, /\/v1\/blocks\/root1\/children$/);
  assert.equal(calls[1].opts.method, 'PATCH');
  assert.equal(JSON.parse(calls[1].opts.body).children.length, 1);
});

test('createShortlistPage jette sur réponse non ok', async () => {
  const { fetch } = stubFetch([{ ok: false, status: 401, json: { message: 'unauthorized' } }]);
  await assert.rejects(
    () => createShortlistPage(record, { rootId: 'root1', token: 'bad', dateStr: '2026-06-09', fetch }),
    /401/,
  );
});
```

- [ ] **Step 12: Lancer le test, vérifier l'échec**

Run: `node --test tools/linkedin-harness/test/notion.test.mjs`
Expected: FAIL, `createShortlistPage is not a function`.

- [ ] **Step 13: Ajouter l'écriture REST au module**

Dans `tools/linkedin-harness/lib/notion.mjs`, ajouter en fin de fichier :

```js
async function notionFetch(path, { method = 'POST', body, token, fetch = globalThis.fetch }) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Notion ${method} ${path} a échoué (${res.status}) : ${JSON.stringify(json)}`);
  }
  return json;
}

export async function createShortlistPage(record, { rootId, token, dateStr, fetch = globalThis.fetch }) {
  const page = await notionFetch('/pages', { body: buildPagePayload(rootId, record), token, fetch });
  await notionFetch(`/blocks/${rootId}/children`, {
    method: 'PATCH',
    body: { children: [buildIndexParagraph(record, dateStr)] },
    token,
    fetch,
  });
  return { pageId: page.id, url: page.url };
}
```

- [ ] **Step 14: Lancer le test, vérifier le succès**

Run: `node --test tools/linkedin-harness/test/notion.test.mjs`
Expected: PASS, 8 tests.

- [ ] **Step 15: Lancer toute la suite**

Run: `node --test tools/linkedin-harness/test/`
Expected: PASS, 20 tests au total, 7 état, 5 dossier, 8 notion. Vérifier zéro échec.

- [ ] **Step 16: Commit de l'écriture REST**

```bash
git add tools/linkedin-harness/lib/notion.mjs tools/linkedin-harness/test/notion.test.mjs
git commit -m "✨ parcours LinkedIn : écriture REST Notion, page et paragraphe d'index"
```

---

## Task 4: Actions Playwright sur la page du flux, vérifiées en réel

Cette tâche touche le DOM vivant de LinkedIn. Les sélecteurs se confirment par observation, pas par supposition. La sonde `tmp/probe-stream.mjs` existe déjà. Le navigateur doit tourner, l'utilisateur connecté à la main. En ligne dans la session principale, pas en sous-agent.

**Files:**
- Create: `tools/linkedin-harness/lib/stream-page.mjs`
- Use: `tools/linkedin-harness/tmp/probe-stream.mjs`

- [ ] **Step 1: Lancer le navigateur et se connecter**

L'utilisateur lance, dans son terminal, `bash tools/linkedin-harness/launch.sh`, et se connecte à la main si besoin. Confirmer que la fenêtre est sur LinkedIn connecté avant de continuer.

- [ ] **Step 2: Sonder la structure réelle**

Run: `node tools/linkedin-harness/tmp/probe-stream.mjs recommended`
Expected: la sortie liste les comptes de list et listitem, les libellés réels des boutons Dismiss, la présence de View next page, et l'instantané a11y de la première carte. Relever les rôles et noms exacts, ils pilotent l'implémentation.

- [ ] **Step 3: Écrire le module d'actions de page**

Créer `tools/linkedin-harness/lib/stream-page.mjs`, en alignant les sélecteurs sur ce que la sonde a montré :

```js
// Actions Playwright sur la page d'un flux d'offres. Navigation par l'arbre
// d'accessibilité, jamais par les classes CSS. Sélecteurs vérifiés par la sonde.
import { isAuthenticated } from '../attach.mjs';

const streamUrl = (slug) => `https://www.linkedin.com/jobs/collections/${slug}/`;

export async function gotoStream(page, slug) {
  await page.goto(streamUrl(slug), { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForLoadState('networkidle').catch(() => {});
  return isAuthenticated(page.url());
}

// Carte au focus = item de liste sélectionné dans le repère principal. Lit le
// titre depuis la carte, le détail depuis le panneau de droite.
export async function readFocusedCard(page) {
  const main = page.getByRole('main');
  const detail = page.getByRole('heading', { level: 1 });
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
```

- [ ] **Step 4: Vérifier readFocusedCard en réel**

Créer un essai jetable `tmp/try-card.mjs` :

```js
import { attach } from '../attach.mjs';
import { gotoStream, readFocusedCard } from '../lib/stream-page.mjs';
const { browser, page } = await attach();
await gotoStream(page, 'recommended');
await page.waitForTimeout(1500);
console.log(JSON.stringify(await readFocusedCard(page), null, 2));
await browser.close();
```

Run: `node tools/linkedin-harness/tmp/try-card.mjs`
Expected: un objet avec un titre non vide et un jobId. Si le titre est vide, ajuster le sélecteur de `readFocusedCard` selon l'instantané de la sonde, et relancer jusqu'à un titre correct.

- [ ] **Step 5: Commit**

```bash
git add tools/linkedin-harness/lib/stream-page.mjs
git commit -m "✨ parcours LinkedIn : actions Playwright sur la page du flux"
```

---

## Task 5: CLI walk.mjs, câblage des sous-commandes

**Files:**
- Create: `tools/linkedin-harness/walk.mjs`

- [ ] **Step 1: Écrire le CLI**

Créer `tools/linkedin-harness/walk.mjs` :

```js
// CLI du parcours. Sous-commandes start, decide, status. L'agent appelle, lit
// le JSON rendu, décide, rappelle. Le flux de contrôle vit ici, pas dans l'agent.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { attach } from './attach.mjs';
import {
  initState, setCurrent, addShortlist, addDismiss, targetMet, loadState, saveState,
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
  const next = setCurrent(state, card);
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
      const adv = await advance(page, state.stream);
      const after = addDismiss(state);
      if (adv.done) { saveState(STATE_PATH, after); out({ done: true, reason: adv.reason, progress: { accepted: after.accepted.length, target: after.target, dismissed: after.dismissed } }); return; }
      out(await readAndStore(page, after));
      return;
    }
    if (action === 'shortlist') {
      const record = loadRecord(flag('record'));
      const dateStr = new Date().toISOString().slice(0, 10);
      const created = await createShortlistPage(record, { rootId: state.root, token: loadToken(), dateStr });
      let after = addShortlist(state, { title: record.title, url: record.url, summary: record.summary, notionPageId: created.pageId });
      if (targetMet(after)) { saveState(STATE_PATH, after); out({ done: true, reason: 'target-met', created, progress: { accepted: after.accepted.length, target: after.target, dismissed: after.dismissed } }); return; }
      const adv = await advance(page, state.stream);
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
```

- [ ] **Step 2: Vérifier l'analyse des arguments hors ligne**

Run: `node tools/linkedin-harness/walk.mjs`
Expected: imprime l'usage sur stderr et sort en code 1, sans toucher au navigateur.

Run: `node tools/linkedin-harness/walk.mjs start --stream recommended --target 3`
Expected: jette `Passer --root <pageId>`, car la racine manque. Confirme que la validation des arguments précède l'attache.

- [ ] **Step 3: Commit**

```bash
git add tools/linkedin-harness/walk.mjs
git commit -m "✨ parcours LinkedIn : CLI start, decide, status"
```

---

## Task 6: Vérification de bout en bout en réel

Un run réel avec cible 1, sur le flux recommended, qui crée une vraie page Notion et l'efface ensuite. Prérequis, navigateur connecté, jeton Notion en place, intégration connectée à la racine. En ligne dans la session principale.

**Files:** aucun fichier de code, vérification vivante.

- [ ] **Step 1: Confirmer les prérequis**

Le navigateur tourne et est connecté. Le jeton est dans `~/.config/candidature/notion.env` ou `NOTION_TOKEN`. L'intégration Notion est connectée à la page racine. Récupérer l'identifiant de la racine, la page Recherche d'emploi, `32fec6ce980181558099fd4f5ac9ed46`.

- [ ] **Step 2: Démarrer un run cible 1**

Run: `node tools/linkedin-harness/walk.mjs start --stream recommended --target 1 --root 32fec6ce980181558099fd4f5ac9ed46`
Expected: un JSON avec `card` titré et `progress` à accepted 0 sur 1. Si `blocked: login`, l'utilisateur se connecte et on relance.

- [ ] **Step 3: Rejeter une carte**

Run: `node tools/linkedin-harness/walk.mjs decide --action reject`
Expected: la carte courante disparaît du flux dans la fenêtre, le JSON rend la carte suivante et dismissed à 1. Vérifier de visu que le bon item a été masqué.

- [ ] **Step 4: Shortlister une carte**

Préparer `tmp/record.json` à partir de la carte rendue, par exemple :

```json
{
  "title": "Essai Harnais — Offre de test",
  "company": "Essai", "role": "Offre de test",
  "location": "Paris", "workplace": "hybrid",
  "url": "https://www.linkedin.com/jobs/view/0",
  "summary": "Page de test du parcours, à supprimer.",
  "analysis": { "fit": "essai", "company": "essai", "differentiation": "essai" }
}
```

Run: `node tools/linkedin-harness/walk.mjs decide --action shortlist --record tmp/record.json`
Expected: JSON avec `created.pageId` et `created.url`, `done: true`, `reason: target-met`, accepted 1 sur 1.

- [ ] **Step 5: Vérifier dans Notion**

Ouvrir la page racine Recherche d'emploi. Confirmer une nouvelle sous-page en fin de page, plus un paragraphe d'index daté juste après, du type `2026-06-09. Page de test du parcours, à supprimer.`

- [ ] **Step 6: Nettoyer la page de test**

Supprimer la sous-page de test et le paragraphe d'index dans Notion. Supprimer `tmp/record.json` et `tmp/run.json`.

- [ ] **Step 7: Confirmer l'échappatoire stop**

Run: `node tools/linkedin-harness/walk.mjs start --stream recommended --target 5 --root 32fec6ce980181558099fd4f5ac9ed46`
puis `node tools/linkedin-harness/walk.mjs decide --action stop`
Expected: le stop rend `done: true`, `reason: stop`, un résumé avec accepted vide et le flux. Supprimer `tmp/run.json` ensuite.

- [ ] **Step 8: Commit du marqueur de vérification**

Aucun fichier de code n'a changé. Si des sélecteurs de `stream-page.mjs` ont été ajustés pendant la vérification, committer l'ajustement :

```bash
git add tools/linkedin-harness/lib/stream-page.mjs
git commit -m "🐛 parcours LinkedIn : sélecteurs ajustés sur le flux réel"
```

---

## Task 7: Documentation du parcours

**Files:**
- Modify: `tools/linkedin-harness/README.md`
- Modify: `tools/linkedin-harness/DESIGN.md`

- [ ] **Step 1: Documenter l'usage dans le README**

Ajouter au `tools/linkedin-harness/README.md` une section qui décrit le parcours, sans gras ni tiret cadratin, en phrases complètes. Couvrir le prérequis du jeton Notion (variable ou fichier `~/.config/candidature/notion.env`, chmod 600), la connexion de l'intégration à la racine, et la séquence des sous-commandes start, decide reject, decide shortlist avec dossier JSON, decide stop, status. Donner un exemple de dossier de décision.

- [ ] **Step 2: Mettre à jour le statut de FR-3 dans DESIGN.md**

Dans `tools/linkedin-harness/DESIGN.md`, FR-3 n'est plus à venir. Remplacer la phrase de FR-3 par une formulation au présent qui décrit le parcours réalisé, boucle de décision par carte, écriture Notion par jeton. Ajouter une entrée d'historique datée du 2026-06-09 qui note l'implémentation du parcours et le choix de l'écriture Notion directe.

- [ ] **Step 3: Lancer toute la suite une dernière fois**

Run: `node --test tools/linkedin-harness/test/`
Expected: PASS, zéro échec.

- [ ] **Step 4: Commit**

```bash
git add tools/linkedin-harness/README.md tools/linkedin-harness/DESIGN.md
git commit -m "📝 parcours LinkedIn : usage du parcours et statut FR-3 réalisé"
```

---

## Notes d'exécution

Les tâches 1 à 3 sont du test rouge puis vert pur, exécutables sans navigateur ni réseau, confiées d'un bloc à un sous-agent sans revue par tâche. Les tâches 4 à 6 touchent les systèmes vivants, LinkedIn et Notion, et se vérifient à la main, navigateur connecté et jeton en place, en ligne dans la session principale. Le rythme reste humain, un flux par session, conforme aux NFR du harnais.

Les sélecteurs d'accessibilité de `stream-page.mjs` sont un premier jet aligné sur la carte des flux. Ils se confirment et s'ajustent à la sonde et à l'essai en réel de la Task 4, parce que le DOM de LinkedIn ne se suppose pas.

Suite après ce parcours, la tâche TODO de correction de modele-notion.md, la racine porte du contenu propre.
