# Phase 2, Préparation de la candidature

Deuxième phase du workflow. Une itération par offre d'emploi. Recherche
d'offres, analyse de la fiche de poste, recherche contextuelle, alignement
des axes de candidature, et adaptation du CV si pertinent.

Le livrable de cette phase est un ensemble validé : axes confirmés, CV prêt,
recherche contextuelle exploitable. La phase suivante (soumission) prend le
relais pour la navigation, la génération et l'envoi.

## 2.1 Recherche d'offres `[outil: web_search, open_url]`

Si le candidat n'a pas encore d'offre, rechercher des offres adaptées à
son profil et son secteur. La recherche par Control Chrome directement
sur les sites d'emploi remonte davantage de résultats qu'une recherche
web simple, car elle accède au contenu des pages de résultats et aux
filtres des plateformes.

Si Chrome n'est pas disponible, utiliser `web_search` et recommander au
candidat des plateformes adaptées à son profil. Le candidat revient avec
des URLs.

## 2.2 Fiche de poste `[outil: view/web_fetch]`

Le candidat fournit une ou plusieurs offres d'emploi (texte, URL, ou
capture d'écran), ou l'agent les a trouvées en recherche. Lire chaque
fiche de poste (appel d'outil). Si c'est une URL, aller la chercher.

### Rappel site (avant navigation) `[outil: notion-fetch, view]`

Avant de naviguer sur un site de candidature, charger les contraintes
connues de la plateforme depuis deux sources. La source primaire est
Notion : chercher une sous-page du site sous Sites/ dans Notion
(`notion-fetch`). Cette sous-page contient les observations terrain,
datées et associées à la version du skill utilisée. La source secondaire
est le fichier de référence du skill (`references/sites/*.md`), qui
contient les directives consolidées.

Si les deux sources existent, les observations Notion prévalent. Si
aucune sous-page n'existe dans Notion pour ce site, procéder avec le
fichier de référence s'il existe, ou avec prudence si aucune source
n'est disponible.

### Shortlist `[outil: notion-create-pages, notion-fetch]`

Pour chaque offre, analyser l'adéquation avec le profil du candidat sur
trois dimensions :

1. Quelles compétences et expériences correspondent aux exigences du
   poste ? Quels écarts honnêtes ?
2. Pourquoi cette entreprise ? Qu'est-ce qui, dans la culture, la
   mission, le produit ou l'équipe, correspond au candidat ?
3. Qu'est-ce qui distingue ce candidat des autres pour ce poste précis ?

Chaque offre analysée est stockée immédiatement en page enfant sous la
racine Notion du candidat. Voir `references/backend-write.md` pour le
contrôle d'écriture. Avant de créer la page, explorer la racine Notion
pour vérifier qu'une page pour cette offre n'existe pas déjà.

Le candidat décide quoi en faire. S'il veut candidater, la page shortlist
est enrichie en page candidature complète au lancement de la phase de
soumission. S'il veut écarter l'offre, la page est supprimée. S'il veut
différer, la page reste en l'état.

Avec 3+ offres en attente, l'agent peut proposer un tri comparatif :
quelles offres sont les plus différenciantes pour ce profil. Le candidat
décide, pas l'agent.

Pas de flux imposé. Le candidat peut shortlister une offre et candidater
dans la foulée, ou accumuler et trier plus tard.

### Expiration des shortlists

Une offre shortlistée il y a plus de 3 mois est probablement pourvue.
Signaler au candidat les pages shortlist dont la date de création dépasse
3 mois. Le candidat décide de conserver ou supprimer.

## 2.3 Canal de candidature `[choix]`

Quand le candidat lance une candidature sur une offre shortlistée,
chercher le meilleur canal. Si l'offre a été trouvée via un agrégateur
(LinkedIn, WTTJ, Indeed...), chercher d'abord le site carrière direct de
l'entreprise (page "rejoindre", "careers", ATS propre). Candidater via le
canal direct quand il existe, car il y a moins de bruit et une meilleure
traçabilité pour le recruteur.

Si un canal est nettement supérieur (ATS direct ouvert vs agrégateur sans
champ libre), le recommander et avancer. Ne proposer un choix que si les
canaux sont comparables.

Si l'agent n'a pas accès au navigateur, demander au candidat de vérifier
si un site carrière direct existe.

## 2.4 Recherche contextuelle `[outil: notion-fetch, web_search]`

Avant de demander quoi que ce soit au candidat, rechercher ce qui est
attendu pour ce type de poste. L'objectif est de savoir quels documents
préparer, quel ton adopter, et quelles conventions respecter.

### Réutilisation des recherches existantes

Consulter d'abord Notion. Lire les annotations de la page Recherches/
(`notion-fetch`) et le contenu des pages les plus pertinentes. La
sélection se fait par le jugement contextuel de l'agent (type de poste,
secteur, taille d'entreprise, pays), pas par la recherche sémantique de
Notion.

L'ancienneté de la page compte. Moins de 3 mois : réutilisable telle
quelle. Entre 3 et 6 mois : signaler au candidat et lui laisser décider
(réutiliser, adapter, ou refaire). Plus de 6 mois : périmée, relancer la
recherche.

Ne jamais réutiliser silencieusement une correspondance approximative ou
une entrée de plus de 3 mois. Le candidat décide.

### Recherche complète `[outil: web_search]`

Explorer les documents attendus pour ce type de poste (CV seul, lettre
de motivation, portfolio, lettre manuscrite, références, tests techniques,
vidéo de présentation). Les attentes varient selon le secteur, le pays et
le canal de candidature.

Explorer les conventions de ton (tutoiement ou vouvoiement, degré de
formalisme, humour). Les conventions dépendent du secteur, du pays et du
canal.

Explorer les normes sectorielles (longueur de CV attendue, format créatif
ou classique, informations obligatoires ou à éviter).

Explorer les spécificités du canal (EasyApply, formulaire à champs
imposés, envoi direct par courriel, candidature spontanée).

Explorer le référentiel salarial (fourchettes de rémunération pour ce
type de poste dans cette zone géographique). Les sources ne sont pas
codées en dur, rechercher les plus pertinentes au moment de la recherche.
Le référentiel sert de base pour le champ prétentions à la soumission et
pour la préparation d'entretien (`references/preparation-entretien.md`).

### Stockage des résultats `[outil: notion-create-pages]`

Les résultats sont stockés en page enfant sous Recherches/ dans Notion.
Voir `references/backend-write.md` pour le contrôle d'écriture. La page
contient le type de poste, le secteur, la taille, le pays, la date, les
résultats structurés, et un champ "Pas applicable" pour le périmètre
d'exclusion.

## 2.5 Documents et contexte candidat `[choix]`

Maintenant qu'on sait ce qui est attendu, demander au candidat :

> "Pour ce type de poste, on attend typiquement [X, Y, Z]. Qu'est-ce que
> vous avez parmi ça ? Et qu'est-ce que vous savez sur l'entreprise ?"

Proposer aussi d'aller chercher des informations sur l'employeur si le
candidat donne un nom ou une URL : site web, page carrière, blog technique,
actualités récentes, avis d'employés.

## 2.6 Axes `[choix]`

Aligner avec le candidat sur deux dimensions distinctes, puis un
différenciateur. Ces dimensions s'appuient sur la recherche en psychologie
organisationnelle (voir `references/recruitment-science.md`, §2) :

1. Quelles compétences et expériences correspondent aux exigences du
   poste ? Quels écarts honnêtes ? C'est le "peut-il faire le travail ?".
   Le CV porte le gros de cette dimension, mais la lettre doit y faire
   référence brièvement.
2. Pourquoi cette entreprise ? Qu'est-ce qui, dans la culture, la mission,
   le produit ou l'équipe, résonne avec le candidat ? C'est le "va-t-il
   s'intégrer ?". La lettre est le véhicule principal de cette dimension.
   Une lettre qui ne fait que résumer le CV rate sa cible.
3. Qu'est-ce qui distingue ce candidat des autres pour ce poste précis ?
   Peut être une expérience, un angle, une compétence rare, un parcours
   atypique.

Conversation courte, 2-3 échanges. Le candidat peut avoir des réponses
claires ou avoir besoin d'aide pour formuler ses arguments. S'adapter.

Confirmer les axes retenus avec un widget avant de rédiger. Le widget
présente les axes choisis sous les deux dimensions pour validation.

## 2.7 Personnalisation du CV `[choix]`

Si la recherche contextuelle ou l'analyse du poste indique qu'une
adaptation du CV serait bénéfique : proposer au candidat. Pas imposer.

> "Votre CV est bon tel quel pour cette candidature / Je suggère d'adapter
> [tel aspect] de votre CV pour mettre en avant [tel point]. On le fait ?"

Si oui, voir `references/adaptation-cv.md`.
