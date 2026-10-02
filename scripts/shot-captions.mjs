/**
 * 截精选截图网格，用来肉眼确认图注有没有被裁。
 *
 * 单独一个脚本而不是并进 caption-probe：那个只吐数字，
 * 「文字被切」这件事最终还是要看一眼图才能确认。
 *
 * 用法：node scripts/shot-captions.mjs [url] [cdp端口] [宽度]
 */
import { mkdirSync, writeFileSync } from 'node:fs';

const url = process.argv[2] || 'http://127.0.0.1:5278/';
const CDP = process.argv[3] || '9333';
const WIDTH = Number(process.argv[4] || 1080);

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
await send('Page.navigate', { url });
await new Promise((r) => setTimeout(r, 2500));

const evaluate = async (expression) =>
  (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }))?.result?.value;

/* 强制显示 reveal 元素。
   不滚到网格 —— scrollIntoView 之后 hash 路由会把滚动位置重置掉，
   截出来的是首屏。改成直接量某个图注的绝对坐标来定位，
   页面滚没滚都不影响（clip 配 captureBeyondViewport 吃绝对坐标）。 */
await evaluate(`(() => {
  const st = document.createElement('style');
  st.textContent = '[data-reveal]{opacity:1 !important;transform:none !important}';
  document.head.appendChild(st);
  return true;
})()`);
await new Promise((r) => setTimeout(r, 600));

/* 取第一张图注所在的整行（含图 + 图注）作为裁剪范围。
   用 getBoundingClientRect + scrollY 转成页面绝对坐标。 */
const box = await evaluate(`(() => {
  const first = document.querySelector('.stage-item');
  if (!first) return null;
  const last = document.querySelectorAll('.stage-item')[1] || first;
  const a = first.getBoundingClientRect();
  const b = last.getBoundingClientRect();
  const top = Math.min(a.top, b.top) + window.scrollY;
  const bottom = Math.max(a.bottom, b.bottom) + window.scrollY;
  return {
    x: Math.max(0, a.left - 24),
    y: Math.max(0, top - 24),
    width: Math.min(${WIDTH}, a.width + 48),
    height: Math.min(1100, bottom - top + 48),
  };
})()`);
if (!box) {
  console.log('❌ 找不到 .stage-grid');
  ws.close();
  process.exit(1);
}

const shot = await send('Page.captureScreenshot', {
  format: 'png', clip: { ...box, scale: 1.5 }, captureBeyondViewport: true,
});
mkdirSync('screenshots', { recursive: true });
const name = `captions-${WIDTH}.png`;
writeFileSync(`screenshots/${name}`, Buffer.from(shot.data, 'base64'));
console.log(`已截图 screenshots/${name}（${WIDTH}px 宽）`);
ws.close();
process.exit(0);
