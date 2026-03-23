---
name: candidature
description: >-
  Workflow complet de candidature : du profil candidat jusqu'à la relecture
  finale avant envoi, avec suivi des retours et comptes rendus d'entretien.
  Utiliser quand un utilisateur veut postuler à une offre d'emploi, préparer
  une lettre de motivation, adapter son CV à un poste, structurer sa
  démarche de candidature, enregistrer un retour négatif, ou faire un compte
  rendu d'entretien. Se déclenche sur "/candidature", "candidature", "postuler", "lettre de
  motivation", "adapter mon CV", "refus", "rejeté", "compte rendu
  entretien", "debrief", ou quand l'utilisateur fournit une offre d'emploi
  et demande de l'aide pour y répondre. Fonctionne pour tout métier et tout
  niveau. Remplace la génération ad-hoc de lettres par un workflow structuré
  avec recherche contextuelle, archive de recherche par type de poste,
  relecture item-par-item, et boucle d'apprentissage par suivi des retours.
---

Mot magique: ddaanet/candidature

# Candidature, workflow de candidature assistée

Quatre phases : initialisation du profil (une fois), candidature (par offre),
relecture structurée (par artefact), suivi et apprentissage (continu).
Conçu pour tout métier et tout profil.

```
Phase 1 : Initialisation (une fois, enrichie au fil du temps)
  CV → Conversation → Profil + Exemples de style (optionnel)

Phase 2 : Candidature (par offre)
  Fiche de poste
    → Recherche contextuelle (avec archive réutilisable)
      → Demande au candidat des documents pertinents
        → Alignement sur les axes
          → Génération

Phase 3 : Relecture (par artefact généré)
  Présentation → Items un par un → Modifications → Texte final

Phase 4 : Suivi et apprentissage (continu)
  Retours → Comptes rendus d'entretien → Analyse de patterns
    → Ajustements de la stratégie
```

---

## Ancrage des décisions

Chaque point de décision du workflow est ancré par un résultat visible ou un
appel d'outil. Un point de contrôle sans ancrage est un point que l'agent
sautera.

Types d'ancrage :

- `[choix]` est un widget de choix cliquable (`ask_user_input`). Le plus fort.
- `[outil]` est un appel d'outil obligatoire (`view`, `web_search`,
  `create_file`...). L'agent ne peut pas simuler un appel d'outil.
- `[état]` est une ligne d'état visible. Force l'agent à matérialiser
  l'état courant.
- `[prompt]` est une question ouverte au candidat. L'agent attend une
  réponse libre avant de continuer.

---

## Phase 1, Initialisation

Collecte du profil candidat. Se fait une fois et s'enrichit au fil des
candidatures. Le seul élément indispensable est le CV.

### 1.1 CV `[outil: view]`

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

### 1.2 Profil `[prompt]`

Conversation ouverte pour comprendre le candidat au-delà du CV. Une seule
question de départ :

> "En dehors de votre CV, qu'est-ce qui pourrait m'aider à vous connaître
> professionnellement ?"

Puis creuser selon les réponses. Ce qui peut émerger :

- Profils en ligne (LinkedIn, portfolio, site perso, GitHub, Behance...)
- Type de poste recherché, contraintes (géographie, disponibilité, remote...)
- Fourchette salariale (plancher, objectif). Sert de critère de cadrage
  pour la recherche et de référence pour §2.6 (champ prétentions).
- Ce que le candidat veut mettre en avant ou ne pas mentionner
- Secteurs ou entreprises visés

Pas de liste de contrôle. Chaque candidat a un contexte différent. Un
développeur senior a un GitHub, un chef de chantier n'en a pas, et c'est
normal.

Quand la conversation est suffisante, confirmer avec un widget :

> "J'ai une bonne image de votre profil. On passe aux exemples de style ou
> on commence à candidater directement ?"

### 1.3 Exemples de style (optionnel) `[outil: view/web_fetch]`

Des exemples de comment le candidat écrit quand il est à son meilleur. Le
workflow fonctionne sans, mais produit de meilleurs résultats avec.

Demander au candidat ce qu'il a. Les sources dépendent du métier :
articles, descriptions de projets, posts LinkedIn, emails marquants,
présentations, rapports, études de cas, candidatures précédentes
approuvées...

