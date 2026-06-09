# Parcours de cartes LinkedIn, document de conception

Boucle de triage d'offres sur un flux LinkedIn, construite par-dessus le socle
du harnais (tools/linkedin-harness/). Réalise le besoin FR-3 du harnais,
parcourir les cartes d'un flux une à une et en extraire le contenu, et le
prolonge en boucle de décision. C'est la concrétisation pour la cible Claude
Code de la recherche d'offres de preparation.md §2.1, alimentant la shortlist
de §2.2. Elle remplace la ligne Control Chrome pour cette cible.

## Objectif

L'agent parcourt un flux d'offres, lit chaque offre en entier, décide de la
retenir ou de l'écarter, et s'arrête quand il a atteint un nombre de shortlists
fixé au départ. Les offres retenues deviennent des pages enfants sous la racine
Notion du candidat, conformes au modèle de page candidature de modele-notion.md.
Les offres écartées sont masquées dans le flux par le bouton Dismiss de
LinkedIn.

## Périmètre

Dans le périmètre. Le driver de parcours, l'écriture Notion directe par jeton
d'intégration, l'état de reprise, le contrat de décision par carte.

Hors périmètre. La restructuration du dépôt en plugin (D-35 à venir).
L'empaquetage en skill de triage autonome. La rotation automatique entre flux
sur plusieurs sessions. Le périmètre reste un flux par session, choisi à la
main.

## Architecture

Le partage suit le facteur 8 des 12 facteurs des agents, le maximum de flux de
contrôle dans le code. Le harnais possède toute la mécanique. Le modèle ne
possède qu'un jugement par carte.

Le driver (walk.mjs) possède la lecture du détail d'une carte, l'avance à la
carte suivante, le passage de page par View next page, le rechargement du flux
pour réalimenter la première page après des Dismiss, le compte des shortlists
vers la cible, l'arrêt à la cible, et l'écriture Notion. Il s'attache au
chromium persistant par le bootstrap attach.mjs déjà validé.

Le modèle possède une seule décision par carte, parmi trois, et le contenu de
la page quand il retient l'offre. Il pèse l'offre contre les critères du
candidat, déjà chargés en contexte par le workflow hôte depuis la Fiche
candidat. Le driver ne lit jamais les critères, ce qui garde le harnais
agnostique (facteur 10).

