from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / '图片'
JOBS = [
    ('2597fc4604cd162bb81806f2dbff1100.jpg', 'public/media/avatar-memoji-v2.webp', 720),
    ('2ba9f335d64cbf188efa976b4c2bddc9.jpg', 'public/media/avatar-moods/wink.webp', 480),
    ('bfce8d3c534a9c0b24b5532851aba1bf.jpg', 'public/media/avatar-moods/idea.webp', 480),
    ('cb47b45b20583c7a97f537961b31d557.jpg', 'public/media/avatar-moods/thumbs-up.webp', 480),
    ('f7040903441752e4dbf432f9c4beaf66.jpg', 'public/media/avatar-moods/macbook.webp', 480),
]


def cut(src: Path, dst: Path, size: int) -> Image.Image:
    im = Image.open(src).convert('RGBA')
    w, h = im.size
    rgb = im.convert('RGB')
    marker = (255, 0, 255)
    for xy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        ImageDraw.floodfill(rgb, xy, marker, thresh=60)

    a = np.array(rgb)
    bg = (a[:, :, 0] == 255) & (a[:, :, 1] == 0) & (a[:, :, 2] == 255)
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    alpha = np.array(
        Image.fromarray(alpha).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(0.9))
    ).astype(np.float32) / 255

    rgba = np.array(im).astype(np.float32)
    a3 = alpha[:, :, None]
    rgb_f = np.where(a3 > 0.01, (rgba[:, :, :3] - (1 - a3) * 255) / np.maximum(a3, 0.01), rgba[:, :, :3])
    rgba[:, :, :3] = np.clip(rgb_f, 0, 255)
    rgba[:, :, 3] = alpha * 255

    out = Image.fromarray(rgba.astype(np.uint8), 'RGBA').resize((size, size), Image.LANCZOS)
    dst.parent.mkdir(parents=True, exist_ok=True)
    out.save(dst, 'WEBP', quality=90, method=6)
    print(f'{dst.name:18s} {out.width}x{out.height}  {dst.stat().st_size // 1024}KB')
    return out


outs = [cut(SRC / name, ROOT / rel, size) for name, rel, size in JOBS]

sheet = Image.new('RGB', (360 * len(outs), 400), (12, 12, 12))
draw = ImageDraw.Draw(sheet)
for i, im in enumerate(outs):
    thumb = im.copy()
    thumb.thumbnail((340, 340))
    sheet.paste(thumb, (i * 360 + (340 - thumb.width) // 2, 20), thumb)
    draw.text((i * 360 + 10, 372), JOBS[i][1].split('/')[-1], fill=(200, 200, 200))
sheet.save(ROOT / 'media-src/memoji-set-preview.jpg')
print('预览 media-src/memoji-set-preview.jpg')
