# LinkedIn

## Approche
DOM standard pour la plupart des interactions. EasyApply a ses propres
contraintes.

## Contraintes techniques
EasyApply est un formulaire multi-étapes en modal. Pas de champ libre pour
lettre de motivation dans la plupart des cas. Perçu comme "low effort"
par les recruteurs, à éviter. Toujours chercher le site carrière direct
de l'entreprise d'abord (§2.1 du workflow).

L'algorithme de recommandation s'améliore quand on dismiss ("X") les
offres non pertinentes. À faire systématiquement pendant les sessions de
recherche.

Avant un parcours d'offres, charger les contraintes dures de la fiche
candidat (présentiel, zone géographique, plancher salarial, anti-patterns).
Une offre qui les viole, par exemple en télétravail intégral quand la fiche
exige du présentiel, est un reject d'office, pas une shortlist. Voir la
barrière de contraintes dures de la préparation (§2.2).

## Navigation
Les formulaires EasyApply sont généralement accessibles via DOM standard.
Les popups de connexion et les banners cookies peuvent nécessiter une
approche visuelle.

## Cookies / Consentement
Banner de cookies au chargement pour les utilisateurs non connectés.
Chercher "Reject" ou "Refuser".

## Historique
- 2026-03-17 : observation du dismiss pour améliorer l'algorithme.
