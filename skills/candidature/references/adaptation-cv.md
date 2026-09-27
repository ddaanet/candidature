# Adaptation du CV

Le CV DOCX du candidat s'adapte au poste en préservant intégralement sa mise
en forme. Il vit dans le repo de données sous forme d'expansion XML, le DOCX
décompressé et indenté, que git versionne en clair. On édite le texte dans ce
XML, on reconstruit le DOCX, on rend le PDF et on mesure le nombre de pages
avant de présenter quoi que ce soit au candidat. Le script
`scripts/cv_docx.py` du skill porte les trois opérations.

## Commandes

    python3 "${CLAUDE_SKILL_DIR}/scripts/cv_docx.py" unpack "<CV>.docx" cv/cv-fr
    python3 "${CLAUDE_SKILL_DIR}/scripts/cv_docx.py" pack cv/cv-fr "cv/<CV>.docx"
    python3 "${CLAUDE_SKILL_DIR}/scripts/cv_docx.py" render "cv/<CV>.docx"

`unpack` décompresse le DOCX dans le répertoire donné et indente le XML pour
que git en montre des diffs lisibles. `pack` retire l'indentation et rezippe.
`render` écrit le PDF à côté du DOCX par LibreOffice et affiche son nombre de
pages. Il refuse de conclure quand le PDF n'a pas été réécrit, parce qu'un
échec de LibreOffice laisse en place le PDF précédent, qu'on relirait en le
croyant neuf. Dans le bac à sable de Claude Code, LibreOffice échoue sur
« no valid pipe path found ». Relancer alors `render` hors bac à sable. Ne
jamais masquer la sortie de ces commandes.

Le texte rendu se lit ligne par ligne, avec les coupures de la page :

    pdftotext -layout "cv/<CV>.pdf" -

Une phrase qui déborde y apparaît sur deux lignes.

## Mise en place

L'expansion se crée à la première adaptation, une par langue, sous `cv/` du
repo de données : `cv/cv-fr/` pour le CV français, `cv/cv-en/` pour le CV
anglais. Le DOCX du candidat se range sous `cv/` sous son nom de livraison,
que `pack` réécrit ensuite. Le fichier `cv/.gitignore` porte la ligne `*.docx`, puisque le DOCX se
reconstruit depuis l'expansion et que git n'en donne aucun diff lisible. Le
PDF rendu est versionné, c'est le document envoyé.

Après `unpack`, reconstruire et rendre aussitôt, puis montrer le PDF au
candidat, qui le compare à son original. LibreOffice remplace une police
absente de la machine, et les lignes bougent. `pdffonts` sur le PDF rendu
liste les polices réellement employées. Une police remplacée se règle avant
la première adaptation, en l'installant ou en acceptant la substitution avec
le candidat. Committer ensuite l'expansion et le PDF.

L'expansion est la source de vérité. Le DOCX et le PDF sont en retard sur
elle tant que `pack` et `render` n'ont pas été relancés. Quand le candidat
modifie son CV dans son propre outil, vider le répertoire de l'expansion et
relancer `unpack` sur le nouveau DOCX. Le diff montre alors ce qu'il a changé.

Le fichier livré ne porte que le nom du candidat et la langue, par exemple
`Camille Martin CV fr.pdf`, jamais l'entreprise ni le poste. Le recruteur voit
ce nom, et un nom qui révèle le sur-mesure fait mauvais effet.

Un candidat qui n'a qu'un PDF voit ses propositions appliquées par lui-même
dans son outil d'édition, puis fournit le nouvel export. L'agent ne recrée pas
la mise en forme d'un CV.

## Lecture

Le contenu se lit sur le PDF rendu par `pdftotext -layout`, dans l'ordre de la
page. La structure se lit dans `word/document.xml`. Un paragraphe est un
élément `<w:p>`, découpé en fragments `<w:r>` de mise en forme homogène, et le
texte est dans `<w:t>`. Dans l'expansion indentée, une phrase tient en général
dans un seul `<w:t>`. Un changement de mise en forme au milieu d'une ligne, un
intitulé en gras suivi du texte courant par exemple, la répartit sur plusieurs
fragments. Les en-têtes et pieds de page vivent dans `word/header*.xml` et
`word/footer*.xml`. Le texte d'une zone de texte est dans `<w:txbxContent>`,
au fil du document.

## Proposition

