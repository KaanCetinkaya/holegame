// Motor Works'ün öne çıkan grafiği (1024x500), gerçek oyundan.
//
//   node build-www.mjs && node scratchpad/tyfeature.mjs [tr]
//
// Dil argümanı verilirse Türkçe sürüm `store/tr/` altına yazılıyor.
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

const TR = process.argv.includes('tr');
const CIKTI = TR ? `${ROOT}/tycoon/store/tr/feature-1024x500.png`
                 : `${ROOT}/tycoon/store/feature-1024x500.png`;
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 1024, height: 500 },
  deviceScaleFactor: 2, locale: TR ? 'tr-TR' : 'en-US' });
const pg = await ctx.newPage();
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8133/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 20000 });
await pg.waitForTimeout(400);

await pg.evaluate(() => {
  document.getElementById('daily').classList.remove('show');
  // `jeAutoCarry` olmadan fabrika hiç büyümüyor: müdürsüz istasyonun
  // malını işçi taşıyor ve `jeRun` işçiyi yürütmüyor. Ekran
  // görüntülerinde aynı hata altı kareyi birinci seviyede bıraktı ve
  // kimse bakmamıştı; aynısı bu görselde de vardı.
  window.jeAutoCarry(true);
  // Tek seferlik ipuçları: müdürler işe alınınca nezaret ipucu şeridi
  // açılıyor ve kareyi ortadan kesiyor.
  window.jeTipSus();
  for (let k = 0; k < 30; k++) {
    window.jeRun(60);
    for (let i = 0; i < 4; i++) window.jeBuyManager(i);
    window.jeBuy(['Foundry', 'Stamping', 'Assembly', 'Dispatch'].indexOf(window.jeProbe().neck), 'max');
  }
  // Öne çıkan grafik oyunun arayüzünü değil, yerini göstermeli: panel ve
  // rozetler burada yalnızca yazının önünü kapatıyor.
  for (const id of ['panel', 'top', 'boostBtn', 'goalDot', 'float', 'tut']) {
    const e = document.getElementById(id);
    if (e) e.style.display = 'none';
  }
  // Dikey telefon için ayarlanmış çerçeve yatayda fabrikayı bir noktaya
  // indiriyor: 36 birimlik görüş 1024x500'de yalnızca 500 pikselin içine
  // sığıyor. Daha dar bir çerçeve ve merkeze alınmış bir kaydırma.
  window.jeCam(21, 0.02);
});
await pg.waitForTimeout(1200);
const buyudu = await pg.evaluate(() => window.jeProbe());
if (Math.max(...buyudu.lvl) < 20)
  throw new Error(`fabrika büyümedi — seviye ${JSON.stringify(buyudu.lvl)}. Görsel boş çıkardı.`);
console.log(`  fabrika: seviye ${JSON.stringify(buyudu.lvl)} · ${buyudu.income.toFixed(0)}/sn`);

// Başlık solda, fabrika sağda. Play bu görselin kenarlarını cihaza göre
// kırpabiliyor, o yüzden yazı ortaya değil güvenli bölgeye yerleşiyor.
await pg.evaluate(({ alt1, alt2 }) => {
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
        ${alt1}<br>
        <span style="color:#ffc44d">${alt2}</span></div>
    </div>`;
  document.body.appendChild(d);
}, TR
  ? { alt1: 'Döküm · Pres · Montaj · Sevkiyat',
      alt2: 'Hattı kur, darboğazı bul,<br>fabrikayı büyüt' }
  : { alt1: 'Foundry · Stamping · Assembly · Dispatch',
      alt2: 'Build the line, find the bottleneck,<br>grow the factory' });
await pg.waitForTimeout(150);
await pg.screenshot({ path: '/tmp/tyfeature-2x.png' });
await browser.close();
srv.close();

const py = `
from PIL import Image
im = Image.open('/tmp/tyfeature-2x.png').convert('RGB')
import os
os.makedirs(os.path.dirname('${CIKTI}'), exist_ok=True)
im.resize((1024, 500), Image.LANCZOS).save('${CIKTI}')
print('${CIKTI}'.split('tycoon/')[1], im.size, '-> (1024, 500)')
`;
const r = spawnSync('/usr/bin/python3', ['-c', py], { encoding: 'utf8' });
process.stdout.write(r.stdout || '');
process.stderr.write(r.stderr || '');
if (r.status !== 0) { console.log('küçültme düştü — görsel yazılmadı'); process.exitCode = 1; }
