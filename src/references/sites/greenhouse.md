# Greenhouse

## Approche
L'approche est DOM, et le DOM est fiable. Tout le formulaire se remplit par script, react-select et
téléversement compris, sauf le clic final qui revient au candidat.
L'inventaire se fait sans navigateur par l'API publique et le HTML servi.

## Lecture sans navigateur
Une requête donne toutes les offres ouvertes d'un board.

    curl -s 'https://boards-api.greenhouse.io/v1/boards/<board>/jobs' \
      | jq -r '.jobs[].location.name' | sort | uniq -c | sort -rn

Le comptage des localisations dit où l'employeur emploie. Si l'employeur
nomme le pays du candidat sur d'autres annonces, son absence sur l'offre
visée est délibérée, même à côté d'une étiquette `Remote - Europe` (Nebius,
2026-09-16). `location.name` est le champ que le candidat lit à l'écran et
qui fait foi, `offices` est un rattachement interne qui le contredit
souvent. Une entité dans le pays ne prouve pas l'éligibilité d'un poste
donné. Une société peut avoir plusieurs boards aux postes et à la langue
différents, vérifier le board d'origine de l'offre (Mirakl, 2026-04-09).

L'offre et ses questions se lisent par
`https://boards-api.greenhouse.io/v1/boards/<board>/jobs/<id>?questions=true`.
Le JSON porte plusieurs champs qui trient un dossier avant toute analyse.

La grille salariale est publiée en fin du champ `content`, dans un bloc
`div.content-pay-transparency` placé après la notice d'égalité des chances.
La lire avant toute analyse d'adéquation (Mozilla, 2026-09-16, plafond
français sous le plancher, Algolia, 2026-09-18).

`ai_disclaimer`, `include_ai_disclaimer` et `ai_opt_out_request_url` disent
si l'employeur encadre l'usage de l'IA. Trois régimes ont été rencontrés,
une déclaration obligatoire d'écriture sans assistant qui interdit tout texte
généré (Canonical, 2026-09-12), le silence (Mozilla), et une case d'accusé de
lecture d'une politique IA qui autorise l'assistance (Algolia, 2026-09-18).
La politique se lit avant de rédiger.

`data_compliance` annonce les cases de consentement RGPD que `questions` ne
liste pas. `compliance` et `demographic_questions` annoncent le bloc
d'auto-déclaration américain et les questions de diversité, leur valeur
nulle signale leur absence. `location_questions` annonce un champ de ville à
autocomplétion, doublé de `latitude` et `longitude` cachés que le composant
renseigne (Nebius). `requisition_id` identifie l'ouverture réelle, une même
réquisition peut porter une annonce par pays avec une grille par pays, et
`first_published` date l'ouverture dans chaque pays (Mozilla, neuf annonces
pour un poste).

Le régime de présence et l'éligibilité peuvent n'exister que dans le libellé
d'une question obligatoire, plus précis que le corps de l'annonce (Algolia,
« This role is hybrid, based in Paris (2 days/week in-office) »). Lire les
libellés de `questions` avant de conclure sur le présentiel. Un board peut
n'avoir aucun champ de lettre de motivation, le CV porte alors seul le
dossier (Algolia). Un `multi_value_single_select` dont le libellé dit
« select all that apply » n'accepte qu'une valeur, le `type` fait foi.

Depuis le 2026-09-16, la page `job-boards.greenhouse.io/<board>/jobs/<id>`
est rendue côté serveur et porte tous les contrôles du formulaire, avec leurs
`id`, `aria-required`, `maxLength` et la configuration du board. L'inventaire
complet se fait par `curl`, bloc éducation et bloc diversité compris. Le
reCAPTCHA se lit dans cette configuration, `RECAPTCHA_INVISIBLE_KEY`,
`RECAPTCHA_ENDPOINT` et `disable_captcha`. Chercher `captcha` et `RECAPTCHA`,
pas `g-recaptcha`, que le script injecte après chargement.

## Contraintes techniques
Certains boards redirigent en 302 vers la page carrière de l'employeur
(Datadog, 2026-09-14, Nebius, 2026-09-16). Le formulaire y vit dans une
iframe `job-boards.greenhouse.io/embed/job_app?for=<board>&validityToken=...`
dont le jeton est émis par la page carrière. Il faut donc passer par la page
de l'employeur. Sur une page carrière rendue côté client, le grep du HTML
servi ne trouve ni l'annonce ni le CAPTCHA, et ce zéro ne veut rien dire.
Vérifier la redirection avant d'ouvrir le board.

Cette iframe est une cible CDP séparée, de type `iframe`, listée par
`/json/list` avec son propre websocket. Un `eval` sur la page porteuse ne
voit aucun champ. `tab.mjs adopt` ne retient que les pages, inscrire le
`targetId` de l'iframe à la main dans le registre d'onglets
(`/tmp/claude/tabs/<propriétaire>.json`) puis piloter par `cdp.mjs`.
L'identifiant change à chaque rechargement de la page porteuse et survit à
l'envoi.

