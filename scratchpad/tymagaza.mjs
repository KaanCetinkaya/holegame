// Mağaza ekranı, Play ürünleri tanımadığında ne yapıyor?
//
// `tysatin.mjs` teslimatı ölçüyor: alınan şey veriliyor mu. Bu betik
// bir önceki adımı ölçüyor — **alınamadığında** ekranda ne yazıyor.
//
// Sebebi: Play Console'da ürün kimlikleri açılmadan `getProducts` boş
// dönüyor, satın alma çağrısı hata veriyor ve oyuncunun dokunuşu hiçbir
// şey yapmıyor. Eski hâlde satırlar yine de `$2.99` yazıp satın
// alınabilir görünüyordu: bu depoda birkaç kez görülen "ekranda duruyor
// ama kullanılamıyor" sınıfının tam örneği. Üstelik ürünler Play'de
// ₺ cinsinden; doları gören oyuncu zaten yanlış sayıyı görüyordu.
//
// İkincisi daha pahalı: `purchase()` eklenti yokken true dönüyordu, yani
// NativePurchases derlemenin dışında kalmış bir APK üç ürünü de **bedava**
// dağıtırdı. Capacitor eklentileri `node_modules`'tan okunuyor ve
// kurulmamış eklenti derlemeyi bozmuyor — bu kaza bu depoda bir kere oldu.
//
// `jeIapSim(mod)` cihazın dört hâlini tarayıcıda kuruyor:
//   tarayici · eklentisiz · urunsuz · hazir
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8661);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8661/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 60000 });
await pg.evaluate(() => { document.getElementById('dOk')?.click(); window.jeTutSkip(); });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

const sifirla = () => pg.evaluate(() => {
  window.jeWipeProgress(); window.jeTutSkip();
  document.getElementById('shopBtn').click();
});

console.log('\n1) Dört hâlde satır sayıları');
const hal = {};
for (const mod of ['tarayici', 'eklentisiz', 'urunsuz', 'hazir']) {
  await sifirla();
  hal[mod] = await pg.evaluate(m => window.jeIapSim(m), mod);
  const s = hal[mod];
  console.log(`     ${mod.padEnd(11)} satır ${s.satir} · kapalı ${s.kapaliSatir} · pasif ${s.pasif}` +
              ` · not ${s.not ? '"' + s.not.slice(0, 28) + '…"' : 'yok'}`);
}
ok(Object.values(hal).every(s => s.satir === 3), 'her hâlde üç satır var');
ok(hal.tarayici.kapaliSatir === 0, 'tarayıcıda hepsi açık');
ok(hal.hazir.kapaliSatir === 0, 'her şey yerindeyken hepsi açık');
ok(hal.eklentisiz.kapaliSatir === 3, 'eklenti yokken üçü de kapalı');
ok(hal.urunsuz.kapaliSatir === 3, 'Play ürünleri tanımıyorsa üçü de kapalı');
ok(hal.eklentisiz.pasif === 3 && hal.urunsuz.pasif === 3,
   'kapalı satırlara dokunulamıyor');
ok(!!hal.urunsuz.not && !!hal.eklentisiz.not, 'kapalıyken sebep yazıyor');
ok(hal.tarayici.not === null && hal.hazir.not === null,
   'açıkken boşuna not yazmıyor');

console.log('\n2) Kapalı satır fiyat yerine ne yazıyor');
// Yanlış para biriminde bir fiyat, satın alınabilir sanılan bir satırdan
// daha kötü: oyuncu $2.99 görüp ₺99 ödediğini sanıyor.
await sifirla();
const yazi = await pg.evaluate(() => {
  const al = m => {
    window.jeIapSim(m);
    return [...document.querySelectorAll('#shopList .prod')]
      .map(b => b.querySelector('.ppr').textContent);
  };
  return { kapali: al('urunsuz'), acik: al('hazir') };
});
console.log(`     kapalı: ${yazi.kapali.join(' · ')}`);
console.log(`     açık  : ${yazi.acik.join(' · ')}`);
ok(yazi.kapali.every(t => !t.includes('$')), 'kapalı satırda fiyat yazmıyor');
ok(yazi.acik.every(t => t.includes('$')), 'açık satırda fiyat yazıyor');

console.log('\n3) Bedava dağıtmıyor');
// En pahalı hata buydu: eklentisi eksik bir APK'da `purchase()` true
// dönüyor ve "dört müdür" bedava geliyordu.
const bedava = await pg.evaluate(async () => {
  const dene = async m => {
    window.jeWipeProgress(); window.jeTutSkip();
    window.jeIapSim(m);
    await window.jeBuyProduct('motorworks_managers');
    const s = window.jeShop();
    return { sahip: s.urunler.find(u => u.id === 'motorworks_managers').sahip,
             mudur: window.jeProbe().mgr.filter(Boolean).length };
  };
  return { tarayici: await dene('tarayici'), eklentisiz: await dene('eklentisiz'),
           urunsuz: await dene('urunsuz'), hazir: await dene('hazir') };
});
for (const [m, d] of Object.entries(bedava))
  console.log(`     ${m.padEnd(11)} sahip ${d.sahip} · müdür ${d.mudur}`);
ok(bedava.tarayici.sahip, 'tarayıcıda akış yürüyor (geliştirme kolaylığı)');
ok(!bedava.eklentisiz.sahip && bedava.eklentisiz.mudur === 0,
   'eklenti yokken HİÇBİR ŞEY verilmiyor');
