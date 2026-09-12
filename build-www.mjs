#!/usr/bin/env node
// CDN'li kaynak HTML'leri (tarayıcıda çift tıklamayla açılan sürümler) alır ve
// Capacitor'ın paketleyeceği, kütüphanesi yerel olan www dizinlerini üretir.
//
//   index.html            -> www/index.html            (Hole:       three + rapier)
//   fruithole/index.html  -> www-fruithole/index.html  (Fruit Hole: three)
//
// Node ile yazılmış, çünkü Windows'ta `bash` her zaman bulunmuyor.
//
//   node build-www.mjs        (veya: npm run build:www)

import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const r = (...p) => join(ROOT, ...p);

// Bir eşleşme bulunamazsa sessizce yanlış dosya üretmek yerine hata veriyoruz:
// kaynak HTML'deki import satırı değişmişse bunu build sırasında bilmek gerekir.
function swap(text, from, to, label) {
  if (!text.includes(from)) {
    throw new Error(`${label}: beklenen satır bulunamadı -> ${from}`);
  }
  return text.split(from).join(to);
}

// ---- Hole -> www/ ----
mkdirSync(r('www'), { recursive: true });
let hole = readFileSync(r('index.html'), 'utf8');
hole = swap(hole,
  '"three": "https://esm.sh/three@0.161.0"',
  '"three": "./three.module.js"', 'index.html');
hole = swap(hole,
  "from 'https://esm.sh/@dimforge/rapier3d-compat@0.14.0'",
  "from './rapier.es.js'", 'index.html');
writeFileSync(r('www', 'index.html'), hole);
console.log('www/index.html güncellendi (Hole).');

// ---- Fruit Hole -> www-fruithole/ ----
mkdirSync(r('www-fruithole'), { recursive: true });
let fruit = readFileSync(r('fruithole', 'index.html'), 'utf8');
fruit = swap(fruit,
  '"three": "https://esm.sh/three@0.161.0"',
  '"three": "./three.module.js"', 'fruithole/index.html');

// Reklamlar: test mi, gerçek mi.
//
// Kendi canlı reklamına tıklamak AdMob hesabını kapattırıyor, bu yüzden
// kaynak dosyada ADS_TESTING her zaman true kalıyor — tarayıcıda açtığında
// da, sıradan bir derlemede de test reklamı geliyor. Gerçek reklamlar
// yalnızca LIVE_ADS=1 ile açılıyor, yani `npm run release:fruithole` ile.
//
// Bu eskiden elle çevrilen bir sabitti ve iki yönde de tuzaktı: açık
// unutulursa üretim sürümü hiç gelir getirmiyor, kapalı unutulursa kendi
// reklamına tıklayıp hesabı yakıyorsun. İkisini de "hatırlamak" tutuyordu.
// Artık hangi komutu çalıştırdığın belirliyor ve derleme çıktısı hangisini
// ürettiğini her seferinde yazıyor — unutulacak bir şey kalmıyor.
// Sürüm yazısı: menünün köşesinde hangi derlemenin telefonda olduğunu
// gösteriyor. Kaynakta 'dev' yazıyor, gerçek numara buradan, tek doğru
// kaynaktan — app-version.json'dan — giriyor. İki yere elle yazılsaydı
// er geç ayrışırdı ve "güncelleme indi mi" sorusunu yanlış yanıtlardı;
// tam da o soruyu çözmek için konulmuş bir yazı için en kötü hata bu.
const V = JSON.parse(readFileSync(r('app-version.json'), 'utf8')).fruithole;
fruit = swap(fruit, "const APP_VERSION = 'dev';",
  `const APP_VERSION = '${V.versionName} (${V.versionCode})';`,
  'fruithole/index.html (APP_VERSION)');

const LIVE_ADS = process.env.LIVE_ADS === '1';
if (LIVE_ADS) {
  fruit = swap(fruit, 'const ADS_TESTING = true;', 'const ADS_TESTING = false;',
    'fruithole/index.html (LIVE_ADS)');
}
writeFileSync(r('www-fruithole', 'index.html'), fruit);

// menu-bg.png deliberately does NOT travel with the build any more.
//
// It was the painted menu backdrop, added in a2741de and replaced in
// 1052e99 by the live 3D diorama the menu shows now. The image stopped
// being referenced by anything at that point, but this line kept copying
// it, so every bundle since has carried 96KB that nothing loads. The
// source file stays in fruithole/assets/ in case the painted look is ever
// wanted again; it just is not shipped.

if (existsSync(r('www', 'three.module.js'))) {
  copyFileSync(r('www', 'three.module.js'), r('www-fruithole', 'three.module.js'));
} else {
  console.warn('UYARI: www/three.module.js yok, www-fruithole/ kütüphanesiz kaldı.');
}
console.log(LIVE_ADS
  ? 'www-fruithole/index.html güncellendi (Fruit Hole) — REKLAMLAR GERÇEK. Bu derlemeyi kendi telefonunda oynama, kendi reklamına tıklamak hesabı kapattırır.'
  : 'www-fruithole/index.html güncellendi (Fruit Hole) — reklamlar test.');

// ---- Slice Rush -> www-slicer/ ----
mkdirSync(r('www-slicer'), { recursive: true });
let slicer = readFileSync(r('slicer', 'index.html'), 'utf8');
slicer = swap(slicer,
  '"three": "https://esm.sh/three@0.161.0"',
  '"three": "./three.module.js"', 'slicer/index.html');
writeFileSync(r('www-slicer', 'index.html'), slicer);

if (existsSync(r('www', 'three.module.js'))) {
  copyFileSync(r('www', 'three.module.js'), r('www-slicer', 'three.module.js'));
} else {
  console.warn('UYARI: www/three.module.js yok, www-slicer/ kütüphanesiz kaldı.');
}
console.log('www-slicer/index.html güncellendi (Slice Rush).');

// ---- Motor Works -> www-tycoon/ ----
mkdirSync(r('www-tycoon'), { recursive: true });
let tycoon = readFileSync(r('tycoon', 'index.html'), 'utf8');
tycoon = swap(tycoon,
  '"three": "https://esm.sh/three@0.161.0"',
  '"three": "./three.module.js"', 'tycoon/index.html');
writeFileSync(r('www-tycoon', 'index.html'), tycoon);

if (existsSync(r('www', 'three.module.js'))) {
  copyFileSync(r('www', 'three.module.js'), r('www-tycoon', 'three.module.js'));
} else {
  console.warn('UYARI: www/three.module.js yok, www-tycoon/ kütüphanesiz kaldı.');
}
console.log('www-tycoon/index.html güncellendi (Motor Works).');

console.log('\nSonra:');
console.log('  npm run sync:hole        # Hole');
console.log('  npm run sync:fruithole   # Fruit Hole');
console.log('  npm run sync:slicer      # Slice Rush');
console.log('  npm run sync:tycoon      # Motor Works');
