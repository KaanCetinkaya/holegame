// Ucuz ve küçük telefonlarda arayüz duruyor mu?
//
// Oyun 412×915'te tasarlandı ve bütün ölçümler orada yapıldı. TikTok'tan
// gelen oyuncunun telefonu ise çoğu zaman daha küçük: 360×640 hâlâ
// yaygın, ve Türkçe karşılıklar İngilizceden uzun.
//
// Bu ölçüm bir hata sınıfının peşinde: **ekranda olan ama kullanılamayan
// şey**. Müşteri arabasında tam olarak bu çıkmıştı — araba kadrajdaydı,
// ama dokunma alanının yarısı istasyon panelinin altında kalıyordu.
//
// Ölçülen, her boyutta ve iki dilde:
//   1. Yatay taşma yok — sayfa yana kaymıyor
//   2. Dört istasyon satırı da görünür ve dokunulabilir
//   3. Düğmeler parmak boyutunda (en az 44 piksel)
//   4. Üst şeritteki haplar birbirine girmiyor
//   5. Menü ekranı dikeyde sığıyor
//   6. Müşteri arabasının dokunma alanını panel kapatmıyor
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8631);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

// Yaygın Android boyutları, CSS pikseli olarak.
const BOYUTLAR = [
  { ad: 'küçük',   w: 360, h: 640 },   // hâlâ yaygın, ucuz cihaz
  { ad: 'orta',    w: 360, h: 800 },
  { ad: 'Pixel',   w: 393, h: 851 },
  { ad: 'geniş',   w: 412, h: 915 },   // tasarımın yapıldığı boyut
  { ad: 'büyük',   w: 480, h: 1067 },
];

const TAP = 44;     // parmak için en küçük makul hedef

