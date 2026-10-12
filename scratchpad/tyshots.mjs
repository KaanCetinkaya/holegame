// Motor Works'ün mağaza ekran görüntüleri, gerçek oynanıştan.
//
//   node build-www.mjs && node scratchpad/tyshots.mjs [tr]
//
// Dil argümanı verilirse Türkçe sürüm `store/tr/` altına yazılıyor:
// oyun Türkçe açılıyor ve başlıklar da Türkçe.
//
// Telefon 1080x1920, tablet 1440x2560 — Play'in istediği 9:16. Her kare
// oyunun kendi motorundan geliyor, montaj yok: mağazada gördüğü şeyle
// indirdiği şey aynı olsun.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync, mkdirSync } from 'fs';

const ROOT = '/home/user/holegame';
const TR = process.argv.includes('tr');
const OUT = TR ? `${ROOT}/tycoon/store/tr` : `${ROOT}/tycoon/store`;
mkdirSync(OUT, { recursive: true });
mkdirSync(`${OUT}/tablet`, { recursive: true });

const srv = createServer((req, res) => {
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try {
    const b = readFileSync(ROOT + '/www-tycoon' + p);
    res.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8131);

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader'] });

// Her kare bir hikâye anlatıyor: sırayla fabrika, darboğaz, görevler,
// çevrimdışı kazanç, hız kutusu, şube devri.
const SHOTS = [
  { name: '1-factory', mins: 26, cap: 'Grow the plant, speed up the line', tr: 'Fabrikayı büyüt, hattı hızlandır',
    do: async () => {} },
  // Önce/sonra: ikinci kare erken oyundan, ilkiyle aynı açıdan. İkisi de
  // olgun fabrikayı gösterdiğinde mağazada aynı resmin iki kopyası gibi
  // duruyordu ve büyüme hiç anlatılmıyordu.
  { name: '2-early',   mins: 2, cap: 'Four stations. You start with one', tr: 'Dört istasyon. Tekiyle başlıyorsun',
    do: async () => {} },
  { name: '3-goals',   mins: 26, cap: 'Finish the goals, take the payout', tr: 'Hedefleri bitir, ödülü al',
    do: async pg => {
      await pg.click('#menuBtn'); await pg.waitForTimeout(150);
      await pg.click('#goalsBtn'); await pg.waitForTimeout(250);
    } },
  { name: '4-offline', mins: 20, cap: 'It earns while the app is closed', tr: 'Uygulama kapalıyken de kazanıyor',
    do: async pg => {
      await pg.evaluate(() => window.jeOffline(4 * 3600));
      await pg.waitForTimeout(250);
    } },
  { name: '5-boost',   mins: 26, cap: 'The speed crate triples everything', tr: 'Hız kutusu her şeyi üçe katlıyor',
    do: async pg => {
      await pg.evaluate(() => window.jeBoost());
      await pg.waitForTimeout(900);
    } },
  { name: '6-branch',  mins: 40, cap: 'Hand it on, keep the multiplier', tr: 'Devret, çarpanı sende kalsın',
    do: async pg => {
      await pg.evaluate(() => window.jeSetEarned(5e12));
      await pg.waitForTimeout(200);
      await pg.click('#menuBtn'); await pg.waitForTimeout(200);
      await pg.click('#prestigeBtn'); await pg.waitForTimeout(300);
    } },
  // Yedinci ve sekizinci kare, oyuna sonradan giren iki şey için. İkisi de
  // mağazada "bu oyun diğerlerinden ne farklı" sorusunu cevaplayan taraf:
  // ekranda dokunulacak bir şey, ve her şubede değişen bir önlük.
  { name: '7-customer', mins: 26, cap: 'A buyer pulls in — tap before they go', tr: 'Müşteri geldi — gitmeden dokun',
    do: async pg => {
      await pg.evaluate(() => { window.jeMusBelir(); window.jeMusAdim(2); });
      await pg.waitForTimeout(400);
    } },
  { name: '8-location', mins: 30, cap: 'A new branch, a new place', tr: 'Yeni şube, yeni bir yer',
    do: async pg => {
      // Tundra: beş yerin içinde çayırdan en uzak görüneni, yani tek
      // karede "yer değişiyor" diyebilen tek kare.
      await pg.evaluate(() => window.jeSetBranch(2));
      await pg.waitForTimeout(500);
    } },
];

async function shoot(dir, w, h, scale) {
  for (const s of SHOTS) {
    const ctx = await browser.newContext({
      viewport: { width: w / scale, height: h / scale }, deviceScaleFactor: scale,
      locale: TR ? 'tr-TR' : 'en-US' });
    const pg = await ctx.newPage();
    const errs = [];
    pg.on('pageerror', e => errs.push(String(e)));
    await pg.addInitScript(() => localStorage.clear());
    await pg.goto('http://localhost:8131/', { waitUntil: 'load' });
    await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 20000 });
    await pg.waitForTimeout(400);
    // the daily reward pops on a fresh save and would be in every frame
    await pg.evaluate(() => document.getElementById('daily').classList.remove('show'));
    // Öğretici şeridi de öyle: taze kayıtta birinci adımda duruyor ve
    // fabrikanın üstünü kapatıyor. Mağazadaki kare oyunu göstermeli, ilk
    // açılış ipucunu değil.
    await pg.evaluate(() => window.jeTutSkip());
    // Dakika dakika oynanmış bir fabrika. `jeAutoCarry` oyuncunun elle
    // taşıdığı evreyi taklit ediyor ve **bu satır olmadan kareler boş
    // çıkıyordu**: müdürsüz bir istasyonun malını işçi taşıyor, işçi de
    // `jeRun` ile yürümüyor, yani zincir hiç akmıyor, para hiç gelmiyor
    // ve "max" ile alınacak seviye hiç olmuyordu. Altı karenin altısı da
    // birinci seviye, sıfır para gösteriyordu; kimse bakmamıştı.
    await pg.evaluate(m => {
      window.jeAutoCarry(true);
      for (let k = 0; k < m; k++) {
        window.jeRun(60);
        // Müdür parası çıktıkça alınıyor: gerçek bir oyuncu da bunu
        // yapıyor ve fabrikanın kendi kendine dönmesi oradan başlıyor.
        for (let i = 0; i < 4; i++) window.jeBuyManager(i);
        window.jeBuy(['Foundry', 'Stamping', 'Assembly', 'Dispatch'].indexOf(window.jeProbe().neck), 'max');
      }
    }, s.mins);
    // Karede görünen fabrika gerçekten büyümüş olmalı. Sessizce boş bir
    // kare yazmaktansa burada durulsun.
    const d = await pg.evaluate(() => window.jeProbe());
    if (Math.max(...d.lvl) < 5 && s.mins > 3)
      throw new Error(`${s.name}: fabrika büyümedi — seviye ${JSON.stringify(d.lvl)}, para ${d.cash}. Kare boş çıkardı.`);
    await pg.waitForTimeout(900);
    await s.do(pg);
    await pg.waitForTimeout(300);
    // Başlık şerit halinde üstte. Mağazada ilk iki kare arama sonucunda
    // görünüyor ve oradaki tek iş "bu oyun ne yapıyor" sorusunu cevaplamak.
    await pg.evaluate(text => {
      const d = document.createElement('div');
      d.style.cssText = `position:fixed;left:0;right:0;top:0;z-index:99;
        padding:calc(env(safe-area-inset-top,0px) + 74px) 20px 26px;
        font:900 27px/1.25 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
        color:#fff;text-align:center;letter-spacing:-.4px;
        text-shadow:0 3px 14px rgba(0,0,0,.85), 0 1px 0 rgba(0,0,0,.6);
        background:linear-gradient(180deg,rgba(12,14,19,.88),rgba(12,14,19,0));
        pointer-events:none;`;
      d.textContent = text;
      document.body.appendChild(d);
    }, TR ? s.tr : s.cap);
    await pg.waitForTimeout(120);
    await pg.screenshot({ path: `${dir}/${s.name}.png` });
    console.log(`  ${dir.split('/').pop()}/${s.name}.png`, errs.length ? 'HATA: ' + errs[0] : '');
    await pg.close();
  }
}

console.log(TR ? 'telefon 1080x1920 (Türkçe):' : 'telefon 1080x1920:');
await shoot(OUT, 1080, 1920, 2);
console.log('tablet 1440x2560:');
await shoot(`${OUT}/tablet`, 1440, 2560, 2);

await browser.close();
srv.close();
