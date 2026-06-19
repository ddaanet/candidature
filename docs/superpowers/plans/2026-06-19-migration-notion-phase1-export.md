# Migration Notion → fichiers locaux, Phase 1 (export scripté) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exporter tout l'arbre Notion *Recherche d'emploi* vers l'arborescence de fichiers locaux `Emploi/`, par un script testé, sans faire transiter le contenu des pages par le contexte Claude.

**Architecture:** Un outil Node autonome `tools/notion-export/` dans le repo `candidature`, sans dépendance (fetch natif de Node 22). Des fonctions pures et testées convertissent les blocs Notion en markdown et parsent les lignes de statut. Un orchestrateur parcourt l'arbre depuis `candidature_root`, apparie chaque page candidature avec son paragraphe-index, classe chaque page, et écrit les fichiers dans `Emploi/`. Une passe de vérification scriptée recompte et contrôle le frontmatter.

**Tech Stack:** Node 22 (ESM `.mjs`, `fetch` global), `node:test` + `node:assert/strict`, API REST Notion `2022-06-28` par jeton d'intégration (auth via `loadToken` du linkedin-harness).

## Global Constraints

- Le repo `candidature` est public. Aucun contenu réel de Notion (offres, fiche candidat, passations de David) ne doit être commité dans `candidature`. Les fixtures de test sont synthétiques. Le dossier `tmp/` est ignoré par git.
- Les données réelles sont écrites uniquement dans `/Users/david/code/Emploi` (repo privé, sans remote). Le chemin de sortie est passé en argument, jamais codé en dur dans le code commité.
- Conventions du module Notion existant : ESM, fonctions pures séparées des appels réseau, `fetch` injectable pour les tests (voir `tools/linkedin-harness/lib/notion.mjs` et `test/notion.test.mjs`). Réutiliser `loadToken` de ce module, ne pas réimplémenter le chargement du jeton.
- `Notion-Version: 2022-06-28`. Pagination obligatoire sur `/blocks/{id}/children` (`page_size=100`, `start_cursor`).
- Le contenu des pages ne doit jamais être imprimé en entier dans la sortie de l'agent pendant la migration. La vérification compte et contrôle, elle ne déverse pas le contenu.
- Vocabulaire de statut autorisé dans le frontmatter : `shortlist`, `soumise`, `en attente`, `refus`, `classée sans suite`, `retenue`.
- Tests lancés par `node --test test/*.test.mjs` depuis `tools/notion-export/`.
- Messages de commit dans `candidature` : préfixe gitmoji (hook commit-msg actif), centrés sur le pourquoi. Commits dans `Emploi` : messages en clair (pas de hook gitmoji). Ajouter le trailer `Claude-Session` requis par l'environnement.
- Données réelles de l'arbre (relevées le 2026-06-19, source de vérité pour les tests de bout en bout) : 125 pages `child_page`, profondeur max 3. Types de blocs présents : `paragraph`, `heading_1`, `heading_2`, `heading_3`, `bulleted_list_item`, `numbered_list_item`, `to_do`, `quote`, `code`, `divider`, `table`, `table_row`, `child_page`. Annotations rich_text présentes : `bold`, `italic`, `code`, liens, mentions. Absents : callout, toggle, colonnes, image, fichier, signet, équation, couleur, souligné, barré.

---

### Task 1: Lecteur Notion vers markdown (client, rich_text, blocs)

Trois modules forment la couche de lecture « page Notion vers markdown ». Ils s'empilent directement (markdown consomme client et richtext) et se vérifient ensemble. Une seule barrière de revue, en fin de tâche, sur la suite complète. Le code et les tests sont prescrits verbatim : l'exécution est de la transcription, pas de la conception. Le seul point délicat est la normalisation des sauts de ligne dans la conversion des blocs (partie C), où l'ajustement reste borné par des assertions exactes.

Cette tâche n'a aucune dépendance sur la Task 2 (classification). Les deux peuvent être menées en parallèle.

**Files:**
- Create: `tools/notion-export/package.json`
- Create: `tools/notion-export/.gitignore`
- Create: `tools/notion-export/lib/client.mjs`
- Create: `tools/notion-export/lib/richtext.mjs`
- Create: `tools/notion-export/lib/markdown.mjs`
- Test: `tools/notion-export/test/client.test.mjs`
- Test: `tools/notion-export/test/richtext.test.mjs`
- Test: `tools/notion-export/test/markdown.test.mjs`

**Interfaces:**
- Consumes: `loadToken` importé de `../../linkedin-harness/lib/notion.mjs`.
- Produces:
  - `notionGet(path, { token, fetch }) -> Promise<object>` : GET REST, jette sur réponse non ok.
  - `listChildren(blockId, { token, fetch }) -> Promise<Block[]>` : agrège toutes les pages de `/blocks/{blockId}/children` en suivant `next_cursor`. Un `Block` est l'objet brut Notion : `{ id, type, has_children, [type]: {...} }`.
  - `richTextToMarkdown(richText) -> string` : tableau `rich_text` Notion vers markdown inline. Couvre `bold`, `italic`, `code`, liens. Mentions et équations via `plain_text`.
  - `blocksToMarkdown(blocks, { token, fetch, depth = 0 }) -> Promise<{ markdown, childPages }>` : rend chaque type de bloc connu. Les `child_page` sont collectés dans `childPages` (pas rendus en ligne). Les conteneurs avec enfants (listes, tables) sont lus via `listChildren`. Type inconnu rendu en commentaire `<!-- bloc non géré: TYPE -->`.

#### Partie A : scaffold et client Notion en lecture

- [ ] **Step 1: Créer le `package.json`**

```json
{
  "name": "notion-export",
  "private": true,
  "type": "module",
  "description": "Export ponctuel d'un arbre de pages Notion vers une arborescence de fichiers markdown locaux. Aucune dépendance, fetch natif.",
  "scripts": {
    "test": "node --test test/*.test.mjs"
  }
}
```

- [ ] **Step 2: Créer le `.gitignore`**

```
node_modules/
tmp/
*.env
*.token
```

- [ ] **Step 3: Écrire le test du client (échec attendu)**

`tools/notion-export/test/client.test.mjs` :

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { notionGet, listChildren } from '../lib/client.mjs';

function stubFetch(responses) {
  const calls = [];
  const fetch = async (url, opts) => {
    calls.push({ url, opts });
    const r = responses.shift();
    return { ok: r.ok ?? true, status: r.status ?? 200, json: async () => r.json ?? {} };
  };
  return { fetch, calls };
}

test('notionGet pose les en-têtes et jette sur non ok', async () => {
  const { fetch, calls } = stubFetch([{ json: { id: 'p1' } }]);
  const out = await notionGet('/pages/p1', { token: 'ntn_x', fetch });
  assert.deepEqual(out, { id: 'p1' });
  assert.match(calls[0].url, /\/v1\/pages\/p1$/);
  assert.equal(calls[0].opts.headers.Authorization, 'Bearer ntn_x');
  assert.equal(calls[0].opts.headers['Notion-Version'], '2022-06-28');

  const bad = stubFetch([{ ok: false, status: 404, json: { message: 'nope' } }]);
  await assert.rejects(() => notionGet('/pages/x', { token: 't', fetch: bad.fetch }), /404/);
});

