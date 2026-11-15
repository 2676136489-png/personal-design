/* 作品卡的三格素材。
 *
 * 之前 shotsOf() 在没有章节截图的项目上用同一张封面补齐三格，
 * 十张卡里有六张是「同一张图复制三遍」。现在改成：
 *   - 有线上站点的项目，用各仓库 README 里挑过的真实界面截图，
 *     或从线上站点抓的不同视图（scripts/make-gallery-images.py）；
 *   - 没有线上界面的项目（C 控制台 / 概念项目），
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
    fromGallery('campus-dynamics', '校园圈子动态广场'),
    fromGallery('campus-ai', '校园圈子 AI 助手'),
    fromGallery('campus-admin', '校园圈子管理员后台'),
  ],
  opspilot: [
    fromGallery('opspilot-capabilities', 'OpsPilot 能力目录'),
    fromGallery('opspilot-topology', 'OpsPilot 服务拓扑'),
    fromGallery('opspilot-incident', 'OpsPilot 故障详情与证据链'),
  ],
  research: [
    fromGallery('research-workflow-v2', 'AI 研究工作台七步流水线'),
    fromGallery('research-rag-v2', 'AI 研究工作台 RAG 流程'),
    fromGallery('research-evaluation', 'AI 研究工作台效果评估'),
  ],
  checkin: [
    fromGallery('checkin-board-v2', '学习目标管理台看板'),
    fromGallery('checkin-weekly', '学习目标管理台周报'),
    fromGallery('checkin-today-v2', '学习目标管理台今日视图'),
  ],
  station: [
    fromGallery('station-voyages', '菜鸟驿站线上站：四段航程'),
    fromGallery('station-innovation', '菜鸟驿站线上站：工程选择'),
    fromGallery('station-source', '菜鸟驿站线上站：代码结构'),
  ],
  archive: [
    fromGallery('archive-jack3d', '网页设计档案：三维创作者作品集'),
    fromGallery('archive-designworld', '网页设计档案：设计世界首屏'),
    fromGallery('archive-space', '网页设计档案：火星航行首屏'),
  ],
  lumora: [
    fromGallery('lumora-library', 'Lumora 区块库与分类筛选'),
    fromGallery('lumora-blocks', 'Lumora 界面控件区块'),
    fromGallery('lumora-wiki', 'Lumora Wiki 模板演示'),
  ],
  gomoku: [
    fromGallery('gomoku-play', '五子棋对局与逐手解说'),
    fromGallery('gomoku-analysis', '五子棋胜率与局面分析'),
    fromGallery('gomoku-coach', '五子棋教练逐手讲解'),
  ],
  wiki: [
    fromGallery('wiki-engineering', 'iGEM Wiki 工程页：三轮循环'),
    fromGallery('wiki-results', 'iGEM Wiki 结果页：组合 07'),
    fromGallery('wiki-plugins', 'iGEM Wiki 插件演示页'),
  ],
  portfolio: [
    fromGallery('portfolio-works-v2', '个人作品集线上作品页'),
    fromGallery('portfolio-detail-v2', '个人作品集线上项目详情页'),
    fromGallery('portfolio-about', '个人作品集线上关于页'),
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
