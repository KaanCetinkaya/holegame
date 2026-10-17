// Dükkândaki bıçaklar kaç bölümde alınabiliyor?
//
// Beş bıçak satılıyor — 300, 900, 2200, 5000 ve 11000 — ve bir turun
// kaç para verdiği hiçbir yerde fiyatlarla karşılaştırılmamıştı.
// İki yönde de hata mümkün:
//
//   - Çok pahalı: en üstteki bıçak oyunun içeriği bitene kadar
//     alınamıyorsa dükkânın yarısı vitrin.
//   - Çok ucuz: ilk birkaç turda hepsi alınıyorsa dükkân bir karar
//     değil, bir düğme.
//
// Ölçüm oyunun kendi sürücüsüyle oynuyor, yani "mükemmel oyuncu"
// değil ama meyveyi kaçıran bir oyuncu da değil — gerçek bir
// oyuncunun üst sınırına yakın. Yani buradan çıkan bölüm sayısı
// **iyimser**: gerçek oyuncu daha çok oynar.
//
// Fiyatlar ve bıçak sayısı oyundan okunuyor (`sliceCost`), elle
// yazılmıyor: dükkâna bir bıçak eklendiğinde ölçüm onu da sorar.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-slicer' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8777);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const hata = [];
pg.on('pageerror', e => hata.push(String(e).split('\n')[0]));
await pg.goto('http://localhost:8777/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.sliceProbe === 'function', { timeout: 60000 });
await pg.evaluate(() => document.getElementById('dOk')?.click());

const SON = +(process.env.SON || 120);
const r = await pg.evaluate(async (SON) => {
  const dukkan = window.sliceShop();
  const fiyat = dukkan.map(b => b.fiyat);
  const toplam = [];
  let kasa = 0;
  const ilk = fiyat.map(() => null);
  for (let n = 1; n <= SON; n++) {
    // Her bölüm bir kez: oyuncu ilerledikçe oynuyor, aynı bölümü
    // öğütmüyor. Öğütme varsayımı ölçümü istediği cevabı veren bir
    // şeye çevirirdi.
    window.sliceStart(n);
    const p = window.sliceRun(8000);
    // Koşu bitmese de para banka yazılıyor (oyun her çıkışta yatırıyor).
    const once = window.sliceMeta().coins;
    window.sliceQuit ? window.sliceQuit() : document.getElementById(
      p.state === 'clear' ? 'clearQuitBtn' : 'overQuitBtn').click();
    // Hedef ödülleri de gelirin parçası: gerçek oyuncu onları alıyor,
    // ve almayan bir tarama oyunun verdiğinden azını ölçer.
    for (const g of window.sliceGoals().list)
      if (g.claimable) window.sliceTakeGoal(g.id);
    kasa = window.sliceMeta().coins;
    toplam.push({ n, bitti: p.state === 'clear', kasa, once });
    for (let i = 0; i < fiyat.length; i++)
      if (ilk[i] === null && kasa >= fiyat[i]) ilk[i] = n;
  }
  return { fiyat, ilk, kasa, toplam, ad: dukkan.map(b => b.ad) };
}, SON);

console.log(`\n${SON} bölüm oynandı · toplam kasa ${r.kasa}`);
for (let i = 0; i < r.fiyat.length; i++)
  console.log(`     ${String(r.ad[i]).padEnd(9)} ${String(r.fiyat[i]).padStart(6)}  ` +
    (r.ilk[i] === null ? `${SON} bölümde alınamadı` : `${r.ilk[i]}. bölümde alınabilir`));
for (const x of r.toplam) if (x.n % 10 === 0) console.log(`     ${String(x.n).padStart(3)}. bölümden sonra kasa ${x.kasa}`);
const bazi = r.toplam.filter(x => x.bitti).length;
console.log(`     ${bazi}/${SON} bölüm bitirildi`);

ok(bazi > SON * 0.5, 'tarama gerçekten oynandı — ölçülecek bir şey vardı', `${bazi}/${SON}`);
// Dükkânın bir kuyruğu olmalı: hepsi ilk beş bölümde alınıyorsa
// dükkân bir karar değil, bir düğme.
const erken = r.fiyat.map((f, i) => ({ i, f, n: r.ilk[i] }))
  .filter(x => x.f > 0 && x.n !== null && x.n <= 5);
ok(erken.length < r.fiyat.length - 1, 'dükkânın kuyruğu var',
   `${erken.length}/${r.fiyat.length - 1} bıçak ilk beş bölümde`);
// Ve hiçbiri ulaşılamaz olmamalı.
//
// Sınır ölçüldü, seçilmedi: aynı tarama üç kez koşturulduğunda en
// pahalı bıçak 93, 77 ve 88. bölümde alınabilir oldu — on altı
// bölümlük gürültü. Sınır 110, onun rahatça üstünde, ama "hiç
// alınamıyor"u yakalıyor.
const uzak = r.fiyat.map((f, i) => ({ i, f, n: r.ilk[i] }))
  .filter(x => x.n === null || x.n > 110);
ok(uzak.length === 0, `her bıçak ${SON} bölüm içinde alınabiliyor`,
   uzak.map(x => `${r.ad[x.i]} (${x.f})`).join(', '));

ok(!hata.length, 'sayfa hatası yok', hata[0] || '');
console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
