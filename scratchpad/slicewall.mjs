// Slice Rush kaçıncı bölümde yeni bir şey söylemeyi bırakıyor?
//
//   node build-www.mjs && node scratchpad/slicewall.mjs
//
// Neden var: bölüm üretimi sonsuz — buildCourse(n) her n için parkur
// kuruyor ve harita hep üç bölüm ileriyi gösteriyor. Ama ayarlar sonlu ve
// her biri bir yerde duruyor:
//
//   * yuva sayısı     — Math.min(24 + n * 2, 48)
//   * hız             — Math.min(8 + (n - 1) * 0.45, 15)
//   * parça havuzu    — en yüksek minLevel (oyundan okunuyor)
//   * karışım eğrisi  — `sertlik(n)`, başı ve sonu oyundan okunuyor
//
// Hepsi durduktan sonra bölüm numarası bir şey ifade etmiyor: iki tahta
// istatistik olarak ayırt edilemez hâle geliyor. Oyuncunun "bu oyun bitti"
// dediği yer orası ve hiçbir yerde yazmıyordu.
//
// ## Elle yazılan iki sayı, iki kez yanlış oldu
//
// Bu dosyanın başında bir zaman "parça havuzu — en yüksek minLevel 5"
// yazıyordu. Doğruydu, sonra mayın 8'e, salınım 18'e, en geç parça 28'e
// taşındı ve satır sessizce yalan oldu. Havuzun dolduğu bölüm artık
// `slicePieces()`ten okunuyor.
//
// İkincisi daha pahalıydı, çünkü **kapıyı** etkiliyordu: "geç bölüm" diye
// elle yazılmış 30 karşılaştırılıyordu, oysa sertlik eğrisi 32'de bitiyor.
// Yani ölçüm rampanın son üçte birini hiç görmeden rampayı ölçtüğünü
// sanıyordu. Eğrinin başı ve sonu artık `sliceMix()`ten geliyor ve
// pencereler ona göre kayıyor.
//
// Ölçüm tahminle değil tahtanın kendisiyle yapılıyor: her bölüm gerçekten
// kuruluyor ve içindeki nesneler sayılıyor. Tahta rastgele olduğu için her
// bölüm ÖRNEK kadar kez kuruluyor ve ortalama alınıyor — tek bir kurulum
// gürültüyü ölçerdi.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const ÖRNEK = 24;

