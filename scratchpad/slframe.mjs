// Tek kare: kamera/bıçak ayarını hızlı görmek için. Mağaza görselleri değil.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
const OUT = '/tmp/claude-0/-home-user-holegame/69f8c7ec-ec6d-510e-8b3f-e83d17995163/scratchpad';
const srv = createServer((req,res)=>{
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try { const b=readFileSync('/home/user/holegame/www-slicer'+p);
    res.writeHead(200,{'content-type':p.endsWith('.js')?'text/javascript':'text/html'}); res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8147);
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=swiftshader'] });
const shots = [];
for (const [lvl, tag, want] of [[4,'a', p=>p.shards>=2], [6,'b', p=>p.streak>=5], [9,'c', p=>p.dist>28]]) {
  const pg = await b.newPage({ viewport:{width:412,height:915}, deviceScaleFactor:2 });
  await pg.addInitScript(() => localStorage.clear());
  await pg.goto('http://localhost:8147/', { waitUntil:'load' });
  await pg.waitForFunction(() => typeof window.sliceProbe === 'function', { timeout: 20000 });
  await pg.evaluate(n => window.sliceStart(n), lvl);
  await pg.waitForTimeout(350);
  await pg.evaluate(() => document.getElementById('hint').classList.remove('show'));
  for (let i = 0; i < 300; i++) {
    await pg.evaluate(() => window.sliceAutoPlay());
    await pg.waitForTimeout(50);
    const p = await pg.evaluate(() => window.sliceProbe());
    if (want(p) || p.state !== 'playing') break;
  }
  await pg.screenshot({ path: `${OUT}/frame_${tag}.png` });
  shots.push(tag);
  await pg.close();
}
console.log('kareler:', shots.join(', '));
await b.close(); srv.close();
