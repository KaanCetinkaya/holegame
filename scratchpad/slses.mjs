// Sesi kapatmanın bir yolu var mı, ve kapatınca gerçekten susuyor mu?
//
// `muted` değişkeni oyunda vardı, kayda yazılıyordu ve `tone()` ona
// bakıyordu — ama bütün dosyada başka hiçbir yerde geçmiyordu. Yani
// kapatma özelliği yazılmıştı ve **ona dokunulacak hiçbir şey yoktu**:
// oyunun sesini kapatmanın yolu yoktu. Bu depodaki tanıdık sınıf,
// ekranda olmayan ama var sayılan şey.
//
// Ölçülen:
//   1. Menüde bir ses tuşu var ve basılabiliyor
//   2. Basınca durum değişiyor ve **kayda yazılıyor** (yenilemede
//      kalıyor) — yoksa her açılışta ses geri geliyor
//   3. Duraklat ekranında da var: sesi kapatmak isteyen çoğu zaman
//      oynarken istiyor
//   4. Kapalıyken gerçekten hiç ses üretilmiyor — simge değişip sesin
//      devam etmesi, düğmenin olmamasından beter
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-slicer' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8768);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

const ctx = await br.newContext({ viewport: { width: 412, height: 915 } });
// Üretilen osilatörü say: "sustu" iddiasının tek ölçülebilir hâli.
// Simgenin değişmesi sesin kesildiğini söylemiyor.
await ctx.addInitScript(() => {
  window.__ses = 0;
  // Titreşim de sayılıyor: ses tuşu telefonun **sessiz** kalmasını
  // sağlamalı, ve titreyen bir telefon sessiz değil.
  window.__titre = 0;
  try {
    Object.defineProperty(navigator, 'vibrate',
      { configurable: true, value: () => { window.__titre++; return true; } });
  } catch (e) { navigator.vibrate = () => { window.__titre++; return true; }; }
  const C = window.AudioContext || window.webkitAudioContext;
  const asil = C.prototype.createOscillator;
  C.prototype.createOscillator = function (...a) { window.__ses++; return asil.apply(this, a); };
});
const pg = await ctx.newPage();
const hata = [];
pg.on('pageerror', e => hata.push(String(e).split('\n')[0]));
// `addInitScript(() => localStorage.clear())` **yok**: o betik her
// yüklemede koşuyor, yani aşağıdaki yenileme de kaydı siliyor ve
// "yenilemeden sonra da kapalı" ölçüsü hiçbir zaman geçemiyordu.
// İlk yazılışında tam bu oldu ve ölçüm oyunu suçladı. Yeni bir
// tarayıcı bağlamının deposu zaten boş.
await pg.goto('http://localhost:8768/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.sliceMeta === 'function', { timeout: 60000 });
await pg.evaluate(() => document.getElementById('dOk')?.click());

console.log('\n1) Menüdeki tuş');
const t = await pg.evaluate(() => {
  const e = document.getElementById('muteBtn');
  if (!e) return { yok: true };
  const r = e.getBoundingClientRect();
  return { yazi: e.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height),
           icinde: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight,
           sessiz: window.sliceMeta().sessiz };
});
console.log(`     "${t.yazi}" ${t.w}x${t.h} · sessiz ${t.sessiz}`);
ok(!t.yok, 'menüde ses tuşu var');
ok(!t.yok && t.icinde, 'tuş ekranın içinde');
ok(!t.yok && t.h >= 44 && t.w >= 44, 'tuş parmak boyutunda', `${t.w}x${t.h}`);
ok(!t.yok && !t.sessiz, 'ses başlangıçta açık');

console.log('\n2) Basınca kapanıyor ve kayıtta kalıyor');
const k = await pg.evaluate(() => {
  document.getElementById('muteBtn').click();
  return { sessiz: window.sliceMeta().sessiz,
           yazi: document.getElementById('muteBtn').textContent.trim(),
           kayit: localStorage.getItem('slicerush_muted') };
});
console.log(`     sessiz ${k.sessiz} · simge "${k.yazi}" · kayıt ${k.kayit}`);
ok(k.sessiz === true, 'bir basışta kapandı');
ok(k.yazi !== t.yazi, 'simge değişti', `${t.yazi} → ${k.yazi}`);
ok(k.kayit === 'true', 'kayda yazıldı', String(k.kayit));

