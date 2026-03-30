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

L'agent vérifie en mémoire projet si une recherche précédente couvre ce type
de poste, puis lance `web_search` si rien ne correspond. Les résultats sont
stockés en mémoire projet pour réutilisation (une entrée mémoire par type
de poste).

Le critère de réutilisation est un match exact sur type de poste + secteur +
taille d'entreprise + pays. Un match approximatif est signalé au candidat
qui décide. Jamais de réutilisation silencieuse.

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

Chaque candidature est enregistrée comme une entrée de mémoire projet
(`memory_user_edits`) contenant : date, entreprise, poste, canal, axes,
statut. Le statut est mis à jour in-place (`replace`) quand le candidat
signale un retour.

Les comptes rendus d'entretien sont conversationnels. 3 niveaux (informel,
guidé, structuré) choisis au premier CR via widget. Ajustement dynamique
selon le comportement du candidat. Les apprentissages sont extraits et
stockés en mémoire projet.

L'analyse de patterns se fait en lisant les mémoires existantes, pas en
parsant des fichiers. Proposée après 5+ candidatures, jamais automatique.

L'ensemble repose sur l'orientation apprentissage plutôt que performance
(Kanfer et al., 2001, Van Hooft & Van Hoye, 2022). Le suivi extrait des
apprentissages transférables, pas des statistiques.

### FR-7 : Enrichissement continu

Le corpus de style, l'archive de recherche et les patterns de candidature
s'enrichissent au fil des candidatures. Tout est stocké en mémoire projet.

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

Le skill est un dossier de fichiers markdown. Aucune dépendance à une
plateforme. Fonctionne sur Claude.ai (projet), ChatGPT (GPT), Gemini
(Gem), Mistral (Agent), ou toute IA capable de lire du markdown.

### NFR-6 : Installation minimale

Sur Claude.ai : 4 étapes. Import GitHub (ou ZIP), upload du CV, et une
instruction projet qui force le déclenchement sur `/candidature`.
L'instruction est nécessaire parce que les fichiers importés depuis
GitHub arrivent dans le project knowledge (documents de référence
indexés), pas comme skills avec déclenchement automatique. Sans
l'instruction, rien ne garantit que le modèle cherchera SKILL.md quand
l'utilisateur tape la commande. L'instruction doit nommer l'outil
`project_knowledge_search` explicitement. « Chercher dans les fichiers
du projet » est ambigu et l'agent le confond avec une recherche
filesystem (`view /mnt/project/`). Voir D-19.

Sur les autres plateformes : coller une URL dans un chat. Pas de terminal,
pas de build, pas de config.

### NFR-7 : Stockage en mémoire projet

Le public cible ne sait pas manipuler des fichiers dans un projet IA.
Toutes les données persistantes (suivi des candidatures, préférences,
archive de recherche, patterns) sont stockées via la mémoire du projet
(`memory_user_edits`), pas dans des fichiers markdown.

Cette approche est accessible dans toutes les conversations du projet sans
manipulation. Pas de fichiers à gérer. La mémoire a un budget limité. Les
comptes rendus d'entretien détaillés sont stockés sous forme de synthèse,
pas de verbatim. Voir D-6 pour les détails.

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

Choix retenu : mémoire projet (`memory_user_edits`) pour toutes les données
persistantes. Archive de recherche, suivi des candidatures, comptes rendus,
patterns.

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
patterns (references/phase-4-suivi.md) et la réutilisation d'axes lors de candidatures similaires.

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
contextuelle (references/phase-2-preparation.md), pas une procédure séparée.
Les sources ne sont pas codées en dur.

Les sources de benchmark varient selon le pays, le secteur et le type de
poste. Coder des URLs spécifiques (Glassdoor, levels.fyi) rend le skill
fragile. L'agent recherche les sources pertinentes au moment de la
recherche.

### D-16 : Deux skills complémentaires

Supersédé par D-20, puis D-25. Un seul skill avec détection de capacités.
Le stockage persistant utilise Notion (D-25), pas la mémoire projet.

### D-17 : Cycle rappel, capture, consolidation pour les sites ATS

Choix retenu : cycle en trois temps intégré dans le skill. Mis à jour en
v0.4 pour Notion (D-25) et la hiérarchie des sources (D-28).

