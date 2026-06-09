// Dossier de décision de shortlist. JSON écrit par l'agent, lu par le driver.
// Validation stricte, les champs manquants sont listés ensemble.
import { readFileSync } from 'node:fs';

const REQUIRED_STRINGS = ['title', 'company', 'role', 'location', 'workplace', 'url', 'summary'];
const REQUIRED_ANALYSIS = ['fit', 'company', 'differentiation'];

export function validateRecord(obj) {
  const missing = [];
  for (const k of REQUIRED_STRINGS) {
    if (typeof obj?.[k] !== 'string' || obj[k].trim() === '') missing.push(k);
  }
  if (typeof obj?.analysis !== 'object' || obj.analysis === null) {
    missing.push('analysis');
  } else {
    for (const k of REQUIRED_ANALYSIS) {
      if (typeof obj.analysis[k] !== 'string' || obj.analysis[k].trim() === '') {
        missing.push(`analysis.${k}`);
      }
    }
  }
  if (missing.length) {
    throw new Error(`Dossier de décision invalide, champs manquants ou vides : ${missing.join(', ')}`);
  }
  return obj;
}

export function loadRecord(path) {
  return validateRecord(JSON.parse(readFileSync(path, 'utf8')));
}
