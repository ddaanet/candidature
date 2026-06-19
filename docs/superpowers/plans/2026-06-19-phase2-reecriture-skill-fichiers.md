# Phase 2 — Réécriture du skill vers le stockage fichiers — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Basculer le contenu markdown du skill candidature de Notion vers le stockage fichiers locaux : dispatcher, protocole d'écriture, fichiers de phase, documentation du layout, effondrement du build, DESIGN.md.

**Architecture:** Le skill opère sur le répertoire courant, qui est le repo de données. Une sentinelle `.candidature` marque un repo initialisé. Le dispatcher route les phases sur l'état des fichiers au lieu de l'état d'une page Notion. Chaque opération Notion d'un fichier de phase devient une opération de lecture ou écriture sur un chemin connu sous `candidatures/`, `sites/`, `recherches/`, `fiche-candidat.md` ou `tendances.md`. L'outillage Python (init_repo.py, validate.py) est déjà livré en Phase 2-A. Le build s'effondre de deux artefacts vers le plugin Claude Code seul.

**Tech Stack:** Markdown (contenu du skill), Bash (build, check.sh), awk (préprocesseur). Python stdlib déjà en place pour l'outillage. Pas de runtime nouveau.

## Global Constraints

- Contrainte de modèle : toute réécriture de `src/SKILL.md`, `DESIGN.md` et `src/references/*.md` se fait en session Opus. L'exécution de ce plan tourne sur Opus, y compris les sous-agents. Les tâches qui ne touchent que le build, check.sh ou plugin.json (Task 8) peuvent tourner sur tout modèle, mais le plan reste exécuté en Opus par cohérence.
- Règles de prose, vérifiées par check.sh sur tout fichier de contenu : pas de gras markdown (`**`), pas de tirets cadratins (U+2014) ni demi-cadratins (U+2013), pas de points-virgules, pas de fragments à puces qui remplacent des phrases. Écrire des phrases entières en français naturel.
- Modèle de stockage, version de format 1, layout figé par l'export Phase 1 :
  ```
  <repo>/
    .candidature          sentinelle, ligne unique "format: 1"
    fiche-candidat.md     profil candidat
    tendances.md          observations transversales
    candidatures/
      AAAA-MM-JJ-slug/
        README.md         offre + frontmatter, corps en sections
        <brouillons>.md   lettres, réponses de formulaire
        entretien-N.md    comptes rendus d'entretien
      _a-trier.md         prospects orphelins
    sites/                un fichier par site ATS
    recherches/           un fichier par recherche contextuelle
  ```
- Ensemble fermé des statuts, valeurs exactes avec accents : à trier, shortlist, en attente, refus, classée sans suite, écartée. Défini dans `validate.py` (constante STATUTS), à citer tel quel dans le contenu.
- Marqueur de gabarit non rempli : la chaîne exacte `<!-- candidature:gabarit -->`, écrite en tête de `fiche-candidat.md` par init_repo.py (constante GABARIT_MARKER). La phase profil retire cette ligne quand elle remplit la fiche. Le dispatcher route vers profil tant que le marqueur est présent.
- Version de format : constante `FORMAT_VERSION = 1` dans init_repo.py. Le dispatcher lit la première ligne de `.candidature` et la compare.
- Le dispatcher appelle `validate.py <repo>` sans `--today`. validate.py lit `date.today()` par défaut. `--today` est une surcharge réservée aux tests. validate.py sort en code 1 si une anomalie est trouvée, 0 sinon, 2 sur erreur d'usage. Le dispatcher présente les anomalies sans bloquer.
- Aucune opération Notion résiduelle dans le contenu réécrit. Le critère de fin d'une tâche de réécriture inclut : `grep -ri notion <fichier>` ne retourne aucune mention d'outil `notion-*`, de page Notion, de sous-page, de propriété Notion ni d'archivage de page. Les seules mentions tolérées sont historiques et explicitement marquées comme caduques (DESIGN.md uniquement).
- Garde-fou de dérive : `src/` est la source canonique, `skills/candidature/` et `.claude-plugin/plugin.json` sont des artefacts buildés. Toute tâche qui modifie `src/` reconstruit (`./build/build.sh`) et committe les artefacts dans le même commit, sinon check.sh signale la dérive. Task 7 fait de `.claude-plugin/plugin.json` une source de vérité éditée à la main, dont le champ version est bumpé par `just release`. À partir de Task 7, le garde-fou de dérive ne couvre plus que `skills/candidature/`, et le build ne régénère plus `plugin.json`.
- Mise à jour de check.sh : quand une tâche crée, renomme ou supprime un fichier de `src/references/`, elle met à jour le tableau `content_files` de check.sh dans le même commit.
- Fin de tâche : check.sh passe au vert (`./check.sh`), commit gitmoji avec message centré sur le pourquoi.

---

## File Structure

Fichiers de référence touchés, par responsabilité :

