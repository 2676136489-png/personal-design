/* 全局导航的冒烟：结构 + 激活态 + 抽屉契约 + 主题按钮。
   布局与悬停交互走 CDP 脚本，这里只钉「改了会悄悄坏掉」的部分。

   用法：node scripts/smoke-nav.mjs */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createChecker, installDomStubs, startSsrServer } from './lib/ssr-dom.mjs';

/* ⚠️ 必须在加载业务模块之前打桩 */
installDomStubs();

const { expect, report } = createChecker();
const server = await startSsrServer();

const read = (rel) => readFileSync(fileURLToPath(new URL(`../${rel}`, import.meta.url)), 'utf8');

const NAV = [
  ['/', '首页'],
  ['/works', '作品'],
  ['/campus-circle', '校园圈子'],
  ['/about', '关于'],
  ['/skills', '能力'],
  ['/contact', '联系'],
  ['/resume', '简历'],
];

try {
  const main = await server.ssrLoadModule('/src/app/App.jsx');
  const AppShell = main.AppShell;
  const MemoryRouter = main.MemoryRouter;

  const render = (path) =>
    renderToStaticMarkup(
      React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(AppShell)),
    );

  const navOf = (html) => {
    const start = html.indexOf('class="site-nav"');
    const end = html.indexOf('</nav>', start);
    return start > -1 && end > start ? html.slice(start, end) : '';
  };

  const home = render('/');
  const nav = navOf(home);

  /* ---------- 结构 ---------- */
  expect('主导航渲染出来了', nav.length > 0);
  expect('主导航有 aria-label', /aria-label="主导航"/.test(home));
  expect('七个条目齐全且顺序正确', NAV.every(([, label], i) => {
    const at = nav.indexOf(`>${label}<`);
    if (at < 0) return false;
    const prev = i === 0 ? -1 : nav.indexOf(`>${NAV[i - 1][1]}<`);
    return at > prev;
  }));
  expect('每个条目的 href 都是新路由', NAV.every(([to]) => nav.includes(`href="${to}"`)));
  expect('品牌链接回首页', /class="site-brand"[^>]*href="\/"/.test(home));
  if (!NAV.every(([, label]) => nav.includes(`>${label}<`))) {
    console.log('    实际导航:', nav.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  }

  /* ---------- 激活态：每条路由只亮一个 ---------- */
  const activeOn = (path) => {
    const scope = navOf(render(path));
    return [...scope.matchAll(/<a[^>]*class="site-nav-link"[^>]*data-active="true"[^>]*>([^<]*)</g)]
      .map((m) => m[1]);
  };
  for (const [path, label] of NAV) {
    const active = activeOn(path);
    expect(`${path} 只亮「${label}」`, active.length === 1 && active[0] === label);
    if (!(active.length === 1 && active[0] === label)) console.log('    实际亮着:', active.join(' / ') || '无');
  }

  /* 详情页与方向聚合页都属于「作品」，不能让导航全灭 */
  for (const path of ['/opspilot', '/category/agent']) {
    const active = activeOn(path);
    expect(`${path} 归到「作品」`, active.length === 1 && active[0] === '作品');
  }

  /* ---------- 主题按钮 ---------- */
  expect('主题按钮有明确的无障碍名称', /aria-label="切换到(浅色|深色)外观"/.test(home));
  expect('默认深色时提示切到浅色', home.includes('aria-label="切换到浅色外观"'));

  /* ---------- 抽屉：初始收起 ---------- */
  expect('初始不渲染抽屉', !home.includes('site-drawer'));
  expect('汉堡按钮有 aria-expanded="false"',
    /aria-expanded="false"[^>]*aria-label="打开菜单"|aria-label="打开菜单"[^>]*aria-expanded="false"/.test(home));

  /* ---------- 源码契约 ---------- */
  const src = read('src/app/Nav.jsx');
  expect('抽屉随路由变化收起', /useEffect\(\(\) => setOpen\(false\), \[pathname\]\)/.test(src));
  expect('抽屉打开时锁滚动', /document\.body\.style\.overflow = open \? 'hidden' : ''/.test(src));
  expect('抽屉支持 Esc 关闭', /e\.key === 'Escape'/.test(src));
  expect('抽屉是条件渲染（不常驻 DOM）', /\{open \? \(/.test(src));

  /* 旧的两级下拉面板已移除，别再回来：
     它当年在 position / pointer-events 上反复出问题，
     现在作品索引只在 /works 里，导航不需要再挂一份。 */
  expect('没有旧的下拉面板残留', !/nav-panel/.test(src));
  expect('没有旧的双层分组数据', !/columns/.test(src));

  /* 主题选择要能留在本地 */
  const app = read('src/app/App.jsx');
  expect('主题写回 localStorage', /localStorage\.setItem\(THEME_KEY/.test(app));
  expect('主题键名是 portfolio-theme-v2', /THEME_KEY = 'portfolio-theme-v2'/.test(app));

  /* ---------- 样式契约 ---------- */
  const ds = read('src/design-system.css');
  expect('顶部导航是 fixed/sticky', /\.site-header\s*\{[^}]*position:\s*(fixed|sticky)/.test(ds));
  expect('窄屏隐藏横向导航',
    /@media \(max-width: 900px\)[\s\S]{0,240}\.site-nav\s*\{[^}]*display:\s*none/.test(ds));
} catch (err) {
  console.log(err.stack?.split('\n').slice(0, 12).join('\n'));
  expect(`抛错: ${err.message}`, false);
} finally {
  await server.close().catch(() => {});
}

process.exit(report() ? 1 : 0);
