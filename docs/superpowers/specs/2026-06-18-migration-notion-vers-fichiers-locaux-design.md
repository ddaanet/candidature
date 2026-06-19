# Migration Notion → fichiers texte locaux

Date : 2026-06-18
Statut : design approuvé, en attente de relecture

## Contexte et objectif

Le système de recherche d'emploi (config, profil, candidatures, suivi,
journal de sessions) vit aujourd'hui dans Notion, sous la page racine
*Recherche d'emploi* (`candidature_root: 32fec6ce980181558099fd4f5ac9ed46`).
Notion servait de **mémoire externe chargée au démarrage** de chaque
conversation.

Depuis que le travail se fait via Claude Code sur le droplet, cette
mémoire externe n'est plus nécessaire : Claude Code charge nativement
`CLAUDE.md`/`CLAUDE.local.md`, et une arborescence de fichiers texte est
accessible directement par ssh, mosh, VS Code. L'objectif est
**d'abandonner Notion** au profit d'une arborescence de fichiers locaux
versionnée par git.

Abandonner Notion suppose deux fronts : migrer les **données**, puis
basculer le **comportement du skill** `/candidature` (qui écrit
aujourd'hui dans Notion) vers l'écriture locale. Les deux sont dans le
périmètre de ce chantier.

## Périmètre

Dans le périmètre :

- Migration de tout l'arbre Notion *Recherche d'emploi* vers des fichiers
  locaux dans `Emploi/`.
- Mise en place de la config locale (`Emploi/CLAUDE.md`, mise à jour de
  `Emploi/CLAUDE.local.md`).
- Migration des *Correctifs* vers le repo `candidature/` comme backlog.
- Bascule du skill `/candidature` vers l'écriture/lecture de fichiers
  locaux (Phase 2).

Hors périmètre (étapes ultérieures, lancées séparément par David) :

- Pages Notion personnelles (Anniversaire Annabelle, etc.) — restent dans
  Notion.
- Installation de gitlore et synthèse mémoire depuis les passations.
- Reconfiguration éventuelle du skill `handoff:handoff` natif si lui-même
  cible encore Notion.

## Décisions prises

| Question | Décision |
|---|---|
| Périmètre | Tout l'arbre *Recherche d'emploi* ; le perso reste dans Notion. |
| Destination | `/Users/david/code/Emploi`, transformé en repo git. |
| Format candidatures | Un dossier par candidature. |
| Config / Correctifs | Config dans `Emploi/`, Correctifs vers `candidature/`. |
| Sort de Notion après | Archive en lecture seule (rien n'est supprimé). |
| Phase 2 (skill) | Dans le même chantier. |
| Section Situation | Non migrée : redondante avec le statut des offres (frontmatter) et git. |
| Passations vivantes | Abandonnées ; relais par `handoff:handoff` natif. |
| Passations existantes | Migrées en `Archive/passations/` (matière pour gitlore). |
| Mécanique de migration | Scriptée via l'API Notion REST, **pas via MCP** (tokens). |

## Arborescence cible

```
Emploi/
  CLAUDE.md            # config job-search : conventions locales + pointeurs (chargé au démarrage)
  CLAUDE.local.md      # (existant, mis à jour : liens Notion → pointeurs locaux)
  fiche-candidat.md    # profil David, doc de référence
  tendances.md         # tendances marché transversales
  candidatures/
    2026-04-09-mirakl/
      README.md        # offre + frontmatter (statut, dates, canal, ats, poste)
      lm.md            # lettre de motivation (si produite)
      cv.pdf           # livrable (si produit)
    2026-04-07-strangebee/
      README.md
      ...
  sites/               # fiches ATS consolidées : greenhouse.md, teamtailor.md, lever.md, breezy.md, ...
  recherches/          # recherches contextuelles archivées (un fichier par recherche)
  ressources/          # styles cover letter PDF, gabarits
  Archive/
    passations/        # ~40 passations historiques, fichiers datés, figés (matière gitlore)
    ...                # (contenu existant)
  cv/                  # (existant) sources CV
  docs/superpowers/    # specs et plans
  tmp/                 # (existant)
```

## Conventions

### Nommage des candidatures

- Dossier : `AAAA-MM-JJ-slug`, où la date est celle de soumission, ou de
  shortlist si la candidature n'est pas encore soumise.
- `slug` = nom d'entreprise en kebab-case (ex. `mirakl`, `strangebee`,
  `abc-arbitrage`).

### Frontmatter du `README.md` de candidature

```yaml
---
entreprise: Mirakl
poste: Senior AI Agent Engineer
statut: refus          # shortlist | soumise | en attente | refus | classée sans suite | retenue
date_shortlist: 2026-04-08
date_soumission: 2026-04-09
date_reponse: 2026-04-13
canal: Greenhouse      # ATS / plateforme de soumission
lieu: Paris
remote: hybride
source: LinkedIn
---
```

Le corps du `README.md` contient l'offre, l'analyse d'adéquation, les
axes, et l'historique. La vue pipeline n'est pas stockée : le statut de
chaque offre vit dans son frontmatter, et un index tabulaire peut être
régénéré à la demande depuis les frontmatters (script de lecture, pas une
base de données). L'état d'avancement d'une session passe par
l'historique git et le handoff natif.

### Convention de passation

Plus de fichier de passation produit manuellement. Le handoff de session
passe par le skill natif `handoff:handoff`. Il n'y a pas de fichier d'état
courant : le statut de chaque offre vit dans son frontmatter et
l'historique git couvre le reste.

## Mapping Notion → local

| Élément Notion | Cible locale |
|---|---|
| Page racine *Recherche d'emploi* | racine du repo `Emploi/` |
| Page CLAUDE.md (config démarrage) | `Emploi/CLAUDE.md` |
| Correctifs (patches comportement skill) | `candidature/` (backlog, tri au cas par cas) |
| Conventions Notion | supprimées (remplacées par conventions locales) |
| Fiche candidat | `fiche-candidat.md` |
| Section Situation | non migrée (redondante avec le statut des offres et git) |
| Section Candidatures + sous-pages (~35) | `candidatures/AAAA-MM-JJ-slug/README.md` |
| Sous-page Sites | `sites/*.md` |
| Sous-page Recherches | `recherches/*.md` |
| Sous-page Tendances | `tendances.md` |
| Styles cover letter PDF | `ressources/*.md` |
| Passations (~40) | `Archive/passations/AAAA-MM-JJ-slug.md` (figées) |

## Phase 1 — Migration des données (scriptée)

La migration est **scriptée**, le contenu des pages ne transite pas par
le contexte Claude (économie de tokens). MCP/Claude ne lit pas les pages :
Claude écrit et débogue le script, le lance, et la vérification est
scriptée aussi.

### Équipement réutilisé

Le module `candidature/tools/linkedin-harness/lib/notion.mjs` est déjà un
client REST Notion par jeton d'intégration (auth via `NOTION_TOKEN` ou
`~/.config/candidature/notion.env`), sans MCP. Il porte aujourd'hui les
helpers d'écriture (`createShortlistPage`, `archivePage`) et le
`notionFetch` générique.

