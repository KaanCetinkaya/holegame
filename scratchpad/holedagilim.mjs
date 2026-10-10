// Tahta dengeli mi dağılmış, yoksa her şey bir köşeye mi yığılıyor?
//
// Kaan 22. bölümden ekran görüntüsü attı ve tahtanın sol alt köşesini
// daire içine aldı: orada parçalar birbirinin içine girmiş bir yığın,
// ekranın geri kalanı boş çimen. "Hep hepsini bir kenara yığıyorsun."
//
// Ölçü: tahta 3 sütun x 5 satırlık bloklara bölünüyor, her blokta kaç parça
// olduğu sayılıyor. Dengeli bir tahtada her blok toplamın ~%6.7'si olur
// (15 blok). Bir blok bunun üç katını taşıyorsa orada bir yığın var.
//
// İki sayı yazılıyor:
//   enYogun  — en dolu bloğun payı, dengeli payın kaç katı
//   bos      — hiç parça olmayan blok sayısı
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
}).listen(8507);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.goto('http://localhost:8507/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.fruitHoleProbe === 'function', { timeout: 90000 });

const KOL = 3, SAT = 5;
// Katları saymak mı, hücreleri mi?
//
// İkisi ayrı soru. Hücre saymak "şekil tahtanın neresinde" diyor — ve bir
// desen siluet olduğu için boş bölge orada kusur değil, şeklin kendisi.
// Kat saymak "kütle nerede" diyor, ve Kaan'ın gördüğü şey bu: yedi katlı
// bir sütun, tek katlı bir hücrenin yedi katı yer kaplıyor.
const KAT_SAY = process.argv[2] !== 'hucre';
const fails = [];
console.log('\n  blm  düzen         parça  enYoğun  boş blok  harita (parça sayısı)');
console.log('  ----+-------------+------+--------+---------+----------------------');

const LV = [];
for (let i = 1; i <= 55; i++) LV.push(i);
let enKotu = null;
for (const lv of LV) {
  const o = await pg.evaluate(([l, kol, sat, SAY_KAT]) => {
    window.fruitHoleSeedField(5300 + l);
    const p = window.fruitHoleProbe(l);
    window.fruitHoleStartLevel();
    const b = window.fruitHoleBoardCells();
    const say = new Array(kol * sat).fill(0);
    for (const h of b.hucre) {
      if (h.bomb) continue;
      const i = Math.min(kol - 1, Math.floor(h.c / (b.cols / kol)));
      const j = Math.min(sat - 1, Math.floor(h.r / (b.rows / sat)));
      // Yığının katları da sayılıyor: bir hücrede yedi parça varsa orası
      // yedi parçalık bir yer kaplıyor, bir değil.
      say[j * kol + i] += SAY_KAT ? h.kat : 1;
    }
    const ad = window.fruitHoleLevelName();
    window.fruitHoleUnseedField();
    return { ad, kind: p.kind, say };
  }, [lv, KOL, SAT, KAT_SAY]);
  const toplam = o.say.reduce((a, b) => a + b, 0);
  if (!toplam) continue;
  const esit = toplam / (KOL * SAT);
  const enYogun = Math.max(...o.say) / esit;
  const bos = o.say.filter(v => v === 0).length;
  const harita = [];
  for (let j = 0; j < SAT; j++) harita.push(o.say.slice(j * KOL, j * KOL + KOL).join('/'));
  const kotu = enYogun > 2.5 || bos >= 3;
  if (kotu) fails.push(`${lv}. bölüm (${o.ad}): en yoğun blok dengelinin ${enYogun.toFixed(1)} katı, ${bos} boş blok`);
  if (!enKotu || enYogun > enKotu.enYogun) enKotu = { lv, ad: o.ad, enYogun, harita };
  console.log(`  ${kotu ? 'FAIL' : 'OK  '} ${String(lv).padStart(2)}  ${o.ad.padEnd(12)} ${String(toplam).padStart(5)}  ` +
    `${enYogun.toFixed(1).padStart(6)}x  ${String(bos).padStart(7)}  ${harita.join(' | ')}`);
}

console.log('\n' + (fails.length
  ? `${fails.length} tahta dengesiz:\n - ` + fails.slice(0, 12).join('\n - ')
  : 'hepsi dengeli'));
process.exitCode = fails.length ? 1 : 0;

await br.close(); srv.close();
