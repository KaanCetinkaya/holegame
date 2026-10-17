// Rakip delik: tahtayı eksiltiyor mu, ve bölümü bitirilemez yapabilir mi?
//
//   node build-www.mjs && node scratchpad/holerival.mjs
//
// Altı engel tahtanın sana yaptığı şeyler — bir şey alıyorlar ya da yolunu
// kapatıyorlar. Bu tahtayı **eksiltiyor**, ve o yüzden tek gerçek riski de
// başka: kaybettirmek değil, **bitirilemez yapmak.**
//
// Kart "otuz muz topla" diyorsa ve rakip muzları yiyip tahtada yirmi tane
// bıraktıysa bölüm kaybedilmiştir — ve oyun bunu hata olarak göstermez.
// Saat dolar, sebep görünmez. Kayanın kenar payından beri her engelde
// sorulan soru bu; burada en keskin hâliyle soruluyor, çünkü rakip tahtayı
// **oynanırken** eksiltiyor, yerleştirme anında değil.
//
// Ölçülen üç şey:
//
//   1. Rakip yalnızca kart olan tahtalarda çıkıyor. Kartsız bir tahtada
//      bitiş şartı "tahtayı süpür" ve rakibin yediği her meyve o şartı
//      **ulaşılmaz** yapıyor — yenen sayacı artmıyor ama hedef duruyor.
//   2. Ne kadar yerse yesin, her kart için tahtada gerekenden çok meyve
//      kalıyor.
//   3. Gerçekten yiyor, ve delikten yavaş.

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
}).listen(8277);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('http://localhost:8277/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleRival, { timeout: 25000 });

const fails = [];
const check = (ok, ne, ek = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ne}${ek ? '   ' + ek : ''}`);
  if (!ok) fails.push(`${ne} ${ek}`);
};

const K = await pg.evaluate(() => {
  const r = window.fruitHoleRival();
  return { ilk: r.ilkBolum, pay: r.pay };
});
console.log(`\nrakip ${K.ilk}. bölümde başlıyor · kart payı ${K.pay}`);

const SON = 60;
const satir = [];
console.log('\nblm  düzen       tahta    görev   | rakip  kart');
console.log('----+-----------+--------+--------+-------+-----');
for (let n = 1; n <= SON; n++) {
  const r = await pg.evaluate(l => {
    window.fruitHoleSeedField(7500 + l);
    const p = window.fruitHoleProbe(l);
    const v = window.fruitHoleRival();
    const c = window.fruitHoleCards();
    window.fruitHoleUnseedField();
    return { ...p, v, kart: c.cards.length };
  }, n);
  satir.push({ n, ...r });
  if (r.v.var) {
    console.log(
      `${String(n).padStart(4)} ${String(r.pattern).padEnd(11)} ${r.kind.padEnd(8)} ` +
      `${String(r.mission || '-').padEnd(8)}| ${'var'.padStart(6)} ${String(r.kart).padStart(5)}`);
  }
}

const rakipli = satir.filter(r => r.v.var);
console.log(`\n${SON} bölümün ${rakipli.length}'inde rakip var`);

console.log('\n1. nerede çıkıyor');
{
  const erken = satir.filter(r => r.n < K.ilk && r.v.var);
  check(!erken.length, `${K.ilk}. bölümden önce rakip yok`, erken.map(r => r.n).join(' '));

  const yanlisTahta = satir.filter(r => r.kind !== 'ızgara' && r.v.var);
  check(!yanlisTahta.length, 'resim, şerit ve bulmaca tahtalarında rakip yok',
    yanlisTahta.map(r => `${r.n}:${r.kind}`).join(' '));

  const gorevde = satir.filter(r => r.mission && r.v.var);
  check(!gorevde.length, 'görev bölümlerinde rakip yok',
    gorevde.map(r => `${r.n}:${r.mission}`).join(' '));

  // En kritik şart. Kartsız bir tahtada bitiş şartı `eatenCount >= levelGoal`
  // ve `levelGoal` tahta kurulurken sayılıyor: rakibin yediği her meyve o
  // sayıyı ulaşılmaz yapıyor, çünkü yenen sayacı yalnızca **oyuncu** yerken
  // artıyor. Bugün her ızgara tahtasının kartı var, ama bu kural bir gün
  // değişirse burası düşsün.
  const kartsiz = rakipli.filter(r => r.kart === 0);
  check(!kartsiz.length, 'rakip yalnızca kartı olan tahtalarda çıkıyor',
    kartsiz.map(r => r.n).join(' '));

  const tanitim = satir.find(r => r.n === K.ilk);
  check(tanitim && tanitim.kind === 'ızgara' && !tanitim.mission && tanitim.v.var,
    'tanıtım bölümü sıradan bir ızgara tahtası ve rakibi var',
    `${K.ilk}: ${tanitim.kind}${tanitim.v.var ? ', rakip var' : ', rakip yok'}`);

  check(rakipli.length >= 10, 'rakip gerçekten çıkıyor (ölü kod değil)',
    `${rakipli.length} tahta`);
}

console.log('\n2. doymadan bırakmıyor, ama bitirilemez de yapmıyor');
{
  // Rakip uzun uzun oynatılıyor — oyuncu hiç kıpırdamamış gibi. En kötü
  // hâl bu: tahtayı yalnızca rakip eksiltiyor.
  console.log('\n  blm | rakip kaç yedi | kartlar (kalan/gereken)');
  console.log('  ----+----------------+------------------------');
  const bozuk = [];
  for (const r of rakipli.slice(0, 8)) {
    const o = await pg.evaluate(l => {
      window.fruitHoleSeedField(7500 + l);
      window.fruitHoleProbe(l);
      window.fruitHoleStartLevel();
      // İki dakikalık oyun, 1/30 saniyelik adımlarla: bir bölümün saatinden
      // uzun, yani rakibin yapabileceğinin tamamı.
      window.fruitHoleRivalStep(1 / 30, 3600);
      const v = window.fruitHoleRival();
      window.fruitHoleUnseedField();
      return v;
    }, r.n);
    const kart = o.kartlar.map(k => `${k.type} ${k.kalan}/${k.gereken}`).join('  ');
    console.log(`  ${String(r.n).padStart(3)} | ${String(o.yedi).padStart(14)} | ${kart}`);
    if (o.kartlar.some(k => k.kalan < k.gereken)) bozuk.push(`${r.n}`);
  }
  check(!bozuk.length, 'rakip hiçbir kartı ulaşılmaz bırakmıyor', bozuk.join(' '));
}

console.log('\n3. yarış adil mi');
{
  const lv = rakipli.length ? rakipli[0].n : null;
  if (lv == null) {
    check(false, 'ölçülebilecek bir rakipli tahta var');
  } else {
    const o = await pg.evaluate(l => {
      window.fruitHoleSeedField(7500 + l);
      window.fruitHoleProbe(l);
      window.fruitHoleStartLevel();
      const once = window.fruitHoleRival();
      window.fruitHoleRivalStep(1 / 30, 300);     // on saniye
      const sonra = window.fruitHoleRival();
      window.fruitHoleUnseedField();
      return { once, sonra };
    }, lv);
    check(o.sonra.yedi > 0, 'rakip gerçekten yiyor', `on saniyede ${o.sonra.yedi} meyve`);
    check(o.sonra.hiz < o.sonra.delik, 'rakip oyuncudan yavaş',
      `${o.sonra.hiz} < ${o.sonra.delik}`);
    check(o.once.x !== o.sonra.x || o.once.z !== o.sonra.z, 'rakip hareket ediyor',
      `${o.once.x},${o.once.z} -> ${o.sonra.x},${o.sonra.z}`);
  }
}

console.log('\nsayfa hataları: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
