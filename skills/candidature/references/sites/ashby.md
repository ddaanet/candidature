# Ashby

## Approche
L'approche est DOM, par événements d'entrée CDP. L'offre et le formulaire se préparent sans
navigateur par deux API publiques, mais seul le formulaire rendu à l'écran
fait foi, et le clic final revient au candidat.

## Lecture sans navigateur
Le board public d'un employeur se lit en JSON. L'API refuse en 403 une
requête sans en-tête `User-Agent`.

    curl -s -A 'Mozilla/5.0' \
      'https://api.ashbyhq.com/posting-api/job-board/<slug>?includeCompensation=true'

Chaque offre porte titre, département, équipe, `isRemote`, `workplaceType`,
`publishedAt`, `jobUrl`, `applyUrl`, et une adresse structurée
(`address.postalAddress.addressCountry`, `secondaryLocations`). Une offre
absente du JSON n'est plus listée, c'est la vérification de vivacité. Le
compte des offres par pays établit si l'employeur emploie en France (Luo,
2026-09-16, quatre offres françaises sur neuf). La page
`jobs.ashbyhq.com/<slug>/<id>` est un shell JavaScript, inutile en `curl`.

Ashby n'expose aucune date de modification d'une offre. Seuls `publishedAt`
et son doublon GraphQL `publishedDate` existent, sept autres noms de champ
ont été refusés (Luo, 2026-09-16). Sur une offre ancienne, la vivacité se
lit mais la fraîcheur du texte ne se lit pas, la question se pose au
recruteur.

Le schéma du formulaire se lit par l'API GraphQL publique, un POST sur
`https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobPosting` avec
`operationName: ApiJobPosting` et les variables
`organizationHostedJobsPageName` (le slug) et `jobPostingId`.

    query ApiJobPosting($o: String!, $j: String!) {
      jobPosting(organizationHostedJobsPageName: $o, jobPostingId: $j) {
        title locationName employmentType publishedDate isListed
        applicationForm { sections { title fieldEntries { isRequired field } } }
      }
    }

Le conteneur s'appelle `fieldEntries` et `field` est un scalaire JSON qui ne
prend pas de sous-sélection. On y lit `type`, `title`, `path` et
`selectableValues`. L'introspection est désactivée, un champ inconnu renvoie
une erreur de validation par champ, ce qui permet de sonder le schéma par
lots. Les `selectableValues` d'une même liste mêlent des UUID et des chaînes
en clair (Mistral AI, 2026-09-17). Un champ peut porter `isRequired: true` et
`isNullable: true` à la fois, l'écran l'exige quand même.

Le HTML servi de `/application` ne contient aucun champ, mais l'état initial
du client y est sérialisé. Il porte le bandeau d'avertissement du formulaire
dans `applicationLimitCalloutHtml`, et la date limite dans
`applicationDeadline`. Un champ absent ou nul signifie qu'il n'y a pas de
bandeau.

    curl -s 'https://jobs.ashbyhq.com/<slug>/<id>/application' \
      | grep -o '"applicationLimitCalloutHtml":"[^"]*"' \
      | sed 's/<[^>]*>/\n/g'

## Contraintes techniques
L'API ne clôt jamais la liste des champs. Un champ absent de l'API peut être
présent à l'écran, et c'est souvent le piège. Un `textarea` invisible sans
libellé placé après le dernier champ réel était absent de l'API (Sticker
Mule, 2026-09-09). Une section « Diversity Survey » facultative était absente
de l'API et du HTML servi, rendue par un second formulaire agrégé au rendu,
reconnaissable au préfixe d'identifiant différent de ses radios (Mistral AI,
2026-09-17). Un contrôle négatif de bloc diversité fait hors navigateur ne
vaut donc pas absence.

Les pièges anti-spam sont posés par l'employeur, sous deux formes. L'une est
visible et porte le libellé « Leave this field blank », elle compte sur la
lecture (RevenueCat, 2026-09-09). L'autre est un `textarea` invisible et muet
(Sticker Mule, 2026-09-09). Relever le libellé et la visibilité de chaque
champ à l'inventaire, un champ qui demande à rester vide reste vide. Trois
contrôles invisibles ou transparents ne sont pas des pièges. Le
`textarea[name="g-recaptcha-response"]` en `display: none` est rempli par le
script du CAPTCHA. Les deux `input[type=file]` de 1 × 1 px ont un
`offsetParent` non nul, ils sont masqués par la zone de dépôt. Les radios à
`opacity: 0` sont habillées par un `span` voisin. Le critère est
`offsetParent`, pas la taille ni l'opacité.

Tout formulaire Ashby porte un reCAPTCHA invisible. La clé de site est la
même chez cinq employeurs sans rapport, c'est celle de la plateforme (Luo et
Mistral AI, 2026-09-17). Le HTML servi peut porter `recaptchaPublicSiteKey`
ou non, un grep négatif ne prouve rien.

Le haut du formulaire peut porter un avertissement absent de l'annonce. Une
limite de recandidature par poste, 365 jours (RevenueCat, 2026-09-09). Une
limite par employeur, trois candidatures en 90 jours sur tous les postes
ouverts, qui fait du choix du poste un arbitrage (Mistral AI, 2026-09-16).
Une mise en garde contre les réponses générées par IA (RevenueCat). Lire ce
bandeau avant de rédiger, et avant de préparer un dossier chez un employeur
qui ouvre beaucoup de postes.

