// Telefondaki derlemenin numarası görünüyor mu, ve reklam anahtarı
// doğru yerde mi?
//
// İki soru da aynı sebeple burada: ikisinin de yanlış cevabı sessiz.
//
// Sürüm yazısı Motor Works'te hiç yoktu. "Bu güncel sürüm mü" sorusunun
// başka bir cevabı yok — telefondaki paketin numarasını dışarıdan
// görmenin yolu yok ve bilinmeyince "düzeltme gelmemiş" ile "düzeltme işe
// yaramamış" birbirine karışıyor. Kaan bir kere tam bu soruyu sordu.
//
// Reklam anahtarı ise ters yönde tehlikeli: kaynakta `ADS_TESTING = true`
// kalmak **zorunda**, çünkü kendi canlı reklamına tıklamak AdMob hesabını
// kapattırıyor ve kapatılan yayıncı yeni hesap açamıyor. Yalnızca
// `npm run release:tycoon` (LIVE_ADS=1) onu kapatıyor.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { execFileSync } from 'child_process';

const KOK = '/home/user/holegame';
const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync(KOK + '/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8679);

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

const surum = JSON.parse(readFileSync(KOK + '/app-version.json', 'utf8')).tycoon;
const kaynak = readFileSync(KOK + '/tycoon/index.html', 'utf8');
const derleme = readFileSync(KOK + '/www-tycoon/index.html', 'utf8');
const oku = (metin, ad) => (metin.match(new RegExp(`const ${ad} = ([^;]+);`)) || [])[1];

console.log('\n1) Kaynak dosya');
console.log(`     APP_VERSION ${oku(kaynak, 'APP_VERSION')} · ADS_TESTING ${oku(kaynak, 'ADS_TESTING')}`);
ok(oku(kaynak, 'APP_VERSION') === "'dev'",
   "kaynakta 'dev' duruyor — numara elle yazılmıyor", oku(kaynak, 'APP_VERSION'));
ok(oku(kaynak, 'ADS_TESTING') === 'true',
   'kaynakta reklamlar TEST — kendi reklamına tıklama riski yok',
   oku(kaynak, 'ADS_TESTING'));

console.log('\n2) Sıradan derleme');
const beklenen = `'${surum.versionName} (${surum.versionCode})'`;
console.log(`     app-version.json → ${beklenen}`);
console.log(`     www-tycoon       → ${oku(derleme, 'APP_VERSION')} · ADS_TESTING ${oku(derleme, 'ADS_TESTING')}`);
ok(oku(derleme, 'APP_VERSION') === beklenen,
   'derlemedeki numara app-version.json ile aynı', oku(derleme, 'APP_VERSION'));
ok(oku(derleme, 'ADS_TESTING') === 'true',
   'LIVE_ADS olmadan reklamlar hâlâ test', oku(derleme, 'ADS_TESTING'));

console.log('\n3) LIVE_ADS=1 derlemesi');
// Gerçekten çeviriyor mu? Çevirmezse mağaza paketi test reklamı taşır ve
// bunu ancak aylar sonra AdMob panelinde sıfır görerek fark edersin.
execFileSync('node', [KOK + '/build-www.mjs'], { env: { ...process.env, LIVE_ADS: '1' }, cwd: KOK });
const canli = readFileSync(KOK + '/www-tycoon/index.html', 'utf8');
console.log(`     ADS_TESTING ${oku(canli, 'ADS_TESTING')} · APP_VERSION ${oku(canli, 'APP_VERSION')}`);
ok(oku(canli, 'ADS_TESTING') === 'false', 'LIVE_ADS reklamları gerçeğe çeviriyor',
   oku(canli, 'ADS_TESTING'));
ok(oku(canli, 'APP_VERSION') === beklenen, 'numara orada da doğru');
// Test derlemesini geri koy: başka betikler bu dosyayı okuyor ve
// gerçek reklamlı bir dosya bırakmak, ölçümün yan etkisi olarak
// kendi reklamına tıklama riski demek.
execFileSync('node', [KOK + '/build-www.mjs'], { cwd: KOK });
const geri = readFileSync(KOK + '/www-tycoon/index.html', 'utf8');
ok(oku(geri, 'ADS_TESTING') === 'true', 'ölçüm sonrası dosya test kipine döndü');

console.log('\n4) Ekranda görünüyor');
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
for (const vp of [{ width: 360, height: 640 }, { width: 412, height: 915 }]) {
  const pg = await br.newPage({ viewport: vp });
  pg.on('pageerror', e => console.log('HATA ' + e));
  await pg.goto('http://localhost:8679/', { waitUntil: 'load', timeout: 90000 });
  await pg.waitForFunction(() => typeof window.jeProbe === 'function', null, { timeout: 90000 });
  const d = await pg.evaluate(() => {
    document.getElementById('dOk')?.click(); window.jeTutSkip();
    document.getElementById('menuBtn').onclick();
    const el = document.getElementById('verLine');
    const r = el.getBoundingClientRect();
    const menu = document.getElementById('menu');
    return { yazi: el.textContent, gorunur: r.width > 0 && r.height > 0,
             ust: r.top, alt: r.bottom, menuAlt: menu.scrollHeight,
             tasti: el.scrollWidth > el.clientWidth + 1 };
  });
  console.log(`     ${vp.width}x${vp.height}: "${d.yazi}" · görünür ${d.gorunur}`);
  ok(d.gorunur, `${vp.width}: satır çizildi`);
  ok(d.yazi.includes(String(surum.versionCode)),
     `${vp.width}: sürüm kodu yazıyor`, d.yazi);
  ok(!d.tasti, `${vp.width}: taşmıyor`);
}
await br.close();

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
srv.close();
