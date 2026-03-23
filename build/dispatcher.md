---
name: candidature
description: >-
  Candidature assistee : postuler, lettre de motivation, CV adapte,
  relecture, suivi des retours. Se declenche sur "/candidature",
  "postuler", "lettre de motivation", "refus", "debrief", ou sur une
  offre d'emploi a traiter.
---

# Candidature, dispatcher

Version: __VERSION__

Point d'entree. Verifie les mises a jour, charge les instructions,
detecte les capacites disponibles.

## Verification de mise a jour `[outil: memory_user_edits, bash_tool]`

Avant de charger quoi que ce soit, verifier s'il existe une version
plus recente. Une seule verification par jour pour ne pas ralentir
le demarrage.

1. Lire les memoires (`memory_user_edits view`). Chercher une entree
   `version-check: AAAA-MM-JJ`. Si la date correspond a aujourd'hui,
   passer directement au chargement.
2. Lire la version installee ci-dessus (ligne `Version:`).
3. Executer `python3 scripts/version_check.py` dans `bash_tool`.
4. Interpreter le resultat :
   - `VERSION_REMOTE=X.Y.Z` : comparer avec la version locale.
     Convertir chaque partie en entier, comparer les tuples.
   - `VERSION_REMOTE=UNKNOWN` : le fichier distant ne contient pas
     le format attendu. Traiter comme une erreur de fetch.
   - `VERSION_REMOTE=ERROR ...` : le fetch a echoue.
5. Mettre a jour la memoire (`memory_user_edits add` ou `replace`) :
   `version-check: AAAA-MM-JJ` avec la date du jour.

Si la version distante est plus recente, proposer au candidat :

> Une mise a jour est disponible (X.Y.Z vers A.B.C).
> Installer la mise a jour depuis
> https://github.com/ddaanet/candidature/releases/latest
> puis relancer `/candidature`.
>
> Sinon, on peut continuer avec la version actuelle.

Si le candidat veut mettre a jour : s'arreter. Si le candidat veut
continuer : passer au chargement.

Si le fetch echoue ou la version est inconnue, proposer le lien
direct au candidat :

> Impossible de verifier les mises a jour automatiquement.
> Telecharger la derniere version :
> https://github.com/ddaanet/candidature/releases/latest/download/candidature.skill
>
> Sinon, on peut continuer avec la version actuelle.

Ne passer au chargement que si le candidat le demande explicitement.

## Chargement `[outil: view]`

Emettre la ligne de statut `Chargement du skill.`, puis :

1. `view references/workflow.md`
2. Si des outils `Control Chrome:*` figurent dans les outils
   disponibles, charger aussi `view references/browser-layer.md`. Les fichiers
   `references/sites/*.md` sont charges a la demande par le workflow
   (rappel avant navigation sur un site).

## Erreurs de chargement

Ne pas explorer ni improviser. Si `references/workflow.md` n'est pas
lisible, le skill est probablement mal installe. Dire :

> Les instructions du skill ne sont pas lisibles. Reinstaller depuis
> https://github.com/ddaanet/candidature/releases/latest

## Execution

Suivre les instructions chargees.
