// Orchestrateur : parcourt l'arbre depuis rootId, classe chaque page racine,
// apparie chaque candidature avec son paragraphe-index, écrit les fichiers via
// write(relPath, content). Ne fait transiter aucun contenu par la sortie agent.
import { listChildren } from './client.mjs';
import { blocksToMarkdown } from './markdown.mjs';
import { classifyRootChild, splitTitle, parseStatusLine, slugify } from './classify.mjs';
import { toFrontmatter } from './frontmatter.mjs';

const plain = (rt = []) => rt.map((t) => t.plain_text).join('');

// Réserve un nom unique dans un ensemble : base, puis base-2, base-3 sur collision.
// Deux entrées distinctes qui partagent un titre (deux fiches homonymes, deux
// candidatures même employeur même date) gardent chacune leur fichier.
function uniqueName(used, base) {
  let name = base;
  let n = 2;
  while (used.has(name)) name = `${base}-${n++}`;
  used.add(name);
  return name;
}

// Variante chemin : insère le suffixe avant l'extension (foo.md -> foo-2.md).
function uniquePath(used, rel) {
  const dot = rel.lastIndexOf('.');
  const stem = dot === -1 ? rel : rel.slice(0, dot);
  const ext = dot === -1 ? '' : rel.slice(dot);
  if (!used.has(rel)) { used.add(rel); return rel; }
  let n = 2;
  let candidate;
  do { candidate = `${stem}-${n++}${ext}`; } while (used.has(candidate));
  used.add(candidate);
  return candidate;
}

async function pageMarkdown(pageId, ctx) {
  const blocks = await listChildren(pageId, ctx);
  return blocksToMarkdown(blocks, ctx);
}

// Écrit une page "simple" (contenu + sous-pages éventuelles en fichiers frères).
async function writeSimplePage(pageId, relPath, ctx, write) {
  const { markdown, childPages } = await pageMarkdown(pageId, ctx);
  await write(relPath, markdown);
  return childPages;
}

export async function exportTree({ rootId, token, fetch, write, dateStr }) {
  const ctx = { token, fetch, depth: 0 };
  const counts = { candidatures: 0, passations: 0, sites: 0, recherches: 0, styles: 0 };
  const aTrier = [];
  const ecarts = [];
  // Suivi des sorties déjà écrites, pour ne jamais écraser une entrée distincte.
  const usedPaths = new Set();
  const usedCandSlugs = new Set();

  const top = await listChildren(rootId, ctx);

  // Découpe la racine : sections spéciales et candidatures (page + paragraphe-index
  // qui suit). La section Situation n'est pas exportée : elle est redondante avec le
  // statut de chaque offre (frontmatter) et l'historique git.
  let pendingCandidate = null;

  const flushCandidate = async () => {
    if (!pendingCandidate) return;
    const { page, indexText } = pendingCandidate;
    const { entreprise, poste } = splitTitle(page.child_page.title);
    const st = indexText ? parseStatusLine(indexText) : {};
    const date = st.date_soumission || st.date_shortlist || dateStr;
    const slug = uniqueName(usedCandSlugs, `${date}-${slugify(entreprise)}`);
    const dir = `candidatures/${slug}`;
    const fm = toFrontmatter({
      entreprise, poste,
      statut: st.statut || 'à trier',
      date_shortlist: st.date_shortlist, date_soumission: st.date_soumission, date_reponse: st.date_reponse,
      canal: st.canal,
    });
    const body = await pageMarkdown(page.id, ctx);
    await write(`${dir}/README.md`, `${fm}\n${indexText ? indexText + '\n\n' : ''}${body.markdown}`);
    // Sous-pages de la candidature (Lettre de motivation, Questions formulaire).
    for (const cp of body.childPages) {
      const sub = await pageMarkdown(cp.id, ctx);
      await write(uniquePath(usedPaths, `${dir}/${slugify(cp.title)}.md`), `# ${cp.title}\n\n${sub.markdown}`);
    }
    if (!st.statut) ecarts.push(`Statut non parsé : ${page.child_page.title}`);
    counts.candidatures++;
    pendingCandidate = null;
  };

  for (const b of top) {
    if (b.type === 'heading_1') {
      await flushCandidate(); // borne de section : H1 Situation, H1 Candidatures
      continue;
    }
    if (b.type === 'child_page') {
      const kind = classifyRootChild(b.child_page.title);
      if (kind === 'candidature') {
        await flushCandidate();
        pendingCandidate = { page: b, indexText: null };
        continue;
      }
      // Section spéciale : on vide une candidature en attente puis on traite.
      await flushCandidate();
      if (kind === 'fiche-candidat') {
        const cps = await writeSimplePage(b.id, uniquePath(usedPaths, 'fiche-candidat.md'), ctx, write);
        for (const cp of cps) { const s = await pageMarkdown(cp.id, ctx); await write(uniquePath(usedPaths, `ressources/${slugify(cp.title)}.md`), s.markdown); counts.styles++; }
      } else if (kind === 'tendances') {
        await writeSimplePage(b.id, uniquePath(usedPaths, 'tendances.md'), ctx, write);
      } else if (kind === 'style') {
        await writeSimplePage(b.id, uniquePath(usedPaths, `ressources/${slugify(b.child_page.title)}.md`), ctx, write); counts.styles++;
      } else if (kind === 'recherches' || kind === 'sites' || kind === 'passations') {
        const sub = await listChildren(b.id, ctx);
        const dirByKind = { recherches: 'recherches', sites: 'sites', passations: 'Archive/passations' };
        for (const child of sub.filter((x) => x.type === 'child_page')) {
          const md = await pageMarkdown(child.id, ctx);
          await write(uniquePath(usedPaths, `${dirByKind[kind]}/${slugify(child.child_page.title)}.md`), `# ${child.child_page.title}\n\n${md.markdown}`);
          counts[kind === 'passations' ? 'passations' : kind]++;
        }
      }
      continue;
    }
    if (b.type === 'paragraph') {
      const text = plain(b.paragraph.rich_text);
      if (pendingCandidate && pendingCandidate.indexText === null) {
        pendingCandidate.indexText = text; // premier paragraphe après la page = index
        continue;
      }
      if (pendingCandidate && text.trim()) aTrier.push(text); // prospect orphelin
      continue; // tout autre paragraphe (dont la section Situation) est ignoré
    }
  }
  await flushCandidate();

  // candidatures/_a-trier.md
  if (aTrier.length) {
    await write('candidatures/_a-trier.md', `# Prospects à trier manuellement\n\n${aTrier.map((t) => `- ${t}`).join('\n')}\n`);
  }

  return { counts, aTrier, ecarts };
}
