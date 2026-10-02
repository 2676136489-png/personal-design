/**
 * 量名片上新加的邮箱 / 电话链接的对比度。
 *
 * 这两行是 .about-facts a，用了 --ink-soft 而不是继承 li 的 --muted ——
 * --muted 在深色主题下只有 3.21:1，擦着 WCAG 4.5:1 的线不够
 * （--muted 全站 40 多处在用，不能为了这两行去动它）。
 *
 * WCAG 正文阈值 4.5:1。名片里是 14px 普通字，按 4.5:1 算。
 *
 * ⚠️ 切主题必须点导航栏那个按钮，不能 setAttribute 改 data-theme。
 *    主题存在 React state 里（App 的 useState + useEffect 写 dataset），
 *    直接改属性的话 state 没变，下一次 effect 就把属性写回去 ——
 *    我第一版就是这么把「变量已切、computed color 没切」这种自相矛盾的数据
 *    量出来的，白排查一轮。走真实点击才和用户看到的一致。
 *
 * 每个主题开独立标签页，localStorage 在同源下共享，先设一次再刷新。
 *
 * 用法：node scripts/about-link-contrast.mjs [url] [cdp端口]
 */
const url = process.argv[2] || 'http://127.0.0.1:5180/';
const CDP = process.argv[3] || '9361';

const openTab = async () =>
  (
    await fetch(`http://127.0.0.1:${CDP}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })
  ).json();

const connect = async () => {
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
  return { ws, send };
};

const rows = [];

/* 先在一个标签页里把 localStorage 定到 dark（站点默认值） */
{
  const { ws, send } = await connect();
  await send('Page.enable');
  await send('Page.navigate', { url });
  await new Promise((r) => setTimeout(r, 1600));
  await send('Runtime.evaluate', {
    expression: "localStorage.setItem('portfolio-theme-v2','dark')",
  });
  ws.close();
}

for (const theme of ['dark', 'light']) {
  const { ws, send } = await connect();
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false,
  });
  /* 导航前先定好 localStorage，App 初始化时读到的就是目标主题 */
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `try{localStorage.setItem('portfolio-theme-v2','${theme}')}catch(e){}`,
  });
  await send('Page.navigate', { url });
  await new Promise((r) => setTimeout(r, 2400));

  const evaluate = async (expression) =>
    (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }))?.result?.value;

  /* 校验主题真的生效了，不是 dark 就点一下切换按钮 */
  const actual = await evaluate(`document.documentElement.getAttribute('data-theme')`);
  if (actual !== theme) {
    await evaluate(`(() => {
  const btn = [...document.querySelectorAll('.nav-icon')]
    .find((b) => /切换到(深色|浅色)外观/.test(b.getAttribute('aria-label') || ''));
  if (btn) btn.click();
  return true;
})()`);
    await new Promise((r) => setTimeout(r, 600));
  }

  const out = await evaluate(`(() => {
  const parse = (c) => {
    const m = c.match(/[\\d.]+/g);
    if (!m) return null;
    return { r: +m[0], g: +m[1], b: +m[2], a: m[3] === undefined ? 1 : +m[3] };
  };
  /* 相对亮度：先把 sRGB 反伽马到线性，再按 0.2126/0.7152/0.0722 加权 */
  const lum = (c) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  /* 前景半透明时要先按 alpha 合成到背景上再算 */
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });
  const ratio = (a, b) => {
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };

  /* 逐层往上找不透明的底色。
     ⚠️ body 的背景是 radial-gradient 叠 var(--page)，
        getComputedStyle(body).backgroundColor 只返回 rgba(0,0,0,0)。
        找不到时退回 CSS 变量 --page，否则前景会跟「透明」算，
        得出「前景比背景还暗」这种荒谬比值。 */
  const bgOf = (el) => {
    let node = el;
    let acc = null;
    while (node && node !== document.documentElement.parentNode) {
      const c = parse(getComputedStyle(node).backgroundColor);
      if (c && c.a > 0) {
        acc = acc ? over(acc, c) : c;
        if (acc.a >= 1) return acc;
      }
      node = node.parentElement;
    }
    const rootCs = getComputedStyle(document.documentElement);
    const pageVar = parse(rootCs.getPropertyValue('--page').trim() || '');
    const root = pageVar || parse(rootCs.backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
    return acc ? (acc.a < 1 ? over(acc, root) : acc) : root;
  };

  const out = [];
  const targets = [
    ['名片邮箱', '.about-facts a[href^="mailto:"]'],
    ['名片电话', '.about-facts a[href^="tel:"]'],
    ['旁边正文（城市）', '.about-facts li:nth-child(2) span'],
    ['课程行', '.about-facts li:nth-child(3) span'],
    ['GitHub 按钮文字', '.about-github'],
  ];

  const realTheme = document.documentElement.getAttribute('data-theme');
  for (const [name, sel] of targets) {
    const el = document.querySelector(sel);
    if (!el) { out.push({ theme: realTheme, name, ratio: null, note: '未找到' }); continue; }
    const cs = getComputedStyle(el);
    const bg = bgOf(el);
    const fg = over(parse(cs.color), bg);
    out.push({
      theme: realTheme,
      name,
      fontSize: cs.fontSize,
      color: cs.color,
      ratio: Math.round(ratio(fg, bg) * 100) / 100,
    });
  }
  return JSON.stringify(out);
})()`);

  for (const r of JSON.parse(out || '[]')) rows.push(r);
  ws.close();
}

console.log(JSON.stringify(rows, null, 1));

const bad = rows.filter((r) => r.ratio !== null && r.ratio < 4.5);
const missing = rows.filter((r) => r.ratio === null);
console.log('');
if (bad.length) {
  console.log(`❌ ${bad.length} 处低于 4.5:1`);
  for (const b of bad) console.log(`   ${b.theme} ${b.name}: ${b.ratio}  (${b.color})`);
} else if (missing.length) {
  console.log('❌ 有目标元素没找到：');
  for (const m of missing) console.log(`   ${m.theme} ${m.name}: ${m.note}`);
} else {
  console.log('✅ 全部达到 4.5:1');
}

process.exit(bad.length || missing.length ? 1 : 0);
