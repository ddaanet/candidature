# Agent Instructions

## About This Repo

A standalone Claude.ai skill (markdown files) for assisted job applications.
Target audience: non-technical users. The skill content is the product.

- `SKILL.md` — Workflow complet (4 phases). Lu en mode dev.
- `references/` — Documents de support (recrutement, CV, relecture...)
- `references/etayage.md` — Protocole d'audit (chargé après le draft).
- `references/browser-layer.md` — Couche navigateur (Chrome).
- `references/sites/` — Un fichier par plateforme ATS.
- `references/consolidation.md` — Processus de consolidation sites.
- `VERSION` — Version courante. Écrit par `build/build.sh --bump`.
- `build/dispatcher.md` — Dispatcher public (SKILL.md dans le `.skill`).
- `build/dev-stub.md` — Stub dev (charge depuis le repo local).
- `build/build.sh` — Assemblage des `.skill` et release GitHub.
- `DESIGN.md` — Design decisions and grounding audit
- `README.md` — Installation guide

## Build

`./build/build.sh` assemble deux `.skill` dans `dist/` :

- `candidature.skill` — dispatcher + workflow + toutes les références
  (browser-layer, consolidation, sites/). Seul artefact releasé.
- `candidature-dev.skill` — stub dev, charge depuis le repo local via
  Filesystem. Non releasé.

`./build/build.sh --bump minor` : incrémente VERSION, commite, tague,
crée une release GitHub avec `candidature.skill` uniquement.

Le repo source ne change pas : `SKILL.md` reste le workflow complet.
Le dispatcher n'existe que dans le build output.

### Deux skills d'utilisation

- **Public** (`candidature.skill`) — Workflow bundlé. Détecte Chrome
  et charge la couche navigateur si disponible. Vérifie les mises à
  jour au démarrage.
- **Dev** (`candidature-dev.skill`) — Stub minimal, charge le
  workflow depuis le repo local via Filesystem. Chemin configuré en
  mémoire projet (`candidature: dev — <chemin>`).

## Prose Quality

- State information directly, no hedging, framing, or preamble
- Reference, never recap. Assume the reader has context
- Let results speak, no framing around visible output
- Commit to answers, no hedging qualifiers

## Style Contamination

The style of every file in this repo contaminates the agent's output.
The agent writes like it reads. If the instructions use emdashes,
"**Label:** contenu" patterns, or bulleted fragments, the agent
reproduces these in letters, messages, and every generated text.

Rules for all skill content (SKILL.md, references/, DESIGN.md) :

- No emdashes or endashes. Use periods, commas, or restructure.
- No "**Label:** contenu" or "**Label.** contenu". Write prose.
  The agent copies the label pattern into generated text.
- No bulleted fragments as sentence substitutes. Write sentences.
- No semicolons. Rare in natural French or English writing.
- Examples and templates are the most dangerous vectors. The agent
  copies them verbatim. Every example must look like the desired
  output.

All skill content is in French. Use natural French — no anglicisms where
a common French equivalent exists. Exception: terms without common equivalents
(commit, widget, markdown).

## Branches

- `main` reçoit des livrables, pas des brouillons.
- `dev` pour le travail en cours, les explorations, les plans.
- Merge `dev → main` en `--no-ff` pour les livrables de plus d'un
  commit, avec un message de merge rédigé (pas le message par défaut).
  La friction est faible, le signal est élevé — si quelqu'un regarde
  l'historique, il voit des livrables nommés.
- Un commit unique peut aller directement sur `main`.

## Commit Messages

Gitmoji prefix. Short, dense messages focused on "why" not "what."
Chaque commit est une unité thématique cohérente, pas un découpage par
fichier. Un commit peut toucher plusieurs fichiers s'ils participent au
même changement logique.

Select the most specific emoji matching the commit's primary intent:

| Emoji | When |
|-------|------|
| 🎉 | Initial commit |
| ✨ | New feature or content section |
| 📝 | Documentation changes |
| ♻️ | Restructure without changing meaning |
| 🔥 | Remove content or files |
| 🐛 | Fix an error (factual, structural, reference) |
| 💡 | Improve clarity or phrasing |
| 🔍 | Add or update source references |
| 🌐 | Localization or translation |
| 🚚 | Move or rename files |
| 🔀 | Merge branches |

## Content Rules

- Every factual affirmation must trace to a source (file path, citation,
  search result)
- Affirmations without sources must be marked `[non étayé]` or removed
- DESIGN.md appendix tracks affirmation grounding — update when adding
  affirmations
- `references/recruitment-science.md` is the stable theoretical
  foundation — changes here are rare and require source verification

## Model Constraint

All modifications to SKILL.md, DESIGN.md, and references/*.md must be
redacted in an Opus session. Do not modify these files in Sonnet sessions
— the prose quality of agentic instructions requires Opus-level
attention.
