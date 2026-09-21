/* 一次性渲染冒烟脚本：用 react-dom/server 直接渲染关键页面，
   确认组件不崩、关键文案出现在输出里。
   本机没有浏览器/Playwright，这是当前能拿到的最强验证手段。

   用法：node scripts/smoke-render.mjs */

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

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'silent',
  optimizeDeps: { noDiscovery: true, include: [] },
});

try {
  const main = await server.ssrLoadModule('/src/main.jsx');
  const App = main.App ?? main.default;
  if (!App) throw new Error('App 未导出，无法渲染');

  const render = (hash) => {
    currentHash = hash;
    return renderToStaticMarkup(React.createElement(App));
  };

  const home = render('#/');
  expect('首页含欢迎语', home.includes('欢迎来到我的个人网站'));
  expect('首页含 tagline', home.includes('把校园里的想法'));
  expect('首页 h1 不再是姓名', !home.includes('<h1>卢柯宇</h1>'));
  expect('首页含 heroIntro', home.includes('用工程能力承载想法'));
  expect('首页含事实条', home.includes('GPA'));

  const resumeHtml = render('#/resume');
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
    ['校园圈子', 'Gomoku', '菜鸟驿站', '个人作品集'].every((k) => resumeHtml.includes(k)),
  );
  expect('简历页不含 Wiki 插件', !resumeHtml.includes('iGEM'));
  expect('简历页含学校', resumeHtml.includes('吉林大学'));
  expect('简历页含技能分组', resumeHtml.includes('LangGraph'));

  const campusHtml = render('#/campus');
  expect('校园圈子页仍正常', campusHtml.includes('校园圈子'));

  const gomoku = render('#/gomoku');
  expect('项目详情页仍正常', gomoku.includes('Gomoku'));
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
