# Préprocesseur des sources candidature.
# Usage : awk -v version=X.Y.Z -f preprocess.awk FICHIER
# Substitue {{VERSION}}. Le plugin a une seule cible, plus de blocs conditionnels.
# Portable mawk : pas de match() à trois arguments, pas d'extension gawk.
{
  line = $0
  gsub(/\{\{VERSION\}\}/, version, line)
  print line
}
