# Refonte architecture skill candidature

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Contrainte de modele :** Toutes les modifications de fichiers
> references/*.md, DESIGN.md, et du dispatcher doivent etre redigees
> dans une session Opus.

**Goal:** Eclater le workflow monolithique en phases autonomes, exiger
Notion comme stockage en pages imbriquees, reviser le flux de
soumission pour que le formulaire drive la generation.

**Architecture:** Le dispatcher est le controleur d'etat. Il charge une
phase a la fois depuis references/. Notion est le backend de stockage
(requis). Chrome est optionnel. SKILL.md est supprime.

**Spec:** `docs/superpowers/specs/2026-03-30-refonte-architecture-design.md`

**Fichiers de reference:**
- Platform Reference: https://www.notion.so/330ec6ce98018172bdeac0bfe792e30c
- Correctifs candidature: https://www.notion.so/331ec6ce980181ec825ce51d90ff071e

---

## Vue d'ensemble des fichiers

| Fichier | Action |
|---|---|
| `SKILL.md` | Supprime (derniere etape) |
| `build/dispatcher.md` | Reecrit |
| `build/build.sh` | Mis a jour (plus de SKILL.md) |
| `references/phase-1-profil.md` | Cree (extraction SKILL.md §1) |
| `references/phase-2-preparation.md` | Cree (extraction SKILL.md §2.1-2.5) |
| `references/phase-2-soumission.md` | Cree (nouveau flux) |
| `references/phase-3-relecture.md` | Cree (extraction SKILL.md §3) |
| `references/phase-4-suivi.md` | Cree (extraction SKILL.md §4) |
| `references/backend-write.md` | Cree |
| `DESIGN.md` | Mis a jour |
| `TODO.md` | Mis a jour |

---

### Task 1: Extraire phase-1-profil.md

**Files:**
- Source: `SKILL.md:65-126` (§1.1 CV, §1.2 Profil, §1.3 Exemples de style)
- Create: `references/phase-1-profil.md`

- [ ] **Step 1: Lire SKILL.md §1 (lignes 65-126)**

Le contenu a extraire couvre : lecture du CV, conversation de profil,
exemples de style optionnels.

- [ ] **Step 2: Creer `references/phase-1-profil.md`**

Extraction directe de SKILL.md §1. Le fichier doit etre autonome :
un agent qui le lit sans avoir lu les autres phases doit pouvoir
executer la phase 1. Ajouter un en-tete qui situe la phase dans le
workflow (une phrase).

Integrer le correctif artefacts texte (double output interdit) dans
les instructions de lecture du CV.

- [ ] **Step 3: Verifier que le fichier est autonome**

Relire le fichier. Verifier qu'il ne reference pas de sections de
SKILL.md par numero (§2.6, etc.). Remplacer par des references aux
fichiers de phase correspondants ou supprimer si non necessaire.

- [ ] **Step 4: Commit**

```bash
git add references/phase-1-profil.md
git commit -m "✨ phase-1-profil: extraction depuis SKILL.md"
```

---

### Task 2: Extraire phase-2-preparation.md

**Files:**
- Source: `SKILL.md:129-266` (§2.1-2.5)
- Create: `references/phase-2-preparation.md`

- [ ] **Step 1: Lire SKILL.md §2.1-2.5 (lignes 129-266)**

Couvre : fiche de poste, canal de candidature, shortlist, recherche
contextuelle, documents et contexte candidat, axes, personnalisation
CV.

- [ ] **Step 2: Creer `references/phase-2-preparation.md`**

Extraction de §2.1-2.5. Le fichier s'arrete avant la generation. Son
livrable est : axes valides, CV pret, recherche faite.

Remplacer les references a `memory_user_edits` par les operations
Notion equivalentes :
- `shortlist:` → page enfant sous la racine
- `recherche:` → page enfant sous Recherches/
- `candidature:` → page enfant sous la racine

Les modeles de structure Notion (format des pages candidature,
recherche, shortlist) sont dans des fichiers de reference separes,
charges a la demande. Ce fichier les reference sans les dupliquer.

Integrer le rappel site : avant de candidater, `notion-fetch` sur la
page du site sous Sites/. Integrer le correctif Chrome (`new_tab=false`,
refuser cookies).

- [ ] **Step 3: Verifier autonomie et coherence**

Le fichier ne reference pas SKILL.md. Les operations de stockage
pointent vers Notion. Les references aux modeles de structure sont
presentes.

- [ ] **Step 4: Commit**

```bash
git add references/phase-2-preparation.md
git commit -m "✨ phase-2-preparation: extraction et migration Notion"
```

---

### Task 3: Creer phase-2-soumission.md

**Files:**
- Source: `SKILL.md:268-358` (§2.6, partiel), `references/browser-layer.md`
- Create: `references/phase-2-soumission.md`

C'est le changement le plus important. Le flux actuel (generer LM puis
soumettre) est remplace par un flux ou le formulaire drive la generation.

- [ ] **Step 1: Lire SKILL.md §2.6 et references/browser-layer.md**

Comprendre le flux actuel : draft → etayage → archivage → capture site.
Comprendre la couche navigateur : Chrome, ATS, cookies.

- [ ] **Step 2: Creer `references/phase-2-soumission.md`**

Nouveau flux :

1. Ouvrir le site de candidature avec Chrome (rappel site depuis Notion
   avant navigation).
2. Explorer le formulaire : identifier les champs, leur type, leur
   taille.
3. Pour chaque champ qui demande du texte libre :
   a. Generer un artefact adapte au champ (LM si champ lettre, message
      court si champ "quelques mots", rien si pas de champ libre).
   b. Charger `references/etayage.md`, auditer l'artefact.
   c. Charger `references/phase-3-relecture.md`, relecture item par
      item avant soumission.
   d. Remplir le champ.
4. Remplir les champs factuels (CV upload, langues, pretentions, liens).
5. Capture site (observation en page Notion sous Sites/).
6. Archivage (sous-page de la candidature dans Notion).
7. Flush post-candidature : suggestion de nouveau chat.

Integrer les correctifs Chrome : `new_tab=false`, refuser cookies. Les
quirks ATS (WTTJ clipboard, Teamtailor dropzone, Lever native setter)
restent dans `references/browser-layer.md` qui est charge par le
dispatcher si Chrome est detecte.

Integrer le correctif artefacts texte : ne jamais afficher resultat
d'outil et texte final. Modification ciblee Notion (`update_content`).

- [ ] **Step 3: Verifier le flux de bout en bout**

Parcourir mentalement un scenario complet : candidature sur un site
Teamtailor avec un champ LM et un champ "quelques mots". Verifier
que chaque etape est couverte.

- [ ] **Step 4: Commit**

```bash
git add references/phase-2-soumission.md
git commit -m "✨ phase-2-soumission: flux formulaire-driven"
```

---

### Task 4: Extraire phase-3-relecture.md

**Files:**
- Source: `SKILL.md:362-476` (§3.1-3.5)
- Create: `references/phase-3-relecture.md`

- [ ] **Step 1: Lire SKILL.md §3 (lignes 362-476)**

Couvre : principes, orientation, item par item, fin de revue, grille de
lecture, enrichissement corpus.

- [ ] **Step 2: Creer `references/phase-3-relecture.md`**

Extraction directe. Ce fichier est appele comme boucle interne par
phase-2-soumission (pas comme phase sequentielle). L'en-tete doit le
preciser : "Charge par la soumission pour chaque artefact genere."

Les references `conversation_search` pour retrouver le texte complet
sont remplacees par `notion-fetch` sur la sous-page de l'artefact.

L'enrichissement du corpus (§3.5) stocke en Notion (sous-page ou
mise a jour de la fiche candidat) au lieu de `memory_user_edits`.

- [ ] **Step 3: Verifier autonomie**

- [ ] **Step 4: Commit**

```bash
git add references/phase-3-relecture.md
git commit -m "✨ phase-3-relecture: extraction, boucle interne soumission"
```

---

### Task 5: Extraire phase-4-suivi.md

**Files:**
- Source: `SKILL.md:480-533` (§4.1-4.3)
- Create: `references/phase-4-suivi.md`

- [ ] **Step 1: Lire SKILL.md §4 (lignes 480-533)**

Couvre : retours, entretiens, analyse de patterns.

- [ ] **Step 2: Creer `references/phase-4-suivi.md`**

Extraction. Remplacer `memory_user_edits` par Notion :
- Retours → mise a jour de la page candidature (statut dans le
  contenu ou le titre).
- CR entretien → sous-page de la candidature.
- Patterns → page Patterns sous la racine.
- `tendance:` → mise a jour de la page Patterns.

References a `references/feedback-tracking.md` et
`references/interview-prep.md` preservees.

- [ ] **Step 3: Verifier autonomie**

- [ ] **Step 4: Commit**

```bash
git add references/phase-4-suivi.md
git commit -m "✨ phase-4-suivi: extraction et migration Notion"
```

---

### Task 6: Creer backend-write.md

**Files:**
- Create: `references/backend-write.md`

- [ ] **Step 1: Creer `references/backend-write.md`**

Gate structurel. Instructions agnostiques :

1. Avant toute ecriture vers un backend (Notion, autre), explorer la
   cible (`notion-fetch` sur la page ou le parent).
2. Extraire les contraintes : structure existante, conventions de
   nommage, pages enfants presentes.
3. Generer une procedure d'ecriture specifique a cette cible.

La procedure est un artefact de l'exploration, pas un fichier
pre-redige. L'ecriture ne peut pas se produire sans l'etape
d'exploration, parce que la procedure n'existe pas avant.

Le fichier doit etre court (30-50 lignes). C'est un protocole, pas
un tutoriel.

- [ ] **Step 2: Commit**

```bash
git add references/backend-write.md
git commit -m "✨ backend-write: gate d'exploration avant ecriture"
```

---

### Task 7: Reecrire le dispatcher

**Files:**
- Modify: `build/dispatcher.md`

- [ ] **Step 1: Lire le dispatcher actuel**

`build/dispatcher.md` (84 lignes). Comprendre : frontmatter,
verification de mise a jour, chargement, erreurs.

- [ ] **Step 2: Reecrire `build/dispatcher.md`**

Le frontmatter absorbe celui de SKILL.md (nom, description, triggers).

Nouveau flux de demarrage :

1. Verification de mise a jour (inchangee).
2. Verifier la presence des outils `notion-*`. Si absents :
   "Ce skill necessite la connexion Notion. Connecter Notion dans
   les parametres du projet, puis relancer /candidature."
   S'arreter.
3. Lire la page racine Notion depuis la configuration locale
   (`memory_user_edits` pour l'URL/ID). Si pas configuree, demander
   au candidat l'URL de sa page racine et la stocker.
4. `notion-fetch` sur la page racine. Inferer la correspondance des
   sous-pages par leurs titres. Si des sous-pages attendues manquent,
   les creer a partir des modeles (charger le modele correspondant).
5. Detecter Chrome (`Control Chrome:*` dans les outils). Si present,
   charger `references/browser-layer.md`.
6. Determiner la phase appropriee selon le contexte de la conversation
   (nouvelle session = phase 1 si pas de profil, sinon phase 2 ;
   offre d'emploi fournie = phase 2 ; retour/debrief = phase 4).
7. Charger la phase : `view references/phase-X.md`.

Transitions entre phases : deterministes par presence d'artefacts dans
Notion ou dans la conversation. Le dispatcher est le seul a decider
de la phase suivante.

- [ ] **Step 3: Verifier les scenarios de demarrage**

Parcourir mentalement :
- Premier lancement (pas de page racine configuree)
- Lancement normal (page racine peuplee, offre fournie)
- Lancement sans Notion (erreur)
- Lancement sans Chrome (degradation gracieuse)
- Retour d'entretien (phase 4 directe)

- [ ] **Step 4: Commit**

```bash
git add build/dispatcher.md
git commit -m "♻️ dispatcher: controleur d'etat, Notion requis, phases"
```

---

### Task 8: Mettre a jour build.sh

**Files:**
- Modify: `build/build.sh`

- [ ] **Step 1: Lire `build/build.sh`**

Comprendre comment SKILL.md est bundle dans le .skill.

- [ ] **Step 2: Modifier `build/build.sh`**

SKILL.md n'existe plus. Le build doit :
- Bundler le dispatcher (avec frontmatter)
- Bundler tous les fichiers references/*.md
- Bundler les scripts/
- Ne plus referencer SKILL.md

Verifier que `references/workflow.md` n'est plus reference (c'etait
un alias de SKILL.md dans le build).

- [ ] **Step 3: Tester le build**

```bash
./build/build.sh
```

Verifier que `dist/candidature.skill` est produit, contient le
dispatcher et les fichiers de phase.

- [ ] **Step 4: Commit**

```bash
git add build/build.sh
git commit -m "🐛 build: adaptation sans SKILL.md"
```

---

### Task 9: Mettre a jour DESIGN.md

**Files:**
- Modify: `DESIGN.md`

- [ ] **Step 1: Identifier les references a SKILL.md dans DESIGN.md**

Chercher toutes les mentions de SKILL.md, les references par section
(§2.6, §3.1, etc.), et les decisions qui pointent vers des sections
specifiques.

- [ ] **Step 2: Mettre a jour les references**

Remplacer les references SKILL.md par les fichiers de phase
correspondants. Ajouter les nouvelles decisions :

- D-24 : Suppression de SKILL.md, fichiers de phase comme source de
  verite.
- D-25 : Notion requis, pages imbriquees comme stockage.
- D-26 : Flux formulaire-driven (le formulaire drive la generation).
- D-27 : Gate d'ecriture backend (backend-write.md).

Mettre a jour la structure du livrable (fin de DESIGN.md) pour
refleter les nouveaux fichiers.

- [ ] **Step 3: Mettre a jour TODO.md**

Le chantier "Stockage par capacite" est remplace par l'integration
Notion (faite). Retirer ou marquer comme fait. Ajouter la migration
des BDD si elle n'est pas encore faite.

- [ ] **Step 4: Commit**

```bash
git add DESIGN.md TODO.md
git commit -m "📝 DESIGN.md: D-24 a D-27, references mises a jour"
```

---

### Task 10: Supprimer SKILL.md

**Files:**
- Delete: `SKILL.md`

Cette tache est la derniere. Ne l'executer qu'apres verification
que toutes les phases sont extraites et que le build fonctionne.

- [ ] **Step 1: Verifier que tout le contenu est couvert**

Comparer SKILL.md section par section avec les fichiers de phase.
Les sections restantes (preambule, ancrage des decisions,
contre-exemples, archive de recherche) : verifier qu'elles sont
integrees dans les fichiers de phase ou dans DESIGN.md.

Le preambule "Ancrage des decisions" doit etre dans le dispatcher ou
dans un fichier de reference charge au demarrage. Les contre-exemples
et l'archive de recherche doivent etre dans les phases qui les
utilisent.

- [ ] **Step 2: Supprimer SKILL.md**

```bash
git rm SKILL.md
```

- [ ] **Step 3: Verifier le build**

```bash
./build/build.sh
```

Le .skill doit se construire sans SKILL.md.

- [ ] **Step 4: Commit**

```bash
git commit -m "🔥 SKILL.md supprime, phases autonomes"
```

---

### Task 11: Migrer les BDD Notion vers des pages

Cette tache est independante du code. Elle opere sur Notion.

- [ ] **Step 1: Explorer les BDD existantes**

`notion-fetch` sur la BDD Candidatures et la BDD Sites. Lister les
entrees existantes.

- [ ] **Step 2: Creer la structure de pages sous la racine**

Si elle n'existe pas : creer Sites/, Recherches/, Patterns.

- [ ] **Step 3: Migrer chaque entree**

Pour chaque candidature dans la BDD : creer une page enfant sous la
racine avec le contenu et les sous-pages. Pour chaque site dans la
BDD : creer une page enfant sous Sites/.

- [ ] **Step 4: Verifier la migration**

`notion-fetch` sur la page racine. Verifier que toutes les pages
sont presentes.

- [ ] **Step 5: Archiver les BDD**

Ne pas supprimer immediatement. Renommer en "[Archive] Candidatures"
et "[Archive] Sites". Supprimer apres verification en production.
