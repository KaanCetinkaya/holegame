// Ödüllü reklam yerleri gerçekten ödül veriyor mu, ve iki kez vermiyor mu?
//
//   node build-www.mjs && node scratchpad/holerewarded.mjs
//
// Üç yer var: sandığı katla, günlük ödülü katla, booster dükkanında günde bir
// bedava. Üçü de `watchAdFor()` üzerinden geçiyor.
//
// Tarayıcıda `showRewarded()` doğrudan true dönüyor (reklam ağı yok), yani
// burada sınanan şey reklamın kendisi değil — düğmenin ödülü bir kez verip
// vermediği, ikinci basışta ikinci ödülü engelleyip engellemediği ve günlük
// sınırın tutup tutmadığı. Reklamın gerçekten geldiği ancak telefonda
// görülür.

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
}).listen(8202);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));

const fails = [];
const check = (ok, what, saw) => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what}${saw === undefined ? '' : `   ${saw}`}`);
  if (!ok) fails.push(what);
};

const purse = () => pg.evaluate(() => window.fruitHoleWallet());

await pg.addInitScript(() => {
  localStorage.setItem('fruithole_level', '12');
  localStorage.setItem('fruithole_currency',
    JSON.stringify({ berry: 900, lychee: 900, banana: 900, melon: 900 }));
});
await pg.goto('http://localhost:8202/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleWallet, { timeout: 25000 });

// ---- 1. Günlük ödülü katla ----
console.log('\n1. günlük ödül');
const dailyOpen = await pg.isVisible('#daily');
check(dailyOpen, 'günlük ödül ekranı açıldı');
const loot = await pg.evaluate(() => ({ ...window.fruitHoleDaily().loot }));
const before1 = await purse();
await pg.click('#daily2x');
await pg.waitForTimeout(700);
const after1 = await purse();
const gained = after1[loot.type] - before1[loot.type];
check(gained === loot.amount * 2, 'iki katı verildi', `${loot.amount} yerine ${gained}`);
check(await pg.evaluate(() => window.fruitHoleDaily().rewardClaimed), 'ödül alındı olarak işaretlendi');
check(!(await pg.isVisible('#daily2x')), 'düğme kayboldu, ikinci kez basılamıyor');

// ---- 2. Booster dükkanında bedava, günde bir ----
console.log('\n2. bedava booster');
await pg.waitForSelector('#upgBtn', { state: 'visible', timeout: 15000 });
await pg.click('#upgBtn');
await pg.waitForTimeout(500);
const freeBtns = await pg.$$('#boostShop .adBuy');
check(freeBtns.length > 0, 'bedava düğmeleri görünüyor', `${freeBtns.length} tane`);

const owned = () => pg.evaluate(() => ({ ...window.fruitHoleBoosters() }));
const b0 = await owned();
await freeBtns[0].click();
await pg.waitForTimeout(700);
const b1 = await owned();
const grew = Object.keys(b1).filter(k => (b1[k] || 0) > (b0[k] || 0));
check(grew.length === 1, 'tam olarak bir booster eklendi', grew.join(',') || 'hiçbiri');
check(b1[grew[0]] - (b0[grew[0]] || 0) === 1, 'bir tane, iki değil');

const left = await pg.$$('#boostShop .adBuy');
check(left.length === freeBtns.length - 1, 'o booster için düğme gitti (günlük sınır)',
  `${freeBtns.length} -> ${left.length}`);

// Sayfayı yenile: sınır kalıcı mı?
await pg.reload({ waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleWallet, { timeout: 25000 });
await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });
await pg.waitForSelector('#upgBtn', { state: 'visible', timeout: 15000 });
await pg.click('#upgBtn');
await pg.waitForTimeout(500);
const afterReload = await pg.$$('#boostShop .adBuy');
check(afterReload.length === freeBtns.length - 1, 'sınır yeniden açılışta da duruyor',
  `${afterReload.length} düğme`);

// ---- 3. Sandığı katla ----
console.log('\n3. sandık');
await pg.evaluate(() => document.getElementById('upgClose').click());
await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 15000 });
await pg.click('#playBtn');
await pg.waitForTimeout(2000);
// Tarlayı bitir: bölümü kazanılmış say.
await pg.evaluate(() => window.fruitHoleClear());
await pg.waitForTimeout(1200);
check(await pg.isVisible('#chest'), 'sandık göründü');
await pg.click('#chest');
await pg.waitForTimeout(600);

const line = await pg.textContent('#rewardLine');
const first = Number((line.match(/\+(\d+)/) || [])[1]);
check(first > 0, 'sandık ödül verdi', line.trim());
check(await pg.isVisible('#chest2x'), 'katlama düğmesi çıktı');

const before3 = await purse();
await pg.click('#chest2x');
await pg.waitForTimeout(700);
const after3 = await purse();
const added = Object.keys(after3).reduce((s, k) => s + (after3[k] - before3[k]), 0);
check(added === first, 'katlama aynı miktarı bir kez daha ekledi', `+${added}`);
const line2 = await pg.textContent('#rewardLine');
check(line2.includes(String(first * 2)), 'yazı iki katını gösteriyor', line2.trim());
check(!(await pg.isVisible('#chest2x')), 'düğme kayboldu, ikinci kez basılamıyor');

console.log('\nhatalar: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
