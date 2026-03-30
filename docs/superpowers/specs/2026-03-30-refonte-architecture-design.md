# Refonte architecture skill candidature

Spec validée le 2026-03-30.

## Contexte

SKILL.md (601 lignes) est tronqué sur claude.ai. Le dispatcher charge tout
en un seul `view`. Le stockage repose sur `memory_user_edits` (30 entrées,
500 chars). Notion est disponible mais utilisé via des BDD qui ne supportent
pas les requêtes structurées (pas de tri, pas de filtre par relation dans
le MCP). Quatre plans Notion et deux passations documentent des décisions
non implémentées.

## Décisions

### 1. Suppression de SKILL.md

SKILL.md est supprimé. Les fichiers de phase deviennent la source de vérité.
Le frontmatter (nom, description, triggers) migre dans le dispatcher.
DESIGN.md reste le document de conception, ses références vers SKILL.md
sont mises à jour vers les fichiers de phase correspondants.

### 2. Découpe en fichiers de phase

Le dispatcher charge une phase à la fois. Chaque fichier est autonome
(l'agent peut agir sans avoir lu les autres phases).

Fichiers :

- `references/phase-1-profil.md` : CV, profil, exemples de style.
- `references/phase-2-preparation.md` : fiche de poste, recherche
  contextuelle, documents candidat, axes, personnalisation CV.
- `references/phase-2-soumission.md` : navigation Chrome, génération
  d'artefacts à la demande selon les champs du formulaire, étayage par
  artefact, relecture avant soumission, flush post-candidature.
- `references/phase-3-relecture.md` : protocole item par item (boucle
  interne appelée par la soumission).
- `references/phase-4-suivi.md` : retours, entretiens, patterns.
- `references/etayage.md` : inchangé, chargé après chaque draft (D-22).

Changement de flux en phase 2 : le formulaire drive la génération. L'agent
ouvre le formulaire avec Chrome, découvre les champs, et génère ce qui est
nécessaire au fur et à mesure. Pas de LM préparée avant de connaître le
formulaire.

La relecture (phase 3) est une boucle interne à la soumission : chaque
artefact passe par la relecture avant d'être soumis dans le champ.

### 3. Stockage Notion en pages imbriquées (requis)

Notion est requis, pas optionnel. Pas de fallback `memory_user_edits`.
Le dispatcher vérifie la présence des outils `notion-*` au démarrage.
S'ils sont absents, le skill s'arrête avec un message d'installation.

Pages imbriquées sous une page racine, pas de BDD Notion. La hiérarchie
donne le filtrage par projet, les dates donnent le tri. Les BDD existantes
(Candidatures, Sites) sont migrées vers des pages.

Structure cible sous la page racine :

```
<page racine>/
  Fiche candidat
  Sites/
    Teamtailor
    LinkedIn
    SmartRecruiters
  Recherches/
    backend-senior-startup-france-2026-03
  Alma/
    LM
    Prep entretien
    Debrief
  Criteo/
    ...
  Patterns
```

La seule valeur configurée : l'URL/ID de la page racine, dans la
configuration locale (`memory_user_edits` sur claude.ai, `CLAUDE.local.md`
sur Claude Code). Le dispatcher fait `notion-fetch` sur la page racine au
démarrage et infère la correspondance des sous-pages par leurs titres.

Le skill fournit des modèles qui décrivent la structure attendue (quelles
sous-pages, quel contenu, quel format). Ces modèles vivent dans des
fichiers de référence séparés, chargés à la demande quand le skill doit
créer ou vérifier une structure Notion. Si une sous-page attendue n'existe pas, le skill la crée à partir du
modèle correspondant.

`memory_user_edits` ne garde que `version-check:` (flag volatile de
session).

### 4. Migration des préfixes mémoire (déjà faite)

Migration effectuée sur claude.ai (passation "Architecture mémoire
/candidature", 29 mars). Il ne reste que `version-check:` et `bootstrap:`
en `memory_user_edits`. Le skill doit refléter cet état, pas le migrer.

### 5. Gate d'écriture backend

Nouveau fichier `references/backend-write.md`. Avant toute écriture vers
Notion, l'agent doit :

1. Explorer la cible (`notion-fetch` sur la page ou le parent).
2. Extraire les contraintes (structure existante, conventions de nommage).
3. Générer une procédure d'écriture spécifique.

La procédure n'existe pas avant l'exploration. L'écriture ne peut pas se
produire sans l'étape d'exploration.

### 6. Dispatcher

Le dispatcher exige Notion. Il détecte Chrome (optionnel). Il charge une
phase à la fois. Les transitions sont déterministes (présence d'artefacts
dans Notion ou dans la conversation).

Au démarrage :

1. Vérification de mise à jour (inchangée).
2. Vérifier la présence des outils `notion-*`. Arrêt si absents.
3. Lire la page racine Notion (configurée localement).
4. Détecter Chrome (`Control Chrome:*`).
5. Charger la phase appropriée selon le contexte.

### 7. Correctifs intégrés

Les correctifs en attente (page Notion "Correctifs candidature") sont
intégrés directement dans les fichiers de phase :

- Chrome/ATS : refuser cookies, `new_tab=false`.
- Artefacts texte : double output interdit, modification ciblée si
  possible.
- Notion : `update_content` pour modifications ciblées, sous-pages
  obligatoires.

### 8. Passation/clôture

Pas de couplage inter-skills. Les skills partagent le contexte
(conversation + Notion). Le flush post-candidature est une étape interne
dans `phase-2-soumission.md` : archivage dans Notion, suggestion de
nouveau chat.

### 9. Migration des BDD existantes

BDD Candidatures et BDD Sites migrées vers des pages imbriquées sous la
page racine. Les données existantes sont transférées. Les BDD sont
archivées ou supprimées après migration.

## Fichiers modifiés ou créés

| Fichier | Action |
|---|---|
| `SKILL.md` | Supprimé |
| `build/dispatcher.md` | Réécrit (exige Notion, charge phases, transitions) |
| `references/phase-1-profil.md` | Créé (extraction) |
| `references/phase-2-preparation.md` | Créé (extraction + révision du flux) |
| `references/phase-2-soumission.md` | Créé (nouveau flux formulaire-driven) |
| `references/phase-3-relecture.md` | Créé (extraction) |
| `references/phase-4-suivi.md` | Créé (extraction) |
| `references/backend-write.md` | Créé |
| `references/etayage.md` | Inchangé |
| `DESIGN.md` | Mis à jour (références SKILL.md, nouvelles décisions) |
| `TODO.md` | Mis à jour |

## Vérification

1. Le dispatcher charge correctement chaque phase individuellement.
2. Un cycle complet de candidature fonctionne avec le nouveau flux
   (preparation → soumission avec génération à la demande).
3. Les données sont écrites dans Notion (pages imbriquées, sous-pages).
4. Le gate backend-write empêche l'écriture sans exploration.
5. La migration des BDD existantes est complète.
6. Le build (`build.sh`) produit un `.skill` fonctionnel sans SKILL.md.
