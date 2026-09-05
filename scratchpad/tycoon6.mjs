// MAKS gerçekten kasadaki her şeyi harcıyor mu, ve büyük çarpanla seviyeler
// nereye kadar çıkıyor?
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
const srv = createServer((req,res)=>{
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try { const b=readFileSync('/home/user/holegame/www-tycoon'+p);
    res.writeHead(200,{'content-type':p.endsWith('.js')?'text/javascript':'text/html'}); res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8153);
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=swiftshader'] });
const pg = await b.newPage({ viewport:{width:412,height:915}, deviceScaleFactor:2 });
const errs=[]; pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('http://localhost:8153/', { waitUntil:'load' });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 20000 });
await pg.waitForTimeout(500);
const F = n => n>=1e12?(n/1e12).toFixed(2)+'T':n>=1e9?(n/1e9).toFixed(2)+'B':n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':n.toFixed(0);

// 1) MAKS tek seferde ne kadar harcıyor?
console.log('MAKS alımı — kasa 1e9 verildi, Döküm 1. seviyede:');
const r1 = await pg.evaluate(() => {
  window.jeGive(1e9);
  const before = window.jeProbe();
  window.jeBuy(0, 'max');
  const after = window.jeProbe();
  return { c0: before.cash, l0: before.lvl[0], c1: after.cash, l1: after.lvl[0] };
});
console.log(`  seviye ${r1.l0} -> ${r1.l1}   kasa ${F(r1.c0)} -> ${F(r1.c1)}  ` +
            `(harcanmayan: %${(100*r1.c1/r1.c0).toFixed(1)})`);
const r2 = await pg.evaluate(() => {
  const before = window.jeProbe();
  window.jeBuy(0, 'max');
  return { l0: before.lvl[0], c0: before.cash, l1: window.jeProbe().lvl[0], c1: window.jeProbe().cash };
});
console.log(`  hemen tekrar MAKS: seviye ${r2.l0} -> ${r2.l1}  ` +
            `${r2.l1 > r2.l0 ? '!!! ilk MAKS her şeyi almamış' : 'OK — alacak bir şey kalmamış'}`);

// 2) büyük çarpanla 30 dakika: seviyeler nereye çıkıyor?
console.log('\nçarpan yüksekken 30 dakika (her dakika darboğaza MAKS):');
await pg.evaluate(() => window.jeReset?.());
await pg.waitForTimeout(400);
await pg.goto('http://localhost:8153/', { waitUntil:'load' });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 20000 });
await pg.waitForTimeout(400);
// yapay olarak yüksek ömür boyu kazanç ver -> yüksek puan
await pg.evaluate(() => { window.jeSetLifetime?.(2.5e11); });
// Puanlar artık kendiliğinden çarpan olmuyor, harcanıyor. Hepsini hat hızına
// koymak eski davranışın aynısı — bu ölçüm onu ölçmek için var.
await pg.evaluate(() => { window.jeResBuy?.('line', 999999); });
const start = await pg.evaluate(() => window.jeProbe());
const res0 = await pg.evaluate(() => window.jeRes?.());
console.log(`  başlangıç çarpanı: ${res0.mult.toFixed(0)}x  (${start.points} puan, hepsi hat hızında)`);
for (let m = 1; m <= 30; m++) {
  const r = await pg.evaluate(() => {
    window.jeRun(60);
    window.jeBuy(['Döküm','Pres','Montaj','Sevkiyat'].indexOf(window.jeProbe().neck), 'max');
    return window.jeProbe();
  });
  if ([1,5,10,20,30].includes(m))
    console.log(`  ${String(m).padStart(2)} dk  lvl ${r.lvl.join('/').padEnd(19)} ürün ${r.product.padEnd(9)} ` +
                `gelir ${F(r.income).padStart(9)}  kasa ${F(r.cash)}`);
}
console.log('errors:', errs.length ? errs : 'none');
await b.close(); srv.close();
