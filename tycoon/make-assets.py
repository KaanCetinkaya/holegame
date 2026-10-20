#!/usr/bin/env python3
"""Motor Works'ün ikon ve açılış görsellerini üretir.

    python3 tycoon/make-assets.py

Çıktı:
    tycoon/assets/icon-only.png        1024x1024  (mağaza ikonu)
    tycoon/assets/icon-foreground.png  1024x1024  (adaptive ön plan, saydam)
    tycoon/assets/icon-background.png  1024x1024  (adaptive arka plan)
    tycoon/assets/splash.png           2732x2732
    tycoon/assets/splash-dark.png      2732x2732

Sonra:  npm run assets:tycoon

Neden dosya değil kod: ikon oyunun kendisiyle aynı yerden gelmeli. Renkler
değişince ikonu elle yeniden çizmeyi hatırlamak yerine bu script'i yeniden
çalıştırıyoruz.
"""

import math
from pathlib import Path
from PIL import Image, ImageDraw

ASSETS = Path(__file__).resolve().parent / 'assets'
ASSETS.mkdir(exist_ok=True)

SS = 4                      # supersampling; kenarlar 1024'te pürüzsüz olsun

STEEL_DK = (26, 29, 36)
STEEL    = (54, 61, 73)
ORANGE   = (255, 138, 26)
ORANGE_D = (214, 96, 12)
CREAM    = (255, 241, 214)


def gear_points(cx, cy, r_out, r_in, teeth, phase=0.0):
    """Dişli çarkın dış hattı. Her diş, dışta ve içte birer düz kenar."""
    pts = []
    step = math.pi / teeth          # yarım diş
    for i in range(teeth * 2):
        a0 = phase + i * step
        a1 = a0 + step
        r = r_out if i % 2 == 0 else r_in
        # dişin kenarlarını hafif eğ, döküm parçası gibi dursun
        pts.append((cx + math.cos(a0 + step * 0.10) * r,
                    cy + math.sin(a0 + step * 0.10) * r))
        pts.append((cx + math.cos(a1 - step * 0.10) * r,
                    cy + math.sin(a1 - step * 0.10) * r))
    return pts


def car_silhouette(d, cx, cy, w, colour):
    """Yandan bir araba. Dişlinin göbeğinde, ikonu jenerik dişliden ayırsın."""
    h = w * 0.46
    x0, y0 = cx - w / 2, cy - h / 2
    body = [
        (x0 + w * 0.02, y0 + h * 0.62),
        (x0 + w * 0.10, y0 + h * 0.40),
        (x0 + w * 0.30, y0 + h * 0.38),
        (x0 + w * 0.40, y0 + h * 0.10),
        (x0 + w * 0.66, y0 + h * 0.10),
        (x0 + w * 0.74, y0 + h * 0.38),
        (x0 + w * 0.96, y0 + h * 0.44),
        (x0 + w * 0.99, y0 + h * 0.66),
        (x0 + w * 0.02, y0 + h * 0.66),
    ]
    d.polygon(body, fill=colour)
    for fx in (0.26, 0.74):
        rw = w * 0.15
        d.ellipse([x0 + w * fx - rw / 2, y0 + h * 0.50,
                   x0 + w * fx + rw / 2, y0 + h * 0.50 + rw], fill=colour)


def draw_mark(size, with_plate=True):
    """İkonun tamamı: çelik plaka + turuncu dişli + göbekte araba."""
    S = size * SS
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if with_plate:
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=STEEL_DK)
        # plakadaki hafif ışık, düz renk kalmasın
        d.rounded_rectangle([int(S * 0.04), int(S * 0.04), int(S * 0.96), int(S * 0.62)],
                            radius=int(S * 0.19), fill=STEEL)
        # köşe perçinleri
        for fx, fy in ((0.13, 0.13), (0.87, 0.13), (0.13, 0.87), (0.87, 0.87)):
            r = S * 0.022
            d.ellipse([fx * S - r, fy * S - r, fx * S + r, fy * S + r], fill=(88, 96, 110))

    cx = cy = S / 2
    R = S * 0.36

    # dişlinin gölgesi, plakadan ayrılsın
    d.polygon(gear_points(cx, cy + S * 0.018, R, R * 0.80, 9), fill=(0, 0, 0, 90))
    d.polygon(gear_points(cx, cy, R, R * 0.80, 9), fill=ORANGE_D)
    d.polygon(gear_points(cx, cy - S * 0.012, R * 0.985, R * 0.79, 9), fill=ORANGE)

    # göbek
    hub = R * 0.60
    d.ellipse([cx - hub, cy - hub, cx + hub, cy + hub], fill=STEEL_DK)
    hub2 = R * 0.55
    d.ellipse([cx - hub2, cy - hub2, cx + hub2, cy + hub2], fill=(38, 43, 52))

    car_silhouette(d, cx, cy, R * 0.92, CREAM)

    return img.resize((size, size), Image.LANCZOS)


def make_icons():
    icon = draw_mark(1024)
    Image.alpha_composite(Image.new('RGBA', (1024, 1024), STEEL_DK + (255,)), icon) \
        .convert('RGB').save(ASSETS / 'icon-only.png')

    # Adaptive ikon: Android ön planın kenarlarından %25'e kadarını kırpabilir,
    # bu yüzden işaret daha küçük çiziliyor. Tam boy verilirse telefonlarda
    # dişlinin dişleri kesiliyor.
    fg = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    mark = draw_mark(660, with_plate=False)
    fg.paste(mark, (182, 182), mark)
    fg.save(ASSETS / 'icon-foreground.png')

    bg = Image.new('RGB', (1024, 1024), STEEL_DK)
    bd = ImageDraw.Draw(bg)
    bd.rectangle([0, 0, 1024, 620], fill=STEEL)
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
    make_splash('splash.png', STEEL, STEEL_DK)
    make_splash('splash-dark.png', (18, 20, 25), (8, 9, 12))
    print('tycoon/assets/ güncellendi.')
