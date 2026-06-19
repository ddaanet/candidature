# Phase 4, Suivi et apprentissage

Phase continue, déclenchée par les retours du candidat. Fondée sur la
recherche en autorégulation de la recherche d'emploi : les candidats qui
adoptent une orientation d'apprentissage obtiennent de meilleurs résultats
que ceux focalisés sur les résultats bruts (Kanfer et al., 2001,
Van Hooft & Van Hoye, 2022).

## 4.1 Enregistrement des retours

Quand le candidat signale un retour (refus, entretien, offre), mettre à
jour le README de la candidature correspondante. Le champ `statut` du
frontmatter prend une valeur de l'ensemble fermé. Un refus porte aussi
`date_reponse`. Voir `references/backend-write.md` pour le contrôle
d'écriture et `references/modele-fichiers.md` pour les noms de champs. Le
candidat parle naturellement ("refus Wiremind", "entretien 1 chez
Doctolib"). L'agent interprète et enregistre.

Si le candidat fournit du contexte supplémentaire (retour du recruteur,
hypothèse sur le refus, délai de réponse), l'ajouter au corps du README.
Rien n'est imposé, tout est capté s'il est offert.

L'ensemble fermé des statuts, accents compris, est : à trier, shortlist,
en attente, refus, classée sans suite, écartée. Le statut `en attente`
couvre une candidature envoyée sans réponse. Un refus, avec ou sans
entretien, passe à `refus`. Une candidature sans suite donnée passe à
`classée sans suite`. Les entretiens et leur tour vivent dans les comptes
rendus, pas dans le statut.

## 4.2 Entretiens

Deux moments distincts.

Avant un entretien, voir `references/preparation-entretien.md` : recherche sur
l'entreprise et les interlocuteurs, questions probables, stratégie de
négociation salariale.

Après un entretien, l'agent demande "Comment ça s'est passé ?" et adapte
la profondeur selon ce que le candidat dit. Si le candidat est bref ("bien,
on verra"), noter le statut et passer, pas de forcing. S'il est bavard,
structurer la synthèse et extraire les apprentissages. Entre les deux, poser
2-3 questions ciblées : qu'est-ce qui a bien marché, qu'est-ce qui a coincé
ou surpris, quelque chose à retenir pour la suite. Clore par "qu'est-ce qui
est utile pour les prochaines candidatures ?", et enregistrer la réponse,
elle alimente l'analyse des tendances.

### Compte rendu

Le compte rendu d'entretien est un fichier `candidatures/<slug>/entretien-N.md`,
frère du README, N incrémenté à chaque tour. Voir
`references/backend-write.md` pour le contrôle d'écriture. Le fichier
contient la date, le tour (entretien 1, 2...), les interlocuteurs si
connus, les points clés et les apprentissages transférables. Pas de
verbatim, une synthèse compacte.

L'objectif des deux moments (préparation et compte rendu) est l'extraction
d'apprentissages transférables.

## 4.3 Analyse des tendances

Après 5+ candidatures enregistrées, l'agent peut proposer une analyse.
L'analyse n'est jamais automatique. Le candidat décide quand il veut
prendre du recul.

> "Vous avez maintenant [N] candidatures enregistrées. Voulez-vous qu'on
> regarde les tendances qui se dégagent ?"

### Axes d'analyse

Les axes d'analyse couvrent le taux de conversion par étape (candidatures
vers entretiens vers suites vers offres, où est le goulot), les types de
postes et d'entreprises qui produisent les meilleurs retours, les axes de
candidature corrélés aux meilleurs résultats (quels arguments, quels tons),
les points récurrents en entretien (sujets où le candidat est régulièrement
solide ou en difficulté), et les signaux d'alerte (candidatures qui
n'auraient pas dû être envoyées, poste mal ciblé, inadéquation
fondamentale).

### Présentation

L'analyse est conversationnelle, pas un rapport. Pas de tableau de bord
déprimant. L'objectif est d'identifier des ajustements concrets pour les
prochaines candidatures.

### Stockage des observations

Les observations sont stockées dans `tendances.md` à la racine du
stockage. Le fichier est créé par `scripts/init_repo.py` au montage du
répertoire. S'il n'existe pas, le créer. Voir
`references/backend-write.md` pour le contrôle d'écriture. Chaque analyse
ajoute ses observations datées et les ajustements décidés, sans écraser
les précédentes.

Ce fichier est consulté au lancement de la phase 2 (préparation) pour
éclairer les choix des candidatures suivantes.
