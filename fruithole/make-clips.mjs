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

// `--anahtar değer` ve `--anahtar=değer`, ikisi de.
//
// Yalnızca boşluklu hâli okunuyordu ve `--only=jardin` sessizce **bütün**
// klipleri yeniden çekti: `indexOf('--only')` eşleşmeyince ONLY null kalıyor,
// null da "hepsi" demek. Tek klip için başlatılan iki koşu, saatlerce dokuz
// klip çekti. Sessiz çalışan yanlış komut, hata verenden pahalı.
const arg = (k, d) => {
  const esit = process.argv.find(a => a.startsWith('--' + k + '='));
  if (esit) return esit.slice(k.length + 3);
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
// Üst sınır 12'de kalıyor, ve bir kez 18'e çıkarılıp geri getirildi.
//
// Beşinci şart (kadrajda engel olsun) eklenince pencere daraldı ve ilk
// düşünce üst sınırı büyütmekti. Ölçüldü ve tersi çıktı: on sekiz saniye
// ısınmada Tikal'de tahtanın 110/275'i yendi, çevredeki meyve 41'e düştü
// (50 gerekiyor), devler bitti ve bölüm arama bitmeden kazanıldı. Beklemek
// tahtayı **tüketiyor**; aranan şeyi aramakla yok ediyor.
//
// Çözüm beklemeyi uzatmak değil, ısınmayı engele doğru sürmek oldu
// (`adim`'in `git` parametresi).
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
  // Liste 28 yer / 34 düzen için yeniden yazıldı. Eskisi beş yerin beşini
  // de kaybetmişti: `Ring` arabalı sinemadan arenaya, `Stairs` bardan New
  // York'a, `Pyramid` kumsaldan Mısır'a geçmişti, ve dosya yine aynı adla
  // video üretiyordu — `beach.mp4`'te kumsal yoktu. Düzen adıyla istemek
  // numarayı çözdü ama **temayı** çözmüyor; tema da taşınabiliyor.
  //
  // Seçim iki ölçüye göre: tahtanın kalabalığı (boş zemin izleyiciyi
  // kaydırtıyor, ölçüldü) ve zeminin kendisi. Yeni yerlerin yarısında
  // bakılacak şey zemin — kilim, mozaik, tartan, neon — ve tanıtımda satan
  // şey zaten "burası neresi" sorusu.
  //
  // Liste üçüncü kez yazıldı, ve bu sefer sebep **engeller**. Yirminci
  // bölümden sonra tahtada mancınık, silindir, çamur, rakip delik ve rüzgâr
  // var — yani orada çekilen bir klipte bir şey **oluyor**. Altındaki
  // bölümlerde olan tek şey meyve yenmesi, ve ilk üç videonun ölçüsü tam
  // bunu söylemişti: "1. saniyede ne varsa 9'unda da o vardı, yani
  // beklenecek hiçbir şey."
  //
  // Mancınık bu iş için en iyisi: deliğin **durduğu yere** atıyor, yani
  // kadraja kendisi giriyor. Kırmızı halka da tek karede anlaşılıyor.
  //
  // Bir de birinci bölüm artık klip için uygun değil: kartı sabitlenip
  // kısaltıldı (`CARD_OPENING`) ve bölüm yirmi beş saniyede bitiyor —
  // `egypt` klibi dokuz saniye yerine 4.2 saniye çıktı ve ödemesiz kesildi.
  // Klipler bölümün bitmeyeceği kadar uzun tahtalarda çekiliyor.
  //
  // ---------------------------------------------------------------------
  // Liste dördüncü kez yazıldı, ve sebep üçüncü yazımın **hiç çalışmaması**
  //
  // Üçüncü yazım tam yukarıdaki paragrafı savunuyordu: klip engel göstersin,
  // ve mancınık bu iş için en iyisi. Dokuz klibin notuna engel adları
  // yazıldı — *"+ rakip delik, çamur, mancınık"*, *"+ mancınık"* — ve
  // klipler çekildi.
  //
  // 2 Ekim'de ölçüldü. Dokuz bölümün **hiçbirinde mancınık yoktu.**
  //
  //   overgrown  32  söz: mancınık     tahtada: çamur, rakip
  //   suburb     22  söz: mancınık     tahtada: HİÇBİR ENGEL YOK
  //   redsquare  34  söz: rüzgâr       tahtada: rüzgâr, rakip        ✓
  //
  // Sebep: engeller artık **yere bağlı** (`GROUND_OBSTACLE`,
  // `themeObstacles`). Her yerin kendi engel çifti var ve o çift yerin
  // adından türetiliyor. Liste yazıldığında bu kural yoktu; kural gelince
  // dokuz tahtanın engelleri sessizce değişti ve notlar yerinde kaldı.
  // `suburb` en kötüsü: `mud,wind` izinli ama ikisinin de eşiği (29 ve 34)
  // 22'nin üstünde, yani o tahtada hiçbir şey olmuyor — ve o klip gün 51
  // olarak yayınlandı.
  //
  // Bu, bu depodaki **üçüncü** aynı hata: uzun uzun savunulmuş bir kural,
  // onu uygulamayan bir satır, ve ölçen kimse yok. (Bombanın kule tepesinde
  // durması, `CARD_SLACK`'in sıkılaşması, şimdi de bu.)
  //
  // Düzeltme notu düzeltmek değil: **`engel` artık bir söz ve ölçülüyor.**
  // Aşağıdaki her satır tahtada olmasını istediği engeli adıyla söylüyor,
  // ve iki yerde doğrulanıyor — koşu başlamadan temanın onu kabul ettiği
  // (deterministik, listeyi anında yakalar), koşu başladıktan sonra da
  // gerçekten tahtada olduğu (yerleştirme rastgele, başarısız olabiliyor).
  // Tutmazsa klip düşüyor; sessizce engelsiz bir tahta kaydetmiyor.
  //
  // Seçim de buna göre yeniden yapıldı, ve **yerleşme oranı ölçülerek.**
  //
  // Mancınığı olan beş ızgara bölümünün her birinde kırk tohum denendi
  // (ızgara taraması eklendikten sonraki hâl):
  //
  //   39 Tikal      %100        20 Rangoli    %83
  //   47 Red Planet  %98        21 Drive-In   %78
  //   24 Fiesta      %88
  //
  // Kalan eksik gerçek bir geometri sorunu, şanssızlık değil: tahta x'te
  // yalnızca ±6.83 birim ve kenar payı 4.85, yani mancınığın
  // durabileceği şerit ±1.98 birim. O şeride iki kaya ve doğuş payı
  // düştüğünde bazen hiç yer kalmıyor — ve kenar payı gevşetilemez, çünkü
  // delik bu tahtalarda `HOLE_MAX`a gerçekten ulaşıyor (`growthUnit`
  // büyüme aralığını tahtanın `GROW_SWEEP` katına bölüyor, yani tahtayı
  // bitirmeden tavana varılıyor).
  //
  // O yüzden mancınık sözü yalnızca %98-100 olan iki tahtada veriliyor.
  // Drive-In ve Rangoli, sözünü beşte birinde tutmayacak tahtalar.
  // ---------------------------------------------------------------------
  // `Ballcourt` 46. bölüme kaydı ve orası şerit tahtası — düzen ekrana hiç
  // gelmiyor, yani o klip oyunun göstermediği bir şeyi gösterecekti. Aracın
  // kendi bekçisi durdurdu. Yerine `Cubes` (27, ızgara): küp bloklar, Kaan'ın
  // "blok gibi dizilsin" dediği şeyin tahtadaki karşılığı.
  // Sıra kayınca her düzen başka bir temaya düştü ve engeller temadan
  // geliyor. Ölçülüp tek tek düzeltildi (`fruitHoleThemeObstacles`):
  // Maze artık Paris'te ve Paris çamur vermiyor, rüzgâr veriyor.
  //
  // Engel de temadan geliyor: Cube World'ün izin verdikleri silindir ve
  // rüzgâr, mancınık o tahtaya hiç gelmiyor. Aracın ikinci bekçisi bunu da
  // söyledi — klipte olmayan bir engeli vaat etmek, klibi yalan yapardı.
  { id: 'cubes',     pattern: 'Cubes',     engel: 'silindir', note: 'Cube World · küp bloklar · ızgara tahta' },
  { id: 'redplanet', pattern: 'Dial',      engel: 'mancınık', note: 'Red Planet · kızıl toz, kadran düzeni · 216 meyve' },
  // jardin çıkarıldı: Maze 35. bölümde ve orası bir **görev bölümü**.
  //
  // Görev bölümlerinde hiçbir engel yerleşmiyor — ölçüldü, üç kuruluşta
  // mancınık, silindir, çamur ve rüzgâr dördü de sıfır. Yani klip hangi
  // engeli isterse istesin tutmaz; önce rüzgâr denendi (altı koşu), öncesinde
  // çamur yazıyordu, ikisi de aynı sebepten boşunaydı.
  //
  // Le Jardin'i klibe sokmak için engelsiz bir klip tipi ya da temanın başka
  // bir turdaki bölümü gerekiyor; ikisi de ayrı iş. Şimdilik listede yok.
  // { id: 'jardin', pattern: 'Maze', engel: 'rüzgâr', note: 'Le Jardin · budanmış çit labirenti' },
  { id: 'tulip',     pattern: 'Comb',      engel: 'silindir', note: 'Tulip Fields · şeritli lale tarlası · 400 meyve' },
  { id: 'matchday',  pattern: 'Cross',     engel: 'çamur',    note: 'Matchday France · çizgili çim · 459 meyve (en kalabalık)' },
  { id: 'forbidden', pattern: 'Gate',      engel: 'çamur',    note: 'Forbidden City · kırmızı kapı, taş avlu · 408 meyve' },
  { id: 'outback',   pattern: 'Boomerang', engel: 'rüzgâr',   note: 'Outback · kızıl merkez, bumerang düzeni · 201 meyve' },
  { id: 'academy',   pattern: 'Key',       engel: 'silindir', note: 'Academy · mumlu taş koridor, anahtar düzen · 243 meyve' },
  // Patron bölümü: düzen değil olay seçiliyor, o yüzden numara doğrudan.
  // İlk üç videonun en iyisi buydu (ortalama izlenme 3.35 sn; ötekiler 2.21
  // ve 2.73), o yüzden listeden çıkmıyor.
  { id: 'boss',      level: 30,            engel: 'çamur',    note: 'patron bölümü — tahtanın ucunda devasa meyve' },
];

