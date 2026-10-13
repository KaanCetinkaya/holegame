// Motor Works'ün TikTok klipleri, gerçek oyundan.
//
//   node build-www.mjs
//   node tycoon/make-clips.mjs                 # hepsi
//   node tycoon/make-clips.mjs --only=buyume   # tek klip
//   node tycoon/make-clips.mjs --only=buyume,musteri --seconds=10
//
// Fruit Hole'un klip aracından iki şey devralındı ve ikisi de orada
// ölçülerek öğrenildi:
//
//   1. **Sahte saat.** Oyunun `requestAnimationFrame`'i ve
//      `performance.now`'ı değiştiriliyor, her kare saati tam 1/FPS
//      ilerletiyor. Ekran görüntüsü almak yavaş; gerçek saatle çekilen
//      klipte oyun kareler arasında sıçrıyor.
//   2. **Sert ret.** Bir klip anlatacağı şeyi anlatmadıysa dosya
//      yazılmıyor. Fruit Hole'da uyarı yazıp dosyayı yine de yazmıştı
//      ve iki klip hiçbir şey yutmadan TikTok'a gitti.
//
// Buradaki fark zaman: Fruit Hole'da bir bölüm gerçek zamanda oynanıyor.
// Motor Works bir idle oyun, sekiz saniyede anlatacak bir şeyi ancak
// zamanı hızlandırarak gösterebiliyor. Ekonomi her karede `jeRun` ile
// ileri sarılıyor, animasyon ise normal hızda akıyor — yani fabrika
// büyürken kollar ve bantlar doğal hızında çalışıyor.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';

const ROOT = '/home/user/holegame';
const WWW = join(ROOT, 'www-tycoon');
const OUT = join(ROOT, 'tycoon/store/clips');
const TMP = '/tmp/tycoon-clips';
const PORT = 8731;

const arg = (ad, varsayilan = null) => {
  const bul = process.argv.find(a => a.startsWith(`--${ad}=`));
  return bul ? bul.slice(ad.length + 3) : varsayilan;
};

const FPS = 30;
const SECONDS = Number(arg('seconds', 8));
// Çekim 540x960, çıktı 1080x1920'ye büyütülüyor. Doğrudan 1080'de
// çekmek SwiftShader'da kare başına saniyelerce sürüyor.
const W = 540, H = 960, OUT_W = 1080, OUT_H = 1920;
const ffmpeg = existsSync('/usr/bin/ffmpeg') ? '/usr/bin/ffmpeg' : 'ffmpeg';

