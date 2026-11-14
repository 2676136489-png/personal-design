/**
 * 浏览器入口。默认只挂 `src/v3/` 的重构版，界面上不再提供旧版入口。
 *
 * `?skin=legacy` 是不对访客露出的工程回退：136 条 SSR 冒烟与两套历史布局
 * 验证脚本仍挂在旧版 DOM 上，留着它才能继续跑回归、出问题时也能立刻切回来。
 *
 * ⚠️ 旧版 JS 与 CSS 都只在 legacy 分支动态加载。styles.css / design-system.css
 *    里有 body、h1、a 这类全局选择器，静态 import 会把新版一起染色；
 *    旧版 App 还会把 react-router 与六个旧页面带进首屏包，只有回退时才该付这份体积。
 *
 * ⚠️ 三套 SSR 冒烟脚本改为直接加载 `src/app/App.jsx`，不再从这里取具名导出。
 */
import { createRoot } from 'react-dom/client';
import Site3D from './v3/App.jsx';
import '@fontsource/kanit/300.css';
import '@fontsource/kanit/400.css';
import '@fontsource/kanit/500.css';
import '@fontsource/kanit/600.css';
import '@fontsource/kanit/700.css';
import '@fontsource/kanit/800.css';
import '@fontsource/kanit/900.css';
import './v3/site.css';

if (typeof document !== 'undefined' && document.getElementById('root')) {
  const legacy = new URLSearchParams(window.location.search).get('skin') === 'legacy';
  const root = createRoot(document.getElementById('root'));

  if (legacy) {
    Promise.all([
      import('./app/App.jsx'),
      import('./styles.css'),
      import('./design-system.css'),
      import('./tw.css'),
    ]).then(([{ default: App }]) => {
      root.render(<App />);
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
    root.render(<Site3D />);
  }
}
