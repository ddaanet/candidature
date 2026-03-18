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
  knowledge : `project_knowledge_search("ddaanet/candidature")`.
  Valider : le résultat doit contenir la phrase verbatim
  `Mot magique: ddaanet/candidature`. Si absente → erreur sync (voir
  §Erreurs). Ne pas écrire en mémoire tant que non validé.
- **dev** — demander le chemin si non précisé. Avant d'écrire, vérifier
  que le SKILL.md existe : `Filesystem:read_text_file path=<chemin>/SKILL.md`
  (head 20 suffit). Valider : doit contenir `Mot magique: ddaanet/candidature`.
  Si absent → erreur dev (voir §Erreurs). Ne pas écrire en mémoire tant
  que non validé.

## Chargement `[outil: memory_user_edits view]`

Lire la mémoire. Chercher `candidature: mode`. Émettre **uniquement** la
ligne de statut (pas de narration, pas de commentaire sur la mémoire),
puis charger :

| Mémoire | Statut | Source |
|---------|--------|--------|
| aucune | `Chargement du skill.` | `view references/workflow.md` |
| `mode sync` | `Chargement du skill, mode sync.` | `project_knowledge_search("ddaanet/candidature")` |
| `mode dev — <path>` | `Chargement du skill, mode dev: <path>.` | `Filesystem:read_text_file path=<path>/SKILL.md` |

Références : même source que le workflow (bundlées / project knowledge /
`<path>/references/`).

### Validation du chargement

Le résultat doit contenir la phrase verbatim `Mot magique: ddaanet/candidature`.
C'est le seul critère. Pas de match partiel, pas d'interprétation.

**Une seule recherche.** Si la phrase est absente du résultat, c'est une
erreur — ne pas reformuler la requête, ne pas chercher avec d'autres
mots, ne pas explorer. Passer directement à §Erreurs de chargement.

## Erreurs de chargement

**Ne pas explorer ni improviser.** Si la source n'est pas accessible ou
ne contient pas le mot magique, expliquer le problème et proposer de
continuer en mode normal.

### Mode sync — instructions non trouvées

Le repo GitHub n'est probablement pas importé dans le projet. Dire :

> Je ne trouve pas les instructions à jour. Pour activer le mode sync :
> 1. Dans le projet, cliquer **+** → **Depuis GitHub**
> 2. Coller `https://github.com/ddaanet/candidature`
> 3. Tout sélectionner et confirmer
>
> En attendant, je peux continuer avec la version installée. On fait ça ?

Si oui, charger `references/workflow.md` et continuer.

### Mode dev — instructions non trouvées

Le chemin est probablement incorrect, ou le connecteur fichiers n'est
pas actif. Dire :

> Je ne peux pas lire les instructions à `<path>`. Vérifier que :
> - Le chemin est correct ("mode dev" pour corriger)
> - Le connecteur fichiers (Filesystem) est connecté
>
> En attendant, je peux continuer avec la version installée. On fait ça ?

Si oui, charger `references/workflow.md` et continuer.

## Exécution

Suivre les instructions chargées.
