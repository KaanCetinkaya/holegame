// Hedef kartları: ne istiyorlar, ulaşılabilir mi, ve saat yetiyor mu?
//
//   node build-www.mjs && node scratchpad/holecard.mjs
//
// Bölüm artık "tarlayı süpür" demiyor, "şunlardan şu kadar topla" diyor. Bu
// oyunun en büyük oynanış değişikliği, ve üç şeyi birden bozabilir:
//
//   1. **Ulaşılamaz kart.** Kart tahtada olmayan bir meyveden ister, ya da
//      olandan fazlasını ister. Bölüm hiç bitmez.
//   2. **Bedava bölüm.** Kart tahtanın çok azını ister ve saat süpürme
//      saatidir: her bölüm üç yıldızla biter, ödüllü reklam hiç görünmez.
//      Bu hata bir kez yapıldı (README, "42-82% spare everywhere").
//   3. **Yetişilmez saat.** Kartın saati kendi turundan çıkıyor ve o tur
//      modeli kör: oyuncu kartları sırayla değil iç içe topluyor.
//
// Üçü de burada ölçülüyor. Üçüncüsü için sahte saatle gerçek bir bot
// oynatılıyor — `holeorderplay.mjs`'in aynısı, tek farkı bitiş şartı.

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
}).listen(8262);

