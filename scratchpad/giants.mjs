// Every level must get giants, none of them on the opening, and the hole
// must be able to grow into one before the field runs out.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
const srv = createServer((req,res)=>{
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try { const b=readFileSync('/home/user/holegame/www-fruithole'+p);
    res.writeHead(200,{'content-type':p.endsWith('.js')?'text/javascript':'text/html'}); res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8099);
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=swiftshader'] });
const pg = await b.newPage({ viewport:{width:412,height:915} });
const errs=[]; pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('http://localhost:8099/', { waitUntil:'load' });
await pg.waitForSelector('#dailyBtn',{state:'visible',timeout:20000}).catch(()=>{});
await pg.evaluate(() => { const d=document.getElementById('dailyBtn'); if(d) d.click(); });
await pg.waitForSelector('#playBtn',{state:'visible',timeout:20000});

let bad = 0;
for (let lvl = 1; lvl <= 15; lvl++) {
  const r = await pg.evaluate(n => {
    window.fruitHoleProbe(n);
    return { ...window.fruitHoleGiants(), unit: window.fruitHoleGrow().unit };
  }, lvl);
  // Fruit eaten before the hole is wide enough to take a giant. The rate is
  // read from the game rather than written here: it used to be the constant
  // 0.017, and when growth was tied to the field size instead this test went
  // on dividing by the old number and called a working level a failure.
  const need = Math.ceil((r.needR - r.holeR) / r.unit);
  const share = need / r.total;
  // A giant should cost roughly a third of the board on every level — free
  // is not a target, and two thirds is not reachable.
  const ok = r.count >= 3 && r.nearestToSpawn >= 3.4 && share > 0.15 && share < 0.5;
  if (!ok) bad++;
  console.log(
    `lvl ${String(lvl).padStart(2)}  giants ${r.count}  fruit ${String(r.total).padStart(4)}` +
    `  nearest ${r.nearestToSpawn}  needs ~${String(need).padStart(3)} eaten ` +
    `(%${Math.round(share * 100)} of field)  ${ok ? '' : '  <-- FAIL'}`);
}
console.log('\npage errors:', errs.length ? errs : 'none');
await b.close(); srv.close();
console.log(bad === 0 && !errs.length ? 'PASS' : 'FAIL');
process.exit(bad === 0 && !errs.length ? 0 : 1);
