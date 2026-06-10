# Passe d'étayage

Protocole d'audit des affirmations présentes dans un artefact de
candidature. S'applique à tout texte produit par l'agent : lettre de
motivation, réponse formulaire, message court, CV adapté.

L'audit porte sur le texte réel, pas sur des intentions. L'artefact
existe déjà, la page Notion a été créée. L'objectif est de vérifier
ce que le texte dit effectivement.

---

## Double audit

Chaque affirmation présente dans le texte est évaluée sur deux axes.

### 1. Véracité

L'affirmation est-elle factuelle et sourcée ?

Les données personnelles comme le parcours et les compétences sont
vérifiables contre le CV ou le profil du candidat. Les données
publiques sur l'entreprise, sa stack ou sa culture sont vérifiables
par `web_search` ou `web_fetch`. Les inférences comme la projection
dans l'équipe ou l'adéquation culturelle doivent être qualifiées
comme telles et ne pas être présentées comme des faits.

### 2. Crédibilité du signal (Spence, 1973)

L'affirmation est-elle un signal coûteux ou gratuit ?

Un signal coûteux est vérifiable, engageant et spécifique. Le candidat
met sa crédibilité en jeu. Exemples : "200k lignes en production
pendant 15 ans", "PR accepté sur deepface".

Un signal gratuit est auto-attribué et invérifiable. Tout candidat peut
l'écrire. Exemples : "je suis rigoureux", "j'apprends vite",
"passionné par la technique".

Une affirmation peut être vraie et rester un signal gratuit. "J'apprends
les outils rapidement, je le fais depuis 25 ans" est factuellement
défendable, mais le recruteur ne peut pas le vérifier. La passe
d'étayage détecte ces cas.

### Sources

- Spence, M. (1973). Job market signaling. *QJE*, 87(3), 355-374.
- Voir `references/recruitment-science.md` §1 pour le cadre complet.

---

## Exécution

### Bloc visible

Produire un bloc compact, une ligne par affirmation :

```
Étayage : [nom de l'artefact]

- [affirmation courte] / [source] / OK | à vérifier | faux / coûteux | gratuit
- [affirmation courte] / [source] / OK | à vérifier | faux / coûteux | gratuit
...
```

Le bloc est visible dans la conversation. C'est l'ancrage : l'agent ne
peut pas simuler un audit sans produire le bloc.

### Résolution

Pour chaque affirmation marquée "à vérifier" ou "faux" :

Les données personnelles sont demandées au candidat. L'agent bloque
jusqu'à la réponse. Il ne devine pas.

Les données publiques sont recherchées par `web_search` ou `web_fetch`.
L'agent cherche, il ne suppose pas.

Après recherche, émettre un nouveau bloc avec les lignes modifiées.
Répéter jusqu'à ce que tout soit "OK" ou explicitement qualifié.

Pour chaque affirmation marquée "gratuit" : évaluer si elle apporte
de la valeur malgré son coût nul. Un signal gratuit isolé dans un texte
plein de signaux coûteux est acceptable. Un texte majoritairement
composé de signaux gratuits a un problème structurel.

---

## Correction du brouillon

L'agent évalue la gravité et décide.

Une correction factuelle isolée (un fait incorrect, une date, un nom
d'outil) se traite par modification ciblée (`update_content`) sur la
sous-page Notion du brouillon.

Un problème structurel (axe entier mal fondé, trop de signaux gratuits,
ton incohérent après corrections multiples) nécessite une régénération
complète du brouillon suivie d'une nouvelle passe d'étayage.

Le critère : le texte final reflète-t-il fidèlement ce qui a été étayé ?

Pas de règle rigide. Mais quand l'agent hésite entre correction et
régénération, c'est probablement une régénération.

---

## Périmètre

La passe s'applique à tout artefact produit par l'agent. Un
questionnaire de retour, un post LinkedIn, un message de relance, une
réponse formulaire : tout texte contenant des affirmations passe par
le même processus.
