/**
 * 详情页 / 分类聚合页 / 简历页。
 *
 * 这三类是内容型页面，结构与信息密度经过多轮迭代（wiki 式文档布局、
 * 章节锚点、阅读进度、灯箱），这次重构只做「换肤 + 接入新路由」：
 * 颜色圆角全部走 CSS 变量，导航高度从 --nav-height 推导，
 * 动效仍由 motion.jsx 的揭示系统驱动。
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Award, BookOpen, Check,
  ChevronDown, ChevronRight, Copy, ExternalLink, Github, GraduationCap,
  Mail, MapPin, Phone, Search, Trophy, X,
} from 'lucide-react';
import {
  achievements, asset, campus, categories, categoryBySlug, imgAttrs,
  mailServices, media, profile, projects, resume, timeline,
} from '../data.js';
import { SplitText, usePageMotion } from '../motion.jsx';
import { ImageLightbox } from '../lightbox.jsx';
import { goToSection, navigate } from '../router.js';

/* 新路由不再统一注入 onCopyEmail：没有传入时退回本地复制 */
function fallbackCopyEmail() {
  try {
    navigator.clipboard?.writeText(profile.email);
  } catch {
    /* 剪贴板不可用时静默失败，链接本身仍可点 */
  }
}

function MailButton({ className = 'btn btn--solid' }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDocDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (service) => {
    setOpen(false);
    const url = service.build(profile.email);
    if (service.id === 'foxmail') {
      window.location.href = url;
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="mail-picker" ref={wrapRef}>
      <button
        className={className}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Mail size={16} />
        发送邮件
        <ChevronDown size={15} className="mail-picker-caret" data-open={open} />
      </button>

      {open ? (
        <div className="mail-menu" role="menu">
          <p className="mail-menu-title">选择你的邮箱</p>
          {mailServices.map((s) => (
            <button key={s.id} type="button" role="menuitem" onClick={() => pick(s)}>
              <span>
                <strong>{s.name}</strong>
                <small>{s.hint}</small>
              </span>
              <ArrowUpRight size={15} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ============ 章节块 ============ */

function ChapterBlocks({ blocks }) {
  return blocks.map((block, i) => {
    if (block.type === 'text') {
      return (
        <p className="prose" key={i} data-reveal>
          {block.body}
        </p>
      );
    }
    if (block.type === 'shot') {
      return (
        <figure className="detail-shot" key={i} data-reveal="img">
          <div className="shot-frame" data-fit={block.fit || 'wide'}>
            <img src={block.src} alt={block.alt} loading="lazy" {...imgAttrs(block.src)} />
          </div>
          <figcaption>{block.caption}</figcaption>
        </figure>
      );
    }
    if (block.type === 'points') {
      return (
        <ul className="point-list" key={i} data-reveal>
          {block.items.map((item) => (
            <li key={item.k}>
              <strong>{item.k}</strong>
              <span>{item.v}</span>
            </li>
          ))}
        </ul>
      );
    }
    if (block.type === 'arch') {
      return (
        <div className="arch-grid" key={i} data-reveal>
          {block.groups.map((group) => (
            <div className="arch-card" key={group.title}>
              <h4>{group.title}</h4>
              <ul>
                {group.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    }
    if (block.type === 'table') {
      return (
        <figure className="doc-table" key={i} data-reveal>
          <table>
            <thead>
              <tr>
                {block.head.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, ci) => (
                    <td key={ci}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {block.caption ? <figcaption>{block.caption}</figcaption> : null}
        </figure>
      );
    }
    if (block.type === 'code') {
      return (
        <figure className="doc-code" key={i} data-reveal>
          {block.lang ? <figcaption className="doc-code-lang">{block.lang}</figcaption> : null}
          <pre>
            <code>
              {block.lines.map((line, li) => (
                <span className="code-line" key={li}>
                  {line || ' '}
                </span>
              ))}
            </code>
          </pre>
          {block.caption ? <figcaption>{block.caption}</figcaption> : null}
        </figure>
      );
    }
    return null;
  });
}

/* 章节锚点：路由为 /slug，锚点段落挂在第二个 # 后面 */
function docAnchor(slug, id) {
  return `#/${slug}#${id}`;
}

/* 稳定引用，避免 chapters 为空时 effect 反复重挂 */
const NO_CHAPTERS = [];

/* 锚点滚动：进入带锚点的页面时滚动到位，点击目录时跟随 hashchange 再次滚动。
   HomePage、CampusPage、ProjectPage 共用，缺了 hashchange 监听会导致
   目录点击只改 URL 却不滚动。 */
function useAnchorScroll() {
  useEffect(() => {
    const scrollToAnchor = () => {
      const anchor = window.location.hash.split('#')[2];
      if (!anchor) return;
      const el = document.getElementById(anchor);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    const timer = window.setTimeout(scrollToAnchor, 160);
    window.addEventListener('hashchange', scrollToAnchor);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('hashchange', scrollToAnchor);
    };
  }, []);
}

/* 滚动时高亮当前所在章节 */
function useChapterScroll(chapters) {
  const [active, setActive] = useState(chapters[0]?.id);

  useEffect(() => {
    const onScroll = () => {
      let current = chapters[0]?.id;
      chapters.forEach((c) => {
        const el = document.getElementById(c.id);
        if (el && el.getBoundingClientRect().top <= 180) current = c.id;
      });
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [chapters]);

  return active;
}

function DocToc({ chapters, activeId, slug }) {
  return (
    <aside className="doc-toc" aria-label="章节目录">
      <p className="toc-title">目录</p>
      {chapters.map((c) => (
        <a key={c.id} href={docAnchor(slug, c.id)} data-active={activeId === c.id}>
          <span>{c.kicker}</span>
          {c.nav}
        </a>
      ))}
    </aside>
  );
}

function DocChapters({ chapters }) {
  return chapters.map((c) => (
    <section className="doc-chapter" id={c.id} key={c.id}>
      <p className="chapter-kicker">{c.kicker}</p>
      <h2>{c.title}</h2>
      <ChapterBlocks blocks={c.blocks} />
    </section>
  ));
}

function MetricsStrip({ metrics }) {
  if (!metrics || !metrics.length) return null;
  return (
    <section className="metrics-strip" data-reveal="scale">
      {metrics.map((m) => {
        /* 仅对「可选前缀 + 数字 + 可选百分号」的形式启用滚动计数，
           像 15×15 这种复合写法保持静态，避免滚一半的怪异效果 */
        const countable = /^[^\d]*\d+(?:\.\d+)?%?$/.test(m.value);
        return (
          <div key={m.label}>
            <strong {...(countable ? { 'data-count': m.value } : null)}>{m.value}</strong>
            <span>{m.label}</span>
          </div>
        );
      })}
    </section>
  );
}


function ProjectPage({ project, onCopyEmail }) {
  const activeChapter = useChapterScroll(project?.chapters ?? NO_CHAPTERS);

  usePageMotion([project?.id]);
  useAnchorScroll();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [project?.id]);

  if (!project) {
    return (
      <div className="not-found">
        <h1>没有找到这个页面</h1>
        <a className="btn btn--solid" href="#/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
          返回首页
        </a>
      </div>
    );
  }

  const chapters = project.chapters || [];
  const others = projects.filter((p) => p.id !== project.id).slice(0, 3);

  return (
    <div className="ds-page legacy-doc">
      <header className="page-hero">
        <div className="page-hero-inner">
          <a className="back-link" href="#/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
            <ArrowLeft size={15} />
            返回首页
          </a>
          <p className="eyebrow">{project.category} · {project.period}</p>
          <h1>{project.title}</h1>
          <p className="page-hero-lede">{project.lede || project.description}</p>
          {project.note ? <p className="page-hero-note">{project.note}</p> : null}
          <div className="page-hero-meta">
            {project.role ? <span>{project.role}</span> : null}
            {project.stack ? <span>{project.stack}</span> : null}
          </div>
          <div className="hero-actions hero-actions--left">
            {project.github ? (
              <a
                className="btn btn--solid"
                data-magnetic
                href={project.github}
                target="_blank"
                rel="noreferrer noopener"
              >
                <Github size={16} />
                GitHub 源码
              </a>
            ) : null}
            {project.site ? (
              <a
                className="btn btn--plain"
                href={project.site}
                target="_blank"
                rel="noreferrer noopener"
              >
                在线访问
                <ArrowUpRight size={16} />
              </a>
            ) : null}
          </div>
        </div>
        <div className="page-hero-shot" data-parallax="0.07">
          {/* 首屏最大的一张图，别让浏览器把它排到后面 */}
          <img
            src={project.image}
            alt={`${project.title} 项目视觉`}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            {...imgAttrs(project.image)}
          />
        </div>
      </header>

      <MetricsStrip metrics={project.metrics} />

      <div className={`doc-layout${chapters.length ? '' : ' doc-layout--single'}`}>
        {chapters.length ? (
          <DocToc chapters={chapters} activeId={activeChapter} slug={project.slug} />
        ) : null}

        <article className="doc-body">
          {chapters.length ? (
            <DocChapters chapters={chapters} />
          ) : (
            <section className="doc-chapter">
              <p className="prose">{project.description}</p>
            </section>
          )}

          <div className="doc-end" data-reveal>
            <h3>想进一步了解？</h3>
            <p>源码、设计与实现细节都在仓库里，也欢迎直接聊。</p>
            <div className="hero-actions hero-actions--left">
              {project.github ? (
                <a
                  className="btn btn--solid"
                  href={project.github}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Github size={16} />
                  打开仓库
                </a>
              ) : null}
              <MailButton className="btn btn--plain" />
            </div>
          </div>
        </article>
      </div>

      <div className="other-projects">
        <div className="section-head section-head--center" data-reveal="mask">
          <p className="eyebrow">继续浏览</p>
          <h2>其他作品</h2>
        </div>
        <div className="work-grid">
          {others.map((p, i) => (
            <article className="work-card" key={p.id} data-reveal data-tilt style={{ '--i': i % 2 }}>
              <a href={`#/${p.slug}`} onClick={(e) => { e.preventDefault(); navigate(`/${p.slug}`); }}>
                <div className="work-media">
                  <img src={p.image} alt={`${p.title} 项目视觉`} loading="lazy" decoding="async" {...imgAttrs(p.image)} />
                </div>
                <div className="work-body">
                  <p className="work-meta">
                    <span>{p.category}</span>
                    <time>{p.year}</time>
                  </p>
                  <h3>{p.title}</h3>
                  <p className="work-desc">{p.description}</p>
                  <span className="work-more">
                    查看详情
                    <ChevronRight size={15} />
                  </span>
                </div>
              </a>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============ 方向聚合页 ============ */

/* 某个方向下有多个项目时，导航指到这里让用户自己选。
   卡片直接复用 .work-grid / .work-card —— 同一套样式，
   不为聚合页另立一套外观，作品列表和方向页看起来是一体的。 */
function CategoryPage({ category, onCopyEmail }) {
  usePageMotion([category?.slug]);
  useAnchorScroll();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [category?.slug]);

  if (!category) {
    /* slug 写错时（手输URL 或旧链接）不要只丢一个「返回首页」把人撵走 ——
       他多半是从导航点进来的，直接把所有方向摆出来让他挑。 */
    return (
      <div className="not-found">
        <h1>没有找到这个方向</h1>
        <p className="not-found-lede">下面是现有的全部方向，选一个看看。</p>
        <div className="not-found-links">
          {categories.filter((c) => c.projects.length > 0).map((c) => (
            <a
              key={c.slug}
              className="btn btn--plain"
              href={c.projects.length === 1 ? `#/${c.projects[0].slug}` : `#/category/${c.slug}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(c.projects.length === 1 ? `/${c.projects[0].slug}` : `/category/${c.slug}`);
              }}
            >
              {c.name}
              <ChevronRight size={15} />
            </a>
          ))}
        </div>
        <a className="btn btn--solid" href="#/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
          返回首页
        </a>
      </div>
    );
  }

  const others = categories.filter((c) => c.slug !== category.slug && c.projects.length > 0);

  return (
    <div className="ds-page legacy-doc">
      <header className="page-hero page-hero--plain">
        <div className="page-hero-inner">
          <a className="back-link" href="#/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
            <ArrowLeft size={15} />
            返回首页
          </a>
          <p className="eyebrow">方向 · {category.projects.length} 个项目</p>
          <h1>{category.name}</h1>
          <p className="page-hero-lede">{category.blurb}</p>
        </div>
      </header>

      <section className="work category-work">
        <div className="work-grid">
          {category.projects.map((p, i) => (
            <article className="work-card" key={p.id} data-reveal data-tilt style={{ '--i': i % 2 }}>
              <a href={`#/${p.slug}`} onClick={(e) => { e.preventDefault(); navigate(`/${p.slug}`); }}>
                <div className="work-media">
                  <img
                    src={p.image}
                    alt={`${p.title} 项目视觉`}
                    loading="lazy"
                    decoding="async"
                    {...imgAttrs(p.image)}
                  />
                </div>
                <div className="work-body">
                  <p className="work-meta">
                    <span>{p.category}</span>
                    <time>{p.year}</time>
                  </p>
                  <h3>{p.title}</h3>
                  <p className="work-desc">{p.description}</p>
                  <span className="work-more">
                    查看详情
                    <ChevronRight size={15} />
                  </span>
                </div>
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* 顺带把其他方向列出来：用户从某个方向进来，
          大概率会想看看别的方向有哪些项目。 */}
      <div className="other-projects">
        <div className="section-head section-head--center" data-reveal="mask">
          <p className="eyebrow">其他方向</p>
          <h2>换个方向看看</h2>
        </div>
        <div className="chapter-cards">
          {others.map((c) => (
            <a
              className="chapter-card"
              key={c.slug}
              href={c.projects.length === 1 ? `#/${c.projects[0].slug}` : `#/category/${c.slug}`}
              data-reveal
              data-tilt
              onClick={(e) => {
                e.preventDefault();
                navigate(c.projects.length === 1 ? `/${c.projects[0].slug}` : `/category/${c.slug}`);
              }}
            >
              <span className="chapter-index">{String(c.projects.length).padStart(2, '0')}</span>
              <h3>{c.name}</h3>
              <p className="chapter-title">{c.blurb}</p>
              <span className="chapter-more">
                {c.projects.length === 1 ? c.projects[0].title : `${c.projects.length} 个项目`}
                <ChevronRight size={15} />
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============ 简历页 ============ */

function ResumePage({ onCopyEmail }) {
  usePageMotion([]);

  // 简历预览图放大查看
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // 按简历原文顺序取出对应项目（顺序与 PDF 一致，不是网站上的排列）
  const resumeProjects = resume.projectSlugs
    .map((slug) => (slug === campus.slug ? campus : projects.find((p) => p.slug === slug)))
    .filter(Boolean);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  return (
    <div className="ds-page legacy-doc">
      <header className="page-hero">
        <div className="page-hero-inner">
          <a className="back-link" href="#/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
            <ArrowLeft size={15} />
            返回首页
          </a>
          <p className="eyebrow">简历 · 更新于 {resume.updated}</p>
          <h1>我的简历</h1>
          <p className="page-hero-lede">{resume.summary}</p>
          <div className="hero-actions hero-actions--left">
            <a className="btn btn--solid" data-magnetic href={media.resume.pdf} download="卢柯宇简历.pdf">
              下载 PDF 简历
              <ArrowDown size={16} />
            </a>
            <a className="btn btn--plain" href={`mailto:${profile.email}`}>
              <Mail size={16} />
              {profile.email}
            </a>
          </div>
        </div>
      </header>

      <div className="resume-layout">
        <article className="doc-body resume-body">
          <section className="resume-block" id="resume-education" data-reveal>
            <h2>教育经历</h2>
            {resume.education.map((item) => (
              <div className="resume-edu" key={item.school}>
                <div className="resume-row">
                  <strong className="resume-title">{item.school}</strong>
                  <span className="resume-period">{item.period}</span>
                </div>
                <p className="resume-sub">{item.major} · {item.gpa}</p>
                <ul className="point-list">
                  {item.points.map((p) => (
                    <li key={p}>
                      <Check size={15} />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          <section className="resume-block" id="resume-advantages" data-reveal>
            <h2>个人优势</h2>
            <ul className="resume-points">
              {resume.advantages.map((a) => (
                <li key={a}>
                  <span className="resume-dot" aria-hidden="true" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="resume-block" id="resume-skills" data-reveal>
            <h2>专业技能</h2>
            <ul className="resume-skills">
              {resume.skillGroups.map(([name, detail]) => (
                <li key={name}>
                  <strong>{name}</strong>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="resume-block" id="resume-projects" data-reveal>
            <h2>项目经历</h2>
            <ul className="resume-projects">
              {resumeProjects.map((p) => {
                /* 分点描述用简历 PDF 那份，与项目详情页的引子（lede）不是一回事 */
                const highlights = resume.projectHighlights?.[p.slug] || [];
                return (
                <li key={p.slug}>
                  <div className="resume-row">
                    <a
                      className="resume-title resume-title--link"
                      href={`#/${p.slug}`}
                      onClick={(e) => { e.preventDefault(); navigate(`/${p.slug}`); }}
                    >
                      {p.title || `${p.name} ${p.en}`}
                      <ChevronRight size={15} />
                    </a>
                    <span className="resume-period">{p.period}</span>
                  </div>
                  {/* 标注行用简历 PDF 的口径（技术栈 + 参与方式），
                      与 details 页那句「独立开发 · 架构与实现」不是一回事。 */}
                  <p className="resume-sub">
                    {resume.projectMeta?.[p.slug] || p.role}
                  </p>
                  {highlights.length ? (
                    <ul className="resume-points resume-points--tight">
                      {highlights.map((h) => (
                        <li key={h}>
                          <span className="resume-dot" aria-hidden="true" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {/* 仓库与线上地址：投递简历时这两个是必查项，
                      只在页面上放个标题链接，投递方还得自己去 GitHub 找。 */}
                  <p className="resume-links">
                    {p.github ? (
                      <a href={p.github} target="_blank" rel="noreferrer noopener">
                        <Github size={14} />GitHub
                      </a>
                    ) : null}
                    {p.site ? (
                      <a href={p.site} target="_blank" rel="noreferrer noopener">
                        <ExternalLink size={14} />在线站点
                      </a>
                    ) : null}
                  </p>
                </li>
                );
              })}
            </ul>
          </section>

          <section className="resume-block" id="resume-honors" data-reveal>
            <h2>证书与校园</h2>
            <ul className="resume-honors">
              {resume.honors.map((h) => (
                <li key={h.title}>
                  <span>{h.title}</span>
                  {h.period ? <span className="resume-period">{h.period}</span> : null}
                </li>
              ))}
            </ul>
          </section>

          <div className="doc-end" data-reveal>
            <h3>需要 PDF 版本？</h3>
            <p>上面这份内容也有排好版的 PDF，投递或转发时用它可以保留原始排版。</p>
            <div className="hero-actions hero-actions--left">
              <a className="btn btn--solid" href={media.resume.pdf} download="卢柯宇简历.pdf">
                下载 PDF
                <ArrowDown size={16} />
              </a>
              <button className="btn btn--plain" type="button" onClick={onCopyEmail || fallbackCopyEmail}>
                <Copy size={16} />
                复制邮箱
              </button>
            </div>
          </div>
        </article>

        <aside className="resume-preview" data-reveal="img">
          <button
            type="button"
            className="resume-paper"
            onClick={() => setLightboxOpen(true)}
            aria-label="放大查看简历原版"
          >
            <img
              src={media.resume.preview}
              srcSet={`${media.resume.previewSmall} 900w, ${media.resume.preview} 1588w`}
              sizes="(max-width: 1068px) 92vw, 380px"
              alt="卢柯宇简历预览"
              loading="lazy"
              {...imgAttrs(media.resume.preview)}
            />
            <span className="resume-paper-zoom" aria-hidden="true">
              <Search size={15} />
              点击放大
            </span>
          </button>
          <p className="resume-preview-note">简历原版预览 · 共 1 页 A4</p>
        </aside>
      </div>

      {lightboxOpen && (
        <ImageLightbox
          src={media.resume.preview}
          srcSet={`${media.resume.previewSmall} 900w, ${media.resume.preview} 1588w`}
          sizes="92vw"
          alt="卢柯宇简历"
          caption={`卢柯宇简历 · ${resume.updated}`}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}

/* ============ 回到顶部已移到全局页脚，不再由页面各自渲染 ============ */

export { ProjectPage, CategoryPage, ResumePage };
