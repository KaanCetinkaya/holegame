// Slice Rush'ın mağaza görselleri, gerçek oynanıştan.
//
//   node build-www.mjs && node scratchpad/slshots.mjs
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync, mkdirSync } from 'fs';
import { spawnSync } from 'child_process';

const ROOT = '/home/user/holegame';
const OUT = `${ROOT}/slicer/store`;
mkdirSync(OUT, { recursive: true });
mkdirSync(`${OUT}/tablet`, { recursive: true });

const srv = createServer((req, res) => {
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try {
    const b = readFileSync(ROOT + '/www-slicer' + p);
    res.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8145);

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader'] });

// Autopilot'u belli bir koşula kadar sür.
async function drive(pg, until, max = 400) {
  for (let i = 0; i < max; i++) {
    await pg.evaluate(() => window.sliceAutoPlay());
    await pg.waitForTimeout(50);
    const p = await pg.evaluate(() => window.sliceProbe());
    if (until(p)) return p;
    if (p.state !== 'playing') return p;
  }
  return await pg.evaluate(() => window.sliceProbe());
}

const SHOTS = [
  { name: '1-cut', lvl: 4, cap: 'Kes, ikiye ayrılsın',
    run: pg => drive(pg, p => p.shards >= 2) },
  { name: '2-combo', lvl: 6, cap: 'Üst üste kes, kombo büyüsün',
    run: async pg => {
      const p = await drive(pg, q => q.streak >= 6);
      // kombo yazısı görünürken yakala
      await pg.evaluate(() => {
        const el = document.getElementById('combo');
        el.textContent = 'x' + window.sliceProbe().streak;
        el.style.opacity = '1';
        el.style.transform = 'translate(-50%,-50%) scale(1.1)';
      });
      return p;
    } },
  // Demire yapışık bir kare kırmızı bir duvardan ibaret. Bir engelin
  // ilerisini, aradaki boşluk görünürken yakala.
  { name: '3-bars', lvl: 9, cap: 'Kırmızı demire çarpma',
    run: pg => drive(pg, p => p.dist > 34, 160) },
  // drive() oyun bittiği anda dönüyor — 'clear' beklemek yetmiyor, çarpınca
  // da dönüyor ve kare "üç yıldız al" başlığıyla çarpma ekranını gösteriyordu.
  // Bitene kadar tekrar dene.
  { name: '4-clear', lvl: 2, cap: 'Hepsini kes, üç yıldız al',
    run: async pg => {
      for (let k = 0; k < 6; k++) {
        const p = await drive(pg, q => q.state === 'clear');
        if (p.state === 'clear') { await pg.waitForTimeout(400); return p; }
        await pg.evaluate(() => window.sliceStart(2));
        await pg.waitForTimeout(300);
        await pg.evaluate(() => document.getElementById('hint').classList.remove('show'));
      }
      return null;
    } },
  { name: '5-blades', lvl: 1, cap: 'Kestikçe biriktir, bıçak al',
    run: async pg => {
      await pg.evaluate(() => { window.sliceGive(4000); });
      await pg.evaluate(() => document.getElementById('shopBtn').click());
      await pg.waitForTimeout(300);
      return null;
    }, menu: true },
  { name: '6-menu', lvl: 1, cap: null, run: async () => null, menu: true },
];

async function shoot(dir, w, h, scale) {
  for (const s of SHOTS) {
    const pg = await browser.newPage({
      viewport: { width: w / scale, height: h / scale }, deviceScaleFactor: scale });
    const errs = [];
    pg.on('pageerror', e => errs.push(String(e)));
    await pg.addInitScript(() => localStorage.clear());
    await pg.goto('http://localhost:8145/', { waitUntil: 'load' });
    await pg.waitForFunction(() => typeof window.sliceProbe === 'function', { timeout: 20000 });
    await pg.waitForTimeout(400);
    if (!s.menu) {
      await pg.evaluate(n => window.sliceStart(n), s.lvl);
      await pg.waitForTimeout(400);
      // the hint band would be in half the frames
      await pg.evaluate(() => document.getElementById('hint').classList.remove('show'));
    }
    await s.run(pg);
    await pg.waitForTimeout(200);
    if (s.cap) {
      await pg.evaluate(text => {
        const d = document.createElement('div');
        d.style.cssText = `position:fixed;left:0;right:0;top:0;z-index:99;
          padding:calc(env(safe-area-inset-top,0px) + 76px) 20px 26px;
          font-size:27px;font-weight:900;line-height:1.25;letter-spacing:-.4px;
          font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
          color:#fff;text-align:center;
          text-shadow:0 3px 14px rgba(0,0,0,.9), 0 1px 0 rgba(0,0,0,.7);
          background:linear-gradient(180deg,rgba(20,12,38,.9),rgba(20,12,38,0));
          pointer-events:none;`;
        d.textContent = text;
        document.body.appendChild(d);
      }, s.cap);
      await pg.waitForTimeout(120);
    }
    await pg.screenshot({ path: `${dir}/${s.name}.png` });
    console.log(`  ${dir.split('/').pop()}/${s.name}.png`, errs.length ? 'HATA: ' + errs[0] : '');
    await pg.close();
  }
}

console.log('telefon 1080x1920:');
await shoot(OUT, 1080, 1920, 2);
console.log('tablet 1440x2560:');
await shoot(`${OUT}/tablet`, 1440, 2560, 2);

// --- öne çıkan grafik ---
const pg = await browser.newPage({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 2 });
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8145/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.sliceProbe === 'function', { timeout: 20000 });
await pg.waitForTimeout(400);
await pg.evaluate(() => window.sliceStart(5));
await pg.waitForTimeout(400);
await drive(pg, p => p.shards >= 2);
await pg.evaluate(() => {
  for (const id of ['hud', 'barWrap', 'hint', 'combo']) {
    const e = document.getElementById(id);
    if (e) e.style.display = 'none';
  }
  const d = document.createElement('div');
  d.style.cssText = `position:fixed;inset:0;z-index:99;pointer-events:none;
    display:flex;align-items:center;padding-left:56px;
    background:linear-gradient(90deg,rgba(20,12,38,.93) 0%,rgba(20,12,38,.6) 40%,rgba(20,12,38,0) 62%);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;`;
  d.innerHTML = `<div style="max-width:430px">
      <div style="font-size:66px;font-weight:900;line-height:.98;color:#fff;
                  letter-spacing:-2px;text-shadow:0 5px 24px rgba(0,0,0,.85)">SLICE<br>
        <span style="color:#8fe4ff">RUSH</span></div>
      <div style="margin-top:18px;font-size:21px;font-weight:800;line-height:1.4;
                  color:#cfd4e2;text-shadow:0 2px 10px rgba(0,0,0,.9)">
        Tek parmak, tek eksen<br>
        <span style="color:#ffd23f">Her şeyi kes, demire çarpma</span></div>
    </div>`;
  document.body.appendChild(d);
});
await pg.waitForTimeout(200);
await pg.screenshot({ path: '/tmp/slfeature-2x.png' });
await browser.close();
srv.close();

const r = spawnSync('python3', ['-c', `
from PIL import Image
Image.open('/tmp/slfeature-2x.png').convert('RGB') \\
  .resize((1024, 500), Image.LANCZOS).save('${OUT}/feature-1024x500.png')
Image.open('${ROOT}/slicer/assets/icon-only.png') \\
  .resize((512, 512), Image.LANCZOS).save('${OUT}/icon-512.png')
print('feature-1024x500.png + icon-512.png')
`], { encoding: 'utf8' });
process.stdout.write(r.stdout || '');
process.stderr.write(r.stderr || '');
