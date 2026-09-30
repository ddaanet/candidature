# Phase 2, Soumission de la candidature

Suite de la phase de préparation. Prend le relais quand le CV est prêt et
la recherche contextuelle est exploitable.
Le formulaire de candidature guide la génération : l'agent ne produit
rien avant de connaître les champs du formulaire.

Le livrable de cette phase est une candidature soumise, archivée dans le
dossier `candidatures/<slug>/`, avec capture des observations sur le site.

## 2.6 Ouverture du formulaire

### Rappel site (avant navigation)

Avant de naviguer sur un site de candidature, charger les contraintes
connues de la plateforme depuis deux sources. La source primaire est le
stockage local : lire le fichier du site sous `sites/`, nommé d'après le
site. Ce fichier contient les observations terrain, datées et associées à
la version du skill utilisée. La source secondaire est le fichier de
référence du skill (`references/sites/*.md`), qui contient les directives
consolidées.

Si les deux sources existent, les observations sous `sites/` prévalent.
Les directives du fichier de référence ne doivent pas faire double emploi
avec ces observations. À la mise à jour du skill, comparer les
observations existantes sous `sites/` avec les fichiers de référence (eux
aussi datés et versionnés) pour détecter les divergences.

Si aucun fichier n'existe sous `sites/` pour ce site, procéder avec le
fichier de référence s'il existe, ou avec prudence si aucune source
n'est disponible. Noter le nom du site pour la capture après soumission.

### Navigation

Si le navigateur est disponible, ouvrir directement la page de
candidature. Refuser les cookies marketing et
pistage. Accepter les cookies fonctionnels si nécessaire au bon
fonctionnement du site (session, CSRF, état multi-étapes). Les
particularités des plateformes ATS (dropzone Teamtailor, react-select
Greenhouse, saisie manuelle sur Lever) sont documentées dans les fichiers
`references/sites/*.md`, et le pilotage du navigateur dans la couche
navigateur chargée par le dispatcher.

Si le navigateur n'est pas disponible, demander au candidat de décrire les
champs du formulaire : libellés, type (texte libre, liste déroulante,
téléversement), et taille visible des champs texte.

### Exploration du formulaire

Identifier chaque champ du formulaire : libellé, type, taille visible.
Distinguer les champs texte libre (lettre de motivation, message,
question ouverte) des champs factuels (CV upload, langues, prétentions
salariales, liens, listes déroulantes).

Si le navigateur est disponible : utiliser des captures d'écran pour lire les
champs. Si le formulaire est multi-étapes, explorer chaque étape avant
de rédiger.

Actionner les cases à cocher et les interrupteurs optionnels visibles avant
d'arrêter la liste des champs. Un contrôle d'apparence décorative peut révéler
un champ texte libre, parfois le seul du formulaire.

Le critère d'un champ est sa visibilité effective à l'écran, pas sa présence
dans le document. Un champ texte présent dans le code de la page mais
invisible est presque toujours un piège anti-spam, que le site laisse vide
pour un humain et qui fait classer comme robot tout envoi qui le renseigne. Ne
jamais le remplir. Une exploration qui liste les champs par sélecteur fait
remonter ces pièges comme les vrais champs, relever donc la visibilité de
chacun à l'inventaire. Consigner les pièges trouvés dans le fichier du site
sous `sites/`.

Lire les limites de longueur à l'écran. Un champ peut imposer une limite
signalée par un compteur sans porter d'attribut de longueur maximale, et le
remplissage automatique accepte alors un texte trop long sans erreur.

Chercher un CAPTCHA dès l'inventaire. Un inventaire fait sans navigateur
cherche `g-recaptcha`, `hcaptcha`, `turnstile` et `captcha` dans le HTML et
les scripts qu'il charge, et consigne le résultat comme un champ. Un CAPTCHA
à case impose la présence du candidat à l'envoi (§2.9).

Un inventaire par l'API publique d'un ATS ne dispense pas de l'exploration à
l'écran. Des champs affichés au candidat manquent dans l'API, comme un pays,
un consentement de protection des données ou un bloc de questionnaire sur la
diversité. Le formulaire à l'écran fait foi.

Relever l'état de chaque champ, fichiers joints et cases compris. Le candidat
remplit souvent lui-même des champs factuels pendant que le texte s'écrit, avec
des valeurs qui diffèrent de celles que l'agent aurait proposées. Le
remplissage ne touchera que les champs vides et les textes validés, et ne
remplace jamais une valeur déjà saisie.

Si le navigateur n'est pas disponible : travailler avec la description fournie
par le candidat.

Une fois les champs identifiés, enregistrer le formulaire par le reducer. C'est
l'écriture qui ouvre la rédaction.

    python3 "${CLAUDE_SKILL_DIR}/scripts/dispatch.py" capture-form --slug <slug> --fields '<json>'

Les champs sont une liste JSON, un objet par champ avec libelle, type et taille.
Le type distingue texte_libre des champs factuels. Tant que le formulaire n'est
pas enregistré, le reducer renvoie la soumission à l'exploration, pas à la
rédaction.

