// İlk oturum: oyuncu ilk on dakikada nereye varıyor?
//
// Mobil idle oyunlarda kaybedilen oyuncuların neredeyse tamamı ilk beş
// dakikada kaybediliyor. Bu dosya o beş dakikayı ölçüyor — ve Kaan'ın
// kendi başına düştüğü yeri: 60. seviyeye kadar elle taşıyıp müdürü hiç
// almamıştı, yani oyunun "idle" olan yarısını hiç görmemişti.
//
// Ölçüm bir **oyuncu taklidi değil**, açıkça yazılmış bir oynama kuralı:
//
//   - işçi sürekli taşıyor (`jeAutoCarry`) — yani oyuncu ekranın başında
//   - para yettikçe darboğaza MAKS basılıyor
//   - müdür parası çıktığı anda müdür alınıyor
//
// Bu kural en iyi oyuncunun değil, **bilgili** oyuncunun kuralı. Çıkan
// süreler bu yüzden alt sınır: gerçek oyuncu daha yavaş varır.
//
// Ölçülen:
//   1. İlk paranın gelmesi kaç saniye sürüyor
//   2. İlk müdür kaçıncı dakikada alınabiliyor
//   3. Fabrika kaçıncı dakikada kendi kendine dönmeye başlıyor
//   4. On dakikanın sonunda oyuncu nerede
//   5. Elle taşımayan bir oyuncu ne kazanıyor — yani öğreticiyi
//      atlayanın hâli
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8599);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8599/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', null, { timeout: 60000 });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

// Oyunu saniye saniye yürüt ve dönüm noktalarını yakala.
const kosu = await pg.evaluate(() => {
  window.jeWipeProgress();
  window.jeTutSkip();
  window.jeAutoCarry(true);
  const AD = ['Foundry', 'Stamping', 'Assembly', 'Dispatch'];
  const an = { ilkPara: null, mgr: [null, null, null, null], mgrFiyat: [0, 0, 0, 0] };
  const satir = [];
  for (let sn = 1; sn <= 600; sn++) {
    window.jeRun(1);
    const p = window.jeProbe();
    if (an.ilkPara === null && p.cash > 0) an.ilkPara = sn;
    for (let i = 0; i < 4; i++) {
      if (!p.mgr[i]) {
        if (!an.mgrFiyat[i]) an.mgrFiyat[i] = window.jeMgrCost(i);
        window.jeBuyManager(i);
        if (window.jeProbe().mgr[i]) an.mgr[i] = sn;
      }
    }
    window.jeBuy(AD.indexOf(window.jeProbe().neck), 'max');
    if (sn % 60 === 0) {
      const q = window.jeProbe();
      satir.push({ dk: sn / 60, cash: q.cash, hiz: q.income, lvl: [...q.lvl],
                   mgr: q.mgr.filter(Boolean).length, toplam: q.total });
    }
  }
  const son = window.jeProbe();
  return { an, satir, son, mgrFiyat: an.mgrFiyat };
});

console.log('\nTaşıyan oyuncu — dakika dakika');
console.log('  dk   kasa         hız/sn      seviyeler            müdür');
for (const s of kosu.satir)
  console.log(`  ${String(s.dk).padStart(2)}   ${fmt(s.cash).padEnd(11)}  ${fmt(s.hiz).padEnd(10)}  ${JSON.stringify(s.lvl).padEnd(20)} ${s.mgr}`);

const fmtSn = n => n === null ? 'hiç' : n < 60 ? `${n}sn` : `${(n / 60).toFixed(1)}dk`;
console.log('\nDönüm noktaları');
console.log(`  ilk para            ${fmtSn(kosu.an.ilkPara)}`);
for (let i = 0; i < 4; i++)
  console.log(`  ${i + 1}. müdür (${fmt(kosu.mgrFiyat[i])})`.padEnd(22) + fmtSn(kosu.an.mgr[i]));

console.log('\n1) İlk para hemen geliyor mu');
// Bir oyuncu ilk yarım dakikada ekranda bir şeyin arttığını görmeli.
ok(kosu.an.ilkPara !== null && kosu.an.ilkPara <= 30,
   'ilk para ilk yarım dakikada', fmtSn(kosu.an.ilkPara));

console.log('\n2) İlk müdür ilk oturumda alınabiliyor mu');
// Oyunun "idle" yarısı ilk müdürle başlıyor. Bir oturum beş dakika;
// oraya sığmıyorsa oyuncu idle oyunu hiç görmeden bırakıyor.
ok(kosu.an.mgr[0] !== null, 'ilk müdür alınabildi', fmtSn(kosu.an.mgr[0]));
ok(kosu.an.mgr[0] !== null && kosu.an.mgr[0] <= 300,
   'ilk müdür ilk beş dakikada', fmtSn(kosu.an.mgr[0]));

