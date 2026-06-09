# Plugin Claude Code

Spec validée le 2026-04-24.

## Contexte

Le skill `candidature` existe comme `.skill` zip installé dans Claude.ai.
La limite de tours de Claude.ai bloque les tâches longues, en premier lieu
le triage d'offres. Le passage à Claude Code supprime cette limite et
ouvre la voie à des scripts personnalisés pour le parcours d'offres.

L'architecture actuelle (spec 2026-03-30) anticipait déjà la double cible
en prévoyant le stockage de la racine Notion dans `memory_user_edits` sur
Claude.ai et `CLAUDE.local.md` sur Claude Code. Cette spec complète la
migration et livre le skill comme plugin Claude Code enregistré dans la
marketplace `ddaanet/claude-plugins`.

Le public cible du plugin est l'auteur, en local (poste ou droplet avec
VNC). Le plugin n'est pas prévu pour Claude Code sur le cloud claude.ai,
parce que le contrôle navigateur passera par des scripts Playwright qui
nécessitent un runtime local.

## Décisions

### 1. Cible primaire et langue

L'utilisateur principal est l'auteur. Le contenu reste en français. La
tonalité, les phases et la grille de lecture sont identiques à la version
Claude.ai. Aucune adaptation pour un autre public dans cette version.

### 2. Stockage de la racine Notion dans CLAUDE.local.md

Sur Claude Code, la racine Notion est stockée dans `CLAUDE.local.md`
(ignoré de git, chargé automatiquement en contexte, accessible au MCP
Notion sans appel d'outil). Au premier lancement dans un répertoire
donné, le dispatcher cherche dans Notion une page au titre convenu
(par exemple « Candidatures »), demande confirmation à l'utilisateur,
puis écrit la valeur dans `CLAUDE.local.md`.

Le pattern est cohérent avec la spec 2026-03-30 qui l'a prévu. Aucune
dépendance à la page Notion CLAUDE.md personnelle de l'auteur (celle-ci
reste une convention privée documentée dans `CLAUDE.local.md` à la
racine du dépôt candidature, pas une dépendance du plugin).

### 3. Topologie du dépôt, plugin au niveau racine

Le dépôt `ddaanet/candidature` devient la source du plugin Claude Code
et du `.skill` Claude.ai. Restructuration vers le layout plugin standard.

```
candidature/
  .claude-plugin/
    plugin.json
  skills/
    candidature/
      SKILL.md
      references/*.md
      scripts/version_check.py
  src/
    SKILL.md
    references/*.md
  build/
    build.sh
    preprocess.awk
  dist/
    candidature.skill            (non versionné)
  docs/
  DESIGN.md
  README.md
  VERSION
  TODO.md
```

`skills/candidature/` est la sortie de build de la cible Claude Code.
Le contenu est versionné, lu directement par Claude Code depuis le cache
du plugin. `src/` contient les sources canoniques avec blocs conditionnels.
`dist/candidature.skill` est l'artefact Claude.ai, construit au besoin,
non versionné, publié en release GitHub.

L'entrée marketplace dans `ddaanet/claude-plugins` pointe sur
`ddaanet/candidature` à la racine. Pas de champ `path`, pas de sous-module.

### 4. Build par préprocesseur, artefacts versionnés

Il n'existe pas de lifecycle hook à l'installation d'un plugin Claude
Code. Le cache plugin est lu tel quel. Un build au moment du checkout
est impossible. L'alternative retenue est de versionner la sortie.

`build/build.sh` prend `src/` en entrée et produit deux artefacts :

1. `skills/candidature/` (cible Claude Code), versionné, remplacé à
   chaque build. Consommé directement par Claude Code depuis le cache
   plugin.
2. `dist/candidature.skill` (cible Claude.ai), zip non versionné,
   publié en release GitHub à chaque bump de version.

Le préprocesseur traite trois types de marqueurs dans `src/` :

- `<!-- target: claude-ai -->...<!-- /target -->` : bloc conservé
  uniquement dans le build Claude.ai.
- `<!-- target: claude-code -->...<!-- /target -->` : bloc conservé
  uniquement dans le build Claude Code.
- `{{VERSION}}` : substitué par la version lue dans `VERSION`.

Un script `awk` de moins de 30 lignes suffit. Pas de dépendance à un
moteur de templates.

Une vérification locale (hook pre-commit, ou cible dans `check.sh`)
lance `build.sh` et échoue s'il y a un diff dans `skills/`. Cela empêche
la dérive entre `src/` et le build versionné. Une action GitHub
équivalente est optionnelle.

Effet de bord accepté : un commit touchant `src/SKILL.md` produit un
diff dans `skills/candidature/SKILL.md` aussi. Le coût en bruit de diff
est faible face à la garantie d'un build déterministe consultable sans
lancer le script.

### 5. Couche navigateur, scaffold Playwright incrémental

Le contrôle navigateur sur Claude Code passe par des scripts Playwright
lancés via `Bash`, pas par le MCP Playwright. Le MCP reste une option
de secours pour l'exploration initiale.

