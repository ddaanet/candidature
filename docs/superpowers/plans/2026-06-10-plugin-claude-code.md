# Plugin Claude Code, plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer le skill candidature comme plugin Claude Code (cible v0.5.0) en parallèle du `.skill` Claude.ai, depuis une source canonique unique compilée par préprocesseur.

**Architecture:** Les sources canoniques passent sous `src/`, avec des blocs conditionnels `<!-- target: claude-ai|claude-code -->`. Un préprocesseur awk portable produit deux cibles : `skills/candidature/` (versionné, lu par Claude Code depuis le cache plugin, sans logique de version) et `dist/candidature.skill` (zip non versionné, release GitHub). Faute de lifecycle hook à l'installation d'un plugin, la sortie Claude Code est versionnée et un garde-fou dans `check.sh` interdit la dérive entre `src/` et le build.

**Tech Stack:** bash, mawk (awk système, pas de gawk), zip, gh, JSON plugin Claude Code, marketplace `ddaanet/claude-plugins`.

**Contrainte de modèle :** toute modification de `src/SKILL.md`, `src/references/*.md` et `DESIGN.md` doit être faite en session Opus (CLAUDE.md).

**Spec source :** `docs/superpowers/specs/2026-04-24-plugin-claude-code-design.md`. La spec précède le harnais LinkedIn (`tools/linkedin-harness/`, 2026-06-09) et la correction du modèle Notion (`852304f`). Ce plan réconcilie la couche navigateur (§5) avec le harnais réel et tient compte du modèle Notion corrigé.

---

## Structure des fichiers

État cible du dépôt après le plan :

```
candidature/
  .claude-plugin/
    plugin.json                 généré par build.sh depuis src/plugin.json.tmpl, versionné
  skills/
    candidature/                cible Claude Code, générée, versionnée
      SKILL.md
      references/*.md
      references/sites/*.md
  src/                          sources canoniques avec blocs conditionnels
    SKILL.md
    plugin.json.tmpl
    references/*.md
    references/sites/*.md
    scripts/version_check.py    copié seulement dans la cible Claude.ai
  build/
    build.sh                    réécrit, produit les deux cibles
    preprocess.awk              créé
    preprocess.test.sh          créé
    dev-stub.md                 conservé (cible Claude.ai uniquement)
  dist/
    candidature.skill           non versionné, release GitHub
    candidature-dev.skill       non versionné, stub dev Claude.ai
  check.sh                      chemins src/ + garde-fou de dérive
  docs/  DESIGN.md  README.md  VERSION  TODO.md  CLAUDE.md  CLAUDE.local.md  tools/
```

Responsabilités :

- `src/` est l'unique source de vérité éditable. Tout le reste de `skills/` et `.claude-plugin/plugin.json` est généré.
- `build/preprocess.awk` est la seule logique de compilation : suppression des blocs hors cible, substitution `{{VERSION}}`. Moins de 20 lignes, portable mawk.
- `skills/candidature/` est versionné parce que le cache plugin Claude Code est lu tel quel, sans étape de build au checkout.
- `tools/linkedin-harness/` reste à la racine, hors du contenu skill. Le contenu Claude Code y pointe, il n'est pas copié dans le cache plugin (node_modules, profils, secrets, exécution hors sandbox).

---

## Task 1: Préprocesseur awk et ses tests

**Files:**
- Create: `build/preprocess.awk`
- Create: `build/preprocess.test.sh`

Le préprocesseur est pur et isolé, testable avant toute restructuration. mawk est l'awk système (pas de `match()` à trois arguments, pas d'extension gawk). Les marqueurs sont sur leur propre ligne, exactement deux cibles connues.

- [ ] **Step 1: Écrire le test qui échoue**

Create `build/preprocess.test.sh` :

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AWK="$SCRIPT_DIR/preprocess.awk"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

fail=0
check() {
  local name="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    printf '  OK  %s\n' "$name"
  else
    printf '  FAIL  %s\n  expected: %q\n  actual:   %q\n' "$name" "$expected" "$actual"
    fail=1
  fi
}

cat > "$TMP/in.md" <<'EOF'
commun avant
<!-- target: claude-ai -->
bloc claude-ai
<!-- /target -->
<!-- target: claude-code -->
bloc claude-code
<!-- /target -->
version {{VERSION}}
EOF

ai="$(awk -v target=claude-ai -v version=1.2.3 -f "$AWK" "$TMP/in.md")"
check "claude-ai garde son bloc"      $'commun avant\nbloc claude-ai\nversion 1.2.3' "$ai"

cc="$(awk -v target=claude-code -v version=1.2.3 -f "$AWK" "$TMP/in.md")"
check "claude-code garde son bloc"    $'commun avant\nbloc claude-code\nversion 1.2.3' "$cc"

check "claude-ai exclut claude-code"  "" "$(printf '%s\n' "$ai" | grep -c 'bloc claude-code' || true)0"
# la ligne ci-dessus vaut "0" quand le motif est absent ; garde simple :
nb="$(printf '%s\n' "$ai" | grep -c 'bloc claude-code' || true)"
check "aucun bloc claude-code dans la sortie claude-ai" "0" "$nb"