// Engelin adını tahtadaki duruma çeviren tek yer.
//
// Sayı **ve uzaklık** birlikte isteniyor: tahtada bir mancınık olması onun
// kadrajda olduğu anlamına gelmiyor, ve kadrajın dışındaki bir engel klibin
// sözünü tutmuyor. Kamera deliği takip ediyor ve gösterdiği yer x'te ±5.4,
// z'de ±9.6 birim; 8 birim ikisinin arasında makul bir yarıçap.
const ENGEL_R = Number(arg('engelr', 8));
// Sayfaya kuruluyor, parametre olarak geçirilmiyor: aynı okuma iki yerde
// gerekiyor (tahta kurulduğunda bir kez, sonra kayıt penceresi aranırken her
// karede) ve kare başına fazladan bir tur konteynerde pahalı.
const ENGEL_KUR = () => {
  window.__engel = (ad) => {
    const w = window.fruitHoleWhere();
    // Uzaklık **ve yer**: ısınma engele doğru sürüyor, yani yalnızca "ne
    // kadar uzakta" yetmiyor, "nerede" de gerekiyor.
    const enYakin = (l) => {
      let en = null, ed = Infinity;
      for (const o of l) {
        const d = Math.hypot(o.x - w.x, o.z - w.z);
        if (d < ed) { ed = d; en = o; }
      }
      return en ? { sayi: l.length, uzak: +ed.toFixed(2), x: en.x, z: en.z }
                : { sayi: 0, uzak: null, x: null, z: null };
    };
    if (ad === 'mancınık') return enYakin(window.fruitHoleCatapults().yerler);
    if (ad === 'silindir') return enYakin(window.fruitHoleRollers().yerler);
    if (ad === 'çamur')    return enYakin(window.fruitHoleMud().yerler);
    // Rüzgâr bir şerit, bir nokta değil: tahtanın tamamını x'te kesiyor,
    // yani uzaklık yalnızca z'de ölçülüyor ve gidilecek yer deliğin kendi
    // x'i — şeride dik gitmek en kısa yol.
    if (ad === 'rüzgâr')   { const v = window.fruitHoleWind();
      return v.var ? { sayi: 1, uzak: +Math.abs(v.z - w.z).toFixed(2), x: w.x, z: v.z }
                   : { sayi: 0, uzak: null, x: null, z: null }; }
    if (ad === 'rakip')    { const v = window.fruitHoleRival();
      return v.var ? { sayi: 1, uzak: +Math.hypot(v.x - w.x, v.z - w.z).toFixed(2), x: v.x, z: v.z }
                   : { sayi: 0, uzak: null, x: null, z: null }; }
    return { sayi: 0, uzak: null, x: null, z: null };
  };
};
// Temanın engel çifti: adı `themeObstacles`'ın kullandığı İngilizce karşılık.
const ENGEL_ID = { 'mancınık': 'catapult', 'silindir': 'roller',
                   'çamur': 'mud', 'rüzgâr': 'wind' };


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
  const tbl = await pg.evaluate(() => window.fruitHoleThemeTable());
  const order = tbl.order;
  const patternThemes = tbl.patternThemes;
  // Çözülen bölümün tahtası gerçekten o düzen mi?
  //
  // Düzen adıyla istemek bölüm numarasının eskimesini çözmüştü ama ikinci
  // bir eskime var: resim, şerit ve bulmaca tahtaları tahtayı **desenden
  // değil bölüm numarasından** alıyor. Bir düzen o yuvalardan birine kayarsa
  // dosya yine aynı adla video üretiyor — ama `arena.mp4`'te arena düzeni
  // yok, ekranda bir şerit tahtası var.
  //
  // Bu tam olarak oldu: bölüm sırası kırk sekiz düzene göre yeniden
  // kurulduğunda `Ring` 26'ya (şerit), `Diamond` 28'e (bulmaca) ve
  // `Lattice` 6'ya (şerit) düştü. Üç klip yanlış şeyi çekiyordu ve bunu
  // ancak videoyu izleyen biri fark edebilirdi. Artık koşu başlamadan
  // düşüyor.
  const tahta = await pg.evaluate(o => o.map((_, i) => {
    const p = window.fruitHoleProbe(i + 1);
    return p.kind;
  }), order);
  for (const c of CLIPS) {
    if (!c.pattern) continue;
    const i = order.indexOf(c.pattern);
    if (i < 0) throw new Error(`düzen bulunamadı: ${c.pattern} — oyundakiler: ${order.join(', ')}`);
    if (tahta[i] !== 'ızgara') {
      throw new Error(`${c.id}: ${c.pattern} düzeni ${i + 1}. bölümde ve o bölüm bir ` +
        `${tahta[i]} tahtası — düzen ekrana hiç gelmiyor. Başka bir düzen seç.`);
    }
    c.level = i + 1;
  }
  // Sözü verilen engeli **tema kabul ediyor mu?**
  //
  // Bu, ikisinden ucuz olan doğrulama ve listeyi anında yakalıyor:
  // `themeObstacles` yerin adından türetiliyor, yani deterministik — tohuma,
  // rastgeleliğe, koşuya bağlı değil. Dokuz klibin mancınık sözünü tutmadığı
  // tam burada görünürdü ve iki dakikalık bir çekim beklemek gerekmezdi.
  //
  // Eşik de burada bakılıyor: `suburb` 22. bölümdeydi ve teması çamur+rüzgâr
  // kabul ediyordu, ama ikisinin eşiği de (29, 34) 22'nin üstünde. Yani
  // "tema izin veriyor" yetmiyor, bölümün o engeli görecek kadar ileride
  // olması da gerekiyor.
  const esik = await pg.evaluate(() => ({
    'mancınık': window.fruitHoleCatapults().ilkBolum,
    'silindir': window.fruitHoleRollers().ilkBolum,
    'çamur': window.fruitHoleMud().ilkBolum,
    'rüzgâr': window.fruitHoleWind().ilkBolum,
  }));
  for (const c of CLIPS) {
    if (!c.engel) throw new Error(`${c.id}: hangi engeli göstereceği yazılmamış.`);
    const id = ENGEL_ID[c.engel];
    if (!id) throw new Error(`${c.id}: '${c.engel}' bilinen bir engel adı değil.`);
    if (c.level < esik[c.engel]) {
      throw new Error(`${c.id}: ${c.engel} ${esik[c.engel]}. bölümden başlıyor ama ` +
        `klip ${c.level}. bölümde — o tahtada hiç çıkmaz. Başka bir düzen seç.`);
    }
    // Numarası elle verilen klip de atlanmıyor: tema bölüm numarasından
    // geliyor (`PATTERNS[(level - 1) % n].theme`), yani `boss` için de
    // sorulabilir ve sorulmalı — o tahtanın engelleri de yere bağlı.
    const tid = patternThemes[(c.level - 1) % patternThemes.length];
    const izin = await pg.evaluate(t => window.fruitHoleThemeObstacles(t), tid);
    // Tanıtım bölümü muafiyeti, `obstacleHere`'in aynısı: bir engelin ilk
    // bölümünde o engel yerin çiftinde olmasa da çıkıyor, çünkü oyuncu onu
    // bir yerde öğrenmek zorunda ve öğrendiği bölüm o.
    //
    // Bu satır olmadan doğrulama kendi işini fazla iyi yapıyordu: `jardin`
    // 29. bölümde ve Le Jardin'in çifti catapult+wind, ama 29 çamurun
    // tanıtım bölümü — yani çamur orada **garanti**, listede en güvenilir
    // tahta. Doğrulama onu reddediyordu.
    const tanitim = c.level === esik[c.engel];
    if (!tanitim && !izin.includes(id)) {
      throw new Error(`${c.id}: ${c.pattern} düzeni ${c.level}. bölümde, orada ` +
        `${tid} teması var ve o temanın engelleri ${izin.join(', ')} — ` +
        `${c.engel} o tahtaya hiç gelmiyor. Başka bir düzen ya da başka bir engel seç.`);
    }
  }
  await pg.close();
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
  await pg.addInitScript(ENGEL_KUR);
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

  // Söz verilen engel **gerçekten tahtada mı?**
  //
  // Tema izni yukarıda bakıldı ve deterministik; bu başka bir soru. Engel
  // yerleştirme rastgele ve **başarısız olabiliyor**: `placeCatapults` kenar
  // payı, doğuş yeri, kolosun önü ve her kayadan bir ağız boyu uzaklık
  // şartlarını sağlayan bir yer arıyor, ve bulamazsa sessizce boş dönüyor.
  // (Tanıtım bölümünde kırk tohumun on birinde tam bu oluyordu; orada deneme
  // sayısı kırk kata çıkarıldı, ötekilerde değil.)
  //
  // Yani izin var diye engel var değil. Burada tahtanın kendisine bakılıyor.
  const sozu = await pg.evaluate(a => window.__engel(a), clip.engel);
  if (!sozu.sayi) {
    // "Yeniden çalıştır, tahta rastgele" her zaman doğru değil.
    //
    // jardin altı denemenin altısında bu satırı verdi ve altısı da boşunaydı:
    // 35. bölüm bir **görev bölümü** ve görev bölümünde hiçbir engel
    // yerleşmiyor. Mesaj "rastgele, tekrar dene" dediği için altı kez
    // denendi; oysa orada hiçbir tohum tutmaz.
    //
    // Tahtada başka engel var mı diye bakmak ikisini ayırıyor: hiç yoksa
    // bu bölümün kuralı, varsa yerleştirmenin şansı.
    const hepsi = await pg.evaluate(() => ({
      mancınık: (window.fruitHoleCatapults().yerler || []).length,
      silindir: (window.fruitHoleRollers().yerler || []).length,
      çamur: (window.fruitHoleMud().yerler || []).length,
      rüzgâr: window.fruitHoleWind().var ? 1 : 0,
    }));
    const baska = Object.entries(hepsi).filter(([, n]) => n > 0)
      .map(([k, n]) => `${k}:${n}`);
    throw new Error(baska.length
      ? `${clip.id}: ${clip.engel} bu tahtaya yerleşmedi, ama tahtada ` +
        `${baska.join(', ')} var — yerleştirmenin şansı. Yeniden çalıştır.`
      : `${clip.id}: ${clip.engel} bu bölümde **hiç** çıkmıyor — tahtada ` +
        `hiçbir engel yok. Görev bölümleri (her onuncunun beşincisi) engelsiz. ` +
        `Yeniden çalıştırmak işe yaramaz; klibin bölümünü ya da engelini değiştir.`);
  }
  console.log(`  ${clip.engel}: ${sozu.sayi} tane, en yakını ${sozu.uzak} birim`);

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
  //
  // `git`: ısınma sırasında engele doğru sürülsün mü, ve hangi engele?
  //
  // Bu, ölçülerek eklendi. Engel şartı ilk hâliyle beklemeye bırakılmıştı —
  // bot en yakın meyveyi kovalıyor, mancınık tahtanın öteki ucunda, ve
  // şartın tutması tesadüfe kalıyordu. Tikal'de ölçüldü: mancınık tahta
  // kurulduğunda **18.32 birim** ötedeydi, delik ona on sekiz saniyede
  // sürüklendi, ve o on sekiz saniyede tahtanın 110/275'i yendi. Kayıt
  // başladığında şartın ikisi birden düşmüştü: çevrede 41 meyve (50
  // gerekiyor) ve kadrajda dev yok. Bölüm de arama bitmeden kazanıldı,
  // yani klip ödemesiz kesildi.
  //
  // Beklemek yerine **gitmek**: engel uzaktaysa ona doğru sürülüyor, bir
  // kez kadraja girdiğinde sıradan süpürmeye dönülüyor. Delik yol boyunca
  // zaten meyve yiyor, yani tahta süpürülmüş olmuyor — süpürme engele doğru
  // oluyor. Engele yapışma riski yok: yönelme yalnızca `ENGEL_R` (8 birim)
  // dışındayken, mancınığın yarıçapı 0.9.
  const adim = (avla = true, git = null) => pg.evaluate(([dt, av, ad, r]) => {
    const w = window.fruitHoleWhere();
    const g = window.fruitHoleGiantList();
    const yut = av ? g.filter(x => x.eatable && x.dist < 15) : [];
    let hedef = yut.length ? yut[0] : null;
    if (!hedef && ad) {
      const e = window.__engel(ad);
      if (e.uzak !== null && e.uzak > r) hedef = { x: e.x, z: e.z };
      // Eşik `ENGEL_R`'nin kendisi değil, **%70'i**. Tam sınırda bırakmak
      // deliği sınırın dışına salıyor: engel 8 birime gelince yönelme
      // kesiliyor, delik en yakın meyveyi kovalamaya dönüyor ve 3.4 birim/sn
      // hızla birkaç saniyede 8'in ötesine çıkıyor. %70'te bırakınca delik
      // engelin çevresinde dolanıyor — yaklaşıyor, yanındakini süpürüyor,
      // biraz uzaklaşıyor, geri geliyor — ve şartın tutabileceği pencere
      // açık kalıyor.
    }
    // En yakın meyve değil, **en kalabalık yer**.
    //
    // `fruitHoleNearest` deliği kendi açtığı boşlukta tutuyordu: çevresini
    // yiyor, geriye tek tük parçalar kalıyor, en yakın olan da onlardan biri
    // oluyor. Arama "çevrede 50 meyve" şartını beklerken delik oradan hiç
    // çıkmıyor ve sayı yükselmek yerine düşüyor. Ölçüldü: on üç denemenin
    // on ikisi "çevrede meyve 2-43 < 50" diye düştü, oysa her tahtada 62 ile
    // 267 arası parça alan bir daire var (`holeyogun`).
    //
    // Hedef artık o daire: parçalar 3 birimlik kovalara bölünüyor, en dolu
    // kova seçiliyor. Uzaklık cezası, deliği tahtanın öbür ucuna
    // göndermemek için — yakındaki iyi yer, uzaktaki en iyi yerden değerli.
    if (!hedef) {
      const p = window.fruitHoleFruitSpots();
      const kova = new Map();
      for (const f of p) {
        const k = Math.round(f.x / 3) + ',' + Math.round(f.z / 3);
        const v = kova.get(k);
        if (v) { v.n++; v.x += f.x; v.z += f.z; }
        else kova.set(k, { n: 1, x: f.x, z: f.z });
      }
      let en = null;
      for (const v of kova.values()) {
        const cx = v.x / v.n, cz = v.z / v.n;
        const d = Math.hypot(cx - w.x, cz - w.z);
        const puan = v.n / (1 + d / 12);
        if (!en || puan > en.puan) en = { puan, x: cx, z: cz };
      }
      if (en) hedef = { x: en.x, z: en.z };
    }
    if (!hedef) hedef = window.fruitHoleNearest();
    if (!hedef) window.fruitHoleSteer(0, 0);
    else {
      const dx = hedef.x - w.x, dz = hedef.z - w.z;
      const d = Math.hypot(dx, dz) || 1;
      window.fruitHoleSteer(dx / d, dz / d);
    }
    window.__step(dt);
    // `kartPay`: kartların ne kadarı tamamlandı. Av penceresinin ikinci
    // tetiği bu — aşağıda sebebi yazılı.
    const k = window.fruitHoleCards().cards;
    const ister = k.reduce((a, c) => a + c.need, 0);
    const oldu = k.reduce((a, c) => a + Math.min(c.need, c.got), 0);
    return { dev: g.length, eaten: w.eaten, total: w.total, timeLeft: w.timeLeft,
             state: w.state, kartPay: ister ? +(oldu / ister).toFixed(2) : 0 };
  }, [1000 / FPS, avla, git, ENGEL_R * 0.7]);
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
  const durum = () => pg.evaluate(([r, ad]) => {
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
      // Sözü verilen engel kadrajda mı.
      engelUzak: window.__engel(ad).uzak,
    };
  }, [AHEAD_R, clip.engel]);
  // Dördüncü şart: dev yalnızca yutulamaz değil, **neredeyse** yutulabilir
  // olmalı.
  //
  // Beach klibinde çıktı: birinci bölümde delik küçücük başlıyor ve kadrajdaki
  // dev karpuz onun üç katı. Açılış sözü veriyordu ama dokuz saniyede delik o
  // boya ulaşmıyordu; arama süresi bitti ve klip ödemesiz kesildi. Söz
  // verilecek dev, o sözün tutulabileceği kadar yakın olmalı.
  // Beşinci şart: engel **kadrajda** olsun.
  //
  // Tahtada olması yetmiyor, ve bu farkı ölçmeden görmek mümkün değil.
  // Tahta 27 birim geniş, kamera 11 birim gösteriyor: tahtanın dörtte
  // birinden azı ekranda. Mancınık öteki ucundaysa klip onu hiç
  // göstermiyor — ve klip "burada bir şey oluyor" sözünü tam olarak
  // böyle tutmuyordu.
  // Dört şart ve beşincisi, **ayrı ayrı sorulabiliyor.**
  //
  // Beşi birden isteyen tek bir koşul, tutmadığında elindeki kareyi
  // olduğu gibi alıyordu — yani engel şartı eklenince klip hem engelsiz hem
  // devsiz çıkabiliyordu, eskisinden kötü. Beşinci şart ötekileri
  // kaybetmeye değmiyor: dev ve kalabalık tahta ölçülmüş olarak işe
  // yarıyor (patron klibi 3.35 sn, ötekiler 2.21 ve 2.73), engel ise
  // henüz bir hipotez.
  //
  // O yüzden arama iki aşamalı: önce beşi, sonra dördü. Geri adım bir
  // yerde yazılı olmalı, yoksa "şart sağlanmadı" satırı klibin neyi
  // kaybettiğini söylemiyor.
  const dortu = d => d.yakin >= AHEAD_MIN && Math.abs(d.x) <= d.halfX - EDGE
    && d.dev > 0 && d.yutulabilir === 0 && d.buyukluk <= NEAR_MAX;
  const engelde = d => d.engelUzak !== null && d.engelUzak <= ENGEL_R;
  const uygun = d => dortu(d) && engelde(d);
  let warm = 0;
  // Isınmanın ilk kısmı da engele doğru: delik büyürken yolu oraya çıksın.
  for (; warm < Math.round(PRE_MIN * FPS); warm++) await adim(false, clip.engel);
  const enCok = Math.round(PRE_MAX * FPS);
  let d = await durum();
  while (warm < enCok && !uygun(d)) {
    await adim(false, clip.engel);
    d = await durum();
    warm++;
  }
  // İkinci aşama: engel şartı bırakılıyor, öteki dördü aranıyor. Burada
  // artık engele doğru sürülmüyor — sürmek ötekileri bozan şeydi.
  //
  // İkinci aşama **kısa**: `PRE_MAX`in üçte biri. Ölçüldü ve sebebi burada
  // görüldü — ilk hâli bir `PRE_MAX` daha veriyordu ve o süre boyunca
  // delik engelden uzaklaşıyordu. Tikal'de kayıt mancınık 19.47 birim
  // ötedeyken başladı; delik ilk aşamada ona yaklaşmıştı (ölçülü: 17 birim
  // 5 saniyede kapanıyor), ikinci aşamanın dört saniyesinde meyve
  // kovalayarak geri açtı. Delik 3.4 birim/sn gidiyor, yani her saniye
  // 3.4 birim kayıp.
  let engelsiz = false;
  if (!uygun(d)) {
    const ikinci = enCok + Math.round(PRE_MAX / 3 * FPS);
    while (warm < ikinci && !dortu(d)) {
      await adim(false);
      d = await durum();
      warm++;
    }
    engelsiz = dortu(d);
  }
  console.log(`  kayıt ${(warm / FPS).toFixed(1)}. saniyede başlıyor · ` +
    `çevrede ${d.yakin} meyve · kenara ${(d.halfX - Math.abs(d.x)).toFixed(1)} birim · ` +
    `kadrajda ${d.dev} dev (yutulabilir ${d.yutulabilir}, büyüklük ${d.buyukluk}) · ` +
    `${clip.engel} ${d.engelUzak === null ? 'yok' : d.engelUzak + ' birim'}` +
    (uygun(d) ? ''
      : engelsiz ? `  (${clip.engel} kadraja girmedi, dört şartla alındı)`
      : '  (şart sağlanmadı, üst sınıra dayandı)'));
  // Hangi şartın tutmadığı yazılıyor. Beş şart var ve "şart sağlanmadı"
  // hangisini aramaya devam etmek gerektiğini söylemiyor — `--premax` mı
  // artmalı, `--engelr` mi gevşemeli, yoksa tahta mı yanlış.
  if (!uygun(d)) {
    const eksik = [];
    if (!(d.yakin >= AHEAD_MIN)) eksik.push(`çevrede meyve ${d.yakin} < ${AHEAD_MIN}`);
    if (!(Math.abs(d.x) <= d.halfX - EDGE)) eksik.push('delik kenarda');
    if (!(d.dev > 0)) eksik.push('kadrajda dev yok');
    if (!(d.yutulabilir === 0)) eksik.push('dev şimdiden yutulabilir');
    if (!(d.buyukluk <= NEAR_MAX)) eksik.push(`dev çok büyük (${d.buyukluk} > ${NEAR_MAX})`);
    if (!(d.engelUzak !== null && d.engelUzak <= ENGEL_R)) {
      eksik.push(`${clip.engel} kadraj dışında (${d.engelUzak} > ${ENGEL_R})`);
    }
    console.log(`  tutmayan: ${eksik.join(' · ')}`);
    // Şart tutmadıysa klip **çıkmıyor**.
    //
    // Eskiden çıkıyordu, ve çıkan şey tahtanın en boş anıydı: arama şart
    // tutana kadar oynamaya devam ediyor, oynarken de çevresini yiyor, ve
    // üst sınıra dayandığında kayıt tam oradan başlıyordu. redplanet ve
    // academy kareleri böyle çıktı — bomboş zemin, kenarda iki muz.
    //
    // Geri sarılamıyor (tahta her koşuda rastgele, aynı kare bir daha
    // kurulamıyor), o yüzden tek doğru davranış vazgeçmek. Engel
    // yerleşmediğinde zaten böyle yapılıyordu; aynı kural buraya da.
    if (!engelsiz) {
      throw new Error(`${clip.id}: şart tutmadı — ${eksik.join(' · ')}. ` +
        `Klip tahtanın en boş anından çıkardı. Yeniden çalıştır, tahta rastgele.`);
    }
  }

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
  let f = 0, yutuldu = -1, erken = 0, onceki = null, kartBitti = false, bitti = null;
  let ilkYenen = null, sonYenen = null, ilkSaat = null, sonSaat = null;
  while (true) {
    // Av penceresi iki tetikli: ya klibin son saniyeleri, ya **kartlar
    // bitmek üzere**.
    //
    // İkincisi ölçülerek eklendi. Tikal'de kayıt sırasında bölüm
    // *kazanıldı*: kartlar 181 meyvede doldu, `state` 'won' oldu ve döngü
    // kırıldı — dev hâlâ tahtada, klip ödemesiz. Beklemek işe yaramaz,
    // çünkü beklenen şeyin kendisi bölümü bitiriyor.
    //
    // Kartların %85'i dolduğunda ava geçiliyor: ödeme sonda kalıyor ama
    // bölümün sonundan **önce** geliyor.
    const s = await adim(f >= AV_BASLA || kartBitti);
    if (s.kartPay >= 0.85) kartBitti = true;
    if (ilkYenen === null) { ilkYenen = s.eaten; ilkSaat = s.timeLeft; }
    sonYenen = s.eaten; sonSaat = s.timeLeft;
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
    if (s.state !== 'playing') { bitti = s.state; break; }   // bölüm bitti
  }
  const son = await pg.evaluate(() => window.fruitHoleWhere());
  // Ödemenin **neden** gelmediği: arama süresi mi bitti, bölüm mü bitti.
  // İkisi ayrı sorun ve ayrı cevapları var — biri `--search`'ü artırmak,
  // öteki başka bir tahta ya da daha erken av.
  await pg.close();

  const sonKare = yutuldu >= 0 ? Math.min(f - 1, yutuldu + TAIL) : f - 1;
  const basKare = Math.max(0, sonKare - total + 1);
  const adet = sonKare - basKare + 1;
  console.log(`  ${f} kare çekildi · yenen ${son.eaten}/${son.total} · durum ${son.state}   `);
  console.log(`  gövde ${basKare}-${sonKare} arası (${(adet / FPS).toFixed(1)} sn) · ` +
    (yutuldu >= 0
      ? `dev ${((yutuldu - basKare + coldN) / FPS).toFixed(1)}. saniyede yutuluyor`
      : bitti
        ? `UYARI: dev yutulmadan bölüm '${bitti}' oldu — ödeme yok. ` +
          `Kartlar dev avlanmadan dolmuş; başka bir tahta ya da daha erken av gerek.`
        : 'UYARI: dev yutulmadı, arama süresi bitti — ödeme yok (--search artırılabilir)') +
    (erken ? ` · ${erken} erken yutma atlandı` : ''));

  // Yenen meyve sayısı sıfırsa video boş bir tarla gösteriyor demektir;
  // sessizce bir dosya bırakmaktansa söylemek daha iyi.
  if (son.eaten === 0) console.log('  UYARI: hiç meyve yenmemiş, klibe bakmadan yayınlama.');

  // **Tahta gerçekten kıpırdadı mı?**
  //
  // Bu kontrol bir felaketten sonra yazıldı. Oyunda, bir nesnenin yutulması
  // kare döngüsünü kalıcı olarak durduran bir hata vardı (`currency:
  // 'apple'`; `tick`'in son satırı `requestAnimationFrame` olduğu için
  // istisna bir sonraki kareyi hiç planlamıyor). Dokuz klip üretildi,
  // **altısı donmuş bir tahtayı** dokuz saniye kaydetti, ve araç hiçbir şey
  // demedi: kareler çekiliyordu, video çıkıyordu, dosya oradaydı.
  //
  // İki sayı yeterdi ve ikisi de zaten elde: kaydın başındaki ve sonundaki
  // yenen meyve sayısı, ve saat. İkisi de kıpırdamadıysa kaydedilen şey bir
  // fotoğraf.
  //
  // Dosya boyutu da söylüyordu (donmuş klip 363 KB, çalışan 4 MB) ama o
  // dolaylı bir işaret; bu doğrudan.
  const ilerledi = (sonYenen - ilkYenen) > 0 || (ilkSaat - sonSaat) > 1;
  if (!ilerledi) {
    throw new Error(`${clip.id}: kayıt boyunca tahta hiç kıpırdamadı ` +
      `(yenen ${ilkYenen} -> ${sonYenen}, saat ${ilkSaat} -> ${sonSaat}). ` +
      `Oyun donmuş: kare döngüsü bir istisnayla durmuş olabilir.`);
  }

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
