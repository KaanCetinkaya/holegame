// Liderlik tablosu: doğru eklentiye, doğru parametreyle mi gidiyor?
//
//   node build-www.mjs && node scratchpad/holeboard.mjs
//
// Bu katmanın bütün hataları **sessiz**. `gamesReady()` false olunca her şey
// kapanıyor, ve her çağrı bir catch bloğunun içinde. Yani yanlış eklenti adı,
// yanlış parametre adı ya da yanlış kimlik — üçü de aynı şeyi veriyor: tablo
// çalışmıyor, hiçbir yerde hata yok.
//
// İki tanesi bu dosya yazılırken gerçekten yanlıştı:
//
//   * Eklenti adı `GameConnect`'ti — artık kullanılmayan @openforge
//     eklentisinin adı. Yenisi kendini `PlayGames` diye kaydediyor.
//   * Parametre `leaderboardID`'ydi (büyük D). Yeni eklenti `leaderboardId`
//     bekliyor.
//
// Bunları buradan doğrulamanın tek yolu eklentinin yerine çağrıları kaydeden
// bir sahtesini koymak. Native tarafın derlendiğini yine söylemiyor.

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
}).listen(8221);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

const fails = [];
const check = (ok, what, saw) => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what}${saw === undefined ? '' : `   ${saw}`}`);
  if (!ok) fails.push(what);
};

// Sahte PlayGames. Eklentinin gerçek API'siyle aynı adlar ve aynı dönüş
// şekilleri — tarball'dan okunan definitions.d.ts'e göre.
const fake = (opts = {}) => `
  window.__pg = { calls: [] };
  const log = (name, arg) => window.__pg.calls.push({ name, ...(arg || {}) });
  window.Capacitor = {
    isNativePlatform: () => true,
    Plugins: {
      PlayGames: {
        async signIn(o) {
          log('signIn', o);
          ${opts.signInFails ? 'throw new Error("oyuncu reddetti");' : ''}
          return { signedIn: ${opts.signedIn === false ? 'false' : 'true'} };
        },
        async isSignedIn() { return { signedIn: true }; },
        async submitScore(o) { log('submitScore', o); return { results: [] }; },
        async showLeaderboard(o) { log('showLeaderboard', o); },
      },
    },
  };
`;

async function open(opts) {
  const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
  pg.on('pageerror', e => { console.log('  SAYFA HATASI: ' + e); fails.push(String(e)); });
  await pg.addInitScript(fake(opts));
  await pg.goto('http://localhost:8221/', { waitUntil: 'load' });
  await pg.waitForFunction(() => window.fruitHoleGamesState, { timeout: 25000 });
  await pg.waitForTimeout(900);
  return pg;
}

// ---- 1: açılışta giriş ----
console.log('\n1. açılışta giriş');
let pg = await open({});
let st = await pg.evaluate(() => window.fruitHoleGamesState());
check(st.plugin === true, 'eklenti bulundu (adı PlayGames)', JSON.stringify(st.plugin));
check(st.native === true, 'native kip algılandı');
check(st.signedIn === true, 'giriş yapıldı');
check(st.boardId === 'CgkIkbTDscoOEAIQAA', 'kimlik yerinde', String(st.boardId));
check(st.ready === true, 'gamesReady() true');
let calls = await pg.evaluate(() => window.__pg.calls);
// Açılışta zorlayıcı giriş ekranı çıkmamalı: silent: false yalnızca oyuncunun
// bir hareketine karşılık çağrılır, açılış öyle bir hareket değil.
const si = calls.find(c => c.name === 'signIn');
check(!!si, 'signIn çağrıldı');
check(!si || si.silent !== false, 'açılışta zorlayıcı giriş ekranı çıkmıyor',
  JSON.stringify(si));
await pg.close();

// ---- 2: skor gönderimi ----
console.log('\n2. skor gönderimi');
pg = await open({});
await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });
await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 20000 });
await pg.evaluate(() => window.fruitHoleStartDaily());
await pg.waitForTimeout(1500);
await pg.evaluate(() => window.fruitHoleClear());
await pg.waitForTimeout(1200);
calls = await pg.evaluate(() => window.__pg.calls);
const sub = calls.find(c => c.name === 'submitScore');
check(!!sub, 'koşu bitince skor gönderildi', calls.map(c => c.name).join(' > '));
// Asıl mesele: parametrenin adı. leaderboardID (büyük D) gönderilirse
// eklenti kimliği hiç görmüyor, istek reddediliyor ve catch onu yutuyor.
check(!!sub && sub.leaderboardId === 'CgkIkbTDscoOEAIQAA',
  'leaderboardId doğru adla ve doğru değerle gitti', JSON.stringify(sub));
check(!!sub && typeof sub.score === 'number' && sub.score > 0,
  'skor bir sayı ve sıfırdan büyük', sub ? String(sub.score) : '-');
await pg.close();

// ---- 3: tabloyu açma ----
console.log('\n3. tabloyu açma');
pg = await open({});
await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });
await pg.waitForSelector('#goalsBtn', { state: 'visible', timeout: 20000 });
await pg.click('#goalsBtn');
await pg.waitForTimeout(600);
const btn = await pg.evaluate(() => {
  const b = document.getElementById('challLeaderBtn');
  return b ? { exists: true, hidden: b.hidden || getComputedStyle(b).display === 'none' } : { exists: false };
});
check(btn.exists && !btn.hidden, '🏆 düğmesi görünür oldu', JSON.stringify(btn));
if (btn.exists && !btn.hidden) {
  await pg.click('#challLeaderBtn');
  await pg.waitForTimeout(600);
  calls = await pg.evaluate(() => window.__pg.calls);
  const show = calls.find(c => c.name === 'showLeaderboard');
  check(!!show, 'showLeaderboard çağrıldı');
  check(!!show && show.leaderboardId === 'CgkIkbTDscoOEAIQAA',
    'açarken de leaderboardId doğru', JSON.stringify(show));
}
await pg.close();

// ---- 4: giriş reddedilirse ----
console.log('\n4. oyuncu girişi reddederse');
// Reddetmek normal bir cevap. Oyun çalışmaya devam etmeli, tablo kapanmalı,
// ve hiçbir yerde istisna kalmamalı.
pg = await open({ signInFails: true });
st = await pg.evaluate(() => window.fruitHoleGamesState());
check(st.signedIn === false, 'giriş yapılmamış sayıldı');
check(st.ready === false, 'gamesReady() false');
check(await pg.evaluate(() => !!document.getElementById('playBtn')), 'oyun yine açıldı');
await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });
await pg.waitForSelector('#goalsBtn', { state: 'visible', timeout: 20000 });
await pg.click('#goalsBtn');
await pg.waitForTimeout(600);
check(await pg.evaluate(() => {
  const b = document.getElementById('challLeaderBtn');
  return !b || b.hidden || getComputedStyle(b).display === 'none';
}), '🏆 düğmesi gizli kaldı');
await pg.close();

console.log(fails.length ? `\n${fails.length} kontrol düştü` : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length ? 1 : 0);
