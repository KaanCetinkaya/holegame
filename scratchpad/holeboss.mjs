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

console.log('\nbölüm | patron | meyve | kolos R | süre | kolos için | tarlanın %si');
console.log('------+--------+-------+---------+------+------------+--------------');

const rows = [];
for (const n of [9, 10, 19, 20, 30, 40, 50, 60]) {
  const r = await pg.evaluate((lvl) => {
    const p = window.fruitHoleProbe(lvl);
    const b = window.fruitHoleBoss();
    return { ...p, ...b };
  }, n);
  rows.push({ n, ...r });
  console.log(
    `${String(n).padStart(5)} | ${(r.boss ? 'evet' : 'hayır').padStart(6)} | ` +
    `${String(r.fruit).padStart(5)} | ${String(r.colossusR ?? '-').padStart(7)} | ` +
    `${String(r.seconds).padStart(4)} | ${String(r.eatsForColossus ?? '-').padStart(10)} | ` +
    `${r.pctForColossus == null ? '-' : r.pctForColossus + '%'}`);
}

const bosses = rows.filter(r => r.boss);
const plain = rows.filter(r => !r.boss);

check(bosses.length === 6 && plain.length === 2, 'her 10. bölüm patron, diğerleri değil',
  `${bosses.length} patron / ${plain.length} normal`);
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
  check(on.seconds === off.seconds, `${n}: saat değişmiyor`, `${off.seconds}sn`);
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

console.log('\nhatalar: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
