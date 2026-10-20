// Tur başındaki satır: doğru anda mı çıkıyor, bir kez mi, ve sığıyor mu?
//
//   node build-www.mjs && node scratchpad/slipucu.mjs
//
// ## Neden var
//
// Satır her turda aynı cümleyi yazıyordu — "Slide your finger up and
// down" — ve kırkıncı bölümde o cümle bir şey söylemiyor. Artık üç
// durumdan birini söylüyor: kontrol satırı (ilk üç bölüm), yeni bir
// parçanın tanıtımı (parçanın açılış bölümünde, bir kez), ya da hiçbir
// şey.
//
// Ölçülmesinin sebebi, tanıtımın **sessizce kaybolabilecek** bir şey
// olması. Ekranda 2.6 saniye duruyor ve yalnızca bir kez: bir parçanın
// açılış bölümü kayarsa, ya da "görüldü" kaydı yanlış yazılırsa, hiç
// çıkmadığını kimse fark etmez. Oyunda bunun bir örneği zaten var —
// `holeboss`un yakaladığı final, aylarca hiç görünmedi.
//
// Beş kapı:
//
//   1. Tanıtımı olan her parça, kendi açılış bölümünde satırı veriyor.
//      Bölüm numarası buraya yazılmıyor, `slicePieces()`ten okunuyor.
//   2. Yeni oyuncu kontrol satırını görüyor.
//   3. Tanıtım bölümü olmayan turda satır **susuyor** — yoksa yeni bir şey
//      söylenecek yer, okunmayı bırakmış bir satır olurdu.
//   4. İkinci kez aynı bölüme girince tanıtım **tekrar çıkmıyor**.
//   5. Satır en dar telefonda tek satıra sığıyor ve kutudan taşmıyor.
//
// Ölçümün kendisi üç kez yanlış kuruldu ve üçü de dosyanın içinde
// yazılı: yanlış dünyada denemek (`sliceStart` `maxLevel`i taşımıyor),
// cümle yerine görünürlüğe bakmak, ve kutuyu ölçerken kendi bıraktığı
// yazıyı ölçmek.
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
}).listen(8625);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
// En dar makul telefon. Mağaza kareleri 412'de alınıyor ama satırın
// taşacağı yer burası.
const pg = await br.newPage({ viewport: { width: 360, height: 640 } });
const hata = [];
pg.on('pageerror', e => hata.push(String(e).split('\n')[0]));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8625/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.sliceIpucu === 'function', null, { timeout: 30000 });
await pg.evaluate(() => window.sliceDrawOff(true));

const parcalar = await pg.evaluate(() => window.slicePieces());
const tanitimi = await pg.evaluate(() => window.sliceIpucu().tanitimi);
const SON = parcalar.reduce((m, p) => Math.max(m, p.minLevel), 0) + 2;

// Kontrol satırı yeni oyuncuya, taze kayıtla.
const yeniOyuncu = await pg.evaluate(() => {
  window.sliceStart(1);
  const i = window.sliceIpucu();
  return i.gorunur ? i.yazi : null;
});

