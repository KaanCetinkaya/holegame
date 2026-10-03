// Diken: nerede çıkıyor, ne alıyor, ve aldığını geri vermek mümkün mü?
//
//   node build-www.mjs && node scratchpad/holespike.mjs
//
// Üçüncü engel ve öteki ikisinden farkı, **sessizce** bozulabilmesi. Bomba
// patlıyor, kaya durduruyor — ikisi de yanlış davrandığında görünüyor. Diken
// deliği küçültüyor, ve küçültmenin üç ayrı sessiz hatası var:
//
//   1. **Görünmeyen diken.** Bir meyve öbeğinin içinde duruyor. Oyuncu
//      üstünden geçiyor, boyu düşüyor, sebebi ekranda yok. Bunun adı
//      zorluk değil "bu oyun bazen beni küçültüyor".
//   2. **Geri alınamayan boy.** Tahtada kalan meyve, dikenin aldığı boyu
//      geri verecek kadar değil. Bölüm bitirilemez hâle geliyor ve oyun
//      bunu hata olarak göstermiyor — saat doluyor, sebep görünmüyor.
//      Kayanın kenar payında öğrenilen şeyin aynısı.
//   3. **Yanlış tahtada diken.** Devler görevinde bitiş şartı "her devi
//      yut" ve devi yutmak bir boy işi: orada küçülten bir şey, oyuncuya
//      kendi cezasıyla bölümü kaybettirir.
//
// Üçü de burada ölçülüyor, ve hepsi tohumlu: aynı tahtaya iki kere bakınca
// aynı sayı çıksın.

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
}).listen(8273);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('http://localhost:8273/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleSpikes, { timeout: 25000 });

const fails = [];
const check = (ok, ne, ek = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ne}${ek ? '   ' + ek : ''}`);
  if (!ok) fails.push(`${ne} ${ek}`);
};

// Kuralların hepsi oyundan okunuyor, buraya elle yazılmıyor: bir sayıyı iki
// yere yazmak, birini değiştirip ötekini unutmanın tanımı.
const K = await pg.evaluate(() => {
  const s = window.fruitHoleSpikes();
  return { adim: s.adim, taban: s.taban, ilk: s.ilkBolum,
           agiz: window.fruitHoleRocks().agizTavani };
});
console.log(`\ndiken ${K.ilk}. bölümde başlıyor, bir boy ${K.adim}, taban ${K.taban}`);

const SON = 60;
const satir = [];
console.log('\nblm  düzen       tahta    görev   | diken  doğuşa  kayaya  meyveye  kenara');
console.log('----+-----------+--------+--------+-------+-------+-------+--------+-------');
for (let n = 1; n <= SON; n++) {
  const r = await pg.evaluate(l => {
    window.fruitHoleSeedField(7100 + l);
    const p = window.fruitHoleProbe(l);
    const s = window.fruitHoleSpikes();
    const g = window.fruitHoleGrow();
    window.fruitHoleUnseedField();
    return { ...p, s, kalanBuyume: g.kalanBuyume, giantR: g.giantR };
  }, n);
  satir.push({ n, ...r });
  if (r.s.sayi) {
    console.log(
      `${String(n).padStart(4)} ${String(r.pattern).padEnd(11)} ${r.kind.padEnd(8)} ` +
      `${String(r.mission || '-').padEnd(8)}| ${String(r.s.sayi).padStart(5)} ` +
      `${String(r.s.dogusaEnYakin).padStart(7)} ${String(r.s.kayayaEnYakin ?? '-').padStart(7)} ` +
      `${String(r.s.enYakinMeyve).padStart(8)} ${String(r.s.kenara).padStart(7)}`);
  }
}

const dikenli = satir.filter(r => r.s.sayi > 0);
console.log(`\n${SON} bölümün ${dikenli.length}'inde diken var`);

console.log('\n1. nerede çıkıyor');
{
  const erken = satir.filter(r => r.n < K.ilk && r.s.sayi);
  check(!erken.length, `${K.ilk}. bölümden önce diken yok`,
    erken.map(r => r.n).join(' '));

  // Izgara olmayan tahtalar: resim, şerit ve bulmaca. Üçü de tahtayı
  // desenden değil kendi kuralından kuruyor ve üstlerine rastgele bir şey
  // konmuyor — kaya, dev, bomba ve kolos için zaten böyle.
  const yanlisTahta = satir.filter(r => r.kind !== 'ızgara' && r.s.sayi);
  check(!yanlisTahta.length, 'resim, şerit ve bulmaca tahtalarında diken yok',
    yanlisTahta.map(r => `${r.n}:${r.kind}`).join(' '));

  const devGorevi = satir.filter(r => r.mission === 'giants' && r.s.sayi);
  check(!devGorevi.length, 'devler görevinde diken yok',
    devGorevi.map(r => r.n).join(' '));

  // Sayı: bir tahtaya kaç tane. Üstü değil, **payı** ölçülüyor — tahta
  // bölümle birlikte uzuyor ve sabit bir üst sınır uzun tahtada gevşek
  // kalırdı. Bugünkü en kalabalık tahta iki diken taşıyor.
  const enCok = Math.max(...dikenli.map(r => r.s.sayi));
  check(enCok <= 3, 'hiçbir tahtada üçten fazla diken yok', `en çok ${enCok}`);
  check(dikenli.length >= 10, 'diken gerçekten çıkıyor (ölü kod değil)',
    `${dikenli.length} tahta`);
}

console.log('\n2. görünür mü, ve doğru yerde mi');
{
  // Doğuş: en geniş ağızla başlayan bir oyuncu bile dikenin üstünde
  // doğmamalı. İlk hareketi "neden küçüldüm" olmasın.
  const dogusta = dikenli.filter(r => r.s.dogusaEnYakin < K.agiz + 1);
  check(!dogusta.length, 'hiçbir diken deliğin doğduğu yerde değil',
    dogusta.map(r => `${r.n}:${r.s.dogusaEnYakin}`).join(' '));

  // Kaya: ikisi üst üste binmemeli. Binerse oyuncu kayaya çarpıp duruyor,
  // aynı anda küçülüyor, ve hangisinin ne yaptığını göremiyor.
  const kayada = dikenli.filter(r => r.s.kayayaEnYakin != null && r.s.kayayaEnYakin < K.agiz);
  check(!kayada.length, 'diken kayanın dibinde değil',
    kayada.map(r => `${r.n}:${r.s.kayayaEnYakin}`).join(' '));

  // Açıklık: dikenin çevresi boş, yani yukarıdan görünüyor. Sınır ölçülerek
  // kondu — bugünkü en sıkışık diken 1.0 birimde bir komşu taşıyor ve o
  // komşu bir **dev**: devler dikenden önce yerleşiyor ve temizlenmiyor,
  // ama bir dev zaten tahtanın en görünür şeyi, dikeni saklamıyor.
  const gomulu = dikenli.filter(r => r.s.enYakinMeyve < 0.95);
  check(!gomulu.length, 'her diken bir açıklıkta duruyor',
    gomulu.map(r => `${r.n}:${r.s.enYakinMeyve}`).join(' ') ||
    `en sıkışığı ${Math.min(...dikenli.map(r => r.s.enYakinMeyve))}`);

  const disarida = dikenli.filter(r => r.s.kenara < 0);
  check(!disarida.length, 'her diken tahtanın içinde', disarida.map(r => r.n).join(' '));
}

console.log('\n3. ne alıyor');
{
  // Tek bir dikene çarpmak tam bir boy alıyor, ve rozet bir kademe düşüyor.
  const orta = dikenli.find(r => r.s.sayi);
  const o = await pg.evaluate(([l, adim, taban]) => {
    window.fruitHoleSeedField(7100 + l);
    window.fruitHoleProbe(l);
    // Ortalarda bir boy: hem küçülecek yer var hem de tabana çarpmıyor.
    const bas = taban + adim * 4;
    const a = window.fruitHoleSpikeRun(0, bas);
    // Aynı dikene bir daha: kırıldığı için ikinci kez almamalı.
    const b = window.fruitHoleSpikeRun(0, null);
    window.fruitHoleUnseedField();
    return { a, b };
  }, [orta.n, K.adim, K.taban]);
  check(Math.abs(o.a.fark - K.adim) < 1e-6, 'bir dikene çarpmak tam bir boy alıyor',
    `${o.a.onceR} -> ${o.a.sonraR}`);
  check(o.b.fark === 0, 'kırılan diken ikinci kez almıyor', `ikinci geçiş ${o.b.fark}`);

  // Taban: en küçük delikle bir dikene çarpmak hiçbir şey almıyor. Alsaydı
  // en küçük meyve bile yutulamaz olurdu ve bölüm sessizce bitirilemez
  // hâle gelirdi.
  const t = await pg.evaluate(([l, taban]) => {
    window.fruitHoleSeedField(7100 + l);
    window.fruitHoleProbe(l);
    const a = window.fruitHoleSpikeRun(0, taban);
    window.fruitHoleUnseedField();
    return a;
  }, [orta.n, K.taban]);
  check(t.sonraR >= K.taban - 1e-9, 'delik tabanın altına inmiyor',
    `${t.onceR} -> ${t.sonraR}`);

  // Tahtadaki bütün dikenlere çarkmak: yine tabanın altına inmiyor.
  const hepsi = await pg.evaluate(([l, taban]) => {
    window.fruitHoleSeedField(7100 + l);
    window.fruitHoleProbe(l);
    let son = null;
    const n = window.fruitHoleSpikes().sayi;
    for (let i = 0; i < n; i++) son = window.fruitHoleSpikeRun(i, i ? null : taban + 0.1);
    window.fruitHoleUnseedField();
    return son;
  }, [dikenli.reduce((a, b) => (b.s.sayi > a.s.sayi ? b : a)).n, K.taban]);
  check(hepsi.sonraR >= K.taban - 1e-9, 'bütün dikenlere çarpmak da tabanın altına inmiyor',
    `${hepsi.sonraR}`);
}

console.log('\n4. alınan boy geri kazanılabiliyor mu');
{
  // Dikenin aldığı toplam boy, tahtanın geri verebileceği büyümenin yanında
  // küçük kalmalı. Eşit olsaydı tahtayı tamamen süpürmek yalnızca dikenin
  // aldığını geri ödemeye yeterdi.
  //
  // Sınır ölçülerek kondu, tahminle değil: bugünkü en kötü tahta, geri
  // verebileceğinin onda birinden azını istiyor.
  const oran = dikenli.map(r => ({
    n: r.n, p: +(r.s.sayi * K.adim / r.kalanBuyume).toFixed(3) }));
  const enKotu = oran.reduce((a, b) => (b.p > a.p ? b : a));
  console.log(`  dikenlerin istediği pay: en çok %${Math.round(enKotu.p * 100)} (${enKotu.n}. bölüm)`);
  check(enKotu.p < 0.25, 'dikenler tahtanın verebileceğinin dörtte birinden azını alıyor',
    `%${Math.round(enKotu.p * 100)}`);
}

console.log('\nsayfa hataları: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
