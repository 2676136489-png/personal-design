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

const DS = 'src/design-system.css';
const APP = 'src/app/App.jsx';
const WORKS = 'src/pages/Works.tsx';
const DETAIL = 'src/pages/DetailPages.jsx';
const DATA = 'src/data.js';
const README = 'README.md';
const CAMPUS_STATS = 'src/pages/CampusStats.tsx';

const originals = {
  [DS]: readFileSync(DS, 'utf8'),
  [APP]: readFileSync(APP, 'utf8'),
  [WORKS]: readFileSync(WORKS, 'utf8'),
  [DETAIL]: readFileSync(DETAIL, 'utf8'),
  [DATA]: readFileSync(DATA, 'utf8'),
  /* README 也留一份：进程被中断时靠 finally 还原 */
  [README]: readFileSync(README, 'utf8'),
  [CAMPUS_STATS]: readFileSync(CAMPUS_STATS, 'utf8'),
};

/* 每条：名字 / 目标文件 / 坏写法（要匹配原文）/ 换成的坏写法 / 预期 FAIL 的断言名 / 跑哪个脚本 */
const mutations = [
  {
    /* 迁移过来的三页曾经带 ink→accent 的渐变标题字，新系统要纯色 */
    name: '旧页面标题改回渐变字',
    file: DS,
    from: /(\.legacy-doc \.page-hero h1 \{[\s\S]*?)background-image: none;/,
    to: '$1background-image: linear-gradient(112deg, var(--ink), var(--accent));',
    expectFail: '旧页面标题不带渐变',
  },
  {
    /* 移动端卡片把标题压回截图上 —— 封面明暗不定，白字会糊掉 */
    name: '移动端卡片标题压回图上',
    file: DS,
    from: '.works-bento-copy {\n  padding: 14px 16px 16px;',
    to: '.works-bento-copy {\n  position: absolute;\n  padding: 14px 16px 16px;',
    expectFail: '移动端卡片标题不压在图上',
  },
  {
    /* 两列布局的断点被删 —— 窄屏就会两列挤成一团、长邮箱顶出格子 */
    name: '两列布局去掉窄屏折叠',
    file: DS,
    from: '@media (max-width: 860px) {\n  .ds-split {\n    grid-template-columns: 1fr;',
    to: '@media (max-width: 860px) {\n  .ds-split {\n    grid-template-columns: var(--split);',
    expectFail: '.ds-split 有窄屏折叠',
  },
  {
    /* 转场结束后残留 transform 会让 ScrollTrigger 的 pin 以它为包含块，
       /works 的整块画廊会被顶出视口。 */
    name: '转场结束不清 transform（pin 会错位）',
    file: APP,
    custom: (src) => src.replace(/clearProps: 'transform'/g, "clearProps: 'none'"),
    expectFail: '转场结束清掉 transform（否则 pin 错位）',
  },
  {
    name: '换页前不 kill 触发器（旧触发器残留）',
    file: APP,
    from: 'ScrollTrigger.getAll().forEach((t) => t.kill());',
    to: '/* 不 kill */',
    expectFail: '换页前 kill 所有触发器',
  },
  {
    /* slug 不存在时不再转 404，会直接渲染旧版 not-found 或者空白 */
    name: '未知 slug 不转 404',
    file: APP,
    from: '  if (!project) return <NotFound />;\n',
    to: '',
    expectFail: '未知路由渲染 404（单段路径）',
  },
  {
    name: '作品页关掉 pin（横滚退回普通滚动）',
    file: WORKS,
    from: '        pin: true,',
    to: '        pin: false,',
    expectFail: '作品页桌面用 pin + scrub',
  },
  {
    name: '作品页不再按宽度切分支（移动端也上 pin）',
    file: WORKS,
    from: "matchMedia('(max-width: 767px)')",
    to: "matchMedia('(max-width: 1px)')",
    expectFail: '作品页按宽度切分支',
  },
  {
    /* 简历标注行退回项目详情页口径 —— 与 PDF 上的
       「PHP / MySQL 全栈 · Vibe Coding」对不上，投递时会露馅。 */
    name: '简历标注行退回 p.role（与 PDF 口径不一致）',
    file: DETAIL,
    from: '{resume.projectMeta?.[p.slug] || p.role}',
    to: '{p.role}',
    expectFail: '简历页显示「campus」的标注行',
  },
  {
    name: '灯箱标题写死月份（简历更新后就不对上了）',
    file: DETAIL,
    from: 'caption={`卢柯宇简历 · ${resume.updated}`}',
    to: 'caption="卢柯宇简历 · 2026 年 9 月"',
    expectFail: '灯箱标题跟着 resume.updated 走（不能写死月份）',
  },
  {
    /* data.js 里整段删掉 resume.advantages。
       页面里是 resume.advantages.map(...) —— 字段没了直接抛异常，简历页白屏。 */
    name: '删掉 resume.advantages 字段（简历页会白屏）',
    file: DATA,
    from: /  advantages: \[[\s\S]*?\n  \],\n/,
    to: '',
    expectFail: 'resume 上被渲染用到的字段都存在（缺一个就是白屏）',
  },
  {
    /* profile.hometown 缺了，名片上会显示「重庆 · undefined」 */
    name: '删掉 profile.hometown（名片显示 undefined）',
    file: DATA,
    from: /\n  hometown: '籍贯 重庆',/,
    to: '',
    expectFail: 'profile 有 hometown（名片要显示现居地 + 籍贯）',
  },
  {
    /* 首屏统计是手写值，必须与 projects 对得上 —— 改一个数字就该被拦住 */
    name: '首屏统计手改数字（与项目条数对不上）',
    file: DATA,
    from: "value: '6 个'",
    to: "value: '7 个'",
    expectFail: '首屏「线上运行中」与有站点的项目数一致',
  },
  {
    /* 统计区大数字手写死值的话，data.js 改了数字页面不会跟着动 */
    name: '统计区大数字脱离数据源（手写死值）',
    file: CAMPUS_STATS,
    from: 'const target = Number(hero.value);',
    to: 'const target = 99;',
    expectFail: '校园圈子大数字钉在 metrics[0]',
  },
  {
    /* 时间线标题与作品列表标题不一致 —— 读者会以为是两个项目。
       ⚠️ 锚点必须落在时间线那一条上：作品列表里也有同名标题，
       String.replace 只换首个匹配，改错地方验的就不是这件事。 */
    name: '时间线标题与作品列表不一致',
    file: DATA,
    from: "    year: '2026',\n    title: '五子棋对弈引擎 Gomoku Match',",
    to: "    year: '2026',\n    title: '五子棋对弈引擎',",
    expectFail: '时间线的项目标题与作品列表逐字一致',
  },
  {
    /* 网页简历与 PDF 讲同一件事但说法不同：改文案时漏改一边，
       两边测试都过，只有对照 PDF 才发现对不上。 */
    name: '网页简历分点与 PDF 说法不一致（改一边漏一边）',
    file: DATA,
    from: '长任务撞网关超时：图执行转后台异步任务、接口即时返回；',
    to: '长任务撞网关超时：图执行转后台异步任务、接口立刻返回；',
    expectFail: '简历分点与 PDF 逐条一致',
  },
  {
    /* README 引用了仓库里没有的配图 —— GitHub 上那张图就是坏的，
       本地和线上都看不出来，只有真打开 README 才发现。 */
    name: 'README 引用了一张仓库里没有的图',
    file: README,
    from: 'docs/images/resume-page.webp',
    to: 'docs/images/resume-page-missing.webp',
    expectFail: 'README 引用的配图都在仓库里',
  },
  {
    /* 禁用词回来了 —— 「打造」「助力」是 AI 腔的直接信号 */
    name: '界面文案混入禁用词（AI 腔）',
    file: DATA,
    from: /tagline:\s*'([^']*)'/,
    to: "tagline: '助力打造$1'",
    expectFail: '文案禁用词',
    script: 'check-copy',
  },
  {
    /* 破折号当停顿号用 */
    name: '界面文案用破折号当停顿号',
    file: DATA,
    from: /tagline:\s*'([^']*)'/,
    to: "tagline: '$1 —— 站点持续维护中'",
    expectFail: '文案破折号',
    script: 'check-copy',
  },
  {
    /* 三段排比：「读需求、读代码、读文档」 */
    name: '界面文案写成三段排比',
    file: DATA,
    from: /tagline:\s*'([^']*)'/,
    to: "tagline: '读需求、读代码、读文档，三件事都做完了。'",
    expectFail: '文案三段排比',
    script: 'check-copy',
  },
  {
    /* 简历正文里塞超长分句 —— 按「逗号之间」卡 32 字，整句长不管。
       ⚠️ 反例必须真的超过阈值，只多两三个字规则当然不报。 */
    name: '简历分点塞进超长分句',
    file: DATA,
    from: '一套源码双环境部署，图片转 WebP 两档，首屏 1 MB 内。',
    to: '一套源码双环境部署，图片统一转成 WebP 并按布局与详情两个档位输出且把全部首屏静态资源的体积整体控制在 1 MB 以内以避免任何不必要的网络往返与重复加载。',
    expectFail: '文案分句过长',
    script: 'check-copy',
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
    const original = originals[m.file];
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
  for (const [file, src] of Object.entries(originals)) writeFileSync(file, src);
}

console.log(bad ? `\n${bad} 条反例没被拦住，断言有问题` : '\n全部反例都被拦住了');
process.exit(bad ? 1 : 0);