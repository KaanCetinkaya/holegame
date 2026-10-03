// Rüzgâr: sürüklüyor mu, ve karşı koyulabiliyor mu?
//
//   node build-www.mjs && node scratchpad/holewind.mjs
//
// Sekiz engelin en tuhafı: hiçbir şey almıyor, hiçbir yeri kapatmıyor,
// tahtayı eksiltmiyor. Yalnızca oyuncunun sürdüğü yönle deliğin gittiği
// yönü ayırıyor. O yüzden buradaki hataların hepsi **kontrol** hatası gibi
// okunuyor, ki en pahalı yanlış anlama odur: "bu oyunun kontrolleri bozuk".
//
//   1. **Karşı koyulamayan rüzgâr.** Hızı deliğinkine yaklaşırsa şeridin
//      bir yarısı ulaşılmaz oluyor. Engel değil duvar, ve görünmeyen bir
//      duvar.
//   2. **Doğuşta rüzgâr.** Oyuncu tahtaya iniyor ve delik kendi kendine
//      kayıyor. Sebep ekranda var ama oyuncu daha nereye bakacağını
//      bilmiyor.
//   3. **Çalışmayan şerit.** Çizgiler akıyor ama sürükleme yok, ya da
//      tersi: şeridin dışında da sürüklüyor. İkisi de gözle görülmez.

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-fruithole' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8278);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('http://localhost:8278/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleWind, { timeout: 25000 });

const fails = [];
const check = (ok, ne, ek = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ne}${ek ? '   ' + ek : ''}`);
  if (!ok) fails.push(`${ne} ${ek}`);
};

const K = await pg.evaluate(() => {
  const w = window.fruitHoleWind();
  return { ilk: w.ilkBolum, hiz: w.hiz, delik: w.delik,
           agiz: window.fruitHoleRocks().agizTavani };
});
console.log(`\nrüzgâr ${K.ilk}. bölümde başlıyor · hız ${K.hiz} (delik ${K.delik})`);

const SON = 60;
const satir = [];
console.log('\nblm  düzen       tahta    görev   | rüzgâr  yön  doğuşa');
console.log('----+-----------+--------+--------+--------+-----+-------');
for (let n = 1; n <= SON; n++) {
  const r = await pg.evaluate(l => {
    window.fruitHoleSeedField(7600 + l);
    const p = window.fruitHoleProbe(l);
    const w = window.fruitHoleWind();
    window.fruitHoleUnseedField();
    return { ...p, w };
  }, n);
  satir.push({ n, ...r });
  if (r.w.var) {
    console.log(
      `${String(n).padStart(4)} ${String(r.pattern).padEnd(11)} ${r.kind.padEnd(8)} ` +
      `${String(r.mission || '-').padEnd(8)}| ${'var'.padStart(7)} ` +
      `${String(r.w.yon > 0 ? '→' : '←').padStart(4)} ${String(r.w.dogusa).padStart(7)}`);
  }
}

const ruzgarli = satir.filter(r => r.w.var);
console.log(`\n${SON} bölümün ${ruzgarli.length}'inde rüzgâr var`);

