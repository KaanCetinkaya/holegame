// Bozuk bir kayıt oyuncunun fabrikasını götürüyor mu?
//
// Eski hâli tek satırdı: `try { JSON.parse(...) } catch { return {} }`.
// Yani yarım yazılmış bir kayıt, oyunu sıfırdan açıyor, oyuncuya hiçbir
// şey söylemiyor ve ilk `saveNow` bozuk veriyi sıfır kaydıyla eziyor.
// 90. seviyedeki bir fabrika, tek bir kesintili yazma yüzünden, geri
// dönüşsüz gidiyor. Oyuncunun bu oyunda kaybedebileceği tek şey bu.
//
// Ölçülen:
//   1. Sağlam kayıt normal açılıyor, ve beş dakikada bir ikinci kopya
//      yazılıyor
//   2. Ana yuva bozulursa oyun yedekten dönüyor — ve dönerken söylüyor
//   3. `JSON.parse`'ın geçtiği ama kayıt olmayan veriler de reddediliyor
//   4. İkisi de gittiyse oyun sıfırdan açılıyor ama bozuk veri
//      silinmiyor ve oyuncuya söyleniyor
//   5. Yazılamıyorsa (kota) sessiz kalınmıyor
//   6. Yedek kaydın kendisi de geçerli bir kayıt — yani kurtarma gerçek
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8671);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

const ac = async () => {
  await pg.goto('http://localhost:8671/', { waitUntil: 'load', timeout: 90000 });
  await pg.waitForFunction(() => typeof window.jeProbe === 'function', null, { timeout: 90000 });
  await pg.evaluate(() => { document.getElementById('dOk')?.click(); window.jeTutSkip(); });
};

console.log('\n1) Sağlam kayıt ve ikinci kopya');
await ac();
// `addInitScript` her gezinmede çalışıyor; depoyu bir kere, elle temizle.
await pg.evaluate(() => localStorage.clear());
await ac();
// Oynanmış bir fabrika kur ve kaydet.
const kuruldu = await pg.evaluate(() => {
  window.jeWipeProgress(); window.jeTutSkip();
  window.jeGive(5e6);
  for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 90); window.jeGiveManager(i); }
  window.jeSave();            // ana yuva: 90'lık fabrika
  window.jeGive(1);
  window.jeSave();            // yedeğe itilen: bir önceki kayıt
  return window.jeKayit2();
});
console.log(`     ana ${kuruldu.anaVar} · yedek ${kuruldu.yedekVar} · bozuk ${kuruldu.bozukVar}`);
ok(kuruldu.anaVar, 'ana yuva yazıldı');
ok(kuruldu.yedekVar, 'ikinci kopya da yazıldı');
ok(!kuruldu.barAcik, 'uyarı şeridi boşuna açılmıyor');

// Yedeğin kendisi gerçekten kayıt mı? Yoksa "kurtarma" bir yanılsama.
const yedekIci = await pg.evaluate(() => {
  const y = JSON.parse(localStorage.getItem('motorworks_save_bak'));
  return { lvl: y.lvl, mgr: y.mgr.filter(Boolean).length, cash: y.cash };
});
console.log(`     yedeğin içi: lvl ${yedekIci.lvl.join(',')} · müdür ${yedekIci.mgr}`);
ok(yedekIci.lvl[0] === 90 && yedekIci.mgr === 4, 'yedek gerçek fabrikayı tutuyor');

