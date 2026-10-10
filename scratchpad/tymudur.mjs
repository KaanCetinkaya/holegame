// Müdürler kişi mi, anahtar mı?
//
// Müdür bir anahtardı: alıyorsun, istasyon otomatikleşiyor, bitti. Türün
// her oyununda müdürün adı ve yüzü var; işe alınan şey bir satır değil bir
// kişi oluyor.
//
// Verilen yalnızca kimlik. **Hiçbir sayı değişmiyor** — bu testin asıl işi
// de onu doğrulamak: kimlik eklerken dengeye dokunulmadığı ölçülmeli,
// yoksa "sadece görsel" denip geçilen bir değişiklik ekonomiyi oynatır.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8581);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8581/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 60000 });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

console.log('\n1) Dört ayrı kimlik');
await pg.evaluate(() => { window.jeWipeProgress(); window.jeTutSkip(); });
const k = await pg.evaluate(() => window.jeMgrKimlik());
for (const m of k) console.log(`     ${m.ad.padEnd(7)} ${m.rol}`);
ok(new Set(k.map(m => m.ad)).size === 4, 'adlar farklı');
ok(new Set(k.map(m => m.yuz)).size === 4, 'yüzler farklı');
ok(k.every(m => m.ad && m.rol), 'hepsinin adı ve bir cümlesi var');

console.log('\n2) İşe alınmadan önce ve sonra');
await pg.evaluate(() => {
  window.jeGive(1e7);
  for (let i = 0; i < 4; i++) window.jeSetLevel(i, 20);
});
await pg.waitForTimeout(300);
const once = await pg.evaluate(() => window.jeMgrKimlik());
console.log(`     düğme: "${once[0].dugme.trim()}"`);
ok(/HIRE DERYA/i.test(once[0].dugme), 'düğme adıyla işe alıyor');
ok(!once[0].portreGorunur, 'alınmadan portre yok');

await pg.evaluate(() => window.jeGiveManager(0));
await pg.waitForTimeout(300);
const sonra = await pg.evaluate(() => window.jeMgrKimlik());
console.log(`     satır: "${sonra[0].meta.trim()}"`);
ok(sonra[0].portreGorunur, 'alınınca portre istasyonun simgesinin yerine geçiyor');
ok(/Derya/.test(sonra[0].meta), 'satırda adı yazıyor');
ok(!/manager/i.test(sonra[0].meta), '"manager" yerine kişi');

console.log('\n3) Hiçbir sayı değişmedi');
// Müdürün verdiği şey `MGR_MULT = 2`; kimlik onu değiştirmemeli. Aynı
// istasyon, müdürlü ve müdürsüz, aynı seviyede ölçülüyor.
const sayilar = await pg.evaluate(() => {
  window.jeWipeProgress();
  window.jeSetLevel(0, 20);
  const once = window.jeRates()[0];
  const fiyat = window.jeMgrCost(0);
  window.jeGiveManager(0);
  return { once, sonra: window.jeRates()[0], fiyat };
});
console.log(`     hız ${sayilar.once} → ${sayilar.sonra} · müdür fiyatı ${sayilar.fiyat}`);
ok(Math.abs(sayilar.sonra / sayilar.once - 2) < 1e-6, 'müdür hâlâ tam ×2',
   `${(sayilar.sonra / sayilar.once).toFixed(4)}`);
ok(sayilar.fiyat === 40000, 'fiyat değişmedi', `${sayilar.fiyat}`);

console.log('\n4) Sıfırlanınca portre kalkıyor');
const sifir = await pg.evaluate(() => {
  window.jeWipeProgress();
  return window.jeMgrKimlik().map(m => m.portreGorunur);
});
ok(sifir.every(p => !p), 'müdürsüz satırda yüz kalmıyor', JSON.stringify(sifir));

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
