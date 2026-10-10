#!/usr/bin/env python3
"""Fruit Hole'u tek, kendine yeten bir HTML sayfasına paketler.

Artifact sayfaları dış sunuculara istek atamadığı için Three.js CDN'den
çekilemez; kaynağı sayfanın içine gömüyoruz. Three'nin son satırındaki
`export { ... }` bir modül içinde satır içi kullanılamaz, onu bir THREE
nesnesine çeviriyoruz. Oyun kodu ayrıca bir blok içine alınıyor: böylece
kendi `const`'ları Three'nin üst seviye adlarını çakışmadan gölgeleyebilir.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
game_html = (ROOT / 'fruithole' / 'index.html').read_text()
three_src = (ROOT / 'www' / 'three.module.js').read_text()

# --- Three: son export satırını at -------------------------------------
lines = three_src.rstrip('\n').split('\n')
if not lines[-1].startswith('export {'):
    sys.exit('BEKLENMEYEN: three.module.js son satırı export değil')
three_body = '\n'.join(lines[:-1])

# --- Oyunun kullandığı THREE sembolleri ---------------------------------
used = sorted(set(re.findall(r'THREE\.([A-Za-z_][A-Za-z0-9_]*)', game_html)))
exported = set(re.findall(r'[A-Za-z_][A-Za-z0-9_]*', lines[-1][len('export {'):]))
missing = [u for u in used if u not in exported]
if missing:
    sys.exit(f'BEKLENMEYEN: three export etmiyor: {missing}')
print('gömülen THREE sembolleri:', ', '.join(used))

# --- Oyunun parçalarını çıkar ------------------------------------------
style = re.search(r'<style>(.*?)</style>', game_html, re.S).group(1)
body = re.search(r'<body>(.*?)<script type="importmap">', game_html, re.S).group(1)
script = re.search(r'<script type="module">(.*?)</script>', game_html, re.S).group(1)
script = script.replace("import * as THREE from 'three';", '', 1)

# Sayfa gövdesine gömülüyoruz, sarmalayıcının <head>'ini göremiyoruz.
# Tarayıcı kodlama araması belgenin ilk 1024 baytına baktığı için buradaki
# meta yine de geçerli; olmazsa Türkçe metin ve emoji bozuk çıkıyor.
out = f"""<meta charset="utf-8" />
<title>Fruit Hole</title>
<style>
{style}
</style>
{body}
<script type="module">
// ---- Three.js r161 (MIT), sayfaya gömülü ----
{three_body}
const THREE = {{ {', '.join(used)} }};

// ---- Fruit Hole ----
{{
{script}
}}
</script>
"""

dest = Path(sys.argv[1])
dest.write_text(out)
print(f'yazıldı: {dest}  ({len(out)/1024/1024:.2f} MB)')
