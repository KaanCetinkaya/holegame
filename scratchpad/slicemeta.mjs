// Meta katmanı: para birikiyor mu, çift ödeme var mı, devam etme çalışıyor mu,
// bıçak dükkânı satın alıyor mu.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
const OUT = '/tmp/claude-0/-home-user-holegame/69f8c7ec-ec6d-510e-8b3f-e83d17995163/scratchpad';
const srv = createServer((req,res)=>{
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try { const b=readFileSync('/home/user/holegame/www-slicer'+p);
    res.writeHead(200,{'content-type':p.endsWith('.js')?'text/javascript':'text/html'}); res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8143);
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=swiftshader'] });
const pg = await b.newPage({ viewport:{width:412,height:915}, deviceScaleFactor:2 });
const errs=[]; pg.on('pageerror',e=>errs.push(String(e)));
pg.on('console', m => { if (m.type()==='error' && !m.text().includes('404')) errs.push('CONSOLE: '+m.text()); });
await pg.goto('http://localhost:8143/', { waitUntil:'load' });
await pg.waitForFunction(() => typeof window.sliceProbe === 'function', { timeout: 20000 });
await pg.waitForTimeout(400);

async function playUntilDone(max = 400) {
  for (let i = 0; i < max; i++) {
    await pg.evaluate(() => window.sliceAutoPlay());
    await pg.waitForTimeout(50);
    const p = await pg.evaluate(() => window.sliceProbe());
    if (p.state !== 'playing') return p;
  }
  return await pg.evaluate(() => window.sliceProbe());
}

// --- 1. bir bölümü bitir, parayı al ---
await pg.evaluate(() => window.sliceStart(1));
let p = await playUntilDone();
let m = await pg.evaluate(() => window.sliceMeta());
console.log(`bölüm bitti  kesilen ${p.cut}/${p.total}  turda 🪙${m.runCoins}  kasa ${m.coins}  ödendi:${m.banked}`);

// çift ödeme denemesi: önce x2, sonra "sonraki bölüm"
await pg.evaluate(() => window.sliceDouble());
await pg.waitForTimeout(500);
const afterDouble = await pg.evaluate(() => window.sliceMeta());
await pg.click('#nextBtn');
await pg.waitForTimeout(300);
const afterNext = await pg.evaluate(() => window.sliceMeta());
console.log(`x2 sonrası kasa ${afterDouble.coins}  (${afterDouble.coins / Math.max(1,m.runCoins)}x)`);
console.log(`sonra "sonraki bölüm": kasa ${afterNext.coins}  ${afterNext.coins === afterDouble.coins ? 'OK — ikinci kez ödemedi' : '!!! ÇİFT ÖDEME'}`);

// --- 2. çarp, reklamla devam et ---
await pg.evaluate(() => window.sliceStart(6));
// bilerek engele sür: hep en alta in
for (let i = 0; i < 250; i++) {
  await pg.evaluate(() => window.sliceSetTarget(0.8));
  await pg.waitForTimeout(50);
  const q = await pg.evaluate(() => window.sliceProbe());
  if (q.state !== 'playing') break;
}
const crashed = await pg.evaluate(() => window.sliceProbe());
console.log(`\nçarpma: state=${crashed.state}  mesafe ${crashed.dist}`);
if (crashed.state === 'over') {
  const before = crashed.dist;
  await pg.evaluate(() => window.sliceRevive());
  await pg.waitForTimeout(600);
  const after = await pg.evaluate(() => window.sliceProbe());
  const mm = await pg.evaluate(() => window.sliceMeta());
  console.log(`devam:  state=${after.state}  mesafe ${before} -> ${after.dist}  ` +
              `engel silindi:${after.items < crashed.items}  tekrar devam:${!mm.revived ? 'açık' : 'kapalı (doğru)'}`);
}

// --- 3. dükkân ---
await pg.evaluate(() => { window.sliceGive(3000); });
await pg.evaluate(() => { document.getElementById('shopBtn').click(); });
await pg.waitForTimeout(250);
const shopBefore = await pg.evaluate(() => window.sliceMeta());
await pg.evaluate(() => document.querySelectorAll('#blades .blade')[3].click());
await pg.waitForTimeout(250);
const shopAfter = await pg.evaluate(() => window.sliceMeta());
console.log(`\ndükkân: kasa ${shopBefore.coins} -> ${shopAfter.coins}  ` +
            `bıçak ${shopBefore.blade} -> ${shopAfter.blade}  menzil ${shopAfter.reach}`);
await pg.screenshot({ path: `${OUT}/slice_shop.png` });
// parası yetmeyeni almayı dene
const tooDear = await pg.evaluate(() => {
  const before = window.sliceMeta();
  document.querySelectorAll('#blades .blade')[5].click();
  return { before: before.coins, after: window.sliceMeta().coins, blade: window.sliceMeta().blade };
});
console.log(`pahalı olanı almayı dene: kasa ${tooDear.before} -> ${tooDear.after}  ` +
            `${tooDear.before === tooDear.after ? 'OK — almadı' : '!!! bedava verdi'}`);

console.log('errors:', errs.length ? errs : 'none');
await b.close(); srv.close();
