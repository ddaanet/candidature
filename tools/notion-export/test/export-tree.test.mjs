import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exportTree } from '../lib/export-tree.mjs';

const rt = (s) => [{ type: 'text', plain_text: s, annotations: {} }];
const page = (id, title, has_children = false) => ({ id, type: 'child_page', has_children, child_page: { title } });
const para = (id, s) => ({ id, type: 'paragraph', has_children: false, paragraph: { rich_text: rt(s) } });
const h1 = (id, s) => ({ id, type: 'heading_1', has_children: false, heading_1: { rich_text: rt(s) } });

// Arbre : racine -> [intro, Fiche candidat, Recherches, Tendances, Passations, Sites,
//   H1 Situation, situation-para, H1 Candidatures, Mirakl + index]
const TREE = {
  root: [
    para('i', 'Hub.'),
    page('fc', 'Fiche candidat - David Allouche', true),
    page('re', 'Recherches', true),
    page('te', 'Tendances', true),
    page('pa', "Passations Recherche d’emploi", true),
    page('si', 'Sites', true),
    h1('hs', 'Situation'),
    para('sp', 'Pipeline en cours.'),
    h1('hc', 'Candidatures'),
    page('mk', 'Mirakl — Senior AI Agent Engineer', true),
    para('mki', 'Soumise le 2026-04-09 via Greenhouse mirakllabs. Statut : refus le 2026-04-13. Senior AI Agent Engineer.'),
  ],
  fc: [para('fcp', 'Profil David.')],
  re: [page('re1', 'Platform Engineer — Assurtech — 2026-04-02', true)],
  re1: [para('re1p', 'Note de recherche.')],
  te: [para('tep', 'Tendance marché.')],
  pa: [page('pa1', '2026-03-22 08:08 — Candidature Pigment', true)],
  pa1: [para('pa1p', 'Passation.')],
  si: [page('si1', 'Greenhouse', true)],
  si1: [para('si1p', 'Fiche ATS Greenhouse.')],
  mk: [para('mkp', 'Senior AI Agent Engineer, Paris. Métadonnées.')],
};

function stub() {
  const fetch = async (url) => {
    const m = url.match(/\/blocks\/([^/]+)\/children/);
    const id = m[1];
    return { ok: true, status: 200, json: async () => ({ results: TREE[id] || [], has_more: false, next_cursor: null }) };
  };
  const files = new Map();
  const write = async (rel, content) => { files.set(rel, content); };
  return { fetch, write, files };
}

test('exportTree route chaque page vers le bon fichier', async () => {
  const { fetch, write, files } = stub();
  const report = await exportTree({ rootId: 'root', outDir: '', token: 't', fetch, write, dateStr: '2026-06-19' });

  assert.ok(files.has('fiche-candidat.md'));
  assert.ok(files.has('tendances.md'));
  assert.ok(!files.has('situation.md'), "la section Situation n'est pas exportée");
  assert.ok([...files.keys()].some((k) => k.startsWith('recherches/')));
  assert.ok([...files.keys()].some((k) => k.startsWith('sites/')));
  assert.ok([...files.keys()].some((k) => k.startsWith('Archive/passations/')));

  // Candidature Mirakl : dossier daté + README avec frontmatter statut.
  const readme = [...files.entries()].find(([k]) => k.startsWith('candidatures/') && k.endsWith('README.md'));
  assert.ok(readme, 'README candidature présent');
  assert.match(readme[0], /candidatures\/2026-04-09-mirakl\/README\.md/);
  assert.match(readme[1], /^---\n/);
  assert.match(readme[1], /statut: refus/);
  assert.match(readme[1], /entreprise: Mirakl/);
  assert.match(readme[1], /canal: Greenhouse mirakllabs/);

  assert.equal(report.counts.candidatures, 1);
  assert.equal(report.counts.passations, 1);
  assert.equal(report.counts.sites, 1);
  assert.equal(report.counts.recherches, 1);
});

test('exportTree range les paragraphes orphelins dans _a-trier', async () => {
  const { fetch, write, files } = stub();
  TREE.root.push(para('orph', '2026-06-16. Prospect sans page. Via LinkedIn.'));
  await exportTree({ rootId: 'root', outDir: '', token: 't', fetch, write, dateStr: '2026-06-19' });
  TREE.root.pop();
  assert.ok(files.has('candidatures/_a-trier.md'));
  assert.match(files.get('candidatures/_a-trier.md'), /Prospect sans page/);
});

// Stub paramétré par un arbre local, pour isoler les cas de collision de slug.
function stubWith(tree) {
  const fetch = async (url) => {
    const id = url.match(/\/blocks\/([^/]+)\/children/)[1];
    return { ok: true, status: 200, json: async () => ({ results: tree[id] || [], has_more: false, next_cursor: null }) };
  };
  const files = new Map();
  const write = async (rel, content) => { files.set(rel, content); };
  return { fetch, write, files };
}

test('deux sites homonymes produisent deux fichiers distincts', async () => {
  const tree = {
    root: [page('si', 'Sites', true)],
    si: [page('g1', 'Greenhouse', true), page('g2', 'Greenhouse', true)],
    g1: [para('g1p', 'Fiche structure du formulaire.')],
    g2: [para('g2p', 'Fiche stratégie de remplissage.')],
  };
  const { fetch, write, files } = stubWith(tree);
  const report = await exportTree({ rootId: 'root', outDir: '', token: 't', fetch, write, dateStr: '2026-06-19' });

  assert.ok(files.has('sites/greenhouse.md'), 'première fiche conservée');
  assert.ok(files.has('sites/greenhouse-2.md'), 'seconde fiche non écrasée');
  assert.match(files.get('sites/greenhouse.md'), /structure du formulaire/);
  assert.match(files.get('sites/greenhouse-2.md'), /stratégie de remplissage/);
  assert.equal(report.counts.sites, 2);
});

test('deux candidatures même employeur même date produisent deux dossiers distincts', async () => {
  const tree = {
    root: [
      h1('hc', 'Candidatures'),
      page('a1', 'Acme — Backend Engineer', true),
      para('a1i', 'Soumise le 2026-04-09 via Lever. Statut : refus. Backend Engineer.'),
      page('a2', 'Acme — Frontend Engineer', true),
      para('a2i', 'Soumise le 2026-04-09 via Lever. Statut : refus. Frontend Engineer.'),
    ],
    a1: [para('a1p', 'Poste backend.')],
    a2: [para('a2p', 'Poste frontend.')],
  };
  const { fetch, write, files } = stubWith(tree);
  const report = await exportTree({ rootId: 'root', outDir: '', token: 't', fetch, write, dateStr: '2026-06-19' });

  assert.ok(files.has('candidatures/2026-04-09-acme/README.md'), 'première candidature conservée');
  assert.ok(files.has('candidatures/2026-04-09-acme-2/README.md'), 'seconde candidature non écrasée');
  assert.match(files.get('candidatures/2026-04-09-acme/README.md'), /poste: Backend Engineer/);
  assert.match(files.get('candidatures/2026-04-09-acme-2/README.md'), /poste: Frontend Engineer/);
  assert.equal(report.counts.candidatures, 2);
});
