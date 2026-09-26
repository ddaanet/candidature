# Orchestration par sous-agents

Mode de travail d'une session qui traite plusieurs offres ou plateformes.
Chargé par le dispatcher avant de lancer le premier sous-agent.

## Partage du travail

Le fil principal dialogue avec le candidat et orchestre. Le travail lourd va
à des sous-agents, un par plateforme à prospecter ou par dossier à préparer.
Les lectures d'annonces, les appels d'API d'ATS, les inventaires de
formulaires et les recherches restent ainsi hors du fil principal, qui reste
court et lisible pour le candidat. Plusieurs sous-agents tournent en
parallèle sans l'alourdir.

Le fil principal garde la boucle de routage et les transitions du reducer
(SKILL.md §4). Il pose les décisions au candidat avec le minimum de contexte
utile, une ligne par décision.

Les sous-agents pilotent le navigateur. Ils explorent les sites, font
l'inventaire des formulaires, remplissent sur feu vert du candidat,
constatent la confirmation d'envoi et complètent les fichiers `sites/`.
Chacun travaille dans ses propres onglets nommés, sous un propriétaire à son
nom (`references/site-ouverture-playwright.md`). Un parcours LinkedIn ne
tourne pas pendant qu'un autre sous-agent remplit un formulaire, la même
référence en donne la raison et l'ordre à suivre.

La rédaction des textes destinés à l'employeur reste dans le fil principal,
avec le candidat. Cela vaut pour la lettre, les réponses de formulaire et les
messages courts. Le sous-agent relève les champs texte libre avec leur
libellé exact et leurs limites. Le fil principal enregistre l'inventaire par
`capture-form`, puis rédige dans la boucle par champ
(`references/soumission.md` §2.7). Un sous-agent qui rédige seul n'a que la
fiche, et il lui manque les faits qu'elle ne porte pas. Quatre angles
successifs d'un sous-agent pour une même réponse ont été rejetés, et le
candidat a fini par l'écrire lui-même à partir d'un fait absent de la fiche.
La rédaction est un dialogue court avec lui, pas un traitement à déléguer.

Le clic final d'envoi revient au candidat, aucun sous-agent ne le fait à sa
place (`references/soumission.md` §2.9).

## Brief d'un sous-agent

Le sous-agent ne voit pas la conversation. Son brief porte tout ce qu'il doit
savoir, avec des chemins absolus, y compris celui du dossier `references/` du
skill, qu'il ne connaît pas.

Le brief donne d'abord les fichiers à lire dans l'ordre : les instructions du
repo de données s'il en porte, `fiche-candidat.md` en entier, les références
du skill utiles à sa tâche (`preparation.md`, `etayage.md` et
`modele-fichiers.md` pour une préparation), un dossier de candidature modèle,
et le fichier `sites/` de la plateforme.

Le brief pose ensuite les interdits. Le sous-agent ne fait aucun commit, ne
soumet rien, ne modifie ni le skill ni le CV, dont il propose seulement
l'adaptation, et ne rédige aucun texte destiné à l'employeur.

Le brief dit si le sous-agent a accès au navigateur. S'il l'a, il nomme son
propriétaire d'onglets. S'il ne l'a pas, il le dit en toutes lettres, aucun
accès au port 9222 du navigateur, tout par `curl` et les API publiques des
ATS. Un sous-agent à qui l'on avait seulement dit de travailler sans
navigateur a quand même ouvert un onglet, et l'a laissé ouvert.

Un sous-agent de préparation reçoit sa vérification prioritaire et sa
condition d'arrêt, par exemple la grille salariale, l'éligibilité
géographique ou un prérequis obligatoire à confirmer chez l'employeur
(`references/preparation.md` §2.2). Il la fait d'abord. Si elle viole une
contrainte dure ou un prérequis obligatoire, il écrit un README court au
verdict « à écarter » motivé, laisse le statut `shortlist` et s'arrête. La
décision revient au candidat. Sans condition d'arrêt écrite, un sous-agent
s'est arrêté sur un README court là où un dossier complet était attendu.

Le brief rappelle que chaque affirmation sur le candidat se vérifie par une
recherche effective dans `fiche-candidat.md` (`references/etayage.md`). Un
sous-agent qui analyse l'adéquation projette facilement une exigence de
l'annonce sur le profil, puis l'attribue à la fiche.

Un sous-agent de remplissage travaille en deux temps. Il relève d'abord
l'état de chaque champ, fichiers joints et cases compris, et le rapporte. Il
écrit ensuite les seuls champs vides et les textes validés dans le fil
principal, sans remplacer une valeur saisie par le candidat
(`references/soumission.md` §2.6 et §2.8). Son rapport donne la valeur finale
de chaque champ avec son auteur, que le README du dossier consigne.

Quand plusieurs sous-agents tournent en parallèle, chacun ne touche qu'à son
dossier et à sa recherche. Dans un fichier `sites/` partagé, il ajoute son
entrée datée en fin de fichier sans réécrire le reste.

Le canal de retour d'un sous-agent tronque au-delà d'une trentaine de lignes.
Le brief exige une réponse finale de moins de dix lignes. Un rapport long va
dans un fichier sous `tmp/` du repo de données, et le sous-agent en renvoie
seulement le chemin. Pour une préparation, la réponse donne le chemin du
dossier, le verdict de la barrière, les écarts qui pèsent, le canal, les
champs texte libre du formulaire, et les décisions à poser au candidat.

Pour plusieurs sous-agents de même nature, écrire un brief commun dans `tmp/`
et un brief particulier court par sous-agent, qui nomme son offre, sa
vérification prioritaire et son accès au navigateur.

    Prépare le dossier de l'offre Acme, développeur backend Python, décrite
    dans la section Acme de tmp/prospection-2026-09-18.md. Suis le brief
    commun tmp/brief-preparation-2026-09-18.md. Vérifie d'abord la grille
    salariale publiée chez l'employeur contre le plancher de la fiche. Si
    elle est en dessous, écris un README court au verdict « à écarter » et
    arrête-toi. Pas de navigateur, aucun accès au port 9222, tout par curl
    et l'API publique de l'ATS. Ne rédige aucun texte destiné à l'employeur.
    Réponse finale en moins de dix lignes.

## Fin d'un sous-agent

Le canal de retour peut répéter un rapport deux ou trois fois, dans le
message puis dans les notifications d'inactivité. Ne traiter que le premier.

À la fin de chaque sous-agent, lister les onglets du navigateur, y compris
quand son brief excluait le navigateur.

    curl -s http://127.0.0.1:9222/json/list

`tab.mjs list` ne montre que les onglets d'un propriétaire et ne suffit pas.
Fermer les onglets que le sous-agent a laissés ouverts, par
`/json/close/<id>` sur le même port. Un onglet tiers
oublié fait expirer le parcours LinkedIn suivant
(`references/site-ouverture-playwright.md`).
