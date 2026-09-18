// Yeni oyuncunun ilk 60 saniyesi.
//
//   node build-www.mjs && node scratchpad/holefirst.mjs
//
// TikTok'tan gelecek herkes sıfırdan başlayacak, ve 2.34 saniyede kaydırılan
// bir videodan gelen insan sabırlı değil. Oyunun 44. bölümü ne kadar iyi
// olursa olsun oraya kimse varamazsa anlamı yok.
//
// Bu dosya bir kontrol listesi değil, bir ölçüm: temiz bir profille oyunu
// açıyor, oynanabilir hâle gelene kadar geçen süreyi, karşılaşılan ekranları
// ve her ekranda ne yazdığını kaydediyor. Sonra bakılacak şey şu — ilk
// dokunuşa kadar kaç saniye ve kaç dokunuş var, ve o sırada oyuncuya ne
// anlatılmış.
//
// Zaman gerçek zaman: burada sahte saat kullanmıyoruz, çünkü ölçtüğümüz şey
// oyunun kendi temposu. Kare hızı yavaş olduğu için süreler cihazdakinden
// uzun çıkabilir; o yüzden süreler mutlak değil, birbirine göre okunmalı.

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync, mkdirSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-fruithole' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8237);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

const OUT = '/tmp/first';
mkdirSync(OUT, { recursive: true });

const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const hatalar = [];
pg.on('pageerror', e => hatalar.push(String(e)));

// Temiz profil: hiçbir şey hatırlanmıyor, ilk açılış.
await pg.addInitScript(() => localStorage.clear());

const t0 = Date.now();
const sn = () => ((Date.now() - t0) / 1000).toFixed(1);
const gunluk = [];
const not = (ne, ek) => { gunluk.push(`${sn().padStart(6)}s  ${ne}${ek ? '  — ' + ek : ''}`); };

await pg.goto('http://localhost:8237/', { waitUntil: 'domcontentloaded' });
not('sayfa açıldı');

// Oyun kodu ne zaman hazır?
await pg.waitForFunction(() => window.fruitHoleWhere, { timeout: 60000 });
not('oyun kodu hazır');

// Ekranda ilk ne görünüyor? Her yarım saniyede bir bak, değişince yaz.
const gorunen = async () => await pg.evaluate(() => {
  const acik = [...document.querySelectorAll('.screen')]
    .filter(e => e.classList.contains('show')).map(e => e.id);
  const gorulur = sel => {
    const e = document.querySelector(sel);
    if (!e) return null;
    const b = e.getBoundingClientRect();
    const s = getComputedStyle(e);
    if (!b.width || !b.height || s.display === 'none' || s.visibility === 'hidden') return null;
    return (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);
  };
  return {
    ekranlar: acik,
    play: gorulur('#playBtn'),
    daily: gorulur('#dailyBtn'),
    hint: gorulur('#hint'),
    h1: gorulur('#menu h1'),
    alt: gorulur('#menuSub'),
  };
});

let onceki = '';
const izle = async (saniye, etiket) => {
  const bitis = Date.now() + saniye * 1000;
  while (Date.now() < bitis) {
    const g = await gorunen();
    const anahtar = JSON.stringify(g);
    if (anahtar !== onceki) {
      onceki = anahtar;
      not(`[${etiket}] ekran: ${g.ekranlar.join(',') || '-'}`,
        [g.h1 && `başlık "${g.h1}"`, g.daily && `günlük "${g.daily}"`,
         g.play && `oyna "${g.play}"`, g.hint && `ipucu "${g.hint}"`]
          .filter(Boolean).join(' · ') || 'metin yok');
    }
    await pg.waitForTimeout(400);
  }
};

await izle(6, 'açılış');
await pg.screenshot({ path: `${OUT}/1-acilis.png` });

// Oyuncunun ilk dokunuşu: ekranda ne varsa ona basar. Günlük ekranı
// çıkıyorsa önce o, sonra Play.
let dokunus = 0;
if (await pg.isVisible('#dailyBtn')) {
  await pg.click('#dailyBtn'); dokunus++;
  not(`DOKUNUŞ ${dokunus}: günlük ekranındaki düğme`);
  await izle(3, 'günlükten sonra');
  await pg.screenshot({ path: `${OUT}/2-menu.png` });
}

await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 30000 });
not('Play düğmesi göründü');
await pg.click('#playBtn'); dokunus++;
not(`DOKUNUŞ ${dokunus}: Play`);

// Oyun gerçekten oynanabilir hâle ne zaman geliyor? Tarla düşerken delik
// parmağa cevap vermiyor; oyuncunun ilk hamlesini yapabildiği an bu.
const oynanirT = Date.now();
await pg.waitForFunction(() => {
  const w = window.fruitHoleWhere();
  return w && w.state === 'playing' && w.timeLeft > 0;
}, { timeout: 30000 });
await pg.waitForTimeout(1900);   // düşüş
not('oynanabilir', `Play'e basıldıktan ${((Date.now() - oynanirT) / 1000).toFixed(1)}s sonra`);
await pg.screenshot({ path: `${OUT}/3-oyun.png` });

const ilk = await pg.evaluate(() => window.fruitHoleWhere());
not('tarla', `${ilk.total} meyve · ${ilk.timeLeft}s süre · delik r=${ilk.r}`);

// İlk 30 saniyeyi oyna ve ne kadar ilerlediğini ölç. İyi bir oyuncu gibi
// değil, yeni bir oyuncu gibi: en yakına git, ama her zaman değil.
const oyna = async (saniye) => {
  const bitis = Date.now() + saniye * 1000;
  while (Date.now() < bitis) {
    await pg.evaluate(() => {
      const w = window.fruitHoleWhere();
      const n = window.fruitHoleNearest();
      if (!n) return;
      const dx = n.x - w.x, dz = n.z - w.z;
      const d = Math.hypot(dx, dz) || 1;
      window.fruitHoleSteer(dx / d, dz / d);
    });
    await pg.waitForTimeout(120);
  }
};
await oyna(30);
const otuz = await pg.evaluate(() => window.fruitHoleWhere());
not('30 saniye oynandı',
  `yenen ${otuz.eaten}/${otuz.total} (%${Math.round(otuz.eaten / otuz.total * 100)}) · ` +
  `delik r=${otuz.r} (başlangıç ${ilk.r}) · kalan süre ${otuz.timeLeft}s`);
await pg.screenshot({ path: `${OUT}/4-otuzsaniye.png` });

// İpucu yazısı hâlâ ekranda mı? Otuz saniye sonra hâlâ duruyorsa oyuncu onu
// okumuş ve geçmiş demektir, yer kaplıyor.
const ipucu = await pg.evaluate(() => {
  const e = document.getElementById('hint');
  if (!e) return 'yok';
  const s = getComputedStyle(e);
  return `opacity ${s.opacity} · "${(e.textContent || '').trim()}"`;
});
not('ipucu', ipucu);

console.log('\n=== YENİ OYUNCUNUN İLK DAKİKASI ===\n');
console.log(gunluk.join('\n'));
console.log(`\ntoplam dokunuş (oynamaya başlamak için): ${dokunus}`);
console.log(hatalar.length ? `\nSAYFA HATALARI:\n${hatalar.join('\n')}` : '\nsayfa hatası yok');
console.log(`\ngörüntüler: ${OUT}/`);

await pg.close();
await br.close();
srv.close();
