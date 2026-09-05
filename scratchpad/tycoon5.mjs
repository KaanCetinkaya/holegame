// Ürün hattı: kademe zincirin en zayıf halkasına mı bakıyor, fiyat ve
// görsel gerçekten değişiyor mu, gelir eğrisi ne oldu.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
const srv = createServer((req,res)=>{
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try { const b=readFileSync('/home/user/holegame/www-tycoon'+p);
    res.writeHead(200,{'content-type':p.endsWith('.js')?'text/javascript':'text/html'}); res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8151);
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=swiftshader'] });
const pg = await b.newPage({ viewport:{width:412,height:915}, deviceScaleFactor:2 });
const errs=[]; pg.on('pageerror',e=>errs.push(String(e)));
pg.on('console', m => { if (m.type()==='error' && !m.text().includes('404')) errs.push('CONSOLE: '+m.text()); });
await pg.goto('http://localhost:8151/', { waitUntil:'load' });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 20000 });
await pg.waitForTimeout(600);
await pg.evaluate(() => document.getElementById('daily')?.classList.remove('show'));

// tek bir istasyonu zorlayınca kademe atlamamalı
await pg.evaluate(() => { window.jeGive(1e12); window.jeBuy(0, 200); });
await pg.waitForTimeout(300);
const one = await pg.evaluate(() => window.jeProbe());
console.log(`tek istasyon 200. seviyede: lvl ${one.lvl.join('/')}  ürün ${one.product} (kademe ${one.tier})  ` +
            `${one.tier === 0 ? 'OK — atlamadı' : '!!! zayıf halkaya bakmıyor'}`);

// dengeli büyüt, kademeleri gör
const F = n => n>=1e12?(n/1e12).toFixed(2)+'T':n>=1e9?(n/1e9).toFixed(2)+'B':n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':n.toFixed(0);
console.log('\n en zayıf | ürün      | araç başına | gelir/sn');
console.log('----------+-----------+-------------+----------');
for (const lvl of [1, 60, 150, 300, 520]) {
  const r = await pg.evaluate(n => {
    window.jeGive(1e26);
    for (let i = 0; i < 4; i++) window.jeBuy(i, Math.max(0, n - window.jeProbe().lvl[i]));
    return window.jeProbe();
  }, lvl);
  console.log(` ${String(Math.min(...r.lvl)).padStart(8)} | ${r.product.padEnd(9)} | ` +
              `${F(r.price).padStart(11)} | ${F(r.income)}`);
}

// görsel gerçekten değişti mi
await pg.waitForTimeout(900);
const seen = await pg.evaluate(() => window.jeSeenTier?.() ?? null);
console.log('\nsahnedeki kademe:', seen, '(oyun kademesiyle aynı olmalı)');
console.log('errors:', errs.length ? errs : 'none');
await b.close(); srv.close();
