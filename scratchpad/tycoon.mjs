// Boot Motor Works, check the chain runs, the bottleneck is reported, and
// offline earnings land.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
const OUT = '/tmp/claude-0/-home-user-holegame/69f8c7ec-ec6d-510e-8b3f-e83d17995163/scratchpad';
const srv = createServer((req,res)=>{
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try { const b=readFileSync('/home/user/holegame/www-tycoon'+p);
    res.writeHead(200,{'content-type':p.endsWith('.js')?'text/javascript':'text/html'}); res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8115);
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=swiftshader'] });
const pg = await b.newPage({ viewport:{width:412,height:915}, deviceScaleFactor:2 });
const errs=[]; pg.on('pageerror',e=>errs.push(String(e)));
pg.on('console', m => { if (m.type()==='error' && !m.text().includes('404')) errs.push('CONSOLE: '+m.text()); });
await pg.goto('http://localhost:8115/', { waitUntil:'load' });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 20000 });
await pg.waitForTimeout(1200);
console.log('fresh  ', JSON.stringify(await pg.evaluate(() => window.jeProbe())));

// let it run a few seconds of real time
await pg.waitForTimeout(3000);
console.log('+3s    ', JSON.stringify(await pg.evaluate(() => window.jeProbe())));

// buy into the chain and watch the bottleneck move
// play it the way a player would: keep buying whatever is the bottleneck
const trace = [];
for (let step = 0; step < 40; step++) {
  await pg.evaluate(() => window.jeRun(20));
  const r = await pg.evaluate(() => {
    const p = window.jeProbe();
    const i = ['Döküm','Pres','Montaj','Sevkiyat'].indexOf(p.neck);
    window.jeBuy(i, 'max');
    return window.jeProbe();
  });
  if (step % 8 === 0) trace.push(`  t+${(step+1)*20}s  lvl ${r.lvl.join('/')}  ${r.neck.padEnd(8)} ${window_fmt(r.income)}/sn`);
}
function window_fmt(n){ return n>=1e6? (n/1e6).toFixed(1)+'M' : n>=1e3? (n/1e3).toFixed(1)+'K' : n.toFixed(0); }
console.log('bottleneck-chasing run:');
console.log(trace.join('\n'));
await pg.waitForTimeout(1500);
const mid = await pg.evaluate(() => window.jeProbe());
console.log('bought ', JSON.stringify(mid));
await pg.screenshot({ path: `${OUT}/tycoon.png` });

// four hours away
const off = await pg.evaluate(() => {
  const before = window.jeProbe();
  const r = window.jeOffline(4 * 3600);
  const after = window.jeProbe();
  return { gained: after.cash - before.cash, expect: before.income * 4 * 3600, after };
});
console.log('4h idle', JSON.stringify({
  gained: Math.round(off.gained), expected: Math.round(off.expect),
  ok: Math.abs(off.gained - off.expect) < off.expect * 0.02,
  neck: off.after.neck }));

// number formatting across the range
console.log('fmt    ', await pg.evaluate(() =>
  [0.5, 12, 999, 1234, 1.5e6, 9.87e9, 4.2e12, 6e15, 1e21].map(n => window.jeFmt(n)).join('  ')));
console.log('errors:', errs.length ? errs : 'none');
await b.close(); srv.close();
process.exit(errs.length ? 1 : 0);
