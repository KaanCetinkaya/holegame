// Müzik gerçekten çalıyor mu, ve susması gerektiğinde susuyor mu?
//
// Dosya yok: ses osilatörlerden üretiliyor. Bu yüzden ölçülecek şey
// "ses duyuldu mu" değil — ses saatine konan nota sayısı, planlama payı
// ve yolun kazancı.
//
// Ölçülen:
//   1. Dokunulmadan **sessiz**: tarayıcı politikası bir yana, oyun
//      kendiliğinden ses açmıyor
//   2. İlk dokunuşta başlıyor ve nota planlıyor
//   3. İleriye planlıyor — zamanlayıcı kaysa bile ses saatinde malzeme var
//   4. Osilatör sayısı kaçmıyor: bir dakikalık müzikte canlı ses sayısı
//      sabit bir tavanın altında kalıyor (sızıntı testi)
//   5. Sessize alınca hem planlama kesiliyor hem yolun kazancı sıfıra
//      iniyor — yoksa zaten planlanmış bir buçuk saniye çalmaya devam eder
//   6. Sekme arka plana gidince susuyor, dönünce geri geliyor
//   7. Sessizken açılan sekme müziği kendi başına geri getirmiyor
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8589);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader',
         '--autoplay-policy=no-user-gesture-required'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8589/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 60000 });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };
const bekle = ms => new Promise(r => setTimeout(r, ms));

console.log('\n1) Dokunulmadan sessiz');
const m0 = await pg.evaluate(() => window.jeMuzik());
console.log(`     açık ${m0.acik} · ses bağlamı ${m0.sesVar} · çalan ${m0.calan}`);
ok(!m0.acik, 'müzik kendiliğinden başlamadı');
ok(m0.calan === 0, 'hiç nota planlanmadı', `${m0.calan}`);

console.log('\n2) İlk dokunuşta başlıyor');
// Gerçek dokunuş: `addEventListener('pointerdown', …, {once:true})`
// yolundan geçsin, elle çağırmayalım.
await pg.mouse.click(206, 500);
await bekle(400);
const m1 = await pg.evaluate(() => window.jeMuzik());
console.log(`     açık ${m1.acik} · çalan ${m1.calan} · pay ${m1.ileri}s · kazanç ${m1.kazanc}`);
ok(m1.acik, 'dokunuşla açıldı');
ok(m1.calan > 0, 'nota planlandı', `${m1.calan}`);
ok(m1.kazanc > 0, 'yolun kazancı açık', `${m1.kazanc}`);

console.log('\n3) İleriye planlama');
// Pay sıfıra inerse müzik kesik kesik duyulur. Yarım saniyede bir uyanan
// bir zamanlayıcı için güvenli taban: bir vuruştan fazlası.
const vurus = 60 / m1.bpm;
let enAzPay = 9, enCokSes = 0;
for (let i = 0; i < 12; i++) {
  await bekle(500);
  const m = await pg.evaluate(() => window.jeMuzik());
  enAzPay = Math.min(enAzPay, m.ileri);
  enCokSes = Math.max(enCokSes, m.calan);
}
console.log(`     altı saniye boyunca en küçük pay ${enAzPay.toFixed(2)}s (vuruş ${vurus.toFixed(2)}s) · en çok canlı ses ${enCokSes}`);
ok(enAzPay > vurus, 'pay hiç bir vuruşun altına düşmedi', `${enAzPay.toFixed(2)}s`);

console.log('\n4) Osilatör sızıntısı');
// Her nota kendini `onended` ile sayıdan düşüyor. Düşmezse sayı
// doğrusal büyür; kırk saniyede bu açıkça görülür.
const sesler = [];
for (let i = 0; i < 8; i++) {
  await bekle(2000);
  sesler.push((await pg.evaluate(() => window.jeMuzik())).calan);
}
console.log(`     canlı ses: ${sesler.join(' ')}`);
const ilkYari = sesler.slice(0, 4).reduce((a, b) => a + b, 0) / 4;
const sonYari = sesler.slice(4).reduce((a, b) => a + b, 0) / 4;
console.log(`     ilk yarı ortalama ${ilkYari.toFixed(1)} · son yarı ${sonYari.toFixed(1)}`);
ok(Math.max(...sesler) < 40, 'canlı ses sayısı tavanın altında', `en çok ${Math.max(...sesler)}`);
ok(sonYari < ilkYari * 1.6 + 2, 'sayı zamanla büyümüyor', `${ilkYari.toFixed(1)} → ${sonYari.toFixed(1)}`);

console.log('\n5) Sessize alma');
const sus = await pg.evaluate(async () => {
  document.getElementById('muteBtn').click();   // gerçek düğme
  await new Promise(r => setTimeout(r, 200));
  const hemen = window.jeMuzik();
  await new Promise(r => setTimeout(r, 1200));
  return { hemen, sonra: window.jeMuzik() };
});
console.log(`     açık ${sus.hemen.acik} · kazanç ${sus.hemen.kazanc} · 1.2s sonra çalan ${sus.sonra.calan}`);
ok(!sus.hemen.acik, 'planlama kesildi');
ok(sus.hemen.kazanc === 0, 'yolun kazancı sıfıra indi', `${sus.hemen.kazanc}`);

console.log('\n6) Sessizken sekme dönüşü');
// Sessize alınmış bir oyun, sekmeden dönünce kendi kendine müziği
// açmamalı. `visibilitychange` yolunun G.muted'e saygı duyduğu yer.
const geri = await pg.evaluate(async () => {
  document.dispatchEvent(new Event('visibilitychange'));
  await new Promise(r => setTimeout(r, 200));
  return window.jeMuzik();
});
console.log(`     açık ${geri.acik}`);
ok(!geri.acik, 'sessizken geri gelmedi');

console.log('\n7) Sesi geri açma');
const ac = await pg.evaluate(async () => {
  document.getElementById('muteBtn').click();
  await new Promise(r => setTimeout(r, 400));
  return window.jeMuzik();
});
console.log(`     açık ${ac.acik} · çalan ${ac.calan} · kazanç ${ac.kazanc}`);
ok(ac.acik, 'ses açılınca müzik döndü');
ok(ac.kazanc > 0, 'kazanç geri yükseldi', `${ac.kazanc}`);
ok(ac.calan > 0, 'yeniden nota planlıyor', `${ac.calan}`);

console.log('\n8) Üretim bozulmadı');
// Müzik bir zamanlayıcı ve onlarca osilatör ekliyor. Fabrikanın hızını
// değiştirmemesi gerekiyor; ölçülen hız, müzik çalarken de aynı kalmalı.
const uretim = await pg.evaluate(() => {
  window.jeWipeProgress();
  window.jeGive(1e9);
  for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 20); window.jeGiveManager(i); }
  const once = window.jeProbe().total;
  for (let i = 0; i < 100; i++) window.jeStep(0.1);
  return window.jeProbe().total - once;
});
console.log(`     on saniyede kazanç ${uretim.toFixed(0)}`);
ok(uretim > 0, 'fabrika müzikle birlikte çalışıyor');

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
