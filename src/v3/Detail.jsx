import { useState } from 'react';
import { ArrowLeft, ArrowUpRight, ExternalLink, Github } from 'lucide-react';
import {
  ALL_PROJECTS,
  PROJECT_BY_SLUG,
  categories,
  galleryFor,
  imgAttrs,
  media,
  resume,
} from './content.js';
import { FadeIn, GhostButton, GradientButton, SectionTitle } from './lib.jsx';

/* 章节里的六种块，按 data.js 的字段渲染。
 * 9 个项目共用这一套渲染器，新增项目不用再写页面。 */
function Block({ block }) {
  switch (block.type) {
    case 'text':
      return <p className="v3-block-text">{block.body}</p>;
    case 'points':
      return (
        <ul className="v3-block-points">
          {block.items.map((item) => (
            <li key={item.k}>
              <b>{item.k}</b>
              <span>{item.v}</span>
            </li>
          ))}
        </ul>
      );
    case 'table':
      return (
        <div className="v3-block-table-wrap">
          <table className="v3-block-table">
            <thead>
              <tr>{block.head.map((cell) => <th key={cell}>{cell}</th>)}</tr>
            </thead>
            <tbody>
              {block.rows.map((row, index) => (
                <tr key={index}>{row.map((cell, i) => <td key={i}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'shot':
      return (
        <figure className="v3-block-shot">
          <img src={block.src} alt={block.alt || ''} loading="lazy" {...imgAttrs(block.src)} />
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      );
    case 'code':
      return (
        <figure className="v3-block-code">
          <pre>{block.lines.join('\n')}</pre>
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      );
    case 'arch':
      return (
        <div className="v3-block-arch">
          {block.groups.map((group) => (
            <div key={group.title} className="v3-arch-group">
              <b>{group.title}</b>
              <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
}

/* ---------------- 作品详情 ---------------- */

export function ProjectDetail({ slug }) {
  const project = PROJECT_BY_SLUG[slug];
  if (!project) return null;
  const chapters = project.chapters || [];

  /* 章节里已经出现过的截图，图集里就不再重复放一遍 */
  const inChapters = new Set(
    chapters.flatMap((c) => (c.blocks || []).filter((b) => b.type === 'shot').map((b) => b.src)),
  );
  const extraShots = galleryFor(project)
    .filter((slot) => slot.kind === 'image' && slot.src !== project.image && !inChapters.has(slot.src))
    .slice(0, 3);

  return (
    <article className="v3-detail">
      <div className="v3-detail-top">
        <a className="v3-back" href="#/works"><ArrowLeft size={16} aria-hidden="true" /> 全部作品</a>
        <span className="v3-detail-cat">{project.category} · {project.period}</span>
      </div>
      <h1 className="v3-detail-title v3-gradient">{project.title}</h1>
      {project.lede && <p className="v3-detail-lede">{project.lede}</p>}
      <p className="v3-detail-desc">{project.description}</p>

      <figure className="v3-detail-cover">
        <img src={project.image} alt={project.title} {...imgAttrs(project.image)} />
      </figure>

      <div className="v3-detail-meta">
        <div><span>参与方式</span><b>{project.role || '独立开发'}</b></div>
        <div><span>技术栈</span><b>{project.stack}</b></div>
        <div><span>时间</span><b>{project.period}</b></div>
      </div>

      {project.metrics && project.metrics.length > 0 && (
        <div className="v3-detail-metrics">
          {project.metrics.map((metric) => (
            <div key={metric.label}>
              <b>{metric.value}</b>
              <span>{metric.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="v3-detail-actions">
        {project.site && (
          <GhostButton href={project.site} external>
            在线站点 <ExternalLink size={16} aria-hidden="true" />
          </GhostButton>
        )}
        {project.github && (
          <GhostButton href={project.github} external>
            GitHub <Github size={16} aria-hidden="true" />
          </GhostButton>
        )}
        <GradientButton href="#/contact">联系我</GradientButton>
      </div>

      {extraShots.length > 0 && (
        <div className={`v3-detail-gallery cols-${extraShots.length}`}>
          {extraShots.map((slot) => (
            <figure key={slot.src}>
              <img src={slot.src} alt={slot.alt || ''} loading="lazy" {...imgAttrs(slot.src)} />
            </figure>
          ))}
        </div>
      )}

      {chapters.length > 0 && (
        <nav className="v3-chapter-nav" aria-label="章节导航">
          {chapters.map((chapter) => (
            <a key={chapter.id} href={`#/${slug}#${chapter.id}`}>{chapter.nav}</a>
          ))}
        </nav>
      )}

      {chapters.map((chapter, index) => (
        <section className="v3-chapter" id={chapter.id} key={chapter.id}>
          <FadeIn className="v3-chapter-head">
            <span className="v3-chapter-kicker">{chapter.kicker || String(index + 1).padStart(2, '0')}</span>
            <h2>{chapter.title}</h2>
          </FadeIn>
          <div className="v3-chapter-blocks">
            {chapter.blocks.map((block, i) => <Block block={block} key={i} />)}
          </div>
        </section>
      ))}

      <div className="v3-detail-foot">
        <a href="#/works">返回全部作品 <ArrowUpRight size={16} aria-hidden="true" /></a>
      </div>
    </article>
  );
}

/* ---------------- 全部作品 ---------------- */

function ProjectTile({ project, index }) {
  return (
    <FadeIn delay={(index % 3) * 0.08} className="v3-tile-wrap">
      <a className="v3-tile" href={`#/${project.slug}`}>
        <div className="v3-tile-img">
          <img src={project.image} alt={project.title} loading="lazy" {...imgAttrs(project.image)} />
        </div>
        <div className="v3-tile-body">
          <span className="v3-tile-cat">{project.category} · {project.year}</span>
          <h3>{project.title}</h3>
          <p>{project.description}</p>
          <span className="v3-tile-more">查看详情 <ArrowUpRight size={15} aria-hidden="true" /></span>
        </div>
      </a>
    </FadeIn>
  );
}

export function Works({ categorySlug = null }) {
  const [active, setActive] = useState('all');
  const base = categorySlug
    ? ALL_PROJECTS.filter((p) => p.category === (categories.find((c) => c.slug === categorySlug)?.name || ''))
    : ALL_PROJECTS;
  const filtered = active === 'all' ? base : base.filter((p) => p.category === active);
  const options = categorySlug
    ? []
    : categories.filter((c) => c.projects.length > 0).map((c) => c.name);
  const title = categorySlug
    ? (categories.find((c) => c.slug === categorySlug)?.name || '作品')
    : '全部作品';

  return (
    <div className="v3-works">
      <a className="v3-back" href="#/"><ArrowLeft size={16} aria-hidden="true" /> 回首页</a>
      <SectionTitle className="v3-gradient">{title}</SectionTitle>
      <p className="v3-section-lede">
        {categorySlug
          ? (categories.find((c) => c.slug === categorySlug)?.blurb || '')
          : '九个项目，按方向筛选。'}
      </p>
      {options.length > 0 && (
        <div className="v3-filters">
          <button type="button" className={active === 'all' ? 'is-active' : ''} onClick={() => setActive('all')}>
            全部 <span>{base.length}</span>
          </button>
          {options.map((name) => (
            <button
              type="button"
              key={name}
              className={active === name ? 'is-active' : ''}
              onClick={() => setActive(name)}
            >
              {name} <span>{ALL_PROJECTS.filter((p) => p.category === name).length}</span>
            </button>
          ))}
        </div>
      )}
      <div className="v3-tile-grid">
        {filtered.map((project, index) => (
          <ProjectTile key={project.slug} project={project} index={index} />
        ))}
      </div>
      {filtered.length === 0 && <p className="v3-empty">这个方向下暂时没有收录作品。</p>}
    </div>
  );
}

/* ---------------- 完整简历 ---------------- */

export function FullResume() {
  return (
    <div className="v3-full-resume">
      <a className="v3-back" href="#/"><ArrowLeft size={16} aria-hidden="true" /> 回首页</a>
      <SectionTitle className="v3-gradient">简历</SectionTitle>

      <div className="v3-fr-actions">
        <a className="v3-btn-gradient" href={media.resume.pdf} target="_blank" rel="noreferrer">下载 PDF</a>
        <a className="v3-btn-ghost" href="#/contact">联系我</a>
      </div>

      <section className="v3-fr-section">
        <h2>个人简述</h2>
        <ul className="v3-advantages">{resume.advantages.map((line) => <li key={line}>{line}</li>)}</ul>
      </section>

      <section className="v3-fr-section">
        <h2>教育背景</h2>
        {resume.education.map((edu) => (
          <div className="v3-fr-edu" key={edu.school}>
            <div className="v3-fr-edu-main">
              <b>{edu.school}</b>
              <span>{edu.major}</span>
            </div>
            <div className="v3-fr-edu-meta">
              <span>{edu.period}</span>
              <span>{edu.gpa}</span>
            </div>
            <ul>{edu.points.map((point) => <li key={point}>{point}</li>)}</ul>
          </div>
        ))}
      </section>

      <section className="v3-fr-section">
        <h2>专业技能</h2>
        <div className="v3-fr-skills">
          {resume.skillGroups.map(([name, detail]) => (
            <div key={name}><b>{name}</b><p>{detail}</p></div>
          ))}
        </div>
      </section>

      <section className="v3-fr-section">
        <h2>荣誉与奖励</h2>
        <ul className="v3-fr-honors">
          {resume.honors.map((honor) => (
            <li key={honor.title}><b>{honor.title}</b><span>{honor.period}</span></li>
          ))}
        </ul>
      </section>

      <section className="v3-fr-section">
        <h2>项目经历</h2>
        {resume.projectSlugs.map((slug) => {
          const project = PROJECT_BY_SLUG[slug];
          if (!project) return null;
          const display = project.en ? `${project.title} ${project.en}` : project.title;
          return (
            <div className="v3-fr-project" key={slug}>
              <div className="v3-fr-project-head">
                <a href={`#/${slug}`}>{display}</a>
                <span>{resume.projectMeta[slug]}</span>
              </div>
              <ul>
                {(resume.projectHighlights[slug] || []).map((line) => <li key={line}>{line}</li>)}
              </ul>
            </div>
          );
        })}
      </section>

      <section className="v3-fr-section">
        <h2>简历预览</h2>
        <img
          className="v3-fr-preview"
          src={media.resume.preview}
          alt="卢柯宇简历"
          loading="lazy"
          {...imgAttrs(media.resume.preview)}
        />
      </section>
    </div>
  );
}
