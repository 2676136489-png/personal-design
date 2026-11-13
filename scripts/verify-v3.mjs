/**
 * 新版（v3）真实浏览器冒烟。
 * 逻辑/结构走 SSR 那三套旧脚本，这里只管「浏览器里到底长什么样、点不点得动」。
 * 用法：node scripts/verify-v3.mjs [base] [cdpPort]
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = process.argv[2] || 'http://127.0.0.1:5201/';
const PORT = process.argv[3] || '9333';
const SHOTS = new URL('../screenshots/', import.meta.url);
mkdirSync(SHOTS, { recursive: true });

const cdp = `http://127.0.0.1:${PORT}`;
const target = await (
  await fetch(`${cdp}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' })
).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
let seq = 0;
const pending = new Map();
const errors = [];
const checks = [];

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
  if (msg.method === 'Runtime.exceptionThrown') errors.push(`exception: ${msg.params.exceptionDetails.text}`);
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
    errors.push(`console: ${msg.params.args.map((a) => a.value ?? a.description).join(' ')}`);
  }
  if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
    errors.push(`log: ${msg.params.entry.text}`);
  }
};

await new Promise((r) => (ws.onopen = r));
await send('Runtime.enable');
await send('Log.enable');
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
const expect = (label, ok, detail = '') => {
  checks.push({ label, ok: !!ok, detail });
  console.log(`${ok ? 'PASS ' : 'FAIL '} ${label}${!ok && detail ? ` — ${detail}` : ''}`);
};
const shot = async (name) => {
  const cap = await send('Page.captureScreenshot', { format: 'png' });
  const file = new URL(`v3-${name}.png`, SHOTS);
  writeFileSync(file, Buffer.from(cap.data, 'base64'));
};
const goto = async (url) => {
  await send('Page.navigate', { url });
  await wait(3500);
};

const bust = () => `${BASE}${BASE.includes('?') ? '&' : '?'}cb=${Date.now()}`;
await goto(bust());
await wait(2500);

/* ---------- 首屏结构 ---------- */
const dom = await evaluate(`(() => {
  const q = (s) => document.querySelectorAll(s);
  const root = document.querySelector('.v3');
  const cs = root ? getComputedStyle(root) : null;
  const h1 = document.querySelector('.v3-hero-h1');
  const hcs = h1 ? getComputedStyle(h1) : null;
  const de = document.documentElement;
  return {
    title: document.title,
    hasRoot: !!root,
    bg: cs?.backgroundColor,
    font: cs?.fontFamily,
    h1Text: h1?.textContent,
    h1Clip: hcs?.webkitBackgroundClip || hcs?.backgroundClip,
    navLinks: q('.v3-nav-links a').length,
    statusLink: q('.v3-nav-status').length,
    legacyVisible: q('.v3-nav-legacy, a[href*="skin=legacy"]').length +
      Array.from(q('a')).filter((a) => /旧版|重构前|返回旧/.test(a.textContent || '')).length,
    sections: {
      hero: q('.v3-hero').length,
      facts: q('.v3-fact').length,
      marqueeTiles: q('.v3-marquee-tile').length,
      about: q('#about').length,
      skills: q('#skills').length,
      work: q('#work').length,
      timeline: q('.v3-timeline-row').length,
      resume: q('#resume-teaser').length,
      contact: q('#contact').length,
    },
    factValues: Array.from(q('.v3-fact-value')).map((n) => n.textContent),
    capRows: q('.v3-cap-row').length,
    skillItems: q('.v3-skill-item').length,
    stackCards: q('.v3-stack-card').length,
    stackTitles: Array.from(q('.v3-stack-heading h3')).map((n) => n.textContent),
    honors: q('.v3-honor').length,
    contactLinks: q('.v3-contact-link').length,
    heroObjectLoaded: (() => { const i = document.querySelector('.v3-object-img'); return !!i && i.complete && i.naturalWidth > 0; })(),
    viewport: de.clientWidth,
    scrollWidth: de.scrollWidth,
    scrollHeight: de.scrollHeight,
  };
})()`);