ok(!bedava.urunsuz.sahip && bedava.urunsuz.mudur === 0,
   'Play tanımıyorken hiçbir şey verilmiyor');
ok(!bedava.hazir.sahip,
   'eklenti çağrısı hata verirse de hiçbir şey verilmiyor');

console.log('\n4) Alınmış ürün kapalıyken de "ALINDI" kalıyor');
// Uçakta mağazayı açan, parasını ödediği şeyi "KAPALI" görmemeli.
const sahipli = await pg.evaluate(async () => {
  window.jeWipeProgress(); window.jeTutSkip();
  window.jeIapSim('tarayici');
  await window.jeBuyProduct('motorworks_double');
  window.jeIapSim('urunsuz');
  const satir = [...document.querySelectorAll('#shopList .prod')];
  return { sinif: satir.map(b => b.className),
           yazi: satir.map(b => b.querySelector('.ppr').textContent),
           carpan: window.jeShop().carpan };
});
console.log(`     ${sahipli.yazi.join(' · ')}`);
ok(sahipli.sinif[0].includes('owned') && !sahipli.sinif[0].includes('off'),
   'alınmış ürün "kapalı" değil, "alındı"', sahipli.sinif[0]);
ok(sahipli.carpan === 2, 'alınan şey çalışmaya devam ediyor');

console.log('\n5) İki dilde de sebep yazıyor');
// Dil `langBtn` ile değişiyor; `jeDil()` yalnızca okuyor.
const dil = await pg.evaluate(() => {
  window.jeWipeProgress(); window.jeTutSkip();
  const al = () => { window.jeIapSim('urunsuz');
                     return { d: window.jeDil().dil, not: window.jeShop().not }; };
  const bir = al();
  document.getElementById('langBtn').click();
  const iki = al();
  return { bir, iki };
});
const metin = {};
for (const h of [dil.bir, dil.iki]) metin[h.d ? 'tr' : 'en'] = h.not;
console.log(`     en: ${metin.en}`);
console.log(`     tr: ${metin.tr}`);
ok(metin.en && metin.tr && metin.en !== metin.tr, 'iki dilde ayrı metin');
ok(!/[şçğıİöü]/.test(metin.en || 'ş'), 'İngilizce metinde Türkçe harf yok');
ok(/[şçğıİöü]/.test(metin.tr || ''), 'Türkçe metin gerçekten Türkçe');

console.log('\n6) Verecek şeyi kalmamış ürün');
// "Dört müdür" ürünü, dördünü zaten işe almış oyuncuya satılmaya devam
// ediyordu: para alınıyor, karşılığında hiçbir şey verilmiyor. Müdürler
// devirde korunduğu için bu bir kere olunca kalıcı.
const bos = await pg.evaluate(async () => {
  const kur = kac => {
    window.jeWipeProgress(); window.jeTutSkip();
    window.jeIapSim('tarayici');
    window.jeGive(1e12);
    for (let i = 0; i < kac; i++) window.jeGiveManager(i);
    document.getElementById('shopBtn').click();
    window.jeIapSim('tarayici');            // yeniden çiz
    const s = window.jeShop();
    const u = s.urunler.find(x => x.id === 'motorworks_managers');
    const i = s.urunler.findIndex(x => x.id === 'motorworks_managers');
    const b = document.querySelectorAll('#shopList .prod')[i];
    return { gereksiz: u.gereksiz, pasif: b.disabled, sinif: b.className,
             yazi: b.querySelector('.ppr').textContent, not: s.not };
  };
  const uc = kur(3);
  const dort = kur(4);
  // Satın almayı zorlamak da işe yaramamalı.
  const once = window.jeProbe().cash;
  await window.jeBuyProduct('motorworks_managers');
  const sahip = window.jeShop().urunler.find(x => x.id === 'motorworks_managers').sahip;
  return { uc, dort, sahip, kasa: window.jeProbe().cash - once };
});
console.log(`     üç müdür : gereksiz ${bos.uc.gereksiz} · "${bos.uc.yazi}" · pasif ${bos.uc.pasif}`);
console.log(`     dört müdür: gereksiz ${bos.dort.gereksiz} · "${bos.dort.yazi}" · pasif ${bos.dort.pasif}`);
ok(!bos.uc.gereksiz && !bos.uc.pasif, 'üç müdürle hâlâ satılıyor');
ok(bos.dort.gereksiz && bos.dort.pasif, 'dördü varken satılmıyor');
ok(bos.dort.yazi !== bos.uc.yazi && !bos.dort.yazi.includes('$'),
   'fiyat yerine sebebi yazıyor', bos.dort.yazi);
ok(bos.dort.not === null, '"bağlantını kontrol et" notu çıkmıyor', String(bos.dort.not));
ok(!bos.sahip, 'zorla satın alma da reddediliyor');

console.log('\n7) Not ekrana sığıyor');
const tasma = await pg.evaluate(() => {
  window.jeWipeProgress(); window.jeTutSkip();
  window.jeIapSim('urunsuz');
  const n = document.getElementById('shopNote');
  const l = document.getElementById('shopList');
  return { tasti: n.scrollWidth > l.clientWidth + 1,
           yukseklik: n.getBoundingClientRect().height,
           ekranTasti: document.getElementById('shop').scrollWidth > innerWidth + 1 };
});
console.log(`     not yüksekliği ${tasma.yukseklik.toFixed(0)}px`);
ok(!tasma.tasti, 'not yatayda taşmıyor');
ok(!tasma.ekranTasti, 'mağaza ekranı yatayda taşmıyor');

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
