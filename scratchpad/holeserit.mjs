// Şerit tahtalarının üstten haritası — şekil okunuyor mu?
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-fruithole' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8484);
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.goto('http://localhost:8484/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.fruitHoleProbe === 'function', { timeout: 25000 });

for (const lv of [29]) {
  const o = await pg.evaluate((l) => {
    window.fruitHoleSeedField(900 + l);
    const p = window.fruitHoleProbe(l);
    window.fruitHoleStartLevel();
    const b = window.fruitHoleBoardCells();
    // Dünya koordinatından kaba bir harita: 0.55 birimlik kareler.
    const ADIM = 0.5;
    const w = window.fruitHoleWhere();
    const g = {};
    let minX = 9e9, maxX = -9e9, minZ = 9e9, maxZ = -9e9;
    for (const h of b.hucre) {
      const x = (h.c - (b.cols - 1) / 2) * b.cell, z = (h.r - (b.rows - 1) / 2) * b.cell;
      const i = Math.round(x / ADIM), j = Math.round(z / ADIM);
      g[j + ',' + i] = h.prop ? 'O' : h.kat > 3 ? '#' : h.kat > 1 ? '+' : h.big ? 'O' : '.';
      if (i < minX) minX = i; if (i > maxX) maxX = i;
      if (j < minZ) minZ = j; if (j > maxZ) maxZ = j;
    }
    const sat = [];
    for (let j = minZ; j <= maxZ; j++) {
      let s = '';
      for (let i = minX; i <= maxX; i++) s += g[j + ',' + i] || ' ';
      sat.push(s);
    }
    window.fruitHoleUnseedField();
    return { ad: p.pattern, toplam: w.total, harita: sat.join('\n') };
  }, lv);
  console.log(`\n=== bölüm ${lv} — ${o.ad} · ${o.toplam} parça ===`);
  console.log(o.harita);
}
await br.close(); srv.close();
