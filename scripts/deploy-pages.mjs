/**
 * 把作品集构建产物推送到 GitHub Pages 的 gh-pages 分支。
 *
 * 用法：node scripts/deploy-pages.mjs
 *
 * 说明：
 * - GitHub Pages 的项目站点地址是 https://<用户名>.github.io/<仓库名>/ ，
 *   所以构建时必须带 --base=/<仓库名>/ ，否则资源路径会 404。
 * - 主分支只放源码，构建产物单独走 gh-pages 分支（orphan 式，历史独立），
 *   避免 13 张截图和 bundle 把主仓库撑大。
 * - 首次使用需要在仓库 Settings → Pages → Build and deployment
 *   把 Source 设为 "Deploy from a branch"，分支选 gh-pages、目录选 /(root)。
 */
import { execSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'dist-pages');
const REPO = 'personal-design';
const REMOTE = `https://github.com/2676136489-png/${REPO}.git`;
const BRANCH = 'gh-pages';

function run(cmd, cwd = root) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit', shell: true });
}

// 1. 构建
run(`node_modules${path.sep}.bin${path.sep}vite.cmd build --base=/${REPO}/ --outDir dist-pages --emptyOutDir`);

// 2. Pages 默认会用 Jekyll 处理，下划线开头的目录会被忽略，加 .nojekyll 关掉
writeFileSync(path.join(outDir, '.nojekyll'), '');

// 3. 把 dist-pages 当成一个独立仓库提交，再强推到 gh-pages 分支
const inited = existsSync(path.join(outDir, '.git'));
if (!inited) {
  run('git init -q', outDir);
  run(`git remote add origin ${REMOTE}`, outDir);
} else {
  run(`git remote set-url origin ${REMOTE}`, outDir);
}

run(`git checkout -B ${BRANCH}`, outDir);
run('git add -A', outDir);

const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
try {
  run(`git commit -m "Deploy to GitHub Pages - ${stamp}"`, outDir);
} catch {
  console.log('· 没有内容变化，跳过提交');
}

run(`git push -f origin ${BRANCH}`, outDir);

console.log(`\n完成 → https://2676136489-png.github.io/${REPO}/`);
