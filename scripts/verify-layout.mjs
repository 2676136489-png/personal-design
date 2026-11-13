/**
 * 浏览器端验证：布局与交互（SSR 断言管不到的部分）。
 *
 * 覆盖：
 * 1) 九条路由在 1440 宽下没有横向溢出、没有控制台异常；
 * 2) /works 的 pin：进 pin 后整块贴住视口顶、祖先链上不能有 transform
 *    （有 transform 就会成为 fixed 的包含块，pin 会被钉在祖先里）；
 * 3) 横滚吸附：跳跃滚动后落到对应那一屏；
 * 4) 路由转场结束后 .route-stage 不留 transform、opacity 回到 1；
 * 5) 414 宽：作品页走 Bento、叙事页封面不被遮罩裁掉；
 * 6) 叙事页封面的 clip-path 随滚动揭开（桌面）；
 * 7) 校园圈子统计区：计数结束停在「19+」、四张散点照片桌面可见 / 414 隐藏。
 *
 * 前提：本机 Edge 开着远程调试（默认 9333），且 5266 端口在跑构建产物。
 *   "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
 *     --headless=new --remote-debugging-port=9333 \
 *     --user-data-dir=C:/Users/111/AppData/Local/Temp/wb-edge
 *
 * 用法：node scripts/verify-layout.mjs [base] [cdpPort]
 */

const BASE = process.argv[2] || 'http://127.0.0.1:5266';
const CDP = `http://127.0.0.1:${process.argv[3] || 9333}`;

/* 校园圈子统计区的期望值直接从 data.js 源码里解析（这个脚本跑在纯 Node 里，
   不能 import data.js —— 它顶层的 import.meta.env 在 Node 下是 undefined）。
   ⚠️ 必须圈定在 campus 对象内部：后面的项目也有各自的 metrics 数组。 */
import { readFileSync } from 'node:fs';
const dataSrc = readFileSync(new URL('../src/data.js', import.meta.url), 'utf8');
const campusSrc = dataSrc.slice(
  dataSrc.indexOf('export const campus'),
  dataSrc.indexOf('export const', dataSrc.indexOf('export const campus') + 20),
);
const campusMetricList = [...campusSrc.matchAll(/value: '([^']+)', label: '([^']+)'/g)];
const campusHero = { value: campusMetricList[0]?.[1], label: campusMetricList[0]?.[2] };
const campusRest = campusMetricList.slice(1).map((m) => m[1]);

const checks = [];
const expect = (name, cond, detail) => checks.push([name, !!cond, detail]);

const target = await (
  await fetch(`${CDP}/json/new?${encodeURIComponent(`${BASE}/index.html`)}`, { method: 'PUT' })
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

const errors = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
    return;
  }
  if (m.method === 'Runtime.exceptionThrown') {
    errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  }
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
    errors.push(m.params.args.map((a) => a.value || a.description || '').join(' '));
  }
};
await new Promise((r) => {
  ws.onopen = r;
});
await send('Page.enable');
await send('Runtime.enable');
await send('Network.enable');
await send('Network.setCacheDisabled', { cacheDisabled: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const evaljs = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) return undefined;
  return r?.result?.value;
};

const viewport = (width, height, mobile = false, scale = 1) =>
  send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile });

/* ⚠️ cache-bust 必须拼在 # 之前：拼进 hash 只改片段，不会重新加载 */
const open = async (path) => {
  await send('Page.navigate', { url: `${BASE}/index.html?cb=${Date.now()}${path}` });
  await sleep(1900);
  await evaljs('window.scrollTo({top:0,behavior:"instant"})');
  await sleep(250);
};

const ROUTES = ['#/', '#/works', '#/campus-circle', '#/about', '#/skills', '#/contact', '#/resume', '#/opspilot', '#/category/agent'];

/* ---------- 1. 桌面：无横向溢出、无异常 ---------- */
await viewport(1440, 900);
for (const route of ROUTES) {
  await open(route);
  const probe = await evaljs(`(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
    h: document.querySelector('main')?.getBoundingClientRect().height || 0,
    h1: document.querySelector('main h1')?.textContent?.trim().slice(0, 24) || '',
  }))()`);
  expect(`${route} 没有横向溢出`, probe && probe.sw <= probe.cw + 1, probe && `scrollWidth ${probe.sw} / clientWidth ${probe.cw}`);
  expect(`${route} 正文有内容`, probe && probe.h > 400, probe && `main 高 ${Math.round(probe.h)}`);
  expect(`${route} 有 h1`, probe && probe.h1.length > 0, probe && probe.h1);
}

