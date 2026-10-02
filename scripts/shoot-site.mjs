/**
 * 抓线上站点的真实界面截图，用作项目封面。
 *
 * 为什么不用 AI 生成：项目封面最怕「图和实际长得不一样」。
 * 真实界面能直接说明这个项目长什么样、做到了什么程度。
 *
 * 用法：node scripts/shoot-site.mjs <url> <输出png> [宽] [高] [等待毫秒]
 * 前置：msedge --headless=new --remote-debugging-port=9222
 */
import { writeFileSync } from 'node:fs';

const [, , url, out, w = '1600', h = '1000', wait = '6000'] = process.argv;
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
  width: Number(w),
  height: Number(h),
  deviceScaleFactor: 1,
  mobile: false,
});
await send('Page.navigate', { url });
await new Promise((r) => setTimeout(r, Number(wait)));

const ev = async (x) => {
  const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) console.error('表达式出错:', r.exceptionDetails.text);
  return r?.result?.value;
};

// 量一下实际内容高度，好知道截到哪儿
const info = await ev(`(() => ({
  title: document.title,
  标题: document.querySelector('h1,h2')?.textContent?.trim()?.slice(0, 40) || '',
  scrollH: document.documentElement.scrollHeight,
  text: (document.body.innerText || '').replace(/\\s+/g, ' ').slice(0, 300),
}))()`);
console.log(JSON.stringify(info, null, 2));

const cap = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(out, Buffer.from(cap.data, 'base64'));
console.log('已保存', out);
ws.close();
process.exit(0);