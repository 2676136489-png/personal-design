/**
 * 统计每个「方向」（category）下有几个项目。
 *
 * 用户报的问题：导航下拉里「按方向」那七项点了都只跳到 #/#work
 * （所有项目的概览），应该跳到对应的项目。
 * 要决定路由怎么设计，先得知道每个方向下是 1 个还是多个项目：
 * 单个可以直接指到详情页，多个才需要单独建一个聚合页。
 *
 * data.js 依赖 Vite 的 import.meta.env，直接 import 会报
 * 「Cannot read properties of undefined」—— 走 ssrLoadModule。
 */
import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'silent',
  optimizeDeps: { noDiscovery: true, include: [] },
});

try {
  const { projects, navItems } = await server.ssrLoadModule('/src/data.js');

  const byCat = new Map();
  for (const p of projects) {
    if (!byCat.has(p.category)) byCat.set(p.category, []);
    byCat.get(p.category).push(p);
  }

  console.log(`共 ${projects.length} 个项目，${byCat.size} 个方向\n`);
  for (const [cat, list] of byCat) {
    const kind = list.length === 1 ? '单项目 → 可直接指详情页' : `多项目 → 需要聚合页（${list.length} 个）`;
    console.log(`${cat}  [${kind}]`);
    for (const p of list) console.log(`    #/${p.slug}  ${p.title}`);
  }

  /* 导航里「按方向」那一列现在写死成什么 href —— 全是 #/#work 就是占位 */
  const work = navItems.find((n) => n.id === 'work');
  const col = work?.columns?.find((c) => c.title === '按方向');
  console.log('\n导航「按方向」列当前的 href:');
  for (const l of col?.links || []) console.log(`    ${l.href}  ${l.label}`);

  const allPlaceholder = (col?.links || []).every((l) => l.href === '#/#work');
  console.log(`\n是否全是占位（都指向 #/#work）: ${allPlaceholder ? '是 ← 用户报的就是这个' : '否'}`);
} finally {
  await server.close();
}
