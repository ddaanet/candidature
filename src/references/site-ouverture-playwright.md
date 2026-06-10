# Ouverture de site, couche Playwright

Couche navigateur de la cible Claude Code. Chargée par le dispatcher
quand un chromium système est disponible. Les phases chargent ce
fichier avant toute navigation sur une plateforme.

## Rappel

Avant de naviguer sur un site de candidature, charger les contraintes
connues de la plateforme depuis deux sources. La source primaire est
Notion, une sous-page du site sous Sites/ avec les observations
terrain datées. La source secondaire est le fichier de référence du
skill (`references/sites/*.md`). Si les deux existent, les observations
Notion prévalent. Noter le nom du site pour la capture après
interaction (`references/site-cloture.md`).

## Exécution hors sandbox

Le contrôle navigateur lance un chromium réel avec un profil persistant
et un port CDP. Le navigateur et les appels Notion REST tournent hors
de la sandbox de l'agent, l'isolation PID et réseau de la sandbox
couperait la session. Lancer les commandes du harnais hors sandbox.

## LinkedIn, harnais dédié

Le parcours d'offres LinkedIn passe par le harnais
`tools/linkedin-harness/` du dépôt candidature. Suivre son `README.md`.
Le harnais ouvre le navigateur (`./launch.sh`), liste les flux
(`npm run streams`) et pilote le parcours de cartes (`npm run walk`).
Une décision parmi trois, shortlist crée une page candidature Notion,
reject écarte la carte, stop arrête le parcours. L'écriture Notion du
harnais passe par un jeton d'intégration REST, pas par le MCP, voir le
README du harnais pour la configuration du jeton.

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
