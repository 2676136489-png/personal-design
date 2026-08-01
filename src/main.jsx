import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Clock3,
  Code2,
  Command,
  Copy,
  Cpu,
  Github,
  Grid2X2,
  Layers3,
  Mail,
  MapPin,
  Moon,
  Palette,
  Phone,
  Search,
  Share2,
  Sparkles,
  Sun,
  SwatchBook,
  Trophy,
  UserRound,
  WandSparkles,
  X,
  Zap,
} from 'lucide-react';
import './styles.css';

const profile = {
  name: '卢柯宇',
  initials: 'LKY',
  roles: ['视觉设计', 'AI 设计', '品牌系统'],
  phone: '13752881722',
  email: 'luky2124@mails.jlu.edu.cn',
  city: '重庆',
  education: '吉林大学 · 计算机科学与技术',
};

let bodyOverlayLockCount = 0;

function acquireBodyOverlayLock() {
  bodyOverlayLockCount += 1;
  document.body.setAttribute('data-overlay-open', 'true');
}

function releaseBodyOverlayLock() {
  bodyOverlayLockCount = Math.max(0, bodyOverlayLockCount - 1);
  if (bodyOverlayLockCount === 0) {
    document.body.removeAttribute('data-overlay-open');
  }
}

const stats = [
  { label: '本科阶段', value: '2024-2028' },
  { label: '专业排名', value: '前 30%' },
  { label: '核心项目', value: '5 个项目' },
  { label: '英语能力', value: 'CET-4' },
];

const projects = [
  {
    id: 'station',
    title: '菜鸟驿站管理系统',
    shortTitle: '驿站系统',
    category: '系统设计',
    filter: 'system',
    tag: 'C Language / System Design',
    period: '2024.09 - 2024.12',
    image: '/media/project-station.png',
    description:
      '独立开发校园快递站管理系统，构建管理员与顾客双角色架构，完成数据结构规划、文件 IO 持久化与核心业务流程。',
    challenge:
      '快递、用户、费用与库存状态彼此关联，需要在命令行环境中保持清晰的角色边界和可追踪的数据流。',
    solution:
      '以管理员与顾客两条任务链拆分功能，通过结构体组织业务数据，并用文件读写保存关键状态，让查询、计费与预警形成完整闭环。',
    points: ['智能计费模型', '多维度快件查询', '库存预警与通知', '用户权限管理'],
    color: 'cyan',
  },
  {
    id: 'campus-circle',
    title: '校园圈子 Campus Circle',
    shortTitle: '校园圈子',
    category: '全栈应用',
    filter: 'web',
    tag: 'PHP / MySQL / Campus Social',
    period: '2026.07',
    image: '/media/project-campus.png',
    github: 'https://github.com/2676136489-png/campus',
    description:
      '面向高校学生的实名社交平台，完整实现学生注册审核、个人资料、动态发布、点赞评论与管理员后台。',
    challenge:
      '课程项目需要同时处理实名身份、学生与管理员双角色、社交数据关联和图片上传，并让未审核、已通过与停用状态拥有明确边界。',
    solution:
      '以 PHP 与 MySQL 搭建用户、学生、动态、评论和点赞数据模型，通过 Session、CSRF 令牌、密码哈希、输出转义与上传校验串起安全的完整业务流程。',
    points: ['实名注册与管理员审核', '动态发布 / 点赞 / 评论', '角色与状态权限', 'CSRF 与上传防护'],
    color: 'blue',
  },
  {
    id: 'wiki-plugin',
    title: 'iGEM Glass Wiki Plugin',
    shortTitle: 'Wiki 插件',
    category: 'Web 组件',
    filter: 'web',
    tag: 'HTML / CSS / JavaScript',
    period: '2026.07',
    image: '/media/project-wiki.png',
    github: 'https://github.com/2676136489-png/wiki-plugin',
    description:
      '面向 iGEM 团队的多页面 Wiki 模板，以静态优先架构组织竞赛内容，并提供一套可复用的玻璃界面与交互插件。',
    challenge:
      '竞赛 Wiki 页面数量多、证据密度高，还要兼顾评审浏览顺序、跨页面一致性、移动端体验与静态仓库部署约束。',
    solution:
      '用共享设计系统统一导航、卡片与内容结构，将命令面板、悬浮 Dock、证据筛选、术语提示和滚动叙事等能力拆成可复用模块，并保留可选 PHP partial。',
    points: ['多页面信息架构', '可复用交互插件', '主题与响应式导航', '静态优先部署'],
    color: 'mint',
  },
  {
    id: 'dashboard',
    title: 'Express Flow Interface',
    shortTitle: '运营界面',
    category: '界面概念',
    filter: 'interface',
    tag: 'UX Concept / Data Panel',
    period: 'Concept',
    image: '/media/project-dashboard.png',
    description:
      '将快递业务拆解为可视化工作台：单号状态、费用参数、库存风险与用户生命周期在同一界面中被快速扫描。',
    challenge:
      '业务信息密度高，若只做数据堆叠，使用者很难快速发现异常并判断下一步操作。',
    solution:
      '用任务优先级组织仪表盘，将即时状态、趋势与异常提醒分层呈现，让高频操作靠近信息发生的位置。',
    points: ['运营看板', '参数化计费', '异常提醒', '低学习成本'],
    color: 'violet',
  },
  {
    id: 'identity',
    title: 'Campus Service Identity',
    shortTitle: '校园品牌',
    category: '品牌视觉',
    filter: 'visual',
    tag: 'Brand Direction / AI Visual',
    period: 'Exploration',
    image: '/media/project-identity.png',
    description:
      '围绕校园服务场景建立理性、清晰、可信赖的视觉方向，用克制的色彩、网格和信息层级表达科技感。',
    challenge:
      '校园服务既要有年轻感，也要保持公共服务所需的清晰、可靠与可扩展性。',
    solution:
      '以网格为骨架统一版式，用有限的高识别色连接图形、界面与传播物料，并探索 AI 辅助的视觉延展。',
    points: ['品牌语气', '信息架构', '视觉系统', 'AI 辅助延展'],
    color: 'coral',
  },
];

