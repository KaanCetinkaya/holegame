// Mayınlar: doğru bölümde çıkıyor mu, geçilebilir mi, kesilince ne oluyor?
//
//   node build-www.mjs && node scratchpad/slicemine.mjs
//
// Neden var: mayın oyunun ilk "dokunma" nesnesi ve iki şekilde sessizce
// oyunu bozabilir.
//
//   1. Kaçış hattı yoksa tahta geçilemez. Bıçak kendi gidiyor — durup
//      düşünme imkânı yok — yani mayın, bıçağın o mesafede tırmanamayacağı
//      bir yerdeyse bölüm bitirilemez. Geçilemez bir tahta zorluk değil,
//      hata; ve ekranda "zor bölüm" gibi görünür.
//   2. Uzun bıçak mayına da daha erken değiyor (menzil çarpışmaya giriyor).
//      Bu bilerek böyle — dükkândaki yükseltme takas olsun diye — ama
//      obsidyenle geçilemeyen bir tahta, çelikle geçilebilir olduğu için
//      testten kaçar. O yüzden ölçüm **en uzun bıçakla** yapılıyor.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((req, res) => {
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-slicer' + p);
    res.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8167);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = [];
pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
pg.on('console', m => {
  if (m.type() === 'error' && !m.text().includes('404')) errs.push('CONSOLE: ' + m.text());
});
// En uzun bıçak takılı başlasın: en dar durum o.
await pg.addInitScript(() => {
  localStorage.setItem('slicerush_level', '30');
  localStorage.setItem('slicerush_blades', JSON.stringify([0, 1, 2, 3, 4, 5]));
  localStorage.setItem('slicerush_blade', '5');
});
await pg.goto('http://localhost:8167/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.sliceProbe === 'function', { timeout: 20000 });
if (await pg.isVisible('#dOk')) await pg.click('#dOk');

const fails = [];
const check = (ok, ad, not = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ad}${not ? '   ' + not : ''}`);
  if (!ok) fails.push(ad + (not ? ' — ' + not : ''));
};

const menzil = await pg.evaluate(() => window.sliceMeta().reach);
console.log(`bıçak menzili ${menzil} (en uzunu)\n`);

// --- 1. mayınlar ne zaman çıkıyor ---
console.log('1) Hangi bölümden itibaren');
let erken = 0, gecKac = 0;
for (let n = 1; n <= 7; n++) {
  for (let k = 0; k < 4; k++) {
    const m = await pg.evaluate(lvl => { window.sliceStart(lvl); return window.sliceMines().length; }, n);
    erken += m;
  }
}
check(erken === 0, '8. bölümden önce mayın yok', `${erken} tane bulundu`);
for (let n = 8; n <= 20; n++) {
  let varMi = 0;
  for (let k = 0; k < 5; k++) {
    const m = await pg.evaluate(lvl => { window.sliceStart(lvl); return window.sliceMines().length; }, n);
    if (m > 0) varMi++;
  }
  if (!varMi) gecKac++;
}
check(gecKac <= 2, '8-20 arası bölümlerde mayın çıkıyor',
  `${gecKac} bölümde beş denemede de hiç çıkmadı`);

// --- 2. her mayının kaçışı var mı ---
//
// Ölçüm oyunun kendi sayılarıyla: mayının hemen ardındaki meyve, parçanın
// kurduğu kaçış hattı. Aradaki yükseklik farkı tehlike yarıçapından büyük
// olmalı, VE bıçak o mesafede oraya tırmanabilmeli.
console.log('\n2) Her mayının ulaşılabilir bir kaçışı var mı');
let dar = [], uzak = [];
for (let n = 8; n <= 30; n++) {
  for (let k = 0; k < 3; k++) {
    const r = await pg.evaluate(lvl => {
      window.sliceStart(lvl);
      const mayin = window.sliceMines();
      const hepsi = window.sliceAll();
      const menzil = window.sliceMeta().reach;
      const tehlike = 0.42 + 0.14 + menzil;
      const hiz = window.sliceProbe().hiz;
      const out = [];
      for (const m of mayin) {
        // Mayından sonraki ilk meyve: kaçış hattı.
        const sonra = hepsi.filter(i => i.kind === 'fruit' && i.d > m.d).sort((a, b) => a.d - b.d)[0];
        // Mayından önceki son meyve: oyuncunun geldiği hat.
        const once = hepsi.filter(i => i.kind === 'fruit' && i.d < m.d).sort((a, b) => b.d - a.d)[0];
        if (!sonra) { out.push({ d: m.d, ayrim: null, sure: null }); continue; }
        const ayrim = Math.abs(sonra.y - m.y);
        // Bıçak, önceki meyveden mayına varana kadar ne kadar tırmanabilir?
        const mesafe = once ? m.d - once.d : m.d;
        const tirmanma = (mesafe / hiz) * 5;   // CLIMB = 5
        out.push({ d: m.d, ayrim: +ayrim.toFixed(2), gereken: +tehlike.toFixed(2),
                   tirmanma: +tirmanma.toFixed(2) });
      }
      return out;
    }, n);
    for (const m of r) {
      if (m.ayrim === null || m.ayrim <= m.gereken) dar.push({ n, ...m });
      else if (m.tirmanma < m.ayrim) uzak.push({ n, ...m });
    }
  }
}
check(dar.length === 0, 'kaçış hattı tehlike yarıçapının dışında',
  dar.slice(0, 3).map(m => `blm ${m.n}: ayrım ${m.ayrim} ≤ ${m.gereken}`).join(' | '));
check(uzak.length === 0, 'bıçak kaçışa yetişiyor',
  uzak.slice(0, 3).map(m => `blm ${m.n}: ${m.ayrim} birim, tırmanma ${m.tirmanma}`).join(' | '));

// --- 3. otomatik oyuncu mayınlı bölümleri bitiriyor mu ---
//
// Asıl kanıt bu: yukarıdakiler geometriye bakıyor, bu gerçekten oynuyor.
console.log('\n3) Mayınlı bölümler baştan sona bitiyor mu');
const oldu = [];
for (const n of [8, 11, 14, 17, 21, 26, 30]) {
  const r = await pg.evaluate(async lvl => {
    window.sliceStart(lvl);
    const mayin = window.sliceMines().length;
    await new Promise(res => {
      const t = setInterval(() => {
        window.sliceAutoPlay();
        if (window.sliceProbe().state !== 'playing') { clearInterval(t); res(); }
      }, 16);
      setTimeout(() => { clearInterval(t); res(); }, 40000);
    });
    const p = window.sliceProbe();
    return { mayin, state: p.state, cut: p.cut, total: p.total };
  }, n);
  const ok = r.state === 'clear';
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} bölüm ${String(n).padStart(2)} — ${r.mayin} mayın, ` +
    `${r.cut}/${r.total} kesildi, ekran ${r.state}`);
  if (!ok) oldu.push(`blm ${n}: ${r.state}`);
}
check(oldu.length === 0, 'mayınlı bölümler bitirilebiliyor', oldu.join(' | '));

