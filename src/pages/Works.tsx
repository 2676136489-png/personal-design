/**
 * /works 全部作品（参考 Akaru-2 Lateral Slider）
 *
 * 行为：
 * - 画廊区进入视口后由 ScrollTrigger pin 锁定，纵向滚动驱动内部横向位移
 *   （scrub: 1），松手/停止滚动后 snap 吸附到最近一屏；离开区块自动解除 pin；
 * - 鼠标可拖拽：按下后按 1:1 映射到页面滚动量（因为 pin 期间的纵向滚动
 *   就是横向位移），松手交给 snap 收尾；
 * - 卡片点击跳对应项目详情；拖拽超过 6px 时拦截那次 click，避免误跳；
 * - 移动端（<768px）完全关闭 pin 与拖拽，降级为 Bento 垂直网格，只保留淡入；
 * - 组件卸载时 gsap.context revert，所有 ScrollTrigger 一并销毁。
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MoveHorizontal } from 'lucide-react';
import {
  gsap,
  ScrollTrigger,
  isMobile,
  reducedMotion,
  revealChildren,
  useGsapScope,
} from '../motion/scroll.tsx';
import { campus, projects } from '../data.js';

/* campus 是独立数据源，映射成统一的 slide 形状放第一屏（旗舰位） */
const SLIDES = [
  {
    id: 'campus',
    title: campus.name,
    meta: `${campus.en} · ${campus.period}`,
    description: campus.lede,
    image: campus.cover,
    github: campus.github,
    site: campus.site,
    to: '/campus-circle',
    accent: campus.accent,
    ink: campus.accentInk,
  },
  ...projects.map((p) => ({
    id: p.id,
    title: p.title,
    meta: `${p.category} · ${p.year}`,
    description: p.description,
    image: p.image,
    github: p.github,
    site: p.site,
    to: `/${p.slug}`,
    accent: p.accent,
    ink: p.accentInk,
  })),
];

const N = SLIDES.length;
const STRIDE_RATIO = 0.91; /* 每屏宽 91vw，右缘露出下一屏的一条 */

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export default function Works() {
  const [mobile, setMobile] = useState(() => isMobile());

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = (e) => setMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <div className="ds-page">
      {/* 页头：随页面正常滚走，pin 从画廊带开始 */}
      <header className="ds-wrap" style={{ paddingTop: 'calc(var(--nav-height) + 56px)' }}>
        <p className="ds-eyebrow">Selected Projects</p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 24,
          }}
        >
          <h1 className="ds-display" style={{ fontSize: 'clamp(2.4rem, 6vw, 5rem)' }}>
            作品
          </h1>
          <p className="ds-meta" style={{ paddingBottom: 8 }}>
            {N} 个项目 · 2024 — 2026
          </p>
        </div>
        <p className="ds-lede" style={{ marginTop: 20 }}>
          {mobile
            ? '点开任何一个都能看详情。封面是线上站点的真实界面，详情页里写了取舍和实测数据。'
            : '每屏一个项目。左边一句话说明，右边是它自己的主题色画板，封面是线上站点截图。拖拽、滚轮或右下角箭头都能翻页。'}
        </p>
      </header>

      {mobile ? <BentoGrid /> : <LateralGallery />}
    </div>
  );
}

/* ================= 移动端 Bento ================= */

