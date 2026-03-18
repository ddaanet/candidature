---
name: candidature
description: >-
  Candidature assistée : postuler, lettre de motivation, CV adapté,
  relecture, suivi des retours. Se déclenche sur "/candidature",
  "postuler", "lettre de motivation", "refus", "debrief", ou sur une
  offre d'emploi à traiter.
---

# Candidature — Dispatcher

Point d'entrée. Charge les instructions, vérifie les mises à jour.

## Changement de mode

Si l'utilisateur demande à changer de mode ("mode dev", "mode normal"),
modifier la mémoire (`memory_user_edits`) et s'arrêter.

- **normal** — supprimer l'entrée mémoire `candidature: mode ...`.
- **dev** — demander le chemin si non précisé. Avant d'écrire, vérifier
  que le SKILL.md existe : `Filesystem:read_text_file path=<chemin>/SKILL.md`
  (head 5 suffit). Valider : doit contenir `Mot magique: ddaanet/candidature`.
  Si absent → erreur dev (voir §Erreurs). Ne pas écrire en mémoire tant
  que non validé. Format : `candidature: mode dev — <chemin absolu>`.

## Chargement `[outil: memory_user_edits view]`

Lire la mémoire. Chercher `candidature: mode`. Émettre **uniquement** la
ligne de statut (pas de narration), puis charger :

| Mémoire | Statut | Source |
|---------|--------|--------|
| aucune | `Chargement du skill.` | `view references/workflow.md` |
| `mode dev — <path>` | `Chargement du skill, mode dev: <path>.` | `Filesystem:read_text_file path=<path>/SKILL.md` |

Références : même source que le workflow (bundlées / `<path>/references/`).

## Vérification de mise à jour (mode normal uniquement)

Après le chargement en mode normal, vérifier silencieusement s'il existe
une version plus récente :

1. Lire la version bundlée dans `references/workflow.md` (ligne
   `Version: X.Y.Z`).
2. `web_fetch` sur `https://raw.githubusercontent.com/ddaanet/candidature/main/VERSION`
3. Comparer les deux versions.

Si la version distante est plus récente, **après** avoir traité la
demande de l'utilisateur, mentionner brièvement :

> Une mise à jour est disponible (X.Y.Z → A.B.C).
> Télécharger : https://github.com/ddaanet/candidature/releases/latest

Ne pas bloquer le travail pour une mise à jour. L'utilisateur décide
quand il installe.

Si le fetch échoue (pas de réseau, erreur GitHub), ignorer silencieusement.

## Erreurs de chargement

**Ne pas explorer ni improviser.**

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