test('listChildren suit la pagination', async () => {
  const { fetch, calls } = stubFetch([
    { json: { results: [{ id: 'a', type: 'paragraph', has_children: false }], has_more: true, next_cursor: 'c1' } },
    { json: { results: [{ id: 'b', type: 'paragraph', has_children: false }], has_more: false, next_cursor: null } },
  ]);
  const blocks = await listChildren('root', { token: 't', fetch });
  assert.equal(blocks.length, 2);
  assert.deepEqual(blocks.map((b) => b.id), ['a', 'b']);
  assert.match(calls[0].url, /\/blocks\/root\/children\?page_size=100$/);
  assert.match(calls[1].url, /start_cursor=c1/);
});
```

- [ ] **Step 4: Lancer le test, vérifier l'échec**

Run: `node --test test/client.test.mjs` (depuis `tools/notion-export/`)
Expected: FAIL, `Cannot find module '../lib/client.mjs'`.

- [ ] **Step 5: Implémenter `lib/client.mjs`**

```javascript
// Client Notion en lecture seule pour l'export ponctuel. Réutilise loadToken du
// linkedin-harness. Aucun passage par le MCP. fetch injectable pour les tests.
import { loadToken } from '../../linkedin-harness/lib/notion.mjs';

const API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

export { loadToken };

export async function notionGet(path, { token, fetch = globalThis.fetch }) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Notion-Version': NOTION_VERSION },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Notion GET ${path} a échoué (${res.status}) : ${JSON.stringify(json)}`);
  }
  return json;
}

export async function listChildren(blockId, { token, fetch = globalThis.fetch }) {
  const out = [];
  let cursor = null;
  do {
    const q = cursor ? `?start_cursor=${cursor}&page_size=100` : '?page_size=100';
    const j = await notionGet(`/blocks/${blockId}/children${q}`, { token, fetch });
    out.push(...j.results);
    cursor = j.has_more ? j.next_cursor : null;
  } while (cursor);
  return out;
}
```

- [ ] **Step 6: Lancer le test, vérifier le succès**

Run: `node --test test/client.test.mjs`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
git add tools/notion-export/package.json tools/notion-export/.gitignore tools/notion-export/lib/client.mjs tools/notion-export/test/client.test.mjs
git commit -m "✨ client Notion lecture seule pour l'export"
```

#### Partie B : conversion du rich_text

- [ ] **Step 1: Écrire le test (échec attendu)**

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { richTextToMarkdown } from '../lib/richtext.mjs';

const item = (text, annotations = {}, href = null) => ({
  type: 'text', plain_text: text, href,
  annotations: { bold: false, italic: false, code: false, strikethrough: false, underline: false, color: 'default', ...annotations },
});

test('texte simple est rendu tel quel', () => {
  assert.equal(richTextToMarkdown([item('bonjour')]), 'bonjour');
});

test('gras, italique, code', () => {
  assert.equal(richTextToMarkdown([item('x', { bold: true })]), '**x**');
  assert.equal(richTextToMarkdown([item('x', { italic: true })]), '*x*');
  assert.equal(richTextToMarkdown([item('x', { code: true })]), '`x`');
});

test('le code enveloppe avant le gras', () => {
  assert.equal(richTextToMarkdown([item('x', { code: true, bold: true })]), '**`x`**');
});

test('lien', () => {
  assert.equal(richTextToMarkdown([item('Notion', {}, 'https://notion.so')]), '[Notion](https://notion.so)');
});

test('concatène plusieurs segments', () => {
  assert.equal(richTextToMarkdown([item('a '), item('b', { bold: true })]), 'a **b**');
});

test('mention rendue par plain_text', () => {
  assert.equal(richTextToMarkdown([{ type: 'mention', plain_text: '2026-04-09', annotations: {} }]), '2026-04-09');
});

test('tableau vide ou absent donne chaîne vide', () => {
  assert.equal(richTextToMarkdown([]), '');
  assert.equal(richTextToMarkdown(undefined), '');
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `node --test test/richtext.test.mjs`
Expected: FAIL, module introuvable.

- [ ] **Step 3: Implémenter `lib/richtext.mjs`**

```javascript
// Convertit un tableau rich_text Notion en markdown inline. Ordre d'enveloppe :
// code, puis gras, puis italique, puis lien. Mentions/équations via plain_text.
export function richTextToMarkdown(richText) {
  if (!richText || richText.length === 0) return '';
  return richText
    .map((t) => {
      let s = t.plain_text ?? '';
      const a = t.annotations || {};
      if (a.code) s = `\`${s}\``;
      if (a.bold) s = `**${s}**`;
      if (a.italic) s = `*${s}*`;
      const href = t.href || t.text?.link?.url || null;
      if (href) s = `[${s}](${href})`;
      return s;
    })
    .join('');
}
```

- [ ] **Step 4: Lancer le test, vérifier le succès**

Run: `node --test test/richtext.test.mjs`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add tools/notion-export/lib/richtext.mjs tools/notion-export/test/richtext.test.mjs
git commit -m "✨ conversion rich_text Notion vers markdown inline"
```

#### Partie C : conversion des blocs

Comportement de `blocksToMarkdown`, calé sur le recensement de l'arbre réel : les `child_page` ne sont pas rendus en ligne, ils sont collectés dans `childPages` pour que l'orchestrateur les traite. Les listes et `to_do` avec `has_children` indentent leurs enfants de deux espaces par niveau. Une `table` lit ses `table_row` enfants et rend un tableau markdown. Un type inconnu rend un commentaire `<!-- bloc non géré: TYPE -->`, filet de sécurité qui ne doit pas se déclencher sur l'arbre réel.

- [ ] **Step 1: Écrire le test (échec attendu)**

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blocksToMarkdown } from '../lib/markdown.mjs';

const rt = (s) => [{ type: 'text', plain_text: s, annotations: {} }];
const blk = (type, extra = {}) => ({ id: 'x', type, has_children: false, [type]: { rich_text: rt('T') }, ...extra });

test('titres h1/h2/h3', async () => {
  const { markdown } = await blocksToMarkdown([
    { id: '1', type: 'heading_1', has_children: false, heading_1: { rich_text: rt('A') } },
    { id: '2', type: 'heading_2', has_children: false, heading_2: { rich_text: rt('B') } },
    { id: '3', type: 'heading_3', has_children: false, heading_3: { rich_text: rt('C') } },
  ], {});
  assert.equal(markdown, '# A\n\n## B\n\n### C\n');
});

test('paragraphe, divider, quote, code', async () => {
  const { markdown } = await blocksToMarkdown([
    { id: '1', type: 'paragraph', has_children: false, paragraph: { rich_text: rt('para') } },
    { id: '2', type: 'divider', has_children: false, divider: {} },
    { id: '3', type: 'quote', has_children: false, quote: { rich_text: rt('cite') } },
    { id: '4', type: 'code', has_children: false, code: { rich_text: rt('print(1)'), language: 'python' } },
  ], {});
  assert.equal(markdown, 'para\n\n---\n\n> cite\n\n```python\nprint(1)\n```\n');
});

