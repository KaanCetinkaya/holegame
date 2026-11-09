// Slice Rush'ın teşhis perdesi.
//
//   node build-www.mjs && node scratchpad/sltani.mjs
//
// ## Neden var
//
// Gerekçesi `tytani.mjs`'nin başında yazılı ve burada da aynı: kapalı
// teste yabancı geliyor, yabancının elinden gelen tek şey "bir şey
// oldu" cümlesi, ve o cümleyle elde hiçbir sayı kalmıyor. Üç oyundan
// ikisinde bu ekran vardı, Slice Rush'ta yoktu.
//
// Perdenin Slice Rush'a özel iki satırı var ve ikisi de ölçülüyor:
//
//   • **okunamayan anahtar.** `store.sayi`/`store.nesne` bozuk bir
//     değeri yutup varsayılanı veriyor — doğru davranış, oyun açılıyor
//     — ama oyuncu bölümünü kaybetmiş oluyor ve bunu söyleyen hiçbir
//     şey yoktu. Perde bozuk anahtarı **adıyla** yazıyor.
//   • **son reklam hatası.** `showRewarded` hatayı yutup `false`
//     dönüyordu; "×2 çalışmadı" diyen testçiden geriye sebep
//     kalmıyordu.
//
// ## Eşikler
//
// Hiçbiri seçilmedi: beş dokunuş ve 1.2 saniye perdenin kendi sabiti
// (ölçüm iki yönden de sınıyor), 44px projedeki dokunma hedefi
// standardı, son beş hata perdenin kendi sınırı.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-slicer' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8632);

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
const hata = [];
pg.on('pageerror', e => {
  const m = String(e).split('\n')[0];
  if (!m.includes('TANIDENEME')) hata.push(m);
});
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8632/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.sliceTani === 'function', null, { timeout: 60000 });
await pg.waitForTimeout(800);

// Günlük ödül perdesi menünün önünü kapatıyor ve gerçek bir tık onu
// deliyor olamıyor ("#daily intercepts pointer events"). Her
// yüklemeden sonra kapatılıyor.
const hazirla = async () => {
  if (await pg.isVisible('#dOk')) { await pg.click('#dOk'); await pg.waitForTimeout(250); }
};
await hazirla();

