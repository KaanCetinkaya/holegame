// Bir bölümü baştan sona oynat: bitiş ekranı, yıldızlar, sonraki bölüm.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
const OUT = '/tmp/claude-0/-home-user-holegame/69f8c7ec-ec6d-510e-8b3f-e83d17995163/scratchpad';
const srv = createServer((req,res)=>{
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try { const b=readFileSync('/home/user/holegame/www-slicer'+p);
    res.writeHead(200,{'content-type':p.endsWith('.js')?'text/javascript':'text/html'}); res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8141);
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=swiftshader'] });
const pg = await b.newPage({ viewport:{width:412,height:915}, deviceScaleFactor:2 });
const errs=[]; pg.on('pageerror',e=>errs.push(String(e)));
pg.on('console', m => { if (m.type()==='error' && !m.text().includes('404')) errs.push('CONSOLE: '+m.text()); });
await pg.goto('http://localhost:8141/', { waitUntil:'load' });
await pg.waitForFunction(() => typeof window.sliceProbe === 'function', { timeout: 20000 });
await pg.waitForTimeout(500);

for (let lvl = 1; lvl <= 3; lvl++) {
  await pg.evaluate(n => window.sliceStart(n), lvl);
  await pg.waitForTimeout(300);
  // Tur kare beklemeden oynanıyor: `sliceRun` `tick`'in çağırdığı
  // benzetimin aynısını sabit adımla yürütüyor. Kare beklemek bu
  // konteynerde turu dakikalara çıkarıyordu ve dt'yi 0.05'e sabitliyordu
  // — telefonun çevirdiği altmış kare değil, yirmi kare.
  let guard = 0;
  while (guard++ < 3) {
    const p = await pg.evaluate(() => window.sliceRun());
    {
      const shown = await pg.evaluate(() => ({
        clear: document.getElementById('clear').classList.contains('show'),
        over:  document.getElementById('over').classList.contains('show'),
        stars: document.getElementById('clearStars').textContent.trim(),
        cut:   document.getElementById('cCut').textContent,
      }));
      console.log(`bölüm ${lvl}: ${p.state.padEnd(8)} kesilen ${String(p.cut).padStart(3)}/${p.total}  ` +
                  `yıldız "${shown.stars}"  ekran ${shown.clear ? 'BİTTİ' : shown.over ? 'ÇARPTI' : '???'}`);
      if (shown.clear) await pg.screenshot({ path: `${OUT}/slice_clear.png` });
      break;
    }
  }
  if (guard >= 400) console.log(`bölüm ${lvl}: BİTMEDİ (400 adım)`);
}
console.log('errors:', errs.length ? errs : 'none');
await b.close(); srv.close();
