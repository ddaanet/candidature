# À faire

### Triage inbox du 2026-09-26

Sources : `inbox/brief-correctifs-candidature-2026-08-27.md`,
`inbox/brief-harnais-candidature-2026-09-13.md`, scripts joints dans
`inbox/harnais-2026-09-13/`, et `../Emploi/correctifs.md` (détail par entrée
datée). Ordre : lot 1, lot 2, lots 3 à 5, lot 6. Une entrée de
`correctifs.md` intégrée en sort, côté session Emploi.

- [x] Lot 1, défauts du harnais. `decide --action shortlist` sans `--record`
  plante en TypeError (`walk.mjs`, `loadRecord(undefined)`), refus explicite
  et test. `attach.mjs` reprend `ctx.pages()[0]` (brouillon InMail perdu le
  2026-09-13), ouvrir un onglet propre par `/json/new`. Supprimer la
  découverte de `streams.mjs`, documenter `recommended` et `top-applicant`.
  `dismiss --jobId` sur carte shortlistée : sonder `/jobs/view/<id>/` en
  direct. Le Dismiss n'existe que dans la liste du flux (carte traitée), une
  carte que le flux ne rend plus ne peut plus être marquée. README réaligné
  sur les fichiers
  (plus de `NOTION_TOKEN`, `--root` racine du repo de données, `slug` dans
  l'exemple JSON, `--record` obligatoire).
- [x] Lot 2, outils navigateur multi-agents. `tab.mjs` et `cdp.mjs` dans le
  harnais avec entrées npm, `tab.mjs open` par `PUT /json/new`. Dans
  `site-ouverture-playwright.md` : onglets nommés, cible morte et registre,
  iframes tiers qui font expirer `connectOverCDP`, iframe de même site par
  `uniqueContextId`, prospection LinkedIn avant les remplissages, sortie
  proxy du navigateur vérifiée avant de conclure à un blocage d'IP.
  `show.mjs` abandonné.
- [x] Lot 3, règles de préparation et de soumission. `preparation.md` §2.2 :
  contrôle d'entrée (offre vivante, canal direct, salaire contre plancher),
  annonce dépliée et grille lue dans le corps, prérequis obligatoires lus
  dans la structure, éligibilité lue chez l'employeur, sourcing ancien
  vérifié chez l'employeur, republication détectée par entreprise et titre.
  `soumission.md` §2.6 : contrôles optionnels visibles, champs invisibles
  jamais remplis, limites lues à l'écran, CAPTCHA cherché dans le HTML,
  l'API ne dispense pas de l'écran, état des champs lu avant remplissage
  sans écraser la saisie du candidat. Nouvelle étape d'envoi : clic final au
  candidat, saisie manuelle au deuxième refus anti-spam, `shortlist` jusqu'à
  « envoyé ». Offre et formulaire à l'écran avant relecture. §2.8 groupes
  Experience et Education. `cover-letter.md` sans ouverture nommant le
  poste. `etayage.md` source fiche vérifiée par lecture effective.
  `suivi.md` boîte de réception avant relance.
- [x] Lot 4, orchestration par sous-agents. `references/orchestration.md`,
  renvoi dans SKILL.md, décision D-47. Navigateur aux sous-agents, rédaction
  dans le fil principal, brief type, rapport long en fichier, `/json/list`
  vérifié en fin de sous-agent.
- [x] Lot 5, adaptation du CV sur le flux pratiqué. `adaptation-cv.md`
  réécrit : expansion XML versionnée, PDF rendu et nombre de pages mesurés
  avant toute proposition. python-docx retiré. `pack-cv.py` devenu
  `scripts/cv_docx.py` en stdlib (unpack, pack, render avec garde contre le
  PDF périmé), décision D-48.
- [ ] Lot 6, consolidation des fiches sites (`references/consolidation.md`)
  depuis `../Emploi/sites/`. Créer `ashby.md`, `greenhouse.md`, `lever.md`,
  enrichir `linkedin.md`, `wttj.md`, `teamtailor.md`. Plateforme seulement.

Écartés : `walk.mjs check --jobId` (backlog), `welcomekit-frame.mjs`,
`cvtry.py` tel quel, budgets de caractères du CV, méthode Notion
`loadPageChunk`, qui restent dans Emploi.

### Migration Notion vers fichiers locaux

La Phase 1 est livrée. L'arbre Notion Recherche d'emploi est exporté vers le
repo local Emploi par l'outil tools/notion-export, soit 29 candidatures avec
leur frontmatter de statut, 38 passations figées, 15 fiches Sites et 6 notes
de recherche. La Phase 2, qui fait lire au skill candidature les fichiers
locaux au lieu de l'API Notion, reste à planifier et aura son propre plan.

### Correctifs migrés depuis Notion

Déclencher un handoff après envoi de candidature, c'est le meilleur point de
reset. Le contexte est plein et le travail bascule en attente de réponse.

### Médium de remontée utilisateurs externes (D-17)

Comment les utilisateurs du skill public remontent des observations sur
les sites ATS. GitHub Issues, Google Forms, autre chose. Processus de
validation (prompt injection, qualité).

- [ ] Choisir le médium
- [ ] Documenter le processus de validation

### Simulation d'entretien

Extension de preparation-entretien.md. Exercice interactif de préparation.

- [ ] Concevoir le format (conversationnel, scénarisé, mixte)
