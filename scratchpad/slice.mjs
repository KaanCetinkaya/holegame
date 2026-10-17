// Boot Slice Rush, auto-play a level, and check the cut actually happens.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
const OUT = '/tmp/claude-0/-home-user-holegame/69f8c7ec-ec6d-510e-8b3f-e83d17995163/scratchpad';
const srv = createServer((req,res)=>{
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try { const b=readFileSync('/home/user/holegame/www-slicer'+p);
    res.writeHead(200,{'content-type':p.endsWith('.js')?'text/javascript':'text/html'}); res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8111);
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=swiftshader'] });
const pg = await b.newPage({ viewport:{width:412,height:915}, deviceScaleFactor:2 });
const errs=[]; pg.on('pageerror',e=>errs.push(String(e)));
// 404 sayılmıyor: tarayıcı favicon istiyor, sunucu vermiyor. Oyunla ilgisi
// yok ve testi kırmızıya boyamaktan başka bir şey yapmıyor.
pg.on('console', m => { if (m.type()==='error' && !m.text().includes('404')) errs.push('CONSOLE: '+m.text()); });
await pg.goto('http://localhost:8111/', { waitUntil:'load' });
await pg.waitForFunction(() => typeof window.sliceProbe === 'function', { timeout: 20000 });
await pg.waitForTimeout(700);
await pg.screenshot({ path: `${OUT}/slice_menu.png` });
console.log('menu   ', JSON.stringify(await pg.evaluate(() => window.sliceProbe())));

// Günlük ödül ekranı menünün üstünde açılıyor ve #playBtn'e giden tıklamayı
// yutuyor. Bu dosya ödül ekranı eklenmeden önce yazılmıştı; o gün sessizce
// bozuldu ve hata "playBtn tıklanamıyor" diye değil, otuz saniyelik bir zaman
// aşımı olarak göründü — yani testin ne ölçtüğüyle ilgisiz bir mesaj.
if (await pg.isVisible('#dOk')) await pg.click('#dOk');
await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 15000 });

await pg.click('#playBtn');
await pg.waitForTimeout(400);
console.log('start  ', JSON.stringify(await pg.evaluate(() => window.sliceProbe())));

// drive it with the autopilot and watch the counters move
let shot = false;
for (let i = 0; i < 60; i++) {
  await pg.evaluate(() => window.sliceAutoPlay());
  await pg.waitForTimeout(90);
  const p = await pg.evaluate(() => window.sliceProbe());
  if (!shot && p.shards > 0) {
    await pg.screenshot({ path: `${OUT}/slice_cut.png` });
    shot = true;
    console.log('mid-cut', JSON.stringify(p));
  }
  if (p.state !== 'playing') { console.log('ended  ', JSON.stringify(p)); break; }
}
// Duraklat ve devam et.
//
// `tick` ikiye bölündü (`adim(dt)` benzetim, `tick` onu çağırıp
// çiziyor) ve duraklatmanın bütün dayanağı `adim`'in ilk satırındaki
// durum kontrolü. O satır bir gün kayarsa oyun duraklatılmışken
// ilerlemeye devam eder: oyuncu menüye bakarken bıçağı demire girer ve
// bunun hiçbir uyarısı olmaz.
const durak = await pg.evaluate(() => {
  for (const el of document.querySelectorAll('.screen')) el.classList.remove('show');
  window.sliceStart(3);
  // Otomatik sürücüyle sürülüyor. Bıçak eskiden 2.8'de sabit duruyordu
  // ve parkur her koşuda yeniden üretildiği için bu ölçüm zar atıyordu:
  // duraklatmanın çalışıp çalışmadığına bakacakken, araya bir demir
  // düştüğü koşularda "devam etmedi: over" diye düşüyordu. Ölçülen şey
  // duraklat/devam, bıçağın şansı değil.
  const sur = n => { for (let i = 0; i < n; i++) { window.sliceAutoPlay(); window.sliceStep(); } };
  sur(120);
  document.getElementById('pauseBtn').click();
  const a = window.sliceProbe();
  sur(120);
  const b = window.sliceProbe();
  document.getElementById('resumeBtn').click();
  sur(60);
  const c = window.sliceProbe();
  return { durum: a.state, durakta: +(b.dist - a.dist).toFixed(2),
           devamDurum: c.state, devam: +(c.dist - b.dist).toFixed(2) };
});
console.log(`duraklat: ${durak.durum} · 120 adımda ilerleme ${durak.durakta}` +
  ` · devam: ${durak.devamDurum} · 60 adımda ${durak.devam}`);
if (durak.durum !== 'paused') errs.push('duraklat çalışmadı: ' + durak.durum);
if (durak.durakta !== 0) errs.push('duraklatılmışken ilerledi: ' + durak.durakta);
if (durak.devamDurum !== 'playing' || durak.devam <= 0)
  errs.push('devam etmedi: ' + durak.devamDurum + ' / ' + durak.devam);

const end = await pg.evaluate(() => window.sliceProbe());
console.log('final  ', JSON.stringify(end));
await pg.screenshot({ path: `${OUT}/slice_end.png` });
console.log('errors:', errs.length ? errs : 'none');
await b.close(); srv.close();
process.exit(errs.length ? 1 : 0);
