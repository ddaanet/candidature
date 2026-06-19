# Instructions pour l'agent

## Ce repo

Un plugin Claude Code (fichiers markdown) pour la candidature assistée.
Le public cible est non technique. Le contenu du skill est le produit.

- `src/SKILL.md` est le point d'entrée (dispatcher, charge une phase à la fois).
- `src/references/` contient les fichiers de phase et les documents de support.
- `src/scripts/` contient les scripts Python exécutés par le skill au runtime.
- `.claude-plugin/plugin.json` est le manifeste, source de vérité de la version.
- `build/build.sh` assemble `skills/candidature/` depuis `src/`.
- `plugin-dev/` est le toolkit de release vendu par git subtree.
- `DESIGN.md` documente les décisions de conception et l'audit d'étayage.
- `README.md` est le guide d'installation.

## Build

`./build/build.sh` assemble un seul artefact, `skills/candidature/`, depuis
`src/` : SKILL.md, les références, et les scripts (`init_repo.py`,
`validate.py`). La version est lue depuis `.claude-plugin/plugin.json`. Le
build ne génère plus le manifeste et ne tague plus.

La source canonique est `src/`. L'artefact `skills/candidature/` est buildé.
Toute modification de `src/` exige de reconstruire et de committer l'artefact
dans le même commit, sinon `check.sh` signale la dérive. Le manifeste
`plugin.json` est une source éditée à la main, pas un artefact, donc hors de
la garde de dérive.

### Release

La release passe par le toolkit `plugin-dev`, vendu sous `plugin-dev/` par git
subtree et importé dans le `justfile` (`import 'plugin-dev/release.just'`) :

    just release patch    # ou minor, ou major

La recette reconstruit, vérifie via `just precommit`, bumpe le champ version de
`plugin.json`, commite, tague, pousse, crée la release GitHub, puis répercute
la version dans la marketplace `claude-plugins` (chemin dans `MARKETPLACE_DIR`,
configuré en `.envrc`). Le champ version ne s'édite pas à la main : un hook
version-guard câblé dans `.claude/settings.json` refuse toute édition manuelle,
seul `just release` le bumpe.

### Mode développement

Pour itérer localement, reconstruire puis pointer Claude Code sur le dépôt :

    ./build/build.sh
    /plugin install /chemin/vers/candidature

## Qualité de la prose

Énoncer l'information directement, sans précautions, sans cadrage, sans
préambule. Référencer, ne pas résumer. Supposer que le lecteur a le contexte.
Laisser les résultats parler, ne pas cadrer la sortie visible. S'engager sur
les réponses, pas de qualificatifs dilatoires.

## Contamination de style

Le style de chaque fichier de ce repo contamine la sortie de l'agent. L'agent
écrit comme il lit. Si les instructions utilisent du gras, des tirets
cadratins ou des fragments à puces sans sujet, l'agent les reproduit dans les
lettres, les messages et tout texte généré.

Règles pour tout le contenu du skill (SKILL.md, references/, DESIGN.md) :

- Pas de gras markdown (`**`). L'agent reproduit les motifs de mise en forme
  dans le texte généré. Écrire des phrases qui portent leur propre emphase.
- Pas de tirets cadratins ni de tirets demi-cadratins. Utiliser des points,
  des virgules, ou restructurer la phrase.
- Pas de fragments à puces qui remplacent des phrases. Écrire des phrases.
- Pas de points-virgules. Rares dans l'écriture naturelle en français ou en
  anglais.
- Les exemples et les templates sont les vecteurs les plus dangereux. L'agent
  les copie quasi verbatim. Chaque exemple doit ressembler au résultat
  souhaité.

Tout le contenu du skill est en français. Utiliser un français naturel, sans
anglicismes quand un équivalent courant existe. Exception : les termes sans
équivalent courant (commit, widget, markdown).

## Branches

`main` reçoit des livrables, pas des brouillons. `dev` sert au travail en
cours, aux explorations, aux plans.

Merger `dev` vers `main` en `--no-ff` pour les livrables de plus d'un commit,
avec un message de merge rédigé (pas le message par défaut). La friction est
faible, le signal est élevé. Si quelqu'un regarde l'historique, il voit des
livrables nommés.

Un commit unique peut aller directement sur `main`.

## Messages de commit

Préfixe gitmoji. Messages courts et denses, centrés sur le « pourquoi » et
non le « quoi ». Chaque commit est une unité thématique cohérente, pas un
découpage par fichier. Un commit peut toucher plusieurs fichiers s'ils
participent au même changement logique.

| Emoji | Quand |
|-------|-------|
| 🎉 | Commit initial |
| ✨ | Nouvelle fonctionnalité ou section de contenu |
| 📝 | Modifications de documentation |
| ♻️ | Restructuration sans changement de sens |
| 🔥 | Suppression de contenu ou de fichiers |
| 🐛 | Correction d'une erreur (factuelle, structurelle, de référence) |
| 💡 | Amélioration de la clarté ou de la formulation |
| 🔍 | Ajout ou mise à jour de sources |
| 🌐 | Localisation ou traduction |
| 🚚 | Déplacement ou renommage de fichiers |
| 🔀 | Merge de branches |

## Règles de contenu

Chaque affirmation factuelle doit être traçable vers une source (chemin de
fichier, citation, résultat de recherche). Les affirmations sans source doivent
être marquées `[non étayé]` ou retirées.

L'appendice de DESIGN.md trace l'étayage des affirmations. Le mettre à jour
quand on ajoute des affirmations.

`references/recruitment-science.md` est le socle théorique stable. Les
modifications y sont rares et nécessitent une vérification des sources.

## Contrainte de modèle

Toutes les modifications de SKILL.md, DESIGN.md et references/*.md doivent
être rédigées dans une session Opus. Ne pas modifier ces fichiers dans des
sessions Sonnet. La qualité de prose des instructions agentiques nécessite
le niveau d'attention d'Opus.
