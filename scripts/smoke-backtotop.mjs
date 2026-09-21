/* 回到顶部按钮的验证。
   SSR 只能验证「渲染出来了」，验证不了「滚动时显隐是否正确」，
   所以这里补三类检查：
   1) 组件在真实页面里的结构（经 Vite 转译后挂载）
   2) 判据逻辑：由 scrollY 与阈值算出显隐
   3) 样式契约：居中、贴底、层级、reduced-motion 降级

   本机无浏览器，真实滚动事件无法实测，
   因此把「显隐判据」和「样式开关」拆开各自断言，任一侧写错都能被发现。 */

import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

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
const createdEls = [];
globalThis.location = new Proxy(
  { hash: '#/', pathname: '/', origin: 'http://localhost', href: 'http://localhost/#/' },
  {
    get: (t, p) => {
      if (p === 'hash') return currentHash;
      if (p === 'href') return `http://localhost/${currentHash}`;
      return t[p];
    },
    set: (t, p, v) => {
      if (p === 'hash') currentHash = v;
      else t[p] = v;
      return true;
    },
  },
);
globalThis.window = globalThis;
globalThis.window.location = globalThis.location;
globalThis.window.addEventListener = () => {};
globalThis.window.removeEventListener = () => {};
globalThis.window.scrollTo = () => {};
globalThis.window.scrollY = 0;
globalThis.document = {
  documentElement: {
    dataset: {},
    setAttribute() {},
    removeAttribute() {},
    getAttribute: () => null,
    style: {},
    scrollHeight: 5000,
  },
  body: {
    setAttribute() {},
    removeAttribute() {},
    style: {},
    appendChild(el) {
      createdEls.push(el);
      return el;
    },
  },
  addEventListener() {},
  removeEventListener() {},
  getElementById: () => null,
  createElement: () => {
    const el = {
      style: { cssText: '' },
      attrs: {},
      setAttribute(k, v) {
        this.attrs[k] = v;
      },
      remove() {
        this.removed = true;
      },
      appendChild() {},
      select() {},
    };
    createdEls.push(el);
    return el;
  },
  querySelectorAll: () => [],
  querySelector: () => null,
};

const checks = [];
const expect = (n, c) => checks.push([n, !!c]);

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'silent',
  optimizeDeps: { noDiscovery: true, include: [] },
});

try {
  const main = await server.ssrLoadModule('/src/main.jsx');
  const motion = await server.ssrLoadModule('/src/motion.jsx');
  const shouldShow = motion.shouldShowBackToTop;
  const thresholdOf = motion.backToTopThreshold;
  const App = main.App ?? main.default;
  const render = (hash) => {
    currentHash = hash;
    return renderToStaticMarkup(React.createElement(App));
  };

  const pages = {
    首页: render('#/'),
    简历页: render('#/resume'),
    校园圈子: render('#/campus'),
    项目详情: render('#/gomoku'),
  };

  for (const [name, html] of Object.entries(pages)) {
    expect(
      `${name} 渲染出按钮`,
      html.includes('class="back-to-top"') && html.includes('回到页面顶端'),
    );
    expect(
      `${name} 初始隐藏且不可聚焦`,
      html.includes('data-visible="false"') && html.includes('tabindex="-1"'),
    );
  }

  // 判据逻辑：直接由 scrollY 与阈值决定（上一版用 fixed 哨兵是错的）
  expect('顶端时隐藏', shouldShow(0, 900) === false);
  expect('下滚后显形', shouldShow(500, 900) === true);
  expect('未超阈值仍隐藏', shouldShow(50, 900) === false);

  const css = await (
    await import('node:fs/promises')
  ).readFile(new URL('../src/styles.css', import.meta.url), 'utf8');

  expect('默认 opacity 0', /\.back-to-top\s*\{[^}]*opacity:\s*0/.test(css));
  expect('居中 left 50%', /\.back-to-top\s*\{[^}]*left:\s*50%/.test(css));
  expect('贴底 bottom', /\.back-to-top\s*\{[^}]*bottom:\s*26px/.test(css));
  expect('层级 90（低于导航 100）', /\.back-to-top\s*\{[^}]*z-index:\s*90/.test(css));
  expect('隐藏时不可点击', /\.back-to-top\s*\{[^}]*pointer-events:\s*none/.test(css));
  expect('显形绑定 data-visible', /\.back-to-top\[data-visible='true'\]/.test(css));
  expect('显形时恢复点击', /data-visible='true'\][^}]*pointer-events:\s*auto/.test(css));
  expect('窄屏隐藏文字', /\.back-to-top span\s*\{\s*display:\s*none/.test(css));
  expect(
    'reduced-motion 降级',
    /prefers-reduced-motion[\s\S]*?\.back-to-top\s*\{[\s\S]*?transform:\s*translate3d\(-50%,\s*0,\s*0\)/.test(
      css,
    ),
  );

  // hook 本体：必须走 scroll + rAF，不再用 fixed 哨兵
  const motionSrc = await (
    await import('node:fs/promises')
  ).readFile(new URL('../src/motion.jsx', import.meta.url), 'utf8');
  expect('监听 scroll 事件', /addEventListener\('scroll'/.test(motionSrc));
  expect('passive 监听', /'scroll',\s*onScroll,\s*\{\s*passive:\s*true/.test(motionSrc));
  expect('用 rAF 合帧', /requestAnimationFrame/.test(motionSrc));
  expect('只在翻转时 setState', /if \(next !== current\)/.test(motionSrc));
  expect('卸载移除 scroll 监听', /removeEventListener\('scroll', onScroll\)/.test(motionSrc));
  expect('卸载取消 rAF', /cancelAnimationFrame/.test(motionSrc));
  expect('监听 resize 重判定', /addEventListener\('resize'/.test(motionSrc));
  expect('小视口用 120px 下限', thresholdOf(500) === 120);
  expect('大视口取 12%', thresholdOf(1200) === 144);
  // 防回归：不能再退回上一版的 fixed 哨兵方案
  expect('不再使用 fixed 哨兵', !/position:fixed;top:0;left:0/.test(motionSrc));
  expect('不再靠 IntersectionObserver 判显隐', !/observer\.observe\(sentinel\)/.test(motionSrc));
} catch (err) {
  checks.push([`抛错: ${err.message}`, false]);
} finally {
  await server.close().catch(() => {});
}

let failed = 0;
for (const [n, ok] of checks) {
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}`);
}
console.log(`\n结果: ${checks.length - failed}/${checks.length} 通过`);
process.exit(failed ? 1 : 0);
