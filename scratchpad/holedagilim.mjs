// Oyun tahtayı tasarımına göre mi dağıtıyor, yoksa bir köşeye mi yığıyor?
//
// Kaan 22. bölümden ekran görüntüsü attı ve tahtanın sol alt köşesini daire
// içine aldı: orada parçalar birbirinin içine girmiş bir yığın, ekranın geri
// kalanı boş çimen. "Hep hepsini bir kenara yığıyorsun."
//
// ## Bu ölçüm bir kez yanlış şeyi ölçtü
//
// İlk hâli tahtanın **düzgün** dağılmasını bekliyordu: tahta 3x5 bloğa
// bölünüyor, bir blok dengeli payın 2.5 katını taşıyorsa yığın sayılıyordu.
// Elli beş desenin altısı düşüyordu — Pyramid (3.4x), Island (3.3x),
// Circuit (2.9x), Bubbles (3.5x), Checkers (3.9x), Blast (2.9x).
//
// Altısı da **siluetli** desen. Pyramid bir kademeli piramit: karşı ucu
// tanımı gereği boş, kütlesi tanımı gereki tabanda. Bubbles öbek öbek. O
// tahtaların boş köşesi bir kusur değil, şeklin kendisi — ve ölçüm onları
// "dengesiz" diye işaretlediği sürece, Kaan'ın gördüğü gerçek yığını da
// aynı listede saklıyordu. Altı satır FAIL yazan bir ölçüm, bir satır daha
// FAIL yazdığında kimsenin dikkatini çekmiyor.
//
// Eşiği yükseltmek de çözüm değildi: Checkers 3.9x ile geçsin diye sınırı
// 4'e çekmek, gerçek bir yığının da altına girmesi demek.
//
// ## Şimdi baktığı şey
//
// Tasarım ile olan, yan yana. İki soru ayrıldı:
//
//   - "şekil nerede" — desenin siluetinin söylediği şey (`fruitHoleDesignCells`)
//   - "oyun o şeklin üstüne ne koydu" — dolgu biçimi, taban iri payı, kaya,
//     dev, nesne (`fruitHoleBoardCells`)
//
// Kütle ekran alanı olarak sayılıyor (parçanın yarıçapı karesi — Kaan'ın
// şikâyeti görsel, ve bir iri meyve dört küçüğün yerini kaplıyor).
//
// Bu ayrımın kendisi işe yaradı: siluetli desenler artık haksız yere
// işaretlenmiyor. Ama bir **yığın eşiği** vermedi, ve neden vermediği
// aşağıda ölçülerek yazılı — üç ayrı istatistik denendi. Dosyanın kapısı
// bu yüzden daha dar bir şey söylüyor: tasarımın doldurduğu bir blok
// oyunda boş kalmasın.
//
//   node build-www.mjs && node scratchpad/holedagilim.mjs
//   node scratchpad/holedagilim.mjs bosalt   # kapıyı sahte boşaltmayla dene
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
// ## Neyin eşiği var, neyin yok
//
// Bu dosyada **bir** kapı var ve o kapı "yığın" değil: tasarımın doldurduğu
// bir bloğun oyunda boşalması. Yığın için eşik aranırken üç istatistik
// denendi ve üçü de ölçülüp bırakıldı — hepsi burada yazılı, çünkü
// denenmemiş gibi yeniden denenmesinler:
//
//   1. **Düzgünlük** (eski hâli): en dolu blok dengeli payın kaç katı.
//      Elli beş desenin altısı düşüyordu ve altısı da siluet — Pyramid'in
//      tepesi tanımı gereği boş. Ölçtüğü şey tasarımdı, hata değil.
//   2. **Pay farkı** (tasarımın payı ile olanın payı arasındaki puan farkı,
//      ve toplamı `tv`). Ölçüldü: temiz tahtalarda tv %5 ile %55 arasında.
//      Yani oyun tasarımın dediği yerden kütlenin yarısını zaten taşıyor —
//      kaya alıyor, dev birleştiriyor, dolgu biçimi seyreltiyor. Dörtte bir
//      kütleyi bir köşeye yığmak bu aralığın içinde kalıyor.
//   3. **Tasarıma göre yoğunluk** (olanın yoğunluğu / tasarımın yoğunluğu).
//      Dağılım güzel toplandı (0.85 – 2.33) ama sahte yığınla denenince kör
//      çıktı: kırk dokuz tahtanın otuz biri, kütlesinin dörtte biri bir
//      bloğa yığıldığı hâlde geçti. Sebebi istatistiğin kendisi — en dolu
//      bloğa bakıyor, ve yığın **ikinci** bir tepe yaptığında en dolu blok
//      değişmiyor.
//
// Üçünün ortak cevabı şu: desenin siluetı, oynanan tahtanın kütlesini ±20
// puandan daha iyi tahmin etmiyor. Bu oyunda tasarım bir taslak, tahtayı
// kuran şey onun üstündeki beş katman. O yüzden "tasarıma uy" diye bir kapı
// kurulamıyor — kurulsa ya hiçbir şeyi yakalamaz ya her şeyi yakalar.
//
// Kalan iki şey yapılıyor ve ikisi de işe yarıyor:
//
//   - Sayılar **tabloya** yazılıyor (tasarımın yoğunluğu, olanın yoğunluğu,
//     oran, blok blok pay farkı). Bir değişiklikten önce ve sonra
//     karşılaştırmak için — `placeBombs`'un iri öbek tohumu bu tabloyla
//     değerlendirildi (dengesiz tahta 28'den 35'e çıkmıştı, geri alındı).
//   - **Boşalan blok** bir kapı, çünkü iddiası dar: tasarımın kayda değer
//     doldurduğu bir blokta oyunda o payın onda biri bile yoksa, şeklin bir
//     parçası ekranda yok demektir. Bugün otuz dört ızgara tahtasının
//     hiçbirinde olmuyor, ve `bosalt` modu kapının kör olmadığını söylüyor
//     (49/49 yakalıyor).
//
// Ölçüm yalnızca **ızgara** tahtalara bakıyor. Resim, şerit ve bulmaca
// tahtalarını desenin siluetı kurmuyor; orada "tasarıma uydu mu" diye
// sormanın muhatabı yok. Bu satır bir kez eksikti ve ölçüm olmayan dört
// hata uydurdu (36. bölüm bir şerit tahtası, 23. ve 53. resim).
//
// `bosalt` modu bu kapıyı sınıyor: tasarımın en dolu bloğu ölçümde
// boşaltılıyor ve her tahtanın düşmesi bekleniyor.
const BOSALT = process.argv[2] === 'bosalt';
// Tablodaki `kat` sütunu için bir sınır değil, bir işaret: üstünde kalanlara
// gözle bakılsın diye. Kapı değil (yukarıdaki 3. madde).
//
// Ölçülen aralık, otuz dört ızgara tahtası × üç tohum: 0.86 – 1.75. Yani
// oyun tahtayı tasarımının yoğunluğunda kuruyor; işaret bugün hiç yanmıyor
// ve yanarsa bakılacak bir şey var demektir.
const ISARET = 2.0;
const BOS_ESIK = 1;

