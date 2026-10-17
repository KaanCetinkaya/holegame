// Ucuz ve küçük telefonlarda Fruit Hole'un ekranları duruyor mu?
//
// Oyun 412×915'te tasarlandı ve neredeyse bütün ölçümler orada
// yapıldı. Bu oyun mağazada; gelen telefon çoğu zaman daha küçük ve
// 360 piksel genişlik hâlâ yaygın.
//
// Aranan hata sınıfı: **ekranda olan ama kullanılamayan şey**. Aynı
// ölçüm Motor Works'te kırpılmış bir seviye rozeti, Slice Rush'ta
// ekranın beş piksel altında kalmış bir düğme buldu.
//
// Ölçülen, her boyutta ve her ekranda:
//   1. Yatay taşma yok — sayfa yana kaymıyor
//   2. Her düğme görünür alanın içinde, ya da kaydırılabilir bir
//      kutunun içinde (kaydırarak getirilebiliyorsa kayıp değil)
//   3. Düğmeler parmak boyutunda (en az 44 piksel)
//
// 44 keyfi bir sayı değil: oyunun kendi CSS'i `.topKey` için "parmakla
// basılabilir en küçük ölçünün (yaklaşık 38px) altına inilmiyor"
// diyor, Apple 44, Google 48 istiyor. Dar telefonda `.topKey`
// bilerek 38'e iniyor — dört sayaç ve iki tuş başka türlü yan yana
// sığmıyor — ve o karar belgelenmiş olduğu için bu ölçüm onu
// ayrı tutuyor. Geri kalan her düğme 44.
//   4. Ekran boş değil — açılmayan bir ekranı "tamam" saymamak için
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-fruithole' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8762);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

const BOYUTLAR = [
  // 16:9 bir telefonun WebView'a kalan yüksekliği: 640 dp'den durum
  // çubuğu ve gezinme çubuğu düştükten sonrası.
  { ad: '360x568', w: 360, h: 568 },
  { ad: '360x592', w: 360, h: 592 },
  { ad: '360x640', w: 360, h: 640 },
  { ad: '393x851', w: 393, h: 851 },
  { ad: '412x915', w: 412, h: 915 },   // tasarımın yapıldığı boyut
];

const TAP = 44;

// Menüden açılan ekranlar ve onları açan düğme. Ekranı elle `.show`
// yapmak yerine gerçek düğmeye basılıyor: ekranın içeriğini kuran kod
// o düğmede, ve kurulmamış bir ekran ölçülecek hiçbir şey içermiyor.
const EKRANLAR = [
  { id: 'menu',       ac: null },
  { id: 'levels',     ac: 'levelsBtn' },
  { id: 'upgrades',   ac: 'upgBtn' },
  { id: 'goals',      ac: 'goalsBtn' },
  { id: 'shop',       ac: 'shopBtn' },
  { id: 'collection', ac: 'collBtn' },
];

const sorun = [];

for (const b of BOYUTLAR) {
  console.log(`\n=== ${b.ad} ===`);
  const ctx = await br.newContext({ viewport: { width: b.w, height: b.h } });
  const pg = await ctx.newPage();
  const hata = [];
  pg.on('pageerror', e => hata.push(String(e).split('\n')[0]));
  // İleri gitmiş oyuncu: harita uzun, dükkân dolu, bakiye beş haneli.
  // Boş bir kayıt en kısa listeleri verir, yani en rahat hâli ölçer.
  await pg.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('fruithole_level', '90');
    localStorage.setItem('fruithole_currency', JSON.stringify({ coins: 98765, gems: 432 }));
  });
  await pg.goto('http://localhost:8762/', { waitUntil: 'load', timeout: 120000 });
  await pg.waitForFunction(() => typeof window.fruitHoleWhere === 'function', { timeout: 90000 });
  await pg.waitForTimeout(1200);

  for (const e of EKRANLAR) {
    await pg.evaluate(ad => {
      // Her seferinde menüye dön: üst üste açılan ekranlar birbirinin
      // üstünde ölçülür.
      for (const s of ['levels', 'upgrades', 'goals', 'shop', 'collection', 'daily', 'tchest', 'rate', 'diag'])
        document.getElementById(s)?.classList.remove('show');
      document.getElementById('menu')?.classList.add('show');
      if (ad) document.getElementById(ad)?.click();
    }, e.ac);
    await pg.waitForTimeout(400);

    const d = await pg.evaluate(({ TAP, id }) => {
      const el = document.getElementById(id);
      const out = { acik: !!el && el.classList.contains('show'), tasma: null,
                    disari: [], kucuk: [], sayi: 0 };
      if (document.documentElement.scrollWidth > innerWidth + 1)
        out.tasma = `${document.documentElement.scrollWidth} > ${innerWidth}`;
      if (!out.acik) return out;
      const gorunur = x => x.getClientRects().length > 0 && getComputedStyle(x).visibility !== 'hidden';
      const hedefler = [...el.querySelectorAll('button, .nav, .card, .lv, .row.buy, [role="button"]')]
        .filter(gorunur);
      out.sayi = hedefler.length;
      for (const x of hedefler) {
        const r = x.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        // Kaydırılabilen bir kutunun içindeki şey ulaşılabilir:
        // kaydırarak getirilebilen bir düğme kayıp değil.
        let kaydirilir = false;
        for (let p = x.parentElement; p; p = p.parentElement) {
          const cs = getComputedStyle(p);
          if (/auto|scroll/.test(cs.overflowY) && p.scrollHeight > p.clientHeight + 1) {
            const k = p.getBoundingClientRect();
            if (k.top >= -1 && k.bottom <= innerHeight + 1) kaydirilir = true;
            break;
          }
          if (p === el) break;
        }
        const ad = x.id || (x.className + '').split(' ')[0] + ':' + (x.textContent || '').trim().slice(0, 12);
        if (!kaydirilir && (r.top < -1 || r.bottom > innerHeight + 1))
          out.disari.push(`${ad} [${Math.round(r.top)}..${Math.round(r.bottom)}]`);
        // `.topKey` dar ekranda bilerek 38; bkz. oyunun CSS'indeki not.
        const sinir = x.classList.contains('topKey') && innerWidth <= 385 ? 38 : TAP;
        if (x.tagName === 'BUTTON' && r.height < sinir)
          out.kucuk.push(`${ad} ${Math.round(r.height)}px`);
      }
      return out;
    }, { TAP, id: e.id });

    const dert = [];
    if (!d.acik) dert.push('ekran açılmadı');
    else if (!d.sayi) dert.push('ekranda dokunulacak hiçbir şey yok — ölçülemedi');
    if (d.tasma) dert.push(`yatay taşma ${d.tasma}`);
    if (d.disari.length) dert.push(`dışarıda: ${d.disari.slice(0, 4).join(', ')}`);
    if (d.kucuk.length) dert.push(`küçük: ${d.kucuk.slice(0, 4).join(', ')}`);
    console.log(`  ${e.id.padEnd(11)} ${d.sayi} hedef  ${dert.length ? dert.join(' · ') : 'tamam'}`);
    if (dert.length) sorun.push(`${b.ad} ${e.id}: ${dert.join(' · ')}`);
  }

  if (hata.length) { sorun.push(`${b.ad} sayfa hatası: ${hata[0]}`); console.log(`  HATA ${hata[0]}`); }
  await ctx.close();
}

console.log('');
ok(!sorun.length, 'her boyutta bütün ekranlar kullanılabilir',
   sorun.length ? '\n        ' + sorun.join('\n        ') : '');

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
