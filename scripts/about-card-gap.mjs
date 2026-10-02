/**
 * 量左卡内部的空白分布。
 *
 * 卡片被拉满到与右栏等高后，facts 列表和 GitHub 按钮之间会空出一段。
 * 「两列齐平」和「空白匀称」是两件事 —— 后者只能靠量这段 gap 才知道有多突兀。
 */
const CDP = process.argv[2] || '9361';
const URL_ = process.argv[3] || 'http://127.0.0.1:5176/';
const WIDTH = Number(process.argv[4] || 1440);

const t = await (
  await fetch(`http://127.0.0.1:${CDP}/json/new?${encodeURIComponent(URL_)}`, { method: 'PUT' })
).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
let seq = 0;
const p = new Map();
const send = (m, q = {}) =>
  new Promise((r) => {
    const i = ++seq;
    p.set(i, r);
    ws.send(JSON.stringify({ id: i, method: m, params: q }));
  });
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && p.has(m.id)) {
    p.get(m.id)(m.result);
    p.delete(m.id);
  }
};
await new Promise((r) => { ws.onopen = r; });

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: WIDTH, height: 1100, deviceScaleFactor: 1, mobile: false,
});
await send('Page.navigate', { url: URL_ });
await new Promise((r) => setTimeout(r, 2200));

const ev = async (e) =>
  (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }))?.result?.value;

console.log(
  await ev(`(() => {
  const g = document.querySelector('.about-profile');
  const facts = document.querySelector('.about-facts');
  const gh = document.querySelector('.about-github');
  const gr = g.getBoundingClientRect();
  const f = facts.getBoundingClientRect();
  const b = gh.getBoundingClientRect();
  return JSON.stringify({
    视口: ${WIDTH},
    卡片高: Math.round(gr.height),
    facts底: Math.round(f.bottom - gr.top),
    按钮顶: Math.round(b.top - gr.top),
    按钮高: Math.round(b.height),
    中间空白: Math.round(b.top - f.bottom),
  }, null, 1);
})()`)
);

ws.close();
process.exit(0);
