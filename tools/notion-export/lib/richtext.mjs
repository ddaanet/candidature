// Convertit un tableau rich_text Notion en markdown inline. Ordre d'enveloppe :
// code, puis gras, puis italique, puis lien. Mentions/équations via plain_text.
export function richTextToMarkdown(richText) {
  if (!richText || richText.length === 0) return '';
  return richText
    .map((t) => {
      let s = t.plain_text ?? '';
      const a = t.annotations || {};
      if (a.code) s = `\`${s}\``;
      if (a.bold) s = `**${s}**`;
      if (a.italic) s = `*${s}*`;
      const href = t.href || t.text?.link?.url || null;
      if (href) s = `[${s}](${href})`;
      return s;
    })
    .join('');
}
