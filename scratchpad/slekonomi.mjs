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
//
// ## İkinci soru: dokuz hedefin kaçı gerçekten alınıyor
//
// Tarama zaten hedef ödüllerini topluyordu — gelirin parçası oldukları
// için — ama **hangisinin** düştüğüne hiç bakmıyordu. `slicegoals`
// mekanizmayı ölçüyor (sayaç artıyor mu, iki kez ödüyor mu, zincirin
// ikinci halkası gizli mi) ve bunu değerleri elle vererek yapıyor:
// `x12 kombo` diye bir kombo yazılıyor ve hedef açılıyor. Yani "bir
// oyuncu x25 komboyu gerçekten yapabiliyor mu" sorusunun cevabı hiçbir
// yerde yoktu.
//
// Bu, bu depoda iki kez ölü içerik çıkmış bir soru: Motor Works'te beş
// araç modelinin ikisi (`tykademe`) ve beş kaplamanın ikisi
// (`tydonanim`) kimsenin varmadığı yerdeydi. Hedefler aynı riski
// taşıyor, üstelik daha sessizce — ulaşılamayan bir hedef ekranda
// duruyor ve oyuncuya "yapılabilir" diyor.
//
// Tarama her bölümden sonra hangi hedefin alınabilir olduğunu yazıyor,
// yani çıkan şey "ulaşılıyor mu"nun ötesinde: **kaçıncı bölümde**.
// `day7` ayrı, çünkü oynayarak değil takvimle geliyor: yedi günlük
// zincir `sliceSetDay` ile kuruluyor.
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
  const hedef = {};                     // hedef id → {kaçıncı bölüm, ödül}
  // Üçüncü bıçağın parası kaçıncı bölümde birikiyor: `blades3` hedefi
  // sahipliği sayıyor ve sahiplik paradan geçiyor.
  const ikiUcuz = dukkan.filter(b => !b.sahip).map(b => b.fiyat)
    .sort((a, b) => a - b).slice(0, 2).reduce((a, b) => a + b, 0);
  let ucBicak = null;
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
    // ve almayan bir tarama oyunun verdiğinden azını ölçer. Hangisinin
    // kaçıncı bölümde düştüğü de burada yazılıyor.
    for (const g of window.sliceGoals().list)
      if (g.claimable) { if (!hedef[g.id]) hedef[g.id] = { n, pay: g.pay }; window.sliceTakeGoal(g.id); }
    kasa = window.sliceMeta().coins;
    toplam.push({ n, bitti: p.state === 'clear', kasa, once });
    for (let i = 0; i < fiyat.length; i++)
      if (ilk[i] === null && kasa >= fiyat[i]) ilk[i] = n;
    if (ucBicak === null && kasa >= ikiUcuz) ucBicak = n;
  }
  // Yedi günlük zincir: oynayarak gelmiyor, takvimle geliyor. Her gün
  // "dün alınmış" hâline getirilip ödül toplanıyor, yani oyunun kendi
  // zinciri yürütülüyor — sayaç elle yazılmıyor.
  const gunler = [];
  for (let g = 1; g <= 7; g++) {
    window.sliceSetDay(1, g - 1);
    document.getElementById('dOk').click();
    gunler.push(window.sliceDaily().streak);
  }
  // Oyuncu bıçak da alıyor, ve bu taramanın sonunda yapılıyor: ortasında
  // yapılsa yukarıdaki "kaçıncı bölümde alınabilir" ölçüsü bozulurdu —
  // o ölçü harcanmamış kasayı soruyor ve öyle olduğu baştan yazılı.
  // `sliceBlade` ödeme yapmıyor (ölçüm kancası, bıçak değiştirmek için);
  // gerçek satın alma dükkân satırına dokunmak.
  document.getElementById('shopBtn').click();
  for (let tur = 0; tur < 6 && window.sliceMeta().owned.length < 3; tur++) {
    const d = window.sliceShop().find(b => !b.sahip && b.fiyat <= window.sliceMeta().coins);
    if (!d) break;
    document.getElementById('blades').children[d.i].click();
  }
  document.getElementById('shopClose').click();
  for (const g of window.sliceGoals().list)
    if (g.claimable) {
      if (!hedef[g.id]) hedef[g.id] = { n: g.id === 'blades3' ? ucBicak : null, pay: g.pay };
      window.sliceTakeGoal(g.id);
    }
  const son = window.sliceGoals();
  return { fiyat, ilk, kasa, toplam, hedef, gunler, ikiUcuz, ucBicak,
           ad: dukkan.map(b => b.ad),
           hedefler: son.list.map(g => ({ id: g.id, at: g.at, goal: g.goal,
                                          pay: g.pay, taken: g.taken })),
           gizli: son.gizli };
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