function BentoGrid() {
  const scopeRef = useGsapScope<HTMLDivElement>((scope) => {
    revealChildren(scope);
  }, []);

  return (
    <div className="works-bento" ref={scopeRef} data-reveal-group>
      {SLIDES.map((s, i) => {
        const lead = i === 0 || i === N - 1;
        return (
          <Link
            key={s.id}
            to={s.to}
            data-r
            className="works-bento-card"
            style={{ gridColumn: lead ? '1 / -1' : 'auto' }}
          >
            <img
              src={s.image}
              alt={`${s.title} 界面`}
              loading={i < 2 ? 'eager' : 'lazy'}
              decoding="async"
              style={{ height: lead ? 232 : 190 }}
            />
            <div className="works-bento-copy">
              <p className="works-bento-meta">{s.meta}</p>
              <h2 className="works-bento-title" style={{ fontSize: lead ? 20 : 17 }}>
                {s.title}
              </h2>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/* ================= 桌面：pin 横滚 ================= */

function LateralGallery() {
  const navigate = useNavigate();
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const stRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0, moved: false });
  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);

  const goTo = (i) => {
    const st = stRef.current;
    if (!st) return;
    const n = clamp(i, 0, N - 1);
    const max = st.end - st.start;
    const progress = N > 1 ? n / (N - 1) : 0;
    window.scrollTo({ top: st.start + progress * max, behavior: 'smooth' });
  };

  const scopeRef = useGsapScope<HTMLDivElement>((scope) => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    const band = bandRef.current;
    if (!track || !viewport || !band) return;

    const travel = () => Math.max(0, track.scrollWidth - viewport.clientWidth);

    /* 吸附：滚动停止 180ms 后落到最近一屏。
       不用 ScrollTrigger 内置 snap —— 实测它在单次大跳跃时
       传给 snapTo 的 progress 与实际几何不一致（y=1400 却按 0.37 计算），
       落点会跳到第 4 屏。这里以 self.progress（权威值）为准自己算。 */
    let snapTimer = 0;
    const snapToNearest = (progress) => {
      const st = stRef.current;
      if (!st) return;
      const n = clamp(Math.round(progress * (N - 1)), 0, N - 1);
      const target = N > 1 ? n / (N - 1) : 0;
      if (Math.abs(target - progress) < 0.0008) return;
      window.scrollTo({ top: st.start + target * (st.end - st.start), behavior: 'smooth' });
    };
    const scheduleSnap = (progress) => {
      if (dragRef.current.active) return;
      clearTimeout(snapTimer);
      snapTimer = setTimeout(() => snapToNearest(progress), 180);
    };

    const tween = gsap.to(track, {
      x: () => -travel(),
      ease: 'none',
      scrollTrigger: {
        trigger: band,
        start: 'top top',
        end: () => `+=${travel()}`,
        pin: true,
        anticipatePin: 1,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const i = Math.round(self.progress * (N - 1));
          setIndex((prev) => (prev === i ? prev : i));
          scheduleSnap(self.progress);
        },
        onRefresh: (self) => {
          stRef.current = self;
        },
      },
    });
    stRef.current = tween.scrollTrigger;

    /* 拖拽：1px 横移 = 1px 页面滚动（pin 期间纵向滚动即横向位移） */
    const onDown = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragRef.current = {
        active: true,
        startX: e.clientX,
        startScroll: window.scrollY,
        moved: false,
      };
      setDragging(true);
      try {
        viewport.setPointerCapture(e.pointerId);
      } catch {
        /* 合成事件下 capture 会失败，拖拽逻辑不依赖它 */
      }
    };
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d.active) return;
      const dx = e.clientX - d.startX;
      if (Math.abs(dx) > 4) d.moved = true;
      /* 拖拽期间必须用 instant：站点全局开了 scroll-behavior: smooth，
         逐帧 scrollTo 带平滑会拖出长长的延迟。 */
      window.scrollTo({ top: d.startScroll - dx, behavior: 'instant' });
    };
    const onUp = () => {
      if (!dragRef.current.active) return;
      dragRef.current.active = false;
      setDragging(false);
      const st = stRef.current;
      if (st) {
        const progress = clamp((window.scrollY - st.start) / Math.max(1, st.end - st.start), 0, 1);
        scheduleSnap(progress);
      }
    };
    viewport.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    /* 拖拽结束后拦截误触 click；点击非链接区域则整屏跳详情 */
    const onClickCapture = (e) => {
      if (dragRef.current.moved) {
        e.preventDefault();
        e.stopPropagation();
        dragRef.current.moved = false;
        return;
      }
      if (e.target.closest('a, button')) return;
      const slide = e.target.closest('[data-slide]');
      if (!slide) return;
      const to = slide.getAttribute('data-to');
      if (to) navigate(to);
    };
    viewport.addEventListener('click', onClickCapture, true);

    revealChildren(scope);

    return () => {
      clearTimeout(snapTimer);
      viewport.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      viewport.removeEventListener('click', onClickCapture, true);
    };
  }, []);

  return (
    <div ref={scopeRef}>
      {/* pin 区：整块高度一屏，内部横滚 */}
      <div
        ref={bandRef}
        className="works-band"
        style={{ height: '100svh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
      >
        <div
          ref={viewportRef}
          className="works-viewport"
          data-dragging={dragging}
          style={{ paddingTop: 'var(--nav-height)' }}
        >
          <div ref={trackRef} className="works-track">
            {SLIDES.map((s, i) => (
              <div
                key={s.id}
                className="works-slide"
                data-slide
                data-to={s.to}
                style={{ width: `${STRIDE_RATIO * 100}vw` }}
              >
                <SlideBlock slide={s} index={i} />
              </div>
            ))}
          </div>
        </div>

        <div className="works-foot">
          <div className="works-counter">
            <strong>{String(index + 1).padStart(2, '0')}</strong>
            <span>— {String(N).padStart(2, '0')}</span>
            <span className="works-progress" aria-hidden>
              <i style={{ width: `${((index + 1) / N) * 100}%` }} />
            </span>
          </div>
          <p
            className="works-hint"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              margin: 0,
              fontSize: 12,
              color: 'var(--band-muted)',
            }}
          >
            <MoveHorizontal size={14} aria-hidden />
            拖拽翻页，滚轮也可以
          </p>
          <div className="works-arrows">
            <button
              type="button"
              className="works-arrow"
              aria-label="上一屏"
              disabled={index === 0}
              onClick={() => goTo(index - 1)}
            >
              <ArrowLeft size={18} />
            </button>
            <button
              type="button"
              className="works-arrow"
              aria-label="下一屏"
              disabled={index === N - 1}
              onClick={() => goTo(index + 1)}
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= 单屏 ================= */

function SlideBlock({ slide, index }) {
  const next = SLIDES[(index + 1) % N];
  const next2 = SLIDES[(index + 2) % N];
  const inkColor = slide.ink === 'light' ? 'rgba(255,255,255,0.92)' : 'var(--band-ink)';
  const softInk = slide.ink === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(20,24,29,0.6)';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '41.8% 48.3% 6.6% 3.3%',
        height: 'min(72svh, 720px)',
        userSelect: 'none',
      }}
    >
      {/* 左：信息面板 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 'clamp(24px, 3.4vw, 48px)',
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--band-muted)',
            }}
          >
            {slide.meta}
          </p>
          <h2
            style={{
              margin: '24px 0 0',
              fontSize: 'clamp(2rem, 4.4vw, 4.2rem)',
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: '-0.03em',
              color: 'var(--band-ink)',
            }}
          >
            <Link to={slide.to} style={{ color: 'inherit' }}>
              {slide.title}
            </Link>
          </h2>
          <p
            style={{
              margin: '24px 0 0',
              maxWidth: '38ch',
              fontSize: 14,
              lineHeight: 1.85,
              color: 'var(--band-muted)',
            }}
          >
            {slide.description}
          </p>
        </div>

        {/* 底部链接行 */}
        <div style={{ marginTop: 32, borderTop: '1px solid rgba(20,24,29,0.16)', paddingTop: 16 }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            {slide.github && (
              <a
                href={slide.github}
                target="_blank"
                rel="noreferrer noopener"
                style={linkStyle}
              >
                GitHub
              </a>
            )}
            {slide.site && (
              <a href={slide.site} target="_blank" rel="noreferrer noopener" style={linkStyle}>
                访问站点
              </a>
            )}
            <Link to={slide.to} style={linkStyle}>
              查看详情
            </Link>
            <span
              className="ds-serif"
              style={{ fontSize: 16, color: 'rgba(20,24,29,0.35)' }}
            >
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* 右：主题色画板 + 封面 */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: slide.accent,
          color: inkColor,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '9%',
            bottom: '9%',
            left: '10%',
            width: '80%',
          }}
        >
          <img
            src={slide.image}
            alt={`${slide.title} 项目预览`}
            draggable={false}
            loading={index < 2 ? 'eager' : 'lazy'}
            decoding="async"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <span
          style={{
            position: 'absolute',
            left: '10%',
            bottom: 16,
            fontSize: 11,
            letterSpacing: '0.25em',
            color: softInk,
          }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* 竖条 1：下一屏主题色 + 封面小图 */}
      <div style={{ position: 'relative', overflow: 'hidden', background: next.accent }}>
        <img
          src={next.image}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          style={{ marginTop: 24, width: '100%', height: '36%', objectFit: 'cover', opacity: 0.9 }}
        />
      </div>

      {/* 竖条 2：再下一屏主题色 */}
      <div style={{ height: '100%', background: next2.accent }} />
    </div>
  );
}

const linkStyle = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'var(--band-ink)',
};
