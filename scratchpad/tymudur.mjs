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

console.log('\n3) Her bonus yalnızca kendi işine dokunuyor');
// Dört bonus dört ayrı sisteme bağlı. Her biri **tek tek** ölçülüyor:
// müdür alınınca kendi sayısı değişmeli, ötekiler duruyor olmalı.
const tek = async (i) => pg.evaluate((idx) => {
  window.jeWipeProgress();
  for (let k = 0; k < 4; k++) window.jeSetLevel(k, 20);
  const once = { hiz: window.jeRates().slice(), fiyat: window.jeCost(0, 1),
                 boost: window.jeBoostSecs(), birim: window.jeUnitPrice() };
  window.jeGiveManager(idx);
  return { once, sonra: { hiz: window.jeRates().slice(), fiyat: window.jeCost(0, 1),
                          boost: window.jeBoostSecs(), birim: window.jeUnitPrice() } };
}, i);

const d = await tek(0);
// Derya: ×2 otomasyon **ve** %25 — yani kendi istasyonunda toplam 2.5 kat.
const deryaKat = d.sonra.hiz[0] / d.once.hiz[0];
console.log(`     Derya  döküm hızı ×${deryaKat.toFixed(2)} · öteki istasyonlar ${d.sonra.hiz[1] === d.once.hiz[1] ? 'sabit' : 'DEĞİŞTİ'}`);
ok(Math.abs(deryaKat - 2.5) < 1e-6, 'Derya döküm hızını 2.5 katına çıkarıyor', `${deryaKat.toFixed(3)}`);
ok(d.sonra.hiz[1] === d.once.hiz[1], 'öteki istasyonlara dokunmuyor');

const m = await tek(1);
const marcoKat = m.sonra.fiyat / m.once.fiyat;
console.log(`     Marco  yükseltme fiyatı ×${marcoKat.toFixed(3)}`);
ok(Math.abs(marcoKat - 0.92) < 1e-6, 'Marco yükseltmeleri %8 ucuzlatıyor', `${marcoKat.toFixed(4)}`);

const n = await tek(2);
console.log(`     Ines   hızlandırıcı ${n.once.boost}s → ${n.sonra.boost}s`);
ok(n.sonra.boost - n.once.boost === 60, 'Ines hızlandırıcıya 60 saniye ekliyor');

const kw = await tek(3);
const kwameKat = kw.sonra.birim / kw.once.birim;
console.log(`     Kwame  araç fiyatı ×${kwameKat.toFixed(3)}`);
ok(Math.abs(kwameKat - 1.12) < 1e-6, 'Kwame araç fiyatını %12 artırıyor', `${kwameKat.toFixed(4)}`);

// Dördünün toplam etkisi burada **ölçülmüyor**. İlk yazılışında bir
// bölüm vardı ve `1.25 * 1.12 < 2` diye bir kontrol yapıyordu: testin
// kendi yazdığı iki sabiti yine kendisi çarpıyordu, yani koda hiç
// bakmadan geçiyordu. Dengenin asıl sınavı `scratchpad/tycoon2..6` —
// sahte oyuncuyla saatlerce koşan simülasyonlar.

console.log('\n4) Sıfırlanınca portre kalkıyor');
const sifir = await pg.evaluate(() => {
  window.jeWipeProgress();
  return window.jeMgrKimlik().map(m => m.portreGorunur);
});
ok(sifir.every(p => !p), 'müdürsüz satırda yüz kalmıyor', JSON.stringify(sifir));

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
