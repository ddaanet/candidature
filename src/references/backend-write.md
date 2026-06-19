# Protocole d'écriture fichiers

Protocole d'écriture vers le stockage fichiers. Le layout est fixé par la
version de format 1 et documenté dans `references/modele-fichiers.md`.
L'agent connaît la cible à l'avance, donc il calcule le chemin de destination
et écrit aux sections nommées sans étape d'exploration.

## Principe

Le stockage est un répertoire local de structure connue. Chaque type de
document a son emplacement et ses sections, décrits dans
`references/modele-fichiers.md`. L'agent ne découvre pas la structure, il
l'applique.

## Protocole

### 1. Calculer le chemin de destination

À partir du type de document, dériver le chemin. Une candidature va dans
`candidatures/AAAA-MM-JJ-slug/README.md`, où la date est celle du repérage et
le slug abrège l'entreprise et le poste. Un brouillon de lettre va dans un
fichier `.md` frère du README, dans le même dossier. Un compte rendu
d'entretien va dans `entretien-N.md` au même endroit. Une recherche va sous
`recherches/`, un site sous `sites/`, les tendances dans `tendances.md` à la
racine.

### 2. Écrire au schéma documenté

Écrire le frontmatter YAML et les sections nommées que documente
`references/modele-fichiers.md`. Pour un README de candidature, le frontmatter
porte au moins entreprise, poste, statut, et les clés conditionnelles selon
l'avancement. Le corps reprend les sections offre, adéquation et écarts,
motivation, différenciation, soumission.

### 3. Modifier de façon ciblée

Pour une mise à jour, modifier le bloc concerné plutôt que réécrire le
fichier entier. Changer une valeur de frontmatter touche la ligne de cette
clé. Compléter une section touche cette section. Le reste du fichier reste
inchangé, ce qui préserve l'historique git lisible et le travail en cours du
candidat.

## Suppression et écartement

Écarter une offre ne supprime pas son fichier. Mettre `statut: écartée` dans
le frontmatter du README. Le dossier et ses brouillons restent, la trace est
conservée et l'index recalculé ignore les candidatures écartées.

L'écartement d'une offre issue d'un parcours LinkedIn ne s'arrête pas au
fichier. Le README porte un jobId, et changer le statut seul laisse la carte
dans le flux LinkedIn. Écarter aussi la carte par la couche navigateur, pour
que le stockage fichiers et le flux ne divergent pas.

## Cas particuliers

Pour un nouveau document, écrire directement à la structure documentée dans
`references/modele-fichiers.md`. Pas de modèle vide à instancier, le format
est la convention.

Si un fichier existant présente une structure inattendue, sections absentes
ou frontmatter incomplet, compléter ce qui manque sans écraser le contenu
déjà présent.
