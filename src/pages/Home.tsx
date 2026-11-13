/**
 * 首页（参考 CIRCUS Shanghai Inc 的首页叙事动效）
 *
 * - Hero 大版式：标题分两行，遮罩内自下而上错峰入场（进场时序，非滚动）；
 * - 右侧 SVG 轨道线：随滚动用 stroke-dashoffset 画出来（scrub，无自动播放）；
 * - 向下滚动时 Hero 内容整体退场（位移 + 透明度，scrub）；
 * - 下方五个入口按序淡入；不做粒子、不做发光。
 * - 移动端：关闭 scrub 退场与 SVG 绘制，只保留基础淡入。
 */
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useGsapScope, gsap, ScrollTrigger, reducedMotion, isMobile, revealChildren } from '../motion/scroll.tsx';
import { heroFacts, profile } from '../data.js';

const ENTRIES = [
  { to: '/works', label: '作品', note: '九个项目，从校园平台到对弈引擎', index: '01' },
  { to: '/campus-circle', label: '校园圈子', note: '正在运行的实名校园社交平台', index: '02' },
  { to: '/about', label: '关于', note: '教育背景、履历与做事方式', index: '03' },
  { to: '/skills', label: '能力', note: '四个方向的技术栈与证据', index: '04' },
  { to: '/contact', label: '联系', note: '邮箱、电话与 GitHub', index: '05' },
];

const TITLE_LINES = ['把还在纸上的想法，', '做成能跑起来的东西。'];

export default function Home() {
  const scopeRef = useGsapScope<HTMLDivElement>((scope) => {
    const titleLines = scope.querySelectorAll<HTMLElement>('[data-title-line]');
    const fadeItems = scope.querySelectorAll<HTMLElement>('[data-hero-fade]');

    if (!reducedMotion()) {
      /* 进场：标题自遮罩内升起，其余元素随后错开淡入 */
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      tl.fromTo(
        titleLines,
        { yPercent: 108, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.95, stagger: 0.12 },
        0.06,
      ).fromTo(
        fadeItems,
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.07 },
        0.42,
      );

      if (!isMobile()) {
        /* SVG 轨道线随滚动画出：初始留 15% 可见，画面不至于空 */
        const paths = scope.querySelectorAll<SVGGeometryElement>('[data-draw]');
        paths.forEach((path) => {
          gsap.fromTo(
            path,
            { strokeDashoffset: 0.85 },
            {
              strokeDashoffset: 0,
              ease: 'none',
              scrollTrigger: {
                trigger: scope,
                start: 'top top',
                end: 'bottom top',
                scrub: true,
              },
            },
          );
        });

        /* Hero 退场 */
        gsap.to(scope.querySelector('[data-hero-inner]'), {
          y: -96,
          opacity: 0.12,
          ease: 'none',
          scrollTrigger: {
            trigger: scope,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }
    }

    revealChildren(scope);
    ScrollTrigger.refresh();
  }, []);

  return (
    <div className="ds-page" ref={scopeRef}>
      {/* ============ Hero ============ */}
      <section className="hero-section">
        {/* 背景轨道线：随滚动绘制，静止时不闪 */}
        <svg
          aria-hidden
          className="hero-orbit"
          viewBox="0 0 640 640"
          style={{
            position: 'absolute',
            right: 'max(-120px, -8vw)',
            top: '12vh',
            width: 'min(52vw, 720px)',
            height: 'auto',
            opacity: 0.75,
            pointerEvents: 'none',
          }}
        >
          {[120, 210, 300].map((r, i) => (
            <circle
              key={r}
              data-draw
              cx="320"
              cy="320"
              r={r}
              pathLength={1}
              fill="none"
              stroke={i === 1 ? 'var(--accent-2)' : 'var(--accent)'}
              strokeOpacity={i === 1 ? 0.5 : 0.32}
              strokeWidth="1"
              strokeDasharray="1"
              strokeDashoffset="1"
            />
          ))}
          <path
            data-draw
            d="M 20 470 L 620 300"
            pathLength={1}
            fill="none"
            stroke="var(--accent)"
            strokeOpacity="0.28"
            strokeWidth="1"
            strokeDasharray="1"
            strokeDashoffset="1"
          />
        </svg>

        <div className="ds-wrap" data-hero-inner style={{ position: 'relative' }}>
          <p className="ds-eyebrow" data-hero-fade>
            {profile.education} · {profile.status} · {profile.city}
          </p>

          <h1 className="ds-display" style={{ maxWidth: '16ch' }}>
            {TITLE_LINES.map((line) => (
              <span
                key={line}
                style={{ display: 'block', overflow: 'hidden', paddingBottom: '0.06em' }}
              >
                <span data-title-line style={{ display: 'block' }}>
                  {line}
                </span>
              </span>
            ))}
          </h1>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 32,
              marginTop: 'clamp(28px, 5vh, 48px)',
            }}
          >
            <div data-hero-fade>
              <p className="ds-lede" style={{ maxWidth: '46ch' }}>
                {profile.name}，AI Agent 与后端开发方向。作品都在这里，点进去能看到取舍和实测数据。
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 28 }}>
                <Link className="ds-btn" to="/works">
                  查看作品
                  <ArrowRight size={16} />
                </Link>
                <Link className="ds-btn ds-btn--ghost" to="/resume">
                  个人简历
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>

            {/* 统计：数据来自 heroFacts，页面不手写数字 */}
            <dl
              data-hero-fade
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(120px, auto))',
                gap: '20px 40px',
                margin: 0,
                paddingTop: 20,
                borderTop: '1px solid var(--line)',
                minWidth: 'min(100%, 360px)',
              }}
            >
              {heroFacts.map((f) => (
                <div key={f.label}>
                  <dt className="ds-meta" style={{ letterSpacing: '0.14em' }}>
                    {f.label}
                  </dt>
                  <dd
                    className="ds-serif"
                    style={{ margin: '6px 0 0', fontSize: '1.65rem', color: 'var(--ink)' }}
                  >
                    {f.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ============ 入口 ============ */}
      <section className="ds-section" style={{ paddingTop: 0 }} data-reveal-group>
        <div className="ds-wrap">
          <div className="ds-kicker-row" data-r>
            <p className="ds-eyebrow" style={{ margin: 0 }}>
              Index
            </p>
            <span className="ds-meta">五个入口</span>
          </div>

          <div style={{ marginTop: 24, borderTop: '1px solid var(--line)' }}>
            {ENTRIES.map((entry, i) => (
              <Link
                key={entry.to}
                to={entry.to}
                data-r
                style={{
                  display: 'grid',
                  gridTemplateColumns: '56px 1fr auto',
                  alignItems: 'baseline',
                  gap: 16,
                  padding: 'clamp(18px, 3vh, 26px) 4px',
                  borderBottom: '1px solid var(--line)',
                  color: 'var(--ink)',
                }}
              >
                <span className="ds-index">{entry.index}</span>
                <span
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'baseline',
                    gap: '8px 24px',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'clamp(1.35rem, 2.6vw, 2rem)',
                      fontWeight: 650,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {entry.label}
                  </span>
                  <span className="ds-body" style={{ fontSize: 13, color: 'var(--muted)' }}>
                    {entry.note}
                  </span>
                </span>
                <ArrowUpRight
                  size={18}
                  style={{ color: 'var(--faint)', alignSelf: 'center' }}
                  aria-hidden
                />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
