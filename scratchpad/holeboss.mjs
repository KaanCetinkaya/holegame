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
    const r = { ...p, ...window.fruitHoleBoss(), live: window.fruitHoleGrow().left };
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
  check(Math.abs(on.seconds - off.seconds) <= 2, `${n}: saat değişmiyor`,
    `${off.seconds}sn -> ${on.seconds}sn`);
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
// Üç bölüm elle yazılı, çünkü ilk çakışma 415'te: 1..120 taraması hiçbirini
// görmüyor ve "çakışma yok" diye geçerdi. Üçü 2000 bölüm taranarak bulundu.
console.log('\ngörev + Cup Night çakışması:');
for (const n of [415, 545, 1125]) {
  const r = await pg.evaluate((lvl) => {
    const p = window.fruitHoleProbe(lvl);
    return { mission: p.mission, theme: window.fruitHoleTheme().theme,
             boss: window.fruitHoleBoss().boss };
  }, n);
  console.log(`  bölüm ${n}  ${r.theme}  görev: ${r.mission}  kolos: ${r.boss ? 'var' : 'yok'}`);
  check(r.theme === 'Cup Night' && !!r.mission && !r.boss,
    `${n}: görevli Cup Night bölümüne kupa konmuyor`,
    `${r.theme} / ${r.mission} / ${r.boss ? 'kolos var' : 'kolos yok'}`);
}
// Patron bölümünün kolosu **kupa olmamalı**: ikisi ayrı şey, ve tek yönlü bir
// kontrol "her kolos kupa" haline gelmiş olsa da geçerdi.
check(bosses.every(r => r.prop === null), 'patron bölümünün kolosu hâlâ meyve',
  bosses.map(r => r.prop ?? 'meyve').join(' '));

console.log('\nhatalar: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
