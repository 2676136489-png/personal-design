/**
 * 联系页底部的 CTA band（Luma CTA-01 规格）。
 *
 * 视觉：纯黑圆角卡片 + 循环扫过的霓虹 SVG 轨迹（红/紫/品红）+ 两团
 * 环境辉光 + 漂浮粒子，内容层压在 z-10。规格原文要求一切背景动画
 * 无限循环（living backdrop）—— 全站其他地方禁常驻循环动画，
 * 这里是唯一豁免：它是这块卡片的签名视觉，不是随手塞的装饰。
 * 动画只改 SVG 属性 / opacity / transform，不触发 layout，开销可控。
 *
 * 实现口径：
 * - 规格里的 Tailwind 工具类在本站翻译成 scoped CSS（本站 Tailwind
 *   只编译 ProjectShowcase 一个文件，见 tailwind.config.js 的 content）。
 * - SVG defs 的 id 全部带 luma01- 前缀，避免与页内其他 SVG 撞 id。
 * - 规格里 bgGrad 被 rect 引用却从未定义 —— 按 §10 删掉这个 rect。
 * - 联系内容（邮箱按钮、GitHub、电话）全部取自 data.js 的 profile，
 *   不手写第二份。
 */
import { motion, MotionConfig } from 'framer-motion';
import { profile } from '../data.js';

const TRAILS = [0, 1, 2, 3, 4, 5];
const PARTICLES = Array.from({ length: 15 }, (_, i) => i);

const GRADIENT_STOPS = [
  ['0%', '#6600CC', 0],
  ['20%', '#6600CC', 0.6],
  ['40%', '#FF0900', 0.9],
  ['60%', '#CC00FF', 1],
  ['80%', '#FF00AA', 0.6],
  ['100%', '#FF00AA', 0],
] as const;

/* 粒子初始坐标从索引伪随机散开；漂移方向交替，避免 15 个点走成一路 */
function particleLayout(i: number) {
  return {
    left: `${(i * 37 + 11) % 100}%`,
    top: `${(i * 53 + 7) % 100}%`,
    driftX: i % 2 === 0 ? 46 : -46,
    driftY: -36 - (i % 3) * 12,
  };
}

