# /candidature — Des candidatures qui ne sonnent pas comme de l'IA

Demander à une IA « écris-moi une lettre de motivation » produit un texte
générique, interchangeable, que le recruteur identifie en 3 secondes.

Cette méthode transforme l'IA en assistant de candidature qui connaît votre
parcours, recherche ce qui est attendu pour chaque poste, rédige dans
votre voix, vérifie chaque fait contre votre CV, et s'améliore au fil
de vos candidatures.

Fonctionne pour tout métier et tout niveau. Fondé sur la recherche en
psychologie du recrutement.

## Ce que ça fait

1. **Profil** — L'assistant apprend votre parcours à partir de votre CV
   et d'une conversation courte
2. **Analyse** — Pour chaque offre, il recherche les conventions du
   secteur, analyse l'alignement avec votre profil, et identifie vos
   points de différenciation
3. **Rédaction** — Lettre de motivation, réponses formulaire, CV adapté
   — chaque affirmation est vérifiée avant d'écrire
4. **Relecture** — Revue point par point avant envoi, dans votre voix
5. **Suivi** — Retours, comptes rendus d'entretien, tendances sur
   plusieurs candidatures

## Installation (Claude.ai)

1. Télécharger [`candidature.skill`](https://github.com/ddaanet/candidature/releases/latest/download/candidature.skill)
2. Dans Claude.ai, aller dans **Paramètres** → **Personnaliser** → **Skills**
3. Uploader le fichier `.skill`
4. Créer un **Projet**, y uploader votre CV (DOCX de préférence)
5. Ouvrir un chat dans le projet et taper `/candidature`


## Mises à jour

Le skill vérifie automatiquement si une version plus récente est
disponible sur GitHub. Si c'est le cas, il vous le signale avec un lien
vers le téléchargement. Télécharger le fichier et le réimporter dans le projet.

## Pour commencer

L'assistant commence par votre profil — quelques minutes de conversation
pour comprendre votre parcours, vos contraintes et vos objectifs.

Ensuite, apportez une offre ou plusieurs — l'assistant analyse
l'alignement avec votre profil et vous aide à prioriser.

## Navigateur (Chrome)

Si Claude in Chrome est connecté, le skill détecte automatiquement la
capacité et charge les instructions de navigation par site
(SmartRecruiters, Teamtailor, WTTJ, LinkedIn...).

## Mode développement

Pour les contributeurs qui modifient le skill activement. Nécessite le
MCP Filesystem connecté au répertoire du repo.

1. Installer `candidature-dev.skill` (dans `dist/`, non releasé)
2. Ajouter en mémoire projet : `candidature: dev — <chemin du repo>`
3. Le stub charge le workflow depuis le repo local

## Contenu

```
SKILL.md                      — Méthode complète (4 phases)
references/
  recruitment-science.md      — Fondements scientifiques
  cover-letter.md             — Principes de rédaction
  cv-handling.md              — Modification de CV (DOCX)
  review-items.md             — Découpage pour la relecture
  feedback-tracking.md        — Suivi et comptes rendus d'entretien
  interview-prep.md           — Préparation d'entretien et négociation
  etayage.md                  — Protocole d'audit des affirmations
  browser-layer.md            — Couche navigateur (Chrome)
  consolidation.md            — Processus de consolidation (groundé)
  sites/*.md                  — Contraintes par plateforme ATS
build/
  build.sh                    — Assemblage des .skill + release
  dispatcher.md               — Dispatcher public
  dev-stub.md                 — Stub de développement
```

## Licence

MIT
