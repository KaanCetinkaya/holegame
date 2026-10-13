// Mağaza metni oyunla uyuşuyor mu?
//
// Bu depoda elle yazılmış bir sayının sessizce yaşlanması birkaç kez
// oldu: mağaza ekran görüntüleri boş bir fabrika gösterdi ve kimse
// bakmadı, dönüş ekranı "en çok 4 saat" dedi ama gece vardiyası
// araştırması o süreyi uzatıyordu, ve `listing.md` "uygulama içi satın
// alma yok" yazdığı sırada mağazada üç ürün vardı.
//
// Mağaza metni bunların en pahalısı: indirmeden önce okunan tek şey o,
// ve yanlışı Play'de aylarca durur. Bu yüzden metindeki her sayı
// oyunun kendisinden doğrulanıyor.
//
// Ölçülen:
//   1. Karakter sınırları (ad 30, kısa açıklama 80, tam açıklama 4000)
//   2. İstasyon adları ve sırası — iki dilde de
//   3. Kilometre taşları
//   4. Hız kutusu: çarpan ve süre
//   5. Çevrimdışı tavan
//   6. Müdür çarpanı ve dört müdürün adı
//   7. Araç kademeleri ve sayısı
//   8. Şube yerleri ve sayısı
//   9. Hedef sayısı ve günlük görev sayısı
//  10. Müşteri ödülü (kaç saniyelik üretim)
//  11. Satın alma: metnin söylediğiyle oyunun içindeki ürünler
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const MD = readFileSync('/home/user/holegame/tycoon/store/listing.md', 'utf8');

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8621);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8621/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 60000 });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };
// Metinde geçiyor mu? Oyunun verdiği değer metne yazılmış olmalı.
const gecer = (parca, ad) =>
  ok(MD.includes(parca), ad, MD.includes(parca) ? '' : `"${parca}" metinde yok`);

// Oyunun kendi değerleri.
const oyun = await pg.evaluate(() => {
  const tr = [];
  for (let d = 0; d < 2; d++) {
    // Dili değiştirip istasyon adlarını iki dilde de oku.
    document.getElementById('menuBtn').click();
    const su = window.jeDil().dil;
    if (su !== d) document.getElementById('langBtn').click();
    document.getElementById('menuBtn').click();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('show'));
    tr.push([...document.querySelectorAll('.st .nm')].map(e => e.textContent.trim()));
  }
  const g = window.jeGoals();
  window.jeWipeProgress();
  const gorev = window.jeGorev();
  return {
    istasyon: { en: tr[0], tr: tr[1] },
    tasli: window.jeMilestones ? window.jeMilestones() : null,
    boostCarpan: window.jeProbe().boost !== undefined ? null : null,
    boostSn: window.jeBoostSecs(),
    cevrimdisiSn: window.jeRes ? null : null,
    hedefSayisi: g.length,
    gorevSayisi: gorev.liste.length,
    musSn: window.jeMus().sn,
    urunler: window.jeShop().urunler.map(u => u.id),
    sabitler: window.jeSabitler ? window.jeSabitler() : null,
  };
});

console.log('\n1) Karakter sınırları');
const bloklar = [...MD.matchAll(/```\n([\s\S]*?)\n```/g)].map(m => m[1]);
const adlar = bloklar.filter(b => b.length < 60 && /Motor Works/.test(b));
const kisalar = bloklar.filter(b => b.length >= 60 && b.length <= 200 && !b.includes('\n'));
const tamlar = bloklar.filter(b => b.length > 1000);
console.log(`     uygulama adı ${adlar.map(b => b.length).join(' / ')} · kısa ${kisalar.map(b => b.length).join(' / ')} · tam ${tamlar.map(b => b.length).join(' / ')}`);
ok(adlar.length >= 1 && adlar.every(b => b.length <= 30), 'uygulama adı 30 karakterin altında',
   adlar.map(b => b.length).join(' '));
ok(kisalar.length >= 2 && kisalar.every(b => b.length <= 80), 'kısa açıklamalar 80 karakterin altında',
   kisalar.map(b => b.length).join(' '));
ok(tamlar.length >= 2 && tamlar.every(b => b.length <= 4000), 'tam açıklamalar 4000 karakterin altında',
   tamlar.map(b => b.length).join(' '));

