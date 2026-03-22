## Brief : Architecture hexagonale — ports stockage et git

2026-03-22

### Objectif

Découpler le workflow (`workflow.md`) des outils concrets. Le workflow
nomme des **capacités** (ports), le dispatcher branche les adaptateurs
selon les outils détectés dans le contexte.

### Décisions

- **Le workflow ne nomme plus d'outils.** Au lieu de `[outil: memory_user_edits]`,
  écrire `[stockage: observation site]`. Le dispatcher mappe.
- **Détection par capacités, pas par plateforme.** Ne pas penser
  "claude.ai vs Desktop" mais "quels outils sont connectés".
- **Filesystem est le seul discriminant local.** Chrome est disponible
  sur claude.ai web (beta). Drive, Notion, GitHub aussi. Seul Filesystem
  implique une installation locale (Desktop ou Claude Code).
- **Pas de fichier adaptateur par backend.** Le dispatcher contient une
  table de correspondance. Hexagonal pragmatique — on est en markdown
  lu par un LLM, l'indirection a un coût cognitif.

### Ports identifiés

| Port | Sémantique | Adaptateurs connus |
|------|-----------|-------------------|
| `stockage` | Persister une donnée structurée | memory_user_edits, Filesystem, Drive, Notion |
| `lecture-fichier` | Lire un fichier du candidat | view (bundlé), Filesystem, Drive |
| `navigation` | Interagir avec un site web | Chrome, "demander au candidat" |
| `archivage` | Stocker texte complet, CR détaillé | memory (condensé), Filesystem, Drive, Notion |
| `git` | Commit, push, release | Filesystem+osascript, GitHub MCP |

### Contraintes

- Le mapping doit être lisible par l'agent en une table — pas de
  logique conditionnelle complexe en prose
- Si un port n'a aucun adaptateur disponible, le workflow doit
  fonctionner en mode dégradé (ex: archivage → condensé en mémoire)
- Les adaptateurs non confirmés (GitHub MCP sur claude.ai web) sont
  documentés comme "non vérifié" — ne pas les inclure dans le
  dispatcher tant qu'ils ne sont pas testés
- Windows : pas de `osascript`. Le port `git` via Filesystem nécessite
  un adaptateur différent (PowerShell? pas prioritaire)

### Approches écartées

- **Détection web vs Desktop** — Abandonnée. Les connecteurs cloud
  (Chrome, Drive, Notion, GitHub) existent sur les deux. Seul Filesystem
  est discriminant.
- **Fichiers adaptateurs séparés** — Surdimensionné pour du markdown.
  Table dans le dispatcher.
- **Notion comme stockage principal** — À explorer mais pas prioritaire.
  La structure de données (pages, databases) est très différente de
  memory_user_edits. Nécessite un design spécifique.

### Contexte supplémentaire

Le terme "hexagonal" (Cockburn, 2005 — ports & adapters) a été retenu
pour l'intention architecturale : le workflow est le domaine, les outils
sont des adaptateurs interchangeables. La différence avec "modulaire"
est l'inversion de dépendance — le workflow ne connaît pas les outils.

Connecteurs confirmés sur claude.ai web : Chrome (beta), Google Drive,
Notion, Gmail, Google Calendar. GitHub : feature request ouverte
(anthropics/claude-code#29885, mars 2026), statut non vérifié.
