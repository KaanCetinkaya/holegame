// Eski kayıt yeni sürümde açılıyor mu?
//
// Dahili testteki oyuncuların elinde bir kayıt var ve güncelleme onun
// üstüne geliyor. Bugün oyuna üç araştırma dalı, beş şube yeri,
// nezaret, dil seçimi, günlük görevler ve yedek kodu eklendi; kademe
// eşikleri kaydı. Bunların hiçbiri eski kayıtta yok.
//
// `Object.assign` varsayılanları veriyor ve diziler dolduruluyor — ama
// bu bir **iddia**, ve bu depoda iddia ile gerçeğin ayrıldığı yerler
// pahalıya patladı. Ölçüm gerçek bir eski sürümü çalıştırıp kaydını
// alıyor, sonra o kaydı bugünkü sürüme veriyor.
//
// Eski sürüm: 28b0b80 — müdür yetenekleri eklenmiş, günlük görevler,
// müzik, müşteri, yedek kodu, dil ve nezaret **eklenmemiş** hâli.
//
// Ölçülen:
//   1. Eski sürüm gerçekten eski: bugünkü alanların hiçbiri yok
//   2. Eski kayıt yeni sürümde açılıyor, sayfa hata vermiyor
//   3. Oyuncunun ilerlemesi korunuyor: seviye, müdür, şube, kazanç
//   4. Yeni alanlar varsayılanlarıyla geliyor ve ekonomi NaN olmuyor
//   5. Yeni özellikler eski kayıtla da çalışıyor
//   6. Yeni sürümün kaydı eski sürümü çökertmiyor (geri alma hâli)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';

// Eski sürüm depoda duruyor: `git show` ile üretmek komutu çalıştıran
// kişinin o commit'e erişimine bağlı, ve bu ölçümün değeri tam olarak
// tekrar edilebilir olmasında.
const ESKI = '/home/user/holegame/scratchpad/eski-surum';
const YENI = '/home/user/holegame/www-tycoon';
if (!existsSync(ESKI + '/index.html')) {
  console.error(`eski sürüm yok: ${ESKI}/index.html`);
  process.exit(1);
}

const sun = (kok, port) => createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  // three.js ikisinde de aynı: eski sürümün yanına kopyalamak yerine
  // yeni derlemeden veriliyor.
  const yol = p.endsWith('three.module.js') ? '/home/user/holegame/www-tycoon' + p : kok + p;
  try { b = readFileSync(yol); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(port);
const s1 = sun(ESKI, 8635), s2 = sun(YENI, 8637);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

async function sayfa(port, kayit) {
  const ctx = await br.newContext({ viewport: { width: 412, height: 915 } });
  const pg = await ctx.newPage();
  const hata = [];
  pg.on('pageerror', e => hata.push(String(e)));
  await pg.addInitScript(k => {
    localStorage.clear();
    if (k) localStorage.setItem('motorworks_save', k);
  }, kayit || null);
  await pg.goto(`http://localhost:${port}/`, { waitUntil: 'load', timeout: 90000 });
  await pg.waitForFunction(() => typeof window.jeProbe === 'function', null, { timeout: 60000 });
  return { pg, ctx, hata };
}

console.log('\n1) Eski sürümde oynanmış bir kayıt');
const a = await sayfa(8635, null);
const eskiKayit = await a.pg.evaluate(() => {
  window.jeWipeProgress();
  window.jeGive(1e9);
  for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 85 + i * 7); window.jeGiveManager(i); }
  window.jeSetEarned(4e10);
  window.jeSetLifetime(9e10);
  window.jePrestige();
  window.jeResBuy('line', 40);
  window.jeGive(5e6);
  for (let i = 0; i < 4; i++) window.jeSetLevel(i, 30 + i * 4);
  window.jeGiveManager(0);
  // Oyunun kendi kaydetme yolundan geçsin.
  window.jeStep(1);
  // Kaydı oyunun kendi yolundan aldır. İki tuzak üst üste geldi:
  // dinleyici **pencerede** (belgeye gönderilen `bubbles:false` bir
  // olay oraya hiç ulaşmıyor), ve `visibilitychange` yalnızca
  // `document.hidden` iken kaydediyor — başsız tarayıcıda o hep
  // false. `pagehide` koşulsuz kaydediyor. İlk hâlinde ölçüm prestij
  // anındaki boş kaydı okuyup "ilerleme korundu" diyordu.
  window.dispatchEvent(new Event('pagehide'));
  return localStorage.getItem('motorworks_save');
});
const eskiG = JSON.parse(eskiKayit);
const yeniAlanlar = ['dil', 'gun', 'tipNez'];
console.log(`     kayıt ${eskiKayit.length} karakter · alanlar: ${Object.keys(eskiG).sort().join(' ')}`);
console.log(`     eski sürümün hataları: ${a.hata.length ? a.hata[0] : 'yok'}`);
ok(a.hata.length === 0, 'eski sürüm temiz çalıştı', a.hata[0] || '');
ok(yeniAlanlar.every(k => !(k in eskiG)),
   'kayıt gerçekten eski — bugünün alanları yok',
   yeniAlanlar.filter(k => k in eskiG).join(' '));
ok(eskiG.lvl && eskiG.mgr && eskiG.branches === 1, 'ilerleme kayda yazılmış',
   `şube ${eskiG.branches} · seviye ${JSON.stringify(eskiG.lvl)}`);
await a.ctx.close();

