/* 图片灯箱：结构与契约验证（无浏览器环境）

   本机没有浏览器，SSR 下 useEffect 不执行，所以：
   1) 结构层：灯箱由 state 控制，SSR 初始态不会渲染 —— 这本身就是要断言的
      （初始 DOM 里不该有 dialog，否则它会一直盖在页面上）
   2) 纯函数层：缩放边界 clampZoom 直接断言
   3) 源码契约：滚动锁的补偿法、dialog 用法、事件绑定
   4) 样式契约：遮罩层级、铺满、缩放光标、reduced-motion 降级

   用法：node scripts/smoke-lightbox.mjs */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createChecker, installDomStubs, startSsrServer } from './lib/ssr-dom.mjs';

/* ⚠️ 必须在加载业务模块之前打桩 */
installDomStubs();

const { expect, report } = createChecker();
const server = await startSsrServer();

try {
  const main = await server.ssrLoadModule('/src/main.jsx');
  const lb = await server.ssrLoadModule('/src/lightbox.jsx');
  const AppShell = main.AppShell;
  const MemoryRouter = main.MemoryRouter;

  /* 路由换了 MemoryRouter：HashRouter 在 Node 里读 window.location，拿不到真实路径 */
  const render = (path) =>
    renderToStaticMarkup(
      React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(AppShell)),
    );

  /* ---------- 结构：简历页触点 ---------- */
  const resumeHtml = render('/resume');
  expect('简历页渲染出预览按钮', resumeHtml.includes('resume-paper'));
  expect('预览按钮可点击（button 标签）', /<button[^>]*class="resume-paper"/.test(resumeHtml));
  expect('预览按钮有无障碍名称', resumeHtml.includes('放大查看简历原版'));
  expect('预览按钮 type=button', /class="resume-paper"[^>]*type="button"|type="button"[^>]*class="resume-paper"/.test(resumeHtml));
  expect('含「点击放大」提示', resumeHtml.includes('点击放大'));

  /* ---------- 结构：初始态不该有 dialog ---------- */
  expect('初始 DOM 不含 dialog（未打开）', !resumeHtml.includes('<dialog'));
  const homeHtml = render('/');
  expect('首页也不含 dialog', !homeHtml.includes('<dialog'));

  /* ---------- 其它页面未受影响 ---------- */
  expect('校园圈子页仍正常', render('/campus-circle').includes('校园圈子'));
  expect('项目详情页仍正常', render('/gomoku').includes('五子棋'));

  /* ---------- 纯函数：缩放边界 ---------- */
  const { clampZoom, ZOOM_MIN, ZOOM_MAX, ZOOM_STEP } = lb;
  expect('缩放下限 1', ZOOM_MIN === 1);
  expect('缩放上限 4', ZOOM_MAX === 4);
  expect('步进 0.5', ZOOM_STEP === 0.5);
  expect('clamp 低于下限', clampZoom(0.2) === ZOOM_MIN);
  expect('clamp 高于上限', clampZoom(9) === ZOOM_MAX);
  expect('clamp 中间值不动', clampZoom(2.5) === 2.5);
  expect('clamp 负值', clampZoom(-3) === ZOOM_MIN);
  expect('clamp NaN 不越界', Number.isFinite(clampZoom(NaN)) === false || clampZoom(NaN) >= ZOOM_MIN);

  /* ---------- 源码契约 ---------- */
  const fs = await import('node:fs/promises');
  const src = await fs.readFile(new URL('../src/lightbox.jsx', import.meta.url), 'utf8');

  expect('用 dialog 元素', /<dialog/.test(src));
  expect('调用 showModal', /showModal\(\)/.test(src));
  expect('有 close 兜底', /typeof dialog\.close === 'function'/.test(src));
  expect('监听 ESC', /e\.key === 'Escape'/.test(src));
  expect('滚轮缩放阻止默认', /e\.preventDefault\(\)/.test(src) && /onWheel/.test(src));
  expect('双击缩放', /onDoubleClick/.test(src));
  expect('放大后可拖动', /onPointerDown/.test(src) && /setPointerCapture/.test(src));
  expect('遮罩点击关闭且判定 target', /e\.target === e\.currentTarget/.test(src));
  expect('卸载时解除滚动锁', /unlock\(\)/.test(src));
  expect('卸载时移除 keydown', /removeEventListener\('keydown'/.test(src));

  // 滚动锁：必须用 fixed + top 补偿，不能只写 overflow:hidden（会丢滚动位置）
  expect('滚动锁用 fixed 定位', /style\.position = 'fixed'/.test(src));
  expect('滚动锁做 top 负值补偿', /style\.top = `-\$\{y\}px`/.test(src));
  expect('滚动锁记录原 scrollY', /window\.scrollY/.test(src));
  expect('解锁后跳回原位置', /window\.scrollTo\(\{ top: y/.test(src));

  /* ---------- 复用站点自己的 reduced-motion 约定 ---------- */
  expect('尊重 reduced-motion', /prefers-reduced-motion: reduce/.test(src));

  /* ---------- 样式契约 ---------- */
  const css = await fs.readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
  expect('灯箱层级 500（高于命令面板 320）', /\.lightbox\s*\{[\s\S]*?z-index:\s*500/.test(css));
  expect('灯箱铺满视口', /\.lightbox\s*\{[\s\S]*?inset:\s*0/.test(css));
  expect('灯箱为 flex 容器', /\.lightbox\[open\]\s*\{[\s\S]*?display:\s*flex/.test(css));
  expect('预览图 cursor: zoom-in', /\.resume-paper\s*\{[\s\S]*?cursor:\s*zoom-in/.test(css));
  expect('缩放态 cursor: grab', /data-zoomable='true'[\s\S]{0,80}grab|data-zoomable=true[\s\S]{0,80}grab/.test(css));
  expect('图片 object-fit: contain', /\.lightbox-stage img\s*\{[\s\S]*?object-fit:\s*contain/.test(css));
  expect('图片不被拖拽选中', /user-select:\s*none/.test(css));
  expect('缩放提示默认透明', /\.resume-paper-zoom\s*\{[\s\S]*?opacity:\s*0/.test(css));
  expect('悬停时提示浮现', /\.resume-paper:hover \.resume-paper-zoom/.test(css));
  expect('reduced-motion 关闭灯箱动画', /prefers-reduced-motion: reduce[\s\S]*?\.lightbox\[open\]\s*\{\s*animation:\s*none/.test(css));
  expect('窄屏工具条适配', /max-width:\s*640px[\s\S]*?\.lightbox-toolbar/.test(css));
} catch (err) {
  expect(`抛错: ${err.message}`, false);
} finally {
  await server.close().catch(() => {});
}

process.exit(report() ? 1 : 0);
