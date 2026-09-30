# LinkedIn

## Approche
L'approche est DOM, par le texte de `main` découpé sur des repères
textuels, les classes CSS étant obfusquées. Le parcours des flux passe par
le harnais décrit dans la couche navigateur. Easy Apply a ses propres
contraintes.

## Contraintes techniques
Easy Apply est un formulaire en modal, perçu comme un canal à faible effort
par les recruteurs. Chercher d'abord le site carrière de l'employeur (§2.3
de la préparation).

L'algorithme de recommandation s'améliore quand on écarte (« X », Dismiss)
les offres non pertinentes. Le faire systématiquement pendant les sessions de
recherche.

Avant un parcours d'offres, charger les contraintes dures de la fiche
candidat. Une offre qui les viole est un reject d'office, pas une shortlist
(barrière de contraintes dures, §2.2 de la préparation).

Les classes CSS des pages d'annonce sont obfusquées et la page n'a pas de
`h1` (2026-09-16). Le texte de `main`, découpé entre « About the job » en
tête et « Set alert for similar jobs » ou « Looking for talent? » en queue,
donne l'annonce de façon stable. Sur les pages de flux, le seul sélecteur
structurel qui tienne est `li[data-occludable-job-id]`. La description
complète est dans le DOM même repliée, une fois la page rendue au premier
plan. Le contrôle qui la déplie s'intitule « … more », pas « See more ».

LinkedIn cesse de servir les descriptions après une quarantaine de lectures
rapprochées. Les pages `/jobs/view/<id>/` ne rendent plus que l'en-tête,
onglet au premier plan et chargement complet, pendant environ trois quarts
d'heure (2026-09-18, une cinquantaine d'annonces en vingt minutes). Espacer
les lectures, compter environ dix-sept secondes par annonce. Pendant le
bridage, le lien « Apply on company website » reste lisible dans l'en-tête,
basculer sur la page de l'employeur.

Le flux `recommended` dépasse dix pages, deux cent quarante cartes le
2026-09-18, et sa qualité chute après la page 3 (sociétés de services,
stacks hors profil, embarqué). `top-applicant` s'épuise vers deux cent
quarante résultats triés par date. Concentrer la lecture sur les premières
pages de `recommended`.

Les annonces publiées sous le nom « STATION F » sont des republications
anonymisées. L'employeur se lit dans le corps de l'annonce, pas sur la carte
(2026-09-18, sept employeurs identifiés). Elles peuvent doubler une annonce
déjà vue sous le nom de l'employeur.

Un gabarit d'annonce non crédible revient sous plusieurs annonceurs (Hired,
Hire Feed, Quik Hire Staffing, 2026-09-08 et 2026-09-13). Sa signature est
une liste « Role / Location / Job Type / Payout », un montant en dollars hors
marché sur un poste en France, « Remote (Work from Anywhere) », « We are
hiring for one of our clients » sans client nommé, « Apply Now! » et
« Responses managed off LinkedIn ». Ces annonces se rejettent sur leurs
prérequis. Décrire les signaux au candidat plutôt que qualifier
l'intention, qui n'est pas observable.

## Lecture d'une annonce
La vivacité d'un jobId se lit dans l'en-tête seul, titre, lieu, « Reposted N
ago », mode Hybrid ou On-site, bouton de candidature. Une offre fermée y
porte « No longer accepting applications ». Le bouton distingue « Easy
Apply » (aria « Easy Apply to this job »), formulaire LinkedIn, de « Apply »
(aria « Apply on company website »), qui renvoie vers l'ATS de l'employeur
dans une fenêtre surgissante. L'URL de l'ATS se décode depuis le paramètre
`url` du lien `safety/go`.

Un employeur peut retitrer une annonce sans changer de jobId, le corps
restant le même (Back Market, 2026-08-27). Une annonce republiée sous un
nouveau jobId peut être déjà fermée quand on la reprend (Mobiskill MedTech,
2026-09-01). La republication n'est pas un signe de vivacité.

Le bloc « Requirements added by the job poster », sous la description, porte
des exigences chiffrées absentes du corps et parfois contraires. Ce sont des
critères de filtrage du recruteur, à confronter à la fiche comme des
prérequis (Econocom, 2026-09-08).

