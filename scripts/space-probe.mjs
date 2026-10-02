/**
 * 量详情页 hero 的真实间距。
 *
 * 为什么能量：截图只能看出「挤在一起」，说不出差多少像素。
 * 而且这里有个静态断言抓不到的坑 —— .page-hero-shot 带着
 * translateY(34px) 上移，它会吃掉父容器预留的底部留白，
 * getBoundingClientRect 量到的间距才是用户真正看到的。
 *
 * 顺带把全站其他「文字贴太近」的地方一起量出来：
 * 竖直方向上相邻两个元素之间小于 16px 就报出来。
 *
 * 用法：node scripts/space-probe.mjs [cdp端口] [url]
 */
const CDP = process.argv[2] || '9333';
const URL_ = process.argv[3] || 'https://lukeyu-portfolio.app.workbuddy.host/index.html#/opspilot';

const target = await (
  await fetch(`http://127.0.0.1:${CDP}/json/new?${encodeURIComponent(URL_)}`, { method: 'PUT' })
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
await send('Page.navigate', { url: URL_ });
await new Promise((r) => setTimeout(r, 2200));

const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r?.result?.value;
};

const hero = await evaluate(`(() => {
  const dump = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      sel, top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height),
      display: cs.display, marginBottom: cs.marginBottom, lineHeight: cs.lineHeight,
      /* 行内元素（inline-flex）的垂直 margin 不推开下一行，
         rect 会被自己的 line-height 撑大，视觉上就跟邻居重叠。 */
      inlineLevel: cs.display.startsWith('inline'),
      offsetH: el.offsetHeight,
    };
  };
  const shot = document.querySelector('.page-hero-shot');
  const inner = document.querySelector('.page-hero-inner');
  const cs = shot ? getComputedStyle(shot) : null;
  return {
    parts: ['.back-link', '.page-hero .eyebrow', '.page-hero h1', '.page-hero-lede',
            '.page-hero-note', '.page-hero-meta', '.hero-actions', '.page-hero-shot']
      .map(dump).filter(Boolean),
    /* translateY 是视觉位移，不体现在父容器的布局盒上。
       算「图片视觉上沿」和「按钮视觉下沿」的真实间隔必须手动加回去。 */
    shotShiftY: cs ? cs.transform : 'none',
    innerPadBottom: inner ? getComputedStyle(inner).paddingBottom : '?',
    innerPadTop: inner ? getComputedStyle(inner).paddingTop : '?',
  };
})()`);

console.log('【hero 元素纵向位置】');
for (const p of hero.parts) {
  const flag = p.inlineLevel ? '  [行内]' : '';
  console.log(`  ${p.sel.padEnd(22)} top=${String(p.top).padStart(5)}  bottom=${String(p.bottom).padStart(5)}  h=${String(p.h).padStart(3)}${flag}`);
}
console.log('\n  .page-hero-inner padding:', hero.innerPadTop, '/', hero.innerPadBottom);
console.log('  .page-hero-shot transform:', hero.shotShiftY);

const gapTo = (a, b) => {
  const x = hero.parts.find((p) => p.sel === a);
  const y = hero.parts.find((p) => p.sel === b);
  return x && y ? y.top - x.bottom : null;
};

const shotGap = gapTo('.hero-actions', '.page-hero-shot');
console.log(`\n【按钮下沿 → 图片上沿】${shotGap}px`);
if (shotGap !== null && shotGap < 28) console.log('  ⚠️  偏紧。按钮与截图挤在一起，视觉上像贴住。');

for (const [label, a, b, min] of [
  ['返回首页 → eyebrow', '.back-link', '.page-hero .eyebrow', 16],
  ['lede → note', '.page-hero-lede', '.page-hero-note', 16],
  ['note → 标签行', '.page-hero-note', '.page-hero-meta', 16],
  ['标签行 → 按钮', '.page-hero-meta', '.hero-actions', 16],
]) {
  const g = gapTo(a, b);
  if (g === null) continue;
  console.log(`【${label}】${g}px${g < min ? '  ⚠️' : ''}`);
}

/* 全站扫一遍：竖直方向相邻块之间过近的地方 */
const tight = await evaluate(`(() => {
  const MIN = 16;
  const out = [];
  const groups = [
    ['.page-hero-inner > *', '详情页 hero'],
    ['.work-body > *', '作品卡片内文'],
  ];
  for (const [sel, label] of groups) {
    const box = document.querySelector(sel);
    if (!box) continue;
    const kids = [...box.children].filter((el) => {
      const r = el.getBoundingClientRect();
      /* 只看带 class 的。匿名包裹层（<a>）会包住整块内容，
         它的 rect 与子元素重叠是必然的，量出来永远是负数，纯属噪音。 */
      return r.height > 0 && el.className && typeof el.className === 'string'
        && getComputedStyle(el).position !== 'absolute';
    });
    for (let n = 1; n < kids.length; n += 1) {
      const a = kids[n - 1].getBoundingClientRect();
      const b = kids[n].getBoundingClientRect();
      const gap = Math.round(b.top - a.bottom);
      if (gap < MIN) {
        out.push({ label, pair: kids[n - 1].className + ' → ' + kids[n].className, gap });
      }
    }
  }
  return out;
})()`);

console.log('\n【全站过近处（< 16px）】');
if (!tight.length) console.log('  无');
for (const t of tight) console.log(`  ${t.gap}px  [${t.label}] ${t.pair}`);

ws.close();
process.exit(0);
