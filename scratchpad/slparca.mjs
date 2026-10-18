// Havuzdaki her parça tahtaya **çıkıyor** mu, ve çıktığında bir şey
// koyuyor mu?
//
//   node build-www.mjs && node scratchpad/slparca.mjs
//   node scratchpad/slparca.mjs 40 30     # 40 bölüm, bölüm başına 30 tahta
//
// ## Neden var
//
// `slicewall` havuzun 28. bölümde dolduğunu ölçüyor ve "on bir parça"
// diyor. Ama bu cümle **havuzun** cümlesi, tahtanın değil. Arada iki şey
// var ve ikisi de ölçülmüyordu:
//
//   1. **Ağırlık.** Seçim ağırlıklı kura ve ağırlıklar bölümle kayıyor
//      (`sert` katsayısı 17'de 0, 32'de 1). Bir parçanın ağırlığı pratikte
//      sıfıra yakınsa havuzda olması onu tahtaya koymuyor.
//   2. **Vazgeçme.** Parça seçilip hiçbir şey koymayabiliyor: `bar()` yer
//      bulamazsa false dönüyor, `window()` ulaşılamaz açıklıkta
//      vazgeçiyor, `mine()` arkasından kaçış hattı gelemeyecekse hiç
//      konmuyor. Üçünde de parça sessizce sıradan bir meyve sırasına
//      dönüşüyor — doğru davranış, ama ölçülmediği sürece tahtada ne
//      olduğunu kimse bilmiyor.
//
// Bu deponun en pahalı hata sınıfı tam burası: **yazılmış ama sessizce
// ölü** bir özellik. Motor Works'te iki araç modeli ve iki kaplama böyle
// çıktı; burada bir parça ölürse geç bölümler erken bölümlere geri döner
// ve `slicewall`in "duvar geri geldi" kapısı bunu ancak demir sayısı
// düşerse görür — mengene yerine pencere koymayan bir mengene, demiri
// koyar ama soruyu sormaz.
//
// ## Ölçülen şey
//
// Her bölüm için N tahta kuruluyor ve oyunun kendi dökümü okunuyor
// (`sliceParcalar`): hangi parça seçildi, kaç meyve/demir/mayın koydu.
// Parça listesi ve açılış bölümleri oyundan geliyor (`slicePieces`), yani
// havuza bir parça eklenince ölçüm onu kendiliğinden sorar.
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
}).listen(8623);