Si le candidat fournit des sources, les lire (appel d'outil). Si le candidat
n'a aucun exemple écrit : pas de problème. Le workflow capte le ton naturel
dans les échanges conversationnels et l'enrichit au fil des candidatures
(voir §3.5).

---

## Phase 2, Candidature

Une itération par offre d'emploi.

### 2.1 Fiche de poste `[outil: view/web_fetch]`

Le candidat fournit une ou plusieurs offres d'emploi (texte, URL, ou
capture d'écran). Lire chaque fiche de poste (appel d'outil). Si c'est
une URL, aller la chercher.

#### Canal de candidature

Quand l'offre est trouvée via un agrégateur (LinkedIn, WTTJ, Indeed...),
chercher d'abord le site carrière direct de l'entreprise (page « rejoindre »,
« careers », ATS propre). Candidater via le canal direct quand il existe,
car il y a moins de bruit et une meilleure traçabilité pour le recruteur.

Si un canal est nettement supérieur (ATS direct ouvert vs agrégateur sans
champ libre), le recommander et avancer. Ne proposer un choix que si les
canaux sont comparables. Pas de widget pour une décision évidente.

Si l'agent n'a pas accès au navigateur, demander au candidat de vérifier
si un site carrière direct existe.

Si le candidat n'a pas encore d'offre : recommander des plateformes
adaptées à son profil et son secteur (pas de liste en dur, recherche
contextuelle §2.2). Le candidat revient avec des URLs.

#### Shortlist `[outil: memory_user_edits]`

Quand le candidat apporte plusieurs offres, le skill analyse chaque offre
contre le profil :

- Alignement P-J fit (compétences matchées, écarts)
- Alignement P-O fit (culture, mission, taille, philosophie)
- Différenciation (où le candidat sort du lot vs où il est un parmi 200)

Chaque offre analysée est stockée immédiatement en mémoire (`shortlist:`,
datée YYYY-MM) :

```
shortlist: 2026-03 / Wiremind / Software Engineer / Paris hybride /
https://... / SQLAlchemy commun, philosophie open source. Écarts:
PostgreSQL, GitLab.
```

Le candidat décide quoi en faire. S'il veut candidater, l'entrée est
remplacée (`replace`) par une entrée `candidature:` enrichie au lancement
de la Phase 2 complète. S'il veut écarter l'offre, l'entrée est supprimée
(`remove`). S'il veut différer, l'entrée reste en l'état.

Avec 3+ offres en buffer, l'agent peut proposer un tri comparatif :
quelles offres sont les plus différenciantes pour ce profil. Le candidat
décide, pas l'agent.

Pas de workflow imposé. Le candidat peut shortlister une offre et
candidater dans la foulée, ou accumuler et trier plus tard.

### 2.2 Recherche contextuelle `[outil: mémoire projet → web_search si besoin]`

Avant de demander quoi que ce soit au candidat, rechercher ce qui est
attendu pour ce type de poste. L'objectif est de savoir quels documents
préparer, quel ton adopter, et quelles conventions respecter.

Consulter d'abord la mémoire projet. Vérifier si une recherche précédente
couvre ce type de poste (entrée mémoire préfixée `recherche:`). Si une
entrée correspond exactement au type de poste, au secteur et à la taille
d'entreprise : la réutiliser et passer à 2.3. Si le match est approximatif,
le signaler au candidat et lui laisser décider (réutiliser, adapter, ou
refaire). Si rien ne correspond : lancer une recherche complète.

Recherche complète (`web_search`). Explorer :

- Les documents attendus : CV seul, lettre de motivation, portfolio, lettre
  manuscrite, références, tests techniques, vidéo de présentation... Ça
  varie énormément selon le secteur, le pays, et le canal de candidature.
- Les conventions de ton : tutoiement ou vouvoiement, degré de formalisme,
  humour accepté ou non. Dépend du secteur (startup vs banque), du pays,
  et du canal.
- Les normes sectorielles : longueur de CV attendue, format créatif ou
  classique, informations obligatoires ou à éviter.
- Les spécificités du canal : EasyApply (pas de pièce jointe libre),
  formulaire à champs imposés, envoi direct par email, candidature
  spontanée...
- Le benchmark salarial : fourchettes de rémunération pour ce type de
  poste dans cette zone géographique. Sources pas codées en dur,
  rechercher les sources les plus pertinentes au moment de la recherche.
  Sert de référence pour §2.6 (champ prétentions) et pour la
  préparation d'entretien (`references/interview-prep.md`).

Stocker les résultats en mémoire projet (`memory_user_edits`, préfixe
`recherche:`) pour réutilisation lors de candidatures similaires.

