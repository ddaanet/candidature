# Harnais LinkedIn, document de conception

Harnais de contrôle navigateur pour le parcours d'offres LinkedIn sur la cible
Claude Code. Réalise la couche navigateur prévue par la spec plugin du
2026-04-24, section 5. Sert de socle au triage d'offres, construit par-dessus
lors d'une itération suivante.

## Contexte

Le skill candidature passe de Claude.ai à un plugin Claude Code pour lever la
limite de tours qui bloque les tâches longues, le triage d'offres en premier.
Le contrôle navigateur sur Claude Code passe par un runtime Playwright local
plutôt que par le MCP, plus capable et moins coûteux en jetons. Ce dossier
contient le socle validé de cette couche.

## Besoins fonctionnels

FR-1. Se connecter à une session LinkedIn déjà authentifiée et la piloter. Le
harnais attache Playwright à un navigateur en tête déjà ouvert. Il ne lance pas
de navigateur jetable.

FR-2. Identifier les flux d'offres disponibles sur la page jobs. Un flux est
une section de recommandations ou une collection navigable.

FR-3. Parcourir les cartes d'un flux une à une, décider de chacune, et écrire
les retenues dans Notion. Le driver walk.mjs lit la carte au focus, attend une
décision parmi shortlist, reject et stop, écarte les rejetées par Dismiss, crée
une page candidature Notion par retenue, et avance jusqu'à une cible de
shortlists ou l'épuisement du flux.

## Besoins non fonctionnels

NFR-1. Le harnais ne touche jamais aux identifiants. L'utilisateur se connecte à
la main dans la fenêtre visible. Si une page de connexion ou de contrôle
apparaît, le script s'arrête et rend la main.

NFR-2. La navigation s'appuie sur l'arbre d'accessibilité, pas sur les classes
CSS. Les rôles et les noms accessibles sont le point d'accroche stable.

NFR-3. Le rythme reste humain, sur le compte de l'utilisateur, sans
falsification d'empreinte. La robustesse vient de l'usage de la couche
d'accessibilité, qui est aussi ce qui rend le harnais respectueux.

NFR-4. Pas de téléchargement de navigateur. Le harnais utilise playwright-core
et le chromium du système.

## Décisions de conception

### Attache CDP à un profil persistant

Choix retenu. Un chromium en tête est lancé une fois avec un profil persistant
et un port de débogage CDP. Chaque script se connecte par connectOverCDP,
réutilise le contexte authentifié, et pilote les onglets visibles. Un appel à
browser.close() sur une connexion CDP ferme la connexion, pas la fenêtre.

L'alternative, lancer un navigateur neuf à chaque script, imposerait une
reconnexion à chaque exécution et déclencherait les défenses anti-robot de
LinkedIn sur la connexion automatisée. Le profil persistant garde la session
vivante entre les exécutions, jusqu'à expiration du cookie côté LinkedIn.

### Navigation par l'arbre d'accessibilité

Choix retenu. Les sélecteurs sont des couples rôle plus nom accessible, obtenus
par getByRole et ariaSnapshot. Les classes CSS de LinkedIn sont obfusquées et
changent à chaque déploiement. La couche d'accessibilité est un contrat envers
les lecteurs d'écran que LinkedIn ne peut pas casser sans devenir inaccessible.
Elle est donc le point d'accroche le plus durable.

### Bootstrap partagé

Choix retenu. attach.mjs centralise la connexion CDP et le test
d'authentification. Les scripts de flux l'importent. Cela évite de réécrire la
séquence de connexion et le test de page de login dans chaque script.

### Parcours par réduction, état externalisé, écriture Notion directe

Choix retenu. Le parcours suit le principe 12-factor-agents. L'agent est un
réducteur sans état qui rend une décision par carte. Le driver walk.mjs tient
le flux de contrôle, externalise l'état dans tmp/run.json, et exécute les
effets. Trois sous-commandes, start, decide, status, chacune rend un JSON que
l'agent lit avant de rappeler. La boucle vit dans le code, pas dans la tête de
l'agent.

