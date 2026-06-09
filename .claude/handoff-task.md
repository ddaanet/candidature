## Current task

La spec et le plan du parcours de cartes LinkedIn sont committés sur dev, la prochaine session exécute le plan tâche par tâche, cœur pur en TDD d'abord puis vérification Playwright et Notion en réel.

## Open decisions

- Confirmer que le jeton Notion est en place (NOTION_TOKEN ou ~/.config/candidature/notion.env) et que l'intégration est connectée à la page racine Recherche d'emploi avant la vérification réelle des tâches 7 à 9.
- Persister ou non la position de page du flux dans l'état de run pour la reprise : retiré du plan par YAGNI, le navigateur tient la position, à trancher si la reprise multi-pages devient nécessaire.
- Mode d'exécution du plan : subagent-driven (recommandé) ou inline executing-plans, à choisir au lancement.