// Sonrası için kaydın **sınırı** ileri alınıyor, bölüm numarası değil.
//
// Kural `maxLevel`e bakıyor (oyuncunun geldiği yer), `level`e değil —
// birinci bölümü sonradan tekrar oynayan birine parmağını nasıl
// kaydıracağını anlatmak gerekmiyor. `sliceStart(n)` yalnızca `level`i
// taşıyor, yani onunla ölçmek kuralın hiç denenmediği bir dünya kurar:
// ilk hâlinde bu ölçüm kontrol satırını otuz sekiz bölümün otuz
// sekizinde gördü ve gördüğü şey oyunun davranışı değildi.
//
// Ve bu, sayfa **yeniden yüklenerek** yapılmak zorunda: `maxLevel` modül
// yüklenirken bir kez okunuyor. İlk denemede `evaluate` ile yazıldı ve
// hiçbir şey değişmedi, çünkü açılışta kurulan `addInitScript`
// localStorage'ı **her** gezinmede siliyor — yazılan değer yenilemenin
// kendisinde uçuyordu. İkinci bir init betiği, silmeden sonra çalışıp
// sınırı koyuyor.
await pg.addInitScript(() => localStorage.setItem('slicerush_level', '99'));
await pg.reload({ waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.sliceIpucu === 'function', null, { timeout: 30000 });
await pg.evaluate(() => window.sliceDrawOff(true));

const gorulen = [];
for (let n = 1; n <= SON; n++) {
  const r = await pg.evaluate((lvl) => {
    window.sliceStart(lvl);
    const i = window.sliceIpucu();
    return { yazi: i.gorunur ? i.yazi : null };
  }, n);
  gorulen.push({ n, yazi: r.yazi });
}

console.log(`\n  yeni oyuncu, 1. bölüm: ${yeniOyuncu ? `"${yeniOyuncu}"` : '— satır yok'}`);
console.log('\n  kaydın sınırı 99 — kontrol satırı artık çıkmamalı\n');
console.log('  blm | satır');
console.log('  ----+------------------------------------------');
for (const g of gorulen) if (g.yazi) console.log(`  ${String(g.n).padStart(3)} | ${g.yazi}`);
const sessiz = gorulen.filter(g => !g.yazi).length;
console.log(`  (${sessiz}/${gorulen.length} bölümde satır çıkmıyor)`);

const fails = [];
const check = (ok, ne, ek = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ne}${ek ? '   ' + ek : ''}`);
  if (!ok) fails.push(`${ne} ${ek}`);
};
console.log('');

// 1. Tanıtımı olan her parça kendi açılış bölümünde konuşuyor mu?
const bekleyen = parcalar.filter(p => tanitimi.includes(p.id));
const sessizParca = bekleyen.filter(p => {
  const g = gorulen.find(x => x.n === p.minLevel);
  return !g || !g.yazi;
});
check(sessizParca.length === 0, 'tanıtımı olan her parça açılış bölümünde konuşuyor',
  sessizParca.length ? sessizParca.map(p => `${p.id}@${p.minLevel}`).join(', ')
                     : bekleyen.map(p => `${p.id}@${p.minLevel}`).join(' '));
check(!!yeniOyuncu, 'yeni oyuncu kontrol satırını görüyor', yeniOyuncu || '');
// Tanıtım bölümü olmayan yerlerde satır susmalı: kırkıncı bölümde
// parmağın nasıl kaydırılacağını yazmak, okunmayı bırakmış bir satır
// demek — ve yeni bir şey söylenecek yer orası.
const acilislar = new Set(bekleyen.map(p => p.minLevel));
const gereksiz = gorulen.filter(g => g.yazi && !acilislar.has(g.n));
check(gereksiz.length === 0, 'tanıtım bölümü olmayan turda satır susuyor',
  gereksiz.slice(0, 5).map(g => `${g.n}: "${g.yazi}"`).join(' · '));
// Tanıtımı olmayan parçalar bir eksiklik değil, bir karar: demir orada
// duruyor, mayın orada duruyor — tek kareye bakılınca anlaşılıyorlar.
// Tabloya yazılıyor, kapı kurulmuyor.
const sessizKalan = parcalar.filter(p => !tanitimi.includes(p.id)).map(p => p.id);
console.log(`  --   tanıtımı olmayan parçalar (karar): ${sessizKalan.join(', ')}`);

// 2. İkinci kez aynı bölüme girince susuyor mu?
const ikinci = [];
for (const p of bekleyen) {
  const ilk = (gorulen.find(g => g.n === p.minLevel) || {}).yazi;
  const r = await pg.evaluate((lvl) => {
    window.sliceStart(lvl);
    const i = window.sliceIpucu();
    return i.gorunur ? i.yazi : null;
  }, p.minLevel);
  // Karşılaştırma **aynı cümleye**: "bir şey yazıyor" yetmez, yazan
  // şeyin o tanıtım olup olmadığı önemli. İlk hâli yalnızca görünürlüğe
  // bakıyordu ve kontrol satırını tanıtım sanıp altı kez düştü.
  if (r && r === ilk) ikinci.push(`${p.id}@${p.minLevel}: "${r}"`);
}
check(ikinci.length === 0, 'tanıtım ikinci kez çıkmıyor', ikinci.join(' · '));

// 3. Kutuya sığıyor mu? Ölçü elle yazılmış bir karakter sayısı değil,
// elemanın **gerçek** genişliği: yazı tipi, dolgu ve ekran genişliği
// birlikte karar veriyor ve üçü de değişebilir.
const tasan = [];
// Ölçülen şey **yazının kendisi**, oyunun o anki hâli değil: kutuya
// sığmak bir yerleşim sorusu. İlk hâli her parça için `sliceStart`
// çağırıp kutuya bakıyordu ve altı satırın altısında aynı cümleyi
// ölçtü — tanıtım bir kez çıktığı için kutuda son yazan cümle
// kalıyordu. Kendi kendini ölçen bir kapı, geçmesi bir şey söylemeyen
// bir kapıdır.
for (const p of bekleyen) {
  const metin = (gorulen.find(g => g.n === p.minLevel) || {}).yazi;
  if (!metin) continue;
  const r = await pg.evaluate((yazi) => {
    const el = document.getElementById('hint');
    el.textContent = yazi;
    el.classList.add('show');
    const k = el.getBoundingClientRect();
    // Satır yüksekliği `normal` olabiliyor ve `parseFloat` orada NaN
    // veriyor — ilk hâli bu yüzden "NaN satır" basıyordu, yani kapı
    // hiçbir şeyi karşılaştırmıyordu. Tek satırın yüksekliği ölçülüyor:
    // tek kelimelik bir yazıyla, sonra gerçek yazı geri konuyor.
    el.textContent = 'x';
    const tek = el.getBoundingClientRect().height || 1;
    el.textContent = yazi;
    return { ekran: window.innerWidth, yazi,
             // Kutu şeridin tamamını kaplıyor, yani genişliğine bakmak
             // hiçbir şey söylemez — her zaman ekran kadar. Taşma
             // `scrollWidth`te ve satır sayısında görünüyor.
             tasma: el.scrollWidth - el.clientWidth,
             satir: Math.round(k.height / tek) };
  }, metin);
  console.log(`  --   ${p.id.padEnd(9)} ${r.satir} satır · taşma ${r.tasma}px · ${r.ekran}px ekran  "${r.yazi}"`);
  if (r.tasma > 0 || r.satir > 1) tasan.push(`${p.id} ${r.satir} satır, taşma ${r.tasma}px`);
}
check(tasan.length === 0, `satır ${360}px ekranda tek satıra sığıyor`, tasan.join(' · '));
check(hata.length === 0, 'sayfa hatası yok', hata[0] || '');

console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
process.exitCode = fails.length ? 1 : 0;
await br.close(); srv.close();
