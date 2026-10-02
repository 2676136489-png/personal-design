/**
 * 回归工具：连续 hover 多个下拉项是否都能正常切换。
 *
 * 对应过的 bug（2026-10-02）：面板铺满整页宽、加上 ::before 桥梁往上顶了
 * 28px，正好盖住整条导航栏。面板一展开，其他触发项就被压在下面，
 * 鼠标移过去命中的是面板而不是导航项 —— 表现为「放第二个就不弹了，
 * 而且永远停在第一个」。修复是面板本体 pointer-events: none。
 *
 * 除了逐项切换，本脚本最后还测一项最关键的：
 * 面板展开时其他触发项能不能被 elementFromPoint 命中。
 * 切换逻辑写得再对，命不中就等于白搭。
 *
 * ⚠️ 派发鼠标事件必须先在远处落一下再移到目标：
 *      CDP 的 Input.dispatchMouseEvent 不携带上一次鼠标位置，
 *      直接往目标坐标派发只有第一次会触发 mouseover（浏览器拿不到
 *      位移就跳过命中测试），后面几次只有 mousemove。
 *      真实鼠标从别处移过来是有位移的 —— 不模拟这个位移，
 *      就会把「面板挡住了导航项」这种真 bug 误判成「页面正常」。
 *
 * 用法：node scripts/nav-switch-trace.mjs [url] [cdp端口]
 */
const url = process.argv[2] || 'http://127.0.0.1:5274/';
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

/* 移入目标。
   ⚠️ 必须分两步：先在远处落一下再移到目标。
      CDP 的 Input.dispatchMouseEvent 不携带上一次鼠标位置，
      直接往目标坐标派发只有第一次会触发 mouseover ——
      浏览器拿不到位移就跳过命中测试，后面几次只有 mousemove。
      真实鼠标从别处移过来是有位移的，所以这里必须模拟出位移，
      否则复现不出「放第二个就不弹」这类问题（会误判成页面正常）。 */
const move = async (x, y) => {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 700, y: 420, buttons: 0 });
  await new Promise((r) => setTimeout(r, 24));
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 });
};

/* 一次「移入 → 停住 → 读状态」的完整动作。
   停住是必须的：面板有 200ms 淡入，刚移过去就读会读到旧状态。

   ⚠️ 判「哪个面板开着」有两个坑：
   1. 不能用 querySelector('.nav-panel[data-open="true"]') ——
      它取的是文档里第一个匹配项。四个面板都渲染、只有一个 data-open=true 时，
      这个选择器恰好能取对；但一旦某次切换没生效，会读到上次那个，
      看起来「正常」实则没切换。改成遍历所有面板看哪个开着。
   2. data-open=true 不等于用户看得见 —— opacity:0 / visibility:hidden /
      pointer-events:none 的面板，用户体验就是「没弹」。三者都要读。 */
const probe = async (label, expectIdx) => {
  await new Promise((r) => setTimeout(r, 420));
  const state = await evaluate(`(() => {
    const panels = [...document.querySelectorAll('.nav-panel')];
    const groups = [...document.querySelectorAll('.nav-group')];
    const openIdx = panels.findIndex((p) => p.getAttribute('data-open') === 'true');
    const open = panels[openIdx];
    return {
      openCount: panels.filter((p) => p.getAttribute('data-open') === 'true').length,
      openIdx,
      groupOpen: groups.findIndex((g) => g.getAttribute('data-open') === 'true'),
      triggerLabel: openIdx >= 0
        ? (open.closest('.global-nav').querySelectorAll('.nav-group-trigger')[openIdx] || {}).textContent
        : null,
      opacity: open ? Number(getComputedStyle(open).opacity).toFixed(2) : null,
      pointerEvents: open ? getComputedStyle(open).pointerEvents : null,
      visibility: open ? getComputedStyle(open).visibility : null,
      titles: open ? [...open.querySelectorAll('.nav-panel-title')].map((n) => n.textContent.trim()) : [],
      links: open ? open.querySelectorAll('a').length : 0,
    };
  })()`);

  /* 面板序号必须等于当前鼠标所在触发项的序号，且真的可见。
     pointer-events 不参与判据：面板本体故意设成 none（否则会盖住整条导航栏，
     鼠标移不到其他触发项），真正要点的链接区是 auto。
     改判据前先确认这一点 —— 我把 pe 也算进 ok，结果修复后反而全 FAIL。 */
  const visible = Number(state.opacity) > 0.9 && state.visibility === 'visible';
  const matched = state.openIdx === expectIdx;
  const ok = state.openCount === 1 && visible && matched;
  console.log(`  ${ok ? '✓' : '✗'} ${label.padEnd(14)} 面板#${state.openIdx}（应为#${expectIdx}） ` +
    `group=${state.groupOpen} opacity=${state.opacity} vis=${state.visibility} ` +
    `链接${state.links} 列[${state.titles.join(' / ')}]`);
  if (!ok) {
    if (state.openCount !== 1) console.log(`      ↳ 同时有 ${state.openCount} 个面板标记为展开`);
    if (visible && !matched) console.log(`      ↳ 弹出的是「${state.triggerLabel?.trim()}」的面板，不是鼠标所在的那一项`);
  }
  return ok;
};

