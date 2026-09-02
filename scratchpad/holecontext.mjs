// WebGL bağlamı kaybolup geri gelince tarla geri çiziliyor mu?
//
//   node build-www.mjs && node scratchpad/holecontext.mjs
//
// Android WebView, sistem belleği geri istediğinde WebGL bağlamını
// düşürüyor — telefonda bu çoğu zaman uygulama arka plana atıldığında, yani
// her reklam ekranda kaldığında oluyor. Hiçbir şey hata fırlatmıyor: tuval
// çizmeyi bırakıyor, HUD, düğmeler ve geri sayım hiçbir şey olmamış gibi
// devam ediyor. Oyuncu bomboş bir tarlaya bakarken süresi işliyor.
//
// Telefondan gelen bir kareyle görüldü. Burada `WEBGL_lose_context` uzantısı
// ile bilerek düşürülüyor: karenin boş olduğu, geri gelince yeniden çizildiği
// ve bu sırada saatin durduğu ölçülüyor.

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-fruithole' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8197);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));

const fails = [];
const check = (ok, what, saw) => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what}${saw === undefined ? '' : `   ${saw}`}`);
  if (!ok) fails.push(what);
};

await pg.addInitScript(() => localStorage.setItem('fruithole_level', '38'));
await pg.goto('http://localhost:8197/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleProbe, { timeout: 25000 });
await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });
await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 20000 });
await pg.click('#playBtn');
await pg.waitForTimeout(3000);

// Tuvalin ne kadarının boyandığını say. WebGL tuvalini 2B tuvale
// `drawImage` ile kopyalamak işe yaramıyor — `preserveDrawingBuffer`
// olmadan çizim tamponu kare sonunda siliniyor ve her seferinde tek renk
// çıkıyor. O yüzden ölçüm sayfanın kendi ekran görüntüsünden alınıyor.
import { spawnSync } from 'child_process';
const shot = async (name) => {
  await pg.screenshot({ path: `/tmp/ctx-${name}.png`,
    clip: { x: 40, y: 300, width: 330, height: 330 } });
  return name;
};
const colours = (name) => {
  const r = spawnSync('python3', ['-c',
    `from PIL import Image\nprint(len(Image.open('/tmp/ctx-${name}.png').convert('RGB').getcolors(999999) or []))`],
    { encoding: 'utf8' });
  return Number((r.stdout || '0').trim());
};

await shot('before');
const before = colours('before');
check(before > 200, 'başlangıçta tarla çiziliyor', `${before} ayrı renk`);

const t0 = await pg.evaluate(() => window.fruitHoleGrow().timeLeft);
await pg.evaluate(() => {
  const gl = document.querySelector('#app canvas').getContext('webgl2')
          || document.querySelector('#app canvas').getContext('webgl');
  window.__lose = gl.getExtension('WEBGL_lose_context');
  window.__lose.loseContext();
});
await pg.waitForTimeout(1200);
check(await pg.evaluate(() => document.getElementById('pause').classList.contains('show')),
  'bağlam düşünce oyun duraklıyor');
const t1 = await pg.evaluate(() => window.fruitHoleGrow().timeLeft);
check(t1 >= t0 - 1, 'duraklarken saat işlemiyor', `${t0}sn -> ${t1}sn`);

await pg.evaluate(() => window.__lose.restoreContext());
await pg.waitForTimeout(1500);
// Duraklamadan çık ki tarla yeniden çizilsin.
await pg.evaluate(() => { const b = document.getElementById('resumeBtn'); if (b) b.click(); });
await pg.waitForTimeout(800);
await shot('after');
const after = colours('after');
check(after > 200, 'bağlam geri gelince tarla yeniden çiziliyor', `${after} ayrı renk`);

console.log('\nhatalar: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
