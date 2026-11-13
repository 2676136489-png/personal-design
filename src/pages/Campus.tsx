/**
 * /campus-circle 校园圈子 · 叙事式 case study（参考 Abetka Unique-experience）
 *
 * - 封面用 clip-path 遮罩随滚动揭开（移动端退化为淡入）；
 * - 六个章节（缘起 / 学生端 / AI 助手 / 管理后台 / 技术架构 / 工程复盘）
 *   按滚动顺序逐节入场，图与文交错；
 * - 顶部章节锚点条常驻，点击平滑滚动到对应章节；
 * - 数据全部来自 data.js 的 campus 对象，不新增文案。
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Github } from 'lucide-react';
import {
  gsap,
  isMobile,
  reducedMotion,
  revealChildren,
  useGsapScope,
} from '../motion/scroll.tsx';
import { campus } from '../data.js';
import CampusStats from './CampusStats.tsx';

export default function Campus() {
  const [active, setActive] = useState(campus.chapters[0]?.id);

  /* 章节高亮：视口中线落在哪一节就亮哪一项 */
  useEffect(() => {
    const sections = campus.chapters
      .map((c) => document.getElementById(`ch-${c.id}`))
      .filter(Boolean);
    if (!sections.length || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id.replace(/^ch-/, ''));
      },
      { rootMargin: '-38% 0px -54% 0px', threshold: [0, 0.2, 0.6] },
    );
    sections.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const jumpTo = (id) => {
    const el = document.getElementById(`ch-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scopeRef = useGsapScope<HTMLDivElement>((scope) => {
    if (reducedMotion()) return;

    /* 封面遮罩揭开：随滚动进度从下往上收起遮罩 */
    const cover = scope.querySelector('[data-mask] img');
    if (cover && !isMobile()) {
      gsap.fromTo(
        cover,
        { clipPath: 'inset(0 0 100% 0)' },
        {
          clipPath: 'inset(0 0 0% 0)',
          ease: 'none',
          scrollTrigger: { trigger: cover, start: 'top 92%', end: 'top 28%', scrub: 1 },
        },
      );
    } else if (cover) {
      /* 移动端不做遮罩，退化成一次淡入。
         注意别留下初始 clip-path —— CSS 里的初始值只在桌面断点生效。 */
      gsap.from(cover, {
        opacity: 0,
        y: 20,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: { trigger: cover, start: 'top 92%', once: true },
      });
    }

    if (!isMobile()) {
      /* 章节内的截图：一次性遮罩揭开 + 轻微缩放回位 */
      scope.querySelectorAll('[data-shot]').forEach((fig) => {
        const img = fig.querySelector('img');
        if (!img) return;
        gsap.fromTo(
          img,
          { clipPath: 'inset(0 0 100% 0)', scale: 1.04 },
          {
            clipPath: 'inset(0 0 0% 0)',
            scale: 1,
            duration: 1.05,
            ease: 'power3.out',
            scrollTrigger: { trigger: fig, start: 'top 86%', once: true },
          },
        );
      });
    }

    revealChildren(scope);
  }, []);

  return (
    <div className="ds-page" ref={scopeRef}>
      {/* ============ 封面与简介 ============ */}
      <header className="narrative-hero">
        <div className="ds-wrap" style={{ paddingTop: 56, paddingBottom: 40 }}>
          <div className="ds-kicker-row">
            <p className="ds-eyebrow" style={{ margin: 0 }}>
              {campus.en} · Case Study
            </p>
            <span className="ds-meta">{campus.period}</span>
          </div>
          <h1 className="ds-display" style={{ marginTop: 20, maxWidth: '14ch' }}>
            {campus.name}
          </h1>
          <p className="ds-lede" style={{ marginTop: 24 }}>
            {campus.headline} {campus.lede}
          </p>

          <div className="narrative-actions-row">
            <span className="ds-meta">{campus.role}</span>
            <span className="ds-meta">{campus.stack}</span>
            <div className="narrative-actions">
              <a className="ds-btn" href={campus.site} target="_blank" rel="noreferrer noopener">
                访问线上站点
                <ArrowUpRight size={16} />
              </a>
              <a
                className="ds-btn ds-btn--ghost"
                href={campus.github}
                target="_blank"
                rel="noreferrer noopener"
              >
                <Github size={15} />
                源码
              </a>
            </div>
          </div>
        </div>

        <div className="narrative-cover" data-mask>
          <img src={campus.cover} alt={`${campus.name} 学生中心界面`} />
        </div>
      </header>

      {/* ============ 运营统计（Moxo 式单英雄数字，见 CampusStats.tsx） ============ */}
      <CampusStats />

      {/* ============ 章节锚点 ============ */}
      <div className="chapter-nav" style={{ marginTop: 56 }}>
        <div className="ds-wrap">
          <ol>
            {campus.chapters.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  data-active={active === c.id}
                  onClick={() => jumpTo(c.id)}
                >
                  <span style={{ opacity: 0.55, marginRight: 8 }}>{c.kicker}</span>
                  {c.nav}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* ============ 正文章节 ============ */}
      <div className="ds-wrap">
        {campus.chapters.map((chapter, ci) => (
          <section
            key={chapter.id}
            id={`ch-${chapter.id}`}
            className="narrative-chapter"
            style={{ scrollMarginTop: 'calc(var(--nav-height) + 64px)' }}
            data-reveal-group
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr)',
                gap: 8,
                borderTop: '1px solid var(--line)',
                paddingTop: 28,
              }}
            >
              <span className="ds-index" data-r>
                {chapter.kicker}
              </span>
              <h2 className="ds-h2" data-r style={{ maxWidth: '22ch' }}>
                {chapter.title}
              </h2>
            </div>

            <div style={{ maxWidth: 760, marginTop: 40 }}>
              {chapter.blocks.map((block, i) => (
                <Block key={i} block={block} />
              ))}
            </div>

            {ci === campus.chapters.length - 1 ? null : null}
          </section>
        ))}
      </div>

      {/* ============ 收尾 ============ */}
      <section className="ds-section" data-reveal-group>
        <div className="ds-wrap" style={{ borderTop: '1px solid var(--line)', paddingTop: 40 }}>
          <p className="ds-eyebrow" data-r>
            Epilogue
          </p>
          <p className="ds-h2" data-r style={{ maxWidth: '26ch' }}>
            它现在还在线上跑着，19 位实名学生每天在用。
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 28 }} data-r>
            <a className="ds-btn" href={campus.site} target="_blank" rel="noreferrer noopener">
              打开校园圈子
              <ArrowUpRight size={16} />
            </a>
            <Link className="ds-btn ds-btn--ghost" to="/works">
              <ArrowLeft size={15} />
              回到全部作品
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ================= 内容块 ================= */

function Block({ block }) {
  if (block.type === 'text') {
    return (
      <p className="ds-body" data-r style={{ marginBottom: 28 }}>
        {block.body}
      </p>
    );
  }

  if (block.type === 'points') {
    return (
      <dl data-r style={{ margin: '0 0 32px', borderTop: '1px solid var(--line)' }}>
        {block.items.map((p) => (
          <div
            key={p.k}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(96px, 160px) 1fr',
              gap: 16,
              padding: '14px 0',
              borderBottom: '1px solid var(--line)',
            }}
          >
            <dt style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{p.k}</dt>
            <dd style={{ margin: 0, fontSize: 13.5, lineHeight: 1.8, color: 'var(--muted)' }}>
              {p.v}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  if (block.type === 'shot') {
    return (
      <figure
        className="narrative-shot"
        data-shot
        data-r
        style={{
          margin: '8px 0 40px',
          maxWidth: block.fit === 'portrait' ? 380 : undefined,
          marginInline: block.fit === 'portrait' ? 'auto' : undefined,
        }}
      >
        <img
          src={block.src}
          alt={block.alt}
          loading="lazy"
          decoding="async"
          style={{ width: '100%', display: 'block' }}
        />
        <figcaption>{block.caption}</figcaption>
      </figure>
    );
  }

  if (block.type === 'arch') {
    return (
      <div
        data-r
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 1,
          background: 'var(--line)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-ds)',
          overflow: 'hidden',
          marginBottom: 32,
        }}
      >
        {block.groups.map((g) => (
          <div key={g.title} style={{ background: 'var(--page)', padding: '20px 18px' }}>
            <p className="ds-meta" style={{ marginBottom: 10 }}>
              {g.title}
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {g.items.map((it) => (
                <li
                  key={it}
                  style={{
                    fontSize: 13,
                    lineHeight: 1.9,
                    color: 'var(--ink-soft)',
                    borderTop: '1px solid var(--line)',
                    padding: '6px 0',
                  }}
                >
                  {it}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
