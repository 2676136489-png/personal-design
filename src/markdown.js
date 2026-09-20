import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { cloud } from './cloud';

marked.setOptions({ gfm: true, breaks: true });

const STORAGE_IMG_RE = /!\[([^\]]*)\]\(\s*storage:([^)\s]+)\s*\)/g;

export function renderMarkdown(source) {
  const html = marked.parse(source || '');
  return DOMPurify.sanitize(html, {
    ADD_ATTR: ['target', 'rel'],
  });
}

// 提取正文中 storage: 前缀的图片路径（云端存储对象）
export function extractStoragePaths(source) {
  const paths = new Set();
  let match;
  const re = new RegExp(STORAGE_IMG_RE.source, 'g');
  while ((match = re.exec(source || ''))) {
    paths.add(match[2]);
  }
  return [...paths];
}

// 将 storage:path 替换为签名 URL
export function replaceStorageUrls(source, urlMap) {
  return (source || '').replace(
    new RegExp(STORAGE_IMG_RE.source, 'g'),
    (all, alt, path) => (urlMap[path] ? `![${alt}](${urlMap[path]})` : `![${alt}](「登录后可见的云端图片」)`),
  );
}

function pickSignedUrl(item) {
  if (!item) return null;
  if (typeof item === 'string') return item;
  return item.signedUrl || item.signedURL || item.url || null;
}

// 解析一批云端存储路径为签名 URL（需要已登录会话）
export async function resolveStorageUrls(paths) {
  const map = {};
  if (!paths.length) return map;
  try {
    const res = await cloud.storage.createSignedUrls(paths, 3600);
    const items = Array.isArray(res?.data) ? res.data : [];
    items.forEach((item, index) => {
      const url = pickSignedUrl(item);
      const key = item && typeof item === 'object' && item.path ? item.path : paths[index];
      if (url && key) map[key] = url;
    });
  } catch {
    // 未登录或网络失败时保留占位
  }
  return map;
}

export async function resolveSingleUrl(path) {
  try {
    const res = await cloud.storage.createSignedUrl(path, 3600);
    return pickSignedUrl(res?.data);
  } catch {
    return null;
  }
}

export function readingTime(source) {
  const chars = (source || '').replace(/[#*>`\-\[\]()|\s]/g, '').length;
  return Math.max(1, Math.round(chars / 400));
}