expect('页面标题正确', dom.title === '卢柯宇 | 个人作品集', dom.title);
expect('新版根节点存在且背景是 #0C0C0C', dom.hasRoot && dom.bg === 'rgb(12, 12, 12)', dom.bg);
expect('字体栈以 Kanit 开头', /^['"]?Kanit/.test(dom.font || ''), dom.font);
expect('渐变大标题用了 background-clip:text', dom.h1Text === 'LUKEYU' && dom.h1Clip === 'text', `${dom.h1Text} / ${dom.h1Clip}`);
expect('导航 5 个栏目 + 求职状态胶囊', dom.navLinks === 5 && dom.statusLink === 1, `${dom.navLinks}/${dom.statusLink}`);
expect('界面上没有旧版入口', dom.legacyVisible === 0, String(dom.legacyVisible));
expect('八个板块都在', Object.values(dom.sections).every((n) => n > 0), JSON.stringify(dom.sections));
expect('首屏数据条 4 项且值来自数据源', JSON.stringify(dom.factValues) === JSON.stringify(['9 个', '6 个', '19 位', '4 类']), dom.factValues.join('/'));
expect('作品滚动带 27 张封面（5+4 各三倍）', dom.sections.marqueeTiles === 27, String(dom.sections.marqueeTiles));
expect('能力 4 组 + 技术栈 6 组', dom.capRows === 4 && dom.skillItems === 6, `${dom.capRows}/${dom.skillItems}`);
expect('作品堆叠卡 9 张（含校园圈子）', dom.stackCards === 9, String(dom.stackCards));
expect('旗舰项目在首位', (dom.stackTitles[0] || '').includes('校园圈子'), dom.stackTitles[0]);
const cardSlots = await evaluate(`Array.from(document.querySelectorAll('.v3-stack-card')).map((card) => {
  const imgs = Array.from(card.querySelectorAll('.v3-stack-grid img'));
  const srcs = imgs.map((i) => i.getAttribute('src'));
  const panels = card.querySelectorAll('.v3-stack-grid .v3-stack-panel').length;
  return { title: card.querySelector('h3')?.textContent, slots: srcs.length + panels, unique: new Set(srcs).size, images: srcs.length };
})`);
expect('每张作品卡恰好三格且没有重复图源', cardSlots.length === 9 && cardSlots.every((c) => c.slots === 3 && c.unique === c.images), JSON.stringify(cardSlots));
expect('至少六张卡是三张不同的真实界面截图', cardSlots.filter((c) => c.images === 3 && c.unique === 3).length >= 6, JSON.stringify(cardSlots.filter((c) => c.images !== 3)));
expect('时间线 7 条 / 荣誉 6 条 / 联系 4 行', dom.sections.timeline === 7 && dom.honors === 6 && dom.contactLinks === 4, `${dom.sections.timeline}/${dom.honors}/${dom.contactLinks}`);
expect('3D 主视觉图片加载成功', dom.heroObjectLoaded);
expect('桌面视口无横向溢出', dom.scrollWidth <= dom.viewport + 1, `${dom.scrollWidth} vs ${dom.viewport}`);

/* 按钮撞色回归：白底区里 `.v3 a { color: inherit }` 曾把黑底按钮染成黑字。
   判据本身先用正反例自证，免得规则写坏还一路 PASS。 */
const btnColors = await evaluate(`Array.from(document.querySelectorAll('a[class*="v3-btn"]')).map((a) => {
  const s = getComputedStyle(a);
  return { text: a.textContent.trim(), cls: a.className, color: s.color, fill: s.webkitTextFillColor, bg: s.backgroundColor };
})`);
const invisible = (b) => /^rgb\(/.test(b.bg) && b.bg !== 'rgba(0, 0, 0, 0)' && (b.color === b.bg || b.fill === b.bg);
expect('判据自测：黑底黑字会被判为不可读', invisible({ color: 'rgb(12, 12, 12)', fill: 'rgb(12, 12, 12)', bg: 'rgb(12, 12, 12)' }) && !invisible({ color: 'rgb(255, 255, 255)', fill: 'rgb(255, 255, 255)', bg: 'rgb(12, 12, 12)' }));
expect('所有实心按钮文字与底色不撞色', btnColors.every((b) => !invisible(b)), JSON.stringify(btnColors.filter(invisible)));
const inkBtns = btnColors.filter((b) => /(?:^|\s)v3-btn-(?:ink|gradient)(?:\s|$)/.test(b.cls));
expect('黑底/渐变按钮用白字', inkBtns.length > 0 && inkBtns.every((b) => b.color === 'rgb(255, 255, 255)' && b.fill === 'rgb(255, 255, 255)'), JSON.stringify(inkBtns));
await shot('hero');

/* ---------- 自动反向滚动 + 悬停单行冻结 + 放大 ---------- */
await evaluate(`document.querySelector('.v3-marquee').scrollIntoView()`);
await wait(900);
/* 用 computed matrix 的 m41 读真实 x，别信 inline 字符串的格式 */
const readRows = () =>
  evaluate(`Array.from(document.querySelectorAll('.v3-marquee-row')).map((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41)`);

const autoA = await readRows();
await wait(800);
const autoB = await readRows();
expect('两行持续自动滚动且方向相反', autoB[0] < autoA[0] - 3 && autoB[1] > autoA[1] + 3, JSON.stringify({ autoA, autoB }));

const tilePos = await evaluate(`(() => {
  const row = document.querySelector('.v3-marquee-row');
  const tiles = Array.from(row.querySelectorAll('.v3-marquee-tile'));
  /* 第一张图常常已经滚到视口左边外面，必须挑当前真正可见的那张 */
  const visible = tiles.find((t) => {
    const r = t.getBoundingClientRect();
    return r.left > 40 && r.right < innerWidth - 40 && r.top > 70 && r.bottom < innerHeight;
  }) || tiles[2];
  const r = visible.getBoundingClientRect();
  const rr = row.getBoundingClientRect();
  return { x: Math.round(r.left + r.width / 2), y: Math.round(rr.top + rr.height / 2) };
})()`);
/* 先在远处落一下：不带上次位置的第一次 mouseMoved 合成不出 mouseover */
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 5, buttons: 0 });
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: tilePos.x, y: tilePos.y, buttons: 0 });
await wait(800);
const heldA = await readRows();
await wait(700);
const heldB = await readRows();
expect('鼠标所在的那一行停下', Math.abs(heldB[0] - heldA[0]) < 0.6, JSON.stringify({ heldA, heldB }));
expect('另一行继续滚动', heldB[1] > heldA[1] + 3, JSON.stringify({ heldA, heldB }));
const hoverScale = await evaluate(`(() => {
  const t = document.querySelector('.v3-marquee-tile:hover');
  return t ? new DOMMatrixReadOnly(getComputedStyle(t).transform).a : null;
})()`);
expect('鼠标下的图片被放大', hoverScale !== null && hoverScale > 1.08, String(hoverScale));
await shot('marquee-hover');

