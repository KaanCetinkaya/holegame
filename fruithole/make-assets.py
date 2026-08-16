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

# oyunun paleti (index.html ile aynı)
SAND       = (247, 207, 149)
ICON_TOP   = (38, 208, 206)
ICON_BOT   = (16, 140, 170)
SAND_DARK  = (230, 176, 110)
SAND_NIGHT = (74, 55, 32)
RIM        = (255, 162, 34)
RIM_DARK   = (214, 106, 12)
VOID       = (10, 6, 3)
OUTLINE    = (74, 36, 8)

STRAW      = ((245, 35, 47), (255, 106, 92), (150, 10, 25))
STRAW_LEAF = (63, 154, 58)
SEED       = (255, 221, 107)
MELON_RIND = (94, 194, 79)
MELON_DARK = (23, 112, 41)
MELON_PITH = (242, 251, 214)
MELON_RED  = (242, 44, 67)
BANANA     = ((255, 220, 61), (255, 247, 184), (217, 149, 18))


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
        col = lerp(dark, base, t * 3.0) if t < 0.34 else lerp(base, light, (t - 0.34) / 0.66 * 0.85)
        d.ellipse([ox - rr, oy - rr, ox + rr, oy + rr], fill=col)


def outlined_circle(d, cx, cy, r, w):
    """Koyu kontur: ikon küçüldüğünde şekli ayakta tutan tek şey."""
    d.ellipse([cx - r - w, cy - r - w, cx + r + w, cy + r + w], fill=OUTLINE)


def strawberry(d, cx, cy, r):
    """Yukarıdan bakılmış çilek: kırmızı gövde, sarı çekirdek, küçük yeşil sap."""
    import math
    outlined_circle(d, cx, cy, r, r * 0.10)
    sphere(d, cx, cy, r, *STRAW)
    for i in range(24):
        a = i * 2.4
        rad = r * (0.34 + 0.52 * ((i * 7) % 5) / 5.0)
        sx, sy = cx + math.cos(a) * rad, cy + math.sin(a) * rad
        d.ellipse([sx - r * .06, sy - r * .045, sx + r * .06, sy + r * .045], fill=SEED)
    # sap: gövdenin sadece ortasını kaplayan küçük bir yıldız
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        rad = r * (0.40 if i % 2 == 0 else 0.17)
        pts.append((cx + math.cos(a) * rad, cy + math.sin(a) * rad))
    d.polygon(pts, fill=STRAW_LEAF)
    d.ellipse([cx - r * .10, cy - r * .10, cx + r * .10, cy + r * .10], fill=(46, 122, 44))


def watermelon(d, cx, cy, r):
    """Karpuz dilimi, kesit yukarı bakıyor."""
    outlined_circle(d, cx, cy, r, r * 0.09)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=MELON_DARK)
    d.ellipse([cx - r * .93, cy - r * .93, cx + r * .93, cy + r * .93], fill=MELON_RIND)
    d.ellipse([cx - r * .84, cy - r * .84, cx + r * .84, cy + r * .84], fill=MELON_PITH)
    sphere(d, cx, cy, r * 0.78, MELON_RED, (255, 122, 116), (196, 24, 45))
    import math
    for i in range(8):
        a = i * (2 * math.pi / 8) + 0.4
        dd = r * (0.3 + (i % 3) * 0.16)
        sx, sy = cx + math.cos(a) * dd, cy + math.sin(a) * dd
        d.ellipse([sx - r * .07, sy - r * .05, sx + r * .07, sy + r * .05], fill=(42, 26, 16))


def banana(d, cx, cy, r):
    """Muz dilimi."""
    outlined_circle(d, cx, cy, r, r * 0.09)
    sphere(d, cx, cy, r, *BANANA)
    d.ellipse([cx - r * .26, cy - r * .26, cx + r * .26, cy + r * .26], fill=(226, 186, 84))
    import math
    for i in range(3):
        a = -math.pi / 2 + i * (2 * math.pi / 3)
        sx, sy = cx + math.cos(a) * r * .12, cy + math.sin(a) * r * .12
        d.ellipse([sx - r * .05, sy - r * .05, sx + r * .05, sy + r * .05], fill=(140, 100, 30))


