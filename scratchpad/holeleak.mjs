// Bölüm geçişi GPU'da bir şey bırakıyor mu?
//
//   node build-www.mjs && node scratchpad/holeleak.mjs
//   node scratchpad/holeleak.mjs --levels 120
//
// Beyaz ekran (WebGL bağlam kaybı) aranırken ilk şüpheli hep birikme oluyor
// ve "bir şeyler sızıyor olabilir" cümlesi ölçülmeden doğrulanamıyor. Burada
// üç ayrı yerden bakılıyor, çünkü üçü ayrı şeyi görüyor:
//
//   1. `renderer.info` — three'nin kendi sayacı. Kendi bıraktığını bıraktı
//      sayıyor, yani three'nin haberi olmayan bir şeyi göremez.
//   2. WebGL çağrıları — sürücüdeki gerçek durum. createBuffer/deleteBuffer,
//      createTexture, createProgram, createVertexArray. Asıl ölçü bu.
//   3. Geometri doğum/ölüm defteri — `setAttribute` ve `dispose` sarılıyor,
//      ve her geometrinin **kim tarafından** kurulduğu yığından okunuyor.
//      Sayı artıyorsa bu sütun kimin bıraktığını doğrudan söylüyor.
//
// İlk koşuda (26 Eylül 2026) bulunan: sızıntı yok. Doku 12'den 38'e, program
// 11'den 27'ye çıkıp **düzleşiyor**; bulmaca kapılarının PlaneGeometry'leri
// 80 kurulup 80 bırakılıyor. Geriye kalan yavaş artış bölüm başına yarım
// geometri ve 200 bölümde 9 MB — bir bağlamı düşürecek büyüklük değil.
//
// Yani bu test bir hatayı yakalamak için değil, bir açıklamayı **elemek**
// için yazıldı; ve sınırlar o yüzden bugünkü sayıların hemen üstünde, bir
// gün gerçekten sızan bir şey eklenirse burada patlasın diye.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const arg = (k, d) => {
  const i = process.argv.indexOf('--' + k);
  return i === -1 ? d : process.argv[i + 1];
};
const SON = Number(arg('levels', 120));

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-fruithole' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8291);

// Sayaçlar sayfa açılmadan kuruluyor: ilk karede de tampon yaratılıyor ve
// sonradan sarılan bir sayaç onları kaçırır.
const SAY = () => {
  const C = window.__gl = { buf: 0, bufDel: 0, tex: 0, texDel: 0,
                            prog: 0, progDel: 0, vao: 0, vaoDel: 0, bufBytes: 0 };
  const sar = (P, ad, fn) => {
    if (!P || !P[ad]) return;
    const eski = P[ad];
    P[ad] = function (...a) { const r = eski.apply(this, a); fn(a, r); return r; };
  };
  for (const P of [window.WebGLRenderingContext && WebGLRenderingContext.prototype,
                   window.WebGL2RenderingContext && WebGL2RenderingContext.prototype]) {
    if (!P) continue;
    sar(P, 'createBuffer', () => C.buf++);
    sar(P, 'deleteBuffer', () => C.bufDel++);
    sar(P, 'createTexture', () => C.tex++);
    sar(P, 'deleteTexture', () => C.texDel++);
    sar(P, 'createProgram', () => C.prog++);
    sar(P, 'deleteProgram', () => C.progDel++);
    sar(P, 'createVertexArray', () => C.vao++);
    sar(P, 'deleteVertexArray', () => C.vaoDel++);
    sar(P, 'bufferData', a => {
      const d = a[1];
      C.bufBytes += typeof d === 'number' ? d : (d && d.byteLength) || 0;
    });
  }
};

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
await pg.addInitScript(SAY);
await pg.goto('http://localhost:8291/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleProbe, { timeout: 30000 });
await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });

