/**
 * 浏览器入口：只做挂载与样式装配。
 * 应用本体在 src/app/App.jsx（路由、主题、转场、页面骨架）。
 *
 * 具名导出 App / AppShell 供服务端渲染冒烟测试使用；
 * 冒烟脚本用 MemoryRouter 包 AppShell，避免 HashRouter 在 Node 里读 window。
 */
import { createRoot } from 'react-dom/client';
import App, { AppShell, MemoryRouter } from './app/App.jsx';
import './styles.css';
import './design-system.css';
import './tw.css';

export { App, AppShell, MemoryRouter };

if (typeof document !== 'undefined' && document.getElementById('root')) {
  createRoot(document.getElementById('root')).render(<App />);
}
