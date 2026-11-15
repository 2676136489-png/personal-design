"""把各项目仓库 README 里精选的真实界面图压成作品卡用的 WebP。

来源分两类：
  - 仓库 docs/ 下的截图（用户自己在 README 里挑过的「优秀的地方」）
  - scripts/capture-portfolio-views.mjs 从线上作品集站抓的三个画面
源图留在 media-src/captured/，产物只写 public/media/gallery/*.webp。

用法：python3 scripts/make-gallery-images.py
"""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'media-src' / 'captured'
DST = ROOT / 'public' / 'media' / 'gallery'
DST.mkdir(parents=True, exist_ok=True)

MAX_W = 1400
FILES = {
    'opspilot-capabilities.png': 'opspilot-capabilities',
    'opspilot-topology.png': 'opspilot-topology',
    'opspilot-incident.png': 'opspilot-incident',
    'research-workflow.png': 'research-workflow-v2',
    'research-rag.png': 'research-rag-v2',
    'research-evaluation.png': 'research-evaluation',
    'gomoku-play.png': 'gomoku-play',
    'gomoku-analysis.png': 'gomoku-analysis',
    'gomoku-coach.png': 'gomoku-coach',
    'campus-dynamics.png': 'campus-dynamics',
    'campus-ai.png': 'campus-ai',
    'campus-admin.png': 'campus-admin',
    'wiki-engineering.png': 'wiki-engineering',
    'wiki-results.png': 'wiki-results',
    'wiki-plugins.png': 'wiki-plugins',
    'checkin-board.png': 'checkin-board-v2',
    'checkin-today.png': 'checkin-today-v2',
    'checkin-weekly.png': 'checkin-weekly',
    'station-voyages.png': 'station-voyages',
    'station-innovation.png': 'station-innovation',
    'station-source.png': 'station-source',
    'archive-jack3d.png': 'archive-jack3d',
    'archive-designworld.png': 'archive-designworld',
    'archive-space.png': 'archive-space',
    'lumora-library.png': 'lumora-library',
    'lumora-blocks.png': 'lumora-blocks',
    'lumora-wiki.png': 'lumora-wiki',
    'portfolio-works.png': 'portfolio-works-v2',
    'portfolio-detail.png': 'portfolio-detail-v2',
    'portfolio-about.png': 'portfolio-about',
}

sizes = {}
for src_name, out_name in FILES.items():
    src = SRC / src_name
    if not src.exists():
        print(f'跳过 {src_name}：源图不存在')
        continue
    im = Image.open(src).convert('RGB')
    if im.width > MAX_W:
        im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
    out = DST / f'{out_name}.webp'
    im.save(out, 'WEBP', quality=85, method=6)
    sizes[f'/media/gallery/{out_name}.webp'] = [im.width, im.height]
    print(f'{out.name:32s} {im.width}x{im.height}  {out.stat().st_size // 1024}KB')

# newline='\n' 不能省：Windows 下 write_text 默认把 \n 翻成 \r\n，
# 入库时又被 .gitattributes 转回 LF，每次重跑都会显示「整文件改动」。
(ROOT / 'src' / 'v3' / 'gallery-sizes.json').write_text(
    json.dumps(sizes, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n'
)
total = sum(f.stat().st_size for f in DST.glob('*.webp'))
print(f'--- 合计 {total // 1024}KB，尺寸表写入 src/v3/gallery-sizes.json')