La livraison v1 inclut un scaffold minimal :

- `src/references/site-ouverture.md` reste la version Claude.ai (Chrome
  MCP). Un nouveau fichier `src/references/site-ouverture-playwright.md`
  décrit la version Claude Code. SKILL.md §4 contient un bloc conditionnel
  par cible qui pointe sur le bon fichier. Les deux fichiers ont des
  mécaniques différentes, une séparation par fichier est plus honnête
  qu'un gros bloc conditionnel dans un fichier unique.
- `site-ouverture-playwright.md` donne les instructions pour produire un
  script Playwright dans `./tmp/`, le lancer, lire stdout, stderr et
  captures d'écran, itérer. Rédigé en termes d'observation à faire, pas
  de mécanique pas à pas (principe général du skill).
- `src/references/site-cloture.md` : partagé entre les deux cibles
  (capture d'observation Notion, tool-agnostique).
- `src/references/sites/*.md` : partagés entre les deux cibles. Les
  fichiers décrivent les particularités de l'ATS (iframes, champs
  cachés, etc.), pas les appels d'outils. Tool-agnostique par
  construction. Relecture prévue pour nettoyer les quelques phrases
  qui nomment aujourd'hui Control Chrome.

Les scripts Playwright réutilisables arrivent incrémentalement, au fil
des candidatures. La consolidation (D-17) pousse les patterns observés
dans `src/references/sites/*.md` et, à terme, dans un
`src/scripts/playwright-base.py` partagé.

### 6. Suppression de la vérification de version sur Claude Code

Le build Claude Code supprime entièrement `SKILL.md §1` et
`scripts/version_check.py`. Les mises à jour plugin sont gérées par la
marketplace Claude Code. Le bloc `<!-- target: claude-ai -->` isole la
logique de version dans le seul build Claude.ai.

`memory_user_edits` disparaît complètement du build Claude Code. Sur
Claude.ai, il ne garde que `version-check:` (spec 2026-03-30, déjà en
place).

### 7. Entrée marketplace

Ajout d'une entrée dans `ddaanet/claude-plugins/.claude-plugin/marketplace.json` :

```
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

La version dans l'entrée marketplace doit rester synchronisée avec
`VERSION` du dépôt candidature. Chaque release (via `build.sh --bump`)
implique une PR sur `ddaanet/claude-plugins` pour mettre à jour ce
champ.

`plugin.json` à la racine du dépôt `candidature` déclare le nom, la
version (lue depuis `VERSION`), la description et la licence.

### 8. Stub dev

Le stub `candidature-dev.skill` (présent sur Claude.ai via le build) n'a
pas d'équivalent direct sur Claude Code. Pour le développement local,
Claude Code accepte `/plugin install <chemin-local>` sur une arborescence
plugin valide. Il suffit de pointer sur le dépôt candidature après un
`build.sh`. Pas de stub séparé à maintenir.

## Fichiers modifiés ou créés

| Fichier | Action |
|---|---|
| `SKILL.md`, `references/`, `scripts/` | Déplacés sous `src/` (canoniques) |
| `src/SKILL.md` | Ajout des blocs `<!-- target: ... -->` autour de §1, §3 (lookup racine Notion), §4 (détection navigateur) |
| `src/references/notion-setup.md` | Ajout de blocs conditionnels sur la section « Page racine » |
| `src/references/site-ouverture-playwright.md` | Créé (scaffold Claude Code) |
| `src/references/site-ouverture.md` | Conservé pour la cible Claude.ai, chargé seulement par le bloc `<!-- target: claude-ai -->` |
| `src/references/sites/*.md` | Rendus tool-agnostiques (relecture des quelques phrases qui nomment Control Chrome) |
| `skills/candidature/` | Créé, contenu généré par `build.sh`, versionné |
| `.claude-plugin/plugin.json` | Créé |
| `build/build.sh` | Réécrit pour produire les deux cibles depuis `src/` |
| `build/preprocess.awk` | Créé |
| `check.sh` | Ajout d'une étape qui vérifie que `skills/` est à jour |
| `ddaanet/claude-plugins/.claude-plugin/marketplace.json` | Entrée candidature ajoutée (dans l'autre dépôt) |
| `DESIGN.md` | Ajout des décisions D-33 à D-36 correspondantes |
| `README.md` | Section installation Claude Code ajoutée |

## Hors périmètre (v1)

Scripts Playwright réutilisables. Consolidation initiale des patterns
d'ATS observés. Arrive au fur et à mesure des candidatures.

Outils de triage d'offres en masse. Motivation importante de la
migration, mais orthogonal au skill lui-même. Probablement un ou
plusieurs skills complémentaires dans une itération ultérieure.

Adaptation multi-utilisateur. Le skill reste centré sur l'auteur.
L'élargissement éventuel à d'autres utilisateurs impliquerait des
décisions supplémentaires sur la configuration et les conventions
Notion.
