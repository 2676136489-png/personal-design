/**
 * /contact 联系页
 * - 标题与渠道行时序入场；
 * - 链接 hover 用 SVG 下划线从左画到右（.ds-underline）；
 * - 表单 focus 与提交都有柔和过渡；本站无后端，
 *   提交时组装 mailto 交给本地邮件客户端，不做「假装发送成功」。
 */
import { useState } from 'react';
import { ArrowUpRight, Check, Copy, Github, Mail, MapPin, Phone } from 'lucide-react';
import { revealChildren, useGsapScope } from '../motion/scroll.tsx';
import { profile } from '../data.js';
import CtaLuma from './CtaLuma.tsx';

export default function Contact() {
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState('idle');

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setStatus('copy-failed');
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get('name') || '').trim();
    const from = String(data.get('email') || '').trim();
    const msg = String(data.get('message') || '').trim();
    if (!name || !msg) {
      setStatus('invalid');
      return;
    }
    const subject = encodeURIComponent(`来自作品集的留言 · ${name}`);
    const body = encodeURIComponent(`${msg}\n\n—— ${name}${from ? `（${from}）` : ''}`);
    setStatus('opened');
    window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
  };

  const scopeRef = useGsapScope<HTMLDivElement>((scope) => {
    revealChildren(scope, { stagger: 0.1 });
  }, []);

  return (
    <div className="ds-page" ref={scopeRef}>
      <header className="ds-wrap" style={{ paddingTop: 'calc(var(--nav-height) + 56px)' }}>
        <div data-reveal-group>
          <p className="ds-eyebrow" data-r>
            Contact
          </p>
          <h1 className="ds-display" data-r style={{ fontSize: 'clamp(2.4rem, 6vw, 5rem)' }}>
            聊聊？
          </h1>
          <p className="ds-lede" data-r style={{ marginTop: 20 }}>
            项目合作，或者只是对某个实现有疑问，都可以直接找我。邮件基本当天回。
          </p>
        </div>
      </header>

      <section className="ds-section" style={{ paddingTop: 'clamp(48px, 8vh, 88px)' }}>
        <div className="ds-wrap">
          <div
            className="ds-split contact-grid"
            style={{ '--split': 'minmax(0, 0.9fr) minmax(0, 1.1fr)', '--split-gap': 'clamp(32px, 5vw, 80px)' }}
          >
            {/* 渠道 */}
            <div data-reveal-group>
              <dl style={{ margin: 0 }}>
                <Channel
                  icon={<Mail size={16} />}
                  label="邮箱"
                  value={profile.email}
                  href={`mailto:${profile.email}`}
                  action={
                    <button type="button" className="site-icon-btn" onClick={copyEmail} aria-label="复制邮箱">
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  }
                />
                <Channel
                  icon={<Phone size={16} />}
                  label="电话"
                  value={profile.phone}
                  href={`tel:${profile.phone}`}
                />
                <Channel
                  icon={<Github size={16} />}
                  label="GitHub"
                  value="2676136489-png"
                  href={profile.github}
                  external
                />
                <Channel icon={<MapPin size={16} />} label="坐标" value={`${profile.city} · ${profile.hometown}`} />
              </dl>

              <p
                className="ds-meta"
                style={{ marginTop: 24, opacity: 0.8 }}
                role="status"
                aria-live="polite"
              >
                {copied ? '邮箱已复制到剪贴板' : status === 'copy-failed' ? '复制失败，请手动选中邮箱' : ''}
              </p>
            </div>

            {/* 表单 */}
            <form className="ds-card" style={{ padding: 'clamp(22px, 3vw, 32px)' }} onSubmit={onSubmit} data-reveal-group>
              <div data-r className="contact-form-row">
                <div className="ds-field">
                  <label htmlFor="c-name">称呼</label>
                  <input id="c-name" name="name" autoComplete="name" placeholder="怎么称呼你" required />
                </div>
                <div className="ds-field">
                  <label htmlFor="c-email">邮箱</label>
                  <input id="c-email" name="email" type="email" autoComplete="email" placeholder="方便回复的话" />
                </div>
              </div>
              <div className="ds-field" data-r style={{ marginTop: 16 }}>
                <label htmlFor="c-msg">想聊什么</label>
                <textarea id="c-msg" name="message" placeholder="项目、岗位、或者一个具体的技术问题" required />
              </div>
              <div
                data-r
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 16,
                  marginTop: 20,
                }}
              >
                <button className="ds-btn" type="submit">
                  发送
                  <ArrowUpRight size={16} />
                </button>
                <p
                  className="ds-meta"
                  style={{ margin: 0 }}
                  role="status"
                  aria-live="polite"
                >
                  {status === 'opened'
                    ? '已调起邮件客户端，直接发送即可'
                    : status === 'invalid'
                      ? '称呼和内容是必填的'
                      : '提交会打开你的邮件客户端，不经过服务器'}
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* 页面收尾：Luma CTA band（霓虹轨迹 + 循环动画是它的签名视觉） */}
      <CtaLuma />
    </div>
  );
}

function Channel({ icon, label, value, href, external, action }) {
  const inner = (
    <>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--faint)' }}>
        {icon}
        <span className="ds-meta" style={{ letterSpacing: '0.14em' }}>
          {label}
        </span>
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span
          className="ds-underline"
          style={{ fontSize: 15, color: 'var(--ink)', overflowWrap: 'anywhere' }}
        >
          {value}
        </span>
        {action || (external ? <ArrowUpRight size={15} style={{ color: 'var(--faint)' }} /> : null)}
      </span>
    </>
  );

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '8px 16px',
    padding: '16px 0',
    borderTop: '1px solid var(--line)',
  };

  if (!href) {
    return (
      <div style={rowStyle} data-r>
        {inner}
      </div>
    );
  }

  return (
    <a
      href={href}
      style={rowStyle}
      data-r
      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
    >
      {inner}
    </a>
  );
}