test('listes à puces, numérotées, to_do', async () => {
  const { markdown } = await blocksToMarkdown([
    { id: '1', type: 'bulleted_list_item', has_children: false, bulleted_list_item: { rich_text: rt('a') } },
    { id: '2', type: 'numbered_list_item', has_children: false, numbered_list_item: { rich_text: rt('b') } },
    { id: '3', type: 'to_do', has_children: false, to_do: { rich_text: rt('c'), checked: false } },
    { id: '4', type: 'to_do', has_children: false, to_do: { rich_text: rt('d'), checked: true } },
  ], {});
  assert.equal(markdown, '- a\n1. b\n- [ ] c\n- [x] d\n');
});

test('child_page collecté, non rendu en ligne', async () => {
  const { markdown, childPages } = await blocksToMarkdown([
    { id: 'p1', type: 'child_page', has_children: true, child_page: { title: 'Lettre de motivation' } },
  ], {});
  assert.equal(markdown, '');
  assert.deepEqual(childPages, [{ id: 'p1', title: 'Lettre de motivation' }]);
});

test('table rendue depuis ses table_row', async () => {
  const stub = {
    fetch: async () => ({ ok: true, status: 200, json: async () => ({
      results: [
        { id: 'r1', type: 'table_row', has_children: false, table_row: { cells: [rt('H1'), rt('H2')] } },
        { id: 'r2', type: 'table_row', has_children: false, table_row: { cells: [rt('a'), rt('b')] } },
      ], has_more: false, next_cursor: null }) }),
  };
  const { markdown } = await blocksToMarkdown([
    { id: 't', type: 'table', has_children: true, table: { table_width: 2, has_column_header: true } },
  ], { token: 't', fetch: stub.fetch });
  assert.equal(markdown, '| H1 | H2 |\n| --- | --- |\n| a | b |\n');
});

