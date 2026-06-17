# Contrôle d'écriture backend

Protocole obligatoire avant toute écriture vers un backend (Notion ou
autre). L'écriture ne peut pas se produire sans l'étape d'exploration,
parce que la procédure d'écriture n'existe pas avant.

## Principe

Chaque cible d'écriture a une structure propre : pages enfants, propriétés,
conventions de nommage, contenu existant. Cette structure n'est pas connue
à l'avance. L'agent doit la découvrir avant d'écrire, puis construire une
procédure adaptée à ce qu'il a trouvé.

## Protocole

### 1. Explorer la cible

Avant d'écrire, appeler `notion-fetch` sur la page cible ou son parent.
Lire la structure complète : pages enfants, propriétés, contenu.

Si la cible est une page enfant à créer, explorer le parent. Si la cible
est une page existante à modifier, explorer la page elle-même.

Une seule exploration par session suffit pour une cible donnée. La
procédure générée est réutilisable pour toutes les écritures vers la
même cible dans la même session.

### 2. Extraire les contraintes

À partir de l'exploration, identifier la convention de nommage des pages
enfants existantes, les propriétés présentes et leur format (texte, date,
relation, select), la structure du contenu (titres, sections, listes), et
les pages enfants déjà présentes (pour éviter les doublons).

### 3. Générer la procédure d'écriture

Formuler la procédure spécifique à cette cible : quel outil appeler, avec
quels paramètres, dans quel ordre. La procédure est un artefact de
l'exploration, pas un modèle préétabli.

Pour une création de page : titre conforme à la convention, propriétés
conformes au schéma, contenu conforme à la structure observée.

Pour une modification : identifier les blocs à modifier, utiliser la
modification ciblée plutôt que le remplacement complet.

### 4. Exécuter

Exécuter la procédure générée. Vérifier le résultat (`notion-fetch` sur
la page écrite).

## Suppression et écartement

Notion n'efface pas une page, il l'archive (suppression douce, `archived`
à vrai). Pour écarter une offre, archiver sa page candidature plutôt que
chercher une suppression définitive. L'archivage la retire de l'arborescence
visible tout en gardant la trace récupérable.

Avant d'archiver, vérifier qu'on cible la bonne page (`notion-fetch`).
L'écartement d'une offre issue d'un parcours LinkedIn ne s'arrête pas à
Notion. Sa page porte un jobId, et archiver la page seule laisse la carte
dans le flux LinkedIn. Écarter aussi la carte par la couche navigateur, pour
que Notion et le flux ne divergent pas.

## Cas particuliers

Si la cible est vide (pas de pages enfants, pas de contenu), utiliser le
modèle de structure fourni dans `references/modele-notion.md`. Les
écritures suivantes s'y conformeront.

Si l'exploration révèle une structure inattendue (propriétés inconnues,
contenu dans un format non prévu), l'agent s'adapte à ce qu'il trouve.
Ne pas forcer une structure différente de celle en place.
