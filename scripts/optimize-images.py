"""把 public/media 下的 PNG 转成 WebP，并输出一张映射表。

用法：
    python scripts/optimize-images.py

背景：截图为 1x/2x 原始分辨率 PNG，单张接近 1MB，首屏大图下载要 1 秒左右，
在弱网下会长时间白屏（用户看到的就是"图片坏了"）。转 WebP 后体积通常降到 1/5。

脚本只写 .webp，不删除原 PNG；转换结果核对无误后由 data.js / main.jsx 引用 .webp。
"""
import json
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("需要 Pillow：pip install Pillow")

ROOT = Path(__file__).resolve().parent.parent
MEDIA = ROOT / "public" / "media"

# 首页首屏大图给两档尺寸，其余保持原尺寸
HERO_WIDTHS = {"dashboard.png": [980, 1960]}


def convert(src: Path, dest: Path, width: int | None = None) -> tuple[int, int]:
    with Image.open(src) as im:
        im = im.convert("RGB")
        if width and im.width > width:
            ratio = width / im.width
            im = im.resize((width, round(im.height * ratio)), Image.LANCZOS)
        im.save(dest, "WEBP", quality=82, method=6)
    return src.stat().st_size, dest.stat().st_size


def main() -> None:
    targets = sorted(MEDIA.rglob("*.png"))
    if not targets:
        sys.exit("没有找到 PNG")

    before = after = 0
    rows = []

    for src in targets:
        rel = src.relative_to(MEDIA).as_posix()
        widths = HERO_WIDTHS.get(src.name)

        if widths:
            for w in widths:
                dest = src.with_name(f"{src.stem}-{w}.webp")
                b, a = convert(src, dest, w)
                rows.append((f"{rel} -> {dest.name}", b, a))
                after += a
            before += src.stat().st_size
        else:
            dest = src.with_suffix(".webp")
            b, a = convert(src, dest)
            rows.append((rel, b, a))
            before += b
            after += a

    print(f"{'文件':<52}{'原 PNG':>10}{'WebP':>10}{'压缩率':>9}")
    print("-" * 82)
    for name, b, a in rows:
        print(f"{name:<52}{b / 1024:>9.0f}K{a / 1024:>9.0f}K{100 - a / b * 100:>8.0f}%")
    print("-" * 82)
    print(
        f"{'合计':<52}{before / 1024 / 1024:>9.2f}M"
        f"{after / 1024 / 1024:>9.2f}M{100 - after / before * 100:>8.0f}%"
    )


if __name__ == "__main__":
    main()
