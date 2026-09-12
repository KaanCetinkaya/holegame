// Motor Works'ün öne çıkan grafiği (1024x500), gerçek oyundan.
//
//   node build-www.mjs && node scratchpad/tyfeature.mjs
//
// 2x çekilip Pillow ile küçültülüyor: doğrudan 1024'te çekince yazı ve
// dişli kenarları kırılıyor.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { spawnSync } from 'child_process';

const ROOT = '/home/user/holegame';
const srv = createServer((req, res) => {
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try {
    const b = readFileSync(ROOT + '/www-tycoon' + p);
    res.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8133);

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 2 });
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8133/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 20000 });
await pg.waitForTimeout(400);

await pg.evaluate(() => {
  document.getElementById('daily').classList.remove('show');
  for (let k = 0; k < 30; k++) {
    window.jeRun(60);
    window.jeBuy(['Döküm', 'Pres', 'Montaj', 'Sevkiyat'].indexOf(window.jeProbe().neck), 'max');
  }
  // Öne çıkan grafik oyunun arayüzünü değil, yerini göstermeli: panel ve
  // rozetler burada yalnızca yazının önünü kapatıyor.
  for (const id of ['panel', 'top', 'boostBtn', 'goalDot', 'float']) {
    const e = document.getElementById(id);
    if (e) e.style.display = 'none';
  }
  // Dikey telefon için ayarlanmış çerçeve yatayda fabrikayı bir noktaya
  // indiriyor: 36 birimlik görüş 1024x500'de yalnızca 500 pikselin içine
  // sığıyor. Daha dar bir çerçeve ve merkeze alınmış bir kaydırma.
  window.jeCam(21, 0.02);
});
await pg.waitForTimeout(1200);

// Başlık solda, fabrika sağda. Play bu görselin kenarlarını cihaza göre
// kırpabiliyor, o yüzden yazı ortaya değil güvenli bölgeye yerleşiyor.
await pg.evaluate(() => {
  const d = document.createElement('div');
  d.style.cssText = `position:fixed;inset:0;z-index:99;pointer-events:none;
    display:flex;align-items:center;padding-left:58px;
    background:linear-gradient(90deg,rgba(12,14,19,.92) 0%,rgba(12,14,19,.62) 38%,rgba(12,14,19,0) 60%);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;`;
  // Kısayol `font:` yerine ayrı ayrı: `font: 900 62px/1.02 inherit` bütün
  // bildirimi geçersiz kılıyor ve yazı varsayılan boyutta kalıyor.
  d.innerHTML = `<div style="max-width:430px">
      <div style="font-size:66px;font-weight:900;line-height:.98;color:#fff;
                  letter-spacing:-2px;text-shadow:0 5px 24px rgba(0,0,0,.85)">MOTOR<br>
        <span style="color:#ff9422">WORKS</span></div>
      <div style="margin-top:18px;font-size:21px;font-weight:800;line-height:1.4;
                  color:#c9d0da;text-shadow:0 2px 10px rgba(0,0,0,.9)">
        Döküm · Pres · Montaj · Sevkiyat<br>
        <span style="color:#ffc44d">Hattı kur, darboğazı bul,<br>fabrikayı büyüt</span></div>
    </div>`;
  document.body.appendChild(d);
});
await pg.waitForTimeout(150);
await pg.screenshot({ path: '/tmp/tyfeature-2x.png' });
await browser.close();
srv.close();

const py = `
from PIL import Image
im = Image.open('/tmp/tyfeature-2x.png').convert('RGB')
im.resize((1024, 500), Image.LANCZOS).save('${ROOT}/tycoon/store/feature-1024x500.png')
print('feature-1024x500.png', im.size, '-> (1024, 500)')
`;
const r = spawnSync('python3', ['-c', py], { encoding: 'utf8' });
process.stdout.write(r.stdout || '');
process.stderr.write(r.stderr || '');
