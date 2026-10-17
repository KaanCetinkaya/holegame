// Dört istasyon da işe yarıyor mu? — hep darboğazı satın alan oyuncu.
//
//   node build-www.mjs && node scratchpad/tydenge.mjs
//   node scratchpad/tydenge.mjs tekyonlu   # ölçümü sahte dengesizlikle dene
//
// ## Neden var
//
// README'nin "Denge — üç deneme" bölümü oyunun çekirdek sayısını veriyor:
// *"Maliyetler 15/22/32/45 … Seviyeler 38/37/38/37'de kalıyor ve darboğaz hat
// boyunca sürekli yer değiştiriyor."* O satır bir ölçümden geldi — ama ölçüm
// bir dosyada durmuyordu.
//
// `scratchpad/tycoon*.mjs` o denemelerin kendisi ve altısında **tek bir
// iddia yok**: tablo basıyorlar, çıkış kodu sıfır. Yani bugün maliyet
// eğrilerinden biri değişse (ya da `baseRate`, ya da ürün fiyatı) seviyeler
// 38/37/38/37'den 14/5/4/2'ye dönebilir ve takımın hiçbir satırı bunu
// söylemez. İkinci denemede tam bu olmuştu: paranın yarısı, aşağısının
// kullanamayacağı kadar hızlı olan Döküm'e gidiyordu.
//
// Bu dosya o iddiayı kapıya çeviriyor.
//
// ## Ölçülen şey
//
// Oyuncu README'nin tarif ettiği oyuncu: yirmi saniye bekle, ekranın
// söylediği darboğazı al, tekrar. Taşıyıcı kusursuz (`jeAutoCarry`), yani
// ölçülen şey işçinin elinin çabukluğu değil zincirin ekonomisi.
//
// Üç şey birden, çünkü biri tek başına yetmiyor:
//
//   1. **Dört istasyon da tırmanıyor.** Son seviyeler birbirine yakın
//      olmalı. İkinci denemenin hatası tam buydu: 14/5/4/2.
//   2. **Darboğaz yer değiştiriyor.** Hep aynı istasyon darboğazsa oyun tek
//      düğmeli bir oyundur; dördünün de sırası gelmeli.
//   3. **Hiçbir istasyon başlangıç seviyesinde kalmıyor.** Birinci şart
//      oranla bakıyor, bu mutlak: 2. seviyede donmuş bir istasyon, oranın
//      içinde kaybolabilir.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) {
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } else { r.writeHead(404); r.end('no'); }
}).listen(8620);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = [];
pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
await pg.goto('http://localhost:8620/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 30000 });
// Çizim kapalı: ölçülen şey zincirin ekonomisi, ekrandaki fabrika değil.
// `jeRun` benzetimi doğrudan ilerletiyor, yani kareler yalnızca arka planda
// boşa çiziliyordu.
await pg.evaluate(() => window.jeDrawOff(true));
// Taşıyıcı kusursuz: işçi oyuna girdikten sonra bu bayrak olmadan sahte
// oyuncu hiçbir şey taşımıyor ve ölçüm ölü bir zincire bakıyor.
await pg.evaluate(() => window.jeAutoCarry(true));

const ISTASYON = ['Foundry', 'Stamping', 'Assembly', 'Dispatch'];
// Sahte dengesizlik: ölçümün gerçekten dengesizlik gördüğünü kanıtlamak için.
//
// "Geçmesi gereken yerde geçmek yetmez." `tekyonlu` modunda oyuncu darboğazı
// değil **her zaman Döküm'ü** alıyor — yani ikinci denemenin hatasının
// elle kurulmuş hâli. Üç şartın da düşmesi bekleniyor.
const TEKYONLU = process.argv[2] === 'tekyonlu';
const ADIM = 20;          // saniye, bir turda ilerletilen oyun süresi
const TUR = 150;          // 150 x 20 = 3000 saniye oyun süresi (50 dakika)

const iz = [];
const darbogazlar = [];
for (let t = 0; t < TUR; t++) {
  const r = await pg.evaluate(([sn, tek, adlar]) => {
    window.jeRun(sn);
    const p = window.jeProbe();
    const i = tek ? 0 : adlar.indexOf(p.neck);
    if (i >= 0) window.jeBuy(i, 'max');
    const s = window.jeProbe();
    return { neck: p.neck, alinan: i, lvl: s.lvl, income: s.income, cash: s.cash };
  }, [ADIM, TEKYONLU, ISTASYON]);
  darbogazlar.push(r.neck);
  if (t % 15 === 0 || t === TUR - 1) iz.push({ t: (t + 1) * ADIM, ...r });
}

const fmt = n => n >= 1e9 ? (n / 1e9).toFixed(1) + 'B'
  : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M'
  : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : n.toFixed(0);

console.log(`\n${TEKYONLU ? 'TEKYÖNLÜ DENEME: oyuncu hep Döküm alıyor' : 'oyuncu: hep darboğazı alıyor'}` +
  ` · ${TUR * ADIM} saniye oyun süresi`);
console.log('\n  saniye  seviyeler          darboğaz   gelir/sn');
console.log('  ------+-------------------+----------+----------');
for (const r of iz) {
  console.log(`  ${String(r.t).padStart(6)}  ${r.lvl.join('/').padEnd(18)} ${r.neck.padEnd(9)}  ${fmt(r.income)}`);
}

const son = iz[iz.length - 1].lvl;
const enAz = Math.min(...son), enCok = Math.max(...son);
// Darboğazın kaç kez el değiştirdiği ve kaç ayrı istasyonu gördüğü.
let degisim = 0;
for (let i = 1; i < darbogazlar.length; i++) if (darbogazlar[i] !== darbogazlar[i - 1]) degisim++;
const gorulen = new Set(darbogazlar);

const fails = [];
const check = (ok, ne, ek = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ne}${ek ? '   ' + ek : ''}`);
  if (!ok) fails.push(`${ne} ${ek}`);
};
console.log('');

// ## Eşikler
//
// Üç koşu ölçüldü ve üçü **birebir** aynı çıktı — benzetim rastgelelik
// taşımıyor, `jeRun` saf bir ilerletme:
//
//   seviyeler 137/168/168/168 · en düşük/en yüksek %82
//   darboğaz 4 istasyonu da gördü, 118 el değişimi
//
// Sahte dengesizlikte (`tekyonlu`): 60/1/1/1 · oran %2 · darboğaz tek
// istasyonda, 0 el değişimi. İki küme arasında kapanacak bir aralık yok,
// yani eşikler ortada duruyor.
//
// Not: README'nin "Seviyeler 38/37/38/37'de kalıyor" satırı o günün sayısı
// ve bugün 137/168/168/168. Oyun o günden sonra prestij, araştırma ve ürün
// kademeleri kazandı; korunması gereken şey o üç haneli sayı değil,
// **iddianın kendisi** — dördü birden tırmanıyor ve darboğaz dolaşıyor.
// Eşikler o yüzden orana ve el değişimine bakıyor, mutlak seviyeye değil.
const ORAN = 0.6;         // en düşük seviye, en yükseğin en az bu kadarı
const EL_DEGISIM = 8;     // darboğaz en az bu kadar el değiştirmeli
const EN_AZ_SEVIYE = 5;   // hiçbir istasyon başlangıçta donmamalı

check(enCok > 0 && enAz >= enCok * ORAN, 'dört istasyon da tırmanıyor',
  `${son.join('/')} · en düşük, en yükseğin %${Math.round(enAz / Math.max(1, enCok) * 100)}'i`);
check(gorulen.size >= 3 && degisim >= EL_DEGISIM, 'darboğaz hat boyunca yer değiştiriyor',
  `${gorulen.size} istasyon, ${degisim} el değişimi: ${[...gorulen].join(', ')}`);
check(enAz >= EN_AZ_SEVIYE, 'hiçbir istasyon başlangıç seviyesinde kalmıyor',
  `en düşük seviye ${enAz}`);

console.log(`\nsayfa hataları: ${errs.length ? errs[0] : 'yok'}`);
if (errs.length) fails.push('sayfa hatası: ' + errs[0]);

if (TEKYONLU) {
  // Sahte dengesizlikte ölçümün kendisi sınanıyor: düşmesi gerekiyor.
  console.log(`\nsahte dengesizlik denemesi: ${fails.length}/3 şart düştü`);
  console.log(fails.length >= 2
    ? 'ölçüm dengesizliği yakalıyor'
    : 'ÖLÇÜM KÖR: oyuncu tek istasyon aldığı hâlde denge şartları geçti');
  process.exitCode = fails.length >= 2 ? 0 : 1;
} else {
  console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
  process.exitCode = fails.length ? 1 : 0;
}
await br.close(); srv.close();
