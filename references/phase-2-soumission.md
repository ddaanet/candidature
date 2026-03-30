# Phase 2, Soumission de la candidature

Suite de la phase de préparation. Prend le relais quand les axes sont
validés, le CV est prêt, et la recherche contextuelle est exploitable.
Le formulaire de candidature guide la génération : l'agent ne produit
rien avant de connaître les champs du formulaire.

Le livrable de cette phase est une candidature soumise, archivée dans
Notion, avec capture des observations sur le site.

## 2.6 Ouverture du formulaire `[outil: open_url / prompt]`

### Rappel site (avant navigation) `[outil: notion-fetch]`

Avant de naviguer sur un site de candidature, charger les contraintes
connues de la plateforme. Chercher une sous-page du site sous Sites/
dans Notion (`notion-fetch`). Cette sous-page contient les contraintes
consolidées et les contournements validés. Si aucune sous-page n'existe
pour ce site, procéder avec prudence et noter le nom pour la capture
après soumission.

### Navigation `[outil: open_url]`

Si Chrome est disponible, ouvrir directement la page de candidature
(`open_url`, `new_tab=false`). Refuser les cookies marketing et
tracking. Accepter les cookies fonctionnels si nécessaire au bon
fonctionnement du site (session, CSRF, état multi-étapes). Les
particularités des plateformes ATS (clipboard WTTJ, dropzone
Teamtailor, native setter Lever) sont documentés dans
`references/browser-layer.md`, chargé par le dispatcher quand Chrome
est détecté.

Si Chrome n'est pas disponible, demander au candidat de décrire les
champs du formulaire : libellés, type (texte libre, liste déroulante,
upload), et taille visible des champs texte.

### Exploration du formulaire `[outil: screenshot / prompt]`

Identifier chaque champ du formulaire : libellé, type, taille visible.
Distinguer les champs texte libre (lettre de motivation, message,
question ouverte) des champs factuels (CV upload, langues, prétentions
salariales, liens, listes déroulantes).

Si Chrome est disponible : utiliser des screenshots pour lire les
champs. Si le formulaire est multi-étapes, explorer chaque étape avant
de rédiger.

Si Chrome n'est pas disponible : travailler avec la description fournie
par le candidat.

## 2.7 Génération par champ `[outil: notion-create-pages]`

Le formulaire détermine ce qui est généré. Pas de lettre de motivation
si le formulaire n'a pas de champ pour une lettre. Pas de message
d'accompagnement si le formulaire ne le demande pas.

### Formulaire sans champ texte libre

Si le formulaire n'a aucun champ texte libre (pas de lettre, pas de
message, pas de question ouverte), les livrables se limitent au CV et
aux champs factuels. Pas de draft à générer, pas d'étayage, pas de
relecture. Passer directement aux champs factuels (2.8), puis à la
capture site (2.9) et à l'archivage (2.10).

### Boucle par champ texte libre

Pour chaque champ qui requiert du texte libre, dans l'ordre du
formulaire :

1. Calibrer la longueur au champ. Estimer environ 150 caractères par
   ligne visible. Un champ de 3 lignes attend un texte court, pas une
   lettre complète. Un champ intitulé "quelques mots" ou "en vos
   propres termes" est un test d'authenticité. La réponse doit sonner
   comme le candidat, pas comme un modèle.

2. Produire un draft adapté au champ. Une lettre de motivation complète
   si le champ est prévu pour une lettre (voir
   `references/cover-letter.md`). Un message court si le champ attend
   quelques phrases. Une réponse ciblée si le champ pose une question
   spécifique. Le draft est créé en sous-page de la candidature dans
   Notion (`notion-create-pages`). Voir `references/backend-write.md`
   pour la gate d'écriture. Ne jamais mettre le contenu directement
   dans la page candidature : chaque artefact est une sous-page.

3. Charger le protocole d'étayage (`view references/etayage.md`) et
   auditer le draft. L'agent découvre le protocole après avoir généré
   le draft. Cette séparation est intentionnelle (voir DESIGN.md
   D-22). Corriger le draft selon les résultats de l'audit.