const capabilities = [
  {
    icon: BrainCircuit,
    title: 'AI 辅助设计',
    index: '01',
    className: 'capability-card--wide',
    text: '把模糊需求拆成结构化提示词、视觉方向与可执行模块，加快从想法到原型的验证。',
    tags: ['提示词结构', '概念发散', '快速原型'],
  },
  {
    icon: Layers3,
    title: '视觉系统',
    index: '02',
    className: 'capability-card--standard',
    text: '关注信息层级、版式秩序与品牌一致性，让视觉不只好看，也能持续扩展。',
    tags: ['信息架构', '品牌语气'],
  },
  {
    icon: Cpu,
    title: '技术理解力',
    index: '03',
    className: 'capability-card--standard',
    text: '计算机科学背景让我更理解数据、状态和开发边界，设计方案更接近真实实现。',
    tags: ['HTML / CSS', 'C / C++'],
  },
  {
    icon: BriefcaseBusiness,
    title: '组织与推进',
    index: '04',
    className: 'capability-card--wide',
    text: '在班级组织与项目实践中持续训练沟通、任务拆解和协作推进，把共识转化为具体行动。',
    tags: ['沟通协调', '任务拆解', '团队协作'],
  },
];

const timeline = [
  {
    time: '现在',
    title: 'AI × Design 持续探索',
    text: '将生成式工具、视觉设计与前端实现连接成更完整的创作工作流。',
  },
  {
    time: '2024',
    title: '菜鸟驿站管理系统',
    text: '独立完成 C 语言系统项目，从数据结构到核心业务流程完整实践。',
  },
  {
    time: '2024-2028',
    title: '吉林大学',
    text: '计算机科学与技术本科在读，建立工程思维与系统化解决问题的基础。',
  },
];

const filters = [
  { id: 'all', label: '全部作品' },
  { id: 'system', label: '系统设计' },
  { id: 'web', label: 'Web 开发' },
  { id: 'interface', label: '界面概念' },
  { id: 'visual', label: '品牌视觉' },
];

const palettes = [
  { id: 'aurora', label: '极光', colors: ['#5b8cff', '#63e6be', '#ff7eb6'] },
  { id: 'cobalt', label: '深海', colors: ['#3a86ff', '#49dcb1', '#ffd166'] },
  { id: 'coral', label: '日落', colors: ['#ff6b6b', '#ffb86b', '#7c83ff'] },
];

const navItems = [
  { id: 'profile', label: '关于' },
  { id: 'projects', label: '作品' },
  { id: 'strengths', label: '能力' },
  { id: 'lab', label: '实验室' },
  { id: 'contact', label: '联系' },
];

function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  textArea.remove();
  return Promise.resolve();
}

function trapTabInDialog(event, container) {
  if (event.key !== 'Tab' || !container) return;
  const focusable = Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => element.getClientRects().length > 0);
  if (focusable.length === 0) return;

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

function useShanghaiTime() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(time);
}