const fails = [];
const hepsiOran = [];
console.log(`\n  blm  düzen        biçim   alan  tsrm  olan    kat  boş  blok pay farkı (puan)`);
console.log('  ----+-------------+-----+--------+--------+--------+---------------');

const TOHUM = [5301, 777, 90210];
for (let lv = 1; lv <= 55; lv++) {
  const koşular = [];
  for (const tohum of TOHUM) {
    const o = await pg.evaluate(([l, t, kol, sat, bosalt]) => {
      window.fruitHoleSeedField(t);
      const p = window.fruitHoleProbe(l);
      window.fruitHoleStartLevel();
      const b = window.fruitHoleBoardCells();
      const d = window.fruitHoleDesignCells();
      const ad = window.fruitHoleLevelName();
      window.fruitHoleUnseedField();
      // Siluet kullanılmayan tahtalarda ölçüm atlıyor.
      //
      // Kutupsal desenler hücre ızgarasında kurulmuyor; resim ve şerit
      // tahtalarını haritaları kuruyor (hook o ikisinde de null veriyor).
      // Bulmaca tahtası siluetı kullanıyor ama sonra taş duvarlarla odalara
      // bölünüyor ve odaların dışındaki parçalar kalkıyor — orada tahtanın
      // düzenini veren şey desen değil odalar, yani "tasarıma uydu mu"
      // sorusunun muhatabı yok. (18. bölüm bu yüzden işaretleniyordu:
      // tahtanın sağ üçte biri duvar, siluet ise orayı doldurmuş.)
      if (!d) return { ad, kind: p.kind, atla: p.kind === 'ızgara' ? 'siluetsiz' : p.kind };
      if (p.mission === 'puzzle') return { ad, kind: p.kind, atla: 'bulmaca' };
      const blok = (r, c) => Math.min(sat - 1, Math.floor(r / (b.rows / sat))) * kol
                           + Math.min(kol - 1, Math.floor(c / (b.cols / kol)));
      const ger = new Array(kol * sat).fill(0);
      const tas = new Array(kol * sat).fill(0);
      // En küçük meyvenin yarıçapı: alan bu birimle sayılıyor, yani bir
      // küçük meyve 1, iki katı boyunda bir iri 4.
      const R0 = 0.46;
      for (const h of b.hucre) {
        if (h.bomb) continue;
        ger[blok(h.r, h.c)] += h.kat * Math.pow((h.yari || R0) / R0, 2);
      }
      // Kayalar da ekrandaki kütle.
      //
      // Sayılmadıkları sürece ölçüm kaya tarlasını "boş çimen" sanıyordu ve
      // on tahtada "tasarımın parçası ekranda yok" diyordu — oysa orada bir
      // şey var, meyve değil kaya. Siluetin bir bölgesinin kayaya dönmesi
      // tasarımın uygulanma biçimi; görünmeyen bir şey değil.
      for (const k of window.fruitHoleRocks().yerler) {
        const r = Math.round(k.z / b.cell + (b.rows - 1) / 2);
        const c = Math.round(k.x / b.cell + (b.cols - 1) / 2);
        ger[blok(Math.max(0, Math.min(b.rows - 1, r)),
                 Math.max(0, Math.min(b.cols - 1, c)))] += Math.pow(k.r / R0, 2);
      }
      for (const h of d.hucre) tas[blok(h.r, h.c)] += h.kat;
      // Sahte boşaltma: tasarımın en dolu bloğu **ölçümde** sıfırlanıyor,
      // oyunda değil. Rastgele değil, yani deneme koşudan koşuya aynı.
      if (bosalt) {
        let en = 0;
        for (let i = 1; i < tas.length; i++) if (tas[i] > tas[en]) en = i;
        ger[en] = 0;
      }
      return { ad, kind: p.kind, stil: window.fruitHoleLayout().secilen, ger, tas };
    }, [lv, tohum, KOL, SAT, BOSALT]);
    koşular.push(o);
  }
  if (koşular[0].atla) {
    console.log(`  --   ${String(lv).padStart(2)}  ${koşular[0].ad.padEnd(12)} ${koşular[0].atla}`);
    continue;
  }
  // Oran değil **pay** karşılaştırılıyor, ve sebebi ölçülerek görüldü.
  //
  // İlk hâli blok başına `olan / tasarım` oranını alıp en yükseğini
  // ortancaya bölüyordu. Kırk dokuz tahtanın otuz beşi düştü ve en yüksek
  // değer 161 katıydı — yani ölçüm eşik koyacak bir sayı vermiyordu.
  // Sebep bölen: tasarımın tek hücre koyduğu bir bloğa oyun bir dev
  // koyarsa (dev dört küçük meyve kadar yer kaplıyor) oran dokuz katı
  // çıkıyor, ve bu bir yığın değil bir devin boyu.
  //
  // Pay farkı o bölenden kurtuluyor: blok tahtanın kütlesinin yüzde kaçını
  // taşıyor, tasarım yüzde kaç demiş. Kaan'ın gördüğü şey tam olarak bu
  // cinsten — bir köşe ekrandaki kütlenin üçte birini taşıyor, oysa şekil
  // ona onda bir vermiş. Küçük bloklardaki büyük oranlar bu farkta birkaç
  // puan, bir yığın ise onlarca puan.
  let enKotu = null;
  for (const o of koşular) {
    const tg = o.ger.reduce((a, b) => a + b, 0), tt = o.tas.reduce((a, b) => a + b, 0);
    if (!tg || !tt) continue;
    // Yoğunluk, iki yakada **aynı** istatistikle: en dolu bloğun payı,
    // ortalama bloğun kaç katı. Tasarımın kendi yoğunluğu da ölçülüyor ve
    // bölen o — yani Pyramid'in kütlesini tabanda toplaması bir kusur
    // olarak sayılmıyor, çünkü tasarımı da aynı şeyi söylüyor. Kusur,
    // oyunun tasarımdan **daha** toplaması.
    const sayilan = o.tas.map((t, i) => i).filter(i => o.tas[i] > 0);
    const yog = (dizi) => {
      const v = sayilan.map(i => dizi[i]);
      const ort = v.reduce((a, b) => a + b, 0) / v.length;
      return ort > 0 ? Math.max(...v) / ort : 0;
    };
    const yogGer = yog(o.ger), yogTas = yog(o.tas);
    const kat = yogTas > 0 ? yogGer / yogTas : 0;
    const fark = o.tas.map((t, i) => (o.ger[i] / tg - t / tt) * 100);
    // İki sayı birden, çünkü biri tek başına eşik taşımıyor.
    //
    // `enSapan` en çok sapan **tek** bloğun puanı: hassas ama gürültülü —
    // on beş bloktan birinin birkaç puan kayması her tahtada oluyor.
    // `tv` sapmanın **toplamı** (pozitif farkların toplamı, yani kütlenin
    // yüzde kaçı tasarımın dediği yerden başka bir yerde): bir yığın bunu
    // tek başına yukarı çekiyor, çünkü yığına giden kütle bir yerden
    // geliyor ve o da aynı toplamda sayılıyor.
    const enYogun = Math.max(...fark.map(Math.abs));
    const tv = fark.filter(v => v > 0).reduce((a, b) => a + b, 0);
    // Boşalan blok: tasarımın **kayda değer** doldurduğu bir blokta oyunda
    // o payın onda biri bile yoksa, şeklin o parçası ekranda yok.
    //
    // İlk hâli "tasarım payının %10'undan çoğu" diyordu — mutlak bir eşik,
    // ve kendi denemesinde kör çıktı: tasarımın en dolu bloğu ölçümde
    // boşaltıldığında kırk dokuz tahtanın kırk beşi yine geçti. Sebep
    // bölüşme — on beş blok arasında eşit dağılan bir tasarımda en dolu
    // blok bile %7, yani eşiğin altında. Eşik, yakalaması gereken şeyin
    // yarısını tanımı gereği göremiyordu.
    //
    // Şimdi iki yan da **oransal**: blok dengeli payın yarısını almış mı
    // (yani tasarım orayı gerçekten doldurmuş mu), ve oyunda o payın onda
    // birinden azı mı kalmış. Ölçek düştüğünde ikisi birlikte düşüyor.
    const dengeli = 1 / sayilan.length;
    const bosalan = o.tas.filter((t, i) =>
      t / tt >= dengeli * 0.5 && o.ger[i] / tg < (t / tt) * 0.1).length;
    if (!enKotu || kat > enKotu.kat) {
      enKotu = { ad: o.ad, stil: o.stil, enYogun, tv, kat, yogGer, yogTas, bosalan, oranlar: fark,
                 alan: Math.round(tg), tasarim: tt };
    }
  }
  if (!enKotu) continue;
  hepsiOran.push({ lv, ad: enKotu.ad, v: enKotu.kat });
  const kotu = enKotu.bosalan >= BOS_ESIK;
  const isaretli = enKotu.kat > ISARET;
  if (kotu) {
    fails.push(`${lv}. bölüm (${enKotu.ad}, ${enKotu.stil}): tasarımın doldurduğu ` +
      `${enKotu.bosalan} blok oyunda boş (yoğunluk ${enKotu.yogTas.toFixed(1)} -> ` +
      `${enKotu.yogGer.toFixed(1)}, ${enKotu.kat.toFixed(2)} kat)`);
  }
  console.log(`  ${kotu ? 'FAIL' : isaretli ? 'bak ' : 'OK  '} ${String(lv).padStart(2)}  ${enKotu.ad.padEnd(12)} ` +
    `${enKotu.stil.padEnd(6)} ${String(enKotu.alan).padStart(4)}  ` +
    `${enKotu.yogTas.toFixed(1).padStart(4)}  ${enKotu.yogGer.toFixed(1).padStart(4)}  ` +
    `${enKotu.kat.toFixed(2).padStart(5)}x  ${String(enKotu.bosalan).padStart(3)}  ` +
    enKotu.oranlar.map(v => (v >= 0 ? '+' : '') + v.toFixed(0)).join(' '));
}