### 2.3 Documents et contexte candidat `[choix]`

Maintenant qu'on sait ce qui est attendu, demander au candidat :

> "Pour ce type de poste, on attend typiquement [X, Y, Z]. Qu'est-ce que
> vous avez parmi ça ? Et qu'est-ce que vous savez sur l'entreprise ?"

Proposer aussi d'aller chercher des informations sur l'employeur si le
candidat donne un nom ou une URL : site web, page carrière, blog technique,
actualités récentes, avis d'employés.

### 2.4 Axes `[choix]`

Aligner avec le candidat sur deux dimensions distinctes, puis un
différenciateur. Ces dimensions s'appuient sur la recherche en psychologie
organisationnelle (voir `references/recruitment-science.md`, §2) :

1. L'adéquation personne-poste. Quelles compétences et expériences
   matchent les exigences du poste ? Quels écarts honnêtes ? C'est le
   "peut-il faire le travail ?". Le CV porte le gros de cette dimension,
   mais la lettre doit y faire référence brièvement.
2. L'adéquation personne-organisation. Pourquoi cette entreprise ?
   Qu'est-ce qui, dans la culture, la mission, le produit ou l'équipe,
   résonne avec le candidat ? C'est le "va-t-il s'intégrer ?". La lettre
   est le véhicule principal de cette dimension. Une lettre qui ne fait
   que résumer le CV rate sa cible.
3. La différenciation. Qu'est-ce qui distingue ce candidat des autres
   pour ce poste précis ? Peut être une expérience, un angle, une
   compétence rare, un parcours atypique.

Conversation courte, 2-3 échanges. Le candidat peut avoir des réponses
claires ou avoir besoin d'aide pour formuler ses arguments. S'adapter.

Confirmer les axes retenus avec un widget avant de rédiger. Le widget
présente les axes choisis sous les deux dimensions pour validation.

### 2.5 Personnalisation du CV `[choix]`

Si la recherche contextuelle ou l'analyse du poste indique qu'une
adaptation du CV serait bénéfique : proposer au candidat. Pas imposer.

> "Votre CV est bon tel quel pour cette candidature / Je suggère d'adapter
> [tel aspect] de votre CV pour mettre en avant [tel point]. On le fait ?"

Si oui, voir `references/cv-handling.md`.

### 2.6 Génération `[outil: create_file]`

#### Draft `[outil: create_file]`

Produire un premier draft de chaque artefact identifié en 2.2-2.3 :

- La lettre de motivation ou le message, au format adapté au canal. Voir
  `references/cover-letter.md`.
- Le CV adapté (si décidé en 2.5).
- Les autres artefacts selon le canal : réponses à des questions de
  formulaire, message d'accompagnement, pitch court...

Si le formulaire n'a aucun champ texte libre (pas de lettre, pas de
message, pas de question ouverte) : les livrables se limitent au CV et
aux champs factuels (langues, prétentions, liens). Pas de draft à
générer, pas d'étayage, pas de relecture. Passer directement à
l'archivage et à la capture site.

Chaque draft est un `create_file`. Le draft est un artefact de travail,
il sera audité puis corrigé avant relecture.

#### Rappel site `[état]`

Avant de rédiger pour un site identifié, vérifier les entrées
`site:` dans la mémoire du projet. Les contraintes de la plateforme
influencent la rédaction (longueur de champ, caractères bloqués,
structure du formulaire). Émettre une ligne résumant ce qui est connu
pour ce site, ou "aucune observation connue" si rien.

Si aucune entrée n'existe : noter le nom pour la capture après
soumission.

Quand le canal est un formulaire web, lire les libellés et la taille
visible des champs avant de rédiger. Calibrer la longueur au champ
(~150 caractères par ligne visible). Un champ intitulé « quelques mots »
ou « en vos propres termes » est un test d'authenticité. La réponse doit
sonner comme le candidat, pas comme un modèle. Si l'agent n'a pas accès
au navigateur, demander au candidat de décrire les champs.

#### Passe d'étayage `[outil: view references/etayage.md]`

Après le draft, charger le protocole d'étayage :

> `view references/etayage.md`

L'agent découvre le protocole d'audit après avoir généré le draft.
Cette séparation est intentionnelle. Voir DESIGN.md D-22.

Chaque artefact corrigé passe en relecture (phase 3) avant d'être
considéré comme prêt.

#### Archivage `[outil: memory_user_edits]`