console.log('\n2) İstasyon adları');
console.log(`     oyun: ${oyun.istasyon.en.join(' ▸ ')} · ${oyun.istasyon.tr.join(' ▸ ')}`);
gecer(oyun.istasyon.en.join(' ▸ ').toUpperCase(), 'İngilizce hat sırası metinde');
gecer(oyun.istasyon.tr.join(' ▸ ').toLocaleUpperCase('tr'), 'Türkçe hat sırası metinde');

console.log('\n3) Kilometre taşları');
const tasli = await pg.evaluate(() => window.jeTaslar());
console.log(`     oyun: ${tasli.join(', ')}`);
gecer(tasli.join(', '), 'taş listesi metinde aynı sırayla');

console.log('\n4) Hız kutusu');
const boost = await pg.evaluate(() => ({ carpan: window.jeBoostMult(), sn: window.jeBoostSecs() }));
console.log(`     oyun: ×${boost.carpan}, ${boost.sn} saniye (${boost.sn / 60} dakika)`);
ok(/üç kat|triple/i.test(MD) && boost.carpan === 3, 'çarpan metinle aynı', `×${boost.carpan}`);
ok(/Üç dakika|Three minutes/i.test(MD) && boost.sn === 180, 'süre metinle aynı', `${boost.sn}sn`);

console.log('\n5) Çevrimdışı tavan');
const saat = await pg.evaluate(() => window.jeProbeSabit().offline / 3600);
console.log(`     oyun: ${saat} saat`);
ok(/Dört saate kadar|up\s*\n?to four hours/i.test(MD) && saat === 4,
   'çevrimdışı tavanı metinle aynı', `${saat} saat`);
ok(/araştırmayla daha fazlası|more with research/i.test(MD),
   'metin tavanın araştırmayla uzadığını söylüyor');

console.log('\n6) Müdürler');
const mgr = await pg.evaluate(() => window.jeMgrKimlik().map(m => m.ad));
console.log(`     oyun: ${mgr.join(', ')}`);
for (const ad of mgr) gecer(ad, `${ad} metinde`);

console.log('\n7) Araç kademeleri');
const urun = await pg.evaluate(() => window.jeUrunler());
console.log(`     oyun: ${urun.en.join(', ')} · ${urun.tr.join(', ')}`);
ok(/BEŞ ARAÇ KADEMESİ|FIVE VEHICLE TIERS/.test(MD) && urun.en.length === 5,
   'kademe sayısı metinle aynı', `${urun.en.length}`);
gecer(urun.en.join(', '), 'İngilizce kademe adları metinde');
gecer(urun.tr.join(', '), 'Türkçe kademe adları metinde');

console.log('\n8) Şube yerleri');
const yer = await pg.evaluate(() => window.jeYerler());
console.log(`     oyun: ${yer.en.join(', ')} · ${yer.tr.join(', ')}`);
gecer(yer.tr.join(', ').toLowerCase(), 'Türkçe yer adları metinde');
gecer(yer.en.join(', ').toLowerCase(), 'İngilizce yer adları metinde');

console.log('\n9) Hedefler ve görevler');
console.log(`     oyun: ${oyun.hedefSayisi} hedef · günde ${oyun.gorevSayisi} görev`);
ok(/On iki/.test(MD) && oyun.hedefSayisi === 12, 'hedef sayısı metinle aynı', `${oyun.hedefSayisi}`);
ok(/Twelve/.test(MD) && oyun.hedefSayisi === 12, 'İngilizcesi de aynı');
ok(/üç görev/.test(MD) && oyun.gorevSayisi === 3, 'günlük görev sayısı metinle aynı', `${oyun.gorevSayisi}`);

console.log('\n10) Müşteri ödülü');
console.log(`     oyun: ${oyun.musSn} saniyelik üretim`);
ok(/yarım dakikalık|half a minute/i.test(MD) && oyun.musSn === 30,
   'müşteri ödülü metinle aynı', `${oyun.musSn} sn`);

console.log('\n11) Satın alma');
console.log(`     oyun: ${oyun.urunler.join(', ')}`);
ok(!/satın alma \*\*yok\*\*/i.test(MD), 'metin "satın alma yok" demiyor');
for (const id of oyun.urunler) gecer(id, `${id} metinde`);

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
