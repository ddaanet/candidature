# Spec : contrôle de flux 12FA du skill candidature

2026-06-19

Conception validée pour la 12FA-fication du skill candidature. Entrée de
`brief-12fa-skill-candidature.md`. Cible : Claude Code, repo `candidature`,
skill `skills/candidature/`, source canonique `src/`.

## Problème

Trace concrète sur une candidature Goodays. Le candidat trie des offres puis
décide de candidater. L'agent reste dans `preparation.md` (déjà en contexte) et
rédige une lettre de motivation, un artefact de soumission, avant d'ouvrir le
formulaire. La discipline « formulaire d'abord » vit uniquement dans
`soumission.md`, jamais chargée. La transition de phase est tenue par de la
prose (`SKILL.md` §5 « réévaluer le routage »), rien ne force le retour au
dispatcher. L'agent continue d'exécuter la phase en mémoire.

C'est un anti-pattern déjà documenté dans DESIGN.md. Une porte prose-only est
une porte que l'agent saute (NFR-2, D-13). Chaque incident de cette famille
(D-18, D-27, D-39, D-40) a été corrigé par une porte locale ancrée, jamais par
une consigne de vigilance.

## Cadre 12-factor-agents

Le bug viole trois facteurs.

Facteur 8, own your control flow. La transition de phase est décidée par
l'inférence de l'agent, pas par une structure de contrôle.

Facteur 12, stateless reducer. L'agent porte un état implicite dans son contexte
(« je suis dans preparation »), au lieu de lire l'état externalisé et d'émettre
la transition suivante.

Facteur 5, unify execution and business state. Le « où en est-on » vit dans la
fenêtre de contexte, séparé des fichiers de candidature.

Le repo fait déjà du proto-12FA sans le nommer. La porte ancrée `[outil]`/`[état]`
est le facteur 4 (sortie structurée inspectable que l'agent ne peut pas
simuler). La spec achève le travail pour la transition restée en prose.

Contrainte de runtime. Dans un skill Claude Code, l'agent est seul à pouvoir
appeler le modèle. Un script ne peut pas piloter une boucle qui invoque
l'inférence. « Garder le contrôle de flux hors de l'agent » signifie donc que
chaque conditionnelle, garde et transition est résolue par un appel de script
dont stdout est l'instruction que l'agent suit. L'agent émet une ligne de
commande structurée, l'exécute, reçoit une instruction. Son inférence ne sert
que là où le jugement est irréductible.

## Modèle de référence

