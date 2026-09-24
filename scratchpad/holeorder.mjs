// "Sipariş" görevi ölçülebilir mi? Tek bir meyveyi toplamak ne kadar sürer?
//
// Fikir: bazı bölümler tarlayı süpürerek değil, **tek bir meyvenin hepsini**
// yiyerek bitsin. Rota tamamen değişiyor — süpürmek yerine bir rengi kovalamak.
//
// Ama önce süre sorusu cevaplanmalı, çünkü yanlış cevap bölümü ya imkânsız ya
// da bedava yapar. Oyunun saati `sweepSeconds()` ile veriliyor ve o model alan
// üzerinden çalışıyor; sipariş görevinde oyuncu boş bölgeleri atlıyor, yani o
// model burada yanlış. Buradaki ölçüm en yakın komşu turunu gerçek tarlada
// hesaplıyor ve ikisini yan yana koyuyor.
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
}).listen(8272);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = [];
pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('http://localhost:8272/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.fruitHoleOrder === 'function', { timeout: 25000 });

const order = await pg.evaluate(() => window.fruitHoleThemeTable().order);

console.log(' blm | düzen     | meyve | türlerin turları (sn)   | seçilen | hedef | tur sn | süpürme sn | saat | tur/saat');
console.log('-----+-----------+-------+-------------------------+---------+-------+--------+------------+------+---------');

// Hedef meyve nasıl seçilmeli?
//
// İlk kural "tarlanın dörtte birine en yakın tür"dü ve tur süresini 5.1 ile
// 33.9 saniye arasında bıraktı — altı kat. Aynı görev bir bölümde bir
// sprint, ötekinde bir gezinti demek.
//
// Sayı yanlış ölçüydü: bir türden çok olması yolun uzun olması demek değil,
// bir köşede toplanmış olabilir. Doğru ölçü doğrudan **turun kendisi**, ve
// dört türün dördü de ölçülebiliyor. Seçim, turu hedefe en yakın olan tür.
const HEDEF_TUR = 25;   // saniye
const oranlar = [];
for (let lvl = 1; lvl <= order.length; lvl++) {
  const r = await pg.evaluate(([n, hedef]) => {
    window.fruitHoleProbe(n);
    const { counts, total } = window.fruitHoleOrder();
    const hepsi = Object.keys(counts).map(id => window.fruitHoleOrder(id));
    let sec = hepsi[0], enIyi = Infinity;
    for (const t of hepsi) {
      const fark = Math.abs(t.turSaniye - hedef);
      if (fark < enIyi) { enIyi = fark; sec = t; }
    }
    return { counts, total, turlar: hepsi.map(t => `${t.type[0]}${t.turSaniye}`).join(' '), ...sec };
  }, [lvl, HEDEF_TUR]);
  const dagilim = r.turlar;
  const oran = r.turSaniye / r.saat;
  oranlar.push({ lvl, ad: order[lvl - 1], oran, ...r });
  console.log(` ${String(lvl).padStart(3)} | ${order[lvl - 1].padEnd(9)} | ` +
    `${String(r.total).padStart(5)} | ${dagilim.padEnd(23)} | ${String(r.type).padEnd(7)} | ` +
    `${String(r.hedef).padStart(5)} | ${String(r.turSaniye).padStart(6)} | ` +
    `${String(r.supurme).padStart(10)} | ${String(r.saat).padStart(4)} | ` +
    `${oran.toFixed(2).padStart(7)}`);
}

const o = oranlar.map(x => x.oran).sort((a, b) => a - b);
const ort = o.reduce((a, b) => a + b, 0) / o.length;
console.log(`\n tur/saat oranı: en düşük ${o[0].toFixed(2)} · ortanca ${o[Math.floor(o.length / 2)].toFixed(2)} · en yüksek ${o[o.length - 1].toFixed(2)} · ortalama ${ort.toFixed(2)}`);
const enZor = oranlar.slice().sort((a, b) => b.oran - a.oran).slice(0, 3);
console.log(' en zor üç bölüm:', enZor.map(x => `${x.lvl} ${x.ad} (${x.oran.toFixed(2)})`).join(' · '));
const enKolay = oranlar.slice().sort((a, b) => a.oran - b.oran).slice(0, 3);
console.log(' en kolay üç bölüm:', enKolay.map(x => `${x.lvl} ${x.ad} (${x.oran.toFixed(2)})`).join(' · '));

// ---------------------------------------------------------------------
// 2. Kablolama: görev doğru bölümlerde mi, saat modele uyuyor mu?
// ---------------------------------------------------------------------
const hata = [];
console.log('\n--- 2. hangi bölümde görev var, hangi tip ---');
console.log(' blm | görev   | hedef | saat | görevsiz | ham taban');
for (const lvl of [1, 4, 5, 9, 10, 14, 15, 20, 25, 30, 35, 45, 55]) {
  const r = await pg.evaluate(n => {
    window.fruitHoleProbe(n);
    return window.fruitHoleOrder();
  }, lvl);
  console.log(` ${String(lvl).padStart(3)} | ${String(r.mission ?? '-').padEnd(7)} | ` +
    `${String(r.goal).padStart(5)} | ${String(r.saat).padStart(4)} | ${String(r.duzSaat).padStart(4)} | ${Math.round(r.supurme * 2.6)}`);
  const olmali = lvl % 10 === 5;
  // Tipler sırayla: 5 sipariş, 15 devler, 25 rush, 35 sipariş… Bir tarafın
  // sabitlenmesi (hep sipariş) sessizce olabilir, o yüzden tip de kontrol
  // ediliyor. Sıra burada bir kez daha yazılıyor — oyunun listesini okuyup
  // ona bakmak, listeyi kendisiyle karşılaştırmak olurdu.
  const TIPLER = ['order', 'giants', 'rush', 'mines'];
  const tip = olmali ? TIPLER[Math.floor((lvl - 5) / 10) % TIPLER.length] : null;
  if (olmali && !r.mission) hata.push(`${lvl}. bölümde görev olmalıydı`);
  if (!olmali && r.mission) hata.push(`${lvl}. bölümde görev olmamalıydı`);
  if (olmali && r.mission && r.mission !== tip) {
    hata.push(`${lvl}. bölümün görevi ${r.mission}, olması gereken ${tip}`);
  }
  if (olmali && r.mission === 'order' && !r.type) hata.push(`${lvl}. siparişin hedef meyvesi yok`);
  if (olmali && r.mission) {
    if (!r.goal) hata.push(`${lvl}. bölümün hedefi sıfır`);
    // Görev saati süpürme saatinden kısa olmalı: görev de kısa. Uzun olsaydı
    // görev süpürmekten kolay olurdu ve bölüm kendini oynardı.
    //
    // **Mayın hariç, ve sebebi kuralın kendisinde.** Mayın bölümünün saati
    // bilerek uzun: tahtanın %7'si bomba ve her biri beş saniye götürüyor,
    // yani fazladan pay oyuncuya verilmiş bir kolaylık değil, tarlanın geri
    // alacağı bir avans. Kontrol edilecek şey payın **sınırlı** olması:
    // dört bombadan fazlasını karşılamamalı, yoksa bölüm gerçekten kendini
    // oynar.
    // Karşılaştırma `supurme * 2.6` ile değil `duzSaat` ile: birincisi ham
    // taban, ikincisi aynı bölümün görevsiz saati — tur baskısı ve
    // kolaylaştırma ikisine de uygulanmış hâli. İlk yazılışı ham tabana
    // bakıyordu ve payı 20 saniye yerine 7 saniye ölçüyordu.
    const MAYIN_PAY = 4 * 5;
    if (r.mission === 'mines') {
      const fazla = r.saat - r.duzSaat;
      if (fazla <= 0) hata.push(`${lvl}. mayın bölümünün payı yok: ${fazla}sn`);
      if (fazla > MAYIN_PAY + 2) hata.push(`${lvl}. mayın bölümünün payı fazla: ${fazla}sn`);
    } else if (r.saat >= r.supurme * 2.6) {
      hata.push(`${lvl}. bölümün saati süpürmeden kısa değil: ${r.saat}`);
    }
    // Alt sınır tipe göre: rush **bilerek** on saniyenin biraz üstünde
    // başlıyor ve saati yenen meyve besliyor. Ötekilerde kısa bir saat hata
    // olurdu, rush'ta tasarımın kendisi.
    const enAz = r.mission === 'rush' ? 8 : 25;
    if (r.saat < enAz) hata.push(`${lvl}. bölümün saati fazla kısa: ${r.saat}`);
  }
}

// Günlük koşuda sipariş yok: o modun tek sözü herkese aynı tarla, ve görev
// oyuncunun bölüm numarasından geliyor.
console.log('\n--- 3. günlük koşu ---');
const daily = await pg.evaluate(async () => {
  window.fruitHoleStartDaily();
  await new Promise(r => setTimeout(r, 600));
  return window.fruitHoleOrder();
});
console.log(` günlük koşuda görev: ${daily.mission ?? 'yok'}`);
if (daily.mission) hata.push('günlük koşuda sipariş var, olmamalı');

console.log('\nsayfa hataları:', errs.length ? errs : 'yok');
if (errs.length) hata.push(...errs);
console.log(hata.length ? 'hatalar:\n - ' + hata.join('\n - ') : 'hepsi geçti');
// Hata varsa çıkış kodu da söylesin.
//
// Bu dosya hatayı **basıyordu ama çıkış kodu 0 dönüyordu**, yani onu çağıran
// her şey — toplu koşu, ileride bir CI — "geçti" diye okuyordu. Tam koşuda on
// üç test böyle çıktı: hata basan ama başarı sinyali veren bir test, hiç test
// olmamasından kötü, çünkü bakılmış olduğu izlenimi veriyor.
process.exitCode = hata.length ? 1 : 0;
await br.close(); srv.close();
