# /candidature — Des candidatures qui ne sonnent pas comme de l'IA

Demander à une IA "écris-moi une lettre de motivation" produit un texte
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

## Mise en place (Claude.ai)

1. Créer un **Projet** sur [claude.ai](https://claude.ai)
2. Cliquer **+** → **Depuis GitHub** → coller
   `https://github.com/ddaanet/candidature` → tout sélectionner
3. Uploader votre CV (DOCX de préférence) dans le même projet
4. Dans les **instructions du projet** (l'encadré texte en haut),
   coller :

> Quand l'utilisateur tape /candidature, chercher SKILL.md dans les
> fichiers du projet et suivre ses instructions.

**Alternative sans GitHub :** télécharger le
[ZIP du repo](https://github.com/ddaanet/candidature/archive/refs/heads/main.zip),
dézipper, puis glisser tous les fichiers dans le projet.

Ouvrir un chat dans le projet et taper `/candidature`.

## Pour commencer

Ouvrir un chat dans le projet et taper `/candidature`. L'assistant
commence toujours par votre profil — quelques minutes de conversation
pour comprendre votre parcours, vos contraintes et vos objectifs.

Ensuite, vous pouvez apporter une offre ou plusieurs — l'assistant
analyse l'alignement avec votre profil et vous aide à prioriser.

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
```

## Licence

MIT
