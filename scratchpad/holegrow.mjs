// Delik ne kadar hızlı büyüyor? Otomatik süpüren bir oyuncuyla bölümü oyna,
// belli aralıklarla yarıçapı ve kalan meyveyi yaz.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
const srv = createServer((req,res)=>{
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try { const b=readFileSync('/home/user/holegame/www-fruithole'+p);
    res.writeHead(200,{'content-type':p.endsWith('.js')?'text/javascript':'text/html'}); res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8161);
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=swiftshader'] });

for (const lvl of [1, 5, 10]) {
  const pg = await b.newPage({ viewport:{width:412,height:915}, deviceScaleFactor:1 });
  const errs=[]; pg.on('pageerror',e=>errs.push(String(e)));
  await pg.addInitScript(l => localStorage.setItem('fruithole_level', l), String(lvl));
  await pg.goto('http://localhost:8161/', { waitUntil:'load' });
  await pg.waitForSelector('#dailyBtn',{state:'visible',timeout:20000}).catch(()=>{});
  await pg.evaluate(() => { const d=document.getElementById('dailyBtn'); if(d) d.click(); });
  await pg.waitForSelector('#playBtn',{state:'visible',timeout:20000});
  await pg.click('#playBtn');
  await pg.waitForTimeout(2800);

  const rows = await pg.evaluate(async () => {
    const out = [];
    const app = document.getElementById('app');
    const fire = (t, x, y) => app.dispatchEvent(new PointerEvent(t,
      { clientX:x, clientY:y, pointerId:1, isPrimary:true, bubbles:true }));
    const snap = () => {
      const g = window.fruitHoleGiants();
      return { r: g.holeR, left: g.total, t: +(performance.now()/1000).toFixed(1) };
    };
    // tarlayı boydan boya süpür
    fire('pointerdown', 200, 700);
    let px = 200, py = 700, dir = 1;
    const t0 = performance.now();
    for (let step = 0; step < 260; step++) {
      px += dir * 26;
      if (px > 380 || px < 40) { dir *= -1; py -= 34; }
      if (py < 90) py = 780;
      fire('pointermove', px, py);
      await new Promise(r => setTimeout(r, 55));
      if (step % 15 === 0) {
        const g = window.fruitHoleGrow();
        out.push({ sec: +((performance.now()-t0)/1000).toFixed(0), ...g });
      }
      if (window.fruitHoleGrow().left === 0) break;
    }
    fire('pointerup', px, py);
    return out;
  });
  console.log(`\nBÖLÜM ${lvl}`);
  console.log('  sn | yarıçap | tavanın %si | yenen | kalan | süre');
  for (const r of rows)
    console.log(`  ${String(r.sec).padStart(3)} | ${String(r.r).padStart(7)} | ` +
                `${String(Math.round(r.frac*100)).padStart(11)} | ${String(r.eaten).padStart(5)} | ` +
                `${String(r.left).padStart(5)} | ${r.timeLeft}`);
  if (errs.length) console.log('  HATA:', errs[0]);
  await pg.close();
}
await b.close(); srv.close();
