// Zamanlı sandık: ne zaman dolu, ne veriyor, ne kadar bekletiyor?
//
//   node build-www.mjs && node scratchpad/holechest.mjs
//
// Sandık, ekonominin içine sızabilen tek şey. Üç türlü yanlış yapılabiliyor
// ve üçü de sessiz:
//
//   1. Fazla verirse beklemek oynamaktan kârlı hale geliyor. Bir bölüm o
//      meyveden ~400 ödüyor; sandık bunun yarısını geçmemeli.
//   2. Sayaç yanlış kurulursa sandık ya hiç dolmuyor ya sürekli dolu
//      kalıyor. Telefonun saati geri alındığında kalan süre bir turluk
//      aralıktan büyük görünüyor ve sandık aylarca kilitlenebiliyor.
//   3. Ödül rastgele olsaydı Play'in "ganimet kutusu" kuralları devreye
//      girerdi. Sıra hem onu çözüyor hem de biriktiren oyuncuya istediği
//      meyvenin geleceğini garanti ediyor — ama ancak sıra gerçekten
//      dönüyorsa.
//
// Burada üçü de ölçülüyor, artı düğmenin ilk bölümden önce görünmemesi.

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
}).listen(8250);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

const fails = [];
const check = (ok, what, saw) => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what}${saw === undefined ? '' : `   ${saw}`}`);
  if (!ok) fails.push(what);
};

const OYNAMIS = { fruits: 900, levels: 7, stars: 16, bestCombo: 5 };

async function open({ stats = OYNAMIS, level = 8, chest = null, menu = true } = {}) {
  const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
  pg.on('pageerror', e => { console.log('  SAYFA HATASI: ' + e); fails.push(String(e)); });
  // Tohumlama yalnızca ilk yüklemede. addInitScript her gezinmede — reload
  // dahil — çalışıyor; `localStorage.clear()` orada da çalışırsa sayfayı
  // yenileyerek kalıcılığı ölçmek imkânsız oluyor, çünkü ölçülen şeyi
  // kurulum siliyor. İlk yazışımda "yeniden açılınca hâlâ bekliyor" testi
  // tam olarak bu yüzden düştü. sessionStorage sekme boyunca yaşıyor.
  await pg.addInitScript(a => {
    if (sessionStorage.getItem('tohum')) return;
    sessionStorage.setItem('tohum', '1');
    localStorage.clear();
    if (a.stats) localStorage.setItem('fruithole_stats', JSON.stringify(a.stats));
    if (a.level) localStorage.setItem('fruithole_level', String(a.level));
    if (a.chest) localStorage.setItem('fruithole_tchest', JSON.stringify(a.chest));
  }, { stats, level, chest });
  await pg.goto('http://localhost:8250/', { waitUntil: 'load' });
  await pg.waitForFunction(() => window.fruitHoleChest, { timeout: 40000 });
  if (menu) {
    // Günlük ödül penceresi açılışta önü kesiyor.
    await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });
    await pg.waitForTimeout(600);
  }
  return pg;
}

const durum = pg => pg.evaluate(() => window.fruitHoleChest());
const cuzdan = pg => pg.evaluate(() => window.fruitHoleWallet());
const SAAT = 3600000;

console.log('\n1. ilk bölümden önce yok');
{
  // Günlük ödülde öğrenilen kural: oyunu hiç oynamamış birine ödül
  // ekonomisini tanıtmak, oyunu tanıtmadan önce oluyor.
  let pg = await open({ stats: { fruits: 0, levels: 0, stars: 0, bestCombo: 0 }, level: 1 });
  check((await durum(pg)).shown === false, 'yeni oyuncuda sandık görünmüyor');
  await pg.close();

  pg = await open();
  check((await durum(pg)).shown === true, 'oynamış oyuncuda görünüyor');
  await pg.close();
}

console.log('\n2. sayaç');
{
  // İlk sandık bekletmiyor: özelliğin çalıştığını görmenin tek yolu.
  let pg = await open();
  let d = await durum(pg);
  check(d.left === 0, 'ilk sandık hazır');
  check(d.label === 'Free', 'düğmede Free yazıyor', d.label);
  await pg.close();

  // Bir saat kalmış.
  pg = await open({ chest: { n: 1, at: Date.now() + SAAT } });
  d = await durum(pg);
  check(d.left > 0 && d.left <= SAAT, 'kalan süre okunuyor', `${Math.round(d.left / 60000)} dk`);
  // Bir saatin altında saat hanesi yazılmıyor: 0:59:58 değil 59:58.
  check(/^(\d+:)?\d+:\d\d$/.test(d.label), 'düğmede geri sayım var', d.label);
  await pg.close();

  // Süresi dolmuş.
  pg = await open({ chest: { n: 1, at: Date.now() - 1000 } });
  check((await durum(pg)).left === 0, 'süresi dolan sandık hazır');
  await pg.close();

  // Saat geri alınmış: kayıtta yıllar sonrası yazıyor. Sandık sonsuza
  // kadar kilitli kalmamalı; sayaç bir tur başa sarmalı.
  pg = await open({ chest: { n: 1, at: Date.now() + 400 * 24 * SAAT } });
  d = await durum(pg);
  check(d.left > 0 && d.left <= 4 * SAAT + 5000,
    'saat geri alınınca en fazla bir tur bekletiyor', `${(d.left / SAAT).toFixed(2)} saat`);
  await pg.close();
}

console.log('\n3. ödül');
{
  // Ölçek: bir bölüm o meyveden ~400 ödüyor (README, "Ekonomi"). Sandık
  // bunun yarısını geçerse beklemek oynamaktan kârlı olmaya başlıyor.
  let pg = await open({ level: 1 });
  let d = await durum(pg);
  check(d.loot.kind === 'fruit' && d.loot.amount >= 100 && d.loot.amount <= 200,
    '1. bölümde makul', `${d.loot.amount}`);
  await pg.close();

  pg = await open({ level: 40 });
  d = await durum(pg);
  check(d.loot.amount <= 280, 'üst uçta bile bir bölümün yarısını geçmiyor', `${d.loot.amount}`);
  await pg.close();

  // Sıra: dört meyve dönüyor, her üçüncü sandık booster. Rastgele değil.
  const sira = [];
  for (let n = 0; n < 12; n++) {
    const p = await open({ chest: { n, at: Date.now() - 1000 } });
    const l = (await durum(p)).loot;
    sira.push(l.kind === 'booster' ? `B:${l.id}` : l.type);
    await p.close();
  }
  console.log(`    sıra: ${sira.join(' ')}`);
  const meyveler = new Set(sira.filter(s => !s.startsWith('B:')));
  check(meyveler.size === 4, 'dört meyvenin dördü de geliyor', [...meyveler].join(' '));
  check(sira.filter(s => s.startsWith('B:')).length === 4, 'her üçüncü sandık booster');
  const bSira = new Set(sira.filter(s => s.startsWith('B:')));
  check(bSira.size > 1, 'boosterlar da dönüyor, hep aynısı gelmiyor', [...bSira].join(' '));
}

console.log('\n4. açmak');
{
  const pg = await open();
  const once = await cuzdan(pg);
  const d = await durum(pg);

  await pg.click('#tchestBtn');
  await pg.waitForTimeout(300);
  check(await pg.evaluate(() => document.getElementById('tchest').classList.contains('show')),
    'düğme ekranı açıyor');
  // Ne kazanılacağı açmadan yazıyor: kapalı kutuya basmak kumar hissi
  // veriyor, beklenen bir ödülü almak vermiyor.
  const metin = await pg.evaluate(() => document.getElementById('tchestLoot').innerText);
  check(metin.trim().length > 0 && metin === d.text, 'ödül açmadan yazıyor', metin);

  await pg.click('#tchestTake');
  await pg.waitForTimeout(400);
  const sonra = await cuzdan(pg);
  check(sonra[d.loot.type] - once[d.loot.type] === d.loot.amount,
    'ödül cüzdana yazıldı', `${once[d.loot.type]} > ${sonra[d.loot.type]}`);

  const d2 = await durum(pg);
  check(d2.left > 3.9 * SAAT, 'açınca sayaç dört saate kuruldu',
    `${(d2.left / SAAT).toFixed(2)} saat`);
  check(d2.n === d.n + 1, 'sayaç ilerledi');
  check(d2.label !== 'Free', 'düğme geri sayıma geçti', d2.label);
  check(await pg.evaluate(() => document.getElementById('menu').classList.contains('show')),
    'menüye dönüldü');

  // Boş sandığa basmak bir şey vermemeli.
  const kasa = await cuzdan(pg);
  await pg.click('#tchestBtn');
  await pg.waitForTimeout(250);
  check(await pg.evaluate(() => document.getElementById('tchestTake').hidden),
    'dolmamışken Open düğmesi yok');
  await pg.evaluate(() => document.getElementById('tchestTake').click());
  await pg.waitForTimeout(250);
  const kasa2 = await cuzdan(pg);
  check(JSON.stringify(kasa) === JSON.stringify(kasa2), 'dolmamış sandık ödül vermiyor');
  await pg.close();
}

console.log('\n5. kayıt');
{
  // Sandık iki oturum arasında hatırlanmazsa süre her açılışta sıfırlanır
  // ve sandık sınırsız olur.
  const pg = await open();
  await pg.click('#tchestBtn');
  await pg.waitForTimeout(250);
  await pg.click('#tchestTake');
  await pg.waitForTimeout(300);
  const kayit = JSON.parse(await pg.evaluate(() => localStorage.getItem('fruithole_tchest')));
  check(kayit && kayit.n === 1 && kayit.at > Date.now(), 'diske yazıldı', JSON.stringify(kayit));

  await pg.reload({ waitUntil: 'load' });
  await pg.waitForFunction(() => window.fruitHoleChest, { timeout: 40000 });
  const d = await durum(pg);
  check(d.left > 3.9 * SAAT, 'yeniden açılınca hâlâ bekliyor', `${(d.left / SAAT).toFixed(2)} saat`);
  await pg.close();
}

console.log('\n6. yerleşim');
{
  // Sandık Play'in yoluna girmemeli: menünün tek işi Play'e bastırmak.
  for (const vp of [{ width: 412, height: 915 }, { width: 360, height: 640 }]) {
    const pg = await br.newPage({ viewport: vp });
    pg.on('pageerror', e => { console.log('  SAYFA HATASI: ' + e); fails.push(String(e)); });
    await pg.addInitScript(a => {
      localStorage.clear();
      localStorage.setItem('fruithole_stats', JSON.stringify(a));
      localStorage.setItem('fruithole_level', '8');
    }, OYNAMIS);
    await pg.goto('http://localhost:8250/', { waitUntil: 'load' });
    await pg.waitForFunction(() => window.fruitHoleChest, { timeout: 40000 });
    await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });
    await pg.waitForTimeout(600);

    const g = await pg.evaluate(() => {
      const r = e => document.getElementById(e).getBoundingClientRect().toJSON();
      return { c: r('tchestBtn'), p: r('playTray'), n: r('menuNav'), w: innerWidth, h: innerHeight };
    });
    const ad = `${vp.width}x${vp.height}`;
    const cakisma = !(g.c.right <= g.p.left || g.c.left >= g.p.right
      || g.c.bottom <= g.p.top || g.c.top >= g.p.bottom);
    check(!cakisma, `${ad}: Play tepsisiyle çakışmıyor`);
    check(g.c.bottom <= g.n.top, `${ad}: alt çubuğun üstünde`,
      `${Math.round(g.c.bottom)} <= ${Math.round(g.n.top)}`);
    check(g.c.left >= 0 && g.c.right <= g.w && g.c.top >= 0, `${ad}: ekranın içinde`);
    await pg.close();
  }
}

console.log(fails.length ? `\n${fails.length} kontrol düştü` : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length ? 1 : 0);