/* ---------- 2. /works 的 pin 与祖先链 ---------- */
await open('#/works');
const geom = await evaljs(`(() => {
  const band = document.querySelector('.works-band');
  const st = window.__st;
  return band ? { top: band.getBoundingClientRect().top, h: band.getBoundingClientRect().height, vh: innerHeight } : null;
})()`);
const travel = await evaljs(`(() => {
  const track = document.querySelector('.works-track');
  const vp = document.querySelector('.works-viewport');
  return track && vp ? track.scrollWidth - vp.clientWidth : 0;
})()`);
const bandStart = await evaljs(`(() => {
  const band = document.querySelector('.works-band');
  return band ? band.getBoundingClientRect().top + window.scrollY : 0;
})()`);

/* 滚到 pin 区间中段 */
await evaljs(`window.scrollTo({top: ${Math.round(bandStart + travel * 0.5)}, behavior:'instant'})`);
await sleep(1200);
const pinned = await evaljs(`(() => {
  const band = document.querySelector('.works-band');
  const ancestors = [];
  let el = band?.parentElement;
  while (el && el !== document.documentElement) {
    const cs = getComputedStyle(el);
    if (cs.transform !== 'none' || cs.willChange.includes('transform') || cs.filter !== 'none') {
      ancestors.push((el.className || el.tagName) + ' → ' + (cs.transform !== 'none' ? 'transform' : cs.willChange));
    }
    el = el.parentElement;
  }
  return {
    bandTop: band ? Math.round(band.getBoundingClientRect().top) : null,
    tx: getComputedStyle(document.querySelector('.works-track')).transform,
    ancestors: ancestors.slice(0, 4),
    counter: document.querySelector('.works-counter strong')?.textContent || '',
  };
})()`);
expect('pin 期间画廊贴住视口顶', pinned && Math.abs(pinned.bandTop) <= 2, pinned && `bandTop ${pinned.bandTop}`);
expect('pin 期间轨道有横向位移', pinned && pinned.tx !== 'none' && pinned.tx !== 'matrix(1, 0, 0, 1, 0, 0)', pinned && pinned.tx.slice(0, 40));
/* ⚠️ 祖先上只要有一个 transform，ScrollTrigger 的 pin 就会以它为包含块，
   表现是 bandTop 恒等于 -scrollY、整块画廊被顶出视口 */
expect('pin 的祖先链上没有 transform', pinned && pinned.ancestors.length === 0, pinned && pinned.ancestors.join(' | '));

/* ---------- 3. 吸附落点 ---------- */
const N = 9;
for (const frac of [0, 0.5, 1]) {
  const y = Math.round(bandStart + travel * frac);
  await evaljs(`window.scrollTo({top: ${y}, behavior:'instant'})`);
  await sleep(900); /* 等吸附 */
  const idx = await evaljs(`Number(document.querySelector('.works-counter strong')?.textContent || 0)`);
  const want = Math.round(frac * (N - 1)) + 1;
  expect(`吸附到第 ${want} 屏`, idx === want, `实际 ${idx}`);
}

/* ---------- 4. 转场不留 transform ---------- */
await evaljs(`(() => { location.hash = '#/about'; })()`);
await sleep(1500);
const stage = await evaljs(`(() => {
  const el = document.querySelector('.route-stage');
  const cs = el ? getComputedStyle(el) : null;
  return cs ? { t: cs.transform, o: cs.opacity, h1: document.querySelector('main h1')?.textContent?.trim() || '' } : null;
})()`);
expect('转场后 route-stage 清掉 transform', stage && stage.t === 'none', stage && stage.t);
expect('转场后不透明度回到 1', stage && Number(stage.o) > 0.99, stage && stage.o);
expect('转场后是新页面', stage && stage.h1.includes('卢柯宇'), stage && stage.h1);

/* ---------- 5. 移动端 ---------- */
await viewport(414, 900, true, 2);
await open('#/works');
const mobileWorks = await evaljs(`(() => ({
  bento: !!document.querySelector('.works-bento'),
  band: !!document.querySelector('.works-band'),
  cards: document.querySelectorAll('.works-bento-card').length,
  overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
}))()`);
expect('414 下作品页走 Bento', mobileWorks && mobileWorks.bento && !mobileWorks.band, JSON.stringify(mobileWorks));
expect('414 下 Bento 卡片数量正确', mobileWorks && mobileWorks.cards === 9, mobileWorks && String(mobileWorks.cards));
expect('414 下作品页无横向溢出', mobileWorks && !mobileWorks.overflow);

