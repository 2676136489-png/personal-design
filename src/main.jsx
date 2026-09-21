import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
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
  navItems,
  profile,
  projects,
  timeline,
} from './data.js';
import { goToSection, navigate, useRoute } from './router.js';
import { SplitText, usePageMotion, useSlidingIndicator } from './motion.jsx';
import './styles.css';

const SECTION_IDS = ['top', 'work', 'skills', 'about', 'contact'];

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

function Navigation({ theme, onThemeChange, onCommandOpen, path }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollActive, setScrollActive] = useState('top');
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

  const handleNav = (event, item) => {
    const isHome = item.href === '#/' || item.href.startsWith('#/#');
    if (item.href === '#/') {
      event.preventDefault();
      navigate('/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (item.href.startsWith('#/#')) {
      event.preventDefault();
      goToSection(item.href.replace('#/#', ''));
      return;
    }
    if (isHome) return;
  };

  return (
    <header className="global-nav" data-scrolled={scrolled}>
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
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              data-active={item.id === activeKey}
              onClick={(e) => handleNav(e, item)}
            >
              {item.label}
            </a>
          ))}
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
        <h1 data-intro style={{ '--i': 0 }}>
          {profile.name}
          <span>
            <SplitText text={profile.tagline} delay={180} step={26} />
          </span>
        </h1>
        <p className="hero-lede" data-intro style={{ '--i': 2 }}>
          {profile.education}。用工程能力承载想法，用设计判断组织信息，
          把课堂里的题目做成别人真的会打开来用的东西。
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
        <h2>每一个，都是完整做完的。</h2>
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
        <h2>不止一种身份，也不止一种解法。</h2>
        <p className="section-lede">
          工程、算法、界面与协作彼此连接，形成一套更靠近真实落地的做事方式。
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
        <h2>从工程基础，走向完整交付。</h2>
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
        <p>欢迎交流实习机会、项目合作与技术问题，我会尽快回复。</p>
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

  useEffect(() => {
    const anchor = window.location.hash.split('#')[2];
    if (!anchor) return undefined;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(anchor);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 160);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <Hero />
      <FeaturedSection />
      <WorkSection />
      <SkillsSection />
      <AboutSection />
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
    return null;
  });
}

function CampusPage({ onCopyEmail }) {
  const [activeChapter, setActiveChapter] = useState(campus.chapters[0].id);

  usePageMotion([]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    const onScroll = () => {
      let current = campus.chapters[0].id;
      campus.chapters.forEach((c) => {
        const el = document.getElementById(c.id);
        if (el && el.getBoundingClientRect().top <= 180) current = c.id;
      });
      setActiveChapter(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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

      <section className="metrics-strip" data-reveal="scale">
        {campus.metrics.map((m) => (
          <div key={m.label}>
            <strong data-count={m.value}>{m.value}</strong>
            <span>{m.label}</span>
          </div>
        ))}
      </section>

      <div className="doc-layout">
        <aside className="doc-toc" aria-label="章节目录">
          <p className="toc-title">目录</p>
          {campus.chapters.map((c) => (
            <a key={c.id} href={`#/campus#${c.id}`} data-active={activeChapter === c.id}>
              <span>{c.kicker}</span>
              {c.nav}
            </a>
          ))}
        </aside>

        <article className="doc-body">
          {campus.chapters.map((c) => (
            <section className="doc-chapter" id={c.id} key={c.id}>
              <p className="chapter-kicker">{c.kicker}</p>
              <h2>{c.title}</h2>
              <ChapterBlocks blocks={c.blocks} />
            </section>
          ))}

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
  usePageMotion([project?.id]);

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

  const others = projects.filter((p) => p.id !== project.id).slice(0, 3);

  return (
    <>
      <header className="page-hero page-hero--compact">
        <div className="page-hero-inner">
          <a className="back-link" href="#/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
            <ArrowLeft size={15} />
            返回首页
          </a>
          <p className="eyebrow">{project.tag} · {project.period}</p>
          <h1>{project.title}</h1>
          <p className="page-hero-lede">{project.description}</p>
          <div className="hero-actions hero-actions--left">
            {project.github ? (
              <a className="btn btn--solid" href={project.github} target="_blank" rel="noreferrer noopener">
                <Github size={16} />
                GitHub 源码
              </a>
            ) : null}
            <MailButton className="btn btn--plain" />
          </div>
        </div>
        <div className="page-hero-shot" data-parallax="0.07">
          <img src={project.image} alt={`${project.title} 项目视觉`} />
        </div>
      </header>

      <div className="doc-layout doc-layout--single">
        <article className="doc-body">
          <section className="doc-chapter">
            <p className="chapter-kicker">01</p>
            <h2>挑战</h2>
            <p className="prose">{project.detail.challenge}</p>
          </section>

          <section className="doc-chapter">
            <p className="chapter-kicker">02</p>
            <h2>做法</h2>
            <p className="prose">{project.detail.solution}</p>
          </section>

          <section className="doc-chapter">
            <p className="chapter-kicker">03</p>
            <h2>核心模块</h2>
            <ul className="point-list">
              {project.detail.modules.map((m) => (
                <li key={m}>
                  <Check size={15} />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </section>
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

/* ============ 命令面板 ============ */

function CommandMenu({ open, onClose, onCopyEmail, onThemeChange, theme }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const actions = useMemo(
    () => [
      { id: 'home', label: '回到首页', run: () => navigate('/') },
      { id: 'campus', label: '校园圈子 · 完整项目详解', run: () => navigate('/campus') },
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
      <Toast toast={toast} onDismiss={setToast} />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
