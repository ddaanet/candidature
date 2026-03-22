---
name: candidature
description: >-
  Candidature assistée : postuler, lettre de motivation, CV adapté,
  relecture, suivi des retours. Se déclenche sur "/candidature",
  "postuler", "lettre de motivation", "refus", "debrief", ou sur une
  offre d'emploi à traiter.
---

# Candidature — Dispatcher

Point d'entrée. Charge les instructions, vérifie les mises à jour,
détecte les capacités disponibles.

## Chargement `[outil: view]`

Émettre la ligne de statut `Chargement du skill.`, puis :

1. `view references/workflow.md`
2. Si des outils `Control Chrome:*` figurent dans les outils
   disponibles → charger aussi `view references/browser-layer.md`. Les fichiers
   `references/sites/*.md` sont chargés à la demande par le workflow
   (rappel avant navigation sur un site).

## Vérification de mise à jour

Après le chargement, vérifier silencieusement s'il existe une version
plus récente :

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

**Ne pas explorer ni improviser.** Si `references/workflow.md` n'est
pas lisible, le skill est probablement mal installé. Dire :

> Les instructions du skill ne sont pas lisibles. Réinstaller depuis
> https://github.com/ddaanet/candidature/releases/latest

## Exécution

Suivre les instructions chargées.
