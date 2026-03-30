# Gate d'ecriture backend

Protocole obligatoire avant toute ecriture vers un backend (Notion ou
autre). L'ecriture ne peut pas se produire sans l'etape d'exploration,
parce que la procedure d'ecriture n'existe pas avant.

## Principe

Chaque cible d'ecriture a une structure propre : pages enfants, proprietes,
conventions de nommage, contenu existant. Cette structure n'est pas connue
a l'avance. L'agent doit la decouvrir avant d'ecrire, puis construire une
procedure adaptee a ce qu'il a trouve.

## Protocole

### 1. Explorer la cible `[outil: notion-fetch]`

Avant d'ecrire, appeler `notion-fetch` sur la page cible ou son parent.
Lire la structure complete : pages enfants, proprietes, contenu.

Si la cible est une page enfant a creer, explorer le parent. Si la cible
est une page existante a modifier, explorer la page elle-meme.

### 2. Extraire les contraintes

A partir de l'exploration, identifier :

- La convention de nommage des pages enfants existantes.
- Les proprietes presentes et leur format (texte, date, relation, select).
- La structure du contenu (titres, sections, listes).
- Les pages enfants deja presentes (pour eviter les doublons).

### 3. Generer la procedure d'ecriture

Formuler la procedure specifique a cette cible : quel outil appeler, avec
quels parametres, dans quel ordre. La procedure est un artefact de
l'exploration, pas un template pre-ecrit.

Pour une creation de page : titre conforme a la convention, proprietes
conformes au schema, contenu conforme a la structure observee.

Pour une modification : identifier les blocs a modifier, utiliser la
modification ciblee plutot que le remplacement complet.

### 4. Executer

Executer la procedure generee. Verifier le resultat (`notion-fetch` sur
la page ecrite).

## Cas particuliers

Si la cible est vide (pas de pages enfants, pas de contenu), l'agent
choisit une structure raisonnable et la documente dans la page. Les
ecritures suivantes s'y conformeront.

Si l'exploration revele une structure inattendue (proprietes inconnues,
contenu dans un format non prevu), l'agent s'adapte a ce qu'il trouve.
Ne pas forcer une structure differente de celle en place.
