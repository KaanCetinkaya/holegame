// Puan istemi ne zaman çıkıyor, ne zaman çıkmıyor?
//
//   node build-www.mjs && node scratchpad/holerate.mjs
//
// Puan istemi iki yönden de yanlış yapılabilen bir şey. Az sorarsan oy
// gelmiyor — raftaki rakiplerin hepsi 4.69-4.89 arasında ve 17 binden 170
// bine oy toplamışken bizde sıfır vardı. Çok sorarsan oyuncuyu kaçırıyorsun,
// ve Play "dürüst puanı caydırmak" saydığı şeyleri kurallarla yasaklıyor.
//
// Burada ölçülen: istemin koşulları gerçekten tutuyor mu, ve tutmadığında
// gerçekten susuyor mu.

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-fruithole' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8245);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

const fails = [];
const check = (ok, what, saw) => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what}${saw === undefined ? '' : `   ${saw}`}`);
  if (!ok) fails.push(what);
};

// Cihazda olduğumuzu söyleyen en küçük sahte Capacitor. Tarayıcıda istem
// hiç çıkmamalı — gidecek bir mağaza sayfası yok.
const NATIVE = `window.Capacitor = { isNativePlatform: () => true, Plugins: {} };`;

async function open({ native = true, stats = null, rate = null } = {}) {
  const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
  pg.on('pageerror', e => { console.log('  SAYFA HATASI: ' + e); fails.push(String(e)); });
  if (native) await pg.addInitScript(NATIVE);
  await pg.addInitScript(a => {
    localStorage.clear();
    if (a.stats) localStorage.setItem('fruithole_stats', JSON.stringify(a.stats));
    if (a.rate) localStorage.setItem('fruithole_rate', JSON.stringify(a.rate));
  }, { stats, rate });
  await pg.goto('http://localhost:8245/', { waitUntil: 'load' });
  await pg.waitForFunction(() => window.fruitHoleRate, { timeout: 30000 });
  return pg;
}

const durum = pg => pg.evaluate(() => window.fruitHoleRate());

console.log('\n1. koşullar');
{
  // Yeni oyuncu: beşinci bölümü bitirmeden sorulmaz. İlk oturumunda puan
  // istenen oyuncu oyunu değil istemi hatırlıyor.
  let pg = await open({ stats: { levels: 2, stars: 6 } });
  check((await durum(pg)).due3 === false, 'beşinci bölümden önce sormuyor');
  await pg.close();

  pg = await open({ stats: { levels: 9, stars: 20 } });
  const d = await durum(pg);
  check(d.due3 === true, 'beşinciden sonra ve üç yıldızda soruyor');
  // İki yıldız "iyi an" değil: oyuncu bölümü zar zor geçmiş.
  check(d.due2 === false, 'iki yıldızda sormuyor');
  await pg.close();

  // Tarayıcıda mağaza yok.
  pg = await open({ native: false, stats: { levels: 9, stars: 20 } });
  check((await durum(pg)).due3 === false, 'tarayıcıda hiç sormuyor');
  await pg.close();
}

console.log('\n2. ısrar etmiyor');
{
  // Puan verildiyse bir daha hiç.
  let pg = await open({ stats: { levels: 40, stars: 90 }, rate: { done: true, asks: 1 } });
  check((await durum(pg)).due3 === false, 'puan verildiyse bir daha sormuyor');
  await pg.close();

  // Üç kere sorulduysa yeter.
  pg = await open({ stats: { levels: 40, stars: 90 }, rate: { asks: 3, last: 0 } });
  check((await durum(pg)).due3 === false, 'üç istemden sonra susuyor');
  await pg.close();

  // Dün soruldu: üç gün dolmadan tekrar sorulmaz.
  pg = await open({
    stats: { levels: 40, stars: 90 },
    rate: { asks: 1, last: Date.now() - 86400000 },
  });
  check((await durum(pg)).due3 === false, 'iki istem arası üç gün geçmeden sormuyor');
  await pg.close();

  // Dört gün önce soruldu: artık sorulabilir.
  pg = await open({
    stats: { levels: 40, stars: 90 },
    rate: { asks: 1, last: Date.now() - 4 * 86400000 },
  });
  check((await durum(pg)).due3 === true, 'üç gün geçince tekrar sorabiliyor');
  await pg.close();
}

console.log('\n3. pencere');
{
  const pg = await open({ stats: { levels: 40, stars: 90 } });
  // Pencere kapalı başlamalı: açılışta oyuncunun önüne çıkan bir şey değil.
  check(await pg.evaluate(() => !document.getElementById('rate').classList.contains('show')),
    'açılışta kapalı');

  await pg.evaluate(() => document.getElementById('rate').classList.add('show'));
  const metin = await pg.evaluate(() => document.getElementById('rate').innerText);
  // Play'in kuralı: dürüst puanı caydıran bir şey olamaz. "Beğendin mi?"
  // diye sorup yalnızca evet diyeni mağazaya yollamak tam olarak o. Burada
  // duygu sorusu yok, iki düğme var ve ikisi de dürüst.
  check(!/enjoy.*\?.*\n.*yes|do you like/i.test(metin) || /Google Play/i.test(metin),
    'duygu filtresi yok, soru düz soruluyor');
  check(/Rate/i.test(metin) && /Later/i.test(metin), 'iki düğme de var', metin.replace(/\n/g, ' | '));

  // "Later" hiçbir şeyi işaretlememeli: oyuncu sonra derse sonra sorulur.
  await pg.click('#rateLater');
  await pg.waitForTimeout(200);
  check(await pg.evaluate(() => !document.getElementById('rate').classList.contains('show')),
    'Later pencereyi kapatıyor');
  check((await durum(pg)).done !== true, 'Later puan verilmiş saymıyor');
  await pg.close();
}

console.log('\n4. sormak sayılıyor');
{
  // Sayacı artıran şey istemin **gösterilmesi** olmalı, düğmeye basılması
  // değil. Oyuncu pencereyi görüp hiçbir şeye dokunmadan oyuna dönerse bu
  // da bir istemdir; sayılmazsa üç gün sonra yine sorulur ve "en çok üç
  // kez" kuralı hiçbir zaman dolmaz.
  const pg = await open({ stats: { levels: 40, stars: 90 } });
  check((await durum(pg)).asks === undefined, 'başlangıçta hiç sorulmamış');

  await pg.evaluate(() => window.fruitHoleAskRate());
  await pg.waitForTimeout(150);
  let d = await durum(pg);
  check(d.asks === 1, 'gösterince sayaç 1 oldu', String(d.asks));
  check(typeof d.last === 'number' && Date.now() - d.last < 10000,
    'zaman damgası atıldı');
  check(await pg.evaluate(() => document.getElementById('rate').classList.contains('show')),
    'pencere açıldı');
  // Az önce sorulduğu için hemen tekrar sorulmamalı.
  check(d.done !== true, 'gösterim tek başına puan verilmiş saymıyor');
  check((await durum(pg)).due3 === false, 'hemen ardından tekrar sormuyor');

  // Rate düğmesi: bir daha hiç sorulmasın.
  await pg.click('#rateGo');
  await pg.waitForTimeout(200);
  d = await durum(pg);
  check(d.done === true, 'Rate puan verilmiş olarak işaretliyor');
  check(d.due3 === false, 'işaretlendikten sonra bir daha sormuyor');
  await pg.close();
}

console.log(fails.length ? `\n${fails.length} kontrol düştü` : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length ? 1 : 0);
