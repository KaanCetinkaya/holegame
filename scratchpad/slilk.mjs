// Yeni oyuncunun ilk yarım dakikası.
//
//   node build-www.mjs && node scratchpad/slilk.mjs
//
// ## Neden var
//
// Kapalı teste yabancılar geliyor ve gelen kişi oyunu bir kez açıp
// bırakırsa hiçbir şey ölçülmemiş oluyor — üretim başvurusu "testçiler
// gerçekten oynadı mı" diye soruyor. Fruit Hole'un bu sorusu var
// (`holefirst`, "yeni oyuncunun ilk 60 saniyesi"); Slice Rush'ta yoktu,
// ve testçi alacak iki oyundan biri o.
//
// `slice` oyunu açıp bir tur oynatıyor ama **yolu** ölçmüyor: kaç
// dokunuşla oynanır hâle geliniyor, ilk ekranda oyuncuya kapalı bir şey
// gösteriliyor mu, ve ilk kesim ne kadar sonra geliyor. Bu üçü bu
// dosyanın işi.
//
// ## Ölçülen üç şey
//
//   1. **Kaç dokunuş.** Soğuk açılıştan oynar hâle. Eşik Fruit Hole'la
//      aynı: en çok iki. Bir menü düğmesi, bir de araya girebilen
//      günlük ödül.
//   2. **İlk ekranda kapalı öğe yok.** Oyuncunun ilk gördüğü ekranda
//      basılamayan bir düğme, "kilitli" yazan bir satır olmamalı:
//      karşılama ekranı oyunu tanıtır, eksiklerini saymaz.
//   3. **İlk kesim ne kadar sonra.** Parkur bilerek dört meyveyle
//      açılıyor ("tur kesmekle başlamalı, yoksa oyunun öğrettiği ilk
//      şey kaybetmek olur") — bu satırın hâlâ doğru olup olmadığı
//      ölçülüyor.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-slicer' + p); } catch {}
  if (b) {
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } else { r.writeHead(404); r.end('no'); }
}).listen(8627);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const hata = [];
pg.on('pageerror', e => hata.push(String(e).split('\n')[0]));
// Tertemiz profil: ölçülen şey **yeni** oyuncunun gördüğü.
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8627/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.sliceProbe === 'function', null, { timeout: 30000 });
await pg.waitForTimeout(600);

// --- 1. Karşılama ekranı -------------------------------------------
const karsilama = await pg.evaluate(() => {
  const ekran = document.querySelector('.screen.show');
  const gorunur = el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
  };
  const dugmeler = [...(ekran ? ekran.querySelectorAll('button, .btn, .pill') : [])]
    .filter(gorunur);
  return {
    id: ekran ? ekran.id : null,
    dugme: dugmeler.map(d => d.textContent.replace(/\s+/g, ' ').trim().slice(0, 24)),
    // Kapalı sayılan şeyler: `disabled`, kilit emojisi, "locked" yazısı.
    kapali: dugmeler.filter(d => d.disabled || /🔒|locked/i.test(d.textContent))
      .map(d => d.textContent.replace(/\s+/g, ' ').trim().slice(0, 24)),
    yazi: (ekran ? ekran.textContent : '').replace(/\s+/g, ' ').trim().slice(0, 120),
  };
});
console.log(`\n  ilk ekran: #${karsilama.id}`);
console.log(`  düğmeler : ${karsilama.dugme.join(' · ')}`);
console.log(`  yazı     : ${karsilama.yazi}`);

// --- 2. Oynar hâle gelene kadar kaç dokunuş ------------------------
// Dokunuşlar tek tek sayılıyor, çünkü ölçülen şey "açılıyor mu" değil
// **kaç adımda** açıldığı. Günlük ödül araya girerse o da bir dokunuş.
let dokunus = 0;
const bas = async (sec) => {
  if (await pg.isVisible(sec)) { await pg.click(sec); dokunus++; await pg.waitForTimeout(250); return true; }
  return false;
};
await bas('#dOk');          // günlük ödül, varsa
await bas('#playBtn');
await pg.waitForTimeout(400);
const durum = await pg.evaluate(() => window.sliceProbe().state);
console.log(`  oynar hâle: ${dokunus} dokunuş · durum ${durum}`);

