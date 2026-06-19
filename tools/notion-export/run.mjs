// Point d'entrée : node run.mjs [rootId] <outDir>. Écrit l'arbre exporté sous outDir.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { loadToken } from './lib/client.mjs';
import { exportTree } from './lib/export-tree.mjs';

const DEFAULT_ROOT = '32fec6ce980181558099fd4f5ac9ed46';
const args = process.argv.slice(2);
const rootId = args.length > 1 ? args[0] : DEFAULT_ROOT;
const outDir = args.length > 1 ? args[1] : args[0];
if (!outDir) {
  console.error('Usage : node run.mjs [rootId] <outDir>');
  process.exit(1);
}

const token = loadToken();
const write = async (rel, content) => {
  const abs = join(outDir, rel);
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, content, 'utf8');
};
// dateStr : passé en argument d'environnement pour rester déterministe et testable.
const dateStr = process.env.MIGRATION_DATE || new Date().toISOString().slice(0, 10);
const report = await exportTree({ rootId, token, fetch: globalThis.fetch, write, dateStr });
console.log('Compteurs :', JSON.stringify(report.counts));
console.log('À trier (prospects orphelins) :', report.aTrier.length);
console.log('Écarts (statut non parsé) :', report.ecarts.length);
for (const e of report.ecarts) console.log('  -', e);