Le script de migration **étend ce module** (ou s'en inspire) avec la
lecture/export :

- GET `/blocks/{id}/children` récursif pour parcourir l'arbre depuis
  `candidature_root`.
- GET `/pages/{id}` pour les propriétés.
- Conversion bloc Notion → markdown (titres, paragraphes, listes,
  toggles, sous-pages, tableaux).

L'intégration a déjà accès en écriture à la racine *Recherche d'emploi*,
donc l'accès en lecture au sous-arbre est acquis. Prérequis à vérifier :
le jeton est présent dans `~/.config/candidature/notion.env`.

### Étapes

1. `git init` dans `Emploi/` ; `.gitignore` (exclure `tmp/`, artefacts
   binaires lourds non voulus, fichiers périphériques montés).
2. Script de parcours : depuis `candidature_root`, lister l'arbre,
   classer chaque page par type (candidature, site, recherche, passation,
   fiche candidat, tendances). La section Situation est ignorée.
3. Export par type vers le chemin cible, avec extraction des métadonnées
   en frontmatter pour les candidatures.
4. Les PDF / binaires réels (livrables CV, styles cover letter) sont
   récupérés à part s'ils existent comme fichiers ; sinon le contenu
   textuel devient markdown.

### Variante de repli

Si l'export par API se révèle trop coûteux à fiabiliser (types de blocs
exotiques), repli sur l'**export natif Notion** (Markdown & CSV avec
sous-pages → zip) suivi d'un script de *reshaping* local vers
l'arborescence cible. L'API reste le plan A puisque l'équipement existe.

