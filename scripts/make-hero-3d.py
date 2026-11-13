"""把生成的 3D 主视觉从白底抠成透明图，再输出 WebP。

白色背景是连续区域，用「从四边泛洪 + 只在浅色像素里传播」来判定，
这样物体内部的高光不会被误判成背景挖出洞。
半透明边缘做一次去白边校正，否则贴到 #0C0C0C 上会有一圈白毛边。

用法：python3 scripts/make-hero-3d.py <源 PNG>
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else None
if SRC is None:
    candidates = sorted((ROOT / 'media-src').glob('A_single_floating_abstract_3D__*.png'))
    if not candidates:
        raise SystemExit('找不到生成的 3D 主视觉 PNG')
    SRC = candidates[-1]

WHITE_HI = 246.0
WHITE_LO = 206.0

img = Image.open(SRC).convert('RGB')
rgb = np.asarray(img).astype(np.float32)
h, w = rgb.shape[:2]
white = rgb.min(axis=2)
chroma = rgb.max(axis=2) - white

# 白底、环内部的白色镂空、底部投影都是中性亮色，全部按「离纯白多远」给 alpha。
# 环内的洞本来就该透出深色背景，所以这里不做连通域泛洪。
ramp = np.clip((WHITE_HI - white) / (WHITE_HI - WHITE_LO), 0.0, 1.0)
alpha = ramp * 255.0
neutral_bright = (chroma < 22) & (white > 198)
alpha[neutral_bright] = 0.0

# 底部那团椭圆投影带一点暖色，chroma 判定漏掉了它。
# 物体最底部的尖端是深色，所以在最后 15% 高度里清掉所有亮像素不会伤到主体。
rows = np.arange(h, dtype=np.float32)[:, None]
bottom_band = np.broadcast_to(rows > h * 0.85, (h, w))

alpha[(white > 160) & bottom_band] = 0.0

# 去白边：观察色 = 前景色 * a + 白 * (1-a)，反解前景色
a = alpha / 255.0
corrected = rgb.copy()
for c in range(3):
    fg = (rgb[:, :, c] - (1.0 - a) * 255.0) / np.maximum(a, 0.001)
    corrected[:, :, c] = np.clip(fg, 0, 255)
corrected = np.where((alpha > 0)[..., None], corrected, rgb)

rgba = np.dstack([corrected.astype(np.uint8), alpha.astype(np.uint8)])
out = Image.fromarray(rgba, 'RGBA')

# 裁掉四周全透明的边，让物体在容器里更饱满
bbox = out.getbbox()
if bbox:
    out = out.crop(bbox)

# 投影在裁切后的图里落在最底部一截；主体最低处是深色金属，
# 所以只把这段里的亮像素清成透明，不会切掉雕塑。
arr = np.asarray(out).copy()
start = int(arr.shape[0] * 0.86)
tail = arr[start:, :, :3].astype(np.float32)
arr[start:, :, 3][tail.min(axis=2) > 130] = 0
out = Image.fromarray(arr, 'RGBA')
bbox = out.getbbox()
if bbox:
    out = out.crop(bbox)

src_out = ROOT / 'media-src' / 'hero-3d-object.png'
out.save(src_out)

webp_out = ROOT / 'public' / 'media' / 'hero-3d-object.webp'
webp_out.parent.mkdir(parents=True, exist_ok=True)
out.save(webp_out, 'WEBP', quality=88, method=6, exact=True)

# 贴到深色底上出一张检查图，肉眼确认没有白毛边
bg_dark = Image.new('RGB', out.size, (12, 12, 12))
bg_dark.paste(out, mask=out.getchannel('A'))
bg_dark.save(ROOT / 'media-src' / 'hero-3d-object-check.jpg', quality=90)

print(f'源图: {SRC.name}')
print(f'透明 PNG: {src_out.relative_to(ROOT)} {out.size}')
print(f'WebP: {webp_out.relative_to(ROOT)} {webp_out.stat().st_size // 1024} KB')
print(f'不透明像素占比: {(np.asarray(out.getchannel("A")) > 8).mean():.1%}')
