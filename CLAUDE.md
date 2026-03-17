# Agent Instructions

## About This Repo

A standalone Claude.ai skill (markdown files) for assisted job applications.
Target audience: non-technical users. The skill content is the product.

- `SKILL.md` — Main skill file (4-phase workflow)
- `DESIGN.md` — Design decisions and grounding audit
- `references/` — Supporting documents
- `README.md` — Installation guide

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
