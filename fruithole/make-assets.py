#!/usr/bin/env python3
"""Fruit Hole'un ikon, splash ve mağaza görsellerini üretir.

Hepsi kodla çizilir (kaynak görsel yok), böylece renkler oyunun kendi
paletiyle aynı kalır ve boyutlar tek komutla yeniden üretilebilir.

    python3 fruithole/make-assets.py

Çıktılar:
    fruithole/assets/icon-only.png        1024x1024  (mağaza ikonu)
    fruithole/assets/icon-foreground.png  1024x1024  (adaptive ön plan, saydam)
    fruithole/assets/icon-background.png  1024x1024  (adaptive arka plan)
    fruithole/assets/splash.png           2732x2732
    fruithole/assets/splash-dark.png      2732x2732
    fruithole/store/feature-1024x500.png  (Play Console feature grafiği)
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / 'assets'
STORE = ROOT / 'store'

# oyunun paleti
SAND       = (232, 192, 125)
SAND_DARK  = (196, 146, 78)
SAND_NIGHT = (74, 55, 32)
RIM        = (245, 147, 33)
RIM_DARK   = (199, 108, 18)
VOID       = (10, 6, 3)

FRUITS = {
    'berry':  ((91, 45, 142),   (138, 92, 201),  (60, 26, 99)),
    'lychee': ((243, 230, 216), (255, 255, 255), (216, 185, 160)),
    'banana': ((246, 214, 72),  (255, 242, 160), (224, 169, 42)),
    'melon':  ((240, 161, 60),  (255, 201, 120), (201, 113, 31)),
}


def lerp(a, b, t):
    t = max(0.0, min(1.0, t))
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def sphere(d, cx, cy, r, base, light, dark):
    """Kenarı koyu, sol üstü parlak bir küre; kabuklar içe doğru küçülür."""
    steps = max(12, int(r))
    for i in range(steps):
        t = i / steps                      # 0 kenar, 1 merkez
        rr = r * (1 - t)
        ox = cx - r * 0.26 * t
        oy = cy - r * 0.28 * t
        col = lerp(dark, base, t * 1.9) if t < 0.55 else lerp(base, light, (t - 0.55) / 0.45)
        d.ellipse([ox - rr, oy - rr, ox + rr, oy + rr], fill=col)


def hole(d, cx, cy, r):
    """Turuncu bilezikli, ortası karanlık çukur."""
    d.ellipse([cx - r * 1.20, cy - r * 1.20, cx + r * 1.20, cy + r * 1.20], fill=RIM_DARK)
    d.ellipse([cx - r * 1.13, cy - r * 1.16, cx + r * 1.13, cy + r * 1.10], fill=RIM)
    steps = 26
    for i in range(steps):
        t = i / steps
        rr = r * (1 - t * 0.98)
        col = lerp((92, 53, 23), VOID, t * 2.2)
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=col)


def sand_bg(size, night=False):
    top = SAND_NIGHT if night else SAND
    bot = lerp(top, (0, 0, 0), 0.22) if night else SAND_DARK
    img = Image.new('RGB', (size, size), top)
    d = ImageDraw.Draw(img)
    for y in range(size):
        d.line([(0, y), (size, y)], fill=lerp(top, bot, y / size))
    return img


def scene(d, cx, cy, scale):
    """Çukur ve etrafını saran meyveler. scale = 1 -> 1024'lük kare."""
    ring = 260 * scale
    fr = 96 * scale
    order = ['berry', 'lychee', 'banana', 'melon', 'berry', 'lychee', 'banana', 'melon']
    # önce arkadakiler (üst yarı), sonra çukur, sonra öndekiler -> derinlik
    import math
    back, front = [], []
    for i, key in enumerate(order):
        a = -math.pi / 2 + i * (2 * math.pi / len(order)) + 0.28
        x = cx + math.cos(a) * ring
        y = cy + math.sin(a) * ring * 0.94
        (back if math.sin(a) < 0 else front).append((x, y, key))
    for x, y, key in back:
        sphere(d, x, y, fr, *FRUITS[key])
    hole(d, cx, cy, 168 * scale)
    for x, y, key in front:
        sphere(d, x, y, fr, *FRUITS[key])


def make_icon():
    size = 1024
    img = sand_bg(size)
    scene(ImageDraw.Draw(img), size / 2, size / 2, 1.0)
    ASSETS.mkdir(parents=True, exist_ok=True)
    img.save(ASSETS / 'icon-only.png')

    # adaptive arka plan: düz kum
    Image.new('RGB', (size, size), SAND).save(ASSETS / 'icon-background.png')

    # adaptive ön plan: saydam zemin, içerik güvenli alanda (~%62) kalsın
    fg = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    scene(ImageDraw.Draw(fg), size / 2, size / 2, 0.62)
    fg.save(ASSETS / 'icon-foreground.png')


def make_splash():
    size = 2732
    for night, name in ((False, 'splash.png'), (True, 'splash-dark.png')):
        img = sand_bg(size, night)
        scene(ImageDraw.Draw(img), size / 2, size / 2, 1.5)
        img.save(ASSETS / name)


FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'


def load_font(size):
    try:
        from PIL import ImageFont
        return ImageFont.truetype(FONT_BOLD, size)
    except Exception:
        return None


def outlined_text(d, xy, text, font, fill, outline, width):
    """Kum zeminde okunsun diye yazıyı koyu bir konturla çizer."""
    x, y = xy
    for dx in range(-width, width + 1):
        for dy in range(-width, width + 1):
            if dx or dy:
                d.text((x + dx, y + dy), text, font=font, fill=outline)
    d.text((x, y), text, font=font, fill=fill)


def make_feature():
    w, h = 1024, 500
    img = Image.new('RGB', (w, h), SAND)
    d = ImageDraw.Draw(img)
    for y in range(h):
        d.line([(0, y), (w, y)], fill=lerp(SAND, SAND_DARK, y / h))

    # sağda çukur sahnesi, solda oyunun adı
    scene(d, w * 0.76, h * 0.5, 0.60)

    import math
    keys = list(FRUITS)
    for i in range(6):
        a = i * 1.1
        sphere(d, 62 + i * 26, 430 + math.sin(a) * 16, 30, *FRUITS[keys[i % 4]])

    title = load_font(92)
    sub = load_font(34)
    if title:
        outlined_text(d, (58, 132), 'FRUIT', title, (255, 255, 255), (120, 68, 16), 4)
        outlined_text(d, (58, 232), 'HOLE', title, (255, 216, 92), (120, 68, 16), 4)
    if sub:
        outlined_text(d, (62, 344), 'Yut, büyü, tarlayı temizle', sub, (255, 255, 255), (120, 68, 16), 3)

    STORE.mkdir(parents=True, exist_ok=True)
    img.save(STORE / 'feature-1024x500.png')


if __name__ == '__main__':
    make_icon()
    make_splash()
    make_feature()
    for p in sorted(list(ASSETS.glob('*.png')) + list(STORE.glob('*.png'))):
        print(f'{p.relative_to(ROOT.parent)}  {Image.open(p).size}')