console.log('\n3) On dakikada nereye varıyor');
const son = kosu.son;
console.log(`     seviyeler ${JSON.stringify(son.lvl)} · müdür ${son.mgr.filter(Boolean).length}/4 · hız ${fmt(son.income)}/sn · toplam ${fmt(son.total)}`);
ok(Math.max(...son.lvl) >= 20, 'on dakikada 20. seviyeyi geçiyor', `${Math.max(...son.lvl)}`);
ok(son.mgr.filter(Boolean).length >= 2, 'en az iki müdür alınmış', `${son.mgr.filter(Boolean).length}`);

console.log('\n4) Hız duraklamıyor');
// İki dakika boyunca hiç artmayan bir hız, oyuncunun bıraktığı yerdir.
const hizlar = kosu.satir.map(s => s.hiz);
let durgun = 0, enUzunDurgun = 0;
for (let i = 1; i < hizlar.length; i++) {
  if (hizlar[i] <= hizlar[i - 1] * 1.05) durgun++; else durgun = 0;
  enUzunDurgun = Math.max(enUzunDurgun, durgun);
}
console.log(`     en uzun durgunluk ${enUzunDurgun} dakika`);
ok(enUzunDurgun <= 2, 'iki dakikadan uzun duraklama yok', `${enUzunDurgun} dk`);

console.log('\n5) Taşımayan oyuncu');
// Öğreticiyi atlayan, işçiyi hiç sürüklemeyen oyuncu. Müdürsüz
// istasyonun malını kimse taşımadığı için zincir hiç akmamalı — yani
// bu oyuncunun geliri **sıfır**. Soru şu: oyun ona bunu söylüyor mu?
// Şeridi oyunun kendi kare döngüsü gösteriyor (`tutGuncelle`), `jeRun`
// değil. İlk yazılışında ölçüm `jeRun` ile ilerletti ve şerit kapalı
// çıktı — oyunun o yolda hiç yapmadığı bir şeyi ölçüyordu. Doğrusu
// taze bir sayfa açıp gerçek kareleri beklemek.
const ctx2 = await br.newContext({ viewport: { width: 412, height: 915 } });
const pg2 = await ctx2.newPage();
await pg2.addInitScript(() => localStorage.clear());
await pg2.goto('http://localhost:8599/', { waitUntil: 'load', timeout: 90000 });
await pg2.waitForFunction(() => typeof window.jeProbe === 'function', null, { timeout: 60000 });
await pg2.evaluate(() => document.getElementById('dOk')?.click());
await pg2.waitForTimeout(1500);                    // gerçek kareler dönsün
const tasimayan = await pg2.evaluate(() => {
  window.jeAutoCarry(false);
  for (let sn = 0; sn < 300; sn++) window.jeRun(1);
  const p = window.jeProbe();
  return { cash: p.cash, uretim: p.total, gosterilen: p.gosterilen, teorik: p.income,
           ekranHiz: document.getElementById('rate').textContent,
           ipucu: document.getElementById('tut').textContent,
           ipucuGorunur: document.getElementById('tut').classList.contains('show') };
});
// Kasada para var ama üretimden değil: günlük giriş ödülü. İlk ölçüm
// `cash`'e bakıp "taşımayan oyuncu 18.0K kazandı" dedi — ödülü üretim
// sandı. Üretimi ölçen alan `totalEarned`.
console.log(`     beş dakika taşımadan: üretim ${fmt(tasimayan.uretim)} · kasa ${fmt(tasimayan.cash)} (günlük giriş ödülü) · ekranda "${tasimayan.ekranHiz}"`);
console.log(`     öğretici şeridi görünür mü: ${tasimayan.ipucuGorunur} — "${tasimayan.ipucu.slice(0, 70)}"`);
ok(tasimayan.uretim === 0, 'taşımayan oyuncu hiçbir şey üretmiyor', `${tasimayan.uretim}`);
ok(/^0/.test(tasimayan.ekranHiz.trim()), 'ekran da sıfır yazıyor (yalan söylemiyor)', tasimayan.ekranHiz);
ok(tasimayan.ipucuGorunur, 'oyuncuya ne yapacağı söyleniyor', tasimayan.ipucu.slice(0, 50));

function fmt(n) {
  if (n < 1000) return (+n).toFixed(n < 10 ? 2 : 0);
  const b = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];
  let i = 0;
  while (n >= 1000 && i < b.length - 1) { n /= 1000; i++; }
  return n.toFixed(n < 10 ? 2 : 1) + b[i];
}

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
