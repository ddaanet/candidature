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
- D-17 : Canal de remontée vers le repo — reporté.

---

## À faire (prochaine session)

### DESIGN.md

- [ ] Ajouter D-12 à D-17 dans les décisions de conception
- [ ] Mettre à jour la structure du livrable (ajouter interview-prep.md)
- [ ] Mettre à jour le tableau des portes SKILL.md (certaines résolues)

### SKILL.md

- [ ] Vérifier que §2.2 mentionne le benchmark salarial comme dimension
      de la recherche contextuelle
- [ ] Archivage artefact : dans §2.6, après génération et relecture,
      l'entrée `candidature:` est enrichie avec le résumé structuré
      (axes, accroche, ton, prétentions)

### Portes mémoire (points d'écriture concrets)

Liste exhaustive des moments où le skill écrit en mémoire :

| Moment | Préfixe | Action | Ancrage |
|--------|---------|--------|---------|
| §2.1 Offre analysée | `shortlist:` | `add` | `[outil]` |
| §2.1 Candidater sur shortlist | `candidature:` | `replace` shortlist | `[outil]` |
| §2.2 Recherche contextuelle | `recherche:` | `add` (y compris "rien trouvé") | `[outil]` |
| §2.6 Champ prétentions | — | consulter cache `recherche:` | `[outil: web_search]` |
| §2.6 Après génération+relecture | `candidature:` | `replace` (résumé) | `[outil]` |
| §3.5 Corpus enrichi | — | lettre ajoutée aux exemples | `[choix]` |
| §4.1 Retour candidature | `candidature:` | `replace` statut | `[outil]` |
| §4.2 CR entretien | `entretien:` | `add` | conversation |
| §4.3 Pattern identifié | `tendance:` | `add` | `[choix]` |

### Axes d'évolution (DESIGN.md)

- [ ] Ajouter : candidature-desktop (séparation confirmée D-16)
- [ ] Ajouter : canal de remontée vers le repo (reporté D-17)
- [ ] Ajouter : simulation d'entretien (extension interview-prep.md)
