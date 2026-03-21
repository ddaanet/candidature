# SmartRecruiters

## Approche
DOM peu fiable — shadow DOM web components bloquent les sélecteurs CSS
standard. Privilégier l'orientation visuelle pour les éléments de
formulaire.

## Contraintes techniques
- Shadow DOM : les web components encapsulent les champs de formulaire.
  Les sélecteurs CSS standard et `querySelector` ne traversent pas la
  barrière shadow.
- Points-virgules bloqués dans les champs texte (message body). Le site
  rejette silencieusement le contenu ou tronque. Ne jamais utiliser de
  points-virgules dans les lettres de motivation ou messages.

## Upload CV
Le Native Resume Viewer permet au recruteur de basculer entre vue PDF
et vue parsée. Uploader un PDF propre et bien structuré — la vue parsée
expose les défauts de mise en forme.

## Cookies / Consentement
À documenter.

## Historique
- 2026-03-19 (Dailymotion) — shadow DOM, points-virgules bloqués,
  Native Resume Viewer observés.
