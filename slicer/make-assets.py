#!/usr/bin/env python3
"""Slice Rush'ın ikon ve açılış görsellerini üretir.

    python3 slicer/make-assets.py

Çıktı:
    slicer/assets/icon-only.png        1024x1024  (mağaza ikonu)
    slicer/assets/icon-foreground.png  1024x1024  (adaptive ön plan, saydam)
    slicer/assets/icon-background.png  1024x1024  (adaptive arka plan)
    slicer/assets/splash.png           2732x2732
    slicer/assets/splash-dark.png      2732x2732

Sonra:  npm run assets:slicer
"""

import math
from pathlib import Path
from PIL import Image, ImageDraw

ASSETS = Path(__file__).resolve().parent / 'assets'
ASSETS.mkdir(exist_ok=True)

SS = 4                      # supersampling

INK      = (27, 18, 48)
INK_2    = (58, 38, 96)
STEEL    = (238, 243, 248)
STEEL_D  = (168, 182, 200)
EDGE     = (143, 228, 255)
GRIP     = (139, 63, 42)
GRIP_D   = (96, 42, 27)
MELON    = (63, 143, 58)
FLESH    = (239, 76, 94)


def blade(d, cx, cy, L, ang):
    """Bıçak: sapı solda, ucu sağda, verilen açıda.

    İkonun tamamı bu. Küçük boyutta okunan tek şey bıçağın silueti, o yüzden
    gövde kalın ve keskin kenar ayrı bir parlak şeritle çiziliyor — düz gri
    bir kama 48 pikselde çubuk gibi görünüyor.
    """
    ca, sa = math.cos(ang), math.sin(ang)
    def P(x, y):
        return (cx + x * ca - y * sa, cy + x * sa + y * ca)

    h = L * 0.21
    # Koyu kontur. Bıçak açık gri, karpuzun kesik yüzü açık kırmızı: ikisi
    # yan yana gelince kenar kayboluyordu ve 24 pikselde bıçak diye bir şey
    # kalmıyordu. Konturu gövdeden biraz taşırıp altına çiziyoruz.
    o = h * 0.34
    d.polygon([P(-L * 0.36 - o, -h - o), P(L * 0.55 + o, -h * 0.12 - o * 0.4),
               P(L * 0.55 + o, h * 0.12 + o * 0.4), P(-L * 0.36 - o, h + o)],
              fill=(18, 12, 32))
    # gövde: arkası yüksek, önü sivri
    d.polygon([P(-L * 0.34, -h), P(L * 0.52, -h * 0.12),
               P(L * 0.52, h * 0.12), P(-L * 0.34, h)], fill=STEEL)
    # sırt gölgesi, gövde tek renk kalmasın
    d.polygon([P(-L * 0.34, -h), P(L * 0.52, -h * 0.12),
               P(L * 0.52, -h * 0.02), P(-L * 0.34, -h * 0.42)], fill=STEEL_D)
    # keskin kenar
    d.polygon([P(-L * 0.32, h * 0.62), P(L * 0.5, h * 0.05),
               P(L * 0.5, h * 0.12), P(-L * 0.32, h)], fill=EDGE)
    # bilezik + sap
    d.polygon([P(-L * 0.38, -h * 0.92), P(-L * 0.32, -h * 0.92),
               P(-L * 0.32, h * 0.92), P(-L * 0.38, h * 0.92)], fill=(216, 182, 74))
    d.polygon([P(-L * 0.78, -h * 0.86), P(-L * 0.36, -h * 0.98),
               P(-L * 0.36, h * 0.98), P(-L * 0.78, h * 0.86)], fill=(18, 12, 32))
    d.polygon([P(-L * 0.74, -h * 0.68), P(-L * 0.38, -h * 0.82),
               P(-L * 0.38, h * 0.82), P(-L * 0.74, h * 0.68)], fill=GRIP)
    d.polygon([P(-L * 0.74, h * 0.12), P(-L * 0.38, h * 0.12),
               P(-L * 0.38, h * 0.82), P(-L * 0.74, h * 0.68)], fill=GRIP_D)


