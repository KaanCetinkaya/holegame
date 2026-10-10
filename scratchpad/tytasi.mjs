// Elle taşımak kaç seviyeye kadar bir anlam ifade ediyor?
//
// Kaan 60. seviyede kilitlendi: geliri `0 / s`, Stamping müdürü 110K, ve
// elle taşıyarak oraya ulaşması saatler sürüyordu. Sebep şüphesi
// `CARRY_BASE = 6`: taşıma kapasitesi sabit, oysa istasyon üretimi
// seviyeyle birlikte üstel büyüyor.
//
// Ölçülen, seviye seviye:
//   uretim      — istasyonun (müdürsüz) saniyedeki üretimi
//   tasima      — işçinin bir seferde taşıdığı
//   elle/s      — işçinin durduğu halkada saniyede taşıdığı
//   halka       — bunun o istasyonun üretimine oranı
//   zincir      — bütün fabrikaya oranı
//
// `halka` ile `zincir` ayrı, çünkü karıştırmak ilk ölçümde yanlış sonuca
// götürdü: işçi durduğu halkada üretime yetişiyor ama **aynı anda tek bir
// halkada** durabiliyor ve üç halka var. Üstelik müdür o halkayı iki
// katına çıkarıyor (`MGR_MULT = 2`). Yani zincir oranı = halka / (3 × 2).
//
// Aranan şey: `zincir` sıfıra gitmemeli (müdürsüz oyuncu kilitlenmesin)
// ama bire de yaklaşmamalı (müdür almak anlamsızlaşmasın).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8574);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8574/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 60000 });

// Bir tam turun süresi: Foundry'den al, Stamping'e bırak, geri dön.
//
// Varsayılmıyor çünkü mesafe sabit ama hız araştırmayla değişmiyor: bir kez
// ölçmek yetiyor ve ölçülen sayı aşağıdaki bütün hesabı besliyor.
const turSuresi = await pg.evaluate(() => {
  const BAYZ = [-1.5, -8.5];
  let t = 0;
  const dt = 1 / 60;
  // Foundry'ye git
  window.jeTeleport(2.4, BAYZ[0]); window.jeStep(dt);
  // Stamping'e yürü: -z yönü
  window.jeMove(0, -1);
  while (t < 30) { window.jeStep(dt); t += dt; if (window.jeProbe().wz <= BAYZ[1]) break; }
  const gidis = t;
  return +(gidis * 2).toFixed(2);          // gidiş + dönüş
});
console.log(`\nbir gidiş-dönüş: ${turSuresi} sn (ölçüldü)`);

console.log('\n  seviye   üretim/s    taşıma     elle/s    halka   zincir');
console.log('  -------+-----------+--------+----------+--------+--------');

const satir = [];
for (const lv of [1, 5, 10, 20, 40, 60, 100, 185]) {
  const o = await pg.evaluate(l => {
    // jeReset sayfayı yeniden yüklüyor ve ölçüm bağlamını yıkıyor; burada
    // gereken zaten yalnızca seviyeyi koymak.
    window.jeSetLevel(0, l);
    window.jeSetLevel(1, l);
    const uretim = window.jeRates()[0];
    const tasima = window.jeCarryMax();
    const mgrCost = window.jeMgrCost(1);          // Stamping'in müdürü
    const fiyat = window.jeProbe().price;
    return { uretim, tasima, mgrCost, fiyat };
  }, lv);
  // Bir turda `tasima` parça gidiyor.
  const elleSn = o.tasima / turSuresi;
  const halka = elleSn / o.uretim;
  // Üç halka, ve müdür halkayı iki katına çıkarıyor.
  const zincir = halka / (3 * 2);
  satir.push({ lv, ...o, elleSn, halka, zincir });
  console.log(`  ${String(lv).padStart(6)}   ${o.uretim.toFixed(1).padStart(9)}   ` +
    `${String(o.tasima).padStart(6)}   ${elleSn.toFixed(2).padStart(8)}   ` +
    `${('%' + (halka * 100).toFixed(1)).padStart(6)}   ${('%' + (zincir * 100).toFixed(1)).padStart(6)}`);
}

console.log('\nelle taşımanın bütün fabrikaya oranı:');
const ilk = satir[0], son = satir[satir.length - 1];
console.log(`  seviye ${ilk.lv}: %${(ilk.zincir * 100).toFixed(1)}  →  seviye ${son.lv}: %${(son.zincir * 100).toFixed(1)}`);

// İki eşik. Müdürler 8. seviyede açıldığı için ölçüm oradan sonrası için
// anlamlı — 1. seviyede alınacak bir müdür yok.
const bakilan = satir.filter(s => s.lv >= 10);
const olu = bakilan.filter(s => s.zincir < 0.05);
const fazla = bakilan.filter(s => s.zincir > 0.40);
console.log(`\n  zincir payı %5'in altında (müdürsüz oyuncu kilitlenir): ${olu.length}/${bakilan.length}` +
  (olu.length ? ` — ${olu.map(s => `lv${s.lv} %${(s.zincir * 100).toFixed(2)}`).join(' · ')}` : ''));
console.log(`  zincir payı %40'ın üstünde (müdür anlamsızlaşır): ${fazla.length}/${bakilan.length}` +
  (fazla.length ? ` — ${fazla.map(s => `lv${s.lv} %${(s.zincir * 100).toFixed(1)}`).join(' · ')}` : ''));
const fail = olu.length + fazla.length;
console.log(fail ? `\n${fail} seviye eşiğin dışında` : '\nhepsi aralıkta');
process.exitCode = fail ? 1 : 0;

await br.close(); srv.close();