const SON = Number(process.argv[2] || 40);
const TAHTA = Number(process.argv[3] || 30);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const hata = [];
pg.on('pageerror', e => hata.push(String(e).split('\n')[0]));
await pg.goto('http://localhost:8623/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.sliceParcalar === 'function', { timeout: 30000 });
// Çizim kapalı: ölçülen şey parkurun kurulumu, ekrandaki görüntü değil.
await pg.evaluate(() => window.sliceDrawOff(true));

const veri = await pg.evaluate(async ({ SON, TAHTA }) => {
  const parcalar = window.slicePieces();
  const topla = {};
  for (const p of parcalar) topla[p.id] = { secildi: 0, bos: 0, ilkBolum: null, minLevel: p.minLevel };
  const bolumler = [];
  for (let n = 1; n <= SON; n++) {
    const b = { n, secim: {}, bos: {} };
    for (let k = 0; k < TAHTA; k++) {
      window.sliceStart(n);
      for (const q of window.sliceParcalar()) {
        topla[q.id].secildi++;
        b.secim[q.id] = (b.secim[q.id] || 0) + 1;
        if (topla[q.id].ilkBolum === null) topla[q.id].ilkBolum = n;
        // "Boş geçti": engel koyması beklenen bir parça hiçbir engel
        // koymadı. Hangi parçanın engel koyması gerektiği oyundan
        // çıkarılamıyor (parça kendi kodunda karar veriyor), o yüzden
        // kural şu: bu parça **hiç** engel koyduysa engelli bir
        // parçadır, ve koymadığı turlar boş geçmiştir.
        if (q.demir + q.mayin === 0) {
          topla[q.id].bos++;
          b.bos[q.id] = (b.bos[q.id] || 0) + 1;
        }
      }
    }
    bolumler.push(b);
  }
  return { parcalar, topla, bolumler };
}, { SON, TAHTA });

const fails = [];
const check = (ok, ne, ek = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ne}${ek ? '   ' + ek : ''}`);
  if (!ok) fails.push(`${ne} ${ek}`);
};

console.log(`\n${SON} bölüm × ${TAHTA} tahta · ${veri.parcalar.length} parça\n`);
console.log('  parça     açılış  seçildi  engelsiz  ilk görüldüğü bölüm');
console.log('  --------+-------+--------+---------+-------------------');
for (const p of veri.parcalar) {
  const t = veri.topla[p.id];
  const oran = t.secildi ? Math.round(t.bos / t.secildi * 100) : 0;
  console.log(`  ${p.id.padEnd(9)} ${String(p.minLevel).padStart(5)} ` +
    `${String(t.secildi).padStart(8)} ${(t.secildi ? '%' + oran : '—').padStart(9)}   ` +
    (t.ilkBolum === null ? 'HİÇ' : String(t.ilkBolum)));
}

// Engelli parçalar **oyundan** geliyor: parçanın kodu `c.bar`, `c.window`
// ya da `c.mine` çağırıyorsa engel koymayı vaat ediyor demektir
// (`slicePieces().engel`).
//
// İlk hâli bunu gözlemden çıkarıyordu — "hiç engel koymuş olanlar" — ve o
// tanım tam da aranan hatayı gizliyordu: `gauntlet` bilerek bozulup hiç
// engel koymaz hâle getirildiğinde, parça sessizce "meyve parçası"
// sayılıyor ve kapı geçiyordu. Hatayı geri koyma denemesi bu yüzden var:
// geçmesi gereken yerde geçmek yetmiyor, düşmesi gereken yerde düşmeli.
const engelli = veri.parcalar.filter(p => p.engel);
console.log(`\n  engel koyan parçalar: ${engelli.map(p => p.id).join(', ')}`);

console.log('');
// ## Kapılar
//
//   1. **Havuzdaki her parça tahtaya çıkıyor.** Açılış bölümünden sonra
//      hiç seçilmeyen bir parça ölü içeriktir — ağırlığı sıfıra inmiş ya
//      da havuz filtresi onu dışarıda bırakıyordur.
//   2. **Hiçbir engelli parça çoğunlukla boş geçmiyor.** Eşik ölçüldü:
//      dört koşuda en yüksek boş-geçme oranı %23, %15, %15 ve %22 çıktı
//      (hep `gauntlet` — dar pencere, hemen arkasında mayın; en çok yer
//      isteyen dizi), mayın %15-18 bandında. Kapı **%45**: ölçülen en
//      yüksek değerin iki katına yakın, yani gürültü onu düşürmüyor, ama
//      "parça artık hiçbir şey koymuyor" (%100'e yakın) rahatça
//      yakalanıyor.
//   3. Sayfa hatası yok.
// Yalnızca bu taramanın görebileceği parçalar: açılışı taramanın son
// bölümünden sonra olan bir parça "çıkmadı" diye düşerse kapı oyunu
// değil taramanın boyunu ölçer.
const gorulebilir = veri.parcalar.filter(p => p.minLevel <= SON);
const hicCikmayan = gorulebilir.filter(p => veri.topla[p.id].secildi === 0);
check(hicCikmayan.length === 0, 'havuzdaki her parça tahtaya çıkıyor',
  hicCikmayan.length ? hicCikmayan.map(p => `${p.id}@${p.minLevel}`).join(', ')
                     : `${gorulebilir.length}/${gorulebilir.length} (açılışı ${SON}. bölüme kadar olanlar)`);
const cokBos = engelli
  .map(p => ({ id: p.id, oran: veri.topla[p.id].bos / veri.topla[p.id].secildi }))
  .filter(x => x.oran > 0.45);
const enBos = engelli.length
  ? engelli.map(p => ({ id: p.id, oran: veri.topla[p.id].bos / veri.topla[p.id].secildi }))
      .sort((a, b) => b.oran - a.oran)[0]
  : null;
check(cokBos.length === 0, 'engelli parçalar engelini koyuyor',
  cokBos.length ? cokBos.map(x => `${x.id} %${Math.round(x.oran * 100)}`).join(', ')
                : enBos ? `en yüksek boş-geçme ${enBos.id} %${Math.round(enBos.oran * 100)}` : '');
check(hata.length === 0, 'sayfa hatası yok', hata[0] || '');

console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
process.exitCode = fails.length ? 1 : 0;
await br.close(); srv.close();
