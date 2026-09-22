import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Award,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Github,
  GraduationCap,
  Mail,
  MapPin,
  Menu,
  Moon,
  Phone,
  Search,
  Sun,
  Trophy,
  X,
} from 'lucide-react';
import {
  achievements,
  asset,
  campus,
  capabilities,
  heroFacts,
  mailServices,
  media,
  navItems,
  profile,
  projects,
  resume,
  timeline,
} from './data.js';
import { goToNavTarget, goToSection, navigate, useRoute } from './router.js';
import { SplitText, useBackToTop, usePageMotion, useSlidingIndicator } from './motion.jsx';
import { ImageLightbox } from './lightbox.jsx';
import './styles.css';

const SECTION_IDS = ['top', 'work', 'about', 'skills', 'contact'];

function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const el = document.createElement('textarea');
  el.value = text;
  el.style.position = 'fixed';
  el.style.opacity = '0';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  el.remove();
  return Promise.resolve();
}

function trapTabInDialog(event, container) {
  if (event.key !== 'Tab' || !container) return;
  const focusable = Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => el.getClientRects().length > 0);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/* ============ 顶部导航 ============ */

/* 下拉的收起要延后一拍再执行，否则指针从触发项移向面板的途中
   会经过两者之间的缝隙，菜单会先关再开，看起来像在闪烁。
   这一拍里指针若又移回组内，定时器会被 onMouseEnter 作废。 */
export const dropdownCloseDelay = () => 140;

