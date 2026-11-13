/**
 * 打开线上真实站点，探一眼渲染出来的 DOM，并存一张初始视图。
 * 用来决定后面每个项目该截哪几个画面，不是最终产物。
 * 用法：node scripts/probe-live-sites.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = new URL('../media-src/captured/', import.meta.url);
mkdirSync(OUT, { recursive: true });

const SITES = [
  ['opspilot', 'https://opspilot-v2.app.workbuddy.host/?sharecode=RTXXSZUEYF'],
  ['research', 'https://ebed98754f5b4e4abafe591d754aff06.app.workbuddy.host/?sharecode=JJ4JF7TBGM'],
  ['gomoku', 'https://gomoku-match.app.workbuddy.host/?sharecode=MJAKMJUVAA'],
  ['campus', 'https://www.lucky-campus.top'],
  ['portfolio', 'https://2676136489-png.github.io/personal-design/'],
];

const CDP = 'http://127.0.0.1:9333';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

for (const [slug, url] of SITES) {
  const target = await (
    await fetch(`${CDP}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' })
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
  await new Promise((r) => (ws.onopen = r));
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
  });
  await send('Page.navigate', { url });
  await wait(6000);

  const info = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => ({
      title: document.title,
      url: location.href,
      text: (document.body.innerText || '').slice(0, 420),
      nav: Array.from(document.querySelectorAll('nav a, header a, [role="tab"], button'))
        .slice(0, 22).map(n => (n.innerText || n.getAttribute('aria-label') || '').trim()).filter(Boolean),
      imgs: document.querySelectorAll('img').length,
      bodyH: document.body.scrollHeight,
    }))()`,
  });
  const cap = await send('Page.captureScreenshot', { format: 'png' });
  const file = new URL(`${slug}-probe.png`, OUT);
  writeFileSync(file, Buffer.from(cap.data, 'base64'));
  console.log(`\n=== ${slug} ===`);
  console.log(JSON.stringify(info?.result?.value, null, 2));
  console.log(`截图: ${file.pathname}`);
  ws.close();
}
process.exit(0);
