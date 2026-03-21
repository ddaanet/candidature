---
name: candidate-desktop
description: >-
  Couche navigateur pour le workflow candidature. Gère l'interaction avec
  les sites d'emploi (ATS, agrégateurs, sites carrière) depuis Claude
  Desktop. Se déclenche quand l'utilisateur veut soumettre une candidature
  via le navigateur, naviguer sur un site carrière, ou remplir un
  formulaire de candidature en ligne. Nécessite Claude in Chrome.
  Complémentaire au skill candidature (méthodologie) — ce skill ajoute
  l'exécution navigateur.
---

# candidate-desktop — Interaction navigateur pour les candidatures

Ce skill orchestre l'interaction avec les sites d'emploi via Claude in
Chrome. Il hérite de toute la méthodologie du skill `candidature`
(4 phases, étayage, relecture, Spence) et ajoute la couche d'exécution
navigateur.

## Prérequis

- Skill `candidature` installé (méthodologie)
- Claude in Chrome connecté
- MCP Filesystem connecté au repo (`~/code/candidature`)

## Cycle rappel → capture → consolidation

### Rappel (avant interaction site)

Avant de naviguer sur un site de candidature :

1. **Fichier de référence** — lire
   `desktop/references/sites/<plateforme>.md` (`view`). Contient les
   contraintes consolidées et les contournements validés.
2. **Mémoire projet** — consulter les entrées `site:` pour des
   observations récentes pas encore consolidées.

Si aucune source n'existe pour ce site : procéder avec prudence et
noter le nom pour la capture après soumission.

### Capture (après interaction site)

Après chaque soumission, demander au candidat :

> "Des difficultés avec le site de candidature ?"

Écriture obligatoire en mémoire projet (préfixe `site:`), même si le
candidat répond "non" ou "RAS". Si une entrée `site:` existe déjà pour
cette plateforme, la compléter (`replace`) plutôt que créer un doublon.

### Consolidation (périodique)

Quand 3+ entrées `site:` existent pour une même plateforme, ou quand
une observation est suffisamment validée par l'usage :

1. Lire les entrées `site:` concernées
2. Intégrer dans `desktop/references/sites/<plateforme>.md`
3. Supprimer les entrées consolidées de la mémoire projet

**Médium actuel :** transfert direct via MCP Filesystem (l'auteur est
contributeur et utilisateur). Ultérieurement : définir un médium de
remontée pour les utilisateurs externes (GitHub, Google Forms, autre)
avec un processus de validation (prompt injection, qualité).

## Cookies et consentement

Choisir l'option la plus restrictive qui ne casse pas le flux de
candidature. Refuser les cookies marketing/tracking. Accepter les
cookies fonctionnels si nécessaire au bon fonctionnement du site
(session, CSRF, état multi-étapes).

## Navigation

L'approche dépend de la plateforme — voir le fichier de référence.
Deux stratégies :

- **DOM** — sélecteurs CSS, JavaScript, form_input. Quand le DOM est
  fiable (HTML standard, pas de shadow DOM).
- **Visuelle** — screenshots, orientation visuelle. Quand le DOM est
  peu fiable (composants React custom, shadow DOM, modals asynchrones).

La stratégie est documentée dans le fichier de référence de chaque
plateforme. En l'absence de fichier, commencer par le DOM et basculer
en visuel si les sélecteurs échouent.

## Références

- `desktop/references/consolidation.md` — processus de consolidation
  mémoire → référence (fondé sur runbook evolution + codify)
- `desktop/references/sites/` — un fichier par plateforme ATS/agrégateur
