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

1. Télécharger [`candidature.skill`](https://github.com/ddaanet/candidature/releases/latest)
2. Dans Claude.ai, aller dans **Paramètres** → **Personnaliser** → **Skills**
3. Uploader le fichier `.skill`
4. Créer un **Projet**, y uploader votre CV (DOCX de préférence)
5. Ouvrir un chat dans le projet et taper `/candidature`

C'est tout. Pas besoin d'instructions spéciales dans le projet.

## Mises à jour

Le skill vérifie automatiquement si une version plus récente est
disponible sur GitHub. Si c'est le cas, il vous le signale avec un lien
vers le téléchargement. Il suffit de réinstaller le nouveau `.skill`.

## Pour commencer

L'assistant commence par votre profil — quelques minutes de conversation
pour comprendre votre parcours, vos contraintes et vos objectifs.

Ensuite, apportez une offre ou plusieurs — l'assistant analyse
l'alignement avec votre profil et vous aide à prioriser.

## Mode développement

Pour les contributeurs qui modifient le skill activement. Nécessite le
[MCP Filesystem](https://modelcontextprotocol.io/docs/concepts/transports)
connecté au répertoire du repo.

Dans un chat du projet, dire « mode dev » — le skill demande le chemin
du repo et bascule. Il lira les instructions directement depuis le
filesystem au lieu de la version installée.

Pour revenir à la version installée : « mode normal ».

## Claude Desktop (navigateur)

Pour utiliser le workflow avec contrôle du navigateur (remplissage de
formulaires, navigation sur les sites carrière) :

1. Télécharger [`candidate-desktop.skill`](https://github.com/ddaanet/candidature/releases/latest)
2. Installer dans Claude Desktop
3. Connecter Claude in Chrome et le MCP Filesystem

Le skill desktop hérite de toute la méthodologie et ajoute les
instructions de navigation par site (SmartRecruiters, Teamtailor,
WTTJ, LinkedIn...).

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
desktop/
  SKILL.md                    — Couche navigateur (Claude Desktop)
  references/
    consolidation.md           — Processus de consolidation (groundé)
    sites/*.md                — Contraintes par plateforme ATS
build/
  build.sh                    — Assemblage des deux .skill + release
  dispatcher.md               — Point d'entrée installé dans le .skill
```

## Licence

MIT
