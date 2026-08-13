#!/usr/bin/env bash
# CDN'li kaynak HTML'leri (tarayıcıda çift tıklamayla açılan sürümler) alır ve
# Capacitor'ın paketleyeceği, kütüphanesi yerel olan www dizinlerini üretir.
#
#   index.html            -> www/index.html            (Hole:       three + rapier)
#   fruithole/index.html  -> www-fruithole/index.html  (Fruit Hole: three)
#
# Kütüphane dosyaları sabittir; Fruit Hole three.module.js'i www/'den kopyalar.
set -e
cd "$(dirname "$0")"

# ---- Hole -> www/ ----
mkdir -p www
sed -e 's#"three": "https://esm.sh/three@0.161.0"#"three": "./three.module.js"#' \
    -e "s#from 'https://esm.sh/@dimforge/rapier3d-compat@0.14.0'#from './rapier.es.js'#" \
    index.html > www/index.html
echo "www/index.html güncellendi (Hole)."

# ---- Fruit Hole -> www-fruithole/ ----
mkdir -p www-fruithole
sed -e 's#"three": "https://esm.sh/three@0.161.0"#"three": "./three.module.js"#' \
    fruithole/index.html > www-fruithole/index.html

if [ -f www/three.module.js ]; then
  cp -f www/three.module.js www-fruithole/three.module.js
else
  echo "UYARI: www/three.module.js yok, www-fruithole/ kütüphanesiz kaldı." >&2
fi
echo "www-fruithole/index.html güncellendi (Fruit Hole)."

echo
echo "Sonra:"
echo "  npx cap sync android                  # Hole"
echo "  APP=fruithole npx cap sync android    # Fruit Hole"
