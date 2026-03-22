## Brief : Séquençage scripté — isolation des phases

2026-03-22

### Objectif

Remplacer le plan monolithique (workflow.md lu en entier au démarrage)
par un chargement séquentiel piloté par le dispatcher. L'agent ne reçoit
que l'instruction de la phase courante.

### Problème

L'agent qui lit le workflow complet anticipe les phases suivantes. En
particulier :
- La **génération** est biaisée par la connaissance de l'**étayage** à
  venir — l'agent pré-nettoie au lieu de se faire auditer honnêtement
- La **relecture** est affaiblie si l'agent sait qu'il a lui-même généré
  le texte dans la même session
- L'agent rationalise le contournement des obstacles ("prose-only escape
  hatch") parce qu'il voit la suite du plan

C'est le même problème que le TDD dans Edify : un agent qui voit les
tests futurs code la solution directement au lieu de respecter le cycle
red-green.

### Littérature

**StateFlow** (Wu et al., 2024, Microsoft/AutoGen) — FSM pour contrôler
un LLM avec des instructions différentes par état. Variante SF_Agent :
agents individuels par état, instructions non ajoutées à l'historique.
Résultats : +13-28% succès, 3-5x moins cher que ReAct.

Distinction clé de StateFlow : "process grounding" (FSM) vs "sub-task
solving" (agent dans un état). C'est la séparation qu'on veut.

**VOXAM** (2026-03, production) — les transitions d'état doivent être
du code déterministe, pas une décision LLM. L'agent fait du langage,
le script fait du contrôle.

**Angle non couvert dans la littérature** (à vérifier) : le biais
d'anticipation comme mécanisme de dégradation de l'autocritique. Proche
de Goodhart's Law / reward hacking en RL, mais appliqué au séquençage
d'instructions.

### Décisions

- **Le dispatcher est un contrôleur d'état.** Il charge une phase à la
  fois via `view references/phase-N.md`.
- **L'isolation est partielle** — dans une conversation claude.ai, les
  messages précédents restent en contexte. L'agent qui audite se souvient
  d'avoir généré. Mais l'**isolation des instructions** est réelle : il
  n'a pas lu "tu seras audité" pendant la génération.
- **Les transitions sont déterministes.** Le dispatcher décide de la
  phase suivante par la présence d'artefacts (draft créé → étayage,
  étayage terminé → relecture), pas par jugement de l'agent.
- **Granularité : par phase, pas par étape.** Phase 2 (candidature)
  contient plusieurs étapes (recherche, axes, génération, étayage). Les
  séparer toutes serait surdimensionné. Séparer génération/étayage et
  étayage/relecture suffit pour le bénéfice d'isolation.

### Contraintes

- Le fichier de phase doit être autonome — l'agent doit pouvoir agir
  sans avoir lu les autres phases
- Le dispatcher doit savoir où on en est entre les tours de conversation
  — état minimal en mémoire projet ou déductible du contexte (présence
  du draft, bloc d'étayage visible)
- Le coût est un `view` supplémentaire par transition — négligeable
- La phase de profil (1) et de suivi (4) n'ont pas le même enjeu
  d'isolation — le séquençage est surtout critique pour le cycle
  génération → étayage → relecture

### Approches écartées

- **Conversations séparées par phase** — isolation parfaite mais UX
  catastrophique (le candidat doit changer de chat)
- **System prompt dynamique** — pas possible dans claude.ai (le system
  prompt est fixe par projet)
- **Toutes les étapes séparées** — surdimensionné, la granularité
  phase suffit

### Découpage cible des fichiers de phase

```
references/
  phase-1-profil.md        — initialisation (chargé une fois)
  phase-2-candidature.md   — recherche + axes + génération (PAS d'étayage)
  phase-2-etayage.md       — audit du draft (découvre le texte "froid")
  phase-3-relecture.md     — relecture item par item
  phase-4-suivi.md         — retours, CR, patterns
```

### Contexte supplémentaire

Le dispatcher actuel (`build/dispatcher.md`) gère déjà le chargement
dynamique (mode normal vs dev). L'extension vers le séquençage par phase
est naturelle — remplacer un seul `view workflow.md` par N `view`
conditionnels.

Le workflow.md source reste le document de référence complet. Les
fichiers de phase sont des extractions ciblées, pas des copies.
