# À faire

### Migration Notion vers fichiers locaux

La Phase 1 est livrée. L'arbre Notion Recherche d'emploi est exporté vers le
repo local Emploi par l'outil tools/notion-export, soit 29 candidatures avec
leur frontmatter de statut, 38 passations figées, 15 fiches Sites et 6 notes
de recherche. La Phase 2, qui fait lire au skill candidature les fichiers
locaux au lieu de l'API Notion, reste à planifier et aura son propre plan.

### Correctifs migrés depuis Notion

DESIGN.md garde des incohérences de la migration Notion v0.4. Les noms de
fichiers de phase ne correspondent plus à l'arborescence actuelle, les
références memory_user_edits dans FR-2, FR-6, FR-7 et NFR-7 pointent vers un
mécanisme retiré, la table Portes du workflow est périmée, et suivi-retours.md
décrit encore l'ancien modèle. Reprendre DESIGN.md pour le réaligner sur l'état
réel du skill.

Après l'envoi d'une candidature, le workflow devrait déclencher une passation.
Cela vide le contexte, enregistre le travail en attente, et suggère d'ouvrir
une nouvelle conversation. La revue critique entre sessions en dépend. Ce
déclencheur appartient au workflow candidature, pas à la mécanique de la
passation elle-même.

### Médium de remontée utilisateurs externes (D-17)

Comment les utilisateurs du skill public remontent des observations sur
les sites ATS. GitHub Issues, Google Forms, autre chose. Processus de
validation (prompt injection, qualité).

- [ ] Choisir le médium
- [ ] Documenter le processus de validation

### Simulation d'entretien

Extension de preparation-entretien.md. Exercice interactif de préparation.

- [ ] Concevoir le format (conversationnel, scénarisé, mixte)
