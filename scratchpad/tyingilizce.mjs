// Türkçe açıkken ekranda İngilizce kalmış metin var mı?
//
// `tydil.mjs` çeviri tablosunun kendisini ve `[data-t]` olan öğeleri
// ölçüyor. Ama ekrandaki her yazı tablodan gelmiyor: bazı satırlar
// `innerHTML` ile elle kuruluyor ve orada yazılmış bir İngilizce metni
// tablo kontrolü görmüyor. Dört tane böyle metin bulundu:
//
//   "Today — resets at midnight"  — hedefler ekranının başlığı
//   "Milestones"                  — ayraç
//   "OPENING AD…"                 — ödüllü reklam açılırken
//   "📺 WATCH AD, TAKE ×2"        — reklam bittikten sonra geri yazılan
//
// Sonuncusu en sinsisi: düğmenin `data-t`'si doğruydu, yani açılışta
// Türkçe görünüyordu. İngilizceye **bir kere reklam izleyince** dönüyor
// ve dil değişene kadar öyle kalıyordu.
//
// Bu betik tabloya değil ekrana bakıyor: her ekranı iki dilde açıp
// yaprak metinleri karşılaştırıyor. İki dilde **aynı kalan** her yazı
// şüpheli; sayılar, isimler ve simgeler beyaz listede.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8663);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8663/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 60000 });
await pg.evaluate(() => { document.getElementById('dOk')?.click(); window.jeTutSkip(); });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

// Her ekran bir açıcı ve bir ekran kimliği. Hepsinin **dolu** olması
// gerekiyor: boş bir liste hiçbir şey ölçmüyor.
const EKRANLAR = [
  ['panel',    null],
  ['goals',    'goalsBtn'],
  ['research', 'resBtn'],
  ['backup',   'backupBtn'],
  ['shop',     'shopBtn'],
  ['menu',     'menuBtn'],
  ['prestige', 'prestigeBtn'],
  ['welcome',  null],
  ['daily',    null],
];

// Fabrikayı doldur: prestij açılsın, araştırma puanı olsun, günlük görev
// ve dönüş ekranı kurulsun.
await pg.evaluate(() => {
  window.jeWipeProgress(); window.jeTutSkip();
  window.jeGive(1e12);
  for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 120); window.jeGiveManager(i); }
  // Prestij ekranı `canPrestige()` geçmeden açılmıyor — bu tuzağa bu
  // depoda birkaç kez düşüldü. `pendingPoints()` ömür boyu kazanca göre
  // değil, **bu turda** kazanılana göre hesaplanıyor; o yüzden puan
  // bankası için `jeSetLifetime`, turun kazancı için bir günlük yokluk.
  window.jeSetLifetime(1e9);
  window.jeOffline(86400);
  document.getElementById('wOk').click();
  window.jeStep(0.1);
});

const topla = () => pg.evaluate(ekranlar => {
  const metinler = {};
  // Yalnızca **görünen** yazı. Gizlenen bir düğme eski metnini
  // üstünde taşıyor (müdür tutulunca "HIRE DERYA" yazısı silinmiyor,
  // düğme saklanıyor) ve onu okumak olmayan bir hata uydurmak olur.
  const yaprak = kok => [...kok.querySelectorAll('*')]
    .filter(el => el.children.length === 0 && el.textContent.trim()
                  && el.getClientRects().length > 0)
    .map(el => el.textContent.trim());
  for (const [id, btn] of ekranlar) {
    // Önce açık ekranları kapat: üst üste binerlerse ölçüm karışıyor.
    for (const s of document.querySelectorAll('.screen')) s.classList.remove('show');
    if (id === 'welcome') window.jeOffline(7200);
    else if (id === 'daily') window.jeGunGoster();
    else if (btn) document.getElementById(btn).onclick();
    metinler[id] = yaprak(document.getElementById(id));
  }
  for (const s of document.querySelectorAll('.screen')) s.classList.remove('show');
  return metinler;
}, EKRANLAR);

console.log('\n1) Ekranlar dolu mu');
const en = await topla();
for (const [id] of EKRANLAR) console.log(`     ${id.padEnd(9)} ${en[id].length} yazı`);
ok(Object.values(en).every(v => v.length > 2), 'her ekranda ölçülecek yazı var');

// Dili çevir ve aynı turu tekrarla.
await pg.evaluate(() => document.getElementById('langBtn').click());
const tr = await topla();
const dilNo = await pg.evaluate(() => window.jeDil().dil);
ok(dilNo === 1, 'dil Türkçeye döndü', `${dilNo}`);

