/* 一次性渲染冒烟脚本：用 react-dom/server 直接渲染关键页面，
   确认组件不崩、关键文案出现在输出里。
   本机没有浏览器/Playwright，这是当前能拿到的最强验证手段。

   用法：node scripts/smoke-render.mjs */

import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/* SSR 下没有浏览器 API，先打最小桩。
   注意：必须在动态加载业务模块之前完成打桩。 */
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
globalThis.matchMedia = () => ({
  matches: false,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
});
globalThis.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);

let currentHash = '#/';
globalThis.location = new Proxy(
  { hash: '#/', pathname: '/', origin: 'http://localhost', href: 'http://localhost/#/' },
  {
    get(target, prop) {
      if (prop === 'hash') return currentHash;
      if (prop === 'href') return `http://localhost/${currentHash}`;
      return target[prop];
    },
    set(target, prop, value) {
      if (prop === 'hash') currentHash = value;
      else target[prop] = value;
      return true;
    },
  },
);
globalThis.window = globalThis;
globalThis.window.location = globalThis.location;
globalThis.window.addEventListener = () => {};
globalThis.window.removeEventListener = () => {};
globalThis.window.scrollTo = () => {};
globalThis.document = {
  documentElement: {
    dataset: {},
    setAttribute() {},
    removeAttribute() {},
    getAttribute: () => null,
    style: {},
  },
  body: { setAttribute() {}, removeAttribute() {}, style: {}, appendChild() {} },
  addEventListener() {},
  removeEventListener() {},
  getElementById: () => null,
  createElement: () => ({
    style: {},
    select() {},
    remove() {},
    appendChild() {},
    setAttribute() {},
  }),
  querySelectorAll: () => [],
  querySelector: () => null,
};

const checks = [];
const expect = (name, cond) => checks.push([name, !!cond]);

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'silent',
  optimizeDeps: { noDiscovery: true, include: [] },
});

