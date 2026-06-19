# Plan C, bascule du harnais LinkedIn vers les fichiers, plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Le harnais LinkedIn écrit un dossier candidature fichier à la décision shortlist, en remplacement de l'écriture Notion REST.

**Architecture:** `lib/notion.mjs` disparaît, un `lib/dossier.mjs` synchrone le remplace et écrit `candidatures/AAAA-MM-JJ-slug/README.md` au modèle fichiers. L'agent fournit le slug dans le record. `walk.mjs` câble le nouveau module, son drapeau `--root` devient un chemin de dépôt.

**Tech Stack:** Node.js ESM (.mjs), runner de tests intégré `node --test`, aucune dépendance ajoutée.

## Global Constraints

- Tests via `npm test` à la racine `tools/linkedin-harness/`, qui lance `node --test test/*.test.mjs`. Tout module a son test frère sous `test/`.
- Code ESM, extension `.mjs`, imports relatifs explicites avec extension.
- Le travail reste sur la branche `dev`. Préfixe gitmoji sur chaque commit.
- Le harnais est du code hors skill. Les tâches 1 et 2 n'ont aucune contrainte de modèle.
- La tâche 3 édite `DESIGN.md`, contenu soumis à la contrainte Opus du CLAUDE.md projet. Elle doit être exécutée par un agent Opus, jamais Sonnet. Règles de prose sur `DESIGN.md` : pas de gras markdown, pas de tiret cadratin ni demi-cadratin, pas de point-virgule, pas de fragment à puces en place de phrase.
- `DESIGN.md` n'est pas un artefact buildé, son édition ne déclenche pas de reconstruction ni de garde de dérive.

---

### Task 1: Record à slug et écriture du dossier

Le slug requis dans le record et le module qui l'écrit forment une seule unité. Le slug n'a pas d'autre consommateur que `dossier.mjs`, les deux se relisent ensemble. La tâche enchaîne deux cycles TDD, le record puis le module.

**Files:**
- Modify: `tools/linkedin-harness/lib/record.mjs`
- Create: `tools/linkedin-harness/lib/dossier.mjs`
- Test: `tools/linkedin-harness/test/record.test.mjs`
- Test: `tools/linkedin-harness/test/dossier.test.mjs`

**Interfaces:**
- Consumes: rien.
- Produces:
  - `validateRecord(obj)` exige désormais `slug`, chaîne non vide, en plus des champs existants. `loadRecord(path)` inchangé de signature.
  - `renderDossier(record, dateStr, jobId = null)` retourne le texte complet du README, frontmatter plus sections.
  - `createShortlistDossier(record, { root, dateStr, jobId = null })` écrit `candidatures/${dateStr}-${record.slug}/README.md` sous `root`, retourne `{ path }`, le chemin relatif. Lève si le dossier existe déjà.

- [ ] **Step 1: Ajouter le cas slug au test record, et le slug au record valide**

Dans `tools/linkedin-harness/test/record.test.mjs`, ajouter `slug` au helper `valid()` :

```js
const valid = () => ({
  title: 'Ornikar — Data Software Engineer',
  company: 'Ornikar', role: 'Data Software Engineer',
  location: 'Paris', workplace: 'hybrid',
  url: 'https://www.linkedin.com/jobs/view/123',
  summary: 'Data Software Engineer, Python, Paris hybrid. Via LinkedIn.',
  slug: 'ornikar-data-software-engineer',
  analysis: { fit: 'forte correspondance Python', company: 'mission édutech', differentiation: 'profil agentic' },
});
```

Ajouter ce test après le test `un champ chaîne manquant est listé` :

```js
test('le slug manquant est listé', () => {
  const r = valid(); delete r.slug;
  assert.throws(() => validateRecord(r), /slug/);
});
```

- [ ] **Step 2: Lancer le test record pour le voir échouer**

Run: `cd tools/linkedin-harness && node --test test/record.test.mjs`
Expected: FAIL, `le slug manquant est listé` ne lève pas, `slug` n'est pas encore requis.

- [ ] **Step 3: Ajouter slug aux champs requis**

Dans `tools/linkedin-harness/lib/record.mjs`, ajouter `'slug'` à `REQUIRED_STRINGS` :

