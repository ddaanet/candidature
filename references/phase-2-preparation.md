# Phase 2, Préparation de la candidature

Deuxième phase du workflow. Une itération par offre d'emploi. Analyse
la fiche de poste, mène la recherche contextuelle, collecte les documents
du candidat, aligne les axes de candidature, et adapte le CV si pertinent.

Le livrable de cette phase est un ensemble validé : axes confirmés, CV prêt,
recherche contextuelle exploitable. La phase suivante (soumission) prend le
relais pour la navigation, la génération et l'envoi.

## 2.1 Fiche de poste `[outil: view/web_fetch]`

Le candidat fournit une ou plusieurs offres d'emploi (texte, URL, ou
capture d'écran). Lire chaque fiche de poste (appel d'outil). Si c'est
une URL, aller la chercher.

### Canal de candidature

Quand l'offre est trouvée via un agrégateur (LinkedIn, WTTJ, Indeed...),
chercher d'abord le site carrière direct de l'entreprise (page "rejoindre",
"careers", ATS propre). Candidater via le canal direct quand il existe,
car il y a moins de bruit et une meilleure traçabilité pour le recruteur.

Si un canal est nettement supérieur (ATS direct ouvert vs agrégateur sans
champ libre), le recommander et avancer. Ne proposer un choix que si les
canaux sont comparables. Pas de widget pour une décision évidente.

Si l'agent n'a pas accès au navigateur, demander au candidat de vérifier
si un site carrière direct existe.

Si le candidat n'a pas encore d'offre : recommander des plateformes
adaptées à son profil et son secteur (pas de liste en dur, recherche
contextuelle en 2.2). Le candidat revient avec des URLs.

### Rappel site (avant navigation) `[outil: notion-fetch]`

Avant de naviguer sur un site de candidature, charger les contraintes
connues de la plateforme. Chercher une sous-page du site sous Sites/ dans
Notion (`notion-fetch`). Cette sous-page contient les contraintes
consolidées et les contournements validés. Si aucune sous-page n'existe
pour ce site, procéder avec prudence.

Si Chrome est disponible : ouvrir directement la page de candidature
(`open_url`). Utiliser `new_tab=false` pour éviter les problèmes de focus.
Refuser les cookies marketing et tracking. Accepter les cookies fonctionnels
si nécessaire au bon fonctionnement du site (session, CSRF, état
multi-étapes).

### Shortlist `[outil: notion-create-pages, notion-fetch]`

Quand le candidat apporte plusieurs offres, analyser chaque offre
contre le profil :

- Alignement P-J fit (compétences matchées, écarts).
- Alignement P-O fit (culture, mission, taille, philosophie).
- Différenciation (où le candidat sort du lot vs où il est un parmi 200).

Chaque offre analysée est stockée immédiatement en page enfant sous la
racine Notion du candidat. Le format et la structure de cette page sont
décrits dans le modèle de page shortlist (voir
`references/backend-write.md` pour la gate d'écriture). Avant de créer
la page, explorer la racine Notion pour vérifier qu'une page pour cette
offre n'existe pas déjà.

Le candidat décide quoi en faire. S'il veut candidater, la page shortlist
est enrichie en page candidature complète au lancement de la phase de
soumission. S'il veut écarter l'offre, la page est supprimée. S'il veut
différer, la page reste en l'état.

Avec 3+ offres en buffer, l'agent peut proposer un tri comparatif :
quelles offres sont les plus différenciantes pour ce profil. Le candidat
décide, pas l'agent.

Pas de workflow imposé. Le candidat peut shortlister une offre et
candidater dans la foulée, ou accumuler et trier plus tard.

### Expiration des shortlists

Une offre shortlistée il y a plus de 6 mois est probablement pourvue.
Signaler au candidat les pages shortlist dont la date de création dépasse
6 mois. Le candidat décide de conserver ou supprimer.

## 2.2 Recherche contextuelle `[outil: notion-fetch → web_search si besoin]`

Avant de demander quoi que ce soit au candidat, rechercher ce qui est
attendu pour ce type de poste. L'objectif est de savoir quels documents
préparer, quel ton adopter, et quelles conventions respecter.

### Réutilisation des recherches existantes

Consulter d'abord Notion. Chercher sous Recherches/ (`notion-fetch` sur
la page Recherches/) une page qui couvre ce type de poste.

Critères de correspondance : type de poste, secteur, taille d'entreprise,
pays. Chaque page de recherche contient un champ "Pas applicable" qui
exclut certains périmètres.

L'ancienneté de la page compte. Moins de 3 mois : réutilisable telle
quelle. Entre 3 et 6 mois : signaler au candidat et lui laisser décider
(réutiliser, adapter, ou refaire). Plus de 6 mois : périmée, relancer la
recherche.

Correspondance exacte et entrée fraîche : réutiliser et passer à 2.3.
Correspondance approximative : signaler au candidat, lui laisser décider.
Aucune correspondance : recherche complète.

Ne jamais réutiliser silencieusement un match approximatif ou une entrée
de plus de 3 mois. Le candidat décide.

### Recherche complète `[outil: web_search]`

Explorer :

- Les documents attendus : CV seul, lettre de motivation, portfolio, lettre
  manuscrite, références, tests techniques, vidéo de présentation. Ça
  varie énormément selon le secteur, le pays, et le canal de candidature.
- Les conventions de ton : tutoiement ou vouvoiement, degré de formalisme,
  humour accepté ou non. Dépend du secteur (startup vs banque), du pays,
  et du canal.
- Les normes sectorielles : longueur de CV attendue, format créatif ou
  classique, informations obligatoires ou à éviter.
- Les spécificités du canal : EasyApply (pas de pièce jointe libre),
  formulaire à champs imposés, envoi direct par email, candidature
  spontanée.
- Le benchmark salarial : fourchettes de rémunération pour ce type de
  poste dans cette zone géographique. Sources pas codées en dur,
  rechercher les sources les plus pertinentes au moment de la recherche.
  Sert de référence pour le champ prétentions à la soumission et pour la
  préparation d'entretien (`references/interview-prep.md`).

### Stockage des résultats `[outil: notion-create-pages]`

Les résultats sont stockés en page enfant sous Recherches/ dans Notion.
Le format et la structure de cette page sont décrits dans le modèle de
page recherche (voir `references/backend-write.md` pour la gate
d'écriture). La page contient le type de poste, le secteur, la taille,
le pays, la date, les résultats structurés, et un champ "Pas applicable"
pour le périmètre d'exclusion.

## 2.3 Documents et contexte candidat `[choix]`

Maintenant qu'on sait ce qui est attendu, demander au candidat :

> "Pour ce type de poste, on attend typiquement [X, Y, Z]. Qu'est-ce que
> vous avez parmi ça ? Et qu'est-ce que vous savez sur l'entreprise ?"

Proposer aussi d'aller chercher des informations sur l'employeur si le
candidat donne un nom ou une URL : site web, page carrière, blog technique,
actualités récentes, avis d'employés.

## 2.4 Axes `[choix]`

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

## 2.5 Personnalisation du CV `[choix]`

Si la recherche contextuelle ou l'analyse du poste indique qu'une
adaptation du CV serait bénéfique : proposer au candidat. Pas imposer.

> "Votre CV est bon tel quel pour cette candidature / Je suggère d'adapter
> [tel aspect] de votre CV pour mettre en avant [tel point]. On le fait ?"

Si oui, voir `references/cv-handling.md`.
