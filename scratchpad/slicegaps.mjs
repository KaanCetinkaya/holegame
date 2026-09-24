// Parkur üreteci geçilmesi imkânsız engel dizisi üretiyor mu?
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
const srv = createServer((req,res)=>{
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try { const b=readFileSync('/home/user/holegame/www-slicer'+p);
    res.writeHead(200,{'content-type':p.endsWith('.js')?'text/javascript':'text/html'}); res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8171);
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=swiftshader'] });
const pg = await b.newPage({ viewport:{width:412,height:915}, deviceScaleFactor:1 });
const errs=[]; pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('http://localhost:8171/', { waitUntil:'load' });
await pg.waitForFunction(() => typeof window.sliceProbe === 'function', { timeout: 20000 });

console.log(' blm | engel | en dar geçiş | gereken | pencere | durum');
console.log('-----+-------+--------------+---------+---------+--------');
let bad = 0;
// 30'a kadar. On beşte duruyordu ve o sınır parça havuzu 5. bölümde
// dolduğu için yeterliydi; artık değil — mengene 12'den, salınım 18'den
// açılıyor, yani eski menzil yeni parçaların ikisini de hiç görmüyordu.
for (let lvl = 1; lvl <= 30; lvl++) {
  // her bölümü 12 kez üret, en kötü diziyi bul
  const r = await pg.evaluate(n => {
    const CLIMB = 5, LANE_LOW = 0.8, LANE_HIGH = 4.8;
    let worst = Infinity, worstNeed = 0, bars = 0, runs = 12;
    // Karşılıklı iki demirin bıraktığı **düşey pencere**.
    //
    // Yukarıdaki ölçü yalnızca "bir boşluktan ötekine yetişilir mi" diye
    // soruyor ve aynı yükseklikteki iki demir için cevabı hep evet: aradaki
    // fark sıfır. Ama mengene parçası tam olarak bunu kuruyor — biri
    // tavandan biri yerden, aynı hizada — ve orada sorun yetişmek değil,
    // arada bıçağa yer kalıp kalmadığı. Bu ölçü olmadan geçilemez bir
    // pencere testten sessizce geçerdi.
    let pencere = Infinity;
    for (let k = 0; k < runs; k++) {
      window.sliceStart(n);
      const list = window.sliceBars();
      bars += list.length;
      const speed = Math.min(8 + (n - 1) * 0.45, 15);
      for (let i = 1; i < list.length; i++) {
        // Aynı hizadaki iki demir bir pencerenin iki yarısı: aralarında
        // gidilecek mesafe yok, ikisi de aynı boşluğu paylaşıyor. Ölçüye
        // katılırsa 0/0 olarak girip asıl en dar geçişi gizliyor.
        if (list[i].d === list[i-1].d) continue;
        const have = (list[i].d - list[i-1].d) / speed;
        const need = Math.abs(list[i].gapY - list[i-1].gapY) / CLIMB;
        if (have - need < worst - worstNeed) { worst = have; worstNeed = need; }
      }
      // Yakın ve karşıt iki demir bir pencere kuruyor.
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          if (list[j].d - list[i].d > 3.4 * 1.6) break;
          if (list[i].fromTop === list[j].fromTop) continue;
          const ust = list[i].fromTop ? list[i] : list[j];
          const alt = list[i].fromTop ? list[j] : list[i];
          // Demirin kapladığı yer merkezden ±half; çarpışma 0.2 pay ekliyor.
          const tavan = (ust.y - ust.half) - 0.2;
          const taban = (alt.y + alt.half) + 0.2;
          pencere = Math.min(pencere, tavan - taban);
        }
      }
    }
    return { worst, worstNeed, pencere, bars: Math.round(bars / runs) };
  }, lvl);
  const okYetis = r.worst === Infinity || r.worst >= r.worstNeed;
  // Pencere en az bıçağın yarı yüksekliği kadar açık olmalı; sıfır ya da
  // eksi, kapalı bir duvar demek.
  const okPencere = r.pencere === Infinity || r.pencere >= 0.3;
  const ok = okYetis && okPencere;
  if (!ok) bad++;
  console.log(` ${String(lvl).padStart(3)} | ${String(r.bars).padStart(5)} | ` +
              `${(r.worst === Infinity ? '-' : r.worst.toFixed(2)+' sn').padStart(12)} | ` +
              `${(r.worst === Infinity ? '-' : r.worstNeed.toFixed(2)+' sn').padStart(7)} | ` +
              `${(r.pencere === Infinity ? '-' : r.pencere.toFixed(2)).padStart(7)} | ` +
              `${ok ? 'OK' : (okYetis ? 'PENCERE KAPALI' : 'GEÇİLEMEZ')}`);
}
console.log(bad === 0 ? '\nPASS — her engel dizisi geçilebilir' : `\nFAIL — ${bad} bölümde imkânsız dizi`);
console.log('errors:', errs.length ? errs : 'none');
await b.close(); srv.close();