console.log('\n2) İki dilde aynı kalan yazılar');
// Beyaz liste: çevrilmesi **gerekmeyen** şeyler. Müdür adları insan adı;
// oyunun adı marka; rakam, para ve yüzde zaten dilsiz.
const SERBEST = [
  /^[\d.,:%×+\-/\s]*[KMBT]?[\s%×]*$/,        // sayı, para, yüzde, çarpan
  /^[^A-Za-zĞÜŞİÖÇğüşıöç]+$/,                 // yalnız simge/emoji
  /^(Derya|Marco|Ines|Kwame)\b/,              // müdür adları insan adı
  /^Motor Works$/,
  /^MW1-/,                                    // yedek kodu
  /^(EN|TR)$/,                                // dil düğmesinin kendisi
  /^Turbo( ·.*)?$/,                           // iki dilde de "Turbo"
  /^(dev|v[\d.]+ \(\d+\))$/,                  // derleme numarası
];
const serbest = s => SERBEST.some(r => r.test(s));

// Satır satır değil **küme** olarak karşılaştırılıyor. Sebebi: Türkçe
// metinler daha uzun ve `metaSigdir` sığmayan parçayı atıyor, yani iki
// dilde satır sayıları eşit olmak zorunda değil. Hizalamaya çalışmak,
// ana panelin ölçüm dışında kalması demekti.
let supheli = 0;
for (const [id] of EKRANLAR) {
  const b = new Set(tr[id]);
  for (const yazi of new Set(en[id])) {
    if (!b.has(yazi) || serbest(yazi)) continue;
    supheli++;
    console.log(`     ${id.padEnd(9)} "${yazi.slice(0, 56)}"`);
  }
}
if (!supheli) console.log('     (yok)');
ok(supheli === 0, 'Türkçede İngilizce kalan yazı yok', `${supheli} tane`);

console.log('\n3) Reklam düğmesi reklamdan sonra da Türkçe');
// Asıl yakalanan hata: `data-t` doğru, ama tıklama işleyicisi metni
// elle geri yazıyordu.
const reklam = await pg.evaluate(async () => {
  window.jeOffline(7200);
  const b = document.getElementById('wDouble');
  const once = b.textContent;
  const sirasinda = await new Promise(res => {
    b.onclick();                       // söz döndürmüyor; bir tik sonra oku
    setTimeout(() => res(b.textContent), 0);
  });
  await new Promise(r => setTimeout(r, 400));
  return { once, sirasinda, sonra: b.textContent };
});
console.log(`     önce "${reklam.once}"`);
console.log(`     açılırken "${reklam.sirasinda}"`);
console.log(`     sonra "${reklam.sonra}"`);
// "Türkçe mi" sorusu `ş, ç, ğ` harfi arayarak cevaplanmıyor artık:
// tam Türkçe bir cümlede o harflerden hiçbiri olmayabiliyor
// ("Bir tamponu 5 kez doldur") ve ölçüm rastgele düşüyordu. Karşılık
// doğrudan çeviri tablosundan okunuyor.
const tablo = await pg.evaluate(() => window.jeDil().tablo);
ok(reklam.once === tablo.watchDouble.tr, 'başta Türkçe', reklam.once);
ok(reklam.sirasinda === tablo.openingAd.tr || reklam.sirasinda === tablo.watchDouble.tr,
   'reklam açılırken Türkçe', reklam.sirasinda);
ok(reklam.sonra === tablo.watchDouble.tr, 'reklamdan SONRA da Türkçe', reklam.sonra);

console.log('\n4) Hedefler ekranının başlıkları');
// İlk hâli listenin ilk iki `.gt`'sine bakıyordu; ikincisi başlık değil,
// o günün rastgele seçilmiş ilk göreviydi. Başlıklar simgelerinden
// bulunuyor ve beklenen metin tablodan geliyor.
const basliklar = await pg.evaluate(() => {
  window.jeWipeProgress(); window.jeTutSkip();
  window.jeGive(1e9);
  document.getElementById('goalsBtn').onclick();
  const soy = s => s.replace(/<[^>]*>/g, '');
  const t = window.jeDil().tablo;
  const bul = simge => {
    const el = [...document.querySelectorAll('#goalList .goal')]
      .find(e => e.querySelector('.gi') && e.querySelector('.gi').textContent.trim() === simge);
    return el ? el.querySelector('.gt').textContent.trim() : null;
  };
  return { bugun: bul('📅'), hedef: bul('🏆'),
           beklenenBugun: soy(t.todayHdr.tr), beklenenHedef: soy(t.milesHdr.tr) };
});
console.log(`     "${basliklar.bugun}" | "${basliklar.hedef}"`);
ok(basliklar.bugun === basliklar.beklenenBugun, 'günlük başlığı Türkçe',
   `${basliklar.bugun} / ${basliklar.beklenenBugun}`);
ok(basliklar.hedef === basliklar.beklenenHedef, 'hedefler başlığı Türkçe',
   `${basliklar.hedef} / ${basliklar.beklenenHedef}`);

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
