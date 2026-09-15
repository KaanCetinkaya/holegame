// Boot Slice Rush, auto-play a level, and check the cut actually happens.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
const OUT = '/tmp/claude-0/-home-user-holegame/69f8c7ec-ec6d-510e-8b3f-e83d17995163/scratchpad';
const srv = createServer((req,res)=>{
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try { const b=readFileSync('/home/user/holegame/www-slicer'+p);
    res.writeHead(200,{'content-type':p.endsWith('.js')?'text/javascript':'text/html'}); res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8111);
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=swiftshader'] });
const pg = await b.newPage({ viewport:{width:412,height:915}, deviceScaleFactor:2 });
const errs=[]; pg.on('pageerror',e=>errs.push(String(e)));
pg.on('console', m => { if (m.type()==='error') errs.push('CONSOLE: '+m.text()); });
await pg.goto('http://localhost:8111/', { waitUntil:'load' });
await pg.waitForFunction(() => typeof window.sliceProbe === 'function', { timeout: 20000 });
await pg.waitForTimeout(700);
await pg.screenshot({ path: `${OUT}/slice_menu.png` });
console.log('menu   ', JSON.stringify(await pg.evaluate(() => window.sliceProbe())));

await pg.click('#playBtn');
await pg.waitForTimeout(400);
console.log('start  ', JSON.stringify(await pg.evaluate(() => window.sliceProbe())));

// drive it with the autopilot and watch the counters move
let shot = false;
for (let i = 0; i < 60; i++) {
  await pg.evaluate(() => window.sliceAutoPlay());
  await pg.waitForTimeout(90);
  const p = await pg.evaluate(() => window.sliceProbe());
  if (!shot && p.shards > 0) {
    await pg.screenshot({ path: `${OUT}/slice_cut.png` });
    shot = true;
    console.log('mid-cut', JSON.stringify(p));
  }
  if (p.state !== 'playing') { console.log('ended  ', JSON.stringify(p)); break; }
}
const end = await pg.evaluate(() => window.sliceProbe());
console.log('final  ', JSON.stringify(end));
await pg.screenshot({ path: `${OUT}/slice_end.png` });
console.log('errors:', errs.length ? errs : 'none');
await b.close(); srv.close();
process.exit(errs.length ? 1 : 0);
