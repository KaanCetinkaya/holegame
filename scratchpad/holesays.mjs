// Oyunun söylediği ile yaptığı aynı mı?
//
//   node build-www.mjs && node scratchpad/holesays.mjs
//
// Bu dosya bir hata **sınıfı** için var, tek bir özellik için değil: aynı
// gerçek iki yerde duruyor ve ikisi birbirine bakmıyor. Bu depoda defalarca
// oldu ve her seferinde başka kılıkta —
//
//   - `desc: '2500 of every fruit'` bir satırda, `fruit: 2500` başkasında;
//   - `desc: '+15 seconds'` bir satırda, `timeLeft += 15` başkasında;
//   - engel tanıtım satırı bölüm numarasına bakıyor, tahtada o engelin
//     olup olmadığına bakmıyor;
//   - mağaza metni "24 düzen" diyor, oyunda 48 var.
//
// Hepsinin ortak yanı: yazan taraf **sessizce** yanlış oluyor. Kod
// çalışıyor, test geçiyor, hata yalnızca okuyan oyuncuda görünüyor — ve o
// da bunu hata diye bildirmiyor, oyunun öyle olduğunu sanıyor.
//
// Buradaki ölçüler sayıyı metinden okuyup **yaptırıp** karşılaştırıyor.
// Sabitleri okuyup birbirine eşit mi diye bakmak yetmezdi: iki sabit eşit
// olabilir ve etki üçüncü bir yerden gelebilir.

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-fruithole' + p); } catch {}
  if (b) {
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } else { r.writeHead(404); r.end('no'); }
}).listen(8321);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const fails = [];
const check = (ok, ne, ek = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ne}${ek ? '   ' + ek : ''}`);
  if (!ok) fails.push(`${ne} ${ek}`);
};
const errs = [];

async function ac(level = 20) {
  const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
  pg.on('pageerror', e => errs.push(String(e)));
  await pg.addInitScript(l => {
    localStorage.clear();
    localStorage.setItem('fruithole_level', l);
    // Booster'lar açık ve elde olsun: kilitli bir booster kullanılamıyor.
    localStorage.setItem('fruithole_boosters',
      JSON.stringify({ time: 9, grow: 9, magnet: 9, twister: 9 }));
  }, String(level));
  await pg.goto('http://localhost:8321/', { waitUntil: 'load' });
  await pg.waitForFunction(() => typeof window.fruitHoleProbe === 'function', { timeout: 25000 });
  await pg.waitForSelector('#dailyBtn', { state: 'visible', timeout: 8000 }).catch(() => {});
  await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });
  await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 20000 });
  await pg.click('#playBtn');
  await pg.waitForTimeout(1200);
  return pg;
}

// Metindeki ilk sayı. "+15 seconds" -> 15, "8 seconds of strong pull" -> 8,
// "2,500 of every fruit" -> 2500.
const sayi = t => {
  const m = String(t).replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
};

console.log('\n1. süre booster\'ı: yazdığı kadar saniye veriyor mu');
{
  const pg = await ac();
  const o = await pg.evaluate(() => {
    const b = window.fruitHoleBoosterDefs().find(x => x.id === 'time');
    const once = window.fruitHoleWhere().timeLeft;
    window.fruitHoleUseBooster('time');
    return { yazi: b.desc, once, sonra: window.fruitHoleWhere().timeLeft };
  });
  const yazan = sayi(o.yazi);
  console.log(`  yazı: "${o.yazi}" · saat ${o.once} -> ${o.sonra}`);
  check(yazan !== null, 'yazıda bir sayı var', o.yazi);
  // Saat gerçek zamanla da akıyor, o yüzden tam eşitlik değil dar bir pay.
  check(Math.abs((o.sonra - o.once) - yazan) < 1.5,
    'verdiği saniye, yazdığı saniye', `${(o.sonra - o.once).toFixed(2)} ≈ ${yazan}`);
  await pg.close();
}

console.log('\n2. mıknatıs: yazdığı kadar sürüyor mu');
{
  const pg = await ac();
  const o = await pg.evaluate(() => {
    const b = window.fruitHoleBoosterDefs().find(x => x.id === 'magnet');
    window.fruitHoleUseBooster('magnet');
    return { yazi: b.desc, ms: window.fruitHoleMagnet().msLeft };
  });
  const yazan = sayi(o.yazi);
  console.log(`  yazı: "${o.yazi}" · süre ${o.ms} ms`);
  check(yazan !== null, 'yazıda bir sayı var', o.yazi);
  check(o.ms != null, 'süre ölçülebiliyor', String(o.ms));
  // `msLeft` ölçüldüğü an biraz akmış oluyor; 50 ms pay.
  check(Math.abs(o.ms - yazan * 1000) < 50, 'sürdüğü saniye, yazdığı saniye',
    `${o.ms} ms ≈ ${yazan}s`);
  await pg.close();
}

console.log('\n3. mayın satırı: bombanın bedelini doğru söylüyor mu');
{
  const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
  pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto('http://localhost:8321/', { waitUntil: 'load' });
  await pg.waitForFunction(() => typeof window.fruitHoleProbe === 'function', { timeout: 25000 });
  const o = await pg.evaluate(() => {
    // Mayın bölümünü bul: satırı yalnızca orada çıkıyor.
    for (let l = 1; l <= 60; l++) {
      const p = window.fruitHoleProbe(l);
      if (p.mission === 'mines') {
        window.fruitHoleStartLevel();
        const h = document.getElementById('hint');
        return { blm: l, yazi: h ? h.textContent : '', bedel: window.fruitHoleBombs().maliyet };
      }
    }
    return null;
  });
  if (!o) {
    check(false, 'mayın bölümü bulundu');
  } else {
    console.log(`  bölüm ${o.blm} · "${o.yazi}"`);
    check(o.yazi.includes('MINEFIELD'), 'mayın satırı çıkıyor', o.yazi.slice(0, 40));
    check(sayi(o.yazi) === o.bedel, 'satırdaki saniye, bombanın gerçek bedeli',
      `${sayi(o.yazi)} / ${o.bedel}`);
  }
  await pg.close();
}

console.log('\n4. sayısız açıklamalar olduğu gibi duruyor');
{
  // Üretim yalnızca sayılı olanlara dokunmalı: 'Hole grows at once' bir
  // sayı taşımıyor ve ona bir sayı uydurmak, düzeltilen hatayı ters
  // yönden yapmak olurdu.
  const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
  pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto('http://localhost:8321/', { waitUntil: 'load' });
  await pg.waitForFunction(() => window.fruitHoleBoosterDefs, { timeout: 25000 });
  const b = await pg.evaluate(() => window.fruitHoleBoosterDefs().map(x => ({ id: x.id, desc: x.desc })));
  const bos = b.filter(x => !x.desc || !x.desc.trim());
  check(!bos.length, 'her booster\'ın bir açıklaması var', bos.map(x => x.id).join(' '));
  console.log('  ' + b.map(x => `${x.id}: "${x.desc}"`).join('\n  '));
  await pg.close();
}

console.log('\nsayfa hataları: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
