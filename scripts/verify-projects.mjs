/**
 * 真机验证：新项目是否真的渲染出来。
 *
 * 静态断言只说明「数据里有这个 slug」，说明不了图片有没有真的加载、
 * 布局有没有塌、导航下拉里列不列得全。这里用 CDP 打开构建产物，
 * 逐个路由量真实几何，并截图留证。
 *
 * ⚠️ 必须用 /json/new 另开标签页，不要往 /json/list 里随便挑一个 target：
 *    9222 端口上跑着用户日常使用的 Edge，里面几十个真实标签页，
 *    拿其中一个导航过去会毁掉用户正在看的东西。
 *
 * 前置：专用 headless 实例（别用日常浏览器）
 *   msedge.exe --headless=new --remote-debugging-port=9333 \
 *     --user-data-dir=<临时目录> about:blank
 *   python3 -m http.server <端口> --bind 127.0.0.1   # 指向构建产物目录
 *
 * 用法：node scripts/verify-projects.mjs [端口] [cdp端口]
 */
import { mkdirSync, writeFileSync } from 'node:fs';

const PORT = process.argv[2] || '5266';
const CDP = process.argv[3] || '9333';
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = 'screenshots';

const target = await (
  await fetch(`http://127.0.0.1:${CDP}/json/new?${encodeURIComponent(`${BASE}/index.html`)}`, { method: 'PUT' })
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
  width: 1440, height: 960, deviceScaleFactor: 1, mobile: false,
});

const evaluate = async (expression) => {
  /* awaitPromise 必须显式打开，否则拿到的是未决 Promise 的空壳 */
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) {
    throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  }
  return r?.result?.value;
};

const goto = async (url) => {
  await send('Page.navigate', { url });
  await new Promise((r) => setTimeout(r, 1500));
};
const shoot = async (name) => {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  if (!r?.data) return false;
  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.data, 'base64'));
  return true;
};

/* 首页：项目卡片数、封面有没有真的加载出来 */
await goto(`${BASE}/index.html#/`);
await shoot('v-home');

const home = await evaluate(`(() => {
  const main = document.querySelector('main');
  const imgs = [...main.querySelectorAll('img')];
  return {
    heroFacts: [...main.querySelectorAll('.hero-facts li, .hero-facts > div')].map(n => n.textContent.trim()).filter(Boolean),
    /* 精选截图网格（.stage-item）与作品卡片（.work-card）是两套东西，
       只有一个占满整行、另一个两两成对。数错类会误判成「项目没渲染出来」。 */
    stage: main.querySelectorAll('.stage-item').length,
    workCards: [...main.querySelectorAll('.work-card h3')].map(h => h.textContent.trim()),
    brokenImgs: imgs.filter(i => i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src')),
    totalImgs: imgs.length,
  };
})()`);
console.log('【首页】');
console.log('  精选截图:', home.stage, '张 | 作品卡片:', home.workCards.length, '个');
console.log('  作品列表:', home.workCards.join(' / '));
console.log('  首屏数据条:', home.heroFacts.join(' | '));
console.log('  图片:', home.totalImgs, '张, 加载失败', home.brokenImgs.length, '张', home.brokenImgs);

const list = [
  ['opspilot', 'OpsPilot · AI 事故响应系统'],
  ['research', 'AI 研究工作台'],
  ['checkin', '学习目标管理台'],
  ['gomoku', 'Gomoku'],
];

for (const [slug, title] of list) {
  await goto(`${BASE}/index.html#/${slug}`);
  const info = await evaluate(`(() => {
    const main = document.querySelector('main');
    const img = main.querySelector('img');
    const r = img ? img.getBoundingClientRect() : null;
    return {
      h1: main.querySelector('h1')?.textContent.trim() || '(无)',
      len: main.textContent.length,
      hasTitle: main.textContent.includes(${JSON.stringify(title)}),
      imgOk: img ? (img.complete && img.naturalWidth > 0) : null,
      imgBox: r ? Math.round(r.width) + 'x' + Math.round(r.height) : '(无图)',
      natural: img ? img.naturalWidth + 'x' + img.naturalHeight : '-',
      /* 比例差超过 2% 就是被 CSS 拉变形了。2026-09-30 全站中招过一次：
         <img> 的 width/height 属性是呈现提示，会顶住 height:auto。 */
      stretch: img && r ? Math.abs(r.width / r.height - img.naturalWidth / img.naturalHeight) > 0.02 : false,
      sections: main.querySelectorAll('section').length,
    };
  })()`);
  console.log(`\n【详情页 #/${slug}】`);
  console.log('  h1:', info.h1);
  console.log('  标题命中:', info.hasTitle, '| 正文长度:', info.len, '| section 数:', info.sections);
  console.log('  封面图:', info.imgOk ? '已加载' : '失败/缺失',
    '| 显示', info.imgBox, '| 原始', info.natural, '| 变形:', info.stretch);
  await shoot(`v-${slug}`);
}

/* 导航下拉：新项目是否都列出来了，面板有没有铺满整页宽。
   ⚠️ 必须用 Input.dispatchMouseEvent 发真实鼠标事件。
      React 的 onMouseEnter 是由 mouseout/mouseover 合成出来的，
      手动 dispatchEvent(new MouseEvent('mouseenter')) 根本不会触发它 ——
      踩过一次，看起来像「面板坏了」，其实是验证方式不对。 */
await goto(`${BASE}/index.html#/`);
const trig = await evaluate(`(() => {
  const g = [...document.querySelectorAll('.nav-group-trigger')].find(n => n.textContent.includes('全部作品'));
  if (!g) return null;
  const r = g.getBoundingClientRect();
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
})()`);
if (trig) {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: trig.x, y: trig.y, buttons: 0 });
  await new Promise((r) => setTimeout(r, 700));
}
const panel = await evaluate(`(() => {
  const p = document.querySelector('.nav-panel[data-open="true"]');
  if (!p) return null;
  const r = p.getBoundingClientRect();
  return {
    links: [...p.querySelectorAll('a')].map(a => a.textContent.trim()),
    cols: p.querySelectorAll('.nav-panel-col').length,
    left: Math.round(r.left), right: Math.round(r.right),
    client: document.documentElement.clientWidth,
  };
})()`);
console.log('\n【导航下拉 · 全部作品】');
if (panel) {
  console.log('  列数:', panel.cols, '| 宽度:', panel.left, '→', panel.right, '(可布局', panel.client + ')');
  console.log('  条目(' + panel.links.length + '):', panel.links.join(' / '));
} else {
  console.log('  ❌ 面板未打开');
}
await shoot('v-nav');

console.log('\n截图已写入', OUT + '/');
ws.close();
process.exit(0);