exit "$fail"
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `bash build/preprocess.test.sh`
Expected: FAIL ou erreur awk « can't open file build/preprocess.awk » (le préprocesseur n'existe pas encore).

- [ ] **Step 3: Écrire le préprocesseur**

Create `build/preprocess.awk` :

```awk
# Préprocesseur des sources candidature.
# Usage : awk -v target=claude-ai|claude-code -v version=X.Y.Z -f preprocess.awk FICHIER
# Supprime les blocs dont la cible ne correspond pas, substitue {{VERSION}}.
# Portable mawk : pas de match() à trois arguments, pas d'extension gawk.
BEGIN { keep = 1 }
/^<!-- target: claude-ai -->$/   { keep = (target == "claude-ai");   next }
/^<!-- target: claude-code -->$/ { keep = (target == "claude-code"); next }
/^<!-- \/target -->$/            { keep = 1; next }
{
  if (keep) {
    line = $0
    gsub(/\{\{VERSION\}\}/, version, line)
    print line
  }
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `bash build/preprocess.test.sh`
Expected: PASS, quatre lignes `OK`, code de sortie 0.

- [ ] **Step 5: Commit**

```bash
chmod +x build/preprocess.test.sh
git add build/preprocess.awk build/preprocess.test.sh
git commit -m "feat: préprocesseur awk pour la double cible plugin/skill"
```

---

## Task 2: Restructuration vers src/ et build à deux cibles

**Files:**
- Move: `SKILL.md` → `src/SKILL.md`
- Move: `references/` → `src/references/`
- Move: `scripts/version_check.py` → `src/scripts/version_check.py`
- Create: `src/plugin.json.tmpl`
- Modify: `build/build.sh` (réécriture)
- Create: `skills/candidature/` (généré par le build)
- Create: `.claude-plugin/plugin.json` (généré par le build)

Cette tâche déplace les sources et réécrit le build pour produire les deux cibles. À ce stade `src/SKILL.md` n'a pas encore de blocs conditionnels (Task 3), donc les deux cibles ont un contenu quasi identique. La vérification porte sur la présence des artefacts, pas encore sur leur différenciation.

- [ ] **Step 1: Déplacer les sources sous src/**

```bash
mkdir -p src
git mv SKILL.md src/SKILL.md
git mv references src/references
mkdir -p src/scripts
git mv scripts/version_check.py src/scripts/version_check.py
rmdir scripts 2>/dev/null || true
```

- [ ] **Step 2: Changer le jeton de version dans src/SKILL.md**

Dans `src/SKILL.md`, remplacer la ligne `Version: __VERSION__` par `Version: {{VERSION}}`.

Run pour vérifier : `grep -n '{{VERSION}}' src/SKILL.md`
Expected: une occurrence, plus aucune occurrence de `__VERSION__`.

- [ ] **Step 3: Créer le gabarit plugin.json**

Create `src/plugin.json.tmpl` :

```json
{
  "name": "candidature",
  "version": "{{VERSION}}",
  "description": "Candidature assistée : préparation, lettre de motivation, CV adapté, relecture, suivi des retours. Stockage Notion. Contenu français.",
  "author": { "name": "David Allouche" },
  "homepage": "https://github.com/ddaanet/candidature",
  "license": "MIT"
}
```

- [ ] **Step 4: Réécrire build.sh**

Replace `build/build.sh` :

```bash
#!/usr/bin/env bash
set -euo pipefail

# Construit les deux cibles depuis src/ via le préprocesseur :
#   skills/candidature/        cible Claude Code, versionnée, lue depuis le cache plugin
#   .claude-plugin/plugin.json manifeste plugin, versionné
#   dist/candidature.skill     cible Claude.ai, zip non versionné, release GitHub
#   dist/candidature-dev.skill stub dev Claude.ai, non versionné
#
# Usage :
#   ./build/build.sh                  construit les deux cibles à la version courante
#   ./build/build.sh --bump patch     construit, incrémente, tague, release
#   ./build/build.sh --bump minor       (seul candidature.skill est releasé)
#   ./build/build.sh --bump major

PACKAGE="ddaanet/candidature"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC_DIR="$REPO_DIR/src"
PREPROCESS="$SCRIPT_DIR/preprocess.awk"
SKILLS_DIR="$REPO_DIR/skills/candidature"
PLUGIN_JSON="$REPO_DIR/.claude-plugin/plugin.json"
DIST_DIR="$REPO_DIR/dist"
BUILD_DIR="$(mktemp -d)"
trap 'rm -rf "$BUILD_DIR"' EXIT

read_version() {
    local raw
    raw="$(cat "$REPO_DIR/VERSION")"
    if [[ "$raw" =~ $PACKAGE\ ([0-9]+\.[0-9]+\.[0-9]+) ]]; then
        echo "${BASH_REMATCH[1]}"
    else
        echo "VERSION file format invalid, expected: $PACKAGE X.Y.Z" >&2
        exit 1
    fi
}

write_version() {
    echo "$PACKAGE $1" > "$REPO_DIR/VERSION"
}