Après la relecture (phase 3), enrichir l'entrée mémoire `candidature:`
avec un résumé structuré de l'artefact envoyé :

- Axes retenus (P-J, P-O, différenciation)
- Accroche (premiers mots ou résumé)
- Ton (registre utilisé)
- Prétentions salariales (si communiquées)

Permet de retrouver rapidement ce qui a été envoyé, sans stocker le
texte intégral. Le texte complet reste dans la conversation
(`conversation_search`).

#### Capture site `[outil: memory_user_edits]`

Après soumission, demander au candidat :

> "Des difficultés avec le site de candidature ?"

Écriture obligatoire en mémoire projet (préfixe `site:`), même si le
candidat répond "non" ou "RAS" :

```
site: <nom du site> / RAS. Découvert YYYY-MM-DD (<entreprise>).
```

Si le candidat signale un problème, le décrire factuellement avec le
contournement s'il a été trouvé :

```
site: <nom du site> / <observation factuelle>. Contournement : <solution>.
Découvert YYYY-MM-DD (<entreprise>).
```

Si une entrée `site:` existe déjà pour ce site, la compléter
(`replace`) plutôt que créer un doublon.

La capture alimente directement le rappel (§2.6) des candidatures
suivantes sur le même site.

---

## Phase 3, Relecture

Revue item-par-item de chaque artefact généré. Adapté du protocole
d'inspection Fagan : segmentation, analyse par item, décision forcée.

### Principes

Chaque item reçoit une réponse du candidat, pas de passage silencieux.
Les modifications sont accumulées et appliquées d'un coup à la fin.
L'interface est conversationnelle : le candidat répond naturellement,
l'agent interprète. Le protocole fonctionne même sur un texte de 3 lignes
(un seul item).

### 3.1 Orientation `[état]`

Résumer en une phrase : quel texte, pour quel poste, combien de
paragraphes. Exemple : "Je relis votre lettre pour Doctolib, 4
paragraphes. On y va ?"

Pas de ligne d'état formatée, pas de liste de critères, pas de vocabulaire
de protocole. Le candidat a besoin de savoir ce qu'on relit, pas comment
la mécanique fonctionne.

Voir `references/review-items.md` pour le découpage en éléments. Attendre
la confirmation avant de commencer.

### 3.2 Item par item

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

### 3.3 Fin de revue

Quand tous les items sont passés :

Si des modifications ont été enregistrées : les appliquer au texte. Vérifier
la cohérence d'ensemble (transitions, longueur, ton) et signaler tout
problème introduit par les modifications. Présenter le texte final.

Si aucune modification : confirmer que le texte est prêt.