try {
  const main = await server.ssrLoadModule('/src/main.jsx');
  const data = await server.ssrLoadModule('/src/data.js');
  const { profile } = data;
  const App = main.App ?? main.default;
  if (!App) throw new Error('App 未导出，无法渲染');

  const render = (hash) => {
    currentHash = hash;
    return renderToStaticMarkup(React.createElement(App));
  };

  /* styles.css 全文：后面多条断言要读它（面板 pointer-events、
     精选卡片的 overflow 归属、图片 height:auto 兜底等）。
     提前到渲染之前读，后面的断言才拿得到。 */
  const cssRaw = readFileSync(fileURLToPath(new URL('../src/styles.css', import.meta.url)), 'utf8');

  /* 取一条 CSS 规则的内容，并剔除注释。
     ⚠️ 必须去注释：这个文件里不少规则都写了长注释解释「为什么这样写」，
     注释里经常直接出现属性名（比如 overflow:hidden）。
     正则不剔除注释就会把注释当成声明 —— 我已经被这个骗过一次：
     「精选卡片不裁切」那条断言一直 FAIL，其实规则里根本没那个属性，
     是注释里的字样被匹配上了。 */
  const rule = (pattern) => {
    const body = (cssRaw.match(pattern) || [])[1] || '';
    return body.replace(/\/\*[\s\S]*?\*\//g, '');
  };

  const home = render('#/');
  // 文案从数据源取值断言，不要写死字符串——否则每次润色文案都会误报
  expect('首页含欢迎语', home.includes(profile.welcome));
  expect('首页含 tagline', home.includes(profile.tagline));
  expect('首页 h1 不再是姓名', !home.includes('<h1>卢柯宇</h1>'));
  expect('首页含 heroIntro', home.includes(profile.heroIntro));

  // 首屏数据条：内容来自 heroFacts，且只讲项目，不放成绩与学校
  const { heroFacts } = data;
  expect(
    '首屏数据条渲染出全部条目',
    heroFacts.every((f) => home.includes(f.value) && home.includes(f.label)),
  );
  const heroFactsHtml = (() => {
    const at = home.indexOf('hero-facts');
    return at > -1 ? home.slice(at, home.indexOf('</section>', at)) : '';
  })();
  expect('首屏数据条取到了', heroFactsHtml.length > 0);
  expect(
    '首屏数据条不含成绩与学校',
    !/GPA|排名|吉林大学|奖学金/.test(heroFactsHtml),
  );
  // 反向锚定：这些信息仍要出现在该出现的地方（关于页 / 简历页）
  expect('关于区仍含教育信息', home.includes(profile.education));

  // 区块顺序：关于（个人名片 + 时间线）应在能力与荣誉之前
  const iAbout = home.indexOf('id="about"');
  const iSkills = home.indexOf('id="skills"');
  expect('关于区在能力区之前', iAbout > -1 && iSkills > -1 && iAbout < iSkills);
  expect('关于区含个人名片', home.includes('about-profile'));
  expect('关于区含时间线', home.includes('about-timeline'));
  expect('能力区含成绩与荣誉', home.includes('achievement-panel'));

  /* 关于区两列曾经差304px（名片 474 / 时间线 778），底边不齐看着像没对齐。
     修法是让 grid 默认的 stretch 生效 + 卡片内flex 把「联系」组顶到底部。
     这里钉的是「不能设 align-items: start」—— 设了左卡就缩回内容高度，
     台阶立刻回来。 */
  const aboutGrid = rule(/\.about-grid\s*\{([^}]*)\}/);
  expect('关于区两列底部对齐（不能设 align-items: start）',
    !/align-items\s*:\s*start/.test(aboutGrid));
  expect('个人名片是 flex 列（才能把联系组顶到底部）',
    /flex-direction\s*:\s*column/.test(rule(/\.about-profile\s*\{([^}]*)\}/)));
  expect('联系组由剩余空间顶下去',
    /margin-top\s*:\s*auto/.test(rule(/\.about-actions\s*\{([^}]*)\}/)));

  /* 名片上原本没有邮箱和电话 —— 数据里一直有，但只有页脚在用，
     找联系方式的人得先滚到页面最底下。这两条钉住它们回到名片上，
     且必须是能点的（mailto / tel），不是纯文本。

     ⚠️ 必须限定在名片范围内找：联系区和页脚都有邮箱，
     搜整页 HTML 的话把名片上的删掉照样 PASS（我第一版就踩了，
     页脚那句「复制邮箱地址」旁边就是 mailto 链接）。 */
  const cardAt = home.indexOf('class="about-profile"');
  const cardEnd = home.indexOf('</div>', home.indexOf('about-actions'));
  const card = cardAt > -1 && cardEnd > cardAt ? home.slice(cardAt, cardEnd) : '';
  expect('名片上列出邮箱', card.includes(profile.email));
  expect('名片上列出电话', card.includes(profile.phone));
  expect('名片邮箱可点（mailto）', card.includes(`href="mailto:${profile.email}"`));
  expect('名片电话可点（tel）', card.includes(`href="tel:${profile.phone}"`));

  /* 名片里新加的两行是链接，用了 --ink-soft 而不是继承 li 的 --muted。
     真实对比度（14px 正文阈值 4.5:1）：
       深色 --muted 3.21 不足 / --ink-soft 11.66 够
       浅色 --muted 5.40 够 / --ink-soft 更高
     钉住「不退回 --muted」，两套主题下都不够线的那个。
     精确值用 scripts/about-link-contrast.mjs 量（需真浏览器）。 */
  expect('名片链接用 --ink-soft（--muted 在深色下只有 3.21:1）',
    /color\s*:\s*var\(--ink-soft\)/.test(rule(/\.about-facts a\s*\{([^}]*)\}/)));

  /* GitHub 按钮：--accent 两套主题都差一点（深色 4.23 / 浅色 4.09），
     单独覆盖成 --accent-hover（7.28 / 5.44）。
     选择器两条内容相同，钉住它们都在。 */
  const ghRule = cssRaw.match(
    /:root\[data-theme='dark'\]\s*\.about-github,\s*:root\[data-theme='light'\]\s*\.about-github\s*\{([^}]*)\}/
  ) || [];
  expect('GitHub 按钮两套主题都用 --accent-hover（--accent 都不够 4.5:1）',
    /color\s*:\s*var\(--accent-hover\)/.test(ghRule[1] || ''));

  // 导航顺序应与区块顺序一致
  const navAbout = home.indexOf('关于');
  const navSkills = home.indexOf('>能力<');
  expect('导航中关于排在能力之前', navAbout > -1 && navSkills > -1 && navAbout < navSkills);

  /* 首页精选截图网格：第 1 张占满一行，其余两两成对。
     所以「其余」必须是偶数，否则右下角会空一格。
     这条断言就是钉住这个对称性。 */
  const countOf = (html, cls) => (html.match(new RegExp(cls, 'g')) || []).length;
  const wideCount = countOf(home, 'stage-item--wide');
  const normalCount = countOf(home, 'stage-item--normal');
  expect('精选网格渲染出图片', wideCount + normalCount > 0);
  expect('精选网格只有一张占满整行', wideCount === 1);
  expect('精选网格其余张数为偶数（铺满不留空）', normalCount > 0 && normalCount % 2 === 0);
  expect('精选网格含 AI 助手整屏截图', home.includes('ai-assistant-overview.webp'));

  /* 图注不能被裁。
     原来 .stage-item 带 overflow:hidden（为了裁住 data-reveal="img"
     从 1.08 回缩到 1 的图片），<figcaption> 是它的子元素，
     于是图注超出卡片宽度的部分被一起切掉 —— 句子在两侧截断、
     中间像少了字（「顶部实名状态胶囊」显示成「四格数」）。
     裁切现在只包住图片，文字在容器外面。 */
  expect('精选网格图片有独立裁切容器', /class="stage-shot"/.test(home));
  /* 断言要只认「属性声明」，不能被注释里的字样带偏 ——
     这条规则的注释里就写着 overflow:hidden（解释为什么不能加），
     正则不剔除注释就会把注释当成声明，误判成「还在裁切」。 */
  expect('精选卡片本身不裁切（否则图注文字被切）',
    !/overflow\s*:\s*hidden/.test(rule(/\n\s*\.stage-item\s*\{([^}]*)\}/)));
  expect('裁切落在图片容器上',
    /overflow\s*:\s*hidden/.test(rule(/\.stage-shot\s*\{([^}]*)\}/)));

  const resumeHtml = render('#/resume');
  /* 导航是全站共享的，下拉里也列着所有项目名。
     所以「简历正文里没有某个项目」这类断言必须把 <main> 摘出来看，
     否则会被导航里的同名文字污染（踩过一次）。 */
  const bodyOf = (html) => {
    const start = html.indexOf('<main');
    const end = html.lastIndexOf('</main>');
    return start > -1 && end > start ? html.slice(start, end) : html;
  };
  const resumeBody = bodyOf(resumeHtml);

  expect('简历页含标题', resumeHtml.includes('我的简历'));
  expect('简历页含下载按钮', resumeHtml.includes('下载 PDF 简历'));
  expect('简历页含教育经历', resumeHtml.includes('教育经历'));
  expect('简历页含专业技能', resumeHtml.includes('专业技能'));
  expect('简历页含项目经历', resumeHtml.includes('项目经历'));
  expect('简历页含证书与校园', resumeHtml.includes('证书与校园'));
  expect('简历页含预览图', resumeHtml.includes('resume.webp'));
  expect('简历页含 PDF 链接', resumeHtml.includes('lukeyu-resume.pdf'));
  expect(
    '简历页含 4 个项目',
    ['校园圈子', 'Gomoku', '菜鸟驿站', '个人作品集'].every((k) => resumeBody.includes(k)),
  );
  expect('简历正文不含 Wiki 插件', !resumeBody.includes('iGEM'));
  expect('简历页含学校', resumeHtml.includes('吉林大学'));
  // 成绩从首屏拿掉后，简历页仍要保留——否则就是把信息弄丢了
  expect('简历页仍含 GPA 与排名', /GPA|排名/.test(resumeBody));
  expect('简历页含技能分组', resumeHtml.includes('LangGraph'));

  const campusHtml = render('#/campus');
  expect('校园圈子页仍正常', campusHtml.includes('校园圈子'));

  const gomoku = render('#/gomoku');
  expect('项目详情页仍正常', gomoku.includes('Gomoku'));

  /* 每个项目都必须能通过 slug 打开自己的详情页。
     之前只钉了 gomoku 一个，Projects 页靠 projects.find 取数据，
     少写 slug 或写错就是空白页 —— 静态断言看不出来，只有逐个渲染能发现。 */
  const { projects, IMAGE_SIZES } = data;
  for (const p of projects) {
    const page = render(`#/${p.slug}`);
    const body = bodyOf(page);
    expect(`项目详情页可打开：${p.title}`, body.includes(p.title));
  }

  /* 封面必须在 IMAGE_SIZES 里登记尺寸。
     <img> 上的 width/height 属性会被当成呈现提示，尺寸写错或漏登记，
     图片就会被垂直拉伸（2026-09-30 全站中招过一次）。 */
  const missingSize = projects
    .map((p) => p.image)
    .filter((src) => src && !Object.keys(IMAGE_SIZES).some((k) => src.endsWith(k)));
  expect('所有项目封面都在 IMAGE_SIZES 中登记', missingSize.length === 0);

  /* 导航下拉「按方向」那一列：每个方向都得有能打开的落点。
     ⚠️ 原来是「链接指向 #/#work 就查 label 有没有对应项目」——
        那样七个写死的占位链接全都能通过（label 都在），
        正好放过了用户报的那个 bug：点了只跳到全部作品概览。
        现在改成逐条打开验证：
        单项目方向必须直接落到该项目详情页，
        多项目方向必须落到 #/category/<slug> 且该页列全了这个方向的项目。 */
  const catCol = (data.navItems || [])
    .flatMap((item) => item.columns || [])
    .find((col) => col.title === '按方向');
  const catLinks = catCol?.links || [];
  expect('导航有「按方向」分组', catLinks.length > 0);

  const placeholders = catLinks.filter((l) => l.href === '#/#work' || l.href === '#/');
  expect('「按方向」里没有占位链接（不能都指向作品概览）', placeholders.length === 0);

  for (const c of data.categories || []) {
    if (c.projects.length === 0) {
      expect(`方向「${c.name}」至少有一个项目`, false);
      continue;
    }
    if (c.projects.length === 1) {
      /* 单项目：导航直接指到它的详情页，少一次点击 */
      const only = c.projects[0];
      const link = catLinks.find((l) => l.label === c.name);
      expect(`方向「${c.name}」链接指向唯一的项目详情`, link?.href === `#/${only.slug}`);
      const page = render(`#/${only.slug}`);
      expect(`方向「${c.name}」的目标页能打开`, page.includes(only.title));
    } else {
      /* 多项目：单独建聚合页，页面上要列全 */
      const link = catLinks.find((l) => l.label === c.name);
      expect(`方向「${c.name}」链接指向聚合页`, link?.href === `#/category/${c.slug}`);
      const page = render(`#/category/${c.slug}`);
      expect(`聚合页「${c.name}」标题正确`, page.includes(c.name));
      const missingOnPage = c.projects.filter((p) => !page.includes(p.title)).map((p) => p.title);
      expect(`聚合页「${c.name}」列全了所有项目`, missingOnPage.length === 0);
      if (missingOnPage.length) console.log('    页面上没有的:', missingOnPage.join(', '));
    }
  }

  /* 每个项目的 category 都得在方向索引里有对应条目 ——
     新增项目忘了在 CATEGORY_META 里登记，导航里就少一项。 */
  const indexedCats = new Set((data.categories || []).map((c) => c.name));
  const unindexed = projects.map((p) => p.category).filter((name) => !indexedCats.has(name));
  expect('所有项目的分类都在方向索引里', unindexed.length === 0);
  if (unindexed.length) console.log('    没登记的分类:', [...new Set(unindexed)].join(', '));

  /* 方向 slug 不能和项目 slug 撞 —— 撞了路由分不清 */
  const projectSlugs = new Set(projects.map((p) => p.slug));
  const collide = (data.categories || []).filter((c) => projectSlugs.has(c.slug)).map((c) => c.slug);
  expect('方向 slug 不与项目 slug 冲突', collide.length === 0);

  /* 聚合页的间距要单独收。
     .page-hero-inner 的 padding-bottom: 84px 是给 .page-hero-shot
     往上 translateY(34px) 预留的，聚合页没有截图就是一段空档；
     .work 的 120px 上下留白用在独立区块之间，放在「标题 → 卡片」中间
     同样会空出小半屏。两条钉住这个收敛。 */
  expect('聚合页 hero 没有截图，底部留白收窄',
    /padding-bottom\s*:\s*5\dpx/.test(rule(/\.page-hero--plain\s+\.page-hero-inner\s*\{([^}]*)\}/)));
  expect('聚合页的作品区不是独立区块，上下留白收窄',
    /padding\s*:\s*7\dpx\s+0\s+0/.test(rule(/\.category-work\s*\{([^}]*)\}/)));

  /* 首屏的「收录作品」「线上运行中」必须与 projects 实际条数对得上。
     这两个数字是纯手写的，加工项目时最容易忘改 —— 页面自己写着
     「6 个」而下面列着 8 张卡片，读起来就是自相矛盾。
     校园圈子独立成页（不在 projects 数组里），要单独算进去。 */
  const factOf = (label) => Number((heroFacts.find((f) => f.label === label)?.value || '').replace(/\D/g, ''));
  expect('首屏「收录作品」与项目实际条数一致',
    factOf('收录作品') === projects.length + (data.campus ? 1 : 0));
  expect('首屏「线上运行中」与有 site 的项目数一致',
    factOf('线上运行中') === projects.filter((p) => p.site).length + (data.campus?.site ? 1 : 0));

  /* 时间线按项目体量排，不按时间，所以它不是 projects 的子集 ——
     竞赛插件、课程作业这类体量小的仍然收录在作品列表里，只是不占时间线；
     「进入吉林大学」这种里程碑也不是项目。

     标题必须与作品列表逐字一致。两边写法不同时（时间线写简称、
     作品列表写全称），读者会以为是两个东西 —— 这条断言就是防这个。
     所以匹配不上的条目只允许是里程碑，不能有真项目对不上。 */
  const { timeline, campus } = data;
  const titles = new Set([...projects.map((p) => p.title), campus?.name].filter(Boolean));
  const MILESTONES = ['进入吉林大学'];
  const missing = timeline
    .filter((t) => !titles.has(t.title))
    .map((t) => t.title)
    .filter((t) => !MILESTONES.includes(t));
  expect('时间线的项目标题与作品列表逐字一致', missing.length === 0);
  if (missing.length) console.log('    对不上的标题:', missing.join(', '));
  expect('时间线含体量最大的两个 Agent 项目',
    titles.has('OpsPilot · AI 事故响应系统')
    && timeline.some((t) => t.title.includes('OpsPilot'))
    && timeline.some((t) => t.title.includes('研究工作台')));
  expect('时间线首位是最新的 Agent 项目（按体量而非时间排序）',
    timeline[0]?.title.includes('OpsPilot'));
  expect('时间线条目文字非空', timeline.every((t) => t.text && t.text.length > 10));

  // 回到顶部按钮：所有页面都应渲染，且初始为隐藏态
  const hasBackToTop = (html) =>
    html.includes('class="back-to-top"') &&
    html.includes('data-visible="false"') &&
    html.includes('回到页面顶端');
  expect('首页有回到顶部按钮', hasBackToTop(home));
  expect('简历页有回到顶部按钮', hasBackToTop(resumeHtml));
  expect('校园圈子页有回到顶部按钮', hasBackToTop(campusHtml));
  expect('项目详情页有回到顶部按钮', hasBackToTop(gomoku));
  expect('回到顶部初始不可聚焦', home.includes('tabindex="-1"'));

  /* 防回归：PNG 源图只能放 media-src/，一旦出现在 public/ 就会被 Vite 原样拷进
     产物。2026-09-22 清掉过 22 张共 12.67MB 的死重 PNG（运行时引用的全是 .webp），
     产物从 14.59MB 降到 1.92MB。别让它们再回来。 */
  const publicDir = fileURLToPath(new URL('../public', import.meta.url));
  const pngInPublic = [];
  const walkPublic = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walkPublic(p);
      else if (p.endsWith('.png')) pngInPublic.push(p.slice(publicDir.length + 1));
    }
  };
  walkPublic(publicDir);
  expect('public 下没有 PNG 死重源图', pngInPublic.length === 0);

  /* 防回归：<img> 上的 width/height 属性会被浏览器当作固定像素尺寸（呈现提示），
     优先级低于 CSS 但高于 auto。2026-09-30 给全站 <img> 补尺寸属性后，
     凡是只写了 width:100% 没写 height 的规则，高度都被属性里的定值顶住，
     图片被垂直拉伸。修法是全局 img 规则里声明 height:auto 兜底。
     下面两条钉住这个兜底和它要保护的那些规则。 */
  const bareImgRule = cssRaw.match(/(?:^|\n)\s*img\s*\{([^}]*)\}/);
  expect('全局 img 规则存在', !!bareImgRule);
  const hasGlobalHeightAuto = !!bareImgRule && /(^|[;\s])height\s*:\s*auto/.test(bareImgRule[1]);
  expect('全局 img 规则声明 height: auto（防图片被拉伸）', hasGlobalHeightAuto);
  const heightlessWidthRules = [...cssRaw.matchAll(/([^\n{}]*\bimg\b[^\n{}]*)\{([^}]*)\}/g)]
    .map(([, sel, body]) => ({ sel: sel.trim(), body }))
    .filter(
      (r) =>
        r.sel !== 'img' &&
        /width\s*:\s*100%/.test(r.body) &&
        !/(^|[;\s])height\s*:/.test(r.body),
    );
  expect(
    '只写 width:100% 的图片规则都有全局 height:auto 兜底',
    heightlessWidthRules.every(() => hasGlobalHeightAuto),
  );
  if (heightlessWidthRules.length && !hasGlobalHeightAuto) {
    console.log(`    受影响规则: ${heightlessWidthRules.map((r) => r.sel).join(' / ')}`);
  }

  // 尺寸属性本身要留着——它是防 CLS 的手段，别连带一起删掉
  expect(
    '图片尺寸属性仍在（防 CLS 不回退）',
    campusHtml.includes('width="1960" height="989"'),
  );

  /* 防回归：首屏 h1 里是 SplitText 拆出的一组 span，而 .split-inner 带 transform。
     transform 会让子元素建立独立层叠上下文，父级 h1 上的 background-clip:text
     就裁剪不到它们，文字因为继承到 -webkit-text-fill-color: transparent 而全部隐形
     （2026-10-02 线上实际发生过，表现为标题只剩首字可见）。
     真想给这个标题上渐变，渐变要施加到 .split-inner 自己身上，不能靠父级透明填充。 */
  const heroH1Rule = cssRaw.match(/(?:^|\n)\s*\.hero\s+h1\s*\{([^}]*)\}/);
  expect('首屏 h1 规则存在', !!heroH1Rule);
  expect(
    '逐字动画标题不用透明填充色做渐变（否则文字隐形）',
    !!heroH1Rule && !/-webkit-text-fill-color|background-clip/.test(heroH1Rule[1]),
  );
  if (heroH1Rule && /-webkit-text-fill-color|background-clip/.test(heroH1Rule[1])) {
    console.log('    .hero h1 里含: ' + heroH1Rule[1].trim());
  }

  /* 防回归：og:description 和 data.js 的 tagline 是两处独立维护的同一句文案。
     2026-09-23 发现转发到微信/QQ 时显示的还是被替换掉的那句旧文案。 */
  const htmlRaw = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
  const ogDesc = (htmlRaw.match(/og:description"\s+content="([^"]*)"/) || [])[1] || '';
  expect('分享描述与 tagline 同步', ogDesc === profile.tagline);
  if (ogDesc !== profile.tagline) {
    console.log(`    og:description 是「${ogDesc}」，tagline 是「${profile.tagline}」`);
  }

  /* 防回归：导航下拉面板。
     面板挂在 .global-nav 上（sticky 元素 = 整页宽的定位参照），
     挂在触发项里时参照物只有几十像素宽，面板永远缩在中间。
     面板底色必须是不透明的：半透明色叠在毛玻璃导航栏上，
     首屏那行 66px 大标题会透出来跟面板条目叠成鬼影。
     open/leave 判定挂在 header 上，整条移动路径是一个连续命中区。 */
  const navRaw = readFileSync(fileURLToPath(new URL('../src/main.jsx', import.meta.url)), 'utf8');
  const navBody = navRaw.slice(navRaw.indexOf('function Navigation'));
  /* 面板渲染在 </nav> 之后、</header> 之前 ⇒ 它是 header 的直接子元素，
     不是 .nav-menu / .nav-group 的后代。
     这比「正则找一段 className 顺序」稳：一旦面板被挪回触发项内部
     （面板变成 nav-menu 的后代，定位参照物从整页宽缩回几十像素宽，
left:0;right:0 就只能铺满那点宽度），断言立刻断。 */
  const panelAt = navBody.indexOf('<NavPanel');
  const navClose = navBody.indexOf('</nav>');
  const headerEnd = navBody.indexOf('</header>');
  expect(
    '下拉面板挂在 .global-nav 内（不是触发项内部）',
    panelAt > navClose && panelAt < headerEnd && panelAt > -1,
  );
  if (!(panelAt > navClose && panelAt < headerEnd)) {
    console.log(
      `    面板调用在 ${panelAt}，</nav> 在 ${navClose}，</header> 在 ${headerEnd}（面板须落在两者之间）`,
    );
  }
  // 面板自己不再管开合，否则和 header 上的判定抢同一个状态。
  // 要看的是 NavPanel 组件定义里那个真实渲染出来的 div —— 调用处传的是
  // props，在那里查 onMouseEnter 只会查到 <NavPanel .../> 这个自闭合标签。
  const panelDef = navRaw.slice(navRaw.indexOf('function NavPanel'));
  const panelDiv = (panelDef.match(/<div className="nav-panel"[\s\S]*?>/) || [])[0] || '';
  expect(
    '面板不重复绑定开合判定',
    !!panelDiv && !/onMouseEnter|onMouseLeave|onPointerEnter|onPointerLeave/.test(panelDiv),
  );
  if (/onMouseEnter|onMouseLeave/.test(panelDiv)) {
    console.log('    面板不该自己管开合，命中判定要统一交给 header');
  }
  const navGroupRule = rule(/\.nav-group\s*\{([^}]*)\}/);
  expect('面板参照物是导航栏而非触发项', !!navGroupRule && !/position\s*:/.test(navGroupRule));
  const panelBg = rule(/\.nav-panel\s*\{([^}]*)\}/);
  expect(
    '面板底色用不透明的 --panel-bg（半透明会让底下大标题透出来）',
    /background\s*:\s*var\(--panel-bg\)/.test(panelBg),
  );
  const panelColHover = rule(/\.nav-panel-col:hover\s*\{([^}]*)\}/);
  expect(
    '列悬停高亮用不透明层色',
    /var\(--panel-col-hover\)/.test(panelColHover),
  );
  const openHeader = navBody.slice(0, navBody.indexOf('<div className="nav-inner">'));
  expect(
    '导航栏开合判定挂在 header 上（保证移动路径不出现命中空隙）',
    /className="global-nav"[\s\S]*?onMouseEnter=\{keep\}[\s\S]*?onMouseLeave=\{closeLater\}/.test(
      openHeader,
    ),
  );

