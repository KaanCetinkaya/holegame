#!/usr/bin/env node
// AdMob'un App ID'sini native projenin AndroidManifest.xml'ine yazar.
//
// Bu satır olmadan uygulama açılır açılmaz çöker; ama manifest `cap add`
// ile üretildiği için native proje her yeniden oluşturulduğunda kaybolur.
// Elle eklemeyi hatırlamak yerine sync'in parçası yapıyoruz — idempotent,
// zaten varsa dokunmuyor.
//
//   node patch-manifest.mjs            (APP değişkenine göre hedefi seçer)

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = dirname(fileURLToPath(import.meta.url));

const APPS = {
  hole: {
    dir: 'android',
    appId: 'ca-app-pub-2542927456156553~3347511713',   // Hole'un AdMob App ID'si
  },
  fruithole: {
    dir: 'android-fruithole',
    appId: 'ca-app-pub-2542927456156553~4653695871',
  },
  // Yeni oyunların kendi AdMob uygulamaları henüz açılmadı. Google'ın
  // herkese açık test App ID'si kullanılıyor: gerçek reklam göstermiyor
  // ama manifest'te bir kimlik olmadan uygulama açılışta çöküyor.
  // AdMob'da uygulama açınca buradaki değeri değiştirmek yeterli.
  slicer: {
    dir: 'android-slicer',
    appId: 'ca-app-pub-3940256099942544~3347511713',
  },
  tycoon: {
    dir: 'android-tycoon',
    appId: 'ca-app-pub-3940256099942544~3347511713',
  },
};

const app = APPS[process.env.APP || 'hole'];
if (!app) {
  console.error(`Bilinmeyen APP="${process.env.APP}"`);
  process.exit(1);
}

const manifest = join(ROOT, app.dir, 'app', 'src', 'main', 'AndroidManifest.xml');
if (!existsSync(manifest)) {
  console.log(`${app.dir} henüz yok, manifest atlandı.`);
  process.exit(0);
}

let xml = readFileSync(manifest, 'utf8');

if (xml.includes('com.google.android.gms.ads.APPLICATION_ID')) {
  // Kimlik değişmişse güncelle, aynıysa hiç dokunma.
  const current = xml.match(/APPLICATION_ID"\s*\n?\s*android:value="([^"]+)"/);
  if (current && current[1] === app.appId) {
    console.log('AdMob App ID zaten yerinde.');
    process.exit(0);
  }
  xml = xml.replace(/android:value="ca-app-pub-[^"]*"/, `android:value="${app.appId}"`);
  writeFileSync(manifest, xml);
  console.log('AdMob App ID güncellendi.');
  process.exit(0);
}

const block =
  `\n        <meta-data\n` +
  `            android:name="com.google.android.gms.ads.APPLICATION_ID"\n` +
  `            android:value="${app.appId}" />\n`;

if (!xml.includes('</application>')) {
  console.error('HATA: manifest içinde </application> yok, beklenmeyen biçim.');
  process.exit(1);
}

xml = xml.replace('</application>', `${block}    </application>`);
writeFileSync(manifest, xml);
console.log(`AdMob App ID eklendi -> ${app.dir}`);
