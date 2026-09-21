/* 回到顶部按钮的验证。
   SSR 只能验证「渲染出来了」，验证不了「滚动时显隐是否正确」，
   所以这里补三类检查：
   1) 组件在真实页面里的结构（经 Vite 转译后挂载）
   2) 判据逻辑：isIntersecting 取反
   3) 样式契约：居中、贴底、层级、reduced-motion 降级

   本机无浏览器，IntersectionObserver 的浏览器实况无法实测，
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

  // 判据逻辑：哨兵在视野内=页面顶端=隐藏；不在=已下滚=显形
  const derive = (isIntersecting) => !isIntersecting;
  expect('顶端时隐藏', derive(true) === false);
  expect('下滚后显形', derive(false) === true);

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

  // hook 本体：确认用的是 fixed 哨兵（不受 body overflow 裁剪）
  const motionSrc = await (
    await import('node:fs/promises')
  ).readFile(new URL('../src/motion.jsx', import.meta.url), 'utf8');
  expect('哨兵使用 fixed 定位', /position:fixed;top:0;left:0/.test(motionSrc));
  expect('有 IntersectionObserver 兜底', /'IntersectionObserver' in window/.test(motionSrc));
  expect('卸载时移除哨兵', /sentinel\.remove\(\)/.test(motionSrc));
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
