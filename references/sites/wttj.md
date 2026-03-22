# Welcome to the Jungle (WTTJ)

## Approche
Visuelle obligatoire — les composants React custom résistent à
l'automation DOM.

## Contraintes techniques
- Dropdowns : composants React custom, pas de `<select>` natif. Les
  sélecteurs CSS et `dispatchEvent` ne déclenchent pas les handlers.
- Modals asynchrones : popups de cookies, consentement, et formulaires
  de candidature chargés dynamiquement. Le DOM n'est pas stable entre
  les états.
- Changements de page : les transitions ne sont pas des navigations
  classiques — le contenu se charge sans rechargement complet.

## Navigation
Utiliser l'orientation visuelle (screenshots) pour **toute**
interaction :
- Navigation entre pages
- Détection et fermeture de popups (cookies, consentement)
- Remplissage de formulaires
- Sélection dans les dropdowns

Ne pas parser le DOM à l'aveugle. Prendre un screenshot, identifier
visuellement les éléments, puis interagir.

## Cookies / Consentement
Popup au chargement. Chercher visuellement le bouton "Non merci" ou
"Refuser".

## Historique
- 2026-03-16 (Doctolib) — composants React custom, modals asynchrones,
  dropdowns non-standard observés. Stratégie visuelle adoptée.
