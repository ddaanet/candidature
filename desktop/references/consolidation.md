# Consolidation des retours d'expérience site

**Grounding : Moderate** — Runbook evolution cycle (AWS Well-Architected
Operational Excellence ; incident.io ; PagerDuty) + pattern codify
d'agent-core (staging → maturation → consolidation).

Processus pour transférer les observations de la mémoire projet (entrées
`site:`) vers les fichiers de référence (`desktop/references/sites/`).

---

## Fondement

Les procédures opérationnelles évoluent par boucle de feedback : exécuter,
capturer, améliorer. Les runbooks (procédures pas-à-pas pour des tâches
opérationnelles récurrentes) suivent un cycle documenté dans la littérature
DevOps : documenter → valider par l'usage → améliorer → éventuellement
automatiser. Le principe clé : capturer ce qui se passe avant de chercher
à améliorer la procédure.

Dans notre contexte, les fichiers de référence par site sont les runbooks.
Chaque candidature sur un site est une exécution. La capture après
soumission (entrée `site:` en mémoire) est le feedback loop. La
consolidation transfère les observations validées dans la procédure
permanente.

Le pattern codify d'agent-core fournit la mécanique de maturation :
les observations en staging (mémoire projet) doivent être validées par
l'usage avant d'être promues en documentation permanente (fichier de
référence). Ce critère évite de consolider des observations ponctuelles
ou erronées.

---

## Rôles

- **Staging** — Mémoire projet, entrées préfixées `site:`. Observations
  brutes, datées, liées à une candidature source. Équivalent du
  `agents/learnings.md` d'agent-core.
- **Référence** — `desktop/references/sites/<plateforme>.md`. Procédure
  consolidée et structurée. Équivalent des fichiers
  `agents/decisions/*.md` d'agent-core.

---

## Critères de maturation

Une entrée `site:` est éligible à la consolidation quand elle remplit
les trois critères (adaptés de codify, §Learnings Quality Criteria) :

1. **Validée par l'usage** — L'observation a été confirmée lors d'au
   moins une candidature ultérieure (le rappel a servi et l'observation
   était toujours vraie). Équivalent du critère d'âge de codify (≥7
   jours actifs), adapté au rythme des candidatures.
2. **Stabilité** — L'observation n'a pas été contredite par une
   expérience plus récente sur le même site. Un site peut changer son
   frontend — l'observation doit être encore valide.
3. **Généralité** — L'observation concerne la plateforme (ATS), pas une
   offre ou un employeur spécifique. Critère tiré de codify :
   "principle-level (consolidate)" vs "incident-specific (reject/revise)".

Une entrée « RAS » n'est jamais consolidée — elle confirme l'absence de
problème, utile en staging (le rappel sait que le site a été visité sans
incident) mais pas en référence.

---

## Processus

### 1. Inventaire `[état]`

Lire toutes les entrées `site:` en mémoire projet. Grouper par
plateforme. Afficher le résultat.

### 2. Évaluation `[état]`

Pour chaque entrée, vérifier les trois critères de maturation. Trois
verdicts :

- **Consolider** — Critères remplis.
- **Garder** — Observation récente, pas encore validée, ou incertaine.
  Reste en staging.
- **Supprimer** — Contredite par une observation plus récente, ou
  spécifique à un employeur.

Afficher le verdict par entrée.

### 3. Intégration `[outil: view + Filesystem:edit_file]`

Pour chaque observation à consolider :

- Si le fichier `desktop/references/sites/<plateforme>.md` existe :
  lire (`view`), intégrer l'observation dans la section appropriée,
  écrire (`edit_file`). Fusionner avec le contenu existant — pas
  d'ajout en vrac.
- Si le fichier n'existe pas : le créer avec la structure standard
  (voir §Structure).
- Ajouter une ligne dans la section Historique (date, entreprise
  source, observation).

