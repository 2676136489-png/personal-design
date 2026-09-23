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

  /* 防回归：og:description 和 data.js 的 tagline 是两处独立维护的同一句文案。
     2026-09-23 发现转发到微信/QQ 时显示的还是被替换掉的那句旧文案。 */
  const htmlRaw = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
  const ogDesc = (htmlRaw.match(/og:description"\s+content="([^"]*)"/) || [])[1] || '';
  expect('分享描述与 tagline 同步', ogDesc === profile.tagline);
  if (ogDesc !== profile.tagline) {
    console.log(`    og:description 是「${ogDesc}」，tagline 是「${profile.tagline}」`);
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
