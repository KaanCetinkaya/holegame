#!/usr/bin/env node
// Üretilmiş .apk'yı yerel ağa açar — telefona kablo bağlamadan kurmak için.
//
//   npm run send:slicer
//
// Telefon ve bilgisayar aynı Wi-Fi'da olmalı. Komut ekrana bir adres
// yazıyor (http://192.168.x.x:8787); telefonun tarayıcısına o adresi yazıp
// düğmeye basınca .apk iniyor. Ctrl+C ile kapanıyor.
//
// Neden dosya sunucusu değil de tek dosya: tarayıcı .apk'yı ancak doğru
// MIME türüyle "indirilecek dosya" sayıyor. application/octet-stream ile
// bazı Android tarayıcıları dosyayı .zip diye kaydedip kurulumu kırıyor.
//
// Chrome "Dosya güvenli bir şekilde indirilemiyor" diyor ve iki düğme
// veriyor: Kapat, Sakla. Dosyayla ilgisi yok — Chrome https olmayan bir
// adresten inen çalıştırılabilir dosyaların hepsine bunu diyor ve "Sakla"
// indiriyor. Sayfadaki yönergenin ilk maddesi bu, çünkü uyarı dosyanın
// bozuk olduğunu sanmaya yetecek kadar ciddi görünüyor.

import { createServer } from 'http';
import { createReadStream, existsSync, statSync } from 'fs';
import { networkInterfaces } from 'os';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const APPS = {
  hole: { dir: 'android', label: 'Hole' },
  fruithole: { dir: 'android-fruithole', label: 'Fruit Hole' },
  slicer: { dir: 'android-slicer', label: 'Slice Rush' },
  tycoon: { dir: 'android-tycoon', label: 'Motor Works' },
};

const appName = process.env.APP || process.argv[2] || 'hole';
const app = APPS[appName];
if (!app) {
  console.error(`Bilinmeyen APP="${appName}". Geçerli: ${Object.keys(APPS).join(', ')}`);
  process.exit(1);
}

// İkisinden hangisi varsa o sunuluyor, yenisi kazanıyor.
//
// `dev` sürümü telefonda Play'den kurulu uygulamanın yanına kuruluyor
// (`.dev` paket eki), `release` ise mağazaya giden imzayla. Kaan çoğunlukla
// dev'i kuracak; release'i elle kurmak ancak mağazadaki sürüm telefonda
// yokken mümkün.
const adaylar = [
  join(ROOT, app.dir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
  join(ROOT, app.dir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
].filter(existsSync);
if (!adaylar.length) {
  console.error(
    `\n.apk bulunamadı. Önce üret:\n` +
    `  npm run dev:${appName}   (telefondakinin yanına kurulur)\n` +
    `  npm run apk:${appName}   (mağaza imzasıyla)\n`);
  process.exit(1);
}
adaylar.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
const apk = adaylar[0];
const devMi = apk.includes('debug');
console.log(devMi ? 'dev sürümü sunuluyor (yan yana kurulur)'
                  : 'mağaza imzalı sürüm sunuluyor');

const size = statSync(apk).size;
const mb = (size / 1048576).toFixed(1);
const fileName = `${appName}.apk`;
const port = Number(process.env.PORT) || 8787;

// Yerel ağdaki IPv4 adresleri. Birden fazla çıkabiliyor (Wi-Fi, ethernet,
// sanal makine adaptörleri); hangisinin doğru olduğunu bilemeyiz, hepsini
// yazıp telefonda çalışanı denemesini istiyoruz.
const addresses = Object.values(networkInterfaces())
  .flat()
  .filter(n => n && n.family === 'IPv4' && !n.internal)
  .map(n => n.address);

const page = `<!doctype html>
<html lang="tr"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${app.label}</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
       background:#12141a;color:#eef1f7;font:16px/1.5 system-ui,sans-serif;text-align:center}
  .card{padding:32px 24px;max-width:340px}
  h1{margin:0 0 4px;font-size:26px}
  p{margin:0 0 24px;color:#98a0b3;font-size:14px}
  a{display:block;padding:16px;border-radius:14px;background:#4b7bec;color:#fff;
    text-decoration:none;font-weight:600;font-size:17px}
  ol{margin:24px 0 0;padding-left:20px;text-align:left;color:#98a0b3;font-size:13px}
  li{margin:8px 0}
  b{color:#eef1f7}
  code{background:#222633;padding:1px 5px;border-radius:5px;font-size:12px}
</style></head><body><div class="card">
<h1>${app.label}</h1>
<p>${mb} MB &middot; Android</p>
<a href="/${fileName}">APK'yı indir</a>
<ol>
  <li><b>&quot;Dosya güvenli bir şekilde indirilemiyor&quot;</b> derse
      <b>Sakla</b>&#39;ya bas. Dosyada sorun yok — Chrome, adres
      <code>https</code> olmadığı için her .apk&#39;ya bunu diyor.</li>
  <li>İndirme bitince bildirime dokun.</li>
  <li>&quot;Bilinmeyen kaynak&quot; uyarısı çıkarsa tarayıcıya izin ver.</li>
  <li>Kur.</li>
</ol>
</div></body></html>`;

const server = createServer((req, res) => {
  const path = (req.url || '/').split('?')[0];

  if (path === `/${fileName}`) {
    res.writeHead(200, {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Length': size,
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    createReadStream(apk).pipe(res);
    console.log(`  indiriliyor -> ${req.socket.remoteAddress}`);
    return;
  }

  if (path === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(page);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('yok');
});

server.listen(port, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(60));
  console.log(`${app.label} — ${mb} MB`);
  console.log('='.repeat(60));
  console.log('\nTelefonun tarayıcısına bu adresi yaz:\n');
  if (addresses.length) {
    for (const a of addresses) console.log(`    http://${a}:${port}`);
    if (addresses.length > 1) console.log('\n  (birden fazla adres var, çalışanı bulana kadar dene)');
  } else {
    console.log('    Ağ adresi bulunamadı — Wi-Fi bağlı mı?');
  }
  console.log('\nTelefon ve bilgisayar aynı Wi-Fi\'da olmalı.');
  console.log('Windows ilk seferde güvenlik duvarı izni sorabilir: "İzin ver" de.');
  console.log('\nBitince Ctrl+C ile kapat.\n');
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n${port} portu dolu. Başka bir port dene:\n` +
      `  cross-env PORT=8788 npm run send:${appName}\n`);
  } else {
    console.error('\n' + err.message);
  }
  process.exit(1);
});
