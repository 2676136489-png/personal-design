/* 导航下拉的冒烟脚本。
   本机没有浏览器，所以分三层验证：
   1) SSR 渲染——下拉项真的渲染出来了、结构正确、初始是收起态
   2) 数据结构——每个子项都有可用目标，顺序与首页区块一致
   3) 源码与样式契约——收起延迟、ESC、外链放行、逐条滑入的 --i 变量

   用法：node scripts/smoke-nav.mjs */

import { readFileSync } from 'node:fs';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

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

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const css = read('src/styles.css');
const mainSrc = read('src/main.jsx');
const routerSrc = read('src/router.js');

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'silent',
  optimizeDeps: { noDiscovery: true, include: [] },
});

try {
  const main = await server.ssrLoadModule('/src/main.jsx');
  const data = await server.ssrLoadModule('/src/data.js');
  const router = await server.ssrLoadModule('/src/router.js');
  const { navItems } = data;
  const App = main.App ?? main.default;
  if (!App) throw new Error('App 未导出，无法渲染');

  currentHash = '#/';
  const home = renderToStaticMarkup(React.createElement(App));

  /* ---------- 1. SSR 结构 ---------- */

  const groups = navItems.filter((i) => i.columns?.length);
  expect('存在带面板的导航分组', groups.length >= 3);
  expect('导航渲染出分组容器', home.includes('class="nav-group"'));
  expect('分组触发项标记了可展开', home.includes('aria-expanded="false"'));
  expect('面板已渲染进 DOM', home.includes('class="nav-panel"'));
  expect('面板带整页宽的容器', home.includes('nav-panel-inner'));
  expect('面板按列排布', home.includes('nav-panel-col'));
  expect('每列有小标题', home.includes('nav-panel-title'));
  expect('存在粗体大字的条目层级', home.includes('nav-panel-featured'));
  expect('条目带列内序号变量', home.includes('--i:0') && home.includes('--i:1'));
  expect('条目带列序号变量', home.includes('--c:0') && home.includes('--c:1'));

  // 初始必须是收起态：靠 data-open 控制，而不是靠 JS 增删节点，
  // 否则首屏会出现几帧张开的面板。
  expect('初始为收起态', home.includes('data-open="false"'));
  expect('初始没有展开态的分组', !home.includes('data-open="true"'));
  expect('触发项带下拉箭头', home.includes('nav-caret'));

  // 每一个条目都要落到渲染结果里
  const allEntries = groups.flatMap((g) =>
    g.columns.flatMap((c) => [...(c.featured || []), ...(c.links || [])]),
  );
  expect(
    `全部 ${allEntries.length} 个条目都渲染出来了`,
    allEntries.every((c) => home.includes(c.label)),
  );
  expect('每个分组都至少有一列', groups.every((g) => g.columns.length >= 2));
  expect(
    '每列都有标题',
    groups.every((g) => g.columns.every((c) => typeof c.title === 'string' && c.title)),
  );
  expect(
    '每列至少有一个条目',
    groups.every((g) =>
      g.columns.every((c) => (c.featured?.length || 0) + (c.links?.length || 0) > 0),
    ),
  );

  // 作品的面板应当包含全部项目详情页
  const workGroup = groups.find((g) => g.id === 'work');
  expect('作品分组存在', !!workGroup);
  const workLinks = workGroup.columns.flatMap((c) => [...(c.featured || []), ...(c.links || [])]);
  const projectSlugs = data.projects.map((p) => p.slug);
  expect(
    '作品分组覆盖全部项目详情页',
    projectSlugs.every((slug) => workLinks.some((c) => c.href === `#/${slug}`)),
  );

  /* ---------- 2. 数据结构 ---------- */

  expect('每个条目都有目标和文字', allEntries.every((c) => c.href && c.label));
  expect(
    '条目目标要么是页面要么是首页区块',
    allEntries.every((c) => c.href.startsWith('#/') || c.href.startsWith('https://')),
  );
  expect(
    '外部条目都标了 external',
    allEntries.filter((c) => c.href.startsWith('https://')).every((c) => c.external === true),
  );
  expect(
    '站内条目没有误标 external',
    allEntries.filter((c) => c.href.startsWith('#/')).every((c) => !c.external),
  );

  const aboutGroup = groups.find((g) => g.id === 'about');
  const skillsGroup = groups.find((g) => g.id === 'skills');
  expect(
    '关于的子项排在能力的子项之前',
    navItems.indexOf(aboutGroup) < navItems.indexOf(skillsGroup),
  );

  /* ---------- 3. 跳转分派（纯函数） ---------- */

  /* location 桩必须用访问器属性来记录 hash 写入。
     给 Proxy 套 Proxy 不行——`window.location.prop = v` 在读取阶段
     会先被 window 那个 Proxy 的 get 解析成 Proxy 自身，
     写入落不到内层的 set 陷阱上，记录永远是空的。 */
  const hashWrites = [];
  let hashValue = '#/';
  const locationStub = {
    pathname: '/',
    origin: 'http://localhost',
    get href() {
      return `http://localhost/#/${hashValue}`;
    },
  };
  Object.defineProperty(locationStub, 'hash', {
    get: () => hashValue,
    set: (v) => {
      hashWrites.push(v);
      hashValue = v;
    },
  });
  globalThis.location = locationStub;

  router.goToNavTarget('/gomoku');
  // navigate() 会剥掉前导 # 再写入，所以记录到的是 /gomoku
  expect('去项目页写入了对应 hash', hashWrites.at(-1) === '/gomoku');

  const before = hashWrites.length;
  hashValue = '#/';
  router.goToNavTarget('/#skills');
  expect('去首页区块没有整页跳转', hashWrites.length === before);

  // 从子页面点「首页区块」应当先切回首页并带上锚点
  hashValue = '#/resume';
  router.goToNavTarget('/#skills');
  expect('子页面点首页区块会切回首页', hashWrites.at(-1) === '/#skills');

  hashWrites.length = 0;
  hashValue = '#/';
  router.goToNavTarget('/#skills');
  expect('已在首页时不再重复写 hash', hashWrites.length === 0);

  // 上面这一句只证明「没跳页」，但也不能因为路径判断写错就永远不跳。
  // 反向锚定：从子页面出发时必须真的切回首页并带上锚点。
  hashWrites.length = 0;
  hashValue = '#/resume';
  router.goToNavTarget('/#skills');
  expect('子页面出发时才写 hash', hashWrites.length === 1 && hashWrites[0] === '/#skills');

  hashWrites.length = 0;
  hashValue = '#/resume';
  router.goToNavTarget('/');
  expect('回首页写入了根路径', hashWrites.at(-1) === '/');

  // 外链不能被拦下来（拦了就不会开新标签页）
  expect(
    '外链交给浏览器原生行为',
    /if \(target\.external \|\| \/\^https\?:\/i\.test\(target\.href\)\) return;/.test(mainSrc),
  );
  expect('外链子项渲染为 _blank', home.includes('target="_blank"'));

  /* ---------- 4. 源码与样式契约 ---------- */

  /* 这些断言锚定的是「期望行为」，不是当时的写法。
     面板从触发项内部挪到 .global-nav 之后，开合状态由 useNavDropdown 统一管，
     每组组件各自的 openNow/keepTimerRef 都不存在了。 */

  // 悬停打开：触发项进入即展开对应分组
  expect(
    '分组悬停即展开',
    /<div key=\{id\} className="nav-group"[^>]*onMouseEnter=\{\(\) => open\(id\)\}/.test(mainSrc),
  );
  // 收起走延迟而不是立即
  expect('收起走延迟而不是立即', /dropdownCloseDelay/.test(mainSrc));
  expect(
    '延迟期间指针折返会作废关闭',
    /armedRef\.current = true;/.test(mainSrc) &&
      /if \(armedRef\.current\) setOpenId\(null\)/.test(mainSrc) &&
      /const keep = \(\) => \{[\s\S]{0,80}?armedRef\.current = false/.test(mainSrc),
  );
  expect('焦点进入即取消收起（键盘可用）', /onFocus=\{keep\}/.test(mainSrc));
  expect(
    '焦点离开整个导航区才收起',
    /currentTarget\.contains\(event\.relatedTarget\)/.test(mainSrc),
  );
  expect('ESC 可关闭且不冒泡到全局', /event\.stopPropagation\(\);[\s\S]{0,40}?closeNow\(\);/.test(mainSrc));
  expect('卸载时清掉定时器', /window\.clearTimeout\(timerRef\.current\)/.test(mainSrc));
  // 开合判定必须落在 header 上：面板是 header 的子元素，整条移动路径
  // 才是一个连续命中区。挂在导航项或面板各自身上都会在两者之间留下缝隙。
  expect(
    '开合判定挂在 header 上（路径连续，不出现命中空隙）',
    /className="global-nav"[\s\S]*?onMouseEnter=\{keep\}[\s\S]*?onMouseLeave=\{closeLater\}/.test(mainSrc),
  );
  expect(
    '面板自身不再重复绑定开合',
    !/<div className="nav-panel"[^>]*onMouse/.test(mainSrc),
  );
  expect('面板在 nav-menu 之外渲染（是 header 的直接子元素）', (() => {
    const navBody = mainSrc.slice(mainSrc.indexOf('function Navigation'));
    const panelAt = navBody.indexOf('<NavPanel');
    return panelAt > navBody.indexOf('</nav>') && panelAt < navBody.indexOf('</header>');
  })());
  expect('导航栏绑定展开态', /data-section=\{openId !== null\}/.test(mainSrc));
  expect(
    '切页时收起面板',
    /useEffect\(\(\) => \{[\s\S]{0,120}?setOpenId\(null\);[\s\S]{0,20}?\}, \[path\]\)/.test(mainSrc),
  );
  // 移到没有下拉的那几项上时要收起，否则面板会挂在另一个分组下不消失
  expect('移到无下拉的导航项上会收起面板', /onMouseEnter=\{\(\) => closeNow\(\)\}/.test(mainSrc));

  // 样式契约
  expect('面板默认不可见', /\.nav-panel \{[\s\S]*?visibility: hidden/.test(css));
  expect('面板靠自身 data-open 才显形', /\.nav-panel\[data-open="true"\] \{/.test(css));
  expect('面板的展开选择器不再依赖 .nav-group', !/\.nav-group\[data-open="true"\][^{]*\.nav-panel/.test(css));
  // 面板必须有指针桥梁：它贴在导航栏下沿，而触发项在导航栏内部，
  // 指针斜着往下走会在两者之间断开命中
  expect(
    '面板有指针桥梁接上导航栏',
    /\.nav-panel::before \{[\s\S]*?top: -28px/.test(css),
  );
  expect('面板不加阴影', !/\.nav-panel \{[\s\S]{0,400}?box-shadow/.test(css));
  expect('面板不加圆角', !/\.nav-panel \{[\s\S]{0,400}?border-radius/.test(css));
  // 面板与导航栏展开态必须是同一个不透明色：半透明色叠在毛玻璃上，
  // 首屏那行 66px 大标题会透出来跟面板条目叠成鬼影
  expect('面板用不透明底色', /\.nav-panel \{[\s\S]*?background: var\(--panel-bg\)/.test(css));
  expect(
    '导航栏在面板展开时换同一底色',
    /\.global-nav\[data-section="true"\] \{[\s\S]*?background: var\(--panel-bg\)/.test(css),
  );
  // .nav-group 绝不能设 position —— 一旦设了，面板的定位参照物就从
  // 整页宽的 .global-nav 变成这个几十像素宽的项，left:0;right:0 只剩几十像素
  const navGroupRule = (css.match(/\.nav-group \{([\s\S]*?)\}/) || [])[1] || '';
  expect('分组不设 position（否则面板定位参照物变窄）', !/position\s*:/.test(navGroupRule));
  expect(
    '条目默认下沉并透明',
    /\.nav-panel-col li \{[\s\S]*?transform: translate3d\(0, -8px, 0\)/.test(css),
  );
  expect(
    '条目按列号与行号依次滑入',
    /transition-delay: calc\(var\(--c, 0\) \* \d+ms \+ var\(--i, 0\) \* \d+ms/.test(css),
  );
  expect('面板按列排布', /\.nav-panel-inner \{[\s\S]*?grid-template-columns/.test(css));
  // 列要等比铺满整行。之前用 minmax(210px,1fr) 时 3 列只占约 700px，
  // 面板右边空一大片——苹果的列是铺开的。
  expect(
    '列按数量等比铺满',
    /grid-template-columns: repeat\(var\(--cols, \d+\), minmax\(0, 1fr\)\)/.test(css),
  );
  expect('不再用定宽列挤在左边', !/repeat\(auto-fit, minmax\(210px/.test(css));
  expect('列数由数据传进去', /style=\{\{ '--cols': item\.columns\.length \}\}/.test(mainSrc));
  expect(
    '中等视口自动减列',
    /@media \(max-width: 1180px\)/.test(css) && /min\(var\(--cols/.test(css),
  );
  // 列分区：竖线 + 整列悬停高亮，缺一个用户就看不出分组边界
  const colRule = (css.match(/\.nav-panel-col \{([\s\S]*?)\}/) || [])[1] || '';
  expect('列之间有竖线分隔', /border-left\s*:\s*1px solid/.test(colRule));
  expect(
    '整列悬停有高亮（条目间距窄，只靠条目 hover 反馈范围不够）',
    /\.nav-panel-col:hover \{[\s\S]*?background/.test(css),
  );
  expect(
    '粗体大字一级明显更大更重',
    /\.nav-panel-featured \{[\s\S]*?font-size: 19px/.test(css) &&
      /\.nav-panel-featured \{[\s\S]*?font-weight: 600/.test(css),
  );
  // 悬停放大必须在精确指针的媒体查询里，触屏不该有
  const finePointerBlock = css.slice(css.indexOf('@media (hover: hover) and (pointer: fine)'));
  expect('导航项悬停放大写在精确指针媒体查询里', /\.nav-group-trigger:hover \{/.test(finePointerBlock));
  expect('导航项悬停放大用 scale', /transform: scale\(1\.1[0-9]?\)/.test(finePointerBlock));
  expect('放大时给了复位过渡', /transform 220ms var\(--ease-spring\)/.test(css));
  // 面板里的条目也要放大，但幅度小得多
  expect(
    '面板条目悬停也放大',
    /\.nav-panel-col li a:hover \{[\s\S]*?transform: scale\(1\.0[0-9]\)/.test(finePointerBlock),
  );
  expect(
    '面板条目的放大幅度小于导航项',
    /\.nav-panel-col li a:hover \{[\s\S]*?scale\(1\.06\)/.test(finePointerBlock),
  );
  expect('面板条目给了放大过渡', /transform 200ms var\(--ease-spring\)/.test(css));
  // 从左侧放大，左边界不动，扫视时不会左右跳
  expect('面板条目从左边界放大', /transform-origin: 0 50%/.test(css));

  // reduced-motion 下不能还有位移
  const reducedBlock = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
  expect(
    'reduced-motion 下条目去掉位移',
    /\.nav-panel-col li \{[\s\S]*?transform: none/.test(reducedBlock),
  );
  expect(
    'reduced-motion 下取消逐条延迟',
    /transition-delay: 0ms/.test(reducedBlock),
  );

  // 窄屏没有悬停，面板不该参与布局
  const narrowBlock = css.slice(css.indexOf('@media (max-width: 833px)'));
  expect(
    '窄屏隐藏面板',
    /\.nav-panel \{[\s\S]*?display: none/.test(narrowBlock.slice(0, 900)),
  );
} catch (err) {
  checks.push([`执行抛错: ${err.message}`, false]);
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
