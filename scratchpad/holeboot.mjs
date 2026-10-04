// Oyun her kayıtlı bölümde açılıyor mu?
//
//   node build-www.mjs && node scratchpad/holeboot.mjs
//
// Neden var: aynı hata üç kez çıktı ve üçünde de sebep aynıydı — sayfa
// açılırken çalışan bir satır, dosyanın daha aşağısında `const` ile duran bir
// şeyi okuyor. JavaScript bunu hata sayıyor, modül orada duruyor, ve yükleme
// perdesi hiç kalkmıyor. Oyun açılmıyor.
//
// Üçüncüsü gerçek bir kullanıcıya çıkacaktı: sipariş görevi tarla kurulurken
// hesaplanıyor ve deliğin hızını okuyor, hız ise dosyanın en sonunda
// tanımlıydı. Yani **kaydı 5. bölümde olan herkes** için oyun açılmıyordu.
// Birinci bölümde açılıyordu, çünkü orada görev yok — yani her zamanki
// denemeler bunu göremezdi.
//
// Test bu yüzden bölüm numarası gezdiriyor: sıradan bölüm, sipariş bölümü,
// patron bölümü, ikinci tur, ve dördüncü tur.
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
}).listen(8276);

// Sahte saat: make-clips.mjs ve holeorderplay.mjs bununla oynuyor, ve üçüncü
// hata tam olarak bu kurulumda göründü. Gerçek saatle de bakılıyor, çünkü
// ikisi açılışta farklı yollardan geçiyor.
const FAKE_CLOCK = () => {
  let t = 0;
  const q = [];
  window.requestAnimationFrame = cb => { q.push(cb); return q.length; };
  window.cancelAnimationFrame = () => {};
  try {
    Object.defineProperty(window.performance, 'now', { configurable: true, value: () => t });
  } catch (e) { window.performance.now = () => t; }
  window.__step = ms => { t += ms; for (const cb of q.splice(0, q.length)) { try { cb(t); } catch (e) {} } };
};

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

const fails = [];
const BOLUMLER = [
  [1, 'ilk bölüm'],
  [5, 'sipariş bölümü'],
  [10, 'patron bölümü'],
  [13, 'tahtanın büyüdüğü yer'],
  [25, 'ikinci tur, çevrilmiş tahta'],
  [35, 'ikinci turun siparişi'],
  [73, 'dördüncü tur'],
];

for (const sahte of [false, true]) {
  console.log(`\n--- ${sahte ? 'sahte saatle' : 'gerçek saatle'} ---`);
  for (const [lvl, not] of BOLUMLER) {
    const ctx = await br.newContext({ viewport: { width: 412, height: 915 } });
    const pg = await ctx.newPage();
    const errs = [];
    pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
    if (sahte) await pg.addInitScript(FAKE_CLOCK);
    await pg.addInitScript(n => localStorage.setItem('fruithole_level', String(n)), lvl);
    await pg.goto('http://localhost:8276/', { waitUntil: 'domcontentloaded' });
    let acildi = true;
    try {
      // Yükleme perdesinin kalkması, modülün sonuna kadar çalıştığının tek
      // kanıtı: perdeyi kaldıran satır dosyanın en sonunda.
      await pg.waitForFunction(() => {
        const l = document.getElementById('loading');
        return !l || getComputedStyle(l).display === 'none';
      }, { timeout: 30000 });
    } catch (e) { acildi = false; }
    // Menüye kadar git. Birinci bölümdeki yeni profil doğrudan menüye
    // düşüyor, ilerlemiş bir kayıtta önce günlük meydan okuma ekranı geliyor
    // — yani "Play düğmesi görünüyor mu" sorusu, ekranı kapatmadan sorulursa
    // oyunda olmayan bir hata uydurur.
    let oynanir = false;
    if (acildi) {
      if (sahte) for (let i = 0; i < 30; i++) await pg.evaluate(() => window.__step(1000 / 30));
      if (await pg.isVisible('#dailyBtn')) {
        await pg.click('#dailyBtn');
        if (sahte) for (let i = 0; i < 10; i++) await pg.evaluate(() => window.__step(1000 / 30));
      }
      oynanir = await pg.isVisible('#playBtn');
    }
    console.log(`  ${acildi && oynanir && !errs.length ? 'OK  ' : 'FAIL'} bölüm ${String(lvl).padStart(2)} — ${not}` +
      (errs.length ? `   ${errs[0]}` : acildi ? '' : '   perde kalkmadı'));
    if (!acildi) fails.push(`bölüm ${lvl} açılmadı (${sahte ? 'sahte' : 'gerçek'} saat)`);
    if (!oynanir && acildi) fails.push(`bölüm ${lvl}: Play düğmesi yok`);
    if (errs.length) fails.push(`bölüm ${lvl}: ${errs[0]}`);
    await ctx.close();
  }
}

