# Phase 1, Initialisation du profil

Première phase du workflow de candidature. Collecte du profil candidat. Se
fait une fois et s'enrichit au fil des candidatures. Le seul élément
indispensable est le CV.

## 1.1 CV

Demander au candidat de fournir son CV.

Le format préféré est le DOCX. Il permet de modifier le contenu en
préservant la mise en forme. Si le candidat utilise un autre outil (Pages,
Canva, Google Docs, LaTeX...), lui demander d'exporter en DOCX. En dernier
recours, un PDF suffit pour la lecture, mais les adaptations produiront un
nouveau fichier plutôt qu'une modification de l'existant.

Lire le CV, par lecture directe ou programmatique. Confirmer au candidat ce qu'on
a compris : parcours, compétences principales, expériences clés. Signaler
toute ambiguïté.

Voir `references/adaptation-cv.md` pour le protocole de modification.

## 1.2 Profil

Conversation ouverte pour comprendre le candidat au-delà du CV. Une seule
question de départ :

> "En dehors de votre CV, qu'est-ce qui pourrait m'aider à vous connaître
> professionnellement ?"

Puis creuser selon les réponses. Les sujets qui émergent dépendent du
métier et du parcours. Le candidat peut mentionner des profils en ligne
(LinkedIn, portfolio, GitHub, Behance). Il peut préciser le type de poste
recherché et ses contraintes (géographie, disponibilité, télétravail). La
fourchette salariale (plancher et objectif) sert de critère de cadrage
pour la recherche et de référence pour le champ prétentions à la
soumission. Le candidat peut aussi indiquer ce qu'il veut mettre en avant
ou ne pas mentionner, et les secteurs ou entreprises visés.

Après la conversation ouverte, lancer une recherche rapide sur le web
sur les métriques valorisées pour le type de profil et le secteur du
candidat. Utiliser les résultats pour poser des questions ciblées sur les
éléments chiffrés de son parcours. Les recruteurs valorisent les résultats
quantifiés (volume, échelle, fréquence, durée, taille d'équipe).

Pas de liste de contrôle. Chaque candidat a un contexte différent. Un
développeur senior a un GitHub, un chef de chantier n'en a pas, et c'est
normal.

Quand la conversation est suffisante, confirmer en posant la question :

> "J'ai une bonne image de votre profil. On passe aux exemples de style ou
> on commence à candidater directement ?"

## 1.3 Exemples de style (optionnel)

Des exemples de comment le candidat écrit quand il est à son meilleur. Le
workflow fonctionne sans, mais produit de meilleurs résultats avec.

Demander au candidat ce qu'il a. Les sources dépendent du métier :
articles, descriptions de projets, publications LinkedIn, courriels
marquants, présentations, rapports, études de cas, candidatures
précédentes approuvées.

Si le candidat fournit des sources, les lire (appel d'outil) et les
écrire dans la section Sources de style de `fiche-candidat.md`. Ces sources
sont chargées avant toute rédaction (phases 2 et 3) pour capter le ton du
candidat.

Si le candidat n'a aucun exemple écrit : pas de problème. Le skill capte
le ton naturel dans les échanges conversationnels et l'enrichit au fil
des candidatures. Après la relecture d'une lettre, la phase 3 propose au
candidat de conserver le ton comme référence pour les prochaines.

## 1.4 Enregistrement du profil

Écrire le profil dans `fiche-candidat.md`. Les informations collectées se
rangent dans les sections du fichier : Parcours, Contraintes, Métriques,
Sources de style, Notes. La fourchette salariale va dans Contraintes. Voir
`references/backend-write.md` pour le contrôle d'écriture.

Au premier remplissage, retirer la ligne marqueur `<!-- candidature:gabarit -->`
en tête du fichier. Ce marqueur signale au dispatcher que la fiche est encore
un gabarit vide. Le retirer fait basculer le routage hors de la phase profil,
si bien que les lancements suivants entrent directement dans la préparation.

## Artefacts texte

Tout artefact texte généré (résumé du CV, synthèse du profil) est écrit dans
`fiche-candidat.md`. Les itérations se font sur ce fichier.
