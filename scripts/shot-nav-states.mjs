/**
 * 面板状态的补充截图：分别截「列悬停高亮」和「浅色主题」两张。
 * 主题色、列分隔这些光靠读 CSS 判断不了，得看渲染结果。
 *
 * 用法：node scripts/.shot-nav-states.mjs <url> <输出目录>
 */
import { writeFileSync } from 'node:fs';

const url = process.argv[2];
const dir = process.argv[3] || '.';
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
  if (r?.exceptionDetails) console.error('表达式出错:', r.exceptionDetails.text);
  return r?.result?.value;
};
const ready = await ev(
  `new Promise(r=>{const t0=Date.now(),k=()=>document.querySelector('.nav-group-trigger')?r(1):Date.now()-t0>15000?r(0):setTimeout(k,100);k()})`,
);
if (!ready) {
  console.error('导航没渲染出来');
  process.exit(1);
}

const hoverTrigger = async (label) => {
  const g = await ev(`(() => {
    const el = [...document.querySelectorAll('.nav-group')]
      .find(e => e.querySelector('.nav-group-trigger').textContent.includes(${JSON.stringify(label)}));
    if (!el) return null;
    const r = el.querySelector('.nav-group-trigger').getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`);
  if (!g) throw new Error('没找到导航项: ' + label);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: g.x, y: g.y, buttons: 0 });
  await new Promise((r) => setTimeout(r, 800));
};

const shot = async (name) => {
  const cap = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`${dir}/${name}.png`, Buffer.from(cap.data, 'base64'));
  console.log('已截图', name);
};

/* 1. 悬停在某一列中间，看列高亮与竖线 */
await hoverTrigger('全部作品');
const col = await ev(`(() => {
  const p = [...document.querySelectorAll('.nav-panel')].find(e => getComputedStyle(e).visibility === 'visible');
  const cols = [...p.querySelectorAll('.nav-panel-col')];
  const c = cols[1].getBoundingClientRect();
  return { x: c.left + c.width / 2, y: c.top + 40, 列数: cols.length };
})()`);
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: col.x, y: col.y, buttons: 0 });
await new Promise((r) => setTimeout(r, 400));
const hoverState = await ev(`(() => {
  const p = [...document.querySelectorAll('.nav-panel')].find(e => getComputedStyle(e).visibility === 'visible');
  return [...p.querySelectorAll('.nav-panel-col')].map(c => ({
    标题: c.querySelector('.nav-panel-title').textContent,
    命中: c.matches(':hover'),
    底色: getComputedStyle(c).backgroundColor,
  }));
})()`);
console.log('列悬停状态:', JSON.stringify(hoverState, null, 2));
await shot('.nav-col-hover');

/* 2. 浅色主题下的同一面板 */
await ev(`localStorage.setItem('portfolio-theme-v2','light')`);
await send('Page.reload');
await new Promise((r) => setTimeout(r, 2600));
await hoverTrigger('校园圈子');
const lightState = await ev(`(() => {
  const nav = document.querySelector('.global-nav');
  const p = [...document.querySelectorAll('.nav-panel')].find(e => getComputedStyle(e).visibility === 'visible');
  return {
    导航栏底色: getComputedStyle(nav).backgroundColor,
    面板底色: getComputedStyle(p).backgroundColor,
    主题: document.documentElement.dataset.theme,
  };
})()`);
console.log('浅色主题:', JSON.stringify(lightState, null, 2));
await shot('.nav-panel-light');

ws.close();
process.exit(0);