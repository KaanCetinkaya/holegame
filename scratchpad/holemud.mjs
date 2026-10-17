// Çamur: ne kadar yer kaplıyor, ve yavaşlatma gerçekten çalışıyor mu?
//
//   node build-www.mjs && node scratchpad/holemud.mjs
//
// Engellerin en sessizi. Bomba patlıyor, kaya durduruyor, diken kırılıyor,
// mancınık ateş ediyor, silindir yuvarlanıyor — hepsi bir **an**, ve hepsi
// ekranda bir şey yapıyor. Çamur hiçbir şey yapmıyor: içindeyken her şey
// uzuyor, o kadar. Sessiz olması da tam olarak nasıl bozulabileceğini
// söylüyor:
//
//   1. **Görünmeyen vergi.** Tahtanın payı büyüdükçe bütün bölümler sessizce
//      zorlaşıyor, çünkü bölümün saati tahtanın süpürülmesinden çıkıyor ve o
//      hesap çamuru bilmiyor. Hiçbir test düşmüyor, bütün bölümler biraz
//      daha zor oluyor.
//   2. **Doğuşta çamur.** Oyuncu tahtaya iniyor ve ilk hamlesi ağır. Sebebi
//      ekranda var ama oyuncu daha nereye baktığını bilmiyor.
//   3. **Çalışmayan kural.** Leke çiziliyor ama hız hiç değişmiyor — ya da
//      tersi. İkisi de gözle görülmez, çünkü yarım hız gözle yarım hız gibi
//      durmuyor; yalnızca "bugün kötü oynadım" gibi duruyor.

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
}).listen(8276);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('http://localhost:8276/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleMud, { timeout: 25000 });

const fails = [];
const check = (ok, ne, ek = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ne}${ek ? '   ' + ek : ''}`);
  if (!ok) fails.push(`${ne} ${ek}`);
};

const K = await pg.evaluate(() => {
  const m = window.fruitHoleMud();
  return { ilk: m.ilkBolum, yavas: m.yavaslik, tavan: m.payTavani,
           agiz: window.fruitHoleRocks().agizTavani };
});
console.log(`\nçamur ${K.ilk}. bölümde başlıyor · hız çarpanı ${K.yavas} · ` +
            `pay tavanı %${K.tavan * 100}`);

const SON = 60;
const satir = [];
console.log('\nblm  düzen       tahta    görev   | leke   pay    doğuşa');
console.log('----+-----------+--------+--------+------+------+-------');
for (let n = 1; n <= SON; n++) {
  const r = await pg.evaluate(l => {
    window.fruitHoleSeedField(7400 + l);
    const p = window.fruitHoleProbe(l);
    const m = window.fruitHoleMud();
    window.fruitHoleUnseedField();
    return { ...p, m };
  }, n);
  satir.push({ n, ...r });
  if (r.m.sayi) {
    console.log(
      `${String(n).padStart(4)} ${String(r.pattern).padEnd(11)} ${r.kind.padEnd(8)} ` +
      `${String(r.mission || '-').padEnd(8)}| ${String(r.m.sayi).padStart(4)} ` +
      `${('%' + (r.m.pay * 100).toFixed(1)).padStart(6)} ${String(r.m.dogusaEnYakin).padStart(7)}`);
  }
}

const camurlu = satir.filter(r => r.m.sayi > 0);
console.log(`\n${SON} bölümün ${camurlu.length}'inde çamur var`);

console.log('\n1. nerede çıkıyor');
{
  const erken = satir.filter(r => r.n < K.ilk && r.m.sayi);
  check(!erken.length, `${K.ilk}. bölümden önce çamur yok`, erken.map(r => r.n).join(' '));

  const yanlisTahta = satir.filter(r => r.kind !== 'ızgara' && r.m.sayi);
  check(!yanlisTahta.length, 'resim, şerit ve bulmaca tahtalarında çamur yok',
    yanlisTahta.map(r => `${r.n}:${r.kind}`).join(' '));

  // Çamur artık görev bölümlerinde de var — `rush` dışında.
  //
  // Bu iddia tersine döndü ve sebebi ölçüm: sekiz engelin hepsi görevlerin
  // dışındayken 20. bölümden sonraki 29 bölümün yalnızca 16'sında (%55)
  // yeni engellerden biri çıkıyordu. Kaan 45'i oynayıp "engelleri
  // anlayamadım" dedi ve haklıydı — 45 bir görev tahtası, orada hiçbiri
  // yoktu.
  //
  // Çamurun dışlanma sebebi zaten yoktu: tek bir meyveyi eksiltmiyor, tek
  // bir yolu kapatmıyor, yani bir bölümü bitirilemez yapamıyor.
  //
  // `rush` ayrı: o bölümün saati 12 saniyede başlıyor ve yalnızca yenen
  // meyveyle büyüyor, yani yavaşlık doğrudan saatten yiyor. Öbür
  // görevlerde saat sabit ve çamur yalnızca yolu uzatıyor.
  const rushta = satir.filter(r => r.mission === 'rush' && r.m.sayi);
  check(!rushta.length, 'hız görevinde çamur yok',
    rushta.map(r => `${r.n}`).join(' '));

  const gorevde = satir.filter(r => r.mission && r.mission !== 'rush' && r.m.sayi);
  check(gorevde.length > 0, 'öbür görev bölümlerinde çamur var',
    gorevde.map(r => `${r.n}:${r.mission}`).join(' ') || 'hiçbirinde yok');

  // Tanıtım bölümü sıradan bir ızgara tahtası olmalı — silindirde öğrenilen
  // şey, artık her yeni engel için soruluyor.
  const tanitim = satir.find(r => r.n === K.ilk);
  check(tanitim && tanitim.kind === 'ızgara' && !tanitim.mission && tanitim.m.sayi > 0,
    'tanıtım bölümü sıradan bir ızgara tahtası ve çamuru var',
    `${K.ilk}: ${tanitim.kind}, ${tanitim.m.sayi} leke`);

  check(camurlu.length >= 10, 'çamur gerçekten çıkıyor (ölü kod değil)',
    `${camurlu.length} tahta`);
}

console.log('\n2. görünmeyen vergi');
{
  // Pay: tahtanın kaçta kaçı çamur. Saat bunu bilmiyor, o yüzden sınır
  // burada duruyor ve sayıyla değil **alanla** ölçülüyor — üç büyük leke,
  // beş küçüğünden çok yer kaplıyor.
  const enCok = Math.max(...camurlu.map(r => r.m.pay));
  console.log(`  en çamurlu tahta: %${(enCok * 100).toFixed(1)}`);
  check(enCok <= K.tavan + 1e-6, 'hiçbir tahtanın çamur payı tavanı aşmıyor',
    `%${(enCok * 100).toFixed(1)} / %${K.tavan * 100}`);

  // Doğuş: oyuncunun indiği yerde çamur olmamalı.
  const dogusta = camurlu.filter(r => r.m.dogusaEnYakin < K.agiz);
  check(!dogusta.length, 'hiçbir leke deliğin doğduğu yerde değil',
    dogusta.map(r => `${r.n}:${r.m.dogusaEnYakin}`).join(' '));
}

console.log('\n3. kural gerçekten çalışıyor mu');
{
  // Leke çizilip hızın hiç değişmemesi (ya da tersi) gözle görülmez: yarım
  // hız, yarım hız gibi durmuyor — "bugün kötü oynadım" gibi duruyor.
  const lv = camurlu.length ? camurlu[0].n : null;
  if (lv == null) {
    check(false, 'ölçülebilecek bir çamurlu tahta var');
  } else {
    const o = await pg.evaluate(l => {
      window.fruitHoleSeedField(7400 + l);
      window.fruitHoleProbe(l);
      return window.fruitHoleMud().icinde;
    }, lv);
    check(o.ic === K.yavas, 'lekenin içinde hız yarıya iniyor', `içeride ${o.ic}`);
    check(o.dis === 1, 'lekenin dışında hız normal', `dışarıda ${o.dis}`);
  }
}

console.log('\nsayfa hataları: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
