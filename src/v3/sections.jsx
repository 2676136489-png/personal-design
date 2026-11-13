import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, ExternalLink, Github, Mail, MapPin, Phone } from 'lucide-react';
import {
  ALL_PROJECTS,
  HERO_OBJECT,
  MARQUEE_ROW_ONE,
  MARQUEE_ROW_TWO,
  NAV_ITEMS,
  achievements,
  capabilities,
  heroFacts,
  imgAttrs,
  media,
  profile,
  resume,
  timeline,
} from './content.js';
import { galleryFor } from './gallery.js';
import {
  AnimatedText,
  FadeIn,
  GhostButton,
  GradientButton,
  Magnet,
  SectionTitle,
} from './lib.jsx';

/* ---------------- 导航 ---------------- */

export function SiteNav() {
  return (
    <header className="v3-nav">
      <a className="v3-nav-mark" href="#/" aria-label="回到首页">
        LKY<span className="v3-nav-dot">.</span>
      </a>
      <nav className="v3-nav-links" aria-label="主导航">
        {NAV_ITEMS.slice(1).map((item) => (
          <a key={item.href} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
      <a className="v3-nav-status" href="#/contact">
        <i aria-hidden="true" /> 开放实习机会
      </a>
    </header>
  );
}

/* ---------------- 01 首屏 ---------------- */

export function Hero() {
  return (
    <section className="v3-hero" id="top">
      <FadeIn delay={0} y={-20} className="v3-hero-top">
        <span className="v3-eyebrow">{profile.education}</span>
        <span className="v3-eyebrow">{profile.status} · {profile.city}</span>
      </FadeIn>

      <FadeIn delay={0.15} y={40} className="v3-hero-head">
        <h1 className="v3-hero-h1 v3-gradient">LUKEYU</h1>
      </FadeIn>

      <div className="v3-hero-object">
        <FadeIn delay={0.6} y={30}>
          <Magnet padding={150} strength={3}>
            <img
              src={HERO_OBJECT}
              alt="抽象的三维环形雕塑"
              className="v3-object-img"
              {...imgAttrs(HERO_OBJECT)}
            />
          </Magnet>
        </FadeIn>
      </div>

      <FadeIn delay={0.35} y={20} className="v3-hero-bottom">
        <div className="v3-hero-left">
          <p className="v3-hero-name">{profile.name}</p>
          <p className="v3-hero-tagline">{profile.tagline}</p>
        </div>
        <FadeIn delay={0.5} y={20} className="v3-hero-cta">
          <GradientButton href="#/contact">联系我</GradientButton>
          <a className="v3-scroll-hint" href="#/works">
            看作品 <ArrowDownRight size={16} aria-hidden="true" />
          </a>
        </FadeIn>
      </FadeIn>
    </section>
  );
}

/* ---------------- 首屏数据条 ---------------- */

export function FactsBand() {
  return (
    <section className="v3-facts" aria-label="作品数据">
      {heroFacts.map((fact, index) => (
        <FadeIn key={fact.label} delay={index * 0.08} className="v3-fact">
          <span className="v3-fact-value">{fact.value}</span>
          <span className="v3-fact-label">{fact.label}</span>
        </FadeIn>
      ))}
    </section>
  );
}

/* ---------------- 02 作品滚动带 ---------------- */

function MarqueeRow({ items, rowRef, reverse, groupSize, onPause, onResume }) {
  return (
    <div
      ref={rowRef}
      className="v3-marquee-row"
      data-reverse={reverse ? 'true' : 'false'}
      data-group-size={groupSize}
      onMouseEnter={onPause}
      onMouseLeave={onResume}
    >
      {items.map((item, index) => (
        <a
          key={`${item.slug}-${index}`}
          href={`#/${item.slug}`}
          className="v3-marquee-tile"
          title={item.title}
        >
          <img src={item.src} alt={item.title} loading="lazy" {...imgAttrs(item.src)} />
          <span className="v3-marquee-label">{item.title}</span>
        </a>
      ))}
    </div>
  );
}

/* 两行各自持续反向滚动，鼠标进入某一行只冻结那一行。
 *
 * 无缝循环靠「一组图片 + 组间距」的周期宽度取模：三倍复制的图片里，
 * 相位走满一个周期时第二组正好顶到第一组原来的位置，跳回 0 看不出来。
 * 周期宽度用实测 tile 宽 + CSS gap 算，不能拿 scrollWidth/3 近似 ——
 * 少算一个 gap 会在接缝处抖 12px。
 *
 * 页面滚动的视差仍然保留，但只在滚动事件里算好缓存，
 * 每帧只读缓存值，不在 rAF 里反复 getBoundingClientRect 触发布局。 */
export function Marquee() {
  const sectionRef = useRef(null);
  const rowOneRef = useRef(null);
  const rowTwoRef = useRef(null);
  const paused = useRef([false, false]);

  useEffect(() => {
    const section = sectionRef.current;
    const rows = [rowOneRef.current, rowTwoRef.current];
    if (!section || rows.some((row) => !row)) return undefined;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = rows.map(() => ({ offset: 0, speed: reduce ? 0 : 1, cycle: 0 }));
    let sectionTop = 0;
    let parallax = 0;
    let last = 0;
    let frame = 0;

    const measure = () => {
      sectionTop = section.getBoundingClientRect().top + window.scrollY;
      rows.forEach((row, index) => {
        const tile = row.querySelector('.v3-marquee-tile');
        if (!tile) return;
        const width = tile.getBoundingClientRect().width;
        const gap = parseFloat(getComputedStyle(row).columnGap) || 12;
        const size = Number(row.dataset.groupSize) || 1;
        state[index].cycle = size * (width + gap);
      });
    };

    const onScroll = () => {
      parallax = ((window.scrollY - sectionTop + window.innerHeight) * 0.3 - 200) * 0.5;
    };

    const tick = (now) => {
      frame = window.requestAnimationFrame(tick);
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;

      rows.forEach((row, index) => {
        const current = state[index];
        const target = paused.current[index] || reduce ? 0 : 1;
        current.speed += (target - current.speed) * Math.min(1, dt * 7);
        if (Math.abs(current.speed - target) < 0.002) current.speed = target;
        /* 停稳后整行冻结，连视差也不再更新，否则滚页面时「停下的行」还会飘 */
        if (paused.current[index] && current.speed === 0) return;
        if (!current.cycle) return;

        current.offset += 34 * current.speed * dt;
        const phase = current.offset % current.cycle;
        const x = index === 0
          ? -phase + parallax
          : phase - current.cycle - parallax;
        row.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      });
    };

    const onResize = () => {
      measure();
      onScroll();
    };

    measure();
    onScroll();
    frame = window.requestAnimationFrame(tick);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const pause = (index, value) => () => {
    paused.current[index] = value;
  };

  return (
    <section ref={sectionRef} className="v3-marquee" aria-label="作品封面">
      <MarqueeRow
        items={MARQUEE_ROW_ONE}
        rowRef={rowOneRef}
        reverse={false}
        groupSize={MARQUEE_ROW_ONE.length / 3}
        onPause={pause(0, true)}
        onResume={pause(0, false)}
      />
      <MarqueeRow
        items={MARQUEE_ROW_TWO}
        rowRef={rowTwoRef}
        reverse
        groupSize={MARQUEE_ROW_TWO.length / 3}
        onPause={pause(1, true)}
        onResume={pause(1, false)}
      />
    </section>
  );
}

/* ---------------- 03 关于 ---------------- */

const CORNERS = [
  { className: 'tl', rotate: '-18deg', hue: '0deg' },
  { className: 'tr', rotate: '24deg', hue: '60deg' },
  { className: 'bl', rotate: '38deg', hue: '290deg' },
  { className: 'br', rotate: '-32deg', hue: '200deg' },
];

export function About() {
  return (
    <section className="v3-about" id="about">
      {CORNERS.map((corner, index) => (
        <FadeIn
          key={corner.className}
          delay={0.1 + index * 0.08}
          x={corner.className.includes('l') ? -80 : 80}
          y={0}
          duration={0.9}
          className={`v3-corner ${corner.className}`}
        >
          <img
            src={HERO_OBJECT}
            alt=""
            loading="lazy"
            style={{ transform: `rotate(${corner.rotate})`, filter: `hue-rotate(${corner.hue})` }}
          />
        </FadeIn>
      ))}

      <div className="v3-about-inner">
        <SectionTitle className="v3-gradient">关于我</SectionTitle>
        <AnimatedText text={resume.summary} className="v3-about-text" />
        <FadeIn delay={0.3} className="v3-profile-card">
          <img src={media.avatar} alt="卢柯宇的形象插画" className="v3-profile-avatar" {...imgAttrs(media.avatar)} />
          <div className="v3-profile-lines">
            <p className="v3-profile-name">{profile.name}</p>
            <p>{profile.school} · {profile.education.split(' · ')[1]}</p>
            <p>{resume.education[0].period} · {resume.education[0].gpa}</p>
            <p>{resume.education[0].points[0]}</p>
            <p>{profile.city}（{profile.hometown}）</p>
            <p className="v3-profile-status">{profile.status} · 求职方向 AI Agent / 后端开发实习</p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ---------------- 04 能力 ---------------- */

export function Capabilities() {
  return (
    <section className="v3-light v3-capabilities" id="skills">
      <SectionTitle className="v3-title-ink">能力</SectionTitle>
      <div className="v3-cap-list">
        {capabilities.map((cap, index) => (
          <FadeIn key={cap.title} delay={index * 0.1} className="v3-cap-row">
            <span className="v3-cap-num">{String(index + 1).padStart(2, '0')}</span>
            <div className="v3-cap-body">
              <h3>{cap.title}</h3>
              <p>{cap.text}</p>
              <div className="v3-tags">
                {cap.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
      <FadeIn delay={0.2} className="v3-skills-block">
        <p className="v3-eyebrow v3-eyebrow-ink">技术栈</p>
        <div className="v3-skills-grid">
          {resume.skillGroups.map(([name, detail]) => (
            <div key={name} className="v3-skill-item">
              <span>{name}</span>
              <p>{detail}</p>
            </div>
          ))}
        </div>
      </FadeIn>
    </section>
  );
}

/* ---------------- 05 作品堆叠卡 ---------------- */

/* 三格里的每一格：真实截图，或没有线上界面时的信息面板。
 * 面板也是一等内容，不是拿封面复制一份凑数。 */
function StackSlot({ slot, project }) {
  if (slot.kind === 'panel') {
    return (
      <div className={`v3-stack-panel v3-stack-panel-${slot.variant}`}>
        <span className="v3-stack-panel-title">{slot.title}</span>
        <ol>
          {slot.lines.map((line, i) => (
            <li key={`${line}-${i}`}>
              <span>{slot.variant === 'chapters' ? String(i + 1).padStart(2, '0') : '·'}</span>
              <b>{line}</b>
            </li>
          ))}
        </ol>
      </div>
    );
  }
  return (
    <img
      src={slot.src}
      alt={slot.alt || project.title}
      loading="lazy"
      width={slot.width}
      height={slot.height}
    />
  );
}

function ProjectCard({ project, index, total, progress }) {
  const targetScale = 1 - (total - 1 - index) * 0.015;
  const scale = useTransform(progress, [index * (1 / total), 1], [1, targetScale]);
  const shots = galleryFor(project);
  /* 参考站只有 3 张卡，固定 28px 累加没问题。这里有 9 张，
     累加到 224px 会把最后一张顶出视口，所以按总数摊平并封顶 120px。 */
  const stackOffset = Math.round((index * 120) / Math.max(1, total - 1));

  return (
    <div className="v3-stack-item" style={{ '--stack-offset': `${stackOffset}px` }}>
      <motion.article className="v3-stack-card" style={{ scale }}>
        <div className="v3-stack-top">
          <span className="v3-stack-num">{String(index + 1).padStart(2, '0')}</span>
          <div className="v3-stack-heading">
            <span className="v3-stack-cat">{project.category}</span>
            <h3>{project.title}</h3>
            <p>{project.description}</p>
            <p className="v3-stack-stack">{project.stack}</p>
          </div>
          <div className="v3-stack-actions">
            <a className="v3-btn-ghost" href={`#/${project.slug}`}>
              项目详解 <ArrowUpRight size={16} aria-hidden="true" />
            </a>
            {project.site && (
              <a className="v3-btn-ghost" href={project.site} target="_blank" rel="noreferrer">
                在线站点 <ExternalLink size={15} aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
        {project.metrics && project.metrics.length > 0 && (
          <div className="v3-stack-metrics">
            {project.metrics.slice(0, 4).map((metric) => (
              <span key={metric.label}>
                <b>{metric.value}</b> {metric.label}
              </span>
            ))}
          </div>
        )}
        <div className="v3-stack-grid">
          <div className="v3-stack-col">
            {shots.slice(0, 2).map((slot, i) => (
              <StackSlot key={`${slot.src || slot.variant}-${i}`} slot={slot} project={project} />
            ))}
          </div>
          <div className="v3-stack-col v3-stack-col-wide">
            <StackSlot slot={shots[2]} project={project} />
          </div>
        </div>
        <div className="v3-stack-foot">
          <span>{project.period}</span>
          {project.github && (
            <a href={project.github} target="_blank" rel="noreferrer">
              <Github size={15} aria-hidden="true" /> GitHub
            </a>
          )}
        </div>
      </motion.article>
    </div>
  );
}

export function Projects() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  return (
    <section className="v3-projects" id="work">
      <SectionTitle className="v3-gradient">作品</SectionTitle>
      <p className="v3-section-lede">九个项目，从线上运行的系统到算法与视觉探索。</p>
      <div ref={ref} className="v3-stack">
        {ALL_PROJECTS.map((project, index) => (
          <ProjectCard
            key={project.slug}
            project={project}
            index={index}
            total={ALL_PROJECTS.length}
            progress={scrollYProgress}
          />
        ))}
      </div>
      <div className="v3-projects-more">
        <GhostButton href="#/works">按方向浏览全部作品</GhostButton>
      </div>
    </section>
  );
}

/* ---------------- 06 经历 ---------------- */

export function Timeline() {
  return (
    <section className="v3-timeline">
      <SectionTitle className="v3-gradient">经历</SectionTitle>
      <div className="v3-timeline-list">
        {timeline.map((item, index) => (
          <FadeIn key={`${item.year}-${item.title}`} delay={index * 0.05} className="v3-timeline-row">
            <span className="v3-timeline-year">{item.year}</span>
            <div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

/* ---------------- 07 简历与荣誉 ---------------- */

export function Resume() {
  return (
    <section className="v3-light v3-resume" id="resume-teaser">
      <SectionTitle className="v3-title-ink">简历</SectionTitle>
      <div className="v3-resume-grid">
        <FadeIn delay={0.1} className="v3-resume-side">
          <img
            src={media.resume.previewSmall}
            alt="卢柯宇简历预览"
            loading="lazy"
            {...imgAttrs(media.resume.previewSmall)}
          />
          <div className="v3-resume-actions">
            <a className="v3-btn-ink" href="#/resume">查看完整简历</a>
            <a className="v3-btn-ink-outline" href={media.resume.pdf} target="_blank" rel="noreferrer">
              下载 PDF
            </a>
          </div>
        </FadeIn>
        <div className="v3-resume-body">
          <p className="v3-eyebrow v3-eyebrow-ink">荣誉与成绩</p>
          <div className="v3-honor-grid">
            {achievements.map((item) => (
              <FadeIn key={item.title} className="v3-honor">
                <b>{item.title}</b>
                <span>{item.meta}</span>
              </FadeIn>
            ))}
          </div>
          <p className="v3-eyebrow v3-eyebrow-ink">个人优势</p>
          <ul className="v3-advantages">
            {resume.advantages.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="v3-resume-updated">最近更新 {resume.updated}</p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 08 联系 ---------------- */

export function Contact() {
  const links = [
    { icon: Mail, label: '邮箱', value: profile.email, href: `mailto:${profile.email}` },
    { icon: Github, label: 'GitHub', value: '2676136489-png', href: profile.github },
    { icon: Phone, label: '电话', value: profile.phone, href: `tel:${profile.phone}` },
    { icon: MapPin, label: '现居', value: `${profile.city}（${profile.hometown}）`, href: null },
  ];

  return (
    <footer className="v3-contact" id="contact">
      <SectionTitle className="v3-gradient v3-contact-title">联系我</SectionTitle>
      <p className="v3-contact-lede">在找 AI Agent / 后端开发实习机会，欢迎聊聊。</p>
      <GradientButton href={`mailto:${profile.email}`} className="v3-contact-cta">
        发邮件 <ArrowUpRight size={18} aria-hidden="true" />
      </GradientButton>
      <div className="v3-contact-links">
        {links.map(({ icon: Icon, label, value, href }) => (
          <div key={label} className="v3-contact-link">
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
            {href ? (
              <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                {value}
              </a>
            ) : (
              <b>{value}</b>
            )}
          </div>
        ))}
      </div>
      <div className="v3-footer">
        <span>© 2026 {profile.name} · {profile.school}</span>
        <span>{profile.status} · AI Agent / 后端开发实习</span>
      </div>
    </footer>
  );
}

export function Landing() {
  return (
    <>
      <Hero />
      <FactsBand />
      <Marquee />
      <About />
      <Capabilities />
      <Projects />
      <Timeline />
      <Resume />
      <Contact />
    </>
  );
}
