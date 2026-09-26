#!/usr/bin/env node
// Client CDP brut, attaché à un onglet existant du registre de tab.mjs par son
// targetId. Parle au websocket de la page seule et ne touche à aucune autre
// cible. Sert quand connectOverCDP expire sur un iframe tiers (hCaptcha,
// « Apply with LinkedIn » sur Recruitee). Ne crée jamais d'onglet, c'est
// tab.mjs open qui les crée.
//
// Usage : node cdp.mjs --owner <proprio> [--tab <nom>] <commande> [args]
//   eval <js>            évalue une expression, résultat JSON
//   evalfile <chemin>    évalue le contenu d'un fichier, sans quoting shell
//   text [sel]           innerText de <main> ou du sélecteur
//   upload <sel> <file>  DOM.setFileInputFiles sur l'input fichier
//   click <sel>          clic souris réel au centre de l'élément
//   keys <texte>         frappe réelle caractère par caractère
//   key <touche>         Enter, Escape, Tab, ArrowDown ou ArrowUp
//   screenshot [chemin]  capture PNG, tmp/shot.png par défaut
//   show                 Page.bringToFront
//   raw <méthode> [json] appel CDP quelconque, résultat tronqué
import fs from 'node:fs';
import path from 'node:path';
import { readRegistry, listTargets } from './lib/tabs.mjs';
import { connectTarget } from './lib/cdp-client.mjs';

function parseArgs(argv) {
  const out = { owner: null, tab: 'navette', rest: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--owner') out.owner = argv[++i];
    else if (a === '--tab') out.tab = argv[++i];
    else out.rest.push(a);
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
if (!args.owner || args.rest.length === 0) {
  console.error('usage : node cdp.mjs --owner <proprio> [--tab <nom>] <commande> [args]');
  process.exit(2);
}

const targetId = readRegistry(args.owner)[args.tab];
if (!targetId) {
  console.error(`erreur : aucun onglet « ${args.tab} » pour « ${args.owner} »`);
  process.exit(3);
}

// La cible doit déjà exister, ce client ne crée rien.
const target = (await listTargets()).find((t) => t.id === targetId);
if (!target) {
  console.error(`erreur : la cible ${targetId} n'existe plus. Ne pas la recréer ici, tab.mjs adopt la retrouve si la page vit ailleurs.`);
  process.exit(3);
}

const { send, close } = await connectTarget(target.webSocketDebuggerUrl);

async function evaluate(expr, { returnByValue = true } = {}) {
  const r = await send('Runtime.evaluate', {
    expression: expr,
    returnByValue,
    awaitPromise: true,
    userGesture: true,
  });
  if (r.exceptionDetails) {
    throw new Error(
      r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails),
    );
  }
  return r.result;
}

const cmd = args.rest[0];
const rest = args.rest.slice(1);
let code = 0;

try {
  if (cmd === 'eval' || cmd === 'evalfile') {
    const expr = cmd === 'eval' ? rest.join(' ') : fs.readFileSync(rest[0], 'utf8');
    const r = await evaluate(expr);
    console.log(JSON.stringify(r.value, null, 2));
  } else if (cmd === 'text') {
    const sel = rest[0] || null;
    const expr = sel
      ? `(() => { const e = document.querySelector(${JSON.stringify(sel)}); return e ? e.innerText : null; })()`
      : `(document.querySelector('main') || document.body).innerText`;
    const r = await evaluate(expr);
    console.log(r.value);
  } else if (cmd === 'upload') {
    const sel = rest[0];
    const files = rest.slice(1).map((f) => path.resolve(f));
    for (const f of files) {
      if (!fs.existsSync(f)) throw new Error(`fichier introuvable : ${f}`);
    }
    const doc = await send('DOM.getDocument', { depth: 0 });
    const found = await send('DOM.querySelector', {
      nodeId: doc.root.nodeId,
      selector: sel,
    });
    if (!found.nodeId) throw new Error(`sélecteur introuvable : ${sel}`);
    await send('DOM.setFileInputFiles', { files, nodeId: found.nodeId });
    console.log(`téléversé sur ${sel} : ${files.join(', ')}`);
  } else if (cmd === 'show') {
    await send('Page.bringToFront');
    console.log(`au premier plan : ${args.owner}/${args.tab}`);
  } else if (cmd === 'click') {
    // Clic de confiance : on amène l'élément à l'écran, on lit son centre, puis
    // on envoie de vrais événements souris. Préféré à element.click() sur un
    // formulaire protégé par un anti-spam.
    const sel = rest[0];
    const box = await evaluate(`(async () => {
      const e = document.querySelector(${JSON.stringify(sel)});
      if (!e) return null;
      e.scrollIntoView({ block: 'center' });
      await new Promise((r) => setTimeout(r, 600));
      const r = e.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), t: (e.innerText || '').trim() };
    })()`);
    if (!box.value) throw new Error(`sélecteur introuvable : ${sel}`);
    const { x, y, t } = box.value;
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none', clickCount: 0 });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    console.log(`cliqué : ${sel} « ${t} » à (${x},${y})`);
  } else if (cmd === 'keys') {
    // Frappe réelle par Input.dispatchKeyEvent : événements de confiance, seuls
    // acceptés par certains composants (downshift, compteurs de caractères).
    for (const ch of rest.join(' ')) {
      const vk = ch.toUpperCase().charCodeAt(0);
      await send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key: ch,
        code: `Key${ch.toUpperCase()}`,
        text: ch,
        unmodifiedText: ch,
        windowsVirtualKeyCode: vk,
      });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ch, code: `Key${ch.toUpperCase()}`, windowsVirtualKeyCode: vk });
      await new Promise((r) => setTimeout(r, 40));
    }
    console.log(`frappé : ${rest.join(' ')}`);
  } else if (cmd === 'key') {
    const map = { Enter: 13, Escape: 27, Tab: 9, ArrowDown: 40, ArrowUp: 38 };
    const k = rest[0];
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: k, code: k, windowsVirtualKeyCode: map[k] || 0 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code: k, windowsVirtualKeyCode: map[k] || 0 });
    console.log(`touche : ${k}`);
  } else if (cmd === 'screenshot') {
    const out = path.resolve(rest[0] || 'tmp/shot.png');
    const r = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(out, Buffer.from(r.data, 'base64'));
    console.log(out);
  } else if (cmd === 'raw') {
    const r = await send(rest[0], rest[1] ? JSON.parse(rest[1]) : {});
    console.log(JSON.stringify(r, null, 2).slice(0, 4000));
  } else {
    console.error(`commande inconnue : ${cmd}`);
    code = 2;
  }
} catch (e) {
  console.error('erreur :', e.message);
  code = 1;
} finally {
  close();
}
process.exit(code);
