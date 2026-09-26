// Client CDP brut sur le websocket d'une seule cible. Ne s'attache à aucune
// autre cible du navigateur, contrairement à connectOverCDP.
export async function connectTarget(webSocketDebuggerUrl, { timeoutMs = 180_000 } = {}) {
  const ws = new WebSocket(webSocketDebuggerUrl);
  let nextId = 1;
  const pending = new Map();
  const listeners = new Map();

  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    } else if (msg.method) {
      for (const fn of listeners.get(msg.method) ?? []) fn(msg.params);
    }
  });

  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', rej, { once: true });
  });

  function send(method, params = {}) {
    const id = nextId++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          reject(new Error(`timeout CDP sur ${method}`));
        }
      }, timeoutMs).unref();
    });
  }

  function on(method, fn) {
    listeners.set(method, [...(listeners.get(method) ?? []), fn]);
  }

  return { send, on, close: () => ws.close() };
}
