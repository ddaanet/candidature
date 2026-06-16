# Phase 4, Suivi et apprentissage

Phase continue, déclenchée par les retours du candidat. Fondée sur la
recherche en autorégulation de la recherche d'emploi : les candidats qui
adoptent une orientation d'apprentissage obtiennent de meilleurs résultats
que ceux focalisés sur les résultats bruts (Kanfer et al., 2001,
Van Hooft & Van Hoye, 2022).

## 4.1 Enregistrement des retours

Quand le candidat signale un retour (refus, entretien, offre), mettre à
jour la page candidature correspondante dans Notion. Le statut est mis à
jour dans le titre ou le contenu de la page (`notion-update-page`). Le
candidat parle naturellement ("refus Wiremind", "entretien 1 chez
Doctolib"). L'agent interprète et enregistre.

Si le candidat fournit du contexte supplémentaire (retour du recruteur,
hypothèse sur le refus, délai de réponse), l'ajouter au contenu de la
page candidature. Rien n'est imposé, tout est capté s'il est offert.

Les statuts possibles : en attente (envoyée, pas de réponse), refus (réponse
négative, avec ou sans entretien), entretien N (convoqué ou passé au tour
N), offre (offre reçue), accepté ou décliné (résolution finale).

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

Le compte rendu d'entretien est créé en sous-page de la candidature dans
Notion (`notion-create-pages`). La sous-page contient la date, le tour
(entretien 1, 2...), les interlocuteurs si connus, les points clés et les
apprentissages transférables. Pas de verbatim, une synthèse compacte.

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

Les observations sont stockées dans la page Tendances sous la racine Notion
du candidat (`notion-create-pages` pour la première analyse,
`notion-update-page` pour les suivantes). Chaque analyse met à jour cette
page avec les nouvelles observations et les ajustements décidés.

Cette page est consultée au lancement de la phase 2 (préparation) pour
éclairer les choix des candidatures suivantes.
