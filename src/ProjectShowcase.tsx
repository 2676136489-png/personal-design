/**
 * 「我的项目」—— 完全复刻 Awwwards Akaru（akaru.fr）Lateral Slider 的设计：
 *
 *   [ 米白信息面板 | 主题色主画板 | 下一项目色竖条 | 再下一条竖条 ]
 *    └ 每一屏一个项目，整屏横向翻页，页码 01—09 与细进度条跟随，
 *      圆形箭头按钮 / 拖拽 / 滚轮 / 键盘四种翻页方式，无任何自动播放。
 *
 * 复刻要点（对照 Akaru 首页截图）：
 * - 左面板：米白底、超大黑体项目名、小字 meta 行、底部带 1px 上边框的
 *   链接行（仿 INSTAGRAM / LINKED IN 那一行）；
 * - 右画板：项目主题色大色块 + 直角封面图，右缘露出后两条不同色的
 *   窄竖条（分别是下两个项目的主题色），多屏连起来就是 Akaru 的
 *   多色列拼贴效果；
 * - 页码小字在左下角，当前页用衬线体放大。
 *
 * 交互模型：
 * - 拖拽 / 箭头 / 键盘：目标偏移 + gsap.ticker 每帧 lerp 收敛（丝滑）；
 * - 滚轮：累积阈值翻页（连续滚动一次只翻一屏，带冷却）；
 * - 松手后按位移与速度吸附到最近一屏（snap）；
 * - <768px 降级为垂直单列，横向逻辑整段不挂载；
 * - gsap 缺失降级原生滚动；prefers-reduced-motion 关闭平滑与视差；
 * - 卸载时完整清理。
 */
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowLeft, ArrowRight, MoveHorizontal } from 'lucide-react';
import { campus, projects } from './data.js';

/* ============ 数据 ============ */

interface Slide {
  id: string;
  title: string;
  meta: string;
  description: string;
  image: string;
  github?: string;
  site?: string;
  detailHref?: string;
  accent: string;
  accentInk: 'light' | 'dark';
}

/* campus 是独立数据源（不在 projects 数组），字段名不同，
   先映射成统一的 slide 形状，campus 放第一屏（旗舰位）。 */
const SLIDES: Slide[] = [
  {
    id: 'campus',
    title: campus.name,
    meta: `${campus.en} · ${campus.period}`,
    description: campus.lede,
    image: campus.cover,
    github: campus.github,
    site: campus.site,
    detailHref: '#/campus',
    accent: campus.accent,
    accentInk: campus.accentInk,
  },
  ...projects.map((p) => ({
    id: p.id,
    title: p.title,
    meta: `${p.category} · ${p.year}`,
    description: p.description,
    image: p.image,
    github: p.github,
    site: p.site,
    detailHref: `#/${p.slug}`,
    accent: p.accent,
    accentInk: p.accentInk,
  })),
];

const N = SLIDES.length;
const MOBILE_QUERY = '(max-width: 767px)';
/** 翻页滚轮的触发阈值与冷却（ms）：连续滚动一次只翻一屏 */
const WHEEL_THRESHOLD = 120;
const WHEEL_COOLDOWN = 650;
/** 拖拽判定为「翻页意图」的最小位移比例（占屏宽） */
const SNAP_VELOCITY = 0.4;

export default function ProjectShowcase() {
  const [isMobile, setIsMobile] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <section id="work" className="showcase-band" style={{ background: '#F2EFE9' }}>
      {/* 板块顶行：左 eyebrow，右操作提示（仿 Akaru 首页的小字排布） */}
      <div className="tw-mx-auto tw-flex tw-max-w-[1400px] tw-items-center tw-justify-between tw-px-6 tw-pt-14 md:tw-px-10">
        <p className="tw-m-0 tw-text-xs tw-font-medium tw-tracking-[0.3em] tw-text-[#8a8578]">
          SELECTED PROJECTS
        </p>
        {!isMobile && (
          <p className="tw-m-0 tw-hidden tw-items-center tw-gap-2 tw-text-xs tw-text-[#8a8578] md:tw-flex">
            <MoveHorizontal size={14} aria-hidden />
            拖拽翻页，滚轮也可以
          </p>
        )}
      </div>

      {isMobile ? <VerticalList /> : <LateralSlider />}
    </section>
  );
}

