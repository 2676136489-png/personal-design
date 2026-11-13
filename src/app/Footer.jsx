/**
 * 页脚：站点地图 + 联系入口 + 回到顶部。
 * 不放装饰性元素，保持与正文一致的字号层级。
 */
import { Link } from 'react-router-dom';
import { ArrowUpRight, Github, Mail } from 'lucide-react';
import { profile } from '../data.js';

const LINKS = [
  { to: '/works', label: '作品' },
  { to: '/campus-circle', label: '校园圈子' },
  { to: '/about', label: '关于' },
  { to: '/skills', label: '能力' },
  { to: '/contact', label: '联系' },
  { to: '/resume', label: '简历' },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="ds-wrap">
        <div className="site-footer-grid">
          <div>
            <p className="ds-eyebrow" style={{ marginBottom: 12 }}>
              {profile.name} · Portfolio
            </p>
            <p className="ds-body" style={{ maxWidth: '34ch' }}>
              {profile.tagline}
            </p>
          </div>

          <nav className="site-footer-links" aria-label="页脚导航">
            {LINKS.map((l) => (
              <Link key={l.to} to={l.to} className="ds-underline">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="site-footer-links">
            <a className="ds-underline" href={`mailto:${profile.email}`}>
              <Mail size={13} style={{ marginRight: 6, verticalAlign: '-2px' }} />
              {profile.email}
            </a>
            <a
              className="ds-underline"
              href={profile.github}
              target="_blank"
              rel="noreferrer noopener"
            >
              <Github size={13} style={{ marginRight: 6, verticalAlign: '-2px' }} />
              GitHub
            </a>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            marginTop: 40,
            paddingTop: 20,
            borderTop: '1px solid var(--line)',
            fontSize: 12,
            color: 'var(--faint)',
          }}
        >
          <span>© {new Date().getFullYear()} {profile.name}</span>
          <button
            type="button"
            className="site-icon-btn"
            style={{ width: 'auto', borderRadius: 8, gap: 6, fontSize: 12 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="回到顶部"
          >
            回到顶部
            <ArrowUpRight size={13} style={{ transform: 'rotate(-45deg)' }} />
          </button>
        </div>
      </div>
    </footer>
  );
}
