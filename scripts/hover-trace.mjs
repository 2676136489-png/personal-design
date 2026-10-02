/**
 * 导航下拉的悬停稳定性追踪：用真实鼠标事件沿一条路径移动，
 * 沿途反复读取 data-open，看面板开合翻转了几次。
 *
 * 为什么需要它：「指针移进面板会不会又触发 mouseleave」这种问题，
 * 光读代码推不出来——DOM 上是祖先-后代关系（所以理论上不该触发 leave），
 * 但真机上就是会弹跳。只能让浏览器自己回答。
 *
 * 测两条路径：
 *   1. 平滑路径 —— 从触发项直线移到面板中部。正常鼠标是这样走的。
 *   2. 抖动路径 —— 在触发项与面板的边界附近来回小幅摆动。
 *      真实用户的手不会走直线，抖一下就崩的交互等于不能用。
 *
 * 前置：先起 CDP 浏览器，再起本地预览服务。
 *   msedge.exe --headless=new --remote-debugging-port=9222 --user-data-dir=<临时目录> about:blank
 *   python -m http.server 5199 --bind 127.0.0.1   # 指向构建产物目录
 *
 * 用法：node scripts/hover-trace.mjs [url]
 */
const url = process.argv[2] || 'http://127.0.0.1:5199/';
const base = 'http://127.0.0.1:9222';

