// Hangi tahtada kameranın çevresi dolu?
//
// Klip çekerken beş şart var ve ikisi sürekli düşüyor: "çevrede en az 50
// meyve" ve "kadrajda dev". Düşünce klip üst sınırda, yani tahtanın en boş
// anında kaydediliyor — redplanet ve academy kareleri bomboş çıktı.
//
// Eşiği düşürmek yanlış cevap olurdu: kareler gerçekten boş, sayı doğru
// söylüyor. Doğru soru şu — **hangi tahtada 9 birimlik bir dairenin içine
// elli parça sığıyor?** Bu betik onu ölçüyor: her bölümde ızgarayı tarayıp
// 9 birimlik dairelerin en dolusunu buluyor.
//
// Çıktı klip bölümlerini seçmek için: üstteki tahtalar klip verir, alttaki
// tahtalar ne yapılırsa yapılsın boş görünür.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const R = Number(process.argv[2] || 9);
const ESIK = Number(process.argv[3] || 50);

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-fruithole' + p); } catch {}
  if (b) {
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } else { r.writeHead(404); r.end('no'); }
}).listen(8521);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.goto('http://localhost:8521/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.fruitHoleProbe === 'function', { timeout: 90000 });

const satir = [];
for (let lv = 1; lv <= 55; lv++) {
  const o = await pg.evaluate(([l, r]) => {
    window.fruitHoleSeedField(7700 + l);
    window.fruitHoleProbe(l);
    window.fruitHoleStartLevel();
    // Parçanın **kendi** yeri okunuyor, ızgara hücresi değil.
    //
    // İki tur boşa gitti. Önce `h.x` okundu ve hücrede öyle bir alan yok —
    // elli beş tahta "0" çıktı. Sonra hücre merkezi hesaplanıp `kat`
    // sayıldı ve bu sefer şerit tahtaları şişti: Island 66 hücrede 1848
    // parça verdi, çünkü orada parçalar ızgaraya göre dizilmiyor ve
    // yirmi sekizi aynı hücreye düşüyor. İkisi de aynı hatanın hâli —
    // ölçülmek istenen şey parçanın yeriyken hücre okunuyordu.
    const p = window.fruitHoleFruitSpots();
    let en = 0;
    // Daireyi tahtanın üstünde gezdiriyor. Adım 1.5 birim: daha incesi
    // ölçüyü değiştirmiyor, yalnızca yavaşlatıyor.
    if (!p.length) { window.fruitHoleUnseedField(); return { ad: window.fruitHoleLevelName(), toplam: 0, en: 0 }; }
    const xs = p.map(q => q.x), zs = p.map(q => q.z);
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const z0 = Math.min(...zs), z1 = Math.max(...zs);
    for (let cx = x0; cx <= x1; cx += 1.5) {
      for (let cz = z0; cz <= z1; cz += 1.5) {
        let n = 0;
        for (const q of p) {
          const dx = q.x - cx, dz = q.z - cz;
          if (dx * dx + dz * dz <= r * r) n++;
        }
        if (n > en) en = n;
      }
    }
    const ad = window.fruitHoleLevelName();
    window.fruitHoleUnseedField();
    return { ad, toplam: p.length, en };
  }, [lv, R]);
  satir.push({ lv, ...o });
}

satir.sort((a, b) => b.en - a.en);
console.log(`\n${R} birimlik dairenin en dolu hâli — eşik ${ESIK}\n`);
console.log('  blm  düzen           tahta   daire');
console.log('  ----+---------------+-------+-------');
for (const s of satir) {
  console.log(`  ${s.en >= ESIK ? 'OK  ' : '    '} ${String(s.lv).padStart(2)}  ${s.ad.padEnd(13)}  ` +
    `${String(s.toplam).padStart(5)}  ${String(s.en).padStart(5)}`);
}
const gecen = satir.filter(s => s.en >= ESIK);
console.log(`\n  ${gecen.length} / ${satir.length} tahta eşiği geçiyor`);
console.log(`  klibe uygun ilk on: ${gecen.slice(0, 10).map(s => `${s.lv} ${s.ad}`).join(' · ')}`);

await br.close(); srv.close();
