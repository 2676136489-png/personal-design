/* 新版竞赛与活动页。数据来自 src/data.js，证书图点击后新开原图。 */
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { awards, imgAttrs } from './content.js';
import { FadeIn } from './lib.jsx';

function Section({ kicker, title, children }) {
  return (
    <section className="v3-awards-section">
      <FadeIn as="div" className="v3-awards-section-head">
        <span className="v3-awards-kicker">{kicker}</span>
        <h2>{title}</h2>
      </FadeIn>
      {children}
    </section>
  );
}

export default function AwardsPage() {
  const { igem, competitions, honors, activities } = awards;

  return (
    <div className="v3-awards">
      <a className="v3-back" href="#/">
        <ArrowLeft size={16} aria-hidden="true" /> 返回首页
      </a>
      <h1 className="v3-awards-title v3-gradient">竞赛与活动</h1>
      <p className="v3-section-lede">把大学期间的比赛、获奖和团队活动放在一页。</p>

      <Section kicker="International" title="国际赛事">
        <FadeIn className="v3-awards-feature">
          <div className="v3-awards-copy">
            <div className="v3-awards-tags">
              <span>{igem.year}</span>
              <span className="v3-awards-tag--warm">金牌</span>
            </div>
            <h3>{igem.title}</h3>
            <p className="v3-awards-highlight">{igem.team} · {igem.project}</p>
            <p className="v3-awards-muted">{igem.role}</p>
            <p className="v3-awards-summary">{igem.summary}</p>
            <div className="v3-awards-links">
              {igem.links.map((link) => (
                <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                  <ArrowUpRight size={15} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
          <figure className="v3-awards-figure">
            <a href={igem.image} target="_blank" rel="noreferrer">
              <img src={igem.image} alt={igem.imageCaption} loading="lazy" {...imgAttrs(igem.image)} />
            </a>
            <figcaption>{igem.imageCaption}</figcaption>
          </figure>
        </FadeIn>
      </Section>

      <Section kicker="Competition" title="学科竞赛">
        {competitions.map((item) => (
          <FadeIn className="v3-awards-cert" key={item.title}>
            <figure className="v3-awards-figure">
              <a href={item.image} target="_blank" rel="noreferrer">
                <img src={item.image} alt={item.caption} loading="lazy" {...imgAttrs(item.image)} />
              </a>
              <figcaption>{item.caption}</figcaption>
            </figure>
            <div className="v3-awards-copy">
              <p className="v3-awards-muted">{item.period}</p>
              <h3>{item.title}</h3>
              <p className="v3-awards-award">{item.award}</p>
              <p className="v3-awards-summary">{item.detail}</p>
            </div>
          </FadeIn>
        ))}
      </Section>

      <Section kicker="Honors" title="校内荣誉">
        <div className="v3-awards-honor-grid">
          {honors.map((item, index) => (
            <FadeIn delay={(index % 3) * 0.06} key={item.image} className="v3-awards-honor">
              <a href={item.image} target="_blank" rel="noreferrer">
                <img src={item.image} alt={item.caption} loading="lazy" {...imgAttrs(item.image)} />
              </a>
              <div>
                <h3>{item.title}</h3>
                <p>{item.period}</p>
                <p>{item.detail}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      <Section kicker="Activities" title="团队活动">
        <ul className="v3-awards-activities">
          {activities.map((item) => (
            <FadeIn as="li" key={item.title}>
              <span>{item.year}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </FadeIn>
          ))}
        </ul>
        <p className="v3-awards-note">
          活动记录来自
          <a href={igem.links[1].href} target="_blank" rel="noreferrer">吉大一院报道</a>
          ，证书原件已收录在个人材料里。
        </p>
      </Section>
    </div>
  );
}
