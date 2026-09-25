// Bulmaca bölümü: tahta gerçekten çözülebilir mi, ve gerçekten bir soru mu?
//
//   node build-www.mjs && node scratchpad/holepuzzle.mjs
//
// Neden var: bu bölüm tipinin tamamı üretilmiş bir tahtaya dayanıyor ve
// üretilmiş bir tahtanın iki ayrı şekilde bozulması mümkün — ikisi de oyunu
// açıp bakınca fark edilmiyor:
//
//   1. **İmkânsız tahta.** Kapılar öyle çıkmış ki hiçbir sıra yürümüyor.
//      Oyuncu doğru oynar, bölüm yine bitmez, ve ekranda bunu söyleyen hiçbir
//      şey olmaz. Oyunun verdiği en kötü ceza: kendi hatasını oyuncuya
//      yüklemek.
//   2. **Sorusuz tahta.** Kapılar öyle geniş ki hangi sırayla girersen gir
//      oluyor. Bölüm bulmaca gibi görünür, bulmaca değildir — ve hiçbir hata
//      vermez.
//
// İkisi de sayıyla ölçülüyor. Üçüncü bir şey daha ölçülüyor ve en önemlisi o:
// kapı genişliği **tasarlanan** sayıdan değil, tahtaya **konan kayalardan**
// okunuyor. Aradaki fark, oyunun gösterdiği kapıyla oyunun uyguladığı kapının
// ayrışması demek olurdu.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((req, res) => {
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-fruithole' + p);
    res.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8207);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = [];
pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
pg.on('console', m => {
  if (m.type() === 'error' && !m.text().includes('404')) errs.push('CONSOLE: ' + m.text());
});
await pg.goto('http://localhost:8207/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.fruitHolePuzzle === 'function', { timeout: 30000 });

const fails = [];
const check = (ok, ad, not = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ad}${not ? '   ' + not : ''}`);
  if (!ok) fails.push(ad + (not ? ' — ' + not : ''));
};

// Kapının **ölçülen** genişliği: dikey duvardaki kayalar arasındaki en büyük
// boşluk, o odanın bandı içinde. Tasarlanan sayıya hiç bakmıyor.
function olculenKapi(rocks, wallX, z0, z1) {
  const duvar = rocks
    .filter(r => Math.abs(r.x - wallX) < 0.01 && r.z > z0 - 4 && r.z < z1 + 4)
    .map(r => r.z)
    .sort((a, b) => a - b);
  let en = 0, cift = null;
  for (let i = 1; i < duvar.length; i++) {
    const d = duvar[i] - duvar[i - 1];
    // Bandın içinde kalan boşluklar: kapının ortası bu odanın bandında olmalı.
    const orta = (duvar[i] + duvar[i - 1]) / 2;
    if (orta < z0 || orta >= z1) continue;
    if (d > en) { en = d; cift = [duvar[i - 1], duvar[i]]; }
  }
  return { gap: en, cift };
}

const SEVIYELER = [18, 28, 38, 48, 58, 68, 78, 88];
let sorulu = 0, toplam = 0;

for (const lv of SEVIYELER) {
  console.log(`\n--- bölüm ${lv} ---`);
  const p = await pg.evaluate((n) => {
    window.fruitHoleProbe(n);
    return window.fruitHolePuzzle();
  }, lv);
  toplam++;

  check(p.rooms.length === (lv >= 28 ? 4 : 3), 'oda sayısı', String(p.rooms.length));
  check(p.feasible === true, 'tahta çözülebilir');

  // Kapılar: ölçülen genişlik tasarlananla aynı mı, ve delik gerçekten geçiyor mu?
  for (const rm of p.rooms) {
    const { gap } = olculenKapi(p.rocks, p.wallX, rm.z0, rm.z1);
    const fark = Math.abs(gap - rm.gap);
    check(fark < 0.02, `oda ${rm.i} kapısı kayalardan ölçüldü`,
          `tasarım ${rm.gap.toFixed(2)} · ölçülen ${gap.toFixed(2)}`);
    // Kapı, o odanın bandından taşmamalı — taşarsa duvardan geriye bir şey kalmaz.
    check(rm.gap < rm.z1 - rm.z0, `oda ${rm.i} kapısı bandın içinde`,
          `${rm.gap.toFixed(2)} < ${(rm.z1 - rm.z0).toFixed(2)}`);
    check(rm.kalan > 0, `oda ${rm.i} boş değil`, String(rm.kalan));
  }

  // Geçiş fiziği: sınırın altındaki delik geçiyor, üstündeki geçmiyor.
  // Ölçülen şey oyunun kendi çarpışma kuralı, bizim aritmetiğimiz değil.
  for (const rm of p.rooms) {
    const gec = await pg.evaluate(([wallX, cz, limit]) => {
      const dene = (r) => {
        // Kapının tam ortasına, duvarın üstüne koy ve kayalar nereye itiyor bak.
        const s = window.fruitHolePushTest(wallX, cz, r);
        return Math.abs(s.x - wallX) < 0.01 && Math.abs(s.z - cz) < 0.01;
      };
      return { altinda: dene(limit - 0.05), ustunde: dene(limit + 0.12) };
    }, [p.wallX, rm.cz, rm.limit]);
    check(gec.altinda, `oda ${rm.i}: sınırın altındaki delik kapıdan geçiyor`);
    check(!gec.ustunde, `oda ${rm.i}: sınırın üstündeki delik geçmiyor`);
  }

  // Ara duvarlar dolu mu?
  //
  // İlk hâli deliği duvarın üstüne koyup itilmesine bakıyordu ve yanlıştı:
  // kaya deliği **duvar boyunca** itince z değişmiyor, yani "geçti" diye
  // okunuyordu. Ölçülecek şey itiş değil, kayaların arasındaki boşluk: iki
  // komşu kaya merkez merkeze `2*(r + ROCK_R)`den yakınsa o delik aradan
  // geçemez. En küçük delik 0.55, yani eşik 2.34.
  const ESIK = 2 * (0.55 + p.rockR);
  for (const rm of p.rooms.slice(1)) {
    const z = rm.z0;
    const duvar = p.rocks.filter(r => Math.abs(r.z - z) < 0.01).map(r => r.x).sort((a, b) => a - b);
    let en = 0;
    for (let i = 1; i < duvar.length; i++) en = Math.max(en, duvar[i] - duvar[i - 1]);
    check(duvar.length > 2 && en < ESIK, `ara duvar z=${z.toFixed(1)} dolu`,
          `${duvar.length} kaya · en geniş aralık ${en.toFixed(2)} < ${ESIK.toFixed(2)}`);
    // Duvarın iki ucu: solda tahtanın kenarını aşmalı, sağda dikey duvara
    // değmeli. Bir uçta yarım kaya eksikliği, odanın etrafından dolaşılması
    // demek — ve o hiçbir yerde hata vermez.
    check(duvar[0] <= -6.82, `ara duvar z=${z.toFixed(1)} sol kenarı kapatıyor`,
          String(duvar[0]));
    check(duvar[duvar.length - 1] >= p.wallX - 0.01,
          `ara duvar z=${z.toFixed(1)} dikey duvara değiyor`, String(duvar[duvar.length - 1]));
  }

  // Koridorda meyve yok: orası düşünme yeri.
  const koridorda = p.fruits.filter(f => f.x > p.wallX).length;
  check(koridorda === 0, 'koridor boş', String(koridorda));

  // Meyve duvarın dibinde kalmamış mı? Delik bir kayaya `r + 0.62`den fazla
  // yaklaşamıyor ve yutmak için meyvenin merkezine `0.95 * r` kalması gerek.
  // Ulaşılamayan tek bir meyve, bitirilemeyen bir bölüm demek.
  let ulasilmaz = 0;
  for (const rm of p.rooms) {
    const rGiris = rm.limit;                       // o odaya girerken en geniş hâli
    const icinde = p.fruits.filter(f => f.x < p.wallX && f.z >= rm.z0 && f.z < rm.z1);
    for (const f of icinde) {
      const enYakin = Math.min(...p.rocks.map(r => Math.hypot(r.x - f.x, r.z - f.z)));
      // En kötü hâl: odadaki en büyük yarıçapla. Küçükken yenebiliyorsa sorun yok.
      const kucuk = ROCK_ERISIM(0.62, 0.55, enYakin);
      const buyuk = ROCK_ERISIM(0.62, rGiris, enYakin);
      if (!kucuk && !buyuk) ulasilmaz++;
    }
  }
  check(ulasilmaz === 0, 'her meyveye ulaşılabiliyor', `${ulasilmaz} ulaşılmaz`);

  // Tahta bir soru soruyor mu? Tembel sıra (doğduğun uçtan başlayıp ilerlemek)
  // düşmeli. Düşmüyorsa bölüm bulmaca gibi görünen bir süpürme.
  const tembel = p.rooms.map((_, i) => p.rooms.length - 1 - i);
  const yurur = (sira) => {
    let r = p.r0;
    for (let k = 0; k < sira.length; k++) {
      const rm = p.rooms[sira[k]];
      if (r > rm.limit) return false;
      r = Math.min(p.holeMax, r + rm.g);
      if (k < sira.length - 1 && r > rm.limit) return false;
    }
    return true;
  };
  if (!yurur(tembel)) sorulu++;
  console.log(`  tembel sıra ${yurur(tembel) ? 'yürüyor (soru zayıf)' : 'düşüyor'}` +
              ` · kurulan sıra ${p.order.join('→')}` +
              ` · kapılar ${p.rooms.map(r => r.gap.toFixed(1)).join('/')}` +
              ` · büyüme ${p.rooms.map(r => r.g.toFixed(2)).join('/')}`);
}

function ROCK_ERISIM(rockR, holeR, enYakin) {
  // Delik merkezi kayaya en fazla `holeR + rockR` kadar yaklaşabiliyor; meyveyi
  // yutmak için merkezine `0.95 * holeR` kalması gerekiyor.
  return enYakin - (holeR + rockR) >= -0.95 * holeR;
}

// --- oyun içi "sıkıştın" kararı ---
//
// Tek yönlü olmak zorunda: hâlâ yolu olan bir oyuncuya sıkıştın demek,
// bölümünü elinden almak demek.
console.log('\n--- sıkışma ---');
{
  const r = await pg.evaluate(() => {
    window.fruitHoleProbe(18);
    const p0 = window.fruitHolePuzzle();
    const dogus = window.fruitHolePuzzlePut(-1, p0.r0);
    // Kurulan sıra ile oyna: hiçbir adımda sıkışmamalı.
    let sikisti = null;
    for (const i of p0.order) {
      window.fruitHolePuzzlePut(i, null);
      const s = window.fruitHolePuzzleEat(i);
      if (s.stuck) { sikisti = i; break; }
      window.fruitHolePuzzlePut(-1, null);
    }
    const bitti = window.fruitHolePuzzle();
    return { dogusStuck: dogus.stuck, dogusAt: dogus.at, sikisti,
             kalan: bitti.rooms.reduce((a, rm) => a + rm.kalan, 0) };
  });
  check(r.dogusAt === -1, 'delik koridorda doğuyor', String(r.dogusAt));
  check(r.dogusStuck === false, 'doğuşta sıkışmış sayılmıyor');
  check(r.sikisti === null, 'kurulan sıra baştan sona yürüyor',
        r.sikisti === null ? '' : `oda ${r.sikisti}`);
  check(r.kalan === 0, 'tahtada meyve kalmadı', String(r.kalan));
}
{
  // Son oda tek yönlü mü?
  //
  // İlk yazışında bu "kapan odayı **önce** ye, tahta ölsün" diye ölçülüyordu
  // ve yanlıştı: o odaya önce girildiğinde delik küçük, tek başına o odanın
  // büyümesi kapıyı doldurmuyor, yani çıkabiliyor. Kapan olduğu an sırasının
  // geldiği an — geri kalan her şey yendikten sonra. Ölçülecek eşitsizlik bu.
  const r = await pg.evaluate(() => {
    window.fruitHoleProbe(18);
    const p0 = window.fruitHolePuzzle();
    const sira = p0.order, son = sira[sira.length - 1];
    let rr = p0.r0;
    for (let k = 0; k < sira.length - 1; k++) {
      rr = Math.min(p0.holeMax, rr + p0.rooms[sira[k]].g);
    }
    const cikis = Math.min(p0.holeMax, rr + p0.rooms[son].g);
    return { son, giris: rr, cikis, limit: p0.rooms[son].limit };
  });
  check(r.giris <= r.limit + 0.001, 'son odaya sırası gelince girilebiliyor',
        `${r.giris.toFixed(2)} <= ${r.limit.toFixed(2)}`);
  check(r.cikis > r.limit, 'son oda tek yönlü — yendikten sonra çıkış yok',
        `${r.cikis.toFixed(2)} > ${r.limit.toFixed(2)}`);
}
{
  // Ve asıl soru: oyun bunu **fark ediyor mu**?
  //
  // Oynatılacak sıra rastgele seçilemiyor, çünkü bir sıranın iki ayrı ölme
  // şekli var ve oyun ikisine aynı şeyi demiyor:
  //
  //   * **Giremedin.** Delik o kapıya sığmıyor. Ama başka odalara hâlâ
  //     sığıyor olabilirsin, yani tahta bitmemiştir — yalnızca **bu sıra**
  //     bitmiştir. Oyun buna sıkıştın demiyor ve dememeli: demek, hâlâ yolu
  //     olan bir oyuncunun bölümünü elinden almak olurdu.
  //   * **Çıkamıyorsun.** Odayı yedin, kapıdan geçemiyorsun ve dışarıda meyve
  //     kaldı. Bu geri dönüşsüz ve kanıtlanabilir. Oyunun göreceği hâl bu.
  //
  // İlk yazışında tembel sıra oynanıyordu ve tembel sıra çoğu tahtada
  // birinci şekilde ölüyor — test "oyun görmedi" diye düşüyordu, oysa oyun
  // doğru olanı yapıyordu. O yüzden sıra artık **aranıyor**: bütün
  // permütasyonlar aritmetikle yürütülüp ilk ölümü "çıkamadım" olan biri
  // seçiliyor, oynanan o.
  const r = await pg.evaluate(() => {
    window.fruitHoleProbe(18);
    const p0 = window.fruitHolePuzzle();
    const N = p0.rooms.length;
    const perms = [];
    (function gez(kalan, acc) {
      if (!kalan.length) { perms.push(acc); return; }
      kalan.forEach((v, i) => gez(kalan.filter((_, j) => j !== i), acc.concat(v)));
    })(p0.rooms.map((_, i) => i), []);
    // Aritmetikle yürüt: ilk ölümü "çıkamadım" olan sıra.
    let sira = null, beklenen = null;
    for (const perm of perms) {
      let rr = p0.r0, adim = null, tur = null;
      for (let k = 0; k < N; k++) {
        const rm = p0.rooms[perm[k]];
        if (rr > rm.limit) { tur = 'giremedi'; adim = k; break; }
        rr = Math.min(p0.holeMax, rr + rm.g);
        if (k < N - 1 && rr > rm.limit) { tur = 'cikamadi'; adim = k; break; }
      }
      if (tur === 'cikamadi') { sira = perm; beklenen = adim; break; }
    }
    if (!sira) return { sira: null };
    // Ve şimdi gerçekten oyna.
    let oyun = null;
    for (let k = 0; k < N; k++) {
      window.fruitHolePuzzlePut(sira[k], null);
      const s = window.fruitHolePuzzleEat(sira[k]);
      if (s.stuck) { oyun = k; break; }
      window.fruitHolePuzzlePut(-1, null);
    }
    return { sira, beklenen, oyun };
  });
  check(r.sira !== null, 'kapana düşüren bir sıra var');
  if (r.sira) {
    check(r.oyun === r.beklenen, 'oyun sıkışmayı tam o adımda görüyor',
          `sıra ${r.sira.join('→')} · beklenen ${r.beklenen} · oyun ${r.oyun}`);
  }
}

console.log(`\nsoru soran tahta: ${sorulu}/${toplam}`);
check(sorulu >= toplam - 1, 'tahtaların hemen hepsi bir soru soruyor');

if (errs.length) fails.push('sayfa hatası: ' + errs[0]);
console.log('\n' + (fails.length ? 'hatalar:\n - ' + fails.join('\n - ') : 'hepsi geçti'));
await br.close(); srv.close();
process.exit(fails.length ? 1 : 0);
