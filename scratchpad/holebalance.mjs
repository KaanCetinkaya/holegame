// Deve yetişmek tarlanın yüzde kaçını süpürmeyi gerektiriyor? Her bölüm için.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
const srv = createServer((req,res)=>{
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try { const b=readFileSync('/home/user/holegame/www-fruithole'+p);
    res.writeHead(200,{'content-type':p.endsWith('.js')?'text/javascript':'text/html'}); res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8163);
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=swiftshader'] });
const pg = await b.newPage({ viewport:{width:412,height:915}, deviceScaleFactor:1 });
const errs=[]; pg.on('pageerror',e=>errs.push(String(e)));
pg.on('console', m => { if (m.type()==='error' && !m.text().includes('404')) errs.push('CONSOLE: '+m.text()); });
await pg.goto('http://localhost:8163/', { waitUntil:'load' });
await pg.waitForFunction(() => typeof window.fruitHoleProbe === 'function', { timeout: 20000 });

console.log(' blm | meyve | açılış r | birim   | dev r | gereken r | süpürme %  | süre');
console.log('-----+-------+----------+---------+-------+-----------+------------+------');
for (let lvl = 1; lvl <= 15; lvl++) {
  const r = await pg.evaluate(n => {
    const p = window.fruitHoleProbe(n);
    const g = window.fruitHoleGiants();
    const gr = window.fruitHoleGrow();
    return { fruit: p.fruit, secs: p.seconds, start: gr.r, unit: gr.unit,
             need: g.needR, giantR: g.needR ? +(g.needR*0.92).toFixed(2) : null };
  }, lvl);
  const pct = r.need ? 100 * ((r.need - r.start) / r.unit) / r.fruit : null;
  console.log(` ${String(lvl).padStart(3)} | ${String(r.fruit).padStart(5)} | ` +
              `${r.start.toFixed(2).padStart(8)} | ${r.unit.toFixed(4)} | ` +
              `${String(r.giantR ?? '-').padStart(5)} | ${String(r.need ?? '-').padStart(9)} | ` +
              `${(pct === null ? '-' : '%' + pct.toFixed(0)).padStart(10)} | ${Math.round(r.secs)}s`);
}
console.log('errors:', errs.length ? errs : 'none');
await b.close(); srv.close();
