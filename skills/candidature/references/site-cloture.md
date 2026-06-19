# Clôture d'interaction site

Instructions après toute interaction avec un site d'emploi ou un site
carrière. Applicable après une recherche d'offres sur un job board comme
après l'envoi d'une candidature.

## Capture

Après chaque interaction avec un site de candidature, demander au
candidat :

> "Des difficultés avec le site ?"

Lire ou écrire le fichier du site, `sites/<site>.md` sous le répertoire
racine, pour cette plateforme. Voir `references/backend-write.md` pour le
contrôle d'écriture. L'écriture est obligatoire, même si le candidat répond
"non" ou "RAS". Chaque observation est datée et associée à la version du
skill.

Si aucun fichier n'existe pour ce site, le créer avec le nom de la
plateforme, la date de découverte et l'entreprise associée. Si le fichier
existe déjà, le compléter avec les nouvelles observations.

Chaque observation porte sa source. Le retour du candidat est ce que
l'utilisateur signale après l'interaction. L'observation autonome est ce
que l'agent détecte pendant l'interaction (contournement, comportement
non standard, formulaire multi-étapes inhabituel, comportement JavaScript
particulier). Inclure les observations autonomes même si le candidat n'a
rien signalé.

Quand l'agent adopte un contournement pendant l'interaction (remplissage,
navigation, téléversement), l'enregistrer avec le problème rencontré, la
solution adoptée et le résultat.

## Consolidation

La consolidation périodique des observations du stockage (`sites/<site>.md`)
vers les fichiers de référence du skill (`references/sites/*.md`) est décrite
dans `references/consolidation.md`.
