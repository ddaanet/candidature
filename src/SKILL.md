---
name: candidature
description: >-
  Candidature assistée : postuler, lettre de motivation, CV adapté,
  relecture, suivi des retours. Se déclenche sur "/candidature",
  "candidature", "postuler", "lettre de motivation", "adapter mon CV",
  "refus", "rejeté", "compte rendu entretien", "debrief", ou sur une
  offre d'emploi à traiter.
---

# Candidature, dispatcher

Version: {{VERSION}}

Point d'entrée. Vérifie le repo de données, détecte les capacités,
charge la phase appropriée.

## 1. Vérification du repo de données

Le travail s'appuie sur un repo de données local. Le reducer rend le verdict de
préparation du repo.

    python3 "${CLAUDE_SKILL_DIR}/scripts/dispatch.py" status

La sortie nomme l'état du repo. prêt, continuer. non initialisé, le répertoire
est vierge, proposer la création de la structure de départ. à adopter, un dossier
candidatures existe sans la marque de format, proposer l'enregistrement sans
toucher aux données. format trop récent, demander la mise à jour du skill et
s'arrêter.

> Ce dossier n'est pas encore un repo de candidatures. Je peux créer la structure de départ (dossiers candidatures, sites, recherches, et une fiche candidat vide). On y va ?

> Ce dossier contient déjà des candidatures mais pas la marque de format que le skill attend. Je peux l'enregistrer en ajoutant cette marque, sans toucher à tes données. On y va ?

> Ce repo utilise un format plus récent que ce skill. Mettre à jour le skill candidature, puis relancer.

Sur accord de création ou d'adoption, lancer
`python3 "${CLAUDE_SKILL_DIR}/scripts/init_repo.py"` puis continuer. Sinon,
s'arrêter.

## 2. Détection du navigateur

La couche navigateur passe par le harnais Playwright local décrit dans
`references/site-ouverture-playwright.md`. Charger ce fichier. Les
fichiers `references/sites/*.md` sont chargés à la demande par les
phases (rappel avant navigation sur un site).

## 3. Lecture de l'index des candidatures

L'index n'est pas stocké. La sortie de `status` ci-dessus porte le tableau des
candidatures régénéré depuis les frontmatter, et les anomalies de métadonnées.
Présenter les anomalies au candidat sans interrompre le travail. Une anomalie est
un signalement, pas un blocage.

## 4. Boucle de routage

Le contrôle de flux vit dans le reducer, pas dans cet agent. À chaque point de
décision, interroger le reducer et suivre son instruction. Ne pas décider du
routage par raisonnement.

Interpréter la demande du candidat en un jeton d'intention. feedback pour un
retour à traiter. offer pour une offre à préparer. submit pour passer à la
soumission d'un dossier. resume pour reprendre sans intention explicite.

    python3 "${CLAUDE_SKILL_DIR}/scripts/dispatch.py" next --intent <jeton> [--slug <slug>]

La sortie est une instruction en markdown. La suivre. Charger le fichier de phase
qu'elle nomme, ou exécuter l'action décrite, initialiser le repo, capturer le
formulaire, mettre à jour le skill. Une instruction de refus porte sa raison, la
présenter au candidat sans la contourner.

## 5. Transitions entre phases

Le reducer décide de la phase suivante. Les phases ne se chargent pas entre
elles. Quand une phase se termine ou que le contexte change, la phase émet sa
transition d'état par le reducer puis rend la main à la boucle de routage, qui
rappelle next.

La relecture est une boucle interne à la soumission, chargée par la phase
soumission. L'étayage est chargé par les phases après chaque brouillon. Le
reducer ne les route pas.

## Erreurs de chargement

Ne pas explorer ni improviser. Si un fichier de phase n'est pas
lisible, le skill est probablement mal installé. Dire :

> Les instructions du skill ne sont pas lisibles. Réinstaller le plugin candidature depuis la marketplace de plugins, puis relancer.

## Exécution

Suivre les instructions de la phase chargée. Quand la phase se
termine, revenir aux règles de routage pour déterminer la suite.
