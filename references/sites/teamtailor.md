# Teamtailor

## Approche
DOM mixte. La plupart des champs sont accessibles, mais le file input
est masqué par Dropzone.js.

## Contraintes techniques
Le file input est masqué : `class="dz-hidden-input"`,
`id="candidate_resume_remote_url"`. Dropzone.js intercepte les clics
sur la zone d'upload et gère le fichier via JavaScript.

## Upload CV
Utiliser `file_upload` avec un chemin absolu dans un répertoire autorisé
par l'extension Chrome. Les répertoires autorisés incluent `~/code/` et
ses sous-répertoires. Les répertoires `/mnt/project/` et `/Documents/`
ne sont pas autorisés. Le fichier doit être copié dans `~/code/`
avant upload.

## Formulaire
Structure typique : canal (dropdown), prétentions salariales, prénom,
nom, email, téléphone, CV (upload), lettre de motivation (texte libre),
checkbox RGPD.

## Cookies / Consentement
À documenter.

## Historique
- 2026-03-17 (Wiremind) : file input masqué découvert, contournement
  chemin absolu validé.
