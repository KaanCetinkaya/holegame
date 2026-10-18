// Fabrika kapalıyken durduysa, oyuncu bunu öğreniyor mu?
//
// Ölçülerek bulundu (`scratchpad/tycevrimdisi.mjs`): Sevkiyat dışındaki
// bir istasyonun müdürü yoksa kapalı fabrika **hiç** kazanmıyor. Oyun
// bunu hiçbir yerde söylemiyordu — üstelik kazanç sıfırken dönüş ekranı
// hiç açılmıyordu, yani oyuncu geri geldiğinde sessizlikle karşılaşıyordu.
//
// Kaan'ın 60. seviyeye kadar elle taşıyıp oyunun idle yarısını hiç
// görmemesinin sebebi tam olarak bu sessizlik.
//
// Ölçülen:
//   1. Müdürsüz oyuncu döndüğünde ekran **açılıyor**
//   2. Ekran sebebi söylüyor ve eksik istasyonları adıyla sayıyor
//   3. Sevkiyat o listede yok — müdürsüz de olsa satıyor
//   4. Sıfır kazançta "reklam izle ×2" düğmesi gizli
//   5. Kazanç varken ekran eski hâlinde
//   6. İki dilde de doğru
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8629);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

async function ac(locale) {
  const ctx = await br.newContext({ viewport: { width: 412, height: 915 }, locale });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => console.log('HATA ' + e));
  await pg.addInitScript(() => localStorage.clear());
  await pg.goto('http://localhost:8629/', { waitUntil: 'load', timeout: 90000 });
  await pg.waitForFunction(() => typeof window.jeProbe === 'function', null, { timeout: 60000 });
  await pg.evaluate(() => { document.getElementById('dOk')?.click(); window.jeTutSkip(); });
  return pg;
}

// Dönüşü oynat ve ekranda ne yazdığını oku.
const don = (pg, kur) => pg.evaluate(k => {
  const hazirla = eval('(' + k + ')');
  window.jeWipeProgress();
  window.jeTutSkip();
  document.getElementById('welcome').classList.remove('show');
  hazirla();
  const r = window.jeOffline(4 * 3600);
  const el = document.getElementById('welcome');
  return {
    donen: r,
    acik: el.classList.contains('show'),
    baslik: document.getElementById('wTitle').textContent.trim(),
    alt: document.getElementById('wSub').textContent.trim(),
    kazanc: document.getElementById('wCash').textContent.trim(),
    reklam: getComputedStyle(document.getElementById('wDouble')).display,
    tamam: document.getElementById('wOk').textContent.trim(),
  };
}, kur);

const pg = await ac('tr-TR');

console.log('\n1) Müdürsüz dönüş');
const bos = await don(pg, `() => {
  window.jeGive(1e9);
  for (let i = 0; i < 4; i++) window.jeSetLevel(i, 40);
}`);
console.log(`     ekran açık ${bos.acik} · başlık "${bos.baslik}"`);
console.log(`     alt: ${bos.alt}`);
console.log(`     reklam düğmesi ${bos.reklam} · tamam düğmesi "${bos.tamam}"`);
ok(bos.acik, 'kazanç sıfırken bile ekran açıldı');
ok(/durdu|stopped/i.test(bos.baslik), 'başlık hattın durduğunu söylüyor', bos.baslik);
ok(/Döküm/.test(bos.alt) && /Pres/.test(bos.alt) && /Montaj/.test(bos.alt),
   'eksik istasyonlar adıyla sayılıyor', bos.alt.slice(0, 60));
ok(!/Sevkiyat/.test(bos.alt), 'Sevkiyat listede yok — müdürsüz de satıyor');
ok(bos.reklam === 'none', 'reklam düğmesi gizli — sıfırın iki katı sıfır', bos.reklam);
ok(/ANLADIM/i.test(bos.tamam), 'düğme "topla" demiyor', bos.tamam);

console.log('\n2) Tek eksik müdür');
const tek = await don(pg, `() => {
  window.jeGive(1e9);
  for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 40); window.jeGiveManager(i); }
  window.jeTakeManager(1);
}`);
console.log(`     başlık "${tek.baslik}" · alt: ${tek.alt.slice(0, 80)}`);
ok(tek.acik && /durdu/i.test(tek.baslik), 'tek eksik müdür de hattı durduruyor');
ok(/Pres/.test(tek.alt) && !/Döküm/.test(tek.alt) && !/Montaj/.test(tek.alt),
   'yalnızca eksik olan sayılıyor', tek.alt.slice(0, 60));

console.log('\n3) Sevkiyat müdürsüz');
// Ölçülen kural: Sevkiyat müdürsüz de satıyor, yalnızca yarı hızda.
// Yani ekran "hat durdu" dememeli.
const sevk = await don(pg, `() => {
  window.jeGive(1e9);
  for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 40); window.jeGiveManager(i); }
  window.jeTakeManager(3);
}`);
console.log(`     başlık "${sevk.baslik}" · kazanç ${sevk.kazanc} · reklam ${sevk.reklam}`);
ok(!/durdu/i.test(sevk.baslik), 'Sevkiyat müdürsüzken hat durmuş sayılmıyor', sevk.baslik);
ok(sevk.donen.got > 0, 'gerçekten kazanıyor', `${sevk.donen.got.toFixed(0)}`);
ok(sevk.reklam !== 'none', 'reklam düğmesi görünür');

console.log('\n4) Normal dönüş');
const tam = await don(pg, `() => {
  window.jeGive(1e9);
  for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 40); window.jeGiveManager(i); }
}`);
console.log(`     başlık "${tam.baslik}" · kazanç ${tam.kazanc} · tamam "${tam.tamam}"`);
ok(/hoş geldin|welcome/i.test(tam.baslik), 'normal dönüşte eski başlık', tam.baslik);
ok(/TOPLA|COLLECT/i.test(tam.tamam), 'düğme topla diyor', tam.tamam);
ok(tam.reklam !== 'none', 'reklam düğmesi görünür');

console.log('\n5) İngilizce');
const pgEn = await ac('en-US');
const enBos = await don(pgEn, `() => {
  window.jeGive(1e9);
  for (let i = 0; i < 4; i++) window.jeSetLevel(i, 40);
}`);
console.log(`     başlık "${enBos.baslik}"`);
console.log(`     alt: ${enBos.alt.slice(0, 90)}`);
ok(/stopped/i.test(enBos.baslik), 'İngilizce başlık', enBos.baslik);
ok(/Foundry/.test(enBos.alt) && /Stamping/.test(enBos.alt),
   'İngilizce istasyon adları', enBos.alt.slice(0, 60));
ok(/GOT IT/i.test(enBos.tamam), 'İngilizce düğme', enBos.tamam);

console.log('\n6) Kısa yokluk ekran açmıyor');
// Bir dakikadan kısa yokluk zaten dönüş sayılmıyor; her sekme
// değişiminde ekran açılsaydı oyun kullanılamazdı.
const kisa = await pg.evaluate(() => {
  window.jeWipeProgress();
  document.getElementById('welcome').classList.remove('show');
  const r = window.jeOffline(30);
  return { r, acik: document.getElementById('welcome').classList.contains('show') };
});
console.log(`     30 saniyelik yokluk: dönen ${JSON.stringify(kisa.r)} · ekran ${kisa.acik}`);
ok(!kisa.acik, 'otuz saniyelik yokluk ekran açmıyor');

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