L'avance vers la carte suivante se fait par jobId non encore décidé. Le clic
sur un listitem nu ne change pas la carte au focus, et une carte écartée reste
en tête sous un état Undo. Le driver liste donc les liens de carte du flux,
dédupliqués par jobId, et met au focus la première carte dont le jobId n'est
pas dans l'ensemble des cartes déjà vues. Cet ensemble vit dans l'état de run,
ce qui rend le parcours insensible au rechargement et aux réordonnancements du
flux. La bannière de consentement aux cookies est refusée au chargement, son
titre de niveau 1 passait sinon avant celui du détail de l'offre.

L'écriture Notion passe par l'API REST avec un jeton d'intégration, pas par le
MCP. Le harnais tourne sur Claude Code où le MCP Notion authentifié via
claude.ai n'est pas garanti présent. Le jeton se lit dans NOTION_TOKEN ou dans
~/.config/candidature/notion.env. Une page candidature est créée par offre
retenue sous la racine, avec un paragraphe d'index daté ajouté au corps de la
racine.

### playwright-core et chromium système

Choix retenu. La dépendance est playwright-core, qui fournit l'API sans
embarquer de navigateur. Le binaire utilisé est le chromium du système. Validé
en playwright-core 1.60.0 contre chromium 149.

La spec section 5 évoquait un playwright-base.py, en Python. La validation s'est
faite en JavaScript sur node, parce que connectOverCDP et la localisation par
rôle y sont directs. Le placeholder Python de la spec est antérieur à cette
validation.

## Carte des flux LinkedIn

Page de départ, https://www.linkedin.com/jobs/. Quatre sections de premier
niveau, chacune un titre de niveau 2 dans le repère main, chacune avec un lien
d'expansion qui porte le slug de sa collection.

| Section (titre niveau 2) | Slug de collection |
|---|---|
| Top job picks for you | recommended |
| Jobs where you're more likely to hear back | top-applicant |
| Explore with job collections | sélecteur de collections |
| More jobs for you | recommended (variante JYMBII) |

La section Explore with job collections est un sélecteur d'onglets en boutons
(rôle button), pas des liens. La collection active porte un nom accessible
suffixé selected. Les chips observés sont Hybrid, Easy Apply, Manufacturing, et
un bouton More qui révèle le reste.

La page d'un flux, par exemple /jobs/collections/recommended/, est une vue à
deux panneaux. La liste des cartes est à gauche, le détail à droite. Cliquer une
carte met à jour currentJobId dans l'URL et change le panneau de détail.

Points d'accroche stables pour le parcours à venir.

- Les sections viennent de page.getByRole('main').getByRole('heading', { level: 2 }).
- Les chips de collection viennent de getByRole('button'), l'actif par un nom finissant par selected.
- L'expansion par flux vient de getByRole('link', { name: 'Show all available jobs' }).
- L'appartenance d'une carte à une collection se lit dans le segment /jobs/collections/<slug>/ de son href, le reste de la requête est du bruit de suivi.

## Limites connues

Les noms de classes changent à chaque déploiement, donc tout sélecteur CSS est
fragile. Le harnais les évite par principe.

Les sections se chargent au défilement. Le script de flux défile plusieurs fois
avant de lire l'arbre.

La connexion, la double authentification et les CAPTCHA restent manuels, par
conception. Le harnais détecte la page de connexion et s'arrête.

L'usage doit rester à rythme humain, sur le compte de l'utilisateur. Le parcours
de masse sort de ce cadre.

## Historique

Session des 2026-06-08 et 2026-06-09. Validation de l'attache CDP sur session
persistante, de la navigation par accessibilité, et de l'identification des flux
LinkedIn. Scripts d'abord prototypés en jetable, puis packagés ici.

Session du 2026-06-09. Implémentation du parcours de cartes, FR-3. Cœur pur
testé en TDD pour l'état de run, la validation du dossier de décision, et la
construction des charges Notion. Adaptateurs Playwright et Notion vérifiés en
réel contre le flux recommended et la page racine Recherche d'emploi. L'avance
par jobId non vu et le refus de la bannière de consentement ont été tranchés sur
le DOM vivant, le premier jet par clic de listitem ne naviguait pas. Choix de
l'écriture Notion directe par jeton REST plutôt que par le MCP, pour ne pas
dépendre d'un MCP authentifié sur la cible Claude Code.
