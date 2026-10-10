// Delik tahtadan çıkabiliyor mu?
//
//   node build-www.mjs && node scratchpad/holesinir.mjs
//
// Deliğin yerini oyuncudan başka üç şey değiştiriyor: rüzgâr sürüklüyor,
// silindir itiyor, kaya geri itiyor. Üçü de ayrı yerlerde yazılmış ve
// yalnızca rüzgârın kodunda kenar kısıtı var — *"rüzgâr deliği tahtanın
// dışına itebilir"* diye bir yorumla birlikte. Ötekilerde böyle bir satır
// yok, ve hiçbirinde "delik tahtada kalır" diye bir ölçü yok.
//
// Bu, tahta değişmezlerinden farklı bir sınıf: tahta kurulurken değil,
// **oynanırken** bozuluyor. Tahtanın sağlığını ölçen tarama böyle bir şeyi
// hiç göremez, çünkü tahta kurulduğu an kusursuz.
//
// Oynatılarak ölçülüyor, okunarak değil. Her kenara ve her köşeye doğru
// sürülüyor; aradaki her karede deliğin yeri bakılıyor. Bir kere bile
// dışarı çıkıyorsa oyuncu ekranın dışına sürüklenen bir delikle kalıyor,
// ve oradan geri dönmenin yolu yok.

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
}).listen(8347);