// --- 4. mayını kesmek turu bitiriyor mu ---
console.log('\n4) Mayına değince ne oluyor');
const son = await pg.evaluate(async () => {
  // Tahta rastgele: 12. bölümde her kurulumda mayın çıkmıyor. Bir tane
  // bulana kadar yeniden kur — testin konusu mayına değince ne olduğu,
  // mayının o kurulumda çıkıp çıkmadığı değil.
  let m = null;
  for (let k = 0; k < 25 && !m; k++) {
    window.sliceStart(12 + (k % 8));
    m = window.sliceMines()[0] || null;
  }
  if (!m) return { yok: true };
  // Bıçağı mayının hizasına kilitle ve oraya kadar sür.
  await new Promise(res => {
    const t = setInterval(() => {
      window.sliceSetTarget(m.y);
      if (window.sliceProbe().state !== 'playing' || window.sliceProbe().dist > m.d + 3) {
        clearInterval(t); res();
      }
    }, 16);
    setTimeout(() => { clearInterval(t); res(); }, 20000);
  });
  return { state: window.sliceProbe().state, baslik: document.getElementById('overTitle').textContent };
});
if (son.yok) check(false, '12. bölümde mayın var');
else {
  check(son.state === 'over', 'mayına değince tur bitiyor', son.state);
  check(son.baslik === 'You cut a mine!', 'başlık mayını söylüyor', son.baslik);
}

if (errs.length) fails.push('sayfa hatası: ' + errs[0]);
console.log('\n' + (fails.length ? 'hatalar:\n - ' + fails.join('\n - ') : 'hepsi geçti'));
await br.close(); srv.close();
process.exit(fails.length ? 1 : 0);
