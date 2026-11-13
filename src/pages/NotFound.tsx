/**
 * 404：地址找不到时给两个出口，不堆装饰。
 */
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="ds-page">
      <section
        className="ds-wrap"
        style={{
          minHeight: '70svh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          paddingTop: 'var(--nav-height)',
        }}
      >
        <p className="ds-eyebrow">404</p>
        <h1 className="ds-display" style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)' }}>
          这页不存在
        </h1>
        <p className="ds-lede" style={{ marginTop: 20 }}>
          地址可能改过，或者链接拼错了。作品都在「作品」页里，也可以直接回首页。
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
          <Link className="ds-btn" to="/">
            <ArrowLeft size={16} />
            回到首页
          </Link>
          <Link className="ds-btn ds-btn--ghost" to="/works">
            去看作品
          </Link>
        </div>
      </section>
    </div>
  );
}