## 2.7 Génération par champ

La rédaction n'est atteinte que lorsque le reducer renvoie l'étape rédaction,
formulaire capturé. La sortie de next porte alors la liste des champs. Ne pas
rédiger un brouillon avant cette étape.

Le formulaire détermine ce qui est généré. Pas de lettre de motivation
si le formulaire n'a pas de champ pour une lettre. Pas de message
d'accompagnement si le formulaire ne le demande pas.

### Formulaire sans champ texte libre

Si le formulaire n'a aucun champ texte libre (pas de lettre, pas de
message, pas de question ouverte), les livrables se limitent au CV et
aux champs factuels. Pas de brouillon à générer, pas d'étayage, pas de
relecture. Passer directement aux champs factuels (2.8), puis à l'envoi
(2.9), à la capture site (2.10) et à l'archivage (2.11).

### Boucle par champ texte libre

Pour chaque champ qui requiert du texte libre, dans l'ordre du
formulaire :

1. Calibrer la longueur au champ. Estimer environ 150 caractères par
   ligne visible. Un champ de 3 lignes attend un texte court, pas une
   lettre complète. Un champ intitulé "quelques mots" ou "en vos
   propres termes" est un test d'authenticité. La réponse doit sonner
   comme le candidat, pas comme un modèle.

2. Aligner les axes avec le candidat pour ce champ, à partir de l'analyse
   d'adéquation consignée dans le README de la candidature : ce qui répond
   au poste (P-J fit), pourquoi cette entreprise (P-O fit), et ce qui
   distingue le candidat (voir `references/recruitment-science.md`, §2).
   Conversation courte, 2-3 échanges. Le besoin d'axes est manifeste ici,
   pas avant. Puis produire un brouillon adapté au champ. Une lettre de
   motivation complète si le champ est prévu pour une lettre (voir
   `references/cover-letter.md`). Un message court si le champ attend
   quelques phrases. Une réponse ciblée si le champ pose une question
   spécifique. Le brouillon est un fichier `.md` frère du README dans le
   dossier `candidatures/<slug>/`, nommé d'après l'artefact (lettre,
   message, reponse-formulaire). Voir `references/backend-write.md` pour
   le contrôle d'écriture. Le README porte les métadonnées, chaque artefact
   texte vit dans son propre fichier.

3. Charger le protocole d'étayage (`references/etayage.md`) et
   auditer le brouillon. L'agent découvre le protocole après avoir généré
   le brouillon. Cette séparation est intentionnelle (voir DESIGN.md
   D-22). Corriger le brouillon selon les résultats de l'audit.

4. Si le navigateur est disponible, ouvrir la page de l'offre puis celle
   du formulaire, le formulaire au premier plan. Le candidat se prononce
   sur un texte avec l'offre et le champ sous les yeux. Charger ensuite
   le protocole de relecture
   (`references/relecture.md`) et passer le brouillon en
   revue point par point avec le candidat. La relecture est une boucle
   interne à la soumission, pas une phase séquentielle. Chaque champ
   texte libre passe par la relecture avant d'être rempli.

5. Remplir le champ. Si le navigateur est disponible, remplir le
   champ par l'approche appropriée à la plateforme. Si le navigateur
   n'est pas disponible, présenter le texte final au candidat pour
   qu'il le copie.

Quand la relecture d'un champ aboutit à des corrections, éditer le fichier
brouillon en place plutôt que de le recréer. Les itérations se font sur ce
fichier. Ne pas montrer la sortie de l'écriture du fichier et le texte final
dans la même réponse au candidat.

### Voix du candidat

La longueur et le ton de chaque texte dépendent du champ, pas d'un
format générique. Un champ de 3 lignes dans un formulaire Lever ne
reçoit pas le même texte qu'un champ lettre de motivation dans un ATS
maison. Calibrer chaque réponse au contexte visible du champ.

Les réponses aux champs courts ("quelques mots sur votre motivation",
"pourquoi ce poste") sont les plus exposées au ton artificiel. Ces
champs testent la voix du candidat. Utiliser les exemples de style
(phase 1) si disponibles, le ton conversationnel des échanges sinon.
Un texte trop long ou trop structuré pour un champ court est un signal
de génération.

## 2.8 Champs factuels

Remplir les champs qui ne demandent pas de rédaction :

- Le CV est celui du candidat, original ou adapté en phase de
  préparation. Le téléverser via le champ prévu.
- Les langues sont renseignées selon le profil candidat.
- Les prétentions salariales suivent le profil et le référentiel salarial
  de la recherche contextuelle (phase de préparation, §2.2). Si le
  candidat n'a pas communiqué de fourchette, lui demander avant de
  remplir. Ne pas inventer.
- Les liens (LinkedIn, portfolio, GitHub) proviennent du profil candidat.
- Les listes déroulantes et cases à cocher sont renseignées selon le
  profil et le poste.
- Les groupes répétables facultatifs Expérience et Formation sont remplis
  depuis le CV joint. Un bloc par expérience salariée du CV, avec
  l'intitulé, la société ou l'école et les dates, sans résumé. Une activité
  sans employeur reste au CV seul, qui porte aussi le détail.

