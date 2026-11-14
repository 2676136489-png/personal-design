/* 渲染冒烟：用 react-dom/server 逐条路由渲染，确认组件不崩、关键内容还在。
   本机没有 Playwright，布局与交互走 CDP 脚本，这里只钉「逻辑/结构/数据契约」。

   用法：node scripts/smoke-render.mjs */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createChecker, installDomStubs, startSsrServer } from './lib/ssr-dom.mjs';

/* ⚠️ 必须在加载业务模块之前打桩 —— GSAP 在模块顶层就要读 window/document */
installDomStubs();

const { expect, report } = createChecker();
const server = await startSsrServer();

const read = (rel) => readFileSync(fileURLToPath(new URL(`../${rel}`, import.meta.url)), 'utf8');

try {
  /* 页面组件走 Vite 的 SSR 模块图；React 由 lib/ssr-dom 保证只有一份 */
  const main = await server.ssrLoadModule('/src/app/App.jsx');
  const data = await server.ssrLoadModule('/src/data.js');
  const AppShell = main.AppShell;
  const MemoryRouter = main.MemoryRouter;
  if (!AppShell || !MemoryRouter) throw new Error('AppShell / MemoryRouter 未导出，无法逐条渲染');

  /* SSR 里没有 HashRouter 的 history，用 MemoryRouter 指定路径逐条渲染 */
  const render = (path) =>
    renderToStaticMarkup(
      React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(AppShell)),
    );

  /* 导航是全站共享的，下拉/页脚里也列着项目名。
     查「正文里有没有某段话」必须先把 <main> 摘出来，否则被导航污染。 */
  const bodyOf = (html) => {
    const start = html.indexOf('<main');
    const end = html.lastIndexOf('</main>');
    return start > -1 && end > start ? html.slice(start, end) : html;
  };

  const { projects, heroFacts, profile, resume, campus, timeline, categories } = data;

  /* ⚠️ 字段契约必须放在最前面。resume.advantages 整个没了的话，
     渲染 /resume 会当场抛异常，后面所有断言一条都跑不到 ——
     报告里只剩「渲染抛错」，看不出缺的是哪个字段。 */
  const requiredResumeFields = ['advantages', 'education', 'skillGroups', 'honors', 'projectSlugs'];
  const missingFields = requiredResumeFields.filter((k) => !Array.isArray(resume[k]));
  expect('resume 上被渲染用到的字段都存在（缺一个就是白屏）', missingFields.length === 0);
  if (missingFields.length) console.log('    缺失的字段:', missingFields.join(', '));
  expect('profile 有 hometown（名片要显示现居地 + 籍贯）', !!profile.hometown);
  if (missingFields.length) throw new Error(`resume 缺字段: ${missingFields.join(', ')}`);

  /* ============ 六个路由都能渲染 ============ */
  const PAGE_H1 = [
    ['/', '把还在纸上的想法，'],
    ['/works', '作品'],
    ['/campus-circle', campus.name],
    ['/about', profile.name],
    ['/skills', '能力'],
    ['/contact', '聊聊？'],
    ['/resume', '我的简历'],
  ];
  const html = {};
  for (const [path, h1] of PAGE_H1) {
    const out = render(path);
    html[path] = out;
    expect(`${path} 能渲染出 h1「${h1}」`, bodyOf(out).includes(h1));
  }

  /* 首屏大标题分两行放在遮罩里，断言按行查 */
  const home = html['/'];
  expect('首页标题两行都在', ['把还在纸上的想法，', '做成能跑起来的东西。'].every((l) => home.includes(l)));

  /* ============ 导航与页脚 ============ */
  const NAV = [
    ['/', '首页'],
    ['/works', '作品'],
    ['/campus-circle', '校园圈子'],
    ['/about', '关于'],
    ['/skills', '能力'],
    ['/contact', '联系'],
    ['/resume', '简历'],
  ];
  expect('导航 7 个条目都在', NAV.every(([, label]) => home.includes(`>${label}<`)));
  expect('导航链接指向新路由', NAV.every(([to]) => home.includes(`href="${to}"`)));
  expect('页脚有邮箱', home.includes(`mailto:${profile.email}`));
  expect('页脚有 GitHub', home.includes('github.com/2676136489-png'));
  expect('页脚有回到顶部', /回到(页面)?顶部|回到顶部/.test(home));
  /* 回到顶部是页脚里的按钮，得真的滚回顶部（老的独立悬浮按钮已随改版移除） */
  expect('回到顶部是会滚动的按钮',
    /<button[^>]*aria-label="回到顶部"/.test(home)
    && /window\.scrollTo\(\{ top: 0/.test(read('src/app/Footer.jsx')));
  expect('主题切换按钮存在', /aria-label="(切换到|切到)(浅色|深色)/.test(home) || home.includes('site-theme-toggle'));

  /* 未知路由要落到 404，而不是白屏。
     ⚠️ 单段路径会先命中 /:slug，所以 ProjectRoute 里 slug 不存在时必须转 404。 */
  const notFound = render('/this-page-does-not-exist');
  expect('未知路由渲染 404（单段路径）', bodyOf(notFound).includes('这页不存在'));
  const notFoundDeep = render('/a/b/c');
  expect('未知路由渲染 404（多段路径）', bodyOf(notFoundDeep).includes('这页不存在'));

  /* ============ 首页 ============ */
  expect('首屏数据条渲染出全部条目',
    heroFacts.every((f) => home.includes(f.value) && home.includes(f.label)));
  expect('首屏五入口都在',
    ['/works', '/campus-circle', '/about', '/skills', '/contact']
      .every((to) => bodyOf(home).includes(`href="${to}"`)));

  /* 首屏只讲项目：成绩与学校不进首屏数据条。
     数据条是 heroFacts 那四块，用它的 value 定位到区块再查。 */
  const factsAt = home.indexOf(heroFacts[0].value);
  const factsBlock = factsAt > -1 ? home.slice(factsAt, factsAt + 1200) : '';
  expect('首屏数据条不含成绩与学校', !/GPA|排名|吉林大学|奖学金/.test(factsBlock));
  expect('成绩与学校没有从站里消失', /GPA/.test(html['/resume']) && /吉林大学/.test(html['/about']));

  /* ============ 作品页（桌面分支） ============ */
  const works = html['/works'];
  const slideCount = (works.match(/data-slide="true"|data-slide=""/g) || []).length;
  expect('作品页渲染出 9 屏（campus + 8 个项目）', slideCount === projects.length + 1);
  expect('作品页有页码', /0?1\s*<\/strong>/.test(works) && String(projects.length + 1).padStart(2, '0').length === 2);
  expect('作品页有拖拽提示', works.includes('拖拽翻页'));
  expect('作品页不渲染移动端网格（桌面分支）', !works.includes('works-bento'));

  /* ============ 校园圈子叙事页 ============ */
  const campusHtml = html['/campus-circle'];
  expect('校园圈子有章节锚点', campus.chapters.every((c) => campusHtml.includes(`ch-${c.id}`)));
  expect('校园圈子有全部章节标题', campus.chapters.every((c) => campusHtml.includes(c.title)));
  expect('校园圈子有运营数据', campus.metrics.every((m) => campusHtml.includes(String(m.value))));
  expect('校园圈子有外链', campusHtml.includes(campus.site) && campusHtml.includes(campus.github));
  /* 大数字必须钉在 metrics[0] 上：SSR 直出最终值「19+」。
     组件里手写死值的话，改 data.js 的数字页面不会跟着动，这里就会拦住。 */
  expect('校园圈子大数字钉在 metrics[0]', bodyOf(campusHtml).includes(`${campus.metrics[0].value}+`));
  expect('校园圈子新版统计区已渲染', bodyOf(campusHtml).includes('campus-stats'));

  /* ============ 关于 / 能力 / 联系 ============ */
  const about = html['/about'];
  expect('关于页的优势都渲染出来了', resume.advantages.every((a) => about.includes(a)));
  expect('关于页有教育经历', resume.education.every((e) => about.includes(e.school)));
  expect('关于页有荣誉', resume.honors.every((h) => about.includes(h.title || h.name || '')));

  const skills = html['/skills'];
  expect('能力页四个模块都在', data.capabilities.every((c) => skills.includes(c.title)));
  expect('能力页列了成绩', data.achievements.every((a) => skills.includes(a.title)));

  const contact = html['/contact'];
  expect('联系页有邮箱与电话', contact.includes(profile.email) && contact.includes(profile.phone));
  expect('联系页底部 CTA 渲染出 headline 与邮箱按钮',
    contact.includes('有想法，就写过来。') && contact.includes(`href="mailto:${profile.email}"`));
  expect('联系页表单三个字段都在', ['name="name"', 'name="email"', 'name="message"'].every((f) => contact.includes(f)));
  expect('联系页提交不假装成功（无 action 属性）', !/action="https?:/.test(contact));

  /* ============ 简历页 ============ */
  const resumeBody = bodyOf(html['/resume']);
  expect('简历页含下载按钮', resumeBody.includes('下载 PDF 简历'));
  for (const head of ['教育经历', '个人优势', '项目经历', '专业技能']) {
    expect(`简历页含「${head}」`, resumeBody.includes(head));
  }
  expect('简历页含预览图与 PDF', resumeBody.includes('resume.webp') && resumeBody.includes('lukeyu-resume.pdf'));

  /* 简历列哪些项目由 resume.projectSlugs 决定 —— 不能手写关键词 */
  const displayNameOf = (p) => (p.title ? p.title : `${p.name} ${p.en}`);
  const slugOf = (s) => (s === campus.slug ? campus : projects.find((p) => p.slug === s));
  const resumeSlugs = resume.projectSlugs || [];
  const resumeTitles = resumeSlugs.map((s) => slugOf(s)).filter(Boolean).map(displayNameOf);
  expect('简历项目 slug 都对应真实项目', resumeTitles.length === resumeSlugs.length);
  expect('简历页列全了 projectSlugs 里的项目', resumeTitles.every((t) => resumeBody.includes(t)));
  const extra = projects.filter((p) => !resumeSlugs.includes(p.slug) && resumeBody.includes(p.title));
  expect('简历页不多列 projectSlugs 之外的项目', extra.length === 0);
  if (extra.length) console.log('    多列出来的:', extra.map((p) => p.title).join(', '));
  expect('简历页不含 iGEM', !resumeBody.includes('iGEM'));

  const metaMap = resume.projectMeta || {};
  for (const s of resumeSlugs) {
    expect(`简历项目「${s}」有标注行`, typeof metaMap[s] === 'string' && metaMap[s].length > 0);
    if (metaMap[s]) expect(`简历页显示「${s}」的标注行`, resumeBody.includes(metaMap[s]));
    const proj = slugOf(s);
    expect(`简历项目「${s}」有仓库地址`, !!proj?.github);
    if (proj?.github) expect(`简历页链到「${s}」的仓库`, resumeBody.includes(proj.github));
  }

  const hlMap = resume.projectHighlights || {};
  for (const s of resumeSlugs) {
    const hl = hlMap[s];
    expect(`简历项目「${s}」有分点描述`, Array.isArray(hl) && hl.length > 0);
    if (Array.isArray(hl)) {
      const miss = hl.filter((h) => !resumeBody.includes(h));
      expect(`简历页渲染全了「${s}」的分点`, miss.length === 0);
      if (miss.length) console.log(`    ${s} 漏掉的分点:`, miss.join(' | '));
    }
  }
  expect('个人优势都渲染出来了', resume.advantages.every((a) => resumeBody.includes(a)));

  /* ============ 数据契约 ============ */
  /* 每个项目都能通过 slug 打开详情页 */
  for (const p of projects) {
    const page = render(`/${p.slug}`);
    expect(`项目详情页可打开：${p.title}`, bodyOf(page).includes(p.title));
  }

  /* 封面必须登记尺寸，否则 <img> 属性会把图拉变形 */
  const IMAGE_SIZES = data.IMAGE_SIZES;
  const missingSize = projects
    .map((p) => p.image)
    .filter((src) => src && !Object.keys(IMAGE_SIZES).some((k) => src.endsWith(k)));
  expect('所有项目封面都在 IMAGE_SIZES 中登记', missingSize.length === 0);
  if (missingSize.length) console.log('    没登记的:', missingSize.join(', '));

  /* 方向 → 路由：单项目直落详情，多项目落聚合页 */
  const routeOf = (c) => (c.projects.length === 1 ? `/${c.projects[0].slug}` : `/category/${c.slug}`);
  for (const c of categories) {
    expect(`方向「${c.name}」至少有一个项目`, c.projects.length > 0);
    if (c.projects.length === 0) continue;
    const page = render(routeOf(c));
    const body = bodyOf(page);
    expect(`方向「${c.name}」的落点能打开`, body.includes(c.name) || c.projects.some((p) => body.includes(p.title)));
    if (c.projects.length > 1) {
      const missing = c.projects.filter((p) => !body.includes(p.title));
      expect(`聚合页「${c.name}」列全了所有项目`, missing.length === 0);
      if (missing.length) console.log('    页面上没有的:', missing.map((p) => p.title).join(', '));
    }
  }
  const indexed = new Set(categories.map((c) => c.name));
  expect('所有项目的分类都在方向索引里', projects.every((p) => indexed.has(p.category)));
  const projectSlugs = new Set(projects.map((p) => p.slug));
  expect('方向 slug 不与项目 slug 冲突', categories.every((c) => !projectSlugs.has(c.slug)));

  /* 首屏统计必须与数据对得上（页面不手写数字） */
  const factOf = (label) => Number((heroFacts.find((f) => f.label === label)?.value || '').replace(/\D/g, ''));
  expect('首屏「收录作品」与项目条数一致',
    factOf('收录作品') === projects.length + (campus ? 1 : 0));
  expect('首屏「线上运行中」与有站点的项目数一致',
    factOf('线上运行中') === projects.filter((p) => p.site).length + (campus?.site ? 1 : 0));

  /* 时间线标题必须与作品列表逐字一致（里程碑除外） */
  const titles = new Set([...projects.map((p) => p.title), campus?.name].filter(Boolean));
  const MILESTONES = ['进入吉林大学'];
  const missingTL = timeline
    .filter((t) => !titles.has(t.title))
    .map((t) => t.title)
    .filter((t) => !MILESTONES.includes(t));
  expect('时间线的项目标题与作品列表逐字一致', missingTL.length === 0);
  if (missingTL.length) console.log('    对不上的标题:', missingTL.join(', '));
  expect('时间首条是最新的 Agent 项目（按体量排序）', timeline[0]?.title.includes('OpsPilot'));

  /* ============ 跨源：网页简历 ↔ PDF ============ */
  const PDF_PATH = fileURLToPath(new URL('../public/media/resume/lukeyu-resume.pdf', import.meta.url));
  if (existsSync(PDF_PATH)) {
    const { execFileSync } = await import('node:child_process');
    const PY_CODE = 'import pymupdf,sys;d=pymupdf.open(sys.argv[1]);print("\\n".join(p.get_text() for p in d))';
    /* PATH 里的 python 未必装了 pymupdf。逐个探解释器，
       全找不到就判失败 —— 静默跳过等于这两条断言根本没写。 */
    const candidates = [
      ...(process.env.PDF_PYTHON ? [process.env.PDF_PYTHON.split(' ')] : []),
      ['python'], ['python3'], ['py', '-3'], ['py'],
    ];
    let reader = null;
    for (const [bin, ...pre] of candidates) {
      try {
        execFileSync(bin, [...pre, '-c', 'import pymupdf'], { stdio: 'ignore' });
        reader = [bin, ...pre];
        break;
      } catch { /* 这个解释器没装，换下一个 */ }
    }
    let pdfText = '';
    if (reader) {
      const [bin, ...pre] = reader;
      try {
        pdfText = execFileSync(bin, [...pre, '-c', PY_CODE, PDF_PATH], { encoding: 'utf8' });
      } catch (err) {
        console.log('    （读 PDF 出错:', err.message.slice(0, 80), '）');
      }
    }
    if (!pdfText) expect('简历 PDF 文字可抽取（pymupdf）', false);
    if (pdfText) {
      /* PDF 抽出的文字会跨行拆开，比对前两边都去空白 */
      const squash = (t) => t.replace(/\s+/g, '');
      const pdfFlat = squash(pdfText);
      const missInPdf = [];
      for (const s of resumeSlugs) {
        for (const h of hlMap[s] || []) {
          if (!pdfFlat.includes(squash(h))) missInPdf.push(`${s}: ${h.slice(0, 24)}…`);
        }
      }
      expect('简历分点与 PDF 逐条一致', missInPdf.length === 0);
      if (missInPdf.length) console.log('    PDF 里没有的分点:', missInPdf.join(' | '));
      const advMiss = resume.advantages.filter((a) => !pdfFlat.includes(squash(a)));
      expect('个人优势与 PDF 逐条一致', advMiss.length === 0);
      if (advMiss.length) console.log('    PDF 里没有的优势:', advMiss.join(' | '));
    }
  } else {
    expect('站点里有简历 PDF 可供比对', false);
  }

  /* ============ 设计系统约束（读 CSS 源码） ============ */
  const dsCss = read('src/design-system.css');
  const ruleOf = (css, pattern) => {
    const body = (css.match(pattern) || [])[1] || '';
    /* ⚠️ 必须剥掉注释：这些规则旁边全是「为什么这样写」的长注释，
       注释里经常直接出现属性名，会被误判成声明。 */
    return body.replace(/\/\*[\s\S]*?\*\//g, '');
  };

  expect('按钮圆角走 16px 变量', /border-radius:\s*var\(--radius-ds\)/.test(ruleOf(dsCss, /\.ds-btn\s*\{([^}]*)\}/)));
  expect('卡片圆角走 16px 变量', /border-radius:\s*var\(--radius-ds\)/.test(ruleOf(dsCss, /\.ds-card\s*\{([^}]*)\}/)));
  expect('只用极淡阴影（shadow-sm 只出现一次定义）',
    (dsCss.match(/--shadow-sm:/g) || []).length === 1);
  expect('首屏大标题不用透明填充做渐变',
    !/-webkit-text-fill-color|background-clip/.test(ruleOf(dsCss, /\.ds-display\s*\{([^}]*)\}/)));

  /* 旧页面的渐变标题必须被压掉 —— 这是迁移后最容易漏的一条 */
  const legacyH1 = ruleOf(dsCss, /\.legacy-doc \.page-hero h1\s*\{([^}]*)\}/);
  expect('旧页面标题不带渐变', /background-image:\s*none/.test(legacyH1));
  expect('旧页面标题不用透明填充', /-webkit-text-fill-color:\s*currentColor/.test(legacyH1));
  expect('旧页面按钮不再是 980px 药丸',
    /border-radius:\s*var\(--radius-ds\)/.test(ruleOf(dsCss, /\.legacy-doc \.btn\s*\{([^}]*)\}/)));

  /* 移动端 Bento 卡片：标题必须在图下方的正常流里，不能压在截图上 */
  const bentoCopy = ruleOf(dsCss, /\.works-bento-copy\s*\{([^}]*)\}/);
  expect('移动端卡片标题不压在图上', !!bentoCopy && !/position:\s*absolute/.test(bentoCopy));

  /* 封面遮罩的初始 clip-path 只能在桌面断点里，否则手机上整块被裁没 */
  const maskAt = dsCss.indexOf('.narrative-cover[data-mask] img');
  const mediaBefore = dsCss.lastIndexOf('@media (min-width: 768px)', maskAt);
  const mediaEnd = dsCss.indexOf('\n}', mediaBefore);
  expect('封面遮罩初始值在桌面断点内', maskAt > -1 && mediaBefore > -1 && maskAt < mediaEnd);

  /* 两列布局：列定义必须在 CSS 里（inline style 盖不过媒体查询） */
  expect('两列布局统一走 .ds-split', /\.ds-split\s*\{([^}]*)\}/.test(dsCss));
  /* 断点里必须真的改成单列 —— 只写「媒体查询存在」的话，
     把折叠值改回 var(--split) 也照样通过。 */
  expect('.ds-split 有窄屏折叠',
    /@media \(max-width: 860px\)\s*\{\s*\.ds-split\s*\{\s*grid-template-columns:\s*1fr\b/.test(dsCss));

  /* ============ 动效约束（读源码） ============ */
  const motion = read('src/motion/scroll.tsx');
  expect('GSAP 上下文统一回收（ctx.revert）', /ctx\.revert\(\)/.test(motion));
  expect('移动端忽略地址栏高度变化', /ignoreMobileResize/.test(motion));
  expect('尊重 reduced-motion', /prefers-reduced-motion/.test(motion));

  const app = read('src/app/App.jsx');
  expect('转场结束清掉 transform（否则 pin 错位）', /clearProps:\s*'transform'/.test(app));
  expect('换页前 kill 所有触发器', /ScrollTrigger\.getAll\(\)\.forEach\([^]{0,60}?\.kill\(\)/.test(app));
  expect('有 /campus 旧地址重定向', /Navigate to="\/campus-circle"/.test(app));

  const worksSrc = read('src/pages/Works.tsx');
  expect('作品页桌面用 pin + scrub', /pin:\s*true/.test(worksSrc) && /scrub:\s*1/.test(worksSrc));
  expect('作品页有移动端降级网格', /function BentoGrid/.test(worksSrc));
  expect('作品页按宽度切分支', /matchMedia\('\(max-width: 767px\)'\)/.test(worksSrc));

  /* 禁止自动循环动画（参考规范：不放常驻循环粒子/发光）。
     ⚠️ 唯一豁免：联系页底部 CtaLuma —— Luma 规格的签名视觉就是循环
     sweep 的霓虹轨迹 + 漂浮粒子 + 呼吸辉光，用户明确指定引入；它走
     framer-motion 的 repeat: Infinity（合成层动画，不走 GSAP）。
     所以断言钉的是「GSAP 的 repeat: -1 不许再出现在任何页面」，
     framer-motion 的写法天然不命中。 */
  const srcFiles = ['src/pages/Home.tsx', 'src/pages/Works.tsx', 'src/pages/Campus.tsx', 'src/pages/About.tsx',
    'src/pages/Skills.tsx', 'src/pages/Contact.tsx', 'src/pages/CtaLuma.tsx', 'src/motion/scroll.tsx', 'src/app/App.jsx'];
  const loops = srcFiles.filter((f) => /repeat:\s*-1/.test(read(f)));
  expect('除联系页 CTA 外没有常驻循环动画', loops.length === 0);
  if (loops.length) console.log('    含 repeat:-1 的文件:', loops.join(', '));

  /* ============ 仓库卫生 ============ */
  const readmeRaw = read('README.md');
  const readmeImgs = [...readmeRaw.matchAll(/docs\/images\/([\w-]+\.webp)/g)].map((m) => m[1]);
  const missingImgs = readmeImgs.filter((f) => !existsSync(fileURLToPath(new URL(`../docs/images/${f}`, import.meta.url))));
  expect('README 引用的配图都在仓库里', missingImgs.length === 0);
  if (missingImgs.length) console.log('    缺失的配图:', missingImgs.join(', '));

  const publicDir = fileURLToPath(new URL('../public', import.meta.url));
  const pngInPublic = [];
  const walkPublic = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walkPublic(p);
      else if (p.endsWith('.png')) pngInPublic.push(p.slice(publicDir.length + 1));
    }
  };
  walkPublic(publicDir);
  expect('public 下没有 PNG 死重源图', pngInPublic.length === 0);
  if (pngInPublic.length) console.log('    死重 PNG:', pngInPublic.join(', '));

  const cssRaw = read('src/styles.css');
  const bareImg = cssRaw.match(/(?:^|\n)\s*img\s*\{([^}]*)\}/);
  expect('全局 img 声明 height:auto（防拉伸）', !!bareImg && /(^|[;\s])height\s*:\s*auto/.test(bareImg[1]));

  /* 灯箱标题里的月份必须跟着 resume.updated 走 —— 写死过一次，
     简历更新到 11 月后那行就跟 PDF 对不上。灯箱是点开才渲染的，
     SSR 输出里没有它，只能查源码有没有写死月份。 */
  const detailRaw = read('src/pages/DetailPages.jsx');
  expect('灯箱标题跟着 resume.updated 走（不能写死月份）',
    /caption=\{`卢柯宇简历 · \$\{resume\.updated\}`\}/.test(detailRaw));
  expect('源码里没有写死的简历月份',
    !/caption="卢柯宇简历 · \d{4} 年 \d{1,2} 月"/.test(detailRaw));

  /* og:description 与 tagline 是同一句话的两份副本 */
  const htmlRaw = read('index.html');
  const ogDesc = (htmlRaw.match(/og:description"\s+content="([^"]*)"/) || [])[1] || '';
  expect('分享描述与 tagline 同步', ogDesc === profile.tagline);
  if (ogDesc !== profile.tagline) console.log(`    og:description「${ogDesc}」≠ tagline「${profile.tagline}」`);
} catch (err) {
  console.log(err.stack?.split('\n').slice(0, 14).join('\n'));
  expect(`渲染抛错: ${err.message}`, false);
} finally {
  await server.close().catch(() => {});
}

process.exit(report() ? 1 : 0);
