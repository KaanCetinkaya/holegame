// Retention layer: goals unlock and pay, daily reward fires once a day,
// offline doubling works, boost counts.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
const OUT = '/tmp/claude-0/-home-user-holegame/69f8c7ec-ec6d-510e-8b3f-e83d17995163/scratchpad';
const srv = createServer((req,res)=>{
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try { const b=readFileSync('/home/user/holegame/www-tycoon'+p);
    res.writeHead(200,{'content-type':p.endsWith('.js')?'text/javascript':'text/html'}); res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8123);
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=swiftshader'] });
const pg = await b.newPage({ viewport:{width:412,height:915}, deviceScaleFactor:2 });
const errs=[]; pg.on('pageerror',e=>errs.push(String(e)));
pg.on('console', m => { if (m.type()==='error' && !m.text().includes('404')) errs.push('CONSOLE: '+m.text()); });
await pg.goto('http://localhost:8123/', { waitUntil:'load' });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 20000 });
await pg.waitForTimeout(600);

// first launch: daily should be showing
const d0 = await pg.evaluate(() => ({
  daily: window.jeDaily(),
  shown: document.getElementById('daily').classList.contains('show'),
}));
console.log('ilk açılış  ', JSON.stringify(d0));
await pg.click('#dOk');

// play a while, then look at the goals
await pg.evaluate(() => {
  for (let k = 0; k < 25; k++) {
    window.jeRun(60);
    window.jeBuy(['Döküm','Pres','Montaj','Sevkiyat'].indexOf(window.jeProbe().neck), 'max');
  }
});
const g = await pg.evaluate(() => window.jeGoals());
console.log('\ngörevler (25 dk sonra):');
for (const x of g) console.log(`  ${x.done ? '✓' : ' '} ${x.id.padEnd(8)} ${String(x.at).padStart(12)} / ${String(x.need).padEnd(12)} ödül ${x.pay}`);
console.log('  alınabilir:', g.filter(x => x.done && !x.taken).length);

// claim them all through the real UI
await pg.click('#menuBtn');
await pg.waitForTimeout(150);
await pg.click('#goalsBtn');
await pg.waitForTimeout(200);
const before = await pg.evaluate(() => window.jeProbe().cash);
await pg.evaluate(() => {
  document.querySelectorAll('#goalList .gb:not([disabled])').forEach(b => b.click());
});
const after = await pg.evaluate(() => window.jeProbe().cash);
console.log(`\nödüller alındı: +${Math.round(after - before)}`);
console.log('ikinci kez alınabilir mi:', (await pg.evaluate(() => window.jeGoals())).filter(x => x.done && !x.taken).length, '(0 olmalı)');
await pg.screenshot({ path: `${OUT}/goals.png` });
await pg.click('#goalsClose');
await pg.click('#closeMenu');

// daily should not fire twice in one day
const d1 = await pg.evaluate(() => { window.jeDailyCheck?.(); return document.getElementById('daily').classList.contains('show'); });
console.log('aynı gün tekrar günlük ödül:', d1, '(false olmalı)');

// offline + double
const off = await pg.evaluate(async () => {
  const b0 = window.jeProbe().cash;
  const r = window.jeOffline(4 * 3600);
  const b1 = window.jeProbe().cash;
  document.getElementById('wDouble').click();
  await new Promise(r => setTimeout(r, 400));
  return { once: b1 - b0, twice: window.jeProbe().cash - b0 };
});
console.log(`\nçevrimdışı: ${Math.round(off.once)}  ->  reklamla ${Math.round(off.twice)}  (${(off.twice/off.once).toFixed(2)}x)`);
console.log('errors:', errs.length ? errs : 'none');
await b.close(); srv.close();