function NavGroup({ item, label, active, onNavigate, onOpenChange }) {
  const [open, setOpen] = useState(false);
  const keepTimerRef = useRef(false);
  const timerRef = useRef(0);

  const clear = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = 0;
    }
  };

  /* open 的每次翻转都要同步给外层：导航栏要在面板展开时跟着换底色，
     两者连成一片才没有接缝。 */
  const commit = (next) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  const openNow = () => {
    keepTimerRef.current = false;
    clear();
    commit(true);
  };

  const closeNow = () => {
    keepTimerRef.current = false;
    clear();
    commit(false);
  };

  const closeLater = () => {
    keepTimerRef.current = true;
    clear();
    timerRef.current = window.setTimeout(() => {
      // 这一拍里指针又回来了（onMouseLeave → onMouseEnter）就作废
      if (keepTimerRef.current) closeNow();
    }, dropdownCloseDelay());
  };

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      // 组件卸载时若面板还开着，得把外层状态一起复位，
      // 否则切页后导航栏会停在面板的底色上
      onOpenChange?.(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // 焦点离开整组（含面板）就收起，键盘用户不会留下一个悬空的面板
  const onBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) closeNow();
  };

  return (
    <div
      className="nav-group"
      data-open={open}
      onMouseEnter={openNow}
      onMouseLeave={closeLater}
      onFocus={openNow}
      onBlur={onBlur}
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || !open) return;
        // 停在这里，屏掉全局的 ESC 处理，否则会顺手把命令面板也关了
        event.stopPropagation();
        closeNow();
      }}
    >
      <a
        className="nav-group-trigger"
        href={item.href}
        data-active={active}
        aria-expanded={open}
        onClick={(event) => onNavigate(event, item)}
      >
        {label}
        <ChevronDown className="nav-caret" size={12} aria-hidden="true" />
      </a>

      <div className="nav-panel">
        <div className="nav-panel-inner">
          {item.columns.map((column, colIndex) => (
            <div className="nav-panel-col" key={column.title} style={{ '--c': colIndex }}>
              <p className="nav-panel-title">{column.title}</p>
              <ul>
                {column.featured?.map((entry, i) => (
                  <li key={`f-${entry.href}-${entry.label}`} style={{ '--i': i }}>
                    <a
                      className="nav-panel-featured"
                      href={entry.href}
                      target={entry.external ? '_blank' : undefined}
                      rel={entry.external ? 'noreferrer noopener' : undefined}
                      onClick={(event) => onNavigate(event, entry)}
                    >
                      {entry.label}
                      {entry.external ? <ArrowUpRight size={15} aria-hidden="true" /> : null}
                    </a>
                  </li>
                ))}
                {column.links?.map((entry, i) => (
                  <li
                    key={`l-${entry.href}-${entry.label}`}
                    style={{ '--i': (column.featured?.length || 0) + i }}
                  >
                    <a
                      href={entry.href}
                      target={entry.external ? '_blank' : undefined}
                      rel={entry.external ? 'noreferrer noopener' : undefined}
                      onClick={(event) => onNavigate(event, entry)}
                    >
                      {entry.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Navigation({ theme, onThemeChange, onCommandOpen, path }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollActive, setScrollActive] = useState('top');
  // 有面板展开时，导航栏整体换成面板底色，两者连成一片
  const [panelOpen, setPanelOpen] = useState(false);
  const menuRef = useRef(null);

  // 首页时导航跟随滚动锚点，否则跟随路由
  const activeKey = path === 'top' ? scrollActive : path;
  const indicatorStyle = useSlidingIndicator(menuRef, activeKey);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [path]);

  // 切换页面时收起面板，否则会留一个悬空的展开态
  useEffect(() => setPanelOpen(false), [path]);

  // 滚动跟随：取视口中线所在的那一节作为当前节
  useEffect(() => {
    if (path !== 'top') return undefined;
    const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean);
    if (!sections.length || !('IntersectionObserver' in window)) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setScrollActive(visible.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.25, 0.5, 1] },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [path]);

  const handleNav = (event, target) => {
    // 外部站点交给浏览器原生行为，不拦
    if (target.external || /^https?:/i.test(target.href)) return;
    event.preventDefault();
    goToNavTarget(target.href.replace(/^#/, ''));
  };

  return (
    <header className="global-nav" data-scrolled={scrolled} data-section={panelOpen}>
      <div className="nav-inner">
        <a
          className="nav-brand"
          href="#/"
          onClick={(e) => handleNav(e, { href: '#/' })}
          aria-label={`${profile.name}作品集首页`}
        >
          {profile.name}
          <span>作品集</span>
        </a>

        <nav className="nav-menu" aria-label="主导航" ref={menuRef}>
          {navItems.map((item) => {
            const { id, label } = item;
            const isActive = id === activeKey;
            if (!item.columns?.length) {
              return (
                <a
                  key={id}
                  href={item.href}
                  data-active={isActive}
                  onClick={(e) => handleNav(e, item)}
                >
                  {label}
                </a>
              );
            }
            return (
              <NavGroup
                key={id}
                item={item}
                label={label}
                active={isActive}
                onNavigate={(event, target) => handleNav(event, target)}
                onOpenChange={setPanelOpen}
              />
            );
          })}
          <span className="nav-indicator" style={indicatorStyle} aria-hidden="true" />
        </nav>

        <div className="nav-tools">
          <button className="nav-icon" type="button" aria-label="搜索与快捷操作" onClick={onCommandOpen}>
            <Search size={16} />
          </button>
          <button
            className="nav-icon"
            type="button"
            aria-label={theme === 'light' ? '切换到深色外观' : '切换到浅色外观'}
            onClick={onThemeChange}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button
            className="nav-icon nav-icon--menu"
            type="button"
            aria-label="打开导航菜单"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="nav-drawer">
          {navItems.map((item) => (
            <a key={item.id} href={item.href} onClick={(e) => handleNav(e, item)}>
              {item.label}
              <ChevronRight size={16} />
            </a>
          ))}
        </div>
      ) : null}
    </header>
  );
}

/* ============ 邮件下拉 ============ */

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

/* ============ 页脚 ============ */

function SiteFooter({ onCopyEmail }) {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <h4>联系方式</h4>
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
          <a href={`tel:${profile.phone}`}>
            <Phone size={13} />
            {profile.phone}
          </a>
          <button className="footer-mail" type="button" onClick={onCopyEmail}>
            复制邮箱地址
          </button>
        </div>
        <div>
          <h4>站点导航</h4>
          {navItems.map((item) => (
            <a key={item.id} href={item.href}>
              {item.label}
            </a>
          ))}
        </div>
        <div>
          <h4>其他</h4>
          <a href={profile.github} target="_blank" rel="noreferrer noopener">
            <Github size={13} />
            GitHub
          </a>
          <a
            href="#/"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            返回顶部
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 {profile.name}</span>
        <span>{profile.school} · 计算机科学与技术</span>
      </div>
    </footer>
  );
}

/* ============ 首页 ============ */

function Hero() {
  return (
    <section id="top" className="hero">
      <div className="hero-copy" data-parallax="0.05">
        <p className="hero-welcome" data-intro style={{ '--i': 0 }}>
          {profile.welcome}
        </p>
        <h1 data-intro style={{ '--i': 1 }}>
          <SplitText text={profile.tagline} delay={180} step={26} />
        </h1>
        <p className="hero-lede" data-intro style={{ '--i': 2 }}>
          {profile.heroIntro}
        </p>
        <div className="hero-actions" data-intro style={{ '--i': 3 }}>
          <a className="btn btn--solid" data-magnetic href="#/campus" onClick={(e) => { e.preventDefault(); navigate('/campus'); }}>
            查看校园圈子
            <ArrowRight size={16} />
          </a>
          <a className="btn btn--plain" data-magnetic href="#/#work" onClick={(e) => { e.preventDefault(); goToSection('work'); }}>
            浏览全部作品
            <ArrowDown size={16} />
          </a>
        </div>
      </div>

      <div className="hero-facts" data-intro style={{ '--i': 4 }}>
        {heroFacts.map((item) => (
          <div key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturedSection() {
  const preview = campus.chapters[1].blocks.filter((b) => b.type === 'shot').slice(0, 3);
  const otherShots = campus.chapters[3].blocks.filter((b) => b.type === 'shot').slice(0, 1);

  return (
    <section id="featured" className="featured">
      <div className="section-head" data-reveal>
        <h2>{campus.headline}</h2>
        <p className="section-lede">{campus.lede}</p>
        <div className="featured-meta">
          <span>{campus.en}</span>
          <span>{campus.period}</span>
          <span>{campus.role}</span>
        </div>
        <div className="hero-actions">
          <a
            className="btn btn--solid"
            data-magnetic
            href="#/campus"
            onClick={(e) => {
              e.preventDefault();
              navigate('/campus');
            }}
          >
            查看完整项目详解
            <ArrowRight size={16} />
          </a>
          <a className="btn btn--plain" data-magnetic href={campus.site} target="_blank" rel="noreferrer noopener">
            访问线上站点
            <ArrowUpRight size={16} />
          </a>
        </div>
      </div>

      <div className="campus-metrics" data-reveal="scale">
        {campus.metrics.map((m) => (
          <div key={m.label}>
            <strong data-count={m.value}>{m.value}</strong>
            <span>{m.label}</span>
          </div>
        ))}
      </div>

      <div className="stage-grid">
        {[...preview, ...otherShots].map((shot, i) => (
          <figure
            className={`stage-item stage-item--${i === 0 ? 'wide' : 'normal'}`}
            key={shot.src}
            data-reveal="img"
            style={{ '--i': i }}
          >
            <img src={shot.src} alt={shot.alt} loading="lazy" decoding="async" />
            <figcaption>{shot.caption}</figcaption>
          </figure>
        ))}
      </div>

      <div className="section-head section-head--center more-head" data-reveal="mask">
        <p className="eyebrow">完整项目详解</p>
        <h2>六个章节，讲清这个产品。</h2>
      </div>

      <div className="chapter-cards">
        {campus.chapters.map((c, i) => (
          <a
            className="chapter-card"
            key={c.id}
            href={`#/campus#${c.id}`}
            data-reveal="scale"
            data-tilt
            style={{ '--i': i }}
          >
            <span className="chapter-index">{c.kicker}</span>
            <h3>{c.nav}</h3>
            <p>{c.title}</p>
            <span className="chapter-more">
              阅读
              <ChevronRight size={15} />
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

function WorkSection() {
  return (
    <section id="work" className="work">
      <div className="section-head section-head--center" data-reveal="mask">
        <p className="eyebrow">全部作品</p>
        <h2>每一个都做完了。</h2>
        <p className="section-lede">
          算法、系统、Web 与视觉，覆盖从底层逻辑到最终呈现的完整链路。
        </p>
      </div>

      <div className="work-grid">
        {projects.map((project, i) => (
          <article className="work-card" key={project.id} data-reveal data-tilt style={{ '--i': i % 2 }}>
            <a href={`#/${project.slug}`} onClick={(e) => { e.preventDefault(); navigate(`/${project.slug}`); }}>
              <div className="work-media">
                <img src={project.image} alt={`${project.title} 项目视觉`} loading="lazy" decoding="async" />
              </div>
              <div className="work-body">
                <p className="work-meta">
                  <span>{project.category}</span>
                  <time>{project.year}</time>
                </p>
                <h3>{project.title}</h3>
                <p className="work-desc">{project.description}</p>
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
  );
}

function SkillsSection() {
  return (
    <section id="skills" className="skills">
      <div className="section-head" data-reveal="mask">
        <p className="eyebrow">能力</p>
        <h2>四个方向，一套做事方式。</h2>
        <p className="section-lede">
          算法与工程打底，前端负责呈现，协作把想法推到落地。
        </p>
      </div>

      <div className="skills-grid">
        {capabilities.map((item, index) => (
          <article className="skill" key={item.title} data-reveal="scale" data-tilt style={{ '--i': index % 3 }}>
            <span className="skill-index">{String(index + 1).padStart(2, '0')}</span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
            <ul>
              {item.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="achievement-panel" data-reveal>
        <div className="achievement-head">
          <Trophy size={18} />
          <h3>成绩与荣誉</h3>
        </div>
        <ul className="achievement-list">
          {achievements.map((item) => (
            <li key={item.title}>
              <Award size={15} />
              <span className="achievement-title">{item.title}</span>
              <span className="achievement-meta">{item.meta}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" className="about">
      <div className="section-head" data-reveal>
        <p className="eyebrow">关于</p>
        <h2>正在成为一个能独立交付的人。</h2>
        <p className="section-lede">
          从 2024 年进入吉林大学起，课堂之外的时间基本都花在了把想法做成项目上。
        </p>
      </div>

      <div className="about-grid">
        <div className="about-profile" data-reveal>
          <div className="about-avatar">
            <img src={asset('/media/avatar-lky.webp')} alt={profile.name} />
          </div>
          <h3>{profile.name}</h3>
          <p className="about-role">{profile.status}</p>
          <ul className="about-facts">
            <li>
              <GraduationCap size={16} />
              <span>{profile.education}</span>
            </li>
            <li>
              <MapPin size={16} />
              <span>{profile.city}</span>
            </li>
            <li>
              <BookOpen size={16} />
              <span>数据结构 · 算法 · 操作系统 · 计算机组成原理</span>
            </li>
          </ul>
          <a className="btn btn--plain about-github" href={profile.github} target="_blank" rel="noreferrer noopener">
            <Github size={16} />
            github.com/2676136489-png
          </a>
        </div>

        <ol className="about-timeline" data-reveal>
          {timeline.map((item) => (
            <li key={`${item.year}-${item.title}`}>
              <time>{item.year}</time>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ContactSection({ onCopyEmail }) {
  return (
    <section id="contact" className="contact">
      <div className="contact-inner" data-reveal>
        <h2>
          有合适的机会，
          <span>或者只是想聊聊？</span>
        </h2>
        <p>实习、项目合作、技术问题，都可以直接找我，看到就会回。</p>
        <div className="hero-actions">
          <MailButton />
          <button className="btn btn--plain" type="button" onClick={onCopyEmail}>
            <Copy size={15} />
            {profile.email}
          </button>
        </div>
      </div>
      <SiteFooter onCopyEmail={onCopyEmail} />
    </section>
  );
}

function HomePage({ onCopyEmail }) {
  usePageMotion([]);
  useAnchorScroll();

  return (
    <>
      <Hero />
      <FeaturedSection />
      <WorkSection />
      <AboutSection />
      <SkillsSection />
      <ContactSection onCopyEmail={onCopyEmail} />
    </>
  );
}

/* ============ 校园圈子详情页 ============ */

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
          <div className="shot-frame">
            <img src={block.src} alt={block.alt} loading="lazy" />
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

function CampusPage({ onCopyEmail }) {
  const activeChapter = useChapterScroll(campus.chapters);

  usePageMotion([]);
  useAnchorScroll();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  return (
    <>
      <header className="page-hero">
        <div className="page-hero-inner">
          <a className="back-link" href="#/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
            <ArrowLeft size={15} />
            返回首页
          </a>
          <p className="eyebrow">{campus.en} · {campus.period}</p>
          <h1>{campus.name}</h1>
          <p className="page-hero-lede">{campus.lede}</p>
          <div className="page-hero-meta">
            <span>{campus.role}</span>
            <span>{campus.stack}</span>
          </div>
          <div className="hero-actions hero-actions--left">
            <a className="btn btn--solid" data-magnetic href={campus.site} target="_blank" rel="noreferrer noopener">
              访问线上站点
              <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
        <div className="page-hero-shot" data-parallax="0.07">
          <img src={campus.cover} alt="校园圈子学生中心界面" />
        </div>
      </header>

      <MetricsStrip metrics={campus.metrics} />

      <div className="doc-layout">
        <DocToc chapters={campus.chapters} activeId={activeChapter} slug="campus" />

        <article className="doc-body">
          <DocChapters chapters={campus.chapters} />

          <div className="doc-end" data-reveal>
            <h3>想进一步了解？</h3>
            <p>源码、数据库设计与测试用例都可以在仓库里查看，也欢迎直接聊。</p>
            <div className="hero-actions hero-actions--left">
              <a className="btn btn--solid" href={campus.site} target="_blank" rel="noreferrer noopener">
                打开线上站点
                <ArrowUpRight size={16} />
              </a>
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
          {projects.slice(0, 4).map((p, i) => (
            <article className="work-card" key={p.id} data-reveal data-tilt style={{ '--i': i % 2 }}>
              <a href={`#/${p.slug}`} onClick={(e) => { e.preventDefault(); navigate(`/${p.slug}`); }}>
                <div className="work-media">
                  <img src={p.image} alt={`${p.title} 项目视觉`} />
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

      <SiteFooter onCopyEmail={onCopyEmail} />
    </>
  );
}

/* ============ 其他项目详情页 ============ */

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
    <>
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
          <img src={project.image} alt={`${project.title} 项目视觉`} />
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
                  <img src={p.image} alt={`${p.title} 项目视觉`} />
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

      <SiteFooter onCopyEmail={onCopyEmail} />
    </>
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
    <>
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
              {resumeProjects.map((p) => (
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
                  <p className="resume-sub">{p.role}</p>
                  {p.lede ? <p className="resume-desc">{p.lede}</p> : null}
                </li>
              ))}
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
              <button className="btn btn--plain" type="button" onClick={onCopyEmail}>
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
          caption="卢柯宇简历 · 2026 年 9 月"
          onClose={() => setLightboxOpen(false)}
        />
      )}

      <SiteFooter onCopyEmail={onCopyEmail} />
    </>
  );
}

/* ============ 回到顶部 ============ */

function BackToTop() {
  const { visible, toTop } = useBackToTop();

  return (
    <button
      className="back-to-top"
      type="button"
      aria-label="回到页面顶端"
      data-visible={visible}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      onClick={toTop}
    >
      <ArrowUp size={17} />
      <span>顶部</span>
    </button>
  );
}

/* ============ 命令面板 ============ */

function CommandMenu({ open, onClose, onCopyEmail, onThemeChange, theme }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const actions = useMemo(
    () => [
      { id: 'home', label: '回到首页', run: () => navigate('/') },
      { id: 'campus', label: '校园圈子 · 完整项目详解', run: () => navigate('/campus') },
      { id: 'resume', label: '我的简历 · 在线版与 PDF', run: () => navigate('/resume') },
      { id: 'work', label: '首页 · 全部作品', run: () => goToSection('work') },
      { id: 'skills', label: '首页 · 能力与成绩', run: () => goToSection('skills') },
      { id: 'about', label: '首页 · 关于与时间线', run: () => goToSection('about') },
      { id: 'contact', label: '首页 · 联系方式', run: () => goToSection('contact') },
      ...projects.map((p) => ({
        id: p.slug,
        label: `${p.title} · 项目详情`,
        run: () => navigate(`/${p.slug}`),
      })),
      { id: 'email', label: '复制邮箱地址', run: onCopyEmail },
      {
        id: 'theme',
        label: theme === 'light' ? '切换到深色外观' : '切换到浅色外观',
        run: () => onThemeChange(theme === 'light' ? 'dark' : 'light'),
      },
    ],
    [onCopyEmail, onThemeChange, theme],
  );

  const visible = actions.filter((a) =>
    a.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  useEffect(() => {
    if (!open) return undefined;
    setQuery('');
    document.body.setAttribute('data-overlay-open', 'true');
    window.requestAnimationFrame(() => inputRef.current?.focus());
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.removeAttribute('data-overlay-open');
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="command-backdrop"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section className="command-menu" role="dialog" aria-modal="true" aria-label="快捷搜索">
        <div className="command-search">
          <Search size={17} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索页面或操作"
            aria-label="搜索"
          />
          <kbd>ESC</kbd>
        </div>
        <div className="command-list">
          {visible.length ? (
            visible.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  a.run();
                  onClose();
                }}
              >
                {a.label}
                <ChevronRight size={15} />
              </button>
            ))
          ) : (
            <p className="command-empty">没有找到相关操作</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => onDismiss(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;
  return (
    <div className="toast" role="status">
      <Check size={15} />
      {toast}
    </div>
  );
}

/* ============ 应用根 ============ */

function App() {
  const route = useRoute();
  const [theme, setTheme] = useState(() => localStorage.getItem('portfolio-theme') || 'light');
  const [commandOpen, setCommandOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('portfolio-theme', theme);
  }, [theme]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
      if (e.key === 'Escape') setCommandOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleCopyEmail = async () => {
    await copyToClipboard(profile.email);
    setToast('邮箱已复制');
  };

  const path = route.path.replace(/^\//, '');
  const project = projects.find((p) => p.slug === path);

  let page;
  if (!path) {
    page = <HomePage onCopyEmail={handleCopyEmail} />;
  } else if (path === 'campus') {
    page = <CampusPage onCopyEmail={handleCopyEmail} />;
  } else if (path === 'resume') {
    page = <ResumePage onCopyEmail={handleCopyEmail} />;
  } else if (project) {
    page = <ProjectPage project={project} onCopyEmail={handleCopyEmail} />;
  } else {
    page = <ProjectPage project={null} onCopyEmail={handleCopyEmail} />;
  }

  const navKey = path === 'campus' ? 'campus' : path ? '' : 'top';

  return (
    <div className="site-shell">
      <div className="scroll-progress" data-progress aria-hidden="true" />
      <Navigation
        theme={theme}
        onThemeChange={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        onCommandOpen={() => setCommandOpen(true)}
        path={navKey}
      />
      <main key={route.path}>{page}</main>
      <CommandMenu
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onCopyEmail={handleCopyEmail}
        onThemeChange={setTheme}
        theme={theme}
      />
      <BackToTop />
      <Toast toast={toast} onDismiss={setToast} />
    </div>
  );
}

// 具名导出供 scripts/smoke-render.mjs 做服务端渲染冒烟测试使用；
// 浏览器里仍走下面的 createRoot 挂载，不受影响。
export { App };

if (typeof document !== 'undefined' && document.getElementById('root')) {
  createRoot(document.getElementById('root')).render(<App />);
}
