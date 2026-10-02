/**
 * 量聚合页各段之间的实际间距。
 *
 * 结构是从作品列表页搬过来的，`.work` 自带上下padding，
 * 放到「hero 之后紧接卡片」的位置就多出一段空档。
 * 目测「好像有点空」不可靠，量出来才知道该收多少。
 *
 * 用法：node scripts/category-space.mjs [url] [cdp端口] [slug]
 */
const url = process.argv[2] || 'http://127.0.0.1:5182/';
const CDP = process.argv[3] || '9370';
const slug = process.argv[4] || 'agent';

const target = await (
  await fetch(`http://127.0.0.1:${CDP}/json/new?${encodeURIComponent(`${url}#/category/${slug}`)}`, { method: 'PUT' })
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
  width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false,
});
await send('Page.navigate', { url: `${url}#/category/${slug}` });
await new Promise((r) => setTimeout(r, 2500));

const evaluate = async (expression) =>
  (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }))?.result?.value;

console.log(await evaluate(`(() => {
  const hero = document.querySelector('.page-hero');
  const work = document.querySelector('.work');
  const grid = document.querySelector('.work-grid');
  const other = document.querySelector('.other-projects');
  const h1 = document.querySelector('main h1');
  if (!hero || !work || !grid || !other) return '❌ 缺元素';
  const hb = hero.getBoundingClientRect();
  const wb = work.getBoundingClientRect();
  const gb = grid.getBoundingClientRect();
  const ob = other.getBoundingClientRect();
  const h1b = h1.getBoundingClientRect();
  const cs = (el) => getComputedStyle(el);
  return JSON.stringify({
    'h1 底 → work 顶': Math.round(wb.top - h1b.bottom),
    'hero 底 → work 顶': Math.round(wb.top - hb.bottom),
    'work 上padding': cs(work).paddingTop,
    'work 下padding': cs(work).paddingBottom,
    '卡片底 → other 顶': Math.round(ob.top - gb.bottom),
    'other 上padding': cs(other).paddingTop,
    '页高': document.documentElement.scrollHeight,
  }, null, 1);
})()`));

ws.close();
process.exit(0);
