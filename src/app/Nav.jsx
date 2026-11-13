/**
 * 全局导航：首页 / 作品 / 校园圈子 / 关于 / 能力 / 联系 / 简历。
 * 旧版的「全部作品 / 按方向」两级下拉已随信息架构简化移除 ——
 * 作品都在 /works 的横向画廊里，导航不需要再承载一份索引。
 * 移动端收进全屏抽屉。
 */
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { profile } from '../data.js';

const NAV = [
  { to: '/', label: '首页', match: (p) => p === '/' },
  { to: '/works', label: '作品', match: (p) => p === '/works' || p.startsWith('/category') || (!['/campus-circle', '/about', '/skills', '/contact', '/resume'].includes(p) && p !== '/') },
  { to: '/campus-circle', label: '校园圈子', match: (p) => p === '/campus-circle' },
  { to: '/about', label: '关于', match: (p) => p === '/about' },
  { to: '/skills', label: '能力', match: (p) => p === '/skills' },
  { to: '/contact', label: '联系', match: (p) => p === '/contact' },
];

export default function Nav({ theme, onToggleTheme }) {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* 路由变了就收起抽屉 */
  useEffect(() => setOpen(false), [pathname]);

  /* 抽屉打开时锁滚动 */
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  /* 全屏抽屉占满整屏，没有 Esc 就只能靠再点一次汉堡 —— 补上 */
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="site-header" data-scrolled={scrolled}>
      <div className="site-nav-inner">
        <Link className="site-brand" to="/" aria-label={`${profile.name}作品集首页`}>
          {profile.name}
          <span>Portfolio</span>
        </Link>

        <nav className="site-nav" aria-label="主导航">
          {NAV.map((item) => (
            <Link
              key={item.to}
              className="site-nav-link"
              to={item.to}
              data-active={item.match(pathname)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            className="site-nav-link"
            to="/resume"
            data-active={pathname === '/resume'}
          >
            简历
          </Link>
        </nav>

        <div className="site-nav-tools">
          <button
            className="site-icon-btn"
            type="button"
            aria-label={theme === 'light' ? '切换到深色外观' : '切换到浅色外观'}
            onClick={onToggleTheme}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button
            className="site-icon-btn site-icon-btn--menu"
            type="button"
            aria-label={open ? '关闭菜单' : '打开菜单'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="site-drawer">
          {[...NAV, { to: '/resume', label: '简历' }].map((item) => (
            <Link key={item.to} to={item.to}>
              {item.label}
              <span className="ds-index">→</span>
            </Link>
          ))}
        </div>
      ) : null}
    </header>
  );
}
