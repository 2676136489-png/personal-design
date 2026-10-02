/**
 * 用 Chrome DevTools Protocol 打开页面并执行一段表达式，把结果打回终端。
 *
 * 用途：本机没有 Playwright，但装了 Edge（msedge.exe），可以走 CDP 做真实渲染测量——
 * 布局宽度、某元素的实际 box、某条规则有没有生效，这些都能直接读，
 * 比对着 CSS 推理可靠。
 *
 * 前置：先起一个带调试端口的 Edge 实例
 *   msedge.exe --headless=new --remote-debugging-port=9222 --user-data-dir=<临时目录> about:blank
 *
 * 用法：
 *   node scripts/cdp-probe.mjs <url> [视口宽] [视口高] [表达式文件]
 *   不给表达式文件时，默认打印页面根节点与视口的尺寸关系。
 */
import { readFileSync, writeFileSync } from 'node:fs';

const [, , url = 'http://127.0.0.1:5199/', w = '414', h = '900', exprFile, shot] = process.argv;
const PORT = 9222;
const base = `http://127.0.0.1:${PORT}`;

const DEFAULT_EXPR = `(() => {
  const de = document.documentElement;
  const over = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.right > de.clientWidth + 1) {
      over.push({
        sel: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).trim().split(/\\s+/).join('.') : ''),
        left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width),
      });
    }
  }
  return {
    viewport: { w: de.clientWidth, h: de.clientHeight },
    docScrollWidth: de.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    bodyClientWidth: document.body.clientWidth,
    bodyRect: Math.round(document.body.getBoundingClientRect().width),
    horizontalScrollable: de.scrollWidth > de.clientWidth,
    溢出元素: over.slice(0, 12),
  };
})()`;

const expression = exprFile ? readFileSync(exprFile, 'utf8') : DEFAULT_EXPR;

/* 新建一个 target 拿到它的调试地址 */
const target = await (
  await fetch(`${base}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })
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
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result);
    pending.delete(msg.id);
  }
};

await new Promise((resolve) => {
  ws.onopen = resolve;
});

await send('Page.enable');
/* 锁定视口尺寸，与命令行传入的一致；不锁的话结果没有可比性 */
await send('Emulation.setDeviceMetricsOverride', {
  width: Number(w),
  height: Number(h),
  deviceScaleFactor: 1,
  mobile: Number(w) < 900,
});
await send('Page.navigate', { url });

/* 等页面加载 + 首屏入场动画跑完 */
await new Promise((r) => setTimeout(r, 3000));

const out = await send('Runtime.evaluate', { expression, returnByValue: true });
console.log(JSON.stringify(out?.result?.value ?? out, null, 2));

/* 可选：在锁定的视口下截图。headless 的 --window-size 与真实布局视口并不等价
   （滚动条、meta viewport 都会让两者不等），要判断"有没有溢出"必须用这个。 */
if (shot) {
  const cap = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(shot, Buffer.from(cap.data, 'base64'));
  console.error(`截图已保存（视口 ${w}x${h}）: ${shot}`);
}

ws.close();
process.exit(0);
