/**
 * ScrollTrigger 动效基座。
 *
 * 全站硬约束：所有动画由滚动位置驱动，组件卸载必须销毁 ScrollTrigger 实例。
 * 因此所有页面级效果统一走 useGsapScope —— gsap.context 在卸载时 revert，
 * 上下文里创建的 ScrollTrigger / tween 一次性清干净，不需要每个组件
 * 各自记一遍要 kill 什么。
 *
 * 移动端规则（<768px）：pin、复杂 mask、重视差全部关闭，只保留基础淡入。
 */
import { useLayoutEffect, useRef, type DependencyList } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
  /* 地址栏收起/展开会改变可视高度，移动端尤其容易让 pin 错位 */
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, ScrollTrigger };

export const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const isMobile = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;

/**
 * 在容器作用域内创建 gsap 动画与 ScrollTrigger，卸载时自动清理。
 * 返回的 ref 挂到页面根节点上。
 */
export function useGsapScope<T extends HTMLElement = HTMLDivElement>(
  setup: (scope: HTMLElement) => void | (() => void),
  deps: DependencyList = [],
) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined') return undefined;
    let cleanup: void | (() => void);
    const ctx = gsap.context(() => {
      cleanup = setup(el);
    }, el);
    /* 图标与图片可能改变布局高度，延后一帧再校准一次触发点 */
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      cancelAnimationFrame(raf);
      ctx.revert();
      if (typeof cleanup === 'function') cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

/**
 * 章节入场：以 [data-reveal-group]（没有则用作用域根）为触发点，
 * 组内 [data-r] 元素按 DOM 顺序错开淡入上移；单个节点可用
 * data-r-delay 微调。一次性触发，力度克制。
 */
export function revealChildren(
  scope: HTMLElement,
  opts: { y?: number; stagger?: number; start?: string } = {},
) {
  const { y = 26, stagger = 0.09, start = 'top 82%' } = opts;
  if (reducedMotion()) return;
  const groups = Array.from(scope.querySelectorAll<HTMLElement>('[data-reveal-group]'));
  const roots = groups.length ? groups : [scope];
  roots.forEach((group) => {
    const nodes = Array.from(group.querySelectorAll<HTMLElement>('[data-r]'));
    if (!nodes.length) return;
    gsap.set(nodes, { opacity: 0, y });
    gsap
      .timeline({ scrollTrigger: { trigger: group, start, once: true } })
      .to(nodes, { opacity: 1, y: 0, duration: 0.78, stagger, ease: 'power2.out' });
  });
}