await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 5, buttons: 0 });
await wait(600);
const resumeA = await readRows();
await wait(700);
const resumeB = await readRows();
expect('移开鼠标后该行恢复滚动', resumeB[0] < resumeA[0] - 3, JSON.stringify({ resumeA, resumeB }));

/* ---------- 页面滚动视差仍生效 + 粘性缩放 ---------- */
const scrollProbe = await evaluate(`(async () => {
  const rows = Array.from(document.querySelectorAll('.v3-marquee-row'));
  const read = () => rows.map((r) => new DOMMatrixReadOnly(getComputedStyle(r).transform).m41);
  window.scrollTo(0, 900);
  await new Promise((r) => setTimeout(r, 600));
  const a = read();
  window.scrollTo(0, 1700);
  await new Promise((r) => setTimeout(r, 600));
  const b = read();
  const work = document.getElementById('work');
  window.scrollTo(0, work.offsetTop + 700);
  await new Promise((r) => setTimeout(r, 900));
  const cards = Array.from(document.querySelectorAll('.v3-stack-card')).slice(0, 3).map((c) => getComputedStyle(c).transform);
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 600));
  return { a, b, cards };
})()`);
expect('页面滚动仍给两行反向视差', scrollProbe.a[0] !== scrollProbe.b[0] && scrollProbe.a[1] !== scrollProbe.b[1], JSON.stringify([scrollProbe.a, scrollProbe.b]));
expect('堆叠卡有 sticky 缩放 transform', scrollProbe.cards.some((t) => t && t !== 'none'), JSON.stringify(scrollProbe.cards));

