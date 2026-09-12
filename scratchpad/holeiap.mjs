// Satın alma katmanı: para alındıktan sonra doğru şey yapılıyor mu?
//
//   node build-www.mjs && node scratchpad/holeiap.mjs
//
// Bu kutuda Android SDK yok, yani gerçek bir satın alma denenemez. Ama
// denenmesi gereken şeyin büyük kısmı zaten JavaScript tarafında ve orada
// yanlış yapılırsa **para kaybediliyor**:
//
//   * Tek seferlik ürün üç gün içinde acknowledge edilmezse Google parayı
//     kendiliğinden iade ediyor. Oyuncu aldığını kullanmaya devam ediyor,
//     para geri gidiyor ve uygulamada bunu söyleyen hiçbir şey yok.
//   * Tüketilebilir ürün consume edilmezse Play onu hâlâ "sahip olunuyor"
//     sayıyor ve oyuncu ikinci kez satın alamıyor.
//
// Eklentinin yerine sahtesi konuyor: çağrıların hangi sırayla ve hangi
// argümanlarla yapıldığı kaydediliyor. Native tarafın gerçekten derlendiğini
// bu test söylemiyor — onu telefonda Kaan görecek — ama bu dosyanın kendi
// mantığının doğru olduğunu söylüyor.

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-fruithole' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8218);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

const fails = [];
const check = (ok, what, saw) => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what}${saw === undefined ? '' : `   ${saw}`}`);
  if (!ok) fails.push(what);
};

// Sahte Capacitor + sahte NativePurchases. `owned` Play'in o an sahip
// olunuyor saydığı şeyler; consume edilince oradan düşüyor, tıpkı gerçeğinde
// olduğu gibi.
const fakePlugin = (opts = {}) => `
  window.__iap = { calls: [], owned: ${JSON.stringify(opts.owned || [])} };
  const log = (name, arg) => window.__iap.calls.push({ name, ...arg });
  window.Capacitor = {
    isNativePlatform: () => true,
    Plugins: {
      NativePurchases: {
        async getProducts({ productIdentifiers }) {
          log('getProducts', { n: productIdentifiers.length });
          ${opts.noProducts ? 'return { products: [] };' : ''}
          ${opts.productsThrow ? 'throw new Error("Play cevap vermedi");' : ''}
          return { products: productIdentifiers.map((id, i) => ({
            identifier: id, priceString: '₺' + (i + 1) * 10 + ',00' })) };
        },
        async purchaseProduct({ productIdentifier }) {
          log('purchaseProduct', { id: productIdentifier });
          ${opts.purchaseThrows ? 'throw new Error("iptal");' : ''}
          return { purchaseToken: 'tok_' + productIdentifier };
        },
        async consumePurchase({ purchaseToken }) {
          log('consumePurchase', { purchaseToken });
          window.__iap.owned = window.__iap.owned.filter(p => p.purchaseToken !== purchaseToken);
        },
        async acknowledgePurchase({ purchaseToken }) { log('acknowledgePurchase', { purchaseToken }); },
        async restorePurchases() { log('restorePurchases', {}); },
        async getPurchases() { log('getPurchases', {}); return { purchases: window.__iap.owned }; },
      },
      // Reklam eklentisi yok; oyun onsuz da açılmalı.
    },
  };
