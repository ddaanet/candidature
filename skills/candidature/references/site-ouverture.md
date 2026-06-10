# Ouverture de site de candidature

Instructions avant et pendant la navigation sur un site d'emploi ou un
site carrière. Chargé par le dispatcher quand Chrome est disponible.
Les phases chargent ce fichier avant toute navigation sur une plateforme.

## Rappel

Avant de naviguer sur un site de candidature, charger les contraintes
connues de la plateforme depuis deux sources.

La source primaire est Notion : chercher une sous-page du site sous
Sites/ dans Notion (`notion-fetch`). Cette sous-page contient les
observations terrain, datées et associées à la version du skill utilisée.

La source secondaire est le fichier de référence du skill
(`references/sites/*.md`), qui contient les directives consolidées.

Si les deux sources existent, les observations Notion prévalent. Si
aucune sous-page n'existe dans Notion pour ce site, procéder avec le
fichier de référence s'il existe, ou avec prudence si aucune source
n'est disponible. Noter le nom du site pour la capture après
interaction.

## Cookies et consentement

Refuser les cookies marketing et pistage. Accepter les cookies
fonctionnels si nécessaire au bon fonctionnement du site (session,
CSRF, état multi-étapes). Choisir l'option la plus restrictive qui
ne casse pas le flux de candidature.

## Ouverture de page

Quand Chrome est connecté, ouvrir directement la page de candidature
(`open_url`) au lieu de donner l'URL au candidat. Réduit la friction,
le candidat n'a pas à copier-coller.

## Navigation

L'approche dépend de la plateforme, voir le fichier de référence.
Deux stratégies.

L'approche DOM utilise les sélecteurs CSS, JavaScript, `form_input`.
Adaptée quand le DOM est fiable (HTML standard, pas de shadow DOM).

L'approche visuelle utilise les captures d'écran et l'orientation
visuelle. Adaptée quand le DOM est peu fiable (composants React
custom, shadow DOM, modals asynchrones).

La stratégie est documentée dans le fichier de référence de chaque
plateforme. En l'absence de fichier, commencer par le DOM et basculer
en visuel si les sélecteurs échouent.