```js
const REQUIRED_STRINGS = ['title', 'company', 'role', 'location', 'workplace', 'url', 'summary', 'slug'];
```

- [ ] **Step 4: Lancer le test record pour le voir passer**

Run: `cd tools/linkedin-harness && node --test test/record.test.mjs`
Expected: PASS.

- [ ] **Step 5: Écrire les tests du module dossier**

Créer `tools/linkedin-harness/test/dossier.test.mjs` :

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderDossier, createShortlistDossier } from '../lib/dossier.mjs';

const record = () => ({
  title: 'Ornikar — Data Software Engineer',
  company: 'Ornikar', role: 'Data Software Engineer',
  location: 'Paris', workplace: 'hybrid',
  url: 'https://www.linkedin.com/jobs/view/123',
  summary: 'Data Software Engineer, Python, Paris hybrid. Via LinkedIn.',
  slug: 'ornikar-data-software-engineer',
  analysis: { fit: 'forte correspondance Python', company: 'mission édutech', differentiation: 'profil agentic' },
});

test('renderDossier pose le frontmatter de shortlist', () => {
  const md = renderDossier(record(), '2026-06-19');
  assert.match(md, /^---\n/);
  assert.match(md, /\nentreprise: Ornikar\n/);
  assert.match(md, /\nposte: Data Software Engineer\n/);
  assert.match(md, /\nstatut: shortlist\n/);
  assert.match(md, /\ndate_shortlist: 2026-06-19\n/);
});

test('renderDossier inscrit le jobId quand fourni et l’omet sinon', () => {
  assert.match(renderDossier(record(), '2026-06-19', '4417156077'), /\njobId: 4417156077\n/);
  assert.doesNotMatch(renderDossier(record(), '2026-06-19'), /jobId/);
});

