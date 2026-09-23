// Kayalar: tahtayı kapatmıyorlar mı, ve gerçekten durduruyorlar mı?
//
//   node build-www.mjs && node scratchpad/holerock.mjs
//
// Neden var: kaya oyunun **ilk çarpışması**. O ana kadar delik tahtadaki her
// şeyin altından geçiyordu, yani "geçilemeyen yer" diye bir kavram yoktu — ve
// bir engelin iki şekilde sessizce felaket olması mümkün:
//
//   1. Tahtayı kapatabilir. İki kaya, en geniş ağzın geçemeyeceği kadar
//      yakınsa ya da biri kenara yapışmışsa, arkada kalan meyveye hiç
//      ulaşılamaz ve bölüm bitirilemez. Oyun bunu hata olarak göstermiyor:
//      saat doluyor, oyuncu kaybediyor, sebep görünmüyor.
//   2. Hiç durdurmayabilir. Çarpışma tek satır ve sessizce yanlış tarafa
//      düşerse kaya bir süs olur; ekran görüntüsünden anlaşılmaz.
//
// İkisi de sayıyla ölçülüyor: aradaki boşluk ağız tavanıyla, itme de deliği
// kayanın içine koymayı deneyerek.
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
}).listen(8298);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = [];
pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
await pg.goto('http://localhost:8298/', { waitUntil: 'domcontentloaded' });
await pg.waitForFunction(() => window.fruitHoleRocks, { timeout: 60000 });

const fails = [];
const check = (ok, ad, not = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ad}${not ? '   ' + not : ''}`);
  if (!ok) fails.push(ad + (not ? ' — ' + not : ''));
};

console.log('bölüm başına kaya:');
const satir = [];
for (const n of [1, 5, 8, 9, 13, 19, 24, 40]) {
  const d = await pg.evaluate(lv => {
    window.fruitHoleProbe(lv);
    return window.fruitHoleRocks();
  }, n);
  satir.push({ n, ...d });
  console.log(`  ${String(n).padStart(2)}. bölüm — ${String(d.sayi).padStart(2)} kaya · ` +
    `en yakın ikili ${d.enYakinIkili ?? '-'} · kenara ${d.kenara ?? '-'} · ` +
    `doğuşa ${d.dogusaEnYakin ?? '-'}`);
}

const tavan = satir[0].agizTavani;
const erken = satir.filter(r => r.n < 9);
const gec = satir.filter(r => r.n >= 9);
check(erken.every(r => r.sayi === 0), 'dokuzuncu bölümden önce kaya yok',
  `en çok ${Math.max(...erken.map(r => r.sayi))}`);
check(gec.every(r => r.sayi > 0), '9. bölümden sonra her tahtada kaya var',
  `en az ${Math.min(...gec.map(r => r.sayi))}`);

// Geçit: en geniş ağız (çap = 2 × tavan) iki kayanın arasından geçebilmeli.
const ikili = gec.filter(r => r.enYakinIkili != null);
if (ikili.length) {
  const enDar = Math.min(...ikili.map(r => r.enYakinIkili - r.yerler[0].r * 2));
  check(enDar > tavan * 2, 'iki kayanın arası en geniş ağızdan geniş',
    `en dar geçit ${enDar.toFixed(2)}, ağız çapı ${(tavan * 2).toFixed(2)}`);
}
check(gec.every(r => r.kenara > tavan), 'kenarla kaya arasında ağız geçiyor',
  `en dar ${Math.min(...gec.map(r => r.kenara)).toFixed(2)}`);
check(gec.every(r => r.dogusaEnYakin > tavan + 1), 'kaya deliğin doğduğu yerde değil',
  `en yakın ${Math.min(...gec.map(r => r.dogusaEnYakin)).toFixed(2)}`);

// Çarpışma: deliği kayanın tam ortasına ve kenarına koymayı dene.
console.log('\nçarpışma:');
const it = await pg.evaluate(() => {
  window.fruitHoleProbe(19);
  const k = window.fruitHoleRocks();
  const r = k.yerler[0];
  const kucuk = window.fruitHolePushTest(r.x, r.z, 0.55);
  const kucukD = Math.hypot(kucuk.x - r.x, kucuk.z - r.z);
  // Büyük ağız daha uzaktan durmalı: kaya toprağa çakılı, ağzın kenarı onun
  // dibine değiyor.
  const buyuk = window.fruitHolePushTest(r.x, r.z, 2.75);
  const buyukD = Math.hypot(buyuk.x - r.x, buyuk.z - r.z);
  // Uzaktaki bir noktaya dokunulmamalı.
  const uzak = window.fruitHolePushTest(r.x + 9, r.z, 0.55);
  return { r, kucukD: +kucukD.toFixed(2), buyukD: +buyukD.toFixed(2),
           uzakSapma: +Math.hypot(uzak.x - (r.x + 9), uzak.z - r.z).toFixed(3) };
});
console.log(`  kaya yarıçapı ${it.r.r} · küçük ağız ${it.kucukD} birimde duruyor · ` +
  `en geniş ağız ${it.buyukD} birimde`);
// Beklenen mesafe kayanın ve ağzın yarıçapının toplamı. Eşiği elle yazmak
// yuvarlamaya takılıyordu (1.18 >= 1.1800000000000002 yanlış), o yüzden
// beklenen değer hesaplanıp küçük bir pay bırakılıyor.
const beklenen = it.r.r + 0.55;
check(it.kucukD >= beklenen - 0.02, 'kaya küçük ağzı da dışarıda tutuyor',
  `${it.kucukD} birim, beklenen ${beklenen.toFixed(2)}`);
check(it.buyukD > it.kucukD + 1.5, 'geniş ağız daha uzaktan durduruluyor',
  `${it.kucukD} -> ${it.buyukD}`);
check(it.uzakSapma < 0.001, 'kayadan uzaktaki delik itilmiyor',
  `${it.uzakSapma} birim kaydı`);

if (errs.length) fails.push('sayfa hatası: ' + errs[0]);
console.log('\n' + (fails.length ? 'hatalar:\n - ' + fails.join('\n - ') : 'hepsi geçti'));
await br.close(); srv.close();
process.exit(fails.length ? 1 : 0);