test('liste imbriquée indentée', async () => {
  const stub = {
    fetch: async () => ({ ok: true, status: 200, json: async () => ({
      results: [{ id: 'c', type: 'bulleted_list_item', has_children: false, bulleted_list_item: { rich_text: rt('enfant') } }],
      has_more: false, next_cursor: null }) }),
  };
  const { markdown } = await blocksToMarkdown([
    { id: 'p', type: 'bulleted_list_item', has_children: true, bulleted_list_item: { rich_text: rt('parent') } },
  ], { token: 't', fetch: stub.fetch });
  assert.equal(markdown, '- parent\n  - enfant\n');
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `node --test test/markdown.test.mjs`
Expected: FAIL, module introuvable.

- [ ] **Step 3: Implémenter `lib/markdown.mjs`**

```javascript
// Convertit une liste de blocs Notion en markdown. Les child_page sont collectés
// (pas rendus en ligne). Les conteneurs avec enfants (listes, tables) sont lus via
// listChildren. Couvre tous les types relevés dans l'arbre réel.
import { richTextToMarkdown } from './richtext.mjs';
import { listChildren } from './client.mjs';

const indent = (s, depth) => s.split('\n').map((l) => (l ? '  '.repeat(depth) + l : l)).join('\n');

async function tableToMarkdown(block, ctx) {
  const rows = await listChildren(block.id, ctx);
  const lines = [];
  rows.forEach((r, i) => {
    const cells = (r.table_row?.cells || []).map((c) => richTextToMarkdown(c).replace(/\|/g, '\\|'));
    lines.push(`| ${cells.join(' | ')} |`);
    if (i === 0 && block.table?.has_column_header) {
      lines.push(`| ${cells.map(() => '---').join(' | ')} |`);
    }
  });
  return lines.join('\n') + '\n';
}

export async function blocksToMarkdown(blocks, ctx) {
  const { depth = 0 } = ctx;
  const childPages = [];
  const parts = [];

  for (const b of blocks) {
    const data = b[b.type] || {};
    const text = data.rich_text ? richTextToMarkdown(data.rich_text) : '';
    let chunk = null;
    let childrenMarkdown = '';

    switch (b.type) {
      case 'heading_1': chunk = `# ${text}\n`; break;
      case 'heading_2': chunk = `## ${text}\n`; break;
      case 'heading_3': chunk = `### ${text}\n`; break;
      case 'paragraph': chunk = `${text}\n`; break;
      case 'quote': chunk = `> ${text}\n`; break;
      case 'divider': chunk = `---\n`; break;
      case 'code': chunk = `\`\`\`${data.language || ''}\n${text}\n\`\`\`\n`; break;
      case 'bulleted_list_item': chunk = `- ${text}`; break;
      case 'numbered_list_item': chunk = `1. ${text}`; break;
      case 'to_do': chunk = `- [${data.checked ? 'x' : ' '}] ${text}`; break;
      case 'table': chunk = await tableToMarkdown(b, { ...ctx, depth: 0 }); break;
      case 'child_page': childPages.push({ id: b.id, title: data.title }); continue;
      case 'child_database': continue;
      default: chunk = `<!-- bloc non géré: ${b.type} -->\n`;
    }

    const isListItem = b.type.endsWith('_list_item') || b.type === 'to_do';
    if (b.has_children && b.type !== 'table') {
      const sub = await blocksToMarkdown(await listChildren(b.id, ctx), { ...ctx, depth: depth + 1 });
      childPages.push(...sub.childPages);
      childrenMarkdown = sub.markdown;
    }

    if (isListItem) {
      parts.push(chunk + '\n' + (childrenMarkdown ? indent(childrenMarkdown, 1) : ''));
    } else {
      parts.push(chunk + '\n' + childrenMarkdown);
    }
  }

  // Joint : les items de liste collent (pas de ligne vide entre eux), les blocs
  // de niveau supérieur sont séparés par une ligne vide. On normalise en fin.
  let markdown = parts.join('');
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  return { markdown, childPages };
}
```

- [ ] **Step 4: Lancer le test, ajuster jusqu'au succès**

Run: `node --test test/markdown.test.mjs`
Expected: PASS (6 tests). Le rendu des séparations de lignes est délicat : si un test échoue sur des `\n` en trop ou en moins, ajuster la concaténation dans `blocksToMarkdown` (la jointure des items de liste sans ligne vide, les blocs de bloc avec une ligne vide) et la normalisation finale `replace(/\n{3,}/g, '\n\n')` pour faire passer les assertions exactes ci-dessus. Ne pas changer les assertions.

- [ ] **Step 5: Commit**

```bash
git add tools/notion-export/lib/markdown.mjs tools/notion-export/test/markdown.test.mjs
git commit -m "✨ conversion des blocs Notion vers markdown"
```

---

### Task 2: Classification des pages et parsing du statut

Module de fonctions pures, sans dépendance sur la Task 1. Parallélisable avec elle. Verbatim pour l'essentiel, mais les regexes de `parseStatusLine` sont calées sur le format réel des paragraphes-index et l'étape d'ajustement attend une vraie itération : c'est ici, et non dans la transcription du Lecteur, que la revue indépendante porte.

**Files:**
- Create: `tools/notion-export/lib/classify.mjs`
- Test: `tools/notion-export/test/classify.test.mjs`

**Interfaces:**
- Produces:
  - `slugify(s) -> string` : kebab-case ASCII (minuscules, accents retirés, non-alphanum → `-`).
  - `classifyRootChild(title) -> 'fiche-candidat' | 'recherches' | 'tendances' | 'passations' | 'sites' | 'style' | 'candidature'`.
  - `splitTitle(title) -> { entreprise, poste }` : coupe sur le premier `—` ou `/`.
  - `parseStatusLine(text) -> { statut, date_soumission, date_shortlist, date_reponse, canal, note }` (champs `null` si absents). `statut` normalisé au vocabulaire autorisé, ou `null` si non reconnaissable.

- [ ] **Step 1: Écrire le test (échec attendu)**

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify, classifyRootChild, splitTitle, parseStatusLine } from '../lib/classify.mjs';

test('slugify', () => {
  assert.equal(slugify('ABC arbitrage'), 'abc-arbitrage');
  assert.equal(slugify('Kraken Technologies France'), 'kraken-technologies-france');
  assert.equal(slugify('Criteo / Senior'), 'criteo-senior');
});

test('classifyRootChild reconnaît les sections spéciales', () => {
  assert.equal(classifyRootChild('Fiche candidat - David Allouche'), 'fiche-candidat');
  assert.equal(classifyRootChild('Recherches'), 'recherches');
  assert.equal(classifyRootChild('Tendances'), 'tendances');
  assert.equal(classifyRootChild('Passations Recherche d’emploi'), 'passations');
  assert.equal(classifyRootChild('Sites'), 'sites');
  assert.equal(classifyRootChild('Feuille de style cover letter PDF'), 'style');
  assert.equal(classifyRootChild('Style cover letter PDF'), 'style');
  assert.equal(classifyRootChild('Mirakl — Senior AI Agent Engineer'), 'candidature');
});

test('splitTitle', () => {
  assert.deepEqual(splitTitle('Mirakl — Senior AI Agent Engineer'), { entreprise: 'Mirakl', poste: 'Senior AI Agent Engineer' });
  assert.deepEqual(splitTitle('Criteo / Senior AI/LLM Engineer (r20181)'), { entreprise: 'Criteo', poste: 'Senior AI/LLM Engineer (r20181)' });
  assert.deepEqual(splitTitle('Partoo'), { entreprise: 'Partoo', poste: '' });
});

test('parseStatusLine — soumise puis refus daté avec canal', () => {
  const r = parseStatusLine('Soumise le 2026-04-09 via Greenhouse mirakllabs. Statut : refus le 2026-04-13. Senior AI Agent Engineer.');
  assert.equal(r.statut, 'refus');
  assert.equal(r.date_soumission, '2026-04-09');
  assert.equal(r.date_reponse, '2026-04-13');
  assert.equal(r.canal, 'Greenhouse mirakllabs');
});

test('parseStatusLine — refus sans date', () => {
  const r = parseStatusLine('Soumise le 2024-03-18. Statut : refus. Senior SWE CDI Paris.');
  assert.equal(r.statut, 'refus');
  assert.equal(r.date_soumission, '2024-03-18');
  assert.equal(r.date_reponse, null);
  assert.equal(r.canal, null);
});

test('parseStatusLine — shortlist sans soumission', () => {
  const r = parseStatusLine('Shortlist 2026-04-08. Data Software Engineer, Python. Canal : Teamtailor.');
  assert.equal(r.statut, 'shortlist');
  assert.equal(r.date_shortlist, '2026-04-08');
  assert.equal(r.canal, 'Teamtailor');
  assert.equal(r.date_soumission, null);
});

test('parseStatusLine — classée sans suite', () => {
  const r = parseStatusLine('Soumise le 2026-04-03. Statut : classée sans suite le 2026-06-16 (relance sans réponse). Senior SE.');
  assert.equal(r.statut, 'classée sans suite');
  assert.equal(r.date_reponse, '2026-06-16');
});

test('parseStatusLine — en attente', () => {
  const r = parseStatusLine('Soumise le 2026-06-18 via Lever (canal direct). Statut : en attente.');
  assert.equal(r.statut, 'en attente');
  assert.equal(r.canal, 'Lever (canal direct)');
});

test('parseStatusLine — soumise sans statut explicite', () => {
  const r = parseStatusLine('Soumise le 2026-04-06 via Workable. Software Engineer MLOps.');
  assert.equal(r.statut, 'soumise');
  assert.equal(r.canal, 'Workable');
});

test('parseStatusLine — prospect sans soumission ni statut', () => {
  const r = parseStatusLine('2026-06-16. Senior Backend Developer Python/Django. Via LinkedIn.');
  assert.equal(r.statut, null);
  assert.equal(r.date_soumission, null);
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `node --test test/classify.test.mjs`
Expected: FAIL, module introuvable.

- [ ] **Step 3: Implémenter `lib/classify.mjs`**

```javascript
// Classification des pages racine et parsing des lignes de statut candidature.
// Les regexes sont calées sur le format réel des paragraphes-index (relevé 2026-06-19).