def melon_halves(d, cx, cy, r, gap):
    """İkiye ayrılmış karpuz: iki yarım daire, aralarında görünür bir boşluk.

    İlk denemede boşluk yarıçapın dörtte biriydi ve dikişi kapatmak için
    çizilen dolgular aradaki boşluğu da kapatıyordu — sonuç tek parça
    kırmızı bir daireydi, yani kesilmiş bir şey değil, bir top. Boşluk
    yarıçap kadar açıldı ve dolgular kaldırıldı; ikiye ayrılmış olduğunu
    24 pikselde anlatan tek şey o aradaki karanlık."""
    for s in (-1, 1):
        oy = cy + s * gap
        start, end = (180, 360) if s < 0 else (0, 180)
        d.pieslice([cx - r, oy - r, cx + r, oy + r], start, end, fill=MELON)
        # kesik yüz, kabuğun içinde
        d.pieslice([cx - r * 0.82, oy - r * 0.82, cx + r * 0.82, oy + r * 0.82],
                   start, end, fill=FLESH)
        # birkaç çekirdek, sadece büyük boyutta görünür ama zarar vermez
        for k in (-1, 0, 1):
            sx = cx + k * r * 0.36
            sy = oy + s * r * 0.34 + (r * 0.1 if k == 0 else 0)
            d.ellipse([sx - r * 0.055, sy - r * 0.08, sx + r * 0.055, sy + r * 0.08],
                      fill=(42, 26, 16))


def draw_mark(size, with_plate=True):
    S = size * SS
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if with_plate:
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=INK)
        d.rounded_rectangle([int(S * 0.04), int(S * 0.04), int(S * 0.96), int(S * 0.60)],
                            radius=int(S * 0.19), fill=INK_2)

    # Kesilmiş karpuz sağda, iki yarısı ayrılmış; bıçak aradan geçiyor.
    melon_halves(d, S * 0.63, S * 0.5, S * 0.225, S * 0.105)

    # Kesme izi: bıçağın arkasında kalan parlak şerit. Boşluğun içinden
    # geçtiği için hareketi de anlatıyor.
    d.polygon([(S * 0.02, S * 0.60), (S * 0.98, S * 0.40),
               (S * 0.98, S * 0.47), (S * 0.02, S * 0.67)],
              fill=(143, 228, 255, 90))

    blade(d, S * 0.44, S * 0.52, S * 0.86, math.radians(-12))
    return img.resize((size, size), Image.LANCZOS)


def make_icons():
    icon = draw_mark(1024)
    Image.alpha_composite(Image.new('RGBA', (1024, 1024), INK + (255,)), icon) \
        .convert('RGB').save(ASSETS / 'icon-only.png')

    # Adaptive ön plan: Android kenarlardan %25'e kadar kırpabiliyor, o yüzden
    # işaret küçültülüp ortalanıyor — tam boyda bıçağın ucu kesiliyor.
    fg = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    mark = draw_mark(660, with_plate=False)
    fg.paste(mark, (182, 182), mark)
    fg.save(ASSETS / 'icon-foreground.png')

    bg = Image.new('RGB', (1024, 1024), INK)
    ImageDraw.Draw(bg).rectangle([0, 0, 1024, 600], fill=INK_2)
    bg.save(ASSETS / 'icon-background.png')


def make_splash(name, top, bottom):
    S = 2732
    img = Image.new('RGB', (S, S), top)
    d = ImageDraw.Draw(img)
    for y in range(S):
        t = y / S
        d.line([(0, y), (S, y)],
               fill=tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    mark = draw_mark(900, with_plate=False)
    img.paste(mark, ((S - 900) // 2, (S - 900) // 2), mark)
    img.save(ASSETS / name)


if __name__ == '__main__':
    make_icons()
    make_splash('splash.png', INK_2, INK)
    make_splash('splash-dark.png', (20, 13, 36), (9, 6, 16))
    print('slicer/assets/ güncellendi.')
