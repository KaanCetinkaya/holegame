// Tahta kaça çiziliyor? Meyve başına bir çizim çağrısı mı?
//
//   node build-www.mjs && node scratchpad/holeinstance.mjs
//
// Neden var: "her bölümde farklı bir diziliş" isteği aslında bir çözünürlük
// isteği. Tahta 13 sütun ve 13 sütunla resim çizilemez — rakiplerin tahtası
// tanınabilir bir nesne (mısır, ayı, Eyfel) çünkü binlerce minik parçadan
// kurulu. Bizde o yoğunluğa çıkmanın önündeki duvar bellek: beyaz ekran zaten
// 500 meyvede geliyor.
//
// Ölçülen şey kare hızı değil — konteynerde GPU yok, zamanlama ölçülemez.
// Ölçülen şey çizim çağrısı ve üçgen: ikisi de belirlenimci ve ikisi de
// InstancedMesh'in düşürmesi gereken sayılar. Bu dosya, o işten önceki
// **taban**.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
const srv = createServer((req, res) => {
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  let b;
  try { b = readFileSync('/home/user/holegame/www-fruithole' + p); }
  catch { res.writeHead(404); res.end('no'); return; }
  res.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
  res.end(b);
}).listen(8221);
const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = [];
pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
await pg.goto('http://localhost:8221/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.fruitHoleCost === 'function', { timeout: 30000 });

console.log(' blm | meyve | çizim | üçgen   | geometri | doku | yığın | yığındaki | tekil nesne');
console.log('-----+-------+-------+---------+----------+------+-------+-----------+------------');
const satir = [];
for (const lv of [1, 9, 13, 18, 24, 34, 44, 53]) {
  const r = await pg.evaluate(n => {
    const p = window.fruitHoleProbe(n);
    window.fruitHoleHold && window.fruitHoleHold(true);
    const c = window.fruitHoleCost();
    const m = window.fruitHoleMem();
    // Kalan çizim çağrısı nereden geliyor? Yığına geçmemiş her nesne bir
    // çağrı (gölge geçişiyle iki). Sayıyı bilmeden "daha ne kaldı" sorusu
    // tahmine kalıyor.
    let tekil = 0, yigin = 0, parca = 0;
    window.fruitHoleScene().traverse(o => {
      if (o.isInstancedMesh) { yigin++; parca += o.count; }
      else if (o.isMesh) tekil++;
    });
    return { fruit: p.fruit, calls: c.calls, tri: c.triangles,
             geo: m.geometries, tex: m.textures, tekil, yigin, parca };
  }, lv);
  satir.push({ lv, ...r });
  console.log(` ${String(lv).padStart(3)} | ${String(r.fruit).padStart(5)} | ` +
    `${String(r.calls).padStart(5)} | ${String(r.tri).padStart(7)} | ` +
    `${String(r.geo).padStart(8)} | ${String(r.tex).padStart(4)} | ` +
    `${String(r.yigin).padStart(5)} | ${String(r.parca).padStart(9)} | ` +
    String(r.tekil).padStart(11));
}
const enAgir = satir.reduce((a, b) => (b.calls > a.calls ? b : a));
console.log(`\nen ağır tahta: bölüm ${enAgir.lv} — ${enAgir.calls} çizim çağrısı, ` +
            `${enAgir.tri} üçgen, ${enAgir.geo} geometri`);
console.log('sayfa hatası:', errs.length ? errs[0] : 'yok');
await br.close(); srv.close();