4. Charger le protocole de relecture
   (`view references/phase-3-relecture.md`) et passer le draft en
   revue item par item avec le candidat. La relecture est une boucle
   interne à la soumission, pas une phase séquentielle. Chaque champ
   texte libre passe par la relecture avant d'être rempli.

5. Remplir le champ. Si Chrome est disponible, utiliser `form_input`
   ou l'approche appropriée à la plateforme. Si Chrome n'est pas
   disponible, présenter le texte final au candidat pour qu'il le
   copie.

Quand la relecture d'un champ aboutit à des corrections, utiliser la
modification ciblée Notion (`update_content`) sur la sous-page plutôt
que de recréer la page. Ne jamais afficher le résultat de l'appel
d'outil et le texte final dans la même réponse.

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

## 2.8 Champs factuels `[outil: form_input / prompt]`

Remplir les champs qui ne demandent pas de rédaction :

- CV upload : utiliser le fichier CV du candidat (original ou adapté
  en phase de préparation).
- Langues : selon le profil candidat.
- Prétentions salariales : selon le profil et le benchmark salarial
  de la recherche contextuelle (phase de préparation, §2.2). Si le
  candidat n'a pas communiqué de fourchette, lui demander avant de
  remplir. Ne pas inventer.
- Liens (LinkedIn, portfolio, GitHub) : selon le profil candidat.
- Listes déroulantes, cases à cocher : selon le profil et le poste.

Si Chrome n'est pas disponible, indiquer au candidat les valeurs à
saisir pour chaque champ.

## 2.9 Capture site `[outil: notion-create-pages]`

Après soumission, demander au candidat :

> "Des difficultés avec le site de candidature ?"

Créer ou mettre à jour une sous-page sous Sites/ dans Notion pour
cette plateforme. Voir `references/backend-write.md` pour la gate
d'écriture. L'écriture est obligatoire, même si le candidat répond
"non" ou "RAS".

Si aucune sous-page n'existe pour ce site, la créer avec le nom de
la plateforme, la date de découverte et l'entreprise associée. Si une
sous-page existe déjà, la compléter avec les nouvelles observations.

Si le candidat signale un problème, le décrire factuellement avec le
contournement s'il a été trouvé. Si Chrome est disponible et que
l'agent a observé un comportement notable (champ non standard,
formulaire multi-étapes inhabituel, comportement JavaScript
particulier), l'inclure dans la capture même si le candidat n'a rien
signalé.

La capture alimente directement le rappel (§2.6) des candidatures
suivantes sur le même site. La consolidation périodique des
observations est décrite dans `references/consolidation.md`.

## 2.10 Archivage `[outil: notion-create-pages, notion-update-page]`

Après la soumission et la capture site, enrichir la page candidature
dans Notion avec un résumé structuré. Le résumé est une sous-page de
la candidature (pas du contenu directement dans la page candidature).
Voir `references/backend-write.md` pour la gate d'écriture.

Le résumé contient :

- Les axes retenus (P-J, P-O, différenciation).
- L'accroche (premiers mots ou résumé).
- Le ton (registre utilisé).
- Les prétentions salariales (si communiquées).
- Le canal utilisé et le nom de la plateforme.
- La date de soumission.

Ce résumé permet de retrouver rapidement ce qui a été envoyé, sans
stocker le texte intégral. Le texte complet reste dans les sous-pages
de draft créées en 2.7.

## 2.11 Clôture `[état]`

La candidature est soumise, archivée, et le site est capturé. Le
contexte de cette conversation contient la candidature complète : les
échanges, les drafts, les corrections, les décisions du candidat. Ce
contexte ne sera plus accessible dans un nouveau chat.

Proposer au candidat de démarrer un nouveau chat pour la prochaine
action (nouvelle candidature, suivi, autre tâche). La séparation en
conversations distinctes évite l'accumulation de contexte et réduit
le risque de contamination entre candidatures.

> "La candidature est envoyée. Pour la suite (nouvelle candidature,
> suivi d'une réponse, autre chose), je recommande de démarrer un
> nouveau chat."
