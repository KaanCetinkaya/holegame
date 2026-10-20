// Yıldız ekonomisi: oyuncu bölüm başına kaç yıldız alıyor, ve üçü
// ulaşılabiliyor mu?
//
//   node build-www.mjs && node scratchpad/slyildiz.mjs
//   node scratchpad/slyildiz.mjs 40        # kaç bölüm (varsayılan 30)
//
// ## Neden var
//
// Slice Rush'ta yıldız `kesilen / toplam meyve` oranından geliyor ve bir
// hedefi besliyor ("Earn 30 stars", 700 para). Ama hiçbir ölçüm "bir
// oyuncu bölüm başına kaç yıldız alıyor" diye sormuyordu:
//
//   - `slegri` zorluk eğrisini **bitirme oranıyla** ölçüyor, yıldızla değil
//   - `slicewall` demir sayısını, `slicegaps` geçilebilirliği
//   - `slicecut` kesim sayacının ekranda doğru çıkmasını
//
// Yani "üç yıldız alınabiliyor mu" sorusunun cevabı hiçbir yerde yoktu, ve
// bu Fruit Hole'da pahalıya patlayan bir boşluğun aynısı: orada yıldızın
// böleni bozuktu ve **her bölüm üç yıldız** veriyordu, kimse bakmadığı için
// aylarca öyle kaldı. Buradaki risk ters yönde — eşik %90 ve meyvenin
// hepsini kesmek engelleri dodge ederken mümkün olmayabilir.
//
// ## Ölçülen şey
//
// Otomatik sürücü her bölümü oynuyor ve iki şey okunuyor: kesim oranı, ve
// **oyunun kendi verdiği yıldız**. Eşikler buraya kopyalanmıyor —
// `sliceGoals()` içindeki "Earn 30 stars" hedefi toplam yıldızı veriyor ve
// bölüm başına fark alınıyor. Eşik oyunda değişirse ölçüm onu izler.
//
// Sürücü iyi bir oyuncu değil (bir sonraki engele bakıyor, ondan
// sonrakine değil) ve bu deponun o vekili kullanma kuralı `slegri`de
// yazılı: aranan şey mutlak başarı değil, **tutarlı bir vekilin** bölümden
// bölüme nasıl değiştiği. Yıldız için de aynısı geçerli, bir farkla: üç
// yıldızı hiç alamaması tek başına bir şey söylemez, ama **hiçbir bölümde**
// alamaması yıldız ekonomisinin ölü olduğunu söyler.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-slicer' + p); } catch {}
  if (b) {
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } else { r.writeHead(404); r.end('no'); }
}).listen(8621);

