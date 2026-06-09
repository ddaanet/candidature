## Current task

Le parcours de cartes LinkedIn (FR-3) est implémenté, vérifié en réel et commité sur `dev`, la suite immédiate est la correction de `modele-notion.md` et `notion-setup.md` pour refléter la vraie structure de la racine Recherche d'emploi.

## Open decisions

- Merger `dev` vers `main` en `--no-ff` maintenant pour livrer le parcours (huit commits, livrable cohérent), ou enchaîner d'abord la correction Notion sur `dev` et merger l'ensemble ensuite.
- Portée exacte de la correction Notion, tracée dans `TODO.md` : la racine porte des sections Situation et Candidatures avec un résumé par offre, et il y a cinq sous-pages dont Passations, pas quatre.
- Les commandes du harnais qui touchent le navigateur ou Notion REST tournent hors sandbox sur le serveur, voir la mémoire feedback-harness-sandbox avant de relancer un parcours.
