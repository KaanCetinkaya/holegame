import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-fruithole' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8478);
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.goto('http://localhost:8478/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.fruitHoleThemeTable === 'function', { timeout: 25000 });
const t = await pg.evaluate(() => window.fruitHoleThemeTable());
const kullanilan = new Set(t.patternThemes);
console.log('tema sayısı:', t.themes.length);
console.log('düzen sayısı:', t.patternCount);
console.log('kullanılan tema:', kullanilan.size);
console.log('hiç çıkmayan:', t.themes.filter(x => !kullanilan.has(x.id)).map(x => x.name + ' (' + x.id + ')').join(', ') || 'yok');
const iki = [...kullanilan].filter(id => t.patternThemes.filter(x => x === id).length > 1);
console.log('iki düzeni olan:', iki.map(id => (t.themes.find(x => x.id === id) || {}).name).join(', ') || 'yok');
await br.close(); srv.close();
