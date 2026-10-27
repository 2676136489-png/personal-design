/**
 * GitHub 推送的通路自愈：解析地址失效了就换一个，代理不通就直连。
 *
 * 为什么需要这个：
 * GitHub 的边缘节点 IP 会轮换，写死一个地址迟早失效。
 * 失效时的表现极具误导性 —— 直连 21 秒超时、代理 502，
 * 两个方向同时不通，很容易被当成「网络坏了」放弃。
 * 实际只是那个 IP 过期了，换一个就行。
 *
 * ⚠️ 探针必须用 git 自己探，不能用 curl。
 * curl 走 OpenSSL，git 走 schannel（Windows TLS）——
 * 两者对边缘节点的兼容性不一样，实测出现过同一批 IP 里
 * curl 返回 200 而 git 连不上的情况。用 curl 探出来的地址，
 * git 未必能用。所以直接 `git ls-remote` 试，那才是推送真正走的路。
 *
 * ⚠️ 探针走直连（清掉代理环境变量）。
 * 代理端口可能还在 LISTENING，但上游已经不通，
 * 表现是 CONNECT tunnel failed / 502 —— 很容易被误判成「IP 不通」。
 */
import { execSync } from 'node:child_process';

/* 候选解析地址。GitHub 边缘节点换过好几轮，
   140.82.112.3 → 20.27.177.113 → 20.233.83.145 → 再换。
   池子给宽一些：单个地址随时可能失效或抖动，
   挨个探到能用的为止。 */
export const GH_IPS = [
  '20.233.83.145',
  '140.82.112.3',
  '140.82.113.3',
  '140.82.114.3',
  '20.27.177.113',
  '140.82.116.3',
  '140.82.117.3',
  '140.82.118.3',
  '140.82.119.3',
  '140.82.121.3',
  '20.205.243.166',
  '20.201.28.151',
];

const NO_PROXY = { HTTP_PROXY: '', HTTPS_PROXY: '', http_proxy: '', https_proxy: '' };

/* 用 git 自己探：指定解析地址 → ls-remote → 能不能读到远端引用。
 *
 * ⚠️ 必须重试，不能探一次就判死。
 * GitHub 边缘节点会间歇性拒绝连接：同一个 IP、同一��命令，
 * 隔几秒可能一次通一次不通（实测「Failed to connect after 21084 ms」
 * 与 1.7 秒成功交替出现）。单次失败就换下一个地址，
 * 会把「只是这一下抖动」误判成「这个 IP 过期了」，
 * 于是明明有可用地址也会全部试完再放弃。
 *
 * 代理端口还在 LISTENING 时上游往往已经不通，
 * 表现是 CONNECT tunnel failed / 502 —— 也要先清掉代理再试。 */
const PROBE_ATTEMPTS = 2;

export function probeIp(ip, remote, cwd) {
  for (let i = 0; i < PROBE_ATTEMPTS; i += 1) {
    try {
      execSync(`git -c http.curloptResolve="github.com:443:${ip}" ls-remote --exit-code ${remote} HEAD`, {
        cwd,
        encoding: 'utf8',
        shell: true,
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 60000,
        env: { ...process.env, ...NO_PROXY },
      });
      return true;
    } catch {
      /* 这一下没通，再试一次 */
    }
  }
  return false;
}

/* 挨个探，探到第一个 git 真能用的就返回。 */
export function pickIp(remote, cwd, label = 'github.com') {
  for (const ip of GH_IPS) {
    if (probeIp(ip, remote, cwd)) {
      console.log(`· ${label} 解析地址用 ${ip}`);
      return ip;
    }
    console.log(`· ${ip} 不通，换下一个`);
  }
  return null;
}

/* 执行一次 git 命令，失败返回 false 而不是抛出去。
   timeout 要给足 —— 边缘节点拒绝连接时 git 会等满 21 秒，
   给太短会把「正在重试的连接」提前杀掉，反而误判成失败。 */
export function tryGit(cmd, cwd, { noProxy = false } = {}) {
  try {
    execSync(cmd, {
      cwd,
      stdio: 'inherit',
      shell: true,
      timeout: 300000,
      env: noProxy ? { ...process.env, ...NO_PROXY } : process.env,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * 推送远端分支，失败时自动换解析地址、换代理/直连重试。
 *
 * 顺序：
 *   1. 用当前配置推一次（通常由调用方已经配好了可用 IP）
 *   2. 换候选 IP 重试（git 探过的那些）
 *   3. 走代理重试
 *   4. 清掉代理直连重试
 *
 * 全部失败返回 false，由调用方决定要不要中断。
 */
export function pushWithFallback(remote, branch, cwd, { onIp } = {}) {
  if (tryGit(`git push -f origin ${branch}`, cwd)) {
    console.log('· 推送成功');
    return true;
  }

  console.log('· 第一次推送失败，换解析地址重试');
  for (const ip of GH_IPS) {
    if (!probeIp(ip, remote, cwd)) continue;
    console.log(`· 试 ${ip}`);
    if (onIp) onIp(ip);
    /* 同一个地址可能只是抖了一下 —— 探通了不代表推一定成，
       所以每个地址给两次机会（第一次失败再试一次）。 */
    if (tryGit(`git push -f origin ${branch}`, cwd, { noProxy: true })) {
      console.log('· 推送成功');
      return true;
    }
    if (tryGit(`git push -f origin ${branch}`, cwd, { noProxy: true })) {
      console.log('· 推送成功（重试一次）');
      return true;
    }
  }

  console.log('· 逐个 IP 都不行，试试走代理');
  if (tryGit(`git push -f origin ${branch}`, cwd)) {
    console.log('· 推送成功');
    return true;
  }

  console.log('· 代理也不行，试试清掉代理直连');
  for (let i = 0; i < 2; i += 1) {
    if (tryGit(`git push -f origin ${branch}`, cwd, { noProxy: true })) {
      console.log('· 推送成功');
      return true;
    }
  }

  return false;
}
