/**
 * /skills 能力页：四个模块的错落网格 + 技能标签分批淡入。
 * hover 只做颜色与边框变化，不做上浮放大（按参考规范）。
 */
import {
  revealChildren,
  useGsapScope,
} from '../motion/scroll.tsx';
import { achievements, capabilities, resume } from '../data.js';

export default function Skills() {
  const scopeRef = useGsapScope<HTMLDivElement>((scope) => {
    revealChildren(scope);
  }, []);

  return (
    <div className="ds-page" ref={scopeRef}>
      <header className="ds-wrap" style={{ paddingTop: 'calc(var(--nav-height) + 56px)' }}>
        <p className="ds-eyebrow">Capabilities</p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 24,
          }}
        >
          <h1 className="ds-display" style={{ fontSize: 'clamp(2.4rem, 6vw, 5rem)' }}>
            能力
          </h1>
          <p className="ds-meta" style={{ paddingBottom: 8 }}>
            四个方向 · 都有对应的项目
          </p>
        </div>
        <p className="ds-lede" style={{ marginTop: 20 }}>
          不罗列名词，每个模块下面都写着证据：做过的项目、跑过的测试、踩过的坑。
        </p>
      </header>

      {/* ============ 四模块错落网格 ============ */}
      <section className="ds-section" data-reveal-group>
        <div className="ds-wrap">
          <div className="skills-grid">
            {capabilities.map((cap, i) => (
              <article
                key={cap.title}
                data-r
                className="ds-card skills-card"
                style={{
                  padding: 'clamp(22px, 3vw, 32px)',
                  transition: 'border-color 0.35s var(--ease)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--line-strong)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--line)';
                }}
              >
                <span className="ds-index">0{i + 1}</span>
                <h2 className="ds-h3" style={{ marginTop: 12, fontSize: '1.35rem' }}>
                  {cap.title}
                </h2>
                <p className="ds-body" style={{ marginTop: 10, fontSize: 14 }}>
                  {cap.text}
                </p>
                <ul
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    margin: '20px 0 0',
                    padding: 0,
                    listStyle: 'none',
                  }}
                >
                  {cap.tags.map((tag) => (
                    <li
                      key={tag}
                      style={{
                        fontSize: 12,
                        letterSpacing: '0.02em',
                        color: 'var(--muted)',
                        border: '1px solid var(--line)',
                        borderRadius: 999,
                        padding: '5px 12px',
                      }}
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 技能栈明细 ============ */}
      <section className="ds-section" style={{ paddingTop: 0 }} data-reveal-group>
        <div className="ds-wrap">
          <p className="ds-eyebrow" data-r>
            Stack
          </p>
          <dl style={{ margin: 0, borderTop: '1px solid var(--line)' }}>
            {resume.skillGroups.map(([group, detail]) => (
              <div
                key={group}
                data-r
                className="skills-detail-row"
                style={{
                  padding: '18px 0',
                  borderBottom: '1px solid var(--line)',
                }}
              >
                <dt style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{group}</dt>
                <dd style={{ margin: 0, fontSize: 13.5, lineHeight: 1.85, color: 'var(--muted)' }}>
                  {detail}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ============ 成绩 ============ */}
      <section className="ds-section" style={{ paddingTop: 0 }} data-reveal-group>
        <div className="ds-wrap">
          <p className="ds-eyebrow" data-r>
            Signals
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            {achievements.map((a) => (
              <div
                key={a.title}
                data-r
                style={{
                  borderTop: '1px solid var(--line-strong)',
                  paddingTop: 14,
                }}
              >
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                  {a.title}
                </p>
                <p className="ds-meta" style={{ margin: '6px 0 0' }}>
                  {a.meta}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
