/**
 * 导航面板视觉快照：悬停到指定导航项，等动画完全停下，
 * 量一次真实几何并截图。用来肉眼核对列分区分得清不清、
 * 以及面板到底有没有铺满整页宽。
 *
 * 用法：node scripts/.shot-nav.mjs <url> <输出png> [导航项文字]
 * 前置：msedge --headless=new --remote-debugging-port=9222
 */
import { writeFileSync } from 'node:fs';

const url = process.argv[2];
const out = process.argv[3];
const label = process.argv[4] || '关于';
const base = 'http://127.0.0.1:9222';

const t = await (await fetch(`${base}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
let seq = 0;
const p = new Map();
const send = (m, q = {}) =>
  new Promise((r) => {
    const id = ++seq;
    p.set(id, r);
    ws.send(JSON.stringify({ id, method: m, params: q }));
  });
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && p.has(m.id)) {
    p.get(m.id)(m.result);
    p.delete(m.id);
  }
};
await new Promise((r) => {
  ws.onopen = r;
});
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await send('Page.navigate', { url });
await new Promise((r) => setTimeout(r, 2600));

const ev = async (x) => {
  const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true });
  return r?.result?.value;
};

await ev(
  `new Promise(r=>{const t0=Date.now(),k=()=>document.querySelector('.nav-group-trigger')?r(1):Date.now()-t0>15000?r(0):setTimeout(k,100);k()})`,
);

const g = await ev(`(() => {
  const el = [...document.querySelectorAll('.nav-group')]
    .find(e => e.querySelector('.nav-group-trigger').textContent.includes(${JSON.stringify(label)}));
  if (!el) return null;
  const r = el.querySelector('.nav-group-trigger').getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
})()`);
if (!g) {
  console.error('没找到导航项:', label);
  ws.close();
  process.exit(1);
}
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: g.x, y: g.y, buttons: 0 });
/* 等动画彻底跑完（面板滑入 380ms），否则量到的是中间态 */
await new Promise((r) => setTimeout(r, 900));

const geo = await ev(`(() => {
  const p = [...document.querySelectorAll('.nav-panel')].find(e => getComputedStyle(e).visibility === 'visible');
  if (!p) return { 错误: '没有可见面板' };
  const r = p.getBoundingClientRect();
  const n = document.querySelector('.global-nav').getBoundingClientRect();
  return {
    视口宽: window.innerWidth,
    面板: { top: Math.round(r.top), left: Math.round(r.left), right: Math.round(r.right), 宽: Math.round(r.width), 高: Math.round(r.height) },
    导航栏底: Math.round(n.bottom),
    列: [...p.querySelectorAll('.nav-panel-col')].map((c) => {
      const b = c.getBoundingClientRect();
      return { 标题: c.querySelector('.nav-panel-title').textContent, left: Math.round(b.left), 宽: Math.round(b.width) };
    }),
  };
})()`);
console.log(JSON.stringify(geo, null, 2));

const cap = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(out, Buffer.from(cap.data, 'base64'));
ws.close();
process.exit(0);