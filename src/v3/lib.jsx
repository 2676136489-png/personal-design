/* 新版交互原语。全部从 framer-motion 取，不引第三方 UI 组件。 */
import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const EASE = [0.25, 0.1, 0.25, 1];
const MOTION_TAGS = {
  div: motion.div,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  p: motion.p,
  li: motion.li,
  section: motion.section,
  a: motion.a,
  span: motion.span,
};

export function FadeIn({
  as = 'div',
  delay = 0,
  duration = 0.7,
  x = 0,
  y = 30,
  className = '',
  style,
  children,
  ...rest
}) {
  const Tag = MOTION_TAGS[as] || motion.div;
  return (
    <Tag
      className={className}
      style={style}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0 }}
      transition={{ duration, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* 鼠标靠近时整块跟随。transform 写在内层，外层保留定位用的 translate。 */
export function Magnet({ children, padding = 150, strength = 3, className = '', style }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let active = false;
    const onMove = (event) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const within =
        event.clientX >= rect.left - padding &&
        event.clientX <= rect.right + padding &&
        event.clientY >= rect.top - padding &&
        event.clientY <= rect.bottom + padding;
      if (within) {
        if (!active) {
          el.style.transition = 'transform 0.3s ease-out';
          active = true;
        }
        el.style.transform = `translate3d(${(event.clientX - cx) / strength}px, ${(event.clientY - cy) / strength}px, 0)`;
      } else if (active) {
        active = false;
        el.style.transition = 'transform 0.6s ease-in-out';
        el.style.transform = 'translate3d(0px, 0px, 0)';
      }
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [padding, strength]);

  return (
    <div ref={ref} className={className} style={{ willChange: 'transform', ...style }}>
      {children}
    </div>
  );
}

/* 中文按字、英文按词切：中文可以任意换行，英文单词不能从中间断开。 */
function tokenize(text) {
  const tokens = [];
  let buf = '';
  const flush = () => {
    if (buf) {
      tokens.push({ type: 'word', text: buf });
      buf = '';
    }
  };
  for (const ch of Array.from(text)) {
    if (/\s/.test(ch)) {
      flush();
      tokens.push({ type: 'space', text: ' ' });
    } else if (/[\u3400-\u9fff\u3000-\u303f\uff00-\uffef]/u.test(ch)) {
      flush();
      tokens.push({ type: 'char', text: ch });
    } else {
      buf += ch;
    }
  }
  flush();
  return tokens;
}

function AnimatedChar({ char, progress, range }) {
  const opacity = useTransform(progress, range, [0.2, 1]);
  return (
    <span className="v3-at-char">
      <span className="v3-at-ghost">{char}</span>
      <motion.span className="v3-at-ink" style={{ opacity }}>
        {char}
      </motion.span>
    </span>
  );
}

export function AnimatedText({ text, className = '', style }) {
  const ref = useRef(null);
  /* 区间结束点放在视口 70% 处：段落进入阅读位置时已经全亮。
   * 结束点太靠上（参考站用 end 0.2）会让人停在段落上时还有半段是灰的，
   * 像渲染坏了。锚点滚动带 scroll-margin-top 时段落会再下移一截，
   * 结束点要留出这段余量。 */
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.95', 'end 0.7'] });
  const total = Math.max(1, Array.from(text).length);
  /* 显影区间压在 progress 0—0.9，留一段余量给「已经读到了但还没滚到底」。
   * 铺满 0—1 时最后一个字永远差一点点，停在 0.2 的灰上。 */
  const REVEAL_SPAN = 0.9;
  const rangeOf = (at) => [(at / total) * REVEAL_SPAN, ((at + 1) / total) * REVEAL_SPAN];
  let cursor = 0;

  return (
    <p ref={ref} className={`v3-at ${className}`} style={style}>
      {/* 逐字拆分对读屏不友好：完整文本单独给一份，动画层整体隐藏。 */}
      <span className="v3-sr-only">{text}</span>
      <span aria-hidden="true">
        {tokenize(text).map((token, index) => {
          if (token.type === 'space') {
            cursor += 1;
            return <span key={index} className="v3-at-space"> </span>;
          }
          if (token.type === 'char') {
            const at = cursor;
            cursor += 1;
            return (
              <AnimatedChar
                key={index}
                char={token.text}
                progress={scrollYProgress}
                range={rangeOf(at)}
              />
            );
          }
          const chars = Array.from(token.text).map((ch, i) => {
            const at = cursor + i;
            return (
              <AnimatedChar
                key={`${index}-${i}`}
                char={ch}
                progress={scrollYProgress}
                range={rangeOf(at)}
              />
            );
          });
          cursor += token.text.length;
          return (
            <span key={index} className="v3-at-word">
              {chars}
            </span>
          );
        })}
      </span>
    </p>
  );
}

export function GradientButton({ href = '#/contact', children, className = '', external = false }) {
  return (
    <a
      href={href}
      className={`v3-btn-gradient ${className}`}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      {children}
    </a>
  );
}

export function GhostButton({ href, children, className = '', external = false }) {
  return (
    <a
      href={href}
      className={`v3-btn-ghost ${className}`}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      {children}
    </a>
  );
}

/* 渐变文字靠 background-clip:text，动画 transform 放在外层 wrapper 上。
 * 直接给同一个元素加 transform 会让部分浏览器把裁切算坏。 */
export function SectionTitle({ children, className = '', id }) {
  return (
    <FadeIn className="v3-title-wrap" y={40}>
      <h2 id={id} className={`v3-title ${className}`}>{children}</h2>
    </FadeIn>
  );
}
