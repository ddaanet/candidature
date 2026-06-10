# Découpage en éléments de relecture

Comment identifier les éléments à passer en revue dans chaque type
d'artefact de candidature.

## Détection automatique

| Type d'artefact | Découpage | Granularité |
|----------------|-----------|-------------|
| Lettre de motivation (texte libre) | Paragraphes (lignes vides) | Paragraphe |
| Lettre de motivation (PDF/DOCX) | Sections visuelles | Section |
| Réponse formulaire (champ unique) | Groupes de phrases thématiques | Groupe |
| Réponse formulaire (multi-champs) | Un élément par champ | Champ |
| Message court (<100 mots) | Texte entier | Un seul élément |
| CV (section modifiée) | Section du CV modifiée | Section |

En repli, quand aucune structure n'est détectée : un seul élément. La
boucle tourne une fois.

## Découpage des paragraphes longs

Un paragraphe se découpe en sous-éléments quand il aborde plusieurs sujets
indépendants, quand il change d'argument (passe de l'expérience à la
motivation par exemple), ou quand il dépasse 5-6 lignes de texte continu.

Présenter les sous-éléments comme "N.1/N.K", "N.2/N.K".

## Exemples de découpage

### Lettre de motivation (150-250 mots)

Une lettre se découpe typiquement en 3-5 éléments. L'accroche dit pourquoi ce poste ou cette
entreprise. L'argument principal montre l'adéquation profil-poste. La
différenciation établit ce qui sort du lot. La projection couvre ce
qu'on apporte et ce qu'on attend. La clôture indique la disponibilité.

### Réponse à un formulaire multi-champs

Chaque champ est un élément séparé. L'analyse vérifie aussi la
non-répétition entre champs.

### Message LinkedIn court

Souvent un seul élément. Le protocole reste le même, ça force la relecture
attentive même sur un texte court.
