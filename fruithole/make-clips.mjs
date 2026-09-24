// Fruit Hole'un tanıtım klipleri — gerçek oynanıştan, dikey, sessiz mp4.
//
//   node build-www.mjs && node fruithole/make-clips.mjs
//   node fruithole/make-clips.mjs --only space --seconds 12
//   -> fruithole/store/clips/*.mp4
//
// Neden var: bu tür oyunlar artık mağaza aramasından değil kısa videodan
// bulunuyor, ve indirme başına ~$0.16 değerinde bir oyun için reklam satın
// almak matematiksel olarak zarar (CPI $0.50-2.00). Yani organik video tek
// gerçekçi yol, ve klip üretmek bir komut olmalı — görünüm her değiştiğinde
// yeniden çekilebilsin diye, tıpkı make-shots.mjs gibi.
//
// ---------------------------------------------------------------------
// Neden ekran kaydı değil de kare kare
//
// Bu konteynerde GPU yok; Chromium SwiftShader'la, yani yazılımla çiziyor.
// Ölçtük: 540x960'ta 4 fps, 1080x1920'de 2 fps. Gerçek zamanlı kayıt bu
// hızda kasık bir video verirdi ve tanıtım videosunun kasması reklamın
// kendisini bozar.
//
// Çözüm: oyunun saatini ele geçirip kareyi biz ilerletiyoruz.
// `requestAnimationFrame` ve `performance.now` sahteleniyor, her adımda saat
// tam 1/30 saniye ileri gidiyor ve o karenin ekran görüntüsü alınıyor.
// Çizimin ne kadar sürdüğü sonuca yansımıyor — yalnızca üretimin ne kadar
// sürdüğüne. Çıkan video tam 30 fps ve pürüzsüz.
//
// Oyunun saatini okuduğu iki yer var (rAF'ın verdiği zaman damgası ve
// `performance.now()`), ikisi de aynı sahte saatten besleniyor; yoksa delik
// bir hızda, meyvenin düşüşü başka bir hızda ilerlerdi.
// ---------------------------------------------------------------------

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync, mkdirSync, rmSync, existsSync, renameSync } from 'fs';
import { spawnSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const WWW = join(ROOT, 'www-fruithole');
const OUT = join(HERE, 'store', 'clips');
const TMP = '/tmp/fhclips';
const PORT = 8232;

const FPS = 30;
const CAP_W = 720, CAP_H = 1280;          // çizim boyutu
const OUT_W = 1080, OUT_H = 1920;         // sosyal medya standardı

const arg = (k, d) => {
  const i = process.argv.indexOf('--' + k);
  return i === -1 ? d : process.argv[i + 1];
};
// Süre ve ısınma, ilk videonun ölçümünden geliyor.
//
// 17 Eylül'de yüklenen 15 saniyelik klip 266 izlenme aldı ve **ortalama
// izlenme 2.34 saniyede** kaldı; tamamlanma %4. Yani dağıtım sorunu yok —
// TikTok videoyu gösterdi, izleyici iki saniyede bıraktı.
//
// İki değişiklik:
//
//   * Süre 15 → 9. Tamamlanma oranı TikTok'un en ağır tarttığı sinyal ve
//     bu görüntü için 15 saniye uzun.
//   * Kayıt, koşunun başından değil **PRE saniye sonrasından** başlıyor.
//     Eski kliplerin ilk saniyelerinde delik küçüktü ve tarla henüz
//     açılmamıştı; ilk kare "ne oluyor" sorusunu cevaplamıyordu. Artık
//     kamera döndüğünde delik büyümüş ve tarlada süpürülmüş bir yol var.
//
// Isınma yalan söylemiyor: gösterilen şey oyunun gerçekten altıncı
// saniyesi, büyütülmüş bir delik değil.
const SECONDS = Number(arg('seconds', 9));
// Isınma: kaydetmeden oynanan kısım. Alt sınır deliğin büyümesi için, üst
// sınır beklemenin bir yerde bitmesi için; arada karar `fruitHoleAhead()`
// ile veriliyor.
const PRE_MIN = Number(arg('pre', 3));
const PRE_MAX = Number(arg('premax', 12));
// Deliğin kaç birim çevresine, kaç meyve. Yarıçap tahtanın yarı genişliği
// kadar (13 sütun × 1.05 ≈ 13.7 birim), yani "deliğin etrafında görünen yer".
const AHEAD_R = Number(arg('aheadr', 9));
const AHEAD_MIN = Number(arg('ahead', 50));
// Deliğin tarla kenarına en az bu kadar uzak olması isteniyor: kamera deliği
// takip ediyor, kenardaki bir delik kadrajın bir kısmını tarla dışına
// harcıyor.
const EDGE = Number(arg('edge', 2.5));
// Dev yutulana kadar kaç saniye daha çekilsin. Klip sondan kesildiği için bu
// süre videoya girmiyor, yalnızca aramaya harcanıyor.
const SEARCH = Number(arg('search', 12));
// Kadrajdaki dev, deliğin kaç katına kadar büyük olabilir? 1.0 "şu an
// yutulabilir", 1.6 "biraz büyümek gerek". Üstü, dokuz saniyede kapanmayan
// bir açık demek.
const NEAR_MAX = Number(arg('near', 1.6));
// Klibin son kaç saniyesinde dev avlanıyor. Öncesinde otomatik oyuncu
// sıradan meyveyi süpürüyor; yoldaki devi yine yiyebilir ama ona gitmiyor.
const AV_SN = Number(arg('hunt', 4));
// Soğuk açılış: klip kaç saniye boyunca devin üstünde yakın planda duruyor.
//
// shop klibinin panelinde izleyicilerin çoğu **0:01'de** bırakmıştı. Klibin
// sonu zaten düzeltilmişti (dev yutuluyor) ve oran iki katına çıkmıştı — ama
// o kazanç ancak birinci saniyeyi geçenlere ulaşıyor. Kaybedilen yer klibin
// sonu değil, ilk karesi: kayıt tarlanın ortasında, yüzlerce meyvenin
// arasında açılıyor ve hangisinin önemli olduğunu söyleyen bir şey yok.
//
// Artık ilk kare devin üstünde ve yakın: soru ilk karede soruluyor, süpürme
// kamera geri çekilirken başlıyor. 0 vermek açılışı tamamen kapatıyor —
// eski kurguyla karşılaştırmak için.
const COLD = Number(arg('cold', 1.2));
// Yakın planın genişliği. Oyunun kendi genişliği 5.4; bunun yarısı devi
// kadrajın çoğunu kaplar hâle getiriyor.
const COLD_W = Number(arg('coldw', 2.6));
const ONLY = arg('only', null);

// Hangi bölümler?
//
// İlk seçim gözle yapılmıştı ve yanlış çıktı: Pillars seçilmişti, klibin
// yarısı boş zemindi. Ölçünce sebebi görüldü — Pillars tarladaki en seyrek
// desenlerden biri. Tanıtımda satan şey kalabalık bir tarlanın süpürülmesi;
// boş zemin izleyiciyi kaydırtıyor.
//
// **Düzen adıyla isteniyor, bölüm numarasıyla değil.** Buradaki numaralar
// bir kez kaydı: on dokuz düzen yirmi dörde çıkınca 9. bölüm voxel tahtası,
// 15. bölüm arabalı sinema, 19. bölüm yörünge olmaktan çıktı. Dosya yine
// beş video üretiyordu — sadece `shop.mp4`'te mağaza, `space.mp4`'te uzay
// yoktu, ve bunu ancak videoyu izleyen biri fark edebilirdi. Numara artık
// oyunun kendi sırasından okunuyor.
//
// Yoğunluk 24 bölüm için yeniden ölçüldü (tohumlu tarla, meyve sayısı):
//
//   24 Cross   482      11 Blocks  479      19 Ring    479
//   12 Stairs  427      14 Heart   420      10 Walls   385
//    1 Pyramid 277       7 Piles   116       4 Pillars 129
//
// Seçilenlerin temaları birbirinden farklı: altısı da kumsal olsa altı klip
// tek klip gibi izlenirdi.
const CLIPS = [
  { id: 'farm',   pattern: 'Cross',   note: 'Harvest · sürülmüş tarla, yeni tema — 482 meyve, en yoğunu' },
  { id: 'shop',   pattern: 'Blocks',  note: 'Gadget Shop · voxel tahta — 479' },
  { id: 'drive',  pattern: 'Ring',    note: 'Drive-In · arabalı sinema — 479' },
  { id: 'bar',    pattern: 'Stairs',  note: 'Happy Hour · bar tezgâhı — 427' },
  { id: 'space',  pattern: 'Heart',   note: 'Orbit · istasyon güvertesi — 420' },
  // Patron bölümü: her onuncu bölüm, tahtanın ucunda devasa bir meyve.
  // Düzen değil olay seçiliyor, o yüzden numara burada doğrudan veriliyor.
  { id: 'boss',   level: 10,          note: 'patron bölümü — 385 meyve, 9 dev' },
  // Kumsal en parlak zemin ve ikonun görünümü; yoğunluğu orta ama oyunun
  // kendini tanıttığı kare bu.
  { id: 'beach',  pattern: 'Pyramid', note: 'Beach · birinci bölüm — 277' },
];

// Oyunun saatini sahteleyen katman. Sayfadaki her şeyden önce çalışması
// gerekiyor, yoksa oyun gerçek rAF'a çoktan abone olmuş olur.
const FAKE_CLOCK = () => {
  let t = 0;
  const queue = [];
  window.requestAnimationFrame = cb => { queue.push(cb); return queue.length; };
  window.cancelAnimationFrame = () => {};
  try {
    Object.defineProperty(window.performance, 'now', {
      configurable: true, value: () => t,
    });
  } catch (e) { window.performance.now = () => t; }
  // Bir "kare" = saati ilerlet, o an kuyrukta ne varsa çalıştır. Kuyruğu
  // kopyalayıp boşaltıyoruz: callback'ler çalışırken kendilerini yeniden
  // sıraya koyuyor, aynı turda ikinci kez çalışmasınlar.
  window.__step = ms => {
    t += ms;
    const batch = queue.splice(0, queue.length);
    for (const cb of batch) { try { cb(t); } catch (e) {} }
  };
  window.__clock = () => t;
};

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync(join(WWW, p));
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(PORT);

if (!existsSync(join(WWW, 'index.html'))) {
  console.error('www-fruithole yok. Önce: node build-www.mjs');
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

const ffmpeg = existsSync('/usr/bin/ffmpeg') ? '/usr/bin/ffmpeg' : 'ffmpeg';

// Düzen adı -> bölüm numarası, oyunun kendi sırasından.
{
  const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
  await pg.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await pg.waitForFunction(() => typeof window.fruitHoleThemeTable === 'function',
    { timeout: 25000 });
  const order = await pg.evaluate(() => window.fruitHoleThemeTable().order);
  await pg.close();
  for (const c of CLIPS) {
    if (!c.pattern) continue;
    const i = order.indexOf(c.pattern);
    if (i < 0) throw new Error(`düzen bulunamadı: ${c.pattern} — oyundakiler: ${order.join(', ')}`);
    c.level = i + 1;
  }
}

const dusen = [];
let cikan = 0;
for (const clip of CLIPS) {
  if (ONLY && clip.id !== ONLY) continue;
  // Bir klibin düşmesi partiyi bitirmemeli: dördü çıkmışken beşincisi
  // yüzünden hepsini baştan üretmek yirmi dakika demek.
  try {
  const t0 = Date.now();
  console.log(`\n${clip.id} — bölüm ${clip.level} — ${clip.note}`);

  const frameDir = join(TMP, clip.id);
  rmSync(frameDir, { recursive: true, force: true });
  mkdirSync(frameDir, { recursive: true });

  const pg = await br.newPage({ viewport: { width: CAP_W, height: CAP_H } });
  pg.on('pageerror', e => console.log('  SAYFA HATASI: ' + e));
  await pg.addInitScript(FAKE_CLOCK);
  await pg.addInitScript(lv => {
    localStorage.setItem('fruithole_level', String(lv));
    // Yükseltmeler kapalı: tanıtımda görülen hız ve boyut yeni oyuncunun
    // ilk günündeki hız ve boyut olsun, yoksa video yalan söyler.
    localStorage.setItem('fruithole_seen', '1');
  }, clip.level);

  await pg.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });

  // Sahte saatte yükleme de adım istiyor: modüller ve ilk sahne kurulumu
  // rAF bekliyor olabilir.
  const pump = async (n, ms = 1000 / FPS) => {
    for (let i = 0; i < n; i++) await pg.evaluate(d => window.__step(d), ms);
  };
  await pg.waitForFunction(() => window.fruitHoleWhere, { timeout: 60000 });
  await pump(30);

  // Günlük meydan okuma ekranı her açılışta çıkmıyor: yeni bir profilde
  // (bölüm 1) doğrudan menü geliyor ve #dailyBtn DOM'da olduğu hâlde 0x0
  // kalıyor. `$()` onu yine buluyor, tıklamak ise otuz saniye bekleyip
  // düşüyor — varlığa değil görünürlüğe bakmak gerekiyor.
  if (await pg.isVisible('#dailyBtn')) { await pg.click('#dailyBtn'); await pump(10); }
  await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 30000 });
  await pg.click('#playBtn');

  // Klibin altına oyunun adı.
  //
  // Ölçüm bunu istedi: 2.300 izlenmeye karşı **6 profil görüntülemesi**, sıfır
  // paylaşım, sıfır yorum. Klipler klip olarak çalışıyor (%44 izletme) ama
  // izleyen kişi bunun bir oyun olduğunu, adını ve nereden bulunacağını
  // videodan öğrenemiyordu — ekranda LEVEL rozeti ve booster çubuğu vardı,
  // marka yoktu.
  //
  // Yer bedava: o satırda normalde "Drag anywhere to steer the hole and
  // swallow the fruit" yazıyor. Oynamayan birine verilen bir talimat, videonun
  // en okunaklı satırını harcıyor. Süreye de dokunmuyor — sonuna kart koymak
  // dokuz saniyenin yarım saniyesini götürürdü ve tamamlanma oranı TikTok'un
  // en ağır tarttığı sinyal.
  await pg.evaluate(() => {
    const h = document.getElementById('hint');
    if (h) h.style.display = 'none';
    const m = document.createElement('div');
    m.id = 'clipMark';
    m.style.cssText = `position:fixed; left:0; right:0; bottom:calc(env(safe-area-inset-bottom,0px) + 128px);
      text-align:center; z-index:80; pointer-events:none; line-height:1;
      font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;`;
    m.innerHTML = `
      <div style="font-size:15px; font-weight:900; letter-spacing:.34em; color:#ffd08a;
        -webkit-text-stroke:4px #4a2a0c; paint-order:stroke fill;
        text-shadow:0 2px 0 #4a2a0c; margin-bottom:5px;">PEELO</div>
      <div style="font-size:30px; font-weight:900; letter-spacing:-.5px; color:#fff;
        -webkit-text-stroke:6px #4a2a0c; paint-order:stroke fill;
        text-shadow:0 4px 0 #4a2a0c, 0 8px 14px rgba(0,0,0,.45);">FRUIT HOLE</div>`;
    document.body.appendChild(m);
  });

  // Tarla düşerken oyun zaten oynanamıyor; o bir buçuk saniyeyi klibe
  // koymuyoruz, izleyici ilk karede oynanış görmeli.
  await pump(Math.round(1.8 * FPS));

  // Isınma: kaydetmeden oyna. Kare yakalamadığımız için bu kısım hızlı
  // geçiyor — maliyeti yalnızca çizim, ekran görüntüsü değil.
  // Otomatik oynayan taraf en yakın meyveye gidiyor — ama yutulabilir hâle
  // gelmiş bir dev varsa ona yöneliyor.
  //
  // Onsuz klip sözünü tutmuyordu: açılışta beklenecek bir dev gösteriyor,
  // sonra delik en yakın meyveleri kovalarken dev kadrajın dışında kalıyordu.
  // Söz veren bir açılış ve tutulmayan bir son, hiç söz vermemekten kötü.
  //
  // Sürmek ve kareyi ilerletmek tek çağrıda: her kare için iki tur yerine bir
  // tur. Dönen sayılar adımdan **önceki** durum — dev sayısının düştüğü kare,
  // devin bir önceki adımda yutulduğu kare demek.
  // `avla`: dev peşine düşülsün mü?
  //
  // Düşülmediğinde otomatik oyuncu sıradan meyveyi süpürüyor, ve yoldaki bir
  // devi yine de yiyor — ama ona **gitmiyor**. Fark, ödemenin nereye
  // düştüğünde: 15 saniyelik ilk denemede bot devleri erkenden yedi (sekiz
  // tanesini), klip penceresinin sonunda yutulacak dev kalmadı ve klip
  // ödemesiz kesildi. Dokuz saniyede bu görünmemişti çünkü pencere kısaydı;
  // sorun oradaydı, sadece rastlamıyordu.
  //
  // Artık av son saniyelere saklanıyor: önce tarla süpürülüyor, sonra dev.
  const adim = (avla = true) => pg.evaluate(([dt, av]) => {
    const w = window.fruitHoleWhere();
    const g = window.fruitHoleGiantList();
    const yut = av ? g.filter(x => x.eatable && x.dist < 15) : [];
    const hedef = yut.length ? yut[0] : window.fruitHoleNearest();
    if (!hedef) window.fruitHoleSteer(0, 0);
    else {
      const dx = hedef.x - w.x, dz = hedef.z - w.z;
      const d = Math.hypot(dx, dz) || 1;
      window.fruitHoleSteer(dx / d, dz / d);
    }
    window.__step(dt);
    return { dev: g.length, eaten: w.eaten, total: w.total, timeLeft: w.timeLeft, state: w.state };
  }, [1000 / FPS, avla]);
  //
  // Ne zaman kaydetmeye başlanacağı sabit bir gecikme değil, **deliğin
  // çevresindeki meyve sayısı**.
  //
  // Sabit altı saniye şunu bilmiyordu: delik o an tarlanın neresinde. Ölçüm
  // tam olarak bunu gösterdi — 24. bölümün ilk karesinde ekranın alt yarısı
  // süpürülmüş boş toprak, meyve yukarıda kalmıştı. Tanıtımda ilk kare her
  // şey; 1. videonun ortalama izlenmesi 2.34 saniyeydi, yani izleyici tam
  // orada bırakıyor.
  //
  // Alt sınır delik büyüsün diye, üst sınır sonsuza kadar beklemesin diye.
  // Arada, çevresinde AHEAD_MIN meyve olan ilk kare aranıyor.
  // Üçüncü şart, ve ölçüme göre en önemlisi: **ekranda beklenecek bir dev
  // olmalı**, ve delik onu o an yutamamalı.
  //
  // İlk üç videonun sayıları bunu söyledi. En iyi tutan klip (ortalama
  // izlenme 3.35 sn; ötekiler 2.21 ve 2.73) patron bölümüydü — tek farkı
  // ekranda açıkça yutulamayan devasa bir meyve olmasıydı. Öteki kliplerde
  // 1. saniyede ne varsa 9'unda da o vardı: düzenli tempoda meyve yiyen
  // büyümüş bir delik, yani beklenecek hiçbir şey.
  //
  // "9 saniyeye inelim ve ilk kareyi doldur alım" hipotezi tek başına işe
  // yaramamıştı; iki klip de 9 saniyeydi ve aralarında 1.1 saniye fark vardı.
  // Fark içerikteydi.

  // İkinci şart: delik tarlanın kenarında olmasın.
  //
  // Yalnızca meyve sayısına bakmak yetmedi. İlk denemede delik yoğun bir
  // öbeğe yapıştı ama öbek tarlanın sol kenarındaydı, ve kamera deliği takip
  // ettiği için karenin üçte biri tarlanın dışındaki düz yeşil zemin oldu.
  // Kalabalık bir kare istiyoruz, kalabalığın yanında boş bir şerit değil.
  const durum = () => pg.evaluate(r => {
    const w = window.fruitHoleWhere();
    const g = window.fruitHoleGiantList();
    // Kadrajda olan dev: önümüzde (dz negatif, kamera yukarısı) ve yakın.
    const onde = g.filter(x => x.dz < 3 && x.dist < 13);
    return {
      yakin: window.fruitHoleAhead(r), x: w.x, halfX: w.halfX,
      dev: onde.length, yutulabilir: onde.filter(x => x.eatable).length,
      enYakinDev: onde.length ? onde[0].dist : null,
      // Dev ne kadar uzakta — mesafe olarak değil, **boyut olarak**. 1.0
      // yutulabilir demek, 2.0 deliğin iki katı büyüklükte demek.
      buyukluk: onde.length ? +(onde[0].r / (w.r * 0.92)).toFixed(2) : null,
    };
  }, AHEAD_R);
  // Dördüncü şart: dev yalnızca yutulamaz değil, **neredeyse** yutulabilir
  // olmalı.
  //
  // Beach klibinde çıktı: birinci bölümde delik küçücük başlıyor ve kadrajdaki
  // dev karpuz onun üç katı. Açılış sözü veriyordu ama dokuz saniyede delik o
  // boya ulaşmıyordu; arama süresi bitti ve klip ödemesiz kesildi. Söz
  // verilecek dev, o sözün tutulabileceği kadar yakın olmalı.
  const uygun = d => d.yakin >= AHEAD_MIN && Math.abs(d.x) <= d.halfX - EDGE
    && d.dev > 0 && d.yutulabilir === 0 && d.buyukluk <= NEAR_MAX;
  let warm = 0;
  for (; warm < Math.round(PRE_MIN * FPS); warm++) await adim(false);
  const enCok = Math.round(PRE_MAX * FPS);
  let d = await durum();
  while (warm < enCok && !uygun(d)) {
    await adim(false);
    d = await durum();
    warm++;
  }
  console.log(`  kayıt ${(warm / FPS).toFixed(1)}. saniyede başlıyor · ` +
    `çevrede ${d.yakin} meyve · kenara ${(d.halfX - Math.abs(d.x)).toFixed(1)} birim · ` +
    `kadrajda ${d.dev} dev (yutulabilir ${d.yutulabilir}, büyüklük ${d.buyukluk})` +
    (uygun(d) ? '' : '  (şart sağlanmadı, üst sınıra dayandı)'));

  // Soğuk açılış: klibin ilk COLD saniyesi, devin üstünde yakın planda.
  //
  // Ayrı çekiliyor ve gövdenin önüne ekleniyor, çünkü gövdenin **nerede
  // başlayacağı** çekim bitmeden belli değil (aşağıdaki halka tampon). Yani
  // "kaydın ilk saniyesinde kamerayı devde tut" diye bir şey yazılamıyor —
  // o saniye çoğu zaman klibe hiç girmiyor.
  //
  // Araya bir kesme giriyor ve bu bilerek: kanca çekimi + kesme + oynanış,
  // kısa videonun en sıradan kurgusu. Kesmeyi görünmez yapmaya çalışmak
  // yerine kurgunun parçası sayıyoruz. Yakınlaştırma açılış boyunca oyunun
  // kendi genişliğine dönüyor, böylece kesme yalnızca konumda oluyor,
  // ölçekte değil.
  const coldDir = join(frameDir, 'c');
  const bodyDir = join(frameDir, 'b');
  mkdirSync(coldDir, { recursive: true });
  mkdirSync(bodyDir, { recursive: true });
  let coldN = 0;
  if (COLD > 0 && d.dev > 0) {
    // Kadraj deliğin ve devin **ortası**: söz ikisinin birlikte görünmesinde
    // — küçücük delik, kocaman meyve. Yalnızca deve bakmak bunun yarısını
    // gösterirdi. Genişlik aradaki mesafeye göre, ama her hâlükârda oyunun
    // kendi genişliğinden dar.
    //
    // Dev uzaktaysa ikisi birden sığmıyor ve "ortasına bak" kuralı yakın planı
    // tamamen yiyor: ilk denemede boss'ta dev 12.9 birim ötedeydi ve açılış
    // 4.6 genişlikte, yani normalden ayırt edilemeyecek kadar geniş çıktı —
    // soğuk açılışın hiç olmaması gibi. O durumda söz devde: kadraj yalnızca
    // deve gidiyor, delik açılış bitince zaten geliyor.
    const ac = await pg.evaluate(([dar, gen, yakin]) => {
      const w = window.fruitHoleWhere();
      const g = window.fruitHoleGiantList().filter(x => x.dz < 3 && x.dist < 13)[0];
      if (!g) return null;
      const ikisi = g.dist <= yakin;
      const halfW = ikisi ? Math.min(gen, Math.max(dar, g.dist * 0.62)) : dar;
      if (ikisi) window.fruitHoleCamLook((w.x + g.x) / 2, (w.z + g.z) / 2, true);
      else window.fruitHoleCamLook(g.x, g.z, true);
      window.fruitHoleZoom(halfW);
      return { halfW: +halfW.toFixed(2), dist: g.dist, ikisi };
    }, [COLD_W, 4.6, 6]);
    if (ac) {
      coldN = Math.round(COLD * FPS);
      for (let i = 0; i < coldN; i++) {
        // Açılış boyunca oyun oynanmaya devam ediyor — donmuş bir kare değil,
        // canlı görüntü. Dev avlanmıyor: açılışta yutulması ödemeyi başa alır.
        // Yakınlaştırma yumuşak açılıyor (smoothstep), sonunda oyunun kendi
        // genişliğinde. Doğrusal açılınca başlangıç ve bitiş ikisi de sert
        // duruyordu.
        //
        // Sıra önemli: yakınlaştırma **adımdan önce** kuruluyor. Sonra
        // kurulsaydı ekran görüntüsü bir önceki karenin çizimini alırdı —
        // kamera ayarı bir kare geriden gelirdi.
        const t = i / coldN;
        const e = t * t * (3 - 2 * t);
        await pg.evaluate(w => window.fruitHoleZoom(w), ac.halfW + (5.4 - ac.halfW) * e);
        await adim(false);
        await pg.screenshot({
          path: join(coldDir, String(i).padStart(5, '0') + '.png'),
          animations: 'disabled',
        });
      }
      await pg.evaluate(() => { window.fruitHoleCamLook(null); window.fruitHoleZoom(null); });
      console.log(`  soğuk açılış ${(coldN / FPS).toFixed(1)} sn · ` +
        `genişlik ${ac.halfW} -> 5.4 · dev ${ac.dist} birim ötede` +
        (ac.ikisi ? ' · delik ve dev birlikte' : ' · yalnız dev (delik uzakta)'));
    } else {
      console.log('  soğuk açılış atlandı: kadrajda dev yok');
    }
  }

  // Kayıt: halka tampon, ve **sondan** kesiliyor.
  //
  // Başlangıç şartı klibin sözünü veriyor (kadrajda yutulamayan bir dev),
  // ama sözü tutan şey sonda: devin yutulduğu an. İlk denemede klip dokuzuncu
  // saniyede, delik daha "Size 3"teyken kesiliyordu — açılış soruyordu,
  // kapanış cevap vermiyordu.
  //
  // O yüzden dokuz saniye çekip durmuyoruz: dev yutulana kadar çekiyoruz
  // (üst sınır SEARCH saniye), sonra ffmpeg'e yalnızca **son** SECONDS × FPS
  // kareyi veriyoruz. Klibin bittiği yer devin yutulduğu yer + kısa bir kuyruk;
  // klibin başladığı yer oradan dokuz saniye geri.
  //
  // Yutma şöyle anlaşılıyor: `fruitHoleGiantList()` yenmemiş devleri sayıyor,
  // sayı düşerse bir dev yenmiştir. Düşüş klibin sonuna sığmayacak kadar
  // erkense (ilk saniyelerde) beklemeye devam ediliyor — ödemenin sonda olması
  // gerekiyor, ortada değil.
  //
  // Gövde, soğuk açılış kadar kısalıyor: toplam süre SECONDS olarak kalıyor.
  const total = Math.round(SECONDS * FPS) - coldN;
  const TAIL = Math.round(0.6 * FPS);        // yutmadan sonra nefes payı
  const ARA = Math.round(SEARCH * FPS);      // yutma aranacak ek süre
  // Av penceresi: klibin son AV_SN saniyesi. Önce tarla süpürülüyor, sonra
  // dev. Ödemenin sonda olmasının tek yolu bu — beklemek yetmiyor, devi
  // ortada yememek gerekiyor.
  const AV_BASLA = total - Math.round(AV_SN * FPS);
  let f = 0, yutuldu = -1, erken = 0, onceki = null;
  while (true) {
    const s = await adim(f >= AV_BASLA);
    await pg.screenshot({
      path: join(bodyDir, String(f).padStart(5, '0') + '.png'),
      animations: 'disabled',
    });
    if (onceki !== null && s.dev < onceki) {
      if (f + TAIL >= total) { if (yutuldu < 0) yutuldu = f; }
      else erken++;
    }
    onceki = s.dev;
    if (f % 60 === 0) {
      process.stdout.write(`  ${f} kare · yenen ${s.eaten}/${s.total} · ` +
        `dev ${s.dev} · süre ${s.timeLeft}s\r`);
    }
    f++;
    if (yutuldu >= 0 && f > yutuldu + TAIL) break;
    if (f >= total + ARA) break;
    if (s.state !== 'playing') break;   // bölüm bitti: daha fazla kare yok
  }
  const son = await pg.evaluate(() => window.fruitHoleWhere());
  await pg.close();

  const sonKare = yutuldu >= 0 ? Math.min(f - 1, yutuldu + TAIL) : f - 1;
  const basKare = Math.max(0, sonKare - total + 1);
  const adet = sonKare - basKare + 1;
  console.log(`  ${f} kare çekildi · yenen ${son.eaten}/${son.total} · durum ${son.state}   `);
  console.log(`  gövde ${basKare}-${sonKare} arası (${(adet / FPS).toFixed(1)} sn) · ` +
    (yutuldu >= 0
      ? `dev ${((yutuldu - basKare + coldN) / FPS).toFixed(1)}. saniyede yutuluyor`
      : 'UYARI: dev yutulmadı, sondan kesildi — ödeme yok') +
    (erken ? ` · ${erken} erken yutma atlandı` : ''));

  // Yenen meyve sayısı sıfırsa video boş bir tarla gösteriyor demektir;
  // sessizce bir dosya bırakmaktansa söylemek daha iyi.
  if (son.eaten === 0) console.log('  UYARI: hiç meyve yenmemiş, klibe bakmadan yayınlama.');

  // İki parçayı tek bir kesintisiz numaraya diziyoruz: soğuk açılış 0'dan,
  // gövde onun ardından. ffmpeg'in `-start_number`'ı tek bir aralık okuyor,
  // yani iki aralığı ona anlatmanın yolu yok; yeniden adlandırmak aynı
  // dosya sisteminde bedavaya yakın ve concat listesinden çok daha az
  // hareketli parçası var.
  const cutDir = join(frameDir, 'x');
  mkdirSync(cutDir, { recursive: true });
  let k = 0;
  for (let i = 0; i < coldN; i++) {
    renameSync(join(coldDir, String(i).padStart(5, '0') + '.png'),
      join(cutDir, String(k++).padStart(5, '0') + '.png'));
  }
  for (let i = basKare; i <= sonKare; i++) {
    renameSync(join(bodyDir, String(i).padStart(5, '0') + '.png'),
      join(cutDir, String(k++).padStart(5, '0') + '.png'));
  }
  console.log(`  klip ${(k / FPS).toFixed(1)} sn ` +
    (coldN ? `(${(coldN / FPS).toFixed(1)} sn açılış + ${(adet / FPS).toFixed(1)} sn oynanış)` : ''));

  const mp4 = join(OUT, `${clip.id}.mp4`);
  const r = spawnSync(ffmpeg, [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS),
    '-i', join(cutDir, '%05d.png'),
    '-frames:v', String(k),
    '-vf', `scale=${OUT_W}:${OUT_H}:flags=lanczos`,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20',
    '-pix_fmt', 'yuv420p',          // yoksa bazı oynatıcılar hiç açmıyor
    '-movflags', '+faststart',      // yüklerken ilk kare hemen görünsün
    '-an',
    mp4,
  ], { encoding: 'utf8' });
  if (r.status !== 0) { console.log('  ffmpeg düştü:\n' + (r.stderr || '')); continue; }

  rmSync(frameDir, { recursive: true, force: true });
  cikan++;
  console.log(`  -> ${mp4}  (${Math.round((Date.now() - t0) / 1000)} sn sürdü)`);
  } catch (e) {
    console.log(`  DÜŞTÜ: ${String(e).split('\n')[0]}`);
    dusen.push(clip.id);
  }
}

await br.close();
srv.close();
// Sayı üretilenden okunuyor: `--only farm` ile tek klip çıkarken "7 klibin
// hepsi çıktı" yazıyordu.
console.log(dusen.length
  ? `\n${cikan} klip çıktı · üretilemeyen: ${dusen.join(', ')}`
  : `\n${cikan} klip çıktı`);
console.log(`klipler: ${OUT}`);
