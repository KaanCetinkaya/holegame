// Patron bölümü: kolos ne kadar süpürmeye mal oluyor, ve bitirilebiliyor mu?
//
//   node build-www.mjs && node scratchpad/holeboss.mjs
//
// Her 10. bölümün sonunda tahtanın karşı ucunda tek bir kolos duruyor. İki
// şeyi aynı anda tutturması gerekiyor ve ikisi zıt yönde çekiyor:
//
//   1. **Erken alınamamalı.** Kolos her devden geniş; tarlayı süpürmeden
//      açılırsa patron olmaktan çıkıp yolda denk gelinen bir meyveye döner.
//   2. **Alınabilmeli.** Tarlanın tamamını yemek gerekiyorsa bölüm zaten
//      bitmiş demektir ve kolos bir ödül değil, bir formalite olur.
//
// Ölçülen şey: kolos açılana kadar tahtanın yüzde kaçının süpürülmesi
// gerekiyor. Devler için bu oran %30 civarı (bkz. holegate). Kolosun bundan
// belirgin yüksek ama %100'ün altında olması gerekiyor.

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
}).listen(8211);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));

const fails = [];
const check = (ok, what, saw) => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what}${saw === undefined ? '' : `   ${saw}`}`);
  if (!ok) fails.push(what);
};

await pg.goto('http://localhost:8211/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleBoss, { timeout: 25000 });

// Tohum veriliyor, ve bir tane değil üç tane.
//
// Bu tablo tohumsuzdu ve ölçtüğü oran her koşuda on puan kayıyordu: 60.
// bölüm bir koşuda %88, bir başkasında %97 çıktı ve sınır %96'ydı — yani
// test kodda hiçbir şey değişmeden arada bir düşüyordu. Sebep tarla:
// meyve sayısı 391 ile 411 arasında değişiyor, kolosun ayağının altındaki
// yoğunluk da onunla.
//
// Tek tohum ölçümü sabitler ama yayılımı da saklar — sınıra ne kadar
// yakın olduğumuz o yayılımda görünüyor. O yüzden her bölüm üç tohumla
// kuruluyor ve **en kötüsü** yazılıyor.
const TOHUM = [1, 4242, 90210];
console.log('\nbölüm | patron | meyve | kolos R | süre | kolos için | tarlanın %si');
console.log('------+--------+-------+---------+------+------------+--------------');

const rows = [];
for (const n of [9, 10, 19, 20, 30, 40, 50, 60]) {
  const hepsi = [];
  for (const s of TOHUM) {
    hepsi.push(await pg.evaluate(([lvl, tohum]) => {
      window.fruitHoleSeedField(tohum);
      const p = window.fruitHoleProbe(lvl);
      const r = { ...p, ...window.fruitHoleBoss(), theme: window.fruitHoleTheme().theme };
      window.fruitHoleUnseedField();
      return r;
    }, [n, s]));
  }
  // En kötü koşu: kolos için en çok süpürme isteyeni.
  const r = hepsi.reduce((a, b) =>
    (b.pctForColossus ?? -1) > (a.pctForColossus ?? -1) ? b : a);
  rows.push({ n, ...r });
  const araligi = hepsi.map(h => h.pctForColossus).filter(p => p != null);
  console.log(
    `${String(n).padStart(5)} | ${(r.boss ? 'evet' : 'hayır').padStart(6)} | ` +
    `${String(r.fruit).padStart(5)} | ${String(r.colossusR ?? '-').padStart(7)} | ` +
    `${String(r.seconds).padStart(4)} | ${String(r.eatsForColossus ?? '-').padStart(10)} | ` +
    `${araligi.length ? `%${Math.min(...araligi)}–%${Math.max(...araligi)}` : '-'}`);
}

// Kolos artık iki yerden geliyor: her 10. bölüm (patron) **ve** Cup Night
// (final). Bu satır "kolos varsa patrondur" diyordu ve final gelince düştü —
// 9. bölüm Cup Night. Ayıran şey tema, o yüzden bölme de temadan.
const bosses = rows.filter(r => r.n % 10 === 0);
const finalRows = rows.filter(r => r.n % 10 !== 0 && r.theme === 'Cup Night');
const plain = rows.filter(r => r.n % 10 !== 0 && r.theme !== 'Cup Night');

// Sayı da kontrol ediliyor: boş bir dizide `every` doğru diyor, yani bölme
// yanlışsa bu satır sessizce geçerdi.
check(bosses.length === 6 && bosses.every(r => r.boss), 'her 10. bölüm patron',
  `${bosses.length} bölüm`);
check(plain.every(r => !r.boss),
  'patron ya da final olmayan bölümde kolos yok',
  `${plain.length} normal, ${finalRows.length} final`);
check(plain.every(r => r.colossusR == null), 'normal bölümlerde kolos yok');
check(bosses.every(r => r.colossusR > 1.5), 'kolos her devden geniş',
  `en küçük ${Math.min(...bosses.map(r => r.colossusR))}`);
check(bosses.every(r => r.count === 1), 'tahtada tam olarak bir kolos var');

const pcts = bosses.map(r => r.pctForColossus);
console.log(`\nkolos için süpürme: %${Math.min(...pcts)} – %${Math.max(...pcts)}`);
check(Math.min(...pcts) > 45, 'kolos erken açılmıyor (devlerin %30\'undan belirgin yüksek)',
  `en düşük %${Math.min(...pcts)}`);
check(Math.max(...pcts) < 96, 'kolos açılabiliyor (tarlanın tamamı gerekmiyor)',
  `en yüksek %${Math.max(...pcts)}`);

// Patron bölümü daha mı zor?
//
// Bunu bir bot oynatarak ölçmeye çalıştım, işe yaramadı: bot normal
// bölümlerde de kaybediyordu (19. bölümde 501 meyvenin 89'u), yani
// beceriksizliğini patronun zorluğu sanmak olurdu.
//
// Sonra aynı deseni paylaşan bölümleri karşılaştırdım (20↔39, desenler 19'da
// bir dönüyor) — o da yanıltıcı çıktı: aynı desende bile meyve sayısı ve
// saat bölümden bölüme değişiyor, yani ölçtüğüm fark kolostan gelmiyordu.
//
// Değişkeni gerçekten izole etmenin tek yolu: **aynı bölümü, aynı tohumla,
// bir kolosla bir de kolossuz kurmak.** Tohum aynı olduğu için tarlanın
// geri kalanı birebir aynı; aradaki tek fark kolosun kendisi.
console.log('\nayni bölüm, ayni tohum, kolosla ve kolossuz:');
console.log('bölüm | kolos | canlı | süre | fark');
console.log('------+-------+-------+------+------');
for (const n of [10, 20, 30, 40]) {
  const build = (boss) => pg.evaluate(([lvl, b]) => {
    window.fruitHoleSeedField(4242);
    window.fruitHoleForceBoss(b);
    const p = window.fruitHoleProbe(lvl);
    const r = { ...p, ...window.fruitHoleBoss(), ...window.fruitHoleCards(),
                live: window.fruitHoleGrow().left };
    window.fruitHoleForceBoss(null);
    window.fruitHoleUnseedField();
    return r;
  }, [n, boss]);
  const on = await build(true), off = await build(false);
  const diff = on.live - off.live;
  console.log(`${String(n).padStart(5)} | ${'var'.padStart(5)} | ${String(on.live).padStart(5)} | ${String(on.seconds).padStart(4)} |`);
  console.log(`${''.padStart(5)} | ${'yok'.padStart(5)} | ${String(off.live).padStart(5)} | ${String(off.seconds).padStart(4)} | ${diff > 0 ? '+' : ''}${diff}`);
  // Tam eşitlik değil, ±2 saniye.
  //
  // Saat sabit bir sayı değil: tahtanın son hâli üzerinde benzetilen bir
  // süpürmeden çıkıyor. Kolos altındaki meyveleri alıyor ve **kaç tane**
  // aldığı o noktanın yoğunluğuna bağlı — ölçüldü, 7 ile 35 arasında
  // değişiyor. Otuz beş parça eksilince benzetim bir saniye kısa çıkıyor.
  //
  // Kayalar gelince görüldü (kaya meyve alıyor, devler başka yere düşüyor,
  // kolosun oturduğu yerin yoğunluğu değişiyor), ama sebep kayalar değil:
  // eşitlik en baştan, ölçtüğü şeyden bir tık daha katı bir şey istiyordu.
  // Sorulan soru "kolos bölümü uzatıyor mu", cevabı da bir saniye değil.
  //
  // **Kart bölümlerinde bu soru başka bir soruya dönüşüyor.** Bölümün saati
  // artık tahtanın süpürülmesinden değil kartların istediğinden çıkıyor, ve
  // kolos tahtadan meyve alıyor: kartlar kolos yerleştikten **sonra**
  // seçiliyor, yani başka renkler ve başka sayılar isteyebiliyorlar. Saatin
  // 88'den 75'e inmesi bir hata değil, "daha az iş var" demek. Mutlak saatte
  // ±2 saniye aramak, ölçülen şeyin ne olduğunu değiştirmek olurdu.
  //
  // Kart bölümünde korunması gereken şey şu: saat kartların işine oranlı
  // kalsın. Kolos `pickCards`'tan **sonra** yerleştirilse — yani birileri
  // sırayı değiştirse — kartlar tahtada kalmayan meyveyi isterdi ve o oran
  // bozulurdu. Ölçülen şey o: aynı bölümün kolosla ve kolossuz hâlinde
  // saat/iş oranı aynı mı, ve iki hâlde de kartlar ulaşılabilir mi.
  if (on.cards.length || off.cards.length) {
    // Tam eşitlik değil: saat tam saniyeye yuvarlanıyor (`Math.round`), ve
    // kartların turu 20-45 saniye arasında. Yarım saniyelik yuvarlama
    // farkı oranda 0.01-0.03 oynama demek. Ölçülen 2.79 ile 2.81.
    const oran = r => (r.tur ? +(r.seconds / r.tur).toFixed(2) : null);
    check(oran(on) !== null && oran(off) !== null
      && Math.abs(oran(on) - oran(off)) <= 0.06,
      `${n}: kart bölümünde saat işe oranlı kalıyor`,
      `${oran(off)} -> ${oran(on)}`);
    const ulasilmaz = [...on.cards, ...off.cards].filter(k => k.need > k.tahtada);
    check(!ulasilmaz.length, `${n}: kolosla da kartlar ulaşılabilir`,
      ulasilmaz.map(k => `${k.type} ${k.need}>${k.tahtada}`).join(' '));
  } else {
    check(Math.abs(on.seconds - off.seconds) <= 2, `${n}: saat değişmiyor`,
      `${off.seconds}sn -> ${on.seconds}sn`);
  }
  // Kolos, ayağının altındaki hücreleri temizleyip yerlerine tek parça
  // olarak geçiyor. Yani tahtaya iş eklemiyor, var olan işi tek bir büyük
  // nesnede topluyor — yenecek parça sayısı artmamalı.
  //
  // Sayılan şey **canlı** parça: `fruits` dizisi kolosun ayağının altında
  // temizlenenleri de tutuyor (eaten işaretli ama dizide duruyorlar), o
  // yüzden dizinin uzunluğuna bakmak "+1" diye yanlış cevap veriyor.
  // Eşik "hiç eklemesin" değil: Pyramid ve Chevrons gibi karşı ucu zaten
  // boş olan desenlerde kolos çıplak zemine düşüyor, yani birkaç parçanın
  // yerine geçmek yerine tek parça ekliyor. 273'te 1 parça. Sınır bu yüzden
  // oran olarak yazıldı — tahtanın %1'inden fazlasını eklememeli.
  const cap = Math.max(1, Math.round(off.live * 0.01));
  check(diff <= cap, `${n}: kolos kayda değer iş eklemiyor`,
    `${off.live} -> ${on.live} canlı parça (sınır +${cap})`);
}

// Kolos gerçekten karşı uçta mı? Deliğin doğduğu yerin aynısında olsaydı
// bölüm başlar başlamaz üstünde durur, hedef olmaktan çıkardı.
const far = await pg.evaluate(() => { window.fruitHoleProbe(20); return window.fruitHoleBoss(); });
check(far.distFromSpawn > 8, 'kolos deliğin doğduğu uçtan uzakta',
  `${far.distFromSpawn} birim`);

// --- final bölümü ---
//
// Kupa gecesi patrona denk gelmiyordu (patron onda bir, Cup Night düzen
// sırasından 9. bölüme düşüyor) ve o yüzden "final" diye bir şeyi yoktu.
// Artık o temanın ızgara tahtalarına da kolos konuyor, ve oradaki kolos meyve değil
// kupanın kendisi.
//
// Aranan şey bir bölüm numarası değil: tema, tur ilerledikçe kayıyor
// (`themeIdForLevel`), yani final bölümleri 9'da bir değil. O yüzden tarama
// tema **adına** bakıyor — numaraya bakan bir test, tur formülünün her
// değişiminde olmayan bir hata uydurur.
console.log('\nfinal bölümleri (Cup Night):');
console.log('bölüm | tahta   | kolos | eşya    | para   | uzaklık');
console.log('------+---------+-------+---------+--------+--------');
const finals = [];
for (let n = 1; n <= 120; n++) {
  const r = await pg.evaluate((lvl) => {
    const p = window.fruitHoleProbe(lvl);
    return { kind: p.kind, mission: p.mission,
             theme: window.fruitHoleTheme().theme, ...window.fruitHoleBoss() };
  }, n);
  if (r.theme !== 'Cup Night') continue;
  finals.push({ n, ...r });
  console.log(`${String(n).padStart(5)} | ${r.kind.padEnd(7)} | ` +
    `${(r.boss ? 'var' : 'yok').padStart(5)} | ` +
    `${String(r.prop ?? '-').padEnd(7)} | ${String(r.type ?? '-').padEnd(6)} | ` +
    `${r.distFromSpawn ?? '-'}`);
}
// Bulmaca, resim ve şerit tahtaları kolos almıyor (bkz. `isFinalLevel`) —
// onlarda kupa yok ve rozet de yok. Tarama o yüzden kolosu olanlara bakıyor,
// ama "hiçbirinde yok" hâli de bir hata: en az iki gerçek final olmalı.
const kupali = finals.filter(r => r.boss);
check(finals.length >= 2, '120 bölümde en az iki Cup Night var', `${finals.length} tane`);
check(kupali.length >= 2, 'en az iki Cup Night ızgara tahtası (yani gerçek final)',
  `${kupali.length} / ${finals.length}`);
check(kupali.every(r => r.prop === 'bigcup'), 'finaldeki kolos kupa',
  kupali.map(r => r.prop).join(' '));
check(kupali.every(r => r.distFromSpawn > 8), 'kupa tahtanın öbür ucunda',
  kupali.map(r => r.distFromSpawn).join(' '));

// Görev bölümüne kupa konmuyor.
//
// Saat tahtayı süpürmekten çıkıyor, kolosu açacak kadar **büyümekten**
// değil: bir görev bölümünde "bütün muzları ye" denip muzlardan biri ancak
// tarlanın yarısı süpürülünce açılan bir kupaysa, saat o işi hiç saymıyor.
// Patronda bu güvence bölüm numarasından geliyordu (onda bir ile onuncunun
// beşincisi çakışmaz); final temadan hesaplandığı için o güvence kendi
// kendine kalkıyordu.
//
// Ölçülen şey bir **örnek** değil, kuralın kendisi: hiçbir bölümde görev
// ile kolos bir arada olmasın.
//
// İlk yazışta üç bölüm numarası (415, 545, 1125) doğrudan dosyaya konmuştu
// — o gün taranıp bulunmuş üç çakışma. Altı düzen eklenince üçü de başka
// bir yere düştü, çünkü tema döngüsü düzen sayısına bağlı: yeni bir düzen
// bütün numaraları kaydırıyor. Test o gün geçiyordu ve bugün ölçtüğü şeyi
// ölçmez hale geldi.
//
// İkinci yazış "çakışan bir bölüm bul" diyordu ve o da düştü: kırk düzenle
// ilk yedi yüz bölümde çakışma **yok**. Bulunamaması bir hata değil, ama
// test onu hata sayıyordu.
//
// Doğrusu tümel bir kontrol. Bugün boşuna geçiyor, ve öyle olması gerekiyor:
// yarın desen sırası kayıp bir çakışma doğarsa, kupanın oraya konmadığını
// bu satır söyleyecek. 45. bölümün geçilememesi tam bu cinsten bir hataydı —
// saat, tahtanın isteyeceği işi bilmiyordu.
console.log('\ngörev + kolos: hiçbir bölümde bir arada olmamalı');
const birlikte = [];
let gorevli = 0, cupGorev = 0;
for (let n = 1; n <= 200; n++) {
  const r = await pg.evaluate((lvl) => {
    const p = window.fruitHoleProbe(lvl);
    return { mission: p.mission, theme: window.fruitHoleTheme().theme,
             boss: window.fruitHoleBoss().boss };
  }, n);
  if (r.mission) gorevli++;
  if (r.mission && r.theme === 'Cup Night') cupGorev++;
  if (r.mission && r.boss) birlikte.push(`${n}:${r.mission}/${r.theme}`);
}
console.log(`  200 bölümde ${gorevli} görev bölümü, ${cupGorev} tanesi Cup Night`);
check(!birlikte.length, 'görevli bölümde kolos yok', birlikte.join(' '));

// Patron bölümünün kolosu meyve — **Cup Night olmayanlarda.** Bir patron
// bölümü Cup Night'a da düşebiliyor (onda bir ile tema döngüsü artık
// çakışıyor) ve orada kolosun kupa olması doğru: o bölüm hem patron hem
// final. Ayrım temadan yapılıyor, çünkü kuralı koyan şey tema.
const meyveli = bosses.filter(r => r.theme !== 'Cup Night');
check(meyveli.length > 0 && meyveli.every(r => r.prop === null),
  'Cup Night olmayan patron bölümünün kolosu hâlâ meyve',
  bosses.map(r => `${r.n}:${r.prop ?? 'meyve'}`).join(' '));

console.log('\nhatalar: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
