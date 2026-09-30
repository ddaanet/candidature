# Teamtailor

## Approche
L'approche est DOM. Le HTML servi porte tout le formulaire, l'inventaire se
fait sans navigateur. Au remplissage, les obligations et les contrôles sont
posés par des contrôleurs Stimulus que les attributs HTML ne reflètent pas.

## Lecture sans navigateur
Le feed `/jobs.json` d'une instance rend toutes les offres ouvertes en JSON
Feed, chacune avec son `_jobposting` schema.org complet, description,
`datePosted`, `employmentType`, `jobLocation` et `baseSalary` quand
l'employeur le renseigne. Il répond sur un sous-domaine
`<instance>.teamtailor.com` comme sur un domaine propre, `/jobs.rss` aussi
(Deepki et padoa, 2026-09-18). `<url-de-l-offre>.json` répond 406. La page
`/jobs` peut ne contenir aucun lien d'offre, sa liste étant construite en
JavaScript. Le feed établit en une requête qu'aucune offre ne publie de
grille, et une grille présente sur d'autres offres du board prouve que son
absence est un choix de l'employeur (Deepki, grilles sur les seuls postes
de Londres et New York).

Le JSON-LD ne fait pas autorité. Il a porté une adresse périmée depuis un
déménagement (CarCutter, 2026-09-13) et `employmentType: CONTRACTOR` sur un
CDI (padoa, 2026-09-18). Le confronter au texte et aux métadonnées affichées
de la page. Sa description peut être encodée en entités HTML une ou deux
fois, appliquer `html.unescape` jusqu'à point fixe avant de convertir.

Le formulaire se lit par un GET de `/jobs/<slug>/applications/new`, qui porte
tous les champs et libellés. Les questions de l'employeur s'appellent
`candidate[answers_attributes][N][...]`. Une question obligatoire porte
`data-question-mandatory="true"` sur son conteneur, sans attribut `required`.
Trier les questions sur cet attribut, pas sur leur indice.

Le HTML servi trompe sur trois points que l'hydratation corrige. Le bloc de
téléversement du CV y est un `<template>` dont l'input porte `disabled`, le
vrai champ est créé par Dropzone. Le champ caché `city` y est présent et le
JavaScript le retire. La section « Get personal » y apparaît comme cinq
questions, ce sont des gabarits inertes que rien ne remplit si le candidat
ne les ajoute pas (Deepki, 2026-09-20).

## Contraintes techniques
Le jeu de questions varie d'une instance à l'autre, de zéro à six questions,
obligatoires ou toutes facultatives. Les prétentions salariales y sont en
texte libre, en nombre ou absentes. L'autorisation de travail est en radios
ou en texte libre. Explorer le formulaire à chaque fois. Une question
obligatoire du type « pourquoi ce poste » peut coexister avec une lettre
facultative, ne pas supposer que la lettre porte le dossier.

`form.checkValidity()` ne vaut que comme détecteur d'absence de CV. Le champ
du CV est le seul `required` natif. Les champs d'identité, les questions
obligatoires et la case de consentement échappent au contrôle, douze champs
obligatoires sur treize chez Deepki (2026-09-20). Relire chaque champ
obligatoire un par un avant de rendre la main.

La bannière de cookies est un `<dialog open>` non modal qui capture le focus.
Tant qu'elle est ouverte, tout `focus()` est repris par la bannière, et les
champs qui exigent des événements de confiance restent hors d'atteinte. Le
remplissage par affectation de `value` passe malgré elle, ce qui masque le
blocage. Elle recouvre aussi la case de consentement et le bouton d'envoi
quand la page est défilée en bas (CarCutter, WeWard, Deepki). La trancher
est la première étape de tout remplissage, et le choix revient au candidat.

Le lien « JOB AD » en haut du formulaire fait perdre toute la saisie.
Teamtailor ne garde aucun brouillon et le retour arrière rend un formulaire
vierge (CarCutter, 2026-09-16). Prévenir le candidat avant de lui rendre la
main.

La plateforme sait poser un hCaptcha, activable par instance, par le
contrôleur Stimulus `forms--captcha` que les scripts de la page importent.
Aucune instance observée ne l'avait monté. Le grep du CAPTCHA porte sur les
modules importés, pas seulement sur le fichier d'entrée.

Une panne de plateforme a rendu 500 et 502 sur trois instances à la fois
pendant vingt minutes, domaines propres compris (2026-09-16). Une erreur 500
sur une offre n'est pas un retrait, vérifier une seconde instance, et
attendre le retour par `curl --retry 12 --retry-delay 30 --retry-all-errors`.
La racine d'un site carrière peut répondre 200 pendant que le reste échoue.

## Formulaire
Le formulaire est sur la page de l'offre. « Apply for this job » ne fait que
déployer le formulaire ou y défiler. Le vrai bouton d'envoi est
`input[name=commit]`, en bas, sous le consentement, et son libellé est
traduit selon l'instance. Le cibler par son `name`.