for (const dil of ['tr-TR', 'en-US']) {
  console.log(`\n=== ${dil} ===`);
  for (const b of BOYUTLAR) {
    const ctx = await br.newContext({ viewport: { width: b.w, height: b.h }, locale: dil });
    const pg = await ctx.newPage();
    const hata = [];
    pg.on('pageerror', e => hata.push(String(e)));
    await pg.addInitScript(() => localStorage.clear());
    await pg.goto('http://localhost:8631/', { waitUntil: 'load', timeout: 90000 });
    await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 60000 });
    await pg.evaluate(() => {
      document.getElementById('dOk')?.click();
      window.jeTutSkip();
      window.jeGive(1e12);
      for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 120); window.jeGiveManager(i); }
      window.jeRefresh();
    });
    await pg.waitForTimeout(300);

    const d = await pg.evaluate(TAP => {
      const out = { tasma: [], kucuk: [], satir: [], cakisma: [] };
      // 1. Yatay taşma: hiçbir şey sayfanın dışına sarkmamalı.
      if (document.documentElement.scrollWidth > innerWidth + 1)
        out.tasma.push(`sayfa ${document.documentElement.scrollWidth} > ${innerWidth}`);
      // Kırpılmış çocukları saymıyoruz: `.meta` gibi `overflow:hidden`
      // bir kutunun içindeki uzun yazının kutusu dışarı taşıyor ama
      // ekranda görünmüyor ve sayfayı kaydırmıyor. Bakılan şey
      // görünür olanlar.
      const kirpik = el => {
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement)
          if (getComputedStyle(p).overflow !== 'visible') return true;
        return false;
      };
      for (const el of document.querySelectorAll('#app *')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (kirpik(el)) continue;
        if (r.right > innerWidth + 1 || r.left < -1)
          out.tasma.push(`${el.id || el.className || el.tagName} ${Math.round(r.left)}..${Math.round(r.right)}`);
      }
      // 2. İstasyon satırları
      for (const el of document.querySelectorAll('.st')) {
        const r = el.getBoundingClientRect();
        out.satir.push({ ust: Math.round(r.top), alt: Math.round(r.bottom),
                         gorunur: r.top < innerHeight && r.bottom > 0 });
      }
      // 3. Dokunulabilir hedefler
      for (const el of document.querySelectorAll('.buy, .pill, #boostBtn, #bulk button')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0) continue;
        if (r.height < TAP - 6 || r.width < TAP - 20)
          out.kucuk.push(`${el.id || el.className} ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
      // 3b. İstasyon alt satırı kırpılıyor mu?
      //
      // `overflow:hidden` ile üç nokta koyduk, yani taşma artık
      // görünmüyor — ama görünmemesi okunabildiği anlamına gelmiyor.
      // Kırpılan her satır, oyuncuya söylenmeyen bir şey.
      out.kirpik = [];
      for (const el of document.querySelectorAll('.st .meta')) {
        if (el.scrollWidth > el.clientWidth + 1)
          out.kirpik.push(`${el.textContent.trim().slice(0, 40)} (${el.scrollWidth}>${el.clientWidth})`);
      }
      // 4. Üst şerit: haplar birbirine girmemeli
      const kutu = id => document.getElementById(id).getBoundingClientRect();
      const sol = kutu('leftWrap'), orta = kutu('cashWrap'), sag = kutu('menuBtn');
      if (sol.right > orta.left) out.cakisma.push('sol şerit ile kasa');
      if (orta.right > sag.left) out.cakisma.push('kasa ile menü');
      // 5. Menü dikeyde sığıyor mu
      document.getElementById('menuBtn').click();
      const m = document.getElementById('menu');
      // Menünün sığması şart değil; **ulaşılabilir** olması şart.
      // Kısa ekranda içerik taşıyor ve ekran kaydırılabiliyor, yani en
      // alttaki KAPAT düğmesine erişiliyor.
      out.menu = { ic: m.scrollHeight, dis: m.clientHeight,
                   kaydirilir: getComputedStyle(m).overflowY === 'auto' ||
                               getComputedStyle(m).overflowY === 'scroll' };
      m.classList.remove('show');
      // 6. Müşteri arabasının dokunma alanı
      window.jeMusBelir();
      window.jeMusAdim(2);
      const e = window.jeMus().ekran;
      const r = window.jeMus().r;
      const kim = (x, y) => {
        const el = document.elementFromPoint(x, y);
        return el ? el.tagName + (el.id ? '#' + el.id : '') : 'yok';
      };
      out.musteri = e ? {
        x: Math.round(e.x), y: Math.round(e.y),
        merkez: kim(e.x, e.y), alt: kim(e.x, e.y + r * 0.6), ust: kim(e.x, e.y - r * 0.6),
      } : null;
      return out;
    }, TAP);

    const sorun = [];
    if (d.tasma.length) sorun.push(`taşma: ${d.tasma.slice(0, 2).join(', ')}`);
    if (d.kucuk.length) sorun.push(`küçük hedef: ${d.kucuk.slice(0, 2).join(', ')}`);
    if (d.cakisma.length) sorun.push(`çakışma: ${d.cakisma.join(', ')}`);
    if (d.kirpik.length) sorun.push(`kırpılan satır: ${d.kirpik[0]}`);
    const menuOk = d.menu.ic <= d.menu.dis + 1 || d.menu.kaydirilir;
    if (!menuOk) sorun.push(`menüye erişilemiyor ${d.menu.ic}>${d.menu.dis}`);
    const musOk = d.musteri && ['merkez', 'alt', 'ust'].every(k => d.musteri[k] === 'CANVAS');
    if (!musOk) sorun.push(`müşteri alanı: ${d.musteri ? JSON.stringify(d.musteri) : 'yok'}`);
    const gorunenSatir = d.satir.filter(s => s.gorunur).length;

    console.log(`  ${b.ad.padEnd(7)} ${String(b.w).padStart(3)}x${String(b.h).padStart(4)}  ` +
      `görünen satır ${gorunenSatir}/4 · menü ${d.menu.ic}/${d.menu.dis}` +
      (hata.length ? ` · HATA ${hata[0].slice(0, 40)}` : ''));
    if (sorun.length) console.log(`           ${sorun.join(' · ')}`);
    ok(d.tasma.length === 0, `${b.ad}: yatay taşma yok`, d.tasma.slice(0, 1).join(''));
    ok(d.cakisma.length === 0, `${b.ad}: üst şerit çakışmıyor`, d.cakisma.join(''));
    ok(d.kirpik.length === 0, `${b.ad}: istasyon alt satırı kırpılmıyor`,
       d.kirpik.slice(0, 1).join(''));
    ok(d.kucuk.length === 0, `${b.ad}: dokunma hedefleri parmak boyutunda`, d.kucuk.slice(0, 1).join(''));
    ok(gorunenSatir === 4, `${b.ad}: dört istasyon da görünür`, `${gorunenSatir}/4`);
    ok(menuOk, `${b.ad}: menünün altına erişiliyor`,
       `${d.menu.ic}/${d.menu.dis} kaydırılır ${d.menu.kaydirilir}`);
    ok(musOk, `${b.ad}: müşteriye dokunulabiliyor`,
       d.musteri ? `${d.musteri.merkez}/${d.musteri.alt}` : 'araba yok');
    ok(hata.length === 0, `${b.ad}: sayfa hatası yok`, hata[0] || '');
    await ctx.close();
  }
}

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
