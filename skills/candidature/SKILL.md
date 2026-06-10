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

Version: 0.5.0

Point d'entrée. Vérifie les mises à jour, vérifie les prérequis,
détecte les capacités, charge la phase appropriée.


## 2. Vérification Notion

Vérifier que des outils `notion-*` figurent dans les outils
disponibles. Si aucun outil Notion n'est détecté :

> Ce skill nécessite la connexion Notion. Connecter Notion dans les paramètres du projet, puis relancer /candidature.

S'arrêter. Ne pas proposer de contournement.

## 3. Page racine Notion

Charger `view references/notion-setup.md` et suivre les instructions.

## 4. Détection du navigateur

La couche navigateur passe par le harnais Playwright local décrit dans
`references/site-ouverture-playwright.md`. Charger ce fichier. Les
fichiers `references/sites/*.md` sont chargés à la demande par les
phases (rappel avant navigation sur un site).

## 5. Détermination de la phase

Déterminer la phase à charger selon le contexte de la conversation et
l'état de la page racine Notion.

Les règles sont évaluées dans l'ordre. La première qui correspond est
appliquée.

1. Si le candidat signale un retour (refus, réponse, entretien à
   débriefer) ou utilise un déclencheur de suivi ("refus", "rejeté",
   "debrief", "compte rendu entretien"), charger
   `view references/suivi.md`.

2. Si la sous-page "Fiche candidat" est vide ou absente dans la page
   racine Notion, charger `view references/profil.md`.

3. Si le candidat fournit une offre d'emploi ou demande à préparer une
   candidature ("postuler", "adapter mon CV", ou une URL/texte d'offre),
   charger `view references/preparation.md`.

4. Si une page candidature existe sous la page racine avec une sous-page
   contenant des axes et une sous-page contenant une recherche
   contextuelle, charger `view references/soumission.md`.

5. Si aucune des règles précédentes ne s'applique et que la fiche
   candidat existe, charger `view references/preparation.md`.

Émettre une ligne de statut indiquant la phase chargée, par exemple :
`Phase 2, préparation.`

## 6. Transitions entre phases

Le dispatcher est le seul à décider de la phase suivante. Les phases
ne se chargent pas entre elles.

Quand une phase se termine ou que le contexte change (le candidat
demande autre chose, un artefact est prêt pour la soumission, un
retour arrive), réévaluer les règles de routage de l'étape 5 et
charger la nouvelle phase.

La phase 3 (relecture) est une boucle interne à la soumission. Elle
est chargée par la phase 2 soumission, pas par le dispatcher.

De même, `references/etayage.md` est chargé par les phases après
chaque brouillon. Le dispatcher ne le charge pas directement.

## Erreurs de chargement

Ne pas explorer ni improviser. Si un fichier de phase n'est pas
lisible, le skill est probablement mal installé. Dire :

> Les instructions du skill ne sont pas lisibles.
> [Réinstaller depuis GitHub](https://github.com/ddaanet/candidature/releases/latest/download/candidature.skill)

## Exécution

Suivre les instructions de la phase chargée. Quand la phase se
termine, revenir aux règles de routage pour déterminer la suite.
