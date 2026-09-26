# Harnais LinkedIn

Contrôle navigateur Playwright pour le parcours d'offres LinkedIn sur Claude
Code. La conception détaillée et la carte des flux sont dans DESIGN.md.

## Prérequis

Un chromium système et node. La dépendance s'installe avec npm install dans ce
dossier. Elle ne télécharge pas de navigateur. Les commandes qui attachent le
navigateur tournent hors sandbox.

## Lancer le navigateur

./launch.sh ouvre un chromium en tête avec un profil persistant et le port CDP
9222. Le profil par défaut est ~/.config/chromium-playwright.

Se connecter à LinkedIn à la main dans cette fenêtre. La session persiste dans
le profil entre les lancements, jusqu'à expiration du cookie côté LinkedIn.

## Onglet du harnais

Le harnais ne touche à aucun onglet ouvert par le candidat. Au premier appel,
il ouvre son propre onglet et l'inscrit sous le nom flux dans
/tmp/claude/tabs/linkedin-harness.json. Les appels suivants reprennent cet
onglet et le mettent au premier plan. S'il a été fermé, le harnais en ouvre un
neuf.

## Onglets nommés pour plusieurs agents

tab.mjs et cdp.mjs pilotent le même navigateur pour tout site, au-delà de
LinkedIn. Chaque agent possède un jeu d'onglets nommés, inscrits dans
/tmp/claude/tabs/<propriétaire>.json, le même registre que l'onglet du
harnais. node tab.mjs --help détaille les commandes.

    node tab.mjs --owner wwr --tab listing open https://weworkremotely.com/
    node tab.mjs --owner wwr --tab listing text
    node cdp.mjs --owner wwr --tab listing eval 'document.title'

tab.mjs open crée l'onglet par PUT /json/new, ou le reprend s'il vit encore.
adopt réinscrit sous un nom la page vivante dont l'URL contient un fragment,
pour un onglet que le candidat a rouvert ailleurs. open, adopt, list, show et
close passent par le point HTTP du navigateur. goto, text, links et eval
attachent Playwright, qui expire dès qu'un onglet à iframe tiers est ouvert.
cdp.mjs prend alors le relais sur la page seule, avec eval, evalfile, text,
upload, click, keys, key, screenshot, show et raw. Il ne crée jamais d'onglet.

Le registre n'a pas de verrou, deux commandes du même propriétaire ne tournent
jamais en parallèle. close refuse de fermer le dernier onglet du navigateur,
ce qui l'arrêterait.

## Flux pris en charge

Deux flux, désignés par leur slug. recommended correspond à « Top job picks for
you », top-applicant à « Jobs where you're more likely to hear back ». La page
jobs ne rend plus les liens de collection, la découverte automatique des flux
a donc été retirée.

## Parcourir un flux

npm run walk pilote le parcours de cartes. La boucle lit la carte au focus,
attend une décision, et passe à la carte suivante. L'agent décide, le driver
tient l'état dans tmp/run.json et exécute les effets. Une décision parmi trois,
shortlist crée un dossier candidature dans le repo de données et marque la
carte traitée par Dismiss, reject marque la carte traitée sans dossier, stop
arrête le parcours.

La séquence commence par un démarrage qui rend la première carte. --root
désigne la racine du repo de données, celle qui contient candidatures/.

    node walk.mjs start --stream recommended --target 3 --root ~/code/Emploi

Chaque décision suit, sur la carte rendue par l'appel précédent. shortlist
exige --record, le chemin du dossier de décision JSON décrit plus bas. Sans
lui, la commande refuse avant tout effet.

    node walk.mjs decide --action reject
    node walk.mjs decide --action shortlist --record tmp/record.json
    node walk.mjs decide --action stop

node walk.mjs status relit l'état courant sans rien changer. Le parcours se
termine de lui-même quand la cible de shortlists est atteinte ou quand le flux
est épuisé, et rend alors un objet avec done à vrai et la raison.

shortlist écrit candidatures/<date>-<slug>/README.md sous la racine, avec un
frontmatter statut shortlist, date_shortlist et le jobId de la carte. La date
du jour est ajoutée par le harnais. Si le dossier existe déjà, la commande
refuse et demande d'ajuster le slug. Le dossier créé, shortlist clique Dismiss
sur la carte. Un échec du clic ne défait pas le dossier, la sortie porte alors
cardDismissed à faux.

## Dossier de décision

Le dossier lu par shortlist est un JSON écrit par l'agent. Tous les champs sont
obligatoires. slug porte l'entreprise et le poste, sans date, sous peine d'un
dossier au nom doublement daté.

    {
      "title": "Ornikar, Data Software Engineer",
      "company": "Ornikar",
      "role": "Data Software Engineer",
      "location": "Paris",
      "workplace": "hybrid",
      "url": "https://www.linkedin.com/jobs/view/123",
      "summary": "Data Software Engineer, Python, Paris hybride. Via LinkedIn.",
      "slug": "ornikar-data-software-engineer",
      "analysis": {
        "fit": "Forte correspondance sur Python et les pipelines de données.",
        "company": "Mission éducative, produit grand public.",
        "differentiation": "Expérience des outils agentiques."
      }
    }

## Contraintes du candidat avant un parcours

Le harnais ne filtre pas les offres. La décision shortlist ou reject est
laissée à l'agent. Avant un parcours, l'agent charge les contraintes dures de
la fiche candidat. Une offre hors contraintes, par exemple en télétravail
intégral quand la fiche exige du présentiel, est un reject d'office.

Le flux ne retient pas les écartements d'un parcours à l'autre et republie des
offres déjà traitées, parfois sous un nouveau jobId. Avant de retenir une
carte, l'agent compare entreprise et titre aux dossiers de candidatures/.

## Écarter une carte hors parcours

La sous-commande dismiss écarte une carte par son jobId, indépendamment d'un
parcours, sans toucher à tmp/run.json.

    node walk.mjs dismiss --jobId 4417156077 --stream recommended

LinkedIn ne connaît pas le statut shortlist, qui n'existe que dans le dossier
candidature. Son Dismiss vit dans la liste paginée des flux et marque seulement
la carte comme traitée. La page /jobs/view/<id>/ n'en a pas, et c'est normal.
La commande n'agit donc que sur une carte encore rendue dans la liste. Une carte
que le flux ne rend plus ne peut plus être marquée traitée, et la commande rend
dismissed à faux avec la raison not-found. Le flux cesse souvent de rendre une
carte d'un parcours à l'autre, c'est pourquoi shortlist la marque pendant le
parcours. dismiss sert à rattraper une shortlist sortie avec cardDismissed à
faux.

## Variables d'environnement

LINKEDIN_HARNESS_PROFILE règle le dossier de profil. LINKEDIN_HARNESS_CHROMIUM
règle le binaire chromium. LINKEDIN_HARNESS_CDP_PORT et LINKEDIN_HARNESS_CDP_URL
règlent le point CDP utilisé par les scripts. LINKEDIN_HARNESS_TAB_DIR déplace
le registre d'onglets, /tmp/claude/tabs par défaut.