const SON = Number(process.argv[2] || 30);
const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const hata = [];
pg.on('pageerror', e => hata.push(String(e).split('\n')[0]));
await pg.goto('http://localhost:8621/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.sliceProbe === 'function', null, { timeout: 30000 });
// Çizim kapalı: ölçülen şey turun sonucu, ekrandaki görüntü değil.
await pg.evaluate(() => window.sliceDrawOff(true));

// Toplam yıldızı oyunun kendi hedefinden okuyoruz: eşik burada ikinci kez
// yazılmasın diye.
const toplamYildiz = () => pg.evaluate(() => {
  const g = window.sliceGoals().list.find(x => x.id === 'stars30');
  return g ? g.at : null;
});

console.log(`\n  blm | meyve | kesilen |  oran | yıldız | sonuç`);
console.log('  ----+-------+---------+-------+--------+-------');
const satir = [];
let onceki = await toplamYildiz();
for (let lv = 1; lv <= SON; lv++) {
  const r = await pg.evaluate((n) => {
    window.sliceStart(n);
    const son = window.sliceRun(6000);
    return { cut: son.cut, total: son.total, state: son.state };
  }, lv);
  const simdi = await toplamYildiz();
  // Oyun yıldızı **en iyi** hâliyle saklıyor (`Math.max`), yani aynı bölüm
  // iki kez oynanırsa fark sıfır çıkabilir. Burada her bölüm bir kez
  // oynanıyor ve sıra artan, yani fark o bölümün yıldızı.
  const yildiz = simdi - onceki;
  onceki = simdi;
  const oran = r.total ? r.cut / r.total : 0;
  satir.push({ lv, ...r, oran, yildiz });
  console.log(`  ${String(lv).padStart(3)} | ${String(r.total).padStart(5)} | ` +
    `${String(r.cut).padStart(7)} | ${('%' + Math.round(oran * 100)).padStart(5)} | ` +
    `${String(yildiz).padStart(6)} | ${r.state}`);
}

const fails = [];
const check = (ok, ne, ek = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ne}${ek ? '   ' + ek : ''}`);
  if (!ok) fails.push(`${ne} ${ek}`);
};
console.log('');

const biten = satir.filter(s => s.state === 'clear');
const oranlar = biten.map(s => s.oran);
console.log(`  bitirilen bölüm: ${biten.length}/${satir.length}`);
if (oranlar.length) {
  console.log(`  kesim oranı: %${Math.round(Math.min(...oranlar) * 100)} – ` +
    `%${Math.round(Math.max(...oranlar) * 100)}`);
}
const dagilim = {};
for (const s of satir) dagilim[s.yildiz] = (dagilim[s.yildiz] || 0) + 1;
console.log('  yıldız dağılımı: ' +
  Object.entries(dagilim).sort().map(([k, v]) => `${k}★ × ${v}`).join(' · '));
const toplam = satir.reduce((a, s) => a + s.yildiz, 0);
console.log(`  ${SON} bölümde toplam ${toplam} yıldız ` +
  `("Earn 30 stars" hedefi için ${Math.ceil(30 / Math.max(0.01, toplam / SON))} bölüm)`);

// ## Eşikler — ve bir tanesi yazılıp geri alındı
//
// Parkur `Math.random()` ile kuruluyor, yani bu ölçüm belirlenimci **değil**:
// üç koşuda bitirilen bölüm 30, 28 ve 27 çıktı. Kapılar o yüzden sayıya
// değil **ulaşılabilirliğe** bakıyor.
//
// Geri alınan kapı: *"bitirilen her bölüm en az bir yıldız verir."* İlk
// koşuda geçti, sonraki ikisinde düştü (30. ve 19. bölüm) — ve düşmesi
// doğruydu, çünkü o cümle oyunun iddiası değil benim varsayımımdı. Eşikler
// 0.9 / 0.7 / 0.4: meyvenin %40'ından azını keserek bitirmek **bilerek**
// sıfır yıldız veriyor, yani "engellerden kaçarak bitirmek" bir yıldız
// kazandırmıyor. Sürücü hayatta kalmayı meyveye tercih ediyor ve sıfır
// yıldızlı koşular oradan geliyor; oyuncu meyvenin peşinden gidiyor.
//
// Kalan kapılar oyunun kendi eşiklerinin **ölü olmadığını** söylüyor:
//
//   1. Üç yıldız alınabiliyor. Sürücüyle bile alınamıyorsa %90 eşiği
//      ulaşılamaz demektir ve "Earn 30 stars" hedefi ona göre uzar.
//   2. Üç kademenin üçü de çıkıyor. Bir kademe hiç görünmüyorsa o eşik ölü
//      kod: oyuncunun alabileceği yıldız iki değere düşmüş demektir.
//   3. Sayfa hatası yok.
const ucAlan = satir.filter(s => s.yildiz >= 3);
check(ucAlan.length > 0, 'üç yıldız ulaşılabiliyor',
  ucAlan.length ? `${ucAlan.length} bölüm: ${ucAlan.slice(0, 8).map(s => s.lv).join(' ')}`
                : 'hiçbir bölümde alınamadı');
const kademe = [1, 2, 3].filter(k => satir.some(s => s.yildiz === k));
check(kademe.length === 3, 'üç yıldız kademesinin üçü de çıkıyor',
  `görülen: ${kademe.join(', ')}★`);
const sifir = biten.filter(s => s.yildiz === 0);
console.log(`  --   sıfır yıldızla biten: ${sifir.length} bölüm` +
  (sifir.length ? ` (${sifir.map(s => s.lv).join(' ')}) — %40'ın altında kesmek ` +
    'bilerek yıldız vermiyor' : ''));
check(hata.length === 0, 'sayfa hatası yok', hata[0] || '');

console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
process.exitCode = fails.length ? 1 : 0;
await br.close(); srv.close();