// Sahte saat: `requestAnimationFrame` ve `performance.now` devralınıyor, yani
// oyun gerçek zamanda değil **adım adım** ilerliyor. Konteynerde GPU yok ve
// kare hızı ölçülemiyor; ölçülebilen tek şey oyunun kendi saati.
// `holeorderplay.mjs`'in aynısı.
const FAKE_CLOCK = () => {
  let t = 0;
  const queue = [];
  window.requestAnimationFrame = cb => { queue.push(cb); return queue.length; };
  window.cancelAnimationFrame = () => {};
  try {
    Object.defineProperty(window.performance, 'now', { configurable: true, value: () => t });
  } catch (e) { window.performance.now = () => t; }
  window.__step = ms => {
    t += ms;
    const batch = queue.splice(0, queue.length);
    for (const cb of batch) { try { cb(t); } catch (e) {} }
  };
};

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
await pg.addInitScript(FAKE_CLOCK);
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('http://localhost:8262/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleCards, { timeout: 25000 });

const fails = [];
const check = (ok, ne, ek = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ne}${ek ? '   ' + ek : ''}`);
  if (!ok) fails.push(`${ne} ${ek}`);
};

const TUR = (await pg.evaluate(() => window.fruitHoleThemeTable())).order.length;
console.log('\nblm  düzen       tahta    kart  istenen/tahtada          pay   tur   saat');
console.log('----+-----------+--------+-----+------------------------+-----+-----+-----');
const satir = [];
for (let n = 1; n <= TUR; n++) {
  const r = await pg.evaluate(l => {
    window.fruitHoleSeedField(9100 + l);
    const p = window.fruitHoleProbe(l);
    const c = window.fruitHoleCards();
    window.fruitHoleUnseedField();
    return { ...p, ...c };
  }, n);
  satir.push({ n, ...r });
  const kart = r.cards.map(k => `${k.need}/${k.tahtada}`).join(' ');
  console.log(
    `${String(n).padStart(4)} ${String(r.pattern).padEnd(11)} ${r.kind.padEnd(8)} ` +
    `${String(r.cards.length).padStart(4)}  ${kart.padEnd(22)} ` +
    `${String(r.pay).padStart(5)} ${String(r.tur).padStart(5)} ${String(r.saat).padStart(5)}` +
    (r.mission ? '  ' + r.mission : ''));
}

// Kart hangi bölümlerde olmalı: görevi olmayan ızgara tahtaları.
const kartli = satir.filter(r => r.cards.length);
const olmali = satir.filter(r => r.kind === 'ızgara' && !r.mission);
check(kartli.length === olmali.length,
  'görevi olmayan her ızgara tahtasında kart var',
  `${kartli.length} / ${olmali.length}`);
check(satir.filter(r => r.kind !== 'ızgara' || r.mission).every(r => !r.cards.length),
  'resim, şerit, bulmaca ve görev bölümlerinde kart yok');

// 1. Ulaşılabilirlik: kart tahtada olandan fazlasını istemiyor.
const ulasilmaz = kartli.filter(r => r.cards.some(k => k.need > k.tahtada));
check(!ulasilmaz.length, 'hiçbir kart tahtada olandan fazlasını istemiyor',
  ulasilmaz.map(r => `${r.n}:${r.cards.map(k => k.need + '>' + k.tahtada).join(',')}`).join(' '));

// 2. İş payı: kart tahtanın anlamlı bir kısmını istemeli ama tamamını değil.
const paylar = kartli.map(r => r.pay);
const enAz = Math.min(...paylar), enCok = Math.max(...paylar);
console.log(`\n  kartların istediği pay: %${Math.round(enAz * 100)} – %${Math.round(enCok * 100)}`);
// Sınır ölçülerek kondu: bugünkü en hafif kart tahtanın %12'sini istiyor
// (40. bölüm, Spiral — tahtası seyrek ve üç kart birden var). Sınır onun
// hemen altında, yani bir gün daha hafifi çıkarsa burada görünsün.
check(enAz > 0.10, 'en hafif kart bile tahtanın onda birini istiyor', `%${Math.round(enAz * 100)}`);
check(enCok < 0.75, 'en ağır kart bile süpürme emri değil', `%${Math.round(enCok * 100)}`);

// Kart sayısı bölümle birlikte açılıyor.
check(satir.filter(r => r.n < 4 && r.cards.length).every(r => r.cards.length === 1),
  'ilk üç bölümde tek kart');
check(kartli.filter(r => r.n >= 10).every(r => r.cards.length <= 3),
  'hiçbir bölümde üçten fazla kart yok');

// 3. Saat: sahte saatle bot oynuyor — **yalnızca `--bot` verilirse.**
//
// Bu konteynerde bitmiyor: sahte saatin her adımı SwiftShader'da gerçek bir
// çizim ve bir çizim ~70 ms sürüyor. On bölüm yarım saatte, üç bölüm on beş
// dakikada, tek bölüm on üç dakikada bitmedi. Suitin geri kalanını bir
// ölçümün rehin alması, o ölçümün hiç yapılmamasından kötü — testin
// tamamı düşerse yukarıdaki üç kontrol de koşmuyor.
//
// Daha hızlı bir makinede `node scratchpad/holecard.mjs --bot`.
console.log('\nturlar sıkılaşıyor mu, ve hâlâ bitirilebilir mi');
{
  // İki şey birden ölçülüyor, çünkü ikisi birbirinin bedeli.
  //
  // Ölçüldü: dört tur boyunca kart/saniye oranı 1.10, 1.19, 1.16, 1.14 —
  // düz. Sebebi yapısal: kartlı bir bölümün saati kartın **kendi turundan**
  // çıkıyor, yani kart büyüyünce saat de büyüyor ve oran hiç kıpırdamıyor.
  // 55. bölümdeki oyuncu 10. bölümdekiyle aynı sıkışıklıkta oynuyordu.
  //
  // Saati kısmak denenmiş ve geri alınmıştı — `levelSeconds` içindeki
  // `squeeze` tam olarak bunu yapıyor ama kartlı bölümlerde kapalı, çünkü
  // kartın saati kaba bir üst sınır değil o tahtaya özel bir tur ölçümü ve
  // üstüne %28 binince 205. bölümde kusursuz bot bile yetişememiş. Değişen
  // şey artık payın kendisi: `cardSlack()` tur başına 0.15 iniyor.
  //
  // Alt sınır de burada: pay 2.3'ün altına inerse saat, kartın turunun iki
  // katından aza düşer ve oradan sonrası bitirilemez bölüm. Taban olmasa
  // yedinci turda oran 1'in altına inerdi.
  const satir = [];
  // 47. bölüm (Dial) her turda sıradan bir ızgara tahtası: görev her beşinci
  // bölümde, resim/şerit/bulmaca başka yuvalarda. Örnek bölüm elle
  // seçilmiyor da olmuyor — tur karşılaştırması ancak **aynı** düzenin
  // turları arasında anlamlı.
  for (const n of [47, 95, 143, 191, 239, 287]) {
    const o = await pg.evaluate(l => {
      window.fruitHoleSeedField(8800 + (l % 48));
      const p = window.fruitHoleProbe(l);
      if (p.kind !== 'ızgara' || p.mission) { window.fruitHoleUnseedField(); return null; }
      const c = window.fruitHoleCards();
      window.fruitHoleUnseedField();
      return { turSn: c.tur, saat: c.saat };
    }, n);
    if (o && o.turSn > 0) {
      satir.push({ n, tur: Math.floor((n - 1) / 48) + 1, ...o, pay: o.saat / o.turSn });
    }
  }
  console.log('\n  blm  tur | kartın turu    saat |  pay');
  console.log('  ----+-----+-------------+------+------');
  for (const r of satir) {
    console.log(`  ${String(r.n).padStart(3)} | ${String(r.tur).padStart(3)} | ` +
      `${String(r.turSn + 's').padStart(11)} | ${String(r.saat + 's').padStart(4)} | ${r.pay.toFixed(2)}`);
  }
  check(satir.length >= 4, 'birkaç turdan ölçüm alındı', String(satir.length));
  const enDar = Math.min(...satir.map(r => r.pay));
  check(enDar >= 2.3, 'en geç turda bile saat, kartın turunun 2.3 katından fazla',
    enDar.toFixed(2));
  // Ve gerçekten sıkılaşıyor: olmazsa bu bölüm hiçbir şey ölçmüyor demektir.
  const ilk = satir[0].pay, son = satir[satir.length - 1].pay;
  check(son < ilk - 0.2, 'geç turlar ilk turdan belirgin biçimde daha sıkı',
    `${ilk.toFixed(2)} -> ${son.toFixed(2)}`);
}

if (!process.argv.includes('--bot')) {
  console.log('\nbot koşusu atlandı (--bot ile açılır)');
  console.log('\nsayfa hataları: ' + (errs.length ? errs.join(' | ') : 'yok'));
  console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
  await br.close();
  srv.close();
  process.exit(fails.length || errs.length ? 1 : 0);
}
// 3. Saat: sahte saatle bot oynuyor.
//
// Gerçek zaman ölçülmüyor — konteynerde GPU yok ve kare hızı anlamsız.
// Oyun `window.__step` ile adım adım ilerletiliyor, yani ölçülen şey
// **oyunun kendi saati**.
console.log('\nbot koşusu (sahte saat):');
console.log('blm | kart | botun işi | verilen saat | pay');
console.log('----+------+-----------+--------------+-----');
// İlk on kart bölümü, **artı geç turlardan birkaçı.**
//
// Önce yalnızca ilk on vardı ve hepsi 1. turdan: yani saat payının tur
// başına daraldığı değişiklik, tam da etkilediği yerde ölçülmüyordu. Geç
// turun bitirilebilirliği bu dosyanın en pahalı sorusu, çünkü yanlış
// cevabı ancak oraya gelmiş bir oyuncuda görünüyor — ve oraya gelen oyuncu,
// elde tutmaya değer tek oyuncu.
//
// 47'nin katları seçildi: o düzen her turda sıradan bir ızgara tahtası
// kalıyor (görev her beşinci bölümde, resim ve şerit başka yuvalarda).
// İkisi yetiyor ve sebebi maliyet: bir geç tur koşusu SwiftShader'la ~15
// dakika (kare başına ~70 ms, 400 saniyelik oyun). `--bot` zaten isteğe
// bağlı; beş geç bölüm koymak onu kimsenin çalıştırmayacağı bir şey yapar,
// ve çalıştırılmayan bir ölçü, olmayan ölçüdür.
//
// 191 payın tabana oturduğu ilk tur (4.), 287 ise altıncı: tabanın gerçekten
// taban olduğunu, yani daha aşağı inmediğini gösteriyor.
const GEC = [191, 287];
const KOS = kartli.filter(r => r.kind === 'ızgara').slice(0, 10);
for (const n of GEC) {
  const o = await pg.evaluate(l => {
    window.fruitHoleSeedField(9100 + l);
    const p = window.fruitHoleProbe(l);
    if (p.kind !== 'ızgara' || p.mission) { window.fruitHoleUnseedField(); return null; }
    const c = window.fruitHoleCards();
    window.fruitHoleUnseedField();
    return { n: l, kind: p.kind, cards: c.cards, saat: c.saat };
  }, n);
  if (o) KOS.push(o);
}
const dar = [];
const sonuc = new Map();
for (const r of KOS) {
  const o = await pg.evaluate(async (lvl) => {
    window.fruitHoleSeedField(9100 + lvl);
    window.fruitHoleProbe(lvl);
    window.fruitHoleStartLevel();
    // Tarla düşerken oynanmıyor: iki saniyelik kare geçiliyor.
    for (let i = 0; i < 60; i++) window.__step(1000 / 30);
    window.fruitHoleHold(true);
    const bitti = () => window.fruitHoleCards().cards.every(k => k.got >= k.need);
    let t = 0;
    const DT = 1 / 30;             // saniye
    const MS = 1000 * DT;
    // Bot: kartın istediği en yakın meyveye git. O an yutulamıyorsa (dev ya
    // da iri meyve) en yakın parçaya gidip büyü — `holeorderplay.mjs`'in
    // botunun aynısı, tek farkı hedefi kartın söylemesi.
    // Sıkışma kurtarma, ve neden gerektiği.
    //
    // Bu bot açgözlü: en yakın hedefe doğru bakıp düz gidiyor, yol bulma
    // yok. Arada bir kaya varsa kayaya dayanıp orada kalıyor — yutulan
    // sayı artmıyor, yer değişmiyor, ve döngü dört yüz saniye boyunca
    // aynı duvara bastırıyor.
    //
    // Bu, ölçünün iki ayrı şeyi karıştırdığı yer: "bölüm bitirilemez" ile
    // "bot aptal". 191. bölüm tam böyle düştü — tahta ölçüldüğünde sağlamdı
    // (0 ulaşılamaz parça, kartlar karşılanabilir, saat kartın turunun 2.35
    // katı) ama bot bitiremedi. Botun başarısızlığı bölüme yazılırsa
    // olmayan bir hata kovalanır; görmezden gelinirse gerçek bir hata
    // kaçar.
    //
    // İki saniyedir ne yiyen ne kıpırdayan bot, rastgele bir yöne yarım
    // saniye sürülüyor. Kurtarma sayısı da dönüyor: çok fazlaysa ölçü
    // "bot zor bir tahtada" diyor, sıfırsa düz bir koşu.
    let kurtarma = 0;
    let sonYenen = -1, sonX = 0, sonZ = 0, kipirtisiz = 0;
    while (t < 400 && !bitti()) {
      const w = window.fruitHoleWhere();
      if (w.eaten === sonYenen && Math.hypot(w.x - sonX, w.z - sonZ) < 0.05) kipirtisiz += DT;
      else kipirtisiz = 0;
      sonYenen = w.eaten; sonX = w.x; sonZ = w.z;
      if (kipirtisiz > 2) {
        kurtarma++;
        const a = Math.random() * Math.PI * 2;
        for (let i = 0; i < 15; i++) {
          window.fruitHoleSteer(Math.cos(a), Math.sin(a));
          window.__step(MS); t += DT;
        }
        kipirtisiz = 0;
        continue;
      }
      const h = window.fruitHoleCardNearest();
      const hedef = (h && h.eatable) ? h : (window.fruitHoleNearest() || h);
      if (!hedef) break;
      const dx = hedef.x - w.x, dz = hedef.z - w.z;
      const d = Math.hypot(dx, dz) || 1;
      window.fruitHoleSteer(dx / d, dz / d);
      window.__step(MS);
      t += DT;
    }
    window.fruitHoleHold(false);
    window.fruitHoleUnseedField();
    return { is: +t.toFixed(1), bitti: bitti(), kurtarma };
  }, r.n);
  sonuc.set(r.n, o);
  const pay = o.bitti ? Math.round((1 - o.is / r.saat) * 100) : null;
  console.log(`${String(r.n).padStart(3)} | ${String(r.cards.length).padStart(4)} | ` +
    `${String(o.bitti ? o.is + 's' : 'BİTİREMEDİ').padStart(9)} | ` +
    `${String(r.saat + 's').padStart(12)} | ${pay === null ? '-' : '%' + pay}` +
    (o.kurtarma ? `  (${o.kurtarma} kurtarma)` : ''));
  if (!o.bitti || pay < 0) dar.push(String(r.n));
}
check(!dar.length, 'bot her kart bölümünü saat içinde bitiriyor', dar.join(' '));

// Üç yıldız geç turda da alınabiliyor mu.
//
// Bu ölçü, saat payının tur başına daralmasıyla birlikte doğdu. Üç yıldızın
// şartı `timeLeft / levelTime() >= 0.45`, yani saatin yarısından fazlasının
// kalması. Pay daraldıkça aynı oyun daha az yıldız veriyor — ve istenen
// tam da bu. İstenmeyen, en üst notun **ulaşılamaz** olması: zor olmakla
// alınamaz olmak ayrı şeyler, ve ikincisi oyuncuya "bu bozuk" dedirtiyor.
//
// Ölçülen şey kusursuz botun payı. 1. turda %76-88, 4. turda %52 — yani üç
// yıldız duruyor ama arada yalnızca 0.07 var. Bir dahaki sıkıştırma bunu
// sessizce götürürdü; artık götüremez.
{
  const gecKos = KOS.filter(r => r.n > 48);
  const paylar = [];
  for (const r of gecKos) {
    const o = sonuc.get(r.n);
    if (o && o.bitti) paylar.push({ n: r.n, oran: 1 - o.is / r.saat });
  }
  check(paylar.length > 0, 'geç turdan ölçüm alındı', String(paylar.length));
  const enDar = paylar.length ? Math.min(...paylar.map(p => p.oran)) : 1;
  check(enDar >= 0.45, 'geç turda kusursuz oyun hâlâ üç yıldız alıyor',
    paylar.map(p => `${p.n}:%${Math.round(p.oran * 100)}`).join(' '));
}

console.log('\nsayfa hataları: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
