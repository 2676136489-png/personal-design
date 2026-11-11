/**
 * 「我的项目」横向拖拽侧滑画廊（参考 Awwwards Akaru-2 Lateral Slider）。
 *
 * 交互设计：
 * - PC 端：鼠标拖拽横向滑动 + 滚轮左右滚动，统一走「目标值 + GSAP ticker 每帧
 *   lerp 缓动」的模型，所以拖拽和滚轮的手感完全一致、丝滑收敛；
 *   图片随卡片相对视口的位置做微弱视差跟随。没有任何自动播放。
 * - 移动端（<768px）：matchMedia 实时监听，直接切到垂直单列布局，
 *   横向拖拽逻辑完全不挂载。
 *
 * 容错策略（用户明确要求）：
 * - gsap 缺失或 API 异常 → 整体降级为原生横向滚动条 + 原生 wheel 横滚；
 * - prefers-reduced-motion → 缓动系数置 1（无平滑动画）、关闭视差；
 * - pointer 拖拽用 setPointerCapture，拖出窗口也能正常收尾；
 * - 拖拽与点击区分（位移阈值 6px），拖完不误触发卡片跳转；
 * - 组件卸载时完整清理 ticker 与所有监听。
 */
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowRight, MoveHorizontal } from 'lucide-react';

/* ============ 数据 ============ */

interface ShowcaseProject {
  id: string;
  name: string;
  tags: string[];
  description: string;
  /** mock 占位图：上线时替换为真实预览图 URL 即可 */
  image: string;
  /** 占位链接：上线时替换为真实项目地址 */
  link: string;
}

/** 占位图生成器：柔和渐变 + 几何点缀 + 大号编号（纯 SVG，无外部依赖）。 */
const mockImage = (num: string, from: string, to: string, accent: string): string => {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="1040" height="640" viewBox="0 0 1040 640">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>` +
    `</linearGradient></defs>` +
    `<rect width="1040" height="640" fill="url(#g)"/>` +
    `<circle cx="810" cy="110" r="230" fill="${accent}" opacity="0.55"/>` +
    `<circle cx="180" cy="520" r="120" fill="none" stroke="${accent}" stroke-width="2" opacity="0.8"/>` +
    `<line x1="64" y1="96" x2="400" y2="96" stroke="${accent}" stroke-width="2" opacity="0.8"/>` +
    `<text x="56" y="580" font-family="Georgia, serif" font-size="150" fill="${accent}">${num}</text>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const PROJECTS: ShowcaseProject[] = [
  {
    id: 'rag',
    name: 'RAG实验工作台',
    tags: ['RAG', '向量检索', '调试工作台'],
    description: 'RAG全流程调试实验平台，可观察切块、向量化、检索中间结果。',
    image: mockImage('01', '#ece9df', '#ddd8c9', '#c9c3b0'),
    link: '#',
  },
  {
    id: 'gomoku',
    name: '五子棋连珠弈策台',
    tags: ['博弈Agent', '连珠禁手', '水墨国风'],
    description: '15×15连珠五子棋平台，支持Agent博弈、棋谱回放。',
    image: mockImage('02', '#e6e8e6', '#d2d6d2', '#b9c0ba'),
    link: '#',
  },
  {
    id: 'campus',
    name: '校园圈子',
    tags: ['校园社交', '兴趣圈子', 'feed信息流'],
    description: '面向大学生轻量化图文社交社区。',
    image: mockImage('03', '#eee6dc', '#e0d2c1', '#cdb99d'),
    link: '#',
  },
];

/* ============ 常量 ============ */

/** PC 端卡片宽度（px），视差偏移按它换算 */
const CARD_WIDTH = 520;
/** 卡片间距（px），与 gap-10 对应 */
const CARD_GAP = 40;
/** 视差幅度（px）：卡片在视口边缘时图片的横向偏移上限，刻意保持微弱 */
const PARALLAX_STRENGTH = 22;
/** 拖拽位移超过该值视为拖拽（而非点击） */
const DRAG_THRESHOLD = 6;
/** 横向断点：与 Tailwind 的 md 对齐，<768px 走垂直布局 */
const MOBILE_QUERY = '(max-width: 767px)';

/* ============ 组件 ============ */

export default function ProjectShowcase() {
  const [isMobile, setIsMobile] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches,
  );

  /* 跟踪 768px 断点，动态切换两种布局分支 */
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <section className="showcase-band" style={{ background: '#f8f7f2' }}>
      <div className="tw-mx-auto tw-max-w-[1240px] tw-px-6 tw-py-20 md:tw-px-10 md:tw-py-28">
        {/* 板块头：小 eyebrow + 大标题 + PC 端操作提示 */}
        <header className="tw-mb-10 tw-flex tw-items-end tw-justify-between md:tw-mb-14">
          <div>
            <p className="tw-mb-3 tw-text-xs tw-font-medium tw-tracking-[0.3em] tw-text-[#8a8578]">
              SELECTED WORKS
            </p>
            <h2 className="tw-m-0 tw-text-3xl tw-font-semibold tw-text-[#14181d] md:tw-text-5xl">
              我的项目
            </h2>
          </div>
          {!isMobile && (
            <p className="tw-hidden tw-items-center tw-gap-2 tw-text-sm tw-text-[#8a8578] md:tw-flex">
              <MoveHorizontal size={16} aria-hidden />
              按住拖拽，或滚动滚轮
            </p>
          )}
        </header>

        {isMobile ? <VerticalList /> : <LateralSlider />}
      </div>
    </section>
  );
}

