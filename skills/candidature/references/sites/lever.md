# Lever

## Approche
L'approche est DOM pour l'inventaire, qui se fait entièrement sans navigateur. L'envoi
piloté est refusé, le candidat saisit et envoie le formulaire depuis sa
propre machine.

## Lecture sans navigateur
WebFetch reçoit un 403 sur les pages Lever, `curl` avec un `User-Agent` de
navigateur reçoit la page complète (Scaleway, 2026-09-16).

    curl -s -A '<User-Agent de navigateur>' \
      'https://jobs.lever.co/<société>/<id>/apply'

Deux API publiques répondent sans clé.

    curl -s 'https://api.lever.co/v0/postings/<société>?mode=json'
    curl -s 'https://api.lever.co/v0/postings/<société>/<id>?mode=json'

La première donne toutes les offres ouvertes avec `categories` (lieu, équipe,
département), `country`, `workplaceType`, `createdAt` en millisecondes et
`salaryRange` quand l'employeur le renseigne. Le compte des offres par pays
établit si la société emploie en France. `categories.department` et
`categories.team` sont indépendants et parfois incohérents, lire `team`
(C12, 2026-09-18).

La seconde donne l'annonce. Les champs `openingPlain`, `descriptionPlain`,
`descriptionBodyPlain`, `additionalPlain` et le `content` de chaque entrée de
`lists` portent le texte intégral, sans « See more » à franchir.
`descriptionBodyPlain` peut être vide sans que l'offre soit incomplète (C12).
La grille salariale est soit dans `salaryRange` (Pigment, 2026-09-18), soit
dans le texte, `additionalPlain` ou `lists` (C12). Chercher aux deux endroits
avant de conclure qu'aucune grille n'est publiée, et lire `salaryRange` sur
tout le board pour situer le poste parmi les postes de même niveau.

Un board Lever garde des offres ouvertes depuis des années, `createdAt` de
2020 à 2024 encore servis (Scaleway, Pigment). L'âge d'une annonce ne dit
rien de la vivacité du recrutement. Une offre jumelle récente sur une autre
géographie établit que l'équipe recrute (Pigment). Une offre fermée répond
404 sur l'API et sur la page, alors que des agrégateurs la listent encore
(C12, 2026-09-18).

Chaque question de l'employeur est une carte. Le HTML de `/apply` porte pour
chacune un `input[type=hidden][name="cards[<uuid>][baseTemplate]"]` dont
l'attribut `value`, après décodage des entités HTML, est le JSON complet de
la carte, titre, champs, `type`, `required` et texte exact des options.
L'ordre des attributs varie, ne pas ancrer une expression régulière sur
`name` avant `value`. Un formulaire sans aucune carte est un résultat, pas un
échec d'extraction (Pigment). Les cartes sont partagées entre offres d'une
même équipe, mêmes UUID. Avant de lire une question obligatoire comme un
filtre du poste, comparer les UUID avec une autre offre du board (Scaleway,
question React sur un poste backend).

Relever le couple libellé affiché (`application-label`) et `name` de chaque
champ, pas la seule liste des `name`. Le libellé est configurable et peut
être trompeur, `urls[Other]` affiché sous le nom de l'employeur (C12,
2026-09-20).

## Contraintes techniques
Toutes les instances observées portent un hCaptcha, avec la même clé de site
chez des employeurs sans rapport, c'est celle de Lever. Il est invisible, le
bouton `#btn-submit` (`type=button`) actionne un `#hcaptchaSubmitBtn` caché
et le défi s'affiche en surcouche au clic. Les deux occurrences de
`g-recaptcha` du HTML sont du code de bibliothèque.

La page porte deux iframes tiers, hCaptcha et « Apply with LinkedIn ».
L'attache Playwright de `tab.mjs` y expire, piloter par `cdp.mjs`.

Un script de la page écrit le fuseau horaire du navigateur dans
`#applicant-timezone`, transmis à l'employeur sans saisie. Le pied de page de
`/apply` peut annoncer un tri par IA qui cherche les incohérences entre le
CV, les réponses et le profil public (C12). Vérifier cette cohérence en
préparation.

