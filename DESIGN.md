# Candidature, document de conception

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

Le repo source est `ddaanet/agent-core` (privé), skill `proof` (SKILL.md
+ references/item-review.md).

Le contexte utilisateur est David Allouche, ingénieur backend senior Python,
en recherche d'emploi active depuis plusieurs mois. Le skill a été conçu
à partir de son expérience concrète de candidature assistée par IA, puis
généralisé pour tout métier et tout niveau.

---

## Besoins fonctionnels

### FR-1 : Initialisation du profil candidat

Le skill collecte le profil du candidat une fois et l'enrichit au fil du
temps. Le CV est le seul élément indispensable.

Le mécanisme est une conversation ouverte après lecture du CV. Pas de
checklist. Les sources pertinentes dépendent du métier (un dev a un GitHub,
un ouvrier non). Le skill demande ce que le candidat a, pas ce qu'il
devrait avoir.

Le corpus de style est optionnel. Le skill fonctionne sans, mais s'améliore
avec. Les lettres approuvées après relecture sont proposées comme ajout au
corpus (boucle d'apprentissage).

### FR-2 : Recherche contextuelle avec archive

Avant de demander des documents au candidat, le skill recherche ce qui est
attendu pour ce type de poste (documents, ton, conventions sectorielles).

L'agent consulte d'abord les fichiers sous recherches/ pour voir si une
recherche précédente couvre ce type de poste, puis lance `web_search` si rien
ne correspond. Les résultats sont stockés dans un fichier sous recherches/ pour
réutilisation, un fichier par recherche (D-42).

Le critère de réutilisation porte sur les métadonnées du fichier, type de
poste, secteur, taille d'entreprise et pays, et sur son ancienneté. Un match
approximatif est signalé au candidat qui décide. Jamais de réutilisation
silencieuse.

### FR-3 : Génération de candidature

Analyse du poste, alignement sur les axes avec le candidat, génération des
artefacts (lettre, CV adapté, réponses formulaire).

L'alignement distingue explicitement P-J fit (compétences) et P-O fit
(motivation, valeurs), deux dimensions issues de la recherche en psychologie
organisationnelle. La lettre est le véhicule principal du P-O fit. Une
lettre qui ne fait que résumer le CV rate sa cible.

### FR-4 : Adaptation du CV

Modification du CV DOCX du candidat en préservant la mise en forme.

Le mécanisme utilise python-docx, avec un travail au niveau du run (pas du
paragraphe). Ajustements ciblés, pas de réécriture. Le candidat décide si
l'adaptation est faite.

Les zones de texte flottantes, les mises en page multi-colonnes et les images
positionnées sont des limites connues de python-docx. Si le CV est trop
complexe, proposer des modifications manuelles.

### FR-5 : Relecture structurée

Revue item-par-item de chaque artefact généré avant envoi.

Le mécanisme est adapté du protocole `proof` d'agent-core (inspection Fagan).
Segmentation, analyse par item, verdict forcé, accumulation, application
batch. Interface conversationnelle : le candidat parle naturellement,
l'agent interprète.

Pas de vocabulaire imposé (approve/revise/skip/kill). Le candidat dit "ok",
"change ça", "enlève", "passe". L'agent infère le verdict. Pas de traçage
formel des verdicts.

La grille de lecture contient 7 critères universels, fondés sur la recherche.
Deux critères ajoutés après la recherche de fond : crédibilité des signaux
(Spence) et accroche comme point critique (biais d'ancrage).

L'orientation est condensée. Avant le premier item, l'agent résume en une
phrase le contexte : quel texte, pour quel poste, combien de paragraphes.
Pas de ligne d'état formatée, pas de liste de critères, pas de vocabulaire
de protocole. Exemple : "Je relis votre lettre pour Doctolib, 4
paragraphes. On y va ?" Voir D-11.

### FR-6 : Suivi des candidatures et comptes rendus d'entretien

Enregistrement des retours, comptes rendus d'entretien, analyse de
patterns.

Chaque candidature est un dossier sous candidatures/, son README.md porte
l'offre et un frontmatter de champs factuels, et son analyse en prose dans le
corps (D-30, D-42). Le statut est mis à jour dans le frontmatter du README.md
quand le candidat signale un retour.

Les comptes rendus d'entretien sont conversationnels. 3 niveaux (informel,
guidé, structuré) choisis au premier CR via widget. Ajustement dynamique
selon le comportement du candidat. Les apprentissages sont extraits et
stockés en fichiers, le compte rendu dans un entretien-N.md du dossier de
candidature, les patterns dans tendances.md.

L'analyse de patterns se fait en lisant les fichiers de candidature existants.
Proposée après 5+ candidatures, jamais automatique.

L'ensemble repose sur l'orientation apprentissage plutôt que performance
(Kanfer et al., 2001, Van Hooft & Van Hoye, 2022). Le suivi extrait des
apprentissages transférables, pas des statistiques.

### FR-7 : Enrichissement continu

Le corpus de style, l'archive de recherche et les patterns de candidature
s'enrichissent au fil des candidatures. Tout est stocké en fichiers dans le
repo de données (D-42).

---

## Besoins non-fonctionnels

### NFR-1 : Universalité

Le skill fonctionne pour tout métier et tout niveau. Pas de sources en dur,
pas de checklist imposée, pas de vocabulaire technique.

La première version contenait des critères spécifiques au profil de David
(3 questions implicites du recruteur pour un fondateur qui revient en IC).
Retirés du skill, conservés dans les mémoires du projet personnel.

### NFR-2 : Ancrage des décisions

Chaque point de décision est ancré par un résultat visible ou un appel
d'outil. Trois niveaux : `[choix]` (widget), `[outil]` (tool call),
`[état]` (ligne visible).

Le fondement vient du protocole `proof` d'agent-core : une porte sans
ancrage est une porte que l'agent saute (anti-pattern prose-only gate).

### NFR-3 : Interface simple

Pas de vocabulaire de protocole exposé à l'utilisateur. Le candidat parle
naturellement. L'agent interprète. Pas de jargon technique dans les
messages de l'agent.

La version initiale (héritée de `proof`) imposait des raccourcis
(a/r/k/s). Retiré. Le public cible n'est pas des développeurs familiers
avec des CLI.

L'étape d'orientation de la relecture exposait du vocabulaire de protocole.
Condensée en un résumé d'une phrase. Voir D-11.

### NFR-4 : Français sans anglicismes superflus

Utiliser les équivalents français courants. "Méthode" pas "workflow",
"artefact" pas "artifact" (exception : termes sans équivalent courant
comme "commit", "widget").

### NFR-5 : Portabilité multi-plateforme

Caduc depuis le pivot du 2026-06-19 (D-41). Le skill ciblait à l'origine toute
IA capable de lire du markdown, Claude.ai, ChatGPT, Gemini, Mistral. La cible
claude.ai et le plus petit dénominateur commun multi-plateforme sont abandonnés.
Le skill est désormais un plugin Claude Code, qui suppose un système de fichiers
local pour son stockage (D-42). Le contenu reste du markdown, mais le runtime
n'est plus portable hors de Claude Code.

### NFR-6 : Installation minimale

Caduc dans sa forme claude.ai depuis le pivot du 2026-06-19 (D-41). L'ancienne
procédure, import GitHub, upload du CV et instruction projet nommant
`project_knowledge_search` pour forcer le déclenchement (D-19), valait pour le
project knowledge de Claude.ai et n'a plus cours.

Le skill s'installe désormais comme un plugin Claude Code depuis la marketplace.
Le déclenchement passe par le manifeste du plugin, sans instruction projet. Au
premier lancement dans un repo de données non initialisé, le dispatcher propose
le script d'init qui scaffolde la structure (D-43). Pas de build manuel, pas de
config de chemin.

### NFR-7 : Stockage persistant géré par le skill

Renversé par le pivot du 2026-06-19 (D-42). Le besoin d'origine évitait à un
public non technique de manipuler des fichiers dans un projet IA, ce qui avait
conduit à Notion (D-25) puis, avant lui, à la mémoire projet (D-6). Le backend
est désormais une arborescence de fichiers markdown dans le repo de données.

La contrainte sous-jacente tient toujours, le candidat n'écrit pas les fichiers
à la main. Le skill les crée et les met à jour, le candidat travaille en
conversation. Ce qui change, c'est le backend, des fichiers locaux gérés par le
skill au lieu de pages Notion. Le système de fichiers de Claude Code rend cette
gestion directe (D-41). Les comptes rendus d'entretien détaillés sont stockés
sous forme de synthèse, pas de verbatim.

### NFR-8 : Étayage réflexif

La passe d'étayage (references/etayage.md) s'applique à tout artefact produit par
l'agent, pas seulement aux artefacts destinés au candidat. Un agent
qui produit un questionnaire de feedback, un post LinkedIn, un message
de communication, ou toute autre sortie contenant des affirmations doit
passer par la même vérification : chaque affirmation est-elle sourcée
ou qualifiée ?

Un skill fondé sur la crédibilité des signaux (Spence) qui produit
lui-même des signaux gratuits dans ses propres communications détruit
sa proposition de valeur. L'étayage n'est pas un protocole de relecture,
c'est une propriété de tout texte produit par le système.

Incident fondateur : session 2026-03-17. L'agent a produit un Google Form
(questions présupposant un usage qui n'avait pas encore eu lieu, question
orientée négative, pas de NPS) et un post LinkedIn (4 affirmations non
étayées sur 8, dont un signal gratuit au sens de Spence) sans appliquer
sa propre procédure d'étayage. Corrigé après revue utilisateur.

---

## Décisions de conception

### D-1 : Nom du skill

Choix retenu : `candidature`.

Brainstorm Opus planifié mais exécuté en direct (l'API Opus n'était pas
accessible sans clé depuis l'environnement Claude.ai). Trois finalistes
proposés : `refine`, `relecture`, `redline`. L'utilisateur a choisi
`relecture` pour la transparence. Renommé `candidature` quand le scope
s'est élargi au-delà de la relecture.

Écartés : `relecture` (devenu une phase interne), `refine` (anglais),
`redline` (connoté "couper"), `postuler` (verbe, moins naturel comme nom
de skill), `apply` (anglais et ambigu).

### D-2 : Scope, relecture seule vs workflow complet

Choix retenu : workflow complet en 4 phases.

La relecture seule ne résout pas le problème de fond. Une lettre générique
bien relue reste une lettre générique. La valeur est dans la chaîne
complète : profil, recherche, axes, génération, relecture, suivi.

Écarté : skill de relecture standalone. L'ancien `relecture` a été absorbé
comme Phase 3.

### D-3 : Interface de relecture, vocabulaire imposé vs conversationnel

Choix retenu : interface conversationnelle. Le candidat parle naturellement.

Le public cible est "tout le monde", pas des développeurs. Un protocole
avec des raccourcis (a/r/k/s) est une barrière à l'adoption.

Écarté : vocabulaire imposé hérité de `proof` (approve/revise/kill/skip
avec raccourcis). Pas de traçage formel des verdicts.

Compromis accepté : l'interprétation du langage naturel est moins fiable
que des raccourcis explicites. Risque de malentendu sur les verdicts.
Atténué par la reformulation systématique.

### D-4 : Grille de lecture, spécifique au profil vs universelle

Choix retenu : grille universelle dans le skill. Critères spécifiques dans
les mémoires du projet personnel.

La première version contenait des critères David-spécifiques (3 questions
implicites du recruteur, anti-patterns issus de l'expérience). Duplication
avec les instructions du projet et les mémoires. Le skill doit fonctionner
pour tout profil.

### D-5 : Format du CV, Markdown vs DOCX vs natif

Choix retenu : DOCX comme format de référence.

python-docx permet de modifier le texte en préservant les styles, polices,
couleurs du candidat. Markdown perd toute information visuelle. Les formats
natifs (Pages, Canva) ne sont pas manipulables programmatiquement.

Écartés : Markdown (perte de mise en forme), édition directe via
AppleScript dans Pages (fragile et limité), PDF (lecture seule).

Compromis accepté : python-docx ne gère pas les zones de texte flottantes
ni les mises en page très complexes. Le candidat qui a un CV avec un design
élaboré recevra des suggestions de modifications manuelles.

### D-6 : Données persistantes, mémoire projet vs fichiers

Supersédé par D-25, puis renversé par D-42 qui revient au stockage fichiers,
local et géré par le skill cette fois. Choix retenu à l'époque : mémoire projet
(`memory_user_edits`) pour toutes les données persistantes. Archive de
recherche, suivi des candidatures, comptes rendus, patterns.

La v1 utilisait des fichiers markdown (archive dans `recherche/index.md` +
fichiers par type de poste, suivi dans `candidatures/suivi.md`, CR dans
`candidatures/entretiens/`, patterns dans `candidatures/patterns.md`). En
pratique, cela implique que le candidat sache manipuler des fichiers dans un
projet IA : télécharger, re-uploader, maintenir la cohérence. Le public
cible ne sait pas faire ça.

La mémoire projet est accessible dans toutes les conversations sans
manipulation. Pour l'archive de recherche : une entrée par type de poste.
Pour le suivi : une entrée par candidature, mise à jour in-place.

Écartés : fichiers markdown (complexe pour le grand public), base de données
externe (surdimensionné).

Compromis accepté : la mémoire a un budget limité. Le suivi de 50+
candidatures peut saturer. Solution à terme : condensation périodique.
Les CR d'entretien détaillés sont stockés sous forme de synthèse.

### D-7 : Suivi, automatique vs proposé

Choix retenu : l'analyse de patterns est proposée, jamais automatique.

L'orientation apprentissage fonctionne quand le candidat décide quand
prendre du recul. Un tableau de bord automatique avec des stats risque de
décourager (la recherche d'emploi est émotionnellement difficile, Wanberg
et al., 2012).

### D-8 : Compte rendu d'entretien, niveau fixe vs adaptatif

Choix retenu : 3 niveaux avec adaptation dynamique.

Certains candidats veulent juste dire "ça s'est bien passé", d'autres
veulent une analyse question par question. Imposer un seul niveau frustre
l'un ou l'autre. L'adaptation observe le comportement réel du candidat
plutôt que de demander à chaque fois.

### D-9 : Distribution, plateforme spécifique vs repo GitHub

Choix retenu : repo GitHub public (`ddaanet/candidature`).

Pas de marketplace skills sur Claude.ai. Pas d'import GitHub sur
ChatGPT/Gemini/Mistral. Le plus petit dénominateur commun est un dossier
de fichiers markdown. GitHub permet le download ZIP pour les non-techniques
et "Ajouter depuis GitHub" pour Claude.ai.

Écartés : intégration dans claudeutils/Edify (trop orienté développeurs),
GPT Store (spécifique ChatGPT), marketplace Claude Code (le skill est
conçu pour Claude.ai, pas Claude Code).

### D-10 : Séparation du document fondamental

Choix retenu : `references/recruitment-science.md` comme document stable,
séparé des recherches par type de poste.

Les cadres théoriques (Spence, P-J/P-O fit, Kahneman, biais cognitifs,
autorégulation) ne changent pas selon qu'on postule comme dev ou comme
commercial. Les séparer des recherches contextuelles évite la duplication
et permet la mise à jour indépendante.

### D-11 : Orientation relecture, condensée

Choix retenu : orientation réduite à un résumé d'une phrase avant le
premier item.

En test utilisateur, l'orientation complète produisait un message
incompréhensible pour un non-technicien : ligne d'état avec crochets,
liste de critères, vocabulaire de protocole ("actions: feedback, proceed,
skip-to-end"). Le candidat n'a pas besoin de connaître la mécanique, mais
il a besoin de savoir ce qu'on relit.

L'orientation reste, condensée en un résumé : quel texte, pour qui, combien
d'éléments. L'agent attend la confirmation puis passe au premier item.

Écarté : suppression totale (le candidat ne sait plus ce qu'on relit).
Orientation complète v1 (jargon, tour de conversation inutile).

### D-12 : Archivage des artefacts en mémoire

Supersédé par D-30.

Choix retenu : résumé structuré dans l'entrée `candidature:` (axes,
accroche, ton, prétentions). Pas le texte intégral.

La mémoire projet a un budget limité. Le texte complet reste accessible
via `conversation_search` si besoin. Le résumé suffit pour l'analyse de
patterns (references/suivi.md) et la réutilisation d'axes lors de candidatures similaires.

### D-13 : Porte mémoire, écriture systématique

Choix retenu : toujours écrire en mémoire sur le chemin autonome (y compris
quand la recherche contextuelle ne trouve rien, c'est une décision de
typologie). Sur le chemin interactif, la conversation suffit.

L'intégrité structurelle le justifie. La porte est ancrée `[outil]`. Sans
l'appel obligatoire même sur "rien trouvé", l'agent a un prose-only escape
hatch : il rationalise "RAS, pas besoin d'écrire" et évite l'appel d'outil,
ce qui casse l'ancrage. Bénéfice secondaire : le résultat négatif est une
information utile pour les candidatures suivantes.

### D-14 : Shortlist vers candidature, transition par replace

Choix retenu : quand le candidat lance la Phase 2 sur une offre shortlistée,
l'entrée `shortlist:` est remplacée (`replace`) par une entrée
`candidature:` enrichie.

Une seule entrée par offre en mémoire. Pas de duplication. Le préfixe change
pour refléter l'état d'avancement.

### D-15 : Benchmark salarial = dimension de la recherche contextuelle

Choix retenu : le benchmark salarial est une dimension de la recherche
contextuelle (references/preparation.md), pas une procédure séparée.
Les sources ne sont pas codées en dur.

Les sources de benchmark varient selon le pays, le secteur et le type de
poste. Coder des URLs spécifiques (Glassdoor, levels.fyi) rend le skill
fragile. L'agent recherche les sources pertinentes au moment de la
recherche.

### D-16 : Deux skills complémentaires

Supersédé par D-20, puis D-25, depuis renversé par D-42. Un seul skill avec
détection de capacités. Le stockage persistant utilise désormais des fichiers
locaux (D-42), pas Notion ni la mémoire projet.

### D-17 : Cycle rappel, capture, consolidation pour les sites ATS

Choix retenu : cycle en trois temps intégré dans le skill. La hiérarchie des
sources (D-28) sépare les observations terrain des directives consolidées. Le
backend est passé de Notion à des fichiers locaux au pivot du 2026-06-19 (D-42),
les observations terrain vivent désormais dans le repo de données sous sites/.

Le rappel (references/soumission.md) consulte deux sources avant navigation.
Le fichier d'observations sous sites/ du repo de données est la source primaire
(observations terrain datées et versionnées). Les fichiers
`references/sites/*.md` du plugin sont la source secondaire (directives
consolidées). Porte `[outil]` : l'agent consulte les deux sources même s'il
pense connaître le site.

La capture (references/soumission.md) est une question systématique + écriture
obligatoire (même "RAS"). Chaque observation est datée, associée à la version
du skill, et porte sa source (feedback candidat ou observation autonome de
l'agent). Quand l'agent adopte un contournement, il enregistre le problème, la
solution et le résultat. Porte `[outil]` cohérente avec D-13.

La consolidation (references/consolidation.md, différée) lit les observations
terrain du repo de données, les déduplique, et met à jour les fichiers
`references/sites/*.md` du plugin. Les observations consolidées restent dans le
repo de données (source primaire).

L'expérience d'intégration avec les ATS s'accumule naturellement au fil
des candidatures. Sans structuration, elle reste éparpillée dans les
conversations. La hiérarchie repo de données/plugin et le datage/versionnage
permettent le rappel et la consolidation systématiques.

Sources du cycle consolidation : AWS Well-Architected, Operational
Excellence Pillar (OPS07-BP03), runbooks comme procédures évoluant par
boucles de retour. incident.io, What are runbooks. PagerDuty, What is a
Runbook. upstat.io, Automating Runbook Execution ("before automating
execution, automate tracking").

### D-18 : Étayage après le draft, pas avant

Choix retenu : générer un draft d'abord (`create_file`), puis auditer les
affirmations présentes dans le texte réel.

L'approche précédente (étayage avant génération) auditait des affirmations
que l'agent prévoyait d'écrire, dans l'abstrait, et rien ne garantissait
que le texte final correspondrait. Avec le draft d'abord, l'audit porte sur
du concret : le texte existe, on vérifie ce qu'il dit effectivement.

L'avantage est double : anti-hallucination (l'agent ne peut pas simuler un
étayage sur des intentions) et ancrage plus fort (le `create_file`
matérialise l'artefact avant l'audit).

La correction s'adapte : `str_replace` ciblé pour les corrections factuelles
isolées, régénération complète si le problème est structurel (avec nouvelle
passe d'étayage). Pas de règle rigide.

Écarté : étayage avant génération (v1, abstrait). Règle de correction fixée
(trop rigide pour la diversité des cas).

### D-19 : Instruction projet, nommer l'outil explicitement

Caduque depuis le pivot du 2026-06-19. La cible claude.ai est abandonnée
(D-41). `project_knowledge_search` et le project knowledge n'existent pas dans
un plugin Claude Code, où le skill est chargé par le système de plugins.
L'historique ci-dessous décrit l'état antérieur au pivot.

Choix retenu : l'instruction projet dit "utiliser
`project_knowledge_search` pour chercher SKILL.md".

Les fichiers GitHub importés dans un projet Claude.ai sont indexés dans le
project knowledge, accessible uniquement via `project_knowledge_search`.
Ils ne sont pas dans `/mnt/project/` (qui ne contient que les fichiers
uploadés manuellement). L'instruction initiale ("chercher SKILL.md dans les
fichiers du projet") était ambiguë. L'agent cherchait via
`view /mnt/project/`, ne trouvait rien, et abandonnait.

Incident : session 2026-03-18. Premier test du skill dans un nouveau chat.
L'agent a cherché dans `/mnt/project/`, échoué, puis demandé l'offre
d'emploi sans avoir chargé le skill. Le skill n'a été trouvé qu'après
redirection manuelle vers `project_knowledge_search`.

Écarté : formulations vagues ("dans les fichiers du projet", "dans le
projet"). Toute formulation qui ne nomme pas l'outil laisse le modèle
deviner, et il devine mal.

### D-20 : Dispatcher unique avec détection de capacités

Choix retenu : implémenté (v0.2). Supersède D-16.

Un seul `.skill` public (`candidature.skill`). Le dispatcher charge le
workflow bundlé, puis détecte si Chrome est disponible (présence d'outils
`Control Chrome:*` dans le contexte). Si oui, il charge
`references/site-ouverture.md` qui contient les instructions de rappel,
cookies et navigation. La clôture d'interaction (capture et consolidation)
est dans `references/site-cloture.md`. Les fichiers
`references/sites/*.md` sont chargés à la demande.

Un dev stub séparé (`candidature-dev.skill`) charge le workflow depuis le
repo local via Filesystem. Non releasé.

Écarté : détection par plateforme (claude.ai vs Desktop). Chrome est
disponible sur claude.ai web (beta). Seul Filesystem est spécifique à
Desktop, et le dev stub le gère.

### D-22 : Extraction de l'étayage, isolation des instructions

Choix retenu : implémenté (v0.2.1).

L'agent qui lit le workflow complet anticipe l'audit pendant la génération.
Il pré-nettoie le texte au lieu de se faire auditer. L'étayage devient une
formalité : l'agent vérifie ce qu'il a déjà consciemment choisi de rendre
vérifiable. Le résultat est plus prudent mais pas plus honnête.

C'est le même problème que le TDD dans Edify : un agent qui voit les tests
futurs code la solution directement au lieu de respecter le cycle red-green.

Le protocole d'étayage est extrait dans `references/etayage.md`, fichier
autonome. `references/soumission.md` charge etayage.md après le
draft. L'agent découvre le protocole d'audit après avoir généré. L'isolation
des instructions est réelle même si le contexte conversationnel reste.

Littérature : StateFlow (Wu et al., 2024, Microsoft/AutoGen), FSM pour
contrôler un LLM avec des instructions différentes par état. +13-28%
succès, 3-5x moins cher que ReAct. VOXAM (2026-03), les transitions
d'état doivent être du code déterministe, pas une décision LLM.

### D-23 : Liens directs vers le .skill, pas vers la page de release

Caduque depuis le pivot du 2026-06-19. La distribution par fichier `.skill` et
release GitHub appartenait à la cible claude.ai (D-41), abandonnée.
L'installation passe désormais par la marketplace de plugins Claude Code (D-45).
L'historique ci-dessous décrit l'état antérieur au pivot.

Choix retenu : tous les liens pointent vers le fichier `.skill`, pas vers
la page de release GitHub.

Quand la version distante est connue (mise à jour détectée), l'URL est
versionnée (`/releases/download/vA.B.C/candidature.skill`). Quand la
version est inconnue (erreur de fetch, réinstallation), l'URL utilise
`/releases/latest/download/candidature.skill`.

Le public cible est non technique. Une page GitHub avec des notes de
version, des listes de fichiers et des checksums est un obstacle. Le lien
direct télécharge le fichier sans intermédiaire. Claude.ai accepte les
fichiers `.skill` par drag-and-drop.

Le téléchargement doit être fait par le candidat, pas par l'agent. Les
URLs de release GitHub redirigent vers `objects.githubusercontent.com`,
domaine bloqué par le proxy réseau de Claude.ai. L'URL est présentée dans
un bloc code (bouton copier dans Claude.ai) pour que le candidat l'ouvre
dans son navigateur.

Écarté : lien vers `/releases/latest` (page de release). Le candidat doit
trouver le bon fichier parmi les assets, comprendre ce qu'est une release,
et cliquer au bon endroit. Également écarté : flux "coller l'URL pour que
l'agent télécharge via web_fetch" (le redirect est bloqué).

### D-21 : Archivage candidatures sur Filesystem (Desktop)

Supersédé par D-25, depuis renversé par D-42. Le stockage persistant est
revenu aux fichiers locaux, ancrés sur le répertoire courant (D-42), ce que
cette décision anticipait pour le Desktop avant la parenthèse Notion.

### D-24 : Suppression de SKILL.md, fichiers de phase comme source de vérité

Choix retenu : implémenté (v0.4).

Les fichiers de phase dans references/ remplacent le workflow monolithique
SKILL.md. Chaque fichier couvre une phase du workflow et est autonome (pas
de référence croisée entre phases). Le dispatcher charge une phase à la
fois selon le contexte de la conversation.

Le workflow monolithique posait deux problèmes. Le contexte chargé en
permanence (4 phases, toutes les instructions) consommait du budget
d'attention sans bénéfice pour la phase en cours. L'agent qui voyait les
instructions d'étayage pendant la génération anticipait l'audit au lieu de
se faire auditer (voir D-22).

Les fichiers de phase sont profil.md, preparation.md, soumission.md,
relecture.md et suivi.md.

Écarté : garder SKILL.md avec des directives de chargement partiel (le
modèle ne respecte pas de manière fiable les instructions de ne pas lire
ce qui est déjà dans son contexte).

### D-25 : Notion requis, pages imbriquées comme stockage

Caduque depuis le pivot du 2026-06-19. Supersédée par D-42, le stockage
persistant est désormais une arborescence de fichiers ancrée sur le répertoire
courant, pas Notion. L'historique ci-dessous décrit l'état antérieur au pivot et
reste tel quel comme trace de la décision renversée. Tout ce qui suit dans cette
décision décrit un backend abandonné.

Choix retenu : implémenté (v0.4). Supersède D-6, D-21.

Tout le stockage persistant est dans des pages Notion imbriquées sous une
page racine configurée localement (mémoire projet ou utilisateur). Pas de
base de données Notion (le MCP ne supporte pas les requêtes structurées de
manière fiable). La mémoire projet (memory_user_edits) ne garde que
l'entrée version-check pour la vérification de mise à jour.

Le stockage Notion résout les limites de la mémoire projet (30 slots,
condensation automatique, pas de structure). Les pages imbriquées
permettent une organisation hiérarchique (une page par candidature, des
sous-pages pour les artefacts et les CR).

Notion MCP est disponible nativement dans Claude.ai (pas de clé API, pas
de configuration côté utilisateur au-delà de l'autorisation initiale).

Écarté : mémoire projet seule (D-6, limites de budget). Filesystem sur
Desktop (D-21, pas disponible sur claude.ai). Base de données Notion (le
MCP ne supporte pas les filtres et les tris côté serveur).

Compromis accepté : Notion MCP est requis. Les utilisateurs sans Notion
ne peuvent pas utiliser le stockage persistant. Le skill fonctionne quand
même pour une candidature ponctuelle, mais sans historique.

Correction 2026-06-16 : le fichier `suivi-retours.md` avait échappé à cette
migration et prescrivait encore le stockage en mémoire projet (préfixes
`candidature:`, `entretien:`, `tendance:`), en contradiction avec `suivi.md`
qui le citait pour le protocole détaillé tout en stockant dans Notion.
`suivi-retours.md` n'était jamais chargé seul, lu en entier et toujours en
même temps que `suivi.md`, sans le déclencheur conditionnel ou différé qui
justifie les autres fichiers de support (etayage après le brouillon,
relecture par champ, cover-letter conditionnelle). La séparation n'apportait
pas de divulgation progressive et coûtait la divergence observée. Ses trois
éléments uniques (liste des statuts, adaptation de profondeur du compte
rendu, question d'extraction d'apprentissages) sont repliés dans `suivi.md`,
et le fichier est supprimé.

### D-26 : Flux formulaire-driven

Choix retenu : implémenté (v0.4).

Le formulaire de candidature guide la génération. L'agent ouvre le
formulaire (ou le reçoit de l'utilisateur), découvre les champs, et génère
les artefacts adaptés à chaque champ. La lettre de motivation n'est pas
préparée avant de connaître le formulaire, parce que certains formulaires
n'en demandent pas, d'autres demandent des réponses courtes à des questions
spécifiques.

Le flux précédent (générer une lettre puis remplir le formulaire) produisait
des artefacts inutilisés quand le formulaire ne comportait pas de champ
lettre, ou des artefacts mal calibrés quand le formulaire posait des
questions spécifiques au lieu de demander une lettre libre.

Écarté : génération avant découverte du formulaire (v1). Lettre par défaut
avec adaptation au formulaire (deux passes pour un résultat souvent
différent du format attendu).

Correction 2026-06-16 : la section 2.6 Axes de la préparation présupposait
encore une lettre comme livrable par défaut (CV qui « doit y faire
référence », lettre « véhicule principal » du P-O fit, « avant de
rédiger »). Le garde-fou formulaire-driven vit dans la soumission, et le
dispatcher charge une phase à la fois (D-24), donc une session qui termine
la préparation rédige sa passation sans jamais voir ce garde-fou et reporte
l'hypothèse lettre. Symptôme observé sur la candidature Symbiotic Security,
dont le formulaire Gem n'a aucun champ de texte libre. La correction,
d'abord une neutralisation de la prose, a évolué en suppression de la
section, voir D-37.

### D-27 : Contrôle d'écriture backend (references/backend-write.md)

Choix retenu : implémenté (v0.4). L'étape d'exploration préalable décrite
ci-dessous valait pour le backend Notion, dont la structure d'une page n'était
pas connue à l'avance. Le pivot du 2026-06-19 (D-42) bascule sur des fichiers
locaux au layout connu et documenté (D-43), l'étape d'exploration disparaît, et
backend-write.md est réécrit en convention d'écriture directe, chemin calculé
depuis la date et le slug, frontmatter au schéma, corps en sections nommées.

Avant toute écriture vers la page Notion cible, l'agent explorait la cible et
générait une procédure d'écriture. La procédure n'existait pas avant
l'exploration. Ce mécanisme empêchait l'agent d'écrire vers un backend qu'il ne
connaissait pas, avec une structure qu'il invente.

Le problème fondateur était le même que D-18 (étayage après le draft) :
un agent qui planifie une écriture dans l'abstrait produit une structure
plausible mais déconnectée de la réalité du backend. L'exploration forçait
la découverte de la structure existante avant toute modification. Avec un
layout fichiers fixe, cette découverte n'a plus lieu d'être.

Écarté à l'époque : écriture directe avec instructions codées en dur (fragile,
ne s'adaptait pas aux structures Notion de chaque utilisateur). Procédure
persistante (la structure Notion pouvait changer entre deux sessions).

### D-28 : Hiérarchie des sources sites (observations terrain primaires, skill secondaire)

Choix retenu : implémenté (v0.4). Les observations terrain vivaient dans Notion
jusqu'au pivot du 2026-06-19 (D-42), désormais dans le repo de données sous
sites/.

Les observations terrain, datées et associées à la version du skill utilisée,
sont stockées dans le repo de données. Les fichiers `references/sites/*.md` du
plugin contiennent les directives consolidées. Les observations terrain
prévalent en cas de divergence. À la mise à jour du skill, elles sont comparées
aux fichiers de référence (eux aussi datés et versionnés) pour détecter les
divergences. Les directives du plugin ne font pas double emploi avec les
observations terrain.

Cette séparation résout le problème de la consolidation (D-17) : les
observations terrain sont vivantes dans le repo de données, les directives du
plugin sont stables et versionnées. La mise à jour du skill est le moment de
synchronisation.

### D-29 : Distinction feedback autonome agent vs feedback candidat

Choix retenu : implémenté (v0.4).

La capture site (§2.9) distingue deux sources d'observation. Le feedback
candidat est ce que l'utilisateur signale après soumission. L'observation
autonome est ce que l'agent détecte pendant la soumission (contournement,
comportement non standard). Chaque observation porte sa source.

Quand l'agent adopte un contournement, il enregistre le problème, la
solution adoptée, et le résultat (succès ou échec). Cette traçabilité
permet de pondérer la fiabilité des observations et de retrouver les
contournements automatisés lors des candidatures suivantes.

### D-30 : Archivage restructuré (frontmatter + prose sur le README de candidature)

Choix retenu : implémenté (v0.4). Supersède D-12. La structure décrite ci-dessous
en propriétés et page Notion s'est transposée au pivot du 2026-06-19 (D-42) en
frontmatter et corps du README.md de candidature.

Le résumé séparé est supprimé. Les champs factuels (date de soumission, canal,
plateforme, prétentions salariales) sont le frontmatter du README.md de
candidature. Les champs analytiques (axes retenus, accroche, ton) sont un court
paragraphe de prose dans le corps du README.md. Les brouillons restent des
fichiers à côté dans le dossier de candidature.

La distinction est entre contenu (fichiers de brouillon) et métadonnées
(frontmatter du README). Les champs factuels sont partagés entre tous les
brouillons, les monter en frontmatter évite l'arbitraire de les rattacher à un
brouillon particulier.

Écarté : résumé dédié séparé (D-12, trop de métadonnées pour le justifier).
Résumé en tête du brouillon (arbitraire quand il y a plusieurs brouillons).

### D-31 : Clôture comme checkpoint d'enregistrement

Choix retenu : implémenté (v0.4).

La clôture n'est pas un message de fin. C'est un checkpoint qui force
l'agent à vérifier que tout est enregistré dans les fichiers du repo de données
avant de proposer un nouveau chat. Si un élément manque, l'agent demande au
candidat avant d'écrire le fichier. Le backend est passé de Notion aux fichiers
locaux au pivot du 2026-06-19 (D-42), le checkpoint vaut désormais sur les
écritures fichiers.

Le contexte conversationnel (échanges, corrections, décisions en temps
réel) ne sera plus accessible dans un nouveau chat. Tout ce qui doit
être retrouvé plus tard doit être écrit en fichiers avant la clôture. Cette
contrainte évite la perte silencieuse d'artefacts non enregistrés.

### D-32 : Contamination de style dans le dispatcher

Choix retenu : implémenté (v0.4).

Tout texte dans le contexte de l'agent est un corpus qui influence la
sortie. Le dispatcher n'est pas exempt des règles anti-contamination
(pas de fragments à puces, pas de listes numérotées brutes, phrases
complètes). La lisibilité machine (Sonnet) est préservée par des phrases
courtes avec une action par phrase, pas par de la structure à reproduire.

Ce principe étend la règle de contamination de CLAUDE.md (exemples et
templates comme vecteurs) à tout texte chargé dans le contexte, y
compris les fichiers techniques et le dispatcher.

### D-33 : Double cible, sources canoniques et préprocesseur

Caduque depuis le pivot du 2026-06-19. Supersédée par D-41 et D-45, le dépôt ne
produit plus qu'un seul artefact, `skills/candidature/`, pour la cible Claude
Code. Les blocs `target:` ont disparu et le préprocesseur ne substitue plus que
`{{VERSION}}`. L'historique ci-dessous décrit l'état antérieur au pivot.

Choix retenu : le dépôt produit deux artefacts depuis une source unique
`src/`. Les blocs `<!-- target: claude-ai|claude-code -->` isolent le
contenu propre à chaque cible. Un préprocesseur awk portable
(`build/preprocess.awk`) supprime les blocs hors cible et substitue
`{{VERSION}}`. Évite la divergence entre deux arborescences éditées à la
main. Spec 2026-04-24, sections 1, 3, 4.

### D-34 : Artefacts Claude Code versionnés, garde-fou de dérive

Partiellement caduque depuis le pivot du 2026-06-19. Le manifeste
`.claude-plugin/plugin.json` n'est plus généré, c'est une source éditée à la
main et la source de vérité de la version (D-45). Seul `skills/candidature/`
reste un artefact buildé sous garde de dérive. L'historique ci-dessous décrit
l'état antérieur au pivot.

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
intention, dont les choix validés notés ci-dessous (chromium à profil
persistant et port CDP, navigation par arbre d'accessibilité).
`references/site-ouverture-playwright.md` pointe sur le harnais pour
LinkedIn et décrit l'approche ad hoc pour les autres sites. Le harnais
reste hors du contenu skill, il vit dans une copie locale du dépôt, pas
dans le cache plugin. Spec 2026-04-24, section 5, réconciliée.

### D-36 : Suppression de la vérification de version sur Claude Code

Caduque depuis le pivot du 2026-06-19. Le bloc `claude-ai` a disparu avec la
cible claude.ai (D-41) et `scripts/version_check.py` a été supprimé du dépôt,
code mort depuis le retrait du version-check. Les mises à jour passent par la
marketplace Claude Code. L'historique ci-dessous décrit l'état antérieur au
pivot.

Choix retenu : le build Claude Code supprime la section 1 de SKILL.md et
`scripts/version_check.py`. Les mises à jour sont gérées par la
marketplace Claude Code. La logique de version reste isolée dans le
bloc `claude-ai`. Spec 2026-04-24, section 6.

### Note : couche navigateur Claude Code, réalisation de la spec §5

La spec plugin du 2026-04-24 (§5) prévoit le contrôle navigateur par scripts
Playwright lancés via Bash. Une session de validation a concrétisé cette couche
et fixé deux choix que le scaffold initial laissait ouverts. Le navigateur est
un chromium en tête à profil persistant, lancé une fois avec un port CDP,
auquel chaque script se connecte par connectOverCDP. L'utilisateur se connecte
à la main, la session survit entre les exécutions, et le harnais ne touche
jamais aux identifiants. La navigation passe par l'arbre d'accessibilité (rôles
et noms accessibles) plutôt que par les classes CSS, parce que LinkedIn fait
tourner ses classes à chaque déploiement mais ne peut pas altérer la couche
d'accessibilité sans casser les lecteurs d'écran.

Le harnais et sa conception détaillée vivent dans tools/linkedin-harness/. Les
décisions formelles de la migration plugin sont rédigées ci-dessus (D-33 à
D-36), et D-35 (couche navigateur) reprend ces choix validés. Le parcours des
offres reste hors périmètre, conforme à la spec.

### D-37 : Axes alignés à la demande, pas en livrable de préparation

Choix retenu : la section 2.6 Axes de la préparation est supprimée. Les axes
ne sont pas produits à l'avance. L'analyse d'adéquation de la shortlist
(§2.2) reste la lecture de l'agent, stockée sur la page candidature, et sert
un besoin manifeste, le candidat décide s'il postule. L'alignement des axes
avec le candidat se fait au moment où un consommateur le requiert :
l'adaptation du CV, qui tire son angle de l'analyse de shortlist, et un
champ de texte libre du formulaire, découvert à la soumission, qui calibre
le texte précis.

La section supprimée produisait les mêmes trois dimensions que la shortlist,
une seconde fois, confirmées au widget avant de rédiger. Cette seconde
production présupposait un consommateur, une lettre, qui n'existe que si le
formulaire a un champ de texte libre. C'est la même anti-anticipation que
D-18, D-22, D-26 et D-27, ne rien produire dans l'abstrait avant que la
cible concrète existe. Le routage du dispatcher (règle 4) ne teste plus la
présence d'une sous-page d'axes. Supersède la correction notée sous D-26.

### D-38 : Ordre d'insertion des collections Notion, append en fin

Caduque depuis le pivot du 2026-06-19 (D-42). La convention réglait l'ordre des
sous-pages Notion, contrainte propre au MCP qui ne repositionne pas une page dans
son parent. En stockage fichiers, l'ordre n'est plus une propriété du backend,
chaque entrée est un fichier ou un dossier nommé, et l'index tabulaire se
régénère à la demande par tri sur les frontmatter (D-42). L'historique ci-dessous
décrit la contrainte Notion abandonnée.

Choix retenu à l'époque : dans toute collection de sous-pages Notion (candidatures,
recherches, sites, comptes rendus, passations), une nouvelle page s'ajoute
à la fin, la plus récente en dernier. L'agent ne repositionne pas les pages
existantes.

La convention précédente plaçait la plus récente en tête, ce qui obligeait
à déplacer chaque nouvelle page en position zéro après sa création.
notion-move-pages est lent, et le tri manuel a dérivé. La cartographie du
2026-06-16 a montré que sur les conteneurs anciens l'ordre n'était plus
cohérent, la tête restait à peu près triée et la queue était mélangée.
L'append est le comportement natif de la création de page, gratuit et
déterministe.

Le coût est que la page la plus récente n'est plus en haut à la lecture.
C'est acceptable parce que l'état courant de la recherche se lit dans la
section Situation de la page racine, qui pointe la dernière passation et le
pipeline, et qu'une session qui reprend lit la dernière entrée, désormais
en bas. Supersède la convention plus récente en premier, qui n'était écrite
explicitement que sur la page conteneur Passations Recherche d'emploi.

L'append est aussi le comportement le plus fiable côté outil. Le MCP Notion
ne repositionne pas une page dans son parent en un seul appel, un
déplacement vers le même parent est un no-op. Réordonner des pages enfants
existantes reste possible en réécrivant le contenu, mais seulement par
petits groupes où chaque entrée porte une description, les gros
réordonnancements ou une entrée sans description orphelinant les
descriptions. C'est lent et fragile. L'append en fin évite tout cela. La
règle vaut pour les écritures à venir. Les conteneurs existants (passations
et index des candidatures) ont été retriés une fois en ascendant le
2026-06-16 pour partir d'une base cohérente.

### D-39 : Fiche candidat chargée avant prospection, barrière de contraintes dures

Choix retenu : implémenté. La phase 2 préparation charge le contenu de la
fiche candidat à l'entrée, avant toute recherche d'offres, et une barrière de
contraintes dures écarte d'office les offres hors critères avant l'analyse
d'adéquation.

Le dispatcher (règle 2) ne touchait la fiche que pour tester si elle est vide,
son contenu n'était jamais porté dans la phase (D-24, une phase à la fois).
L'analyse d'adéquation de la shortlist (§2.2) parlait d'adéquation avec le
profil comme si le profil était connu, sans jamais le charger. Sur une session
de prospection LinkedIn du 2026-06-16, l'agent a recommandé comme la plus
alignée une offre en télétravail intégral que la fiche interdit explicitement,
sur un profil deviné. Voir l'axe d'audit ci-dessous.

La correction charge la fiche à l'entrée de phase, source qui fait autorité sur
l'adéquation, et en extrait les contraintes dures, le
présentiel, la zone géographique, le plancher salarial et les anti-patterns.
La barrière confronte chaque offre à ces contraintes avant l'analyse à trois
dimensions. Une offre qui viole une contrainte dure est écartée sans être
proposée. Ce n'est pas l'agent qui décide à la place du candidat. Les
contraintes dures sont des décisions déjà inscrites dans la fiche, par exemple
ne jamais proposer de télétravail intégral. Les écarter d'office honore ces
décisions. Les préférences molles passent par l'analyse où le candidat
tranche.

Écarté : filtre de contraintes codé dans le harnais LinkedIn, qui figerait des
critères propres à un candidat dans un outil générique. Le harnais reste
neutre, l'agent porte les contraintes.

La fiche était à l'origine chargée depuis Notion. Le pivot du 2026-06-19 (D-42)
en fait fiche-candidat.md à la racine du repo de données, lue à l'entrée de
phase. La décision tient inchangée, seul le backend de la source change.

### D-40 : Écartement hors parcours et réconciliation du dossier vers LinkedIn

Cette décision porte sur le harnais LinkedIn, code JavaScript distinct du
contenu du skill. Le Plan C, livré le 2026-06-19, a basculé le harnais de Notion
vers les fichiers. Le harnais écrit désormais le dossier candidature en fichiers,
au même backend que le skill (D-42). Le sous-plan est clos, les mentions
ci-dessous décrivent l'état fichiers.

Choix retenu : implémenté. Le harnais LinkedIn expose une sous-commande
`dismiss` qui écarte une carte par jobId hors d'un parcours, le dossier
candidature porte le jobId de sa carte dans son frontmatter, et l'écartement
d'une offre se marque dans ce frontmatter.

Le reject du driver ne valait que sur la carte au focus d'un parcours actif.
Un candidat qui annule une shortlist plus tard n'avait aucune voie propre.
Incident du 2026-06-16, l'agent a écrit un script Playwright ad hoc qui
contournait les helpers du harnais et a timeouté sur une navigation nue, alors
que `gotoStream` et `dismissCard` faisaient déjà le travail. Même racine que
D-39, voir l'axe d'audit ci-dessous.

La sous-commande `walk.mjs dismiss --jobId` réutilise `gotoStream`,
`listCards`, `readFocusedCard` et `dismissCard`, sans état de run.
`createShortlistDossier` inscrit le jobId dans le frontmatter du dossier
candidature, ce qui relie le dossier fichier à la carte. L'écartement d'une
offre passe par ce frontmatter, l'agent met `statut: écartée` dans le README,
là où l'ancien backend Notion faisait une suppression douce REST. La création
de dossier remplace `createShortlistPage`. À l'écartement d'une offre issue
d'un parcours, mettre `statut: écartée` et dismisser la carte vont de pair,
sans quoi l'offre annulée réapparaît au parcours suivant.

Écarté : navigation ad hoc réécrite à chaque besoin, fragile et ignorant les
helpers éprouvés. Couplage du dismiss à la machine à états du parcours, qui ne
couvre pas l'annulation tardive.

### Axe d'audit : agir sans charger la source qui fait autorité

Deux incidents du 2026-06-16 partagent une racine unique. L'agent exécute une
opération sans charger d'abord la source qui fait autorité sur cette
opération, et agit donc sur une reconstruction devinée du réel.

À la prospection LinkedIn, l'agent a évalué l'adéquation de trois offres sans
jamais charger le contenu de la fiche candidat. Il a recommandé comme la plus
alignée un poste full remote, que la fiche interdit explicitement. L'erreur
n'a été rattrapée que par une question du candidat. La source qui fait
autorité sur l'adéquation, ce sont les contraintes documentées de la fiche,
pas le profil que l'agent infère du fil d'offres.

Au dismiss d'une carte hors parcours, l'agent a réinventé une navigation
Playwright ad hoc qui a planté en timeout, alors que lib/stream-page.mjs
exposait déjà gotoStream pour la navigation robuste et dismissCard pour le
clic, et que walk.mjs les importait. La source qui fait autorité sur la
manière de dismisser une carte, c'est la lib du harnais, pas une nav
improvisée.

Ce fil sous-tend déjà plusieurs décisions. D-18 audite le texte réel du
brouillon plutôt que les intentions de l'agent. D-27 imposait l'exploration
d'un backend avant d'y écrire, étape disparue avec le pivot vers les fichiers. D-13 et D-17 ancrent une porte `[outil]` qui force
la consultation des sources avant navigation. Chacune est une réponse locale
et ancrée au même risque.

L'axe ne devient pas lui-même une instruction du skill. Un principe général
posé dans le dispatcher, charger la source qui fait autorité avant d'agir,
serait la porte prose-only que NFR-2 et D-13 identifient comme l'anti-pattern,
lue puis sautée. L'agent connaissait déjà le principe dans l'abstrait et a
quand même deviné. Sa valeur est diagnostique. C'est un angle d'audit à passer
sur les sites d'action conséquents du skill, en demandant à chacun si l'agent
charge la source qui fait autorité avant d'agir, ou s'il improvise sur une
reconstruction. Les deux correctifs concrets nés de ces incidents sont D-39 et
D-40, chacun une porte locale et ancrée, pas une instruction générale.

### D-41 : Abandon de la cible claude.ai, plugin Claude Code pur

Choix retenu : le skill devient un plugin Claude Code pur. La cible claude.ai
est abandonnée.

Le skill était distribué pour les deux cibles depuis une source unique, le
préprocesseur isolant les blocs propres à claude.ai (D-33). Cette double cible
contraignait chaque décision de stockage et de distribution au plus petit
dénominateur commun, Notion comme backend faute de système de fichiers sur
claude.ai (D-25), version-check par upload de fichier faute de marketplace
(D-23), instruction projet pour forcer le déclenchement faute de manifeste de
skill (D-19). La compatibilité claude.ai n'était pas un acquis à protéger mais
une camisole qui dictait des choix dégradés. La note mémoire
feedback_claude_ai_camisole acte ce renversement.

Le plugin Claude Code dispose d'un système de fichiers, d'une marketplace pour
les mises à jour, et d'un déclenchement par manifeste. Abandonner claude.ai
libère le stockage fichiers (D-42), supprime le version-check résiduel (D-36
l'avait déjà retiré côté Claude Code) et l'instruction projet, et effondre le
build deux-cibles en assemblage plugin seul.

Compromis accepté : les utilisateurs de claude.ai ne peuvent plus installer le
skill. Le public visé migre vers Claude Code, dont le système de fichiers est
la condition du nouveau modèle de stockage.

### D-42 : Stockage fichiers ancré sur le répertoire courant

Choix retenu : implémenté. Supersède D-25, D-6, D-21. Tout le stockage
persistant est une arborescence de fichiers markdown dans le répertoire courant,
qui est le repo de données. Pas de config de chemin.

La Phase 1 a exporté l'arbre Notion vers un repo local de fichiers. Le pivot
bascule le runtime du skill sur ce repo. Le layout est fiche-candidat.md pour le
profil, tendances.md pour les tendances marché, candidatures/AAAA-MM-JJ-slug/
par offre avec un README.md qui porte l'offre et son frontmatter et des
brouillons à côté plus des entretien-N.md, candidatures/_a-trier.md pour les
prospects orphelins, sites/ pour les fiches ATS consolidées, recherches/ pour
les recherches contextuelles. L'index tabulaire du pipeline n'est pas stocké, il
se régénère à la demande en lisant les frontmatter.

Le répertoire courant comme ancre supprime toute manipulation de config. Le
candidat lance le skill dans son repo de données, le skill opère là. Le système
de fichiers de Claude Code rend chaque écriture directe, sans le détour MCP que
Notion imposait (D-27, l'exploration préalable disparaît avec D-43 et la
réécriture de backend-write.md).

Le frontmatter de candidature porte entreprise, poste et statut en champs
requis, plus des champs conditionnels selon l'avancement, canal, date_soumission,
date_reponse, date_shortlist. Le statut prend une valeur d'un ensemble fermé, à
trier, shortlist, en attente, refus, classée sans suite, écartée. à trier
désigne un prospect non qualifié, écartée une offre que le candidat retire,
distincte de classée sans suite qui est une clôture côté recruteur.

Écarté : Notion (D-25, dépendance MCP et backend dégradé hérité de claude.ai),
config de chemin du repo (le répertoire courant suffit), base de données pour
le pipeline (le frontmatter par fichier et la régénération à la demande
suffisent).

Compromis accepté : l'écartement d'une offre devient un changement de statut
dans le frontmatter, statut: écartée, le fichier reste. La couche navigateur
garde son volet, écarter une offre issue d'un parcours LinkedIn écarte aussi sa
carte dans le flux, sinon le repo de fichiers et le flux LinkedIn divergent
(D-40).

### D-43 : Sentinelle .candidature de version de format

Choix retenu : implémenté. Un fichier .candidature à la racine du repo de
données marque un repo initialisé. Sa première ligne porte la version du format
de stockage, format: 1.

La version de format est distincte de la version du skill. Elle ne change que si
le layout sur disque évolue de façon incompatible, et impose alors une migration.
La version 1 fige le layout produit par l'export de la Phase 1. La constante
FORMAT_VERSION = 1 vit dans scripts/init_repo.py et fait foi.

Le dispatcher lit .candidature au démarrage. Sentinelle présente et version
connue, le repo est prêt, continuer. Sentinelle absente, le repo n'est pas
initialisé, proposer le script d'init sans rien créer sans accord. Version
supérieure à celle que le skill connaît, demander de mettre à jour le skill et
s'arrêter.

Sentinelle absente, deux cas selon le contenu du répertoire. Pas de dossier
candidatures/, le répertoire est vierge, proposer l'initialisation. Un dossier
candidatures/ existe déjà sans sentinelle, c'est un repo existant à adopter, par
exemple issu d'une migration. L'idempotence d'init_repo.py rend l'adoption sûre,
le script ajoute la sentinelle et les fichiers de structure manquants sans
toucher aux données présentes. Le dispatcher distingue les deux pour ne pas
présenter une adoption comme une création de structure de départ, formulation
qui alarmerait sur un repo déjà rempli.

scripts/init_repo.py scaffolde un repo vide, crée candidatures/, sites/,
recherches/, un fiche-candidat.md gabarit, tendances.md, candidatures/_a-trier.md,
et écrit .candidature. Le script est idempotent, il ne touche pas un fichier déjà
présent. Le gabarit de la fiche candidat porte sur sa première ligne le marqueur
`<!-- candidature:gabarit -->`, que le routage de phase teste pour distinguer un
profil vide d'un profil rempli, et que la phase profil retire au premier
remplissage. Le script est embarqué dans le plugin et invoqué via
`${CLAUDE_SKILL_DIR}/scripts/init_repo.py`, la variable Claude Code qui résout le
répertoire du skill au runtime, indépendamment du répertoire courant.

### D-44 : Validateur de métadonnées validate.py, signalement sans correction

Choix retenu : implémenté. scripts/validate.py lit les frontmatter des README.md
de candidature, signale les anomalies, et ne corrige rien.

Les contrôles portent sur la présence des clés requises, l'appartenance du statut
à l'ensemble fermé, le format de date AAAA-MM-JJ, la plausibilité des dates, date
de soumission pas dans le futur et cohérente avec la date du dossier, réponse
postérieure à la soumission, shortlist antérieure à la soumission, et la
cohérence statut/dates, canal et date de soumission présents quand le statut
implique une soumission, date de réponse présente quand le statut est refus.

Le dispatcher lance le validateur à la lecture de l'index et présente les
anomalies au candidat sans bloquer le workflow. Le validateur signale, le
candidat décide. Les codes de sortie servent l'usage en ligne de commande comme
en vérification, code 1 si au moins une anomalie est trouvée, 0 si aucune, 2 sur
erreur d'usage. Comme init_repo.py, il est embarqué dans le plugin et invoqué via
`${CLAUDE_SKILL_DIR}/scripts/validate.py`.

Écarté : correction automatique des métadonnées. Une correction silencieuse
masquerait des incohérences que le candidat doit trancher, par exemple un statut
refus sans date de réponse renvoie à une information manquante, pas à une valeur
à inventer.

### D-45 : Release par le toolkit plugin-dev, plugin.json source de vérité

Choix retenu : implémenté. Le build et la release passent par le toolkit
plugin-dev, vendu dans le repo par git subtree sous plugin-dev/ au tag v0.2.1.
`.claude-plugin/plugin.json` devient la source de vérité de la version.

Le build deux-cibles et son fichier VERSION dataient de la double distribution
(D-33, D-34). L'abandon de claude.ai (D-41) effondre le build en assemblage
plugin seul et rend caducs le target stripping, le stub dev et le template
src/plugin.json.tmpl, tous supprimés. Un toolkit de release partagé entre plugins
remplace la mécanique propre au repo. La version se bumpe par
`just release {patch|minor|major}`, qui écrit le champ version de plugin.json
puis répercute la valeur dans la marketplace claude-plugins. Le fichier VERSION
disparaît.

Un hook version-guard câblé dans .claude/settings.json intercepte les écritures
sur plugin.json et refuse tout changement manuel du champ version. La recette de
release possède le bump, une édition manuelle désynchroniserait le manifeste du
dernier tag et ne se ferait attraper qu'à la release suivante.

Compromis accepté : une dépendance vendue de plus dans le repo, contre une infra
de release reproductible et partagée entre plugins, au lieu d'un build maison à
maintenir seul.

---

## Alternatives écartées globales

### Skill Claude Code (format agent-core)

Le skill `proof` original utilise le Task tool, les planstates lifecycle,
les corrector sub-agents, les recall-artifacts. Tout ça est spécifique à
Claude Code et n'existe pas dans Claude.ai. Le skill `candidature` est
autonome, pas de dépendances infrastructure.

### Génération de PDF avec mise en forme

L'agent n'est pas bon en création graphique (reconnu par l'utilisateur et
l'agent). La stratégie est de modifier le DOCX du candidat plutôt que de
générer un nouveau document. La mise en forme est la responsabilité du
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
  README.md
  DESIGN.md
  TODO.md
  src/
    SKILL.md
    scripts/
      init_repo.py
      validate.py
    references/
      profil.md
      preparation.md
      soumission.md
      relecture.md
      suivi.md
      recruitment-science.md
      cover-letter.md
      adaptation-cv.md
      decoupage-relecture.md
      preparation-entretien.md
      etayage.md
      backend-write.md
      site-ouverture.md
      site-ouverture-playwright.md
      site-cloture.md
      consolidation.md
      modele-fichiers.md
      sites/
        smartrecruiters.md
        teamtailor.md
        wttj.md
        linkedin.md
  skills/candidature/
    SKILL.md
    scripts/
    references/
  .claude-plugin/
    plugin.json
  build/
    build.sh
    preprocess.awk
  plugin-dev/
  tools/
```

`src/` est la source unique. `build.sh` en dérive un seul artefact, le plugin
Claude Code versionné sous `skills/candidature/` avec son
`.claude-plugin/plugin.json` (D-34). La cible claude.ai et son `.skill` sont
abandonnés (D-41), le build deux-cibles, le stub dev et le template
`plugin.json.tmpl` ont disparu (D-45). `plugin-dev/` est le toolkit de release
vendu par git subtree (D-45). Les scripts `init_repo.py` et `validate.py` sont
embarqués dans le plugin (D-43, D-44). Les fichiers de phase dans `references/`
remplacent le workflow monolithique SKILL.md (D-24). Le dispatcher charge une
phase à la fois. Le stockage persistant est une arborescence de fichiers dans le
repo de données (D-42), pas Notion.

---

## Portes du workflow, résolution historique

Le workflow v1 monolithique portait des portes prose-only, des points de
décision sans ancrage que l'agent sautait. Chacune a reçu un ancrage par appel
d'outil. La table trace cette première résolution, telle qu'écrite avant la
migration Notion. Les résolutions en mémoire projet montrées ici ont été
supersédées par le stockage Notion (D-25, D-30), lui-même renversé par le
stockage fichiers du pivot du 2026-06-19 (D-42). Les sections numérotées ne
correspondent plus au découpage actuel des fichiers de phase. Conservé comme
référence historique.

| Section | Porte initiale | Résolution (avant Notion) |
|---------|---------------|------------|
| §2.2 | `view index` fichier | Consultation mémoire projet (`recherche:`) |
| §2.2 | `create_file` recherche | `memory_user_edits` |
| §3.1 | Ligne d'état jargonneuse | Résumé d'une phrase (D-11) |
| §4.1 | `create_file ou str_replace` | `memory_user_edits` |
| §4.2 | CR dans fichiers | CR conversationnel, synthèse en mémoire |
| §4.3 | `candidatures/patterns.md` | Mémoire projet (`tendance:`) |
| §Archive | Structure fichiers | Section supprimée, archive en mémoire |

---

## Appendice : Validation des sources

Audit de traçabilité des affirmations vers leurs sources. Réalisé en fin de
session de conception. Les corrections ont été appliquées aux fichiers
concernés.

### Légende

- « Étayé » : source primaire identifiée et vérifiée dans les résultats
  de recherche de cette session.
- « Étayé (réserves) » : source identifiée mais avec des limites
  méthodologiques documentées.
- « Faiblement étayé » : inférence raisonnable à partir d'un cadre
  théorique, pas de citation directe. Qualifié dans le fichier source
  avec une note explicite.
- « Non étayé » : affirmation non soutenue par la recherche. Corrigée ou
  retirée.

### Affirmations académiques

| # | Affirmation | Fichier | Source | Statut |
|---|-------|---------|--------|--------|
| 1 | Théorie du signal, signaux coûteux vs gratuits | recruitment-science.md §1 | Spence 1973 | Étayé |
| 2 | P-J fit / P-O fit distinction | recruitment-science.md §2 | Edwards 1991, Kristof-Brown 2005 | Étayé |
| 3 | Biais de similarité culturelle en recrutement | recruitment-science.md §4 | Rivera 2012 | Étayé |
| 4 | Tri initial CV ~7,4 secondes | recruitment-science.md §3 | Ladders 2018 | Étayé (réserves) |
| 5 | Biais d'ancrage sur première information | recruitment-science.md §4 | Tversky & Kahneman 1974 | Étayé |
| 6 | Discrimination sur les noms | recruitment-science.md §4 | Bertrand & Mullainathan 2004 | Étayé |
| 7 | Recherche d'emploi = processus d'autorégulation | recruitment-science.md §5 | Kanfer et al. 2001 | Étayé |
| 8 | JSQS : 4 dimensions de qualité de recherche | recruitment-science.md §5 | Van Hooft & Van Hoye 2022 | Étayé |
| 9 | Orientation apprentissage > performance | recruitment-science.md §5 | Kanfer 2001, Van Hooft 2021 | Étayé |
| 10 | Inspection Fagan : détection par item | relecture.md | Fagan 1976 | Étayé |
| 11 | ~4 items en mémoire de travail | proof/SKILL.md (source) | Cowan 2001 | Étayé |

### Affirmations dérivées (inférences)

| # | Affirmation | Fichier | Dérivation | Statut | Action |
|---|-------|---------|------------|--------|--------|
| 12 | La lettre adresse naturellement le P-O fit | recruitment-science.md §2, cover-letter.md | Inférence : CV vers P-J, lettre vers P-O | Faiblement étayé | Qualifié avec note |
| 13 | L'accroche est le point le plus critique | recruitment-science.md §4 | Extrapolation biais d'ancrage | Faiblement étayé | Qualifié avec note |
| 14 | Les adjectifs auto-attribués sont des signaux gratuits | recruitment-science.md §1, cover-letter.md | Application de Spence | Faiblement étayé | Qualifié avec note |
| 15 | ~7 secondes pour une lettre | relecture.md (v1) | Extension non justifiée de Ladders | Non étayé | Corrigé, retiré |

### Affirmations factuelles (plateformes)

| # | Affirmation | Fichier | Source | Statut |
|---|-------|---------|--------|--------|
| 16 | Claude.ai "Ajouter depuis GitHub" | README.md | Claude Help Center | Étayé |
| 17 | ChatGPT : pas d'import GitHub | README.md | OpenAI Help Center | Étayé |
| 18 | Gemini Gems : max 10 fichiers | README.md | Google Workspace Blog | Étayé |
| 19 | Mistral Agents + Libraries | README.md | Mistral Help Center | Étayé |

### Affirmations de migration plugin (décisions D-33 à D-36)

| # | Affirmation | Fichier | Source | Statut |
|---|-------|---------|--------|--------|
| 20 | Double cible depuis `src/` via préprocesseur awk | DESIGN.md D-33 | spec 2026-04-24 §1, §3, §4 | Étayé |
| 21 | Artefacts Claude Code versionnés, pas de lifecycle hook à l'installation | DESIGN.md D-34 | spec 2026-04-24 §4 | Étayé |
| 22 | Couche navigateur via harnais Playwright local, hors sandbox, pas le MCP | DESIGN.md D-35 | spec 2026-04-24 §5, tools/linkedin-harness/README.md | Étayé |
| 23 | Suppression de version_check sur Claude Code, mises à jour par la marketplace | DESIGN.md D-36 | spec 2026-04-24 §6 | Étayé |

### Affirmations du pivot fichiers (décisions D-41 à D-45)

| # | Affirmation | Fichier | Source | Statut |
|---|-------|---------|--------|--------|
| 24 | Abandon de claude.ai, plugin Claude Code pur, claude.ai comme camisole | DESIGN.md D-41 | spec 2026-06-19 §Contexte, §Portée, memory feedback_claude_ai_camisole | Étayé |
| 25 | Stockage fichiers ancré sur le répertoire courant, sans config de chemin | DESIGN.md D-42 | spec 2026-06-19 §Architecture cible, §Modèle de stockage | Étayé |
| 26 | Layout du repo, fiche-candidat.md, tendances.md, candidatures/AAAA-MM-JJ-slug/, _a-trier.md, sites/, recherches/ | DESIGN.md D-42 | spec 2026-06-19 §Modèle de stockage, export Phase 1 | Étayé |
| 27 | Ensemble fermé des statuts de candidature | DESIGN.md D-42 | spec 2026-06-19 §Frontmatter de candidature, scripts/validate.py | Étayé |
| 28 | Sentinelle .candidature, première ligne format: 1, FORMAT_VERSION = 1 | DESIGN.md D-43 | spec 2026-06-19 §Sentinelle, scripts/init_repo.py | Étayé |
| 29 | Marqueur de gabarit `<!-- candidature:gabarit -->` testé au routage | DESIGN.md D-43 | scripts/init_repo.py, src/SKILL.md, src/references/profil.md | Étayé |
| 30 | init_repo.py idempotent scaffolde la structure, embarqué via ${CLAUDE_SKILL_DIR} | DESIGN.md D-43 | spec 2026-06-19 §Script d'initialisation, scripts/init_repo.py, src/SKILL.md | Étayé |
| 31 | validate.py signale sans corriger, non bloquant, codes 0/1/2 | DESIGN.md D-44 | spec 2026-06-19 §Validateur, scripts/validate.py, src/SKILL.md | Étayé |
| 32 | Release par plugin-dev vendu en subtree v0.2.1, plugin.json source de vérité, just release | DESIGN.md D-45 | plugin-dev/ subtree (tag v0.2.1), .claude-plugin/plugin.json, plugin-dev/release.just | Étayé |
| 33 | Hook version-guard interdit l'édition manuelle du champ version | DESIGN.md D-45 | .claude/settings.json, plugin-dev/version-guard.sh | Étayé |
| 34 | Disparition de VERSION, plugin.json.tmpl, dev-stub.md, target stripping | DESIGN.md D-45 | spec 2026-06-19 §Build et check, arbre du repo | Étayé |

### Bilan

15 affirmations académiques et dérivées étayées (dont 1 avec réserves
méthodologiques). 3 affirmations faiblement étayées, qualifiées avec notes,
inférences raisonnables documentées comme telles. 1 affirmation non étayée,
corrigée (retirée du workflow, v1). 0 affirmation non auditée.

Les quatre décisions de migration plugin (D-33 à D-36) tracent vers la
spec approuvée du 2026-04-24, D-35 aussi vers le README du harnais
LinkedIn. Toutes étayées.

Les cinq décisions du pivot fichiers (D-41 à D-45) tracent vers la spec
approuvée du 2026-06-19, le code livré (scripts/init_repo.py,
scripts/validate.py, .claude-plugin/plugin.json, plugin-dev/version-guard.sh),
le subtree plugin-dev au tag v0.2.1, et la note mémoire
feedback_claude_ai_camisole. Toutes étayées.