// Her klip bir şey anlatıyor ve anlattığını **kanıtlıyor**. `kur` sahneyi
// hazırlıyor, `kare` her karede ne olacağını söylüyor, `kanit` klibin
// gerçekten o şeyi gösterdiğini ölçüyor.
const KLIPLER = [
  {
    id: 'buyume',
    ad: 'Tek ocaktan dolu önlüğe',
    // Sekiz saniyede sekiz dakikalık oyun. Oyuncunun ilk oturumda
    // gördüğü şey bu: boş bir önlük doluyor.
    kur: async pg => pg.evaluate(() => {
      window.jeWipeProgress();
      window.jeTutSkip();
      window.jeAutoCarry(true);
      window.jeCam(19, 0.04);
    }),
    kare: async (pg, f, toplam) => pg.evaluate(({ f, toplam }) => {
      // Zaman eğrisi: başta yavaş, sonra hızlanıyor. Düz bir hız ilk
      // saniyede her şeyi bitirip geri kalanı boş bırakıyordu.
      const k = f / toplam;
      const sn = 0.4 + k * k * 5.5;
      window.jeRun(sn);
      for (let i = 0; i < 4; i++) window.jeBuyManager(i);
      const AD = ['Foundry', 'Stamping', 'Assembly', 'Dispatch'];
      window.jeBuy(AD.indexOf(window.jeProbe().neck), 'max');
      window.jeRefresh();
      const p = window.jeProbe();
      return { lvl: Math.max(...p.lvl), hiz: p.income, cisim: window.jePerf().cisim };
    }, { f, toplam }),
    kanit: (s, W, H) => {
      const ilk = s[0], son = s[s.length - 1];
      const buyume = son.cisim - ilk.cisim;
      return {
        ok: son.lvl >= 60 && buyume >= 20,
        yazi: `seviye ${ilk.lvl} → ${son.lvl} · hız ${ilk.hiz.toFixed(0)} → ${son.hiz.toExponential(2)} · ` +
              `sahnede ${ilk.cisim} → ${son.cisim} cisim (+${buyume})`,
        neden: `klip büyümeyi göstermiyor: seviye ${son.lvl} (en az 60), yeni cisim ${buyume} (en az 20)`,
      };
    },
  },
  {
    id: 'musteri',
    ad: 'Müşteri geliyor — dokun',
    kur: async pg => pg.evaluate(() => {
      window.jeWipeProgress();
      window.jeTutSkip();
      window.jeGive(1e9);
      for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 60); window.jeGiveManager(i); }
      window.jeRefresh();
      window.jeCam(16, 0.06);
      window.jeMusBelir();
    }),
    kare: async (pg, f, toplam) => pg.evaluate(({ f, toplam }) => {
      window.jeRun(0.4);
      // Dokunuş klibin üçte ikisinde: öncesinde araba giriyor ve
      // bekliyor, sonrasında para uçuyor ve araba çıkıyor.
      const dokunKare = Math.round(toplam * 0.62);
      let odendi = 0;
      if (f === dokunKare) odendi = window.jeMusDokun(0, 0);
      const d = window.jeMus();
      return { hal: d.hal, ekranda: !!d.ekran, odendi };
    }, { f, toplam }),
    kanit: (s, W, H) => {
      const odeme = s.reduce((a, x) => a + x.odendi, 0);
      const ekran = s.filter(x => x.ekranda).length;
      return {
        ok: odeme > 0 && ekran >= s.length * 0.7,
        yazi: `araba ${ekran}/${s.length} karede ekranda · ödeme ${odeme.toFixed(0)}`,
        neden: `müşteri klibi işini yapmıyor: ekranda ${ekran}/${s.length} kare, ödeme ${odeme.toFixed(0)}`,
      };
    },
  },
  {
    id: 'subeler',
    ad: 'Her şubede başka bir yer',
    kur: async pg => pg.evaluate(() => {
      window.jeWipeProgress();
      window.jeTutSkip();
      window.jeGive(1e12);
      for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 90); window.jeGiveManager(i); }
      window.jeRefresh();
      window.jeCam(20, 0.03);
      window.jeSetBranch(0);
    }),
    kare: async (pg, f, toplam) => pg.evaluate(({ f, toplam }) => {
      window.jeRun(0.5);
      // Beş yer, klibe eşit bölünmüş.
      const yer = Math.min(4, Math.floor(f / (toplam / 5)));
      if (yer !== window.jeYer().sube) window.jeSetBranch(yer);
      return { yer, gok: window.jeYer().gok };
    }, { f, toplam }),
    kanit: (s, W, H) => {
      const gokler = [...new Set(s.map(x => x.gok))];
      return {
        ok: gokler.length >= 4,
        yazi: `${gokler.length} ayrı gökyüzü: ${gokler.join(' ')}`,
        neden: `şube klibi yer değiştirmiyor: yalnızca ${gokler.length} ayrı gökyüzü görüldü (en az 4)`,
      };
    },
  },
  {
    id: 'cevrimdisi',
    ad: 'Kapalıyken de kazanıyor',
    // Idle oyunun tek cümlelik vaadi. İşçi klibi yerine bu kondu:
    // ölçüldü, işçinin iki istasyon arasındaki gerçek yürüyüşü iki
    // birimden kısa (menzil 2.6, bölmeler 7 birim arayla), yani sekiz
    // saniyede anlatacak bir hikâyesi yok — ekranda yalnızca yerinde
    // sallanan bir figür görünüyordu.
    kur: async pg => pg.evaluate(() => {
      window.jeWipeProgress();
      window.jeTutSkip();
      window.jeGive(1e7);
      for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 80); window.jeGiveManager(i); }
      window.jeRefresh();
      window.jeCam(19, 0.04);
    }),
    kare: async (pg, f, toplam) => pg.evaluate(({ f, toplam }) => {
      window.jeRun(0.5);
      // Üçte birde dört saatlik yokluk dönüyor, üçte ikide toplanıyor.
      const donus = Math.round(toplam * 0.3);
      const topla = Math.round(toplam * 0.62);
      let kazanc = 0;
      if (f === donus) { const r = window.jeOffline(4 * 3600); kazanc = r ? r.got : 0; }
      if (f === topla) document.getElementById('wOk')?.click();
      window.jeRefresh();
      return { kazanc, ekran: document.getElementById('welcome').classList.contains('show'),
               kasa: window.jeProbe().cash };
    }, { f, toplam }),
    kanit: (s, W, H) => {
      const kazanc = s.reduce((a, x) => a + x.kazanc, 0);
      const ekranda = s.filter(x => x.ekran).length;
      const artis = s[s.length - 1].kasa - s[0].kasa;
      return {
        ok: kazanc > 0 && ekranda >= s.length * 0.2 && artis > 0,
        yazi: `çevrimdışı kazanç ${kazanc.toExponential(2)} · dönüş ekranı ${ekranda}/${s.length} karede · ` +
              `kasa ${s[0].kasa.toExponential(2)} → ${s[s.length - 1].kasa.toExponential(2)}`,
        neden: `çevrimdışı klibi işini yapmıyor: kazanç ${kazanc.toFixed(0)}, ` +
               `ekran ${ekranda}/${s.length} kare, kasa artışı ${artis.toFixed(0)}`,
      };
    },
  },
];

