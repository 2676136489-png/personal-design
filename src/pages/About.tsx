/**
 * /about 关于（复用全局设计系统）
 * - 履历时间线逐条显现；
 * - 教育、荣誉两块信息卡；
 * - 图文分栏，图片做弱视差（移动端关闭）。
 */
import { Link } from 'react-router-dom';
import { ArrowUpRight, GraduationCap, MapPin } from 'lucide-react';
import {
  gsap,
  isMobile,
  reducedMotion,
  revealChildren,
  useGsapScope,
} from '../motion/scroll.tsx';
import { projects, profile, resume, timeline } from '../data.js';

const research = projects.find((p) => p.slug === 'research');
const gomoku = projects.find((p) => p.slug === 'gomoku');

export default function About() {
  const scopeRef = useGsapScope<HTMLDivElement>((scope) => {
    if (!reducedMotion() && !isMobile()) {
      /* 弱视差：图片在容器内上下浮动 ±6%，幅度刻意压小 */
      scope.querySelectorAll('[data-parallax-img]').forEach((box) => {
        const img = box.querySelector('img');
        if (!img) return;
        gsap.fromTo(
          img,
          { yPercent: -6 },
          {
            yPercent: 6,
            ease: 'none',
            scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
      });
    }
    revealChildren(scope);
  }, []);

  return (
    <div className="ds-page" ref={scopeRef}>
      {/* ============ 简介 ============ */}
      <header className="ds-wrap" style={{ paddingTop: 'calc(var(--nav-height) + 56px)' }}>
        <div data-reveal-group>
          <p className="ds-eyebrow" data-r>
            About
          </p>
          <div
            className="ds-split about-hero-grid"
            style={{
              '--split': 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
              '--split-gap': 'clamp(32px, 5vw, 80px)',
            }}
          >
            <div>
              <h1 className="ds-display" data-r style={{ fontSize: 'clamp(2.4rem, 5.6vw, 4.6rem)' }}>
                {profile.name}
              </h1>
              <p className="ds-lede" data-r style={{ marginTop: 24 }}>
                {resume.summary}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 28 }} data-r>
                <Link className="ds-btn" to="/resume">
                  查看简历
                  <ArrowUpRight size={16} />
                </Link>
                <Link className="ds-btn ds-btn--ghost" to="/contact">
                  联系我
                </Link>
              </div>
            </div>

            {/* 名片 */}
            <aside className="ds-card" data-r style={{ padding: 24 }}>
              <p className="ds-eyebrow" style={{ marginBottom: 16 }}>
                Profile
              </p>
              <dl style={{ margin: 0, display: 'grid', gap: 14 }}>
                <Row icon={<GraduationCap size={15} />} k="教育" v={profile.education} />
                <Row icon={<MapPin size={15} />} k="坐标" v={`${profile.city} · ${profile.hometown}`} />
                <Row k="状态" v={profile.status} />
                <Row k="方向" v="AI Agent / 后端开发实习" />
                <Row k="更新" v={resume.updated} />
              </dl>
            </aside>
          </div>
        </div>
      </header>

      {/* ============ 个人经历 ============ */}
      <section className="ds-section" data-reveal-group>
        <div className="ds-wrap">
          <p className="ds-eyebrow" data-r>
            Story
          </p>
          <div
            className="ds-split about-story-grid"
            style={{ '--split-gap': 'clamp(32px, 5vw, 72px)' }}
          >
            <div>
              {resume.advantages.map((line, i) => (
                <p
                  key={line}
                  className="ds-body"
                  data-r
                  style={{
                    marginBottom: 18,
                    paddingLeft: 20,
                    borderLeft: '1px solid var(--line)',
                  }}
                >
                  <span className="ds-index" style={{ marginRight: 10 }}>
                    0{i + 1}
                  </span>
                  {line}
                </p>
              ))}
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              {[research, gomoku].filter(Boolean).map((p) => (
                <figure
                  key={p.id}
                  data-parallax-img
                  data-r
                  style={{
                    margin: 0,
                    overflow: 'hidden',
                    borderRadius: 'var(--radius-ds)',
                    border: '1px solid var(--line)',
                  }}
                >
                  <img
                    src={p.image}
                    alt={`${p.title} 界面`}
                    loading="lazy"
                    style={{ width: '100%', height: 260, objectFit: 'cover', display: 'block' }}
                  />
                  <figcaption
                    style={{
                      padding: '10px 14px',
                      fontSize: 12,
                      color: 'var(--muted)',
                      borderTop: '1px solid var(--line)',
                    }}
                  >
                    {p.title} · {p.category}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ 履历时间线 ============ */}
      <section className="ds-section" style={{ paddingTop: 0 }} data-reveal-group>
        <div className="ds-wrap">
          <div className="ds-kicker-row" data-r>
            <p className="ds-eyebrow" style={{ margin: 0 }}>
              Timeline
            </p>
            <span className="ds-meta">按项目体量排</span>
          </div>

          <ol style={{ margin: '24px 0 0', padding: 0, listStyle: 'none', borderTop: '1px solid var(--line)' }}>
            {timeline.map((item) => (
              <li
                key={`${item.year}-${item.title}`}
                data-r
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px minmax(0, 1fr)',
                  gap: 20,
                  padding: '22px 0',
                  borderBottom: '1px solid var(--line)',
                }}
              >
                <span className="ds-serif" style={{ fontSize: 15, color: 'var(--faint)' }}>
                  {item.year}
                </span>
                <div>
                  <h3 className="ds-h3">{item.title}</h3>
                  <p className="ds-body" style={{ marginTop: 6, fontSize: 13.5 }}>
                    {item.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============ 教育与荣誉 ============ */}
      <section className="ds-section" style={{ paddingTop: 0 }} data-reveal-group>
        <div className="ds-wrap">
          <div className="ds-split about-edu-grid" style={{ '--split-gap': '24px' }}>
            <div className="ds-card" data-r style={{ padding: 28 }}>
              <p className="ds-eyebrow" style={{ marginBottom: 18 }}>
                Education
              </p>
              {resume.education.map((e) => (
                <div key={e.school}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <h3 className="ds-h3">{e.school}</h3>
                    <span className="ds-meta">{e.period}</span>
                  </div>
                  <p className="ds-body" style={{ marginTop: 6 }}>
                    {e.major} · {e.gpa}
                  </p>
                  <ul style={{ margin: '14px 0 0', padding: 0, listStyle: 'none' }}>
                    {e.points.map((pt) => (
                      <li
                        key={pt}
                        style={{
                          fontSize: 13.5,
                          lineHeight: 1.85,
                          color: 'var(--muted)',
                          borderTop: '1px solid var(--line)',
                          padding: '8px 0',
                        }}
                      >
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="ds-card" data-r style={{ padding: 28 }}>
              <p className="ds-eyebrow" style={{ marginBottom: 18 }}>
                Honors
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {resume.honors.map((h) => (
                  <li
                    key={h.title}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 16,
                      padding: '12px 0',
                      borderTop: '1px solid var(--line)',
                      fontSize: 14,
                    }}
                  >
                    <span style={{ color: 'var(--ink)' }}>{h.title}</span>
                    <span className="ds-meta" style={{ flexShrink: 0 }}>
                      {h.period || '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Row({ k, v, icon }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
      <dt
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          letterSpacing: '0.08em',
          color: 'var(--faint)',
        }}
      >
        {icon}
        {k}
      </dt>
      <dd style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-soft)', textAlign: 'right' }}>
        {v}
      </dd>
    </div>
  );
}
