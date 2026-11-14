import { useEffect, useState } from 'react';
import { parseRoute, profile, PROJECT_BY_SLUG, categories } from './content.js';
import { Landing, SiteNav } from './sections.jsx';
import { FullResume, ProjectDetail, Works } from './Detail.jsx';

const TITLE_BASE = `卢柯宇 | 个人作品集`;
const ANCHOR_TITLES = { about: '关于', skills: '能力', contact: '联系' };

function useHashRoute() {
  const [route, setRoute] = useState(() =>
    parseRoute(typeof window === 'undefined' ? '' : window.location.hash),
  );

  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}

export default function App() {
  const route = useHashRoute();

  useEffect(() => {
    document.documentElement.style.backgroundColor = '#0C0C0C';
    document.body.style.backgroundColor = '#0C0C0C';
  }, []);

  /* 详情页、作品页与简历页各自有标题，分享与标签页才看得出是哪一页。 */
  useEffect(() => {
    let title = TITLE_BASE;
    if (route.kind === 'works') {
      title = `全部作品 | ${profile.name}`;
    } else if (route.kind === 'resume') {
      title = `简历 | ${profile.name}`;
    } else if (route.kind === 'detail') {
      const project = PROJECT_BY_SLUG[route.slug];
      if (project) title = `${project.title} | ${profile.name}`;
    } else if (route.kind === 'category') {
      const category = categories.find((item) => item.slug === route.slug);
      if (category) title = `${category.name} | ${profile.name}`;
    } else if (route.kind === 'anchor' && ANCHOR_TITLES[route.id]) {
      title = `${ANCHOR_TITLES[route.id]} | ${profile.name}`;
    }
    document.title = title;
  }, [route.kind, route.id, route.slug]);

  /* 锚点路由（#/about 等）和章节深链（#/slug#chapter）都要等新内容上屏再滚。
   * 其余路由换页直接回顶部，否则从长页面点进详情页会停在半空。 */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const raw = window.location.hash.replace(/^#/, '');
      const parts = raw.split('#');
      if (route.kind === 'anchor') {
        document.getElementById(route.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (parts[1]) {
        document.getElementById(parts[1])?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo(0, 0);
      }
    }, 60);
    return () => window.clearTimeout(timer);
  }, [route.kind, route.id, route.slug]);

  const content = (() => {
    switch (route.kind) {
      case 'detail':
        return <ProjectDetail slug={route.slug} />;
      case 'works':
        return <Works />;
      case 'category':
        return <Works categorySlug={route.slug} />;
      case 'resume':
        return <FullResume />;
      default:
        return <Landing />;
    }
  })();

  return (
    <div className="v3">
      <SiteNav />
      <main className="v3-main">{content}</main>
    </div>
  );
}
