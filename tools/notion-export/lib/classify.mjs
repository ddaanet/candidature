// Classification des pages racine et parsing des lignes de statut candidature.
// Les regexes sont calées sur le format réel des paragraphes-index (relevé 2026-06-19).

export function slugify(s) {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function classifyRootChild(title) {
  const t = title.toLowerCase();
  if (t.startsWith('fiche candidat')) return 'fiche-candidat';
  if (t === 'recherches') return 'recherches';
  if (t === 'tendances') return 'tendances';
  if (t.startsWith('passations')) return 'passations';
  if (t === 'sites') return 'sites';
  if (t.includes('style cover letter')) return 'style';
  return 'candidature';
}

export function splitTitle(title) {
  const m = title.match(/^(.*?)\s*[—/]\s*(.*)$/);
  if (!m) return { entreprise: title.trim(), poste: '' };
  return { entreprise: m[1].trim(), poste: m[2].trim() };
}

const DATE = '(\\d{4}-\\d{2}-\\d{2})';

export function parseStatusLine(text) {
  const out = { statut: null, date_soumission: null, date_shortlist: null, date_reponse: null, canal: null, note: null };

  const soum = text.match(new RegExp(`Soumise le ${DATE}`));
  if (soum) out.date_soumission = soum[1];

  const shortlist = text.match(new RegExp(`Shortlist ${DATE}`));
  if (shortlist) out.date_shortlist = shortlist[1];

  // Canal : "via X." après une soumission, ou "Canal : X." pour une shortlist.
  const viaCanal = text.match(/\bvia ([^.]+?)(?:\.|$)/);
  const explicitCanal = text.match(/Canal\s*:\s*([^.\n]+)/);
  if (explicitCanal) out.canal = explicitCanal[1].trim();
  else if (viaCanal && out.date_soumission) out.canal = viaCanal[1].trim();

  // Statut : "Statut : VALEUR [le DATE] [(note)]."
  const st = text.match(new RegExp(`Statut\\s*:\\s*([^.(\\n]+?)(?:\\s+le ${DATE})?\\s*(\\([^)]*\\))?\\.`));
  if (st) {
    const raw = st[1].trim().toLowerCase();
    if (st[2]) out.date_reponse = st[2];
    if (st[3]) out.note = st[3];
    if (raw.startsWith('refus')) out.statut = 'refus';
    else if (raw.startsWith('classée sans suite') || raw.startsWith('classee sans suite')) out.statut = 'classée sans suite';
    else if (raw.startsWith('en attente')) out.statut = 'en attente';
    else if (raw.startsWith('retenue')) out.statut = 'retenue';
    else if (raw.startsWith('soumise')) out.statut = 'soumise';
    else out.statut = null;
    out.note = out.note || (raw.startsWith('refus') && raw !== 'refus' ? st[1].trim() : null);
  }

  if (!out.statut) {
    if (out.date_soumission) out.statut = 'soumise';
    else if (out.date_shortlist) out.statut = 'shortlist';
  }
  return out;
}
