/**
 * SSR 冒烟测试的公共环境：最小 DOM 桩 + Vite 服务。
 *
 * 为什么单独拎出来：
 * - GSAP 的 ScrollTrigger 在模块加载时就开始摸 document.body 的十几种方法，
 *   每个脚本各写一份，永远是补一个漏一个；
 * - react-router 的 history 初始化要读 scrollRestoration；
 * - ⚠️ 最坑的一条：Windows 上 realpath 会把盘符规范成大写（D:\），
 *   而脚本自己 `import 'react'` 走的是小写（d:\）。同一个文件被 Node 当成两个模块，
 *   于是出现「两份 React」，报错只有一句 Invalid hook call / cannot read useRef。
 *   所以服务必须开 resolve.preserveSymlinks。
 */

/* 假元素：什么方法都能调，读属性不炸 */
const fakeEl = (extra = {}) => ({
  style: new Proxy(
    {},
    {
      get: (t, k) => (k in t ? t[k] : () => ''),
      set: (t, k, v) => {
        t[k] = v;
        return true;
      },
    },
  ),
  dataset: {},
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  children: [],
  childNodes: [],
  firstChild: null,
  offsetWidth: 0,
  offsetHeight: 0,
  clientWidth: 1280,
  clientHeight: 800,
  scrollWidth: 1280,
  scrollHeight: 800,
  appendChild() {},
  removeChild() {},
  insertBefore() {},
  setAttribute() {},
  getAttribute: () => null,
  removeAttribute() {},
  hasAttribute: () => false,
  contains: () => false,
  addEventListener() {},
  removeEventListener() {},
  querySelector: () => null,
  querySelectorAll: () => [],
  getBoundingClientRect: () => ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }),
  ...extra,
});

export function installDomStubs() {
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
  globalThis.getComputedStyle = () => ({ getPropertyValue: () => '', overflow: 'visible' });
  globalThis.devicePixelRatio = 1;

  globalThis.window = globalThis;
  globalThis.window.innerWidth = 1280;
  globalThis.window.innerHeight = 800;
  globalThis.window.addEventListener = () => {};
  globalThis.window.removeEventListener = () => {};
  globalThis.window.scrollTo = () => {};
  globalThis.window.scrollY = 0;

  globalThis.history = {
    scrollRestoration: 'auto',
    state: null,
    length: 1,
    pushState() {},
    replaceState() {},
    back() {},
    forward() {},
    go() {},
  };

  globalThis.location = { hash: '#/', pathname: '/', origin: 'http://localhost', href: 'http://localhost/' };
  globalThis.window.location = globalThis.location;

  globalThis.document = {
    documentElement: fakeEl(),
    body: fakeEl(),
    addEventListener() {},
    removeEventListener() {},
    getElementById: () => null,
    createElement: () => fakeEl(),
    querySelectorAll: () => [],
    querySelector: () => null,
  };
}

export async function startSsrServer() {
  const { createServer } = await import('vite');
  return createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent',
    optimizeDeps: { noDiscovery: true, include: [] },
    /* react-router-dom 的 exports 里 node 条件是 CJS，直接 import 拿不到具名导出。
       带上 module-sync 条件才会走 dist/index.mjs。 */
    ssr: { resolve: { externalConditions: ['node', 'module-sync', 'import'] } },
    /* ⚠️ 见文件头：Windows 盘符大小写会让 React 变成两份 */
    resolve: { preserveSymlinks: true },
  });
}

/* 断言收集与汇总，四个脚本输出格式一致 */
export function createChecker() {
  const checks = [];
  return {
    checks,
    expect: (name, cond) => checks.push([name, !!cond]),
    report() {
      let failed = 0;
      for (const [name, ok] of checks) {
        if (!ok) failed += 1;
        console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
      }
      console.log(`\n结果: ${checks.length - failed}/${checks.length} 通过`);
      return failed;
    },
  };
}
