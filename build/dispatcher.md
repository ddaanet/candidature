---
name: candidature
description: >-
  Candidature assistée : postuler, lettre de motivation, CV adapté,
  relecture, suivi des retours. Se déclenche sur "/candidature",
  "postuler", "lettre de motivation", "refus", "debrief", ou sur une
  offre d'emploi à traiter.
---

# Candidature — Dispatcher

Point d'entrée. Charge les instructions depuis la source appropriée.

## Changement de mode

Si l'utilisateur demande à changer de mode ("mode dev", "mode sync",
"mode normal"), **valider d'abord**, puis modifier la mémoire
(`memory_user_edits`) et s'arrêter.

- **normal** — supprimer l'entrée mémoire. Pas de validation nécessaire.
- **sync** — avant d'écrire, vérifier que le workflow est dans le project
  knowledge : `project_knowledge_search("workflow candidature phases")`.
  Valider : le résultat doit contenir le marqueur `# Candidature —
  Workflow de candidature assistée`. Si absent → erreur sync (voir
  §Erreurs). Ne pas écrire en mémoire tant que non validé.
- **dev** — demander le chemin si non précisé. Avant d'écrire, vérifier
  que le SKILL.md existe : `Filesystem:read_text_file path=<chemin>/SKILL.md`
  (head 1 suffit). Si pas trouvé → erreur dev (voir §Erreurs). Ne pas
  écrire en mémoire tant que non validé.

## Chargement `[outil: memory_user_edits view]`

Lire la mémoire. Chercher `candidature: mode`. Émettre une seule ligne
de statut, puis charger :

| Mémoire | Statut | Source |
|---------|--------|--------|
| aucune | `Chargement du skill.` | `view references/workflow.md` |
| `mode sync` | `Chargement du skill, mode sync.` | `project_knowledge_search("workflow candidature phases")` |
| `mode dev — <path>` | `Chargement du skill, mode dev: <path>.` | `Filesystem:read_text_file path=<path>/SKILL.md` |

Références : même source que le workflow (bundlées / project knowledge /
`<path>/references/`).

### Validation du chargement

Le workflow commence par `# Candidature — Workflow de candidature
assistée`. Ce marqueur valide que le bon fichier a été chargé.

**Une seule recherche.** Si le marqueur est absent du résultat, c'est
une erreur — ne pas reformuler la requête, ne pas chercher avec d'autres
mots, ne pas explorer le project knowledge. Passer directement à
§Erreurs de chargement.

## Erreurs de chargement

**Ne pas explorer ni improviser.** Si la source configurée n'est pas
accessible ou ne contient pas le marqueur, expliquer le problème et
proposer de continuer en mode normal.

### Mode sync — workflow non trouvé dans le project knowledge

Le repo GitHub n'est probablement pas importé dans le projet. Expliquer :

> Le skill est configuré en mode sync, mais je ne trouve pas le workflow
> dans le project knowledge. Pour que ce mode fonctionne :
> 1. Dans le projet, cliquer **+** → **Depuis GitHub**
> 2. Coller `https://github.com/ddaanet/candidature`
> 3. Tout sélectionner et confirmer
>
> En attendant, je peux continuer avec le workflow bundlé (mode normal).

Si l'utilisateur accepte, charger `references/workflow.md` et continuer.

### Mode dev — SKILL.md non trouvé sur le filesystem

Le chemin du repo est probablement incorrect, ou le MCP Filesystem n'est
pas connecté. Expliquer :

> Le skill est configuré en mode dev (`<path>`), mais je ne peux pas
> lire le SKILL.md à cet emplacement. Vérifier que :
> - Le chemin est correct (mode dev pour corriger)
> - Le MCP Filesystem est connecté et autorise ce répertoire
>
> En attendant, je peux continuer avec le workflow bundlé (mode normal).

Si l'utilisateur accepte, charger `references/workflow.md` et continuer.

## Exécution

Suivre les instructions chargées.
