"""把新抓的线上截图转成与现有封面同规格的 WebP。

为什么不直接跑 optimize-images.py：raw 截图带浏览器窗口留白，
比例也不统一，直接转出来会在作品网格里显得突兀。

规格对齐 public/media/project-*.webp：1400x933（3:2）。

⚠️ 两条踩过的坑，别改回去：

1. **截图直接按 1400x933 抓**（shoot-site.mjs 的宽高参数），
   这样只需等比缩放。已抓好的源图不要再按占比二次裁切。

2. **补比例时必须锚左上、不能居中**。Check-in 那张来自仓库 docs，
   2560x2600 方形、底部大片空白，裁掉空白后是 2.96 的超宽条。
   居中裁到 3:2 会把标题和卡片各切掉一半 —— 页面类截图的主体
   在上方居中偏左，居中一刀正好砍在内容上。改成从顶部取。
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "media-src"
DEST = ROOT / "public" / "media"

# 现有封面多数是 1400x960（3:2）。这个尺寸在作品网格里排三列不浪费空间。
TARGET_W, TARGET_H = 1400, 933

# (源图, 输出名, 有效内容区占比 x0,y0,x1,y1)
# 第四项为 None 表示源图已是目标比例，只缩放不裁。
# 页面类截图请按内容实际边界给：标题要留全，主体卡片不能被切半。
JOBS = [
    ("project-opspilot-raw.png", "project-opspilot.webp", None),
    ("project-research-raw.png", "project-research.webp", None),
    # docs/app-board-desktop.png：标题在 y≈30，柱状图收在 y≈880，之下全空白
    ("project-checkin-raw.png", "project-checkin.webp", (0.0, 0.008, 1.0, 0.345)),
]


def fit(im: Image.Image, target_ratio: float) -> tuple[Image.Image, bool]:
    """把 im 调整到目标比例。宽度不够就按宽度缩，高度不够就按高度缩。"""
    w, h = im.size
    ratio = w / h
    if abs(ratio - target_ratio) <= 0.02:
        return im, False
    if ratio > target_ratio:
        # 太宽：按高度定，新宽度居中放在左侧（内容主体在左上）
        new_w = round(h * target_ratio)
        return im.crop((0, 0, new_w, h)), True
    # 太高：按宽度定，取顶部一段
    new_h = round(w / target_ratio)
    return im.crop((0, 0, w, new_h)), True


def main() -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    for src_name, dest_name, box in JOBS:
        src = SRC / src_name
        if not src.exists():
            print(f"跳过：{src_name} 不存在")
            continue
        with Image.open(src) as im:
            im = im.convert("RGB")
            if box:
                w, h = im.size
                x0, y0, x1, y1 = box
                im = im.crop((int(w * x0), int(h * y0), int(w * x1), int(h * y1)))
            im, cropped = fit(im, TARGET_W / TARGET_H)
            if cropped:
                print(f"   {src_name} 已裁到目标比例 {im.width}x{im.height}")
            im = im.resize((TARGET_W, TARGET_H), Image.LANCZOS)
            dest = DEST / dest_name
            im.save(dest, "WEBP", quality=82, method=6)
            print(f"{dest_name}  {im.width}x{im.height}  {dest.stat().st_size // 1024}KB")


if __name__ == "__main__":
    main()