export function slugify(s) {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function classifyRootChild(title) {
  const t = title.toLowerCase();
  if (t.startsWith('fiche candidat')) return 'fiche-candidat';
  if (t === 'recherches') return 'recherches';
  if (t === 'tendances') return 'tendances';
  if (t.startsWith('passations')) return 'passations';
  if (t === 'sites') return 'sites';
  if (t.includes('style cover letter')) return 'style';
  return 'candidature';
}

export function splitTitle(title) {
  const m = title.split(/\s*[—/]\s*/);
  return { entreprise: m[0].trim(), poste: (m.slice(1).join(' / ') || '').trim() };
}

const DATE = '(\\d{4}-\\d{2}-\\d{2})';

export function parseStatusLine(text) {
  const out = { statut: null, date_soumission: null, date_shortlist: null, date_reponse: null, canal: null, note: null };

  const soum = text.match(new RegExp(`Soumise le ${DATE}`));
  if (soum) out.date_soumission = soum[1];

  const shortlist = text.match(new RegExp(`Shortlist ${DATE}`));
  if (shortlist) out.date_shortlist = shortlist[1];

  // Canal : "via X." après une soumission, ou "Canal : X." pour une shortlist.
  const viaCanal = text.match(/\bvia ([^.]+?)(?:\.|$)/);
  const explicitCanal = text.match(/Canal\s*:\s*([^.\n]+)/);
  if (explicitCanal) out.canal = explicitCanal[1].trim();
  else if (viaCanal && out.date_soumission) out.canal = viaCanal[1].trim();

  // Statut : "Statut : VALEUR [le DATE] [(note)]."
  const st = text.match(new RegExp(`Statut\\s*:\\s*([^.(\\n]+?)(?:\\s+le ${DATE})?\\s*(\\([^)]*\\))?\\.`));
  if (st) {
    const raw = st[1].trim().toLowerCase();
    if (st[2]) out.date_reponse = st[2];
    if (st[3]) out.note = st[3];
    if (raw.startsWith('refus')) out.statut = 'refus';
    else if (raw.startsWith('classée sans suite') || raw.startsWith('classee sans suite')) out.statut = 'classée sans suite';
    else if (raw.startsWith('en attente')) out.statut = 'en attente';
    else if (raw.startsWith('retenue')) out.statut = 'retenue';
    else if (raw.startsWith('soumise')) out.statut = 'soumise';
    else out.statut = null;
    out.note = out.note || (raw.startsWith('refus') && raw !== 'refus' ? st[1].trim() : null);
  }

  if (!out.statut) {
    if (out.date_soumission) out.statut = 'soumise';
    else if (out.date_shortlist) out.statut = 'shortlist';
  }
  return out;
}
```

- [ ] **Step 4: Lancer le test, ajuster les regexes jusqu'au succès**

Run: `node --test test/classify.test.mjs`
Expected: PASS (10 tests). Si un cas de `parseStatusLine` échoue, ajuster les regexes (notamment la capture du canal `via ...` qui doit s'arrêter au premier point, et le groupe optionnel `le DATE`) sans modifier les assertions ni le vocabulaire de statut autorisé.

- [ ] **Step 5: Commit**

```bash
git add tools/notion-export/lib/classify.mjs tools/notion-export/test/classify.test.mjs
git commit -m "✨ classification des pages et parsing du statut candidature"
```

---

### Task 3: Orchestrateur d'export vers l'arborescence locale

Keystone : intègre le Lecteur (Task 1) et la Classification (Task 2). Le helper `frontmatter.mjs` (trivial, deux tests) est bundlé ici parce que seul l'orchestrateur le consomme. La revue de fin de tâche est la première qui voit les modules s'assembler, et l'ordre de flush dans la boucle est le point à vérifier.

**Files:**
- Create: `tools/notion-export/lib/frontmatter.mjs`
- Create: `tools/notion-export/lib/export-tree.mjs`
- Test: `tools/notion-export/test/frontmatter.test.mjs`
- Test: `tools/notion-export/test/export-tree.test.mjs`

**Interfaces:**
- Consumes: `listChildren`, `notionGet` (`./client.mjs`), `blocksToMarkdown` (`./markdown.mjs`), `classifyRootChild`, `splitTitle`, `parseStatusLine`, `slugify` (`./classify.mjs`).
- Produces:
  - `toFrontmatter(obj) -> string` (`./frontmatter.mjs`) : bloc YAML `---\nkey: value\n---\n`, ignore les clés `null`/`undefined`, ne met pas de guillemets sauf si la valeur contient `:` ou commence par un caractère réservé.
  - `exportTree({ rootId, outDir, token, fetch, write, dateStr }) -> Promise<Report>` (`./export-tree.mjs`). `write(relPath, content)` est injecté (écriture fichier réelle en prod, capture en mémoire dans les tests). `Report = { counts: {...}, aTrier: string[], ecarts: string[] }`.

- [ ] **Step 1: Écrire le test de `frontmatter` (échec attendu)**

`test/frontmatter.test.mjs` :

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toFrontmatter } from '../lib/frontmatter.mjs';

test('rend les clés non nulles, ignore les nulles', () => {
  const fm = toFrontmatter({ entreprise: 'Mirakl', poste: 'Senior AI', statut: 'refus', date_reponse: null });
  assert.equal(fm, '---\nentreprise: Mirakl\nposte: Senior AI\nstatut: refus\n---\n');
});

test('met des guillemets quand la valeur contient deux-points', () => {
  const fm = toFrontmatter({ titre: 'a: b' });
  assert.equal(fm, '---\ntitre: "a: b"\n---\n');
});
```

- [ ] **Step 2: Lancer, vérifier l'échec, implémenter `lib/frontmatter.mjs`**

Run: `node --test test/frontmatter.test.mjs` → FAIL (module introuvable).

```javascript
// Sérialise un objet plat en bloc frontmatter YAML. Ignore les valeurs null/undefined.
export function toFrontmatter(obj) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    const s = String(v);
    const needsQuote = /[:#]|^[\s>|&*!?{}\[\]]/.test(s);
    lines.push(`${k}: ${needsQuote ? `"${s.replace(/"/g, '\\"')}"` : s}`);
  }
  lines.push('---', '');
  return lines.join('\n');
}
```

Run: `node --test test/frontmatter.test.mjs` → PASS (2 tests).

- [ ] **Step 3: Écrire le test de l'orchestrateur (échec attendu)**

`test/export-tree.test.mjs` construit un faux arbre Notion via un `fetch` stub indexé par id de bloc, et un `write` qui capture dans une `Map`. Il vérifie le routage des fichiers et le frontmatter.

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exportTree } from '../lib/export-tree.mjs';

const rt = (s) => [{ type: 'text', plain_text: s, annotations: {} }];
const page = (id, title, has_children = false) => ({ id, type: 'child_page', has_children, child_page: { title } });
const para = (id, s) => ({ id, type: 'paragraph', has_children: false, paragraph: { rich_text: rt(s) } });
const h1 = (id, s) => ({ id, type: 'heading_1', has_children: false, heading_1: { rich_text: rt(s) } });

// Arbre : racine -> [intro, Fiche candidat, Recherches, Tendances, Passations, Sites,
//   H1 Situation, situation-para, H1 Candidatures, Mirakl + index]
const TREE = {
  root: [
    para('i', 'Hub.'),
    page('fc', 'Fiche candidat - David Allouche', true),
    page('re', 'Recherches', true),
    page('te', 'Tendances', true),
    page('pa', 'Passations Recherche d’emploi', true),
    page('si', 'Sites', true),
    h1('hs', 'Situation'),
    para('sp', 'Pipeline en cours.'),
    h1('hc', 'Candidatures'),
    page('mk', 'Mirakl — Senior AI Agent Engineer', true),
    para('mki', 'Soumise le 2026-04-09 via Greenhouse mirakllabs. Statut : refus le 2026-04-13. Senior AI Agent Engineer.'),
  ],
  fc: [para('fcp', 'Profil David.')],
  re: [page('re1', 'Platform Engineer — Assurtech — 2026-04-02', true)],
  re1: [para('re1p', 'Note de recherche.')],
  te: [para('tep', 'Tendance marché.')],
  pa: [page('pa1', '2026-03-22 08:08 — Candidature Pigment', true)],
  pa1: [para('pa1p', 'Passation.')],
  si: [page('si1', 'Greenhouse', true)],
  si1: [para('si1p', 'Fiche ATS Greenhouse.')],
  mk: [para('mkp', 'Senior AI Agent Engineer, Paris. Métadonnées.')],
};

function stub() {
  const fetch = async (url) => {
    const m = url.match(/\/blocks\/([^/]+)\/children/);
    const id = m[1];
    return { ok: true, status: 200, json: async () => ({ results: TREE[id] || [], has_more: false, next_cursor: null }) };
  };
  const files = new Map();
  const write = async (rel, content) => { files.set(rel, content); };
  return { fetch, write, files };
}