/* ============ 移动端：垂直单列（无横向逻辑，整段不挂载） ============ */

function VerticalList() {
  return (
    <div className="tw-space-y-8">
      {PROJECTS.map((p) => (
        <ProjectCard key={p.id} project={p} />
      ))}
    </div>
  );
}

/* ============ PC 端：横向拖拽 + 滚轮 + 视差 ============ */

function LateralSlider() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  /* 交互状态全部放 ref：ticker 每帧读写，不需要触发 React 重渲染 */
  const pos = useRef({ current: 0, target: 0, max: 0 });
  const drag = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startTarget: 0,
    moved: false,
  });
  const [dragging, setDragging] = useState(false);

  /* GSAP 缺失 / API 异常时的原生滚动降级开关（渲染分支用） */
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    /* ---- 容错检查：gsap 不可用就走原生滚动 ---- */
    const hasGsap =
      typeof gsap !== 'undefined' &&
      typeof gsap.ticker?.add === 'function' &&
      typeof gsap.set === 'function';
    if (!hasGsap) {
      setFallback(true);
      return;
    }

    /* 减少动态偏好：缓动系数置 1（无动画感），视差关闭 */
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ease = reducedMotion ? 1 : 0.09;

    /* ---- 偏移边界 ---- */
    const measure = () => {
      /* transform 不影响 scrollWidth，可以直接量 */
      pos.current.max = Math.max(0, track.scrollWidth - viewport.clientWidth);
      pos.current.target = Math.min(pos.current.target, pos.current.max);
      pos.current.current = Math.min(pos.current.current, pos.current.max);
    };
    measure();
    window.addEventListener('resize', measure);

    /* ---- 每帧：lerp 缓动 + 视差 ---- */
    const parallaxNodes = Array.from(
      track.querySelectorAll<HTMLElement>('[data-parallax]'),
    );
    const cardCenters = parallaxNodes.map((_, i) => i * (CARD_WIDTH + CARD_GAP) + CARD_WIDTH / 2);

    const tick = () => {
      try {
        const { current: s } = pos;
        /* lerp 收敛：缓动手感的核心一行 */
        s.current += (s.target - s.current) * ease;
        /* 极小残差直接归位，避免永久微抖 */
        if (Math.abs(s.target - s.current) < 0.05) s.current = s.target;
        gsap.set(track, { x: -s.current });

        /* 微弱视差：卡片中心相对视口中心越偏，图片横向偏移越大 */
        if (!reducedMotion) {
          const viewCenter = viewport.clientWidth / 2;
          parallaxNodes.forEach((node, i) => {
            const cardCenter = cardCenters[i] - s.current;
            const ratio = (cardCenter - viewCenter) / viewport.clientWidth;
            const shift = Math.max(-40, Math.min(40, ratio * PARALLAX_STRENGTH));
            gsap.set(node, { x: shift });
          });
        }
      } catch {
        /* 单帧异常不致命：静默跳过，绝不让 ticker 崩掉 */
      }
    };
    gsap.ticker.add(tick);

    /* ---- 原生 wheel（passive:false 才能拦住页面纵向滚动） ---- */
    const onWheel = (e: WheelEvent) => {
      /* 纵向意图为主时交给页面滚动，不抢 */
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) {
        pos.current.target = clamp(pos.current.target + e.deltaX, 0, pos.current.max);
        return;
      }
      const before = pos.current.target;
      pos.current.target = clamp(before + e.deltaY, 0, pos.current.max);
      /* 到头了不再拦截，让页面自然继续上下滚 */
      if (pos.current.target !== before) e.preventDefault();
    };
    viewport.addEventListener('wheel', onWheel, { passive: false });

    /* ---- 指针拖拽 ---- */
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      drag.current.active = true;
      drag.current.pointerId = e.pointerId;
      drag.current.startX = e.clientX;
      drag.current.startTarget = pos.current.target;
      drag.current.moved = false;
      setDragging(true);
      /* 拖出浏览器窗口也能收到 up / move */
      viewport.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!drag.current.active) return;
      const dx = e.clientX - drag.current.startX;
      if (Math.abs(dx) > DRAG_THRESHOLD) drag.current.moved = true;
      /* 拖拽方向与内容反向：向左拖 = 看右边的内容 */
      pos.current.target = clamp(
        drag.current.startTarget - dx,
        0,
        pos.current.max,
      );
    };
    const endDrag = (e: PointerEvent) => {
      if (!drag.current.active || e.pointerId !== drag.current.pointerId) return;
      drag.current.active = false;
      setDragging(false);
      try {
        viewport.releasePointerCapture(e.pointerId);
      } catch {
        /* capture 可能已随元素卸载释放，忽略即可 */
      }
    };
    viewport.addEventListener('pointerdown', onPointerDown);
    viewport.addEventListener('pointermove', onPointerMove);
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);

    /* ---- 完整清理 ---- */
    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener('resize', measure);
      viewport.removeEventListener('wheel', onWheel);
      viewport.removeEventListener('pointerdown', onPointerDown);
      viewport.removeEventListener('pointermove', onPointerMove);
      viewport.removeEventListener('pointerup', endDrag);
      viewport.removeEventListener('pointercancel', endDrag);
      gsap.killTweensOf(track);
    };
  }, []);

  /* 拖拽结束后拦截误触的 click（跳转链接用 # 占位） */
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  /* ---- GSAP 降级分支：原生横向滚动 + 原生 wheel 横滚 ---- */
  if (fallback) {
    return (
      <div
        ref={viewportRef}
        className="tw-flex tw-gap-10 tw-overflow-x-auto tw-pb-2"
        style={{ scrollBehavior: 'smooth' }}
        onWheel={(e) => {
          const el = viewportRef.current;
          if (!el) return;
          const before = el.scrollLeft;
          el.scrollLeft = clamp(before + e.deltaY, 0, el.scrollWidth - el.clientWidth);
          if (el.scrollLeft !== before) e.preventDefault();
        }}
      >
        {PROJECTS.map((p) => (
          <div key={p.id} className="tw-w-[520px] tw-shrink-0">
            <ProjectCard project={p} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={viewportRef}
      onClickCapture={onClickCapture}
      className={`tw-select-none ${dragging ? 'tw-cursor-grabbing' : 'tw-cursor-grab'}`}
      style={{ touchAction: 'pan-y' }}
    >
      <div ref={trackRef} className="tw-flex tw-gap-10 tw-will-change-transform">
        {PROJECTS.map((p) => (
          <div key={p.id} className="tw-w-[520px] tw-shrink-0">
            <ProjectCard project={p} parallax />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ 卡片 ============ */

function ProjectCard({ project, parallax = false }: { project: ShowcaseProject; parallax?: boolean }) {
  return (
    <article className="tw-group">
      <a
        href={project.link}
        className="tw-block tw-overflow-hidden tw-rounded-[16px] tw-bg-white tw-shadow-sm tw-transition-transform tw-duration-300 tw-ease-out hover:tw-translate-y-[-4px]"
      >
        {/* 图在上：外层裁切，parallax 层由 GSAP 驱动（宽 116%，左右各留 8% 视差余量），
            img 的 hover scale(1.03) 与视差 transform 分属两层，互不打架 */}
        <div className="tw-relative tw-h-[320px] tw-overflow-hidden">
          <div
            data-parallax={parallax || undefined}
            className={parallax ? 'tw-absolute tw-inset-y-0 tw-left-[-8%] tw-w-[116%]' : 'tw-absolute tw-inset-0'}
          >
            <img
              src={project.image}
              alt={project.name}
              draggable={false}
              className="tw-h-full tw-w-full tw-object-cover tw-transition-transform tw-duration-300 tw-ease-out group-hover:tw-scale-[1.03]"
            />
          </div>
        </div>

        {/* 文字信息在下 */}
        <div className="tw-p-6">
          <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-[#14181d]">
            {project.name}
          </h3>

          <ul className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-2">
            {project.tags.map((t) => (
              <li
                key={t}
                className="tw-list-none tw-rounded-full tw-border tw-border-[#e3e0d5] tw-bg-[#f8f7f2] tw-px-3 tw-py-1 tw-text-xs tw-text-[#6f6a5e]"
              >
                {t}
              </li>
            ))}
          </ul>

          <p className="tw-mt-3 tw-text-sm tw-leading-relaxed tw-text-[#6f6a5e]">
            {project.description}
          </p>

          <span className="tw-mt-4 tw-inline-flex tw-items-center tw-gap-1.5 tw-text-sm tw-font-medium tw-text-[#14181d]">
            访问项目
            <ArrowRight
              size={15}
              aria-hidden
              className="tw-transition-transform tw-duration-300 group-hover:tw-translate-x-1"
            />
          </span>
        </div>
      </a>
    </article>
  );
}

/* ============ 工具 ============ */

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
