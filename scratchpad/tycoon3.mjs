// Does prestige actually pay? Play to a stall, hand the factory in, and see
// how far the next run gets in the same time.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
const srv = createServer((req,res)=>{
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try { const b=readFileSync('/home/user/holegame/www-tycoon'+p);
    res.writeHead(200,{'content-type':p.endsWith('.js')?'text/javascript':'text/html'}); res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8119);
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=swiftshader'] });
const pg = await b.newPage({ viewport:{width:412,height:915}, deviceScaleFactor:2 });
const errs=[]; pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('http://localhost:8119/', { waitUntil:'load' });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 20000 });
await pg.waitForTimeout(600);

const F = n => n>=1e12?(n/1e12).toFixed(2)+'T':n>=1e9?(n/1e9).toFixed(2)+'B':n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':n.toFixed(0);
const play = m => pg.evaluate(mins => {
  for (let k = 0; k < mins; k++) {
    window.jeRun(60);
    const p = window.jeProbe();
    window.jeBuy(['Döküm','Pres','Montaj','Sevkiyat'].indexOf(p.neck), 'max');
  }
  return window.jeProbe();
}, m);

console.log('şube | 30 dk sonunda        | gelir/sn  | puan | çarpan | devirde kazanılan');
console.log('-----+----------------------+-----------+------+--------+------------------');
for (let run = 1; run <= 6; run++) {
  const r = await play(30);
  const pend = r.pending;
  console.log(` ${String(run).padStart(3)} | ${r.lvl.join('/').padEnd(20)} | ${F(r.income).padStart(9)} | ${String(r.points).padStart(4)} | ${(Math.pow(1.02,r.points)).toFixed(1)}x | +${pend} puan`);
  const before = r.points;
  await pg.evaluate(() => window.jePrestige());
  const after = (await pg.evaluate(() => window.jeProbe())).points;
  if (after === before) console.log('      (devir eşiğine ulaşılmadı, aynı şubede devam)');
}
console.log('errors:', errs.length ? errs : 'none');
await b.close(); srv.close();
