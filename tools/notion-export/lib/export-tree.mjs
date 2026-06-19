// Orchestrateur : parcourt l'arbre depuis rootId, classe chaque page racine,
// apparie chaque candidature avec son paragraphe-index, écrit les fichiers via
// write(relPath, content). Ne fait transiter aucun contenu par la sortie agent.
import { listChildren } from './client.mjs';
import { blocksToMarkdown } from './markdown.mjs';
import { classifyRootChild, splitTitle, parseStatusLine, slugify } from './classify.mjs';
import { toFrontmatter } from './frontmatter.mjs';

const plain = (rt = []) => rt.map((t) => t.plain_text).join('');

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

export async function exportTree({ rootId, outDir, token, fetch, write, dateStr }) {
  const ctx = { token, fetch, depth: 0 };
  const counts = { candidatures: 0, passations: 0, sites: 0, recherches: 0, styles: 0 };
  const aTrier = [];
  const ecarts = [];

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
    const slug = `${date}-${slugify(entreprise)}`;
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
      await write(`${dir}/${slugify(cp.title)}.md`, `# ${cp.title}\n\n${sub.markdown}`);
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
        const cps = await writeSimplePage(b.id, 'fiche-candidat.md', ctx, write);
        for (const cp of cps) { const s = await pageMarkdown(cp.id, ctx); await write(`ressources/${slugify(cp.title)}.md`, s.markdown); counts.styles++; }
      } else if (kind === 'tendances') {
        await writeSimplePage(b.id, 'tendances.md', ctx, write);
      } else if (kind === 'style') {
        await writeSimplePage(b.id, `ressources/${slugify(b.child_page.title)}.md`, ctx, write); counts.styles++;
      } else if (kind === 'recherches' || kind === 'sites' || kind === 'passations') {
        const sub = await listChildren(b.id, ctx);
        const dirByKind = { recherches: 'recherches', sites: 'sites', passations: 'Archive/passations' };
        for (const child of sub.filter((x) => x.type === 'child_page')) {
          const md = await pageMarkdown(child.id, ctx);
          await write(`${dirByKind[kind]}/${slugify(child.child_page.title)}.md`, `# ${child.child_page.title}\n\n${md.markdown}`);
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
