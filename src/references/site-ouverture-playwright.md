# Ouverture de site, couche Playwright

Couche navigateur de la cible Claude Code. Chargée par le dispatcher
quand un chromium système est disponible. Les phases chargent ce
fichier avant toute navigation sur une plateforme.

## Rappel

Avant de naviguer sur un site de candidature, charger les contraintes
connues de la plateforme depuis deux sources. La source primaire est le
stockage, le fichier du site `sites/<site>.md` sous le répertoire racine,
avec les observations terrain datées. La source secondaire est le fichier
de référence du skill (`references/sites/*.md`). Si les deux existent, les
observations du stockage prévalent. Noter le nom du site pour la capture
après interaction (`references/site-cloture.md`).

## Exécution hors sandbox

Le contrôle navigateur lance un chromium réel avec un profil persistant
et un port CDP. Le navigateur tourne hors de la sandbox de l'agent,
l'isolation PID et réseau de la sandbox couperait la session. Lancer les
commandes du harnais hors sandbox.

## LinkedIn, harnais dédié

Le parcours d'offres LinkedIn passe par le harnais
`tools/linkedin-harness/` du dépôt candidature. Suivre son `README.md`.
Le harnais ouvre le navigateur (`./launch.sh`) et pilote le parcours
de cartes (`npm run walk`) sur l'un des deux flux pris en charge,
`recommended` ou `top-applicant`. Il travaille dans son propre onglet et
ne navigue jamais un onglet ouvert par le candidat. Une décision parmi trois, shortlist crée un dossier candidature
`candidatures/<slug>/` avec `statut: shortlist`, reject écarte la carte,
stop arrête le parcours. La création du dossier est l'affaire du harnais.

Avant de lancer un parcours, charger les contraintes dures de la fiche
candidat (`references/preparation.md`). Le harnais laisse la décision
shortlist ou reject au jugement de l'agent, qui doit donc avoir les
contraintes en contexte avant de parcourir. Une offre hors contraintes, par
exemple en télétravail intégral quand la fiche exige du présentiel, est un
reject d'office.

LinkedIn ne connaît pas le statut shortlist. Son Dismiss n'existe que
dans la liste paginée des flux et marque seulement la carte comme traitée.
`node walk.mjs dismiss --jobId <id>` n'agit donc que sur une carte encore
rendue dans cette liste. Le flux cesse souvent de rendre une carte retenue
d'un parcours à l'autre, et elle ne peut alors plus être marquée traitée.
Quand le candidat abandonne une offre retenue, mettre `statut: écartée`
dans le frontmatter du dossier, c'est lui qui fait garde. Le flux republie
des offres déjà traitées, parfois sous un nouveau jobId. Avant de retenir
une carte, comparer entreprise et titre aux dossiers de `candidatures/`.

## Autres sites, Playwright ad hoc

Pour un site sans harnais dédié, écrire un script Playwright dans
`./tmp/`, le lancer hors sandbox, lire stdout, stderr et les captures
d'écran, puis itérer. Décrire ce qu'on cherche à observer, pas une
mécanique pas à pas. Refuser les cookies marketing et pistage, accepter
les cookies fonctionnels nécessaires au flux. Commencer par l'approche
DOM (sélecteurs CSS, remplissage de formulaire) et basculer en approche
visuelle (captures d'écran) quand le DOM est peu fiable.

## Consolidation

Les patterns réutilisables remontent au fil des candidatures dans
`references/sites/*.md`, puis à terme dans une base Playwright
partagée. La consolidation périodique est décrite dans
`references/consolidation.md`.
