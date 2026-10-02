/**
 * 抓 README 里用的界面图。
 *
 * 抓线上主站而不是本地构建：README 是给别人看的，展示的应该是
 * 访客实际打开的样子。
 *
 * 产物写到 docs/（进仓库），临时截图才写 screenshots/（已 gitignore）。
 * 浅色主题和深色主题各抓一套，README 里并排展示。
 *
 * 用法：node scripts/shoot-docs.mjs [cdp端口]
 * 前置：msedge --headless=new --remote-debugging-port=9333 --user-data-dir=<临时目录>
 */
import { mkdirSync, writeFileSync } from 'node:fs';

const CDP = process.argv[2] || '9333';
const SITE = 'https://lukeyu-portfolio.app.workbuddy.host';
const OUT = 'docs/images';

const target = await (
  await fetch(`http://127.0.0.1:${CDP}/json/new?${encodeURIComponent(SITE)}`, { method: 'PUT' })
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
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
  }
};
await new Promise((r) => { ws.onopen = r; });

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: 1440, height: 900, deviceScaleFactor: 2, mobile: false,
});

const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r?.result?.value;
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const shoot = async (name, clip) => {
  const params = { format: 'png', captureBeyondViewport: false };
  if (clip) params.clip = { ...clip, scale: 2 };
  const r = await send('Page.captureScreenshot', params);
  if (!r?.data) { console.log('  ❌', name); return; }
  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.data, 'base64'));
  console.log('  ✓', name);
};

const goto = async (hash) => {
  await send('Page.navigate', { url: `${SITE}/index.html${hash}` });
  await wait(2200);
};

/* 站点的主题 key 带版本号，改过视觉后 key 会变。
   直接按 html 上的 data-theme 读当前是什么，再决定要不要切。 */
const setTheme = async (theme) => {
  await evaluate(`(() => {
    document.documentElement.setAttribute('data-theme', ${JSON.stringify(theme)});
    try { localStorage.setItem('portfolio-theme-v2', ${JSON.stringify(theme)}); } catch (e) {}
    return document.documentElement.getAttribute('data-theme');
  })()`);
  await wait(700);
};

const W = 1440;

console.log('抓取中 →', OUT + '/');

// 首屏
await goto('#/');
await setTheme('dark');
await shoot('home-dark');
await setTheme('light');
await shoot('home-light');
await setTheme('dark');

// 作品区：滚到网格
await evaluate(`(() => {
  const el = document.querySelector('#work .work-grid');
  if (el) el.scrollIntoView({ block: 'start' });
  return true;
})()`);
await wait(1400);
await shoot('work-grid');

// 导航下拉
await evaluate(`(() => { window.scrollTo(0, 0); return true; })()`);
await wait(600);
const trig = await evaluate(`(() => {
  const g = [...document.querySelectorAll('.nav-group-trigger')].find(n => n.textContent.includes('全部作品'));
  if (!g) return null;
  const r = g.getBoundingClientRect();
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
})()`);
if (trig) {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: trig.x, y: trig.y, buttons: 0 });
  await wait(900);
  await shoot('nav-dropdown');
}

// 项目详情页
await goto('#/opspilot');
await shoot('project-opspilot');
await goto('#/campus');
await shoot('project-campus');

// 关于与能力区
await goto('#/');
await evaluate(`(() => {
  const el = document.querySelector('#about');
  if (el) el.scrollIntoView({ block: 'start' });
  return true;
})()`);
await wait(1400);
await shoot('about-section');

console.log('尺寸：', W, 'x', 900, '（2x 像素密度）');
ws.close();
process.exit(0);
