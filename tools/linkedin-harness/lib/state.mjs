// État de run du parcours. Fonctions pures de réduction, plus lecture et
// écriture du fichier de run. L'agent ne retient rien, l'état vit ici.
import { readFileSync, writeFileSync } from 'node:fs';

export function initState({ stream, target, root, startedAt }) {
  return { stream, target, root, startedAt, dismissed: 0, accepted: [], seen: [], current: null };
}

export function setCurrent(state, card) {
  return { ...state, current: card };
}

// jobId des cartes déjà décidées. Le parcours avance vers la première carte non
// vue, ce qui saute les écartées, les retenues, et les recyclées au rechargement.
export function addSeen(state, jobId) {
  if (jobId == null || state.seen.includes(jobId)) return state;
  return { ...state, seen: [...state.seen, jobId] };
}

export function addShortlist(state, entry) {
  return { ...state, accepted: [...state.accepted, entry] };
}

export function addDismiss(state) {
  return { ...state, dismissed: state.dismissed + 1 };
}

export function targetMet(state) {
  return state.accepted.length >= state.target;
}

export function loadState(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    throw new Error(`État de run introuvable à ${path}. Lancer d'abord walk.mjs start. (${e.message})`);
  }
}

export function saveState(path, state) {
  writeFileSync(path, JSON.stringify(state, null, 2));
}