Seuls les champs relevés vides à l'exploration reçoivent une valeur. Une
valeur saisie par le candidat reste en place, même si elle diffère du profil.

Si le navigateur n'est pas disponible, indiquer au candidat les valeurs à
saisir pour chaque champ.

## 2.9 Envoi

Le clic final sur le bouton d'envoi revient au candidat. La porte de
permission de l'agent refuse ce clic comme une transaction réelle, même quand
l'accord explicite du candidat lui est transmis. Confier le clic à un autre
agent serait contourner ce refus.

L'agent remplit et vérifie tout, champs requis valides, textes en place, CV
joint. Il amène le bouton d'envoi à l'écran et rend la main. Le candidat
clique et le dit. Si le formulaire porte un CAPTCHA à case, le candidat le
coche juste avant de cliquer, son jeton expire en quelques minutes. L'agent
constate ensuite la confirmation à l'écran et la conserve dans le dossier.

Le dossier reste en `statut: shortlist` tant que le candidat n'a pas dit
qu'il a envoyé. La transition vers `en attente` suit la confirmation, pas le
remplissage.

Si le site refuse l'envoi en le signalant comme spam, ne pas enchaîner les
essais en changeant de réseau. Vérifier d'abord qu'aucun champ invisible n'a
été rempli (§2.6) et par où sort le navigateur (couche navigateur). Dès le
deuxième refus, passer à la saisie manuelle. Consigner la liste complète des
valeurs dans le README du dossier avant de rendre la main, l'écran d'erreur
efface le remplissage à chaque essai. Le candidat saisit et envoie depuis sa
propre machine avec cette liste.

Le README consigne qui a saisi quoi, le clic final manuel, une saisie
manuelle et sa raison, et la valeur finale de chaque champ avec son auteur,
agent ou candidat.

## 2.10 Capture site

Après l'envoi, demander au candidat :

> "Des difficultés avec le site de candidature ?"

Lire ou créer le fichier du site sous `sites/`, nommé d'après cette
plateforme. Voir `references/backend-write.md` pour le contrôle
d'écriture. L'écriture est obligatoire, même si le candidat répond
"non" ou "RAS". Chaque observation est datée et associée à la version
du skill.

Si aucun fichier n'existe pour ce site, le créer avec le nom de
la plateforme, la date de découverte et l'entreprise associée. Si un
fichier existe déjà, le compléter avec les nouvelles observations.

Chaque observation porte sa source. Le retour du candidat est ce que
l'utilisateur signale après soumission. L'observation autonome est ce
que l'agent détecte pendant la soumission (contournement, comportement
non standard, formulaire multi-étapes inhabituel, comportement
JavaScript particulier). Inclure les observations autonomes même si le
candidat n'a rien signalé.

Quand l'agent adopte un contournement pendant la soumission
(remplissage, navigation, téléversement), l'enregistrer avec le
problème rencontré, la solution adoptée, et le résultat (succès ou
échec).

La capture alimente directement le rappel (§2.6) des candidatures
suivantes sur le même site. La consolidation périodique des
observations est décrite dans `references/consolidation.md`.

## 2.11 Archivage

Après l'envoi et la capture site, enrichir le README de la
candidature. Les champs factuels vont dans le frontmatter YAML :
`date_soumission`, `canal`, la plateforme, et les prétentions salariales
si elles ont été communiquées. Le statut passe à `en attente` quand le
candidat confirme l'envoi (§2.9). Voir `references/backend-write.md` pour
le contrôle d'écriture et `references/modele-fichiers.md` pour les noms de
champs.

Les champs analytiques complètent le corps du README en sections.
Adéquation et écarts confronte le profil aux exigences. Motivation porte
les raisons de viser cette entreprise. Différenciation note l'accroche
retenue et le registre de ton. Soumission consigne la plateforme, les
prétentions si elles ont été communiquées, et la date. Ces sections
permettent de retrouver rapidement ce qui a été envoyé sans relire les
brouillons.

Le texte complet reste dans les fichiers brouillon créés en 2.7. Les
fichiers brouillon contiennent le contenu, le README contient les
métadonnées et l'analyse.

## 2.12 Clôture

Avant de clore, vérifier que tous les artefacts sont enregistrés dans le
dossier de candidature : brouillons en fichiers frères, métadonnées et
analyse dans le README, observations site capturées sous `sites/`. Si un
élément manque, le compléter avant de clore.

La conversation contient les échanges, les corrections et les décisions
du candidat. Ces éléments ne seront plus accessibles dans un nouveau
chat. Tout ce qui doit être retrouvé plus tard doit être dans les
fichiers avant de clore.

Proposer au candidat de démarrer un nouveau chat pour la prochaine
action. La séparation en conversations distinctes évite l'accumulation
de contexte et réduit le risque de contamination entre candidatures.

> "La candidature est enregistrée. Tous les documents sont dans le dossier
> de candidature. Pour la suite (nouvelle candidature, suivi d'une réponse,
> autre chose), je recommande de démarrer un nouveau chat."