/* ============ 移动端：垂直单列（无横向逻辑） ============ */

function VerticalList() {
  return (
    <div className="tw-px-6 tw-py-10">
      <div className="tw-space-y-10">
        {SLIDES.map((s, i) => (
          <SlideBlock key={s.id} slide={s} index={i} vertical />
        ))}
      </div>
    </div>
  );
}

/* ============ PC：整屏翻页 slider ============ */

function LateralSlider() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  /* 每一屏的宽度与总偏移上限，resize 时重算 */
  const metric = useRef({ stride: 0, max: 0 });
  const pos = useRef({ current: 0, target: 0 });
  const drag = useRef({ active: false, pointerId: -1, startX: 0, startTime: 0, startTarget: 0, moved: false, lastX: 0, lastT: 0, velocity: 0 });
  const wheel = useRef({ acc: 0, cooldownUntil: 0 });

  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [fallback, setFallback] = useState(false);

  /* gsap.ticker 每帧收敛 + 事件挂载 */
  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const hasGsap =
      typeof gsap !== 'undefined' &&
      typeof gsap.ticker?.add === 'function' &&
      typeof gsap.set === 'function' &&
      typeof gsap.to === 'function';
    if (!hasGsap) {
      setFallback(true);
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ease = reducedMotion ? 1 : 0.085;

    const measure = () => {
      const first = track.querySelector<HTMLElement>('[data-slide]');
      metric.current.stride = first ? first.offsetWidth : 0;
      metric.current.max = Math.max(0, track.scrollWidth - viewport.clientWidth);
      pos.current.target = clamp(pos.current.target, 0, metric.current.max);
      pos.current.current = clamp(pos.current.current, 0, metric.current.max);
    };
    measure();
    window.addEventListener('resize', measure);

    /* index → 页码与进度条（snap 落点实时跟随拖拽） */
    let lastIndex = -1;
    const tick = () => {
      try {
        const { current: s } = pos;
        s.current += (s.target - s.current) * ease;
        if (Math.abs(s.target - s.current) < 0.05) s.current = s.target;
        gsap.set(track, { x: -s.current });

        const i = metric.current.stride
          ? Math.round(s.current / metric.current.stride)
          : 0;
        if (i !== lastIndex && i >= 0 && i < N) {
          lastIndex = i;
          setIndex(i);
        }

        /* 视差：封面图随屏位微弱横移（reduced-motion 时关闭）。
            offsetLeft 是布局偏移，不受 transform 影响，不用重算布局。 */
        if (!reducedMotion) {
          const vw = viewport.clientWidth;
          track.querySelectorAll<HTMLElement>('[data-parallax]').forEach((node) => {
            const slide = node.closest<HTMLElement>('[data-slide]');
            const left = slide ? slide.offsetLeft : 0;
            const ratio = (left + (slide?.offsetWidth || 0) / 2 - s.current - vw / 2) / vw;
            gsap.set(node, { x: clamp(ratio * 18, -24, 24) });
          });
        }
      } catch {
        /* 单帧异常静默跳过，ticker 不中断 */
      }
    };
    gsap.ticker.add(tick);

    /* 吸附：把当前偏移收敛到最近一屏（带速度偏向） */
    const snapTo = (targetIndexBias: number) => {
      const { stride, max } = metric.current;
      if (!stride) return;
      const raw = pos.current.target / stride + targetIndexBias;
      const i = clamp(Math.round(raw), 0, N - 1);
      pos.current.target = clamp(i * stride, 0, max);
    };
    const snapToIndex = (i: number) => {
      const { stride, max } = metric.current;
      if (!stride) return;
      pos.current.target = clamp(clamp(i, 0, N - 1) * stride, 0, max);
    };
    /* 箭头按钮与键盘共用 */
    const goRef = { current: snapToIndex };

    /* ---- 指针拖拽 ---- */
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      drag.current.active = true;
      drag.current.pointerId = e.pointerId;
      drag.current.startX = e.clientX;
      drag.current.startTarget = pos.current.target;
      drag.current.lastX = e.clientX;
      drag.current.lastT = performance.now();
      drag.current.velocity = 0;
      drag.current.moved = false;
      drag.current.startTime = performance.now();
      setDragging(true);
      try {
        viewport.setPointerCapture(e.pointerId);
      } catch {
        /* 指针已失效（合成事件、元素被移除等）时捕获失败可忽略，拖拽不依赖 capture */
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!drag.current.active) return;
      const dx = e.clientX - drag.current.startX;
      if (Math.abs(dx) > 6) drag.current.moved = true;
      const now = performance.now();
      const dt = Math.max(1, now - drag.current.lastT);
      drag.current.velocity = (e.clientX - drag.current.lastX) / dt;
      drag.current.lastX = e.clientX;
      drag.current.lastT = now;
      pos.current.target = clamp(drag.current.startTarget - dx, 0, metric.current.max);
    };
    const endDrag = (e: PointerEvent) => {
      if (!drag.current.active || e.pointerId !== drag.current.pointerId) return;
      drag.current.active = false;
      setDragging(false);
      try {
        viewport.releasePointerCapture(e.pointerId);
      } catch {
        /* capture 可能已随元素卸载释放 */
      }
      /* 松手吸附：拖拽速度足够时顺势翻一屏，否则就近吸附 */
      const bias = drag.current.velocity < -SNAP_VELOCITY ? 0.49 : drag.current.velocity > SNAP_VELOCITY ? -0.49 : 0;
      snapTo(bias);
    };
    viewport.addEventListener('pointerdown', onPointerDown);
    viewport.addEventListener('pointermove', onPointerMove);
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);

    /* ---- 滚轮：累积阈值翻页（一次连续滚动只翻一屏） ---- */
    const onWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      const now = performance.now();
      if (now < wheel.current.cooldownUntil) return;
      wheel.current.acc += delta;
      if (Math.abs(wheel.current.acc) >= WHEEL_THRESHOLD) {
        const dir = wheel.current.acc > 0 ? 1 : -1;
        wheel.current.acc = 0;
        wheel.current.cooldownUntil = now + WHEEL_COOLDOWN;
        const { stride, max } = metric.current;
        if (!stride) return;
        const i = clamp(Math.round(pos.current.target / stride) + dir, 0, N - 1);
        pos.current.target = clamp(i * stride, 0, max);
      }
    };
    viewport.addEventListener('wheel', onWheel, { passive: false });

    /* ---- 键盘：slider 可见时 ←/→ 翻页 ---- */
    const section = viewport.closest('section');
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const r = section?.getBoundingClientRect();
      if (!r || r.bottom < 0 || r.top > innerHeight) return;
      const { stride, max } = metric.current;
      if (!stride) return;
      const cur = Math.round(pos.current.target / stride);
      const next = clamp(cur + (e.key === 'ArrowRight' ? 1 : -1), 0, N - 1);
      goRef.current(next);
    };
    document.addEventListener('keydown', onKey);

    /* ---- 拖拽结束后拦截误触 click ---- */
    const onClickCapture = (e: MouseEvent) => {
      if (drag.current.moved) {
        e.preventDefault();
        e.stopPropagation();
        drag.current.moved = false;
      }
    };
    viewport.addEventListener('click', onClickCapture, true);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener('resize', measure);
      viewport.removeEventListener('pointerdown', onPointerDown);
      viewport.removeEventListener('pointermove', onPointerMove);
      viewport.removeEventListener('pointerup', endDrag);
      viewport.removeEventListener('pointercancel', endDrag);
      viewport.removeEventListener('wheel', onWheel);
      viewport.removeEventListener('click', onClickCapture, true);
      document.removeEventListener('keydown', onKey);
      gsap.killTweensOf(track);
    };
  }, []);

  /* 供箭头按钮翻页（GSAP 存在时才有意义） */
  const go = (dir: 1 | -1) => {
    const { stride, max } = metric.current;
    if (!stride) return;
    const cur = Math.round(pos.current.target / stride);
    pos.current.target = clamp(clamp(cur + dir, 0, N - 1) * stride, 0, max);
  };

  if (fallback) {
    /* 原生降级：横向滚动容器 */
    return (
      <div className="tw-flex tw-overflow-x-auto">
        {SLIDES.map((s, i) => (
          <div key={s.id} className="tw-w-[91vw] tw-shrink-0">
            <SlideBlock slide={s} index={i} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* slider 视口：整宽，拖拽目标 */}
      <div
        ref={viewportRef}
        className={`tw-mt-8 tw-select-none ${dragging ? 'tw-cursor-grabbing' : 'tw-cursor-grab'}`}
        style={{ touchAction: 'pan-y' }}
      >
        <div ref={trackRef} className="tw-flex tw-will-change-transform">
          {SLIDES.map((s, i) => (
            <div key={s.id} data-slide className="tw-shrink-0" style={{ width: '91vw' }}>
              <SlideBlock slide={s} index={i} parallax />
            </div>
          ))}
        </div>
      </div>

      {/* 页码 + 进度条（左下）与圆形箭头（右下），仿 Akaru 首页的底部排布 */}
      <div className="tw-mx-auto tw-flex tw-max-w-[1400px] tw-items-center tw-justify-between tw-px-6 tw-py-8 md:tw-px-10">
        <div className="tw-flex tw-items-center tw-gap-4">
          <span className="tw-font-serif tw-text-3xl tw-text-[#14181d]">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="tw-text-xs tw-tracking-[0.2em] tw-text-[#8a8578]">
            — {String(N).padStart(2, '0')}
          </span>
          <span className="tw-relative tw-ml-2 tw-block tw-h-px tw-w-28 tw-bg-[#d9d4c7]">
            <span
              className="tw-absolute tw-left-0 tw-top-[-0.5px] tw-block tw-h-[2px] tw-bg-[#14181d] tw-transition-all tw-duration-500"
              style={{ width: `${((index + 1) / N) * 100}%` }}
            />
          </span>
        </div>
        <div className="tw-flex tw-gap-3">
          <CircleButton disabled={index === 0} onClick={() => go(-1)} label="上一屏">
            <ArrowLeft size={18} />
          </CircleButton>
          <CircleButton disabled={index === N - 1} onClick={() => go(1)} label="下一屏">
            <ArrowRight size={18} />
          </CircleButton>
        </div>
      </div>
    </>
  );
}

/* ============ 单屏（信息面板 + 彩色画板 + 两条竖条） ============ */

function SlideBlock({ slide, index, parallax = false, vertical = false }: {
  slide: Slide;
  index: number;
  parallax?: boolean;
  vertical?: boolean;
}) {
  const inkText = slide.accentInk === 'light' ? 'text-white' : 'text-[#14181d]';
  const inkSoft = slide.accentInk === 'light' ? 'text-white/70' : 'text-[#14181d]/60';

  /* 竖条颜色 = 相邻两个项目的主题色（收尾时循环回第一屏） */
  const nextAccent = SLIDES[(index + 1) % N].accent;
  const next2Accent = SLIDES[(index + 2) % N].accent;
  const nextImage = SLIDES[(index + 1) % N].image;

  return (
    <div
      className="tw-grid"
      style={{
        height: vertical ? 'auto' : 'clamp(540px, 80vh, 760px)',
        gridTemplateColumns: vertical ? '1fr' : '41.8% 48.3% 6.6% 3.3%',
      }}
    >
      {/* 左：米白信息面板 */}
      <div className="tw-flex tw-flex-col tw-justify-between tw-px-8 tw-py-8 md:tw-px-12 md:tw-py-10">
        <div>
          <p className="tw-m-0 tw-text-xs tw-tracking-[0.18em] tw-text-[#8a8578]">
            {slide.meta}
          </p>
          <h3
            className={`tw-m-0 tw-mt-6 tw-font-black tw-leading-[1.02] tw-tracking-tight tw-text-[#14181d] ${vertical ? 'tw-text-3xl' : 'tw-text-[clamp(2.2rem,4.6vw,4.4rem)]'}`}
          >
            {slide.title}
          </h3>
          <p className={`tw-mt-6 tw-max-w-[38ch] tw-text-sm tw-leading-relaxed ${vertical ? 'tw-text-[#6f6a5e]' : 'tw-text-[#6f6a5e]'}`}>
            {slide.description}
          </p>
        </div>

        {/* 底部链接行：1px 上边框 + 横排大写小字，复刻 Akaru 的社交链接行 */}
        <div className="tw-mt-8 tw-border-t tw-border-[#14181d]/15 tw-pt-4">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
            {slide.github && (
              <LinkRow href={slide.github} label="GitHub" external />
            )}
            {slide.site && (
              <LinkRow href={slide.site} label="访问站点" external />
            )}
            <LinkRow href={slide.detailHref || '#'} label="查看详情" />
            <span className="tw-font-serif tw-text-lg tw-text-[#b5b0a0]">
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* 右：主题色主画板 + 封面图（直角，仿 Akaru 的画幅） */}
      <div
        className={`tw-relative tw-overflow-hidden ${inkText} ${vertical ? 'tw-h-[320px]' : ''}`}
        style={{ background: slide.accent }}
      >
        <div
          data-parallax={parallax || undefined}
          className="tw-absolute tw-inset-y-[9%] tw-left-[10%] tw-w-[80%]"
        >
          <img
            src={slide.image}
            alt={`${slide.title} 项目预览`}
            draggable={false}
            loading="lazy"
            decoding="async"
            className="tw-h-full tw-w-full tw-object-cover"
          />
        </div>
        {/* 画板内小字：当前编号，压在色块上 */}
        <span
          className={`tw-absolute tw-bottom-4 tw-left-[10%] tw-text-xs tw-tracking-[0.25em] ${inkSoft}`}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* 竖条 1：下一项目的主题色，顶部嵌它的封面小图 */}
      {!vertical && (
        <div className="tw-relative tw-overflow-hidden" style={{ background: nextAccent }}>
          <img
            src={nextImage}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            className="tw-mt-6 tw-h-[36%] tw-w-full tw-object-cover tw-opacity-90"
          />
        </div>
      )}

      {/* 竖条 2：再下一个项目的主题色，纯色 */}
      {!vertical && (
        <div className="tw-h-full" style={{ background: next2Accent }} />
      )}
    </div>
  );
}

/* ============ 链接行单项（大写小字 + hover 下划线） ============ */

function LinkRow({ href, label, external = false }: { href: string; label: string; external?: boolean }) {
  return (
    <a
      href={href}
      onClick={external ? undefined : (e) => e.preventDefault()}
      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
      className="tw-text-[11px] tw-font-medium tw-uppercase tw-tracking-[0.15em] tw-text-[#14181d] tw-no-underline tw-transition-colors hover:tw-text-[#8a8578]"
    >
      {label}
    </a>
  );
}

/* ============ 圆形翻页按钮（仿 Akaru 的 MEN 圆钮形态） ============ */

function CircleButton({ children, onClick, disabled, label }: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="tw-flex tw-h-12 tw-w-12 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-[#14181d] tw-text-white tw-transition-opacity disabled:tw-opacity-25"
    >
      {children}
    </button>
  );
}

/* ============ 工具 ============ */

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
