// Motor Works'ün teşhis perdesi.
//
//   node build-www.mjs && node scratchpad/tytani.mjs
//
// ## Neden var
//
// Kapalı teste yabancı geliyor ve yabancının elinden gelen tek şey "bir
// şey oldu" cümlesi. Fruit Hole'da bunun karşılığı var (`holediag`,
// `holediagbtn`): oyuncu sürüm yazısına beş kez dokunuyor, ekranda
// sayılar çıkıyor, kopyalayıp yolluyor. Motor Works'te yoktu — yani
// testçinin bildirdiği her sorun, elinde hiçbir sayı olmadan
// bakılacak bir cümleydi.
//
// Perde eklendi; bu dosya onun **işe yarar** olup olmadığını ölçüyor.
// İşe yaraması üç ayrı şey demek ve üçü ayrı kapı:
//
//   1. **Kazara açılmıyor.** Gizli bir el hareketi, gizliliğini
//      kaybederse oyunun ortasında açılan bir perdeye dönüşür. Dört
//      dokunuş açmamalı, araları açık beş dokunuş da açmamalı.
//   2. **Bir şey söylüyor.** Beş bölümün beşi de yazılmalı; bir
//      bölümün sessizce kaybolması (okuduğu alan yeniden adlandırıldı,
//      diye) perdeyi boş bir kabuğa çevirir ve kimse fark etmez.
//   3. **Oyun bozukken de açılıyor.** Perdenin açıldığı an, bir
//      şeyin bozulduğu an. Okuduğu bir şey patlarsa perdenin kendisi
//      patlamamalı — en çok ihtiyaç duyulan yerde hiçbir şey
//      söylemeyen bir ekran, olmayan ekrandan kötüdür (vardır
//      sanılıyor).
//
// Üçüncüsü bu dosyanın asıl sebebi. İlk hâlinde `taniMetin()` tek
// parçaydı: `jeProbe()` patlarsa perde boş açılıyordu. Aşağıdaki
// "bozuk sonda" kapısı o hâlde düşüyor, şimdiki hâlde geçiyor.
//
// ## Eşikler
//
// Buradaki sayıların hiçbiri seçilmedi:
//   • beş dokunuş / 1.2 saniye — perdenin kendi sabiti, ölçüm onu
//     oyundan okumuyor ama iki yönden de sınıyor (açmalı / açmamalı).
//   • 44px — projedeki dokunma hedefi standardı, `holeiclik` ve
//     `slekran` aynı sayıyı kullanıyor.
//   • son beş hata — perdenin kendi sınırı; yedi ayrı hata atılıp
//     beşte kaldığı görülüyor.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-tycoon' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8628);

