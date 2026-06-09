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

## Variables d'environnement

LINKEDIN_HARNESS_PROFILE règle le dossier de profil. LINKEDIN_HARNESS_CHROMIUM
règle le binaire chromium. LINKEDIN_HARNESS_CDP_PORT et LINKEDIN_HARNESS_CDP_URL
règlent le point CDP utilisé par les scripts.
