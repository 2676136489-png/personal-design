/**
 * 截「关于」区左右两列，用来看两列齐平后左卡内部的空白分布。
 *
 * 高度差归零不等于好看 —— 卡片被拉高之后，facts 列表和 GitHub 按钮
 * 之间那段空白是否突兀，只能看图。数字量不出来。
 *
 * 用法：node scripts/shot-about.mjs [url] [cdp端口] [宽度]
 */
import { mkdirSync, writeFileSync } from 'node:fs';

const url = process.argv[2] || 'http://127.0.0.1:5177/';
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
  const st = document.createElement('style');
  st.textContent = '[data-reveal]{opacity:1 !important;transform:none !important}';
  document.head.appendChild(st);
  document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
  return true;
})()`);
await evaluate(`(async () => {
  const imgs = [...document.querySelectorAll('.about-profile img')];
  await Promise.all(imgs.map((i) => (i.decode ? i.decode().catch(() => {}) : null)));
  return imgs.length;
})()`);
await new Promise((r) => setTimeout(r, 600));

/* 按绝对坐标定位（不靠 scrollIntoView —— hash 路由会把滚动位置重置掉）。
   范围从 .about-grid 顶到网格底，两列都在里面。 */
const box = await evaluate(`(() => {
  const grid = document.querySelector('.about-grid');
  if (!grid) return null;
  const g = grid.getBoundingClientRect();
  const head = document.querySelector('.about .section-head');
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
const name = `about-${WIDTH}.png`;
writeFileSync(`screenshots/${name}`, Buffer.from(shot.data, 'base64'));
console.log(`已截图 screenshots/${name}（${WIDTH}px 宽）`);
ws.close();
process.exit(0);