L'envoi piloté a été refusé deux fois, « There was an error verifying your
application », alors que le candidat avait résolu le défi lui-même, que le
navigateur sortait par une IP résidentielle française et que la page avait
été rechargée (Pigment, 2026-09-19). La saisie manuelle par le candidat sur
sa machine est passée du premier coup, chez Pigment puis chez C12
(2026-09-20). Un envoi piloté était passé en juin (Kraken, 2026-06-18), la
régression n'est pas datée.

## Formulaire
Le bloc standard porte `resume` (`#resume-upload-input`), `name`, `email`,
`phone`, `location` (`#location-input`), `org`, et une liste d'URL
configurable par l'employeur, de deux à cinq parmi `urls[LinkedIn]`,
`urls[Twitter]`, `urls[GitHub]`, `urls[Portfolio]` et `urls[Other]`. Le jeu
de champs obligatoires varie, le CV peut être facultatif et le lien LinkedIn
obligatoire (Pigment). Les questions portent `cards[<uuid>][field0]`, le
sondage diversité `surveysResponses[<uuid>][responses][field0]`. Il peut
exister un sondage servi après l'envoi seulement.

Un champ caché commandé par un contrôle visible est un contrôle optionnel,
pas un piège. La case `Custom` du champ `Pronouns` révèle
`input[name="pronouns"]`, initialement en `display:none` (Pigment). Les
champs cachés techniques ne se renseignent jamais, `accountId`,
`linkedInData`, `origin`, `referer`, `timezone`, `socialReferralKey`,
`socialSource`, `resumeStorageId`, `h-captcha-response`, `source`,
`selectedLocation`, et le doublon caché d'une case de consentement.

La localisation est une autocomplétion adossée au champ caché
`#selected-location`. Taper avec délai, attendre la liste, cliquer
`.dropdown-results .dropdown-location`. La liste contient des homonymes
d'autres pays.

## Upload CV
Lever analyse le CV joint et réécrit `org` et `selectedLocation`, ce dernier
sans identifiant même quand le champ visible affiche encore la bonne valeur
(Pigment). Joindre le CV en premier, remplir ensuite, puis relire les champs
cachés.

## Cookies
La bannière porte quatre boutons `type=submit` hors de
`#application-form`. Le refus est sans risque pour le formulaire.

## Contournements
Préparer le PDF et le tableau des valeurs de chaque champ dans le README du
dossier, et rendre la main au candidat pour une saisie manuelle dès le
départ, sans tenter l'envoi piloté.

Pour un remplissage piloté d'essai, les champs texte acceptent `fill()`. Les
cases et radios sont imbriqués dans un `<label>`. Un `click()` simple a suffi
chez Pigment. Chez Kraken, ni `check()` ni le clic n'ont changé l'état, et
seul `input.checked = true` suivi des événements `click`, `change` et `input`
l'a fait. Relire `:checked` dans tous les cas.

Après un refus, la page est rendue de nouveau avec les textes conservés, le
CV perdu et les cases décochées. `location.reload()` garde le message
d'erreur, recharger par `Page.navigate`.

Après envoi, Lever redirige vers l'index des offres du board, sans écran de
confirmation dédié (Kraken).

## Historique
- 2026-06-18 (Kraken) : l'envoi piloté passe, le candidat résout le captcha.
- 2026-09-16 (Scaleway) : `curl` et les deux API suffisent à l'inventaire,
  les cartes se lisent dans `baseTemplate`.
- 2026-09-18 (Pigment, C12) : `salaryRange` existe, la grille peut être dans
  le texte, la clé hCaptcha est celle de Lever.
- 2026-09-19 (Pigment) : l'envoi piloté est refusé deux fois, la saisie
  manuelle passe.
- 2026-09-20 (C12) : la saisie manuelle passe, un libellé d'URL trompe le
  candidat.
