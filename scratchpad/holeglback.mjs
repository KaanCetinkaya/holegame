// Bağlam kaybı uygulama arka plandayken olursa, öne gelince geri geliyor mu?
//
//   node build-www.mjs && node scratchpad/holeglback.mjs
//
// Neden var: telefondan gelen kayıt şunu söyledi —
//
//   bölüm 5 · 0 parça · 31 geo · 15 doku · 24 çizim · GERİ GELMEDİ
//
// Sıfır parça, yani kayıp menüdeyken oldu; menüde otururken bağlamı düşüren
// şey tahtanın ağırlığı olamaz. Geriye tek açıklama kalıyor: uygulama arka
// plana düştü ve WebView'in yüzeyi alındı. Eski kod dört denemeyi altı saniye
// içinde, yani hâlâ arka plandayken yapıp susuyordu.
//
// Burada ölçülen tam olarak o: denemenin ne zaman **yapıldığı**. Gizliyken
// hiç, görünür olunca yeniden.
//
// Bağlamın gerçekten geri gelmesi burada ölçülemiyor: konteynerde GPU yok ve
// SwiftShader `restoreContext()` çağrısına `webglcontextrestored` olayıyla
// cevap vermiyor (ölçüldü — üç saniye beklendi, olay hiç gelmedi). O yüzden
// bu dosya "geri geldi mi" demiyor, "denenmesi gereken anda denendi mi"
// diyor. Hatanın olduğu yer zaten oydu.
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
}).listen(8253);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = [];
pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
await pg.goto('http://localhost:8253/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.fruitHoleGl === 'function', { timeout: 30000 });

const fails = [];
const check = (ok, ad, not = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ad}${not ? '   ' + not : ''}`);
  if (!ok) fails.push(ad + (not ? ' — ' + not : ''));
};

// --- 1. görünürken kaybedince denenmeli ---
console.log('1) uygulama öndeyken kayıp');
let r = await pg.evaluate(async () => {
  window.fruitHoleGlFake('hidden', false);
  window.fruitHoleLoseGl();
  await new Promise(r => setTimeout(r, 1300));
  return window.fruitHoleGl();
});
console.log(`  kayıp ${r.lost} · deneme ${r.tries} · uyarı ${r.barVisible}`);
check(r.lost, 'bağlam kayıp');
check(r.tries > 0, 'öndeyken geri alma denendi', String(r.tries));
check(r.barVisible, 'uyarı çubuğu göründü');

// --- 2. gizliyken denenmemeli ---
//
// Telefonda olan buydu: dört deneme de uygulama arka plandayken harcandı.
// Yüzey yokken her deneme kesin başarısız, ve her biri bir GPU ayırma
// girişimi.
console.log('\n2) arka plandayken deneme durmalı');
r = await pg.evaluate(async () => {
  window.fruitHoleGlFake('hidden', true);
  document.dispatchEvent(new Event('visibilitychange'));
  await new Promise(r => setTimeout(r, 300));
  const once = window.fruitHoleGl().tries;
  await new Promise(r => setTimeout(r, 3000));
  const sonra = window.fruitHoleGl().tries;
  return { once, sonra };
});
console.log(`  deneme ${r.once} -> ${r.sonra} (3 saniye arka planda)`);
check(r.sonra === r.once, 'arka planda yeni deneme yapılmadı',
      `${r.once} -> ${r.sonra}`);

// --- 3. öne gelince baştan denemeli ---
//
// Eski kodun yapamadığı şey tam olarak buydu: dördü bitince susuyordu ve
// uygulama öne geldiğinde deneyecek kimse kalmıyordu.
console.log('\n3) öne gelince sayaç sıfırlanıp yeniden deniyor');
r = await pg.evaluate(async () => {
  // Önce sayacı tavana dayat: eski kod burada kesin susardı.
  window.fruitHoleGlSetTries(99);
  const tavanda = window.fruitHoleGl().tries;
  window.fruitHoleGlFake('hidden', false);
  document.dispatchEvent(new Event('visibilitychange'));
  await new Promise(r => setTimeout(r, 1300));
  const sonra = window.fruitHoleGl();
  return { tavanda, tries: sonra.tries, bar: sonra.barVisible };
});
console.log(`  deneme ${r.tavanda} -> ${r.tries}`);
check(r.tries > 0 && r.tries < 90, 'sayaç sıfırlandı ve yeniden denendi',
      `${r.tavanda} -> ${r.tries}`);
check(r.bar, 'uyarı çubuğu hâlâ görünür');

// --- 4. vazgeçince ne yazıyor ---
//
// Denemeler tükendiğinde ekranda "bir şey oluyor" demeye devam etmek, hiçbir
// şey olmadığı hâlde beklemek demek. Oyuncunun elinde bir düğme olmalı.
console.log('\n4) denemeler tükenince yazı değişiyor');
r = await pg.evaluate(async () => {
  window.fruitHoleGlSetTries(99);
  window.fruitHoleGlRefresh();
  const t = document.getElementById('glBarText').textContent;
  const btn = document.getElementById('glBarBtn').textContent;
  return { t, btn };
});
console.log(`  "${r.t}"`);
check(/could not/i.test(r.t), 'vazgeçildiği yazıyor', r.t);
check(r.btn === 'Restart', 'düğme Restart oluyor', r.btn);

// --- 5. vazgeçince sayfa kendiliğinden yenileniyor ---
//
// Telefondan gelen ikinci kayıt bunu gerektirdi: uyarı çıktı, denemeler
// öndeyken yapıldı, bağlam yine gelmedi. Bu cihazda `forceContextRestore()`
// çalışmıyor ve beklemek bir şeyi değiştirmiyor — geriye yeniden kurmak
// kalıyor.
//
// `location.reload` yeniden tanımlanamıyor, o yüzden çağrı yakalanmıyor:
// sayfaya bir işaret konuyor ve yenilemeden sonra o işaretin **yok olduğu**
// görülüyor. Yani ölçülen şey niyet değil, gerçekten olan şey.
console.log('\n5) vazgeçince sayfa yeniliyor');
{
  await pg.evaluate(() => {
    window.__isaret = 1;
    window.fruitHoleGlSetTries(0);
    window.fruitHoleGlFake('hidden', false);
    document.dispatchEvent(new Event('visibilitychange'));
  });
  // Dört deneme 1.5 saniye arayla, sonra 1.5 saniye daha.
  await pg.waitForTimeout(10000);
  await pg.waitForFunction(() => typeof window.fruitHoleGl === 'function',
                           { timeout: 30000 }).catch(() => {});
  const d = await pg.evaluate(() => ({
    isaret: typeof window.__isaret,
    lost: window.fruitHoleGl ? window.fruitHoleGl().lost : null,
  }));
  console.log(`  işaret ${d.isaret} · kayıp ${d.lost}`);
  check(d.isaret === 'undefined', 'sayfa gerçekten yenilendi', d.isaret);
  check(d.lost === false, 'yenilemeden sonra bağlam sağlam', String(d.lost));
}

if (errs.length) fails.push('sayfa hatası: ' + errs[0]);
console.log('\n' + (fails.length ? 'hatalar:\n - ' + fails.join('\n - ') : 'hepsi geçti'));
await br.close(); srv.close();
process.exit(fails.length ? 1 : 0);
