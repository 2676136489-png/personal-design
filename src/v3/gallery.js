/* 作品卡的三格素材。
 *
 * 之前 shotsOf() 在没有章节截图的项目上用同一张封面补齐三格，
 * 九张卡里有六张是「同一张图复制三遍」。现在改成：
 *   - 有线上站点的项目，用各仓库 README 里挑过的真实界面截图，
 *     或从线上站点抓的不同视图（scripts/make-gallery-images.py）；
 *   - 没有线上界面的项目（C 控制台 / Wiki 模板 / 视觉探索），
 *     只放一张真实封面，另外两格用章节名与实测数据做信息面板，
 *     不拿同一张图凑数。
 */
import { asset, imgAttrs } from '../data.js';
import sizes from './gallery-sizes.json';

const fromGallery = (name, alt) => {
  const path = `/media/gallery/${name}.webp`;
  const [width, height] = sizes[path] || [];
  return { kind: 'image', src: asset(path), alt, width, height };
};

const fromMedia = (path, alt) => {
  const src = asset(path);
  return { kind: 'image', src, alt, ...imgAttrs(src) };
};

const coverOf = (project) => ({
  kind: 'image',
  src: project.image,
  alt: project.title,
  ...imgAttrs(project.image),
});

const IMAGES = {
  campus: [
    fromMedia('/media/campus/dashboard-1960.webp', '校园圈子学生中心'),
    fromMedia('/media/campus/feed.webp', '校园圈子动态广场'),
    fromMedia('/media/campus/ai-assistant-overview.webp', '校园圈子 AI 助手整屏'),
  ],
  opspilot: [
    fromGallery('opspilot-dashboard', 'OpsPilot 指挥中心'),
    fromGallery('opspilot-incident', 'OpsPilot 故障详情与证据链'),
    fromGallery('opspilot-agents', 'OpsPilot Agent 运行列表'),
  ],
  research: [
    fromGallery('research-workflow', 'AI 研究工作台七步流水线'),
    fromGallery('research-rag', 'AI 研究工作台 RAG 流程'),
    fromGallery('research-reports', 'AI 研究工作台研究报告'),
  ],
  checkin: [
    fromGallery('checkin-board', '学习目标管理台看板'),
    fromGallery('checkin-today', '学习目标管理台今日视图'),
    fromGallery('checkin-single', '学习目标管理台单文件版'),
  ],
  gomoku: [
    fromGallery('gomoku-board', '五子棋对局与逐手解说'),
    fromGallery('gomoku-gallery', '五子棋棋谱展台'),
    fromGallery('gomoku-hub', '五子棋大厅'),
  ],
  portfolio: [
    fromGallery('portfolio-hero', '个人作品集线上首屏'),
    fromGallery('portfolio-works', '个人作品集线上作品页'),
    fromGallery('portfolio-detail', '个人作品集线上项目详情页'),
  ],
};

const chaptersPanel = (project) => ({
  kind: 'panel',
  variant: 'chapters',
  title: '章节',
  lines: (project.chapters || []).slice(0, 4).map((c) => c.nav || c.title),
});

const factsPanel = (project) => {
  const metrics = (project.metrics || []).slice(0, 4).map((m) => `${m.value} ${m.label}`);
  const lines = metrics.length
    ? metrics
    : [project.tag, ...project.stack.split(' · ')].slice(0, 4);
  return { kind: 'panel', variant: 'facts', title: project.stack, lines };
};

/** 恒返回三格：图或面板，且同一张卡里不会出现重复的图源。 */
export function galleryFor(project) {
  const images = IMAGES[project.slug];
  if (images && images.length >= 3) return images.slice(0, 3);
  return [images?.[0] || coverOf(project), chaptersPanel(project), factsPanel(project)];
}