# Compile un arbre src/ (SKILL.md + references/) vers un répertoire de sortie.
# $1 cible, $2 répertoire de sortie. Préserve la hiérarchie references/sites/.
process_skill_tree() {
    local target="$1" out="$2" f rel
    mkdir -p "$out"
    awk -v target="$target" -v version="$VERSION" -f "$PREPROCESS" "$SRC_DIR/SKILL.md" > "$out/SKILL.md"
    while IFS= read -r -d '' f; do
        rel="${f#"$SRC_DIR"/}"
        mkdir -p "$out/$(dirname "$rel")"
        awk -v target="$target" -v version="$VERSION" -f "$PREPROCESS" "$f" > "$out/$rel"
    done < <(find "$SRC_DIR/references" -name '*.md' -print0)
}

# --- Résolution de la version ---
# Sans --bump on construit à la version courante (artefacts versionnés
# déterministes, exigé par le garde-fou de dérive de check.sh).

if [[ "${1:-}" == "--bump" ]]; then
    BUMP="${2:?Usage: ./build/build.sh --bump major|minor|patch}"
    CURRENT="$(read_version)"
    IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"
    case "$BUMP" in
        major) VERSION="$((MAJOR + 1)).0.0" ;;
        minor) VERSION="$MAJOR.$((MINOR + 1)).0" ;;
        patch) VERSION="$MAJOR.$MINOR.$((PATCH + 1))" ;;
        *) echo "bump must be major, minor, or patch, got: $BUMP" >&2; exit 1 ;;
    esac
    write_version "$VERSION"
else
    VERSION="$(read_version)"
fi

# --- Cible Claude Code (versionnée) ---
# Pas de scripts/version_check.py : la vérification de version est supprimée
# sur Claude Code (mises à jour gérées par la marketplace).

rm -rf "$SKILLS_DIR"
process_skill_tree claude-code "$SKILLS_DIR"

mkdir -p "$(dirname "$PLUGIN_JSON")"
awk -v target=claude-code -v version="$VERSION" -f "$PREPROCESS" "$SRC_DIR/plugin.json.tmpl" > "$PLUGIN_JSON"
echo "$SKILLS_DIR ($VERSION)"

# --- Cible Claude.ai (.skill, non versionnée) ---

mkdir -p "$DIST_DIR"
CAND_DIR="$BUILD_DIR/candidature"
CAND_OUTPUT="$DIST_DIR/candidature.skill"

process_skill_tree claude-ai "$CAND_DIR"
mkdir -p "$CAND_DIR/scripts"
cp "$SRC_DIR/scripts/version_check.py" "$CAND_DIR/scripts/"

(cd "$BUILD_DIR" && zip -rq "$CAND_OUTPUT" candidature/ -x '*.DS_Store')
echo "$CAND_OUTPUT ($VERSION)"

# --- Stub dev Claude.ai (non versionné) ---

DEV_DIR="$BUILD_DIR/candidature-dev"
DEV_OUTPUT="$DIST_DIR/candidature-dev.skill"
mkdir -p "$DEV_DIR"
cp "$SCRIPT_DIR/dev-stub.md" "$DEV_DIR/SKILL.md"
(cd "$BUILD_DIR" && zip -rq "$DEV_OUTPUT" candidature-dev/ -x '*.DS_Store')
echo "$DEV_OUTPUT (dev stub)"

# --- Release (optionnelle, candidature.skill uniquement) ---

if [[ "${1:-}" == "--bump" ]]; then
    TAG="v$VERSION"
    cd "$REPO_DIR"
    git add VERSION skills .claude-plugin/plugin.json
    git commit -m "v$VERSION"
    git tag "$TAG"
    git push origin main --tags
    echo "Creating release $TAG..."
    gh release create "$TAG" "$CAND_OUTPUT" \
        --title "candidature $VERSION" \
        --notes "Build from $(git rev-parse --short HEAD)." \
        --latest
    echo "Released: https://github.com/ddaanet/candidature/releases/tag/$TAG"
fi
```

- [ ] **Step 5: Lancer le build et vérifier les deux cibles**

Run:
```bash
./build/build.sh && \
  ls skills/candidature/SKILL.md \
     skills/candidature/references/sites/linkedin.md \
     .claude-plugin/plugin.json \
     dist/candidature.skill && \
  grep -c version_check skills/candidature/SKILL.md; true
```
Expected: les quatre chemins existent. La version réelle (0.4.0) apparaît dans `skills/candidature/SKILL.md` (`grep -n 'Version: 0.4.0' skills/candidature/SKILL.md`) et dans `.claude-plugin/plugin.json`. À ce stade, sans blocs conditionnels, `skills/candidature/scripts/` n'existe pas (jamais copié) mais `SKILL.md` contient encore la section 1 et mentionne `version_check` (corrigé en Task 3).

- [ ] **Step 6: Mettre à jour .gitignore**

Dans `.gitignore`, sous `# Build output`, vérifier que `dist/` est ignoré. Ajouter une note que `skills/` et `.claude-plugin/plugin.json` sont au contraire versionnés (ne rien ajouter à `.gitignore` pour eux). Aucune modification si `dist/` y figure déjà.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: sources canoniques sous src/, build à deux cibles plugin et skill"
```

---

## Task 3: Blocs conditionnels dans src/SKILL.md

**Files:**
- Modify: `src/SKILL.md` (section 1, section 4)

La cible Claude Code supprime la vérification de version (§1) et détecte le navigateur différemment (§4). Les numéros de section restent littéraux : sur Claude Code la liste démarre à `## 2`, écart accepté pour des instructions lues par la machine.

