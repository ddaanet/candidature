# Welcome to the Jungle (WTTJ)

## Approche
WTTJ est un agrégateur et un site d'offres. La lecture passe par les sitemaps et l'API
publique, le site `www` ne se lit qu'au navigateur. Sur `www`, les
formulaires sont des composants React qui imposent l'approche visuelle.

## Lecture sans navigateur
La recherche d'offres exige un compte. Elle affiche un nombre de résultats
puis propose de créer un profil, sans aucun lien d'annonce, et le
`robots.txt` interdit `*/jobs?query=*` (2026-09-13). Le site
`www.welcometothejungle.com` répond 403 à `curl` et à WebFetch, `robots.txt`
compris. `api.welcometothejungle.com` et `/sitemaps/` répondent.

L'inventaire exhaustif est dans les sitemaps publics,
`https://www.welcometothejungle.com/sitemaps/index.xml.gz`, puis les fichiers
`job-listings.N.xml.gz`, environ quatre-vingt-dix mille URL d'annonces
(2026-09-13). Le slug d'URL porte le titre et la ville, ce qui permet un
premier tri sans requête.

Une annonce se lit par
`https://api.welcometothejungle.com/api/v1/organizations/<org>/jobs/<slug>`,
avec le slug du sitemap, suffixe de ville compris. Elle rend
`published_at`, `archived_at`, `status`, `remote`, `offices`, `salary_min`,
`salary_max`, `apply_url` et la description complète. `apply_url` démasque
l'ATS réel de l'employeur, et `archived_at` date la fermeture.
`experience_level` donne le centre de gravité de séniorité, et
`organization` porte effectif, année de création, secteur et adresse du
siège, souvent absents de l'annonce.

Les postes publiés d'une société se lisent par
`https://api.welcometothejungle.com/api/v3/organizations/<slug>/jobs`, pour
la vivacité et les annonces sœurs.

Les endpoints de recherche `api/v3/search/jobs` et `api/v1/search/jobs`
refusent ou échouent, même avec cookie de session.

## Contraintes techniques
Les dates de WTTJ ne sont pas celles de l'employeur. Le `lastmod` du sitemap
n'est pas `published_at`, et `published_at` diffère de la date de
publication chez l'employeur, de plus de deux mois sur les deux cas relevés
(Cafeyn et Scaleway, 2026-09-13). Vérifier la date chez l'employeur.

Les métadonnées de WTTJ ne font pas foi sur l'offre. Une annonce reprise
était étiquetée « Permanent contract in Paris » alors que l'employeur la
publiait en télétravail France (Pigment, 2026-09-18). La page de l'employeur
fait foi.

Le bloc `application_fields` de l'API décrit le parcours de candidature
hébergé par WTTJ, pas le formulaire de l'employeur. Quand l'annonce passe
par un intermédiaire d'intégration (`"ats": "kombo"`), les deux divergent,
CV obligatoire d'un côté et facultatif de l'autre, lettre présente d'un côté
et absente de l'autre (Riot, Workable, 2026-09-16). Ne jamais inventorier un
formulaire depuis `application_fields`, aller à l'ATS de l'employeur.
`ats_questions` reprend en revanche fidèlement les questions propres à
l'employeur, et le texte de l'annonce est fidèle.

Welcomekit (`<org>.welcomekit.co`) est l'ATS de WTTJ. Une annonce sans
`apply_url` y est hébergée, et le site carrière de la société est le canal
direct.

Les dropdowns sont des composants React, sans `<select>` natif. Les
sélecteurs CSS et `dispatchEvent` ne déclenchent pas leurs gestionnaires.
Les modals sont asynchrones et le DOM change entre les états, les
transitions de page se font sans rechargement.

## Navigation
Sur `www`, s'orienter par captures d'écran pour toute interaction,
navigation, popups, formulaires, listes déroulantes. Prendre une capture,
identifier les éléments, puis interagir.

## Cookies / Consentement
Une popup s'ouvre au chargement. Chercher visuellement le bouton « Non merci » ou
« Refuser ».

## Historique
- 2026-03-16 (Doctolib) : les composants React résistent au pilotage, la
  stratégie visuelle est adoptée.
- 2026-08-27 : l'API v1 rend `apply_url` et `archived_at`.
- 2026-09-13 : la recherche est fermée, les sitemaps et l'API la remplacent.
- 2026-09-16 (Riot) : `application_fields` décrit le parcours de
  l'agrégateur.
- 2026-09-18 (Pigment) : l'étiquette de contrat contredit l'employeur.
