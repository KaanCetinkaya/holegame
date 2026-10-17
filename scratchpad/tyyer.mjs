// Her şube başka bir yerde mi kuruluyor?
//
// Prestij oyunun ana döngüsü ve onu yapmanın tek ödülü sayılardı: aynı
// fabrika, aynı avlu, baştan. Artık her şubenin kendi yeri var — fabrika
// aynı, etrafı değişiyor.
//
// Ölçülen dört şey:
//   1. Beş yer gerçekten birbirinden farklı mı (gök, zemin, ağaç)
//   2. Altıncı şube başa sarıyor mu
//   3. Yer değişimi GPU'da doku biriktiriyor mu — zemin dokusu her
//      seferinde yeniden çiziliyor ve eskisi atılmazsa her prestij bir
//      doku bırakır
//   4. Prestij gerçekten yeri değiştiriyor mu
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8586);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8586/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 60000 });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

console.log('\n1) Yerler');
// Sayı oyundan okunuyor. "Beş" diye yazılmış bir ölçüm, altıncı yer
// eklendiğinde sessizce yanlış olurdu — bu depoda elle yazılmış
// sayıların yaşlanması birkaç kez oldu.
const ADET = (await pg.evaluate(() => window.jeYerler())).en.length;
console.log(`     oyunda ${ADET} yer tanımlı`);
const yerler = [];
for (let b = 0; b < ADET; b++) {
  const y = await pg.evaluate(n => { window.jeSetBranch(n); return window.jeYer(); }, b);
  yerler.push(y);
  console.log(`     ${b}  ${y.ad.padEnd(8)} gök ${y.gok} · yaprak ${y.yaprak[0]} · gövde ${y.govde}`);
}
ok(new Set(yerler.map(y => y.ad)).size === ADET, `${ADET} ayrı ad`,
   `${new Set(yerler.map(y => y.ad)).size}`);
ok(new Set(yerler.map(y => y.gok)).size === ADET, `${ADET} ayrı gökyüzü`,
   `${new Set(yerler.map(y => y.gok)).size}`);
ok(new Set(yerler.map(y => y.yaprak[0])).size >= ADET - 2,
   'yaprak renkleri neredeyse hepsinde ayrı',
   `${new Set(yerler.map(y => y.yaprak[0])).size}/${ADET}`);
ok(yerler.every(y => y.sis === y.gok), 'sis gökyüzüyle aynı renk');

console.log('\n2) Liste bitince başa sarıyor');
const alti = await pg.evaluate(n => { window.jeSetBranch(n); return window.jeYer(); }, ADET);
console.log(`     şube ${ADET} → ${alti.ad}`);
ok(alti.ad === yerler[0].ad, `şube ${ADET}, ilk yere dönüyor`, alti.ad);

console.log('\n3) Doku biriktirmiyor');
// Zemin dokusu renkleri tuvale çizili, malzeme rengiyle değiştirilemiyor;
// her yer değişiminde yeniden üretiliyor. Eskisi atılmazsa her prestij
// GPU'da bir doku bırakır ve uzun oynayan bir oyuncuda birikir.
const doku = await pg.evaluate(() => {
  const once = window.jeYer().dokular;
  for (let i = 0; i < 30; i++) window.jeSetBranch(i % window.jeYerler().en.length);
  return { once, sonra: window.jeYer().dokular };
});
console.log(`     30 yer değişimi: ${doku.once} doku → ${doku.sonra}`);
ok(doku.sonra <= doku.once, 'doku sayısı artmıyor', `${doku.once} → ${doku.sonra}`);

console.log('\n4) Prestij yeri değiştiriyor');
const pres = await pg.evaluate(() => {
  window.jeWipeProgress();
  const once = window.jeYer();
  // `jeSetEarned`, `jeSetLifetime` değil: prestij dalın **kazandığına**
  // bakıyor (`pendingPoints`), ömür boyu toplama değil. Ömür boyu
  // toplamı yükseltmek bankadaki puanı artırıyor ama bekleyen puanı
  // sıfırda bırakıyor, yani düğme açılmıyor. Kancanın kendi yorumu bunu
  // söylüyor ve yine de yanlışı seçildi.
  window.jeSetEarned(2.5e11);
  // Menü açılmadan `prestigeBtn` devre dışı ve tıklama boşa gidiyor —
  // `jePrestige` düğmeye basıyor, düğme kapalıysa hiçbir şey olmuyor ve
  // test "şube artmadı" diye düşüyor. İlk koşuda tam bu oldu.
  document.getElementById('menuBtn').click();
  window.jePrestige();
  return { once: once.ad, sonra: window.jeYer().ad, sube: window.jeYer().sube };
});
console.log(`     ${pres.once} → ${pres.sonra} (şube ${pres.sube})`);
ok(pres.sube === 1, 'şube sayısı arttı', `${pres.sube}`);
ok(pres.sonra !== pres.once, 'yer değişti', `${pres.once} → ${pres.sonra}`);

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
