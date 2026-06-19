import 'plugin-dev/release.just'

# Recettes du repo candidature.

# Vérifications avant commit. gitlore et `just release` passent par cette porte.
precommit:
    ./build/build.sh
    ./check.sh
