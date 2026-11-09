// Bölüm saati verdiği sözü tutuyor mu? — bot oynuyor, kalan saat ölçülüyor.
//
//   node build-www.mjs && node scratchpad/holesaat.mjs
//   node scratchpad/holesaat.mjs 3        # her 3. bölüm (varsayılan)
//
// ## Neden var
//
// `levelTime`in yanındaki yorum bir sayı veriyor: *"2.6x leaves roughly a
// third of the clock unused on a clean run and none at all on a wandering
// one."* O cümle bir ölçümden geliyordu ama ölçüm bir dosyada durmuyordu,
// yani bugün hâlâ doğru olup olmadığını kimse bilmiyordu. Bu deponun en sık
// tekrar eden hata cinsi: **elle yazılmış bir sayı, zamanla eskiyen.**
//
// `holemayin` ucundan tuttu. Mayın bölümünde bombalara hiç aldırmayan bot,
// 35. bölümde saatin %20-29'uyla bitiriyor (bir ya da iki yıldız — ceza
// çalışıyor), ama 75. ve 115. bölümlerde %46-70 ile bitiriyor, yani on üç
// bomba yiyip hâlâ **üç yıldız** alıyor. Yani sorun mayında değil: o iki
// tahtada saat baştan bol.
//
// Sebep `sweepSeconds`ta: saat tarlanın **alanından** çıkıyor, parça
// sayısından değil (bilerek — parça saymak Island gibi seyrek desenlere
// geçilemez bir saat veriyordu, README'de duruyor). Ama seyrek bir tahtada
// oyuncu boş bölgeleri atlıyor, yani alanın tamamını süpürmesi gerekmiyor;
// üstüne delik de yavaş büyüdüğü için (`levelGoal` küçük) model daha da uzun
// bir saat veriyor. 35. bölüm 596 parça / 297 saniye, 75. bölüm 229 parça /
// 277 saniye.
//
// ## Ölçülen şey
//
// Her bölümde bot sonuna kadar oynuyor ve **kalan saatin payı** yazılıyor.
// Bot kusursuz değil; önemli olan da o değil: aynı bot her bölümde aynı
// şekilde oynuyor, yani sayılar birbiriyle karşılaştırılabilir. Aranan şey
// bir mutlak değer değil, **yayılım**: aynı sözü veren saat her tahtada
// aynı payı bırakmalı.
//
// Üç yıldız sınırı %45 (`timeLeft / levelTime() >= 0.45`), yani payın
// oradan yukarıda olması "her koşu üç yıldız" demek — oyunun yıldız
// ekonomisinin tamamı buna bağlı.
//
// Çizim kapalı (`fruitHoleDrawOff`): ölçülen şey turun mantığı, ekrandaki
// görüntü değil. Bu olmadan betik saatler sürüyordu, yani hiç koşmuyordu.
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
}).listen(8616);

const FAKE = () => {
  let t = 0; const q = [];
  window.requestAnimationFrame = cb => { q.push(cb); return q.length; };
  window.cancelAnimationFrame = () => {};
  try { Object.defineProperty(window.performance, 'now', { configurable: true, value: () => t }); }
  catch (e) { window.performance.now = () => t; }
  window.__step = ms => { t += ms; for (const cb of q.splice(0, q.length)) { try { cb(t); } catch (e) {} } };
};

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const FPS = 30;
// Her bölüm kendi sayfasında: uzun koşular SwiftShader'ın bağlamını
// düşürüyor ve bağlam gidince oyun saati durduruyor, yani o koşu ölçüm
// olmaktan çıkıyor. `holemayin` bunu yedi koşuda yaşadı ve "oyuncu
// kaybetti" diye okudu.
const sayfaAc = async () => {
  const ctx = await br.newContext({ viewport: { width: 412, height: 915 } });
  const p = await ctx.newPage();
  await p.addInitScript(FAKE);
  await p.goto('http://localhost:8616/', { waitUntil: 'load' });
  await p.waitForFunction(() => typeof window.fruitHoleProbe === 'function', null, { timeout: 60000 });
  await p.evaluate(() => window.fruitHoleDrawOff(true));
  return { ctx, p };
};

