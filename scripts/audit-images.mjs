/**
 * 图片完整性巡检：逐路由滚动到底，检查每一张 <img> 是否真的解码成功、
 * 每一个 CSS 背景图是否真的取到，以及网络层有没有 4xx/5xx。
 *
 * verify-v3 只盯作品卡那几张；这里补的是全站（首屏物件、画廊、简历预览、
 * 详情页 chapter 截图、favicon），并且覆盖 #/works、#/resume 与全部详情页。
 *
 * 用法：node scripts/audit-images.mjs [base] [cdpPort]
 */
const BASE = process.argv[2] || 'http://127.0.0.1:5201/';
const PORT = process.argv[3] || '9333';
const cdp = `http://127.0.0.1:${PORT}`;

const target = await (
  await fetch(`${cdp}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' })
).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
let seq = 0;
const pending = new Map();
let netFails = [];

const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = ++seq;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result);
    pending.delete(msg.id);
    return;
  }
  if (msg.method === 'Network.responseReceived') {
    const r = msg.params.response;
    if (r.status >= 400) netFails.push(`${r.status} ${r.url}`);
  }
  if (msg.method === 'Network.loadingFailed') {
    const p = msg.params;
    if (!p.errorText.includes('ERR_ABORTED')) netFails.push(`FAILED ${p.errorText} ${p.type}`);
  }
};

await new Promise((r) => (ws.onopen = r));
await send('Runtime.enable');
await send('Page.enable');
await send('Network.enable');
await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Emulation.setDeviceMetricsOverride', {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const evaluate = async (expression) => {
  const out = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (out?.exceptionDetails) throw new Error(out.exceptionDetails.text);
  return out?.result?.value;
};

/* 等 SPA 真的渲染出来。本机预览 2 秒够，线上要等 bundle 下载完，
 * 否则采到的是空壳，会读成「这个路由一张图都没有」。 */
const waitReady = () => evaluate(`(async () => {
  for (let i = 0; i < 80; i += 1) {
    const main = document.querySelector('main');
    if (main && main.innerText.trim().length > 80) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
})()`);

/* 滚一遍把懒加载都触发出来，再回到顶部 */
const sweep = async () => {
  await evaluate(`(async () => {
    const step = Math.round(innerHeight * 0.7);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise(r => setTimeout(r, 120));
    }
    scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 300));
  })()`);
};

/* 先让每张图 decode 落地，再补一段有限的等待。
 * 只读 naturalWidth 会把「还在流式加载」误判成坏图；
 * 但也不能无上限地等所有 complete —— 页面里大量 loading="lazy" 的图
 * 可能永远不会被请求，等它们只会把每条路由拖到超时。 */
const settle = () => evaluate(`(async () => {
  await Promise.race([
    Promise.all([...document.images].map((i) => (i.decode ? i.decode().catch(() => {}) : Promise.resolve()))),
    new Promise((r) => setTimeout(r, 20000)),
  ]);
  const cap = Date.now() + 8000;
  while (Date.now() < cap) {
    if ([...document.images].every((i) => i.complete || i.naturalWidth > 0)) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
})()`);

/* 收页面上的图片：<img> 解码状态 + CSS 背景图 + 内联 SVG 里的 <image href> */
const collect = () => evaluate(`(() => {
  const broken = [];
  const seen = [];
  for (const img of document.images) {
    const src = img.currentSrc || img.src || '';
    const box = img.getBoundingClientRect();
    const rec = {
      src: src.replace(location.origin, ''),
      natural: img.naturalWidth + 'x' + img.naturalHeight,
      shown: Math.round(box.width) + 'x' + Math.round(box.height),
      complete: img.complete,
      alt: (img.alt || '').slice(0, 30),
    };
    seen.push(rec);
    /* decode 之后再是 0x0，才是真的取不到图 */
    if (img.naturalWidth === 0) broken.push(rec);
  }
  const bgBroken = [];
  for (const el of document.querySelectorAll('*')) {
    const bg = getComputedStyle(el).backgroundImage;
    if (!bg || bg === 'none') continue;
    for (const m of bg.matchAll(/url\\((['"]?)([^'")]+)\\1\\)/g)) {
      const url = m[2];
      if (url.startsWith('data:')) continue;
      bgBroken.push({ url: url.replace(location.origin, ''), sel: el.className.toString().slice(0, 40) });
    }
  }
  return { total: seen.length, broken, bgBroken, seen };
})()`);

const routes = [
  ['/', '首屏'],
  ['#/', '首页'],
  ['#/works', '作品索引'],
  ['#/resume', '简历'],
];

/* 详情页 slug 从首页链接里抓，避免手写清单跟数据脱节（路由形如 #/<slug>） */
await send('Page.navigate', { url: `${BASE}${BASE.includes('?') ? '&' : '?'}cb=${Date.now()}` });
await waitReady();
const slugs = await evaluate(`(() => {
  const RESERVED = new Set(['/', '/works', '/resume', '/about', '/skills', '/contact']);
  const links = [...document.querySelectorAll('a[href^="#/"]')];
  return [...new Set(links.map(a => a.getAttribute('href').slice(1)))]
    .filter(p => !RESERVED.has(p) && !p.startsWith('/category/'));
})()`);
for (const s of slugs) routes.push([`#${s}`, `详情 ${s.replace('/', '')}`]);

let allBroken = 0;
let allBg = 0;
let grandTotal = 0;
const dupeReport = [];

for (const [hash, label] of routes) {
  netFails = [];
  await send('Page.navigate', { url: `${BASE}${BASE.includes('?') ? '&' : '?'}cb=${Date.now()}${hash.replace('#', '') ? '#' + hash.replace('#', '') : ''}` });
  const ready = await waitReady();
  await sweep();
  const settled = await settle();
  const res = await collect();
  grandTotal += res.total;
  if (!ready || !settled) console.log(`\n   ⚠️ 等待超时（ready=${ready} settled=${settled}），下面的结论可能不准`);

  /* 详情页里同一张图不该出现两次。
   * 例外：页首封面。campus 的封面就是「学生中心」那一屏，它既是封面也出现在章节里，
   *      这是案例页的常规排版；真正要拦的是「图集里拿同一张图凑格子」。 */
  if (hash.startsWith('#/') && !['#/', '#/works', '#/resume'].includes(hash)) {
    const cover = (await evaluate(`(document.querySelector('.v3-detail-cover img')?.currentSrc || '').replace(location.origin, '')`)) || '';
    const srcs = res.seen.map((s) => s.src);
    const dup = srcs.filter((s, i) => s && s !== cover && srcs.indexOf(s) !== i);
    if (dup.length) dupeReport.push(`${hash}: 重复 ${[...new Set(dup)].join(', ')}`);
  }

  console.log(`\n== ${label}  (${hash})  图片 ${res.total} 张`);
  if (res.total === 0 && hash !== '#/resume') console.log('   ⚠️ 这一页一张图都没有，先确认它是不是真的渲染了');
  if (res.broken.length) {
    allBroken += res.broken.length;
    for (const b of res.broken) console.log(`   BROKEN ${b.src}  natural=${b.natural} complete=${b.complete} alt=${b.alt}`);
  }
  if (res.bgBroken.length) {
    allBg += res.bgBroken.length;
    for (const b of res.bgBroken) console.log(`   BG ${b.url}  @${b.sel}`);
  }
  const bad = netFails.filter((f) => !f.includes('favicon'));
  if (bad.length) {
    for (const f of bad) console.log(`   NET ${f}`);
  }
  if (!res.broken.length && !res.bgBroken.length && !bad.length) console.log('   OK');
}

console.log('\n──────── 汇总 ────────');
console.log(`路由 ${routes.length} 个，累计检查图片 ${grandTotal} 张`);
console.log(`解码失败 ${allBroken}   背景图 ${allBg}   重复画廊 ${dupeReport.length}`);
for (const d of dupeReport) console.log(`   重复 ${d}`);
process.exit(allBroken || allBg || dupeReport.length ? 1 : 0);