await evaluate(`document.getElementById('about').scrollIntoView()`);
await wait(1200);
const aboutReveal = await evaluate(`(() => {
  const vals = Array.from(document.querySelectorAll('#about .v3-at-ink')).map((c) => Number(getComputedStyle(c).opacity));
  return { count: vals.length, min: vals.length ? Math.min(...vals) : 0 };
})()`);
expect('关于页逐字文本在可读位置已全部点亮', aboutReveal.count > 50 && aboutReveal.min >= 0.99, JSON.stringify(aboutReveal));
await shot('about');
await evaluate(`document.querySelector('.v3-marquee').scrollIntoView()`);
await wait(1200);
await shot('marquee');
await evaluate(`document.getElementById('skills').scrollIntoView()`);
await wait(1200);
await shot('capabilities');
await evaluate(`document.getElementById('work').scrollIntoView()`);
await wait(1600);
const loadedCardImages = await evaluate(`(() => {
  const imgs = Array.from(document.querySelectorAll('.v3-stack-card .v3-stack-grid img'));
  return { total: imgs.length, broken: imgs.filter((i) => i.complete && i.naturalWidth === 0).length };
})()`);
expect('作品卡的新截图没有 404', loadedCardImages.broken === 0, JSON.stringify(loadedCardImages));
await shot('projects');
/* 单独截一张卡片，README 用它说明三格素材互不重复 */
await evaluate(`document.querySelectorAll('.v3-stack-item')[1].scrollIntoView({block:'start'})`);
await wait(900);
await shot('card-02');
await evaluate(`document.getElementById('resume-teaser').scrollIntoView()`);
await wait(1200);
await shot('resume');
await evaluate(`document.getElementById('contact').scrollIntoView()`);
await wait(1200);
await shot('contact');

/* ---------- 路由 ---------- */
const goHash = async (hash) => {
  await evaluate(`window.location.hash = ${JSON.stringify(hash)}; window.scrollTo(0,0);`);
  await wait(1400);
};
await goHash('#/works');
const works = await evaluate(`({ tiles: document.querySelectorAll('.v3-tile').length, filters: document.querySelectorAll('.v3-filters button').length, h2: document.querySelector('.v3-title')?.textContent })`);
expect('全部作品页 9 张卡片 + 方向筛选', works.tiles === 9 && works.filters > 1, JSON.stringify(works));

await goHash('#/resume');
const fullResume = await evaluate(`({ sections: document.querySelectorAll('.v3-fr-section').length, projects: document.querySelectorAll('.v3-fr-project').length, pdf: !!document.querySelector('.v3-fr-preview'), text: document.body.innerText.includes('256 项 pytest') })`);
expect('完整简历页含项目经历与 PDF 预览', fullResume.sections >= 6 && fullResume.projects === 4 && fullResume.pdf, JSON.stringify(fullResume));

await goHash('#/opspilot');
const detail = await evaluate(`({ title: document.querySelector('.v3-detail-title')?.textContent, chapters: document.querySelectorAll('.v3-chapter').length, tables: document.querySelectorAll('.v3-block-table').length })`);
expect('项目详情页章节渲染（含表格块）', (detail.title || '').includes('OpsPilot') && detail.chapters >= 4 && detail.tables > 0, JSON.stringify(detail));

/* 详情页顶部封面 + 图集：九个项目里只有 campus 的章节自带截图，
   其余八个曾经整页一张图都没有。这里把「每个详情页都得有真实界面」钉住。 */