// Önerilen bir kat sayısını **denemek**: oyunun saatini değiştirmeden.
//
//   node scratchpad/holesaat.mjs 3 --kat 1.6
//
// Saat, bölümün kendi modelinden yeniden kuruluyor (süpürme bölümünde
// `sweepSeconds`, kartlı bölümde kartların turu) ve `fruitHoleGiveTime` ile
// o tahtaya veriliyor — yani oyundaki 2.6 ve 2.8 sabitlerine dokunmadan
// "kat sayısı şu olsa ne olurdu" sorusunun cevabı ölçülüyor.
//
// İki sayı birden çıkıyor ve karar ikisine bakmak zorunda:
//   - kaç bölümde bot hâlâ üç yıldız alıyor (yıldızın bir şey ifade etmesi)
//   - kaç bölümü bot artık **bitiremiyor** (kaybedilebilirliğin dozu)
//
// Bot kusursuz değil: bitiremediği bir bölüm, gerçek oyuncunun
// kaybedeceği bölüm demek değil ama o yöne işaret ediyor. Sayı kesme
// kararının kendisi bu betiğin işi değil, kararın bedelini göstermek.
const KAT = (() => {
  const i = process.argv.indexOf('--kat');
  return i === -1 ? null : Number(process.argv[i + 1]);
})();
const ADIM = Number(process.argv[2] || 3);
const BOLUMLER = [];
for (let n = 1; n <= 120; n += ADIM) BOLUMLER.push(n);

if (KAT) console.log(`\n  DENEME: kat sayısı ${KAT} (oyunun kendi sabitleri değişmedi)`);
console.log('\n  blm  tahta       görev   parça  saat  biten  kalan  pay   yıldız  sonuç');
console.log('  ----+-----------+-------+------+-----+------+------+-----+-------+------');

const satir = [];
for (const lv of BOLUMLER) {
  const { ctx, p: pg } = await sayfaAc();
  const o = await pg.evaluate(([l, fps, kat]) => {
    // Tohum sabit: aynı bölüm iki koşuda aynı tahta olsun. Tahtanın
    // kendi gürültüsü bu ölçümün sorusu değil.
    window.fruitHoleSeedField(4242 + l);
    const pr = window.fruitHoleProbe(l);
    window.fruitHoleStartLevel();
    for (let i = 0; i < 40; i++) window.__step(1000 / fps);
    let saat = window.fruitHoleWhere().timeLeft;
    const model = window.fruitHoleClock();
    // Önerilen kat sayısı: saat bölümün kendi modelinden yeniden kuruluyor.
    // Bulmacada saat yok, rush'ta saat her meyveyle doluyor — ikisi dışarıda.
    if (kat && !['puzzle', 'rush'].includes(model.dal)) {
      const taban = model.dal === 'kart' ? window.fruitHoleCards().tur : model.sweep;
      if (taban > 0) saat = window.fruitHoleGiveTime(Math.round(taban * kat));
    }
    // Bütçe saatin kendisinden: saat dolduğunda bölüm biter, yani daha
    // fazla kare ilerletmek bir şey ölçmez. Rush bölümünde saat her
    // meyveyle doluyor, orada bütçe sabit.
    const enCok = Math.round((pr.mission === 'rush' ? 150 : saat + 10) * fps);
    let kare = 0;
    for (; kare < enCok; kare++) {
      const w = window.fruitHoleWhere();
      if (w.state !== 'playing') break;
      const h = window.fruitHoleNearest();
      if (h) {
        const dx = h.x - w.x, dz = h.z - w.z, d = Math.hypot(dx, dz) || 1;
        window.fruitHoleSteer(dx / d, dz / d);
      }
      window.__step(1000 / fps);
    }
    const w = window.fruitHoleWhere();
    // Oyunun kendi yıldızı, bölümü bitirdiği an okunuyor.
    const yildizOyun = window.fruitHoleStars();
    window.fruitHoleUnseedField();
    return { kind: pr.kind, mission: pr.mission, parca: pr.fruit, saat: Math.round(saat), model,
             yildizOyun,
             kalan: +w.timeLeft.toFixed(1), eaten: w.eaten, total: w.total,
             state: w.state, kare, gl: window.fruitHoleGl().logged };
  }, [lv, FPS, KAT]);
  await ctx.close();
  // Pay, **oyunun kullandığı** bölenle hesaplanıyor.
  //
  // Burada başlangıç saati bölen alınıyordu ve rush bölümünde saçmalıyordu:
  // orada saat 12 saniyede başlayıp her meyveyle doluyor, yani kalan saat
  // başlangıçtan büyük olabiliyor ve tablo "%184" yazıyordu. Oyun o bölümde
  // tavana bölüyor (`RUSH_CAP`), ölçüm başlangıca — iki ayrı birim.
  //
  // Bulmacada saat yok (9999), rush'ta oranın karşılığı burada yok: ikisinde
  // de pay boş bırakılıp **oyunun kendi yıldızı** yazılıyor.
  const saatsiz = o.mission === 'puzzle' || o.mission === 'rush';
  // `--kat` modunda bölen **verilen** saat, `timeFull` değil.
  //
  // `fruitHoleGiveTime` saati düşürüyor ama `timeFull`'u düşürmüyor:
  // `Math.max(timeFull, s)` yazıyor ve bu bilerek öyle (hook'un işi "bol
  // saatle süpürtüp süre tutmak"). Yani deneme modunda oyunun yıldız böleni
  // hâlâ eski, bol saat; oranı ona bölmek denemenin ölçtüğü şeyi yok eder —
  // kat sayısını kıstığın hâlde pay değişmemiş görünür.
  const bolen = KAT ? o.saat
    : (o.yildizOyun && o.yildizOyun.verilen > 1 ? o.yildizOyun.verilen : o.saat);
  const pay = saatsiz ? null : o.kalan / Math.max(1, bolen);
  const yildiz = pay != null ? (pay >= 0.45 ? 3 : pay >= 0.2 ? 2 : 1)
    : (o.yildizOyun ? o.yildizOyun.yildiz : '-');
  satir.push({ lv, ...o, pay, yildiz, saatsiz });
  // Modelin tahmini ile botun gerçek süresi: oran, modelin ne kadar
  // şişirdiğini söylüyor.
  const gercek = o.saatsiz ? null : +(o.saat - o.kalan).toFixed(1);
  o.gercek = gercek; o.oran = gercek == null ? null : +(gercek / o.model.sweep).toFixed(2);
  o.doluOran = +(o.model.doluAlan / o.model.alan).toFixed(2);
  console.log(`  ${String(lv).padStart(3)}  ${o.kind.padEnd(9)} ${String(o.mission || '-').padEnd(7)} ` +
    `${String(o.parca).padStart(5)} ${String(o.saat).padStart(5)} ` +
    `${String(o.eaten).padStart(6)} ${String(o.kalan).padStart(6)} ` +
    `${(pay == null ? '  -  ' : ('%' + Math.round(pay * 100)).padStart(5))} ` +
    `${String(yildiz).padStart(6)}  ${o.state}${o.gl ? ' GL!' : ''}` +
    `  ${o.model.dal.padEnd(8)} model ${String(o.model.sweep).padStart(5)}sn · ` +
    `bot/model ${String(o.oran ?? '-').padStart(5)} · dolu %${Math.round(o.doluOran * 100)}`);
}

