"""把 README 用的界面图压成 WebP。

为什么不全用 PNG：7 张 2x 截图存成 PNG 有 4.5MB，GitHub 仓库不该背这个。
WebP 视觉无损、体积约为 PNG 的 1/8，README 里看不出差别。

只用其中 4 张。README 是给人读的，图片太多反而没人往下看：
首屏深色、首屏浅色、作品网格、项目详情——够说明长什么样了。
其余留在 screenshots/（已 gitignore），需要时重抓。
"""
from pathlib import Path

from PIL import Image

SRC = Path("docs/images")
KEEP = ["home-dark", "home-light", "work-grid", "project-opspilot"]
# 2x 截图宽 2880，README 里的显示宽度最多 900px 左右，1600 足够
TARGET_W = 1600

for name in KEEP:
    src = SRC / f"{name}.png"
    if not src.exists():
        print(f"跳过 {name}：源图不存在")
        continue

    im = Image.open(src).convert("RGB")
    if im.width > TARGET_W:
        h = round(im.height * TARGET_W / im.width)
        im = im.resize((TARGET_W, h), Image.LANCZOS)

    out = SRC / f"{name}.webp"
    im.save(out, "WEBP", quality=88, method=6)
    src.unlink()  # PNG 用完就删，仓库里只留 WebP
    print(f"{name}.webp  {im.width}x{im.height}  {out.stat().st_size // 1024}KB")

# 没进 KEEP 的直接删掉，避免 README 之外的图混进仓库
for leftover in SRC.glob("*.png"):
    leftover.unlink()
    print(f"删除 {leftover.name}（README 用不上）")

total = sum(f.stat().st_size for f in SRC.glob("*.webp"))
print(f"--- 合计 {total // 1024}KB")