console.log('\n1. nerede çıkıyor');
{
  const erken = satir.filter(r => r.n < K.ilk && r.w.var);
  check(!erken.length, `${K.ilk}. bölümden önce rüzgâr yok`, erken.map(r => r.n).join(' '));

  const yanlisTahta = satir.filter(r => r.kind !== 'ızgara' && r.w.var);
  check(!yanlisTahta.length, 'resim, şerit ve bulmaca tahtalarında rüzgâr yok',
    yanlisTahta.map(r => `${r.n}:${r.kind}`).join(' '));

  // Rüzgâr artık görev bölümlerinde de var — `rush` ve `mines` dışında.
  // Gerekçesi `holemud.mjs`'te; rüzgâr da hiçbir şey almıyor.
  //
  // `mines` rüzgâra özel bir dışlama. Orada tahta bomba dolu ve her bomba
  // beş saniye; rüzgârın işi de deliği oyuncunun sürdüğü yönden
  // **saptırmak**. İkisi bir aradayken oyuncu bir bombadan kaçıyor ve
  // rüzgâr onu içine sokuyor — kaçındığı şeye, kaçındığı için çarpmak.
  // Hak edilmemiş ceza, oyunun bozuk okunduğu yerdir.
  const yasak = satir.filter(r => (r.mission === 'rush' || r.mission === 'mines') && r.w.var);
  check(!yasak.length, 'hız ve mayın görevlerinde rüzgâr yok',
    yasak.map(r => `${r.n}:${r.mission}`).join(' '));

  const gorevde = satir.filter(r =>
    r.mission && r.mission !== 'rush' && r.mission !== 'mines' && r.w.var);
  check(gorevde.length > 0, 'öbür görev bölümlerinde rüzgâr var',
    gorevde.map(r => `${r.n}:${r.mission}`).join(' ') || 'hiçbirinde yok');

  const tanitim = satir.find(r => r.n === K.ilk);
  check(tanitim && tanitim.kind === 'ızgara' && !tanitim.mission && tanitim.w.var,
    'tanıtım bölümü sıradan bir ızgara tahtası ve rüzgârı var',
    `${K.ilk}: ${tanitim.kind}${tanitim.w.var ? ', rüzgâr var' : ', rüzgâr yok'}`);

  check(ruzgarli.length >= 8, 'rüzgâr gerçekten çıkıyor (ölü kod değil)',
    `${ruzgarli.length} tahta`);

  // İki yön de çıkmalı: hep aynı yöne esen bir rüzgâr, rüzgâr değil eğim.
  const yonler = new Set(ruzgarli.map(r => r.w.yon));
  check(yonler.size === 2, 'rüzgâr iki yöne de esiyor',
    [...yonler].join(' '));
}

console.log('\n2. karşı koyulabiliyor mu');
{
  // En önemli ölçü. Rüzgâr deliğin hızına yaklaşırsa şeridin bir yarısı
  // ulaşılmaz oluyor — ve görünmez bir duvar, duvarların en kötüsü.
  // Pay isteniyor: tam sınırda karşı koymak "gidilebiliyor" değil "yerinde
  // sayılıyor" demek.
  check(K.hiz < K.delik * 0.6, 'rüzgâra karşı rahatça gidilebiliyor',
    `${K.hiz} < ${(K.delik * 0.6).toFixed(2)}`);

  const dogusta = ruzgarli.filter(r => r.w.dogusa < K.agiz);
  check(!dogusta.length, 'rüzgâr şeridi deliğin doğduğu yerde değil',
    dogusta.map(r => `${r.n}:${r.w.dogusa}`).join(' '));
}

console.log('\n3. şerit gerçekten şerit mi');
{
  const lv = ruzgarli.length ? ruzgarli[0].n : null;
  if (lv == null) {
    check(false, 'ölçülebilecek bir rüzgârlı tahta var');
  } else {
    const o = await pg.evaluate(l => {
      window.fruitHoleSeedField(7600 + l);
      window.fruitHoleProbe(l);
      return window.fruitHoleWind();
    }, lv);
    // Bir saniyelik rüzgâr, şeridin içinde tam `hiz` kadar sürüklemeli.
    check(Math.abs(Math.abs(o.surukleme.ic) - K.hiz) < 1e-6,
      'şeridin içinde delik bir saniyede tam rüzgâr kadar kayıyor',
      `${o.surukleme.ic}`);
    check(o.surukleme.dis === 0, 'şeridin dışında hiç kaymıyor',
      `${o.surukleme.dis}`);
    check(Math.sign(o.surukleme.ic) === o.yon, 'kayma rüzgârın yönünde',
      `${o.surukleme.ic} / ${o.yon}`);
  }
}

console.log('\nsayfa hataları: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