await pg.reload({ waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.sliceMeta === 'function', { timeout: 60000 });
await pg.evaluate(() => document.getElementById('dOk')?.click());
const y = await pg.evaluate(() => ({ sessiz: window.sliceMeta().sessiz,
  yazi: document.getElementById('muteBtn').textContent.trim() }));
console.log(`     yenilemeden sonra sessiz ${y.sessiz} · simge "${y.yazi}"`);
ok(y.sessiz === true, 'yenilemeden sonra da kapalı');

console.log('\n3) Kapalıyken gerçekten susuyor');
// Bir tur oynanıyor: kesim, çarpma ve bitiş sesleri bu yoldan çıkıyor.
const kapali = await pg.evaluate(() => {
  window.__ses = 0; window.__titre = 0;
  window.sliceStart(3);
  window.sliceRun(3000);
  return { ses: window.__ses, titre: window.__titre, kesim: window.sliceProbe().cut };
});
console.log(`     sessizken ${kapali.kesim} kesim · osilatör ${kapali.ses} · titreşim ${kapali.titre}`);
ok(kapali.kesim > 0, 'turda gerçekten kesim oldu — ölçülecek bir şey vardı',
   `${kapali.kesim}`);
ok(kapali.ses === 0, 'sessizken hiç ses üretilmedi', `${kapali.ses}`);
ok(kapali.titre === 0, 'sessizken telefon titremedi', `${kapali.titre}`);

console.log('\n4) Açınca geri geliyor');
const acik = await pg.evaluate(() => {
  document.getElementById('muteBtn').click();
  window.__ses = 0; window.__titre = 0;
  window.sliceStart(3);
  window.sliceRun(3000);
  return { ses: window.__ses, titre: window.__titre,
           kesim: window.sliceProbe().cut, sessiz: window.sliceMeta().sessiz };
});
console.log(`     açıkken ${acik.kesim} kesim · osilatör ${acik.ses} · titreşim ${acik.titre}`);
ok(acik.sessiz === false, 'ikinci basışta açıldı');
ok(acik.ses > 0, 'açıkken ses üretildi', `${acik.ses}`);
ok(acik.titre > 0, 'açıkken telefon titredi', `${acik.titre}`);

console.log('\n5) Duraklat ekranındaki ikizi');
const d = await pg.evaluate(() => {
  window.sliceStart(3);
  window.sliceRun(60);
  document.getElementById('pauseBtn').click();
  const e = document.getElementById('pauseMute');
  if (!e) return { yok: true };
  const once = window.sliceMeta().sessiz, yazi0 = e.textContent.trim();
  const r = e.getBoundingClientRect();
  e.click();
  return { yok: false, once, sonra: window.sliceMeta().sessiz,
           yazi0, yazi1: e.textContent.trim(),
           h: Math.round(r.height),
           ekran: document.getElementById('pause').classList.contains('show'),
           menuSimge: document.getElementById('muteBtn').textContent.trim() };
});
console.log(`     "${d.yazi0}" → "${d.yazi1}" · sessiz ${d.once} → ${d.sonra}`);
ok(!d.yok, 'duraklat ekranında ses tuşu var');
ok(!d.yok && d.ekran, 'duraklat ekranı açıktı');
ok(!d.yok && d.once !== d.sonra, 'duraklattan da çevriliyor');
ok(!d.yok && d.yazi0 !== d.yazi1, 'yazısı durumu söylüyor', `${d.yazi0} / ${d.yazi1}`);
// İki tuş aynı duruma bakıyor: biri çevirince ötekinin simgesi de
// değişmeli, yoksa menüye dönen oyuncu sesin açık olduğunu sanıyor.
ok(!d.yok && d.menuSimge === (d.sonra ? '🔇' : '🔊'), 'menüdeki simge de güncellendi',
   `${d.menuSimge}, sessiz ${d.sonra}`);

ok(!hata.length, 'sayfa hatası yok', hata[0] || '');
console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