// Sahte saat: oyun gerçek zamanda değil adım adım ilerliyor, yani ölçülen
// şey oyunun kendi saati. `holecard.mjs`'in aynısı, bir farkla — oradaki
// kurgu kare içindeki istisnayı sessizce yutuyor ve donma hatası tam
// oradan aylarca saklanmıştı. Burada yutulan her hata sayılıyor.
const FAKE_CLOCK = () => {
  let t = 0;
  const queue = [];
  window.__yutulan = 0;
  window.requestAnimationFrame = cb => { queue.push(cb); return queue.length; };
  window.cancelAnimationFrame = () => {};
  try {
    Object.defineProperty(window.performance, 'now', { configurable: true, value: () => t });
  } catch (e) { window.performance.now = () => t; }
  window.__step = ms => {
    t += ms;
    const batch = queue.splice(0, queue.length);
    for (const cb of batch) { try { cb(t); } catch (e) { window.__yutulan++; } }
  };
};

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
await pg.addInitScript(FAKE_CLOCK);
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('http://localhost:8347/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.fruitHoleProbe === 'function', { timeout: 25000 });

const fails = [];
const check = (ok, ne, ek = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ne}${ek ? '   ' + ek : ''}`);
  if (!ok) fails.push(`${ne} ${ek}`);
};

// Her engelin kendi bölümünü oyundan sor: elle yazılan bir bölüm numarası,
// engel taşındığında sessizce başka bir tahtayı ölçmeye başlar.
const BLM = await pg.evaluate(() => ({
  kaya: 12,
  silindir: window.fruitHoleRollers().ilkBolum,
  ruzgar: window.fruitHoleWind().ilkBolum,
}));

// Sekiz yön: dört kenar, dört köşe. Kenarlar tek tek kısıtlanıyor olabilir
// ama köşede ikisi birden gerekiyor, ve köşe tam da bir eksikliğin
// görüneceği yer.
const YONLER = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [0.707, 0.707], [-0.707, 0.707], [0.707, -0.707], [-0.707, -0.707],
];

console.log('\ndeliğin yeri, her yöne sürülürken');
console.log('\n  blm  ne         | en çok taşma  | kare');
console.log('  ----+-----------+---------------+------');
for (const [ad, lv] of Object.entries(BLM)) {
  const o = await pg.evaluate(async ([l, yonler]) => {
    window.fruitHoleSeedField(8100 + l);
    window.fruitHoleProbe(l);
    window.fruitHoleStartLevel();
    for (let i = 0; i < 30; i++) window.__step(1000 / 30);   // tarla insin
    const w0 = window.fruitHoleWhere();
    const halfX = w0.halfX, halfZ = w0.halfZ;
    let enTasma = 0, kare = 0, nerede = null;
    window.fruitHoleHold(true);
    for (const [dx, dz] of yonler) {
      // Her yöne uzun uzun: delik kenara dayanıp orada kalsın, ve rüzgâr
      // ile silindir onu orada bulsun.
      for (let i = 0; i < 300; i++) {
        window.fruitHoleSteer(dx, dz);
        window.__step(1000 / 30);
        kare++;
        const w = window.fruitHoleWhere();
        const tasma = Math.max(Math.abs(w.x) - halfX, Math.abs(w.z) - halfZ);
        if (tasma > enTasma) { enTasma = tasma; nerede = { x: w.x, z: w.z }; }
      }
    }
    window.fruitHoleHold(false);
    window.fruitHoleUnseedField();
    return { enTasma: +enTasma.toFixed(3), kare, nerede, halfX, halfZ,
             yutulan: window.__yutulan };
  }, [lv, YONLER]);
  console.log(`  ${String(lv).padStart(3)} ${ad.padEnd(10)} | ${String(o.enTasma).padStart(13)} | ${o.kare}`);
  // Pay sıfır değil: kenar kısıtının kendisi `fieldHalfX - holeRadius * 0.5`
  // kullanıyor, yani deliğin merkezi kenarın biraz içinde duruyor ama ağzın
  // yarısı dışarı taşabiliyor — bu tasarımın kendisi, delik kenardaki
  // meyveyi alabilsin diye. Ölçülen şey **merkezin** dışarı çıkması.
  check(o.enTasma <= 0.001, `${ad}: delik tahtanın dışına çıkmıyor`,
    o.nerede ? `${o.enTasma} birim · ${o.nerede.x},${o.nerede.z} · kenar ±${o.halfX}/±${o.halfZ}` : '');
  check(!o.yutulan, `${ad}: kare içinde hata atılmıyor`, `${o.yutulan} yutulan`);
}

console.log('\nrakip delik de tahtada kalıyor mu');
{
  // Rakip, katı engellerden itiliyor (`pushPointOut` üç listeyle birden)
  // ama kenara karşı bir kısıtı yok. Deliği kovaladığı ve delik kısıtlı
  // olduğu için içeride kalması bekleniyor — "bekleniyor" ise ölçülmemiş
  // demek, ve bu dosyanın tamamı o kelimenin peşinde.
  //
  // En zorlayıcı hâl: delik köşeye dayanmış ve orada duruyor. Rakip
  // dışarıdan değil içeriden geliyor, yani köşeye sıkışan o oluyor.
  const o = await pg.evaluate(async (l) => {
    window.fruitHoleSeedField(8100 + l);
    window.fruitHoleProbe(l);
    window.fruitHoleStartLevel();
    for (let i = 0; i < 30; i++) window.__step(1000 / 30);
    const w0 = window.fruitHoleWhere();
    // Deliği köşeye sür ve orada tut.
    window.fruitHoleHold(true);
    for (let i = 0; i < 200; i++) { window.fruitHoleSteer(0.707, 0.707); window.__step(1000 / 30); }
    let enTasma = 0, icinde = 0, nerede = null;
    const kati = [...(window.fruitHoleRocks().yerler || []),
                  ...(window.fruitHoleCatapults().yerler || [])];
    for (let i = 0; i < 600; i++) {
      window.fruitHoleSteer(0.707, 0.707);
      window.__step(1000 / 30);
      const v = window.fruitHoleRival();
      if (!v.var) break;
      const tasma = Math.max(Math.abs(v.x) - w0.halfX, Math.abs(v.z) - w0.halfZ);
      if (tasma > enTasma) { enTasma = tasma; nerede = { x: v.x, z: v.z }; }
      // Katı bir şeyin içinde mi: yarıçapların toplamından yakınsa içinde.
      for (const k of kati) {
        if (Math.hypot(k.x - v.x, k.z - v.z) < (k.r || 0.78) + v.r - 0.05) { icinde++; break; }
      }
    }
    window.fruitHoleHold(false);
    window.fruitHoleUnseedField();
    return { enTasma: +enTasma.toFixed(3), icinde, nerede,
             halfX: w0.halfX, halfZ: w0.halfZ, yutulan: window.__yutulan };
  }, await pg.evaluate(() => window.fruitHoleRival().ilkBolum));
  console.log(`  en çok taşma ${o.enTasma} · katının içinde geçen kare ${o.icinde}`);
  check(o.enTasma <= 0.001, 'rakip tahtanın dışına çıkmıyor',
    o.nerede ? `${o.nerede.x},${o.nerede.z} · kenar ±${o.halfX}/±${o.halfZ}` : '');
  check(!o.icinde, 'rakip katı bir engelin içinde durmuyor', String(o.icinde));
}

console.log('\nsayfa hataları: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