// --- Hedefler ulaşılıyor mu -------------------------------------------
const hepsiHedef = [...r.hedefler.map(g => g.id), ...r.gizli];
console.log(`\n  ${hepsiHedef.length} hedef · alınabilir olduğu bölüm`);
for (const g of r.hedefler) {
  const h = r.hedef[g.id];
  const yer = !h ? 'ALINAMADI' : h.n === null ? 'yedi günlük zincirle' : `${h.n}. bölüm`;
  console.log(`     ${g.id.padEnd(9)} ${String(g.goal).padStart(5)} ` +
    `${String(g.pay).padStart(6)} para   ${yer}`);
}
if (r.gizli.length) console.log(`     hâlâ gizli: ${r.gizli.join(', ')}`);
console.log(`     günlük zincir: ${r.gunler.join(' → ')}`);

const alinmayan = hepsiHedef.filter(id => !r.hedef[id]);
// Ulaşılamayan bir hedef ölü içerik: ekranda duruyor ve oyuncuya
// yapılabilir diyor. `day7` oynayarak gelmiyor ve ölçüm onu takvimle
// kuruyor — bu yüzden listede o da var, ayrı tutulmuyor.
ok(alinmayan.length === 0, 'dokuz hedefin dokuzu da alınabiliyor',
   alinmayan.length ? alinmayan.join(', ') : `${hepsiHedef.length}/${hepsiHedef.length}`);
// Ve hepsi ilk birkaç bölümde düşmemeli: düşüyorsa meta katman bir
// akşamda bitiyor demektir. Üç tarama ölçüldü ve beşinci bölümden sonra
// düşenler hep aynı beş hedef oldu — `cut1000` (44, 47, 48), `lvl10` (9),
// `lvl25` (24, 25, 24), `stars30` (13, 12, 13) ve `day7` (takvim). Erken
// dörtlü de hep aynı: `combo10`, `combo25`, `blades3`, `cut100`, hepsi
// ilk beş bölümde. Kapı beşte duruyor, yani ölçülen beşin altına
// düşmeden uyarmıyor.
const gecOlan = Object.values(r.hedef).filter(h => h.n === null || h.n > 5).length;
ok(gecOlan >= 3, 'hedefler bir akşamda bitmiyor',
   `${gecOlan} hedef beşinci bölümden sonra`);
// Kodun kendi cümlesi: "hepsini toplamak bir bıçak eder". Fiyatlar
// oyundan okunuyor, cümle elle doğrulanmıyor.
const odul = r.hedefler.reduce((a, g) => a + g.pay, 0);
const enPahali = Math.max(...r.fiyat);
const alinabilen = r.fiyat.filter(f => f <= odul);
console.log(`     hedeflerin toplamı ${odul} para · en pahalı bıçak ${enPahali}`);
ok(alinabilen.length >= 1 && odul < enPahali,
   'hedeflerin toplamı bir bıçak ediyor, dükkânı etmiyor',
   `${odul} para · alabildiği ${alinabilen.length}/${r.fiyat.length} bıçak`);

ok(!hata.length, 'sayfa hatası yok', hata[0] || '');
console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
