(() => {
  const sec = document.querySelector('#resume-advantages');
  const de = document.documentElement;
  const over = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.right > de.clientWidth + 1) {
      over.push({
        sel: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).trim().split(/\s+/).join('.') : ''),
        left: Math.round(r.left), right: Math.round(r.right),
      });
    }
  }
  const im = document.querySelector('.resume-paper img');
  const r = im ? im.getBoundingClientRect() : null;
  return {
    sections: [...document.querySelectorAll('section[id]')].map((s) => s.id),
    优势章节存在: !!sec,
    优势条数: sec ? sec.querySelectorAll('li').length : 0,
    项目分点数: [...document.querySelectorAll('.resume-points--tight')].map((u) => u.children.length),
    横向滚动: de.scrollWidth > de.clientWidth,
    溢出: over.slice(0, 8),
    预览图: r ? { w: Math.round(r.width), h: Math.round(r.height), 比例: +(r.width / r.height).toFixed(3) } : null,
    链接数: document.querySelectorAll('.resume-links a').length,
  };
})()
