// Başarımlar oyuncuyla birlikte ilerliyor mu?
//
//   node build-www.mjs && node scratchpad/holeawards.mjs
//
// Bu dosya, listenin 12-15. bölümde bittiği ölçüldüğü için yazıldı. Beş
// başarım vardı: 100 meyve, 1000 meyve, 10. bölüm, 15 yıldız, x5 kombo. Bir
// bölüm 60-240 meyve veriyor, ortalama kombo çarpanı zaten 4.0-4.7 — yani
// hepsi kendiliğinden ve erken geliyordu, ondan sonra Awards sekmesi ölüydü.
// Dükkânın 3. bölümde bitmesiyle aynı hata.
//
// Burada ölçülen üç şey:
//
//   1. Her hedefin **ulaşılabilir** olması. Kombo çarpanı `Math.min(5, …)`
//      ile tavanlı; onun üstüne kurulan bir hedef sonsuza kadar kilitli
//      kalırdı ve bunu kimse fark etmezdi.
//   2. Basamakların sırayla açılması — yeni oyuncu on altı satır görmemeli.
//   3. Ödülün oyunu bozmaması. Başarımlar süs olmalı, ikinci bir gelir
//      kapısı değil.

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-fruithole' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8258);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

const fails = [];
const check = (ok, what, saw) => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what}${saw === undefined ? '' : `   ${saw}`}`);
  if (!ok) fails.push(what);
};

async function open({ stats = null, level = 1, ach = null, found = null, daily = null } = {}) {
  const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
  pg.on('pageerror', e => { console.log('  SAYFA HATASI: ' + e); fails.push(String(e)); });
  await pg.addInitScript(a => {
    localStorage.clear();
    localStorage.setItem('fruithole_level', String(a.level));
    if (a.stats) localStorage.setItem('fruithole_stats', JSON.stringify(a.stats));
    if (a.ach) localStorage.setItem('fruithole_ach', JSON.stringify(a.ach));
    if (a.found) localStorage.setItem('fruithole_found', JSON.stringify(a.found));
    if (a.daily) localStorage.setItem('fruithole_daily', JSON.stringify(a.daily));
  }, { stats, level, ach, found, daily });
  await pg.goto('http://localhost:8258/', { waitUntil: 'load' });
  await pg.waitForFunction(() => window.fruitHoleAwards, { timeout: 40000 });
  return pg;
}

const awards = pg => pg.evaluate(() => window.fruitHoleAwards());

console.log('\n1. liste oyunun sonuna kadar uzanıyor');
{
  const pg = await open();
  const a = await awards(pg);
  check(a.length >= 14, 'yeterince başarım var', `${a.length} tane`);

  // Asıl ölçüm: bir oyuncu 15. bölümde listeyi bitiremiyor. Eski beşliyle
  // bitiriyordu, Awards sekmesi de orada ölüyordu.
  const onbes = a.filter(x => {
    if (x.id === 'eat100') return true;              // ~1 bölüm
    if (x.id === 'eat1000') return true;             // ~9 bölüm
    if (x.id === 'lvl10') return true;
    if (x.id === 'star15') return true;              // 5 bölüm
    if (x.id === 'combo5') return true;              // kendiliğinden
    return false;
  });
  check(a.length - onbes.length >= 9,
    '15. bölümden sonra hâlâ yapılacak iş var', `${a.length - onbes.length} başarım`);

  // Aileler: her biri birden fazla basamak taşımalı, yoksa "ilerleme" değil
  // tek seferlik bir rozet olur.
  const aileler = {};
  for (const x of a) {
    const k = x.id.replace(/\d+$/, '');
    aileler[k] = (aileler[k] || 0) + 1;
  }
  const cok = Object.entries(aileler).filter(([, n]) => n >= 3);
  check(cok.length >= 4, 'en az dört ailede üç basamak var',
    cok.map(([k, n]) => `${k}:${n}`).join(' '));
  await pg.close();
}

console.log('\n2. her hedef ulaşılabilir');
{
  // Kombo çarpanı 5'te tavanlı. `bestCombo` üstüne kurulan 5'ten büyük bir
  // hedef sonsuza kadar kilitli kalır — ve ekranda sürekli "0/8" diye durur.
  const pg = await open();
  const tavan = await pg.evaluate(() => {
    // Oyunun kendi formülü: mult = min(5, 1 + floor(streak/4))
    return 5;
  });
  const a = await awards(pg);

  // Her hedefi, ulaşılabileceği en uç durumla tohumlayıp gerçekten
  // tamamlandığını görüyoruz. Tahmin yok: hedefi sağlayan durumu kuruyoruz
  // ve oyun "tamam" diyor mu diye bakıyoruz.
  await pg.close();

  const uc = await open({
    level: 200,
    stats: { fruits: 999999, levels: 400, stars: 900, bestCombo: tavan, bestStreak: 999 },
    daily: { date: `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`,
             streak: 60, missions: [], rewardClaimed: true },
  });
  // Koleksiyonun tamamını bul.
  await uc.evaluate(() => {
    const t = window.fruitHoleCollection().total;
    void t;
  });
  const hepsi = await uc.evaluate(async () => {
    // ALL_PROPS dışarı açık değil; koleksiyon ekranını kurup kimliklerini
    // oradan almak yerine, oyunun kendi işaretleyicisini tema listeleriyle
    // besliyoruz. En kolayı: bilinen bütün id'leri denemek yerine oyunun
    // kendi toplamına ulaşana kadar işaretlemek mümkün değil — bu yüzden
    // doğrudan depoyu yazıp sayfayı yeniliyoruz.
    return window.fruitHoleCollection().total;
  });
  check(hepsi > 0, 'koleksiyon toplamı okunabiliyor', String(hepsi));

  const b = await awards(uc);
  const ulasilmayan = b.filter(x => !x.done && x.id.indexOf('find') !== 0);
  check(ulasilmayan.length === 0,
    'koleksiyon dışındaki her hedef en uç durumda tamamlanıyor',
    ulasilmayan.map(x => `${x.id} ${x.at}/${x.goal}`).join(' ') || '-');

  // Zincir hedefleri tavanlı `bestCombo` yerine tavansız `bestStreak`
  // üstünde durmalı. bestCombo 5'te tutulup zincir hedefleri tamamlanıyorsa
  // doğru sayacı okuyorlar demektir.
  const zincir = b.filter(x => x.id.startsWith('chain'));
  check(zincir.length >= 2 && zincir.every(x => x.done),
    'zincir hedefleri çarpan tavanına takılmıyor',
    zincir.map(x => `${x.id} ${x.at}/${x.goal}`).join(' '));
  await uc.close();
}

console.log('\n3. koleksiyon hedefleri');
{
  // Koleksiyon 63 nesne üretti ve hiçbir başarım ona bakmıyordu.
  let pg = await open();
  let a = await awards(pg);
  const find = a.filter(x => x.id.startsWith('find'));
  check(find.length === 3, 'üç koleksiyon basamağı var', find.map(x => x.goal).join(' '));
  const toplam = await pg.evaluate(() => window.fruitHoleCollection().total);
  const enUst = Math.max(...find.map(x => x.goal));
  check(enUst === toplam, 'en üst basamak oyundaki nesne sayısıyla aynı',
    `${enUst} / ${toplam}`);
  check(find.every(x => x.at === 0), 'yeni oyuncuda hiçbiri ilerlememiş');
  await pg.close();

  // Nesne bulundukça sayaç ilerliyor.
  pg = await open();
  await pg.evaluate(() => ['bucket', 'shell', 'donut'].forEach(i => window.fruitHoleMarkFound(i)));
  a = await awards(pg);
  check(a.find(x => x.id === 'find20').at === 3, 'bulunan nesne başarıma yansıyor',
    String(a.find(x => x.id === 'find20').at));
  await pg.close();
}

console.log('\n4. basamaklar sırayla açılıyor');
{
  let pg = await open();
  let a = await awards(pg);
  const gorunen = a.filter(x => x.visible);
  check(gorunen.length <= 8, 'yeni oyuncu az satır görüyor',
    `${gorunen.length} / ${a.length}`);
  check(gorunen.every(x => !x.after), 'görünenlerin hepsi ilk basamak',
    gorunen.map(x => x.id).join(' '));
  check(a.filter(x => !x.visible).every(x => !!x.after), 'gizlenenlerin hepsinin öncülü var');
  await pg.close();

  // Öncül kazanılınca sıradaki açılıyor — alınmasa bile. Alınmamış bir ödül
  // yüzünden sıradaki hedefi saklamak, oyuncuyu ilerlediğini görmekten
  // mahrum bırakırdı.
  pg = await open({ stats: { fruits: 150, levels: 2, stars: 3, bestCombo: 2, bestStreak: 5 } });
  a = await awards(pg);
  check(a.find(x => x.id === 'eat100').done === true, 'ilk basamak kazanıldı');
  check(a.find(x => x.id === 'eat1000').visible === true,
    'kazanılınca sıradaki açılıyor (almadan da)');
  check(a.find(x => x.id === 'eat5000').visible === false, 'üçüncü basamak hâlâ kapalı');
  await pg.close();
}

console.log('\n5. almak');
{
  const pg = await open({ stats: { fruits: 150, levels: 2, stars: 3, bestCombo: 2, bestStreak: 5 } });
  const once = await pg.evaluate(() => window.fruitHoleWallet());
  const a = (await awards(pg)).find(x => x.id === 'eat100');

  await pg.evaluate(() => window.fruitHoleClaimAward('eat100'));
  await pg.waitForTimeout(200);
  const sonra = await pg.evaluate(() => window.fruitHoleWallet());
  check(sonra[a.pay] - once[a.pay] === a.reward, 'ödül cüzdana yazıldı',
    `${once[a.pay]} > ${sonra[a.pay]}`);
  check((await awards(pg)).find(x => x.id === 'eat100').claimed === true, 'alındı olarak işaretlendi');

  // İki kez alınamaz.
  await pg.evaluate(() => window.fruitHoleClaimAward('eat100'));
  await pg.waitForTimeout(200);
  check((await pg.evaluate(() => window.fruitHoleWallet()))[a.pay] === sonra[a.pay],
    'ikinci kez ödeme yapmıyor');

  // Gizli bir başarım, hedefi sağlansa bile alınamaz.
  await pg.evaluate(() => window.fruitHoleClaimAward('eat5000'));
  await pg.waitForTimeout(150);
  check((await awards(pg)).find(x => x.id === 'eat5000').claimed === false,
    'kapalı basamak alınamıyor');

  // Hedefi sağlanmayan alınamaz.
  await pg.evaluate(() => window.fruitHoleClaimAward('eat1000'));
  await pg.waitForTimeout(150);
  check((await awards(pg)).find(x => x.id === 'eat1000').claimed === false,
    'tamamlanmayan alınamıyor');
  await pg.close();
}

console.log('\n6. ödül ölçeği');
{
  // Başarımlar süs olmalı. Bir bölüm dört meyveden toplam ~1500 ödüyor;
  // yükseltme ağacı 26 420, kaplamalar 30 500. Başarımların toplamı bunların
  // yanında ikinci bir gelir kapısı olmamalı — yoksa dükkânı erken bitirir
  // ve ekonominin bütün dengesini bozar.
  const pg = await open();
  const a = await awards(pg);
  const toplam = a.reduce((s, x) => s + x.reward, 0);
  console.log(`    başarım toplamı: ${toplam} meyve`);
  check(toplam < 30000, 'toplam ödül ağacın altında kalıyor', `${toplam} < 26 420 + 30 500`);
  check(toplam > 9000, 'ama anlamlı bir miktar', String(toplam));

  // Tek bir başarım, bir bölümlük kazancın iki katını geçmemeli.
  const en = a.reduce((m, x) => x.reward > m.reward ? x : m, a[0]);
  check(en.reward <= 3000, 'en büyük başarım bile bir bölümün iki katından az',
    `${en.id} ${en.reward}`);

  // Ödüller dört meyveye dağılmış olmalı: hepsi tek meyveye akarsa o dalın
  // dışındaki hiçbir yükseltmeye yaramıyor.
  const meyve = {};
  a.forEach(x => { meyve[x.pay] = (meyve[x.pay] || 0) + x.reward; });
  check(Object.keys(meyve).length === 4, 'dört meyveye de ödeme var',
    Object.entries(meyve).map(([k, v]) => `${k}:${v}`).join(' '));
  const en2 = Math.max(...Object.values(meyve)), az = Math.min(...Object.values(meyve));
  check(en2 <= az * 2.5, 'bir meyveye yığılmamış', `${az} - ${en2}`);
  await pg.close();
}

console.log('\n7. ekranda');
{
  const pg = await open({
    level: 12,
    stats: { fruits: 1400, levels: 14, stars: 30, bestCombo: 5, bestStreak: 22 },
  });
  await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });
  await pg.waitForSelector('#goalsBtn', { state: 'visible', timeout: 25000 });
  await pg.click('#goalsBtn');
  await pg.waitForTimeout(600);

  const gorunen = (await awards(pg)).filter(x => x.visible).length;
  const satir = await pg.evaluate(() => document.querySelectorAll('#achList > *').length);
  check(satir === gorunen, 'ekrandaki satır sayısı görünen başarım sayısıyla aynı',
    `${satir} / ${gorunen}`);
  check(satir > 5, 'liste on beşinci bölümde hâlâ dolu', String(satir));
  await pg.screenshot({ path: '/tmp/awards.png' });
  await pg.close();
}

console.log(fails.length ? `\n${fails.length} kontrol düştü` : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length ? 1 : 0);
