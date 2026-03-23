# Interaction navigateur pour les candidatures

Instructions pour l'interaction avec les sites d'emploi via Chrome.
Chargé par le dispatcher quand Chrome est disponible. Complémentaire au
workflow (méthodologie) — ce document ajoute la couche d'exécution
navigateur.

## Cycle rappel → capture → consolidation

### Rappel (avant interaction site)

Avant de naviguer sur un site de candidature :

1. **Fichier de référence** — lire `references/sites/<plateforme>.md`
   (`view`). Contient les contraintes consolidées et les contournements
   validés.
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
2. Intégrer dans `references/sites/<plateforme>.md`
3. Supprimer les entrées consolidées de la mémoire projet

Voir `references/consolidation.md` pour le processus détaillé et les
critères de maturation.

**Médium actuel :** transfert direct via MCP Filesystem (l'auteur est
contributeur et utilisateur). Ultérieurement : définir un médium de
remontée pour les utilisateurs externes.

## Cookies et consentement

Choisir l'option la plus restrictive qui ne casse pas le flux de
candidature. Refuser les cookies marketing/tracking. Accepter les
cookies fonctionnels si nécessaire au bon fonctionnement du site
(session, CSRF, état multi-étapes).

## Ouverture de page

Quand Chrome est connecté, ouvrir directement la page de candidature
(`open_url`) au lieu de donner l'URL au candidat. Réduit la friction —
le candidat n'a pas à copier-coller.

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
