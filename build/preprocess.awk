# Préprocesseur des sources candidature.
# Usage : awk -v target=claude-ai|claude-code -v version=X.Y.Z -f preprocess.awk FICHIER
# Supprime les blocs dont la cible ne correspond pas, substitue {{VERSION}}.
# Portable mawk : pas de match() à trois arguments, pas d'extension gawk.
BEGIN { keep = 1 }
/^<!-- target: claude-ai -->$/   { keep = (target == "claude-ai");   next }
/^<!-- target: claude-code -->$/ { keep = (target == "claude-code"); next }
/^<!-- \/target -->$/            { keep = 1; next }
{
  if (keep) {
    line = $0
    gsub(/\{\{VERSION\}\}/, version, line)
    print line
  }
}
