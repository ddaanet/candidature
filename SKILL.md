---
name: candidature
description: >-
  Workflow complet de candidature : du profil candidat jusqu'à la relecture
  finale avant envoi, avec suivi des retours et comptes rendus d'entretien.
  Utiliser quand un utilisateur veut postuler à une offre d'emploi, préparer
  une lettre de motivation, adapter son CV à un poste, structurer sa
  démarche de candidature, enregistrer un retour négatif, ou faire un compte
  rendu d'entretien. Se déclenche sur "candidature", "postuler", "lettre de
  motivation", "adapter mon CV", "refus", "rejeté", "compte rendu
  entretien", "debrief", ou quand l'utilisateur fournit une offre d'emploi
  et demande de l'aide pour y répondre. Fonctionne pour tout métier et tout
  niveau. Remplace la génération ad-hoc de lettres par un workflow structuré
  avec recherche contextuelle, archive de recherche par type de poste,
  relecture item-par-item, et boucle d'apprentissage par suivi des retours.
---

# Candidature — Workflow de candidature assistée

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

**Types d'ancrage :**
- `[choix]` — widget de choix cliquable (`ask_user_input`). Le plus fort.
- `[outil]` — appel d'outil obligatoire (`view`, `web_search`,
  `create_file`...). L'agent ne peut pas simuler un appel d'outil.
- `[état]` — ligne d'état visible. Force l'agent à matérialiser l'état
  courant.

---

## Phase 1 — Initialisation

Collecte du profil candidat. Se fait une fois et s'enrichit au fil des
candidatures. Le seul élément indispensable est le CV.

### 1.1 CV `[outil: view]`

Demander au candidat de fournir son CV.

**Format préféré : DOCX.** Permet de modifier le contenu en préservant la
mise en forme. Si le candidat utilise un autre outil (Pages, Canva, Google
Docs, LaTeX...), lui demander d'exporter en DOCX. En dernier recours, un
PDF suffit pour la lecture — mais les adaptations produiront un nouveau
fichier plutôt qu'une modification de l'existant.

Lire le CV (`view` ou lecture programmatique). Confirmer au candidat ce qu'on
a compris : parcours, compétences principales, expériences clés. Signaler
toute ambiguïté.

Voir `references/cv-handling.md` pour le protocole de modification.

### 1.2 Profil `[choix]`

Conversation ouverte pour comprendre le candidat au-delà du CV. Une seule
question de départ :

> "En dehors de votre CV, qu'est-ce qui pourrait m'aider à vous connaître
> professionnellement ?"

Puis creuser selon les réponses. Ce qui peut émerger :

- Profils en ligne (LinkedIn, portfolio, site perso, GitHub, Behance...)
- Type de poste recherché, contraintes (géographie, disponibilité, remote...)
- Fourchette salariale (plancher, objectif) — sert de critère de
  cadrage pour la recherche et de référence pour §2.6 (champ prétentions)
- Ce que le candidat veut mettre en avant ou ne pas mentionner
- Secteurs ou entreprises visés

**Pas de liste de contrôle.** Chaque candidat a un contexte différent. Un
développeur senior a un GitHub, un chef de chantier n'en a pas — et c'est
normal.

Quand la conversation est suffisante, confirmer avec un widget :

> "J'ai une bonne image de votre profil. On passe aux exemples de style ou
> on commence à candidater directement ?"

### 1.3 Exemples de style (optionnel) `[outil: view/web_fetch]`

Des exemples de comment le candidat écrit quand il est à son meilleur. Le
workflow fonctionne sans — mais produit de meilleurs résultats avec.

**Demander au candidat ce qu'il a.** Les sources dépendent du métier :
articles, descriptions de projets, posts LinkedIn, emails marquants,
présentations, rapports, études de cas, candidatures précédentes
approuvées...

Si le candidat fournit des sources, les lire (appel d'outil). Si le candidat
n'a aucun exemple écrit : pas de problème. Le workflow capte le ton naturel
dans les échanges conversationnels et l'enrichit au fil des candidatures
(voir §3.5).

---

## Phase 2 — Candidature

Une itération par offre d'emploi.

### 2.1 Fiche de poste `[outil: view/web_fetch]`

Le candidat fournit une ou plusieurs offres d'emploi (texte, URL, ou
capture d'écran). Lire chaque fiche de poste (appel d'outil). Si c'est
une URL, aller la chercher.

