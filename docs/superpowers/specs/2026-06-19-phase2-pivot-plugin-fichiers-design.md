# Phase 2 — Pivot plugin Claude Code, stockage fichiers locaux

Date : 2026-06-19
Statut : design en cours de relecture

## Contexte

La Phase 1 est livrée. L'arbre Notion Recherche d'emploi est exporté vers le
repo local Emploi par tools/notion-export : 29 candidatures avec frontmatter
de statut, 38 passations figées, 15 fiches Sites, 6 notes de recherche. La
spec data de la migration est docs/superpowers/specs/2026-06-18-migration-notion-vers-fichiers-locaux-design.md.

La Phase 2 bascule le comportement du skill candidature. Aujourd'hui le skill
lit et écrit dans Notion via les outils MCP notion-* et s'arrête sans eux. Le
dispatcher vérifie la connexion Notion, charge la page racine, et chaque phase
opère sur des pages Notion.

Décision de portée prise au brainstorm : on ne préserve plus la cible claude.ai.
Le skill devient un plugin Claude Code pur. Le stockage est l'arborescence de
fichiers du repo Emploi, ancrée sur le répertoire courant. Notion est abandonné
comme backend du skill. La note memory feedback_claude_ai_camisole acte que la
compatibilité claude.ai était une camisole, pas un acquis à protéger.

## Portée

Dans le périmètre :

- Réécriture du dispatcher SKILL.md : retrait du version-check par upload .skill,
  remplacement de la garde Notion par une vérification du repo de données,
  routage de phase sur l'état des fichiers, retrait de la conditionnalité target.
- Réécriture des fichiers de phase et de support qui référencent Notion vers les
  opérations fichiers.
- Sentinelle d'initialisation et script de scaffolding du repo de données.
- Script validateur des métadonnées de candidature.
- Effondrement du build deux-skills en assemblage plugin seul, retrait du target
  stripping et du stub dev claude.ai.
- Mise à jour de DESIGN.md : renversement de D-25, nouvelles décisions du pivot,
  appendice d'étayage.
- Bascule des écritures Notion du harnais LinkedIn vers les fichiers (sous-plan).

Hors périmètre :

- Aucun sync Notion résiduel. tools/notion-export reste figé comme migration
  one-shot, hors runtime du skill.
- Pas de config de chemin du repo de données : le répertoire courant suffit.
- Simulation d'entretien et médium de remontée utilisateurs (autres items TODO).
- Suppression effective des pages Notion : décision ultérieure, hors de ce plan.

## Architecture cible

Le skill opère sur le répertoire courant, qui doit être le repo de données. Une
sentinelle marque un repo initialisé.

### Sentinelle .candidature

Un fichier .candidature à la racine du repo de données porte le numéro de version
du format de stockage, distinct de la VERSION du skill. Format minimal, une ligne :

```
format: 1
```

Le dispatcher lit .candidature au démarrage. Trois cas :

- Présente, version connue : le repo est initialisé, continuer.
- Absente : le repo n'est pas initialisé. Proposer de lancer le script d'init
  qui scaffolde la structure. Ne rien créer sans accord.
- Présente, version supérieure à celle que le skill connaît : dire de mettre à
  jour le skill, s'arrêter.

La version de format évolue séparément de la VERSION du skill. Elle ne change que
si le layout sur disque change de façon incompatible. La version 1 est le layout
produit par l'export Phase 1.

### Script d'initialisation

scripts/init_repo.py scaffolde un repo de données vide : crée candidatures/,
sites/, recherches/, un fiche-candidat.md gabarit, tendances.md, candidatures/_a-trier.md,
et écrit .candidature avec la version de format courante. Le script est idempotent :
il ne touche pas un répertoire ou un fichier déjà présent. Le dispatcher le
propose, le candidat l'exécute, puis relance.

## Modèle de stockage

Le layout produit par l'export devient le contrat de la version de format 1.

```
<repo de données>/
  .candidature           # sentinelle, version de format
  fiche-candidat.md      # profil candidat, doc de référence
  tendances.md           # tendances marché transversales
  candidatures/
    AAAA-MM-JJ-slug/
      README.md          # offre + frontmatter, corps en sections
      <brouillons>.md    # lettres, réponses de formulaire
    _a-trier.md          # prospects orphelins
  sites/                 # fiches ATS consolidées, un fichier par site
  recherches/            # recherches contextuelles, un fichier par recherche
```

Archive/ et Archive/passations/ existent dans le repo mais le skill ne les écrit
pas. Le handoff natif et git couvrent l'historique de session.

### Frontmatter de candidature

Le README.md de chaque candidature porte un frontmatter YAML. Champs requis :
entreprise, poste, statut. Champs conditionnels selon l'avancement : canal,
date_soumission, date_reponse, date_shortlist.

Le statut prend une valeur d'un ensemble fermé : à trier, shortlist, en attente,
refus, classée sans suite, écartée. à trier désigne un prospect non encore
qualifié. écartée désigne une offre que le candidat retire, distincte de classée
sans suite qui est une clôture côté recruteur.

Le corps contient l'offre, l'analyse d'adéquation et écarts, la motivation, la
différenciation, la soumission. Le pipeline n'est pas stocké comme vue : le
statut de chaque offre vit dans son frontmatter, un index tabulaire se régénère
à la demande par lecture des frontmatter.

### Validateur de métadonnées

scripts/validate.py lit les frontmatter des README.md de candidature et signale
les anomalies sans corriger. Contrôles :

