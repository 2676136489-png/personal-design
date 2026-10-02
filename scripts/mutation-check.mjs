/**
 * 反例验证：把某项修复临时改回坏写法，确认对应的断言真的会 FAIL。
 *
 * 为什么必须做：断言如果怎么改都过，那它就不是在保护任何东西，
 * 只是一行永远为真的字符匹配。之前就踩过这个坑 ——
 * 把「哨兵必须 fixed 定位」写进测试，改实现后断言反过来保护了 bug。
 *
 * 用法：node scripts/.mutation-check.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const CSS = 'src/styles.css';
const JSX = 'src/main.jsx';

const css = readFileSync(CSS, 'utf8');
const jsx = readFileSync(JSX, 'utf8');

/* 每条：名字 / 目标文件 / 坏写法（要匹配原文，可为正则）/ 换成的坏写法 / 预期 FAIL 的断言名 */
const mutations = [
  {
    name: '面板底色改回半透明',
    file: CSS,
    from: /(\.nav-panel \{[^}]*?)background: var\(--panel-bg\)/s,
    to: '$1background: var(--surface-alt)',
    expectFail: '面板底色用不透明的 --panel-bg（半透明会让底下大标题透出来）',
  },
  {
    name: '列悬停高亮改回半透明表面色',
    file: CSS,
    from: /(\.nav-panel-col:hover \{[^}]*?)background: var\(--panel-col-hover\)/s,
    to: '$1background: var(--surface)',
    expectFail: '列悬停高亮用不透明层色',
  },
  {
    name: '列分隔线去掉',
    file: CSS,
    from: /(\.nav-panel-col \{[^}]*?)border-left: 1px solid var\(--panel-divider\);/s,
    to: '$1border-left: 0;',
    expectFail: '面板列之间有分隔线',
  },
  {
    name: '竖线改回页面分隔线（实色底上看不见）',
    file: CSS,
    from: 'border-left: 1px solid var(--panel-divider);',
    to: 'border-left: 1px solid var(--line);',
    expectFail: '面板竖线用加重的 --panel-divider（实色底上 --line 太淡）',
  },
  {
    name: '开合判定从 header 挪回触发项（覆盖 header 的判定）',
    file: JSX,
    from: /(className="global-nav"[\s\S]*?)onMouseEnter=\{keep\}\s*\n\s*onMouseLeave=\{closeLater\}/,
    to: '$1',
    expectFail: '导航栏开合判定挂在 header 上（保证移动路径不出现命中空隙）',
  },
  {
    name: '面板自己又管起开合（与 header 判定抢状态）',
    file: JSX,
    from: '<div className="nav-panel" data-open={open}>',
    to: '<div\n      className="nav-panel"\n      data-open={open}\n      onMouseEnter={() => {}}\n      onMouseLeave={() => {}}\n    >',
    expectFail: '面板不重复绑定开合判定',
  },
  {
    // 把面板挪回触发项内部（JSX 结构仍然平衡，只是位置变了）
    name: '面板挪回触发项内部（参照物变窄，全宽失效）',
    file: JSX,
    // 先做一次等价改写占位，真正的结构移动由下面 mutate 做
    expectFail: '下拉面板挂在 .global-nav 内（不是触发项内部）',
    custom: (src) => {
      // 把面板那一整段从 header 尾部剪出来，塞到 nav-group 的 div 里
      const panelBlock = src.match(/\n      \{\/\* 面板挂在[\s\S]*?\n      \)\}/);
      if (!panelBlock) return null;
      const cut = src.replace(panelBlock[0], '\n      {/*面板移位*/}');
      const groupMark = '<div key={id} className="nav-group" data-open={openId === id} onMouseEnter={() => open(id)}>';
      return cut.replace(groupMark, `${groupMark}${panelBlock[0]}`);
    },
  },
  {
    // 指针桥梁去掉：面板与导航栏之间的命中缺口回来，斜向移动会漏触发 leave
    name: '去掉面板的指针桥梁',
    file: CSS,
    from: /\.nav-panel::before \{[\s\S]*?\n\}/,
    to: '.nav-panel::before {\n  display: none;\n}',
    expectFail: '面板有指针桥梁接上导航栏',
    script: 'smoke-nav',
  },
  {
    name: '面板展开选择器写回 .nav-group（命中不到元素）',
    file: CSS,
    from: '.nav-panel[data-open="true"] .nav-panel-col li',
    to: '.nav-group[data-open="true"] .nav-panel-col li',
    expectFail: '面板的展开选择器不再依赖 .nav-group',
    script: 'smoke-nav',
  },
  {
    name: '分组设 position:relative（面板定位参照物变窄）',
    file: CSS,
    from: '.nav-group {\n  display: flex;',
    to: '.nav-group {\n  position: relative;\n  display: flex;',
    expectFail: '分组不设 position（否则面板定位参照物变窄）',
    script: 'smoke-nav',
  },
];

/* from 可以是字符串或正则。正则带 g 标志时 lastIndex 会残留，
   test 同一对象第二次就失配，所以先剥掉 g。 */
const probe = (pattern, text) =>
  typeof pattern === 'string'
    ? text.includes(pattern)
    : new RegExp(pattern.source, pattern.flags.replace('g', '')).test(text);

let bad = 0;
try {
  for (const m of mutations) {
    const original = readFileSync(m.file, 'utf8');
    let mutated = null;
    if (m.custom) {
      mutated = m.custom(original);
      if (mutated === null) {
        console.log(`⚠️  反例「${m.name}」的改写没匹配上原文 —— 断言可能锚错了地方，跳过`);
        bad += 1;
        continue;
      }
      if (mutated === original) {
        console.log(`⚠️  反例「${m.name}」改写后内容没变，跳过`);
        bad += 1;
        continue;
      }
    } else {
      if (!probe(m.from, original)) {
        console.log(`⚠️  反例「${m.name}」没匹配上原文 —— 断言可能锚错了地方，跳过`);
        bad += 1;
        continue;
      }
      mutated = original.replace(m.from, m.to);
    }
    writeFileSync(m.file, mutated);
    let out = '';
    let code = 0;
    try {
      out = execFileSync(process.execPath, [`scripts/${m.script || 'smoke-render'}.mjs`], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (err) {
      out = `${err.stdout || ''}${err.stderr || ''}`;
      code = err.status ?? 1;
    }
    writeFileSync(m.file, original);
    /* 渲染抛错时断言也会被追加到 stdout，FAIL 行必须全量扫 */
    const failLines = out.split('\n').filter((l) => l.startsWith('FAIL'));
    const hit = out.includes(`FAIL  ${m.expectFail}`);
    const pass = code !== 0 && hit;
    console.log(`${pass ? '✅' : '❌'} 反例「${m.name}」→ ${code !== 0 ? '退出码非 0' : '退出码 0（断言没拦住）'}`);
    console.log(`   ${failLines[0] || '（没有任何 FAIL 行）'}`);
    if (!hit) console.log(`   预期拦下的是「${m.expectFail}」，实际拦下的是别的或没拦住`);
    if (!pass) bad += 1;
  }
} finally {
  writeFileSync(CSS, css);
  writeFileSync(JSX, jsx);
}

console.log(bad ? `\n${bad} 条反例没被拦住，断言有问题` : '\n全部反例都被拦住了');
process.exit(bad ? 1 : 0);