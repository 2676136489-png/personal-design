/**
 * 抓线上作品集站点的三个不同画面，作为「个人作品集」项目卡的素材。
 * 用法：node scripts/capture-portfolio-views.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = new URL('../media-src/captured/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const CDP = 'http://127.0.0.1:9333';
const BASE = 'https://2676136489-png.github.io/personal-design/';

const VIEWS = [
  ['portfolio-hero', '#/'],
  ['portfolio-works', '#/works'],
  ['portfolio-detail', '#/opspilot'],
];

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
await send('Emulation.setDeviceMetricsOverride', {
  width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

for (const [name, hash] of VIEWS) {
  await send('Page.navigate', { url: `${BASE}?cb=${Date.now()}${hash}` });
  await wait(4500);
  const state = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `({ h: location.hash, title: document.title, text: (document.body.innerText || '').slice(0, 100) })`,
  });
  const cap = await send('Page.captureScreenshot', { format: 'png' });
  const file = new URL(`${name}.png`, OUT);
  writeFileSync(file, Buffer.from(cap.data, 'base64'));
  console.log(`${name}: ${JSON.stringify(state?.result?.value)} -> ${file.pathname}`);
}
ws.close();
process.exit(0);
