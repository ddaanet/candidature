// Convertit une liste de blocs Notion en markdown. Les child_page sont collectés
// (pas rendus en ligne). Les conteneurs avec enfants (listes, tables) sont lus via
// listChildren. Couvre tous les types relevés dans l'arbre réel.
import { richTextToMarkdown } from './richtext.mjs';
import { listChildren } from './client.mjs';

const indent = (s, depth) => s.split('\n').map((l) => (l ? '  '.repeat(depth) + l : l)).join('\n');

async function tableToMarkdown(block, ctx) {
  const rows = await listChildren(block.id, ctx);
  const lines = [];
  rows.forEach((r, i) => {
    const cells = (r.table_row?.cells || []).map((c) => richTextToMarkdown(c).replace(/\|/g, '\\|'));
    lines.push(`| ${cells.join(' | ')} |`);
    if (i === 0 && block.table?.has_column_header) {
      lines.push(`| ${cells.map(() => '---').join(' | ')} |`);
    }
  });
  return lines.join('\n') + '\n';
}

export async function blocksToMarkdown(blocks, ctx) {
  const { depth = 0 } = ctx;
  const childPages = [];
  const parts = [];

  for (const b of blocks) {
    const data = b[b.type] || {};
    const text = data.rich_text ? richTextToMarkdown(data.rich_text) : '';
    let chunk = null;
    let childrenMarkdown = '';

    switch (b.type) {
      case 'heading_1': chunk = `# ${text}\n`; break;
      case 'heading_2': chunk = `## ${text}\n`; break;
      case 'heading_3': chunk = `### ${text}\n`; break;
      case 'paragraph': chunk = `${text}\n`; break;
      case 'quote': chunk = `> ${text}\n`; break;
      case 'divider': chunk = `---\n`; break;
      case 'code': chunk = `\`\`\`${data.language || ''}\n${text}\n\`\`\`\n`; break;
      case 'bulleted_list_item': chunk = `- ${text}`; break;
      case 'numbered_list_item': chunk = `1. ${text}`; break;
      case 'to_do': chunk = `- [${data.checked ? 'x' : ' '}] ${text}`; break;
      case 'table': chunk = await tableToMarkdown(b, { ...ctx, depth: 0 }); break;
      case 'child_page': childPages.push({ id: b.id, title: data.title }); continue;
      case 'child_database': continue;
      default: chunk = `<!-- bloc non géré: ${b.type} -->\n`;
    }

    const isListItem = b.type.endsWith('_list_item') || b.type === 'to_do';
    if (b.has_children && b.type !== 'table') {
      const sub = await blocksToMarkdown(await listChildren(b.id, ctx), { ...ctx, depth: depth + 1 });
      childPages.push(...sub.childPages);
      childrenMarkdown = sub.markdown;
    }

    if (isListItem) {
      parts.push(chunk + '\n' + (childrenMarkdown ? indent(childrenMarkdown, 1) : ''));
    } else {
      parts.push(chunk + '\n' + childrenMarkdown);
    }
  }

  // Joint : les items de liste collent (pas de ligne vide entre eux), les blocs
  // de niveau supérieur sont séparés par une ligne vide. On normalise en fin.
  let markdown = parts.join('');
  markdown = markdown.replace(/\n{3,}/g, '\n\n').replace(/\n+$/, '\n');
  return { markdown, childPages };
}
