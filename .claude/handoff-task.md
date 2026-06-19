## Current task

L'outillage Phase 2-A (init_repo.py, validate.py, tests) est implémenté, revu propre et committé sur dev ; la suite est d'écrire Plan B (réécriture du skill, Opus) et Plan C (harnais LinkedIn) avant de merger Phase 2 vers main.

## Open decisions

- Écrire Plan B et Plan C avant toute exécution, ou alterner écriture et exécution. Et dans quel ordre traiter B et C.
- Note pour Plan B : la CLI de validate.py avale silencieusement les --flag inconnus et --today malformé lève une ValueError non rattrapée. Le dispatcher devra passer un --today valide. Hors périmètre Plan 2-A.
