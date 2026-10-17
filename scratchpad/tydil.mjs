// Türkçe arayüz: her yazının karşılığı var mı, ve kutulara sığıyor mu?
//
// Oyunun oyuncusu TikTok'tan geliyor ve neredeyse tamamı Türkçe konuşuyor;
// arayüz baştan sona İngilizceydi.
//
// İki tür hata var ve ikisi de sessiz: çevrilmemiş bir anahtar ekranda
// İngilizce kalıyor (fark edilmesi zor), ve çevrilmiş uzun bir yazı
// düğmesinden taşıyor (yalnızca 412 piksellik bir ekranda görülüyor).
// İkisi de ölçülüyor.
//
// Ölçülen:
//   1. Tabloda her anahtarın iki karşılığı var ve hiçbiri boş değil
//   2. Oyun açılışta cihazın dilini alıyor
//   3. Oyuncunun seçimi cihazın dilini geçiyor ve kayda yazılıyor
//   4. Türkçede her ekran gerçekten Türkçe — ekranda kalan İngilizce
//      sözcük aranıyor
//   5. Hiçbir düğme/yazı kutusundan taşmıyor (412 piksel)
//   6. Dil değişince açık ekranlar da değişiyor
//   7. Oyunun iç kimlikleri çevrilmiyor — `jeProbe().neck` hâlâ İngilizce,
//      yoksa bütün ölçümler ve kayıt uyumu kırılır
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8601);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

async function ac(locale) {
  const ctx = await br.newContext({ viewport: { width: 412, height: 915 }, locale });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => console.log('HATA ' + e));
  await pg.addInitScript(() => localStorage.clear());
  await pg.goto('http://localhost:8601/', { waitUntil: 'load', timeout: 90000 });
  await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 60000 });
  await pg.evaluate(() => { document.getElementById('dOk')?.click(); window.jeTutSkip(); });
  return pg;
}

console.log('\n1) Tablo eksiksiz mi');
const tr = await ac('tr-TR');
const tablo = await tr.evaluate(() => window.jeDil().tablo);
const eksik = Object.entries(tablo).filter(([, v]) => !v.en || !v.tr);
// Bazı sözcükler iki dilde gerçekten aynı. Liste açıkça yazılıyor:
// "beşten az aynı olsun" demek, yeni bir çeviri unutulduğunda sayının
// eşiğin altında kalıp sessizce geçmesi demekti.
const AYNI_OLABILIR = ['u1', 'res6', 'yer2', 'pr1'];   // panel, Turbo, Tundra, SUV
const ayni = Object.entries(tablo).filter(([k, v]) => v.en === v.tr && !AYNI_OLABILIR.includes(k));
console.log(`     ${Object.keys(tablo).length} anahtar · karşılığı olmayan ${eksik.length} · iki dilde aynı ${ayni.length}`);
if (eksik.length) console.log('     eksik: ' + eksik.map(([k]) => k).join(' '));
if (ayni.length) console.log('     ÇEVRİLMEMİŞ: ' + ayni.map(([k]) => k).join(' '));
ok(eksik.length === 0, 'her anahtarın iki karşılığı var');
ok(ayni.length === 0, 'listedekiler dışında çevrilmemiş anahtar yok',
   ayni.map(([k]) => k).join(' '));

console.log('\n2) Cihazın dili');
const trDil = await tr.evaluate(() => window.jeDil().dil);
const en = await ac('en-US');
const enDil = await en.evaluate(() => window.jeDil().dil);
console.log(`     tr-TR cihaz → ${trDil} · en-US cihaz → ${enDil}`);
ok(trDil === 1, 'Türkçe telefon Türkçe açıyor', `${trDil}`);
ok(enDil === 0, 'İngilizce telefon İngilizce açıyor', `${enDil}`);

console.log('\n3) Oyuncunun seçimi kalıcı');
// Telefonu İngilizce olan biri Türkçeye alıyor; kapatıp açınca Türkçe
// kalmalı, yoksa cihaz dili seçimi her açılışta siliyor demektir.
await en.evaluate(() => { document.getElementById('menuBtn').click();
                          document.getElementById('langBtn').click(); });
const secim = await en.evaluate(() => ({ dil: window.jeDil().dil, kayit: window.jeDil().kayit }));
// `addInitScript` her gezinmede yeniden çalışıyor: `reload` çağırmak
// localStorage'ı siliyor ve "seçim unutuldu" diye yanlış bir sonuç
// veriyordu. Yeniden açılış, aynı bağlamda temizlemeyen yeni bir sayfa.
const en2 = await en.context().newPage();
await en2.goto('http://localhost:8601/', { waitUntil: 'load', timeout: 90000 });
await en2.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 60000 });
const sonra = await en2.evaluate(() => window.jeDil().dil);
console.log(`     seçim ${secim.dil} (kayıtta ${secim.kayit}) · yeniden açılışta ${sonra}`);
ok(secim.dil === 1, 'düğme dili değiştirdi');
ok(secim.kayit === 1, 'seçim kayda yazıldı');
ok(sonra === 1, 'İngilizce telefonda bile Türkçe kaldı', `${sonra}`);

