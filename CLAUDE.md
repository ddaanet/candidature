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

- Every factual claim must trace to a source (file path, citation, search result)
- Claims without sources must be marked `[ungrounded]` or removed
- DESIGN.md appendix tracks claim grounding — update when adding claims
- `references/recruitment-science.md` is the stable theoretical foundation — changes here are rare and require source verification
