/* 新版（3D 视觉）内容层。
 * 不复制数据：全部从 src/data.js 派生，避免同一份事实写两遍。
 * 校园圈子不在 projects 数组里，这里映射成统一形状，10 个项目才能一起渲染。 */
import {
  projects,
  campus,
  categories,
  profile,
  heroFacts,
  resume,
  capabilities,
  achievements,
  awards,
  timeline,
  media,
  asset,
  imgAttrs,
} from '../data.js';

export { categories, profile, heroFacts, resume, capabilities, achievements, awards, timeline, media, imgAttrs };

export const HERO_AVATAR = asset('/media/avatar-memoji-v2.webp');

/* 关于页四角的表情，顺序对应 tl / tr / bl / br */
export const MOOD_AVATARS = [
  asset('/media/avatar-moods/wink.webp'),
  asset('/media/avatar-moods/idea.webp'),
  asset('/media/avatar-moods/thumbs-up.webp'),
  asset('/media/avatar-moods/macbook.webp'),
];

const campusItem = {
  slug: campus.slug,
  title: campus.name,
  en: campus.en,
  category: 'Web 应用',
  year: '2026',
  period: campus.period,
  description: campus.lede,
  lede: campus.headline,
  image: campus.cover,
  stack: campus.stack,
  site: campus.site,
  github: campus.github,
  role: campus.role,
  metrics: campus.metrics,
  chapters: campus.chapters,
  accent: campus.accent,
  flagship: true,
};

export const ALL_PROJECTS = [campusItem, ...projects];
export const PROJECT_BY_SLUG = Object.fromEntries(ALL_PROJECTS.map((p) => [p.slug, p]));

export { galleryFor } from './gallery.js';

/* 双行反向滚动带。两行都铺满 10 个项目的封面，
   第二行用倒序，避免上下两行在同一列反复出现同一张图。
   三倍复制保证相位走满一组后接缝处仍有内容。 */
const COVERS = ALL_PROJECTS.map((p) => ({ src: p.image, title: p.title, slug: p.slug }));
const triple = (list) => [...list, ...list, ...list];
export const MARQUEE_ROW_ONE = triple(COVERS);
export const MARQUEE_ROW_TWO = triple([...COVERS].reverse());

export const NAV_ITEMS = [
  { label: '首页', href: '#/' },
  { label: '作品', href: '#/works' },
  { label: '能力', href: '#/skills' },
  { label: '关于', href: '#/about' },
  { label: '竞赛与活动', href: '#/awards' },
  { label: '简历', href: '#/resume' },
  { label: '联系', href: '#/contact' },
];

export const SECTION_ANCHORS = ['about', 'skills', 'contact'];

export function parseRoute(hash) {
  const raw = (hash || '').replace(/^#/, '') || '/';
  const path = raw.split('#')[0] || '/';
  if (path === '/' || path === '') return { kind: 'home' };
  if (path === '/works') return { kind: 'works' };
  if (path === '/resume') return { kind: 'resume' };
  if (path === '/awards') return { kind: 'awards' };
  if (path === '/campus-circle') return { kind: 'detail', slug: 'campus' };
  if (path.startsWith('/category/')) return { kind: 'category', slug: path.slice(10) };
  const anchor = path.slice(1);
  if (SECTION_ANCHORS.includes(anchor)) return { kind: 'anchor', id: anchor };
  if (PROJECT_BY_SLUG[anchor]) return { kind: 'detail', slug: anchor };
  return { kind: 'home' };
}