// 列与列之间必须有可见分隔，用户要一眼看出分组的边界。
// 注意只能匹配到列本体那条规则：:first-child 里也有 border-left（值是 0），
// 宽松匹配会被它顶掉，于是「把分隔线删了」这种改动照样能过。
const colRule = rule(/\n\s*\.nav-panel-col\s*\{([^}]*)\}/);
expect(
  '面板列之间有分隔线',
  /border-left\s*:\s*1px\s+solid/.test(colRule),
);
if (!/border-left\s*:\s*1px\s+solid/.test(colRule)) {
  console.log('    .nav-panel-col 里没有 1px 竖线，各列会糊成一片');
}
// 竖线要用比页面分隔线更重的 --panel-divider：面板是实色底，
// 页面上的 --line 打上去几乎看不见，分列就白说了。
expect(
  '面板竖线用加重的 --panel-divider（实色底上 --line 太淡）',
  /border-left\s*:\s*1px\s+solid\s+var\(--panel-divider\)/.test(colRule),
);
  // 列数由数据传给 CSS 变量，否则 3 列只占左边一小块、右边空一大片
  expect(
    '面板列数由数据传入并等比铺满',
    /--cols/.test(navRaw) && /grid-template-columns:\s*repeat\(var\(--cols/.test(cssRaw),
  );

  /* 防回归：面板不能挡住其他导航项。
     面板是 .global-nav 的子元素、top:100% 铺满整页宽，
     加上 ::before 往上顶了 28px 的透明桥梁，正好盖住整条导航栏。
     面板一展开，「全部作品 / 关于 / 能力」就被压在下面，
     鼠标移过去命中的是面板而不是导航项 ——
     表现就是「放到第二个选项就不弹了，而且永远停在第一个」。
     修复是面板本体 pointer-events: none、只让 .nav-panel-inner 恢复 auto。
     命中判定本来就挂在 <header> 上，不依赖导航项自己收到事件。 */
  const panelRule2 = rule(/\.nav-panel\s*\{([^}]*)\}/);
  const panelInnerRule = rule(/\.nav-panel-inner\s*\{([^}]*)\}/);
  expect('面板本体不参与命中（否则会盖住其他导航项）',
    /pointer-events\s*:\s*none/.test(panelRule2));
  expect('面板内容区恢复命中（否则链接点不动）',
    /pointer-events\s*:\s*auto/.test(panelInnerRule));

  /* 开合判定必须在 header 上：面板不接收指针事件后，
     唯一能让 mouseenter 生效的就是 header 自己的处理器。 */
  const headerBlock = navBody.slice(0, navBody.indexOf('<div className="nav-inner">'));
  expect('开合判定挂在 header 上（面板不收指针事件时唯一入口）',
    /className="global-nav"[\s\S]*?onMouseEnter=\{keep\}/.test(headerBlock));

  /* 防回归：详情页 hero 的纵向间距。

     .page-hero-shot 带 translateY(34px) 把截图往上提，
     这段位移会直接吃掉父容器 padding-bottom —— 原来 48 - 34 = 14px，
     按钮和截图几乎贴在一起（实测 13px）。
     底部留白必须大于位移量 + 视觉上想要的间距，这条断言钉住这个关系，
     改 padding 或改 transform 任一边都会被抓到。 */
  const heroInner = rule(/\.page-hero-inner\s*\{([^}]*)\}/);
  const shotRule = rule(/\.page-hero-shot\s*\{([^}]*)\}/);
  const padBottom = Number((heroInner.match(/padding:\s*[\d.]+px\s+0\s+(\d+)px/) || [])[1] || 0);
  const shiftY = Number((shotRule.match(/translateY\((-?[\d.]+)px\)/) || [])[1] || 0);
  console.log(`    hero padding-bottom=${padBottom}px, shot translateY=${shiftY}px, 实际余量 ${padBottom - shiftY}px`);
  expect('hero 底部留白盖得住截图上移（按钮不会贴住图片）', padBottom - shiftY >= 36);

  /* .back-link 曾是 inline-flex：行内元素的垂直 margin 不生效，
     「返回首页」和下面的 eyebrow 挤在同一行、箭头几乎贴住文字。
     必须是块级 flex 才能独占一行且 margin 恢复作用。 */
  const backRule = rule(/\.back-link\s*\{([^}]*)\}/);
  expect('返回链接是块级（否则与下方 eyebrow 挤在同一行）',
    /display:\s*flex/.test(backRule) && !/display:\s*inline-flex/.test(backRule));
  expect('返回链接用 margin 撑开间距', /margin-bottom:\s*\d/.test(backRule));

  if (!/background\s*:\s*var\(--panel-bg\)/.test(panelBg)) {
    console.log('    .nav-panel 当前底色: ' + (panelBg.match(/background[^;]*/) || ['无'])[0]);
  }
  if (pngInPublic.length) {
    console.log(`    死重 PNG（应移到 media-src/）: ${pngInPublic.join(', ')}`);
  }
} catch (err) {
  checks.push([`渲染抛错: ${err.message}`, false]);
} finally {
  await server.close().catch(() => {});
}

let failed = 0;
for (const [name, ok] of checks) {
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
}
console.log(`\n结果: ${checks.length - failed}/${checks.length} 通过`);
process.exit(failed ? 1 : 0);
