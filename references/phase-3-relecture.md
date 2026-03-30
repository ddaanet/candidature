# Relecture structurée

Chargé par la soumission pour chaque artefact généré. Boucle interne,
pas une phase séquentielle. Chaque champ texte libre passe par la
relecture avant d'être rempli dans le formulaire.

Revue item par item de chaque artefact. Adapté du protocole d'inspection
Fagan : segmentation, analyse par item, décision forcée.

## Principes

Chaque item reçoit une réponse du candidat, pas de passage silencieux.
Les modifications sont accumulées et appliquées d'un coup à la fin.
L'interface est conversationnelle : le candidat répond naturellement,
l'agent interprète. Le protocole fonctionne même sur un texte de 3 lignes
(un seul item).

## 3.1 Orientation `[état]`

Résumer en une phrase : quel texte, pour quel poste, combien de
paragraphes. Exemple : "Je relis votre lettre pour Doctolib, 4
paragraphes. On y va ?"

Pas de ligne d'état formatée, pas de liste de critères, pas de vocabulaire
de protocole. Le candidat a besoin de savoir ce qu'on relit, pas comment
la mécanique fonctionne.

Voir `references/review-items.md` pour le découpage en éléments. Attendre
la confirmation avant de commencer.

## 3.2 Item par item

Pour chaque item, dans l'ordre du document :

```
<N>/<M>, [titre ou premiers mots]

[contenu de l'item]

[analyse : observations factuelles, problèmes concrets ou pourquoi c'est
solide, avec justification courte]
```

Le candidat répond naturellement. L'agent interprète :

| Le candidat dit... | L'agent comprend... |
|-------------------|---------------------|
| "ok", "bien", "ça me va", "parfait" | Aucune modification |
| "change X par Y", "reformule ça", "trop long" | Modification enregistrée |
| "enlève", "supprime", "inutile" | Suppression enregistrée |
| "passe", "on verra", "je sais pas" | Report, item inchangé |
| Autre chose | Discussion : reformuler la compréhension, confirmer, puis revenir à l'item |

Si la réponse du candidat n'est pas claire, reformuler : "Je comprends :
[reformulation]. C'est ça ?" Attendre confirmation avant d'enregistrer.

Pas de vocabulaire imposé. Le candidat ne doit pas apprendre un protocole.
Il parle normalement.

## 3.3 Fin de revue

Quand tous les items sont passés :

Si des modifications ont été enregistrées : les appliquer au texte dans
Notion (`update_content` sur la sous-page de l'artefact). Vérifier la
cohérence d'ensemble (transitions, longueur, ton) et signaler tout
problème introduit par les modifications. Présenter le texte final.

Si aucune modification : confirmer que le texte est prêt.

Le candidat peut revenir sur un item à tout moment ("en fait, le deuxième
paragraphe..."). L'agent retrouve l'item et propose la modification.

## 3.4 Grille de lecture

Critères évalués pour chaque item. Universels, indépendants du métier.
Fondés sur la recherche en sciences du recrutement (voir
`references/recruitment-science.md`).

Le factuel se vérifie contre le CV. Pas de compétences inventées, pas de
dates incorrectes, pas d'expériences embellies.

Le ton doit être cohérent avec le style du candidat (exemples s'ils
existent, ton conversationnel sinon). Pas de langage artificiel détectable.
Pas de formules creuses.

La concision : chaque phrase apporte de l'information. Les recruteurs
lisent vite (tri initial d'un CV : environ 7 secondes, Ladders, 2018).

La crédibilité des signaux : chaque affirmation est-elle vérifiable ou au
minimum spécifique ? Les adjectifs auto-attribués ("passionné", "rigoureux")
sont des signaux gratuits que tout candidat peut émettre. Les faits
concrets sont des signaux coûteux qui engagent la crédibilité (Spence,
1973). Préférer les seconds.

L'adéquation : le contenu répond aux besoins du poste. Pas de compétences
hors-sujet pour remplir. La lettre adresse-t-elle le P-O fit (motivation,
projection dans l'entreprise) en plus du P-J fit (compétences) ?

L'accroche est le point le plus critique (biais d'ancrage, la première
impression colore toute la lecture). L'agent signale explicitement la
qualité de l'accroche lors de la relecture du premier item. Une accroche
générique ou interchangeable est un problème majeur.

L'étayage : chaque affirmation est-elle sourcée (CV, profil, recherche)
ou qualifiée ? Vérifier que la passe d'étayage (`references/etayage.md`)
a été respectée.

Le format : respect des contraintes du canal (limite de caractères, format
attendu).

## 3.5 Enrichissement du corpus `[choix]`

Quand le candidat est satisfait du ton d'une lettre après relecture,
proposer de l'ajouter aux exemples de style :

> "Le ton de cette lettre vous plaît ? Je la garde comme référence pour les
> prochaines ?"

L'utilisateur décide. Si oui, récupérer le texte validé depuis la
sous-page Notion de l'artefact (`notion-fetch`) et le stocker comme
sous-page de style dans la fiche candidat Notion (`notion-create-pages`).
Voir `references/backend-write.md` pour la gate d'écriture. Le corpus
s'enrichit, les lettres suivantes s'améliorent.