Le candidat peut revenir sur un item à tout moment ("en fait, le deuxième
paragraphe..."). L'agent retrouve l'item et propose la modification.

### 3.4 Grille de lecture

Critères évalués pour chaque item. Universels, indépendants du métier.
Fondés sur la recherche en sciences du recrutement (voir
`references/recruitment-science.md`).

Le factuel se vérifie contre le CV. Pas de compétences inventées, pas de
dates incorrectes, pas d'expériences embellies.

Le ton doit être cohérent avec le style du candidat (exemples s'ils
existent, ton conversationnel sinon). Pas de langage artificiel détectable.
Pas de formules creuses.

La concision : chaque phrase apporte de l'information. Les recruteurs
lisent vite (tri initial d'un CV : ~7 secondes, Ladders, 2018).

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
ou qualifiée ? Vérifier que la passe d'étayage (§2.6) a été respectée.

Le format : respect des contraintes du canal (limite de caractères, format
attendu).

### 3.5 Enrichissement du corpus `[choix]`

Quand le candidat est satisfait du ton d'une lettre après relecture,
proposer de l'ajouter aux exemples de style :

> "Le ton de cette lettre vous plaît ? Je la garde comme référence pour les
> prochaines ?"

L'utilisateur décide. Le corpus s'enrichit, les lettres suivantes
s'améliorent.

---

## Phase 4, Suivi et apprentissage

Phase continue, déclenchée par les retours du candidat. Fondée sur la
recherche en autorégulation de la recherche d'emploi : les candidats qui
adoptent une orientation d'apprentissage obtiennent de meilleurs résultats
que ceux focalisés sur les résultats bruts (Kanfer et al., 2001,
Van Hooft & Van Hoye, 2022). Voir `references/feedback-tracking.md` pour
le protocole détaillé.

### 4.1 Enregistrement des retours `[outil: memory_user_edits]`

Quand le candidat signale un retour (refus, entretien, offre), mettre à
jour l'entrée mémoire `candidature:` correspondante (`replace` du
statut). Le candidat parle naturellement ("refus Wiremind", "entretien 1
chez Doctolib"). L'agent interprète et enregistre.

Voir `references/feedback-tracking.md` pour les statuts et le détail.

### 4.2 Entretiens `[choix]`

Deux moments distincts :

Avant un entretien, voir `references/interview-prep.md` : recherche sur
l'entreprise et les interlocuteurs, questions probables, stratégie de
négociation salariale.

Après un entretien, l'agent demande "Comment ça s'est passé ?" et adapte
la profondeur selon ce que le candidat dit. Voir
`references/feedback-tracking.md` pour le protocole.

L'objectif des deux est l'extraction d'apprentissages transférables.

### 4.3 Analyse des patterns `[choix]`

Après 5+ candidatures enregistrées, l'agent peut proposer une analyse.
L'analyse n'est jamais automatique. Le candidat décide quand il veut
prendre du recul.

> "Vous avez maintenant [N] candidatures enregistrées. Voulez-vous qu'on
> regarde les patterns qui se dégagent ?"

Axes d'analyse : taux de conversion par étape (candidature vers entretien
vers suite vers offre), types de postes et entreprises qui produisent les
meilleurs retours, axes de candidature corrélés aux meilleurs résultats,
points récurrents en entretien (forces et faiblesses), candidatures qui
n'auraient pas dû être envoyées.

L'analyse est conversationnelle et orientée action. Pas de tableau de
bord, pas de statistiques déprimantes. L'objectif est d'identifier des
ajustements concrets pour les prochaines candidatures.

Les observations sont stockées en mémoire projet (préfixe `tendance:`)
et consultées au §2.4 (axes) des candidatures suivantes pour éclairer les
choix.

---

## Archive de recherche

Les résultats de recherche contextuelle (§2.2) sont stockés en mémoire
projet pour éviter de refaire la même recherche à chaque candidature
similaire.

### Format (préfixe `recherche:`)

Chaque entrée mémoire contient juste assez pour décider si elle
s'applique :

```
recherche: backend-senior-startup / Tech/ESN/Startup / 10-500 employés /
France / 2026-03 / Documents: CV + LM optionnelle / Ton: direct, tu
accepté / CV 1 page / Pas applicable: lead/management, data/ML, stage
```

### Réutilisation

1. Vérifier la mémoire projet (entrées préfixées `recherche:`)
2. Vérifier l'ancienneté de l'entrée (date YYYY-MM). Moins de 3 mois :
   réutilisable. Entre 3 et 6 mois : signaler au candidat, lui laisser
   décider. Plus de 6 mois : périmée, relancer la recherche.
3. Comparer au poste courant : type de poste, secteur, taille, pays
4. Vérifier le périmètre d'exclusion ("Pas applicable")
5. Correspondance exacte et entrée fraîche : réutiliser, continuer.
6. Correspondance approximative : signaler au candidat, lui laisser
   décider (réutiliser, adapter, ou refaire).
7. Aucune correspondance : recherche complète, stocker en mémoire.

Ne jamais réutiliser silencieusement un match approximatif ou une entrée
de plus de 3 mois. Le candidat décide.

La règle d'expiration s'applique aussi aux entrées `shortlist:`. Une
offre shortlistée il y a 6 mois est probablement pourvue.

---

## Contre-exemples

La validation en un tour ("Ça te va ?" suivi de "oui" suivi d'envoi)
rate les malentendus.

Le modèle générique produit une lettre interchangeable entre deux postes.
Chaque candidature doit contenir un élément spécifique à l'entreprise.

L'énumération de compétences hors-sujet liste des technologies qui ne
sont pas dans l'offre pour remplir.

La survente prétend des compétences que le candidat n'a pas. La
transparence sur les écarts est un atout.

L'humilité excessive s'excuse de postuler. Le candidat apporte de la
valeur.

La duplication entre champs : quand un formulaire a plusieurs questions,
chaque réponse apporte du contenu distinct.

La recherche refaite à chaque fois ignore l'archive de recherche pour
un type de poste déjà exploré.

La correction acquiescée sans reformulation : le candidat corrige une
erreur, l'agent dit « noté » et passe à la suite. Le cycle correct est
de reformuler la correction, obtenir la validation du candidat, appliquer,
puis re-présenter l'élément corrigé.
