// Günlük meydan okuma gerçekten adil mi?
//
//   node build-www.mjs && node scratchpad/holedaily.mjs
//
// Bu modun tek bir iddiası var: **aynı gün, aynı tarla, aynı delik.** İkisi
// de doğru değilse iki koşuyu karşılaştırmak anlamsız, yani mod anlamsız.
// O yüzden burada ölçülen şey ekranın görüntüsü değil, o iddia:
//
//   1. Bambaşka iki oyuncu profili (farklı bölüm, farklı yükseltme, farklı
//      kaplama) aynı gün aynı tarlayı kuruyor mu — parça parça, birebir?
//   2. Yükseltmeler koşuya karışmıyor mu? Karışsaydı skor oyunu ne kadar
//      oynadığını ölçerdi, o gün nasıl oynadığını değil.
//   3. Günlük koşu ilerlemeye dokunuyor mu? Dokunmamalı: ne bölüm ilerlesin
//      ne yıldız yazılsın, yoksa "herkese aynı tarla" bir tarlaya döner.
//   4. Seri gün sayıyor mu, koşu değil mi? Aynı gün ikinci koşu seriyi
//      artırmamalı.
//   5. Daha kötü bir koşu rekoru bozuyor mu?

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
}).listen(8210);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

const fails = [];
const errs = [];
const check = (ok, what, saw) => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what}${saw === undefined ? '' : `   ${saw}`}`);
  if (!ok) fails.push(what);
};

// Belirli bir oyuncu profiliyle bir sekme aç.
async function open(profile) {
  const ctx = await br.newContext({ viewport: { width: 412, height: 915 } });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errs.push(String(e)));
  await pg.addInitScript((p) => {
    localStorage.setItem('fruithole_level', p.level);
    localStorage.setItem('fruithole_upgrades', JSON.stringify(p.upgrades));
    localStorage.setItem('fruithole_currency',
      JSON.stringify({ berry: 5000, lychee: 5000, banana: 5000, melon: 5000 }));
  }, profile);
  await pg.goto('http://localhost:8210/', { waitUntil: 'load' });
  await pg.waitForFunction(() => window.fruitHoleFieldHash, { timeout: 25000 });
  await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });
  await pg.waitForSelector('#goalsBtn', { state: 'visible', timeout: 20000 });
  return { ctx, pg };
}

const playDaily = (pg) => pg.evaluate(async () => {
  window.fruitHoleStartDaily();
  await new Promise(r => setTimeout(r, 1200));
  return { ...window.fruitHoleFieldHash(), ...window.fruitHoleDailyState() };
});

// ---- 1 ve 2: iki bambaşka profil, aynı gün ----
console.log('\n1. iki farklı oyuncu, aynı gün');
const A = await open({ level: '3',  upgrades: {} });
const B = await open({ level: '44', upgrades: { size: 3, speed: 5, time: 5, magnet: 5 } });

const a = await playDaily(A.pg);
const b = await playDaily(B.pg);

console.log(`   A (bölüm 3, yükseltmesiz):   ${a.n} meyve, ${a.hash}, delik ${a.startR} ile açıldı`);
console.log(`   B (bölüm 44, hepsi dolu):    ${b.n} meyve, ${b.hash}, delik ${b.startR} ile açıldı`);
check(a.hash === b.hash, 'tarla birebir aynı', `${a.hash} / ${b.hash}`);
check(a.n === b.n, 'meyve sayısı aynı', `${a.n} / ${b.n}`);
// holeR değil startR: koşu başladıktan saniyeler sonra bakılıyor ve delik
// o sırada çoktan meyve yiyip büyümüş oluyor. İddia açılış genişliği hakkında.
check(Math.abs(a.startR - b.startR) < 0.0005, 'delik aynı boyda açılıyor',
  `${a.startR} / ${b.startR}`);
check(a.pattern === b.pattern, 'desen aynı', `${a.pattern} / ${b.pattern}`);
check(a.upgSize === 0 && b.upgSize === 0, 'koşu sırasında yükseltmeler okunmuyor',
  `A ${a.upgSize}, B ${b.upgSize}`);

// Normal bir bölümde B'nin deliği A'nınkinden büyük olmalı — yani
// yükseltmeler gerçekten satın alınmış, günlükte sadece yok sayılıyor.
console.log('\n2. yükseltmeler normal oyunda hâlâ çalışıyor mu');
const norm = (pg) => pg.evaluate(async () => {
  window.fruitHoleStartLevel();
  await new Promise(r => setTimeout(r, 900));
  return window.fruitHoleDailyState();
});
const na = await norm(A.pg), nb = await norm(B.pg);
check(nb.startR > na.startR, 'normal bölümde yükseltmeli oyuncunun deliği daha büyük',
  `${na.startR} -> ${nb.startR}`);
check(!na.dailyRun && !nb.dailyRun, 'normal bölümde günlük kipi kapalı');

// ---- 3: ilerlemeye dokunmuyor ----
console.log('\n3. ilerleme');
const before = await B.pg.evaluate(() => ({
  level: localStorage.getItem('fruithole_level'),
  stars: localStorage.getItem('fruithole_stars'),
}));
await B.pg.evaluate(async () => {
  window.fruitHoleStartDaily();
  await new Promise(r => setTimeout(r, 1200));
  window.fruitHoleClear();
  await new Promise(r => setTimeout(r, 900));
});
const after = await B.pg.evaluate(() => ({
  level: localStorage.getItem('fruithole_level'),
  stars: localStorage.getItem('fruithole_stars'),
}));
check(before.level === after.level, 'bölüm ilerlemedi', `${before.level} -> ${after.level}`);
check(before.stars === after.stars, 'yıldız yazılmadı');

const c1 = await B.pg.evaluate(() => JSON.parse(localStorage.getItem('fruithole_chall')));
check(c1.plays === 1 && c1.streak === 1, 'ilk koşu kaydedildi',
  `${c1.plays} koşu, seri ${c1.streak}, rekor ${c1.best}`);

// ---- 4: aynı gün ikinci koşu seriyi artırmamalı ----
console.log('\n4. seri gün sayıyor, koşu değil');
await B.pg.evaluate(async () => {
  window.fruitHoleStartDaily();
  await new Promise(r => setTimeout(r, 1200));
  window.fruitHoleClear();
  await new Promise(r => setTimeout(r, 900));
});
const c2 = await B.pg.evaluate(() => JSON.parse(localStorage.getItem('fruithole_chall')));
check(c2.streak === c1.streak, 'seri artmadı', `${c1.streak} -> ${c2.streak}`);
check(c2.plays === 2, 'koşu sayısı arttı', `${c2.plays}`);

// ---- 5: daha kötü koşu rekoru bozmuyor ----
console.log('\n5. rekor');
const bestBefore = c2.best;
await B.pg.evaluate(async () => {
  window.fruitHoleStartDaily();
  await new Promise(r => setTimeout(r, 1200));
  window.fruitHoleTimeUp();          // hiç meyve yemeden bitir
  await new Promise(r => setTimeout(r, 900));
});
const c3 = await B.pg.evaluate(() => JSON.parse(localStorage.getItem('fruithole_chall')));
check(c3.best === bestBefore, 'sıfır puanlı koşu rekoru bozmadı',
  `${bestBefore} -> ${c3.best}`);

console.log('\nhatalar: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
