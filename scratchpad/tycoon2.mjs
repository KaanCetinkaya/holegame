// A long run: does the game keep giving the player something to reach for?
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
const srv = createServer((req,res)=>{
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try { const b=readFileSync('/home/user/holegame/www-tycoon'+p);
    res.writeHead(200,{'content-type':p.endsWith('.js')?'text/javascript':'text/html'}); res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8117);
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=swiftshader'] });
const pg = await b.newPage({ viewport:{width:412,height:915}, deviceScaleFactor:2 });
const errs=[]; pg.on('pageerror',e=>errs.push(String(e)));
pg.on('console', m => { if (m.type()==='error' && !m.text().includes('404')) errs.push('CONSOLE: '+m.text()); });
await pg.goto('http://localhost:8117/', { waitUntil:'load' });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 20000 });
await pg.waitForTimeout(800);

const F = n => n>=1e12?(n/1e12).toFixed(2)+'T':n>=1e9?(n/1e9).toFixed(2)+'B':n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':n.toFixed(0);
console.log(' oyun içi süre |  seviyeler        | kilometre taşı | gelir/sn   | darboğaz');
console.log('---------------+-------------------+----------------+------------+---------');
let mins = 0;
for (let step = 0; step < 180; step++) {
  const r = await pg.evaluate(() => {
    window.jeRun(60);                       // a minute of play
    const p = window.jeProbe();
    const i = ['Döküm','Pres','Montaj','Sevkiyat'].indexOf(p.neck);
    window.jeBuy(i, 'max');
    return window.jeProbe();
  });
  mins++;
  if ([1,5,15,30,60,90,120,150,180].includes(mins)) {
    console.log(` ${String(mins).padStart(4)} dk       | ${r.lvl.join('/').padEnd(17)} | ${r.miles.join('/').padEnd(14)} | ${F(r.income).padStart(10)} | ${r.neck}`);
  }
}
// boost check
const bo = await pg.evaluate(() => {
  const before = window.jeProbe().income;
  window.jeBoost();
  const after = window.jeProbe();
  return { before, after: after.income, secs: after.boost };
});
console.log(`\nhız kutusu: ${F(bo.before)}/sn -> ${F(bo.after)}/sn  (${(bo.after/bo.before).toFixed(1)}x, ${bo.secs} sn)`);
console.log('errors:', errs.length ? errs : 'none');
await b.close(); srv.close();