const secili = arg('only');
let liste = KLIPLER;
if (secili) {
  const istenen = secili.split(',').map(s => s.trim()).filter(Boolean);
  const bilinmeyen = istenen.filter(id => !KLIPLER.some(c => c.id === id));
  if (bilinmeyen.length) {
    console.error(`bilinmeyen klip: ${bilinmeyen.join(', ')}\n` +
                  `olanlar: ${KLIPLER.map(c => c.id).join(', ')}`);
    process.exit(1);
  }
  liste = KLIPLER.filter(c => istenen.includes(c.id));
}

// Oyunun saatini sahteleyen katman. Sayfadaki her şeyden önce çalışmalı,
// yoksa oyun gerçek rAF'a çoktan abone olmuş olur.
const SAHTE_SAAT = () => {
  let t = 0;
  const kuyruk = [];
  window.requestAnimationFrame = cb => { kuyruk.push(cb); return kuyruk.length; };
  window.cancelAnimationFrame = () => {};
  try {
    Object.defineProperty(window.performance, 'now', { configurable: true, value: () => t });
  } catch (e) { window.performance.now = () => t; }
  window.__step = ms => {
    t += ms;
    const parti = kuyruk.splice(0, kuyruk.length);
    for (const cb of parti) { try { cb(t); } catch (e) {} }
  };
};

if (!existsSync(join(WWW, 'index.html'))) {
  console.error('www-tycoon yok. Önce: node build-www.mjs');
  process.exit(1);
}
const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync(join(WWW, p));
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(PORT);

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars'],
});

let cikan = 0, dusen = 0;
for (const klip of liste) {
  console.log(`\n${klip.id} — ${klip.ad}`);
  const kareDizin = join(TMP, klip.id);
  rmSync(kareDizin, { recursive: true, force: true });
  mkdirSync(kareDizin, { recursive: true });

  const ctx = await browser.newContext({ viewport: { width: W, height: H }, locale: 'tr-TR' });
  const pg = await ctx.newPage();
  const hatalar = [];
  pg.on('pageerror', e => hatalar.push(String(e)));
  await pg.addInitScript(() => localStorage.clear());
  await pg.addInitScript(SAHTE_SAAT);
  await pg.goto(`http://localhost:${PORT}/`, { waitUntil: 'load', timeout: 90000 });
  await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 60000 });
  // Açılış ekranları klibin üstünü kapatıyor.
  await pg.evaluate(() => {
    for (const s of document.querySelectorAll('.screen')) s.classList.remove('show');
    document.getElementById('tut').classList.remove('show');
  });
  await klip.kur(pg);
  // Sahne otursun: ilk kareler kurulum sırasında yarım kalmış görünüyor.
  for (let i = 0; i < 10; i++) await pg.evaluate(ms => window.__step(ms), 1000 / FPS);

  const toplam = Math.round(SECONDS * FPS);
  const olcum = [];
  for (let f = 0; f < toplam; f++) {
    olcum.push(await klip.kare(pg, f, toplam));
    await pg.evaluate(ms => window.__step(ms), 1000 / FPS);
    await pg.screenshot({
      path: join(kareDizin, String(f).padStart(5, '0') + '.png'),
      animations: 'disabled',
    });
    if (f % 30 === 0) process.stdout.write(`  ${f}/${toplam} kare\r`);
  }
  await ctx.close();

  if (hatalar.length) console.log(`  sayfa hatası: ${hatalar[0]}`);
  const k = klip.kanit(olcum, W, H);
  console.log(`  ${k.yazi}`);
  if (!k.ok) {
    // Fruit Hole'da öğrenilen kural: tutmayan klip **yazılmıyor**.
    console.log(`  DÜŞTÜ — ${k.neden}`);
    dusen++;
    rmSync(kareDizin, { recursive: true, force: true });
    continue;
  }

  const mp4 = join(OUT, `${klip.id}.mp4`);
  const r = spawnSync(ffmpeg, [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS),
    '-i', join(kareDizin, '%05d.png'),
    '-vf', `scale=${OUT_W}:${OUT_H}:flags=lanczos`,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-an',
    mp4,
  ], { encoding: 'utf8' });
  if (r.status !== 0) { console.log('  ffmpeg düştü:\n' + (r.stderr || '')); dusen++; continue; }
  rmSync(kareDizin, { recursive: true, force: true });
  console.log(`  klip çıktı: ${mp4} (${SECONDS} sn, ${OUT_W}x${OUT_H})`);
  cikan++;
}

await browser.close();
srv.close();
console.log(`\n${cikan} klip çıktı${dusen ? `, ${dusen} düştü` : ''}`);
process.exitCode = dusen ? 1 : 0;
