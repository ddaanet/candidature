# Recruitee

## Approche
L'approche est DOM, par client CDP brut. Tout l'inventaire se lit dans le HTML servi, sans
navigateur. Le site carrière est souvent hébergé sous le domaine propre de
l'employeur, le lien vers `recruitee.com` en pied de page identifie la
plateforme.

## Lecture sans navigateur
La page d'une offre est rendue côté serveur et embarque sa configuration
dans l'attribut `data-props` de `div[data-component="PublicApp"]`, en JSON
encodé en entités HTML. Après `curl`, `html.unescape` puis `json.loads`,
l'offre est sous `appConfig.offer`.

Le texte intégral est dans `translations.<langue>.description` et
`translations.<langue>.requirements`. Les deux comptent, le salaire et les
prérequis vivent souvent dans le second. `locations` est la liste structurée
des localisations éligibles, la meilleure réponse à la garde d'éligibilité.
`countryCode` et `city` ne sont que la localisation d'affichage.
`openQuestions` donne chaque question de présélection avec son `id`, son
`kind` (`string`, `text`, `boolean`, `multiple_choice`), son caractère
obligatoire et son libellé. `fields` donne l'état des champs standard,
`required`, `optional` ou `off`. `salary` est vide quand rien n'est publié.
`appConfig.agreements` vide signifie aucune case de consentement.

Le catalogue public se lit par `curl -s 'https://<domaine carrière>/api/offers/'`,
un objet par offre avec titre, lieu, pays et date de création. Une requête
donne la répartition géographique des postes ouverts d'une société.

Une offre peut porter `status: internal` et `noindex`. Elle n'apparaît ni
dans le catalogue, ni sur le site carrière, ni dans les moteurs, mais son URL
directe fonctionne et son formulaire accepte les candidatures, et
`/api/offers/<slug>` répond 404. Une offre trouvée par un agrégateur et
introuvable chez l'employeur n'est donc pas forcément pourvue. Archiver son
texte intégral dans le dossier, il peut disparaître.

## Contraintes techniques
L'attache Playwright de `tab.mjs` expire sur cette page, qui porte deux
iframes tiers, hCaptcha et « Apply with LinkedIn ». Piloter par `cdp.mjs`.

Écrire un millier de caractères dans un `textarea` bloque la page plusieurs
dizaines de secondes. Un script qui enchaîne tous les champs dans une seule
évaluation expire au premier texte long et laisse les suivants vides.
Écrire un champ par appel, avec un délai large, puis relire (Hostaway,
2026-09-11, plus d'une minute par texte de mille deux cents caractères).

`appConfig.featureFlags.hcaptcha` est vrai et une clé de site est
configurée, sans widget dans le DOM avant l'envoi. Le candidat a rapporté un
défi à l'envoi, le relevé du pilotage n'en a vu aucun (Hostaway,
2026-09-11). Prévoir la présence du candidat au clic, et ne pas se fier au
relevé de la page pour savoir si un défi a été présenté.

## Formulaire
Le formulaire est sur la page de l'offre, dans un onglet « Apply »
(`data-testid="header-tab-apply-button"`) à côté de « Job details ». Avant le
clic, ses champs sont au DOM avec un `offsetParent` nul. Le clic fait passer
l'URL de `/o/<slug>` à `/o/<slug>/c/new`, ce qui signe le formulaire monté,
pas une soumission.

Les noms de champs sont stables, `candidate.name`, `candidate.email`,
`candidate.phone`, `candidate.cv`, `candidate.coverLetterFile` ou
`candidate.coverLetter`, `candidate.openQuestionAnswers.<id>.content` pour
une question texte et `.flag` pour une question booléenne en radios Yes et
No. Un `input[type=hidden]` par question porte son identifiant, ce sont des
champs d'application légitimes, pas des pièges.

Une question `string` est un `input` à `maxlength=255`, une question `text`
un `textarea` sans limite. Aucun compteur ne s'affiche à l'écran.

Sous « Cover letter », le bouton « Write it here instead » remplace le
téléversement par un `textarea` `candidate.coverLetter` sans limite. Sans ce
clic, l'inventaire conclut que la lettre ne passe qu'en fichier. Ce bouton
porte `type="submit"` et n'a rien soumis. Tant que l'envoi reste la décision
du candidat, poser une garde avant de le cliquer, puis la retirer.

    const garde = (e) => {
      e.preventDefault()
      e.stopImmediatePropagation()
    }
    form.addEventListener('submit', garde, true)
    bouton.click()
    form.removeEventListener('submit', garde, true)

Les boutons « Apply with Indeed », « Apply with LinkedIn » et « Apply with
Xing » préremplissent des champs sans remplacer le formulaire. Le formulaire
direct garde la trace de ce qui est envoyé.

## Upload CV
Le CV se joint par `cdp.mjs upload 'input[name="candidate.cv"]' <chemin>`.
L'interface affiche
ensuite le nom du fichier et un bouton « Change file », et `input.files[0]`
porte le nom et la taille.

## Cookies
Aucune bannière n'a été relevée. Quand `appConfig.agreements` est vide, le
formulaire n'a pas de case de consentement et la politique de
confidentialité est un lien de pied de page.

## Contournements
Les champs sont contrôlés par React. Passer par le setter du prototype
(`HTMLInputElement` ou `HTMLTextAreaElement`) puis émettre `input` et
`change`. Vider par le même chemin avant de ressaisir. Les radios répondent
à un `click()` ordinaire.

Le sélecteur de pays du téléphone est une liste virtualisée qui résiste au
défilement comme à la frappe, même par événements de confiance. Ne pas
l'ouvrir. Saisir le numéro au format international, `+33 ...`, le composant
déduit le pays et bascule le libellé (Hostaway, 2026-09-11, défaut sur
Austria).

Le bouton d'envoi porte `data-testid="submit-application-form-button"`.
Après l'envoi, l'URL passe à `/o/<slug>/applied` et la page affiche « All
done! Your application has been successfully submitted! ».

## Historique
- 2026-09-09 (Hostaway) : `data-props` et `/api/offers/` donnent
  l'inventaire, une offre `internal` accepte les candidatures.
- 2026-09-11 (Hostaway) : l'attache Playwright expire, `cdp.mjs` remplit le
  formulaire, le téléphone international règle le pays, l'envoi passe du
  premier coup.
