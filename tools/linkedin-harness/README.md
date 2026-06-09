# Harnais LinkedIn

Contrôle navigateur Playwright pour le parcours d'offres LinkedIn sur Claude
Code. La conception détaillée et la carte des flux sont dans DESIGN.md.

## Prérequis

Un chromium système et node. La dépendance s'installe avec npm install dans ce
dossier. Elle ne télécharge pas de navigateur.

## Lancer le navigateur

./launch.sh ouvre un chromium en tête avec un profil persistant et le port CDP
9222. Le profil par défaut est ~/.config/chromium-playwright.

Se connecter à LinkedIn à la main dans cette fenêtre. La session persiste dans
le profil entre les lancements, jusqu'à expiration du cookie côté LinkedIn.

## Identifier les flux

npm run streams attache Playwright à la session ouverte et liste les sections et
les collections de la page jobs. Si la session n'est pas connectée, le script le
signale et s'arrête.

## Parcourir un flux

npm run walk pilote le parcours de cartes. La boucle lit la carte au focus,
attend une décision, et passe à la carte suivante. L'agent décide, le driver
tient l'état dans tmp/run.json et exécute les effets. Une décision parmi trois,
shortlist crée une page candidature Notion, reject écarte la carte par Dismiss,
stop arrête le parcours.

Avant un parcours, le jeton d'intégration Notion doit être en place. Le code le
lit dans la variable NOTION_TOKEN, sinon dans ~/.config/candidature/notion.env
sous la forme NOTION_TOKEN=ntn_... Ce fichier porte un secret, le passer en
chmod 600. L'intégration doit aussi être connectée à la page racine Notion qui
reçoit les candidatures, sans quoi l'écriture échoue avec un refus d'accès.

La séquence commence par un démarrage qui rend la première carte.

    node walk.mjs start --stream recommended --target 3 --root <pageId>

Chaque décision suit, sur la carte rendue par l'appel précédent.

    node walk.mjs decide --action reject
    node walk.mjs decide --action shortlist --record tmp/record.json
    node walk.mjs decide --action stop

node walk.mjs status relit l'état courant sans rien changer. Le parcours se
termine de lui-même quand la cible de shortlists est atteinte ou quand le flux
est épuisé, et rend alors un objet avec done à vrai et la raison.

Le dossier de décision lu par shortlist est un JSON. La forme attendue.

    {
      "title": "Ornikar — Data Software Engineer",
      "company": "Ornikar",
      "role": "Data Software Engineer",
      "location": "Paris",
      "workplace": "hybrid",
      "url": "https://www.linkedin.com/jobs/view/123",
      "summary": "Data Software Engineer, Python, Paris hybrid. Via LinkedIn.",
      "analysis": {
        "fit": "forte correspondance Python",
        "company": "mission édutech",
        "differentiation": "profil agentic"
      }
    }

## Variables d'environnement

LINKEDIN_HARNESS_PROFILE règle le dossier de profil. LINKEDIN_HARNESS_CHROMIUM
règle le binaire chromium. LINKEDIN_HARNESS_CDP_PORT et LINKEDIN_HARNESS_CDP_URL
règlent le point CDP utilisé par les scripts. NOTION_TOKEN porte le jeton
d'intégration Notion utilisé par le parcours, à défaut lu dans
~/.config/candidature/notion.env.
