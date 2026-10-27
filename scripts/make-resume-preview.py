"""从简历 PDF 生成网页用的预览图。

为什么预览图从 PDF 渲染，而不是从 HTML 截图：
预览图要跟用户下载到的文件一致。PDF 是投递用的最终版，
从它渲染出来的图和用户双击打开看到的是同一份内容。
之前那版预览是从 HTML 整页截的（1588x2508），
而 PDF 是 A4 一页（1588x2244），两者并不一致 —— 看预览的人会以为简历比实际长。

产出两张：
  resume.webp      1588 宽，灯箱里全屏看的那张
  resume-900.webp   900 宽，页面里缩略显示（srcSet 的 900w）

用 WebP 而不是 PNG：PNG 约 800KB，WebP 约 150KB，视觉上看不出差别。
"""
from pathlib import Path

import pymupdf
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC_PDF = Path(
    r"D:\C-Drive-Move\UserData\DeskBox\DeskBox\简历制作\简历\卢柯宇简历_2026.pdf"
)
OUT_DIR = ROOT / "public" / "media" / "resume"
STAGE = ROOT / "media-src" / "resume-preview.png"

FULL_W = 1588
SMALL_W = 900


def render(pdf_path: Path, png_path: Path) -> Image.Image:
    """按目标宽度渲染 PDF 首页。

    用 matrix 缩放而不是 dpi —— pymupdf 的 dpi 参数只接受整数，
    而目标宽度除出来的 dpi 是小数（这页宽 594.96pt，1588/8.27=192.06）。
    matrix 能直接指定缩放倍数，宽度正好落在 1588。
    """
    doc = pymupdf.open(pdf_path)
    if doc.page_count != 1:
        raise SystemExit(
            f"{pdf_path.name} 是 {doc.page_count} 页，站点按「共 1 页 A4」写的，"
            f"多页要先改页面上的说明文字"
        )
    page = doc[0]
    scale = FULL_W / page.rect.width
    pix = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale))
    im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    doc.close()
    png_path.parent.mkdir(parents=True, exist_ok=True)
    im.save(png_path)
    return im


def scaled(im: Image.Image, width: int) -> Image.Image:
    if im.width == width:
        return im
    h = round(im.height * width / im.width)
    return im.resize((width, h), Image.LANCZOS)


def main() -> None:
    if not SRC_PDF.exists():
        raise SystemExit(f"找不到简历 PDF：{SRC_PDF}")

    full = render(SRC_PDF, STAGE)
    print(f"渲染原图 {full.width}x{full.height}  {STAGE.name}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, width in (("resume.webp", FULL_W), ("resume-900.webp", SMALL_W)):
        im = scaled(full, width)
        out = OUT_DIR / name
        im.save(out, "WEBP", quality=86, method=6)
        print(f"{name}  {im.width}x{im.height}  {out.stat().st_size // 1024}KB")

    print("--- IMAGE_SIZES 里要登记成这两个尺寸 ---")
    print(f"  '/media/resume/resume.webp': [{FULL_W}, {scaled(full, FULL_W).height}],")
    print(f"  '/media/resume/resume-900.webp': [{SMALL_W}, {scaled(full, SMALL_W).height}],")


if __name__ == "__main__":
    main()