**Framing rule** (ground) : formuler chaque contrainte comme un
principe général (« les shadow DOM encapsulent les champs de
formulaire ») suivi de l'instance projet (« observé sur
SmartRecruiters, candidature Dailymotion 2026-03-19 »). Le principe
est transférable ; l'instance est la preuve.

### 4. Nettoyage `[outil: memory_user_edits remove]`

Supprimer de la mémoire projet les entrées consolidées. Garder les
entrées non éligibles.

### 5. Vérification `[état]`

Relire le fichier de référence. Vérifier :

- Pas de doublon entre sections
- Cohérence des contournements (un contournement plus récent remplace
  un ancien)
- Historique à jour
- Framing : chaque contrainte suit le pattern général → instance

### 6. Commit

Un commit thématique par plateforme. Message :
`📝 consolider site: <plateforme> → desktop/references/sites/`

---

## Structure des fichiers de référence

Un fichier par plateforme ATS/agrégateur (pas par employeur).

```markdown
# <Nom de la plateforme>

## Approche
DOM / visuelle / mixte. Résumé en une phrase.

## Contraintes techniques
Observations factuelles. Chaque contrainte = principe général + instance
observée.

## Formulaire
Structure type, champs, particularités.

## Upload CV
Mécanisme, chemins autorisés, contournements.

## Cookies / Consentement
Comportement observé, boutons à cibler.

## Contournements
Solutions validées, classées par problème.

## Historique
Date, entreprise, observation — traçabilité des entrées consolidées.
```

---

## Niveaux de maturité

Adapté du modèle à trois niveaux de la littérature runbook (Squadcast,
AWS Well-Architected) :

1. **Manuel** — Entrées `site:` en mémoire, rappel par l'agent avant
   interaction. L'agent lit et adapte. C'est l'état actuel.
2. **Documenté** — Fichiers de référence consolidés. L'agent lit la
   procédure et l'exécute. Le fichier de référence est le runbook.
3. **Automatisé** — Procédures scriptées par site (scripts de navigation,
   sélecteurs validés, séquences de remplissage). Pas encore pertinent —
   les sites changent trop souvent et l'IA de navigation s'améliore
   rapidement.

Le passage d'un niveau au suivant se fait par accumulation d'expérience
et validation par l'usage, pas par décision arbitraire.

---

## Médium de remontée (futur)

**État actuel :** Transfert direct via MCP Filesystem. L'auteur est
contributeur et utilisateur.

**À définir pour les utilisateurs externes :**
- Médium : GitHub Issues ? Google Forms ? Autre ?
- Processus de validation : prompt injection, qualité factuelle,
  généralité (pas d'observation spécifique à un employeur)
- Format de soumission : structuré (template) vs libre
- Anonymisation : les noms d'entreprise dans l'historique sont-ils
  partagés ou supprimés ?

Reporté — pas d'utilisateurs externes pour le moment.

---

## Sources

### Externes

- **AWS Well-Architected — Operational Excellence Pillar** (OPS07-BP03).
  Runbooks comme procédures pas-à-pas évoluant par feedback loops.
  https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_ready_to_support_use_runbooks.html
- **incident.io — What are runbooks**. Continuous improvement through
  feedback loops : évaluer, identifier, incorporer, partager.
  https://incident.io/blog/what-are-runbooks
- **PagerDuty — What is a Runbook**. Les runbooks sont dynamiques —
  « constantly evolving with product and process changes ».
  https://www.pagerduty.com/resources/automation/learn/what-is-a-runbook/
- **upstat.io — Automating Runbook Execution**. « Before automating
  execution, automate tracking. » Capturer avant d'améliorer.
  https://upstat.io/blog/automating-runbook-execution

### Internes (agent-core)

- **codify/SKILL.md** — Cycle staging → maturation → consolidation.
  Critères de maturité (âge, validation, généralité). Format learning.
- **ground/SKILL.md** — Diverge-converge, framing rule (général →
  instance), grounding quality labels.
- **codify/references/learnings.md** — Patterns de consolidation
  spécifiques au domaine.
