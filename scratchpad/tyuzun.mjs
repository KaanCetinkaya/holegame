// Uzun oyun: sayılar nereye kadar gidiyor ve ne zaman kırılıyor?
//
// Idle oyunlar bu yüzden kırılıyor. Çarpanlar üst üste binince para
// `Infinity`'ye çıkıyor, bir bölme `NaN` veriyor, ya da ekrandaki
// kutuya sığmayan bir sayı arayüzü dağıtıyor. Motor Works'te üç yeni
// araştırma dalı üsse dokunuyor (kilometre taşı gücü), yani bu soru
// artık daha keskin.
//
// Ölçülen:
//   1. On beş şube devri boyunca hiçbir sayı `NaN` ya da `Infinity`
//      olmuyor
//   2. Ekranda yazan en uzun sayı, kutusuna sığıyor
//   3. Kayıt ve yedek kodu o ölçekte de çalışıyor — büyük sayılar
//      JSON'dan sağ çıkıyor
//   4. Prestij puanı ve çarpan tutarlı kalıyor
//   5. Oyun o noktada hâlâ çiziliyor (sayfa hatası yok)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8625);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const hatalar = [];
pg.on('pageerror', e => hatalar.push(String(e)));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8625/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 60000 });
await pg.evaluate(() => { document.getElementById('dOk')?.click(); window.jeTutSkip(); });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

const kosu = await pg.evaluate(() => {
  const AD = ['Foundry', 'Stamping', 'Assembly', 'Dispatch'];
  window.jeWipeProgress();
  window.jeTutSkip();
  window.jeAutoCarry(true);
  const satir = [];
  for (let tur = 1; tur <= 15; tur++) {
    for (let sn = 0; sn < 20 * 60; sn++) {
      window.jeRun(1);
      for (let i = 0; i < 4; i++) window.jeBuyManager(i);
      const p = window.jeProbe();
      const neck = AD.indexOf(p.neck);
      const tutan = window.jeTier().tutan.filter(i => i !== neck);
      if (tutan.length && sn % 2 === 0) window.jeBuy(tutan[0], 'max');
      else window.jeBuy(neck, 'max');
    }
    const p = window.jeProbe();
    satir.push({
      tur, cash: p.cash, total: p.total, income: p.income,
      puan: p.points + p.pending, lvl: [...p.lvl], tier: p.tier,
      carpan: window.jeBranchMult(),
      yaziCash: window.jeFmt(p.cash), yaziHiz: window.jeFmt(p.income),
    });
    window.jePrestige();
    // Bütün dalları doldur: en hızlı büyüyen oyuncu bu.
    for (const id of ['tas', 'price', 'cheap', 'mgr', 'start', 'offline', 'boost', 'satis', 'elaraba'])
      window.jeResBuy(id, 100);
    // Kalan bütün puanı hatta yatır. Burada bir sayı yazmak ölçümü
    // kendi tavanına sıkıştırıyordu: 100000 seviye = +2000 çarpan, ve
    // devir başına tam olarak +2000 görünüyordu — oyunun platosu değil,
    // testin tavanı. Döngü puan bitene kadar alıyor.
    while (window.jeFree() >= 1) window.jeResBuy('line', 100000);
  }
  return satir;
});

console.log('\ntur  seviyeler              kademe  hız          çarpan     yazı');
for (const s of kosu)
  console.log(`${String(s.tur).padStart(3)}  ${JSON.stringify(s.lvl).padEnd(22)} ${String(s.tier).padStart(5)}  ` +
    `${s.income.toExponential(2).padEnd(11)}  ${String(s.carpan).padStart(9)}  ${s.yaziHiz}`);

console.log('\n1) Sayılar sağlam');
const bozuk = kosu.filter(s =>
  [s.cash, s.total, s.income, s.puan, s.carpan, ...s.lvl].some(n => !isFinite(n)));
console.log(`     en büyük hız ${kosu[kosu.length - 1].income.toExponential(2)} · en büyük çarpan ${kosu[kosu.length - 1].carpan}`);
ok(bozuk.length === 0, 'hiçbir turda NaN ya da Infinity yok',
   bozuk.length ? `tur ${bozuk.map(s => s.tur).join(',')}` : '');

