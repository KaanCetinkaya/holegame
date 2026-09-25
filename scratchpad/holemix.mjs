// Tahtanın kaçta kaçı iri meyve?
//
//   node build-www.mjs && node scratchpad/holemix.mjs
//
// Neden var: "meyveler diğer oyunlardakinden küçük duruyor" gözle görüldü ve
// doğru çıktı — ölçüldüğünde sıradan bir meyve ekran genişliğinin %9'u,
// tür liderlerinde nesneler ekranın üçte biri kadar. Ama "büyüt" tek başına
// bir sayı vermiyor: desenlerin `big` kuralı desenden desene bambaşka, kimi
// hiç büyük vermiyor, kimi blob eşiğiyle veriyor. Oran hiç sayılmamıştı.
//
// Bu dosya her desen için sayıyor ve bir alt sınır bekliyor: hiçbir bölüm
// baştan sona ufak meyveden ibaret olmamalı. Eşik keyfî değil — iri payı
// düşük olan desenler tam da ekran görüntüsünde "halı gibi" duranlar.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((req, res) => {
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-fruithole' + p);
    res.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8294);

// Tarla tohumlanıyor: tohumsuz bırakılınca aynı bölüm her çalıştırmada başka
// bir dağılım veriyor ve eşik koyan bir testin geçmesi zara bağlı kalıyor.
const EN_AZ = 0.08;   // her desende en az bu kadar iri meyve
// Hücre başına bu kadar parça varsa desen bir kule deseni sayılıyor.
const KULE_KAT = 5;

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
await pg.goto('http://localhost:8294/', { waitUntil: 'domcontentloaded' });
await pg.waitForFunction(() => window.fruitHoleMix, { timeout: 60000 });
await pg.evaluate(() => window.fruitHoleSeedField && window.fruitHoleSeedField(7));

const fails = [];
let tToplam = 0, tIri = 0;
// Resim bölümleri bu ölçünün dışında.
//
// Ölçülen şey tahtanın "halı gibi" okunması: tek boy meyveden ibaret bir
// ızgara doku oluyor ve bakılacak bir yer bırakmıyor, yani oyuncu nerede
// süpürdüğünü bilemiyor. Resim tahtasında her parça **bilerek** aynı boyda —
// boncukların eşitliği resmi okutan şey — ve bakılacak yer resmin kendisi.
// Kural oraya uygulanınca "iri payı %0, halı" diyor ve tam tersini söylemiş
// oluyor.
const resimler = new Set(
  (await pg.evaluate(() => window.fruitHolePictures())).levels);

console.log(' bölüm  desen           toplam  sıradan  büyük  dev   iri payı');
for (let n = 1; n <= 24; n++) {
  if (resimler.has(n)) continue;
  const d = await pg.evaluate(lv => {
    const p = window.fruitHoleProbe(lv);
    return { ad: p.pattern, ...window.fruitHoleMix() };
  }, n);
  tToplam += d.toplam; tIri += d.buyuk + d.dev;
  // Tahtası yüksek kulelerden ibaret olan desenler muaf.
  //
  // İri meyve yüksek bir sütunda kuleyi bozuyor — Pillars'ın sütunları 7, 18,
  // 21 ve 12 katlı ve iri parça karışınca ekranda üst üste binip geçilmez bir
  // şeride dönüyorlardı (`holepillar.mjs` ölçtü: en dar aralık -231 piksel).
  // O yüzden iri taban oraya bilerek konmuyor, ve düşük iri payı orada bir
  // hata değil tasarım. Muafiyet isimle değil **ölçüyle**: hücre başına
  // ortalama kat sayısı.
  const kuleDesen = d.ortKat >= KULE_KAT;
  const bayrak = d.iriPay < EN_AZ ? (kuleDesen ? '  (kule deseni, muaf)' : '  <-- halı') : '';
  console.log(`  ${String(n).padStart(2)}    ${d.ad.padEnd(14)} ${String(d.toplam).padStart(5)} ` +
    `${String(d.siradan).padStart(8)} ${String(d.buyuk).padStart(6)} ${String(d.dev).padStart(4)}` +
    `   %${(d.iriPay * 100).toFixed(1).padStart(5)}  ${d.ortKat.toFixed(1)} kat${bayrak}`);
  if (d.iriPay < EN_AZ && !kuleDesen) fails.push(`${n}. bölüm (${d.ad}): iri payı %${(d.iriPay * 100).toFixed(1)}`);
}
console.log(`\nızgara bölümlerinin ortalaması: %${(tIri / tToplam * 100).toFixed(1)} iri`);
console.log(fails.length
  ? `\niri payı %${EN_AZ * 100} altında kalan desenler:\n - ` + fails.join('\n - ')
  : '\nhepsi geçti');
await br.close(); srv.close();
process.exit(fails.length ? 1 : 0);