function usePagePosition(progressRef) {
  const [state, setState] = useState({ active: 'top', scrolled: false });
  const stateRef = useRef(state);

  useEffect(() => {
    let animationFrame = 0;

    const update = () => {
      const scrollTop = window.scrollY;
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const ids = ['top', 'profile', 'projects', 'strengths', 'lab', 'contact'];
      let active = 'top';

      ids.forEach((id) => {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= 180) active = id;
      });

      const progress = Math.min(scrollTop / maxScroll, 1);
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${progress})`;
      }

      const nextState = { active, scrolled: scrollTop > 24 };
      if (
        nextState.active !== stateRef.current.active ||
        nextState.scrolled !== stateRef.current.scrolled
      ) {
        stateRef.current = nextState;
        setState(nextState);
      }
    };

    const requestUpdate = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
    };
  }, []);

  return state;
}

function useReveal(dependency) {
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll('[data-reveal]:not([data-visible])'));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach((target) => target.setAttribute('data-visible', 'true'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.setAttribute('data-visible', 'true');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [dependency]);
}

function AmbientScene() {
  return (
    <div className="ambient-scene" aria-hidden="true">
      <span className="ambient-plane ambient-plane--one" />
      <span className="ambient-plane ambient-plane--two" />
      <span className="ambient-plane ambient-plane--three" />
      <span className="ambient-grid" />
    </div>
  );
}

function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="section-label">
      <Icon size={16} strokeWidth={2.2} />
      <span>{children}</span>
    </div>
  );
}

const IconButton = React.forwardRef(function IconButton(
  { label, children, className = '', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`icon-button ${className}`}
      type="button"
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
});

function Navigation({ active, scrolled, theme, progressRef, onThemeChange, onCommandOpen }) {
  return (
    <>
      <div className="scroll-progress" aria-hidden="true">
        <span ref={progressRef} />
      </div>
      <header className="site-header" data-scrolled={scrolled}>
        <nav className="nav-shell liquid-glass" aria-label="主导航">
          <a className="brand-mark" href="#top" aria-label="卢柯宇作品集首页">
            <span>{profile.initials}</span>
            <small>Portfolio</small>
          </a>

          <div className="nav-links" aria-label="页面章节">
            {navItems.map((item) => (
              <a key={item.id} href={`#${item.id}`} data-active={active === item.id}>
                {item.label}
              </a>
            ))}
          </div>

          <div className="nav-actions">
            <button
              className="command-trigger"
              type="button"
              aria-label="打开快速导航"
              onClick={onCommandOpen}
            >
              <Command size={16} />
              <span>快速导航</span>
              <kbd>Ctrl K</kbd>
            </button>
            <IconButton
              label={theme === 'light' ? '切换深色模式' : '切换浅色模式'}
              onClick={onThemeChange}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </IconButton>
          </div>
        </nav>
      </header>

      <nav className="mobile-dock liquid-glass" aria-label="移动端导航">
        <a href="#top" data-active={active === 'top'} aria-label="首页">
          <UserRound size={19} />
          <span>首页</span>
        </a>
        <a href="#projects" data-active={active === 'projects'} aria-label="作品">
          <Grid2X2 size={19} />
          <span>作品</span>
        </a>
        <a href="#strengths" data-active={active === 'strengths'} aria-label="能力">
          <Sparkles size={19} />
          <span>能力</span>
        </a>
        <a href="#contact" data-active={active === 'contact'} aria-label="联系">
          <Mail size={19} />
          <span>联系</span>
        </a>
      </nav>
    </>
  );
}