const fails = [];
const check = (ok, ne, ek = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ne}${ek ? '   ' + ek : ''}`);
  if (!ok) fails.push(`${ne} ${ek}`);
};

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

// Dar telefon: dokunma hedefi en çok burada sıkışıyor.
const pg = await br.newPage({ viewport: { width: 360, height: 780 } });
// Bilerek atılan hatalar ölçümün kendi malzemesi; sayfanın kendi
// hatalarıyla karışmasın diye ayrı ön ekle işaretleniyor.
const hata = [];
pg.on('pageerror', e => {
  const m = String(e).split('\n')[0];
  if (!m.includes('TANIDENEME')) hata.push(m);
});
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8628/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.jeTani === 'function', null, { timeout: 60000 });
await pg.waitForTimeout(800);

// Öğretici ve günlük ödül perdesi menünün önünü kapatıyor; öteki
// `ty*` ölçümleri de aynı iki satırla açıyor.
const menuyuAc = async () => {
  await pg.evaluate(() => { document.getElementById('dOk')?.click(); window.jeTutSkip(); });
  await pg.waitForTimeout(200);
  await pg.click('#menuBtn');
  await pg.waitForTimeout(300);
};
await menuyuAc();

// Hızlı dokunuşlar **sayfanın içinde** art arda gönderiliyor,
// Playwright'ın tık gidiş dönüşüyle değil. Sebebi kural: ölçüm
// zamanlamaya bağlı yazılmaz. Dışarıdan tıklanınca beş tıkın toplam
// süresi konteynerin o anki yüküne kalıyor ve yük yüksekken 1.2
// saniyelik pencerenin dışına taşabiliyordu — ölçülen şey oyun değil
// makinenin o anki hâli olurdu.
// Perde gövdesi her denemeden önce boşaltılıyor. Boşaltılmazsa bir
// önceki açılışın metni orada duruyor ve "bölümler yazıldı mı"
// satırı **açılmayan** bir perdede bile geçiyor — bayatlamış metni
// okuyarak. Korumayı kaldırıp denendiğinde tam bu oldu: perde
// açılmadı, bölüm kapısı yine OK yazdı.
const hizli = n => pg.evaluate(k => {
  document.getElementById('taniBody').innerHTML = '';
  const el = document.getElementById('verLine');
  for (let i = 0; i < k; i++) el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, n);
// Yavaş dokunuşlarda gerçek bekleme gerekiyor; o yön yükten
// etkilenmiyor, çünkü yük arayı yalnızca **uzatır** ve beklenen sonuç
// zaten "açılmamalı".
// Yavaş dokunuşlar da sayfanın içinden gönderiliyor, ama aralarında
// gerçek bekleme var — ölçülen şey burada zaten zamanın kendisi.
// Playwright'ın tıkı kullanılmıyor, çünkü hata geri konup denendiğinde
// perde erken açılıyor ve açık perde sonraki tıkı yiyor: ölçüm temiz
// bir FAIL yerine zaman aşımıyla çöküyor, ve arkasındaki bütün
// kapılar hiç koşmamış oluyordu. Dokunma alanının gerçekten
// dokunulabilir olduğu ayrı bir satırın işi.
const yavas = async (n, bekle) => {
  for (let k = 0; k < n; k++) {
    await pg.evaluate(() => document.getElementById('verLine')
      .dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await pg.waitForTimeout(bekle);
  }
};

console.log('\n--- gizli el hareketi ---');

// 1. Dört dokunuş açmamalı.
await hizli(4);
let d = await pg.evaluate(() => window.jeTani());
check(!d.acik, 'dört dokunuş perdeyi açmıyor', d.acik ? 'açıldı' : '');

// 2. Araları açık beş dokunuş da açmamalı — sayaç sıfırlanıyor.
await pg.reload({ waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.jeTani === 'function', null, { timeout: 60000 });
await pg.waitForTimeout(600);
await menuyuAc();
await yavas(5, 1400);
d = await pg.evaluate(() => window.jeTani());
check(!d.acik, 'yavaş beş dokunuş perdeyi açmıyor (1.2 sn penceresi)',
  d.acik ? 'açıldı' : '');

// 3. Hızlı beş dokunuş açmalı.
await hizli(5);
d = await pg.evaluate(() => window.jeTani());
check(d.acik, 'hızlı beş dokunuş perdeyi açıyor', d.acik ? '' : 'açılmadı');

console.log('\n--- ne yazıyor ---');
const BOLUM = ['UYGULAMA', 'KAYIT', 'FABRİKA', 'PLAY', 'HATA'];
const eksik = BOLUM.filter(b => !d.metin.includes(b));
console.log(`  satır: ${d.satir}`);
console.log(`  metin: ${d.metin.replace(/\s+/g, ' ').slice(0, 200)}`);
check(eksik.length === 0, 'beş bölümün beşi de yazılıyor',
  eksik.length ? 'eksik: ' + eksik.join(', ') : '');
// Perdenin işi sayı vermek. Sürüm satırı yoksa gelen ekran
// görüntüsünden hangi derlemenin konuşulduğu anlaşılmıyor.
const surum = await pg.evaluate(() => {
  const r = [...document.querySelectorAll('#taniBody .row')]
    .find(x => x.querySelector('b').textContent === 'sürüm');
  return r ? r.querySelector('span').textContent : null;
});
check(!!surum, 'sürüm yazılıyor', surum || '(yok)');

console.log('\n--- dokunma hedefi (360px) ---');
const dugme = await pg.evaluate(() => ['taniCopy', 'taniClose'].map(id => {
  const b = document.getElementById(id).getBoundingClientRect();
  return { id, y: Math.round(b.height), x: Math.round(b.width) };
}));
for (const b of dugme) console.log(`  #${b.id}: ${b.x}x${b.y}`);
check(dugme.every(b => b.y >= 44), 'düğmeler 44px yüksekliğinde',
  dugme.map(b => `${b.id} ${b.y}`).join(', '));
// Perde tam ekran ve okunacak metin uzun; yatay kayma, sağdaki
// değerlerin ekran görüntüsünde kesilmesi demek.

