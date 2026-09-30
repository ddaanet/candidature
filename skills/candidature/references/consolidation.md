# Consolidation des observations site

Les observations terrain sont capturées dans `sites/<site>.md` du repo de
données par `references/site-cloture.md` après chaque interaction. Ces
fichiers sont la source primaire au runtime.

Les fichiers de référence du skill (`references/sites/*.md`) embarquent les
observations validées pour les distribuer avec le skill. La consolidation
transfère les observations de `sites/<site>.md` vers le fichier de
distribution correspondant `src/references/sites/<site>.md` au moment de la
release, quand les observations ont été confirmées par l'usage et qu'elles
concernent la plateforme (pas un employeur spécifique).

La consolidation est une étape de release, jamais une étape de runtime. Au
runtime, le skill lit et écrit `sites/<site>.md`. Le transfert vers l'arbre
de distribution se fait à froid, hors session candidat.

## Structure des fichiers de référence

Un fichier par plateforme (pas par employeur).

```markdown
# <Nom de la plateforme>

## Approche
L'approche, DOM, visuelle ou mixte, résumée en une phrase.

## Lecture sans navigateur
API publiques et HTML servi, ce qu'ils donnent et ce qu'ils omettent par
rapport au formulaire rendu.

## Contraintes techniques
Observations factuelles. Chaque contrainte est formulée comme un
principe général suivi de l'instance observée (date, entreprise).

## Formulaire
Structure type, champs, particularités.

## Upload CV
Mécanisme, chemins autorisés, contournements.

## Cookies
Comportement observé, boutons à cibler.

## Contournements
Solutions validées, classées par problème. Chaque contournement porte
le problème rencontré, la solution adoptée et le résultat.

## Historique
Date, entreprise, observation en une phrase. Traçabilité des entrées
consolidées, pas dans des propriétés de page.
```

Consolider la plateforme seulement. Une observation propre à un employeur
reste dans `sites/` du repo de données, sauf quand elle illustre une
contrainte de la plateforme, citée alors comme instance datée. Quand
plusieurs fichiers de `sites/` couvrent la même plateforme sous des noms
d'employeur (`lever-pigment.md`, `lever-c12.md`), ils alimentent un seul
fichier de référence. Une observation corrigée par une observation plus
récente se consolide dans son état corrigé. Une conduite datée de l'époque
du navigateur par extension, remplacée depuis par le pilotage CDP, ne se
consolide pas.

## Sources

Les fondements théoriques (cycle runbook, critères de maturation,
théorie du signal) sont documentés dans DESIGN.md.
