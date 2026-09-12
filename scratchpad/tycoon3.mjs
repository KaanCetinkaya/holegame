// Çarpanı BU DOSYA HESAPLAMASIN. İki kere yandı: bir ara 1.02^puan'dı ve
// oyun doğrusala dönünce tablo 4.7e7x yazdı; sonra puanlar harcanabilir
// olunca harcanmadıkça çarpan 1 kaldı ama tablo yine kendi sayısını yazdı ve
// çalışan bir prestij döngüsü "seviyeler hiç büyümüyor" diye göründü.
// Artık oyundan okunuyor.
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
// Prestijden sonra puanlar kendiliğinden çarpan olmuyor; oyuncunun yapacağı
// şeyi yap ve hepsini hat hızına koy.
const spend = () => pg.evaluate(() => window.jeResBuy('line', 999999));
// Gerçek oyuncu müdürü görür görmez alıyor — ×2 her zaman kârlı. Sahte
// oyuncu almazsa müdürlerin kalıcı olmasının etkisi ölçüme hiç girmiyor.
const play = m => pg.evaluate(mins => {
  for (let k = 0; k < mins; k++) {
    window.jeRun(60);
    const p = window.jeProbe();
    for (let i = 0; i < 4; i++) if (!p.mgr[i]) window.jeBuyManager(i);
    window.jeBuy(['Döküm','Pres','Montaj','Sevkiyat'].indexOf(p.neck), 'max');
  }
  return window.jeProbe();
}, m);

console.log('şube | 30 dk sonunda        | gelir/sn  | puan | çarpan | devirde kazanılan');
console.log('-----+----------------------+-----------+------+--------+------------------');
for (let run = 1; run <= 6; run++) {
  const r = await play(30);
  const pend = r.pending;
  const mult = (await pg.evaluate(() => window.jeRes())).mult;
  console.log(` ${String(run).padStart(3)} | ${r.lvl.join('/').padEnd(20)} | ${F(r.income).padStart(9)} | ${String(r.points).padStart(4)} | ${mult.toFixed(1)}x | +${pend} puan | müdür ${r.mgr.filter(Boolean).length}/4`);
  const before = r.points;
  await pg.evaluate(() => window.jePrestige());
  await spend();
  const after = (await pg.evaluate(() => window.jeProbe())).points;
  if (after === before) console.log('      (devir eşiğine ulaşılmadı, aynı şubede devam)');
}
console.log('errors:', errs.length ? errs : 'none');
await b.close(); srv.close();
