/* ============================================================
   动效基建
   设计取向：苹果官网式的「克制但有物理感」——
   位移都走 transform/opacity（合成层），不使用会触发重排的属性；
   全局只跑一个 rAF 循环；prefers-reduced-motion 下全部退化为静态。
   ============================================================ */

import { useEffect, useLayoutEffect, useMemo, useState } from 'react';

const reduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const finePointer = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ============================================================
   0. 页面动效总入口
   页面组件只需调一次，四个子系统各自负责一类效果。
   ============================================================ */

export function usePageMotion(deps = []) {
  useReveal(deps);
  useScrollEngine(deps);
  usePointerTilt(deps);
  useMagneticPointer(deps);
  useCountUp(deps);
}

/* ============================================================
   1. 滚动揭示
   用法：<div data-reveal data-reveal-variant="mask" style={{ '--i': 2 }}>
   变体：up（默认）| fade | mask | img
   --i 用于同组错峰，每级 70ms
   ============================================================ */

export function useReveal(deps = []) {
  useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll('[data-reveal]:not([data-visible])'),
    );
    if (!targets.length) return undefined;

    if (reduced() || !('IntersectionObserver' in window)) {
      targets.forEach((el) => el.setAttribute('data-visible', 'true'));
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
      { rootMargin: '0px 0px -6% 0px', threshold: 0.08 },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/* ============================================================
   2. 滚动引擎：视差 + 阅读进度
   单一 rAF 循环，滚动时置脏标记，避免每帧强制布局。
   用法：<div data-parallax="0.06">  ｜  <div class="scroll-progress" data-progress>
   ============================================================ */

export function useScrollEngine(deps = []) {
  useEffect(() => {
    if (reduced()) return undefined;

    let items = [];
    let vh = window.innerHeight;
    let dirty = true;
    let frame = 0;

    const progress = document.querySelector('[data-progress]');

    const measure = () => {
      vh = window.innerHeight;
      const scrollTop = window.scrollY;
      items = Array.from(document.querySelectorAll('[data-parallax]')).map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          el,
          top: rect.top + scrollTop,
          height: rect.height,
          strength: parseFloat(el.dataset.parallax) || 0.06,
        };
      });
      dirty = true;
    };

    const render = () => {
      frame = 0;
      if (!dirty) return;
      dirty = false;

      const y = window.scrollY;

      for (const item of items) {
        const center = item.top + item.height / 2;
        const viewportCenter = y + vh / 2;
        // 元素在视口中心时偏移为 0，越靠边缘偏移越大
        const offset = (viewportCenter - center) * item.strength;
        item.el.style.setProperty('--parallax-y', `${offset.toFixed(2)}px`);
      }

      if (progress) {
        const scrollable = document.documentElement.scrollHeight - vh;
        const ratio = scrollable > 0 ? Math.min(1, Math.max(0, y / scrollable)) : 0;
        progress.style.setProperty('--progress', ratio.toFixed(4));
      }
    };

    const tick = () => {
      if (!frame) frame = window.requestAnimationFrame(render);
    };

    const onScroll = () => {
      dirty = true;
      tick();
    };

    // 布局变化（图片加载、菜单展开、主题切换）后重新测量
    const observer = new ResizeObserver(() => {
      measure();
      tick();
    });
    if (document.body) observer.observe(document.body);

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    tick();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      if (frame) window.cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/* ============================================================
   3. 指针倾斜
   卡片跟随指针做极轻微的三维偏转，并用 --mx/--my 驱动一层高光。
   幅度刻意压得很小（≤5deg），因为它要像苹果那种「沉重物体被推动」
   的手感，而不是常见 demo 里的橡皮筋效果。
   ============================================================ */

export function usePointerTilt(deps = []) {
  useEffect(() => {
    if (reduced() || !finePointer()) return undefined;

    const nodes = Array.from(document.querySelectorAll('[data-tilt]'));
    if (!nodes.length) return undefined;

    const cleanups = nodes.map((el) => {
      const strength = parseFloat(el.dataset.tiltStrength) || 4;
      let pending = 0;
      let nx = 0;
      let ny = 0;

      const write = () => {
        pending = 0;
        const rect = el.getBoundingClientRect();
        const px = (nx - rect.left) / rect.width;
        const py = (ny - rect.top) / rect.height;
        el.style.setProperty('--rx', `${((0.5 - py) * strength).toFixed(2)}deg`);
        el.style.setProperty('--ry', `${((px - 0.5) * strength).toFixed(2)}deg`);
        el.style.setProperty('--mx', `${((nx - rect.left) / rect.width) * 100}%`);
        el.style.setProperty('--my', `${((ny - rect.top) / rect.height) * 100}%`);
      };

      const onMove = (event) => {
        nx = event.clientX;
        ny = event.clientY;
        el.setAttribute('data-tilting', 'true');
        if (!pending) pending = window.requestAnimationFrame(write);
      };

      const onLeave = () => {
        if (pending) {
          window.cancelAnimationFrame(pending);
          pending = 0;
        }
        el.removeAttribute('data-tilting');
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
        el.style.setProperty('--mx', '50%');
        el.style.setProperty('--my', '50%');
      };

      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerleave', onLeave);
      el.addEventListener('pointercancel', onLeave);

      return () => {
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerleave', onLeave);
        el.removeEventListener('pointercancel', onLeave);
        if (pending) window.cancelAnimationFrame(pending);
      };
    });

    return () => cleanups.forEach((fn) => fn());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/* ============================================================
   3b. 磁性按钮
   指针靠近时按钮朝指针方向平移 2–3px。位移量必须小——
   大位移会让按钮看起来「粘手」，而苹果的手感是「被轻轻吸住」。
   ============================================================ */

export function useMagneticPointer(deps = []) {
  useEffect(() => {
    if (reduced() || !finePointer()) return undefined;

    const nodes = Array.from(document.querySelectorAll('[data-magnetic]'));
    if (!nodes.length) return undefined;

    const cleanups = nodes.map((el) => {
      const pull = parseFloat(el.dataset.magneticPull) || 3;
      let pending = 0;
      let nx = 0;
      let ny = 0;

      const write = () => {
        pending = 0;
        const rect = el.getBoundingClientRect();
        const px = (nx - rect.left) / rect.width - 0.5;
        const py = (ny - rect.top) / rect.height - 0.5;
        el.style.setProperty('--mag-x', `${(px * pull * 2).toFixed(2)}px`);
        el.style.setProperty('--mag-y', `${(py * pull * 2).toFixed(2)}px`);
      };

      const onMove = (event) => {
        nx = event.clientX;
        ny = event.clientY;
        el.setAttribute('data-magnet', 'true');
        if (!pending) pending = window.requestAnimationFrame(write);
      };

      const onLeave = () => {
        if (pending) {
          window.cancelAnimationFrame(pending);
          pending = 0;
        }
        el.removeAttribute('data-magnet');
        el.style.setProperty('--mag-x', '0px');
        el.style.setProperty('--mag-y', '0px');
      };

      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerleave', onLeave);
      el.addEventListener('pointercancel', onLeave);

      return () => {
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerleave', onLeave);
        el.removeEventListener('pointercancel', onLeave);
        if (pending) window.cancelAnimationFrame(pending);
      };
    });

    return () => cleanups.forEach((fn) => fn());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/* ============================================================
   4. 数字滚动
   滚动进入视口时从 0 缓动到目标值，保留前后缀。
   用法：<strong data-count="19">19</strong>
   ============================================================ */

const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export function useCountUp(deps = []) {
  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll('[data-count]:not([data-counted])'),
    );
    if (!nodes.length) return undefined;

    const run = (el) => {
      const raw = String(el.dataset.count ?? el.textContent ?? '');
      const match = raw.match(/^([^\d-]*)(-?\d+(?:\.\d+)?)(.*)$/s);
      if (!match) {
        el.setAttribute('data-counted', 'true');
        return;
      }
      const [, prefix, digits, suffix] = match;
      const target = parseFloat(digits);
      const decimals = (digits.split('.')[1] || '').length;

      if (reduced()) {
        el.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
        el.setAttribute('data-counted', 'true');
        return;
      }

      el.setAttribute('data-counted', 'running');
      const duration = 1100;
      const start = performance.now();

      const step = (now) => {
        const ratio = Math.min(1, (now - start) / duration);
        const value = target * easeOutExpo(ratio);
        el.textContent = `${prefix}${value.toFixed(decimals)}${suffix}`;
        if (ratio < 1) {
          requestAnimationFrame(step);
        } else {
          el.setAttribute('data-counted', 'true');
        }
      };

      requestAnimationFrame(step);
    };

    if (!('IntersectionObserver' in window)) {
      nodes.forEach(run);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          run(entry.target);
        });
      },
      { threshold: 0.5 },
    );

    nodes.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/* ============================================================
   5. 导航滑动指示条
   测量当前激活项的位置，驱动一根短指示条做位移与宽度过渡。
   返回需要注入到 <span class="nav-indicator"> 的行内样式。
   ============================================================ */

export function useSlidingIndicator(containerRef, activeKey, deps = []) {
  const [style, setStyle] = useState({ opacity: 0 });

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const sync = () => {
      const active = container.querySelector('[data-active="true"]');
      if (!active || !active.offsetParent) {
        setStyle((prev) => ({ ...prev, opacity: 0 }));
        return;
      }
      const box = active.getBoundingClientRect();
      const base = container.getBoundingClientRect();
      setStyle({
        width: `${box.width}px`,
        transform: `translate3d(${box.left - base.left}px, 0, 0)`,
        opacity: 1,
      });
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(container);
    window.addEventListener('resize', sync);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, ...deps]);

  return style;
}

/* ============================================================
   6. 文字逐字/逐词遮罩上浮
   中英文自适应：含 CJK 时按字拆，否则按词拆。
   ============================================================ */

const CJK = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff]/;

export function SplitText({ text, delay = 0, step = 34, className = '' }) {
  const tokens = useMemo(() => {
    if (CJK.test(text)) return Array.from(text);
    return text.split(/(\s+)/).filter(Boolean);
  }, [text]);

  let index = 0;

  return (
    <span className={`split ${className}`.trim()}>
      <span className="sr-only">{text}</span>
      {tokens.map((token, i) => {
        const isSpace = /^\s+$/.test(token);
        if (isSpace) return <span key={`s-${i}`}> </span>;
        const current = index;
        index += 1;
        return (
          <span className="split-unit" key={`${token}-${i}`} aria-hidden="true">
            <span
              className="split-inner"
              style={{ '--unit-delay': `${delay + current * step}ms` }}
            >
              {token}
            </span>
          </span>
        );
      })}
    </span>
  );
}
