// Bedel nerede yazıyor: bir şey aldığında oyuncu ne görüyor?
//
//   node build-www.mjs && node scratchpad/holecost.mjs
//
// Bu dosya bir oyuncu cümlesinden çıktı. Kaan 45. bölümü oynadı ve şunu
// söyledi: *"bir şeye dokununca süreden gidiyor ama neye anlayamadım."*
//
// Ölçüldüğünde tarif ettiği şey birebir doğruydu. 45 bir **görev** tahtası,
// yani mancınık, silindir, çamur, rakip ve rüzgâr orada yok; saatten götüren
// tek şey 488 parçanın arasına serpilmiş altı bomba. Geri bildirim de eksik
// değildi — patlama, bomba sesi, saatin yanıp sönmesi. Üçü birlikte "bir şey
// oldu" diyor, "beş saniye gitti ve sebebi buydu" demiyor.
//
// Eksik olan şey **yer**. Bedel, bedeli ödeten şeyin durduğu noktada
// yazmıyordu; saat ise ekranın üst ortasında, delik ortadayken gözün
// bakmadığı yer. Devin ödediği sayı zaten yutulduğu yerde çıkıyordu, aynı
// fonksiyon üç yere daha bağlandı.
//
// Buranın ölçtüğü şey sayı değil **görünürlük**, ve o yüzden DOM'a bakıyor:
// etiket bir `.payup` düğümü, ve bir düğüm ya vardır ya yoktur. Bedelin
// kendisi (5 saniye, 3 saniye, bir boy) başka dosyalarda ölçülüyor.

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
}).listen(8281);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('http://localhost:8281/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.fruitHoleProbe === 'function', { timeout: 25000 });

const fails = [];
const check = (ok, ne, ek = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ne}${ek ? '   ' + ek : ''}`);
  if (!ok) fails.push(`${ne} ${ek}`);
};

// Beliren her etiketi kaydet. Etiket kendini bir saniyede siliyor, yani
// sonradan bakmak çalışmıyor: doğduğu anda yakalanması gerekiyor.
await pg.evaluate(() => {
  window.__etiket = [];
  new MutationObserver(kayitlar => {
    for (const k of kayitlar) {
      for (const n of k.addedNodes) {
        if (n.nodeType === 1 && n.classList && n.classList.contains('payup')) {
          window.__etiket.push({
            metin: n.textContent,
            renk: n.style.color,
            x: parseFloat(n.style.left),
            y: parseFloat(n.style.top),
          });
        }
      }
    }
  }).observe(document.body, { childList: true });
});

console.log('\n1. etiket mekanizması çalışıyor');
{
  // MutationObserver'ın geri çağrısı **mikrogörev**: aynı senkron blokta
  // okunursa liste hep boş çıkıyor ve test "etiket doğmadı" der. Bir tur
  // beklenmesi testin kendi şartı, oyunun değil.
  const o = await pg.evaluate(async () => {
    const once = window.__etiket.length;
    // Kameranın önünde, tahtanın ortasında bir nokta.
    window.fruitHoleShowCost(0, 0.4, 0, 5);
    await new Promise(r => setTimeout(r, 50));
    return { once, sonra: window.__etiket.length, son: window.__etiket.at(-1) };
  });
  check(o.sonra === o.once + 1, 'bedel çağrısı bir etiket doğuruyor',
    `${o.once} -> ${o.sonra}`);
  check(o.son && o.son.metin === '−5s', 'yazı bedeli söylüyor', o.son && o.son.metin);
  // Ekranın içinde: kadrajın kenarındaki bir nokta yansıtıldığında dışarı
  // düşüyor ve görünmeyen bir etiket, olmayan etiketle aynı şey.
  check(o.son && o.son.x >= 0 && o.son.x <= 412 && o.son.y >= 0 && o.son.y <= 915,
    'etiket ekranın içinde', o.son && `${o.son.x},${o.son.y}`);
}

console.log('\n2. bomba yutulunca bedeli yazıyor');
{
  // Bombası olan sıradan bir tahta bulunup oynanıyor. Bombanın **yutulması**
  // ölçülüyor, sahnelenmiyor: `eatFruit` çağrılsaydı test kendi kurduğu şeyi
  // doğrulardı, oysa sorulan soru "oynarken çıkıyor mu".
  const lv = await pg.evaluate(() => {
    for (let l = 7; l <= 60; l++) {
      const p = window.fruitHoleProbe(l);
      if (p.kind === 'ızgara' && window.fruitHoleBombs().sayi > 0) return l;
    }
    return null;
  });
  if (lv == null) {
    check(false, 'bombalı bir ızgara tahtası var');
  } else {
    const o = await pg.evaluate(async l => {
      window.fruitHoleProbe(l);
      window.fruitHoleStartLevel();
      window.__etiket.length = 0;
      // Deliği bombanın üstüne koyup oyunun kendi yeme kontrolünü çalıştıran
      // hazır kanca. `eatFruit` doğrudan çağrılsaydı test kendi kurduğu şeyi
      // doğrulardı; sorulan soru "oynarken çıkıyor mu".
      const o = window.fruitHoleEatBomb();
      await new Promise(r => setTimeout(r, 50));
      return { yenildi: !!(o && o.yutuldu), etiket: window.__etiket.slice() };
    }, lv);
    check(o.yenildi, `${lv}. bölümde bir bomba yutuldu`);
    const b = o.etiket.find(e => e.metin === '−5s');
    check(!!b, 'bomba yutulunca "−5s" beliriyor',
      o.etiket.map(e => e.metin).join(' ') || 'hiç etiket yok');
  }
}

console.log('\nsayfa hataları: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
