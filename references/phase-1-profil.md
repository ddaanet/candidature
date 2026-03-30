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

Voir `references/cv-handling.md` pour le protocole de modification.

## 1.2 Profil `[prompt]`

Conversation ouverte pour comprendre le candidat au-delà du CV. Une seule
question de départ :

> "En dehors de votre CV, qu'est-ce qui pourrait m'aider à vous connaître
> professionnellement ?"

Puis creuser selon les réponses. Ce qui peut émerger :

- Profils en ligne (LinkedIn, portfolio, site perso, GitHub, Behance...)
- Type de poste recherché, contraintes (géographie, disponibilité, remote...)
- Fourchette salariale (plancher, objectif). Sert de critère de cadrage
  pour la recherche et de référence pour le champ prétentions à la
  génération.
- Ce que le candidat veut mettre en avant ou ne pas mentionner
- Secteurs ou entreprises visés

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
articles, descriptions de projets, posts LinkedIn, emails marquants,
présentations, rapports, études de cas, candidatures précédentes
approuvées...

Si le candidat fournit des sources, les lire (appel d'outil). Si le candidat
n'a aucun exemple écrit : pas de problème. Le workflow capte le ton naturel
dans les échanges conversationnels et l'enrichit au fil des candidatures.
Après la relecture d'une lettre, la phase 3 propose au candidat de conserver
le ton comme référence pour les prochaines.

## Artefacts texte

Quand l'agent présente du texte généré au candidat (résumé du CV, synthèse
du profil), ne jamais afficher à la fois le résultat de l'appel d'outil et
le texte final dans la même réponse. Choisir l'un ou l'autre. Le double
affichage crée une sortie redondante qui noie l'information utile.