def hole(d, cx, cy, r):
    """Turuncu bilezikli, ortası karanlık çukur."""
    outlined_circle(d, cx, cy, r * 1.20, r * 0.07)
    d.ellipse([cx - r * 1.20, cy - r * 1.20, cx + r * 1.20, cy + r * 1.20], fill=RIM_DARK)
    d.ellipse([cx - r * 1.13, cy - r * 1.16, cx + r * 1.13, cy + r * 1.10], fill=RIM)
    steps = 26
    for i in range(steps):
        t = i / steps
        rr = r * (1 - t * 0.98)
        col = lerp((120, 62, 18), VOID, t * 3.4)
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
    """Çukur ve içine dökülen meyveler.

    Bir ikon simge ızgarasında 48 piksele kadar küçülüyor, o yüzden az
    sayıda ama büyük nesne çiziliyor: üç meyve ve bir çukur, hepsi koyu
    konturlu. Eski hâli sekiz küçük küreydi ve o boyutta lekeye dönüyordu.
    """
    hole(d, cx, cy + 120 * scale, 268 * scale)
    strawberry(d, cx - 296 * scale, cy - 120 * scale, 158 * scale)
    watermelon(d, cx + 254 * scale, cy - 232 * scale, 140 * scale)
    banana(d, cx + 300 * scale, cy + 96 * scale, 112 * scale)


def make_icon():
    """Mağaza ikonu.

    Simge ızgarasında rakiplerin çoğu mavi ya da yeşil; turkuaz zemin
    üstünde turuncu bilezikli çukur, o kalabalıkta ayırt edilen tek
    kontrast. Sahne kareyi dolduruyor, çünkü 48 pikselde boşluk = leke.
    """
    size = 1024
    img = Image.new('RGB', (size, size), ICON_TOP)
    d = ImageDraw.Draw(img)
    for y in range(size):
        d.line([(0, y), (size, y)], fill=lerp(ICON_TOP, ICON_BOT, y / size))
    scene(d, size / 2, size / 2, 1.0)
    ASSETS.mkdir(parents=True, exist_ok=True)
    img.save(ASSETS / 'icon-only.png')

    # adaptive arka plan: düz turkuaz (launcher maskesi kenarları kırpıyor)
    Image.new('RGB', (size, size), ICON_TOP).save(ASSETS / 'icon-background.png')

    # adaptive ön plan: saydam zemin, içerik güvenli alanda (~%62) kalsın
    fg = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    scene(ImageDraw.Draw(fg), size / 2, size / 2, 0.62)
    fg.save(ASSETS / 'icon-foreground.png')

    # Play Console mağaza ikonu tam olarak 512x512 ister; elle küçültmek
    # gerekmesin diye burada üretiyoruz.
    STORE.mkdir(parents=True, exist_ok=True)
    img.resize((512, 512), Image.LANCZOS).save(STORE / 'icon-512.png')


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
    row = [strawberry, watermelon, banana]
    for i in range(6):
        a = i * 1.1
        row[i % 3](d, 66 + i * 30, 428 + math.sin(a) * 14, 26)

    title = load_font(92)
    sub = load_font(34)
    if title:
        outlined_text(d, (58, 132), 'FRUIT', title, (255, 255, 255), (120, 68, 16), 4)
        outlined_text(d, (58, 232), 'HOLE', title, (255, 216, 92), (120, 68, 16), 4)
    if sub:
        outlined_text(d, (62, 344), 'Swallow it all, grow, clear the field', sub, (255, 255, 255), (120, 68, 16), 3)

    STORE.mkdir(parents=True, exist_ok=True)
    img.save(STORE / 'feature-1024x500.png')


if __name__ == '__main__':
    make_icon()
    make_splash()
    make_feature()
    for p in sorted(list(ASSETS.glob('*.png')) + list(STORE.glob('*.png'))):
        print(f'{p.relative_to(ROOT.parent)}  {Image.open(p).size}')


# ---------------------------------------------------------------------
# Menu backdrop
#
# The menu was flat colour bands. Every game it sits next to uses a painted
# scene, and gradients cannot fake one — so it is drawn here as a real
# image: sky, sea, surf, then the beach the hole is dug into, with palms,
# dunes and litter. Portrait 720x1560 covers phone aspect ratios when
# stretched with background-size: cover.
# ---------------------------------------------------------------------
MENU_W, MENU_H = 720, 1560

