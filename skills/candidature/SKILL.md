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

Version: 0.5.1

Point d'entrée. Vérifie le repo de données, détecte les capacités,
charge la phase appropriée.

## 1. Vérification du repo de données

Le travail s'appuie sur un repo de données local, un répertoire dont la
racine porte la sentinelle `.candidature`. Lire la première ligne de ce
fichier à la racine du répertoire courant. Trois cas.

Première ligne `format: 1` : le repo est initialisé au format que ce
skill connaît. Continuer.

Fichier absent : le répertoire courant n'est pas encore un repo de
candidatures. Ne rien créer sans accord. Proposer l'initialisation :

> Ce dossier n'est pas encore un repo de candidatures. Je peux créer la structure de départ (dossiers candidatures, sites, recherches, et une fiche candidat vide). On y va ?

Si le candidat accepte, lancer `python3 scripts/init_repo.py` dans
`bash_tool` puis continuer. Sinon, s'arrêter.

Première ligne avec un numéro de format supérieur à 1 : le format sur
disque est plus récent que ce que ce skill connaît. Dire de mettre à
jour le skill, puis s'arrêter :

> Ce repo utilise un format plus récent que ce skill. Mettre à jour le skill candidature, puis relancer.

## 2. Détection du navigateur

La couche navigateur passe par le harnais Playwright local décrit dans
`references/site-ouverture-playwright.md`. Charger ce fichier. Les
fichiers `references/sites/*.md` sont chargés à la demande par les
phases (rappel avant navigation sur un site).

## 3. Lecture de l'index des candidatures

L'index des candidatures n'est pas stocké. Il se régénère par lecture
des frontmatter des README sous `candidatures/`. Quand le dispatcher a
besoin de la situation d'ensemble (présenter l'avancement, router sur
l'état), lire ces frontmatter et construire le tableau à la demande.

À la lecture de l'index, lancer `python3 scripts/validate.py .` dans
`bash_tool` sur la racine du repo de données. Le script signale les
anomalies de métadonnées sans corriger. Le code de sortie 1 signale au
moins une anomalie, 0 leur absence, 2 une erreur d'usage. Présenter les
anomalies au candidat sans interrompre le travail. Une anomalie est un
signalement, pas un blocage.

## 4. Détermination de la phase

Déterminer la phase à charger selon le contexte de la conversation et
l'état des fichiers du repo de données.

Les règles sont évaluées dans l'ordre. La première qui correspond est
appliquée.

1. Si le candidat signale un retour (refus, réponse, entretien à
   débriefer) ou utilise un déclencheur de suivi ("refus", "rejeté",
   "debrief", "compte rendu entretien"), charger
   `view references/suivi.md`.

2. Si `fiche-candidat.md` à la racine manque ou porte sur sa première
   ligne le marqueur `<!-- candidature:gabarit -->`, charger
   `view references/profil.md`.

3. Si le candidat fournit une offre d'emploi ou demande à préparer une
   candidature ("postuler", "adapter mon CV", ou une URL/texte d'offre),
   charger `view references/preparation.md`.

4. Si un dossier sous `candidatures/` correspond à l'offre en cours, que
   la recherche contextuelle pour ce type de poste existe sous
   `recherches/`, et que le candidat passe à la soumission (ouvrir le
   formulaire, remplir, envoyer), charger `view references/soumission.md`.

5. Si aucune des règles précédentes ne s'applique et que la fiche
   candidat existe (sans marqueur gabarit), charger
   `view references/preparation.md`.

Émettre une ligne de statut indiquant la phase chargée, par exemple :
`Phase 2, préparation.`

## 5. Transitions entre phases

Le dispatcher est le seul à décider de la phase suivante. Les phases
ne se chargent pas entre elles.

Quand une phase se termine ou que le contexte change (le candidat
demande autre chose, un artefact est prêt pour la soumission, un
retour arrive), réévaluer les règles de routage de la section 4 et
charger la nouvelle phase.

La phase 3 (relecture) est une boucle interne à la soumission. Elle
est chargée par la phase 2 soumission, pas par le dispatcher.

De même, `references/etayage.md` est chargé par les phases après
chaque brouillon. Le dispatcher ne le charge pas directement.

## Erreurs de chargement

Ne pas explorer ni improviser. Si un fichier de phase n'est pas
lisible, le skill est probablement mal installé. Dire :

> Les instructions du skill ne sont pas lisibles. Réinstaller le plugin candidature depuis la marketplace de plugins, puis relancer.

## Exécution

Suivre les instructions de la phase chargée. Quand la phase se
termine, revenir aux règles de routage pour déterminer la suite.
