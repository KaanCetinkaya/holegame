// Reklam açılmazsa oyuncu ne görüyor?
//
// Ödüllü reklam bu oyunun tek geliri ve iki yerde duruyor: dönüş
// ekranındaki "izle, ×2 al" ve hız kutusu. İkisi de reklamın
// **açıldığı** hâl için yazılmıştı.
//
// Reklamın açılmaması sık: ağ yok, envanter boş, oyuncu uçak kipinde.
// O hâlde iki şey oluyordu:
//
//   - Dönüş ekranı: düğmeye dokunuluyor, ekran **kapanıyor** ve
//     `pendingOffline` sıfırlanıyor. Yani ikiye katlama hakkı, hiçbir
//     reklam izlenmeden, sessizce yanıyor. Oyuncuya söylenen hiçbir
//     şey yok ve ekran bir daha gelmiyor.
//   - Hız kutusu: hap '…'den '×3'e dönüyor ve susuyor. Dokunduğun
//     düğmenin hiçbir şey yapmaması.
//
// Ölçülen:
//   1. Reklam açılmazsa dönüş ekranı açık kalıyor ve hak duruyor
//   2. Reklam açılmazsa para verilmiyor
//   3. Oyuncuya reklamın açılmadığı söyleniyor
//   4. Reklam açılırsa para veriliyor ve ekran kapanıyor
//   5. Hız kutusu: açılmazsa hız başlamıyor ama bir şey söyleniyor
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8638);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const hata = [];
pg.on('pageerror', e => hata.push(String(e).split('\n')[0]));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8638/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 60000 });
await pg.evaluate(() => { document.getElementById('dOk')?.click(); window.jeTutSkip(); });

// Dönüş ekranı para getirsin diye önce bir hat kurulup çalıştırılıyor.
//
// **Müdürler şart**: yoklukta yalnızca otomatik zincir dönüyor, yani
// müdürsüz bir fabrika çevrimdışı sıfır kazanıyor. İlk yazılışında
// müdür alınmıyordu ve ölçüm "bekleyen 0" ile, yani ikiye katlanacak
// hiçbir şey yokken, reklamın ne yaptığını ölçmeye çalışıyordu.
await pg.evaluate(() => {
  window.jeGive(1e9);
  for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 8); window.jeBuyManager(i); }
  window.jeRefresh();
});

console.log('\n1) Reklam açılmıyor');
const kapali = await pg.evaluate(async () => {
  window.jeReklamSim(false);
  window.jeOffline(3600);
  const once = window.jeDonus();
  const nakitOnce = window.jeProbe().cash;
  document.getElementById('wDouble').click();
  await new Promise(r => setTimeout(r, 300));
  const sonra = window.jeDonus();
  return { once, sonra, nakitOnce, nakitSonra: window.jeProbe().cash };
});
console.log(`     önce  : ekran ${kapali.once.acik ? 'açık' : 'kapalı'}, bekleyen ${Math.round(kapali.once.bekleyen)}`);
console.log(`     sonra : ekran ${kapali.sonra.acik ? 'açık' : 'kapalı'}, bekleyen ${Math.round(kapali.sonra.bekleyen)}, düğme "${kapali.sonra.dugme}"`);
ok(kapali.once.acik && kapali.once.bekleyen > 0, 'dönüş ekranı para getirdi',
   `bekleyen ${Math.round(kapali.once.bekleyen)}`);
ok(kapali.sonra.acik, 'reklam açılmayınca ekran kapanmadı');
ok(kapali.sonra.bekleyen > 0, 'ikiye katlama hakkı durdu',
   `bekleyen ${Math.round(kapali.sonra.bekleyen)}`);
// Tam eşitlik aranmıyor: fabrika beklerken de üretiyor ve üç yüz
// milisaniyede kasaya birkaç lira giriyor. Ölçülen şey bir saatlik
// yokluğun ikiye katlanıp katlanmadığı, o yüzden sınır bekleyenin
// yüzde biri — arka plandaki üretimden kat kat büyük, ödülden kat kat
// küçük.
const payNakit = kapali.once.bekleyen / 100;
ok(kapali.nakitSonra - kapali.nakitOnce < payNakit, 'reklamsız para verilmedi',
   `${Math.round(kapali.nakitOnce)} → ${Math.round(kapali.nakitSonra)}`);
ok(/AÇILMADI|DID NOT OPEN/i.test(kapali.sonra.dugme), 'oyuncuya söylendi',
   `"${kapali.sonra.dugme}"`);

console.log('\n2) Reklam açılıyor');
const acik = await pg.evaluate(async () => {
  window.jeReklamSim(true);
  const bekleyen = window.jeDonus().bekleyen;
  const nakitOnce = window.jeProbe().cash;
  document.getElementById('wDouble').click();
  await new Promise(r => setTimeout(r, 300));
  return { bekleyen, nakitOnce, nakitSonra: window.jeProbe().cash, sonra: window.jeDonus() };
});
console.log(`     bekleyen ${Math.round(acik.bekleyen)} · nakit ${Math.round(acik.nakitOnce)} → ${Math.round(acik.nakitSonra)}`);
ok(acik.bekleyen > 0, 'ikiye katlanacak bir para vardı', `bekleyen ${Math.round(acik.bekleyen)}`);
ok(acik.bekleyen > 0 && Math.abs((acik.nakitSonra - acik.nakitOnce) - acik.bekleyen) < acik.bekleyen / 100, 'bekleyen para yatırıldı',
   `fark ${Math.round(acik.nakitSonra - acik.nakitOnce)}`);
ok(!acik.sonra.acik, 'ekran kapandı');

console.log('\n3) Hız kutusu');
const hiz = await pg.evaluate(async () => {
  window.jeReklamSim(false);
  const once = window.jeProbe().boost;
  await window.jeBoost();
  await new Promise(r => setTimeout(r, 200));
  const yazi = [...document.querySelectorAll('.fl')].map(e => e.textContent.trim());
  const sonra = window.jeProbe().boost;
  window.jeReklamSim(true);
  await window.jeBoost();
  await new Promise(r => setTimeout(r, 200));
  return { once, sonra, yazi, acilinca: window.jeProbe().boost };
});
console.log(`     reklamsız: ${hiz.once} → ${hiz.sonra} · ekrandaki yazı: ${hiz.yazi.join(' | ') || '(yok)'}`);
console.log(`     reklamlı : ${hiz.acilinca}`);
ok(hiz.sonra <= hiz.once, 'reklam açılmayınca hız başlamadı');
ok(hiz.yazi.some(y => /AÇILMADI|DID NOT OPEN/i.test(y)), 'oyuncuya söylendi',
   hiz.yazi.join(' | ') || '(hiçbir şey yazmadı)');
ok(hiz.acilinca > 0, 'reklam açılınca hız başladı', `${hiz.acilinca}`);

ok(!hata.length, 'sayfa hatası yok', hata[0] || '');
console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
