// Bağlam kayıpken bölüm başlarsa ne oluyor?
//
//   node build-www.mjs && node scratchpad/holeglbas.mjs
//
// Bu dosya Kaan'ın telefonundan gelen bir ekran görüntüsünden doğdu:
// bomboş bir tahta, üstünde "Graphics restarting…", ve **işleyen bir saat.**
// Bölüm 51, kartlar 0/14 0/18 0/53 — yani hiçbir şey yenmemiş, bölüm yeni
// başlamış.
//
// Koruma kodda vardı ve çalışmıyordu. `webglcontextlost` şunu diyor:
//
//     if (state === 'playing') pauseGame();
//
// Yani "oynarken kaybedilirse saati durdur". Ama ekran görüntüsündeki durum
// bu değildi: bağlam, `state` daha `'playing'` olmadan — bölüm kurulurken —
// kaybolmuştu. O şart tutmayınca `pauseGame()` hiç çağrılmıyor, ve
// `startLevel` birkaç satır sonra `state = 'playing'` deyip saati
// başlatıyor. Ölü bir bağlamın üstünde.
//
// Oyuncunun gördüğü: oynanamayan bir tahta, ve kaybedilen bir bölüm.
//
// Bu, bu depodaki tanıdık sınıfın bir başka hâli — kural doğru yazılmış ama
// yalnızca bir yönü kapatıyor. `glLost` oyun akışında yalnızca iki yerde
// soruluyor: `resumeGame` (bağlam yokken Resume'a basılamıyor) ve çizim
// satırı. `state = 'playing'` yapılan yerlerin hiçbirinde sorulmuyor.
//
// Ölçülen şey: bağlam kayıpken bölüm başlatılırsa **saat işlemiyor.**

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
}).listen(8351);

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
    for (const cb of queue.splice(0, queue.length)) { try { cb(t); } catch (e) { window.__yutulan++; } }
  };
};

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const errs = [];
const fails = [];
const check = (ok, ne, ek = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ne}${ek ? '   ' + ek : ''}`);
  if (!ok) fails.push(`${ne} ${ek}`);
};

// Ekran görüntüsündeki bölüm: 51, yani ikinci tur. Ama sorunun bölümle
// ilgisi yok — `glLog` kaydı kaybın 5. ve 7. bölümlerde de olduğunu
// söylüyor. İki bölüm deneniyor: biri ilk tur, biri Kaan'ınki.
for (const lv of [7, 51]) {
  console.log(`\nbölüm ${lv}`);
  // Her bölüm için **yeni sayfa**. Bağlam bir kez düşürülünce geri
  // gelmiyor, yani ikinci ölçüm aynı sayfada yapılamaz — ilk denemede
  // eklenti ikinci bölümde `false` döndü ve ölçü ölçmediğini söyledi.
  const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
  await pg.addInitScript(FAKE_CLOCK);
  pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto('http://localhost:8351/', { waitUntil: 'load' });
  await pg.waitForFunction(() => typeof window.fruitHoleLoseGl === 'function', { timeout: 25000 });

  const dustu = await pg.evaluate((l) => {
    window.fruitHoleSeedField(9900 + l);
    window.fruitHoleProbe(l);
    // Bağlamı bölüm başlamadan düşür: ekran görüntüsündeki sıra bu.
    return window.fruitHoleLoseGl();
  }, lv);
  // Kayıp olayı tarayıcının kendi olay döngüsünden geliyor, sahte saatten
  // değil — Node'a dönüp **gerçek zamanda** beklemek gerekiyor. İlk
  // yazılışta kare adımlanarak beklendi ve olay hiç gelmedi: ölçü
  // "bağlam kayıp değil" diyordu, çünkü henüz düşmemişti.
  let kayip = false;
  try {
    await pg.waitForFunction(() => window.fruitHoleGl().lost, { timeout: 10000 });
    kayip = true;
  } catch (e) {}

  const o = await pg.evaluate(() => {
    window.fruitHoleStartLevel();
    const bas = window.fruitHoleWhere();
    for (let i = 0; i < 90; i++) window.__step(1000 / 30);   // üç saniye
    const son = window.fruitHoleWhere();
    const gl = window.fruitHoleGl();
    window.fruitHoleUnseedField();
    return { basSaat: bas.timeLeft, sonSaat: son.timeLeft,
             basDurum: bas.state, sonDurum: son.state,
             bar: gl.barVisible, yutulan: window.__yutulan };
  });
  o.dustu = dustu; o.kayip = kayip;

  if (!o.dustu) { check(false, `${lv}: WEBGL_lose_context eklentisi var`); await pg.close(); continue; }
  check(o.kayip, `${lv}: bağlam gerçekten kayıp`, String(o.kayip));
  console.log(`     saat ${o.basSaat} -> ${o.sonSaat} · durum ${o.basDurum} -> ${o.sonDurum} · çubuk ${o.bar}`);
  // Asıl ölçü. Üç saniye adımlandı; saat düştüyse oyuncu görmediği bir
  // tahtada süre kaybediyor demektir.
  check(o.basSaat - o.sonSaat <= 0.05,
    `${lv}: bağlam kayıpken saat işlemiyor`,
    `${o.basSaat} -> ${o.sonSaat} (${(o.basSaat - o.sonSaat).toFixed(1)} sn gitti)`);
  check(o.sonDurum !== 'playing',
    `${lv}: bağlam kayıpken oyun 'playing' durumuna geçmiyor`, o.sonDurum);
  // Oyuncu ne olduğunu görebilmeli: uyarı çubuğu açık olmalı.
  check(o.bar, `${lv}: uyarı çubuğu görünüyor`, String(o.bar));
  check(!o.yutulan, `${lv}: kare içinde hata atılmıyor`, `${o.yutulan} yutulan`);
  await pg.close();
}

// ---------------------------------------------------------------------
// Geri getiremeyen cihazda ne kadar bekleniyor?
//
// `forceContextRestore()` bir istek, emir değil. Depodaki iki telefon
// kaydı da aynı şeyi söylüyor: bazı cihazlarda hiç çalışmıyor, ve ne kadar
// beklense değişmiyor. O cihazda dört deneme × 1.5 saniye artı vazgeçme
// payı — yedi buçuk saniye — bomboş bir tahtaya bakarak geçiyor.
//
// Defter bunu zaten biliyor: `geri` alanı olmayan bir 'gl' satırı, bağlamın
// bir kez kaybolup hiç geri gelmediği demek. Ölçülen şey, o satır varken
// deneme sayısının bire inmesi.
console.log('\ngeçmişte geri getiremeyen cihaz');
{
  const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
  await pg.addInitScript(FAKE_CLOCK);
  // Defteri sayfa açılmadan kur: `glLog` yüklenirken okunuyor.
  await pg.addInitScript(() => {
    localStorage.setItem('fruithole_gllog', JSON.stringify([
      { tip: 'gl', t: '10-01 12:00', lv: 37, parca: 0, geo: 31, tex: 15,
        cagri: 24, ms: 900, hal: 'menu', rek: 0 },   // `geri` yok: gelmedi
    ]));
  });
  pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto('http://localhost:8351/', { waitUntil: 'load' });
  await pg.waitForFunction(() => typeof window.fruitHoleGl === 'function', { timeout: 25000 });
  const once = await pg.evaluate(() => window.fruitHoleGl());
  console.log(`  defterde geri gelmeyen kayıt: ${once.gecmisteGelmedi} · deneme sınırı ${once.max}`);
  check(once.gecmisteGelmedi === 1, 'defterdeki başarısız kayıt okunuyor', String(once.gecmisteGelmedi));
  check(once.max === 1, 'geri getiremeyen cihazda tek deneme yapılıyor',
    `${once.max} (dört yerine)`);
  await pg.close();
}
// Temiz defterli cihazda dört deneme sürüyor: hızlandırma yalnızca
// geçmişinde başarısızlık olan cihaz için, herkes için değil.
{
  const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
  await pg.addInitScript(FAKE_CLOCK);
  pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto('http://localhost:8351/', { waitUntil: 'load' });
  await pg.waitForFunction(() => typeof window.fruitHoleGl === 'function', { timeout: 25000 });
  const o = await pg.evaluate(() => window.fruitHoleGl());
  check(o.max === 4, 'temiz defterli cihazda dört deneme yapılıyor', String(o.max));
  await pg.close();
}

console.log('\nsayfa hataları: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
