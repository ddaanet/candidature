# Phase 1, Initialisation du profil

Première phase du workflow de candidature. Collecte du profil candidat. Se
fait une fois et s'enrichit au fil des candidatures. Le seul élément
indispensable est le CV.

## 1.1 CV `[outil: view]`

Demander au candidat de fournir son CV.

Le format préféré est le DOCX. Il permet de modifier le contenu en
préservant la mise en forme. Si le candidat utilise un autre outil (Pages,
Canva, Google Docs, LaTeX...), lui demander d'exporter en DOCX. En dernier
recours, un PDF suffit pour la lecture, mais les adaptations produiront un
nouveau fichier plutôt qu'une modification de l'existant.

Lire le CV (`view` ou lecture programmatique). Confirmer au candidat ce qu'on
a compris : parcours, compétences principales, expériences clés. Signaler
toute ambiguïté.

Voir `references/adaptation-cv.md` pour le protocole de modification.

## 1.2 Profil `[prompt]`

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

Après la conversation ouverte, lancer une recherche rapide (`web_search`)
sur les métriques valorisées pour le type de profil et le secteur du
candidat. Utiliser les résultats pour poser des questions ciblées sur les
éléments chiffrés de son parcours. Les recruteurs valorisent les résultats
quantifiés (volume, échelle, fréquence, durée, taille d'équipe).

Pas de liste de contrôle. Chaque candidat a un contexte différent. Un
développeur senior a un GitHub, un chef de chantier n'en a pas, et c'est
normal.

Quand la conversation est suffisante, confirmer avec un widget :

> "J'ai une bonne image de votre profil. On passe aux exemples de style ou
> on commence à candidater directement ?"

## 1.3 Exemples de style (optionnel) `[outil: view/web_fetch]`

Des exemples de comment le candidat écrit quand il est à son meilleur. Le
workflow fonctionne sans, mais produit de meilleurs résultats avec.

Demander au candidat ce qu'il a. Les sources dépendent du métier :
articles, descriptions de projets, publications LinkedIn, courriels
marquants, présentations, rapports, études de cas, candidatures
précédentes approuvées.

Si le candidat fournit des sources, les lire (appel d'outil) et les
enregistrer dans la fiche candidat sur Notion. Ces sources sont chargées
avant toute rédaction (phases 2 et 3) pour capter le ton du candidat.

Si le candidat n'a aucun exemple écrit : pas de problème. Le skill capte
le ton naturel dans les échanges conversationnels et l'enrichit au fil
des candidatures. Après la relecture d'une lettre, la phase 3 propose au
candidat de conserver le ton comme référence pour les prochaines.

## 1.4 Enregistrement du profil `[outil: notion-create-pages, notion-update-page]`

Enregistrer le profil dans la fiche candidat sur Notion. Les informations
collectées (parcours, contraintes, fourchette salariale, métriques,
sources de style) sont écrites dans la page fiche candidat. Voir
`references/backend-write.md` pour le contrôle d'écriture.

## Artefacts texte

Tout artefact texte généré (résumé du CV, synthèse du profil) est
enregistré dans Notion. Donner le lien au candidat. Les itérations se
font directement sur la page Notion pour que le candidat puisse suivre
en temps réel.
