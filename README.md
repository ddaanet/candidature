# Candidature — Des candidatures qui ne sonnent pas comme de l'IA

Demander à une IA "écris-moi une lettre de motivation" produit un texte
générique, interchangeable, que le recruteur identifie en 3 secondes.

Cette méthode transforme l'IA en assistant de candidature qui connaît votre
parcours, recherche ce qui est attendu pour chaque poste, rédige dans
votre voix, vérifie chaque fait contre votre CV, et s'améliore au fil
de vos candidatures.

Fonctionne pour tout métier et tout niveau. Fondé sur la recherche en
psychologie du recrutement.

## Prérequis

- Un compte sur une IA conversationnelle (Claude, ChatGPT, Gemini,
  Mistral, ou autre)
- Un CV
- C'est tout

## Installation

### Claude (claude.ai)

1. Créer un **Projet**
2. Dans les fichiers du projet, cliquer **+** → **Ajouter depuis GitHub**
3. Coller : `https://github.com/ddaanet/candidature`
4. Sélectionner tous les fichiers

C'est prêt. Ouvrir un chat dans le projet et dire "je veux postuler".

### ChatGPT, Gemini, Mistral, ou autre IA

Ouvrir un chat et coller :

> Lis les fichiers sur https://github.com/ddaanet/candidature
> et suis les instructions de SKILL.md pour m'aider à postuler.

L'IA ira lire les fichiers et suivra la méthode.

Pour un usage récurrent, créer un assistant persistant (GPT sur ChatGPT,
Gem sur Gemini, Agent sur Mistral) : [télécharger le ZIP](https://github.com/ddaanet/candidature/archive/refs/heads/main.zip),
uploader les fichiers `.md` dans l'assistant, et mettre comme instruction
"Suis les instructions de SKILL.md".

### Ajouter son CV

Uploader son CV (DOCX de préférence) dans le même projet / assistant / chat.
Optionnel : ajouter des exemples de son style d'écriture.

## Contenu

```
SKILL.md                    — Méthode complète (4 phases)
references/
  recruitment-science.md    — Fondements scientifiques
  cover-letter.md           — Principes de rédaction
  cv-handling.md            — Modification de CV (DOCX)
  review-items.md           — Découpage pour la relecture
  feedback-tracking.md      — Suivi et comptes rendus d'entretien
```

## Licence

MIT
