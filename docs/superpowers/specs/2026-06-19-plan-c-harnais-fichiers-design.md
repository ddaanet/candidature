# Plan C / D-40 : bascule du harnais LinkedIn de Notion vers les fichiers

Date : 2026-06-19. Branche de travail : dev.

## Contexte

Le harnais LinkedIn (`tools/linkedin-harness/`) est du code JavaScript distinct
du contenu du skill. Il pilote le parcours d'offres LinkedIn dans un navigateur
et, à la décision shortlist, persiste l'offre retenue. Cette persistance écrit
encore une page Notion via REST, état antérieur au pivot Phase 2 du 2026-06-19
qui a fait passer le skill au stockage fichiers local.

La référence livrée en Phase 2 décrit déjà l'intention cible. Dans
`src/references/site-ouverture-playwright.md` : « shortlist crée un dossier
candidature `candidatures/<slug>/` avec `statut: shortlist` (...) La création du
dossier est l'affaire du harnais. » Le code ne suit pas encore. Plan C aligne le
code sur cette intention.

Décisions de conception actées au brainstorming :
- Le harnais écrit le dossier lui-même, symétrie directe du remplacement de
  `notion.mjs` par un module fichiers. L'agent ne reprend pas l'écriture.
- L'agent fournit le slug du dossier dans le record. Aucune heuristique de slug
  en JS, la convention reste source unique côté skill (`modele-fichiers.md`).

## Ce qui disparaît

`lib/notion.mjs` en entier : `loadToken`, `buildPagePayload`,
`buildIndexParagraph`, `notionFetch`, `createShortlistPage`, `archivePage`.

Le paragraphe d'index que `createShortlistPage` ajoutait à la page racine Notion
n'a pas d'équivalent fichiers. Le modèle ne tient aucun index maintenu à la main,
il le régénère à la demande par lecture des frontmatter. La fonction disparaît
sans remplacement.

`archivePage` était déjà du code mort : `walk.mjs` ne l'importe ni ne l'appelle,
et `backend-write.md` confie l'écartement à l'agent, qui met `statut: écartée`
dans le frontmatter du README. Le harnais n'archive rien.

Plus aucun jeton d'intégration, plus aucun appel REST.

## Ce qui apparaît : `lib/dossier.mjs`

Une fonction pure et synchrone, sans fetch :

    createShortlistDossier(record, { root, dateStr, jobId })

Elle écrit `candidatures/${dateStr}-${record.slug}/README.md` sous `root` et
retourne `{ path }`, le chemin relatif du README créé.

Contenu du README, calqué sur `modele-fichiers.md` :

    ---
    entreprise: {record.company}
    poste: {record.role}
    statut: shortlist
    date_shortlist: {dateStr}
    jobId: {jobId}
    ---

    # {record.title}

    ## Offre
    Poste : {record.role}. Lieu : {record.location} ({record.workplace}). Offre : {record.url}

    ## Adéquation et écarts
    {record.analysis.fit}

    ## Motivation
    {record.analysis.company}

    ## Différenciation
    {record.analysis.differentiation}

La ligne `jobId` est omise quand `jobId` est absent. Pas de section Soumission au
stade shortlist, elle se remplira à la soumission. `record.summary` n'entre pas
dans le README : son seul consommateur était l'index Notion supprimé. Il reste
dans le record pour alimenter le résumé de parcours en fin de run.

Collision : si le dossier cible existe déjà, lever une erreur explicite. L'agent
ajuste alors le slug. Aucun écrasement silencieux.

## `lib/record.mjs`

`slug` rejoint `REQUIRED_STRINGS`, validé comme chaîne non vide. Le reste de la
validation est inchangé, `summary` reste requis.

## `walk.mjs`

Import depuis `./lib/dossier.mjs` au lieu de `notion.mjs`, sans `loadToken`.

`--root` devient le chemin du dépôt de candidatures. Le message d'erreur passe de
« Passer --root <pageId> de la racine Notion » à « Passer --root <chemin> du
dépôt de candidatures ».

`cmdDecide`, action shortlist : appel à
`createShortlistDossier(record, { root: state.root, dateStr, jobId })`. L'entrée
construite pour `addShortlist` porte `dossierPath: created.path` au lieu de
`notionPageId`. Le champ `created` rendu dans la sortie JSON devient `{ path }`.

`cmdDismiss` est inchangé. Il ne touchait jamais le stockage, il ne fait que
cliquer Dismiss sur la carte.

## Tests

`test/notion.test.mjs` est supprimé. Un `test/dossier.test.mjs` le remplace :
écriture dans un répertoire temporaire, assertions sur le frontmatter et les
sections, cas jobId présent puis absent, erreur quand le dossier existe déjà.

`test/state.test.mjs`, lignes 39, 42 et 59 : `notionPageId` devient
`dossierPath`.

`test/record.test.mjs` : ajouter le cas du slug manquant.

## Documentation

`site-ouverture-playwright.md` est déjà aligné, rien à y changer.

`DESIGN.md`, décision D-40, porte des mentions Notion explicitement marquées « à
réviser quand le sous-plan harnais sera livré ». Les réécrire pour décrire le
backend fichiers : la sous-commande dismiss reste, l'écartement fichier passe par
le frontmatter de l'agent, la création de dossier remplace la création de page.
Noter Plan C comme livré.

## Méthode

TDD sur `dossier.mjs` et `record.mjs`, la vraie logique du changement. Le câblage
de `walk.mjs` et les ajustements de tests suivent. Tout reste sur `dev`.