- [ ] **Step 1: Isoler la section 1 dans la cible Claude.ai**

Dans `src/SKILL.md`, encadrer toute la section 1 (de la ligne `## 1. Vérification de mise à jour` jusqu'à la dernière ligne avant `## 2. Vérification Notion`, soit la ligne `explicitement.`) par des marqueurs :

```
<!-- target: claude-ai -->
## 1. Vérification de mise à jour

... contenu inchangé de la section 1 ...

Ne passer à l'étape suivante que si le candidat le demande
explicitement.
<!-- /target -->
```

- [ ] **Step 2: Différencier la détection du navigateur en section 4**

Dans `src/SKILL.md`, remplacer la section 4 actuelle :

```
## 4. Détection Chrome

Si des outils `Control Chrome:*` figurent dans les outils
disponibles, charger `view references/site-ouverture.md`. Les fichiers
`references/sites/*.md` sont chargés à la demande par les phases
(rappel avant navigation sur un site).
```

par :

```
## 4. Détection du navigateur

<!-- target: claude-ai -->
Si des outils `Control Chrome:*` figurent dans les outils
disponibles, charger `view references/site-ouverture.md`. Les fichiers
`references/sites/*.md` sont chargés à la demande par les phases
(rappel avant navigation sur un site).
<!-- /target -->
<!-- target: claude-code -->
La couche navigateur passe par le harnais Playwright local décrit dans
`references/site-ouverture-playwright.md`. Charger ce fichier. Les
fichiers `references/sites/*.md` sont chargés à la demande par les
phases (rappel avant navigation sur un site).
<!-- /target -->
```

- [ ] **Step 3: Rebuild et vérifier la différenciation**

Run:
```bash
./build/build.sh
grep -c 'Vérification de mise à jour' skills/candidature/SKILL.md
grep -c 'version_check' skills/candidature/SKILL.md
grep -c 'site-ouverture-playwright' skills/candidature/SKILL.md
unzip -p dist/candidature.skill candidature/SKILL.md | grep -c 'Vérification de mise à jour'
```
Expected: dans `skills/candidature/SKILL.md`, `0` pour la section 1 et `version_check`, `1` pour `site-ouverture-playwright`. Dans le `.skill` Claude.ai, `1` pour la section 1.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: section 1 et détection navigateur conditionnées par cible"
```

---

## Task 4: Racine Notion conditionnée par cible

**Files:**
- Modify: `src/references/notion-setup.md` (section « Page racine »)
- Modify: `CLAUDE.local.md` (clé de frontmatter, documentation locale)

Sur Claude.ai la racine vit dans `memory_user_edits` (`candidature-root:`). Sur Claude Code elle vit dans `CLAUDE.local.md` (ignoré de git, chargé automatiquement en contexte). Le reste de la section (cinq sous-pages, contenu propre Situation et Candidatures, gestion d'erreur) est partagé et reste inchangé.

- [ ] **Step 1: Conditionner la résolution de la racine**

Dans `src/references/notion-setup.md`, remplacer les trois premiers paragraphes de la section « Page racine » (de `Lire les mémoires (` jusqu'à `Stocker la réponse (\`memory_user_edits add "candidature-root: <URL>"\`).`) par :

```
<!-- target: claude-ai -->
Lire les mémoires (`memory_user_edits view`). Chercher une entrée
`candidature-root: <URL ou ID>`. Si elle existe, utiliser cette
valeur.

Si aucune entrée n'existe, demander au candidat :

> Quelle est l'URL de la page Notion qui servira de page racine pour les candidatures ?

Stocker la réponse (`memory_user_edits add "candidature-root: <URL>"`).
<!-- /target -->
<!-- target: claude-code -->
Lire `CLAUDE.local.md` à la racine du dépôt. Chercher une clé de
frontmatter `candidature_root: <ID de page>`. Si elle existe, utiliser
cette valeur.

Si aucune clé n'existe, chercher dans Notion une page au titre
« Candidatures » (`notion-search`, `page_size: 1`). Proposer la page
trouvée au candidat et demander confirmation :

> La page racine des candidatures est-elle « Candidatures » (<URL> ) ?

Si le candidat confirme, écrire `candidature_root: <ID>` dans le
frontmatter de `CLAUDE.local.md`. S'il refuse ou si aucune page n'est
trouvée, demander :

> Quelle est l'URL de la page Notion qui servira de page racine pour les candidatures ?

puis écrire l'ID correspondant dans `candidature_root:`.
<!-- /target -->
```

- [ ] **Step 2: Documenter la clé dans CLAUDE.local.md**

Dans `CLAUDE.local.md`, ajouter sous le frontmatter existant une ligne de documentation (hors frontmatter, dans le corps) qui mentionne que `candidature_root:` y est écrit par le skill au premier lancement sur Claude Code. Ne pas ajouter de valeur factice. `CLAUDE.local.md` est ignoré de git, cette modification ne sera pas commitée mais documente l'usage pour l'auteur.

Note : `CLAUDE.local.md` étant gitignored, l'étape n'a pas de commit propre. Elle sert à valider à la main que la clé de frontmatter cohabite avec `notion_claude_md` et `project_name`.

- [ ] **Step 3: Rebuild et vérifier**

Run:
```bash
./build/build.sh
grep -c 'CLAUDE.local.md' skills/candidature/references/notion-setup.md
grep -c 'memory_user_edits' skills/candidature/references/notion-setup.md
unzip -p dist/candidature.skill candidature/references/notion-setup.md | grep -c 'candidature-root'
```
Expected: la version Claude Code mentionne `CLAUDE.local.md` (`>= 1`) et plus `memory_user_edits` (`0`) dans la section racine. La version Claude.ai garde `candidature-root` (`>= 1`).

- [ ] **Step 4: Commit**

```bash
git add src/references/notion-setup.md
git commit -m "feat: racine Notion via CLAUDE.local.md sur la cible Claude Code"
```

---

## Task 5: Couche navigateur Claude Code, réconciliation avec le harnais

**Files:**
- Create: `src/references/site-ouverture-playwright.md`

La spec §5 prévoyait un scaffold décrivant des scripts Playwright ad hoc dans `./tmp/`. Depuis, le harnais LinkedIn réel existe à `tools/linkedin-harness/`. Ce fichier réconcilie : il pointe sur le harnais pour LinkedIn et décrit l'approche Playwright ad hoc pour les autres sites, sans dupliquer le README du harnais. Le contenu respecte les règles de prose du skill (pas de gras, pas de tirets cadratins, pas de points-virgules, phrases entières).

- [ ] **Step 1: Créer le fichier de couche navigateur Claude Code**

Create `src/references/site-ouverture-playwright.md` :

```markdown
# Ouverture de site, couche Playwright

Couche navigateur de la cible Claude Code. Chargée par le dispatcher
quand un chromium système est disponible. Les phases chargent ce
fichier avant toute navigation sur une plateforme.

## Rappel

Avant de naviguer sur un site de candidature, charger les contraintes
connues de la plateforme depuis deux sources. La source primaire est
Notion, une sous-page du site sous Sites/ avec les observations
terrain datées. La source secondaire est le fichier de référence du
skill (`references/sites/*.md`). Si les deux existent, les observations
Notion prévalent. Noter le nom du site pour la capture après
interaction (`references/site-cloture.md`).

## Exécution hors sandbox

Le contrôle navigateur lance un chromium réel avec un profil persistant
et un port CDP. Le navigateur et les appels Notion REST tournent hors
de la sandbox de l'agent, l'isolation PID et réseau de la sandbox
couperait la session. Lancer les commandes du harnais hors sandbox.

## LinkedIn, harnais dédié

Le parcours d'offres LinkedIn passe par le harnais
`tools/linkedin-harness/` du dépôt candidature. Suivre son `README.md`.
Le harnais ouvre le navigateur (`./launch.sh`), liste les flux
(`npm run streams`) et pilote le parcours de cartes (`npm run walk`).
Une décision parmi trois, shortlist crée une page candidature Notion,
reject écarte la carte, stop arrête le parcours. L'écriture Notion du
harnais passe par un jeton d'intégration REST, pas par le MCP, voir le
README du harnais pour la configuration du jeton.

## Autres sites, Playwright ad hoc

Pour un site sans harnais dédié, écrire un script Playwright dans
`./tmp/`, le lancer hors sandbox, lire stdout, stderr et les captures
d'écran, puis itérer. Décrire ce qu'on cherche à observer, pas une
mécanique pas à pas. Refuser les cookies marketing et pistage, accepter
les cookies fonctionnels nécessaires au flux. Commencer par l'approche
DOM (sélecteurs CSS, remplissage de formulaire) et basculer en approche
visuelle (captures d'écran) quand le DOM est peu fiable.

## Consolidation

Les patterns réutilisables remontent au fil des candidatures dans
`references/sites/*.md`, puis à terme dans une base Playwright
partagée. La consolidation périodique est décrite dans
`references/consolidation.md`.
```

- [ ] **Step 2: Rebuild et vérifier la présence dans la cible Claude Code, l'absence dans la cible Claude.ai**

La spec ne charge `site-ouverture-playwright.md` que sur Claude Code (via le bloc §4 de Task 3). Le fichier reste partagé physiquement (présent dans `src/references/`), mais seul le SKILL.md Claude Code y renvoie. Vérifier qu'il est compilé dans les deux arbres et qu'aucun marqueur résiduel ne subsiste.

Run:
```bash
./build/build.sh
ls skills/candidature/references/site-ouverture-playwright.md
grep -rc 'target:' skills/candidature/ | grep -v ':0' || echo "aucun marqueur résiduel"
bash check.sh
```
Expected: le fichier existe dans `skills/candidature/references/`. Aucun marqueur `target:` ne subsiste dans la sortie. `check.sh` passe (après Task 7 ; avant Task 7 il peut échouer sur les chemins `references/` historiques, c'est attendu).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: couche navigateur Claude Code, réconciliée avec le harnais LinkedIn"
```

---

## Task 6: Phases tool-agnostiques

**Files:**
- Modify: `src/references/preparation.md:14,19`
- Modify: `src/references/soumission.md` (lignes mentionnant Chrome, open_url, form_input)

Les fichiers de phase nomment aujourd'hui Control Chrome et ses verbes (`open_url`, `form_input`), spécifiques à la cible Claude.ai. Les rendre tool-agnostiques : « le navigateur » au lieu de « Chrome », « ouvrir la page » au lieu de `open_url`, « remplir le champ » au lieu de `form_input`. Les mécaniques d'outil vivent dans `site-ouverture.md` (Claude.ai) et `site-ouverture-playwright.md` (Claude Code), pas dans les phases. Les fichiers `references/sites/*.md` sont déjà tool-agnostiques, aucune modification.

- [ ] **Step 1: Neutraliser preparation.md**

Dans `src/references/preparation.md`, ligne 14, remplacer « La recherche par Control Chrome directement » par « La recherche par le navigateur directement ». Ligne 19, remplacer « Si Chrome n'est pas disponible, utiliser `web_search` » par « Si le navigateur n'est pas disponible, utiliser `web_search` ».

- [ ] **Step 2: Neutraliser soumission.md**

Dans `src/references/soumission.md`, remplacer chaque mention de Chrome et de ses verbes par une formulation tool-agnostique :

- « Si Chrome est disponible, ouvrir directement la page de candidature (`open_url`, `new_tab=false`). » devient « Si le navigateur est disponible, ouvrir directement la page de candidature. »
- « `references/site-ouverture.md`, chargé par le dispatcher quand Chrome est disponible. » devient « la couche navigateur chargée par le dispatcher quand le navigateur est disponible. »
- Chaque « Si Chrome est disponible » / « Si Chrome n'est pas disponible » devient « Si le navigateur est disponible » / « Si le navigateur n'est pas disponible ».
- « utiliser `form_input` ou l'approche appropriée à la plateforme » devient « remplir le champ par l'approche appropriée à la plateforme ».

- [ ] **Step 3: Vérifier l'absence de verbes d'outil et rebuild**

Run:
```bash
grep -nE 'Control Chrome|open_url|form_input' src/references/preparation.md src/references/soumission.md || echo "aucun verbe d'outil résiduel"
./build/build.sh
```
Expected: aucun verbe d'outil résiduel. Le build passe.

- [ ] **Step 4: Commit**

```bash
git add src/references/preparation.md src/references/soumission.md
git commit -m "refactor: phases tool-agnostiques, mécanique navigateur isolée dans les couches"
```

---

## Task 7: check.sh, chemins src/ et garde-fou de dérive

**Files:**
- Modify: `check.sh`

`check.sh` lit aujourd'hui les fichiers de contenu sous `references/`. Ils sont maintenant sous `src/references/`. Ajouter un garde-fou qui interdit la dérive entre `src/` et les artefacts versionnés (`skills/`, `.claude-plugin/plugin.json`), et brancher le test du préprocesseur.

- [ ] **Step 1: Pointer les fichiers de contenu sur src/**

Dans `check.sh`, dans le tableau `content_files`, préfixer chaque chemin `references/...` et `SKILL.md` par `src/` :
`SKILL.md` devient `src/SKILL.md`, `references/profil.md` devient `src/references/profil.md`, etc. Ajouter `src/references/site-ouverture-playwright.md` à la liste. La boucle de vérification des références internes doit elle aussi parcourir `src/SKILL.md` et `src/references/*.md` au lieu de `SKILL.md` et `references/*.md`.

- [ ] **Step 2: Brancher le test du préprocesseur**

Dans `check.sh`, après la section « Contamination de style », ajouter une section :

```bash
echo "Préprocesseur"
if preprocess_output=$(bash build/preprocess.test.sh 2>&1); then
  pass "preprocess.test.sh OK"
else
  fail "preprocess.test.sh a échoué"
  echo "$preprocess_output"
fi
```

- [ ] **Step 3: Ajouter le garde-fou de dérive**

Dans `check.sh`, après la section « Build » (qui lance `./build/build.sh`), ajouter :

```bash
echo "Dérive des artefacts versionnés"
if git diff --quiet -- skills .claude-plugin/plugin.json; then
  pass "skills/ et plugin.json à jour avec src/"
else
  fail "skills/ ou plugin.json divergent de src/ (lancer ./build/build.sh et committer)"
  git --no-pager diff --stat -- skills .claude-plugin/plugin.json
fi
```

Ce garde-fou suppose que `build.sh` vient d'être lancé par la section « Build » juste avant. Si le build a régénéré `skills/` à l'identique, `git diff` est vide.

- [ ] **Step 4: Lancer check.sh**

Run: `bash check.sh`
Expected: toutes les sections en `OK`, dont « Préprocesseur », « Build », « Dérive des artefacts versionnés ». Code de sortie 0. Si la dérive échoue, lancer `./build/build.sh` puis `git add skills .claude-plugin` et relancer.

- [ ] **Step 5: Commit**

```bash
git add check.sh
git commit -m "feat: check.sh sur src/, garde-fou de dérive et test du préprocesseur"
```

---

## Task 8: README, section installation Claude Code

**Files:**
- Modify: `README.md`

Le README documente l'installation Claude.ai. Ajouter une section Claude Code : installation via marketplace `ddaanet` et installation locale via `/plugin install <chemin>` après build.

- [ ] **Step 1: Ajouter la section installation Claude Code**

Dans `README.md`, après la section d'installation Claude.ai existante, ajouter :

```markdown
## Installation sur Claude Code

Le skill est aussi disponible comme plugin Claude Code, pour un usage
local sans la limite de tours de Claude.ai.

Depuis la marketplace ddaanet :

    /plugin marketplace add ddaanet/claude-plugins
    /plugin install candidature@ddaanet

Pour le développement local, après un build, pointer Claude Code sur le
dépôt :

    ./build/build.sh
    /plugin install /chemin/vers/candidature

La racine Notion des candidatures est stockée dans `CLAUDE.local.md`,
écrite au premier lancement. La couche navigateur utilise le harnais
Playwright local décrit dans `tools/linkedin-harness/` et exige un
chromium système.
```

- [ ] **Step 2: Vérifier le style et commit**

Run: `grep -nE '\*\*|—|–|;' README.md || echo "style propre"`
Expected: aucun marqueur de contamination dans la section ajoutée.

```bash
git add README.md
git commit -m "docs: section installation Claude Code dans le README"
```

---

## Task 9: DESIGN.md, décisions D-33 à D-36

**Files:**
- Modify: `DESIGN.md` (nouvelles décisions et appendice d'étayage)

La dernière décision est D-32. Ajouter D-33 à D-36 pour tracer la migration plugin. Respecter les règles de prose (pas de gras, pas de tirets cadratins, pas de points-virgules).

- [ ] **Step 1: Ajouter les décisions**

Dans `DESIGN.md`, après la décision D-32, ajouter :

```markdown
### D-33 : Double cible, sources canoniques et préprocesseur

Choix retenu : le dépôt produit deux artefacts depuis une source unique
`src/`. Les blocs `<!-- target: claude-ai|claude-code -->` isolent le
contenu propre à chaque cible. Un préprocesseur awk portable
(`build/preprocess.awk`) supprime les blocs hors cible et substitue
`{{VERSION}}`. Évite la divergence entre deux arborescences éditées à la
main. Spec 2026-04-24, sections 1, 3, 4.

### D-34 : Artefacts Claude Code versionnés, garde-fou de dérive

Choix retenu : `skills/candidature/` et `.claude-plugin/plugin.json`
sont générés puis versionnés. Un plugin Claude Code n'a pas de lifecycle
hook à l'installation, le cache est lu tel quel, un build au checkout
est impossible. `check.sh` lance le build puis échoue sur tout diff dans
les artefacts versionnés, ce qui interdit la dérive avec `src/`. Effet
de bord accepté, un commit touchant `src/` produit aussi un diff dans
`skills/`. Spec 2026-04-24, section 4.

### D-35 : Couche navigateur Claude Code via harnais Playwright local

Choix retenu : sur Claude Code, le contrôle navigateur passe par un
harnais Playwright local lancé hors sandbox, pas par le MCP. La spec
2026-04-24 prévoyait un scaffold de scripts ad hoc. Le harnais LinkedIn
réel (`tools/linkedin-harness/`, livré 2026-06-09) a précisé cette
intention. `references/site-ouverture-playwright.md` pointe sur le
harnais pour LinkedIn et décrit l'approche ad hoc pour les autres sites.
Le harnais reste hors du contenu skill, il vit dans une copie locale du
dépôt, pas dans le cache plugin. Spec 2026-04-24, section 5, réconciliée.

### D-36 : Suppression de la vérification de version sur Claude Code

Choix retenu : le build Claude Code supprime la section 1 de SKILL.md et
`scripts/version_check.py`. Les mises à jour sont gérées par la
marketplace Claude Code. La logique de version reste isolée dans le
bloc `claude-ai`. Spec 2026-04-24, section 6.
```

- [ ] **Step 2: Mettre à jour l'appendice d'étayage**

Dans l'appendice d'étayage de `DESIGN.md`, ajouter les entrées traçant chaque affirmation des décisions D-33 à D-36 vers la spec `docs/superpowers/specs/2026-04-24-plugin-claude-code-design.md` et, pour D-35, vers `tools/linkedin-harness/README.md`. Suivre le format des entrées existantes de l'appendice.

- [ ] **Step 3: Vérifier le style et commit**

Run: `bash check.sh`
Expected: `check.sh` passe, y compris la contamination de style sur `DESIGN.md` si elle y est vérifiée (sinon vérifier à la main `grep -nE '\*\*|—|–' DESIGN.md` sur les lignes ajoutées).

```bash
git add DESIGN.md
git commit -m "docs: décisions D-33 à D-36 pour la migration plugin Claude Code"
```

---

## Task 10: Entrée marketplace et bump de version

**Files:**
- Modify: `/Users/david/code/claude-plugins/.claude-plugin/marketplace.json`

L'entrée marketplace pointe sur `ddaanet/candidature`. Sa version doit rester synchronisée avec `VERSION`. Cette tâche ajoute l'entrée et prépare la release v0.5.0. La release elle-même (`build.sh --bump minor`, push, tag, release GitHub) reste une action manuelle de fin, à lancer hors sandbox.

- [ ] **Step 1: Ajouter l'entrée candidature à la marketplace**

Dans `/Users/david/code/claude-plugins/.claude-plugin/marketplace.json`, ajouter au tableau `plugins` l'entrée :

```json
{
  "name": "candidature",
  "source": {
    "source": "github",
    "repo": "ddaanet/candidature"
  },
  "description": "Candidature assistée : préparation, lettre de motivation, CV adapté, relecture, suivi des retours. Stockage Notion. Contenu français.",
  "version": "0.5.0",
  "author": { "name": "David Allouche" },
  "repository": "https://github.com/ddaanet/candidature",
  "license": "MIT",
  "keywords": ["candidature", "lettre-de-motivation", "cv", "notion", "francais"]
}
```

- [ ] **Step 2: Vérifier le JSON**

Run: `python3 -m json.tool /Users/david/code/claude-plugins/.claude-plugin/marketplace.json > /dev/null && echo "JSON valide"`
Expected: `JSON valide`.

- [ ] **Step 3: Commit dans le dépôt claude-plugins**

```bash
git -C /Users/david/code/claude-plugins add .claude-plugin/marketplace.json
git -C /Users/david/code/claude-plugins commit -m "feat: entrée candidature dans la marketplace ddaanet"
```

- [ ] **Step 4: Release v0.5.0 (manuel, hors sandbox)**

Cette étape merge `dev` vers `main` puis release. Elle n'est pas exécutée par l'agent en sandbox, elle est listée pour mémoire.

```bash
# depuis main, après merge --no-ff de dev
./build/build.sh --bump minor
```

Le build incrémente `VERSION` à 0.5.0, régénère `skills/` et `plugin.json` à 0.5.0, commite, tague `v0.5.0`, pousse et crée la release GitHub avec `candidature.skill`. Vérifier ensuite que la version de l'entrée marketplace (0.5.0) correspond à `VERSION`.

---

## Auto-revue

Couverture de la spec, section par section :

1. Cible primaire et langue : aucun changement de contenu requis, le français et les phases restent identiques. Couvert implicitement (aucune tâche ne les altère).
2. Racine Notion dans CLAUDE.local.md : Task 4.
3. Topologie du dépôt, plugin racine : Task 2 (restructuration src/, skills/, .claude-plugin) et Task 10 (entrée marketplace pointant sur la racine).
4. Build par préprocesseur, artefacts versionnés : Task 1 (préprocesseur), Task 2 (build deux cibles), Task 7 (garde-fou de dérive).
5. Couche navigateur Playwright : Task 3 (bloc §4), Task 5 (site-ouverture-playwright.md), Task 6 (phases tool-agnostiques), réconciliée avec tools/linkedin-harness/.
6. Suppression de la vérification de version sur Claude Code : Task 3 (bloc §1 claude-ai), Task 2 (version_check.py copié seulement dans la cible Claude.ai).
7. Entrée marketplace : Task 10.
8. Stub dev : aucune tâche de création, `build/dev-stub.md` reste la cible Claude.ai, pas d'équivalent Claude Code (`/plugin install <chemin>` suffit). Documenté dans README, Task 8.

Cohérence des noms et types : le jeton de version est `{{VERSION}}` partout (src/SKILL.md, src/plugin.json.tmpl, préprocesseur). La fonction `process_skill_tree` est définie une fois dans build.sh et appelée pour les deux cibles. Les marqueurs sont exactement `<!-- target: claude-ai -->`, `<!-- target: claude-code -->`, `<!-- /target -->`, identiques dans le préprocesseur, src/SKILL.md et notion-setup.md. La clé de frontmatter Claude Code est `candidature_root:` (notion-setup.md et CLAUDE.local.md), distincte de l'entrée mémoire Claude.ai `candidature-root:`.

Écarts assumés, signalés et non silencieux :
- Sur Claude Code, la numérotation des sections de SKILL.md démarre à 2 (section 1 supprimée). Instructions lues par la machine, écart accepté (Task 3).
- `tools/linkedin-harness/node_modules/` est versionné dans l'état actuel du dépôt. Hors périmètre de ce plan, à traiter séparément si la taille du dépôt devient un problème.
- La release finale (Task 10, step 4) et le merge dev vers main sont manuels et hors sandbox, conformément à la mémoire feedback-harness-sandbox.
```
