# Workable

## Approche
L'approche est DOM, par événements d'entrée CDP. L'API publique donne l'inventaire complet
du formulaire sans navigateur, et son JSON fait foi sur le type des champs.

## Lecture sans navigateur
Le compte est le segment qui suit le domaine dans
`https://apply.workable.com/<compte>/j/<code>/`. Quand l'URL publiée est la
forme courte `https://apply.workable.com/j/<code>`, le compte se lit dans la
redirection, `curl -sIL` sur cette URL (Riot, 2026-09-16).

Tout se lit sans authentification.

    POST https://apply.workable.com/api/v3/accounts/<compte>/jobs      corps {} puis {"token": "<nextPage>"}
    GET  https://apply.workable.com/api/v2/accounts/<compte>/jobs/<code>
    GET  https://apply.workable.com/api/v1/jobs/<code>/form
    GET  https://apply.workable.com/api/v1/accounts/<compte>/gdpr
    GET  https://apply.workable.com/api/v1/widget/accounts/<compte>?details=true

L'endpoint du formulaire ne porte pas le compte, toutes ses variantes qui le
portent répondent 404 (Runware, 2026-09-13, Terabase, 2026-09-16). Il a été
retrouvé en cherchant les littéraux `"/api/v` dans le bundle JavaScript de la
page de candidature, méthode réutilisable sur tout ATS dont la page ne sert
qu'un squelette.

La liste et le widget donnent pour chaque offre `workplace`, `remote`,
`locations` et `published`. Le compte des offres par pays établit si
l'employeur emploie en France. Le régime de présence est dans `workplace`
(`on_site`, `hybrid`, `remote`), pas dans `remote`, qui vaut faux sur les
postes hybrides comme sur ceux au bureau (Riot, 2026-09-16). Le nombre de
jours se lit dans le texte ou dans une question.

Le formulaire est un tableau de sections, chaque champ avec `id`, `label`,
`type`, `required`, et selon le type `maxLength`, `supportedFileTypes` ou
`fields` pour les groupes répétables `education` et `experience`. Les
identifiants `QA_<nombre>` sont des questions d'offre, les `CA_<nombre>` des
champs définis au niveau du compte. Les champs standard s'appellent
`firstname`, `lastname`, `email`, `phone`, `address`, `resume`,
`cover_letter`, `summary`, `avatar`.

Interroger le formulaire des offres sœurs paie. Une question obligatoire
propre à une offre trie sur la stack (Runware, « PHP or Go »). Une question
identique sur toutes les offres du compte est un gabarit, pas un filtre du
poste (Riot). Seule la comparaison tranche.

## Contraintes techniques
Le JSON fait foi sur le type, pas le DOM. Un champ de prétentions salariales
rendu en `input[type="text"]` était déclaré `number` par l'API, donc un
entier sans formulation possible (Terabase, 2026-09-16). Le composant pose
lui-même le séparateur de milliers, saisir le nombre sans séparateur.

L'API ne dit rien de la visibilité effective des champs ni des limites
imposées par un compteur à l'écran. Le relevé à l'écran reste nécessaire.

Le CAPTCHA est Cloudflare Turnstile, configuré par compte. Le HTML servi le
déclare en clair, `turnstileWidgetSiteKey` et `"recaptcha": false`, un
`curl -sL` suffit. Chez Terabase le widget n'était pas monté au moment du
clic, le défi est resté invisible et s'est résolu seul à l'envoi
(2026-09-17). Le mode peut différer d'un compte à l'autre, le vérifier à
l'écran avant l'envoi.

Le champ `address` arrive prérempli par la géolocalisation de l'adresse IP
de l'appelant, avec `"prefilledByLocation": true`. La valeur est fausse,
une ville étrangère depuis la sandbox, une commune voisine depuis la machine
du candidat (Riot et Terabase, 2026-09-16). La remplacer toujours. Les
sous-champs `city`, `postcode` et `country` du widget d'adresse sont
visibles, sans libellé, et restent vides sans bloquer l'envoi.

## Formulaire
Les groupes `education` et `experience` ne créent leurs sous-champs qu'après
un clic sur `button[aria-label="Add Education"]` ou `"Add Experience"`. Une
entrée ouverte expose `#school`, `#field_of_study`, `#degree`, ou `#title`,
`#company`, `#industry`, `#summary`, plus `start_date`, `end_date` et
`current`. Elle se valide par un bouton « Update » sans `aria-label` ni `id`,
à retrouver par son texte. Une entrée validée expose des liens
`a[aria-label="Edit <titre>"]` et `a[aria-label="Delete <titre>"]`. Workable
réordonne les entrées de la plus ancienne à la plus récente.

Sous chaque entrée validée, une durée comme « (almost 15 years) » est
calculée par Workable en mois exclusifs. Elle n'est dans aucun champ, ne se
modifie pas et ne part pas avec la candidature.

Le téléphone se saisit en numéro national derrière l'indicatif déjà
sélectionné. Le bouton « Autofill application » préremplit depuis le CV, ne
pas l'utiliser sans relire ce qu'il écrit.

## Upload CV
Le CV se joint par `cdp.mjs upload <sel> <chemin>`. L'input expose ensuite une valeur
`C:\fakepath\<fichier>`, c'est normal, la zone de dépôt affiche le vrai nom
et propose « Replace file ».

## Cookies
Une bannière s'ouvre au chargement et apporte quatre boutons
`type=submit`. Le choix revient au candidat.

## Contournements
Les champs texte acceptent `Input.insertText` après un vrai clic de focus.
Pour remplacer une valeur préremplie, la sélectionner par `.select()` puis
insérer.

Les dates des groupes sont des `react-datepicker`, `input[type="text"]` au
format `MM/YYYY`. `Input.insertText` les laisse vides sans erreur. Seules de
vraies frappes les renseignent, `cdp.mjs keys 04/2009` puis
`cdp.mjs key Enter` (Terabase, 2026-09-17). Le mois est obligatoire, une
scolarité datée en années prend un mois choisi.

Enchaîner « Add » et les saisies sans attendre le rendu corrompt les
entrées, deux employeurs se sont retrouvés concaténés dans un même champ.
Attendre le rendu du bloc, relire chaque champ juste après sa saisie, et
valider par « Update » avant d'ouvrir l'entrée suivante.

Le bouton d'envoi est le seul `button[type=submit]` du formulaire, mais la
bannière de cookies en apporte d'autres, le sélectionner par son libellé. Le
clic revient au candidat. La confirmation est à `.../apply/?success`,
« Thank you! Your application has been submitted successfully. »

## Historique
- 2026-04-06 (DataGalaxy) : l'écriture par script échoue à l'époque du
  navigateur par extension, le candidat remplit à la main.
- 2026-09-13 (Runware) : l'API publique et l'endpoint du formulaire sont
  retrouvés dans le bundle.
- 2026-09-16 (Riot, Terabase) : `workplace` porte le régime de présence,
  Turnstile est déclaré, l'adresse est géolocalisée, le JSON fait foi sur le
  type.
- 2026-09-17 (Terabase) : les dates exigent de vraies frappes, Turnstile se
  résout seul, l'envoi passe au clic du candidat.