console.log('\n--- son kayıt satırı ---');
// Satırın işi tek bir ayrımı yapmak: "ilerlemem gitti" diyen
// oyuncuda kayıt **hiç yazılamadı** mı (depo dolu), yoksa yazıldı da
// sonradan mı kayboldu. İkisi aynı cümleyle bildiriliyor, çareleri
// ayrı, ve bugüne kadar perdede ikisini ayıran bir sayı yoktu.
//
// Üçü ölçülüyor: başarılı bir kayıttan sonra satır doluyor, perde
// kendi saatini uydurmuyor (kancayla aynı anı veriyor), ve yazma
// patlarken **ilerlemiyor**.
await pg.evaluate(() => {
  document.getElementById('taniClose').click();
  window.jeGive(1000);
  window.jeSave();
});
await hizli(5);
const k1 = await pg.evaluate(() => ({
  an: window.jeKayit2().sonAn,
  satir: [...document.querySelectorAll('#taniBody .row')]
    .filter(x => x.querySelector('b').textContent === 'son kayıt')
    .map(x => x.querySelector('span').textContent)[0] || null,
}));
console.log(`  son kayıt: ${k1.satir} · kanca ${k1.an}`);
check(!!k1.satir && !/hiç/.test(k1.satir), 'kayıttan sonra satır doluyor', k1.satir || '(yok)');
check(k1.an > 0 && k1.satir.startsWith(new Date(k1.an).toTimeString().slice(0, 8)),
  'perde kancayla aynı anı söylüyor', `${k1.satir} / ${k1.an}`);

// `jeKayitBoz` setItem'i patlatıp bir kez kaydetmeyi deniyor.
const k2 = await pg.evaluate(() => {
  document.getElementById('taniClose').click();
  window.jeGive(1000);
  const r = window.jeKayitBoz();
  return { an: window.jeKayit2().sonAn, yazamadi: r.yazamadi };
});
await hizli(5);
const k3 = await pg.evaluate(() => [...document.querySelectorAll('#taniBody .row')]
  .filter(x => ['son kayıt', 'yazamadı'].includes(x.querySelector('b').textContent))
  .map(x => x.querySelector('b').textContent + '=' + x.querySelector('span').textContent));
console.log(`  bozukken: ${k3.join(' · ')}`);
check(k2.yazamadi, 'yazma bozuldu');
check(k2.an === k1.an, 'patlayan yazma son kayıt anını ilerletmiyor', `${k1.an} → ${k2.an}`);

console.log('\n--- hata kutusu ---');
// Aynı hata iki kez, sonra yedi ayrı hata: biri sayılmalı, öteki
// beşte kalmalı.
await pg.evaluate(() => {
  document.getElementById('taniClose').click();
  const at = m => { setTimeout(() => { throw new Error(m); }, 0); };
  // Önce yedi ayrı hata, **sonra** aynı mesaj iki kez. Sırası böyle,
  // çünkü ters sırada tekrarlanan mesaj yedi yenisinin altında kalıp
  // kutudan düşüyordu: sayıyı ölçen satır "kutuda yok" deyip geçiyor,
  // yani hiçbir zaman düşemeyen bir kapı oluyordu.
  for (let k = 0; k < 7; k++) at('TANIDENEME ayri ' + k);
  at('TANIDENEME ayni');
  at('TANIDENEME ayni');
});
await pg.waitForTimeout(400);
await hizli(5);
d = await pg.evaluate(() => window.jeTani());
const ayni = d.hata.find(h => h.m.includes('ayni'));
console.log(`  kutuda ${d.hata.length} kayıt: ` +
  d.hata.map(h => `${h.m.replace('Uncaught Error: TANIDENEME ', '')}${h.n > 1 ? '×' + h.n : ''}`).join(' · '));
check(d.hata.length <= 5, 'en çok beş hata tutuluyor', `${d.hata.length} kayıt`);
check(d.metin.includes('TANIDENEME'), 'atılan hata perdede görünüyor');
// Aynı mesajın iki kez yazılması, bir turda yüzlerce kez atan bir
// satırın kutuyu süpürmesi demek — o yüzden sayılıyor, listelenmiyor.
// (Yedi ayrı hata araya girdiği için "ayni" kutudan düşmüş olabilir;
// kapı yalnızca duruyorsa sayının doğru olmasını istiyor.)
check(!!ayni && ayni.n === 2, 'aynı hata iki kez yazılmıyor, sayılıyor',
  ayni ? `n=${ayni.n}` : 'kutuda yok');

