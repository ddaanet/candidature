# Modifications à appliquer — candidature skill

Maintenu à jour en cours de session.

---

## Terminé (session 2026-03-17)

- [x] Renommer "claim" → "affirmation", grounded → étayé (DESIGN.md)
- [x] Passe d'étayage §2.6 — bloc visible avant génération
- [x] Critère Étayage ajouté dans grille de relecture §3.4
- [x] Restructure Phase 4 — retours en langage naturel §4.1
- [x] Entretien = prep + debrief §4.2, feedback-tracking.md allégé
- [x] Créer references/interview-prep.md — négociation salariale étayée
      (Ames & Mason 2015)
- [x] Shortlist comme buffer d'analyse comparative §2.1
- [x] Fourchette salariale collectée en §1.2
- [x] Règle d'expiration cache : <3 mois OK, 3-6 signaler, >6 périmée
- [x] Plateformes adaptées au profil (pas de liste en dur) §2.1
- [x] CLAUDE.md : commits par unité cohérente, terminologie, contrainte
      Opus
- [x] README.md recentré claude.ai
- [x] Remote GitHub configuré, push effectué

---

## Décisions prises (à documenter dans DESIGN.md)

- D-12 : Archivage artefacts — résumé structuré en mémoire `candidature:`
  (pas texte intégral). `conversation_search` pour retrouver le texte.
- D-13 : Porte mémoire — toujours `add` sur chemin autonome (y compris
  quand rien trouvé = décision de typologie). Chemin interactif = la
  conversation suffit.
- D-14 : Shortlist → candidature — `replace` au lancement de la Phase 2.
- D-15 : Recherche salariale = dimension de §2.2 (recherche contextuelle),
  pas procédure séparée. Sources pas codées en dur.
- D-16 : Deux skills complémentaires — `candidature` (claude.ai) et
  `candidature-desktop` (Claude Desktop). Séparation confirmée.
- D-17 : Cycle rappel → capture → consolidation pour sites ATS.
  Préfixe `site:`, fondé sur pattern codify d'agent-core.

---

## Terminé (session 2026-03-18)

- [x] §2.6 : inverser l'ordre — draft d'abord, étayage ensuite (D-18)
- [x] D-18 ajoutée dans DESIGN.md
- [x] Instruction projet : nommer `project_knowledge_search`
      explicitement (D-19, README.md, DESIGN.md NFR-6)

---

## Terminé (session 2026-03-20)

Plan de 11 items (passation 2026-03-20) appliqué en une passe.

### SKILL.md

- [x] Item 1 — §2.1 Canal ATS direct, recommander si nettement supérieur
- [x] Item 2 — §2.6 Lecture des libellés de champs avant rédaction
- [x] Item 3 — Contre-exemple : correction acquiescée sans reformulation
- [x] Item 5 — §2.6 Étayage Spence : double audit véracité + signal
- [x] Item 6 — §2.6 Archivage `candidature:` après relecture
- [x] Item 7 — §2.2 Benchmark salarial comme dimension de recherche

### cover-letter.md

- [x] Item 4a — Section "Ton et formalité" (registre entreprise)
- [x] Item 4b — Point-virgule dans signaux de prose artificielle

### recruitment-science.md + interview-prep.md

- [x] Item 11 — Cui et al. 2025 dans §1 Spence
- [x] Item 11 — Contexte entretien 2025-2026 (présentiel ↑, évaluation IA)

### DESIGN.md

- [x] Item 8 — D-12 à D-17 documentées
- [x] Item 9 — interview-prep.md dans structure du livrable
- [x] Item 10 — Tableau des portes SKILL.md mis à jour (✅ résolues)

---

## Terminé (session 2026-03-23)

v0.2.1 : Extraction étayage + feedback Alma/GitGuardian.

### SKILL.md

- [x] Item 1 — §2.6 Étayage extrait dans `references/etayage.md`
      (isolation des instructions, D-22). L'agent charge le protocole
      après avoir généré le draft.
- [x] Item 6 — §2.6 Chemin "pas de LM" explicité (formulaire sans
      champ texte libre)

### cover-letter.md

- [x] Item 2 — Accroche P-O factuelle, pas narrative (anti-pattern
      GitGuardian)
- [x] Item 3 — "La lettre n'est pas un résumé du CV" (P-J en une
      phrase, laisser le CV faire)
- [x] Item 4 — Signaux IA : ton défensif sur écarts, labels de
      paragraphes

### browser-layer.md

- [x] Item 5 — Ouverture directe de page via Chrome quand connecté

### DESIGN.md

