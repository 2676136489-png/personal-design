/**
 * 推 main 到 GitHub，失败时自动换解析地址 / 换代理重试。
 *
 * 为什么要有这个脚本：
 * GitHub 边缘节点的 IP 会轮换，写死的地址迟早失效，
 * 而失效时的表现极具误导性 —— 直连 21 秒超时、代理 502，
 * 两个方向同时不通，看起来像「网络坏了」，其实换个 IP 就能通。
 * 每次手工换 IP 太容易忘，索性把探测与重试写成脚本。
 *
 * ⚠️ push 必须由用户明确授权后才执行。这个脚本不判断授权，
 *    跑它之前先确认。
 *
 * 用法：node scripts/push-main.mjs
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pickIp, pushWithFallback } from './github-push.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REMOTE = 'https://github.com/2676136489-png/personal-design.git';
const BRANCH = 'main';

/* 推之前先跑一遍测试 —— 推送是最后一步，
   代码没验证过就推出去，线上出问题还得回滚。 */
const TEST_SCRIPTS = ['smoke-render', 'smoke-nav', 'smoke-lightbox', 'smoke-backtotop'];

console.log('· 先跑测试');
for (const s of TEST_SCRIPTS) {
  try {
    execFileSync(process.execPath, [`scripts/${s}.mjs`], { cwd: root, stdio: 'inherit' });
  } catch {
    console.log(`\n❌ ${s} 没通过，先别推`);
    process.exit(1);
  }
}

console.log('\n· 测试全过，开始推送');
const ip = pickIp(REMOTE, root);
if (ip) {
  execFileSync('git', ['config', 'http.curloptResolve', `github.com:443:${ip}`], { cwd: root, stdio: 'inherit' });
}

if (!pushWithFallback(REMOTE, BRANCH, root, {
  onIp: (next) =>
    execFileSync('git', ['config', 'http.curloptResolve', `github.com:443:${next}`], { cwd: root, stdio: 'inherit' }),
})) {
  console.log('\n❌ 推送失败：所有解析地址与代理路径都不通，稍后重试');
  process.exit(1);
}

const head = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
console.log(`\n✅ main 已推到 ${head}`);
