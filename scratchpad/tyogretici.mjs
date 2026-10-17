// Öğretici gerçekten öğretiyor mu, yoksa tıklanıp geçilen bir metin mi?
//
// Oyunun kendisini yapan kişi 60. seviyede kilitlendi: işçiyi bulamadı,
// sürüklenerek yürütüldüğünü bilmiyordu, müdürün ne işe yaradığını kaçırdı.
// Dört adımın hiçbiri "tamam"a basarak geçilmiyor — her biri oyuncunun o
// şeyi yapmasıyla kapanıyor. Ölçülen tam olarak bu: adımı **yapmadan**
// ilerlemiyor, yapınca ilerliyor.
//
// Bir de müdür ipucu: öğreticinin dışında, çünkü ne zaman geleceğini
// oyuncunun parası belirliyor.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8579);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8579/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 60000 });
const claim = pg.locator('text=CLAIM').first();
if (await claim.count()) { await claim.click(); await pg.waitForTimeout(400); }

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

// Arayüz turu saniyede sekiz kez dönüyor; bir adım attırıp beklemek yerine
// turun dönmesi bekleniyor — zamanlamaya bağlı test yazılmıyor, sayfanın
// kendi turu kullanılıyor.
const tur = async (n = 3) => {
  for (let i = 0; i < n; i++) await pg.evaluate(() => window.jeStep(0.13));
  await pg.waitForTimeout(220);
  return pg.evaluate(() => window.jeTut());
};

console.log('\n1) Yeni oyuncu');
await pg.evaluate(() => window.jeWipeProgress());
let t = await tur();
console.log(`     adım: ${t.id} · "${t.metin.slice(0, 48)}…"`);
ok(t.adim === 0 && t.id === 'yuru', 'ilk adım yürümek');
ok(t.gorunur, 'şerit görünüyor');

console.log('\n2) Beklemek ilerletmiyor');
// İşçi durduğu yerde: on beş saniye geçse de adım değişmemeli. Bir
// öğreticinin en kolay hatası, zamanla ilerlemek.
await pg.evaluate(() => { window.jeMove(0, 0); for (let i = 0; i < 120; i++) window.jeStep(0.125); });
t = await pg.evaluate(() => window.jeTut());
ok(t.id === 'yuru', '15 saniye bekleyince hâlâ 1. adım', t.id);

console.log('\n3) Yürüyünce geçiyor');
await pg.evaluate(() => { window.jeMove(0, -1); for (let i = 0; i < 6; i++) window.jeStep(0.1); });
t = await tur();
console.log(`     adım: ${t.id} · "${t.metin.slice(0, 48)}…"`);
ok(t.id === 'al', '2. adım: Foundry\'ye gidip al', t.id);

console.log('\n4) Alınca ve bırakınca');
await pg.evaluate(() => {
  window.jeMove(0, 0);
  window.jeWalk(0);                       // Foundry'nin üstü
  for (let i = 0; i < 40; i++) window.jeStep(0.1);
});
t = await tur();
console.log(`     yükten sonra adım: ${t.id}`);
ok(t.id === 'birak', '3. adım: Stamping\'e götür', t.id);

await pg.evaluate(() => {
  window.jeWalk(1);                       // Stamping'in üstü
  for (let i = 0; i < 20; i++) window.jeStep(0.1);
});
t = await tur();
console.log(`     bıraktıktan sonra adım: ${t.id} · işaretli satır: ${t.isaretli}`);
ok(t.id === 'al2', '4. adım: yükseltme al', t.id);
ok(t.isaretli === 0, 'Foundry satırı işaretli', `${t.isaretli}`);

console.log('\n5) Yükseltme alınca öğretici kapanıyor');
await pg.evaluate(() => { window.jeGive(1e4); window.jeBuy(0, 5); });
t = await tur();
ok(t.id === 'bitti', 'öğretici bitti', t.id);
ok(!t.gorunur, 'şerit kayboldu');
ok(t.isaretli === -1, 'işaret kalktı');

console.log('\n6) Müdür ipucu — parası yettiği an');
// Adımlar ayrı `evaluate`lere bölünmek zorunda: ipucu oyunun kendi kare
// döngüsünden çağrılıyor ve tek bir `evaluate` içinde döngüye sıra hiç
// gelmiyor. İlk yazılışında hepsi tek blok oldu ve test, kodun değil
// kendi kurgusunun yüzünden düştü.
await pg.evaluate(() => {
  window.jeWipeProgress();
  window.jeGive(1e4);
  window.jeBuy(0, 10);                    // 8. seviyeyi geç, ama müdür pahalı
  // Öğretici bitmeden ipucu gelmiyor — ikisi aynı şeridi kullanıyor ve
  // sıra öğreticinin. Burada dört adımı da geçmiş bir oyuncu kuruluyor.
  window.jeTutSkip();
});
await pg.waitForTimeout(300);
const ipucuOnce = (await pg.evaluate(() => window.jeTut())).mudurIpucu;
await pg.evaluate(() => window.jeGive(1e6));   // artık yetiyor
await pg.waitForTimeout(300);
const son = await pg.evaluate(() => window.jeTut());
const ipucu = { once: ipucuOnce, sonra: son.mudurIpucu, metin: son.metin };
console.log(`     parası yetmezken: ${ipucu.once} · yetince: ${ipucu.sonra}`);
console.log(`     "${ipucu.metin.slice(0, 60)}…"`);
ok(ipucu.once === 0, 'parası yetmezken çıkmıyor');
ok(ipucu.sonra === 1, 'yetince çıkıyor');
ok(/manager/i.test(ipucu.metin), 'müdürü anlatıyor');

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
