import { useEffect, useState } from 'react';

function parseHash() {
  const raw = window.location.hash.replace(/^#/, '');
  if (!raw || raw === '/') return { path: '/', anchor: '' };
  const [pathPart, anchorPart] = raw.split('#');
  const path = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
  return { path, anchor: anchorPart || '' };
}

export function useRoute() {
  const [route, setRoute] = useState(parseHash);

  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}

export function navigate(to) {
  window.location.hash = to.startsWith('#') ? to.slice(1) : to;
}

/* 跳转到首页某个锚点区块 */
export function goToSection(id) {
  const current = parseHash();
  if (current.path !== '/') {
    window.location.hash = `/#${id}`;
    return;
  }
  const target = document.getElementById(id);
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* 统一的导航入口：既能去某个页面，也能去首页的某个区块。
   导航栏的子项里有「项目详情页」和「首页区块」两种目标，交给这里分派，
   免得每个子项各自判断一遍路由状态。 */
export function goToNavTarget(target) {
  if (target === '/') {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  if (target.startsWith('/#')) {
    goToSection(target.slice(2));
    return;
  }
  navigate(target);
}