// Geometri defteri. THREE modül olarak alınıyor, yani dışarıda global yok —
// prototip sahnedeki herhangi bir geometriden alınıyor.
//
// `setAttribute` doğum sayılıyor, çünkü her geometri kurulurken en az bir
// kez çağrılıyor. Kör noktası var: `copy()` ve `clone()` attribute'ları
// doğrudan atıyor ve buradan görünmüyor. Kör nokta bilinerek bırakıldı,
// çünkü aranan şey **her bölümde yenisini kuran** bir yer ve o yer
// setAttribute'tan geçiyor.
await pg.evaluate(() => {
  let geo = null;
  window.fruitHoleScene().traverse(o => { if (!geo && o.geometry) geo = o.geometry; });
  const P = Object.getPrototypeOf(geo);
  window.__kim = new Map(); window.__olu = new Map();
  const eskiSet = P.setAttribute, eskiDis = P.dispose;
  P.setAttribute = function (...a) {
    if (!this.__dogum) {
      this.__dogum = true;
      const iz = (new Error().stack || '').split('\n').slice(2, 5)
        .map(s => s.trim().replace(/^at\s+/, '').replace(/\s*\(.*$/, ''))
        .filter(s => s && s !== 'Object.setAttribute').join(' < ');
      this.__iz = iz;
      window.__kim.set(iz, (window.__kim.get(iz) || 0) + 1);
    }
    return eskiSet.apply(this, a);
  };
  P.dispose = function (...a) {
    if (this.__dogum && !this.__gomuldu) {
      this.__gomuldu = true;
      window.__olu.set(this.__iz, (window.__olu.get(this.__iz) || 0) + 1);
    }
    return eskiDis.apply(this, a);
  };
});

const oku = () => pg.evaluate(() => {
  const C = window.__gl;
  return {
    geo: window.fruitHoleMem().geometries,
    tex: window.fruitHoleMem().textures,
    prog: window.fruitHoleMem().programs,
    canliTampon: C.buf - C.bufDel,
    canliDoku: C.tex - C.texDel,
    canliProgram: C.prog - C.progDel,
    canliVao: C.vao - C.vaoDel,
    mb: +(C.bufBytes / 1048576).toFixed(1),
    kim: [...window.__kim.entries()],
    olu: [...window.__olu.entries()],
  };
});

const fails = [];
const check = (ok, ne, ek = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ne}${ek ? '   ' + ek : ''}`);
  if (!ok) fails.push(`${ne} ${ek}`);
};

const ORTA = Math.round(SON / 3);
let ara = null;
console.log(' blm | geo | doku | program | canlı tampon | canlı VAO | yüklenen MB');
console.log('-----+-----+------+---------+--------------+-----------+------------');
for (let lv = 1; lv <= SON; lv++) {
  await pg.evaluate(n => {
    window.fruitHoleProbe(n);
    window.fruitHoleStartLevel();
    window.fruitHoleCost();               // bir kare çizdir: program derlensin
  }, lv);
  if (lv === ORTA) ara = await oku();
  if (lv % Math.max(1, Math.round(SON / 6)) === 0 || lv === 1) {
    const r = await oku();
    console.log(` ${String(lv).padStart(3)} | ${String(r.geo).padStart(3)} | ` +
      `${String(r.tex).padStart(4)} | ${String(r.prog).padStart(7)} | ` +
      `${String(r.canliTampon).padStart(12)} | ${String(r.canliVao).padStart(9)} | ` +
      `${String(r.mb).padStart(11)}`);
  }
}
const son = await oku();

console.log('');
// Doku ve program sonlu bir kümeden geliyor: tema, meyve, nesne. Artmaya
// devam ediyorlarsa bölüm başına yenisi kuruluyor demektir ve o bir hata.
check(son.canliDoku - ara.canliDoku <= 4, 'doku düzleşiyor',
      `${ara.canliDoku} -> ${son.canliDoku}`);
check(son.canliProgram - ara.canliProgram <= 2, 'shader programı düzleşiyor',
      `${ara.canliProgram} -> ${son.canliProgram}`);

// Geometri: kuran her yer bıraktığı kadar kurmalı. Tek tek bakılıyor ki
// "toplamda denk" diye birinin sızdırdığı ötekinin fazlasında kaybolmasın.
const olu = new Map(son.olu);
const sizan = son.kim
  .map(([iz, n]) => [iz, n - (olu.get(iz) || 0)])
  // Bir bölümlük canlı tahta sızıntı değil: o geometriler şu an kullanılıyor.
  // Sınır bir tahtanın kabaca kurduğu kadar.
  .filter(([, kalan]) => kalan > 12)
  .sort((a, b) => b[1] - a[1]);
check(!sizan.length, 'her geometri bırakılıyor',
      sizan.length ? `${sizan[0][1]} adet: ${sizan[0][0]}` : '');

// Sürücüdeki toplam. Sınır bugünkünün kabaca iki katı: yavaş artış biliniyor
// ve sorun değil, ama bir gün hızlanırsa burada görünsün.
const vaoHiz = (son.canliVao - ara.canliVao) / (SON - ORTA);
check(vaoHiz < 12, 'VAO artışı bölüm başına 12\'nin altında', vaoHiz.toFixed(1));

if (errs.length) fails.push('sayfa hatası: ' + errs[0]);
console.log('\n' + (fails.length ? 'hatalar:\n - ' + fails.join('\n - ') : 'hepsi geçti'));
await br.close(); srv.close();
process.exit(fails.length ? 1 : 0);
