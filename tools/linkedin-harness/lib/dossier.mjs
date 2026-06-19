// Écriture du dossier candidature à la décision shortlist. Remplace l'écriture
// Notion par le stockage fichiers, version de format 1. Même record que l'ancien
// createShortlistPage, sortie fichier au lieu de page REST.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function frontmatter(record, dateStr, jobId) {
  const lines = [
    `entreprise: ${record.company}`,
    `poste: ${record.role}`,
    'statut: shortlist',
    `date_shortlist: ${dateStr}`,
  ];
  if (jobId != null) lines.push(`jobId: ${jobId}`);
  return ['---', ...lines, '---'].join('\n');
}

function body(record) {
  return [
    `# ${record.title}`,
    '',
    '## Offre',
    `Poste : ${record.role}. Lieu : ${record.location} (${record.workplace}). Offre : ${record.url}`,
    '',
    '## Adéquation et écarts',
    record.analysis.fit,
    '',
    '## Motivation',
    record.analysis.company,
    '',
    '## Différenciation',
    record.analysis.differentiation,
    '',
  ].join('\n');
}

export function renderDossier(record, dateStr, jobId = null) {
  return `${frontmatter(record, dateStr, jobId)}\n\n${body(record)}`;
}

export function createShortlistDossier(record, { root, dateStr, jobId = null }) {
  const name = `${dateStr}-${record.slug}`;
  const dir = join(root, 'candidatures', name);
  if (existsSync(dir)) {
    throw new Error(`Dossier déjà présent : ${dir}. Ajuster le slug du record.`);
  }
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'README.md'), renderDossier(record, dateStr, jobId));
  return { path: join('candidatures', name, 'README.md') };
}