Le harnais LinkedIn (`tools/linkedin-harness/walk.mjs`) est le patron. CLI à
sous-commandes, chacune imprime du JSON, l'agent lit, juge, rappelle. Le flux
de contrôle vit dans la CLI (commentaire d'en-tête de walk.mjs). L'état est un
reducer de fonctions pures sur un état externalisé (`lib/state.mjs`, « l'agent
ne retient rien, l'état vit ici »). Fin et blocage sont des signaux structurés
(`{done, reason}`, `{blocked, message}`), pas de la prose. Le harnais est testé.

La spec reprend ce patron d'interaction. Elle suit le packaging des scripts
embarqués existants (`init_repo.py`, `validate.py`), pas celui du harnais. Le
contrôle de flux candidature est un comportement de base du skill, il doit être
livré dans le plugin pour tous les utilisateurs. Le harnais LinkedIn est
délibérément hors du skill (D-35, automatisation navigateur, local).

Une divergence assumée avec walk.mjs, la sérialisation de sortie. walk.mjs
imprime du JSON. Règle de projet, l'agent lit du markdown, le JSON est réservé
aux entrées de script complexes. Les sorties du reducer destinées à l'agent sont
donc du markdown, son médium natif. Le JSON ne sert qu'en entrée complexe, par
exemple les champs de formulaire de `capture-form`. Le patron d'interaction est
identique, seule la forme de la sortie change.

## Frontière des composants

Reducer Python `src/scripts/dispatch.py`, livré dans le plugin, invoqué
`${CLAUDE_SKILL_DIR}/scripts/dispatch.py`. Le contrôle de flux y vit.

L'inférence de l'agent se réduit à trois choses. Interpréter le langage naturel
du candidat en un jeton d'intention contrôlé. Détecter les capacités (navigateur
présent), qu'un script ne peut pas inspecter. Le jugement irréductible dans une
phase, analyse d'adéquation, appels de contraintes molles, génération, étayage,
relecture.

Tout le reste, routage de phase, gardes, transitions d'état, est un appel
`dispatch.py` dont l'agent suit le JSON.

## Surface de commande du reducer

Quatre sous-commandes. Chacune imprime du markdown que l'agent lit dans son
médium natif. Calquées sur `start/decide/status/dismiss`.

L'instruction reste structurée et déterministe (facteur 4). Un titre nomme
l'action, le corps porte les paramètres que l'agent applique. Une sortie produite
par un script déterministe est inspectable et non simulable, que sa forme soit
JSON ou markdown.

### `status`

Lit `.candidature` et les frontmatter sous `candidatures/`. Imprime l'état du
repo, l'index régénéré en tableau, et les anomalies de la logique de
`validate.py` réutilisée par import. Lecture pure. Exemple.

```
## Repo : prêt (format 1)

| slug | entreprise | poste | statut | canal |
|------|------------|-------|--------|-------|
| 2026-06-19-goodays | Goodays | Data Eng | shortlist | — |

Aucune anomalie.
```

Pour un repo non prêt, la sortie nomme l'état (`uninitialized`, `adopt`,
`too-new`) et porte le message à présenter au candidat.

### `next --intent <jeton> [--slug <s>]`

Les conditionnelles de SKILL.md §4 en code. Jetons d'intention émis par l'agent :
`feedback`, `offer`, `submit`, `resume`. Combine l'intention et l'état dérivé du
repo (fiche vide ? dossier existant ? formulaire capturé ?) et imprime
l'instruction d'action en markdown.

Précédence des règles, première correspondance appliquée.

1. Repo non prêt, instruction d'initialiser (création ou adoption) ou de mettre à
   jour le skill.
2. `intent=feedback`, charger `references/suivi.md`.
3. Fiche candidat absente ou marquée gabarit, charger `references/profil.md`.
4. `intent=offer`, charger `references/preparation.md`.
5. `intent=submit`, exige `--slug`. Slug inconnu, refus motivé. Sans
   enregistrement `formulaire` pour le slug, charger `references/soumission.md` à
   l'étape exploration du formulaire. Formulaire capturé, charger
   `references/soumission.md` à l'étape rédaction.
6. `intent=resume` ou défaut, dérive du repo, fiche gabarit vers profil, sinon
   preparation, ou présente l'index.

Exemple de sortie pour la règle 5 sans formulaire capturé.

```
## Action : charger une phase

Charger `references/soumission.md`.
Étape : explorer le formulaire et capturer ses champs avant toute rédaction.
```

L'étape distingue l'exploration du formulaire de la rédaction. C'est le pivot de
la garde form-first.

### `capture-form --slug <s> --fields <json>`

Écrit l'enregistrement du formulaire découvert dans le frontmatter du README du
dossier, sous la clé `formulaire`, une liste de champs. C'est l'effet d'écriture
qui ouvre la rédaction. L'entrée `--fields` est du JSON, exception sanctionnée
pour une entrée de script complexe.

```
fields = [ {"libelle": "...", "type": "texte_libre|fichier|liste|...",
            "taille": "..."}, ... ]
```

Imprime une confirmation markdown, le slug et le nombre de champs enregistrés.

### `transition --slug <s> --to <statut> [--canal ... --date ...]`

Valide `statut` contre l'ensemble fermé et la légalité de la transition, écrit
la ligne de frontmatter. Une transition vers un statut qui exige des clés
(soumission implique canal et date_soumission) refuse tôt si elles manquent,
plutôt que de laisser `validate.py` le signaler après coup. Imprime une
confirmation ou un refus motivé en markdown.