export default function CtaLuma() {
  return (
    <MotionConfig reducedMotion="user">
      <section id="cta-01-luma" className="luma01" aria-label="联系方式">
        <style>{`
          .luma01 {
            width: 100%;
            background: #000000;
            padding: 140px 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Helvetica Neue', system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
          }
          .luma01-card {
            position: relative;
            width: 100%;
            max-width: 1100px;
            min-height: 420px;
            border-radius: 24px;
            background: #000000;
            overflow: hidden;
            border: 1px solid rgba(255, 9, 0, 0.2);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 32px;
          }
          .luma01-border2 {
            position: absolute;
            inset: 0;
            border-radius: 24px;
            border: 1px solid rgba(255, 9, 0, 0.2);
            pointer-events: none;
          }
          .luma01-bg {
            position: absolute;
            inset: 0;
            pointer-events: none;
            overflow: hidden;
          }
          .luma01-svg { width: 100%; height: 100%; }
          .luma01-glow {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
          }
          .luma01-glow-red {
            background: radial-gradient(circle at 30% 40%, rgba(255, 9, 0, 0.2) 0%, transparent 60%);
          }
          .luma01-glow-purple {
            background: radial-gradient(circle at 70% 80%, rgba(102, 0, 204, 0.1) 0%, transparent 60%);
          }
          .luma01-dot {
            position: absolute;
            width: 4px;
            height: 4px;
            background: #ffffff;
            border-radius: 50%;
            filter: blur(1px);
          }
          .luma01-content {
            position: relative;
            z-index: 10;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .luma01-h2 {
            color: #ffffff;
            font-size: 56px;
            font-weight: 700;
            line-height: 1.1;
            margin: 0 0 24px;
            max-width: 800px;
          }
          .luma01-sub {
            color: #d1d5db;
            font-size: 16px;
            line-height: 1.6;
            margin: 0 0 40px;
            max-width: 600px;
          }
          .luma01-btn {
            width: 240px;
            height: 50px;
            background: #ffffff;
            border-radius: 9999px;
            color: #0d0d0d;
            font-size: 15px;
            font-weight: 500;
            font-family: inherit;
            border: 1px solid #dddddd;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
            cursor: pointer;
          }
          .luma01-links {
            margin-top: 24px;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 8px 28px;
          }
          .luma01-link {
            color: rgba(255, 255, 255, 0.55);
            font-size: 13px;
            letter-spacing: 0.04em;
            text-decoration: none;
            transition: color 0.2s ease;
          }
          .luma01-link:hover, .luma01-link:focus-visible { color: #ffffff; }
          @media (max-width: 767px) {
            .luma01 { padding: 96px 16px; }
            .luma01-card { padding: 32px; min-height: 360px; }
            .luma01-h2 { font-size: 36px; }
            .luma01-sub { font-size: 15px; }
          }
        `}</style>

        <div className="luma01-card">
          {/* 霓虹轨迹背景：6 条循环 sweep + 1 条白色亮芯 */}
          <div className="luma01-bg">
            <svg
              className="luma01-svg"
              viewBox="0 0 1100 420"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="luma01-trail" x1="0%" y1="0%" x2="100%" y2="100%">
                  {GRADIENT_STOPS.map(([offset, color, opacity]) => (
                    <stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />
                  ))}
                </linearGradient>
                <filter id="luma01-glow-f" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="15" result="blur1" />
                  <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur2" />
                  <feMerge>
                    <feMergeNode in="blur1" />
                    <feMergeNode in="blur2" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <g filter="url(#luma01-glow-f)" fill="none">
                {TRAILS.map((i) => (
                  <motion.path
                    key={i}
                    d={`M -100,${50 + i * 10} C 200,${-50 + i * 20} 600,${500 + i * 10} 1200,${200 + i * 15}`}
                    stroke="url(#luma01-trail)"
                    strokeWidth={4 + i * 2}
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                      pathLength: [0, 1, 1, 0],
                      opacity: [0, 0.4 + i * 0.1, 0.4 + i * 0.1, 0],
                      pathOffset: [0, 0, 1, 1],
                    }}
                    transition={{
                      duration: 10 + i * 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.5,
                    }}
                  />
                ))}
                <motion.path
                  d="M -100,80 C 200,-20 600,480 1200,220"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  strokeLinecap="round"
                  animate={{ opacity: [0.1, 0.3, 0.1], pathOffset: [0, 1] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                />
              </g>
            </svg>
          </div>

          {/* 环境辉光 ×2 */}
          <motion.div
            className="luma01-glow luma01-glow-red"
            animate={{ opacity: [0.1, 0.25, 0.1], scale: [1, 1.1, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="luma01-glow luma01-glow-purple"
            animate={{ opacity: [0.05, 0.15, 0.05], scale: [1.1, 1, 1.1] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* 漂浮粒子 ×15 */}
          {PARTICLES.map((i) => {
            const { left, top, driftX, driftY } = particleLayout(i);
            return (
              <motion.span
                key={i}
                className="luma01-dot"
                style={{ left, top }}
                animate={{
                  opacity: [0, 0.4, 0],
                  scale: [0, 1, 0],
                  x: [0, driftX],
                  y: [0, driftY],
                }}
                transition={{
                  duration: 10 + ((i * 13) % 20),
                  repeat: Infinity,
                  ease: 'linear',
                  delay: i * 0.4,
                }}
              />
            );
          })}

          {/* 内容层 */}
          <div className="luma01-content">
            <motion.h2
              className="luma01-h2"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              有想法，就写过来。
            </motion.h2>
            <motion.p
              className="luma01-sub"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            >
              实习、项目合作，或者只是对某个实现有疑问，邮件基本当天回。
            </motion.p>
            <motion.a
              className="luma01-btn"
              href={`mailto:${profile.email}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              whileHover={{ scale: 1.05, backgroundColor: '#FF0900', color: '#FFFFFF', borderColor: '#FF0900' }}
              whileTap={{ scale: 0.98 }}
            >
              发邮件给我
            </motion.a>
            <motion.div
              className="luma01-links"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <a className="luma01-link" href={profile.github} target="_blank" rel="noreferrer noopener">
                GitHub
              </a>
              <a className="luma01-link" href={`tel:${profile.phone}`}>
                {profile.phone}
              </a>
              <span className="luma01-link" style={{ cursor: 'default' }}>
                {profile.city}
              </span>
            </motion.div>
          </div>
        {/* 规格要求的双层描边：容器 border 之外再叠一圈同色边框，两层一起构成辉光边 */}
        <div className="luma01-border2" aria-hidden="true" />
        </div>
      </section>
    </MotionConfig>
  );
}