test('exportTree route chaque page vers le bon fichier', async () => {
  const { fetch, write, files } = stub();
  const report = await exportTree({ rootId: 'root', outDir: '', token: 't', fetch, write, dateStr: '2026-06-19' });

  assert.ok(files.has('fiche-candidat.md'));
  assert.ok(files.has('tendances.md'));
  assert.ok(!files.has('situation.md'), 'la section Situation n’est pas exportée');
  assert.ok([...files.keys()].some((k) => k.startsWith('recherches/')));
  assert.ok([...files.keys()].some((k) => k.startsWith('sites/')));
  assert.ok([...files.keys()].some((k) => k.startsWith('Archive/passations/')));

  // Candidature Mirakl : dossier daté + README avec frontmatter statut.
  const readme = [...files.entries()].find(([k]) => k.startsWith('candidatures/') && k.endsWith('README.md'));
  assert.ok(readme, 'README candidature présent');
  assert.match(readme[0], /candidatures\/2026-04-09-mirakl\/README\.md/);
  assert.match(readme[1], /^---\n/);
  assert.match(readme[1], /statut: refus/);
  assert.match(readme[1], /entreprise: Mirakl/);
  assert.match(readme[1], /canal: Greenhouse mirakllabs/);

  assert.equal(report.counts.candidatures, 1);
  assert.equal(report.counts.passations, 1);
  assert.equal(report.counts.sites, 1);
  assert.equal(report.counts.recherches, 1);
});

test('exportTree range les paragraphes orphelins dans _a-trier', async () => {
  const { fetch, write, files } = stub();
  TREE.root.push(para('orph', '2026-06-16. Prospect sans page. Via LinkedIn.'));
  await exportTree({ rootId: 'root', outDir: '', token: 't', fetch, write, dateStr: '2026-06-19' });
  TREE.root.pop();
  assert.ok(files.has('candidatures/_a-trier.md'));
  assert.match(files.get('candidatures/_a-trier.md'), /Prospect sans page/);
});
```

- [ ] **Step 4: Lancer, vérifier l'échec**

Run: `node --test test/export-tree.test.mjs`
Expected: FAIL, `Cannot find module '../lib/export-tree.mjs'`.

- [ ] **Step 5: Implémenter `lib/export-tree.mjs`**

```javascript
// Orchestrateur : parcourt l'arbre depuis rootId, classe chaque page racine,
// apparie chaque candidature avec son paragraphe-index, écrit les fichiers via
// write(relPath, content). Ne fait transiter aucun contenu par la sortie agent.
import { listChildren } from './client.mjs';
import { blocksToMarkdown } from './markdown.mjs';
import { classifyRootChild, splitTitle, parseStatusLine, slugify } from './classify.mjs';
import { toFrontmatter } from './frontmatter.mjs';

const plain = (rt = []) => rt.map((t) => t.plain_text).join('');

async function pageMarkdown(pageId, ctx) {
  const blocks = await listChildren(pageId, ctx);
  return blocksToMarkdown(blocks, ctx);
}

// Écrit une page "simple" (contenu + sous-pages éventuelles en fichiers frères).
async function writeSimplePage(pageId, relPath, ctx, write) {
  const { markdown, childPages } = await pageMarkdown(pageId, ctx);
  await write(relPath, markdown);
  return childPages;
}

export async function exportTree({ rootId, outDir, token, fetch, write, dateStr }) {
  const ctx = { token, fetch, depth: 0 };
  const counts = { candidatures: 0, passations: 0, sites: 0, recherches: 0, styles: 0 };
  const aTrier = [];
  const ecarts = [];

  const top = await listChildren(rootId, ctx);

  // Découpe la racine : sections spéciales et candidatures (page + paragraphe-index
  // qui suit). La section Situation n'est pas exportée : elle est redondante avec le
  // statut de chaque offre (frontmatter) et l'historique git.
  let pendingCandidate = null;

  const flushCandidate = async () => {
    if (!pendingCandidate) return;
    const { page, indexText } = pendingCandidate;
    const { entreprise, poste } = splitTitle(page.child_page.title);
    const st = indexText ? parseStatusLine(indexText) : {};
    const date = st.date_soumission || st.date_shortlist || dateStr;
    const slug = `${date}-${slugify(entreprise)}`;
    const dir = `candidatures/${slug}`;
    const fm = toFrontmatter({
      entreprise, poste,
      statut: st.statut || 'à trier',
      date_shortlist: st.date_shortlist, date_soumission: st.date_soumission, date_reponse: st.date_reponse,
      canal: st.canal,
    });
    const body = await pageMarkdown(page.id, ctx);
    await write(`${dir}/README.md`, `${fm}\n${indexText ? indexText + '\n\n' : ''}${body.markdown}`);
    // Sous-pages de la candidature (Lettre de motivation, Questions formulaire).
    for (const cp of body.childPages) {
      const sub = await pageMarkdown(cp.id, ctx);
      await write(`${dir}/${slugify(cp.title)}.md`, `# ${cp.title}\n\n${sub.markdown}`);
    }
    if (!st.statut) ecarts.push(`Statut non parsé : ${page.child_page.title}`);
    counts.candidatures++;
    pendingCandidate = null;
  };

  for (const b of top) {
    if (b.type === 'heading_1') {
      await flushCandidate(); // borne de section : H1 Situation, H1 Candidatures
      continue;
    }
    if (b.type === 'child_page') {
      const kind = classifyRootChild(b.child_page.title);
      if (kind === 'candidature') {
        await flushCandidate();
        pendingCandidate = { page: b, indexText: null };
        continue;
      }
      // Section spéciale : on vide une candidature en attente puis on traite.
      await flushCandidate();
      if (kind === 'fiche-candidat') {
        const cps = await writeSimplePage(b.id, 'fiche-candidat.md', ctx, write);
        for (const cp of cps) { const s = await pageMarkdown(cp.id, ctx); await write(`ressources/${slugify(cp.title)}.md`, s.markdown); counts.styles++; }
      } else if (kind === 'tendances') {
        await writeSimplePage(b.id, 'tendances.md', ctx, write);
      } else if (kind === 'style') {
        await writeSimplePage(b.id, `ressources/${slugify(b.child_page.title)}.md`, ctx, write); counts.styles++;
      } else if (kind === 'recherches' || kind === 'sites' || kind === 'passations') {
        const sub = await listChildren(b.id, ctx);
        const dirByKind = { recherches: 'recherches', sites: 'sites', passations: 'Archive/passations' };
        for (const child of sub.filter((x) => x.type === 'child_page')) {
          const md = await pageMarkdown(child.id, ctx);
          await write(`${dirByKind[kind]}/${slugify(child.child_page.title)}.md`, `# ${child.child_page.title}\n\n${md.markdown}`);
          counts[kind === 'passations' ? 'passations' : kind]++;
        }
      }
      continue;
    }
    if (b.type === 'paragraph') {
      const text = plain(b.paragraph.rich_text);
      if (pendingCandidate && pendingCandidate.indexText === null) {
        pendingCandidate.indexText = text; // premier paragraphe après la page = index
        continue;
      }
      if (pendingCandidate && text.trim()) aTrier.push(text); // prospect orphelin
      continue; // tout autre paragraphe (dont la section Situation) est ignoré
    }
  }
  await flushCandidate();

  // candidatures/_a-trier.md
  if (aTrier.length) {
    await write('candidatures/_a-trier.md', `# Prospects à trier manuellement\n\n${aTrier.map((t) => `- ${t}`).join('\n')}\n`);
  }

  return { counts, aTrier, ecarts };
}
```

- [ ] **Step 6: Lancer le test, ajuster jusqu'au succès**

Run: `node --test test/export-tree.test.mjs`
Expected: PASS (2 tests). Si le routage d'un fichier échoue, vérifier l'ordre de traitement dans la boucle (flush de la candidature en attente avant chaque nouvelle section ou H1) sans modifier les assertions.

- [ ] **Step 7: Lancer toute la suite**

Run: `node --test test/*.test.mjs`
Expected: PASS (toutes les tâches 1 à 3).

- [ ] **Step 8: Commit**

```bash
git add tools/notion-export/lib/frontmatter.mjs tools/notion-export/lib/export-tree.mjs tools/notion-export/test/frontmatter.test.mjs tools/notion-export/test/export-tree.test.mjs
git commit -m "✨ orchestrateur d'export de l'arbre Notion vers fichiers locaux"
```

---

### Task 4: Point d'entrée CLI, run réel et vérification scriptée

Seule tâche à effets de bord : appel réseau réel à `api.notion.com` (hors sandbox) et écriture dans le repo privé `Emploi`. Le Step 6 est un spot-check humain. À traiter comme un checkpoint manuel à part entière, pas comme une transcription : c'est le moment où David valide la cohérence des statuts avant que les données soient committées.

**Files:**
- Create: `tools/notion-export/run.mjs`
- Create: `tools/notion-export/verify.mjs`
- Modify: `/Users/david/code/Emploi/.gitignore` (créer)
- Create: tout `Emploi/` (sortie de l'export, repo privé)

**Interfaces:**
- Consumes: `exportTree` (`./lib/export-tree.mjs`), `loadToken` (`./lib/client.mjs`), `listChildren`.
- `run.mjs` : lit `rootId` (arg 1 ou défaut `candidature_root`), `outDir` (arg 2, requis), construit `write` à partir de `node:fs` (crée les dossiers parents), appelle `exportTree`, imprime le `Report` (compteurs + écarts + nombre d'items à trier), pas le contenu.
- `verify.mjs` : recompte les `child_page` Notion par catégorie et les fichiers produits, vérifie le frontmatter `statut` sur chaque `candidatures/*/README.md`, imprime un tableau de réconciliation.

- [ ] **Step 1: Implémenter `run.mjs`**

```javascript
// Point d'entrée : node run.mjs [rootId] <outDir>. Écrit l'arbre exporté sous outDir.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { loadToken } from './lib/client.mjs';
import { exportTree } from './lib/export-tree.mjs';

