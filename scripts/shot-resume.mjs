/**
 * 截简历页（正文区 + 右侧预览图），用来肉眼确认：
 * 1) 项目条目的标注行、GitHub/在线链接排得对不对
 * 2) 右侧预览图是新简历（不是旧的 9 月版）
 * 3) 链接与描述之间没有挤在一起
 *
 * 用法：node scripts/shot-resume.mjs [url] [cdp端口] [宽度]
 */
import { mkdirSync, writeFileSync } from 'node:fs';

const url = process.argv[2] || 'http://127.0.0.1:5199/#/resume';
const CDP = process.argv[3] || '9222';
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
/* 关缓存 + 时间戳绕开 index.html 的缓存：
   资源清单写在 index.html 里，浏览器缓存了它就会连着用旧的 assets。
   ⚠️ cb 参数要插在 hash 之前 —— # 后面的内容浏览器不发给服务器。 */
await send('Network.enable');
await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Emulation.setDeviceMetricsOverride', {
  width: WIDTH, height: 1100, deviceScaleFactor: 2, mobile: false,
});
const [beforeHash, afterHash = ''] = url.split('#');
const bust = beforeHash.includes('?')
  ? `${beforeHash}&cb=${Date.now()}`
  : `${beforeHash}?cb=${Date.now()}`;
await send('Page.navigate', { url: afterHash ? `${bust}#${afterHash}` : bust });
await new Promise((r) => setTimeout(r, 3000));

mkdirSync('screenshots', { recursive: true });

/* 项目经历区：滚到那一段再截，看清条目内部 */
await send('Runtime.evaluate', {
  expression: `(() => {
    const el = document.querySelector('#resume-projects');
    if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 40);
  })()`,
});
await new Promise((r) => setTimeout(r, 800));
let cap = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync('screenshots/resume-projects.png', Buffer.from(cap.data, 'base64'));
console.log('screenshots/resume-projects.png');

/* 整页 */
await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' });
await new Promise((r) => setTimeout(r, 600));
cap = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync('screenshots/resume-page.png', Buffer.from(cap.data, 'base64'));
console.log('screenshots/resume-page.png');

/* 预览图单独放大：把右侧那张图裁出来 */
const box = await send('Runtime.evaluate', {
  expression: `(() => {
    const el = document.querySelector('.resume-paper');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  })()`,
});
if (box?.result?.value) {
  const b = box.result.value;
  cap = await send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: b.x, y: b.y, width: b.width, height: b.height, scale: 2 },
  });
  writeFileSync('screenshots/resume-paper.png', Buffer.from(cap.data, 'base64'));
  console.log('screenshots/resume-paper.png');
}

ws.close();
process.exit(0);