Les identités sont `candidate_first_name`, `candidate_last_name`,
`candidate_email`, `candidate_phone`, la lettre
`candidate_job_applications_attributes_0_cover_letter`, le consentement
`candidate_consent_given`, doublé d'un champ caché à zéro. Le prénom et le
nom peuvent porter `maxlength="50"`, les questions et la lettre n'ont ni
limite ni compteur.

Les identifiants des radios changent d'un chargement à l'autre, les
`question_id` restent. Cibler
`input[name="candidate[answers_attributes][N][boolean]"][value="true"]` et
relire `checked` après le clic.

Une question d'années peut être un curseur, `candidate[answers_attributes][N][range]`,
qui s'initialise à zéro et se déclare lui-même répondu. Ne rien toucher
déclare zéro année, sans alerte. Seule la frappe réelle met le curseur, le
champ numérique et l'affichage d'accord. Cliquer
`[data-action*="range#editNumber"]`, focaliser le champ numérique,
sélectionner son contenu par un Ctrl+A réel (`Input.dispatchKeyEvent` avec
`modifiers: 2`), taper les chiffres, puis relire la valeur du curseur
(CarCutter, 2026-09-16).

Une question à choix peut être une liste Stimulus qui cache ses radios, et le
menu ne s'ouvre pas sous pilotage. Un `click()` en JavaScript sur
`button[data-action*="forms--inputs--choice#selectRadio"][data-value="N"]`
coche le radio caché. Toujours scoper par `data-action`, un filtre sur le
texte « Linkedin » attrape le bouton de partage du site carrière (papernest,
2026-08-29).

Le `textarea` de la lettre conserve les retours à la ligne. Déplier chaque
paragraphe d'un texte à lignes coupées avant de le saisir. Une question
longue peut n'afficher que trois lignes d'une soixantaine de caractères, à
savoir avant de calibrer.

La section « Get personal » est facultative. Un bouton `+` ouvre un menu de
cinq cartes, fait insolite, questions à soi-même, favoris, super-pouvoir,
chanson, qui se pilotent par `click()` en JavaScript. La proposer au
candidat. Dans une carte de favoris, choisir la catégorie avant de remplir,
en changer détruit le champ et sa valeur. Plusieurs catégories demandent
plusieurs cartes. La couleur est un sélecteur de couleur. Un lien de chanson
fait apparaître un lecteur qui confirme le morceau.

## Upload CV
Le CV se joint par `cdp.mjs upload '#candidate_resume_remote_url' <chemin>`,
sur l'entrée que Dropzone superpose à la zone de dépôt, à `opacity: 0` et à
`offsetParent` non nul. Ce n'est pas un piège. Après l'envoi du fichier,
l'entrée devient un `input[type=text]` porteur d'une URL S3, donc le contrôle
se fait sur `.dz-success` et le nom affiché dans `[data-dz-name]`, pas sur
`input.files`. Le CV accepte `.doc, .docx, .pptx, .pdf, .pages, .txt, .rtf`.

## Cookies
La bannière propose d'accepter tout ou de refuser les cookies non
nécessaires, « Strictly necessary » coché par défaut. Voir ses pièges plus
haut.

## Contournements
Un script qui avait coché le consentement et joint le CV a envoyé la
candidature sans clic sur le bouton d'envoi (Goodays, 2026-06-20). Le
comportement ne s'est reproduit sur aucune des cinq instances suivantes, mais
le consentement, le CV et l'envoi restent les dernières étapes, faites après
accord du candidat. Le consentement a pu passer à coché entre deux scripts
sans que le script le touche, le relire avant l'envoi.

Le clic sur `input[name=commit]` revient au candidat. La page de succès est
`/jobs/<slug>/applications/<uuid>/thanks/<token>`, titre « Applied to … »,
suivie d'une étape « Connect » facultative avec sa propre case. La
candidature est déjà enregistrée à ce stade. Un sélecteur `[class*=error]`
y remonte des libellés de consentement et de connexion qui ne sont pas des
erreurs.

## Historique
- 2026-03-17 (Wiremind) : l'input du CV est masqué par Dropzone.
- 2026-06-20 (Goodays) : une soumission part sans clic d'envoi.
- 2026-06-22 (Descartes) : `input[name=commit]` est le vrai bouton d'envoi.
- 2026-08-27 (bsport) : le GET de `/applications/new` donne l'inventaire.
- 2026-08-29 (papernest) : une liste Stimulus cache ses radios.
- 2026-09-13 (CarCutter, WeWard) : le feed `jobs.json` donne les offres,
  `data-question-mandatory` porte l'obligation.
- 2026-09-16 (CarCutter, WeWard) : la bannière capture le focus, le curseur
  se déclare répondu, `checkValidity()` ignore l'identité, une panne touche
  trois instances.
- 2026-09-18 (Deepki, padoa) : le feed répond sur domaine propre, le JSON-LD
  ne fait pas autorité.
- 2026-09-20 (Deepki) : « Get personal » est fait de gabarits, l'entrée du CV
  devient une URL S3.
