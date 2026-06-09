// Client Notion du parcours. Constructeurs purs des charges, plus écriture REST
// par jeton d'intégration. Aucun passage par le MCP.
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';
const TOKEN_FILE = join(homedir(), '.config', 'candidature', 'notion.env');

export function loadToken({ env = process.env, file = TOKEN_FILE } = {}) {
  if (env.NOTION_TOKEN) return env.NOTION_TOKEN;
  try {
    const m = readFileSync(file, 'utf8').match(/^NOTION_TOKEN=(.+)$/m);
    if (m) return m[1].trim();
  } catch {
    // fichier absent ou illisible, on tombe sur l'erreur explicite ci-dessous
  }
  throw new Error(
    `Jeton Notion absent. Définir NOTION_TOKEN, ou écrire NOTION_TOKEN=ntn_... dans ${file} puis chmod 600.`,
  );
}

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

async function notionFetch(path, { method = 'POST', body, token, fetch = globalThis.fetch }) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Notion ${method} ${path} a échoué (${res.status}) : ${JSON.stringify(json)}`);
  }
  return json;
}

export async function createShortlistPage(record, { rootId, token, dateStr, fetch = globalThis.fetch }) {
  const page = await notionFetch('/pages', { body: buildPagePayload(rootId, record), token, fetch });
  await notionFetch(`/blocks/${rootId}/children`, {
    method: 'PATCH',
    body: { children: [buildIndexParagraph(record, dateStr)] },
    token,
    fetch,
  });
  return { pageId: page.id, url: page.url };
}