Deux offres du même employeur et de la même équipe peuvent avoir des
formulaires sans commune mesure, dix champs contre dix-huit (Mistral AI,
2026-09-16 et 2026-09-17). Un formulaire peut se réduire aux trois champs
système nom, courriel et CV, le CV porte alors seul la candidature (Luo,
2026-09-16). Une question de prétentions salariales peut être obligatoire
alors que l'annonce ne publie aucune grille, ce qui déplace la décision du
candidat en amont (Mistral AI, 2026-09-17).

La page n'a pas d'élément `<form>` (Alan, Luo, Mistral AI), donc pas de
`checkValidity()`. Les radios portent `required=false` alors que l'API donne
leurs questions obligatoires. Seule la lecture de `checked` par groupe, ou
d'`aria-pressed` sur les paires de boutons, prouve qu'une question est
répondue.

## Formulaire
Les champs système s'appellent `_systemfield_name`, `_systemfield_email`,
`_systemfield_resume`, parfois `_systemfield_coverLetter`. Les sections
peuvent avoir un titre nul ou vide et s'afficher sans intertitre.

Une question fermée a trois rendus possibles, à relever à l'inventaire. Une
paire `button[data-option="yes"|"no"]` avec `aria-pressed`, adossée à une case
cachée dont l'état ne reflète pas la réponse, se clique sur le bouton et se
relit sur `aria-pressed` (Voodoo, RevenueCat). Des `input[type=radio]`
visibles groupés par un `name` de la forme `<idFormulaire>_<path>` (Alan). Des
radios transparentes qu'un clic aux coordonnées du centre bascule (Mistral
AI).

Une liste à nombreuses valeurs est rendue en combobox,
`input[role=combobox]` sans `id` ni `name`, avec une liste
`div[role=listbox]`. Cliquer le champ, taper le nom de l'option, qui filtre la
liste, puis cliquer `[role=listbox] [role=option]`. La valeur se relit dans
`input.value`, et `aria-expanded` repasse à faux.

Les champs longs n'ont ni `maxlength` ni compteur, deux mille caractères
passent (Alan, Mistral AI). La longueur est une décision éditoriale.

## Upload CV
La page porte deux `input[type=file]`. Le premier, sans `id` ni `name`, est
l'import automatique depuis le CV. Le second est le CV, `#_systemfield_resume`,
seul sélecteur sûr, son attribut `accept` ne le distingue pas toujours.
`cdp.mjs upload '#_systemfield_resume' <chemin>` le renseigne, le nom du
fichier s'affiche alors avec un bouton « Replace ».

## Cookies
Aucune bannière n'a été relevée.

## Contournements
Le setter natif de `value` en JavaScript remplit les champs à l'écran sans
passer la validation d'Ashby (Alan, 2026-04-02). Les événements d'entrée CDP
passent, radios et cases compris. Poser le focus par un vrai clic,
`cdp.mjs click <sel>`, puis `cdp.mjs raw Input.insertText '{"text":"..."}'`.
Le focus survit d'une invocation de `cdp.mjs` à la suivante. Un clic sur le
`label` d'un radio a rapporté un succès sans cocher le radio (RevenueCat,
2026-09-09), relire l'état de chaque case et de chaque radio avant de rendre
la main.

L'envoi piloté a été refusé par l'écran « Your application submission was
flagged as possible spam », depuis une IP de centre de données puis depuis
une IP mobile française (Voodoo, 2026-09-01), et encore sur deux essais sur
trois chez RevenueCat. La cause n'est pas établie entre le clic piloté, un
consentement resté décoché et le score du reCAPTCHA invisible. Changer de
réseau n'a pas suffi. La conduite qui a réussi quatre fois sur quatre
(RevenueCat, Alan, Luo, Mistral AI) est la suivante. L'agent remplit tout par
CDP, vérifie l'état effectif des cases et des radios, détache ses clients
CDP, et le candidat clique lui-même « Submit Application ».

L'écran d'erreur comme l'écran de confirmation remplacent le formulaire à la
même URL, et plus aucune valeur saisie n'est lisible. Consigner les valeurs
dans le dossier avant l'envoi, et garder les réponses en fichier pour rejouer
le remplissage par script après un refus.

## Historique
- 2026-04-02 (Alan) : le setter natif ne passe pas la validation.
- 2026-08-27 (Back Market, Voodoo) : l'API posting sert au contrôle de
  vivacité.
- 2026-09-01 (Voodoo) : l'envoi piloté est refusé comme spam, les événements
  CDP passent la validation.
- 2026-09-09 (RevenueCat, Sticker Mule, Solidgate) : les deux formes de piège
  anti-spam, le bandeau de limite, l'API GraphQL et le reCAPTCHA sont
  relevés, l'envoi passe au clic du candidat.
- 2026-09-15 (Alan) : la page n'a pas d'élément `<form>`, l'envoi passe au
  clic du candidat.
- 2026-09-16 (Luo, Mistral AI) : aucune date de modification n'existe, le
  bandeau et la limite par employeur se lisent dans le HTML servi.
- 2026-09-17 (Luo, Mistral AI) : la clé reCAPTCHA est celle de la plateforme,
  la section diversité manque à l'API, deux envois passent au clic du
  candidat.
