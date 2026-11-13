/**
 * 浏览器入口。默认只挂 `src/v3/` 的重构版，界面上不再提供旧版入口。
 *
 * `?skin=legacy` 是不对访客露出的工程回退：136 条 SSR 冒烟与两套历史布局
 * 验证脚本仍挂在旧版 DOM 上，留着它才能继续跑回归、出问题时也能立刻切回来。
 * 想连这段代码一起删，得先把那批断言迁走。
 *
 * ⚠️ 旧版 CSS 只在 legacy 分支动态加载。styles.css / design-system.css 里有
 *    body、h1、a 这类全局选择器，静态 import 会把新版一起染色。
 *    新版 site.css 的所有选择器都挂在 .v3 下，反过来不会污染旧版。
 *
 * ⚠️ AppShell / MemoryRouter 必须保持静态具名导出：
 *    smoke-render / smoke-nav / smoke-lightbox 用 SSR 逐条渲染旧版路由，
 *    这 136 条断言钉在旧版 DOM 上，不随皮肤开关变化。
 */
import { createRoot } from 'react-dom/client';
import App, { AppShell, MemoryRouter } from './app/App.jsx';
import Site3D from './v3/App.jsx';
import '@fontsource/kanit/300.css';
import '@fontsource/kanit/400.css';
import '@fontsource/kanit/500.css';
import '@fontsource/kanit/600.css';
import '@fontsource/kanit/700.css';
import '@fontsource/kanit/800.css';
import '@fontsource/kanit/900.css';
import './v3/site.css';

export { App, AppShell, MemoryRouter };

if (typeof document !== 'undefined' && document.getElementById('root')) {
  const legacy = new URLSearchParams(window.location.search).get('skin') === 'legacy';
  const mount = () => createRoot(document.getElementById('root')).render(legacy ? <App /> : <Site3D />);

  if (legacy) {
    Promise.all([
      import('./styles.css'),
      import('./design-system.css'),
      import('./tw.css'),
    ]).then(() => {
      mount();
      /* 旧版留一个回到新版的入口。URL 要保留 sharecode 等查询参数，
         裸域名在托管平台上会被网关挡住。 */
      const back = new URL(window.location.href);
      back.searchParams.delete('skin');
      const badge = document.createElement('a');
      badge.className = 'v3-legacy-badge';
      badge.href = back.toString();
      badge.textContent = '新版 →';
      document.body.appendChild(badge);
    });
  } else {
    mount();
  }
}
