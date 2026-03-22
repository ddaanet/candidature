---
name: candidature
description: >-
  Candidature assistée : postuler, lettre de motivation, CV adapté,
  relecture, suivi des retours. Se déclenche sur "/candidature",
  "postuler", "lettre de motivation", "refus", "debrief", ou sur une
  offre d'emploi à traiter.
---

# Candidature — Dev

Stub de développement. Charge le workflow depuis le repo local.

## Chargement `[outil: memory_user_edits view]`

**Ne pas explorer ni improviser.** Si une étape échoue, afficher
l'erreur et s'arrêter. Ne pas chercher d'alternative, ne pas charger
d'autres fichiers, ne pas continuer sans le workflow.

1. Lire la mémoire. Chercher `candidature: dev — <path>`.
   Si absent :
   > Configurer le chemin du repo :
   > `memory_user_edits add "candidature: dev — <chemin absolu>"`
   S'arrêter.

2. Vérifier que le fichier existe :
   `Filesystem:read_text_file path=<path>/SKILL.md` (head 5).
   Doit contenir `Mot magique: ddaanet/candidature`.
   Si absent ou mot magique manquant :
   > SKILL.md introuvable ou invalide à `<path>`. Vérifier que :
   > - Le chemin est correct (corriger l'entrée mémoire)
   > - Le connecteur Filesystem est connecté
   S'arrêter.

3. Émettre `Chargement du skill, dev: <path>.`
4. Charger le workflow : `Filesystem:read_text_file path=<path>/SKILL.md`
5. Si des outils `Control Chrome:*` figurent dans les outils disponibles → charger aussi
   `Filesystem:read_text_file path=<path>/references/browser-layer.md`

Références : `<path>/references/`.

## Exécution

Suivre les instructions chargées.
