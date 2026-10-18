// Fabrikanın son kaplaması (altın) gerçekten görülüyor mu?
//
//   node build-www.mjs && node scratchpad/tydonanim.mjs
//   node scratchpad/tydonanim.mjs 150 30    # 150 devir: tavanın yeri
//   node scratchpad/tydonanim.mjs 20 180    # uzun şubeler, aynı soru
//
// ## Neden var
//
// İstasyonun görünüşü kilometre taşlarıyla değişiyor: beş kaplama — demir,
// çelik, cilalı çelik, krom, **altın** (`TIERS`, `tierOf`). Taşlar 10, 25,
// 50, 100, 200, 350, 500, 750, 1000.
//
// Kodun yanındaki yorum bir iddiaydı: *"the last one is where a long-running
// branch ends up rather than a place nobody sees."* O cümleyi hiçbir ölçüm
// denetlemiyordu, ve bu depoda aynı cins cümle iki kez yanlış çıktı
// (README'nin "seviyeler 38/37/38/37" satırı, `levelTime`in "üçte biri
// artar" sözü). Üçüncüsü de bu oldu: kural "her iki taşta bir" iken altın
// **750. seviyeyi** istiyordu ve buranın ölçtüğü tavan 410.
//
// Ucuz bir hata değil: `tykademe` **araç** kademelerinde tam bunu buldu —
// beş modelin ikisi ölü içerikti, çünkü kapıyı tutan istasyon hiç
// yükseltilmiyordu, ve eşikler ölçülen erişime çekildi (220/400 → 175/240).
// Kaplamalarda aynısı yapıldı: `TIER_AT` artık 0/2/4/5/6 taş, yani altın
// 350. seviyede. Bu betik o kararın kapısı.
//
// ## Ölçülen şey
//
// README'nin tarif ettiği oyuncu: yirmi saniyede bir darboğazı alıyor,
// müdürleri alıyor, devir açılınca devrediyor ve puanlarını hatta
// harcıyor. Her devirden sonra dört istasyonun taş sayısı ve kaplaması
// okunuyor — kaplama adı dahil **oyundan** (`jeDonanim`), kural burada
// ikinci kez yazılmıyor.
//
// Kaplama **tur içinde de** okunuyor, yalnızca devir sonunda değil. İlk
// yazılışı devir sonunu örnekliyordu ve "görülen kaplamalar: cilalı çelik"
// diyordu — oysa demir ile çelik her devrin ilk dakikalarında ekranda:
// ölçüm örnekleme deliğini oyunun eksiği diye yazıyordu. Kendi ölçtüğü şeyi
// ölçen bir ölçüm, bu depoda tanıdık bir hata.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) {
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } else { r.writeHead(404); r.end('no'); }
}).listen(8622);