SKY_TOP  = (92, 200, 244)
SKY_BOT  = (186, 232, 250)
SEA_FAR  = (24, 150, 186)
SEA_NEAR = (46, 190, 214)
FOAM     = (226, 248, 250)
BEACH    = (255, 224, 154)
BEACH_LO = (243, 198, 118)


def band(d, y0, y1, top, bot):
    for y in range(int(y0), int(y1)):
        d.line([(0, y), (MENU_W, y)], fill=lerp(top, bot, (y - y0) / max(1, y1 - y0)))


def scallop(d, y, colour, r=26):
    """Wavy seam so two bands do not meet on a ruled line."""
    x = -r
    while x < MENU_W + r:
        d.ellipse([x - r, y - r, x + r, y + r], fill=colour)
        x += r * 1.55


def palm(d, x, y, h, flip=False):
    trunk = (150, 104, 58)
    d.polygon([(x - h * .045, y), (x + h * .045, y),
               (x + h * .022, y - h), (x - h * .022, y - h)], fill=trunk)
    leaf = (58, 158, 74)
    dark = (36, 122, 56)
    import math
    for i in range(7):
        a = math.pi + i * (math.pi / 6) + (0.2 if flip else -0.2)
        ex, ey = x + math.cos(a) * h * .5, y - h + math.sin(a) * h * .28
        d.polygon([(x, y - h), (ex, ey - h * .09), (ex + h * .04, ey + h * .05)],
                  fill=leaf if i % 2 else dark)
    d.ellipse([x - h * .05, y - h * 1.03, x + h * .05, y - h * .93], fill=(120, 84, 44))


def make_menu_bg():
    img = Image.new('RGB', (MENU_W, MENU_H), SKY_TOP)
    d = ImageDraw.Draw(img)

    horizon = int(MENU_H * 0.20)
    surf    = int(MENU_H * 0.27)
    shore   = int(MENU_H * 0.30)

    band(d, 0, horizon, SKY_TOP, SKY_BOT)
    band(d, horizon, surf, SEA_FAR, SEA_NEAR)
    band(d, surf, shore, SEA_NEAR, FOAM)
    band(d, shore, MENU_H, BEACH, BEACH_LO)

    # sun and a couple of clouds
    d.ellipse([MENU_W * .74, MENU_H * .035, MENU_W * .93, MENU_H * .125],
              fill=(255, 249, 207))
    for cx, cy, s in [(.18, .075, 1.0), (.55, .12, .7), (.82, .155, .55)]:
        x, y, w = MENU_W * cx, MENU_H * cy, 120 * s
        for ox, oy, rr in [(-w * .5, 0, w * .34), (0, -w * .16, w * .44), (w * .55, 0, w * .3)]:
            d.ellipse([x + ox - rr, y + oy - rr, x + ox + rr, y + oy + rr], fill=(255, 255, 255))

    scallop(d, shore, BEACH, 30)                      # foam edge onto the sand

    # dunes behind the play area
    for cx, cy, w, h in [(.14, .40, .40, .07), (.78, .43, .46, .08), (.46, .38, .34, .05)]:
        d.ellipse([MENU_W * (cx - w / 2), MENU_H * (cy - h / 2),
                   MENU_W * (cx + w / 2), MENU_H * (cy + h / 2)],
                  fill=lerp(BEACH, (255, 255, 255), .35))

    palm(d, MENU_W * .09, MENU_H * .40, MENU_H * .13)
    palm(d, MENU_W * .93, MENU_H * .43, MENU_H * .11, flip=True)

    # grains, so the sand is not a flat wash
    import random
    random.seed(7)
    for _ in range(2600):
        x = random.random() * MENU_W
        y = shore + random.random() * (MENU_H - shore)
        rr = 1 + random.random() * 2.2
        c = lerp(BEACH_LO, (255, 255, 255), random.random())
        d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=c)

    ASSETS.mkdir(parents=True, exist_ok=True)
    img.save(ASSETS / 'menu-bg.png')


make_menu_bg()
