// Ses tuşu gerçekten susturuyor mu — titreşim dahil?
//
// Oyun iki yerden kapanıyor: menünün üstündeki tuş ve duraklat
// ekranındaki ikizi. İkisi de aynı bayrağı (`muted`) çeviriyor ve
// bayrak hem sesi hem `navigator.vibrate` çağrılarını kapatıyor.
//
// Bu dosya, titreşim izni manifest'e eklendiği gün yazıldı. O güne
// kadar `navigator.vibrate` WebView'da **sessizce** hiçbir şey
// yapmıyordu: yani "sessiz kipte titremiyor" iddiası doğruydu ama
// yanlış sebeple — hiçbir kipte titremiyordu. İzin geldiğinde titreşim
// ilk kez gerçekten çalışacak, ve sessiz kipin onu da kapattığı o gün
// önem kazanıyor.
//
// Ölçülen:
//   1. Menüde ses tuşu var, basılabiliyor, durumu söylüyor
//   2. Basınca kayda yazılıyor ve yenilemede kalıyor
//   3. Kapalıyken ne ses üretiliyor ne de titreşim isteniyor
//   4. Açıkken ikisi de geri geliyor
//   5. Duraklat ekranındaki ikizi aynı bayrağı çeviriyor
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-fruithole' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8779);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

const ctx = await br.newContext({ viewport: { width: 412, height: 915 } });
// Osilatör ve titreşim sayılıyor: simgenin değişmesi sesin kesildiğini
// söylemiyor.
await ctx.addInitScript(() => {
  window.__ses = 0; window.__titre = 0;
  const C = window.AudioContext || window.webkitAudioContext;
  const asil = C.prototype.createOscillator;
  C.prototype.createOscillator = function (...a) { window.__ses++; return asil.apply(this, a); };
  try {
    Object.defineProperty(navigator, 'vibrate',
      { configurable: true, value: () => { window.__titre++; return true; } });
  } catch (e) { navigator.vibrate = () => { window.__titre++; return true; }; }
});
const pg = await ctx.newPage();
const hata = [];
pg.on('pageerror', e => hata.push(String(e).split('\n')[0]));
await pg.goto('http://localhost:8779/', { waitUntil: 'load', timeout: 120000 });
await pg.waitForFunction(() => typeof window.fruitHoleWhere === 'function', null, { timeout: 90000 });
await pg.waitForTimeout(1200);
await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });

console.log('\n1) Menüdeki tuş');
const t = await pg.evaluate(() => {
  const e = document.getElementById('menuSound');
  if (!e) return { yok: true };
  const r = e.getBoundingClientRect();
  // Tuş iki biçimde olabiliyor: emoji, ya da açılışta çizilen 3B
  // hoparlör simgesi. İkincisinde yazı boş ve durumu `kapali` sınıfı
  // söylüyor — ölçüm ikisini de tanımalı, yoksa telefondaki hâli hiç
  // ölçülmemiş olur.
  return { yazi: e.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height),
           simge3b: e.classList.contains('icon3d'),
           kapaliSinif: e.classList.contains('kapali'),
           icinde: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight,
           kayit: localStorage.getItem('fruithole_muted') };
});
console.log(`     "${t.yazi}" ${t.w}x${t.h} · 3B simge ${t.simge3b} · kayıt ${t.kayit}`);
ok(!t.yok, 'menüde ses tuşu var');
ok(!t.yok && t.icinde, 'tuş ekranın içinde');
const acikGorunum = x => x.simge3b ? !x.kapaliSinif : x.yazi === '🔊';
const kapaliGorunum = x => x.simge3b ? x.kapaliSinif : x.yazi === '🔇';
ok(!t.yok && acikGorunum(t), 'tuş açık görünüyor', `${t.yazi || '(3B)'} kapali:${t.kapaliSinif}`);

