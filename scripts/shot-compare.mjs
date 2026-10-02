/**
 * 改完间距后留一张对比图，用于确认视觉效果。
 *
 * 与 shoot-docs.mjs 的区别：那个抓线上主站（给 README 用），
 * 这个抓本地构建（改完还没发布时看效果用），只截关键区块。
 *
 * 用法：node scripts/shot-compare.mjs <端口> <cdp端口>
 */
import { mkdirSync, writeFileSync } from 'node:fs';

const PORT = process.argv[2] || '5270';
const CDP = process.argv[3] || '9333';
const BASE = `http://127.0.0.1:${PORT}`;

const target = await (
  await fetch(`http://127.0.0.1:${CDP}/json/new?${encodeURIComponent(`${BASE}/index.html`)}`, { method: 'PUT' })
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
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
  }
};
await new Promise((r) => { ws.onopen = r; });

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: 1440, height: 960, deviceScaleFactor: 2, mobile: false,
});

const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r?.result?.value;
};

/* 只截 hero 这一块。整页截图里这点间距变化根本看不出来，
   裁到 hero 才能一眼看出按钮和图之间空了多少。 */
const shootHero = async (name, hash) => {
  await send('Page.navigate', { url: `${BASE}/index.html${hash}` });
  await new Promise((r) => setTimeout(r, 2000));
  const box = await evaluate(`(() => {
    const inner = document.querySelector('.page-hero-inner');
    const shot = document.querySelector('.page-hero-shot');
    if (!inner || !shot) return null;
    const a = inner.getBoundingClientRect();
    const b = shot.getBoundingClientRect();
    const top = Math.min(a.top, b.top);
    const bottom = Math.max(a.bottom, b.top + 320);
    return { x: 0, y: Math.max(0, top - 20), width: 1440, height: Math.min(940, bottom - top + 40) };
  })()`);
  if (!box) { console.log('  ❌', name, '（找不到 hero）'); return; }
  const r = await send('Page.captureScreenshot', {
    format: 'png',
    clip: { ...box, scale: 1.5 },
    captureBeyondViewport: true,
  });
  mkdirSync('screenshots', { recursive: true });
  writeFileSync(`screenshots/${name}.png`, Buffer.from(r.data, 'base64'));
  console.log('  ✓', name);
};

await shootHero('fix-hero-opspilot', '#/opspilot');
await shootHero('fix-hero-research', '#/research');
ws.close();
process.exit(0);
