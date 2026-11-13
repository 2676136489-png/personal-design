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
  await fetch(`http://127.0.0.1:${CDP}/json/new?${encodeURIComponent(`${BASE}/index.html?skin=legacy`)}`, { method: 'PUT' })
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
  /* 旧版皮肤是先动态 import 三份 CSS 再挂载的，1.5s 常常还在转场；
     等太短会把「还没渲染」读成「一个元素都没有」。 */
  await new Promise((r) => setTimeout(r, 3200));
};
const shoot = async (name) => {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  if (!r?.data) return false;
  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.data, 'base64'));
  return true;
};

/* 首页：项目卡片数、封面有没有真的加载出来 */
await goto(`${BASE}/index.html?skin=legacy#/`);
await shoot('v-home');

const home = await evaluate(`(() => {
  const main = document.querySelector('main');
  /* 挂载失败时不要抛错也不要静默给 0，单独报出来，否则「没渲染」和「渲染了但为空」分不清 */
  if (!main) return { mounted: false };
  const imgs = [...document.images];
  return {
    mounted: main.innerHTML.length > 500,
    h1: (document.querySelector('h1')?.textContent || '').trim().slice(0, 40),
    brokenImgs: imgs.filter(i => i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src')),
    totalImgs: imgs.length,
  };
})()`);
if (!home?.mounted) {
  console.log('【首页】FAIL 旧版皮肤没有挂载，下面的读数都不可信');
  process.exit(1);
}
console.log('【首页】');
console.log('  首屏标题:', home.h1 || '(无 h1)');
console.log('  图片:', home.totalImgs, '张, 加载失败', home.brokenImgs.length, '张', home.brokenImgs);

const list = [
  ['opspilot', 'OpsPilot · AI 事故响应系统'],
  ['research', 'AI 研究工作台'],
  ['checkin', '学习目标管理台'],
  ['gomoku', 'Gomoku'],
];

for (const [slug, title] of list) {
  await goto(`${BASE}/index.html?skin=legacy#/${slug}`);
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

/* 导航链接：旧版换成扁平导航后没有下拉面板了，改查链接本身。
 * 手写那版全是占位 #/#work，旧断言只查 label 存在，全都能通过。 */
await goto(`${BASE}/index.html?skin=legacy#/`);
const nav = await evaluate(`(() => {
  const links = [...document.querySelectorAll('.site-nav a, .site-drawer a')].map(a => ({
    label: a.textContent.trim(), href: a.getAttribute('href') || ''
  }));
  return { links, placeholders: links.filter(l => !l.href || l.href === '#' || l.href === '#/#work') };
})()`);
console.log('\n【导航链接】');
console.log('  条目(' + nav.links.length + '):', nav.links.map(l => l.label).join(' / '));
console.log('  占位链接:', nav.placeholders.length ? JSON.stringify(nav.placeholders) : '无');
await shoot('v-nav');

console.log('\n截图已写入', OUT + '/');
ws.close();
process.exit(0);
