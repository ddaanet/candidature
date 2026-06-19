// Vérification scriptée : recompte Notion vs fichiers, contrôle le frontmatter statut.
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { loadToken, listChildren } from './lib/client.mjs';
import { classifyRootChild } from './lib/classify.mjs';

const DEFAULT_ROOT = '32fec6ce980181558099fd4f5ac9ed46';
const [rootArg, outArg] = process.argv.slice(2);
const rootId = outArg ? rootArg : DEFAULT_ROOT;
const outDir = outArg || rootArg;
const token = loadToken();

async function countFiles(dir, pred = () => true) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    let n = 0;
    for (const e of entries) if (pred(e)) n++;
    return n;
  } catch { return 0; }
}

const top = await listChildren(rootId, { token, fetch: globalThis.fetch });
const notion = { candidature: 0, passations: 0, sites: 0, recherches: 0, style: 0 };
for (const b of top) {
  if (b.type !== 'child_page') continue;
  const kind = classifyRootChild(b.child_page.title);
  if (kind === 'candidature') notion.candidature++;
  else if (kind === 'style') notion.style++;
}
// sous-pages des sections
const sub = async (title) => {
  const p = top.find((b) => b.type === 'child_page' && classifyRootChild(b.child_page.title) === title);
  if (!p) return 0;
  return (await listChildren(p.id, { token, fetch: globalThis.fetch })).filter((x) => x.type === 'child_page').length;
};
notion.passations = await sub('passations');
notion.sites = await sub('sites');
notion.recherches = await sub('recherches');

const candDir = join(outDir, 'candidatures');
const candDirs = (await readdir(candDir, { withFileTypes: true })).filter((e) => e.isDirectory());
let sansStatut = [];
for (const d of candDirs) {
  const readme = await readFile(join(candDir, d.name, 'README.md'), 'utf8').catch(() => '');
  if (!/^statut:\s*\S/m.test(readme)) sansStatut.push(d.name);
}

console.log('Notion (racine) :', JSON.stringify(notion));
console.log('Fichiers : candidatures =', candDirs.length,
  '| passations =', await countFiles(join(outDir, 'Archive/passations')),
  '| sites =', await countFiles(join(outDir, 'sites')),
  '| recherches =', await countFiles(join(outDir, 'recherches')));
console.log('Candidatures sans frontmatter statut :', sansStatut.length, sansStatut);
const ok = sansStatut.length === 0
  && (await countFiles(join(outDir, 'Archive/passations'))) === notion.passations
  && (await countFiles(join(outDir, 'sites'))) === notion.sites
  && (await countFiles(join(outDir, 'recherches'))) === notion.recherches;
console.log(ok ? 'VÉRIFICATION OK' : 'VÉRIFICATION : écarts à examiner');
process.exit(ok ? 0 : 1);
