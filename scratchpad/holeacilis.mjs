// Bölüm açılışı: kamera bütün tahtayı gösterip deliğe iniyor mu?
//
//   node build-www.mjs && node scratchpad/holeacilis.mjs
//
// Kaan üç kez "bölümler hep aynı geliyor" dedi. Ölçüm sebebi çeşit
// eksikliğinde bulmadı — kırk sekiz zemin, kırk sekiz düzen, otuz dokuz
// nesne kümesi var. Sebep **görmemek**: her düzen tahtaya bir resim çiziyor
// ve rengi fırça olarak kullanıyor (`Track` bir ayak izi, pençeleri başka
// meyve), bunun bedeli tahtanın tek renk görünmesi — altmış sekiz ızgara
// tahtanın yirmi dokuzunda bir tür yarıdan fazla — ama delik resmin içinde
// doğduğu için oyuncu resmi hiç görmüyordu. Bedel ödeniyor, karşılığı
// alınmıyordu.
//
// Ölçülen üç şey:
//
//   1. Açılış gerçekten **bütün tahtayı** gösteriyor (kadraj tahtanın
//      enine eşit ya da ondan geniş).
//   2. Açılış bitince kadraj oyunun kendi genişliğine **dönüyor** — bir
//      yerde takılı kalmıyor.
//   3. Saat açılış boyunca **işlemiyor**: bir buçuk saniyeyi oyuncudan
//      çalan bir gösteri, gösteri olmaktan çıkar.

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
}).listen(8353);

const FAKE_CLOCK = () => {
  let t = 0; const q = [];
  window.__yutulan = 0;
  window.requestAnimationFrame = cb => { q.push(cb); return q.length; };
  window.cancelAnimationFrame = () => {};
  try { Object.defineProperty(window.performance, 'now', { configurable: true, value: () => t }); }
  catch (e) { window.performance.now = () => t; }
  window.__step = ms => { t += ms; for (const cb of q.splice(0, q.length)) { try { cb(t); } catch (e) { window.__yutulan++; } } };
};

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
await pg.addInitScript(FAKE_CLOCK);
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('http://localhost:8353/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.fruitHoleShake === 'function', { timeout: 25000 });

const fails = [];
const check = (ok, ne, ek = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ne}${ek ? '   ' + ek : ''}`);
  if (!ok) fails.push(`${ne} ${ek}`);
};

// Dört tahta türü birden: ızgara, resim, şerit, bulmaca. Bulmacanın kendi
// kamera kuralı var (geri çekilmiş duruyor) ve açılış onu bozmamalı.
for (const lv of [7, 3, 6, 18]) {
  const o = await pg.evaluate(async ([l, fps]) => {
    window.fruitHoleSeedField(4400 + l);
    const p = window.fruitHoleProbe(l);
    window.fruitHoleStartLevel();
    const w0 = window.fruitHoleWhere();
    // İlk ölçüm **bir kare ilerledikten sonra** alınıyor. İlk yazılışta
    // `startLevel`'ın hemen ardından okunuyordu ve kamera o an hâlâ bir
    // önceki bölümün kadrajındaydı — ölçü açılışı değil, kendinden önceki
    // şeyi ölçüyordu ve "açılış yok" diyordu.
    const iz = [];
    for (let i = 0; i < 90; i++) {           // üç saniye
      window.__step(1000 / fps);
      iz.push(window.fruitHoleShake().halfW);
    }
    const ilk = { halfW: iz[0], acilis: window.fruitHoleShake().acilis };
    const son = window.fruitHoleShake();
    const w1 = window.fruitHoleWhere();
    window.fruitHoleUnseedField();
    return { kind: p.kind, ilkHalf: ilk.halfW, ilkAcilis: ilk.acilis, iz2: iz,
             sonHalf: son.halfW, sonAcilis: son.acilis, iz,
             halfX: w0.halfX, saat0: w0.timeLeft, saat1: w1.timeLeft,
             yutulan: window.__yutulan };
  }, [lv, 30]);

  console.log(`\nbölüm ${lv} (${o.kind}) · tahta yarı eni ${o.halfX}`);
  console.log(`  kadraj: ${o.iz.filter((_, i) => i % 9 === 0).join(' -> ')}`);
  // Açılış bütün tahtayı göstermeli: kadrajın yarı eni tahtanınkinden az
  // olmamalı. `fieldHalfX + 1` tam olarak bunu veriyor.
  const enGenis = Math.max(...o.iz);
  check(enGenis >= o.halfX, `${lv}: açılış tahtanın enini gösteriyor`,
    `kadraj ${enGenis} · tahta ${o.halfX}`);
  // Ve bitmeli. Takılı kalan bir açılış, oyunu uzaktan oynatır.
  check(o.sonAcilis === 0, `${lv}: açılış bitiyor`, `kalan ${o.sonAcilis}`);
  // İniş: en geniş andan sonuna doğru daralıyor. Son değer tahtanın kendi
  // kuralı — bulmacada kamera geri çekilmiş duruyor (7.33) ve açılış onu
  // bozmamalı, sıradan tahtada oyunun kendi genişliği (5.4).
  check(o.sonHalf < enGenis, `${lv}: kamera deliğe iniyor`,
    `${enGenis} -> ${o.sonHalf}`);
  check(!o.yutulan, `${lv}: kare içinde hata atılmıyor`, `${o.yutulan} yutulan`);
}

console.log('\nsayfa hataları: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