// ---------------------------------------------------------------------
// Açılmak yetmiyor: **oynanırken** de patlamamalı.
//
// Yukarıdaki bölüm açıyor ve Play düğmesini arıyor. Bir hata sınıfını hiç
// göremiyor, ve o sınıf oyunu açılmayan bir oyundan daha kötü yapıyor:
// tahtanın kurulması değil, tahtanın **yenmesi** patlıyorsa oyun açılıyor,
// birkaç saniye oynanıyor, ve sonra donuyor.
//
// Donmanın sebebi `tick`'in şekli: son satırı `requestAnimationFrame(tick)`,
// yani kare içinde atılan bir istisna bir sonraki kareyi hiç planlamıyor.
// Tek bir hatalı yutma, oyunu kalıcı olarak durduruyor.
//
// Gerçekten oldu ve aylarca kimse görmedi: on beş nesne `currency: 'apple'`
// diyordu, `apple` diye bir para birimi yok, ve o nesnelerden birini yutmak
// oyunu öldürüyordu. Bütün testler tahtayı kuruyor ve **oynamıyordu**;
// yakalayan şey tanıtım klibi oldu — dokuz saniyelik videoların dördünde
// tahta hiç kıpırdamıyordu.
//
// Burada sahte saatle gerçekten oynanıyor: en yakın meyveye sürülüyor ve
// yüz kare ilerletiliyor. Hata yutulmuyor, sayılıyor.
console.log('\n--- oynanırken ---');
{
  const ctx = await br.newContext({ viewport: { width: 412, height: 915 } });
  const pg = await ctx.newPage();
  await pg.addInitScript(() => {
    let t = 0; const q = [];
    window.__kareHata = [];
    window.requestAnimationFrame = cb => { q.push(cb); return q.length; };
    window.cancelAnimationFrame = () => {};
    try { Object.defineProperty(window.performance, 'now', { configurable: true, value: () => t }); }
    catch (e) { window.performance.now = () => t; }
    window.__step = ms => { t += ms;
      for (const cb of q.splice(0, q.length)) {
        try { cb(t); } catch (e) { window.__kareHata.push(String(e && e.message || e)); } } };
  });
  await pg.goto('http://localhost:8276/', { waitUntil: 'load' });
  await pg.waitForFunction(() => window.fruitHoleWhere, { timeout: 40000 });
  // Bütün ilk tur: her düzen, her yer. Nesneler temaya göre değişiyor, yani
  // hatayı bulmak için çok sayıda tahta gerekiyor — biri yetmiyordu.
  //
  // Bölüm sayısı **oyundan** okunuyor, elle yazılmıyor. Burada `48` yazılıydı
  // ve düzen sayısı elli dörde çıkınca test yeni altı düzenin hiçbirini
  // oynamadı — ama satırı yine "kırk sekiz bölümün hepsi geçti" diyordu, yani
  // geniş ağın deliği tam olarak yeni eklenen yerin üstündeydi. Bu dosyanın
  // kendi hata sınıfı: bir yerde yazılı bir sayı, değişen bir gerçek, ve
  // ikisini karşılaştıran kimse yok.
  //
  // Kare sayısı altmış: konteynerde her kare gerçek bir çizim ve yüz kare ×
  // altmış bölüm testi on dakikanın üstüne çıkarıyordu. Asıl kök neden zaten
  // `holetheme.mjs`'de doğrudan ölçülüyor (her nesnenin para birimi); burası
  // geniş ağ.
  const TUR = await pg.evaluate(() => window.fruitHoleThemeTable().order.length);
  const bozuk = [];
  for (let lvl = 1; lvl <= TUR; lvl++) {
    const r = await pg.evaluate(l => {
      window.__kareHata.length = 0;
      window.fruitHoleProbe(l);
      window.fruitHoleStartLevel();
      for (let i = 0; i < 60; i++) {
        const w = window.fruitHoleWhere();
        const n = window.fruitHoleNearest();
        if (n) { const dx = n.x - w.x, dz = n.z - w.z, d = Math.hypot(dx, dz) || 1;
                 window.fruitHoleSteer(dx / d, dz / d); }
        window.__step(1000 / 30);
        if (window.__kareHata.length) break;
      }
      return { hata: window.__kareHata[0] || null, yenen: window.fruitHoleWhere().eaten };
    }, lvl);
    if (r.hata) bozuk.push(`${lvl}: ${r.hata}`);
  }
  console.log(`  ${bozuk.length ? 'FAIL' : 'OK  '} ${TUR} bölümün hepsi oynanırken hata atmıyor` +
    (bozuk.length ? `   ${bozuk.slice(0, 3).join(' · ')}` : ''));
  for (const b of bozuk) fails.push(`oynanırken patladı — ${b}`);
  await ctx.close();
}

console.log('\n' + (fails.length ? 'hatalar:\n - ' + fails.join('\n - ') : 'hepsi geçti'));
// Hata varsa çıkış kodu da söylesin.
//
// Bu dosya hatayı **basıyordu ama çıkış kodu 0 dönüyordu**, yani onu çağıran
// her şey — toplu koşu, ileride bir CI — "geçti" diye okuyordu. Tam koşuda on
// üç test böyle çıktı: hata basan ama başarı sinyali veren bir test, hiç test
// olmamasından kötü, çünkü bakılmış olduğu izlenimi veriyor.
process.exitCode = fails.length ? 1 : 0;
await br.close(); srv.close();