const DEFAULT_ROOT = '32fec6ce980181558099fd4f5ac9ed46';
const args = process.argv.slice(2);
const rootId = args.length > 1 ? args[0] : DEFAULT_ROOT;
const outDir = args.length > 1 ? args[1] : args[0];
if (!outDir) {
  console.error('Usage : node run.mjs [rootId] <outDir>');
  process.exit(1);
}

const token = loadToken();
const write = async (rel, content) => {
  const abs = join(outDir, rel);
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, content, 'utf8');
};
// dateStr : passé en argument d'environnement pour rester déterministe et testable.
const dateStr = process.env.MIGRATION_DATE || new Date().toISOString().slice(0, 10);
const report = await exportTree({ rootId, outDir, token, fetch: globalThis.fetch, write, dateStr });
console.log('Compteurs :', JSON.stringify(report.counts));
console.log('À trier (prospects orphelins) :', report.aTrier.length);
console.log('Écarts (statut non parsé) :', report.ecarts.length);
for (const e of report.ecarts) console.log('  -', e);
```

- [ ] **Step 2: Créer le `.gitignore` d'`Emploi`**

Fichier `/Users/david/code/Emploi/.gitignore` :

```
tmp/
.DS_Store
*.swp
```

- [ ] **Step 3: Lancer l'export réel vers `Emploi`**

Run (depuis `tools/notion-export/`, hors sandbox réseau car appelle `api.notion.com`) :
```bash
MIGRATION_DATE=2026-06-19 node run.mjs /Users/david/code/Emploi
```
Expected : affiche les compteurs (candidatures ≈ 29, passations 38, sites 15, recherches 6, styles 2), la liste des écarts éventuels, et le nombre de prospects à trier. Aucun contenu de page n'est imprimé.

- [ ] **Step 4: Implémenter `verify.mjs`**

```javascript
// Vérification scriptée : recompte Notion vs fichiers, contrôle le frontmatter statut.
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { loadToken, listChildren } from './lib/client.mjs';
import { classifyRootChild } from './lib/classify.mjs';

const DEFAULT_ROOT = '32fec6ce980181558099fd4f5ac9ed46';
const [rootArg, outArg] = process.argv.slice(2);
const rootId = outArg ? rootArg : DEFAULT_ROOT;
const outDir = outArg || rootArg;
const token = loadToken();

async function countFiles(dir, pred = () => true) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    let n = 0;
    for (const e of entries) if (pred(e)) n++;
    return n;
  } catch { return 0; }
}

const top = await listChildren(rootId, { token, fetch: globalThis.fetch });
const notion = { candidature: 0, passations: 0, sites: 0, recherches: 0, style: 0 };
for (const b of top) {
  if (b.type !== 'child_page') continue;
  const kind = classifyRootChild(b.child_page.title);
  if (kind === 'candidature') notion.candidature++;
  else if (kind === 'style') notion.style++;
}
// sous-pages des sections
const sub = async (title) => {
  const p = top.find((b) => b.type === 'child_page' && classifyRootChild(b.child_page.title) === title);
  if (!p) return 0;
  return (await listChildren(p.id, { token, fetch: globalThis.fetch })).filter((x) => x.type === 'child_page').length;
};
notion.passations = await sub('passations');
notion.sites = await sub('sites');
notion.recherches = await sub('recherches');

const candDir = join(outDir, 'candidatures');
const candDirs = (await readdir(candDir, { withFileTypes: true })).filter((e) => e.isDirectory());
let sansStatut = [];
for (const d of candDirs) {
  const readme = await readFile(join(candDir, d.name, 'README.md'), 'utf8').catch(() => '');
  if (!/^statut:\s*\S/m.test(readme)) sansStatut.push(d.name);
}

console.log('Notion (racine) :', JSON.stringify(notion));
console.log('Fichiers : candidatures =', candDirs.length,
  '| passations =', await countFiles(join(outDir, 'Archive/passations')),
  '| sites =', await countFiles(join(outDir, 'sites')),
  '| recherches =', await countFiles(join(outDir, 'recherches')));