## État et garde form-first

L'état est le repo, unifié (facteur 5). Le reducer dérive la phase du
frontmatter `statut` et de la présence des fichiers, pas d'un champ `phase`
stocké, cohérent avec D-42 « régénéré depuis les frontmatter » et le facteur 12.

La garde form-first n'est pas un contrôle séparé que l'agent doit retenir. C'est
la fonction de transition du reducer. `next --intent submit` renvoie
`capture_form` tant qu'aucun enregistrement `formulaire` n'existe pour le slug,
et ne renvoie `generate` qu'une fois `capture-form` exécutée. L'agent ne peut
pas se router lui-même vers la rédaction, il demande la suite et l'état dérivé
refuse d'avancer. Le bug de trace devient structurellement inatteignable, aucun
chemin ne dit à l'agent de rédiger avant la capture du formulaire.

L'enregistrement du formulaire vit dans la clé frontmatter `formulaire` du
README, pas un fichier frère, parce que le brief place l'état d'exécution dans
le frontmatter et que le reducer le parse trivialement. Le contrat de
`validate.py` est inchangé, il ignore la clé.

Limite acceptée. L'agent pourrait écrire un fichier brouillon par l'outil Write
sans consulter `next`. La garantie structurelle est la boucle « l'agent demande
au reducer ». C'est le même modèle de confiance que walk.mjs, où l'agent
pourrait aussi ignorer le driver. C'est une amélioration nette sur la prose, pas
une preuve formelle.

## SKILL.md et recâblage des phases

SKILL.md se réduit à une boucle mince. Interpréter l'intention, appeler
`dispatch.py next`, obéir à l'action, faire le jugement, boucler. Les règles
ordonnées de §4 et la prose « réévaluer » de §5 sont supprimées, elles vivent
désormais dans le reducer. La détection navigateur (§2) reste côté agent.

`preparation.md` perd sa sortie en fin de §2.6. Quand le candidat signale la
soumission, la phase ne continue pas, elle appelle `transition` puis rend la
main à la boucle.

`soumission.md` §2.6, l'exploration du formulaire finit par un appel
`capture-form`. §2.7, la rédaction n'est atteinte que via `next` renvoyant
`step: generate`.

`etayage.md`, l'ouverture « le brouillon a été écrit » cesse de servir de
fausse caution à une rédaction hors séquence, puisque par construction un
brouillon n'existe qu'après la garde. L'isolation de D-22 est préservée, aucune
connaissance form-first ne refuit dans etayage.md.

## Tests

`dispatch.py` reçoit une suite pytest sur la logique du reducer, comme
`test/state.test.mjs`. Routage selon l'état du repo et l'intention, légalité des
transitions, la garde form-first (next renvoie capture_form sans formulaire,
generate après). Fonctions de dérivation pures, testées sans système de fichiers
réel quand c'est possible, sur des fixtures de repo sinon.

## DESIGN.md

Nouvelles décisions. D-46, reducer de contrôle de flux, facteurs 12FA 8, 12, 5,
4, patron du harnais LinkedIn, packaging des scripts embarqués. La garde
form-first comme fonction de transition. Sources, le dépôt 12-factor-agents
(HumanLayer), StateFlow déjà cité en D-22, VOXAM. L'appendice de validation des
sources est mis à jour avec ces affirmations. L'axe d'audit « agir sans charger
la source qui fait autorité » gagne le cas de la transition de phase.

## Version et livraison

Pas de changement de format de stockage, le format reste 1. Bump mineur du
skill, 0.7.0, via `just release minor`. Travail sur `dev`, merge `--no-ff` vers
`main` avec un message rédigé. Les modifications de SKILL.md, DESIGN.md et
references/ sont faites en session Opus. Reconstruire `skills/candidature/` et
committer l'artefact dans le même commit, sinon `check.sh` signale la dérive.