// Varsayılan 40 devir. Altın 9. devirde çıkıyor ve bu sayı koşudan koşuya
// oynamıyor — üç koşu birebir aynı tabloyu verdi, çünkü oyundaki rastgele
// olan şey müşteriler ve onlar seviyeye ölçülebilir bir şey katmıyor. Yani
// paya gerek bırakan şey gürültü değil: on devirde kapı **tam sınırında**
// geçerdi (9/10), ve dengeye dokunan küçük bir değişiklik onu kendi
// anlamıyla ilgisiz bir yerden düşürürdü. Kırk devir, dört katı pay, ve
// dört koşu birden 18 saniye (çizim kapalı, benzetim doğrudan).
const DEVIR = Number(process.argv[2] || 40);
const DAKIKA = Number(process.argv[3] || 30);
// Dört oyuncu, çünkü "ölü içerik mi" sorusunun cevabı oyuncuya göre
// değişiyor ve bu oyunda bir kez değişti bile (`tykademe`):
//
//   darbogaz   yalnızca darboğazı alıyor, puanı hatta yatırıyor
//   uyari      ekrandaki "kademeyi bekletiyor" uyarısını da okuyor
//   uzun       tek şube, hiç devretmiyor — "uzun koşan şube" iddiası
//   arastirma  araştırma ağacının tavanlarını dolduruyor, kalanı hatta
//
// Sonuncusu önemli: `tas` araştırmasının yanında "geç oyunun seviyeyi
// yeniden ilerletebilen tek kolu" yazıyor ve ilk yazılışımda benzetimdeki
// oyuncu o kolu hiç çekmiyordu. Çektiğinde tavan 253'ten 410'a çıktı —
// yani "altın ölü içerik" demeden önce düzeltilmesi gereken şey ölçümün
// kendisiydi.

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const hata = [];
pg.on('pageerror', e => hata.push(String(e).split('\n')[0]));
await pg.goto('http://localhost:8622/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 30000 });
// Çizim kapalı: ölçülen şey ekonominin nereye vardığı, ekrandaki fabrika
// değil. `jeRun` benzetimi doğrudan ilerletiyor.
await pg.evaluate(() => window.jeDrawOff(true));
await pg.evaluate(() => window.jeAutoCarry(true));

console.log(`\n${DEVIR} devir × ${DAKIKA} dakika — oyuncu darboğazı alıyor, açılınca devrediyor\n`);
console.log('  devir | seviyeler              | taş       | kaplamalar');
console.log('  ------+------------------------+-----------+---------------------------');

const kosu = (kural) => pg.evaluate(async ({ devir, dakika, kural }) => {
  window.jeWipeProgress();
  window.jeTutSkip();
  const AD = ['Foundry', 'Stamping', 'Assembly', 'Dispatch'];
  const out = [];
  // Tur içinde görülen kaplamalar: demir ile çelik her devrin ilk
  // dakikalarında ekranda ve devir sonu örneklemesi onları kaçırıyor.
  const gorulen = new Map();
  const bak = () => {
    for (const d of window.jeDonanim())
      if (!gorulen.has(d.ad)) gorulen.set(d.ad, d.kademe);
  };
  const oyna = (dk) => {
    for (let sn = 0; sn < dk * 3; sn++) {              // 20 saniyelik turlar
      window.jeRun(20);
      for (let i = 0; i < 4; i++) window.jeBuyManager(i);
      const p = window.jeProbe();
      const neck = AD.indexOf(p.neck);
      if (kural !== 'uyari') {
        if (neck >= 0) window.jeBuy(neck, 'max');
      } else {
        // Ekranda iki uyarı var ve oyuncu ikisini de görüyor: DARBOĞAZ, ve
        // "kademeyi bekletiyor". Para ikisine bölünüyor — `tykademe`'deki
        // oyuncunun aynısı.
        const tutan = window.jeTier().tutan.filter(i => i !== neck);
        if (tutan.length && sn % 2 === 0) window.jeBuy(tutan[0], 'max');
        else if (neck >= 0) window.jeBuy(neck, 'max');
      }
      if (sn % 9 === 0) bak();
    }
  };
  const kaydet = (t) => {
    const p = window.jeProbe();
    bak();
    out.push({ tur: t, lvl: [...p.lvl], donanim: window.jeDonanim(),
               puan: p.points, urun: p.product });
  };
  // Puanlar harcanmazsa devir bir şey vermiyor ve ölçüm oyuncunun
  // yapmadığı bir şeyi ölçmüş olurdu. **Nereye** harcandığı ise sorunun
  // kendisi: `tas` araştırmasının yanındaki yorum "geç oyunun seviyeyi
  // yeniden ilerletebilen tek kolu" diyor, ve hepsini hatta yatıran bir
  // oyuncu o kolu hiç çekmiyor.
  const harca = () => {
    if (kural === 'arastirma') {
      // Tavanı olan ne varsa dolduruluyor, kalan hatta. Liste oyundan
      // okunuyor: bir araştırma eklenirse ölçüm onu kendiliğinden alır.
      for (const id of Object.keys(window.jeRes().lvl))
        if (id !== 'line') window.jeResBuy(id, 100);
    }
    window.jeResBuy('line', 10000);
  };
  if (kural === 'uzun') {
    // Tek şube, devirsiz: kodun iddiası "uzun koşan bir şube"ye dayanıyor,
    // yani aynı toplam süre devirlere bölünmeden harcanırsa ne oluyor.
    for (let b = 1; b <= devir; b++) { oyna(dakika); kaydet(b); }
  } else {
    for (let t = 1; t <= devir; t++) {
      oyna(dakika);
      kaydet(t);
      window.jePrestige();
      harca();
    }
  }
  return { out, gorulen: [...gorulen.entries()] };
}, { devir: DEVIR, dakika: DAKIKA, kural });

const r1 = await kosu('darbogaz');
const r2 = await kosu('uyari');
const r3 = await kosu('uzun');
const r4 = await kosu('arastirma');
const satir = r1.out, satir2 = r2.out, satir3 = r3.out, satir4 = r4.out;
const resSon = await pg.evaluate(() => window.jeRes().lvl);

const tablo = (baslik, satirlar, sutun) => {
  console.log(`\n  ${baslik}`);
  console.log(`  ${sutun} | seviyeler              | taş       | kaplamalar`);
  console.log('  ------+------------------------+-----------+---------------------------');
  for (const k of satirlar) {
    console.log(`  ${String(k.tur).padStart(5)} | ${JSON.stringify(k.lvl).padEnd(22)} | ` +
      `${k.donanim.map(d => d.tas).join('/').padEnd(9)} | ` +
      k.donanim.map(d => d.ad).join(', '));
  }
};
tablo('darboğazı alan oyuncu, puanı hatta harcıyor:', satir, 'devir');
tablo('uyarıyı da okuyan oyuncu:', satir2, 'devir');
tablo(`tek şube, devirsiz (${DAKIKA} dakikada bir okunuyor):`, satir3, ' dk×');
tablo('araştırma ağacını dolduran oyuncu (önce tavanlar, kalanı hatta):',
  satir4, 'devir');
console.log(`  son araştırma: ` +
  Object.entries(resSon).map(([k, v]) => `${k} ${v}`).join(' · '));

const fails = [];
const check = (ok, ne, ek = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ne}${ek ? '   ' + ek : ''}`);
  if (!ok) fails.push(`${ne} ${ek}`);
};
console.log('');

// Kaplama adları dört koşunun **tur içi** okumalarından geliyor: devir sonu
// örneklemesi demiri ve çeliği kaçırıyordu.
const gorulen = new Map([...r1.gorulen, ...r2.gorulen, ...r3.gorulen, ...r4.gorulen]);
const enYuksekKademe = Math.max(...gorulen.values());
const enYuksekSeviye = Math.max(...[...satir, ...satir2, ...satir3, ...satir4]
  .flatMap(k => k.lvl));
const kaplamaAdlari = await pg.evaluate(() => window.jeKaplamalar());
const kaplamaSayisi = kaplamaAdlari.length;
const tasListesi = await pg.evaluate(() => window.jeTaslar());
console.log(`  görülen kaplamalar: ${[...gorulen.keys()].join(', ')} ` +
  `(${gorulen.size} / ${kaplamaSayisi})`);
console.log(`  en yüksek istasyon seviyesi: ${enYuksekSeviye} · ` +
  `kilometre taşları ${tasListesi.join(', ')}`);
console.log(`  dört koşunun toplamı: ${DEVIR * DAKIKA * 4} benzetim dakikası`);

// ## Kapılar
//
// Dördü de ölçülerek kuruldu, ve hepsi bir kez **hata geri konarak**
// koşturuldu: `tierOf` eski haline ("her iki taşta bir") döndürülünce
// birinci kapı düşüyor, altın dört koşunun hiçbirinde çıkmıyor.
//
//   1. **Beş kaplamanın beşi de görülüyor.** Hiçbiri ölü içerik değil.
//      Altın 9. devirde çıkıyor, kapı 40 devirde bakıyor.
//   2. **Altını araştırma açıyor.** Yalnızca hatta yatıran oyuncu (ilk iki
//      koşu) altını görmüyor. Görseydi eşik ucuzlamış olurdu: `tas`
//      kolunun karşılığı tam olarak bu. Bu kapı ters yönden koruyor —
//      birincisi "ulaşılamaz mı", bu "bedava mı" diye soruyor.
//   3. **Devir ilerletiyor.** Son devir ilkinden yüksek: `branchMult`
//      ölürse bu düşer, ve README'nin "şube 2 şube 1'in geçtiği yerin
//      ötesine geçiyor" cümlesi ölçülmeden duruyordu.
//   4. Sayfa hatası yok.
//
// Kurulmayan kapı: *"tavan şu seviyede."* 40 devir 391 dedi, 150 devir 410,
// 20 devir × 3 saatlik şube 403 ve bu sayıya bir eşik koymak, dengeye dokunan her değişikliği
// kırmızıya çeviren bir bekçi kurmak olurdu. Tavan **tabloya** yazılıyor.
const ilkSon = [satir[0], satir2[0]].map(k => Math.max(...k.lvl));
const sonSon = [satir[satir.length - 1], satir2[satir2.length - 1]]
  .map(k => Math.max(...k.lvl));
const hatKademe = Math.max(...[...r1.gorulen, ...r2.gorulen].map(([, k]) => k));
check(gorulen.size === kaplamaSayisi, 'beş kaplamanın beşi de görülüyor',
  `görülen ${gorulen.size} / ${kaplamaSayisi}: ${[...gorulen.keys()].join(', ')}`);
check(hatKademe < kaplamaSayisi - 1, 'altını araştırma açıyor',
  `yalnızca hatta yatıran oyuncu kademe ${hatKademe}'de kalıyor`);
check(sonSon[0] > ilkSon[0] && sonSon[1] > ilkSon[1], 'devir ilerletiyor',
  `ilk devir ${ilkSon.join('/')} → son devir ${sonSon.join('/')}`);
check(hata.length === 0, 'sayfa hatası yok', hata[0] || '');

// Kapı değil, bulgu: son iki kaplamaya ne kadar kaldı.
const eksik = kaplamaSayisi - 1 - enYuksekKademe;
// Bir kademeye girmek için gereken seviye: `tierOf` iki taşta bir
// ilerliyor, yani k. kaplama 2k. taşın seviyesinde başlıyor.
const kademeSeviyesi = k => tasListesi[2 * k - 1];
console.log(`  --   en yüksek kaplama: ${[...gorulen.keys()].pop()} ` +
  `(kademe ${enYuksekKademe} / ${kaplamaSayisi - 1})` +
  (eksik > 0 ? ` — üstündeki ${eksik} kaplama bu sürede görülmedi: ` +
    Array.from({ length: eksik }, (_, j) => enYuksekKademe + 1 + j)
      .map(k => `${kaplamaAdlari[k]} ${kademeSeviyesi(k)}. seviye`).join(', ')
    : ''));

console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
process.exitCode = fails.length ? 1 : 0;
await br.close(); srv.close();