// Hızlı dokunuşlar sayfanın içinde art arda gönderiliyor, Playwright'ın
// tık gidiş dönüşüyle değil: kural, ölçüm zamanlamaya bağlı yazılmaz.
// Dışarıdan tıklanınca beş tıkın toplam süresi konteynerin o anki
// yüküne kalıyor ve 1.2 saniyelik pencerenin dışına taşabiliyor.
// Perde gövdesi her denemeden önce boşaltılıyor: boşaltılmazsa bir
// önceki açılışın metni orada kalıyor ve "bölümler yazıldı mı" satırı
// açılmayan bir perdede bile geçiyor. (Motor Works'te korumayı geri
// koyarak denenince tam bu çıktı.)
const hizli = n => pg.evaluate(k => {
  document.getElementById('taniBody').innerHTML = '';
  const el = document.getElementById('verTag');
  for (let i = 0; i < k; i++) el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, n);
// Yavaş dokunuşta gerçek bekleme gerekiyor ve o yön yükten
// etkilenmiyor: yük arayı yalnızca uzatır, beklenen sonuç zaten
// "açılmamalı".
// Yavaş dokunuşlar da sayfanın içinden gönderiliyor, ama aralarında
// gerçek bekleme var — ölçülen şey burada zaten zamanın kendisi.
// Playwright'ın tıkı kullanılmıyor, çünkü hata geri konup denendiğinde
// perde erken açılıyor ve açık perde sonraki tıkı yiyor: ölçüm temiz
// bir FAIL yerine zaman aşımıyla çöküyor, ve arkasındaki bütün
// kapılar hiç koşmamış oluyordu. Dokunma alanının gerçekten
// dokunulabilir olduğu ayrı bir satırın işi.
const yavas = async (n, bekle) => {
  for (let k = 0; k < n; k++) {
    await pg.evaluate(() => document.getElementById('verTag')
      .dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await pg.waitForTimeout(bekle);
  }
};

console.log('\n--- gizli el hareketi ---');
await hizli(4);
let d = await pg.evaluate(() => window.sliceTani());
check(!d.acik, 'dört dokunuş perdeyi açmıyor', d.acik ? 'açıldı' : '');

await pg.reload({ waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.sliceTani === 'function', null, { timeout: 60000 });
await pg.waitForTimeout(600);
await hazirla();
await yavas(5, 1400);
d = await pg.evaluate(() => window.sliceTani());
check(!d.acik, 'yavaş beş dokunuş perdeyi açmıyor (1.2 sn penceresi)', d.acik ? 'açıldı' : '');

await hizli(5);
d = await pg.evaluate(() => window.sliceTani());
check(d.acik, 'hızlı beş dokunuş perdeyi açıyor', d.acik ? '' : 'açılmadı');

// Sürüm yazısı 10px ve köşede duruyor; dolgusu olmadan beş kez
// dokunulacak bir hedef değil.
//
// Kapı bir piksel sayısı **seçmiyor**. Seçilen her sayı uydurma
// olurdu: 44 düğme standardı ve bu bir düğme değil, 30 da hiçbir
// yerden gelmiyor. Ölçülen şey bunun yerine ikili bir olgu —
// dokunma alanı yazının kendisinden büyük mü, yani orada bilerek
// konmuş bir dolgu var mı. Dolgu kaldırılırsa kutu yazıya eşitlenir
// ve satır düşer.
const hedef = await pg.evaluate(() => {
  const el = document.getElementById('verTag');
  const k = el.getBoundingClientRect();
  const st = getComputedStyle(el);
  const d = ['Top', 'Right', 'Bottom', 'Left'].map(y => parseFloat(st['padding' + y]) || 0);
  // Yazının kendi kutusu: dolgu çıkarıldığında kalan.
  const r = document.createRange(); r.selectNodeContents(el);
  const y = r.getBoundingClientRect();
  return { x: Math.round(k.width), yk: Math.round(k.height),
           yx: Math.round(y.width), yy: Math.round(y.height), d };
});
console.log(`  yazı ${hedef.yx}x${hedef.yy} · dokunma alanı ${hedef.x}x${hedef.yk} ` +
  `· dolgu ${hedef.d.join('/')}`);
check(hedef.d.every(v => v > 0) && hedef.x > hedef.yx && hedef.yk > hedef.yy,
  'dokunma alanı yazıdan büyük (dolgu duruyor)',
  `dolgu ${hedef.d.join('/')}`);

console.log('\n--- ne yazıyor ---');
const BOLUM = ['UYGULAMA', 'KAYIT', 'OYUN', 'REKLAM', 'HATA'];
let eksik = BOLUM.filter(b => !d.metin.includes(b));
console.log(`  satır: ${d.satir}`);
console.log(`  metin: ${d.metin.replace(/\s+/g, ' ').slice(0, 220)}`);
check(eksik.length === 0, 'beş bölümün beşi de yazılıyor',
  eksik.length ? 'eksik: ' + eksik.join(', ') : '');
const surum = await pg.evaluate(() => {
  const r = [...document.querySelectorAll('#taniBody .trow')]
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

console.log('\n--- bozuk anahtar adıyla yazılıyor ---');
// Perdenin Slice Rush'a özel satırı. Bozuk bir anahtar oyunu
// açtırmaya devam ediyor (doğrusu bu) ama oyuncu ilerlemesini
// kaybediyor; hangi anahtarın gittiğini söyleyen tek yer burası.
await pg.evaluate(() => {
  document.getElementById('taniClose').click();
  localStorage.setItem('slicerush_coins', '{bozuk');
});
await hizli(5);
d = await pg.evaluate(() => window.sliceTani());
check(d.metin.includes('slicerush_coins'), 'bozuk anahtar adıyla yazılıyor',
  (d.metin.match(/okunamayan[^\n]*/) || ['(satır yok)'])[0]);

console.log('\n--- reklam satırı ---');
// Yutulan hata artık saklanıyor. Tarayıcıda `ADS_ON` kapalı, o yüzden
// sebep satırının kendisi sınanıyor: hata yokken "yok" diyor.
const reklam = await pg.evaluate(() => {
  const r = [...document.querySelectorAll('#taniBody .trow')]
    .find(x => x.querySelector('b').textContent === 'son hata');
  return r ? r.querySelector('span').textContent : null;
});
check(reklam !== null, 'reklam sebebi satırı var', reklam === null ? '(yok)' : reklam);

console.log('\n--- son yazma satırı ---');
// Satırın işi tek bir ayrımı yapmak: "ilerlemem gitti" diyen
// oyuncuda kayıt **hiç yazılamadı** mı, yoksa yazıldı da sonradan mı
// kayboldu. İkisi aynı cümleyle bildiriliyor ve çareleri ayrı.
//
// Üç şey ölçülüyor: satır başarılı bir yazmadan sonra doluyor, perde
// kendi saatini uydurmuyor (kancayla aynı anı söylüyor), ve yazma
// bozukken **ilerlemiyor** — ilerleseydi satır tam ihtiyaç duyulan
// yerde yalan söylerdi.
await pg.evaluate(() => {
  document.getElementById('taniClose').click();
  window.sliceGive(1);
});
await hizli(5);
const y1 = await pg.evaluate(() => ({
  an: window.sliceYazma().an,
  satir: [...document.querySelectorAll('#taniBody .trow')]
    .filter(x => x.querySelector('b').textContent === 'son yazma')
    .map(x => x.querySelector('span').textContent)[0] || null,
}));
console.log(`  son yazma: ${y1.satir} · kanca ${y1.an}`);
check(!!y1.satir && !/hiç/.test(y1.satir), 'yazmadan sonra satır doluyor', y1.satir || '(yok)');
check(y1.an > 0 && y1.satir.startsWith(new Date(y1.an).toTimeString().slice(0, 8)),
  'perde kancayla aynı anı söylüyor', `${y1.satir} / ${y1.an}`);

const y2 = await pg.evaluate(() => {
  document.getElementById('taniClose').click();
  window.sliceYazmaBoz(true);
  window.sliceGive(1);
  return { an: window.sliceYazma().an, hata: window.sliceYazma().hata };
});
await hizli(5);
const y3 = await pg.evaluate(() => [...document.querySelectorAll('#taniBody .trow')]
  .filter(x => ['son yazma', 'yazamadı'].includes(x.querySelector('b').textContent))
  .map(x => x.querySelector('b').textContent + '=' + x.querySelector('span').textContent));
console.log(`  bozukken: ${y3.join(' · ')} (hata ${y2.hata})`);
check(y2.hata > 0, 'yazma bozuldu', `${y2.hata} hata`);
check(y2.an === y1.an, 'bozuk yazma son yazma anını ilerletmiyor', `${y1.an} → ${y2.an}`);
await pg.evaluate(() => window.sliceYazmaBoz(false));

console.log('\n--- hata kutusu ---');
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
d = await pg.evaluate(() => window.sliceTani());
const ayni = d.hata.find(h => h.m.includes('ayni'));
console.log(`  kutuda ${d.hata.length} kayıt: ` +
  d.hata.map(h => `${h.m.replace('Uncaught Error: TANIDENEME ', '')}${h.n > 1 ? '×' + h.n : ''}`).join(' · '));
check(d.hata.length <= 5, 'en çok beş hata tutuluyor', `${d.hata.length} kayıt`);
check(d.metin.includes('TANIDENEME'), 'atılan hata perdede görünüyor');
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
// Perdenin asıl işi. `sliceProbe` patlayınca OYUN bölümü "okunamadı"
// diyor, kalan dördü yazılmaya devam ediyor. Tek parça bir
// `taniMetin()` burada boş perde veriyordu.
await pg.evaluate(() => {
  document.getElementById('taniClose').click();
  window.sliceProbe = () => { throw new Error('TANIDENEME sonda bozuk'); };
});
await hizli(5);
d = await pg.evaluate(() => window.sliceTani());
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
await pg.waitForFunction(() => typeof window.sliceTani === 'function', null, { timeout: 60000 });
await pg.waitForTimeout(800);
await hazirla();
// Sayma işi **tek bir evaluate'in içinde**: iki anlık görüntü alıp
// farka bakmak, araya giren başka bir yazmaya (günlük ödül, istatistik)
// denk gelebiliyordu. JavaScript tek iş parçacıklı, beş tık aynı
// karede gidiyor ve araya hiçbir şey giremiyor.
const yazma = await pg.evaluate(() => {
  const eski = localStorage.setItem.bind(localStorage);
  const yazilan = [];
  localStorage.setItem = (k, v) => { yazilan.push(k); return eski(k, v); };
  try {
    const el = document.getElementById('verTag');
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