L'API omet des champs obligatoires affichés, le pays du téléphone en
react-select et la case de consentement au bloc démographique (Datadog).
L'API peut déclarer le téléphone facultatif alors que le HTML porte
`aria-required="true"` (Mozilla). Le relevé à l'écran reste obligatoire.

`form.checkValidity()` ne voit pas prénom, nom, courriel, téléphone, pays ni
CV, qui ne portent qu'`aria-required` (Algolia, 2026-09-19). Un formulaire
sans CV passe ce contrôle. Relire ces champs un par un. Chaque react-select
obligatoire porte un relais `input` à `opacity: 0` qui sert à la validation
native et disparaît quand la liste est renseignée, leur nombre restant compte
les listes vides.

## Formulaire
Les champs texte ont des identifiants stables, `first_name`, `last_name`,
`email`, `phone`, `question_<id>` pour les questions de l'employeur. Les
champs d'une ligne portent `maxlength="255"`. Les listes sont des
react-select, `role=combobox` sur un `input`, conteneur `.select__control`.
Le bloc téléphone récent associe `#country` en react-select et
`#candidate-location` en autocomplétion géographique.

Un numéro saisi en `+33 ...` a posé la France dans `#country` sur un board
(Algolia, 2026-09-19) et pas sur deux autres (Datadog, Mozilla). Vérifier le
pays à chaque formulaire.

« Enter manually », à côté de « Attach » sous le CV et la lettre, révèle
`textarea#resume_text` et `textarea#cover_letter_text`, sans limite de
longueur. C'est le moyen de faire passer une lettre sans produire de PDF.

Trois champs invisibles ne sont pas des pièges et ne se remplissent pas, la
recherche de pays `input#iti-0__search-input` de l'ancien composant
téléphone, le `textarea[name="g-recaptcha-response"]` du reCAPTCHA invisible,
et les relais de validation des react-select.

Deux boutons hors du formulaire ne se pressent pas, « Apply », qui fait
défiler, et « Autofill my application », qui renvoie vers `my.greenhouse.io`.

L'interface se traduit selon la langue du navigateur. La langue de l'annonce
et celle de la candidature n'en dépendent pas.

## Upload CV
`cdp.mjs upload <sel> <fichier>` renseigne l'input fichier par
`DOM.setFileInputFiles`. Après téléversement, `input#resume` est retiré du
DOM, le contrôle se fait sur le nom affiché dans `.file-upload__filename`.
Le CV accepte les formats `pdf, doc, docx, txt, rtf`.

## Cookies
Le domaine `job-boards.greenhouse.io` n'affiche pas de bannière.

## Contournements
Les champs texte se remplissent par le setter natif de `value` suivi des
événements `input` et `change` (Mirakl, 2026-04-09).

Les react-select ignorent les événements JavaScript synthétiques et répondent
aux événements clavier de confiance de CDP, iframe comprise (Datadog,
2026-09-14, huit listes remplies du premier coup). Donner le focus au
combobox, ouvrir le menu par `cdp.mjs key ArrowDown`, taper le texte de
filtrage par `cdp.mjs keys`, lire les options affichées, puis presser
`ArrowDown` autant de fois que l'index de l'option voulue et `Enter`. Le
filtre travaille par sous-chaîne, taper `Male` fait remonter `Female` en
premier, donc chercher l'égalité exacte avant de valider. Lire les options
sous `.select__menu` ou par l'identifiant `react-select-<champ>-option-<n>`,
un `[role="option"]` global ramène aussi les 244 pays du composant téléphone
caché. Relire `.select__control` après chaque choix. Pour un choix multiple,
répéter la séquence.

Le DOM ne restitue pas la valeur d'un react-select renseigné. Pour archiver
les valeurs saisies, relever le texte visible de la page, la valeur retenue
suit l'intitulé de la question (Canonical, 2026-09-12).

Le clic sur « Submit application » revient au candidat. Le reCAPTCHA
Enterprise invisible n'a rien opposé au remplissage piloté suivi du clic du
candidat (Datadog, Algolia). La confirmation arrive à `.../confirmation`,
dans l'iframe quand le formulaire est embarqué.

## Historique
- 2026-04-09 (Mirakl Labs) : première soumission, react-select et
  téléversement faits à la main à l'époque du navigateur par extension.
- 2026-09-09 (Canonical) : l'API `?questions=true` donne l'inventaire, le
  board compte les postes par pays.
- 2026-09-12 (Canonical) : le candidat saisit tout, la déclaration d'écriture
  sans IA interdit le texte généré.
- 2026-09-14 (Datadog) : le formulaire est en iframe chez l'employeur, les
  événements CDP pilotent les react-select, le téléversement passe, le
  candidat clique l'envoi.
- 2026-09-16 (Mozilla, Nebius) : la page du board est rendue côté serveur,
  la grille est dans `content`, `location.name` fait foi.
- 2026-09-18 et 2026-09-19 (Algolia) : le régime de présence est dans une
  question, `checkValidity()` ne voit pas les champs d'identité.
