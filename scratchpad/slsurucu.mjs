// Bir bölüm gerçekten bitirilebiliyor mu, ve geçilen engel arkadan
// öldürüyor mu?
//
// İki ayrı soru, tek koşuda ölçülüyor, çünkü ikisinin de kanıtı aynı:
// parkuru baştan sona oynamak.
//
// 1) ARKADAN ÖLÜM. Çarpışma, kareyi başlatan noktanın **bir birim
//    gerisindeki** her şeye bakıyordu ve geride kalanı o karenin
//    başındaki yükseklikle yargılıyordu. Onbeş birim hızda bir birim
//    altmış yedi milisaniye: geçtiğin demir, sen bir sonraki boşluğa
//    inmeye başlarken arkandan canını alıyordu. Ekranda görünen şey
//    temiz geçilmiş bir engelin öldürmesi, ve oyuncunun bundan
//    öğreneceği hiçbir şey yok.
//
//    Ölçü eşiksiz: ölümü getiren nesne bıçağın önünde olmalı. Arkada
//    kalan bir tehlikenin öldürdüğü tek bir koşu bile hata.
//
// 2) BİTİRİLEBİLİRLİK. `slicegaps` parkurun geometrisine bakıyor —
//    iki demir arası yetişilir mi, pencere bıçağa yer bırakıyor mu.
//    Geometrinin tamamı doğruyken parkurun yine de bitirilememesi
//    mümkün, çünkü bu oyunda engeller tek tek değil arka arkaya
//    çözülüyor. Burada ölçülen şey parça değil, bölümün kendisi:
//    otomatik sürücü baştan sona gidebiliyor mu.
//
//    Sürücü oyuncu değil, ama oyuncunun bildiğinden fazlasını da
//    bilmiyor: ekranda altı engel ileri görünüyor, sürücünün penceresi
//    de o kadar. Sürücünün hiç bitiremediği bir bölümü oyuncu da
//    bitiremez.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-slicer' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8736);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const hata = [];
pg.on('pageerror', e => hata.push(String(e).split('\n')[0]));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8736/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.sliceProbe === 'function', { timeout: 60000 });
await pg.evaluate(() => document.getElementById('dOk')?.click());

// Hız 17'de, parça havuzu 28'de, karışım 32'de tavana vuruyor: 33'ten
// sonrası birbirinin aynı. Her bölümü taramak yerine değişen aralığın
// tamamı ve sonrasından birkaç örnek alınıyor.
const BOLUMLER = [...Array(33).keys()].map(i => i + 1).concat([36, 40, 45, 50, 55, 60]);
const KOSU = 6;

const r = await pg.evaluate(({ BOLUMLER, KOSU }) => {
  const sonuc = [];
  const haksiz = [];
  for (const n of BOLUMLER) {
    let gecti = 0;
    const olum = [];
    for (let k = 0; k < KOSU; k++) {
      window.sliceStart(n);
      const p = window.sliceRun(8000);
      if (p.state === 'clear') { gecti++; continue; }
      olum.push(+(p.dist / p.courseEnd).toFixed(2));
      const v = p.vurulan;
      // Bıçak `dist`te; öldüren şey `v.d`'de. Geride kalmış bir
      // tehlikenin öldürmesi haksız ölüm.
      if (v && v.d < p.dist - 0.05)
        haksiz.push({ n, k, kind: v.kind, engel: v.d, dist: p.dist, geri: +(p.dist - v.d).toFixed(2) });
    }
    sonuc.push({ n, gecti, olum });
  }
  return { sonuc, haksiz };
}, { BOLUMLER, KOSU });

console.log('\n1) Geçilen engel arkadan öldürüyor mu');
console.log(`     ${BOLUMLER.length} bölüm × ${KOSU} koşu, ${BOLUMLER.length * KOSU} tur`);
for (const h of r.haksiz.slice(0, 8))
  console.log(`     ${h.n}. bölüm: ${h.kind} ${h.engel}'de, bıçak ${h.dist}'de — ${h.geri} birim geride`);
ok(r.haksiz.length === 0, 'hiçbir tur geride kalan bir engelle bitmedi',
   r.haksiz.length ? `${r.haksiz.length} haksız ölüm` : '');

console.log('\n2) Bölümler bitirilebiliyor mu');
const bos = r.sonuc.filter(s => s.gecti === 0);
const toplam = r.sonuc.reduce((a, s) => a + s.gecti, 0);
const oran = toplam / (r.sonuc.length * KOSU);
for (const s of r.sonuc) {
  const im = s.gecti === KOSU ? '' : `  (ölüm: ${s.olum.join(' ')})`;
  if (s.gecti < KOSU) console.log(`     ${String(s.n).padStart(2)}. bölüm  ${s.gecti}/${KOSU}${im}`);
}
console.log(`     toplam ${toplam}/${r.sonuc.length * KOSU} = %${(oran * 100).toFixed(0)}`);
ok(bos.length === 0, 'her bölüm en az bir kez bitirildi',
   bos.length ? bos.map(s => s.n).join(', ') + '. bölüm hiç bitmedi' : '');
// Eşik ölçüldü, seçilmedi: aynı yapım üç kez tarandığında toplam oran
// %92, %91 ve %88 çıktı — gürültü dört puan. Sınır onun epey altında,
// ama oyunun bitirilemez hâlini rahatça yakalıyor: aynı tarama,
// arkadan ölüm geri konunca %55 — ve üç bölüm altı koşunun hiçbirinde
// bitmiyor.
ok(oran >= 0.70, 'turların çoğu bitiyor', `%${(oran * 100).toFixed(0)}`);

ok(!hata.length, 'sayfa hatası yok', hata[0] || '');
console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