Le rappel (references/phase-2-soumission.md, §2.6) consulte deux sources
avant navigation. Notion est la source primaire (observations terrain
datées et versionnées). Les fichiers `references/sites/*.md` du skill
sont la source secondaire (directives consolidées). Porte `[outil]` :
l'agent consulte les deux sources même s'il pense connaître le site.

La capture (references/phase-2-soumission.md, §2.9) est une question
systématique + écriture obligatoire (même "RAS"). Chaque observation
est datée, associée à la version du skill, et porte sa source (feedback
candidat ou observation autonome de l'agent). Quand l'agent adopte un
contournement, il enregistre le problème, la solution et le résultat.
Porte `[outil]` cohérente avec D-13.

La consolidation (references/consolidation.md, différée) lit les
sous-pages Sites/ dans Notion, les déduplique, et met à jour les
fichiers `references/sites/*.md` du skill. Les observations consolidées
restent dans Notion (source primaire).

L'expérience d'intégration avec les ATS s'accumule naturellement au fil
des candidatures. Sans structuration, elle reste éparpillée dans les
conversations. La hiérarchie Notion/skill et le datage/versionnage
permettent le rappel et la consolidation systématiques.

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
`references/browser-layer.md` qui contient les instructions de navigation,
cookies, et le cycle rappel vers capture vers consolidation. Les fichiers
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
autonome. `references/phase-2-soumission.md` charge etayage.md après le
draft. L'agent découvre le protocole d'audit après avoir généré. L'isolation
des instructions est réelle même si le contexte conversationnel reste.

Littérature : StateFlow (Wu et al., 2024, Microsoft/AutoGen), FSM pour
contrôler un LLM avec des instructions différentes par état. +13-28%
succès, 3-5x moins cher que ReAct. VOXAM (2026-03), les transitions
d'état doivent être du code déterministe, pas une décision LLM.

### D-23 : Liens directs vers le .skill, pas vers la page de release

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

Supersédé par D-25. Le stockage persistant utilise Notion, pas Filesystem.

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

Les fichiers de phase sont : phase-1-profil.md, phase-2-preparation.md,
phase-2-soumission.md, phase-3-relecture.md, phase-4-suivi.md.

Écarté : garder SKILL.md avec des directives de chargement partiel (le
modèle ne respecte pas de manière fiable les instructions de ne pas lire
ce qui est déjà dans son contexte).

### D-25 : Notion requis, pages imbriquées comme stockage

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

### D-27 : Contrôle d'écriture backend (references/backend-write.md)

Choix retenu : implémenté (v0.4).

Avant toute écriture vers un backend externe (Notion, Filesystem), l'agent
explore la cible et génère une procédure d'écriture. La procédure n'existe
pas avant l'exploration. Ce mécanisme empêche l'agent d'écrire vers un
backend qu'il ne connaît pas, avec une structure qu'il invente.

Le problème fondateur est le même que D-18 (étayage après le draft) :
un agent qui planifie une écriture dans l'abstrait produit une structure
plausible mais déconnectée de la réalité du backend. L'exploration force
la découverte de la structure existante avant toute modification.

La procédure est un artifact conversationnel, pas un fichier persistant.
Elle est générée, validée par l'utilisateur, exécutée, puis jetée. Le
fichier backend-write.md contient les instructions pour générer la
procédure, pas la procédure elle-même.

Écarté : écriture directe avec instructions codées en dur (fragile, ne
s'adapte pas aux structures Notion de chaque utilisateur). Procédure
persistante (la structure Notion peut changer entre deux sessions).

### D-28 : Hiérarchie des sources sites (Notion primaire, skill secondaire)

Choix retenu : implémenté (v0.4).

Notion contient les observations terrain, datées et associées à la
version du skill utilisée. Les fichiers `references/sites/*.md` du skill
contiennent les directives consolidées. Notion prévaut en cas de
divergence. À la mise à jour du skill, les notes Notion sont comparées
aux fichiers de référence (eux aussi datés et versionnés) pour détecter
les divergences. Les directives du skill ne font pas double emploi avec
les observations Notion.

Cette séparation résout le problème de la consolidation (D-17) : les
observations terrain sont vivantes dans Notion, les directives du skill
sont stables et versionnées. La mise à jour du skill est le moment de
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

### D-30 : Archivage restructuré (propriétés + prose sur page candidature)

Choix retenu : implémenté (v0.4). Supersède D-12.

La sous-page résumé est supprimée. Les champs factuels (date de
soumission, canal, plateforme, prétentions salariales) sont des
propriétés de la page candidature Notion. Les champs analytiques (axes
retenus, accroche, ton) sont un court paragraphe de prose dans la page
candidature. Les brouillons restent dans leurs sous-pages.

La distinction est entre contenu (sous-pages de brouillon) et
métadonnées (page candidature). Les champs factuels sont partagés entre
tous les brouillons, les monter en propriétés évite l'arbitraire de les
rattacher à un brouillon particulier.

Écarté : sous-page résumé dédiée (D-12, trop de métadonnées pour
justifier une sous-page). Résumé en tête du brouillon (arbitraire quand
il y a plusieurs brouillons).

### D-31 : Clôture comme checkpoint d'enregistrement

Choix retenu : implémenté (v0.4).

La clôture n'est pas un message de fin. C'est un checkpoint qui force
l'agent à vérifier que tout est archivé dans Notion avant de proposer
un nouveau chat. Si un élément manque, l'agent demande au candidat avant
de créer la page.

Le contexte conversationnel (échanges, corrections, décisions en temps
réel) ne sera plus accessible dans un nouveau chat. Tout ce qui doit
être retrouvé plus tard doit être dans Notion avant la clôture. Cette
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
  VERSION
  TODO.md
  scripts/
    version_check.py
  references/
    phase-1-profil.md
    phase-2-preparation.md
    phase-2-soumission.md
    phase-3-relecture.md
    phase-4-suivi.md
    recruitment-science.md
    cover-letter.md
    cv-handling.md
    review-items.md
    feedback-tracking.md
    interview-prep.md
    etayage.md
    backend-write.md
    browser-layer.md
    consolidation.md
    sites/
      smartrecruiters.md
      teamtailor.md
      wttj.md
      linkedin.md
  build/
    build.sh
    dispatcher.md
    dev-stub.md
```

Les fichiers de phase dans references/ remplacent le workflow monolithique
SKILL.md (D-24). Le dispatcher charge une phase à la fois. Le stockage
persistant est dans Notion (D-25), pas en mémoire projet.

---

## Portes du workflow, état actuel

Toutes les portes ont été résolues dans la version courante des fichiers
de phase. Conservé comme référence historique.

| Section | Porte initiale | Résolution |
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
| 10 | Inspection Fagan : détection par item | phase-3-relecture.md | Fagan 1976 | Étayé |
| 11 | ~4 items en mémoire de travail | proof/SKILL.md (source) | Cowan 2001 | Étayé |

### Affirmations dérivées (inférences)

| # | Affirmation | Fichier | Dérivation | Statut | Action |
|---|-------|---------|------------|--------|--------|
| 12 | La lettre adresse naturellement le P-O fit | recruitment-science.md §2, cover-letter.md | Inférence : CV vers P-J, lettre vers P-O | Faiblement étayé | Qualifié avec note |
| 13 | L'accroche est le point le plus critique | recruitment-science.md §4 | Extrapolation biais d'ancrage | Faiblement étayé | Qualifié avec note |
| 14 | Les adjectifs auto-attribués sont des signaux gratuits | recruitment-science.md §1, cover-letter.md | Application de Spence | Faiblement étayé | Qualifié avec note |
| 15 | ~7 secondes pour une lettre | phase-3-relecture.md (v1) | Extension non justifiée de Ladders | Non étayé | Corrigé, retiré |

### Affirmations factuelles (plateformes)

| # | Affirmation | Fichier | Source | Statut |
|---|-------|---------|--------|--------|
| 16 | Claude.ai "Ajouter depuis GitHub" | README.md | Claude Help Center | Étayé |
| 17 | ChatGPT : pas d'import GitHub | README.md | OpenAI Help Center | Étayé |
| 18 | Gemini Gems : max 10 fichiers | README.md | Google Workspace Blog | Étayé |
| 19 | Mistral Agents + Libraries | README.md | Mistral Help Center | Étayé |

### Bilan

15 affirmations étayées (dont 1 avec réserves méthodologiques). 3
affirmations faiblement étayées, qualifiées avec notes, inférences
raisonnables documentées comme telles. 1 affirmation non étayée, corrigée
(retirée du workflow, v1). 0 affirmation non auditée.
