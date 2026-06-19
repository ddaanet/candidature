// Client Notion en lecture seule pour l'export ponctuel. Réutilise loadToken du
// linkedin-harness. Aucun passage par le MCP. fetch injectable pour les tests.
import { loadToken } from '../../linkedin-harness/lib/notion.mjs';

const API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

export { loadToken };

export async function notionGet(path, { token, fetch = globalThis.fetch }) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Notion-Version': NOTION_VERSION },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Notion GET ${path} a échoué (${res.status}) : ${JSON.stringify(json)}`);
  }
  return json;
}

export async function listChildren(blockId, { token, fetch = globalThis.fetch }) {
  const out = [];
  let cursor = null;
  do {
    const q = cursor ? `?start_cursor=${cursor}&page_size=100` : '?page_size=100';
    const j = await notionGet(`/blocks/${blockId}/children${q}`, { token, fetch });
    out.push(...j.results);
    cursor = j.has_more ? j.next_cursor : null;
  } while (cursor);
  return out;
}
