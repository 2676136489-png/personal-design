/**
 * 查精选截图网格的图注有没有被裁切。
 *
 * 用户报的 bug：图注文字右侧被切掉一截（句子中途断开）。
 *
 * 结构性原因：.stage-item 带 overflow:hidden（图片从 1.08 回缩到 1 时
 * 不能溢出到相邻卡片），而 <figcaption> 是它的子元素 ——
 * 文字比卡片宽就被一起裁了。
 *
 * ⚠️ 关键：只在 1440px 下量是量不出来的。
 *    图注单行放得下就不溢出，窄一点才被切 ——
 *    用户是在 1080px 窗口下看到的。所以这个脚本扫一整串宽度，
 *    找出从哪个宽度开始出问题。只测一个宽度会漏掉真 bug。
 *
 * 用法：node scripts/caption-probe.mjs [url] [cdp端口]
 */
const url = process.argv[2] || 'http://127.0.0.1:5277/';
const CDP = process.argv[3] || '9333';

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

const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r?.result?.value;
};

/* 用户是在 1080px 宽的窗口下看到裁切的，1440px 下量不出来 ——
   图注单行放得下就不溢出，窄一点才会被切。
   所以这里扫一整串宽度，找出从哪个宽度开始出问题。
   只测一个宽度会漏掉真 bug。 */
const WIDTHS = [1920, 1440, 1280, 1180, 1080, 1024, 900, 768];

const results = new Map();

for (const width of WIDTHS) {
  await send('Emulation.setDeviceMetricsOverride', {
    width, height: 1000, deviceScaleFactor: 1, mobile: false,
  });
  await send('Page.navigate', { url });
  await new Promise((r) => setTimeout(r, 1400));
  await evaluate(`(() => {
    const st = document.createElement('style');
    st.textContent = '[data-reveal]{opacity:1 !important;transform:none !important}';
    document.head.appendChild(st);
    return true;
  })()`);

  const items = await evaluate(`[...document.querySelectorAll('.stage-item')].map((fig, i) => {
    const cap = fig.querySelector('figcaption');
    if (!cap) return null;
    const fr = fig.getBoundingClientRect();
    const cr = cap.getBoundingClientRect();
    return {
      i,
      len: cap.textContent.trim().length,
      itemW: Math.round(fr.width),
      capClientW: cap.clientWidth,
      overflowPx: Math.max(0, cap.scrollWidth - cap.clientWidth),
      lines: Math.max(1, Math.round(cr.height / parseFloat(getComputedStyle(cap).lineHeight || '20.8'))),
      text: cap.textContent.trim(),
    };
  }).filter(Boolean)`);

  const bad = items.filter((it) => it.overflowPx > 1);
  const multi = items.filter((it) => it.lines > 1);
  if (bad.length) results.set(width, bad);
  console.log(`${bad.length ? '✗' : '✓'} ${String(width).padStart(4)}px  ${items.length} 张  ` +
    `裁切 ${bad.length}  折行 ${multi.length}` +
    (bad.length ? `  → 溢出 ${Math.max(...bad.map((b) => b.overflowPx))}px` : ''));
  /* 每个出问题的宽度都打一次明细：不同宽度溢出的是不同条目，都要看 */
  if (bad.length) {
    for (const it of bad) {
      console.log(`     #${it.i} 容器${it.itemW}px 文字${it.capClientW}px ` +
        `溢出${it.overflowPx}px ${it.lines}行`);
      console.log(`        「${it.text}」`);
    }
  }
}

const firstBad = WIDTHS.find((w) => results.has(w));
console.log(`\n${firstBad ? `❌ ${firstBad}px 起开始裁切` : '✅ 各宽度下都没有裁切'}`);
ws.close();
process.exit(firstBad ? 1 : 0);
