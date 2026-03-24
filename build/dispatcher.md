---
name: candidature
description: >-
  Candidature assistée : postuler, lettre de motivation, CV adapté,
  relecture, suivi des retours. Se déclenche sur "/candidature",
  "postuler", "lettre de motivation", "refus", "debrief", ou sur une
  offre d'emploi à traiter.
---

# Candidature, dispatcher

Version: __VERSION__

Point d'entrée. Vérifie les mises à jour, charge les instructions,
détecte les capacités disponibles.

## Vérification de mise à jour `[outil: memory_user_edits, bash_tool]`

Avant de charger quoi que ce soit, vérifier s'il existe une version
plus récente. Une seule vérification par jour pour ne pas ralentir
le démarrage.

1. Lire les mémoires (`memory_user_edits view`). Chercher une entrée
   `version-check: AAAA-MM-JJ`. Si la date correspond à aujourd'hui,
   passer directement au chargement.
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
Si le candidat veut continuer : passer au chargement.

Si le fetch échoue ou la version est inconnue, proposer le lien
direct au candidat :

> Impossible de vérifier les mises à jour automatiquement.
>
> [Télécharger la dernière version](https://github.com/ddaanet/candidature/releases/latest/download/candidature.skill)
>
> Téléverser dans [Personnaliser → Compétences](https://claude.ai/customize/skills) → +

> Sinon, on peut continuer avec la version actuelle.

Ne passer au chargement que si le candidat le demande explicitement.

## Chargement `[outil: view]`

Émettre la ligne de statut `Chargement du skill.`, puis :

1. `view references/workflow.md`
2. Si des outils `Control Chrome:*` figurent dans les outils
   disponibles, charger aussi `view references/browser-layer.md`. Les fichiers
   `references/sites/*.md` sont chargés à la demande par le workflow
   (rappel avant navigation sur un site).

## Erreurs de chargement

Ne pas explorer ni improviser. Si `references/workflow.md` n'est pas
lisible, le skill est probablement mal installé. Dire :

> Les instructions du skill ne sont pas lisibles.
> [Réinstaller depuis GitHub](https://github.com/ddaanet/candidature/releases/latest/download/candidature.skill)

## Exécution

Suivre les instructions chargées.
