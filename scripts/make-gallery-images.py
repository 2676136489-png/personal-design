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
    'opspilot-dashboard.png': 'opspilot-dashboard',
    'opspilot-incident.png': 'opspilot-incident',
    'opspilot-agents.png': 'opspilot-agents',
    'research-workflow.jpg': 'research-workflow',
    'research-rag.jpg': 'research-rag',
    'research-reports.jpg': 'research-reports',
    'gomoku-explain.png': 'gomoku-board',
    'gomoku-gallery.png': 'gomoku-gallery',
    'gomoku-hub.png': 'gomoku-hub',
    'checkin-board.png': 'checkin-board',
    'checkin-today.png': 'checkin-today',
    'checkin-single.png': 'checkin-single',
    'portfolio-works.png': 'portfolio-works',
    'portfolio-hero.png': 'portfolio-hero',
    'portfolio-detail.png': 'portfolio-detail',
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