console.log('\n2) Ana yuva bozuk → yedekten dönüş');
// Yarım yazılmış bir kayıt: JSON'ın sonu kesilmiş.
await pg.evaluate(() => {
  window.jeKayitDur();        // yoksa yenileme sağlam hâli geri yazıyor
  const ham = localStorage.getItem('motorworks_save');
  localStorage.setItem('motorworks_save', ham.slice(0, Math.floor(ham.length * 0.6)));
});
await ac();
const kurtarma = await pg.evaluate(() => ({
  ...window.jeKayit2(),
  lvl: window.jeProbe().lvl, mgr: window.jeProbe().mgr.filter(Boolean).length,
}));
console.log(`     durum "${kurtarma.durum}" · seviyeler ${kurtarma.lvl.join(',')} · müdür ${kurtarma.mgr}`);
console.log(`     şerit: ${kurtarma.barYazi.slice(0, 60)}…`);
ok(kurtarma.durum === 'kurtarildi', 'yedekten dönüldü', kurtarma.durum);
ok(kurtarma.lvl[0] === 90 && kurtarma.mgr === 4, 'fabrika geri geldi');
ok(kurtarma.barAcik && kurtarma.barYazi.length > 20, 'oyuncuya söylendi');
ok(kurtarma.bozukVar, 'bozuk veri silinmedi, kenara kondu');

console.log('\n3) JSON geçerli ama kayıt değil');
// `JSON.parse('5')` patlamıyor. Eski kontrol yalnızca patlamaya bakıyordu.
const sahte = ['5', '"merhaba"', 'null', '[]', '{}', '{"lvl":[]}',
               '{"lvl":[1,1,1,1],"cash":"çok"}', '{"lvl":[1,null,1,1],"cash":0,"totalEarned":0}'];
const sonuc = [];
for (const veri of sahte) {
  await pg.evaluate(v => {
    window.jeKayitDur();
    localStorage.setItem('motorworks_save', v);
    localStorage.removeItem('motorworks_save_bak');
    localStorage.removeItem('motorworks_save_bozuk');
  }, veri);
  await ac();
  const d = await pg.evaluate(() => window.jeKayit2());
  sonuc.push({ veri, durum: d.durum, bozuk: d.bozukVar });
  console.log(`     ${veri.padEnd(44)} → "${d.durum}" · kenarda ${d.bozukVar}`);
}
ok(sonuc.every(r => r.durum === 'bozuk'), 'hepsi reddedildi');
ok(sonuc.every(r => r.bozuk), 'hepsi kenara kondu');

console.log('\n4) Sağlam kayıt yanlışlıkla reddedilmiyor');
// Kontrolün ters hatası daha kötü: çalışan bir kaydı atmak.
await pg.evaluate(() => {
  window.jeKayitDur();
  localStorage.clear();
  localStorage.setItem('motorworks_save', JSON.stringify({
    // Eski bir yapımdan kalma gibi: yeni alanların hiçbiri yok.
    cash: 1234, totalEarned: 5678, lvl: [12, 8, 5, 3], mgr: [true, false, false, false],
  }));
});
await ac();
const eski = await pg.evaluate(() => ({ ...window.jeKayit2(), lvl: window.jeProbe().lvl }));
console.log(`     durum "${eski.durum}" · seviyeler ${eski.lvl.join(',')}`);
ok(eski.durum === '', 'eski ama sağlam kayıt kabul edildi', eski.durum);
ok(eski.lvl[0] === 12, 'içeriği korundu');
ok(!eski.barAcik, 'boşuna uyarı yok');

console.log('\n5) Yazılamıyorsa sessiz kalmıyor');
const yazma = await pg.evaluate(() => window.jeKayitBoz());
console.log(`     yazamadı ${yazma.yazamadi} · şerit "${yazma.barYazi.slice(0, 44)}…"`);
ok(yazma.yazamadi, 'yazma hatası fark edildi');
ok(yazma.barAcik, 'oyuncuya söylendi');

console.log('\n6) Hiç kayıt yokken uyarı yok');
await pg.evaluate(() => { window.jeKayitDur(); localStorage.clear(); });
await ac();
const temiz = await pg.evaluate(() => window.jeKayit2());
console.log(`     durum "${temiz.durum}" · şerit ${temiz.barAcik}`);
ok(temiz.durum === '' && !temiz.barAcik, 'ilk açılışta sessiz');

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
