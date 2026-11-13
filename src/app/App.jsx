/**
 * 应用外壳：路由表 + 深浅主题 + 全局页面转场。
 *
 * 转场（全站统一）：
 *   进场 opacity 0 → 1，y 20 → 0；
 *   退场 opacity 1 → 0，y 0 → -20；
 *   缓动统一 power2.out。
 * 退场结束后才切换路由内容（displayedLocation 模式），
 * 因此不会出现两页同时在场互相顶高度的抖动。
 *
 * ⚠️ 转场动画结束后必须 clearProps 清掉 transform：
 *   祖先元素上残留 transform 会让 position:fixed 的 pin 以它为包含块，
 *   /works 的 ScrollTrigger pin 会直接错位。
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  HashRouter,
  MemoryRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router-dom';
import { gsap, reducedMotion, ScrollTrigger } from '../motion/scroll.tsx';
import Nav from './Nav.jsx';
import Footer from './Footer.jsx';
import Home from '../pages/Home.tsx';
import Works from '../pages/Works.tsx';
import Campus from '../pages/Campus.tsx';
import About from '../pages/About.tsx';
import Skills from '../pages/Skills.tsx';
import Contact from '../pages/Contact.tsx';
import NotFound from '../pages/NotFound.tsx';
import { CategoryPage, ProjectPage, ResumePage } from '../pages/DetailPages.jsx';
import { categoryBySlug, projects } from '../data.js';

const THEME_KEY = 'portfolio-theme-v2';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function ProjectRoute() {
  const { slug } = useParams();
  const project = projects.find((p) => p.slug === slug);
  /* slug 不存在时统一走 404 —— 别让详情页自己那套旧版 not-found 顶上来 */
  if (!project) return <NotFound />;
  return <ProjectPage project={project} />;
}

function CategoryRoute() {
  const { slug } = useParams();
  return <CategoryPage category={categoryBySlug(slug) || null} />;
}

/* 路由内容 + 进出场转场 */
function AnimatedRoutes() {
  const location = useLocation();
  const [display, setDisplay] = useState(location);
  const stageRef = useRef(null);
  const entered = useRef(false);

  /* 首次挂载：进场 */
  useIsoLayoutEffect(() => {
    const el = stageRef.current;
    if (!el || typeof window === 'undefined') return;
    if (reducedMotion()) return;
    gsap.fromTo(
      el,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
        onComplete: () => gsap.set(el, { clearProps: 'transform' }),
      },
    );
  }, []);

  /* 地址变化：先退场，再换内容 */
  useEffect(() => {
    if (location.pathname === display.pathname) return;
    const el = stageRef.current;
    if (!el) return;
    if (reducedMotion()) {
      setDisplay(location);
      window.scrollTo(0, 0);
      return;
    }
    gsap.killTweensOf(el);
    gsap.to(el, {
      opacity: 0,
      y: -20,
      duration: 0.3,
      ease: 'power2.out',
      onComplete: () => {
        /* 旧页的触发器随卸载已回收，这里再兜一层底 */
        ScrollTrigger.getAll().forEach((t) => t.kill());
        setDisplay(location);
        window.scrollTo(0, 0);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  /* 新内容进场 */
  useIsoLayoutEffect(() => {
    const el = stageRef.current;
    if (!el || typeof window === 'undefined') return;
    if (!entered.current) {
      entered.current = true;
      return;
    }
    if (reducedMotion()) {
      gsap.set(el, { opacity: 1, y: 0 });
      requestAnimationFrame(() => ScrollTrigger.refresh());
      return;
    }
    gsap.fromTo(
      el,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.55,
        ease: 'power2.out',
        onComplete: () => {
          gsap.set(el, { clearProps: 'transform' });
          ScrollTrigger.refresh();
        },
      },
    );
  }, [display.pathname]);

  return (
    <div className="route-stage" ref={stageRef}>
      <Routes location={display}>
        <Route path="/" element={<Home />} />
        <Route path="/works" element={<Works />} />
        <Route path="/campus-circle" element={<Campus />} />
        <Route path="/about" element={<About />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/resume" element={<ResumePage />} />
        <Route path="/category/:slug" element={<CategoryRoute />} />
        {/* 旧地址兜底：/campus 指到新的校园圈子叙事页 */}
        <Route path="/campus" element={<Navigate to="/campus-circle" replace />} />
        <Route path="/:slug" element={<ProjectRoute />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export function AppShell() {
  const [theme, setTheme] = useState(
    () =>
      (typeof localStorage !== 'undefined' && localStorage.getItem(THEME_KEY)) || 'dark',
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* 隐私模式下不可写，忽略 */
    }
    /* 主题变量换了之后，canvas 尺寸以外的触发点无需重算，
       但颜色相关的 scrub 动画（SVG 描边）要刷新一次 */
    ScrollTrigger.refresh();
  }, [theme]);

  return (
    <div className="site-shell">
      <Nav theme={theme} onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')} />
      <main>
        <AnimatedRoutes />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  );
}

export { MemoryRouter };
