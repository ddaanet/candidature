# Gestion du CV

Protocole de lecture et de modification de CV au format DOCX. L'objectif est
d'adapter le contenu au poste tout en préservant intégralement la mise en
forme du candidat.

## Lecture

### DOCX

Lire le DOCX avec `python-docx`. Extraire :
- La structure (paragraphes, tableaux, sections)
- Le contenu textuel de chaque élément
- Les styles appliqués (pour les préserver à l'écriture)

Ne pas tenter d'interpréter la mise en page visuelle (colonnes, positions)
— se concentrer sur le contenu et sa structure logique.

### PDF (repli)

Si le candidat fournit un PDF : le lire pour comprendre le contenu, mais
ne pas tenter de le modifier. Quand une adaptation est nécessaire, générer
un nouveau DOCX. Prévenir le candidat que la mise en forme sera différente.

## Adaptation au poste

L'adaptation est optionnelle et ciblée. Pas une réécriture — un ajustement.

### Ce qu'on modifie

- **Réordonner** des éléments dans une section (expériences les plus
  pertinentes en premier)
- **Reformuler** une description pour mettre en avant les aspects pertinents
  (pas inventer — reformuler)
- **Ajouter** un élément du profil du candidat absent du CV (compétence,
  projet, formation)
- **Retirer** un élément non pertinent qui prend de la place (uniquement
  avec accord du candidat)

### Ce qu'on ne modifie pas

- La mise en forme, les polices, les couleurs, les espacements
- La structure globale (sections, ordre des sections)
- Les dates, les noms d'entreprises, les intitulés de poste
- Rien qui rendrait le CV factuellement inexact

### Protocole python-docx

Pour modifier du texte en préservant le formatage, travailler au niveau du
`run` (fragment de texte avec un formatage homogène), jamais écraser un
paragraphe entier :

```python
for paragraph in doc.paragraphs:
    if "texte à trouver" in paragraph.text:
        for run in paragraph.runs:
            if "texte à trouver" in run.text:
                run.text = run.text.replace("texte à trouver", "nouveau texte")
```

**Tableaux :** Les CV utilisent souvent des tableaux invisibles pour la mise
en page. Parcourir `doc.tables` en plus de `doc.paragraphs`.

## Livraison

1. Sauvegarder le DOCX modifié avec un nom distinctif
   (ex: `CV_Nom_Entreprise.docx`)
2. Générer un PDF si le candidat en a besoin
3. Le CV adapté passe en relecture comme tout artefact

## Limites connues

- Les zones de texte flottantes ne sont pas accessibles via python-docx
- Les images positionnées peuvent se déplacer si le texte change de longueur
- Les mises en page multi-colonnes via sections sont fragiles
- Les en-têtes/pieds de page sont modifiables mais attention aux éléments
  graphiques

Si le CV a une mise en page très complexe : prévenir le candidat et proposer
des modifications qu'il appliquera lui-même dans son outil d'édition.