function Hero({ onCopyEmail }) {
  const time = useShanghaiTime();

  return (
    <section id="top" className="hero-section">
      <div className="hero-inner">
        <div className="hero-copy" data-reveal>
          <div className="availability-pill liquid-glass">
            <span className="status-dot" />
            <span>正在探索 AI × Design</span>
          </div>
          <p className="hero-eyebrow">Visual Designer · Creative Technologist</p>
          <h1>
            卢柯宇
            <span>让复杂信息，拥有清晰而鲜活的形状。</span>
          </h1>
          <p className="hero-lede">
            吉林大学计算机科学与技术本科在读。连接视觉设计、品牌系统与技术实现，
            把想法推进成可理解、可使用、可记住的体验。
          </p>
          <div className="hero-actions">
            <a className="button button--primary" href="#projects">
              浏览精选作品
              <ArrowDown size={18} />
            </a>
            <button className="button button--glass" type="button" onClick={onCopyEmail}>
              <Copy size={17} />
              复制邮箱
            </button>
          </div>
          <div className="hero-facts" aria-label="个人概况">
            {stats.slice(0, 3).map((item) => (
              <div key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="portrait-stage" data-reveal>
          <div className="portrait-halo" aria-hidden="true" />
          <div className="portrait-window liquid-glass">
            <div className="window-chrome">
              <span />
              <span />
              <span />
              <small>lky.profile</small>
            </div>
            <img src="/media/avatar-lky.png" alt="卢柯宇的个人视觉形象" />
          </div>
          <div className="floating-chip floating-chip--role liquid-glass">
            <WandSparkles size={18} />
            <div>
              <span>Creative focus</span>
              <strong>视觉 × AI × 品牌</strong>
            </div>
          </div>
          <div className="floating-chip floating-chip--time liquid-glass">
            <Clock3 size={18} />
            <div>
              <span>中国标准时间</span>
              <strong>{time}</strong>
            </div>
          </div>
          <div className="floating-chip floating-chip--place liquid-glass">
            <MapPin size={18} />
            <div>
              <span>Base</span>
              <strong>{profile.city}</strong>
            </div>
          </div>
        </div>
      </div>

      <a className="scroll-cue" href="#profile" aria-label="继续了解">
        <span>继续探索</span>
        <ArrowDown size={16} />
      </a>
    </section>
  );
}

function SignalStrip() {
  return (
    <div className="signal-strip" aria-label="设计能力关键词">
      <div className="signal-track">
        {['视觉叙事', 'AI 工作流', '品牌系统', '界面设计', '信息架构', '前端实现'].map((item) => (
          <span key={item}>
            <Sparkles size={14} />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function ProfileSection() {
  return (
    <section id="profile" className="section section--profile">
      <div className="section-heading" data-reveal>
        <div>
          <SectionLabel icon={UserRound}>About / 个人档案</SectionLabel>
          <h2>理性做骨架，感性做表达。</h2>
        </div>
        <p>
          我喜欢把设计当作一种组织方式：先理解问题，再决定什么应该被看见、被感受，以及如何真正落地。
        </p>
      </div>

      <div className="profile-grid">
        <div className="profile-statement liquid-glass" data-reveal>
          <div className="profile-monogram">LKY</div>
          <blockquote>
            “设计不是最后一层装饰，
            <br />
            而是让系统变得可理解。”
          </blockquote>
          <div className="profile-contact-list">
            <a href={`mailto:${profile.email}`}>
              <Mail size={17} />
              <span>{profile.email}</span>
              <ArrowUpRight size={15} />
            </a>
            <a href={`tel:${profile.phone}`}>
              <Phone size={17} />
              <span>{profile.phone}</span>
              <ArrowUpRight size={15} />
            </a>
            <div>
              <BookOpen size={17} />
              <span>{profile.education}</span>
            </div>
          </div>
        </div>

        <div className="timeline-panel" data-reveal>
          <div className="timeline-header">
            <span>Journey</span>
            <small>从工程基础走向复合创作</small>
          </div>
          <div className="timeline-list">
            {timeline.map((item, index) => (
              <article className="timeline-item" key={item.time}>
                <div className="timeline-marker">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                </div>
                <time>{item.time}</time>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const PROJECT_POINTER_RESPONSE = 0.3;
const PROJECT_POINTER_DAMPING_RATIO = 1;
const PROJECT_POINTER_OMEGA = (2 * Math.PI) / PROJECT_POINTER_RESPONSE;
const PROJECT_POINTER_STIFFNESS = PROJECT_POINTER_OMEGA * PROJECT_POINTER_OMEGA;
const PROJECT_POINTER_DAMPING = 2 * PROJECT_POINTER_DAMPING_RATIO * PROJECT_POINTER_OMEGA;
const PROJECT_POINTER_EPSILON = 0.0005;
const PROJECT_POINTER_ROTATION = 2.4;

function ProjectCard({ project, featured, onOpen }) {
  const surfaceRef = useRef(null);
  const glintRef = useRef(null);
  const animationFrameRef = useRef(0);
  const pointerActiveRef = useRef(false);
  const reducedMotionQueryRef = useRef(null);
  const springRef = useRef({
    currentX: 0.5,
    currentY: 0.5,
    targetX: 0.5,
    targetY: 0.5,
    velocityX: 0,
    velocityY: 0,
    lastTime: 0,
    rect: null,
  });

  const isPointerMotionReduced = () => {
    reducedMotionQueryRef.current ??= window.matchMedia('(prefers-reduced-motion: reduce)');
    return (
      reducedMotionQueryRef.current.matches ||
      document.documentElement.dataset.motion === 'off'
    );
  };

  const renderPointerState = () => {
    const surface = surfaceRef.current;
    const glint = glintRef.current;
    const spring = springRef.current;
    if (!surface || !glint || !spring.rect) return;

    const rotateX = (0.5 - spring.currentY) * PROJECT_POINTER_ROTATION;
    const rotateY = (spring.currentX - 0.5) * PROJECT_POINTER_ROTATION;
    const x = spring.currentX * spring.rect.width - 110;
    const y = spring.currentY * spring.rect.height - 110;

    surface.style.transform = `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    glint.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const clearPointerWillChange = () => {
    surfaceRef.current?.style.removeProperty('will-change');
    glintRef.current?.style.removeProperty('will-change');
  };

  const animatePointer = (time) => {
    const spring = springRef.current;
    const dt = spring.lastTime
      ? Math.min((time - spring.lastTime) / 1000, 1 / 30)
      : 1 / 60;
    spring.lastTime = time;

    spring.velocityX +=
      (-PROJECT_POINTER_STIFFNESS * (spring.currentX - spring.targetX) -
        PROJECT_POINTER_DAMPING * spring.velocityX) *
      dt;
    spring.currentX += spring.velocityX * dt;
    spring.velocityY +=
      (-PROJECT_POINTER_STIFFNESS * (spring.currentY - spring.targetY) -
        PROJECT_POINTER_DAMPING * spring.velocityY) *
      dt;
    spring.currentY += spring.velocityY * dt;

    const settled =
      Math.abs(spring.currentX - spring.targetX) < PROJECT_POINTER_EPSILON &&
      Math.abs(spring.currentY - spring.targetY) < PROJECT_POINTER_EPSILON &&
      Math.abs(spring.velocityX) < PROJECT_POINTER_EPSILON &&
      Math.abs(spring.velocityY) < PROJECT_POINTER_EPSILON;

    if (settled) {
      spring.currentX = spring.targetX;
      spring.currentY = spring.targetY;
      spring.velocityX = 0;
      spring.velocityY = 0;
      spring.lastTime = 0;
      animationFrameRef.current = 0;
      renderPointerState();
      if (!pointerActiveRef.current) clearPointerWillChange();
      return;
    }

    renderPointerState();
    animationFrameRef.current = window.requestAnimationFrame(animatePointer);
  };

  const ensurePointerAnimation = () => {
    if (animationFrameRef.current) return;
    springRef.current.lastTime = 0;
    animationFrameRef.current = window.requestAnimationFrame(animatePointer);
  };

  const settlePointerImmediately = () => {
    window.cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = 0;
    Object.assign(springRef.current, {
      currentX: 0.5,
      currentY: 0.5,
      targetX: 0.5,
      targetY: 0.5,
      velocityX: 0,
      velocityY: 0,
      lastTime: 0,
    });
    renderPointerState();
    clearPointerWillChange();
  };

  const updatePointerTarget = (event) => {
    const spring = springRef.current;
    if (!spring.rect) return;
    spring.targetX = Math.min(Math.max((event.clientX - spring.rect.left) / spring.rect.width, 0), 1);
    spring.targetY = Math.min(Math.max((event.clientY - spring.rect.top) / spring.rect.height, 0), 1);
    ensurePointerAnimation();
  };

  const handlePointerEnter = (event) => {
    const surface = surfaceRef.current;
    const glint = glintRef.current;
    if (event.pointerType === 'touch' || !surface || !glint) return;
    pointerActiveRef.current = true;
    springRef.current.rect = surfaceRef.current.getBoundingClientRect();
    if (isPointerMotionReduced()) {
      settlePointerImmediately();
      return;
    }
    surface.style.willChange = 'transform';
    glint.style.willChange = 'transform, opacity';
    updatePointerTarget(event);
  };

  const handlePointerMove = (event) => {
    if (event.pointerType === 'touch') return;
    if (isPointerMotionReduced()) {
      settlePointerImmediately();
      return;
    }
    updatePointerTarget(event);
  };

  const handlePointerLeave = (event) => {
    if (event.pointerType === 'touch') return;
    pointerActiveRef.current = false;
    if (isPointerMotionReduced()) {
      settlePointerImmediately();
      return;
    }
    springRef.current.targetX = 0.5;
    springRef.current.targetY = 0.5;
    ensurePointerAnimation();
  };

  useEffect(
    () => () => {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
      pointerActiveRef.current = false;
      clearPointerWillChange();
    },
    [],
  );

  return (
    <article
      className={`project-card project-card--${project.color}${featured ? ' project-card--featured' : ''}`}
      data-reveal
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <button
        ref={surfaceRef}
        type="button"
        className="project-card-button"
        onClick={() => onOpen(project)}
      >
        <span ref={glintRef} className="project-glint" aria-hidden="true" />
        <div className="project-media">
          <img
            src={project.image}
            alt={`${project.title}项目封面`}
            style={project.imagePosition ? { objectPosition: project.imagePosition } : undefined}
          />
          <span className="project-category liquid-glass">{project.category}</span>
          <span className="project-open-icon" aria-hidden="true">
            <ArrowUpRight size={20} />
          </span>
        </div>
        <div className="project-body">
          <div className="project-meta">
            <span>{project.tag}</span>
            <time>{project.period}</time>
          </div>
          <h3>{project.title}</h3>
          <p>{project.description}</p>
          <div className="project-footer">
            <div className="tag-list">
              {project.points.slice(0, featured ? 4 : 2).map((point) => (
                <span key={point}>{point}</span>
              ))}
            </div>
            <span className="view-project">
              查看详情
              <ChevronRight size={16} />
            </span>
          </div>
        </div>
      </button>
    </article>
  );
}

function ProjectsSection({ onProjectOpen, filter, onFilterChange }) {
  const visibleProjects = useMemo(
    () => projects.filter((project) => filter === 'all' || project.filter === filter),
    [filter],
  );

  return (
    <section id="projects" className="section section--projects">
      <div className="section-heading section-heading--projects" data-reveal>
        <div>
          <SectionLabel icon={BriefcaseBusiness}>Selected work / 精选作品</SectionLabel>
          <h2>从系统逻辑，到视觉表达。</h2>
        </div>
        <p>五个项目，覆盖系统开发、Web 应用、界面概念与品牌视觉，共用一套从问题到体验的完整方法。</p>
      </div>

      <div className="filter-bar" data-reveal>
        <div className="segmented-control" role="group" aria-label="筛选项目类型">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={filter === item.id}
              data-active={filter === item.id}
              onClick={() => onFilterChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <span className="project-count">
          <Grid2X2 size={16} />
          {visibleProjects.length} 个项目
        </span>
      </div>

      <div className="project-grid" data-count={visibleProjects.length}>
        {visibleProjects.map((project, index) => (
          <ProjectCard
            key={`${filter}-${project.id}`}
            project={project}
            featured={filter === 'all' && index === 0}
            onOpen={onProjectOpen}
          />
        ))}
      </div>
    </section>
  );
}

function StrengthsSection() {
  return (
    <section id="strengths" className="section section--strengths">
      <div className="section-heading" data-reveal>
        <div>
          <SectionLabel icon={Trophy}>Capabilities / 能力组合</SectionLabel>
          <h2>不止一种身份，也不止一种解法。</h2>
        </div>
        <p>设计判断、技术理解与协作能力彼此连接，形成一套更完整、更靠近落地的创作方式。</p>
      </div>

      <div className="capability-grid">
        {capabilities.map((item) => {
          const Icon = item.icon;
          return (
            <article className={`capability-card liquid-glass ${item.className}`} key={item.title} data-reveal>
              <div className="capability-topline">
                <span className="capability-icon">
                  <Icon size={22} />
                </span>
                <small>{item.index}</small>
              </div>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
              <div className="capability-tags">
                {item.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <div className="workflow-rail" data-reveal>
        <span className="workflow-title">MY PROCESS</span>
        {['理解问题', '建立结构', '视觉探索', '原型验证', '持续迭代'].map((step, index) => (
          <React.Fragment key={step}>
            <div className="workflow-step">
              <small>{String(index + 1).padStart(2, '0')}</small>
              <strong>{step}</strong>
            </div>
            {index < 4 && <ArrowRight size={18} aria-hidden="true" />}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}

function LabSection({ palette, onPaletteChange, theme, onThemeChange, motion, onMotionChange, blur, onBlurChange, onCommandOpen, onShare }) {
  const time = useShanghaiTime();

  return (
    <section id="lab" className="section section--lab">
      <div className="section-heading" data-reveal>
        <div>
          <SectionLabel icon={SwatchBook}>Interface lab / 交互实验室</SectionLabel>
          <h2>这套界面，也可以由你来调。</h2>
        </div>
        <p>改变色彩、材质与动态偏好，看看同一套内容如何拥有不同性格。设置会保存在当前浏览器。</p>
      </div>

      <div className="lab-console liquid-glass" data-reveal>
        <div className="lab-preview">
          <div className="lab-preview-topline">
            <span>
              <span className="status-dot" />
              LIVE SYSTEM
            </span>
            <strong>{time}</strong>
          </div>
          <div className="lab-symbol" aria-hidden="true">
            <span>LKY</span>
            <div className="lab-rings">
              <i />
              <i />
              <i />
            </div>
          </div>
          <div className="lab-preview-copy">
            <small>Personal interface</small>
            <strong>有秩序，也有一点意外。</strong>
          </div>
        </div>

        <div className="lab-controls">
          <div className="control-row">
            <div className="control-label">
              <Palette size={19} />
              <div>
                <strong>强调色</strong>
                <span>切换全站色彩气质</span>
              </div>
            </div>
            <div className="palette-options" role="group" aria-label="选择强调色">
              {palettes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  data-active={palette === item.id}
                  aria-pressed={palette === item.id}
                  onClick={() => onPaletteChange(item.id)}
                  title={`${item.label}配色`}
                >
                  <span className="palette-swatch">
                    {item.colors.map((color) => (
                      <i key={color} style={{ backgroundColor: color }} />
                    ))}
                  </span>
                  <span>{item.label}</span>
                  {palette === item.id && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>

          <div className="control-row">
            <div className="control-label">
              <Layers3 size={19} />
              <div>
                <strong>玻璃厚度</strong>
                <span>调整背景模糊强度</span>
              </div>
            </div>
            <div className="range-control">
              <input
                type="range"
                min="16"
                max="42"
                value={blur}
                aria-label="玻璃模糊强度"
                onChange={(event) => onBlurChange(Number(event.target.value))}
              />
              <output>{blur}px</output>
            </div>
          </div>

          <div className="control-row">
            <div className="control-label">
              {theme === 'light' ? <Sun size={19} /> : <Moon size={19} />}
              <div>
                <strong>外观模式</strong>
                <span>明亮或深色材质</span>
              </div>
            </div>
            <div className="mode-segment" role="group" aria-label="选择外观模式">
              <button type="button" data-active={theme === 'light'} onClick={() => onThemeChange('light')}>
                <Sun size={15} />
                明亮
              </button>
              <button type="button" data-active={theme === 'dark'} onClick={() => onThemeChange('dark')}>
                <Moon size={15} />
                深色
              </button>
            </div>
          </div>

          <div className="control-row">
            <div className="control-label">
              <Zap size={19} />
              <div>
                <strong>界面动态</strong>
                <span>控制装饰性运动反馈</span>
              </div>
            </div>
            <button
              className="switch-control"
              type="button"
              role="switch"
              aria-checked={motion}
              data-active={motion}
              onClick={() => onMotionChange(!motion)}
            >
              <span />
            </button>
          </div>

          <div className="lab-quick-actions">
            <button type="button" onClick={onCommandOpen}>
              <Command size={17} />
              打开命令面板
              <kbd>Ctrl K</kbd>
            </button>
            <button type="button" onClick={onShare}>
              <Share2 size={17} />
              分享作品集
              <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactSection({ onCopyEmail }) {
  return (
    <section id="contact" className="contact-section">
      <div className="contact-inner" data-reveal>
        <SectionLabel icon={BadgeCheck}>Contact / 开始连接</SectionLabel>
        <h2>
          有一个值得被认真设计的想法？
          <span>我们聊聊。</span>
        </h2>
        <p>欢迎交流视觉设计、AI 创作、校园项目与前端体验。</p>
        <div className="contact-actions">
          <a className="button button--primary" href={`mailto:${profile.email}`}>
            <Mail size={18} />
            发送邮件
          </a>
          <button className="button button--glass" type="button" onClick={onCopyEmail}>
            <Copy size={17} />
            {profile.email}
          </button>
        </div>
      </div>
      <footer className="site-footer">
        <div>
          <strong>{profile.initials}</strong>
          <span>Visual · AI · Brand</span>
        </div>
        <span>© 2026 卢柯宇 · Designed with clarity</span>
        <a href="#top">
          返回顶部
          <ArrowUpRight size={15} />
        </a>
      </footer>
    </section>
  );
}

const PROJECT_SHEET_DURATION = 240;

function ProjectSheet({ project, onClose }) {
  const [closing, setClosing] = useState(false);
  const closeButtonRef = useRef(null);
  const closeTimerRef = useRef(0);
  const closingRef = useRef(false);
  const sheetRef = useRef(null);

  const requestClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    const reduceMotion =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.dataset.motion === 'off';
    closeTimerRef.current = window.setTimeout(
      onClose,
      reduceMotion ? 160 : PROJECT_SHEET_DURATION,
    );
  };

  useEffect(() => {
    if (!project) return undefined;

    setClosing(false);
    closingRef.current = false;
    const previousFocus = document.activeElement;
    acquireBodyOverlayLock();
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (document.querySelector('.command-backdrop')) return;
        event.preventDefault();
        requestClose();
        return;
      }
      trapTabInDialog(event, sheetRef.current);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(closeTimerRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      releaseBodyOverlayLock();
      previousFocus?.focus?.();
    };
  }, [project]);

  if (!project) return null;

  return (
    <div
      className="sheet-backdrop"
      data-closing={closing}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
      role="presentation"
    >
      <section
        ref={sheetRef}
        className="project-sheet liquid-glass"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-sheet-title"
      >
        <div className="sheet-toolbar">
          <div>
            <span>{project.category}</span>
            <small>{project.period}</small>
          </div>
          <IconButton ref={closeButtonRef} label="关闭项目详情" onClick={requestClose}>
            <X size={20} />
          </IconButton>
        </div>

        <div className="sheet-scroll">
          <div className={`sheet-hero sheet-hero--${project.color}`}>
            <img
              src={project.image}
              alt={`${project.title}项目视觉`}
              style={project.imagePosition ? { objectPosition: project.imagePosition } : undefined}
            />
          </div>
          <div className="sheet-content">
            <p className="sheet-kicker">{project.tag}</p>
            <h2 id="project-sheet-title">{project.title}</h2>
            <p className="sheet-intro">{project.description}</p>

            <div className="sheet-detail-grid">
              <div>
                <span>01 / 挑战</span>
                <p>{project.challenge}</p>
              </div>
              <div>
                <span>02 / 方法</span>
                <p>{project.solution}</p>
              </div>
            </div>

            <div className="sheet-features">
              <span>核心模块</span>
              <div>
                {project.points.map((point) => (
                  <strong key={point}>
                    <Check size={15} />
                    {point}
                  </strong>
                ))}
              </div>
            </div>

            <div className="sheet-actions">
              {project.github ? (
                <a
                  className="button button--primary"
                  href={project.github}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Github size={17} />
                  GitHub 源码
                  <ArrowUpRight size={16} />
                </a>
              ) : null}
              <a
                className={`button ${project.github ? 'button--glass' : 'button--primary'}`}
                href={`mailto:${profile.email}?subject=关于 ${project.title}`}
              >
                讨论这个项目
                <ArrowUpRight size={17} />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function CommandMenu({ open, onClose, onNavigate, onCopyEmail, onThemeChange, theme }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  const actions = useMemo(
    () => [
      { id: 'projects', label: '查看精选作品', hint: '跳转', icon: Grid2X2, run: () => onNavigate('projects') },
      { id: 'profile', label: '了解个人经历', hint: '跳转', icon: UserRound, run: () => onNavigate('profile') },
      { id: 'strengths', label: '浏览能力组合', hint: '跳转', icon: Sparkles, run: () => onNavigate('strengths') },
      { id: 'lab', label: '打开交互实验室', hint: '跳转', icon: SwatchBook, run: () => onNavigate('lab') },
      { id: 'email', label: '复制联系邮箱', hint: '复制', icon: Copy, run: onCopyEmail },
      {
        id: 'theme',
        label: theme === 'light' ? '切换到深色模式' : '切换到明亮模式',
        hint: '外观',
        icon: theme === 'light' ? Moon : Sun,
        run: () => onThemeChange(theme === 'light' ? 'dark' : 'light'),
      },
    ],
    [onCopyEmail, onNavigate, onThemeChange, theme],
  );

  const filteredActions = actions.filter((action) => action.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (!open) return undefined;
    setQuery('');
    acquireBodyOverlayLock();
    window.requestAnimationFrame(() => inputRef.current?.focus());

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      trapTabInDialog(event, menuRef.current);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      releaseBodyOverlayLock();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="command-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section
        ref={menuRef}
        className="command-menu liquid-glass"
        role="dialog"
        aria-modal="true"
        aria-label="快速导航"
        onKeyDown={(event) => {
          if (event.key !== 'Enter' || !filteredActions[0]) return;
          event.preventDefault();
          filteredActions[0].run();
          onClose();
        }}
      >
        <div className="command-search">
          <Search size={19} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索页面或操作…"
            aria-label="搜索命令"
          />
          <kbd>ESC</kbd>
        </div>
        <div className="command-list">
          {filteredActions.length > 0 ? (
            filteredActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => {
                    action.run();
                    onClose();
                  }}
                >
                  <span className="command-icon">
                    <Icon size={18} />
                  </span>
                  <strong>{action.label}</strong>
                  <small>{action.hint}</small>
                </button>
              );
            })
          ) : (
            <div className="command-empty">没有找到相关操作</div>
          )}
        </div>
        <div className="command-footer">
          <span>Enter 执行首项</span>
          <span>Esc 关闭</span>
        </div>
      </section>
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!toast) return undefined;
    setClosing(false);
    const closeTimer = window.setTimeout(() => setClosing(true), 2400);
    const dismissTimer = window.setTimeout(() => onDismiss(null), 2580);

    return () => {
      window.clearTimeout(closeTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [toast?.id, onDismiss]);

  if (!toast) return null;
  return (
    <div
      className="toast liquid-glass"
      data-closing={closing}
      role="status"
      key={toast.id}
    >
      <span className="toast-check">
        <Check size={15} />
      </span>
      {toast.message}
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('portfolio-theme') || 'light');
  const [palette, setPalette] = useState(() => localStorage.getItem('portfolio-palette') || 'aurora');
  const [motion, setMotion] = useState(() => {
    const storedMotion = localStorage.getItem('portfolio-motion');
    if (storedMotion === 'on' || storedMotion === 'off') return storedMotion === 'on';
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  const [blur, setBlur] = useState(() => Number(localStorage.getItem('portfolio-blur')) || 30);
  const [filter, setFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const progressRef = useRef(null);
  const pagePosition = usePagePosition(progressRef);

  useReveal(filter);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('portfolio-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.palette = palette;
    localStorage.setItem('portfolio-palette', palette);
  }, [palette]);

  useEffect(() => {
    document.documentElement.dataset.motion = motion ? 'on' : 'off';
    localStorage.setItem('portfolio-motion', motion ? 'on' : 'off');
  }, [motion]);

  useEffect(() => {
    document.documentElement.style.setProperty('--glass-blur', `${blur}px`);
    localStorage.setItem('portfolio-blur', String(blur));
  }, [blur]);

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen((value) => !value);
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const notify = (message) => setToast({ id: Date.now(), message });

  const handleCopyEmail = async () => {
    await copyToClipboard(profile.email);
    notify('邮箱已复制到剪贴板');
  };

  const handleNavigate = (id) => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: motion && !reduceMotion ? 'smooth' : 'auto' });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.name} · 个人作品集`,
          text: '视觉设计、AI 设计与品牌系统作品集',
          url: window.location.href,
        });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }

    await copyToClipboard(window.location.href);
    notify('作品集链接已复制');
  };

  return (
    <div className="site-shell">
      <AmbientScene />
      <Navigation
        active={pagePosition.active}
        scrolled={pagePosition.scrolled}
        theme={theme}
        progressRef={progressRef}
        onThemeChange={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        onCommandOpen={() => setCommandOpen(true)}
      />

      <main>
        <Hero onCopyEmail={handleCopyEmail} />
        <SignalStrip />
        <ProfileSection />
        <ProjectsSection
          onProjectOpen={setSelectedProject}
          filter={filter}
          onFilterChange={setFilter}
        />
        <StrengthsSection />
        <LabSection
          palette={palette}
          onPaletteChange={setPalette}
          theme={theme}
          onThemeChange={setTheme}
          motion={motion}
          onMotionChange={setMotion}
          blur={blur}
          onBlurChange={setBlur}
          onCommandOpen={() => setCommandOpen(true)}
          onShare={handleShare}
        />
        <ContactSection onCopyEmail={handleCopyEmail} />
      </main>

      <ProjectSheet project={selectedProject} onClose={() => setSelectedProject(null)} />
      <CommandMenu
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onNavigate={handleNavigate}
        onCopyEmail={handleCopyEmail}
        onThemeChange={setTheme}
        theme={theme}
      />
      <Toast toast={toast} onDismiss={setToast} />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