console.log('\n2) Aynı kayıt bugünkü sürümde');
const b = await sayfa(8637, eskiKayit);
const yeni = await b.pg.evaluate(() => {
  const p = window.jeProbe();
  return {
    probe: p, dil: window.jeDil().dil, tier: window.jeTier(),
    res: window.jeRes().lvl, yer: window.jeYer().ad,
    nezaret: window.jeNezaret(), gorev: window.jeGorev(),
  };
});
console.log(`     seviye ${JSON.stringify(yeni.probe.lvl)} · müdür ${JSON.stringify(yeni.probe.mgr)} · şube ${yeni.probe.branches}`);
console.log(`     hata: ${b.hata.length ? b.hata[0] : 'yok'}`);
ok(b.hata.length === 0, 'yeni sürüm eski kaydı hatasız açtı', b.hata[0] || '');

console.log('\n3) İlerleme korundu');
ok(JSON.stringify(yeni.probe.lvl) === JSON.stringify(eskiG.lvl),
   'istasyon seviyeleri aynı', `${JSON.stringify(eskiG.lvl)} → ${JSON.stringify(yeni.probe.lvl)}`);
ok(JSON.stringify(yeni.probe.mgr) === JSON.stringify(eskiG.mgr),
   'müdürler aynı', JSON.stringify(yeni.probe.mgr));
ok(yeni.probe.branches === eskiG.branches, 'şube sayısı aynı',
   `${eskiG.branches} → ${yeni.probe.branches}`);
ok(Math.abs(yeni.probe.cash - eskiG.cash) <= Math.max(50, eskiG.cash * 0.01),
   'kasa aynı', `${eskiG.cash} → ${yeni.probe.cash.toFixed(0)}`);
ok(yeni.res.line === (eskiG.res ? eskiG.res.line : 0), 'araştırma korundu',
   `${eskiG.res && eskiG.res.line} → ${yeni.res.line}`);

console.log('\n4) Yeni alanlar varsayılanıyla geldi');
console.log(`     dil ${yeni.dil} · günlük görev ${yeni.gorev.liste.length} · yer ${yeni.yer} · nezaret ${yeni.nezaret}`);
console.log(`     yeni araştırmalar: tas ${yeni.res.tas || 0} · satis ${yeni.res.satis || 0} · elaraba ${yeni.res.elaraba || 0}`);
ok([0, 1].includes(yeni.dil), 'dil seçildi', `${yeni.dil}`);
ok(yeni.gorev.liste.length === 3, 'günün görevleri kuruldu', `${yeni.gorev.liste.length}`);
ok(Number.isFinite(yeni.probe.flow) && Number.isFinite(yeni.probe.income),
   'ekonomi NaN olmadı', `${yeni.probe.flow} / ${yeni.probe.income}`);
ok(!yeni.res.tas && !yeni.res.satis && !yeni.res.elaraba,
   'yeni araştırmalar sıfırdan başlıyor');

console.log('\n5) Yeni özellikler eski kayıtla çalışıyor');
const calisir = await b.pg.evaluate(() => {
  const out = {};
  out.yedek = window.jeYedekKod().length;
  out.yedekOkunur = !window.jeYedekCoz(window.jeYedekKod()).hata;
  window.jeTutSkip();
  out.musteri = window.jeMusBelir();
  window.jeMusAdim(2);
  out.odeme = window.jeMusDokun(0, 0);
  window.jeSetLifetime(1e13);
  out.tasAlindi = window.jeResBuy('tas', 3);
  window.jeTeleport(0, window.jeBayZ()[0]);
  window.jeStep(0.1);
  out.nezaret = window.jeNezaret();
  return out;
});
console.log(`     yedek ${calisir.yedek} karakter (okunur ${calisir.yedekOkunur}) · müşteri ödemesi ${calisir.odeme.toFixed(0)}`);
console.log(`     yeni araştırma alındı ${calisir.tasAlindi} · nezaret ${calisir.nezaret}`);
ok(calisir.yedekOkunur, 'eski kayıttan yedek kodu üretilebiliyor');
ok(calisir.odeme > 0, 'müşteri eski kayıtta da ödüyor');
ok(calisir.tasAlindi === 3, 'yeni araştırma alınabiliyor', `${calisir.tasAlindi}`);
ok(calisir.nezaret === 0, 'nezaret çalışıyor', `${calisir.nezaret}`);
await b.ctx.close();

console.log('\n6) Geri alma: yeni kayıt eski sürümde');
// Oyuncu güncellemeyi geri alırsa ya da Play eski sürümü dağıtırsa,
// yeni kayıt eski oyunu çökertmemeli. Bilinmeyen alanlar yok sayılmalı.
const c = await sayfa(8637, null);
const yeniKayit = await c.pg.evaluate(() => {
  window.jeWipeProgress();
  window.jeGive(1e8);
  for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 55); window.jeGiveManager(i); }
  window.jeSetLifetime(1e13);
  window.jeResBuy('tas', 5);
  window.jeResBuy('satis', 4);
  window.jeStep(1);
  window.dispatchEvent(new Event('pagehide'));
  return localStorage.getItem('motorworks_save');
});
await c.ctx.close();
const d = await sayfa(8635, yeniKayit);
const geri = await d.pg.evaluate(() => window.jeProbe());
console.log(`     eski sürümde: seviye ${JSON.stringify(geri.lvl)}`);
console.log(`     hata: ${d.hata.length ? d.hata[0] : 'yok'}`);
ok(d.hata.length === 0, 'eski sürüm yeni kaydı açarken çökmedi', d.hata[0] || '');
ok(JSON.stringify(geri.lvl) === JSON.stringify([55, 55, 55, 55]),
   'ilerleme eski sürümde de duruyor', JSON.stringify(geri.lvl));
ok(Number.isFinite(geri.income), 'eski sürümde ekonomi NaN olmadı', `${geri.income}`);
await d.ctx.close();

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); s1.close(); s2.close();