- [x] D-22 documentée (extraction étayage, référence StateFlow)
- [x] Structure du livrable mise à jour (etayage.md ajouté)

---

## À faire

### Nettoyage style contamination (CLAUDE.md, section dédiée)

Tous les fichiers du skill utilisent des emdashes, des patterns
"**Label:** contenu", des fragments. Le style des instructions
contamine le style de sortie de l'agent. Nettoyage fichier par
fichier, par ordre de risque de contamination :

- [x] references/cover-letter.md (v0.2.1)
- [x] references/etayage.md (v0.2.1, nouveau fichier)
- [ ] SKILL.md (prioritaire, lu à chaque candidature)
- [ ] references/recruitment-science.md
- [ ] references/feedback-tracking.md
- [ ] references/interview-prep.md
- [ ] references/review-items.md
- [ ] references/cv-handling.md
- [ ] references/browser-layer.md
- [ ] references/consolidation.md
- [ ] CLAUDE.md (instructions dev, moins critique)
- [ ] DESIGN.md (document de conception, moins critique)

### Portes mémoire (points d'écriture concrets)

Liste exhaustive des moments où le skill écrit en mémoire :

| Moment | Préfixe | Action | Ancrage |
|--------|---------|--------|---------|
| §2.1 Offre analysée | `shortlist:` | `add` | `[outil]` |
| §2.1 Candidater sur shortlist | `candidature:` | `replace` shortlist | `[outil]` |
| §2.2 Recherche contextuelle | `recherche:` | `add` (y compris "rien trouvé") | `[outil]` |
| §2.6 Rappel site | `site:` | lecture mémoire projet (contexte) | `[état]` |
| §2.6 Champ prétentions | — | consulter cache `recherche:` | `[outil: web_search]` |
| §2.6 Après génération+relecture | `candidature:` | `replace` (résumé) | `[outil]` |
| §2.6 Capture site | `site:` | `add` ou `replace` après soumission | `[outil]` |
| §3.5 Corpus enrichi | — | lettre ajoutée aux exemples | `[choix]` |
| §4.1 Retour candidature | `candidature:` | `replace` statut | `[outil]` |
| §4.2 CR entretien | `entretien:` | `add` | conversation |
| §4.3 Pattern identifié | `tendance:` | `add` | `[choix]` |

### D-17 : Cycle rappel → capture → consolidation (terminé 2026-03-21)

- [x] Lire agent-core (ground, codify, memory-index, reflect) pour
      fondement structurel
- [x] Préfixe `site:` pour les retours d'intégration ATS
- [x] Prototype : 4 entrées `site:` écrites en mémoire projet
      (Teamtailor, LinkedIn, WTTJ, SmartRecruiters) — minage des
      conversations passées, auteur comme premier utilisateur
- [x] Rappel (§2.6 SKILL.md) : consultation obligatoire avant rédaction
- [x] Capture (§2.6 SKILL.md) : question + écriture après soumission
- [x] D-17 mise à jour dans DESIGN.md (reporté → résolu)
- [x] Création desktop/SKILL.md + desktop/references/sites/
- [x] Consolidation prototype : 4 fichiers sites écrits depuis minage
      des conversations passées (transfert direct MCP Filesystem)
- [ ] Médium de remontée pour utilisateurs externes (GitHub? Google
      Forms? autre?) + processus de validation (prompt injection,
      qualité)

### Dispatcher unique + détection plateforme

- [ ] Fusionner en un seul .skill avec dispatcher unique
- [ ] Détection 3 modes : claude.ai (pas de MCP) / Desktop sans
      extensions (MCP présent, Chrome/Filesystem absents → suggérer) /
      Desktop complet
- [ ] Renommer SKILL.md → workflow.md, desktop/SKILL.md →
      desktop/orchestration.md

### Archivage candidatures sur Filesystem (Desktop)

- [ ] Concevoir le stockage structuré des candidatures en fichiers
      (textes complets, CR détaillés, historique) pour le mode Desktop
- [ ] Définir la relation avec la mémoire projet (source de vérité ?
      duplication ? condensation vers mémoire ?)

### Axes d'évolution (DESIGN.md)

- [ ] Ajouter : candidate-desktop (séparation confirmée D-16)
- [ ] Ajouter : simulation d'entretien (extension interview-prep.md)

### Hors repo candidature

- [ ] Mettre à jour brief-*.skill pour claude.ai (conversations
      antérieures accessibles par RAG seulement, pas d'accès direct
      au log de session)
- [ ] Mettre à jour ddaa.net (page d'accueil / section candidature)