- `src/references/modele-fichiers.md` — créé par rename de `modele-notion.md`. Documente le layout fichiers et la structure interne de chaque document (sections de la fiche candidat, du README de candidature, d'une recherche, d'un site, des tendances). Responsabilité : référence du modèle de stockage.
- `src/references/backend-write.md` — réécrit. Protocole d'écriture fichiers : chemin calculé, frontmatter au schéma, corps en sections, écartement par changement de statut. Responsabilité : convention d'écriture.
- `src/references/notion-setup.md` — supprimé. La logique de sentinelle et d'init vit dans le dispatcher.
- `src/SKILL.md` — réécrit. Dispatcher : sentinelle, routage fichiers, validate.py à l'index, plus de version-check ni de target.
- `src/references/profil.md` — réécrit vers `fiche-candidat.md`.
- `src/references/preparation.md` — réécrit vers `fiche-candidat.md`, `candidatures/`, `recherches/`.
- `src/references/soumission.md` — réécrit vers `candidatures/<slug>/`, `sites/`.
- `src/references/suivi.md` — réécrit vers `candidatures/<slug>/`, `tendances.md`.
- `src/references/site-ouverture.md`, `src/references/site-ouverture-playwright.md`, `src/references/site-cloture.md` — réécrits vers `sites/`.
- `src/references/relecture.md` — réécrit vers `fiche-candidat.md` (section exemples de style).
- `src/references/consolidation.md` — réécrit vers consolidation de `sites/` du repo de données vers `src/references/sites/`.
- `src/references/etayage.md` — inchangé. Aucune référence Notion (vérifié à l'inventaire). Le plan le laisse intact.
- `build/build.sh`, `build/preprocess.awk`, `build/dev-stub.md` — effondrement deux-cibles vers plugin seul, et migration de la release vers le toolkit `plugin-dev`.
- `check.sh` — retrait des assertions `.skill`, dérive réduite à `skills/`, version lue depuis `plugin.json`, mise à jour de `content_files`.
- `.claude-plugin/plugin.json` — devient source de vérité, description sans mention Notion. `src/plugin.json.tmpl` et `VERSION` supprimés.
- `plugin-dev/` (vendu par git subtree), `justfile` (recette `precommit` réelle, import de `release.just`), `.envrc` (`MARKETPLACE_DIR`), `.claude/settings.json` (hook version-guard) — adoption du toolkit de release.
- `README.md`, `CLAUDE.md` — retrait de la double distribution et des mentions `.skill` et claude.ai, documentation du flux `just release`.
- `DESIGN.md` — renversement de D-25, décisions du pivot, appendice d'étayage.

Décomposition en huit tâches. Chaque tâche laisse `check.sh` au vert et porte un commit. L'ordre garde les références internes valides à chaque frontière : la couche de documentation du stockage (Task 1) précède les fichiers de phase qui la citent.

---

## Task 1: Couche de stockage documentée

Le socle que citent les fichiers de phase. Trois changements couplés par leurs références croisées, donc une seule tâche et une seule porte de revue : renommer et réécrire le modèle, réécrire le protocole d'écriture, supprimer la configuration Notion. Les références croisées (`modele-notion.md` cité par backend-write.md et notion-setup.md) imposent de les traiter ensemble pour que check.sh reste vert.

**Files:**
- Rename + rewrite: `src/references/modele-notion.md` → `src/references/modele-fichiers.md`
- Rewrite: `src/references/backend-write.md`
- Delete: `src/references/notion-setup.md`
- Modify: `check.sh` (tableau content_files)

**Interfaces:**
- Produces : `references/modele-fichiers.md` documente le layout et les sections par document. `references/backend-write.md` décrit le protocole d'écriture fichiers. Les fichiers de phase des tâches suivantes citent ces deux fichiers. Plus aucun fichier ne cite `modele-notion.md`. notion-setup.md existe encore après cette tâche, cité par le dispatcher, et n'est supprimé qu'en Task 2.

- [ ] **Step 1: Renommer modele-notion.md en modele-fichiers.md**

```bash
git mv src/references/modele-notion.md src/references/modele-fichiers.md
```

- [ ] **Step 2: Réécrire modele-fichiers.md comme documentation du layout fichiers**

Réécrire le contenu. Substitutions à appliquer, section par section :

- Titre et préambule : remplacer « Modèle de structure Notion » et « pages Notion » par le layout fichiers de la version de format 1. Retirer le paragraphe sur l'ordre d'insertion des sous-pages Notion (caduc, le statut vit dans le frontmatter, l'index se régénère par lecture).
- Page racine : remplacer par la description du répertoire racine. Plus de section Situation ni Candidatures portées par une page. L'index tabulaire des candidatures se régénère à la demande par lecture des frontmatter sous `candidatures/`. Les passations sont couvertes par le handoff natif et git, hors écriture du skill.
- Fiche candidat : conserver la structure en sections (Parcours, Contraintes, Métriques, Sources de style, Notes), cible `fiche-candidat.md`. Mentionner le marqueur `<!-- candidature:gabarit -->` en tête tant que la fiche n'est pas remplie.
- Page candidature : devient le README.md d'un dossier `candidatures/AAAA-MM-JJ-slug/`. Frontmatter YAML requis (entreprise, poste, statut) et conditionnel (canal, date_soumission, date_reponse, date_shortlist). Corps en sections : offre, adéquation et écarts, motivation, différenciation, soumission. Les brouillons (lettre, message, réponse de formulaire) sont des fichiers `.md` frères dans le même dossier. Les comptes rendus d'entretien sont des fichiers `entretien-N.md` dans le même dossier.
- Page recherche : devient un fichier sous `recherches/`, nommé par type de poste et date. Conserver les sections (cadrage, cinq dimensions de résultats, périmètre d'exclusion).
- Page site : devient un fichier sous `sites/`, un par site. Conserver les observations datées avec source et les contournements.
- Page tendances : devient `tendances.md` à la racine. Conserver les observations transversales datées.

Conserver l'ensemble fermé des statuts, cité tel quel.

- [ ] **Step 3: Réécrire backend-write.md comme protocole d'écriture fichiers**

Le layout est connu et documenté, donc l'étape d'exploration disparaît. Réécrire :

- Titre et principe : remplacer « avant toute écriture vers un backend » par le protocole d'écriture fichiers. Retirer la prémisse « la structure n'est pas connue à l'avance ». Le layout est fixé par la version de format 1.
- Retirer entièrement la section « Explorer la cible » (`notion-fetch`). Remplacer par : calculer le chemin de destination depuis la date et le slug, écrire au schéma de frontmatter et aux sections nommées documentés dans `references/modele-fichiers.md`.
- Conserver l'idée de modification ciblée plutôt que remplacement complet, appliquée aux fichiers.
- Section « Suppression et écartement » : remplacer l'archivage de page Notion par un changement de statut dans le frontmatter, `statut: écartée`. Le fichier reste. Conserver la coordination avec la couche navigateur : écarter une offre issue d'un parcours LinkedIn écarte aussi sa carte dans le flux, sinon le stockage fichiers et le flux LinkedIn divergent.
- Section « Cas particuliers » : remplacer la référence au modèle Notion vide par la convention directe. Citer `references/modele-fichiers.md` pour la structure.

Vérifier que backend-write.md cite `references/modele-fichiers.md` et non `modele-notion.md`.

- [ ] **Step 4: Corriger la référence dangling dans notion-setup.md**

Le rename casse la référence interne de `notion-setup.md`, qui cite encore `references/modele-notion.md` (ligne 50). notion-setup.md sera supprimé en Task 2, mais il doit rester cohérent à la frontière de Task 1 pour que la vérification des références internes de check.sh reste verte. Remplacer dans `src/references/notion-setup.md` la seule occurrence de `references/modele-notion.md` par `references/modele-fichiers.md`. Ne pas supprimer notion-setup.md ici, le dispatcher le cite encore. Sa suppression est en Task 2, après que le dispatcher cesse de le citer.

- [ ] **Step 5: Mettre à jour le tableau content_files de check.sh**

Dans `check.sh`, remplacer la ligne `src/references/modele-notion.md` par `src/references/modele-fichiers.md`. Ne pas encore retirer `src/references/notion-setup.md` (supprimé en Task 2). Le garde `[ -f "$f" ] || continue` tolère une entrée stale, mais l'entrée renommée doit pointer le bon fichier pour que la vérification de contamination couvre le nouveau fichier.

- [ ] **Step 6: Reconstruire et vérifier**

Run:
```bash
./build/build.sh && grep -ril notion src/references/modele-fichiers.md src/references/backend-write.md; echo "grep code: $?"
./check.sh
```
Expected : le grep ne retourne aucun fichier (code 1, aucune correspondance). check.sh au vert. La dérive skills/ est résorbée par le build.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "♻️ documenter le stockage fichiers, réécrire le protocole d'écriture"
```

---

## Task 2: Dispatcher SKILL.md

Le lynchpin. Remplace la garde Notion par la sentinelle, route sur l'état des fichiers, lance validate.py, retire le version-check et les blocs target. Supprime notion-setup.md, désormais orphelin.

**Files:**
- Modify: `src/SKILL.md`
- Delete: `src/references/notion-setup.md`
- Modify: `check.sh` (retrait de notion-setup.md de content_files)

**Interfaces:**
- Consumes : `FORMAT_VERSION = 1` et `GABARIT_MARKER = "<!-- candidature:gabarit -->"` de init_repo.py (Phase 2-A). La CLI `python3 scripts/validate.py <repo>` de validate.py (Phase 2-A).
- Produces : un dispatcher qui route sans Notion. Les fichiers de phase des tâches suivantes restent chargés par nom (`view references/<phase>.md`), inchangé côté noms.

- [ ] **Step 1: Supprimer notion-setup.md**

```bash
git rm src/references/notion-setup.md
```

- [ ] **Step 2: Réécrire la section 1, vérification de mise à jour**

Retirer entièrement la section 1 et son bloc `<!-- target: claude-ai -->`. Sur Claude Code, les mises à jour passent par la marketplace de plugins. Le dispatcher n'a plus d'étape de version-check ni de lien de téléchargement `.skill`.

- [ ] **Step 3: Remplacer les sections 2 et 3 par la vérification de sentinelle**

Remplacer la section 2 (vérification Notion) et la section 3 (page racine Notion) par une section unique de vérification du repo de données. Logique à décrire :

Lire la première ligne du fichier `.candidature` à la racine du répertoire courant. Trois cas.

Présente et `format: 1` : le repo est initialisé, continuer.

Absente : le repo n'est pas initialisé. Proposer au candidat de lancer l'initialisation, sans rien créer sans accord :

> Ce dossier n'est pas encore un repo de candidatures. Je peux créer la structure de départ (dossiers candidatures, sites, recherches, et une fiche candidat vide). On y va ?

Si le candidat accepte, lancer `python3 scripts/init_repo.py` puis continuer. Sinon, s'arrêter.

Présente avec une version supérieure à 1 : le format sur disque est plus récent que ce que ce skill connaît. Dire de mettre à jour le skill et s'arrêter :

> Ce repo utilise un format plus récent que ce skill. Mettre à jour le skill candidature, puis relancer.

- [ ] **Step 4: Réduire la section 4, détection du navigateur, à la branche Claude Code**

Retirer le bloc `<!-- target: claude-ai -->` (détection `Control Chrome:*`). Conserver la branche Playwright sans les marqueurs target. La couche navigateur passe par le harnais Playwright local décrit dans `references/site-ouverture-playwright.md`. Les fichiers `references/sites/*.md` restent chargés à la demande par les phases.

- [ ] **Step 5: Réécrire la section 5, détermination de la phase, sur l'état des fichiers**

Réécrire les règles de routage. Elles s'évaluent dans l'ordre, la première qui correspond gagne.

1. Si le candidat signale un retour (refus, réponse, entretien à débriefer) ou utilise un déclencheur de suivi, charger `view references/suivi.md`.
2. Si `fiche-candidat.md` manque ou contient le marqueur `<!-- candidature:gabarit -->`, charger `view references/profil.md`.
3. Si le candidat fournit une offre ou demande à préparer une candidature, charger `view references/preparation.md`.
4. Si un dossier sous `candidatures/` correspond à l'offre en cours, que la recherche contextuelle pour ce type de poste existe sous `recherches/`, et que le candidat passe à la soumission, charger `view references/soumission.md`.
5. Sinon, si la fiche candidat existe (pas de marqueur gabarit), charger `view references/preparation.md`.

Émettre une ligne de statut indiquant la phase chargée.

- [ ] **Step 6: Ajouter le lancement de validate.py à la lecture de l'index**

Décrire, dans la section de routage ou une section dédiée à la lecture de l'index : quand le dispatcher lit l'index des candidatures (régénéré par lecture des frontmatter sous `candidatures/`), lancer `python3 scripts/validate.py <repo>` sans `--today`. Présenter les anomalies au candidat sans bloquer le workflow. Le code de sortie 1 signale des anomalies, 0 leur absence, 2 une erreur d'usage. Ne pas s'arrêter sur une anomalie, c'est un signalement.

- [ ] **Step 7: Retirer tous les marqueurs target restants et la section etayage inchangée**

Vérifier qu'aucun `<!-- target: ... -->` ni `<!-- /target -->` ne subsiste dans SKILL.md. La section 6 (transitions) et la mention de `references/etayage.md` chargé par les phases restent. La section d'erreurs de chargement remplace le lien `.skill` de réinstallation par une formulation neutre, le plugin se réinstalle par la marketplace.

- [ ] **Step 8: Mettre à jour content_files de check.sh**

Retirer la ligne `src/references/notion-setup.md` du tableau content_files de check.sh.

- [ ] **Step 9: Reconstruire et vérifier**

Run:
```bash
./build/build.sh
grep -n 'target:' src/SKILL.md; echo "target code: $?"
grep -ni notion src/SKILL.md; echo "notion code: $?"
./check.sh
```
Expected : aucun marqueur target (grep code 1), aucune mention Notion (grep code 1), check.sh au vert. La vérification des références internes de check.sh confirme que SKILL.md ne cite plus `notion-setup.md`.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "♻️ router le dispatcher sur la sentinelle et l'état des fichiers"
```

---

## Task 3: Phases profil et préparation

Deux fichiers appariés par le contrat `fiche-candidat.md` : profil l'écrit, préparation le lit avant de créer la shortlist. Un sous-agent charge le socle de stockage une fois et rédige les deux, un relecteur juge le contrat écriture puis lecture ensemble.

**Files:**
- Modify: `src/references/profil.md`
- Modify: `src/references/preparation.md`

**Interfaces:**
- Consumes : `references/backend-write.md` (Task 1), `references/modele-fichiers.md` (Task 1), le marqueur GABARIT_MARKER.
- Produces : profil lit et écrit `fiche-candidat.md` et retire le marqueur gabarit au premier remplissage. préparation lit `fiche-candidat.md`, crée des dossiers `candidatures/AAAA-MM-JJ-slug/` avec `statut: shortlist`, lit et écrit `recherches/`. Les phases soumission et relecture consomment ces sorties.

- [ ] **Step 1: Réécrire profil.md vers fiche-candidat.md**

Substitutions :

- Section 1.3 (exemples de style), ligne « enregistrer dans la fiche candidat sur Notion » : remplacer par l'écriture dans la section Sources de style de `fiche-candidat.md`.
- Section 1.4 (enregistrement du profil) : remplacer « Enregistrer le profil dans la fiche candidat sur Notion » et la page fiche candidat par l'écriture des sections (Parcours, Contraintes, Métriques, Sources de style, Notes) dans `fiche-candidat.md`. Au premier remplissage, retirer la ligne marqueur `<!-- candidature:gabarit -->` en tête, ce qui fait basculer le routage du dispatcher hors de la phase profil. Citer `references/backend-write.md`.
- Section « Artefacts texte », « enregistré dans Notion » et « itérations sur la page Notion » : remplacer par l'écriture dans `fiche-candidat.md`. Retirer la notion de lien Notion donné au candidat et de suivi temps réel sur la page.

- [ ] **Step 2: Réécrire preparation.md vers candidatures et recherches**

Substitutions, d'après l'inventaire :

- Lecture de la fiche candidat (`notion-fetch`) : remplacer par lecture de `fiche-candidat.md`.
- Recherche d'une offre existante dans la racine Notion : remplacer par recherche d'un dossier correspondant sous `candidatures/`.
- Création d'une page shortlist enfant (`notion-create-pages`) : remplacer par création d'un dossier `candidatures/AAAA-MM-JJ-slug/` avec `README.md` portant le frontmatter `statut: shortlist`, l'entreprise et le poste. Le slug se calcule depuis l'entreprise et le poste, la date est celle du jour. Citer `references/backend-write.md`.
- Archivage d'une offre écartée : remplacer par changement de statut `statut: écartée` dans le frontmatter du README, le dossier reste. Si l'offre vient d'un parcours LinkedIn, coordonner avec la couche navigateur (écarter la carte).
- Lecture de Recherches/ et de ses pages enfants (`notion-fetch`) : remplacer par lecture des fichiers sous `recherches/`.
- Stockage des résultats de recherche en page enfant (`notion-create-pages`) : remplacer par écriture d'un fichier `recherches/<type-poste>-AAAA-MM-JJ.md` aux sections documentées dans `references/modele-fichiers.md`.

Vérifier que les deux citations de `references/backend-write.md` dans preparation.md restent valides.

- [ ] **Step 3: Reconstruire et vérifier**

Run:
```bash
./build/build.sh && grep -ni notion src/references/profil.md src/references/preparation.md; echo "notion code: $?"
./check.sh
```
Expected : aucune mention Notion (grep code 1), check.sh au vert.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "♻️ phases profil et préparation : fiche candidat, shortlist, recherches en fichiers"
```

---

## Task 4: Phases soumission et suivi

Deux fichiers appariés par la cible commune `candidatures/<slug>/` : soumission y écrit brouillons et métadonnées, suivi y met à jour le statut et ajoute les comptes rendus. Un relecteur juge les conventions du dossier de candidature ensemble. La plus lourde (soumission) s'équilibre avec la plus légère (suivi).

**Files:**
- Modify: `src/references/soumission.md`
- Modify: `src/references/suivi.md`

**Interfaces:**
- Consumes : `references/backend-write.md`, `references/modele-fichiers.md`, les dossiers `candidatures/<slug>/` créés en préparation, les fichiers `sites/`.
- Produces : soumission écrit les brouillons et les métadonnées dans `candidatures/<slug>/` et lit ou écrit `sites/`. suivi met à jour le statut du `README.md`, crée des `entretien-N.md`, écrit `tendances.md`.

- [ ] **Step 1: Réécrire soumission.md vers le dossier de candidature**

Substitutions, d'après l'inventaire :

- Chargement d'une sous-page de site sous Sites/ (`notion-fetch`) : remplacer par lecture de `sites/<site>.md`.
- Création d'un brouillon en sous-page de candidature (`notion-create-pages`) : remplacer par création d'un fichier `.md` dans le dossier `candidatures/<slug>/`, nommé selon l'artefact (lettre, message, reponse-formulaire). Citer `references/backend-write.md`.
- Modification ciblée d'un brouillon (`update_content`) : remplacer par édition du fichier brouillon. Retirer la notion d'itération sur la page Notion en temps réel.
- Chercher ou créer une sous-page site sous Sites/ (`notion-fetch`) : remplacer par lecture ou création de `sites/<site>.md`.
- Enrichir la page candidature avec les propriétés (date_soumission, canal, plateforme, prétentions) : remplacer par écriture de ces champs dans le frontmatter du `README.md`. Le statut passe à `en attente` à la soumission.
- Métadonnées et axes d'adéquation en page candidature (`notion-pages`) : remplacer par écriture des sections (adéquation, motivation, différenciation, soumission) dans le corps du `README.md`.
- Citations de `references/relecture.md`, `references/etayage.md`, `references/consolidation.md` : conserver, ces fichiers existent.

- [ ] **Step 2: Réécrire suivi.md vers candidatures et tendances**

Substitutions, d'après l'inventaire :

- Mise à jour de la page candidature avec le statut (`notion-update-page`) : remplacer par mise à jour du champ `statut` et des dates (`date_reponse`) dans le frontmatter du `README.md`. Le statut prend une valeur de l'ensemble fermé.
- Création d'une sous-page compte rendu d'entretien (`notion-create-pages`) : remplacer par création d'un fichier `candidatures/<slug>/entretien-N.md`, N incrémental, avec date, tour, interlocuteurs, points clés, apprentissages transférables.
- Création de la page Tendances à la première analyse (`notion-create-pages`) : remplacer par écriture de `tendances.md` s'il n'existe pas (init_repo.py le crée déjà).
- Mise à jour de la page Tendances aux analyses suivantes (`notion-update-page`) : remplacer par mise à jour de `tendances.md`, observations datées.

- [ ] **Step 3: Reconstruire et vérifier**

Run:
```bash
./build/build.sh && grep -ni notion src/references/soumission.md src/references/suivi.md; echo "notion code: $?"
./check.sh
```
Expected : aucune mention Notion (grep code 1), check.sh au vert.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "♻️ phases soumission et suivi : dossier de candidature et tendances en fichiers"
```

---

## Task 5: Fichiers de site vers sites/

Trois fichiers de la couche site qui lisent et écrivent les observations sous Sites/. Une tâche : ils partagent la même cible `sites/<site>.md` et la même substitution, un relecteur les juge ensemble.

**Files:**
- Modify: `src/references/site-ouverture.md`
- Modify: `src/references/site-ouverture-playwright.md`
- Modify: `src/references/site-cloture.md`

**Interfaces:**
- Consumes : `references/backend-write.md`, `references/consolidation.md` (réécrit en Task 6), les fichiers `sites/`.
- Produces : la couche site lit et écrit `sites/<site>.md`. Le dispatcher charge site-ouverture-playwright.md.

- [ ] **Step 1: Réécrire site-ouverture.md**

Substitutions : chargement des observations site sous Sites/ (`notion-fetch`) remplacé par lecture de `sites/<site>.md`. Retirer la mention de la page racine Notion et de ses sections de contenu, remplacer par le répertoire racine si nécessaire. Conserver le rôle de fallback quand le navigateur est indisponible.

- [ ] **Step 2: Réécrire site-ouverture-playwright.md**

Substitutions, d'après l'inventaire :

- Chargement des observations site (`notion-fetch`) : remplacer par lecture de `sites/<site>.md`.
- Mention de la REST API Notion hors sandbox : retirer, sans objet en fichiers.
- Écriture shortlist par le harnais LinkedIn (`notion-create-pages`) : la bascule du code JavaScript est un sous-plan distinct (Plan C). Ici, décrire le comportement cible côté skill : le harnais crée un dossier `candidatures/<slug>/` avec `statut: shortlist`. Renvoyer au harnais pour le détail, ne pas décrire d'opération Notion.
- Coordination de l'écartement (`dismiss` + archivage page) : remplacer l'archivage de page par le changement de statut `statut: écartée`, en conservant la coordination avec le `dismiss` de la carte LinkedIn. Le dossier porte le jobId dans son frontmatter.
- Conserver la citation de `references/consolidation.md`.

- [ ] **Step 3: Réécrire site-cloture.md**

Substitutions : création ou mise à jour d'une sous-page site sous Sites/ (`notion-fetch`, création) remplacée par lecture ou écriture de `sites/<site>.md`. Les observations restent datées et versionnées, avec leur source. Conserver les citations de `references/backend-write.md` et `references/consolidation.md`.

- [ ] **Step 4: Reconstruire et vérifier**

Run:
```bash
./build/build.sh && grep -ni notion src/references/site-ouverture.md src/references/site-ouverture-playwright.md src/references/site-cloture.md; echo "notion code: $?"
./check.sh
```
Expected : aucune mention Notion (grep code 1), check.sh au vert.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "♻️ couche site : observations en fichiers sous sites/"
```

---

## Task 6: Relecture et consolidation

**Files:**
- Modify: `src/references/relecture.md`
- Modify: `src/references/consolidation.md`

**Interfaces:**
- Consumes : `references/backend-write.md`, `fiche-candidat.md`, les fichiers `sites/`, l'arbre `src/references/sites/`.
- Produces : relecture.md stocke un texte de référence dans la section exemples de style de `fiche-candidat.md`. consolidation.md décrit la consolidation des observations de `sites/` du repo de données vers `src/references/sites/`.

- [ ] **Step 1: Réécrire relecture.md**

Substitutions : récupérer le texte validé depuis une sous-page artefact (`notion-fetch`) remplacé par lecture du fichier brouillon dans `candidatures/<slug>/`. Stocker le texte comme exemple de style (`notion-create-pages`) remplacé par ajout d'une entrée dans la section Sources de style de `fiche-candidat.md`. Conserver la citation de `references/backend-write.md` et de `references/etayage.md`.

- [ ] **Step 2: Réécrire consolidation.md**

Substitutions, d'après l'inventaire : les observations capturées par site-cloture.md vivent désormais dans `sites/<site>.md` du repo de données, pas dans des sous-pages Notion. La consolidation transfère ces observations vers l'arbre de distribution `src/references/sites/<site>.md` au moment du release. L'historique (date, entreprise, observation) reste tracé en commentaires markdown datés ou en prose, pas en propriétés de page. Conserver le rôle de la consolidation comme étape de release, pas de runtime.

- [ ] **Step 3: Reconstruire et vérifier**

Run:
```bash
./build/build.sh && grep -ni notion src/references/relecture.md src/references/consolidation.md; echo "notion code: $?"
./check.sh
```
Expected : aucune mention Notion (grep code 1), check.sh au vert. Vérifier aussi que etayage.md est resté intact et sans Notion : `grep -ni notion src/references/etayage.md` retourne vide.

- [ ] **Step 4: Vérifier l'absence globale d'opérations Notion dans le contenu**

Run:
```bash
grep -rnil notion src/SKILL.md src/references/*.md
```
Expected : aucune sortie. Tout le contenu du skill est basculé. Si un fichier ressort, le traiter avant de continuer.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "♻️ relecture et consolidation : sources de style et observations en fichiers"
```

---

## Task 7: Effondrement du build et migration de la release vers le toolkit plugin-dev

Retire la génération `.skill`, le stub dev claude.ai, le target stripping. Adopte le toolkit `plugin-dev` pour la release : `.claude-plugin/plugin.json` devient la source de vérité de la version, bumpée par `just release`, et le hook version-guard interdit les éditions manuelles du champ version. Le `VERSION` et `src/plugin.json.tmpl` disparaissent. Cette tâche ne touche pas de fichier de contenu de phase, mais elle modifie README.md et CLAUDE.md, donc elle reste dans la session Opus du plan.

**Files:**
- Add: `plugin-dev/` (vendu par git subtree au tag `v0.2.1`)
- Modify: `justfile` (import de `release.just`, recette `precommit` réelle), `.envrc` (`MARKETPLACE_DIR`), `.claude/settings.json` (hook version-guard)
- Modify: `.claude-plugin/plugin.json` (devient source, description sans Notion)
- Delete: `VERSION`, `src/plugin.json.tmpl`, `build/dev-stub.md`
- Modify: `build/build.sh`, `build/preprocess.awk`, `build/preprocess.test.sh`
- Modify: `check.sh`
- Modify: `README.md`, `CLAUDE.md`

**Interfaces:**
- Consumes : l'arbre `src/` réécrit (Tasks 1 à 6), sans marqueurs target. Le toolkit local à `/Users/david/code/claude-plugin-dev` (tag `v0.2.1`). La marketplace à `/Users/david/code/claude-plugins`.
- Produces : un build qui n'assemble que `skills/candidature/` à partir de `src/`, lit la version depuis `plugin.json`, et ne génère plus `plugin.json`. La release passe par `just release {patch|minor|major}`. Plus de `dist/*.skill`.

- [ ] **Step 1: Vendre le toolkit plugin-dev (hors ligne) et câbler le wiring**

Le toolkit est versionné dans le repo par git subtree, donc les vieux tags et les clones frais reproduisent l'infra. L'`install.sh` du toolkit clone depuis GitHub, ce que le sandbox bloque. Vendre depuis le clone local à la place, puis lancer l'`install.sh` vendu pour le wiring local (justfile, settings).

```bash
git subtree add --prefix=plugin-dev /Users/david/code/claude-plugin-dev v0.2.1 --squash
bash plugin-dev/install.sh
```

Le `subtree add` exige un arbre propre, donc cette étape vient en premier, juste après le commit de Task 6. Il crée son propre commit de squash. L'`install.sh` lancé sans ref voit `plugin-dev/` déjà présent, saute le subtree, et se borne à ajouter `import 'plugin-dev/release.just'` au justfile et le hook version-guard à `.claude/settings.json`. Ces deux modifications restent non committées, reprises au commit final de la tâche.

- [ ] **Step 2: Faire de plugin.json la source, retirer VERSION et plugin.json.tmpl**

`.claude-plugin/plugin.json` cesse d'être un artefact généré et devient la source de vérité éditée à la main. Le champ version reste `0.5.1`, identique au dernier tag `v0.5.1`, ne pas le toucher (le hook version-guard refuse de toute façon une édition du champ version). Modifier uniquement la description : remplacer « Stockage Notion. » par « Stockage en fichiers locaux. » dans la valeur de `description`. Conserver les autres champs.

```bash
git rm VERSION src/plugin.json.tmpl
```

- [ ] **Step 3: Réécrire build.sh sans génération de plugin.json ni release**

Dans `build/build.sh` :
- Lire la version depuis le manifeste au lieu du fichier `VERSION` : `VERSION="$(jq -r .version "$PLUGIN_JSON")"`. Retirer les fonctions `read_version` et `write_version` et le format `PACKAGE X.Y.Z`.
- Retirer toute la résolution `--bump` et toute la section Release (commit, tag, push, `gh release create`). La release passe désormais par `just release`, le build ne tague plus.
- Retirer la ligne qui génère `.claude-plugin/plugin.json` depuis `src/plugin.json.tmpl`. Le manifeste est une source, le build n'y touche plus.
- Retirer la section « Cible Claude.ai (.skill, non versionnée) » (création de `CAND_DIR`, copie de version_check.py, zip de `candidature.skill`) et la section « Stub dev Claude.ai » (création de `DEV_DIR`, copie de dev-stub.md, zip de `candidature-dev.skill`).
- Conserver l'assemblage de `skills/candidature/` depuis `src/`, avec la substitution de `{{VERSION}}` par la version lue.
- Le préprocesseur n'a plus qu'une cible. Retirer le paramètre target des appels (voir Step 4).
- Mettre à jour l'en-tête de commentaire d'usage : plus de `--bump`, plus de `.skill`, plus de stub dev.

- [ ] **Step 4: Simplifier preprocess.awk**

Le target stripping n'a plus d'objet, aucun marqueur target ne subsiste dans `src/`. Réduire `build/preprocess.awk` à la seule substitution de `{{VERSION}}`. Retirer les règles `/^<!-- target: ... -->$/` et la variable `target`. Mettre à jour l'en-tête d'usage. Adapter `build/preprocess.test.sh` en conséquence (retirer les cas de test target, garder la substitution de version).

- [ ] **Step 5: Supprimer dev-stub.md**

```bash
git rm build/dev-stub.md
```

- [ ] **Step 6: Recette precommit réelle et MARKETPLACE_DIR**

Dans `justfile`, remplacer la recette `precommit` stub par une recette qui reconstruit puis vérifie, de sorte que gitlore et `just release` passent par la même porte :

```just
precommit:
    ./build/build.sh
    ./check.sh
```

Conserver la ligne `import 'plugin-dev/release.just'` ajoutée par l'install. Dans `.envrc`, ajouter `export MARKETPLACE_DIR=/Users/david/code/claude-plugins`, la racine du repo marketplace que `just release` bumpe.

- [ ] **Step 7: Mettre à jour check.sh**

Dans `check.sh` :
- Retirer les assertions `dist/candidature.skill genere` et `dist/candidature-dev.skill genere`.
- Réduire la vérification de dérive à `skills` seul, retirer `.claude-plugin/plugin.json` de la comparaison `git diff` (le manifeste est désormais une source, pas un artefact).
- Remplacer la section VERSION (qui lit le fichier `VERSION`) par une lecture de la version depuis le manifeste : `version=$(jq -r .version .claude-plugin/plugin.json)`, vérifier qu'elle est non vide et au format semver.
- Vérifier que le tableau content_files liste `modele-fichiers.md` et ne liste plus `notion-setup.md` ni `modele-notion.md` (fait en Tasks 1 et 2).
- Conserver la vérification des références internes et la contamination de style.

- [ ] **Step 8: Mettre à jour README.md et CLAUDE.md**

Retirer la double distribution, les mentions `.skill` et l'installation claude.ai. README.md décrit l'installation du plugin Claude Code par la marketplace et le flux de release `just release {patch|minor|major}`. CLAUDE.md (la section Build et la section « Deux skills d'utilisation ») décrit le build plugin seul, le manifeste `plugin.json` comme source de version, le toolkit `plugin-dev` vendu par subtree, et la release par `just release`. Retirer la mention du format du fichier `VERSION`. Retirer la mention `modele-notion.md` si présente, mentionner `modele-fichiers.md`. Mettre à jour la ligne `consolidation.md` de README.md si la responsabilité a changé.

- [ ] **Step 9: Reconstruire et vérifier**

Run:
```bash
./build/build.sh
ls dist/ 2>/dev/null; echo "dist code: $?"
test ! -f VERSION && echo "VERSION retiré OK"
test ! -f src/plugin.json.tmpl && echo "tmpl retiré OK"
jq -e .version .claude-plugin/plugin.json
grep -n 'target' build/preprocess.awk; echo "awk target code: $?"
git --no-pager diff --quiet -- .claude-plugin/plugin.json && echo "plugin.json intact après build OK"
jq -e '.hooks.PreToolUse[]?|select(.matcher|test("Write|Edit"))' .claude/settings.json >/dev/null && echo "version-guard câblé OK"
./check.sh
```
Expected : le build produit `skills/candidature/` et laisse `plugin.json` intact, aucun `dist/*.skill`, `VERSION` et `src/plugin.json.tmpl` absents, `plugin.json` valide, aucun marqueur target dans preprocess.awk (grep code 1), hook version-guard présent, check.sh au vert. Si `dist/` contient encore des `.skill` d'un build précédent, les supprimer (`rm -f dist/*.skill`).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "🔥 migrer le build et la release vers le toolkit plugin-dev, plugin seul"
```

Note : cette tâche produit deux commits, le squash du subtree (Step 1) puis le commit d'infra (Step 10). La revue couvre la plage BASE..HEAD complète.

---

## Task 8: DESIGN.md, renversement de D-25 et décisions du pivot

**Files:**
- Modify: `DESIGN.md`

**Interfaces:**
- Consumes : l'ensemble du pivot livré par les Tasks 1 à 7.
- Produces : DESIGN.md cohérent avec le stockage fichiers. Appendice d'étayage à jour.

- [ ] **Step 1: Renverser D-25**

Dans la décision D-25 (Notion requis, pages imbriquées), ajouter une note de renversement : la décision est caduque, remplacée par le stockage fichiers local ancré sur le répertoire courant. Ne pas réécrire l'historique de la décision, marquer son statut comme supersédé par la nouvelle décision du pivot. C'est la seule mention Notion tolérée, explicitement marquée caduque.

- [ ] **Step 2: Ajouter les décisions du pivot**

Ajouter de nouvelles décisions numérotées à la suite des existantes (la dernière est D-39) :
- Abandon de la cible claude.ai comme camisole dépassée. La compatibilité claude.ai n'était pas un acquis à protéger. Le skill devient un plugin Claude Code pur.
- Stockage fichiers ancré sur le répertoire courant, qui est le repo de données. Plus de config de chemin.
- Sentinelle `.candidature` de version de format, distincte de la VERSION du skill. La version 1 fige le layout de l'export Phase 1.
- Validateur de métadonnées `validate.py`, signalement sans correction, lancé par le dispatcher à la lecture de l'index, non bloquant.
- Release par le toolkit `plugin-dev` vendu par git subtree, et `.claude-plugin/plugin.json` comme source de vérité de la version, bumpée par `just release` puis répercutée dans la marketplace. Le fichier `VERSION` et le template `plugin.json.tmpl` disparaissent. Un hook version-guard interdit l'édition manuelle du champ version. Compromis : une dépendance vendue de plus, contre une infra de release reproductible et partagée entre plugins.

Chaque décision suit le format des décisions existantes (contexte, choix retenu, compromis). Respecter les règles de prose.

- [ ] **Step 3: Mettre à jour les besoins affectés**

Revoir NFR-1 (universalité), NFR-5 (portabilité multi-plateforme), NFR-6 (installation minimale), NFR-7 (stockage persistant sans manipulation de fichiers) et les FR qui décrivent le stockage Notion (FR-6, FR-7). Les ajuster au stockage fichiers ou marquer les parties caduques. NFR-7 en particulier est renversé : le candidat n'écrit pas les fichiers à la main, le skill les gère, mais le backend est désormais des fichiers, pas Notion.

- [ ] **Step 4: Mettre à jour l'appendice d'étayage**

Pour chaque affirmation nouvelle introduite par les décisions du pivot, ajouter une entrée dans l'appendice d'étayage de DESIGN.md, traçant la source (spec du pivot `docs/superpowers/specs/2026-06-19-phase2-pivot-plugin-fichiers-design.md`, code livré, ou résultat de l'export Phase 1). Les affirmations sans source sont marquées `[non étayé]` ou retirées.

- [ ] **Step 5: Relire DESIGN.md pour la cohérence**

Relire DESIGN.md en entier. Vérifier qu'aucune affirmation ne décrit le stockage Notion comme actuel hors de la note de renversement de D-25. Vérifier la cohérence des renvois entre décisions (D-6, D-21, D-24, D-27, D-28, D-30 citent Notion ou Filesystem, ajuster les renvois).

- [ ] **Step 6: Vérifier**

Run:
```bash
./check.sh
grep -n -i 'claude\.ai\|\.skill' README.md CLAUDE.md; echo "residus code: $?"
```
Expected : check.sh au vert. Le grep sur README.md et CLAUDE.md ne retourne plus de mention claude.ai ni `.skill` (code 1), confirmant la cohérence avec Task 7.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "📝 renverser D-25 et documenter le pivot stockage fichiers"
```

---

## Self-Review

Couverture de la spec (`docs/superpowers/specs/2026-06-19-phase2-pivot-plugin-fichiers-design.md`), section par section :

- Réécriture du dispatcher : Task 2. Version-check retiré, garde Notion remplacée par la sentinelle, routage sur l'état des fichiers, conditionnalité target retirée.
- Réécriture des fichiers de phase et de support : Tasks 3 à 6. Phases candidat appariées (profil et préparation en Task 3, soumission et suivi en Task 4), couche site (Task 5), relecture et consolidation (Task 6). etayage.md confirmé sans Notion, laissé intact.
- Sentinelle et script de scaffolding : livrés en Phase 2-A, consommés par Task 2.
- Validateur de métadonnées : livré en Phase 2-A et durci, câblé par Task 2.
- Effondrement du build deux-skills vers plugin seul, retrait du target stripping et du stub dev : Task 7.
- Mise à jour de DESIGN.md, renversement de D-25, appendice d'étayage : Task 8.
- Bascule des écritures Notion du harnais LinkedIn : hors périmètre de ce plan, c'est le sous-plan JavaScript (Plan C). Task 5 décrit le comportement cible côté skill sans toucher le code du harnais.
- Protocole d'écriture, suppression de l'étape d'exploration : Task 1, backend-write.md réécrit.
- backend-write.md réécrit comme protocole d'écriture fichiers : Task 1.
- notion-setup.md supprimé, logique sentinelle dans le dispatcher : Task 2.
- modele-notion.md refondu en doc du layout fichiers : Task 1, renommé modele-fichiers.md.

Hors de ce plan, conformément au découpage de la passation : le harnais LinkedIn JavaScript (Plan C), la suppression effective des pages Notion, la config de chemin du repo, la simulation d'entretien.

Cohérence des références internes : modele-fichiers.md (Task 1) et backend-write.md (Task 1) sont créés avant les fichiers de phase qui les citent (Tasks 3 à 6). notion-setup.md est supprimé en Task 2, après que le dispatcher cesse de le citer dans la même tâche. check.sh est tenu à jour à chaque création, rename ou suppression. L'ordre garde la vérification des références internes verte à chaque commit.

Cohérence des chemins cibles, employés uniformément dans toutes les tâches : `fiche-candidat.md`, `tendances.md`, `candidatures/AAAA-MM-JJ-slug/README.md`, `candidatures/AAAA-MM-JJ-slug/<brouillon>.md`, `candidatures/AAAA-MM-JJ-slug/entretien-N.md`, `candidatures/_a-trier.md`, `sites/<site>.md`, `recherches/<type-poste>-AAAA-MM-JJ.md`. Identiques au modèle de stockage des Global Constraints et à l'output de init_repo.py.

Granularité : huit tâches, chacune avec une porte de revue indépendante et un commit. Les phases candidat sont appariées par contrat de cible (profil écrit la fiche que préparation lit, en Task 3 ; soumission et suivi écrivent le même dossier de candidature, en Task 4), ce qui donne un checkpoint par moitié du workflow sans recharger quatre fois le socle de stockage. La couche de stockage documentée (Task 1) groupe trois fichiers couplés par leurs références croisées, qu'un relecteur juge comme un socle. La couche site (Task 5) groupe trois fichiers à cible et substitution identiques. Le dispatcher (Task 2), le build (Task 7) et DESIGN.md (Task 8) restent seuls, chacun un gros artefact ou une compétence distincte.

Note sur l'absence de tests unitaires : ce plan réécrit du contenu markdown, pas du code. La vérification de chaque tâche est l'exécution de check.sh (contamination de style, références internes, build, dérive), le grep d'absence d'opérations Notion, et la revue de la prose contre les règles du repo. L'outillage Python testé est déjà livré en Phase 2-A. Les étapes de vérification portent des commandes exactes et un résultat attendu, conformément à l'esprit du cycle rouge-vert appliqué à de la prose.

Pas de placeholder : chaque tâche porte les substitutions concrètes par fichier, les chemins cibles exacts, et les commandes de vérification avec leur résultat attendu.
