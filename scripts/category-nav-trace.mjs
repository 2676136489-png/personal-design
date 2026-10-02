/**
 * 逐条真点导航下拉「按方向」里的每一项，验证落点对不对。
 *
 * 用户报的问题：点任何方向都只跳到全部作品概览。
 * SSR 断言只能证明「按这个 hash 渲染出的 HTML 里有那个标题」，
 * 证明不了真点下去会跳 —— 所以这里走真实鼠标事件 + 读 URL。
 *
 * 判据：单项目方向应落到该项目详情页（URL 是 #/<slug>，
 * 页面 h1 是项目名）；多项目方向应落到 #/category/<slug>，
 * 页面上要列全该方向的所有项目。
 *
 * 用法：node scripts/category-nav-trace.mjs [url] [cdp端口]
 */
const url = process.argv[2] || 'http://127.0.0.1:5182/';
const CDP = process.argv[3] || '9370';

const openTab = async () =>
  (
    await fetch(`http://127.0.0.1:${CDP}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })
  ).json();

const target = await openTab();
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
await new Promise((r) => setTimeout(r, 2600));

const evaluate = async (expression) =>
  (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }))?.result?.value;

/* 从 data.js 里拿方向与项目的对应关系（页面里读不到模块，
   改成直接读渲染好的 DOM —— 导航面板的条目都带 href）。 */
const links = await evaluate(`(() => {
  document.querySelectorAll('.nav-panel-col').forEach((col) => {
    const title = col.querySelector('.nav-panel-title')?.textContent?.trim();
    if (title !== '按方向') return;
    window.__catLinks = [...col.querySelectorAll('a')].map((a) => ({
      label: (a.textContent || '').trim(),
      href: a.getAttribute('href') || '',
    }));
  });
  return JSON.stringify(window.__catLinks || []);
})()`);

const items = JSON.parse(links || '[]');
if (!items.length) {
  console.log('❌ 导航「按方向」列没有条目');
  ws.close();
  process.exit(1);
}

console.log(`导航「按方向」共 ${items.length} 项，逐条真点验证落点\n`);

let bad = 0;
for (const item of items) {
  await evaluate(`(() => { window.location.hash = '#/'; return true; })()`);
  await new Promise((r) => setTimeout(r, 700));

  /* 展开导航面板（真实 hover 走鼠标事件；这里直接点开更稳） */
  const box = await evaluate(`(() => {
  const trigger = [...document.querySelectorAll('.nav-group-trigger')]
    .find((t) => /全部作品/.test(t.textContent || ''));
  if (!trigger) return null;
  const r = trigger.getBoundingClientRect();
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
})()`);
  if (!box) {
    console.log(`   ${item.label.padEnd(12)} ❌ 找不到「全部作品」触发项`);
    bad += 1;
    continue;
  }
  /* ⚠️ 必须分两步：先在远处落一下再移到目标。
     CDP 的 Input.dispatchMouseEvent 不携带上一次鼠标位置，
     直接派发只有第一次会触发 mouseover。 */
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 700, y: 500, buttons: 0 });
  await new Promise((r) => setTimeout(r, 30));
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x, y: box.y, buttons: 0 });
  await new Promise((r) => setTimeout(r, 450));

  /* 在展开的面板里找到对应条目并点它 */
  const hit = await evaluate(`(() => {
  const want = ${JSON.stringify(item.label)};
  const a = [...document.querySelectorAll('.nav-panel a')]
    .find((x) => (x.textContent || '').trim() === want);
  if (!a) return 'not-found';
  a.click();
  return 'clicked';
})()`);

  await new Promise((r) => setTimeout(r, 800));

  if (hit !== 'clicked') {
    console.log(`   ${item.label.padEnd(12)} ❌ 面板里没找到这个条目`);
    bad += 1;
    continue;
  }

  const landed = await evaluate(`(() => {
  const h1 = document.querySelector('main h1')?.textContent?.trim() || '';
  const hash = window.location.hash;
  const cards = [...document.querySelectorAll('.work-card h3')].map((h) => h.textContent.trim());
  return JSON.stringify({ hash, h1, cards });
})()`);
  const { hash, h1, cards } = JSON.parse(landed);

  const expectCat = item.href.startsWith('#/category/');
  const ok = expectCat
    ? hash === item.href && cards.length > 0
    : hash === item.href && h1.length > 0;

  const mark = ok ? '✓' : '❌';
  if (!ok) bad += 1;
  const detail = expectCat
    ? `${hash}  列了 ${cards.length} 个项目：${cards.join(' / ') || '（空）'}`
    : `${hash}  h1「${h1}」`;
  console.log(`   ${mark} ${item.label.padEnd(12)} → ${detail}`);
}

console.log('');
console.log(bad ? `❌ ${bad} 项落点不对` : '✅ 每一项都落到了对应的项目');
ws.close();
process.exit(bad ? 1 : 0);
