# Suivi des candidatures et comptes rendus d'entretien

Protocole de suivi des retours et d'apprentissage incrémental. Le suivi
a deux objectifs : identifier ce qui fonctionne pour affiner la stratégie,
et maintenir la motivation en rendant les progrès visibles.

## Fondements

La recherche d'emploi est un processus d'autorégulation (Kanfer, Wanberg
& Kantrowitz, 2001). Les candidats qui adoptent une orientation
d'apprentissage — apprendre de chaque candidature et entretien — obtiennent
de meilleurs résultats que ceux qui se focalisent sur les résultats bruts
(Van Hooft & Van Hoye, 2022 — Job Search Quality Scale, dimension
"learning and improvement").

Le feedback le plus utile ne vient pas des réponses négatives (presque
toujours génériques) mais de la réflexion structurée après les entretiens
et de l'analyse des patterns sur plusieurs candidatures.

**Sources :**
- Kanfer, R., Wanberg, C. R., & Kantrowitz, T. M. (2001). Job search
  and employment. *JAP*, 86(5), 837-855.
- Van Hooft, E. A. J., & Van Hoye, G. (2022). JSQS. *JVB*, 132.
- Van Hooft, E. A. J. et al. (2021). Job search and employment success.
  *JAP*, 106(5).
- Wanberg, C. R. et al. (2012). Layers of job search context.

---

## Enregistrement des retours

Le candidat signale un retour en langage naturel : "refus Wiremind",
"entretien 1 chez Doctolib", "offre reçue de Pigment". L'agent met à
jour l'entrée mémoire `candidature:` correspondante (`replace` du statut).

Pas de formulaire. Pas de format imposé. L'agent interprète et enregistre.

### Statuts possibles

- **en attente** — candidature envoyée, pas de réponse
- **refus** — réponse négative (avec ou sans entretien)
- **entretien N** — convoqué ou passé au tour N
- **offre** — offre reçue
- **accepté** / **décliné** — résolution finale

### Informations optionnelles

Si le candidat donne plus de contexte (feedback du recruteur, hypothèse
sur le refus, délai de réponse), l'agent l'ajoute à l'entrée mémoire.
Rien n'est imposé — tout est capté s'il est offert.

---

## Compte rendu d'entretien

Après un entretien, l'agent demande simplement : "Comment ça s'est
passé ?" et adapte la profondeur selon ce que le candidat dit.

**Candidat bref** ("bien, on verra") → L'agent note le statut et passe.
Pas de forcing.

**Candidat bavard** (détaille les questions, les signaux, les points
forts/faibles) → L'agent structure la synthèse et extrait les
apprentissages transférables.

**Candidat entre les deux** → L'agent pose 2-3 questions ciblées :
- Qu'est-ce qui a bien marché ?
- Qu'est-ce qui a coincé ou surpris ?
- Quelque chose à retenir pour la suite ?

### Stockage

Une entrée mémoire par entretien (préfixe `entretien:`), synthèse
compacte des points clés et apprentissages. Pas de verbatim — la mémoire
a un budget limité.

### Extraction d'apprentissages

Chaque compte rendu se termine par : "Qu'est-ce qui est utile pour les
prochaines candidatures ?" La réponse est enregistrée en mémoire et
alimente l'analyse des tendances. Si le candidat ne sait pas, l'agent
propose ses observations — le candidat valide ou non.

---

## Analyse des patterns

Après 5+ candidatures enregistrées, l'agent peut proposer une analyse
des patterns `[choix]`. L'analyse n'est pas automatique — le candidat
décide quand il veut prendre du recul.

### Axes d'analyse

- **Taux de conversion par étape** — Candidatures → entretiens → suites
  → offres. Où est le goulot ?
- **Types de postes / entreprises** — Quels types produisent les
  meilleurs retours ?
- **Axes de candidature** — Quels arguments, quels tons sont corrélés
  aux meilleurs résultats ?
- **Points récurrents en entretien** — Sujets où le candidat est
  régulièrement solide ou en difficulté.
- **Signaux d'alerte** — Candidatures qui n'auraient pas dû être
  envoyées (poste mal ciblé, inadéquation fondamentale).

### Présentation

L'analyse est conversationnelle, pas un rapport. Pas de tableau de bord
déprimant. L'objectif est d'identifier des ajustements concrets.

Les observations sont stockées en mémoire projet (préfixe `tendance:`)
et consultées au §2.4 (axes) des candidatures suivantes.

---

## Stockage

Tout le suivi est en mémoire projet (`memory_user_edits`), pas dans des
fichiers. Le candidat n'a rien à gérer.

### Candidatures (préfixe `candidature:`)

Une entrée par candidature, format compact :

```
candidature: 2026-03-16 — Doctolib — Senior SWE Agentic AI — WTTJ —
axes: Python 25 ans, agentique actif, blog tech P-O fit — statut: en attente
```

Mise à jour in-place (`replace`) quand le statut change.

### Comptes rendus (préfixe `entretien:`)

Une entrée par entretien, synthèse des points clés et apprentissages.

### Tendances (préfixe `tendance:`)

Mises à jour après chaque analyse. Observations et ajustements décidés.