const srv = createServer((req, res) => {
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-slicer' + p);
    res.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8166);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = [];
pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
pg.on('console', m => {
  if (m.type() === 'error' && !m.text().includes('404')) errs.push('CONSOLE: ' + m.text());
});
await pg.goto('http://localhost:8166/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.sliceProbe === 'function', { timeout: 20000 });
if (await pg.isVisible('#dOk')) await pg.click('#dOk');

// Taranacak bölüm sayısı oyunun kendi eğrilerinden: en geç açılan parça
// ile sertlik eğrisinin bittiği yerden hangisi sonraysa, iki bölüm
// ötesine kadar. Elle yazılmış 30, eğri 32'de biterken rampanın sonunu
// kadrajın dışında bırakıyordu — ve yeni bir parça eklendiğinde aynı
// şey ikinci kez olurdu.
const KARISIM = await pg.evaluate(() => window.sliceMix(1));
const parcalar = await pg.evaluate(() => window.slicePieces());
const enGec = parcalar.reduce((m, p) => Math.max(m, p.minLevel), 0);
// Açılış değil **olgunluk**: bir parça göründüğü bölümde son hâlinde
// olmayabiliyor (`drift` 36'da giriyor, 48'e kadar büyüyor). Açılışa
// göre durmak, hâlâ değişen bir bandı "durmuş" ilan etmek olurdu — bu
// dosyanın sorduğu şeyin tam tersi.
const enOlgun = parcalar.reduce((m, p) => Math.max(m, p.olgun), 0);
const SON = Math.max(KARISIM.bit, enOlgun) + 2;

const satır = [];
for (let n = 1; n <= SON; n++) {
  const örnekler = [];
  for (let k = 0; k < ÖRNEK; k++) {
    örnekler.push(await pg.evaluate(lvl => {
      window.sliceStart(lvl);
      const p = window.sliceProbe();
      const demir = window.sliceBars().length;
      const mayin = window.sliceMines ? window.sliceMines().length : 0;
      return { nesne: p.items, demir, mayin, meyve: p.items - demir - mayin,
               boy: p.courseEnd };
    }, n));
  }
  const ort = k => +(örnekler.reduce((s, o) => s + o[k], 0) / ÖRNEK).toFixed(1);
  // Hız oyunun kendi formülünden; probe vermiyor ve tur sırasında ölçmek
  // zamanlamaya bağlı olurdu.
  satır.push({
    n, meyve: ort('meyve'), demir: ort('demir'), mayin: ort('mayin'), boy: ort('boy'),
    hız: +Math.min(8 + (n - 1) * 0.45, 15).toFixed(2),
  });
}

console.log(' blm | meyve | demir | mayın | parkur boyu | hız');
console.log('-----+-------+-------+-------+-------------+------');
for (const r of satır) {
  console.log(` ${String(r.n).padStart(3)} | ${String(r.meyve).padStart(5)} | ` +
    `${String(r.demir).padStart(5)} | ${String(r.mayin).padStart(5)} | ` +
    `${String(r.boy).padStart(11)} | ${r.hız.toFixed(2)}`);
}

// Duvar: bir ölçü artık kıpırdamıyorsa orada durmuş demektir. Son beş
// bölümün aralığı, o ölçünün kendi dalgalanmasının altındaysa durmuştur.
const son = satır.slice(-8);
const durdu = (k, tolerans) => {
  const v = son.map(r => r[k]);
  return Math.max(...v) - Math.min(...v) <= tolerans;
};
console.log('');
const boyDurdu = satır.find(r => r.boy >= satır[SON - 1].boy);
const hızDurdu = satır.find(r => r.hız >= 15);
console.log(`parkur boyu tavanına ${boyDurdu ? boyDurdu.n + '. bölümde' : 'hiç'} ulaşıyor`);
console.log(`hız tavanına ${hızDurdu ? hızDurdu.n + '. bölümde' : 'hiç'} ulaşıyor`);
// Havuzun ne zaman dolduğu oyundan okunuyor, elle yazılmıyor.
//
// Burada "5. bölümde doluyor" yazıyordu ve iki kez sessizce yanlış oldu:
// mayın 8. bölümde, salınım 18. bölümde havuza girdi. Bu dosyanın işi tam
// olarak "içerik ne zaman tükeniyor" sorusuna cevap vermek; cevabı sabit
// yazmak onu bozar.
console.log(`parça havuzu ${enGec}. bölümde doluyor, eğriler ${enOlgun}. bölümde ` +
  `(${parcalar.length} parça: ` +
  parcalar.map(p => `${p.id}@${p.minLevel}` + (p.olgun > p.minLevel ? `→${p.olgun}` : ''))
    .join(', ') + ')');
console.log(`son sekiz bölümde meyve sayısı sabit mi: ${durdu('meyve', 6) ? 'EVET' : 'hayır'}`);
console.log(`son sekiz bölümde demir sayısı sabit mi: ${durdu('demir', 3) ? 'EVET' : 'hayır'}`);

// ## Rampanın iki ucu: karışım katsayısı gerçekten çalışıyor mu
//
// Bu, tahtaya hiç bakmadan cevaplanabilen tek soru ve bu yüzden burada:
// ağırlık formülü belirlenimci, yani gürültüsü yok ve eşik aramaya gerek
// yok.
//
// Bakılan şey **pay değil oran**: `agirlik / temel`, yani parçanın kendi
// bölüm eğrisi çıkarıldıktan sonra geriye kalan katsayı. Payla ölçmek
// yanıltıcı olurdu ve denendi: zor parçaların katsayısı sıfırlansa bile
// kolay parçalar seyreldiği için zorun payı yine yükseliyor — yani paya
// bakan bir kapı, eğrinin yarısının ölmesini göremiyor.
const kats = (mix) => Object.fromEntries(Object.entries(mix.parca)
  .map(([id, p]) => [id, { oran: p.temel ? p.agirlik / p.temel : 1, sinif: p.sinif }]));
const mixBas = await pg.evaluate(n => window.sliceMix(n), KARISIM.bas);
const mixBit = await pg.evaluate(n => window.sliceMix(n), KARISIM.bit);
const kBas = kats(mixBas), kBit = kats(mixBit);
const ortalama = (k, s) => {
  const v = Object.values(k).filter(x => x.sinif === s).map(x => x.oran);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};
console.log(`\nkarışım katsayısı (sertlik ${mixBas.sert} → ${mixBit.sert}):`);
for (const s of ['kolay', 'orta', 'zor']) {
  const a = ortalama(kBas, s), b = ortalama(kBit, s);
  console.log(`  ${s.padEnd(5)} ×${(a ?? 1).toFixed(2)} → ×${(b ?? 1).toFixed(2)}`);
}
const kolayDustu = ortalama(kBit, 'kolay') < ortalama(kBas, 'kolay');
const zorCikti = ortalama(kBit, 'zor') > ortalama(kBas, 'zor');
if (!kolayDustu) errs.push(
  `karışımın yarısı ölü: kolay parçalar ${KARISIM.bas} → ${KARISIM.bit} arasında seyrelmiyor`);
if (!zorCikti) errs.push(
  `karışımın yarısı ölü: zor parçalar ${KARISIM.bas} → ${KARISIM.bit} arasında sıklaşmıyor`);

// ## Kayan pencere son bölümde hâlâ bir soru mu?
//
// `drift` açıklığı salındırıyor, ama salınan bir pencere kendiliğinden
// zor değil: açıklık genliğin iki katından genişse ortada **hiç
// kıpırdamadan** geçilebilecek bir şerit kalır ve salınım dekor olur.
// Oyunun verdiği söz "cevap bir yükseklik değil bir an" — o şerit
// kapanmıyorsa söz tutulmuyor.
//
// Ölçülen şey: açıklığın genişliği eksi genliğin iki katı. Eşik
// seçilmiyor, oyunun kendi çarpışma payından geliyor: demir `half + 0.2`
// ile ısırıyor, yani iki taraftan 0.4 birim. Bundan geniş bir sabit
// şerit kalıyorsa parça o bölümde dekordur.
//
// Bakılan bölüm parçanın **olgunluk** bölümü, taramanın sonu değil:
// soru "bu parça büyüdüğünde bir şey soruyor mu". İlk hâli taramanın
// son bölümüne bakıyordu ve 38'de düştü — doğru düşüştü (o eğride parça
// on iki bölüm boyunca dekordu) ama yanlış soruydu.
const PAY = 0.4;
// Bakılan bölüm `enOlgun`: bütün eğrilerin durduğu yer. Parçanın adını
// buraya yazmak kolaydı ve yanlış olurdu — bu dosyanın işi oyunun
// tablosunu okumak, onu ikinci kez yazmak değil.
const KAYAN_BLM = enOlgun;
const kayanPencere = await pg.evaluate((lvl) => {
  for (let dene = 0; dene < 80; dene++) {
    window.sliceStart(lvl);
    const bars = window.sliceBars();
    for (let i = 0; i < bars.length; i++) for (let j = i + 1; j < bars.length; j++) {
      if (bars[i].d !== bars[j].d || bars[i].fromTop === bars[j].fromTop) continue;
      if (!bars[i].salinim) continue;
      const ust = bars[i].fromTop ? bars[i] : bars[j];
      const alt = bars[i].fromTop ? bars[j] : bars[i];
      return { acik: +((ust.y - ust.half) - (alt.y + alt.half)).toFixed(2),
               genlik: ust.salinim.genlik, dene };
    }
  }
  return null;
}, KAYAN_BLM);
if (!kayanPencere) {
  console.log(`\n${KAYAN_BLM}. bölümde salınan pencere bulunamadı (80 tahta)`);
} else {
  const sabit = +(kayanPencere.acik - 2 * kayanPencere.genlik).toFixed(2);
  console.log(`\nkayan pencere (${KAYAN_BLM}. bölüm): açıklık ${kayanPencere.acik} · ` +
    `genlik ${kayanPencere.genlik} · kıpırdamadan geçilebilen şerit ${sabit}` +
    ` (çarpışma payı ${PAY})`);
  if (sabit >= PAY) errs.push(
    `kayan pencere ${KAYAN_BLM}. bölümde dekor: ${sabit} birimlik sabit şerit var, salınımı izlemeye gerek yok`);
}

// Rampanın iki ucundaki tahtalar gerçekten farklı mı?
//
// Bu dosyanın asıl sorusu buydu ve cevabı uzun süre "yok"tu: üç tavan da
// dolduktan sonra bölüm numarası bir şey ifade etmiyordu, ama harita
// sonsuz bölüm gösterdiği için oyuncu tırmandığını sanıyordu. Rapor
// olmaktan çıkıp bir kontrol olması gereken yer burası — yoksa duvar geri
// gelir ve kimse fark etmez.
//
// Pencereler eğrilerin kendi uçlarından: sertlik rampasının başını saran
// dört bölüm, ve taramanın son dört bölümü. Eskiden 15-18 ile 27-30'du ve
// ikincisi elle yazılmıştı — eğri 32'de bitiyor, yani rampanın son üçte
// biri ölçümün dışındaydı.
const ort = (a, k) => a.reduce((t, r) => t + r[k], 0) / a.length;
const pencere = (orta) => satır.filter(r => r.n >= orta - 2 && r.n <= orta + 1);
const erken = pencere(KARISIM.bas);
const gec = pencere(SON - 1);
const ad = a => `${a[0].n}-${a[a.length - 1].n}`;
const d1 = ort(erken, 'demir'), d2 = ort(gec, 'demir');
console.log(`${ad(erken)} ort. demir ${d1.toFixed(1)} · ${ad(gec)} ort. demir ${d2.toFixed(1)}` +
  `  (×${(d2 / Math.max(0.1, d1)).toFixed(2)})`);
// Eşik ölçülerek kondu. İlk hâlinde bölüm başına beş tahta kuruluyordu
// ve oran beş koşuda ×1.69 ile ×3.27 arasında geziniyordu — yani kontrol
// oyunun değişmesini değil kendi gürültüsünü ölçüyordu ve takımda
// rastgele düşüyordu. Örneklem yirmi dörde çıkınca üç koşu ×1.93, ×1.94
// ve ×2.32 verdi. 1.4, bunun epey altında ve gerçek duvarı (iki taraf da
// aynı, ×1.0 civarı) hâlâ yakalıyor.
const ayri = d2 >= d1 * 1.4;
console.log(`geç bölüm erken bölümden ayırt edilebiliyor mu: ${ayri ? 'EVET' : 'HAYIR'}`);
if (!ayri) errs.push(
  `${ad(erken)} ile ${ad(gec)} arasında ölçülebilir fark yok — duvar geri geldi`);

console.log('\nerrors:', errs.length ? errs : 'none');
await br.close(); srv.close();
process.exitCode = errs.length ? 1 : 0;
