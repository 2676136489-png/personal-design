/** 逐张截作品卡，用来肉眼确认三格素材各不相同。 */
import { mkdirSync, writeFileSync } from 'node:fs';

const CDP = 'http://127.0.0.1:9333';
const OUT = new URL('../screenshots/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const BASE = 'http://127.0.0.1:5201/';

const target = await (
  await fetch(`${CDP}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' })
).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
let seq = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = ++seq;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result);
    pending.delete(msg.id);
  }
};
await new Promise((r) => (ws.onopen = r));
await send('Page.enable');
await send('Runtime.enable');
await send('Network.enable');
await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: `${BASE}?cb=${Date.now()}` });
await new Promise((r) => setTimeout(r, 4000));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

for (const index of [1, 2, 3, 5, 8]) {
  await send('Runtime.evaluate', {
    expression: `document.querySelectorAll('.v3-stack-item')[${index}].scrollIntoView({block:'start'})`,
  });
  await wait(1400);
  const cap = await send('Page.captureScreenshot', { format: 'png' });
  const file = new URL(`v3-card-${String(index + 1).padStart(2, '0')}.png`, OUT);
  writeFileSync(file, Buffer.from(cap.data, 'base64'));
  console.log(`card ${index + 1} -> ${file.pathname}`);
}
ws.close();
process.exit(0);