const triggers = await evaluate(`[...document.querySelectorAll('.nav-group-trigger')].map((el) => {
  const r = el.getBoundingClientRect();
  return { label: el.textContent.trim().replace(/\\s+/g, ''),
           x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
})`);

console.log(`下拉触发项 ${triggers.length} 个：${triggers.map((t) => t.label).join(' / ')}\n`);

let fails = 0;
const step = async (idx) => {
  const t = triggers[idx];
  await move(t.x, t.y);
  if (!(await probe(t.label, idx))) fails += 1;
};

console.log('【逐个移入，每个停 420ms，中途移开制造 leave】');
for (let i = 0; i < triggers.length; i += 1) {
  await step(i);
  await move(700, 8);
  await new Promise((r) => setTimeout(r, 260));
}

console.log('\n【连续切换：不停顿，划过前两项直接放第三项】');
await step(0);
await step(1);
if (triggers[2]) await step(2);

console.log('\n【反向切换：第三项 → 第一项 → 第三项】');
if (triggers[2]) {
  await step(2);
  await step(0);
  await step(2);
}

console.log(`\n${fails === 0 ? '✅ 每次切换都正常弹出' : `❌ ${fails} 次没弹出来`}`);

/* 最关键的一项：面板展开时，其他触发项还能不能被鼠标命中。
   用户报的正是这个 —— 面板铺满整页宽，往上顶的透明桥梁又盖住导航栏，
   面板一展开就把「全部作品 / 关于 / 能力」压在下面，鼠标移过去只会被面板接住。
   切换逻辑写得再对，命不中就是白搭。 */
console.log('\n【面板展开时，其他触发项是否可命中】');
await move(triggers[0].x, triggers[0].y);
await new Promise((r) => setTimeout(r, 420));
let blocked = 0;
for (let i = 1; i < triggers.length; i += 1) {
  const t = triggers[i];
  const hit = await evaluate(`(() => {
    const el = document.elementFromPoint(${t.x}, ${t.y});
    return { tag: el ? el.tagName.toLowerCase() : '(null)',
             cls: el ? (el.getAttribute('class') || '') : '',
             inTrigger: !!(el && el.closest && el.closest('.nav-group-trigger')) };
  })()`);
  const ok = hit.inTrigger;
  if (!ok) blocked += 1;
  console.log(`  ${ok ? '✓' : '✗'} ${t.label.padEnd(10)} 命中 ${hit.tag}.${hit.cls.split(' ')[0]}` +
    (ok ? '' : '  ← 被面板挡住了，鼠标移不到'));
}
if (blocked) console.log(`\n❌ 有 ${blocked} 个触发项在面板展开时被遮挡 —— 就是「放第二个不弹」的原因`);
else console.log('\n✅ 面板展开时其他触发项仍可命中，可以自由切换');

ws.close();
process.exit(blocked || fails ? 1 : 0);