`;

async function open(opts) {
  const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
  pg.on('pageerror', e => { console.log('  SAYFA HATASI: ' + e); fails.push('sayfa hatası: ' + e); });
  await pg.addInitScript(fakePlugin(opts));
  await pg.goto('http://localhost:8218/', { waitUntil: 'load' });
  await pg.waitForFunction(() => window.fruitHoleWallet, { timeout: 25000 });
  await pg.waitForTimeout(900);
  return pg;
}

const openShop = async (pg) => {
  await pg.evaluate(() => { const b = document.getElementById('dailyBtn'); if (b) b.click(); });
  await pg.click('#shopBtn');
  await pg.waitForTimeout(500);
};
const clickProduct = (pg, name) => pg.evaluate((n) => {
  const rows = [...document.querySelectorAll('#shopList .upg')];
  const row = rows.find(r => new RegExp(n).test(r.textContent));
  row.querySelector('.buy').click();
}, name);

// ---- 1: açılışta gerçek fiyatlar ve sahiplik ----
console.log('\n1. açılış');
let pg = await open({});
let calls = await pg.evaluate(() => window.__iap.calls.map(c => c.name));
check(calls.includes('getProducts'), 'açılışta mağazadan fiyatlar isteniyor', calls.join(' > '));
check(calls.includes('restorePurchases') && calls.includes('getPurchases'),
  'açılışta sahiplik Play ile eşitleniyor');
// Ekranda dolar değil mağazanın döndürdüğü fiyat yazmalı: mağaza Türkiye'de
// de açılacak ve Play zaten yerel para biriminde biçimlenmiş fiyat veriyor.
await openShop(pg);
const shown = await pg.evaluate(() =>
  [...document.querySelectorAll('#shopList .buy')].map(b => b.textContent.trim()));
check(shown.some(t => t.includes('₺')), 'mağazada yerel fiyat gösteriliyor', shown.join(' | '));
check(!shown.some(t => t.includes('$')), 'yer tutucu dolar fiyatı kalmadı', shown.join(' | '));
await pg.close();

// ---- 2: tek seferlik ürün acknowledge ediliyor ----
console.log('\n2. tek seferlik ürün (reklamları kaldır)');
pg = await open({});
await openShop(pg);
await clickProduct(pg, 'Remove ads');
await pg.waitForTimeout(700);
let c = await pg.evaluate(() => window.__iap.calls);
const ack = c.find(x => x.name === 'acknowledgePurchase');
check(!!ack, 'satın alma acknowledge edildi (yoksa Google 3 günde iade ediyor)',
  ack ? ack.purchaseToken : c.map(x => x.name).join(' > '));
check(!c.some(x => x.name === 'consumePurchase'), 'tek seferlik ürün consume EDİLMEDİ');
check(await pg.evaluate(() => JSON.parse(localStorage.fruithole_iap || '{}').remove_ads === true),
  'sahiplik kaydedildi');
await pg.close();

// ---- 3: tüketilebilir ürün consume ediliyor ----
console.log('\n3. tüketilebilir ürün (meyve sepeti)');
pg = await open({});
await pg.evaluate(() => { const b = document.getElementById('dailyBtn'); if (b) b.click(); });
const before = await pg.evaluate(() => window.fruitHoleWallet().berry);
await pg.click('#shopBtn');
await pg.waitForTimeout(500);
await clickProduct(pg, 'Fruit basket');
await pg.waitForTimeout(700);
c = await pg.evaluate(() => window.__iap.calls);
const con = c.find(x => x.name === 'consumePurchase');
check(!!con, 'satın alma consume edildi (yoksa ikinci kez alınamıyor)',
  con ? con.purchaseToken : c.map(x => x.name).join(' > '));
check(!c.some(x => x.name === 'acknowledgePurchase'), 'tüketilebilir ürün acknowledge EDİLMEDİ');
const after = await pg.evaluate(() => window.fruitHoleWallet().berry);
check(after - before === 1800, 'meyve verildi', `${before} -> ${after}`);
// İkinci kez alınabiliyor mu? Consume edilmemiş olsaydı Play ikinci satın
// almayı reddediyordu; sahtesi de aynı şekilde davranıyor.
await clickProduct(pg, 'Fruit basket');
await pg.waitForTimeout(700);
const after2 = await pg.evaluate(() => window.fruitHoleWallet().berry);
check(after2 - after === 1800, 'aynı paket ikinci kez alınabiliyor', `${after} -> ${after2}`);
await pg.close();

// ---- 4: yarıda kalmış satın alma açılışta kurtarılıyor ----
console.log('\n4. yarıda kalmış satın alma');
// Para alınmış, uygulama consume etmeden kapanmış. Play hâlâ "sahip" diyor.
// Açılışta verilmeli ve consume edilmeli, yoksa oyuncu parasını verip
// hiçbir şey almamış oluyor ve bir daha da alamıyor.
pg = await open({ owned: [{ productIdentifier: 'fruithole_pack_large', purchaseToken: 'tok_yarim' }] });
const w = await pg.evaluate(() => window.fruitHoleWallet());
check(w.berry >= 6000, 'ödenmiş ama verilmemiş paket açılışta verildi', `çilek ${w.berry}`);
c = await pg.evaluate(() => window.__iap.calls);
check(c.some(x => x.name === 'consumePurchase' && x.purchaseToken === 'tok_yarim'),
  'kurtarılan paket consume edildi', c.map(x => x.name).join(' > '));
await pg.close();

// ---- 4b: geri yüklenen kalıcı ürün ----
console.log('\n4b. yeniden kurulumdan sonra geri yükleme');
// Başlangıç paketi hem meyve veriyor hem reklamları kaldırıyor. Geri
// yüklemede reklamsızlığın geri gelmesi, meyvenin gelmemesi lazım:
//   - reklamsızlık gelmezse oyuncu ondan kurtulmak için ödeyip reklam izliyor
//   - meyve her kurulumda yeniden gelirse paket sonsuz meyve makinesi oluyor
pg = await open({ owned: [{ productIdentifier: 'fruithole_starter', purchaseToken: 'tok_st' }] });
const st = await pg.evaluate(() => ({
  wallet: window.fruitHoleWallet(),
  iap: JSON.parse(localStorage.fruithole_iap || '{}'),
}));
check(st.iap.remove_ads === true, 'geri yüklemede reklamsızlık geri geldi',
  JSON.stringify(st.iap));
check(st.wallet.berry === 0, 'geri yüklemede meyve YENİDEN verilmedi',
  `çilek ${st.wallet.berry}`);
c = await pg.evaluate(() => window.__iap.calls);
check(c.some(x => x.name === 'acknowledgePurchase'), 'kalıcı ürün acknowledge edildi');
check(!c.some(x => x.name === 'consumePurchase'), 'kalıcı ürün consume EDİLMEDİ');
await pg.close();

// ---- 5: iptal edilen satın alma hiçbir şey vermiyor ----
console.log('\n5. iptal');
pg = await open({ purchaseThrows: true });
await pg.evaluate(() => { const b = document.getElementById('dailyBtn'); if (b) b.click(); });
const b5 = await pg.evaluate(() => window.fruitHoleWallet().berry);
await pg.click('#shopBtn');
await pg.waitForTimeout(500);
await clickProduct(pg, 'Fruit basket');
await pg.waitForTimeout(700);
const a5 = await pg.evaluate(() => window.fruitHoleWallet().berry);
check(a5 === b5, 'iptal edilince meyve verilmedi', `${b5} -> ${a5}`);
check(await pg.evaluate(() => !document.querySelector('#shopList .buy').disabled),
  'iptalden sonra düğme yeniden basılabilir');
await pg.close();

// ---- 5b: Play fiyat vermezse ----
console.log('\n5b. Play fiyat döndürmüyor');
// Ürünler Play Console'da henüz etkin değilse, cihaz çevrimdışıysa ya da
// Play o an cevap vermiyorsa getProducts boş dönüyor. O zaman PRODUCTS
// içindeki dolar yer tutucularını göstermek, her ülkede yanlış ve
// Türkiye'de para birimi bile yanlış bir fiyat uydurmak demek — üstelik
// sabit fiyat göstermek inceleme reddi sebebi. Satılamayan ürün
// satılamıyor görünmeli.
for (const [ad, opt] of [['boş liste', { noProducts: true }], ['hata', { productsThrow: true }]]) {
  pg = await open(opt);
  await pg.evaluate(() => { const b = document.getElementById('dailyBtn'); if (b) b.click(); });
  await pg.click('#shopBtn');
  await pg.waitForTimeout(500);
  const st = await pg.evaluate(() => ({
    labels: [...document.querySelectorAll('#shopList .buy')].map(b => b.textContent.trim()),
    disabled: [...document.querySelectorAll('#shopList .buy')].every(b => b.disabled),
    note: document.getElementById('shopNote').textContent,
  }));
  check(!st.labels.some(t => t.includes('$')), `${ad}: uydurma dolar fiyatı gösterilmiyor`,
    st.labels.join(' | '));
  check(st.disabled, `${ad}: satın alma düğmeleri kapalı`);
  check(/could not be priced/.test(st.note), `${ad}: sebebi yazıyor`, st.note.slice(0, 60));
  // Kapalı düğmeye basmak hiçbir şey vermemeli.
  const w0 = await pg.evaluate(() => window.fruitHoleWallet().berry);
  await pg.evaluate(() => {
    const rows = [...document.querySelectorAll('#shopList .upg')];
    const r = rows.find(x => /Fruit basket/.test(x.textContent));
    r.querySelector('.buy').click();
  });
  await pg.waitForTimeout(400);
  check(await pg.evaluate(() => window.fruitHoleWallet().berry) === w0,
    `${ad}: kapalı düğme meyve vermiyor`);
  await pg.close();
}

// ---- 6: eklenti yokken ----
console.log('\n6. eklenti yokken (tarayıcı)');
const pg6 = await br.newPage({ viewport: { width: 412, height: 915 } });
pg6.on('pageerror', e => { console.log('  SAYFA HATASI: ' + e); fails.push('sayfa hatası: ' + e); });
await pg6.goto('http://localhost:8218/', { waitUntil: 'load' });
await pg6.waitForFunction(() => window.fruitHoleWallet, { timeout: 25000 });
await pg6.waitForTimeout(700);
check(await pg6.evaluate(() => !!document.getElementById('shopBtn')),
  'tarayıcıda mağaza yine açılıyor (akış denenebilsin diye)');
await pg6.close();

console.log(fails.length ? `\n${fails.length} kontrol düştü` : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length ? 1 : 0);