console.log('Candidatures sans frontmatter statut :', sansStatut.length, sansStatut);
const ok = sansStatut.length === 0
  && (await countFiles(join(outDir, 'Archive/passations'))) === notion.passations
  && (await countFiles(join(outDir, 'sites'))) === notion.sites
  && (await countFiles(join(outDir, 'recherches'))) === notion.recherches;
console.log(ok ? 'VÉRIFICATION OK' : 'VÉRIFICATION : écarts à examiner');
process.exit(ok ? 0 : 1);
```

- [ ] **Step 5: Lancer la vérification**

Run (hors sandbox réseau) :
```bash
node verify.mjs /Users/david/code/Emploi
```
Expected : `VÉRIFICATION OK`. Si écarts, examiner les `_a-trier.md` et les candidatures sans statut, corriger le parsing (Task 2) ou trier à la main, puis relancer `run.mjs` et `verify.mjs`.

- [ ] **Step 6: Spot-check manuel léger**

Run :
```bash
ls /Users/david/code/Emploi/candidatures | head
head -15 /Users/david/code/Emploi/candidatures/2026-04-09-mirakl/README.md
head -3 /Users/david/code/Emploi/fiche-candidat.md
```
Expected : dossier Mirakl avec frontmatter `statut: refus`, `fiche-candidat.md` non vide, et aucun `situation.md`. Vérifier la cohérence des statuts avec la racine Notion (Ornikar en attente, vague de refus du 2026-06-10).

- [ ] **Step 7: Commit de l'outil dans `candidature`**

```bash
git add tools/notion-export/run.mjs tools/notion-export/verify.mjs
git commit -m "✨ CLI d'export et vérification scriptée de la migration Notion"
```

- [ ] **Step 8: Commit des données dans `Emploi`**

```bash
git -C /Users/david/code/Emploi add -A
git -C /Users/david/code/Emploi commit -m "Migration des données Notion vers l'arborescence locale (Phase 1)"
```

---

### Task 5: Correctifs Notion → backlog `candidature/TODO.md`

À exécuter inline dans la session principale, pas via un sous-agent de code. La tâche demande un id à David (Step 1), lit un brouillon, et exerce du jugement sur ce qui est déjà implémenté. C'est de la curation interactive, dispatcher un sous-agent de code serait un contresens.

**Files:**
- Modify: `/Users/david/code/candidature/TODO.md`

**Interfaces:** aucune (curation manuelle assistée).

Les pages *Correctifs* (patches de comportement du skill, numérotés D-NN) ne sont pas sous `candidature_root` : le recensement de la racine ne les a pas listées. Cette tâche est une curation manuelle, pas du scripté.

- [ ] **Step 1: Localiser la page Correctifs**

Demander à David l'id de la page *Correctifs* (ou la chercher via le MCP Notion `notion-search` "Correctifs"). Si la page est sous une autre racine, récupérer son id.

- [ ] **Step 2: Exporter son contenu en brouillon**

Run (hors sandbox réseau, `<id>` = id de la page Correctifs) :
```bash
MIGRATION_DATE=2026-06-19 node tools/notion-export/run.mjs <id> /Users/david/code/candidature/tmp/correctifs-export
```
Le brouillon atterrit dans `tmp/` (ignoré par git, pas de fuite dans le repo public).

- [ ] **Step 3: Trier vers `TODO.md`**

Lire le brouillon. Pour chaque correctif D-NN : s'il est déjà implémenté dans le skill (vérifier dans `src/`), le jeter ; s'il est en suspens, l'ajouter comme entrée de `candidature/TODO.md` sous une section `### Correctifs migrés depuis Notion`, en prose, sans gras ni tiret cadratin (règles de prose du repo). Ne pas copier le contenu Notion verbatim.

- [ ] **Step 4: Mettre à jour l'entrée obsolète de `TODO.md`**

L'entrée existante « Migration BDD Notion vers pages imbriquées » décrit l'ancien modèle BDD. La remplacer par un pointeur vers ce chantier (migration vers fichiers locaux livrée en Phase 1), ou la retirer si caduque.

- [ ] **Step 5: Commit**

```bash
git add TODO.md
git commit -m "📝 correctifs Notion triés vers le backlog local"
```

---

## Self-Review

**Couverture du spec :**
- Migration de l'arbre vers `Emploi/` : Tasks 3-4 (orchestrateur + run réel).
- Config locale (`Emploi/CLAUDE.md`) : hors Phase 1. Le spec la liste dans le périmètre global, mais c'est de la rédaction de config, pas de la migration de données scriptée. À traiter en fin de Phase 1 ou début de Phase 2 (note ci-dessous).
- Correctifs → `candidature/` : Task 5.
- Nommage `AAAA-MM-JJ-slug` : `flushCandidate` (Task 3), date = soumission ou shortlist.
- Frontmatter candidature : `toFrontmatter` + `parseStatusLine` (Tasks 2-3). Les champs `lieu`, `remote`, `source`, `poste` ne sont pas tous parsables de façon fiable depuis la ligne d'index ; `entreprise`, `poste`, `statut`, dates et `canal` le sont. Les champs non parsés sont simplement absents du frontmatter, le corps garde le texte source. C'est conforme à « choisir une source de vérité et signaler les écarts » : `ecarts` collecte les statuts non parsés.
- Vérification scriptée (compte, frontmatter, spot-check) : Task 4.
- Variante de repli (export natif Notion) : non implémentée, car le recensement montre un jeu de types de blocs borné et géré intégralement par la Task 1 (partie C). Le filet `<!-- bloc non géré -->` signalerait tout type imprévu.
- Passations migrées en `Archive/passations/` figées : Task 3 (branche `passations`).
- Mention ajoutée : le spec liste `Emploi/CLAUDE.md` et la mise à jour de `Emploi/CLAUDE.local.md` dans le périmètre. Ce sont des fichiers de config rédigés à la main (conventions locales, pointeurs), pas un produit de l'export. Recommandation : les rédiger comme dernière étape manuelle après vérification, ou les rattacher au plan de Phase 2 (bascule du skill), qui définit comment le skill lit ces fichiers. À confirmer avec David avant exécution.

**Scan placeholder :** aucun TBD/TODO dans le code des tâches. Le `<!-- bloc non géré -->` est un comportement défensif explicite, pas un placeholder. La regex de canal et la jointure markdown ont des steps d'ajustement bornés contre des assertions exactes.

**Cohérence des types :** `exportTree({ rootId, outDir, token, fetch, write, dateStr })` cohérent entre Task 3 (définition), Task 3 tests, et Task 4 (`run.mjs`). `blocksToMarkdown(blocks, ctx) -> { markdown, childPages }` cohérent entre Task 1 (partie C) et Task 3. `parseStatusLine -> { statut, date_soumission, date_shortlist, date_reponse, canal, note }` cohérent entre Task 2 et Task 3. `listChildren`/`notionGet` signature `(id, { token, fetch })` cohérente partout. `loadToken` ré-exporté par `client.mjs` et importé par `run.mjs`/`verify.mjs`.

**Lacune connue, hors périmètre Phase 1 :** la rédaction d'`Emploi/CLAUDE.md` et la bascule du skill sont la Phase 2, qui aura son propre plan (le spec le dit explicitement).
