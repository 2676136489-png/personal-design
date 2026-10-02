/**
 * 真机验证方向聚合页的边界情况。
 *
 * 三件事：
 * ① 不存在的方向 slug → 应显示「没有找到这个方向」而不是白屏
 * ② 单项目方向被手工输成 #/category/xxx → 也应是同样的兜底页
 * ③ 聚合页里点项目卡片能真跳到详情页
 *
 * SSR 断言证明不了「URL 变了页面真的切了」，这里读真实 DOM。
 *
 * 用法：node scripts/category-guard.mjs [url] [cdp端口]
 */
const url = process.argv[2] || 'http://127.0.0.1:5182/';
const CDP = process.argv[3] || '9370';

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
  width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false,
});
await send('Page.navigate', { url });
await new Promise((r) => setTimeout(r, 2400));

const evaluate = async (expression) =>
  (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }))?.result?.value;

const read = async () =>
  JSON.parse(await evaluate(`(() => {
  const main = document.querySelector('main');
  return JSON.stringify({
    hash: window.location.hash,
    h1: document.querySelector('main h1')?.textContent?.trim() || '',
    notFound: !!document.querySelector('.not-found'),
    /* 空白页判定：main 几乎没有文字，且没有可点的出路 */
    mainEmpty: (main?.textContent || '').trim().length < 40
      && !document.querySelector('.not-found a'),
    cards: [...document.querySelectorAll('.work-card h3')].map((h) => h.textContent.trim()),
    footer: !!document.querySelector('.site-footer'),
  });
})()`));

let bad = 0;

/* ① 不存在的方向 */
await evaluate(`(() => { window.location.hash = '#/category/nope'; return true; })()`);
await new Promise((r) => setTimeout(r, 700));
let s = await read();
const ok1 = s.notFound && !s.mainEmpty;
if (!ok1) bad += 1;
console.log(`${ok1 ? '✓' : '❌'} 不存在的方向 → ${s.h1 || '（无标题）'}${s.mainEmpty ? '  ⚠️ 页面几乎是空的' : ''}`);

/* ② 单项目方向被当成聚合页访问 */
await evaluate(`(() => { window.location.hash = '#/category/gomoku'; return true; })()`);
await new Promise((r) => setTimeout(r, 700));
s = await read();
const ok2 = s.notFound;
if (!ok2) bad += 1;
console.log(`${ok2 ? '✓' : '❌'} 单项目方向走聚合页 URL → ${s.h1 || s.cards.join('/')}`);

/* ③ 合法聚合页里点卡片真跳转 */
await evaluate(`(() => { window.location.hash = '#/category/agent'; return true; })()`);
await new Promise((r) => setTimeout(r, 800));
const before = await read();
const clicked = await evaluate(`(() => {
  const a = document.querySelector('.work-card a');
  if (!a) return 'no-card';
  a.click();
  return 'ok';
})()`);
await new Promise((r) => setTimeout(r, 800));
s = await read();
const ok3 = clicked === 'ok' && s.hash !== '#/category/agent' && s.h1.length > 0;
if (!ok3) bad += 1;
console.log(`${ok3 ? '✓' : '❌'} 聚合页点卡片 → ${s.hash}「${s.h1}」（点前有 ${before.cards.length} 张卡）`);

console.log('');
console.log(bad ? `❌ ${bad} 项不对` : '✅ 三项边界情况都正常');
ws.close();
process.exit(bad ? 1 : 0);