L'adaptation est optionnelle et ciblée. C'est un ajustement, pas une
réécriture. On peut réordonner des éléments dans une section pour mettre les
plus pertinents en premier. On peut reformuler une description pour faire
ressortir ce que le poste demande, sans rien inventer. On peut ajouter un
élément du profil absent du CV. On peut retirer un élément hors sujet qui
prend de la place. On ne touche ni à la mise en forme, ni aux polices, ni aux
couleurs, ni aux espacements, ni à l'ordre des sections. Les dates, les noms
d'entreprises et les intitulés de poste restent exacts.

Les propositions s'écrivent dans `adaptation-cv-proposition.md` du dossier de
candidature, qui dit en tête que rien n'est appliqué. Chaque proposition donne
le texte actuel, le texte proposé, sa source dans la fiche candidat, la réserve
à respecter et son coût en lignes. La source se vérifie par une lecture
effective de `fiche-candidat.md`, comme le demande `references/etayage.md`. Un
terme qui vient de l'annonce et que la fiche ne porte pas bloque la
proposition jusqu'à confirmation du candidat.

    ## 2. Nommer l'intégration du moteur de recherche, priorité haute

    Actuel : « Intégration avec des services back-end externes. »

    Proposé : « Intégration Elasticsearch, indexation continue du catalogue
    produit. »

    Source : fiche-candidat.md, Parcours, « a mis en place l'indexation
    Elasticsearch du catalogue, mise à jour en continu ».

    Réserve : la fiche ne chiffre pas le volume indexé, ne pas l'écrire.

    Coût : une ligne pour une ligne, mesuré au rendu, le CV tient sur une page.

Quand la page est pleine, toute ligne ajoutée demande une ligne retirée. Le
fichier fait le compte par proposition et donne le solde.

## Mesure avant présentation

Une proposition se mesure au rendu avant d'être présentée, pas après l'accord
du candidat. Des propositions acceptées sur estimation ont déjà donné un CV de
deux pages. Une ligne de titre coûtait plus qu'une ligne de corps, et les
longueurs estimées ne tenaient pas.

Pour mesurer, copier l'expansion dans `tmp/` du repo de données, appliquer les
propositions à la copie, la reconstruire en DOCX sous `tmp/`, rendre, lire le
nombre de pages et vérifier les coupures par `pdftotext -layout`. Chaque
variante discutée a sa propre copie. Seule une proposition qui tient sur
la page rendue est présentée, avec le résultat de la mesure dans le fichier.
Réécrire celle qui déborde avant de la montrer.

Les limites observées, la longueur d'une puce qui tient sur une ligne ou celle
d'un intitulé, se notent dans `cv/README.md`. L'essai suivant part de ces
relevés, et se mesure quand même.

## Validation par le candidat

Le candidat tranche proposition par proposition, sur le PDF rendu mis à
l'écran. Ses corrections de fond, la bonne manière de présenter un fait ou
ce qui n'est jamais pertinent, vont dans `fiche-candidat.md`, pour que la
prochaine adaptation parte d'elles.

## Application

Après accord, éditer directement l'expansion de la langue visée. On ne modifie
que le texte des éléments `<w:t>`. Les propriétés `<w:rPr>` et `<w:pPr>`, qui
portent la mise en forme, restent intactes. Retirer une ligne, c'est retirer
son `<w:p>` entier. Ajouter une ligne, c'est copier un `<w:p>` voisin de même
nature et remplacer son texte, pour qu'elle en garde le style. Reconstruire
ensuite le DOCX sous le nom standard, rendre, vérifier le nombre de pages et
retrouver chaque phrase modifiée dans la sortie de `pdftotext`.

L'adaptation reste non commitée jusqu'à l'envoi. Le diff de `cv/` dans l'arbre
de travail est l'adaptation pour la candidature visée. Elle se committe avec
le dossier après l'envoi, de sorte que l'historique de `cv/` garde chaque
version envoyée. La version commitée est le point de départ de l'adaptation
suivante. Relire alors les lignes ajoutées pour une offre précédente, une
ligne utile à un poste peut tomber à côté du suivant.

Une erreur de fait découverte dans le CV se corrige quelle que soit l'offre
visée, et la fiche candidat note la formulation juste.

## Livraison

Le PDF rendu est le fichier téléversé, sauf si le formulaire exige un DOCX. Le
CV adapté passe en relecture comme tout artefact, section modifiée par section
modifiée.

## Limites

Une image ou un cadre positionné peut se déplacer quand la longueur du texte
change. Le rendu le montre, c'est pourquoi chaque modification se rend. Une
mise en page que LibreOffice rend mal se voit dès la mise en place. Dans ce
cas, les propositions s'appliquent comme pour un CV fourni en PDF, par le
candidat dans son outil.
