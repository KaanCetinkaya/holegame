// Kuleler gerçekten kuruluyor mu, ve yenebiliyor mu?
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-fruithole' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8487);
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.goto('http://localhost:8487/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.fruitHoleProbe === 'function', { timeout: 25000 });

const fails = [];
console.log('\n1. kule kuruluyor mu');
console.log('  blm  düzen         kule  parça  kat    doğuşa');
for (const lv of [12, 14, 17, 22, 27, 30, 41, 50, 54]) {
  const o = await pg.evaluate(async (l) => {
    let varMi = 0, top = 0, enAz = 99, enCok = 0, uzak = 99;
    let p = null;
    for (let t = 0; t < 12; t++) {
      window.fruitHoleSeedField(6100 + t * 7919 + l);
      p = window.fruitHoleProbe(l);
      window.fruitHoleStartLevel();
      const k = window.fruitHoleTowerObjects();
      if (k.sayi) { varMi++; enAz = Math.min(enAz, k.enAlcak); enCok = Math.max(enCok, k.enYuksek); }
      if (k.dogusaUzak != null) uzak = Math.min(uzak, k.dogusaUzak);
      top += k.sayi;
      window.fruitHoleUnseedField();
    }
    return { varMi, top, enAz, enCok, uzak, ad: p.pattern, kind: p.kind, agiz: window.fruitHoleTowerObjects().gerekenAgiz };
  }, lv);
  const bekle = lv >= 14 && o.kind === 'ızgara';
  const ok = bekle ? o.varMi >= 10 : o.varMi === 0;
  if (!ok) fails.push(`bölüm ${lv}: ${o.varMi}/12 tahtada kule (beklenen ${bekle ? '>=10' : '0'})`);
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${String(lv).padStart(3)}  ${o.ad.padEnd(12)}  ` +
    `${String(o.varMi).padStart(2)}/12  ${String(o.top).padStart(3)}  ` +
    `${o.enCok ? o.enAz + '-' + o.enCok : '—'}    ${o.uzak < 99 ? o.uzak : '—'}`);
}

console.log('\n2. kule yutulabiliyor mu');
const y = await pg.evaluate(() => {
  window.fruitHoleSeedField(777);
  window.fruitHoleProbe(22);
  window.fruitHoleStartLevel();
  const k = window.fruitHoleTowerObjects();
  const g = window.fruitHoleGiants();
  window.fruitHoleUnseedField();
  return { agiz: k.gerekenAgiz, enGenis: 2.75, baslangic: g.holeR };
});
const ok2 = y.agiz < y.enGenis;
if (!ok2) fails.push('kule en geniş ağızla bile yenmiyor');
console.log(`  ${ok2 ? 'OK  ' : 'FAIL'} kule ${y.agiz} ağız istiyor, en genişi ${y.enGenis} (başlangıç ${y.baslangic})`);

console.log('\n' + (fails.length ? 'hatalar:\n - ' + fails.join('\n - ') : 'hepsi geçti'));
process.exitCode = fails.length ? 1 : 0;
await br.close(); srv.close();
