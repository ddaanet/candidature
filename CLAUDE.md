# Agent Instructions

## About This Repo

A standalone Claude.ai skill (markdown files) for assisted job applications.
Target audience: non-technical users. The skill content is the product.

- `SKILL.md` — Workflow complet (4 phases). Lu en mode dev.
- `VERSION` — Version courante. Écrit par `build/build.sh --release`.
- `build/dispatcher.md` — Dispatcher installé comme SKILL.md dans le
  `.skill`. Aiguille vers la bonne source selon le mode.
- `build/build.sh` — Assemblage du `.skill` et release GitHub.
- `DESIGN.md` — Design decisions and grounding audit
- `references/` — Supporting documents
- `README.md` — Installation guide

## Build

`./build/build.sh` assemble le `.skill` dans `dist/`. Le `.skill` contient :

- Le dispatcher (`build/dispatcher.md`) comme `SKILL.md`
- Le workflow (`SKILL.md` sans frontmatter) comme `references/workflow.md`
- `VERSION`
- Tous les fichiers de `references/`

`./build/build.sh --release 1.0.0` : écrit VERSION, commite, tague,
crée une release GitHub avec le `.skill` en asset.

Le repo source ne change pas : `SKILL.md` reste le workflow complet.
Le dispatcher n'existe que dans le build output.

### Deux modes d'utilisation

- **Normal** — Le `.skill` installé utilise le workflow bundlé. Au
  démarrage, compare la version installée avec la dernière release
  GitHub. Si une mise à jour est disponible, propose un lien.
- **Dev** — Le dispatcher lit le SKILL.md du repo local via MCP
  Filesystem. Pas de check de version.

Le mode se configure via la mémoire projet
(`candidature: mode dev — <chemin>`). Le skill gère le changement
de mode lui-même.

## Prose Quality

- State information directly — no hedging, framing, or preamble
- Reference, never recap — assume the reader has context
- Let results speak — no framing around visible output
- Commit to answers — no hedging qualifiers

All skill content is in French. Use natural French — no anglicisms where
a common French equivalent exists. Exception: terms without common equivalents
(commit, widget, markdown).

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