console.log('\n4) Ekranlarda İngilizce kalmış yazı');
// Her ekranı Türkçede aç ve görünen yazıları tara. Aranan şey, oyunun
// kendi sözlüğünde olmayan İngilizce sözcükler — marka adları ve
// istasyon kimlikleri dışarıda.
const EKRANLAR = [
  ['menu', () => document.getElementById('menuBtn').click()],
  ['goals', () => { document.getElementById('menuBtn').click(); document.getElementById('goalsBtn').click(); }],
  ['research', () => { document.getElementById('menuBtn').click(); document.getElementById('resBtn').click(); }],
  ['shop', () => { document.getElementById('menuBtn').click(); document.getElementById('shopBtn').click(); }],
  ['backup', () => { document.getElementById('menuBtn').click(); document.getElementById('backupBtn').click(); }],
  ['prestige', () => { document.getElementById('menuBtn').click(); document.getElementById('prestigeBtn').click(); }],
];
const INGILIZCE = /\b(the|and|your|you|every|with|from|level|levels|points|unspent|close|buy|earn|total|income|per|second|branch|reward|day|claim|collect|goals|research|shop|backup|cancel|upgrade|upgrades|manager|managers|station|stations|hours|speed|price|cost|start|code|paste|load|copy|owned|restore|purchases|sound|language|new|hand|right|now|this|reset|product|vehicle|bottleneck|full|ship|use|take|open|hire|boost|forever|once|runs|line|yard|all|four)\b/i;
await tr.evaluate(() => { window.jeGive(1e9); for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 30); window.jeGiveManager(i); } window.jeSetEarned(1e12); });
let kirli = 0;
for (const [ad, ac2] of EKRANLAR) {
  await tr.evaluate(f => { for (const s of document.querySelectorAll('.screen')) s.classList.remove('show');
                           eval('(' + f + ')()'); }, ac2.toString());
  await tr.waitForTimeout(200);
  const kalan = await tr.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('.screen.show *')) {
      if (el.children.length) continue;
      const t = (el.textContent || '').trim();
      if (t) out.push(t);
    }
    return out;
  });
  const suclu = kalan.filter(t => INGILIZCE.test(t));
  console.log(`     ${ad.padEnd(9)} ${kalan.length} yazı · İngilizce kalan ${suclu.length}${suclu.length ? ' → ' + suclu.slice(0, 3).join(' | ') : ''}`);
  kirli += suclu.length;
}
ok(kirli === 0, 'hiçbir ekranda İngilizce kalmadı', `${kirli} yazı`);

console.log('\n5) Taşma');
// Türkçe karşılıklar İngilizceden uzun. 412 piksellik bir ekranda bir
// düğmenin yazısı kutusundan taşarsa kırpılıyor ve kimse fark etmiyor.
const tasan = await tr.evaluate(() => {
  const out = [];
  const bak = () => {
    for (const el of document.querySelectorAll('.btn, .buy, .rb, .gb, button')) {
      const r = el.getBoundingClientRect();
      if (!r.width) continue;
      if (el.scrollWidth > el.clientWidth + 2)
        out.push({ ad: (el.id || el.className) + ': ' + el.textContent.trim().slice(0, 28),
                   ic: el.scrollWidth, dis: el.clientWidth });
    }
  };
  for (const s of document.querySelectorAll('.screen')) s.classList.remove('show');
  bak();
  for (const id of ['menu', 'goals', 'research', 'shop', 'backup', 'prestige']) {
    for (const s of document.querySelectorAll('.screen')) s.classList.remove('show');
    document.getElementById(id).classList.add('show');
    bak();
  }
  return out;
});
for (const t of tasan) console.log(`     TAŞIYOR ${t.ad} (${t.ic} > ${t.dis})`);
ok(tasan.length === 0, 'hiçbir düğme yazısı kutusundan taşmıyor', `${tasan.length} tane`);

console.log('\n6) Açık ekran dille birlikte değişiyor');
// Menüyü açıkken dili değiştiren oyuncu, yarısı İngilizce bir menü
// görmemeli.
const canli = await tr.evaluate(() => {
  for (const s of document.querySelectorAll('.screen')) s.classList.remove('show');
  document.getElementById('menuBtn').click();
  const once = document.getElementById('closeMenu').textContent;
  document.getElementById('langBtn').click();
  document.getElementById('menuBtn').click();
  return { once, sonra: document.getElementById('closeMenu').textContent };
});
console.log(`     KAPAT düğmesi: "${canli.once}" → "${canli.sonra}"`);
ok(canli.once !== canli.sonra, 'açık ekrandaki yazı da değişti');

console.log('\n7) İç kimlikler çevrilmiyor');
// `jeProbe().neck` oyunun içinde bir kimlik ve bütün ölçümler ona
// bakıyor. Çevrilseydi her test ve her kayıt karşılaştırması kırılırdı.
const ic = await tr.evaluate(() => {
  const p = window.jeProbe();
  return { neck: p.neck, product: p.product, dil: window.jeDil().dil };
});
console.log(`     dil ${ic.dil} iken darboğaz "${ic.neck}" · ürün "${ic.product}"`);
ok(['Foundry', 'Stamping', 'Assembly', 'Dispatch'].includes(ic.neck),
   'darboğaz kimliği İngilizce kaldı', ic.neck);

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
