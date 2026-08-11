#!/usr/bin/env bash
# Kök index.html'i (CDN'li, tarayıcıda çift tıklamayla açılan sürüm) alır ve
# Capacitor'ın paketleyeceği www/index.html'i (yerel kütüphaneli) yeniden üretir.
# Kütüphane dosyaları (www/three.module.js, www/rapier.es.js) sabit; sadece HTML yenilenir.
set -e
cd "$(dirname "$0")"
mkdir -p www

sed -e 's#"three": "https://esm.sh/three@0.161.0"#"three": "./three.module.js"#' \
    -e "s#from 'https://esm.sh/@dimforge/rapier3d-compat@0.14.0'#from './rapier.es.js'#" \
    index.html > www/index.html

echo "www/index.html güncellendi (yerel kütüphanelerle)."
echo "Sonra: npx cap sync"
