"""把 v3 的界面截图压成 README 用的 WebP。

源图来自 scripts/verify-v3.mjs 的 CDP 截图（screenshots/v3-*.png）。
改过界面就重跑：先 node scripts/verify-v3.mjs，再跑本脚本。
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'screenshots'
DST = ROOT / 'docs' / 'images'
DST.mkdir(parents=True, exist_ok=True)

KEEP = ['v3-hero', 'v3-about', 'v3-capabilities', 'v3-projects', 'v3-detail', 'v3-marquee-hover', 'v3-card-02']
TARGET_W = 1600

for name in KEEP:
    src = SRC / f'{name}.png'
    if not src.exists():
        print(f'跳过 {name}：截图不存在')
        continue
    im = Image.open(src).convert('RGB')
    if im.width > TARGET_W:
        im = im.resize((TARGET_W, round(im.height * TARGET_W / im.width)), Image.LANCZOS)
    out = DST / f'{name}.webp'
    im.save(out, 'WEBP', quality=88, method=6)
    print(f'{out.name}  {im.width}x{im.height}  {out.stat().st_size // 1024}KB')

total = sum(f.stat().st_size for f in DST.glob('v3-*.webp'))
print(f'--- v3 配图合计 {total // 1024}KB')