### Vérification (scriptée)

- Compte de pages Notion vs compte de fichiers produits.
- Présence du frontmatter `statut` sur chaque candidature.
- Spot-check : `fiche-candidat.md` et le statut de chaque candidature
  cohérents avec la racine Notion.

## Phase 2 — Bascule du skill `/candidature`

Le skill est aujourd'hui profondément couplé à Notion : l'étape 2 du
dispatcher s'arrête sans outils Notion, l'étape 3 charge la page racine
Notion via `references/notion-setup.md`, et chaque phase (profil,
préparation, suivi, soumission) lit/écrit dans Notion. Le module
`lib/notion.mjs` écrit des pages candidature.

La structure Notion attendue par le skill mappe 1:1 sur l'arborescence
locale (5 sous-pages → fichiers/dossiers, section Candidatures →
`candidatures/`). La section Situation disparaît. La bascule est donc un
remplacement structurel, pas une réécriture conceptuelle :

- `references/notion-setup.md` → setup local : lire le repo `Emploi/` au
  lieu de la page racine Notion ; supprimer la garde « outils Notion
  requis ».
- Lectures de chaque phase : lire les fichiers locaux correspondants.
- Écritures : remplacer les writes Notion (`createShortlistPage`,
  `archivePage`, ajouts de blocs) par des écritures de fichiers
  (`candidatures/.../README.md`, `sites/*.md`, `recherches/*.md`,
  `tendances.md`). Le statut d'une offre se met à jour dans son
  frontmatter, plus de fichier d'état global.
- Convention de suppression : plus de Corbeille Notion ; suppression =
  suppression de fichier (sous git, donc récupérable).
- Passation : retirer la création de sous-page Passation ; le handoff
  natif prend le relais.

Cette phase modifie le repo `candidature/` (skill + `lib/notion.mjs`).
Elle suit la migration des données et fait l'objet de son propre plan
d'implémentation.

## Correctifs → backlog `candidature/`

Les pages *Correctifs* (patches de comportement du skill, numérotés
D-NN) migrent vers le backlog `candidature/TODO.md`. Tri au cas par
cas : un correctif déjà implémenté dans le skill est jeté ; un correctif
en suspens devient une entrée de `candidature/TODO.md`.

## Notion après migration

Archive en lecture seule. Rien n'est supprimé dans Notion. On cesse d'y
écrire. Optionnellement, une note sur la racine Notion pointe vers le
repo local. La confiance dans le local se construit avant toute
suppression éventuelle (décision ultérieure de David).

## Risques et points d'attention

- **Fidélité de l'export** : les types de blocs Notion non triviaux
  (tableaux, toggles imbriqués, callouts, mentions) doivent être rendus
  correctement ; sinon repli sur l'export natif.
- **Accès intégration** : vérifier que le jeton lit bien tout le
  sous-arbre, y compris les pages candidature anciennes.
- **Doublons / incohérences de statut** : la racine Notion porte des
  statuts parfois redondants avec les sous-pages ; le script doit choisir
  une source de vérité (la sous-page candidature) et signaler les écarts.
- **Couplage skill** : la Phase 2 touche tout le skill ; à traiter avec
  son propre plan et des tests, pas dans la foulée de la migration des
  données.
