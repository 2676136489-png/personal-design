/**
 * 校园圈子 · 运营统计区（参考 Moxo「Stats & Metrics 03」单英雄数字版式）
 *
 * - 一个超大计数数字当主角：0 → 19+，滚动到视口 50% 才开始，easeOut 跑 2s；
 * - 标题、数字、标签、按钮按 0 / 0.3 / 0.5 / 0.7s 依次入场；
 * - 四张产品截图散点在四周，lg 以下隐藏（手机上只留中间的内容）；
 * - 其余五个指标收在按钮下方一行小字里，不跟主角抢视线；
 * - 数字、标签、链接全部来自 data.js 的 campus 对象，这里不手写数值；
 * - 入场动画只在 JS 武装后生效：SSR 与无 JS 环境直出最终状态，
 *   冒烟测试读到的 HTML 永远是带真实数字的完整内容。
 */
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { asset, campus } from '../data.js';
import '@fontsource/bricolage-grotesque/700.css';
import '@fontsource/bricolage-grotesque/800.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/600.css';
import '../campus-stats.css';

/* 散点四图：一张竖版 AI 助手 + 三张横版界面，object-cover 裁成参考稿的卡片比例 */
const PHOTOS = [
  { src: asset('/media/campus/ai-assistant.webp'), alt: '校园圈子 AI 助手对话界面' },
  { src: asset('/media/campus/feed.webp'), alt: '校园圈子动态列表' },
  { src: asset('/media/campus/students.webp'), alt: '校园圈子同学目录' },
  { src: asset('/media/campus/admin-overview.webp'), alt: '校园圈子管理后台总览' },
];

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const COUNT_MS = 2000;

export default function CampusStats() {
  const ref = useRef<HTMLElement | null>(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);
  const hero = campus.metrics[0];
  const rest = campus.metrics.slice(1);
  const target = Number(hero.value);

  /* SSR 与首帧直出最终值（19+），触发入场后才归零重数：
     冒烟断言钉的是 SSR HTML，这里不能一挂载就变成 0 */
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    setArmed(true);
    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        setShown(true);
        setDisplay(0);
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - t0) / COUNT_MS, 1);
          setDisplay(p < 1 ? Math.floor(easeOutCubic(p) * target) : target);
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target]);

  return (
    <section
      ref={ref}
      className="campus-stats"
      data-armed={armed || undefined}
      data-shown={shown || undefined}
      aria-label="校园圈子运营数据"
    >
      {PHOTOS.map((p, i) => (
        <img
          key={p.src}
          className={`cs-photo cs-photo-${i + 1}`}
          src={p.src}
          alt={p.alt}
          loading="lazy"
          decoding="async"
        />
      ))}

      <div className="cs-center">
        <h2 className="cs-headline">{campus.headline}</h2>
        <p className="cs-number-wrap">
          <span className="cs-number">{display.toLocaleString('en-US')}+</span>
        </p>
        <p className="cs-label">{hero.label}</p>
        <div className="cs-cta-wrap">
          <a className="cs-cta" href={campus.site} target="_blank" rel="noreferrer noopener">
            打开校园圈子
            <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="cs-row">
          {rest.map((m) => (
            <span key={m.label}>
              <strong>{m.value}</strong>
              {m.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
