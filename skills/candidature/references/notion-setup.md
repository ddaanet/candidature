# Configuration Notion

Initialisation de la page racine et conventions d'usage des outils
Notion. Chargé par SKILL.md au démarrage.

## Page racine

Lire `CLAUDE.local.md` à la racine du dépôt. Chercher une clé de
frontmatter `candidature_root: <ID de page>`. Si elle existe, utiliser
cette valeur.

Si aucune clé n'existe, chercher dans Notion une page au titre
« Candidatures » (`notion-search`, `page_size: 1`). Proposer la page
trouvée au candidat et demander confirmation :

> La page racine des candidatures est-elle « Candidatures » (<URL> ) ?

Si le candidat confirme, écrire `candidature_root: <ID>` dans le
frontmatter de `CLAUDE.local.md`. S'il refuse ou si aucune page n'est
trouvée, demander :

> Quelle est l'URL de la page Notion qui servira de page racine pour les candidatures ?

puis écrire l'ID correspondant dans `candidature_root:`.

Appeler `notion-fetch` sur la page racine. Lire les sous-pages
retournées et relever leurs titres.

Cinq sous-pages sont attendues. La fiche candidat contient le profil
du candidat (CV, parcours, contraintes). La sous-page Sites rassemble
les fiches de plateforme ATS consolidées. La sous-page Recherches
archive les résultats de recherche contextuelle. La sous-page Tendances
regroupe les observations transversales issues du suivi. La sous-page
Passations conserve les passations de session.

La page racine porte aussi son propre contenu, une section Situation et
une section Candidatures (`references/modele-fichiers.md`). Ne pas l'écraser.

Si une sous-page attendue est absente, la créer comme sous-page vide
de la page racine. Le contenu sera rempli par la phase concernée.

Si `notion-fetch` échoue (page introuvable, permissions), dire :

> La page racine Notion n'est pas accessible. Vérifier l'URL et les permissions, puis relancer /candidature.

S'arrêter.

## Conventions de recherche

Pour les recherches par titre exact, limiter à un seul résultat
(`page_size: 1`). Les résultats suivants sont du bruit.