L'écriture Notion est directe, par l'API REST avec un jeton d'intégration, sans
passer par le MCP (décision de l'utilisateur, facteur 8 mené à son terme).

## Contrat de décision par carte

À chaque carte, le modèle rend une décision structurée (facteur 4, les outils
sont des sorties structurées). Trois actions.

L'action shortlist porte un objet `{title, content, summary}`. Le titre est
celui de la page candidature, nom de l'entreprise plus intitulé du poste. Le
contenu est l'analyse d'adéquation sur les trois dimensions de preparation.md
§2.2 (correspondances et écarts honnêtes, motivation pour l'entreprise,
différenciation). Le résumé est une ligne pour l'index sur la page racine.

L'action reject ne porte rien d'autre. Le driver tient déjà le titre de la
carte courante pour le libellé du bouton Dismiss.

L'action stop est l'échappatoire. Elle termine la collecte avant la cible,
quand le modèle ou le candidat juge que le flux ne vaut plus la peine.

## Déroulé de la boucle

Le driver est un réducteur (facteur 12). Chaque invocation lit l'état, applique
la décision, écrit le nouvel état, et rend le détail de la carte suivante.
L'état vit dans un fichier de run sous tmp/ du harnais, ignoré par git. Il porte
le flux, la cible, la liste des shortlists faites avec leur identifiant de page
Notion, le compte des Dismiss, et la page courante du flux.

Une carte est un tour, parce que le jugement exige que le modèle lise la
description, ce qui est incompressible. Après la première carte, chaque tour est
un seul appel qui applique la décision et rend la carte suivante dans la même
réponse.

Sous-commandes du driver.

- `walk.mjs start --stream <slug> --target <n> --root <pageId>` s'attache,
  navigue vers /jobs/collections/<slug>/, initialise l'état, place le focus sur
  la première carte, et rend son détail plus l'avancement (0 sur n).
- `walk.mjs decide --action reject` clique le bouton Dismiss de la carte
  courante, avance, et rend la carte suivante plus l'avancement. Si la liste est
  épuisée, le driver clique View next page, ou recharge pour réalimenter la
  première page après des Dismiss. S'il ne reste aucune carte, il rend un état
  terminé avec la raison épuisement.
- `walk.mjs decide --action shortlist --record <chemin>` lit l'objet de
  décision, crée la sous-page Notion sous la racine, écrit le contenu dans le
  corps de la page, ajoute une ligne d'index datée sur la racine, incrémente le
  compte, puis avance et rend la carte suivante. Si le compte atteint la cible,
  il rend un état terminé avec la raison cible atteinte.
- `walk.mjs decide --action stop` termine et rend le résumé de run.
- `walk.mjs status` rend l'état courant sans agir, pour la reprise (facteur 6).

## Détail de carte rendu

Le driver rend un objet structuré par carte, pas un bloc de prose. Il porte
l'identifiant d'offre, le titre, l'entreprise, le lieu, le type de présence, la
description, l'URL, et le slug de collection. Le modèle compacte chaque carte en
une décision et ne retient pas la description brute, ce qui garde le contexte
maîtrisé sur une longue boucle (facteur 3).

## Sélecteurs d'accessibilité

Repris de la carte des flux du harnais (tools/linkedin-harness/DESIGN.md).

- La page d'un flux est /jobs/collections/<slug>/, vue à deux panneaux, liste à
  gauche et détail à droite.
- Le bouton de masquage est getByRole('button', { name: `Dismiss ${title}` }).
- Le passage de page est getByRole('button', { name: 'View next page' }).
- L'appartenance d'une carte se lit dans le segment /jobs/collections/<slug>/ de
  son href.

Les noms accessibles observés sont en anglais sur le compte de l'utilisateur.
Le driver dépend donc de la locale de l'interface LinkedIn, ce qui est une
limite connue.

## Intégration Notion

Le jeton d'intégration vient de la variable NOTION_TOKEN, sinon du fichier
~/.config/candidature/notion.env. Le driver s'arrête avec les instructions de
configuration si aucun des deux n'est présent.

L'intégration est de type jeton d'accès, à l'échelle de l'espace de travail,
avec les capacités lecture, insertion et mise à jour de contenu. Elle est
connectée à la page racine. La connexion se propage aux sous-pages, donc elle
couvre la lecture de la Fiche candidat et la création d'enfants sous la racine.

La racine est la page hub Recherche d'emploi (32fec6ce980181558099fd4f5ac9ed46).
Elle contient cinq sous-pages, la Fiche candidat qui porte les critères, plus
Recherches, Tendances, Passations et Sites. Sous une section Candidatures, elle
liste chaque candidature comme page enfant, suivie d'une ligne de résumé dans le
corps de la racine. Son identifiant est passé au driver par l'agent via --root,
l'agent le tenant de la configuration du workflow. Le driver ne résout pas la
racine lui-même.

La création d'une shortlist suit le motif déjà en place sur cette page. Elle crée
une page enfant de la racine, que l'API Notion ajoute à la fin du contenu, ce qui
satisfait le besoin de garder les nouvelles offres en fin de page parente. Elle
ajoute ensuite un paragraphe de résumé daté juste après, dans le corps de la
racine, comme les lignes de résumé existantes sous chaque candidature.

Note de cohérence. modele-notion.md affirme que la racine ne contient pas de
contenu propre. La page réelle le contredit, elle porte une section Situation et
une section Candidatures avec un résumé par offre. La documentation du modèle est
périmée. La corriger relève du câblage du skill, pas de cet incrément.

## Cartographie des 12 facteurs

Facteur 10, agents petits et ciblés. Le parcours fait une chose, trier un flux
vers une cible de shortlists. Il ne rédige pas de CV et ne remplit pas de
formulaire.

Facteur 8, posséder son flux de contrôle. Avance, pagination, rechargement,
compte et arrêt sont dans le code. Le modèle ne décide ni page suivante ni fin.

Facteur 12, réducteur sans état. Chaque itération est une fonction de l'état et
de la carte vers un nouvel état, externalisé dans le fichier de run.

Facteur 6, lancer, suspendre, reprendre. L'état de run et la sous-commande
status rendent la boucle reprenable d'une session à l'autre.

Facteur 7, contacter l'humain par un appel d'outil. Connexion, double
authentification et CAPTCHA rendent la main, comme NFR-1 du harnais.
L'échappatoire stop rend aussi la main quand le flux ne vaut plus la peine.

Facteur 4, les outils sont des sorties structurées. Le détail de carte et l'objet
de décision sont structurés.

Facteur 9, compacter les erreurs en contexte. Un sélecteur manquant rend une
erreur courte et reprend un instantané de l'arbre d'accessibilité, sans déverser
de trace.

Facteur 3, maîtriser sa fenêtre de contexte. Chaque carte est compactée en
décision, la description brute n'est pas conservée.

## Décisions ouvertes pour la relecture

Page par offre contre page de session. Le motif dominant de la racine est une
page candidature par offre, ce que retient cette spec. La racine porte aussi une
page Prospection LinkedIn datée d'une session passée, un journal de run distinct.
À confirmer si le parcours doit aussi produire une page de session, ou seulement
les pages par offre et le résumé de run rendu à l'agent.

La rotation entre flux reste manuelle, sans marqueur persistant. Le résumé de
run note le flux parcouru. Un flux par session, choisi à la main, pour ne pas
épuiser la qualité d'un même flux.

Le câblage de ce parcours dans la prose du skill, preparation.md §2.1 et §2.2,
et l'intégration à la cible plugin, sont un suivi rattaché à la restructuration
plugin (D-35), pas à cet incrément.

## Historique

Session du 2026-06-09. Conception du parcours de cartes par-dessus le socle du
harnais validé les 2026-06-08 et 2026-06-09. Choix de l'écriture Notion directe
par jeton d'intégration plutôt que par le MCP.