test('renderDossier rend l’offre et les trois sections d’analyse', () => {
  const md = renderDossier(record(), '2026-06-19');
  assert.match(md, /# Ornikar — Data Software Engineer/);
  assert.match(md, /## Offre\nPoste : Data Software Engineer\. Lieu : Paris \(hybrid\)\. Offre : https:\/\/www\.linkedin\.com\/jobs\/view\/123/);
  assert.match(md, /## Adéquation et écarts\nforte correspondance Python/);
  assert.match(md, /## Motivation\nmission édutech/);
  assert.match(md, /## Différenciation\nprofil agentic/);
});

test('createShortlistDossier écrit le README et rend le chemin relatif', () => {
  const root = mkdtempSync(join(tmpdir(), 'cand-'));
  const { path } = createShortlistDossier(record(), { root, dateStr: '2026-06-19', jobId: '42' });
  assert.equal(path, 'candidatures/2026-06-19-ornikar-data-software-engineer/README.md');
  const written = readFileSync(join(root, path), 'utf8');
  assert.match(written, /statut: shortlist/);
  assert.match(written, /jobId: 42/);
  rmSync(root, { recursive: true, force: true });
});

test('createShortlistDossier jette si le dossier existe déjà', () => {
  const root = mkdtempSync(join(tmpdir(), 'cand-'));
  mkdirSync(join(root, 'candidatures', '2026-06-19-ornikar-data-software-engineer'), { recursive: true });
  assert.throws(
    () => createShortlistDossier(record(), { root, dateStr: '2026-06-19', jobId: '42' }),
    /déjà présent/,
  );
  rmSync(root, { recursive: true, force: true });
});
```

- [ ] **Step 6: Lancer les tests dossier pour les voir échouer**

Run: `cd tools/linkedin-harness && node --test test/dossier.test.mjs`
Expected: FAIL, `Cannot find module '../lib/dossier.mjs'`.

- [ ] **Step 7: Écrire le module dossier**

Créer `tools/linkedin-harness/lib/dossier.mjs` :

```js
// Écriture du dossier candidature à la décision shortlist. Remplace l'écriture
// Notion par le stockage fichiers, version de format 1. Même record que l'ancien
// createShortlistPage, sortie fichier au lieu de page REST.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function frontmatter(record, dateStr, jobId) {
  const lines = [
    `entreprise: ${record.company}`,
    `poste: ${record.role}`,
    'statut: shortlist',
    `date_shortlist: ${dateStr}`,
  ];
  if (jobId != null) lines.push(`jobId: ${jobId}`);
  return ['---', ...lines, '---'].join('\n');
}

function body(record) {
  return [
    `# ${record.title}`,
    '',
    '## Offre',
    `Poste : ${record.role}. Lieu : ${record.location} (${record.workplace}). Offre : ${record.url}`,
    '',
    '## Adéquation et écarts',
    record.analysis.fit,
    '',
    '## Motivation',
    record.analysis.company,
    '',
    '## Différenciation',
    record.analysis.differentiation,
    '',
  ].join('\n');
}

export function renderDossier(record, dateStr, jobId = null) {
  return `${frontmatter(record, dateStr, jobId)}\n\n${body(record)}`;
}

export function createShortlistDossier(record, { root, dateStr, jobId = null }) {
  const name = `${dateStr}-${record.slug}`;
  const dir = join(root, 'candidatures', name);
  if (existsSync(dir)) {
    throw new Error(`Dossier déjà présent : ${dir}. Ajuster le slug du record.`);
  }
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'README.md'), renderDossier(record, dateStr, jobId));
  return { path: join('candidatures', name, 'README.md') };
}
```

- [ ] **Step 8: Lancer les tests dossier pour les voir passer**

Run: `cd tools/linkedin-harness && node --test test/dossier.test.mjs`
Expected: PASS, les cinq tests verts.

- [ ] **Step 9: Commit**

```bash
git add tools/linkedin-harness/lib/record.mjs tools/linkedin-harness/test/record.test.mjs tools/linkedin-harness/lib/dossier.mjs tools/linkedin-harness/test/dossier.test.mjs
git commit -m "✨ écrire le dossier candidature shortlist en fichiers"
```

---

### Task 2: Câbler walk.mjs et retirer Notion

**Files:**
- Modify: `tools/linkedin-harness/walk.mjs:11`, `:37`, `:71-73`
- Modify: `tools/linkedin-harness/test/state.test.mjs:39`, `:42`, `:59`
- Delete: `tools/linkedin-harness/lib/notion.mjs`
- Delete: `tools/linkedin-harness/test/notion.test.mjs`

**Interfaces:**
- Consumes: `createShortlistDossier(record, { root, dateStr, jobId })` de la Task 1.
- Produces: l'entrée d'`addShortlist` porte `dossierPath` au lieu de `notionPageId`. `--root` est un chemin de dépôt de candidatures.

- [ ] **Step 1: Mettre à jour le test d'état**

Dans `tools/linkedin-harness/test/state.test.mjs`, remplacer les trois usages de `notionPageId` par `dossierPath`.

Ligne 39, le test `addShortlist ajoute sans muter` :

```js
  const s2 = addShortlist(s, { title: 'A', dossierPath: 'candidatures/2026-06-09-a/README.md' });
```

Ligne 42, l'assertion correspondante :

```js
  assert.equal(s2.accepted[0].dossierPath, 'candidatures/2026-06-09-a/README.md');
```

Ligne 59, le test `saveState puis loadState` :

```js
  const s = addShortlist(base(), { title: 'A', dossierPath: 'candidatures/2026-06-09-a/README.md' });
```

- [ ] **Step 2: Lancer le test d'état pour le voir passer encore**

Le champ est opaque pour `state.mjs`, le renommage seul garde les tests verts.

Run: `cd tools/linkedin-harness && node --test test/state.test.mjs`
Expected: PASS.

- [ ] **Step 3: Câbler walk.mjs sur le module dossier**

Dans `tools/linkedin-harness/walk.mjs`, remplacer l'import Notion (ligne 11) :

```js
import { createShortlistDossier } from './lib/dossier.mjs';
```

Réécrire le message d'erreur de `--root` (ligne 37) :

```js
  if (!root) throw new Error('Passer --root <chemin> du dépôt de candidatures.');
```

Dans `cmdDecide`, action shortlist (lignes 71 à 73), remplacer la création Notion par la création de dossier, appel synchrone sans `await`, et l'entrée `addShortlist` porte `dossierPath` :

```js
      const record = loadRecord(flag('record'));
      const dateStr = new Date().toISOString().slice(0, 10);
      const created = createShortlistDossier(record, { root: state.root, dateStr, jobId: state.current?.jobId ?? null });
      let after = addShortlist(state, { jobId: state.current?.jobId ?? null, title: record.title, url: record.url, summary: record.summary, dossierPath: created.path });
```

- [ ] **Step 4: Supprimer le client Notion et son test**

```bash
git rm tools/linkedin-harness/lib/notion.mjs tools/linkedin-harness/test/notion.test.mjs
```

- [ ] **Step 5: Vérifier la syntaxe et la suite complète**

Run: `cd tools/linkedin-harness && node --check walk.mjs && npm test`
Expected: `node --check` silencieux, `npm test` vert sur record, dossier et state, sans plus aucun test notion.

- [ ] **Step 6: Commit**

```bash
git add tools/linkedin-harness/walk.mjs tools/linkedin-harness/test/state.test.mjs
git commit -m "♻️ câbler le parcours sur le stockage fichiers, retirer Notion"
```

---

### Task 3: Réviser D-40 dans DESIGN.md

Cette tâche édite `DESIGN.md`. Elle exige un agent Opus, jamais Sonnet, et respecte les règles de prose du projet (pas de gras, pas de tiret cadratin, pas de point-virgule).

**Files:**
- Modify: `DESIGN.md`, décision D-40 (autour des lignes 962 à 994) et la mention ligne 1018.

**Interfaces:**
- Consumes: l'état livré des tâches 1 et 2.
- Produces: aucune interface de code, alignement documentaire.

- [ ] **Step 1: Réviser le cadrage du sous-plan**

Dans `DESIGN.md`, le paragraphe d'ouverture de D-40 (autour des lignes 964 à 968) annonce la bascule comme un sous-plan à venir, hors du pivot, dont les mentions Notion seront révisées. Le réécrire pour acter Plan C comme livré : le harnais écrit désormais le dossier candidature en fichiers, le sous-plan est clos, les mentions ci-dessous décrivent l'état fichiers.

- [ ] **Step 2: Réviser le mécanisme d'écartement**

Toujours dans D-40, les phrases qui décrivent `lib/notion.mjs` exposant `archivePage` et la suppression douce REST `archived:true` (autour des lignes 970 à 990) ne valent plus. Les remplacer par le mécanisme fichiers : la création de dossier remplace `createShortlistPage`, l'écartement d'une offre passe par le frontmatter, l'agent met `statut: écartée` dans le README, et la sous-commande `walk.mjs dismiss` reste la voie d'écartement de la carte hors parcours. Le couple archiver plus dismisser devient mettre `statut: écartée` plus dismisser la carte.

- [ ] **Step 3: Vérifier la mention de l'axe d'audit**

Ligne 1018 environ, la phrase sur D-27 et l'exploration d'un backend mentionne déjà le pivot fichiers. Vérifier qu'elle reste cohérente avec D-40 révisé et l'ajuster seulement si elle référence encore une écriture Notion du harnais.

- [ ] **Step 4: Relire et committer**

Relire le passage D-40 entier pour la cohérence interne et le respect des règles de prose.

```bash
git add DESIGN.md
git commit -m "📝 acter Plan C livré, D-40 décrit le backend fichiers"
```

---

## Self-Review

Couverture de la spec :
- `slug` requis dans le record et nouveau `lib/dossier.mjs` avec contenu README : Task 1.
- Suppression de `notion.mjs` et `archivePage`, index racine sans équivalent : Task 1 (omission dans `dossier.mjs`) et Task 2 (retrait).
- Câblage `walk.mjs`, `--root` chemin, entrée `dossierPath` : Task 2.
- Tests, suppression de `notion.test.mjs`, `dossier.test.mjs`, ajustement de `state.test.mjs` et `record.test.mjs` : Tasks 1 et 2.
- Révision de `DESIGN.md` D-40 : Task 3.
- `site-ouverture-playwright.md` déjà aligné, aucune tâche, conforme à la spec.

Cohérence des types : `createShortlistDossier(record, { root, dateStr, jobId })` retourne `{ path }`, consommé identiquement en Task 2. `renderDossier(record, dateStr, jobId)` est interne au module et testé en Task 1. `dossierPath` nommé identiquement en Task 1 (sortie), Task 2 (entrée d'`addShortlist`) et test d'état.

Pas de placeholder, chaque étape de code porte son code.