const cover = await evaluate(`(() => {
  const img = document.querySelector('.v3-detail-cover img');
  if (!img) return { ok: false };
  const r = img.getBoundingClientRect();
  return {
    ok: img.naturalWidth > 0,
    natural: img.naturalWidth + 'x' + img.naturalHeight,
    shown: Math.round(r.width) + 'x' + Math.round(r.height),
    /* 显示比例与原始比例差超过 2% 就是被拉变形了 */
    skew: Math.abs((r.width / r.height) / (img.naturalWidth / img.naturalHeight) - 1),
  };
})()`);
expect('详情页顶部有封面且没被拉伸', cover.ok && cover.skew < 0.02, JSON.stringify(cover));

/* 图集去重要在 campus 上验：只有它同时存在章节截图与图集，
   放在 opspilot 上这条断言永远没有反例可失败。 */
await goHash('#/campus');
const gallery = await evaluate(`(() => {
  const strip = [...document.querySelectorAll('.v3-detail-gallery img')].map(i => i.getAttribute('src'));
  const shots = [...document.querySelectorAll('.v3-block-shot img')].map(i => i.getAttribute('src'));
  const dup = strip.filter(s => shots.includes(s) || strip.indexOf(s) !== strip.lastIndexOf(s));
  return { strip: strip.length, shots: shots.length, dup };
})()`);
expect('详情页图集不与章节截图重复', gallery.shots >= 3 && gallery.dup.length === 0, JSON.stringify(gallery));

/* 有线上站点的项目，详情页至少得看到两张不同的界面图（封面 + 图集） */
await goHash('#/gomoku');
const gomokuGallery = await evaluate(`(() => {
  const srcs = [...document.querySelectorAll('.v3-detail-cover img, .v3-detail-gallery img')].map(i => i.getAttribute('src'));
  return { count: srcs.length, unique: new Set(srcs).size };
})()`);
expect('有站点的详情页至少两张不同界面图', gomokuGallery.unique >= 2, JSON.stringify(gomokuGallery));
await shot('detail');

await goHash('#/category/agent');
const category = await evaluate(`({ tiles: document.querySelectorAll('.v3-tile').length, title: document.querySelector('.v3-title')?.textContent })`);
expect('方向聚合页按分类过滤', category.tiles > 0 && category.tiles < 9, JSON.stringify(category));

/* ---------- 移动端 ---------- */
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await goto(bust());
await wait(2200);
const mobile = await evaluate(`(() => {
  const de = document.documentElement;
  return { viewport: de.clientWidth, scrollWidth: de.scrollWidth, cards: document.querySelectorAll('.v3-stack-card').length, nav: document.querySelectorAll('.v3-nav-links a').length };
})()`);
expect('390px 视口无横向溢出', mobile.scrollWidth <= mobile.viewport + 1, `${mobile.scrollWidth} vs ${mobile.viewport}`);
expect('移动端仍渲染 9 张作品卡', mobile.cards === 9, String(mobile.cards));
await shot('mobile-hero');

/* ---------- 不对访客露出的工程回退 ---------- */
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await goto(`${BASE}${BASE.includes('?') ? '&' : '?'}skin=legacy&cb=${Date.now()}`);
await wait(1500);
const legacy = await evaluate(`({ shell: !!document.querySelector('.site-shell'), badge: !!document.querySelector('.v3-legacy-badge'), v3: !!document.querySelector('.v3') })`);
expect('隐藏的工程回退仍可用（界面不露出入口）', legacy.shell && legacy.badge && !legacy.v3 && dom.legacyVisible === 0, JSON.stringify(legacy));

expect('浏览器控制台没有报错', errors.length === 0, errors.slice(0, 3).join(' | '));

const failed = checks.filter((c) => !c.ok);
console.log(`\n结果: ${checks.length - failed.length}/${checks.length} 通过`);
if (failed.length) console.log('失败项:', failed.map((f) => f.label).join('、'));
ws.close();
process.exit(failed.length ? 1 : 0);
