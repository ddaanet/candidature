// Client Notion du parcours. Constructeurs purs des charges, plus écriture REST
// par jeton d'intégration. Aucun passage par le MCP.
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';
const TOKEN_FILE = join(homedir(), '.config', 'candidature', 'notion.env');

function textBlock(type, content) {
  return { object: 'block', type, [type]: { rich_text: [{ type: 'text', text: { content } }] } };
}

export function buildPagePayload(rootId, record) {
  const meta = `Entreprise : ${record.company}. Poste : ${record.role}. Lieu : ${record.location} (${record.workplace}). Offre : ${record.url}`;
  const section = (heading, body) => [textBlock('heading_2', heading), textBlock('paragraph', body)];
  return {
    parent: { page_id: rootId },
    properties: { title: { title: [{ type: 'text', text: { content: record.title } }] } },
    children: [
      textBlock('paragraph', meta),
      ...section('Adéquation et écarts', record.analysis.fit),
      ...section('Motivation pour l’entreprise', record.analysis.company),
      ...section('Différenciation', record.analysis.differentiation),
    ],
  };
}

export function buildIndexParagraph(record, dateStr) {
  return textBlock('paragraph', `${dateStr}. ${record.summary}`);
}
