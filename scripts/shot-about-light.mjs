/**
 * 切主题截「关于」区。
 *
 * 深色是默认，浅色下卡片底色、分隔线、按钮边框全是另一套值 ——
 * 只看深色截图很容易漏掉「浅色下这条线看不见」这类问题。
 *
 * 用法：node scripts/shot-about-light.mjs [url] [cdp端口] [宽度]
 */
import { mkdirSync, writeFileSync } from 'node:fs';

const url = process.argv[2] || 'http://127.0.0.1:5176/';
const CDP = process.argv[3] || '9361';
const WIDTH = Number(process.argv[4] || 1440);

const target = await (
  await fetch(`http://127.0.0.1:${CDP}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })
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
  width: WIDTH, height: 1100, deviceScaleFactor: 2, mobile: false,
});
await send('Page.navigate', { url });
await new Promise((r) => setTimeout(r, 2400));

const evaluate = async (expression) =>
  (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }))?.result?.value;

await evaluate(`(() => {
  localStorage.setItem('portfolio-theme-v2', 'light');
  document.documentElement.setAttribute('data-theme', 'light');
  const st = document.createElement('style');
  st.textContent = '[data-reveal]{opacity:1 !important;transform:none !important}';
  document.head.appendChild(st);
  document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
  return document.documentElement.getAttribute('data-theme');
})()`);
await evaluate(`(async () => {
  const imgs = [...document.querySelectorAll('.about-profile img')];
  await Promise.all(imgs.map((i) => (i.decode ? i.decode().catch(() => {}) : null)));
  return imgs.length;
})()`);
await new Promise((r) => setTimeout(r, 700));

/* 顺便量一下分隔线在浅色下的实际颜色 ——
   var(--line) 在两套主题里是不同的值，肉眼看着都「有条线」，
   但对比度可能差很多。 */
const lineInfo = await evaluate(`(() => {
  const g = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { color: cs.color, bg: cs.backgroundColor, border: cs.borderTopColor };
  };
  return JSON.stringify({
    theme: document.documentElement.getAttribute('data-theme'),
    card: g('.about-profile'),
    actions: g('.about-actions'),
    facts: g('.about-facts'),
  }, null, 1);
})()`);
console.log(lineInfo);

const box = await evaluate(`(() => {
  const grid = document.querySelector('.about-grid');
  const head = document.querySelector('.about .section-head');
  if (!grid) return null;
  const g = grid.getBoundingClientRect();
  const h = head ? head.getBoundingClientRect() : g;
  return {
    x: Math.max(0, g.left - 28),
    y: Math.max(0, h.top + window.scrollY - 20),
    width: Math.min(${WIDTH}, g.width + 56),
    height: Math.min(1400, g.bottom + window.scrollY - h.top + 40),
  };
})()`);
if (!box) {
  console.log('❌ 找不到 .about-grid');
  ws.close();
  process.exit(1);
}

const shot = await send('Page.captureScreenshot', {
  format: 'png', clip: { ...box, scale: 1.4 }, captureBeyondViewport: true,
});
mkdirSync('screenshots', { recursive: true });
const name = `about-light-${WIDTH}.png`;
writeFileSync(`screenshots/${name}`, Buffer.from(shot.data, 'base64'));
console.log(`已截图 screenshots/${name}`);
ws.close();
process.exit(0);