// --- 3. İlk kesim ne kadar sonra -----------------------------------
// Yirmi tahta kuruluyor ve ölçülen şey beklenenden daha ilginç çıktı:
// **yirmisi de aynı sayıyı veriyor.** Parkur rastgele ama açılışı değil
// — `buildCourse` her tahtayı dört meyveyle açıyor ve bıçak hep şeridin
// ortasından başlıyor, yani ilk kesime kadar geçen süre tasarımla
// sabit. Üç koşuda da 0.78 saniye, yirmi tahtanın yirmisinde.
//
// O yüzden burada iki ayrı kapı var: biri oyuncuya verilen söz (ilk
// kesim hemen geliyor), öteki o sözün **nasıl** tutulduğu (açılış
// sabit). İkincisi olmadan, açılış bir gün rastgeleleşirse ortalama
// yine iyi görünür ve kötü tahtaya düşen oyuncu kimsenin ölçmediği
// yerde kaybolur.
const ilkKesim = await pg.evaluate(() => {
  const out = [];
  for (let k = 0; k < 20; k++) {
    window.sliceStart(1);
    let adim = 0;
    while (adim < 1200) {
      window.sliceStep(1 / 60);
      adim++;
      const p = window.sliceProbe();
      if (p.cut >= 1) break;
      if (p.state !== 'playing') { adim = -1; break; }
    }
    out.push(adim);
  }
  return out;
});
const saniye = ilkKesim.map(a => a < 0 ? Infinity : a / 60);
const enKotu = Math.max(...saniye);
const ort = saniye.filter(Number.isFinite).reduce((a, b) => a + b, 0) / saniye.length;
console.log(`  ilk kesim : ortalama ${ort.toFixed(2)} sn · en kötü ${enKotu.toFixed(2)} sn ` +
  `(20 tahta)`);

const fails = [];
const check = (ok, ne, ek = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ne}${ek ? '   ' + ek : ''}`);
  if (!ok) fails.push(`${ne} ${ek}`);
};
console.log('');

check(karsilama.id === 'menu', 'ilk ekran menü', `#${karsilama.id}`);
check(karsilama.kapali.length === 0, 'ilk ekranda kapalı öğe yok',
  karsilama.kapali.join(', '));
// Eşik Fruit Hole'dan: orada da "oynamak için en çok iki dokunuş".
// İki ayrı oyunda aynı sayıyı tutmak bir tercih değil, aynı kitleden
// geliyor olmaları — TikTok'tan gelen insan üçüncü dokunuşta yok.
check(dokunus <= 2, 'oynamak için en çok iki dokunuş', `${dokunus} dokunuş`);
check(durum === 'playing', 'tur başladı', durum);
// Eşik seçilmedi, ölçüldü: üç koşuda da yirmi tahtanın yirmisi 0.78
// saniye. İki saniye bunun iki katının üstünde, ve "açılış dört
// meyveyle başlar" kuralı bozulursa — ilk nesne bir demire ya da
// mayına dönerse — hemen altına düşüyor.
check(enKotu <= 2, 'ilk kesim iki saniyenin içinde', `en kötü ${enKotu.toFixed(2)} sn`);
// Açılışın sabit olduğu ayrı bir iddia ve ayrı kapı. Ortalama iyi
// görünürken yirmide biri kötü olabilir; bu satır onu yakalıyor.
const ayniMi = new Set(saniye.map(v => v.toFixed(2))).size === 1;
check(ayniMi, 'açılış her tahtada aynı — ilk kesim tasarımla sabit',
  `${new Set(saniye.map(v => v.toFixed(2))).size} ayrı değer: ` +
  [...new Set(saniye.map(v => v.toFixed(2)))].slice(0, 5).join(', '));
check(hata.length === 0, 'sayfa hatası yok', hata[0] || '');

console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
process.exitCode = fails.length ? 1 : 0;
await br.close(); srv.close();
