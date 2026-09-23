"""把 media-src 下的 PNG 转成 WebP，输出到 public/media。

用法：
    python scripts/optimize-images.py

背景：截图为 1x/2x 原始分辨率 PNG，单张接近 1MB，首屏大图下载要 1 秒左右，
在弱网下会长时间白屏（用户看到的就是"图片坏了"）。转 WebP 后体积通常降到 1/5。

⚠️ PNG 源图放在项目根的 media-src/，**不要放回 public/**。
   放在 public/ 里时 Vite 会把它们原样拷进 dist：22 张近 13MB 全是死重
   （运行时引用的清一色是 .webp），每次部署白传一遍。2026-09-22 才挪出来的。

脚本只写 .webp，不删除源 PNG；转换结果核对无误后由 data.js / main.jsx 引用 .webp。
"""
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("需要 Pillow：pip install Pillow")

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "media-src"
DEST = ROOT / "public" / "media"

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
    targets = sorted(SRC.rglob("*.png"))
    if not targets:
        sys.exit(f"没有找到 PNG（源图目录：{SRC}）")

    before = after = 0
    rows = []

    for src in targets:
        rel = src.relative_to(SRC).as_posix()
        out_dir = (DEST / rel).parent
        out_dir.mkdir(parents=True, exist_ok=True)
        widths = HERO_WIDTHS.get(src.name)

        if widths:
            for w in widths:
                dest = out_dir / f"{src.stem}-{w}.webp"
                b, a = convert(src, dest, w)
                rows.append((f"{rel} -> {dest.name}", b, a))
                after += a
            before += src.stat().st_size
        else:
            dest = out_dir / f"{src.stem}.webp"
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
