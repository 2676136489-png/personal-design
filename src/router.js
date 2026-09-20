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