Vérifier la présence d'un encart « Meet the hiring team » avant de prévoir
une relance. Son absence prive de tout interlocuteur nommé (2026-09-16).

## Formulaire Easy Apply
Le formulaire n'a pas de gabarit unique, d'une seule page à cinq étapes
selon l'annonce (2026-09-01 et 2026-09-16). Le modal affiche son avancement,
« 1/5 pages ». Lire ce compteur avant de conclure sur le nombre de champs.
Les étapes observées sont les coordonnées préremplies, le choix du CV,
l'interrupteur « top choice », les questions de présélection, puis le
récapitulatif et « Submit application ».

À l'étape du CV, le dernier CV téléversé est sélectionné par défaut, qui peut
être le CV adapté d'une autre candidature. Le vérifier.

Les questions de présélection ne sont lisibles qu'à leur étape dans le modal,
pas sur la page de l'annonce, et peuvent porter sur une techno que le corps
ne pose pas en prérequis. Les champs d'années sont validés comme des
nombres, prévoir un entier. LinkedIn préremplit certaines réponses d'une
candidature à l'autre, les relire.

L'interrupteur « Mark job as a top choice » révèle un champ « Include a
message with your application », seul texte libre de certains formulaires.
Actif, il rend le champ obligatoire, avec un minimum de vingt caractères et
un maximum de quatre cents que seul le compteur à l'écran affiche,
`maxLength` étant absent. Le nombre de « top choice » est limité par mois.

Le modal a été rendu dans le shadow DOM ouvert `#interop-outlet`
(2026-09-01) puis dans le DOM principal (2026-09-16). Il se retrouve par le
premier élément dont le texte commence par « Apply to » et fait moins de
neuf mille caractères. Scoper l'inventaire à ce conteneur écarte la barre de
recherche et les contrôles du pied de page. Les locators Playwright
traversent le shadow DOM ouvert. Ne pas conclure à un échec d'ouverture sur
l'absence d'un conteneur `[role=dialog]`, prendre une capture d'abord.

Pour sortir d'un inventaire sans candidater, « Dismiss » puis « Discard »
ferment le modal sans brouillon.

## Upload CV
« Upload resume » ouvre un sélecteur de fichier, `waitForEvent('filechooser')`
le capte. Le CV téléversé arrive en tête de liste, sélectionné.

## Messagerie
Le composeur `/messaging/compose/?profileUrn=...&recipient=...`, ouvert
depuis le lien « Message » de l'annonce, est dans le DOM principal. L'objet
est `input[name="subject"]`, le corps `div.msg-form__contenteditable`,
l'envoi `button.msg-form__send-btn`, sans texte ni aria-label. Le corps
accepte des paragraphes `<p>` écrits par script suivis d'un événement
`input`, l'objet le setter natif suivi d'`input` et `change`. Le bouton
d'envoi reflète l'état du corps au bout d'environ deux secondes. Une
conversation se retrouve par `/messaging/?searchTerm=<terme>` plutôt que par
le champ de recherche (2026-09-15).

## Profil
Les pages `/in/<slug>/details/experience/` et `/details/skills/` rendent leur
contenu dans `main`, la page `/in/<slug>/` charge ses sections en différé.
`/jobs/opportunities/job-opportunities/onboarding/` ouvre directement les
préférences d'emploi. Le formulaire de pause de carrière coche « I'm
currently on this break » par défaut (2026-08-27).

## Cookies / Consentement
Une bannière s'affiche au chargement pour les utilisateurs non connectés.
Chercher « Reject » ou « Refuser ».

## Historique
- 2026-03-17 : écarter les offres améliore les recommandations.
- 2026-08-27 : la vivacité se lit dans l'en-tête, Easy Apply se distingue
  d'Apply, un jobId peut être retitré.
- 2026-09-01 : une republication peut être fermée, le message « top choice »
  est limité à quatre cents caractères.
- 2026-09-08 : le bloc des exigences du recruteur et le gabarit non crédible
  sont relevés.
- 2026-09-15 : le composeur InMail est piloté.
- 2026-09-16 : les classes sont obfusquées, Easy Apply compte jusqu'à cinq
  étapes.
- 2026-09-18 : LinkedIn bride les lectures, `recommended` dépasse dix pages,
  les annonces STATION F sont anonymisées.