const target = await (
  await fetch(`${base}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })
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
await new Promise((r) => {
  ws.onopen = r;
});
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: 1280,
  height: 860,
  deviceScaleFactor: 1,
  mobile: false,
});
await send('Page.navigate', { url });
await new Promise((r) => setTimeout(r, 2500));

const evaluate = async (expression) => {
  /* awaitPromise 必须显式打开，否则返回的是未决 Promise 的空壳 */
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) {
    console.error('表达式出错:', r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return null;
  }
  return r?.result?.value;
};

const move = async (x, y) => {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(x), y: Math.round(y), buttons: 0 });
};

/* React 是客户端渲染的，脚本跑完不等于 DOM 出来了。
   没等到 .nav-group-trigger 就直接退出，否则后面全是 undefined。 */
const ready = await evaluate(
  `new Promise((res) => {
     const t0 = Date.now();
     const tick = () => {
       if (document.querySelector('.nav-group-trigger')) return res({ ok: true, ms: Date.now() - t0 });
       if (Date.now() - t0 > 15000) return res({ ok: false, readyState: document.readyState, ms: Date.now() - t0 });
       setTimeout(tick, 100);
     };
     tick();
   })`,
);
console.log('等待导航渲染:', JSON.stringify(ready));
if (!ready?.ok) {
  console.error('导航项没渲染出来，后续追踪无意义');
  ws.close();
  process.exit(1);
}

const readOpen = () =>
  evaluate(
    `(() => {
       const g = [...document.querySelectorAll('.nav-group')].find((el) => el.dataset.open === 'true');
       const panel = g ? g.nextElementSibling : null;
       const nav = document.querySelector('.global-nav');
       return {
         展开项: g ? g.querySelector('.nav-group-trigger').textContent.trim() : null,
         面板可见: panel ? getComputedStyle(panel).visibility : 'no-panel',
         导航栏换底色: nav ? nav.dataset.section : null,
       };
     })()`,
  );

/* 面板现在是 .global-nav 的直接子元素，不再是触发项的后代 —— 这正是
   「能铺满整页宽」的关键，也是必须重新量一次几何的原因。 */
const geo = await evaluate(`(() => {
  const g = document.querySelector('.nav-group');
  const t = g.querySelector('.nav-group-trigger');
  const p = [...document.querySelectorAll('.nav-panel')].find((el) => {
    const cs = getComputedStyle(el);
    return cs.visibility === 'hidden' && el.getBoundingClientRect().width > 0;
  });
  const tr = t.getBoundingClientRect();
  const pr = p.getBoundingClientRect();
  const nav = document.querySelector('.global-nav').getBoundingClientRect();
  return {
    触发项: { x: tr.left + tr.width / 2, y: tr.top + tr.height / 2, top: Math.round(tr.top), bottom: Math.round(tr.bottom) },
    导航栏: { top: Math.round(nav.top), bottom: Math.round(nav.bottom), h: Math.round(nav.height) },
    面板: { left: Math.round(pr.left), right: Math.round(pr.right), top: Math.round(pr.top), w: Math.round(pr.width), h: Math.round(pr.height) },
    面板参照物: p.offsetParent ? p.offsetParent.className : null,
    列数: p.querySelectorAll('.nav-panel-col').length,
    视口宽: window.innerWidth,
  };
})()`);

console.log('几何:', JSON.stringify(geo, null, 2));

/* 面板没铺满可布局宽度就说明定位参照物又选错了。
   比的是 clientWidth 而不是 innerWidth —— 后者含滚动条宽度，
   桌面端两者差 15px，拿它当基准会一直误报「没铺满」。 */
const clientWidth = await evaluate('document.documentElement.clientWidth');
const full = geo.面板.left === 0 && Math.abs(geo.面板.right - clientWidth) <= 1;
console.log(
  full
    ? '✅ 面板铺满整页宽'
    : `❌ 面板没铺满：left=${geo.面板.left} right=${geo.面板.right} 可布局宽=${clientWidth}`,
);

const flips = [];
let last = null;
const track = async (label, x, y) => {
  await move(x, y);
  await new Promise((r) => setTimeout(r, 40)); /* 慢于一帧，快于收起延时 */
  const state = await readOpen();
  const key = JSON.stringify(state);
  if (key !== last) {
    flips.push({ label, x: Math.round(x), y: Math.round(y), state });
    last = key;
  }
  return state;
};

console.log('\n【路径 1】触发项 → 面板中部（直线）');
{
  const steps = 20;
  const from = geo.触发项;
  const to = { x: (geo.面板.left + geo.面板.right) / 2, y: geo.面板.top + geo.面板.h / 2 };
  for (let i = 0; i <= steps; i += 1) {
    await track(
      `第${i}步`,
      from.x + ((to.x - from.x) * i) / steps,
      from.y + ((to.y - from.y) * i) / steps,
    );
  }
}

console.log('\n【路径 2】边界附近抖动（模拟手不稳）');
{
  /* 在导航栏下沿上下 30px 内来回摆 20 次 */
  const x = (geo.面板.left + geo.面板.right) / 2;
  const edge = geo.导航栏.bottom;
  for (let i = 0; i < 20; i += 1) {
    await track(`抖动${i}A`, x, edge - 12);
    await track(`抖动${i}B`, x, edge + 12);
  }
}

console.log('\n开合翻转记录:');
if (!flips.length) console.log('  面板从未打开（先检查触发项坐标是否命中）');
for (const f of flips) console.log(`  ${f.label} @(${f.x},${f.y}) ${JSON.stringify(f.state)}`);

/* 停在面板里静置 1.2 秒，看会不会自己收回去 */
await move((geo.面板.left + geo.面板.right) / 2, geo.面板.top + geo.面板.h / 2);
await new Promise((r) => setTimeout(r, 1200));
const settled = await readOpen();
console.log('\n停驻面板内 1.2 秒后:', JSON.stringify(settled));

/* 唯一的一次「关闭」应该发生在指针彻底离开导航区之后 */
await move(clientWidth / 2, 600);
await new Promise((r) => setTimeout(r, 500));
const afterLeave = await readOpen();
console.log('指针移到页面下方后:', JSON.stringify(afterLeave));

const ok = full && settled.展开项 !== null && afterLeave.展开项 === null;
console.log(ok ? '\n✅ 全宽 + 悬停稳定' : '\n❌ 仍有问题');
ws.close();
process.exit(ok ? 0 : 1);