await open('#/campus-circle');
const mobileCover = await evaljs(`(() => {
  const img = document.querySelector('.narrative-cover img');
  const cs = img ? getComputedStyle(img) : null;
  const r = img ? img.getBoundingClientRect() : null;
  return { clip: cs?.clipPath, h: r ? Math.round(r.height) : 0, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 };
})()`);
/* ⚠️ 遮罩初始值只该在桌面断点里生效，手机上留着就是一片空白 */
expect('414 下封面不被遮罩裁掉', mobileCover && (mobileCover.clip === 'none' || mobileCover.clip === ''), mobileCover && mobileCover.clip);
expect('414 下封面有高度', mobileCover && mobileCover.h > 100, mobileCover && String(mobileCover.h));
expect('414 下叙事页无横向溢出', mobileCover && !mobileCover.overflow);

/* ---------- 6. 桌面：封面遮罩随滚动揭开 ---------- */
await viewport(1440, 900);
await open('#/campus-circle');
const beforeMask = await evaljs(`getComputedStyle(document.querySelector('.narrative-cover img')).clipPath`);
await evaljs('window.scrollTo({top: 600, behavior:"instant"})');
await sleep(900);
const afterMask = await evaljs(`getComputedStyle(document.querySelector('.narrative-cover img')).clipPath`);
const pct = (v) => Number((String(v).match(/([\d.]+)%\)/) || [])[1] || 0);
expect('封面遮罩随滚动收起', pct(afterMask) < pct(beforeMask), `${pct(beforeMask)}% → ${pct(afterMask)}%`);

/* ---------- 7. 校园圈子统计区：单英雄数字 + 散点照片 ---------- */
await viewport(1440, 900);
await open('#/campus-circle');
await evaljs(`(() => {
  const el = document.querySelector('.campus-stats');
  if (el) el.scrollIntoView({ block: 'center', behavior: 'instant' });
  return !!el;
})()`);
await sleep(3400); /* 计数 2s + 最后一段入场 0.7+0.6s，留足余量 */
const stats = await evaljs(`(() => {
  const sec = document.querySelector('.campus-stats');
  if (!sec) return null;
  return {
    shown: sec.getAttribute('data-shown'),
    num: sec.querySelector('.cs-number')?.textContent?.trim() || '',
    label: sec.querySelector('.cs-label')?.textContent?.trim() || '',
    photos: [...sec.querySelectorAll('.cs-photo')].map((img) => getComputedStyle(img).display),
    row: sec.querySelector('.cs-row')?.textContent?.replace(/\\s+/g, '') || '',
  };
})()`);
expect('统计区触发过入场', stats && stats.shown === 'true', stats && String(stats.shown));
expect('大数字计数结束停在「值+」', stats && stats.num === `${campusHero.value}+`, stats && stats.num);
expect('大数字标签来自 metrics[0]', stats && stats.label === campusHero.label, stats && stats.label);
expect('1440 下四张散点照片可见', stats && stats.photos.length === 4 && stats.photos.every((d) => d !== 'none'), stats && JSON.stringify(stats.photos));
expect('其余五个指标收在辅助行', stats && campusRest.every((v) => stats.row.includes(v)), stats && stats.row.slice(0, 80));

await viewport(414, 900, true, 2);
await open('#/campus-circle');
const mobileStats = await evaljs(`(() => {
  const sec = document.querySelector('.campus-stats');
  if (!sec) return null;
  return {
    photos: [...sec.querySelectorAll('.cs-photo')].map((img) => getComputedStyle(img).display),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  };
})()`);
expect('414 下散点照片隐藏', mobileStats && mobileStats.photos.length === 4 && mobileStats.photos.every((d) => d === 'none'), mobileStats && JSON.stringify(mobileStats.photos));
expect('414 下统计区无横向溢出', mobileStats && !mobileStats.overflow);

expect('全程没有控制台异常', errors.length === 0, errors.slice(0, 3).join(' | '));

ws.close();

let failed = 0;
for (const [name, ok, detail] of checks) {
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !detail ? '' : `\n        ${detail}`}`);
}
console.log(`\n结果: ${checks.length - failed}/${checks.length} 通过`);
process.exit(failed ? 1 : 0);
