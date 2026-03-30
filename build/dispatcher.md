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

Version: __VERSION__

Point d'entrée. Vérifie les mises à jour, vérifie les prérequis,
détecte les capacités, charge la phase appropriée.

## 1. Vérification de mise à jour `[outil: memory_user_edits, bash_tool]`

Avant de charger quoi que ce soit, vérifier s'il existe une version
plus récente. Une seule vérification par jour pour ne pas ralentir
le démarrage.

1. Lire les mémoires (`memory_user_edits view`). Chercher une entrée
   `version-check: AAAA-MM-JJ`. Si la date correspond à aujourd'hui,
   passer directement à l'étape suivante.
2. Lire la version installée ci-dessus (ligne `Version:`).
3. Exécuter `python3 scripts/version_check.py` dans `bash_tool`.
4. Interpréter le résultat :
   - `VERSION_REMOTE=X.Y.Z` : comparer avec la version locale.
     Convertir chaque partie en entier, comparer les tuples.
   - `VERSION_REMOTE=UNKNOWN` : le fichier distant ne contient pas
     le format attendu. Traiter comme une erreur de fetch.
   - `VERSION_REMOTE=ERROR ...` : le fetch a échoué.
5. Mettre à jour la mémoire (`memory_user_edits add` ou `replace`) :
   `version-check: AAAA-MM-JJ` avec la date du jour.

Si la version distante est plus récente, proposer au candidat
(remplacer A.B.C par la version distante, X.Y.Z par la locale) :

> Une mise à jour est disponible (X.Y.Z vers A.B.C).
>
> [Télécharger la mise à jour](https://github.com/ddaanet/candidature/releases/download/vA.B.C/candidature.skill)
>
> Téléverser dans [Personnaliser → Compétences](https://claude.ai/customize/skills) → +

> Sinon, on peut continuer avec la version actuelle.

Si le candidat veut mettre à jour : s'arrêter.
Si le candidat veut continuer : passer à l'étape suivante.

Si le fetch échoue ou la version est inconnue, proposer le lien
direct au candidat :

> Impossible de vérifier les mises à jour automatiquement.
>
> [Télécharger la dernière version](https://github.com/ddaanet/candidature/releases/latest/download/candidature.skill)
>
> Téléverser dans [Personnaliser → Compétences](https://claude.ai/customize/skills) → +

> Sinon, on peut continuer avec la version actuelle.

Ne passer à l'étape suivante que si le candidat le demande
explicitement.

## 2. Vérification Notion `[outil: aucun]`

Vérifier que des outils `notion-*` figurent dans les outils
disponibles. Si aucun outil Notion n'est détecté :

> Ce skill nécessite la connexion Notion. Connecter Notion dans les paramètres du projet, puis relancer /candidature.

S'arrêter. Ne pas proposer de contournement.

## 3. Page racine Notion `[outil: memory_user_edits, notion-fetch]`

Lire les mémoires (`memory_user_edits view`). Chercher une entrée
`candidature-root: <URL ou ID>`. Si elle existe, utiliser cette
valeur.

Si aucune entrée n'existe, demander au candidat :

> Quelle est l'URL de la page Notion qui servira de page racine pour les candidatures ?

Stocker la réponse (`memory_user_edits add "candidature-root: <URL>"`).

Appeler `notion-fetch` sur la page racine. Lire les sous-pages
retournées et relever leurs titres.

Sous-pages attendues :

- Fiche candidat : le profil du candidat (CV, parcours, contraintes).
- Sites : les fiches de plateforme ATS consolidées.
- Recherches : les résultats de recherche contextuelle archivés.
- Patterns : les observations transversales issues du suivi.

Si une sous-page attendue est absente, la créer comme sous-page vide
de la page racine. Le contenu sera rempli par la phase concernée.

Si `notion-fetch` échoue (page introuvable, permissions), dire :

> La page racine Notion n'est pas accessible. Vérifier l'URL et les permissions, puis relancer /candidature.

S'arrêter.

## 4. Détection Chrome `[outil: view]`

Si des outils `Control Chrome:*` figurent dans les outils
disponibles, charger `view references/browser-layer.md`. Les fichiers
`references/sites/*.md` sont chargés à la demande par les phases
(rappel avant navigation sur un site).

## 5. Détermination de la phase `[outil: aucun]`

Déterminer la phase à charger selon le contexte de la conversation et
l'état de la page racine Notion.

Règles de routage, évaluées dans l'ordre :

1. Le candidat signale un retour (refus, réponse, entretien à
   débriefer) ou utilise un déclencheur de suivi ("refus", "rejeté",
   "debrief", "compte rendu entretien") : charger
   `view references/phase-4-suivi.md`.

2. La sous-page "Fiche candidat" est vide ou absente dans la page
   racine Notion : charger `view references/phase-1-profil.md`.

3. Le candidat fournit une offre d'emploi ou demande à préparer une
   candidature ("postuler", "adapter mon CV", ou une URL/texte
   d'offre) : charger `view references/phase-2-preparation.md`.

4. Une candidature est en cours (page candidature existante avec axes
   validés, recherche contextuelle présente) et le candidat est prêt
   à soumettre : charger `view references/phase-2-soumission.md`.

5. Par défaut, si aucune des règles ci-dessus ne s'applique et que le
   profil existe : charger `view references/phase-2-preparation.md`.

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
chaque draft. Le dispatcher ne le charge pas directement.

## Erreurs de chargement

Ne pas explorer ni improviser. Si un fichier de phase n'est pas
lisible, le skill est probablement mal installé. Dire :

> Les instructions du skill ne sont pas lisibles.
> [Réinstaller depuis GitHub](https://github.com/ddaanet/candidature/releases/latest/download/candidature.skill)

## Exécution

Suivre les instructions de la phase chargée. Quand la phase se
termine, revenir aux règles de routage pour déterminer la suite.
