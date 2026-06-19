// Sérialise un objet plat en bloc frontmatter YAML. Ignore les valeurs null/undefined.
export function toFrontmatter(obj) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    const s = String(v);
    const needsQuote = /[:#]|^[\s>|&*!?{}\[\]]/.test(s);
    lines.push(`${k}: ${needsQuote ? `"${s.replace(/"/g, '\\"')}"` : s}`);
  }
  lines.push('---', '');
  return lines.join('\n');
}
