// Parkur üreteci geçilmesi imkânsız engel dizisi üretiyor mu?
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
const srv = createServer((req,res)=>{
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try { const b=readFileSync('/home/user/holegame/www-slicer'+p);
    res.writeHead(200,{'content-type':p.endsWith('.js')?'text/javascript':'text/html'}); res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8171);
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=swiftshader'] });
const pg = await b.newPage({ viewport:{width:412,height:915}, deviceScaleFactor:1 });
const errs=[]; pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('http://localhost:8171/', { waitUntil:'load' });
await pg.waitForFunction(() => typeof window.sliceProbe === 'function', { timeout: 20000 });

console.log(' blm | engel | en dar geçiş | gereken | durum');
console.log('-----+-------+--------------+---------+--------');
let bad = 0;
for (let lvl = 1; lvl <= 15; lvl++) {
  // her bölümü 12 kez üret, en kötü diziyi bul
  const r = await pg.evaluate(n => {
    const CLIMB = 5, LANE_LOW = 0.8, LANE_HIGH = 4.8;
    let worst = Infinity, worstNeed = 0, bars = 0, runs = 12;
    for (let k = 0; k < runs; k++) {
      window.sliceStart(n);
      const list = window.sliceBars();
      bars += list.length;
      const speed = Math.min(8 + (n - 1) * 0.45, 15);
      for (let i = 1; i < list.length; i++) {
        const have = (list[i].d - list[i-1].d) / speed;
        const need = Math.abs(list[i].gapY - list[i-1].gapY) / CLIMB;
        if (have - need < worst - worstNeed) { worst = have; worstNeed = need; }
      }
    }
    return { worst, worstNeed, bars: Math.round(bars / runs) };
  }, lvl);
  const ok = r.worst === Infinity || r.worst >= r.worstNeed;
  if (!ok) bad++;
  console.log(` ${String(lvl).padStart(3)} | ${String(r.bars).padStart(5)} | ` +
              `${(r.worst === Infinity ? '-' : r.worst.toFixed(2)+' sn').padStart(12)} | ` +
              `${(r.worst === Infinity ? '-' : r.worstNeed.toFixed(2)+' sn').padStart(7)} | ` +
              `${ok ? 'OK' : 'GEÇİLEMEZ'}`);
}
console.log(bad === 0 ? '\nPASS — her engel dizisi geçilebilir' : `\nFAIL — ${bad} bölümde imkânsız dizi`);
console.log('errors:', errs.length ? errs : 'none');
await b.close(); srv.close();