// Taşma **uzun bir satır varken** ölçülüyor. Önce menünün kısa
// satırlarıyla ölçülüyordu ve o hâlde hiçbir zaman düşemiyordu:
// sarmayı kapatıp denendi, 360 yine 360 çıktı. Perdedeki en uzun
// değer bir hata mesajı (kutu 120 karakterde kesiyor), o yüzden
// kapı buraya, uzun mesaj kutudayken kuruldu.
await pg.evaluate(() => {
  document.getElementById('taniClose').click();
  setTimeout(() => { throw new Error('TANIDENEME ' + 'u'.repeat(140)); }, 0);
});
await pg.waitForTimeout(300);
await hizli(5);
const tasma = await pg.evaluate(() => {
  const t = document.getElementById('tani');
  const en = [...t.querySelectorAll('span')].reduce((a, s) => Math.max(a, s.textContent.length), 0);
  return { w: t.scrollWidth, ic: t.clientWidth, en };
});
console.log(`  en uzun değer ${tasma.en} karakter`);
check(tasma.en >= 100, 'uzun satır gerçekten perdede', `${tasma.en} karakter`);
check(tasma.w <= tasma.ic + 1, 'yatay taşma yok', `${tasma.w} / ${tasma.ic}`);

console.log('\n--- oyun bozukken ---');
// Perdenin asıl işi burada. `jeProbe` patlayınca FABRİKA bölümü
// "okunamadı" diyor, geri kalan dört bölüm yazılmaya devam ediyor.
// Tek parça bir `taniMetin()` burada boş perde veriyordu.
await pg.evaluate(() => {
  document.getElementById('taniClose').click();
  window.jeProbe = () => { throw new Error('TANIDENEME sonda bozuk'); };
});
await hizli(5);
d = await pg.evaluate(() => window.jeTani());
const kalan = BOLUM.filter(b => d.metin.includes(b));
console.log(`  bozukken yazılan bölümler: ${kalan.join(', ')}`);
check(d.acik, 'sonda bozukken perde yine açılıyor', d.acik ? '' : 'açılmadı');
check(kalan.length === BOLUM.length, 'bozukken beş bölüm de yazılıyor',
  `${kalan.length}/${BOLUM.length}`);
check(d.metin.includes('okunamadı'), 'bozuk bölüm sebebini söylüyor');

console.log('\n--- perde yalnızca okuyor ---');
// Bir teşhis ekranı oyunun durumunu değiştirmemeli: testçi perdeyi
// açtı diye kaydı bozulursa, perde aradığı sorunun kendisi olur.
await pg.reload({ waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.jeTani === 'function', null, { timeout: 60000 });
await pg.waitForTimeout(800);
await menuyuAc();
// Sayma işi **tek bir evaluate'in içinde** yapılıyor ve araya hiç
// bekleme girmiyor. İki ayrı anlık görüntü alıp aradaki farka bakmak
// fabrikanın kendi otomatik kaydına denk gelebiliyordu — ölçüm o zaman
// perdeyi değil, iki ölçüm arasından geçen zamanı ölçerdi. JavaScript
// tek iş parçacıklı: beş tık aynı karede gönderilince perde açılıyor
// ve araya başka hiçbir şey giremiyor.
const yazma = await pg.evaluate(() => {
  const eski = localStorage.setItem.bind(localStorage);
  const yazilan = [];
  localStorage.setItem = (k, v) => { yazilan.push(k); return eski(k, v); };
  try {
    const el = document.getElementById('verLine');
    for (let i = 0; i < 5; i++) el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  } finally { localStorage.setItem = eski; }
  return { yazilan, acik: document.getElementById('tani').classList.contains('show') };
});
check(yazma.acik, 'perde bu koşuda da açıldı', yazma.acik ? '' : 'açılmadı');
check(yazma.yazilan.length === 0, 'perde kaydı değiştirmiyor',
  yazma.yazilan.length ? 'yazılan: ' + yazma.yazilan.join(', ') : 'hiç yazma yok');

check(hata.length === 0, 'sayfa hatası yok', hata[0] || '');

console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
process.exitCode = fails.length ? 1 : 0;
await br.close(); srv.close();