console.log('\n2) Ekrandaki sayı kutusuna sığıyor');
// `fmt` son eki 'ah'ta (10^36) durduruyor; ondan sonrası "123456ah"
// gibi uzuyor ve 90 piksellik bir hap bunu kesiyor.
const enUzun = kosu.reduce((a, s) => Math.max(a, s.yaziCash.length, s.yaziHiz.length), 0);
console.log(`     en uzun yazı ${enUzun} karakter: "${kosu[kosu.length - 1].yaziCash}" / "${kosu[kosu.length - 1].yaziHiz}"`);
const tasma = await pg.evaluate(() => {
  const el = document.getElementById('cashPill');
  return { ic: el.scrollWidth, dis: el.clientWidth, yazi: el.textContent };
});
console.log(`     kasa hapı: "${tasma.yazi}" ${tasma.ic} > ${tasma.dis} ? ${tasma.ic > tasma.dis + 2}`);
ok(enUzun <= 9, 'en uzun sayı dokuz karakteri geçmiyor', `${enUzun}`);
ok(tasma.ic <= tasma.dis + 2, 'kasa hapı taşmıyor', `${tasma.ic} / ${tasma.dis}`);

console.log('\n2b) Tavan nerede');
// Bir sayı değil, bir rapor. Kilometre taşı listesi 1000'e kadar
// gidiyor ama oyuncunun gerçekte vardığı yer başka. Hangi taşların
// ulaşılabilir olduğu, araç kademelerinde ölçülen aynı soru.
const enYuksek = Math.max(...kosu[kosu.length - 1].lvl);
const sonUc = kosu.slice(-3).map(s => Math.max(...s.lvl));
const devirBasina = (sonUc[2] - sonUc[0]) / 2;
const taslar = await pg.evaluate(() => window.jeTaslar());
const sonraki = taslar.find(t => t > enYuksek);
console.log(`     on beş devir sonunda en yüksek seviye ${enYuksek}, devir başına +${devirBasina.toFixed(1)}`);
console.log(`     geçilen taşlar: ${taslar.filter(t => t <= enYuksek).join(', ')}`);
if (sonraki)
  console.log(`     sıradaki taş ${sonraki} — bu tempoda ${Math.ceil((sonraki - enYuksek) / Math.max(0.1, devirBasina))} devir uzakta`);
ok(taslar.filter(t => t <= enYuksek).length >= 6,
   'taşların çoğu ulaşılabilir', `${taslar.filter(t => t <= enYuksek).length}/${taslar.length}`);

console.log('\n3) Kayıt ve yedek kodu o ölçekte');
const yedek = await pg.evaluate(() => {
  const kod = window.jeYedekKod();
  const coz = window.jeYedekCoz(kod);
  const geri = coz.json ? JSON.parse(coz.json) : null;
  const p = window.jeProbe();
  return { uzunluk: kod.length, okundu: !!geri,
           lifetimeAyni: geri && geri.lifetime === p.total + (geri.lifetime - geri.lifetime) ? true : null,
           lifetime: geri ? geri.lifetime : null, cash: geri ? geri.cash : null,
           sonlu: geri ? [geri.cash, geri.lifetime, geri.totalEarned].every(n => isFinite(n)) : false };
});
console.log(`     kod ${yedek.uzunluk} karakter · çözüldü ${yedek.okundu} · içindeki sayılar sonlu ${yedek.sonlu}`);
ok(yedek.okundu, 'kod bu ölçekte de okunabiliyor');
ok(yedek.sonlu, 'kodun içindeki sayılar JSON turundan sonlu çıktı');
ok(yedek.uzunluk < 1400, 'kod hâlâ elle taşınabilir uzunlukta', `${yedek.uzunluk}`);

console.log('\n4) Çarpan ve puan tutarlı');
const art = kosu.filter((s, i) => i > 0 && s.puan < kosu[i - 1].puan);
console.log(`     puan ${kosu[0].puan} → ${kosu[kosu.length - 1].puan}`);
ok(art.length === 0, 'prestij puanı hiçbir turda azalmadı',
   art.length ? `tur ${art.map(s => s.tur).join(',')}` : '');

console.log('\n5) Sayfa hatası');
console.log(`     ${hatalar.length} hata${hatalar.length ? ': ' + hatalar[0] : ''}`);
ok(hatalar.length === 0, 'on beş devir boyunca sayfa hatası yok');

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
