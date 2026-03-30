# Configuration Notion

Initialisation de la page racine et conventions d'usage des outils
Notion. Chargé par SKILL.md au démarrage.

## Page racine `[outil: memory_user_edits, notion-fetch]`

Lire les mémoires (`memory_user_edits view`). Chercher une entrée
`candidature-root: <URL ou ID>`. Si elle existe, utiliser cette
valeur.

Si aucune entrée n'existe, demander au candidat :

> Quelle est l'URL de la page Notion qui servira de page racine pour les candidatures ?

Stocker la réponse (`memory_user_edits add "candidature-root: <URL>"`).

Appeler `notion-fetch` sur la page racine. Lire les sous-pages
retournées et relever leurs titres.

Quatre sous-pages sont attendues. La fiche candidat contient le profil
du candidat (CV, parcours, contraintes). La sous-page Sites rassemble
les fiches de plateforme ATS consolidées. La sous-page Recherches
archive les résultats de recherche contextuelle. La sous-page Tendances
regroupe les observations transversales issues du suivi.

Si une sous-page attendue est absente, la créer comme sous-page vide
de la page racine. Le contenu sera rempli par la phase concernée.

Si `notion-fetch` échoue (page introuvable, permissions), dire :

> La page racine Notion n'est pas accessible. Vérifier l'URL et les permissions, puis relancer /candidature.

S'arrêter.

## Conventions de recherche

Pour les recherches par titre exact, limiter à un seul résultat
(`page_size: 1`). Les résultats suivants sont du bruit.