console.log('\n2) Oynarken: açıkken ses ve titreşim var');
// Gerçek oynanış: meyve yemek hem sesi hem titreşimi tetikliyor.
const oyna = () => pg.evaluate(async () => {
  window.__ses = 0; window.__titre = 0;
  window.fruitHoleStartLevel();
  await new Promise(r => setTimeout(r, 400));
  for (let i = 0; i < 90; i++) {
    const w = window.fruitHoleWhere();
    const n = window.fruitHoleNearest();
    if (n) { const dx = n.x - w.x, dz = n.z - w.z, d = Math.hypot(dx, dz) || 1;
             window.fruitHoleSteer(dx / d, dz / d); }
    await new Promise(r => setTimeout(r, 16));
  }
  return { ses: window.__ses, titre: window.__titre, yenen: window.fruitHoleWhere().eaten };
});
const acik = await oyna();
console.log(`     ${acik.yenen} meyve · osilatör ${acik.ses} · titreşim ${acik.titre}`);
ok(acik.yenen > 0, 'gerçekten meyve yendi — ölçülecek bir şey vardı', `${acik.yenen}`);
ok(acik.ses > 0, 'açıkken ses üretildi', `${acik.ses}`);
ok(acik.titre > 0, 'açıkken titreşim istendi', `${acik.titre}`);

console.log('\n3) Kapatınca ikisi de susuyor');
const kapat = await pg.evaluate(() => {
  document.getElementById('pauseBtn')?.click();
  const p = document.getElementById('pauseMute');
  if (p) p.click();
  else document.getElementById('menuSound').click();
  const b = document.getElementById('menuSound');
  return { yazi: b.textContent.trim(), simge3b: b.classList.contains('icon3d'),
           kapaliSinif: b.classList.contains('kapali'),
           kayit: localStorage.getItem('fruithole_muted') };
});
console.log(`     simge "${kapat.yazi}" · 3B ${kapat.simge3b} · kapali sınıfı ${kapat.kapaliSinif}`);
ok(kapat.kayit === '1', 'kayda yazıldı', String(kapat.kayit));
// Telefonda tuşun yüzü değişmiyordu: 3B simge hep aynı hoparlör ve
// üstüne yazılan emoji onun üstüne biniyordu. Yani oyuncu sesi
// kapattığını yalnızca kulağından anlıyordu.
ok(kapaliGorunum(kapat), 'tuş kapalı görünüyor',
   `${kapat.yazi || '(3B)'} kapali:${kapat.kapaliSinif}`);
const sessiz = await oyna();
console.log(`     ${sessiz.yenen} meyve · osilatör ${sessiz.ses} · titreşim ${sessiz.titre}`);
ok(sessiz.yenen > 0, 'sessizken de oynandı', `${sessiz.yenen}`);
ok(sessiz.ses === 0, 'sessizken hiç ses üretilmedi', `${sessiz.ses}`);
ok(sessiz.titre === 0, 'sessizken telefon titremedi', `${sessiz.titre}`);

console.log('\n4) Yenilemeden sonra');
await pg.reload({ waitUntil: 'load', timeout: 120000 });
await pg.waitForFunction(() => typeof window.fruitHoleWhere === 'function', null, { timeout: 90000 });
await pg.waitForTimeout(1200);
const y = await pg.evaluate(() => {
  const b = document.getElementById('menuSound');
  return { kayit: localStorage.getItem('fruithole_muted'),
           yazi: b ? b.textContent.trim() : '', simge3b: !!(b && b.classList.contains('icon3d')),
           kapaliSinif: !!(b && b.classList.contains('kapali')) };
});
console.log(`     kayıt ${y.kayit} · simge "${y.yazi}" · 3B ${y.simge3b} · kapali ${y.kapaliSinif}`);
ok(y.kayit === '1', 'yenilemeden sonra da kapalı', String(y.kayit));
ok(kapaliGorunum(y), 'tuş kapalı görünmeye devam ediyor',
   `${y.yazi || '(3B)'} kapali:${y.kapaliSinif}`);

ok(!hata.length, 'sayfa hatası yok', hata[0] || '');
console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
