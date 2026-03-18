# Candidature — Document de conception

Historique des besoins, décisions de conception, alternatives écartées et
sources de référence pour le skill `candidature`. Sert de contexte aux
agents qui maintiendront ou feront évoluer le skill.

---

## Origine

Le skill est né d'une adaptation du protocole `proof` d'agent-core (revue
structurée item-par-item d'artefacts de planification) pour la relecture
de lettres de motivation dans Claude.ai. Au fil de la conversation, le
scope s'est élargi d'un outil de relecture à un workflow complet de
candidature en 4 phases.

**Repo source :** `ddaanet/agent-core` (privé) — skill `proof` (SKILL.md
+ references/item-review.md).

**Contexte utilisateur :** David Allouche, ingénieur backend senior Python,
en recherche d'emploi active depuis plusieurs mois. Le skill a été conçu
à partir de son expérience concrète de candidature assistée par IA, puis
généralisé pour tout métier et tout niveau.

---

## Besoins fonctionnels

### FR-1 : Initialisation du profil candidat

Le skill collecte le profil du candidat une fois et l'enrichit au fil du
temps. Le CV est le seul élément indispensable.

**Mécanisme :** Conversation ouverte après lecture du CV. Pas de checklist —
les sources pertinentes dépendent du métier (un dev a un GitHub, un ouvrier
non). Le skill demande ce que le candidat a, pas ce qu'il devrait avoir.

**Décision :** Le corpus de style est optionnel. Le skill fonctionne sans,
mais s'améliore avec. Les lettres approuvées après relecture sont proposées
comme ajout au corpus (boucle d'apprentissage).

### FR-2 : Recherche contextuelle avec archive

Avant de demander des documents au candidat, le skill recherche ce qui est
attendu pour ce type de poste (documents, ton, conventions sectorielles).

**Mécanisme :** L'agent vérifie en mémoire projet si une recherche
précédente couvre ce type de poste, puis lance `web_search` si rien ne
correspond. Les résultats sont stockés en mémoire projet pour
réutilisation (une entrée mémoire par type de poste).

**Critère de réutilisation :** Match exact sur type de poste + secteur +
taille d'entreprise + pays. Match approximatif = le candidat décide. Jamais
de réutilisation silencieuse.

### FR-3 : Génération de candidature

Analyse du poste, alignement sur les axes avec le candidat, génération des
artefacts (lettre, CV adapté, réponses formulaire).

**Mécanisme :** L'alignement distingue explicitement P-J fit (compétences)
et P-O fit (motivation, valeurs) — deux dimensions issues de la recherche
en psychologie organisationnelle. La lettre est le véhicule principal du
P-O fit ; une lettre qui ne fait que résumer le CV rate sa cible.

### FR-4 : Adaptation du CV

Modification du CV DOCX du candidat en préservant la mise en forme.

**Mécanisme :** python-docx, travail au niveau du run (pas du paragraphe).
Ajustements ciblés, pas de réécriture. Le candidat décide si l'adaptation
est faite.

**Contrainte :** Les zones de texte flottantes, les mises en page
multi-colonnes et les images positionnées sont des limites connues de
python-docx. Si le CV est trop complexe, proposer des modifications
manuelles.

### FR-5 : Relecture structurée

Revue item-par-item de chaque artefact généré avant envoi.

**Mécanisme :** Adapté du protocole `proof` d'agent-core (inspection Fagan).
Segmentation, analyse par item, verdict forcé, accumulation, application
batch. Interface conversationnelle — le candidat parle naturellement,
l'agent interprète.

**Décision clé :** Pas de vocabulaire imposé (approve/revise/skip/kill).
Le candidat dit "ok", "change ça", "enlève", "passe" — l'agent infère le
verdict. Pas de traçage formel des verdicts.

**Grille de lecture :** 7 critères universels, fondés sur la recherche.
Deux critères ajoutés après la recherche de fond : crédibilité des signaux
(Spence) et accroche comme point critique (biais d'ancrage).

**Orientation condensée.** Avant le premier item, l'agent résume en une
phrase le contexte : quel texte, pour quel poste, combien de paragraphes.
Pas de ligne d'état formatée, pas de liste de critères, pas de vocabulaire
de protocole. Exemple : "Je relis votre lettre pour Doctolib — 4
paragraphes. On y va ?" Voir D-11.

### FR-6 : Suivi des candidatures et comptes rendus d'entretien

Enregistrement des retours, comptes rendus d'entretien, analyse de
patterns.

**Mécanisme :** Chaque candidature est enregistrée comme une entrée de
mémoire projet (`memory_user_edits`) contenant : date, entreprise, poste,
canal, axes, statut. Le statut est mis à jour in-place (`replace`) quand
le candidat signale un retour.

Les comptes rendus d'entretien sont conversationnels. 3 niveaux (informel,
guidé, structuré) choisis au premier CR via widget. Ajustement dynamique
selon le comportement du candidat. Les apprentissages sont extraits et
stockés en mémoire projet.

L'analyse de patterns se fait en lisant les mémoires existantes, pas en
parsant des fichiers. Proposée après 5+ candidatures, jamais automatique.

**Fondement :** Orientation apprentissage > orientation performance
(Kanfer et al., 2001 ; Van Hooft & Van Hoye, 2022). Le suivi extrait des
apprentissages transférables, pas des statistiques.

### FR-7 : Enrichissement continu

Le corpus de style, l'archive de recherche et les patterns de candidature
s'enrichissent au fil des candidatures. Tout est stocké en mémoire projet.

---

## Besoins non-fonctionnels

### NFR-1 : Universalité

Le skill fonctionne pour tout métier et tout niveau. Pas de sources en dur,
pas de checklist imposée, pas de vocabulaire technique.

**Décision écartée :** La première version contenait des critères
spécifiques au profil de David (3 questions implicites du recruteur pour
un fondateur → IC). Retirés du skill, conservés dans les mémoires du
projet personnel.

### NFR-2 : Ancrage des décisions

Chaque point de décision est ancré par un résultat visible ou un appel
d'outil. Trois niveaux : `[choix]` (widget), `[outil]` (tool call),
`[état]` (ligne visible).

**Fondement :** Protocole `proof` d'agent-core — une porte sans ancrage est
une porte que l'agent saute (anti-pattern prose-only gate).

### NFR-3 : Interface simple

Pas de vocabulaire de protocole exposé à l'utilisateur. Le candidat parle
naturellement. L'agent interprète. Pas de jargon technique dans les
messages de l'agent.

**Décision écartée :** La version initiale (héritée de `proof`) imposait
des raccourcis (a/r/k/s). Retiré — le public cible n'est pas des
développeurs familiers avec des CLI.

**Extension (v2) :** L'étape d'orientation de la relecture exposait du
vocabulaire de protocole. Condensée en un résumé d'une phrase. Voir D-11.

### NFR-4 : Français sans anglicismes superflus

Utiliser les équivalents français courants. "Méthode" pas "workflow",
"artefact" pas "artifact" (exception : termes sans équivalent courant
comme "commit", "widget").

### NFR-5 : Portabilité multi-plateforme

Le skill est un dossier de fichiers markdown. Aucune dépendance à une
plateforme. Fonctionne sur Claude.ai (projet), ChatGPT (GPT), Gemini
(Gem), Mistral (Agent), ou toute IA capable de lire du markdown.

### NFR-6 : Installation minimale

Claude.ai : 4 étapes via "Ajouter depuis GitHub". Autres : coller une
URL dans un chat. Pas de terminal, pas de build, pas de config.

### NFR-7 : Stockage en mémoire projet

Le public cible ne sait pas manipuler des fichiers dans un projet IA.
Toutes les données persistantes (suivi des candidatures, préférences,
archive de recherche, patterns) sont stockées via la mémoire du projet
(`memory_user_edits`), pas dans des fichiers markdown.

**Avantages :** Accessible dans toutes les conversations du projet sans
manipulation. Pas de fichiers à gérer.

**Limites :** La mémoire a un budget limité. Les comptes rendus
d'entretien détaillés sont stockés sous forme de synthèse, pas de
verbatim. Voir D-6 pour les détails.

### NFR-8 : Étayage réflexif

La passe d'étayage (§2.6) s'applique à tout artefact produit par
l'agent, pas seulement aux artefacts destinés au candidat. Un agent
qui produit un questionnaire de feedback, un post LinkedIn, un message
de communication, ou toute autre sortie contenant des affirmations doit
passer par la même vérification : chaque affirmation est-elle sourcée
ou qualifiée ?

**Fondement :** Un skill fondé sur la crédibilité des signaux (Spence)
qui produit lui-même des signaux gratuits dans ses propres communications
détruit sa proposition de valeur. L'étayage n'est pas un protocole de
relecture — c'est une propriété de tout texte produit par le système.

**Incident fondateur :** Session 2026-03-17. L'agent a produit un
Google Form (questions présupposant un usage qui n'avait pas encore eu
lieu, question orientée négative, pas de NPS) et un post LinkedIn
(4 affirmations non étayées sur 8, dont un signal gratuit au sens de
Spence) sans appliquer sa propre procédure d'étayage. Corrigé après
revue utilisateur.

---

## Décisions de conception

### D-1 : Nom du skill

**Choisi :** `candidature`

**Processus :** Brainstorm Opus planifié mais exécuté en direct (l'API
Opus n'était pas accessible sans clé depuis l'environnement Claude.ai).
Trois finalistes proposés : `refine`, `relecture`, `redline`. L'utilisateur
a choisi `relecture` pour la transparence. Renommé `candidature` quand le
scope s'est élargi au-delà de la relecture.

**Écarté :** `relecture` (devenu une phase interne), `refine` (anglais),
`redline` (connoté "couper"), `postuler` (verbe, moins naturel comme nom
de skill), `apply` (anglais et ambigu).

### D-2 : Scope — relecture seule vs workflow complet

**Choisi :** Workflow complet en 4 phases.

**Raison :** La relecture seule ne résout pas le problème de fond — une
lettre générique bien relue reste une lettre générique. La valeur est dans
la chaîne complète : profil → recherche → axes → génération → relecture →
suivi.

**Écarté :** Skill de relecture standalone. L'ancien `relecture` a été
absorbé comme Phase 3.

### D-3 : Interface de relecture — vocabulaire imposé vs conversationnel

**Choisi :** Interface conversationnelle. Le candidat parle naturellement.

**Raison :** Le public cible est "tout le monde", pas des développeurs.
Un protocole avec des raccourcis (a/r/k/s) est une barrière à l'adoption.

**Écarté :** Vocabulaire imposé hérité de `proof` (approve/revise/kill/skip
avec raccourcis). Pas de traçage formel des verdicts.

**Compromis accepté :** L'interprétation du langage naturel est moins
fiable que des raccourcis explicites. Risque de malentendu sur les
verdicts. Atténué par la reformulation systématique.

### D-4 : Grille de lecture — spécifique au profil vs universelle

**Choisi :** Grille universelle dans le skill. Critères spécifiques dans
les mémoires du projet personnel.

**Raison :** La première version contenait des critères David-spécifiques
(3 questions implicites du recruteur, anti-patterns issus de l'expérience).
Duplication avec les instructions du projet et les mémoires. Le skill
doit fonctionner pour tout profil.

### D-5 : Format du CV — Markdown vs DOCX vs natif

**Choisi :** DOCX comme format de référence.

**Raison :** python-docx permet de modifier le texte en préservant les
styles, polices, couleurs du candidat. Markdown perd toute information
visuelle. Les formats natifs (Pages, Canva) ne sont pas manipulables
programmatiquement.

**Écarté :** Markdown (perte de mise en forme), édition directe via
AppleScript dans Pages (fragile et limité), PDF (lecture seule).

**Compromis accepté :** python-docx ne gère pas les zones de texte
flottantes ni les mises en page très complexes. Le candidat qui a un CV
avec un design élaboré recevra des suggestions de modifications manuelles.

### D-6 : Données persistantes — mémoire projet vs fichiers

**Choisi :** Mémoire projet (`memory_user_edits`) pour toutes les données
persistantes : archive de recherche, suivi des candidatures, comptes
rendus, patterns.

**Raison :** La v1 utilisait des fichiers markdown (archive dans
`recherche/index.md` + fichiers par type de poste, suivi dans
`candidatures/suivi.md`, CR dans `candidatures/entretiens/`, patterns
dans `candidatures/patterns.md`). En pratique, cela implique que le
candidat sache manipuler des fichiers dans un projet IA — télécharger,
re-uploader, maintenir la cohérence. Le public cible ne sait pas faire ça.

La mémoire projet est accessible dans toutes les conversations sans
manipulation. Pour l'archive de recherche : une entrée par type de poste.
Pour le suivi : une entrée par candidature, mise à jour in-place.

**Écarté :** Fichiers markdown (complexe pour le grand public), base de
données externe (surdimensionné).

**Compromis accepté :** La mémoire a un budget limité. Le suivi de 50+
candidatures peut saturer. Solution à terme : condensation périodique.
Les CR d'entretien détaillés sont stockés sous forme de synthèse.

### D-7 : Suivi — automatique vs proposé

**Choisi :** L'analyse de patterns est proposée, jamais automatique.

**Raison :** L'orientation apprentissage fonctionne quand le candidat
décide quand prendre du recul. Un tableau de bord automatique avec des
stats risque de décourager (la recherche d'emploi est émotionnellement
difficile — Wanberg et al., 2012).

### D-8 : Compte rendu d'entretien — niveau fixe vs adaptatif

**Choisi :** 3 niveaux avec adaptation dynamique.

**Raison :** Certains candidats veulent juste dire "ça s'est bien passé",
d'autres veulent une analyse question par question. Imposer un seul
niveau frustre l'un ou l'autre. L'adaptation observe le comportement
réel du candidat plutôt que de demander à chaque fois.

### D-9 : Distribution — plateforme spécifique vs repo GitHub

**Choisi :** Repo GitHub public (`ddaanet/candidature`).

**Raison :** Pas de marketplace skills sur Claude.ai. Pas d'import GitHub
sur ChatGPT/Gemini/Mistral. Le plus petit dénominateur commun est un
dossier de fichiers markdown. GitHub permet le download ZIP pour les
non-techniques et "Ajouter depuis GitHub" pour Claude.ai.

**Écarté :** Intégration dans claudeutils/Edify (trop orienté développeurs),
GPT Store (spécifique ChatGPT), marketplace Claude Code (le skill est
conçu pour Claude.ai, pas Claude Code).

### D-10 : Séparation du document fondamental

**Choisi :** `references/recruitment-science.md` comme document stable,
séparé des recherches par type de poste.

**Raison :** Les cadres théoriques (Spence, P-J/P-O fit, Kahneman, biais
cognitifs, autorégulation) ne changent pas selon qu'on postule comme dev
ou comme commercial. Les séparer des recherches contextuelles évite la
duplication et permet la mise à jour indépendante.

### D-11 : Orientation relecture — condensée

**Choisi :** Orientation réduite à un résumé d'une phrase avant le
premier item.

**Raison :** En test utilisateur, l'orientation complète produisait un
message incompréhensible pour un non-technicien : ligne d'état avec
crochets, liste de critères, vocabulaire de protocole (« actions:
feedback, proceed, skip-to-end »). Le candidat n'a pas besoin de
connaître la mécanique — mais il a besoin de savoir ce qu'on relit.

L'orientation reste, condensée en un résumé : quel texte, pour qui,
combien d'éléments. L'agent attend la confirmation puis passe au
premier item.

**Écarté :** Suppression totale (le candidat ne sait plus ce qu'on
relit). Orientation complète v1 (jargon, tour de conversation inutile).

---

## Alternatives écartées globales

### Skill Claude Code (format agent-core)

Le skill `proof` original utilise le Task tool, les planstates lifecycle,
les corrector sub-agents, les recall-artifacts. Tout ça est spécifique à
Claude Code et n'existe pas dans Claude.ai. Le skill `candidature` est
autonome — pas de dépendances infrastructure.

### Génération de PDF avec mise en forme

L'agent n'est pas bon en création graphique (reconnu par l'utilisateur
et l'agent). La stratégie est de modifier le DOCX du candidat plutôt que
de générer un nouveau document. La mise en forme est la responsabilité du
candidat.

### Traçage formel des candidatures (CRM-like)

Écarté au profit d'un suivi léger en mémoire projet. Un système CRM
complexe est une surcharge pour la plupart des candidats. Une ligne de
mémoire par candidature suffit.

---

## Sources de référence

### Théorie du signal
- Spence, M. (1973). Job market signaling. *QJE*, 87(3), 355-374.
- Connelly, B. L. et al. (2011). Signaling theory: A review. *Journal of
  Management*, 37(1), 39-67.

### Adéquation personne-poste / personne-organisation
- Kristof-Brown, A. L. et al. (2005). Consequences of individuals' fit.
  *Personnel Psychology*, 58(2), 281-342.
- Rivera, L. A. (2012). Hiring as cultural matching. *ASR*, 77(6).
- Kristof-Brown, A. L., Schneider, B., & Su, R. (2023). P-O fit theory.
  *Personnel Psychology*, 76(4).

### Biais cognitifs et eye-tracking
- Tversky, A. & Kahneman, D. (1974). Judgment under uncertainty.
  *Science*, 185, 1124-1131.
- Ladders, Inc. (2018). Eye-Tracking Study (7,4 secondes).
- Bertrand, M. & Mullainathan, S. (2004). Are Emily and Greg more
  employable? *AER*, 94(4).
- Derous, E. & Ryan, A. M. (2019). Modelling ethnic bias in resume
  screening. *HRMJ*, 29(2).

### Autorégulation de la recherche d'emploi
- Kanfer, R., Wanberg, C. R., & Kantrowitz, T. M. (2001). Job search and
  employment. *JAP*, 86(5), 837-855.
- Van Hooft, E. A. J. & Van Hoye, G. (2022). Job Search Quality Scale.
  *JVB*, 132.
- Van Hooft, E. A. J. et al. (2021). Job search and employment success.
  *JAP*, 106(5).
- Wanberg, C. R. et al. (2012). Explicating layers of job search context.

### Inspection Fagan (protocole proof)
- Fagan, M. E. (1976). Design and code inspections to reduce errors in
  program development. *IBM Systems Journal*, 15(3), 182-211.
- Cowan, N. (2001). The magical number 4 in short-term memory. *BBS*,
  24(1), 87-114. (Segmentation des items, charge cognitive.)

---

## Structure du livrable

```
candidature/
  README.md                       — Installation et proposition de valeur
  SKILL.md                        — Méthode complète (4 phases, portes ancrées)
  DESIGN.md                       — Ce document
  references/
    recruitment-science.md        — 5 cadres théoriques (stable)
    cover-letter.md               — Principes de rédaction
    cv-handling.md                — Protocole python-docx
    review-items.md               — Découpage pour la relecture
    feedback-tracking.md          — Suivi, CR d'entretien, patterns
```

Pas de dossier `candidatures/` ni `recherche/` pour les données. Tout le
suivi et l'archive sont en mémoire projet.

---

## Portes SKILL.md à mettre à jour

Les portes suivantes dans SKILL.md référencent des fichiers ou du jargon
de protocole et doivent être mises à jour :

| Section | Porte actuelle | Changement |
|---------|---------------|------------|
| §2.2 | `[outil: view index → web_search]` | Remplacer `view index` par consultation mémoire projet |
| §2.2 | `create_file` pour artefact de recherche | Remplacer par `memory_user_edits` |
| §3.1 | `[état]` ligne d'état jargonneuse | Condenser en résumé d'une phrase |
| §4.1 | `[outil: create_file ou str_replace]` | Remplacer par `[outil: memory_user_edits]` |
| §4.2 | Stockage CR dans `candidatures/entretiens/` | CR conversationnel, synthèse en mémoire |
| §4.3 | `candidatures/patterns.md` | Observations en mémoire projet |
| §Archive | Structure fichiers `recherche/` | Supprimer la section entière |

### D-18 : Étayage après le draft, pas avant

**Choisi :** Générer un draft d'abord (`create_file`), puis auditer les
affirmations présentes dans le texte réel.

**Raison :** L'approche précédente (étayage avant génération) auditait
des affirmations que l'agent *prévoyait* d'écrire — abstrait, et rien ne
garantissait que le texte final correspondrait. Avec le draft d'abord,
l'audit porte sur du concret : le texte existe, on vérifie ce qu'il dit
effectivement.

Avantages : anti-hallucination (l'agent ne peut pas simuler un étayage
sur des intentions), ancrage plus fort (le `create_file` matérialise
l'artefact avant l'audit).

**Correction :** L'agent évalue la gravité et décide : `str_replace`
ciblé pour les corrections factuelles isolées, régénération complète si
le problème est structurel (avec nouvelle passe d'étayage). Pas de règle
rigide.

**Écarté :** Étayage avant génération (v1, abstrait). Règle de
correction fixée (trop rigide pour la diversité des cas).

---

## Axes d'évolution identifiés (non implémentés)

- **Test sur d'autres profils :** Le skill a été conçu à partir d'un seul
  cas d'usage (dev backend senior). Il faudrait le tester avec des profils
  radicalement différents (commercial, ouvrier, graphiste) pour valider
  l'universalité.
- **Intégration plateforme :** ChatGPT/Gemini/Mistral n'ont pas d'import
  GitHub. Si une de ces plateformes ajoute cette fonctionnalité,
  l'installation devient triviale partout.
- **Localisation :** Le skill est en français. Une version anglaise
  élargirait l'audience. Les principes sont universels, seuls l'interface
  et les conventions sectorielles changent.
- **Environnement hybride Desktop + Claude.ai :** Le skill a été conçu
  pour Claude.ai (projet), mais le workflow complet de candidature
  (navigation sites d'emploi, remplissage de formulaires, tri des
  recommandations) nécessite un contrôle du navigateur disponible
  uniquement sur Claude Desktop. Documenter le tandem.
- **Saturation mémoire :** Avec 50+ candidatures, la mémoire projet peut
  saturer. Prévoir un mécanisme de condensation.

---

## Appendice : Validation des sources

Audit de traçabilité des affirmations vers leurs sources. Réalisé en fin de
session de conception. Les corrections ont été appliquées aux fichiers
concernés.

### Légende

- **Étayé** — source primaire identifiée et vérifiée dans les
  résultats de recherche de cette session
- **Étayé (réserves)** — source identifiée mais avec des limites
  méthodologiques documentées
- **Faiblement étayé** — inférence raisonnable à partir d'un cadre
  théorique, pas de citation directe. Qualifié dans le fichier source
  avec une note explicite.
- **Non étayé** — affirmation non soutenue par la recherche. Corrigée ou
  retirée.

### Affirmations académiques

| # | Affirmation | Fichier | Source | Statut |
|---|-------|---------|--------|--------|
| 1 | Théorie du signal — signaux coûteux vs gratuits | recruitment-science.md §1 | Spence 1973 | Étayé |
| 2 | P-J fit / P-O fit distinction | recruitment-science.md §2 | Edwards 1991, Kristof-Brown 2005 | Étayé |
| 3 | Biais de similarité culturelle en recrutement | recruitment-science.md §4 | Rivera 2012 | Étayé |
| 4 | Tri initial CV ~7,4 secondes | recruitment-science.md §3 | Ladders 2018 | Étayé (réserves) |
| 5 | Biais d'ancrage sur première information | recruitment-science.md §4 | Tversky & Kahneman 1974 | Étayé |
| 6 | Discrimination sur les noms | recruitment-science.md §4 | Bertrand & Mullainathan 2004 | Étayé |
| 7 | Recherche d'emploi = processus d'autorégulation | recruitment-science.md §5 | Kanfer et al. 2001 | Étayé |
| 8 | JSQS : 4 dimensions de qualité de recherche | recruitment-science.md §5 | Van Hooft & Van Hoye 2022 | Étayé |
| 9 | Orientation apprentissage > performance | recruitment-science.md §5 | Kanfer 2001, Van Hooft 2021 | Étayé |
| 10 | Inspection Fagan : détection par item | SKILL.md §Phase 3 | Fagan 1976 | Étayé |
| 11 | ~4 items en mémoire de travail | proof/SKILL.md (source) | Cowan 2001 | Étayé |

### Affirmations dérivées (inférences)

| # | Affirmation | Fichier | Dérivation | Statut | Action |
|---|-------|---------|------------|--------|--------|
| 12 | La lettre adresse naturellement le P-O fit | recruitment-science.md §2, cover-letter.md | Inférence : CV→P-J, lettre→P-O | Faiblement étayé | Qualifié avec note |
| 13 | L'accroche est le point le plus critique | recruitment-science.md §4 | Extrapolation biais d'ancrage | Faiblement étayé | Qualifié avec note |
| 14 | Les adjectifs auto-attribués sont des signaux gratuits | recruitment-science.md §1, cover-letter.md | Application de Spence | Faiblement étayé | Qualifié avec note |
| 15 | ~7 secondes pour une lettre | SKILL.md §3.4 (v1) | Extension non justifiée de Ladders | **Non étayé** | **Corrigé** — retiré |

### Affirmations factuelles (plateformes)

| # | Affirmation | Fichier | Source | Statut |
|---|-------|---------|--------|--------|
| 16 | Claude.ai "Ajouter depuis GitHub" | README.md | Claude Help Center | Étayé |
| 17 | ChatGPT : pas d'import GitHub | README.md | OpenAI Help Center | Étayé |
| 18 | Gemini Gems : max 10 fichiers | README.md | Google Workspace Blog | Étayé |
| 19 | Mistral Agents + Libraries | README.md | Mistral Help Center | Étayé |

### Bilan

- **15 affirmations étayées** (dont 1 avec réserves méthodologiques)
- **3 affirmations faiblement étayées** — qualifiées avec notes,
  inférences raisonnables documentées comme telles
- **1 affirmation non étayée** — corrigée (retirée du SKILL.md)
- **0 affirmation non auditée**