const fails = [];
const check = (ok, ne, ek = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ne}${ek ? '   ' + ek : ''}`);
  if (!ok) fails.push(`${ne} ${ek}`);
};
console.log('');

// Bağlam kaybı olan koşular ölçüm değil.
const gecerli = satir.filter(r => !r.gl && !r.saatsiz);
check(gecerli.length >= satir.length * 0.7, 'ölçülebilen bölüm yeterli',
  `${gecerli.length}/${satir.length}`);

// Bot bölümü bitirebiliyor mu? Bitiremediği bir bölümde kalan saat sıfır
// olur ve "pay" bir şey söylemez — ama bitmemesi de ayrı bir haber.
const bitmeyen = gecerli.filter(r => r.state !== 'won');
// Bitirilebilirlik: bu kapı bolluk sorusundan bağımsız ve asıl olan.
// Bot kusursuz değil, yani birkaç bölümü kaçırması hata değil; çoğunu
// kaçırması saatin kısaldığının ilk işareti olur.
check(gecerli.length > 0 && bitmeyen.length <= Math.ceil(gecerli.length * 0.1),
  'bot bölümleri bitirebiliyor',
  `${gecerli.length - bitmeyen.length}/${gecerli.length}` +
  (bitmeyen.length ? ' · bitmeyen: ' + bitmeyen.map(r => `${r.lv}(${r.eaten}/${r.total})`).join(' ') : ''));

const bitti = gecerli.filter(r => r.state === 'won');
const paylar = bitti.map(r => r.pay).sort((a, b) => a - b);
if (paylar.length) {
  const ort = paylar.reduce((a, b) => a + b, 0) / paylar.length;
  const ortanca = paylar[Math.floor(paylar.length / 2)];
  console.log(`  kalan pay: en az %${Math.round(paylar[0] * 100)}, ` +
    `ortanca %${Math.round(ortanca * 100)}, ` +
    `en çok %${Math.round(paylar[paylar.length - 1] * 100)}, ` +
    `ortalama %${Math.round(ort * 100)}`);
  const ucYildiz = bitti.filter(r => r.pay >= 0.45);
  console.log(`  üç yıldız alan: ${ucYildiz.length}/${bitti.length} — ` +
    ucYildiz.map(r => `${r.lv}:%${Math.round(r.pay * 100)}`).join(' '));
}

// ## Eşik
//
// Sözün kendisi: *"kusursuz bir koşuda saatin üçte biri kalır."* Bot
// kusursuz değil, yani payının bundan **yüksek** olması beklenmez;
// aranan şey yayılımın dar olması. Sınır ölçülerek kondu: ilk koşuda
// pay %6 ile %70 arasındaydı ve iki kümeye ayrılıyordu — yoğun tahtalar
// %6-35, seyrek tahtalar %45-70. İkinci küme "her koşu üç yıldız"
// demek, ve yıldız bu oyunda para: sandık, görev sayacı, başarım.
//
// Kapı iki şey söylüyor:
//   - hiçbir sıradan bölümde bot üç yıldız almamalı (bot kusursuz değil;
//     alırsa o bölümde saat kimseyi zorlamıyor)
//   - yayılım iki katı geçmemeli (en çok pay, en az payın)
//
// İkincisi tek başına yetmiyordu: hepsi birden bollaşırsa yayılım dar
// kalır ve oyun yine kolaylaşır.
const UC_YILDIZ = 0.45;
const siradan = bitti.filter(r => !r.mission && r.kind === 'ızgara');
if (siradan.length) {
  const bol = siradan.filter(r => r.pay >= UC_YILDIZ);
  check(bol.length === 0, 'sıradan bölümde bot üç yıldız almıyor',
    bol.length ? `${bol.length}/${siradan.length} bölüm: ` +
                 bol.map(r => `${r.lv}:%${Math.round(r.pay * 100)}`).join(' ')
               : `en yüksek pay %${Math.round(Math.max(...siradan.map(r => r.pay)) * 100)}`);
  if (bol.length) {
    // Düşen bu satır bir bozukluk değil, **verilmemiş bir karar**. Okuyan
    // kişi bunu bilmezse ya görmezden gelir ya da olmayan bir hatayı arar.
    const ort = siradan.reduce((a, r) => a + r.pay, 0) / siradan.length;
    console.log('       ^ bu kırmızı bir arıza değil, verilmemiş bir karar:');
    console.log(`         saat botun işinin ${(1 / (1 - ort)).toFixed(1)} katı, ` +
      `yani her bölüm üç yıldız ve "+15 saniye" ödüllü reklamı hiç çıkmıyor.`);
    console.log('         düzeltmesi kat sayılarını kısmak (süpürme 2.6, kart 2.8) ve');
    console.log('         bu, canlı bir oyunu herkes için zorlaştırmak demek — Kaan\'ın kararı.');
  }
  const en = Math.max(...siradan.map(r => r.pay)), az = Math.min(...siradan.map(r => r.pay));
  check(en <= az * 2 + 0.12, 'sıradan bölümlerin kalan payı birbirine yakın',
    `%${Math.round(az * 100)} – %${Math.round(en * 100)}`);
}
// Oyunun verdiği yıldız ile saatin söylediği yıldız aynı mı?
//
// Ölçümün kendi hesabı (`kalan / verilen`) ile oyunun `liveStars()`ı
// ayrılabiliyor, ve bir kez ayrıldı: bölen koşu boyunca küçülen
// `levelTime()`dı, yani bölümü bitirdiğin an en küçük hâline bölünüyordu.
// Kartlı bölümlerde oran %63 yerine %458 çıkıyor ve her bölüm üç yıldız
// oluyordu — HUD'da koşu boyunca görünen yıldız da aynı sebeple şişiyordu.
//
// Bu kapı o ayrılmayı ölçüyor: oyunun yıldızı, verilen saate göre
// hesaplanan yıldızla aynı olmalı. Rush ve bulmaca dışarıda — ikisinin
// yıldızı saatten okunmuyor (biri tavana, öteki deneme sayısına göre).
{
  // `--kat` denemesinde bu kapı kapalı: oyunun yıldızı eski `timeFull`'a
  // bölünüyor (yukarıda yazılı), yani ölçümün hesabıyla ayrılması beklenen
  // bir şey — hata değil, denemenin kendisi.
  const saatli = KAT ? []
    : bitti.filter(r => r.yildizOyun && !['rush', 'puzzle'].includes(r.mission));
  const ayrilan = saatli.filter(r => {
    const o = r.yildizOyun.kalan / Math.max(1, r.yildizOyun.verilen);
    const bizim = o >= 0.45 ? 3 : o >= 0.2 ? 2 : 1;
    return bizim !== r.yildizOyun.yildiz;
  });
  if (KAT) console.log('  --   oyunun yıldız kapısı deneme modunda kapalı (bkz. bölen notu)');
  else check(saatli.length > 0 && ayrilan.length === 0,
    'oyunun yıldızı verilen saate göre',
    ayrilan.length
      ? ayrilan.slice(0, 6).map(r => `${r.lv}: oyun ${r.yildizOyun.yildiz}, ` +
          `saat ${(r.yildizOyun.kalan / r.yildizOyun.verilen * 100).toFixed(0)}% ` +
          `(bölen ${r.yildizOyun.verilen} yerine ${r.yildizOyun.model} olsa ` +
          `${(r.yildizOyun.kalan / Math.max(1, r.yildizOyun.model) * 100).toFixed(0)}%)`).join(' · ')
      : `${saatli.length} bölüm`);
}

// Ödüllü reklam ne sıklıkta teklif ediliyor?
//
// "+15 saniye" ancak **kaybedince** teklif ediliyor (`revive`, bölüm başına
// bir kez). Yani saatin bolluğu yalnızca yıldızı değil, oyunun tek ödüllü
// reklam yerini de etkiliyor: kimse kaybetmiyorsa o reklam hiç gösterilmiyor
// ve yazılmış bir özellik ölü duruyor.
//
// Kapı değil, karar için bir sayı: kat sayısı kısılırsa bu oran yükselir.
{
  const kaybeden = gecerli.filter(r => r.state === 'lost');
  console.log(`  ödüllü "+15 saniye" teklifi: ${kaybeden.length}/${gecerli.length} bölümde ` +
    `(yalnızca kaybedince çıkıyor)` +
    (kaybeden.length ? ' — ' + kaybeden.map(r => r.lv).join(' ') : ''));
}

// Saat hangi daldan geliyor? — dört dal var ve hangisinin çalıştığı
// sanıldığı gibi değil.
//
// `levelTime`in yorumu süpürme dalını varsayılan, kart dalını özel durum
// gibi anlatıyor. Ölçüldü ve tam tersi: kartlar **her** uygun ızgara
// tahtasına konuyor (`pickCards`, bölüm şartı yok — yalnızca günlük koşu,
// görev, resim, şerit ve bulmaca dışarıda), yani sıradan bir ızgara
// bölümünün saatini kart turu veriyor. Süpürme dalı resim tahtalarında ve
// mayın görevinde çalışıyor.
//
// Bu satır o yüzden var: bir gün biri karta bölüm şartı koyarsa (ya da
// kaldırırsa) bölümlerin saati sessizce başka bir formüle geçer, ve 2.6
// kat sayısı tekrar önem kazanır. Dağılım yazılıyor, ve "sıradan ızgara
// bölümü kart dalında" iddiası kapı.
{
  const dallar = {};
  for (const r of satir) if (r.model) dallar[r.model.dal] = (dallar[r.model.dal] || 0) + 1;
  console.log('  saat dalları: ' + Object.entries(dallar).map(([k, v]) => `${k} ${v}`).join(' · '));
  const izgara = satir.filter(r => r.kind === 'ızgara' && !r.mission && r.model);
  const kartsiz = izgara.filter(r => r.model.dal !== 'kart');
  check(izgara.length > 0 && kartsiz.length === 0,
    'sıradan ızgara bölümünün saati kart turundan geliyor',
    kartsiz.length ? kartsiz.map(r => `${r.lv}:${r.model.dal}`).join(' ')
                   : `${izgara.length} bölüm`);
}

// Görev bölümleri ayrı: saatleri başka formülden geliyor ve her biri
// kendi ölçümüne sahip (holeorder, holeorderplay, holemayin). Burada
// yalnızca yazılıyor, kapı kurulmuyor.
const gorevli = bitti.filter(r => r.mission);
if (gorevli.length) {
  console.log('  görev bölümleri (kapı yok, kendi ölçümleri var): ' +
    gorevli.map(r => `${r.lv}/${r.mission}:%${Math.round(r.pay * 100)}`).join(' '));
}

console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
process.exitCode = fails.length ? 1 : 0;
await br.close(); srv.close();