// Dağılım tabloya yazılıyor, kapıya değil: `kat` bir sınır değil işaret
// (yukarıdaki 3. madde — sahte yığınla denendi ve kör çıktı).
const sirali = [...hepsiOran].sort((a, b) => b.v - a.v);
console.log(`\n  kat dağılımı (${hepsiOran.length} tahta): ` +
  sirali.slice(0, 6).map(o => `${o.ad} ${o.v.toFixed(2)}`).join(', ') +
  ` … en düşük ${sirali[sirali.length - 1].v.toFixed(2)}`);
console.log(`  ${ISARET} üstündekiler "bak" ile işaretli — kapı değil`);

if (BOSALT) {
  // Sahte boşaltma modunda ölçümün kendisi sınanıyor: düşmesi gerekiyor.
  const gecen = hepsiOran.length - fails.length;
  console.log(`\nsahte boşaltma denemesi: ${fails.length}/${hepsiOran.length} tahta yakalandı`);
  console.log(gecen === 0
    ? 'ölçüm boşalmayı yakalıyor'
    : `ÖLÇÜM KÖR: ${gecen} tahtada tasarımın en dolu bloğu boş olduğu hâlde geçti`);
  process.exitCode = gecen === 0 ? 0 : 1;
} else {
  console.log('\n' + (fails.length
    ? `${fails.length} tahtada tasarımın bir parçası ekranda yok:\n - ` + fails.slice(0, 12).join('\n - ')
    : 'tasarımın doldurduğu hiçbir blok boş kalmıyor'));
  process.exitCode = fails.length ? 1 : 0;
}

await br.close(); srv.close();
