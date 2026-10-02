/**
 * 截方向聚合页。
 *
 * 聚合页是为了「一个方向多个项目时让用户自己选」，
 * 所以要确认：标题说清了这个方向是什么、两张卡片都在、
 * 下面的「其他方向」也能接着逛。
 *
 * 用法：node scripts/shot-category.mjs [url] [cdp端口] [slug] [宽度]
 */
import { mkdirSync, writeFileSync } from 'node:fs';

const url = process.argv[2] || 'http://127.0.0.1:5182/';
const CDP = process.argv[3] || '9370';
const slug = process.argv[4] || 'agent';
const WIDTH = Number(process.argv[5] || 1440);

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
  width: WIDTH, height: 1200, deviceScaleFactor: 2, mobile: false,
});
await send('Page.navigate', { url: `${url}#/category/${slug}` });
await new Promise((r) => setTimeout(r, 2600));

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
  const imgs = [...document.querySelectorAll('.work-card img')];
  await Promise.all(imgs.map((i) => (i.decode ? i.decode().catch(() => {}) : null)));
  return imgs.length;
})()`);
await new Promise((r) => setTimeout(r, 700));

/* 整页截，不裁剪 —— 聚合页要看的是整体结构通不通，
   裁单个区块会撞上 scrollIntoView + hash 路由的坑（前面踩过）。 */
const h = await evaluate(`document.documentElement.scrollHeight`);
const shot = await send('Page.captureScreenshot', {
  format: 'png',
  clip: { x: 0, y: 0, width: WIDTH, height: Math.min(h, 2400), scale: 1 },
  captureBeyondViewport: true,
});
mkdirSync('screenshots', { recursive: true });
const name = `category-${slug}-${WIDTH}.png`;
writeFileSync(`screenshots/${name}`, Buffer.from(shot.data, 'base64'));
console.log(`已截图 screenshots/${name}（页高 ${h}px）`);
ws.close();
process.exit(0);