**Si le candidat n'a pas encore d'offre :** recommander des plateformes
adaptées à son profil et son secteur (pas de liste en dur — recherche
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
shortlist: 2026-03 — Wiremind — Software Engineer — Paris hybride —
https://... — SQLAlchemy commun, philosophie open source. Écarts:
PostgreSQL, GitLab.
```

Le candidat décide quoi en faire :
- **Candidater** → l'entrée est remplacée (`replace`) par une entrée
  `candidature:` enrichie au lancement de la Phase 2 complète
- **Écarter** → l'entrée est supprimée (`remove`)
- **Différer** → l'entrée reste en l'état

Avec 3+ offres en buffer, l'agent peut proposer un tri comparatif :
quelles offres sont les plus différenciantes pour ce profil. Le candidat
décide, pas l'agent.

Pas de workflow imposé — le candidat peut shortlister une offre et
candidater dans la foulée, ou accumuler et trier plus tard.

### 2.2 Recherche contextuelle `[outil: mémoire projet → web_search si besoin]`

Avant de demander quoi que ce soit au candidat, rechercher ce qui est
attendu pour ce type de poste. L'objectif est de savoir quels documents
préparer, quel ton adopter, et quelles conventions respecter.

**Consulter d'abord la mémoire projet.** Vérifier si une recherche
précédente couvre ce type de poste (entrée mémoire préfixée
`recherche:`). Si une entrée correspond exactement au type de poste, au
secteur et à la taille d'entreprise : la réutiliser et passer à 2.3. Si
le match est approximatif, le signaler au candidat et lui laisser décider
(réutiliser, adapter, ou refaire). Si rien ne correspond : lancer une
recherche complète.

**Recherche complète** (`web_search`) — explorer :

- **Documents attendus** — CV seul, lettre de motivation, portfolio, lettre
  manuscrite, références, tests techniques, vidéo de présentation... Ça
  varie énormément selon le secteur, le pays, et le canal de candidature.
- **Conventions de ton** — Tutoiement ou vouvoiement, degré de formalisme,
  humour accepté ou non. Dépend du secteur (startup vs banque), du pays,
  et du canal.
- **Normes sectorielles** — Longueur de CV attendue, format créatif ou
  classique, informations obligatoires ou à éviter.
- **Spécificités du canal** — EasyApply (pas de pièce jointe libre),
  formulaire à champs imposés, envoi direct par email, candidature
  spontanée...

**Stocker les résultats en mémoire projet** (`memory_user_edits`, préfixe
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

1. **Adéquation personne-poste** — Quelles compétences et expériences
   matchent les exigences du poste ? Quels écarts honnêtes ? C'est le
   "peut-il faire le travail ?". Le CV porte le gros de cette dimension,
   mais la lettre doit y faire référence brièvement.
2. **Adéquation personne-organisation** — Pourquoi cette entreprise ?
   Qu'est-ce qui, dans la culture, la mission, le produit ou l'équipe,
   résonne avec le candidat ? C'est le "va-t-il s'intégrer ?". La lettre
   est le véhicule principal de cette dimension — une lettre qui ne fait
   que résumer le CV rate sa cible.
3. **Différenciation** — Qu'est-ce qui distingue ce candidat des autres
   pour ce poste précis ? Peut être une expérience, un angle, une
   compétence rare, un parcours atypique.

**Conversation courte** — 2-3 échanges. Le candidat peut avoir des réponses
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

#### Passe d'étayage `[outil: web_search si besoin]`

Avant de produire un artefact, vérifier que chaque affirmation prévue
est étayée. La passe s'applique à tout artefact, y compris les textes
courts.

**Bloc visible** — liste compacte, une ligne par affirmation :

```
- [affirmation courte] — [source] — ✓ / ⚠️ / ✗
```

Pour chaque ✗ ou ⚠️ :
- **Données personnelles** (parcours, compétences) → demander au candidat.
  Bloquer jusqu'à réponse.
- **Données publiques** (entreprise, stack, culture) → `web_search` ou
  `web_fetch`.

Après recherche, nouveau bloc visible avec les lignes modifiées.
Répéter jusqu'à ce que tout soit ✓ ou explicitement qualifié.

**Seulement alors** → produire l'artefact.

#### Artefacts

Produire les artefacts identifiés en 2.2-2.3 :

- **Lettre de motivation / message** — Format adapté au canal. Voir
  `references/cover-letter.md`.
- **CV adapté** (si décidé en 2.5)
- **Autres artefacts** selon le canal — réponses à des questions de
  formulaire, message d'accompagnement, pitch court...

Chaque fichier produit est un `create_file`. Chaque fichier passe en
relecture (phase 3) avant d'être considéré comme prêt.

---

## Phase 3 — Relecture

Revue item-par-item de chaque artefact généré. Adapté du protocole
d'inspection Fagan : segmentation, analyse par item, décision forcée.

### Principes

- Chaque item reçoit une réponse du candidat — pas de passage silencieux
- Les modifications sont accumulées et appliquées d'un coup à la fin
- L'interface est conversationnelle — le candidat répond naturellement,
  l'agent interprète
- Le protocole fonctionne même sur un texte de 3 lignes (un seul item)

### 3.1 Orientation `[état]`

Résumer en une phrase : quel texte, pour quel poste, combien de
paragraphes. Exemple : "Je relis votre lettre pour Doctolib — 4
paragraphes. On y va ?"

Pas de ligne d'état formatée, pas de liste de critères, pas de vocabulaire
de protocole. Le candidat a besoin de savoir ce qu'on relit, pas comment
la mécanique fonctionne.

Voir `references/review-items.md` pour le découpage en éléments. Attendre
la confirmation avant de commencer.

### 3.2 Item par item

Pour chaque item, dans l'ordre du document :

```
**<N>/<M> — [titre ou premiers mots]**

[contenu de l'item]

[analyse : observations factuelles — problèmes concrets ou pourquoi c'est
solide, avec justification courte]
```

Le candidat répond naturellement. L'agent interprète :

| Le candidat dit... | L'agent comprend... |
|-------------------|---------------------|
| "ok", "bien", "ça me va", "parfait" | Aucune modification |
| "change X par Y", "reformule ça", "trop long" | Modification enregistrée |
| "enlève", "supprime", "inutile" | Suppression enregistrée |
| "passe", "on verra", "je sais pas" | Report — item inchangé |
| Autre chose | Discussion — reformuler la compréhension, confirmer, puis revenir à l'item |

**Discussion :** Si la réponse du candidat n'est pas claire, reformuler :
"Je comprends : [reformulation]. C'est ça ?" Attendre confirmation avant
d'enregistrer.

**Pas de vocabulaire imposé.** Le candidat ne doit pas apprendre un
protocole. Il parle normalement.

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

- **Factuel** — Vérifier contre le CV. Pas de compétences inventées, pas de
  dates incorrectes, pas d'expériences embellies.
- **Ton** — Cohérent avec le style du candidat (exemples s'ils existent, ton
  conversationnel sinon). Pas de langage artificiel détectable. Pas de
  formules creuses.
- **Concision** — Chaque phrase apporte de l'information. Les recruteurs
  lisent vite (tri initial d'un CV : ~7 secondes — Ladders, 2018).
- **Crédibilité des signaux** — Chaque affirmation est-elle vérifiable ou au
  minimum spécifique ? Les adjectifs auto-attribués ("passionné",
  "rigoureux") sont des signaux gratuits que tout candidat peut émettre.
  Les faits concrets sont des signaux coûteux qui engagent la crédibilité
  (Spence, 1973). Préférer les seconds.
- **Adéquation** — Le contenu répond aux besoins du poste. Pas de
  compétences hors-sujet pour remplir. La lettre adresse-t-elle le P-O
  fit (motivation, projection dans l'entreprise) en plus du P-J fit
  (compétences) ?
- **Accroche** — L'accroche est le point le plus critique (biais d'ancrage —
  la première impression colore toute la lecture). L'agent signale
  explicitement la qualité de l'accroche lors de la relecture du premier
  item. Une accroche générique ou interchangeable est un problème majeur.
- **Étayage** — Chaque affirmation est-elle sourcée (CV, profil,
  recherche) ou qualifiée ? Vérifier que la passe d'étayage (§2.6) a
  été respectée.
- **Format** — Respect des contraintes du canal (limite de caractères,
  format attendu).

### 3.5 Enrichissement du corpus `[choix]`

Quand le candidat est satisfait du ton d'une lettre après relecture,
proposer de l'ajouter aux exemples de style :

> "Le ton de cette lettre vous plaît ? Je la garde comme référence pour les
> prochaines ?"

L'utilisateur décide. Le corpus s'enrichit, les lettres suivantes
s'améliorent.

---

## Phase 4 — Suivi et apprentissage

Phase continue, déclenchée par les retours du candidat. Fondée sur la
recherche en autorégulation de la recherche d'emploi : les candidats qui
adoptent une orientation d'apprentissage obtiennent de meilleurs résultats
que ceux focalisés sur les résultats bruts (Kanfer et al., 2001 ;
Van Hooft & Van Hoye, 2022). Voir `references/feedback-tracking.md` pour
le protocole détaillé.

### 4.1 Enregistrement des retours `[outil: memory_user_edits]`

Quand le candidat signale un retour (refus, entretien, offre), mettre à
jour l'entrée mémoire `candidature:` correspondante (`replace` du
statut). Le candidat parle naturellement ("refus Wiremind", "entretien 1
chez Doctolib") — l'agent interprète et enregistre.

Voir `references/feedback-tracking.md` pour les statuts et le détail.

### 4.2 Entretiens `[choix]`

Deux moments distincts :

- **Préparation** — Avant un entretien, voir
  `references/interview-prep.md` : recherche sur l'entreprise et les
  interlocuteurs, questions probables, stratégie de négociation salariale.
- **Compte rendu** — Après un entretien, l'agent demande "Comment ça
  s'est passé ?" et adapte la profondeur selon ce que le candidat dit.
  Voir `references/feedback-tracking.md` pour le protocole.

L'objectif des deux est l'extraction d'apprentissages transférables.

### 4.3 Analyse des patterns `[choix]`

Après 5+ candidatures enregistrées, l'agent peut proposer une analyse.
L'analyse n'est jamais automatique — le candidat décide quand il veut
prendre du recul.

> "Vous avez maintenant [N] candidatures enregistrées. Voulez-vous qu'on
> regarde les patterns qui se dégagent ?"

Axes d'analyse :
- Taux de conversion par étape (candidature → entretien → suite → offre)
- Types de postes / entreprises qui produisent les meilleurs retours
- Axes de candidature corrélés aux meilleurs résultats
- Points récurrents en entretien (forces et faiblesses)
- Candidatures qui n'auraient pas dû être envoyées

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
recherche: backend-senior-startup — Tech/ESN/Startup — 10-500 employés —
France — 2026-03 — Documents: CV + LM optionnelle — Ton: direct, tu
accepté — CV 1 page — Pas applicable: lead/management, data/ML, stage
```

### Réutilisation

1. Vérifier la mémoire projet (entrées préfixées `recherche:`)
2. Vérifier l'ancienneté de l'entrée (date YYYY-MM) :
   - **< 3 mois** → réutilisable
   - **3-6 mois** → signaler au candidat, lui laisser décider
   - **> 6 mois** → périmée, relancer la recherche
3. Comparer au poste courant : type de poste, secteur, taille, pays
4. Vérifier le périmètre d'exclusion ("Pas applicable")
5. **Correspondance exacte + entrée fraîche** → réutiliser, continuer
6. **Correspondance approximative** → signaler au candidat, lui laisser
   décider (réutiliser / adapter / refaire)
7. **Aucune correspondance** → recherche complète, stocker en mémoire

Ne jamais réutiliser silencieusement un match approximatif ou une entrée
de plus de 3 mois. Le candidat décide.

**Règle d'expiration.** S'applique aussi aux entrées `shortlist:` — une
offre shortlistée il y a 6 mois est probablement pourvue.

---

## Contre-exemples

- **Validation en un tour** — "Ça te va ?" → "oui" → envoi. Rate les
  malentendus.
- **Modèle générique** — Lettre interchangeable entre deux postes. Chaque
  candidature doit contenir un élément spécifique à l'entreprise.
- **Énumération de compétences hors-sujet** — Lister des technologies qui ne
  sont pas dans l'offre pour remplir.
- **Survente** — Prétendre des compétences que le candidat n'a pas. La
  transparence sur les écarts est un atout.
- **Humilité excessive** — S'excuser de postuler. Le candidat apporte de la
  valeur.
- **Duplication entre champs** — Quand un formulaire a plusieurs questions,
  chaque réponse apporte du contenu distinct.
- **Recherche refaite à chaque fois** — Ignorer l'archive de recherche pour
  un type de poste déjà exploré.
