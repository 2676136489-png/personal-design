/**
 * /awards 竞赛与活动：国际赛事、学科竞赛、校内荣誉与团队活动。
 * 证书图片放在 public/media/awards，点击后用现有灯箱看原图。
 */
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { ImageLightbox } from '../lightbox.jsx';
import { revealChildren, useGsapScope } from '../motion/scroll.tsx';
import { awards, imgAttrs } from '../data.js';

export default function Awards() {
  const scopeRef = useGsapScope<HTMLDivElement>((scope) => {
    revealChildren(scope);
  }, []);
  const [active, setActive] = useState(null);

  const open = (image, caption) => setActive({ image, caption });

  return (
    <div className="ds-page" ref={scopeRef}>
      <header className="ds-wrap" style={{ paddingTop: 'calc(var(--nav-height) + 56px)' }}>
        <p className="ds-eyebrow" data-r>
          Awards & Activities
        </p>
        <h1 className="ds-display" data-r style={{ fontSize: 'clamp(2.4rem, 6vw, 5rem)' }}>
          竞赛与活动
        </h1>
        <p className="ds-lede" data-r style={{ marginTop: 20 }}>
          把大学期间的比赛、获奖和团队活动放在一页。
        </p>
      </header>

      {/* ============ iGEM 金牌 ============ */}
      <section className="ds-section" data-reveal-group>
        <div className="ds-wrap">
          <p className="ds-eyebrow" data-r>
            国际赛事
          </p>
          <div className="awards-feature" data-r>
            <div>
              <div className="awards-tag-row">
                <span className="awards-tag">{awards.igem.year}</span>
                <span className="awards-tag awards-tag--warm">金牌</span>
              </div>
              <h2 className="ds-h3" style={{ fontSize: 'clamp(1.7rem, 3.4vw, 2.6rem)' }}>
                {awards.igem.title}
              </h2>
              <p className="ds-body" style={{ marginTop: 18 }}>
                {awards.igem.team} · {awards.igem.project}
              </p>
              <p className="awards-role" style={{ marginTop: 8 }}>
                {awards.igem.role}
              </p>
              <p className="ds-lede" style={{ marginTop: 24, fontSize: 15 }}>
                {awards.igem.summary}
              </p>
              <div className="awards-links" style={{ marginTop: 28 }}>
                {awards.igem.links.map((link) => (
                  <a
                    key={link.href}
                    className="ds-btn"
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {link.label}
                    <ArrowUpRight size={15} />
                  </a>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="awards-figure-btn"
              onClick={() => open(awards.igem.image, awards.igem.imageCaption)}
            >
              <img
                src={awards.igem.image}
                alt={awards.igem.imageCaption}
                loading="lazy"
                {...imgAttrs(awards.igem.image)}
              />
              <span className="awards-figure-caption">{awards.igem.imageCaption}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ============ 学科竞赛 ============ */}
      <section className="ds-section" style={{ paddingTop: 0 }} data-reveal-group>
        <div className="ds-wrap">
          <p className="ds-eyebrow" data-r>
            学科竞赛
          </p>
          {awards.competitions.map((item) => (
            <div className="awards-cert" key={item.title} data-r>
              <button
                type="button"
                className="awards-figure-btn awards-figure-btn--paper"
                onClick={() => open(item.image, item.caption)}
              >
                <img
                  src={item.image}
                  alt={item.caption}
                  loading="lazy"
                  {...imgAttrs(item.image)}
                />
                <span className="awards-figure-caption">点击查看证书原图</span>
              </button>
              <div>
                <p className="ds-meta">{item.period}</p>
                <h2 className="ds-h3" style={{ marginTop: 12 }}>
                  {item.title}
                </h2>
                <p className="awards-award" style={{ marginTop: 16 }}>
                  {item.award}
                </p>
                <p className="ds-body" style={{ marginTop: 18 }}>
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ 校内荣誉 ============ */}
      <section className="ds-section" style={{ paddingTop: 0 }} data-reveal-group>
        <div className="ds-wrap">
          <p className="ds-eyebrow" data-r>
            校内荣誉
          </p>
          <div className="awards-honor-grid">
            {awards.honors.map((item) => (
              <button
                key={item.image}
                type="button"
                className="awards-honor-card"
                data-r
                onClick={() => open(item.image, item.caption)}
              >
                <img
                  src={item.image}
                  alt={item.caption}
                  loading="lazy"
                  {...imgAttrs(item.image)}
                />
                <span className="awards-honor-body">
                  <span className="awards-honor-title">{item.title}</span>
                  <span className="awards-honor-meta">{item.period}</span>
                  <span className="awards-honor-meta">{item.detail}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 团队活动 ============ */}
      <section className="ds-section" style={{ paddingTop: 0 }} data-reveal-group>
        <div className="ds-wrap">
          <p className="ds-eyebrow" data-r>
            团队活动
          </p>
          <ul className="awards-activity-list">
            {awards.activities.map((item) => (
              <li key={item.title} data-r>
                <span className="awards-activity-year">{item.year}</span>
                <div>
                  <h3 className="ds-h3" style={{ fontSize: 18 }}>
                    {item.title}
                  </h3>
                  <p className="ds-body" style={{ marginTop: 8, fontSize: 14 }}>
                    {item.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <p className="ds-meta" style={{ marginTop: 28 }}>
            活动记录来自
            <a
              href={awards.igem.links[1].href}
              target="_blank"
              rel="noreferrer"
              className="awards-inline-link"
            >
              吉大一院报道
            </a>
            ，证书原件已收录在个人材料里。
          </p>
        </div>
      </section>

      {active ? (
        <ImageLightbox
          src={active.image}
          alt={active.caption}
          caption={active.caption}
          onClose={() => setActive(null)}
        />
      ) : null}
    </div>
  );
}
