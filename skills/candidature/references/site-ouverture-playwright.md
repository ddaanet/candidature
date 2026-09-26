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

## Plusieurs agents sur le même navigateur

Chaque agent travaille dans ses propres onglets nommés, jamais dans un
onglet anonyme et jamais dans un onglet ouvert par le candidat. L'outil
est `tab.mjs`, dans le dossier du harnais `tools/linkedin-harness/`.
Il tient un registre par propriétaire qui associe chaque nom d'onglet à
sa cible dans le navigateur.

    node tab.mjs --owner wwr --tab listing open https://weworkremotely.com/
    node tab.mjs --owner wwr --tab listing links /remote-jobs/
    node tab.mjs --owner wwr --tab listing close

Le propriétaire est le nom de l'agent ou du dossier, l'onglet par défaut
s'appelle `navette`. Le registre n'a pas de verrou, deux commandes du
même propriétaire ne tournent jamais en parallèle. Fermer le dernier
onglet arrête le navigateur, `close` le refuse. Un script jetable qui
ouvre un onglet sans nom et le met au premier plan déloge le travail des
autres agents, il n'a plus cours.

Les commandes `goto`, `text`, `links` et `eval` de `tab.mjs`, comme le
parcours LinkedIn, attachent Playwright à tout le navigateur. Cette
attache expire au bout de 30 secondes dès qu'un onglet porte un iframe
tiers qui ne répond pas, un hCaptcha ou le bouton « Apply with
LinkedIn » d'un formulaire Recruitee, quel que soit l'onglet visé. Sur
une telle page, passer à `cdp.mjs`, qui parle à la page seule avec les
mêmes `--owner` et `--tab`. Il évalue du JavaScript (`eval`, ou
`evalfile` pour un texte long), lit le texte, téléverse un fichier,
clique et frappe par de vrais événements souris et clavier, et prend une
capture. Les commandes `open`, `adopt`, `list`, `show` et `close` de
`tab.mjs` passent par le point HTTP du navigateur et n'expirent pas.

Un onglet gardé d'une session à l'autre peut avoir perdu son moteur de
rendu. L'évaluation expire alors, fermer l'onglet et en ouvrir un neuf.
Quand le candidat ferme lui-même un onglet et rouvre la page ailleurs,
le registre pointe sur une cible morte. `tab.mjs adopt <fragment d'URL>`
inscrit la page vivante sous le nom de l'onglet, sans en recréer un. Le
formulaire déjà rempli est dans cette page.

Un iframe servi par le même domaine que sa page hôte n'est pas une cible
séparée du navigateur, et `cdp.mjs` évalue dans le document de la page
hôte, où les sélecteurs du formulaire ne trouvent rien. Le formulaire
Welcomekit est dans ce cas. Activer le domaine `Runtime` sur la page,
relever les contextes d'exécution annoncés, et évaluer avec le
`uniqueContextId` du contexte de l'iframe.

Les cartes du flux LinkedIn et les descriptions d'annonce ne se chargent
que dans l'onglet au premier plan, et le parcours expire tant que des
onglets tiers d'autres agents sont ouverts. Un parcours LinkedIn ne
tourne donc pas pendant qu'un autre agent remplit un formulaire. Faire
la prospection LinkedIn d'abord, fermer les onglets tiers, puis lancer
les remplissages.

Avant de conclure qu'un site bloque l'adresse IP, vérifier par où sort
le navigateur, avec `ps -eo args | grep -o -- '--proxy[^ ]*'` ou en
ouvrant `https://ipinfo.io/json` dans un onglet. Le navigateur peut
sortir par un proxy que `curl` n'emprunte pas.

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
