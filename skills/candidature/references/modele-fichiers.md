# Modèle de structure fichiers

Structures de référence pour les fichiers du workflow de candidature. Le
stockage est un répertoire local, version de format 1, dont la sentinelle
`.candidature` porte une ligne unique `format: 1`. L'agent suit ce modèle
pour situer chaque document et le rédiger aux sections nommées.

Le statut d'une candidature vit dans le frontmatter de son README, pas dans
un ordre de fichiers. L'index des candidatures se régénère à la demande par
lecture des frontmatter sous `candidatures/`. Aucune liste maintenue à la
main, donc aucune insertion à coordonner.

## Répertoire racine

Le répertoire racine est le hub de la recherche d'emploi. À sa création,
`scripts/init_repo.py` y écrit la sentinelle `.candidature`, la fiche
candidat, le fichier des tendances, le pense-bête `candidatures/_a-trier.md`,
et les sous-répertoires `candidatures/`, `sites/`, `recherches/`. La fiche candidat porte le profil. Le répertoire
`sites/` rassemble un fichier par plateforme ATS. Le répertoire
`recherches/` archive les recherches contextuelles, un fichier chacune. Le
fichier `tendances.md` regroupe les observations transversales.

L'état courant de la recherche se lit en parcourant les README sous
`candidatures/`. Pour présenter la situation au candidat, l'agent lit les
frontmatter et construit un tableau à la demande, une ligne par candidature
avec son statut et son canal. Ce tableau n'est pas stocké, il se recalcule à
chaque fois. Les passations de session sont couvertes par le handoff natif et
par git, hors de l'écriture du skill.

## Fiche candidat

La fiche candidat contient le profil du candidat. Elle vit dans
`fiche-candidat.md` à la racine. Tant qu'elle n'est pas remplie, sa première
ligne porte le marqueur `<!-- candidature:gabarit -->`. La phase profil
remplit le fichier puis retire cette ligne. La structure suit les sections de
collecte de la phase profil.

Parcours résume le CV, les expériences clés et les compétences principales.

Contraintes précise le type de poste recherché, la géographie, la
disponibilité, le télétravail et la fourchette salariale, plancher et
objectif.

Métriques rassemble les résultats chiffrés du parcours : volume, échelle,
fréquence, durée, taille d'équipe.

Sources de style conserve les extraits ou les liens vers des exemples
d'écriture du candidat. L'agent les charge avant toute rédaction.

Notes couvre les profils en ligne, les secteurs visés et les éléments à
mettre en avant ou à taire.

## Dossier candidature

Chaque candidature est un dossier `candidatures/AAAA-MM-JJ-slug/`. La date est
celle du repérage, le slug abrège l'entreprise et le poste. Le dossier
contient un `README.md` qui porte les métadonnées et l'analyse, et les
brouillons en fichiers frères.

Le README ouvre sur un frontmatter YAML. Trois clés sont toujours présentes :
entreprise, poste, statut. Le statut prend une valeur de l'ensemble fermé
défini plus bas. D'autres clés apparaissent selon l'avancement : canal,
date_soumission, date_reponse, date_shortlist. Une candidature soumise porte
canal et date_soumission. Un refus porte date_reponse. Une mise en shortlist
porte date_shortlist. Un dossier issu d'un parcours LinkedIn porte aussi une
clé jobId, inscrite par le harnais, qui relie le dossier à sa carte pour
l'écartement.

Le corps du README est structuré en sections. Offre reprend l'intitulé, le
lieu, le contrat et les exigences clés. Adéquation et écarts confronte le
profil aux exigences. Motivation porte les raisons de viser cette entreprise.
Différenciation note l'accroche retenue et le registre de ton. Soumission
consigne la plateforme, les prétentions salariales si elles ont été
communiquées, et la date.

Chaque artefact texte est un fichier `.md` frère du README dans le même
dossier. La lettre de motivation, un message d'accompagnement, une réponse à
une question de formulaire vivent chacun dans leur fichier dès le premier
brouillon. Les itérations se font sur ces fichiers.

Les comptes rendus d'entretien sont des fichiers `entretien-N.md` dans le même
dossier, numérotés par tour. Chacun porte la date, le tour, les
interlocuteurs, les points clés et les apprentissages transférables.

Les prospects repérés mais pas encore qualifiés en candidature restent dans
`candidatures/_a-trier.md`, une ligne chacun, jusqu'à promotion en dossier.

## Fichier recherche

Chaque recherche contextuelle est un fichier sous `recherches/`, nommé par
type de poste et date. Le contenu est structuré en sections. Le cadrage
indique le type de poste, le secteur, la taille d'entreprise et le pays. Les
résultats couvrent cinq dimensions : documents attendus, conventions de ton,
normes sectorielles, spécificités du canal, référentiel salarial. Une section
« Pas applicable » délimite le périmètre d'exclusion.

## Fichier site

Chaque site de candidature, plateforme d'emploi, site carrière ou ATS, est un
fichier sous `sites/`, un par site, nommé d'après le site. Les observations
sont datées et associées à la version du skill. Chaque observation porte sa
source, retour du candidat ou observation autonome. Les contournements adoptés
sont décrits avec le problème rencontré, la solution adoptée et le résultat.

## Fichier tendances

Le fichier `tendances.md` à la racine contient les observations transversales
issues de l'analyse des candidatures : taux de conversion par étape, types de
postes et d'entreprises performants, axes corrélés aux retours positifs,
points récurrents en entretien, signaux d'alerte. Chaque analyse ajoute ses
observations et les ajustements décidés. Les observations sont datées.

## Ensemble des statuts

Le statut d'une candidature appartient à un ensemble fermé, défini dans
`scripts/validate.py`. Les valeurs exactes, accents compris, sont : à trier,
shortlist, en attente, refus, classée sans suite, écartée.