- Clés requises présentes : entreprise, poste, statut.
- statut dans l'ensemble fermé.
- Dates parsables au format AAAA-MM-JJ.
- Plausibilité : date_soumission pas dans le futur, date_soumission cohérente
  avec la date du nom de dossier, date_reponse postérieure ou égale à
  date_soumission, date_shortlist antérieure ou égale à date_soumission.
- Cohérence statut/dates : canal et date_soumission présents quand le statut
  implique une soumission (en attente, refus, classée sans suite). date_reponse
  présente quand statut est refus.

Le validateur sort un rapport lisible et un code de sortie non nul s'il trouve
une anomalie, pour être utilisable seul et en vérification. Le dispatcher le
lance à la lecture de l'index et présente les anomalies au candidat sans bloquer.

## Protocole d'écriture

backend-write.md décrit aujourd'hui un protocole d'exploration de la page Notion
cible avant écriture, parce que la structure d'une page n'est pas connue à
l'avance. En fichiers, le layout est connu et documenté, donc l'étape
d'exploration disparaît. Le fichier remplaçant décrit la convention directe :
chemin de destination calculé depuis la date et le slug, frontmatter au schéma,
corps en sections nommées. Pas d'exploration préalable.

L'écartement d'une offre devient un changement de statut dans le frontmatter,
statut: écartée, le fichier reste. Le volet de la couche navigateur subsiste :
écarter une offre issue d'un parcours LinkedIn écarte aussi sa carte dans le flux,
sinon Notion-remplacé-par-fichiers et le flux LinkedIn divergent.

## Dispatcher SKILL.md

- Section 1, version-check par upload .skill : retirée. Les mises à jour passent
  par le mécanisme de plugin Claude Code.
- Sections 2 et 3, garde Notion et page racine : remplacées par la vérification
  de la sentinelle .candidature et, le cas échéant, la proposition d'init.
- Section 4, détection navigateur : ne garder que la branche Claude Code
  (harnais Playwright local).
- Section 5, routage de phase : évaluer l'état des fichiers. Fiche candidat
  absente quand fiche-candidat.md manque ou est un gabarit vide. Page candidature
  existante quand un dossier sous candidatures/ correspond.
- Retrait de tous les blocs target claude-ai et de la conditionnalité.

## Réécriture des fichiers de phase

Quinze fichiers de src référencent Notion. Réécriture par lots cohérents :

- Cœur d'écriture : soumission.md, preparation.md, suivi.md. Les lectures et
  écritures Notion deviennent des lectures et écritures de fichiers sous
  candidatures/, sites/, recherches/, tendances.md.
- Profil : profil.md écrit et lit fiche-candidat.md.
- Support : consolidation.md, relecture.md, site-cloture.md, site-ouverture.md,
  site-ouverture-playwright.md, etayage.md, modele-notion.md.
- Setup : notion-setup.md supprimé, remplacé par la logique sentinelle dans le
  dispatcher. modele-notion.md refondu en doc du layout fichiers ou supprimé si
  le protocole d'écriture le couvre.
- backend-write.md réécrit comme protocole d'écriture fichiers.

Chaque fichier réécrit reste conforme aux règles de prose du repo : pas de gras,
pas de tirets cadratins, phrases entières, français naturel.

## Harnais LinkedIn

tools/linkedin-harness/lib/notion.mjs écrit des pages shortlist dans Notion via
createShortlistPage et archive des pages via archivePage. Abandonner Notion
impose de basculer ces écritures vers les fichiers : créer un dossier candidature
avec frontmatter statut: shortlist au lieu d'une page Notion, et changer le statut
au lieu d'archiver. C'est du code JavaScript avec ses propres tests, distinct des
fichiers de phase markdown. Traiter en sous-plan dédié, après ou en parallèle de
la bascule des fichiers de phase, pas dans le même lot.

## Build et check

Le build assemble aujourd'hui deux artefacts, le plugin sous skills/candidature/
et le .skill claude.ai. Le pivot effondre cela en assemblage plugin seul :

- Retrait de la génération de candidature.skill et candidature-dev.skill.
- Retrait du stub dev claude.ai (build/dev-stub.md) et du target stripping.
- check.sh garde la détection de dérive entre src et skills/candidature/.
- README.md et CLAUDE.md du repo mis à jour : plus de double distribution, plus
  de mention .skill ni d'installation claude.ai.

## DESIGN.md

- D-25 Notion requis : renversé. Une note explique que la décision est caduque,
  remplacée par le stockage fichiers.
- Nouvelles décisions : abandon de la cible claude.ai comme camisole dépassée,
  stockage fichiers ancré sur le répertoire courant, sentinelle de version de
  format, validateur de métadonnées.
- Appendice d'étayage mis à jour pour les affirmations nouvelles.

## Risques et points d'attention

- Surface large : quinze fichiers de phase plus le dispatcher plus le build. À
  découper en lots testables, pas un seul commit monolithique.
- Détection d'un fiche-candidat.md gabarit vide contre rempli : le routage de
  phase en dépend. Définir un marqueur clair de gabarit non rempli.
- Le validateur ne doit pas bloquer un workflow sur une anomalie mineure : il
  signale, le candidat décide.
- Le harnais LinkedIn est un workstream JavaScript distinct, à ne pas mélanger
  avec la réécriture markdown.
- La version de format 1 fige le layout actuel : tout changement ultérieur de
  layout incrémente la version et impose une migration.
