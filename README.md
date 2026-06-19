# /candidature — Des candidatures qui ne sonnent pas comme de l'IA

Demander à une IA « écris-moi une lettre de motivation » produit un texte
générique, interchangeable, que le recruteur identifie en 3 secondes.

Cette méthode transforme l'IA en assistant de candidature qui connaît votre
parcours, recherche ce qui est attendu pour chaque poste, rédige dans
votre voix, vérifie chaque fait contre votre CV, et s'améliore au fil
de vos candidatures.

Fonctionne pour tout métier et tout niveau. Fondé sur la recherche en
psychologie du recrutement.

## Ce que ça fait

1. **Profil** — L'assistant apprend votre parcours à partir de votre CV
   et d'une conversation courte
2. **Analyse** — Pour chaque offre, il recherche les conventions du
   secteur, analyse l'alignement avec votre profil, et identifie vos
   points de différenciation
3. **Rédaction** — Lettre de motivation, réponses formulaire, CV adapté
   — chaque affirmation est vérifiée avant d'écrire
4. **Relecture** — Revue point par point avant envoi, dans votre voix
5. **Suivi** — Retours, comptes rendus d'entretien, tendances sur
   plusieurs candidatures

## Installation

Le skill est un plugin Claude Code. Depuis la marketplace ddaanet :

    /plugin marketplace add ddaanet/claude-plugins
    /plugin install candidature@ddaanet

Pour le développement local, après un build, pointer Claude Code sur le
dépôt :

    ./build/build.sh
    /plugin install /chemin/vers/candidature

## Stockage

Le skill opère sur le répertoire courant, qui devient le repo de
candidatures. Une sentinelle `.candidature` marque un repo initialisé.
Tout est stocké en fichiers markdown locaux : la fiche candidat, un
dossier par candidature, les recherches contextuelles, les fiches de
site, les tendances. Au premier lancement dans un dossier vide,
l'assistant propose de créer la structure de départ.

La couche navigateur utilise le harnais Playwright local décrit dans
`tools/linkedin-harness/` et exige un chromium système.

## Pour commencer

L'assistant commence par votre profil — quelques minutes de conversation
pour comprendre votre parcours, vos contraintes et vos objectifs.

Ensuite, apportez une offre ou plusieurs — l'assistant analyse
l'alignement avec votre profil et vous aide à prioriser.

## Release

La version vit dans `.claude-plugin/plugin.json`, la source de vérité.
La release passe par le toolkit `plugin-dev` vendu sous `plugin-dev/` :

    just release patch    # ou minor, ou major

La recette reconstruit, vérifie, bumpe `plugin.json`, commite, tague,
pousse, crée la release GitHub, puis répercute la version dans la
marketplace `claude-plugins`. Le champ version ne s'édite pas à la main :
un hook l'interdit, seul `just release` le bumpe.

## Contenu

```
.claude-plugin/plugin.json    — Manifeste du plugin, source de version
src/                          — Source canonique du contenu
  SKILL.md                    — Point d'entrée (dispatcher)
  references/                 — Fichiers de phase et documents de support
    *.md                      — Phases du dispatcher et protocoles
    sites/*.md                — Contraintes par plateforme ATS
  scripts/                    — init_repo.py, validate.py
build/build.sh                — Assemblage de skills/candidature/ depuis src/
skills/candidature/           — Artefact buildé, lu par Claude Code
plugin-dev/                   — Toolkit de release vendu (git subtree)
```

## Licence

MIT
