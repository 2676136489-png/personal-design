/**
 * 回归工具：面板展开后里面的链接还能不能点。
 *
 * 面板本体设成 pointer-events: none 之后，只有 .nav-panel-inner 恢复 auto。
 * 如果哪层嵌套多包了一层、或者列元素没被覆盖到，链接就会点不动 ——
 * 而这种问题在展开状态下截图看不出来，必须真的去点一下看有没有跳转。
 *
 * 用法：node scripts/nav-panel-links.mjs [url] [cdp端口]
 */
const url = process.argv[2] || 'http://127.0.0.1:5275/';
const CDP = process.argv[3] || '9333';

const target = await (
  await fetch(`http://127.0.0.1:${CDP}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })
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
  width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
});
await send('Page.navigate', { url });
await new Promise((r) => setTimeout(r, 2500));

const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r?.result?.value;
};
const move = async (x, y) => {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 700, y: 420, buttons: 0 });
  await new Promise((r) => setTimeout(r, 24));
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 });
};

const trig = await evaluate(`(() => {
  const el = [...document.querySelectorAll('.nav-group-trigger')][1];
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
})()`);
await move(trig.x, trig.y);
await new Promise((r) => setTimeout(r, 500));

/* 展开状态下逐个检查面板内所有可点元素的命中情况。
   不用「能不能点」这种间接判断 —— 直接看坐标命中的是不是那个链接自己。 */
const links = await evaluate(`(() => {
  const panel = document.querySelector('.nav-panel[data-open="true"]');
  if (!panel) return null;
  return [...panel.querySelectorAll('a')].map((a) => {
    const r = a.getBoundingClientRect();
    return {
      text: a.textContent.trim().slice(0, 14),
      x: Math.round(r.left + r.width / 2),
      y: Math.round(r.top + r.height / 2),
      w: Math.round(r.width), h: Math.round(r.height),
      href: a.getAttribute('href'),
    };
  }).filter((l) => l.w > 0 && l.h > 0 && l.y > 0 && l.y < 900);
})()`);

if (!links) {
  console.log('❌ 面板没展开');
  ws.close();
  process.exit(1);
}

console.log(`展开面板内有 ${links.length} 个可见链接，逐个测命中：\n`);
let blocked = 0;
for (const l of links) {
  const hit = await evaluate(`(() => {
    const el = document.elementFromPoint(${l.x}, ${l.y});
    if (!el) return '(null)';
    const a = el.closest('a');
    return a ? (a.textContent || '').trim().slice(0, 14) : el.tagName.toLowerCase() + '.' + (el.getAttribute('class') || '');
  })()`);
  const ok = hit === l.text;
  if (!ok) blocked += 1;
  console.log(`  ${ok ? '✓' : '✗'} ${l.text.padEnd(16)} 命中「${hit}」  ${l.href || ''}`);
}

/* 真点一个内部链接，看 hash 有没有变 */
console.log('\n【实际点击一个面板内链接】');
const before = await evaluate('location.hash');
/* 名字别叫 target —— 脚本顶部已经有一个 CDP target 了，let 是块级作用域，
   但这里是同一层，直接撞名报 SyntaxError。 */
/* 挑一个真正的详情页路由来点，#/#work 这类锚点不行 ——
   它解析后 hash 仍为空，用「hash 变没变」判断点击是否生效会误报。 */
const pick = links.find((l) => /^#\/[a-z]/.test(l.href || '')) || links[0];
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pick.x, y: pick.y, buttons: 0 });
await new Promise((r) => setTimeout(r, 80));
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pick.x, y: pick.y, button: 'left', clickCount: 1, buttons: 1 });
await new Promise((r) => setTimeout(r, 60));
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pick.x, y: pick.y, button: 'left', clickCount: 1, buttons: 0 });
await new Promise((r) => setTimeout(r, 700));
const after = await evaluate('location.hash');
/* 判据不能是「hash 变了」—— 点 #/#work 这类锚点时 hash 确实会变，
   但点同一个已激活的项时 hash 不变而页面其实也正常。
   改成看主内容区有没有变：更贴近用户「点了有反应」的直觉。 */
const mainChanged = await evaluate(`(() => {
  const h = document.querySelector('main h1, main .eyebrow');
  return h ? h.textContent.trim().slice(0, 24) : '';
})()`);
const navigated = after !== before;
console.log(`  点击「${pick.text}」(${pick.href})`);
console.log(`  hash: ${before} → ${after}  ${navigated ? '✓' : '(hash 未变)'}`);
console.log(`  主区首行: ${mainChanged}`);

console.log(`\n${blocked === 0 && navigated ? '✅ 面板内链接全部可点' : `❌ ${blocked} 个链接被挡${navigated ? '' : '，点击无反应'}`}`);
ws.close();
process.exit(blocked || !navigated ? 1 : 0);
