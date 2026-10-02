/**
 * 量「关于」区两列的高度差。
 *
 * 用户报的视觉问题：左边个人名片矮一截，右边时间线拖得很长，
 * 两列底边不齐，看起来不平衡。
 *
 * 先量清楚差多少，再决定是「给左边加内容」还是「把右边收进窗口」。
 * 目测这个不可靠 —— 差 20px 和差 160px 是两种完全不同的改法。
 *
 * 用法：node scripts/about-balance.mjs [url] [cdp端口] [宽度]
 */
const url = process.argv[2] || 'http://127.0.0.1:5277/';
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
  width: WIDTH, height: 1100, deviceScaleFactor: 1, mobile: false,
});
await send('Page.navigate', { url });
await new Promise((r) => setTimeout(r, 2400));

const evaluate = async (expression) =>
  (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }))?.result?.value;

await evaluate(`(() => {
  document.documentElement.classList.add('cdp-no-scroll-lock');
  const st = document.createElement('style');
  st.textContent = '[data-reveal]{opacity:1 !important;transform:none !important}';
  document.head.appendChild(st);
  return true;
})()`);
await new Promise((r) => setTimeout(r, 500));

const box = await evaluate(`(() => {
  const q = (s) => document.querySelector(s);
  const grid = q('.about-grid');
  const profile = q('.about-profile');
  const timeline = q('.about-timeline');
  if (!grid || !profile || !timeline) return null;

  const g = grid.getBoundingClientRect();
  const p = profile.getBoundingClientRect();
  const t = timeline.getBoundingClientRect();
  const rows = [...timeline.children].map((li) => {
    const r = li.getBoundingClientRect();
    const time = li.querySelector('time')?.textContent?.trim() || '';
    const title = li.querySelector('h3')?.textContent?.trim() || '';
    return { time, title, h: Math.round(r.height) };
  });

  /* 左列底部距网格底部差多少 —— 这是用户看到的那道台阶 */
  const gridBottom = Math.max(p.bottom, t.bottom);

  return {
    grid: { w: Math.round(g.width), h: Math.round(g.height) },
    profile: { w: Math.round(p.width), h: Math.round(p.height), bottomGap: Math.round(gridBottom - p.bottom) },
    timeline: { w: Math.round(t.width), h: Math.round(t.height), bottomGap: Math.round(gridBottom - t.bottom) },
    diff: Math.round(Math.abs(p.height - t.height)),
    cols: getComputedStyle(grid).gridTemplateColumns,
    rows,
  };
})()`);

if (!box) {
  console.log('❌ 找不到 .about-grid');
  ws.close();
  process.exit(1);
}

console.log(`视口 ${WIDTH}px   两列定义: ${box.cols}`);
console.log(`网格      ${box.grid.w} × ${box.grid.h}`);
console.log(`左个人名片 ${box.profile.w} × ${box.profile.h}   底部空出 ${box.profile.bottomGap}px`);
console.log(`右时间线   ${box.timeline.w} × ${box.timeline.h}   底部空出 ${box.timeline.bottomGap}px`);
console.log(`高度差: ${box.diff}px`);
console.log('');
console.log('时间线条目:');
for (const r of box.rows) console.log(`  ${r.time}  ${r.h}px  ${r.title}`);

ws.close();
process.exit(0);
