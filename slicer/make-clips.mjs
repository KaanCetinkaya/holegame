// Slice Rush'ın TikTok klipleri, gerçek oynanıştan.
//
//   node build-www.mjs
//   node slicer/make-clips.mjs                 # hepsi
//   node slicer/make-clips.mjs --only=kesim    # tek klip
//   node slicer/make-clips.mjs --only=kesim,demir --seconds=10
//
// Neden var: üç oyunun ikisinin klip aracı vardı (Fruit Hole ve Motor
// Works) ve kapalı testteki Slice Rush'ın hiç yoktu. Mağaza görselleri
// (`slshots`, `slframe`) duruyor ama onlar tek kare; oyunun anlattığı şey
// — bıçağın meyveyi gerçekten ikiye bölmesi, demirin arasından geçmek —
// hareketsiz bir karede görünmüyor.
//
// Araç Motor Works'ünkinin aynısı ve iki kuralı oradan geliyor; ikisi de
// Fruit Hole'da ölçülerek öğrenildi:
//
//   1. **Sahte saat.** Oyunun `requestAnimationFrame`'i ve
//      `performance.now`'ı değiştiriliyor, her kare saati tam 1/FPS
//      ilerletiyor. Konteynerde GPU yok ve bir kare yüzlerce milisaniye
//      sürüyor; gerçek saatle çekilen klipte oyun kareler arasında
//      sıçrar.
//   2. **Sert ret.** Bir klip anlatacağı şeyi anlatmadıysa dosya
//      yazılmıyor. Fruit Hole'da uyarı yazıp dosyayı yine de yazmıştı ve
//      iki klip hiçbir şey yutmadan TikTok'a gitti.
//
// Buradaki fark oyuncu: Motor Works'te ekonomi ileri sarılıyor, burada
// **turun kendisi oynanıyor**. Oyunun kendi otomatik sürücüsü
// (`sliceAutoPlay`) kare kare sürüyor — yani klipte görünen şey oyunun
// yürüttüğü tur, kurgulanmış bir yol değil. Sürücü iyi bir oyuncu değil
// (bir sonraki engele bakıyor, ondan sonrakine değil) ve bu kliplerde
// işe yarıyor: kaçırdığı meyve de, son anda kaçışı da gerçek.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';

const ROOT = '/home/user/holegame';
const WWW = join(ROOT, 'www-slicer');
const OUT = join(ROOT, 'slicer/store/clips');
const TMP = '/tmp/slicer-clips';
const PORT = 8741;

const arg = (ad, varsayilan = null) => {
  const esit = process.argv.find(a => a.startsWith(`--${ad}=`));
  if (esit) return esit.slice(ad.length + 3);
  const i = process.argv.indexOf(`--${ad}`);
  return i === -1 ? varsayilan : process.argv[i + 1];
};

const FPS = 30;
const SECONDS = Number(arg('seconds', 8));
// Çekim 540x960, çıktı 1080x1920'ye büyütülüyor: doğrudan 1080'de çekmek
// SwiftShader'da kare başına saniyelerce sürüyor.
const W = 540, H = 960, OUT_W = 1080, OUT_H = 1920;
const ffmpeg = existsSync('/usr/bin/ffmpeg') ? '/usr/bin/ffmpeg' : 'ffmpeg';

// Her klip bir şey anlatıyor ve anlattığını **kanıtlıyor**: `kur` turu
// başlatıyor, `kare` her karede oyunu bir adım ilerletip ne olduğunu
// okuyor, `kanit` klibin gerçekten o şeyi gösterdiğini ölçüyor.
//
// Kanıtların eşikleri seçilmedi, çekilerek ölçüldü — her birinin yanında
// ölçülen sayı yazılı.
// Kaç karede tur gerçekten sürüyor. Çarpan bir tur ekranda **donuyor**:
// kamera son engele yapışıyor ve kalan saniyeler o görüntüde geçiyor.
// İlk çekimde `yer` klibi tam bunu yaptı ve kanıtı görmedi, çünkü kanıt
// yalnızca temaya bakıyordu — bir klibin "bir şey oluyor" kapısı,
// anlattığı şeyin kapısı kadar gerekli.
const yasayanKare = s => s.filter(x => x.state === 'playing').length;
// Tur bitince klip **donuyor**: bitiş ekranı (ya da çarpma görüntüsü)
// kalan saniyeleri yiyor. İlk çekimde `yer` klibi beşinci saniyesini
// demire yapışmış hâlde geçirdi; ikinci çekimde üç klip birden "tur
// sürmüyor" diye düştü ve sebebi çarpma değildi — bölüm **bitmişti**.
// Sekiz saniyelik bir klip bir turdan uzun, yani doğru davranış turu
// yenilemek. `devam` bunu yapıyor ve kaçıncı turda olduğumuzu söylüyor.
// Tur yenilendiğinde parkur sıfırlanıyor, yani "kaç demir geçildi" gibi
// sayaçlar da sıfırlanıyor. Toplam, turların en yüksek değerlerinin
// toplamı.
const turToplam = (s, alan) => {
  const enCok = new Map();
  for (const x of s) enCok.set(x.tur, Math.max(enCok.get(x.tur) || 0, x[alan]));
  return [...enCok.values()].reduce((a, b) => a + b, 0);
};

const KLIPLER = [
  {
    id: 'kesim',
    ad: 'Her şey gerçekten ikiye bölünüyor',
    // Oyunun tek cümlesi. Meyve "yok olmuyor", bıçağın geçtiği yerden
    // ikiye ayrılıyor ve iki yarı ayrı ayrı düşüyor — bu türün
    // videosunda insanın izlediği şey o.
    kur: async pg => pg.evaluate(() => {
      window.sliceStart(6);          // altıncı bölüm: havuz dolu, hız orta
    }),
    kare: async pg => pg.evaluate(() => {
      // Bölüm biterse bir sonrakine geçiliyor: klip sekiz saniye, tur
      // ondan kısa.
      const p0 = window.sliceProbe();
      if (p0.state !== 'playing') window.sliceStart(p0.level + 1);
      window.sliceAutoPlay();
      const p = window.sliceStep(1 / 30);
      return { cut: p.cut, streak: p.streak, state: p.state, shards: p.shards,
               tur: p.level };
    }),
    kanit: (s) => {
      const kesim = turToplam(s, 'cut');
      const enCokParca = Math.max(...s.map(x => x.shards));
      const komboda = Math.max(...s.map(x => x.streak));
      const canli = yasayanKare(s);
      return {
        ok: kesim >= 20 && enCokParca >= 4 && komboda >= 8 && canli >= s.length * 0.9,
        yazi: `${kesim} kesim · en çok ${enCokParca} yarım aynı anda havada · ` +
              `kombo ${komboda} · ${canli}/${s.length} karede tur sürüyor`,
        neden: `kesim klibi kesmiyor: ${kesim} kesim, ${enCokParca} yarım, kombo ${komboda}, ` +
               `${canli}/${s.length} canlı kare`,
      };
    },
  },
  {
    id: 'demir',
    ad: 'Demirin arasından',
    // İkinci cümle: parkur yalnızca meyve değil. Demir tek taraflı
    // geliyor ve cevabı "öteki uca git"; mengene iki taraflı ve cevabı
    // "tam şu yükseklikte ol". Yirmi ikinci bölümde ikisi de var.
    kur: async pg => pg.evaluate(() => { window.sliceStart(22); }),
    kare: async pg => pg.evaluate(() => {
      const p0 = window.sliceProbe();
      if (p0.state !== 'playing') { window.sliceStart(22); window.__tur = (window.__tur || 0) + 1; }
      window.sliceAutoPlay();
      const p = window.sliceStep(1 / 30);
      // Geçilen demir: bıçağın gerisinde kalan, çarpılmamış olanlar.
      const gecilen = window.sliceBars().filter(b => b.d < p.dist).length;
      return { cut: p.cut, state: p.state, gecilen, y: p.bladeY, hedef: p.hedefY,
               tur: window.__tur || 0 };
    }),
    kanit: (s) => {
      const demir = turToplam(s, 'gecilen');
      const olum = s.some(x => x.state === 'over');
      // Bıçak gerçekten şerit değiştirmeli: sabit bir yükseklikte geçen
      // bir klip "demirin arasından" demiyor.
      const yLer = s.map(x => x.y);
      const aralik = Math.max(...yLer) - Math.min(...yLer);
      const canli = yasayanKare(s);
      return {
        ok: demir >= 4 && !olum && aralik >= 1.5 && canli >= s.length * 0.9,
        yazi: `${demir} demir geçildi · bıçak ${aralik.toFixed(1)} birim gezdi · ` +
              `${olum ? 'çarptı' : 'çarpmadı'} · ${canli}/${s.length} karede tur sürüyor`,
        neden: `demir klibi işini yapmıyor: ${demir} demir, ${aralik.toFixed(1)} birim, ` +
               `${olum ? 'turda çarpma var' : 'çarpma yok'}`,
      };
    },
  },
  {
    id: 'mayin',
    ad: 'Hattı bırakmak zorundasın',
    // Oyunun ilk gerçek kararı: meyve sırası bir yükseklikte akıyor,
    // mayın tam o hizada oturuyor, devamı başka bir hizada. Kesmemek
    // gereken tek şey o.
    // Tahta aranıyor, seçilmiyor: mayın her tahtada ve her yerde
    // çıkmıyor (parça havuzda bir seçenek, ve yer bulamazsa vazgeçiyor —
    // ölçüldü, onda bir buçuk tur boş geçiyor: `slparca`). Sekiz saniyede
    // bıçak parkurun ilk yüz yirmi biriminde kalıyor, yani mayın orada
    // değilse klip mayın göstermiyor — ilk çekimde tam bu oldu, "0 mayın
    // geçildi" deyip düştü. Araç artık mayını erken olan bir tahta bulana
    // kadar tahtayı yeniden kuruyor; bulamazsa klip **çekilmiyor**.
    kur: async pg => pg.evaluate(() => {
      window.__mayinliTahta = () => {
        for (let i = 0; i < 80; i++) {
          window.sliceStart(16);
          const m = window.sliceMines();
          if (m.length >= 2 && m[0].d < 60) return true;
        }
        return false;
      };
      if (!window.__mayinliTahta()) throw new Error('mayınlı tahta bulunamadı');
    }),
    kare: async pg => pg.evaluate(() => {
      const p0 = window.sliceProbe();
      if (p0.state !== 'playing') { window.__mayinliTahta(); window.__tur = (window.__tur || 0) + 1; }
      window.sliceAutoPlay();
      const p = window.sliceStep(1 / 30);
      const mayin = window.sliceMines();
      return { cut: p.cut, state: p.state, y: p.bladeY,
               kalan: mayin.filter(m => m.d > p.dist).length,
               gecilen: mayin.filter(m => m.d < p.dist).length,
               vurulan: p.vurulan ? p.vurulan.kind : null,
               tur: window.__tur || 0 };
    }),
    kanit: (s) => {
      const gecilen = turToplam(s, 'gecilen');
      const mayinaOlum = s.some(x => x.vurulan === 'mine');
      const canli = yasayanKare(s);
      return {
        ok: gecilen >= 1 && !mayinaOlum && canli >= s.length * 0.9,
        yazi: `${gecilen} mayın geçildi, hiçbiri kesilmedi · ` +
              `${canli}/${s.length} karede tur sürüyor`,
        neden: `mayın klibi mayın göstermiyor: ${gecilen} geçildi` +
               (mayinaOlum ? ', ve biri kesildi' : ''),
      };
    },
  },
  {
    id: 'yer',
    ad: 'Dört bölümde bir başka yer',
    // Koridor her bölümde aynı mordu. Altı tema, dört bölümde bir
    // değişiyor; klip dördünü arka arkaya gösteriyor. Bölüm başlatmak
    // temayı kuruyor (`sliceTheme`), yani değişen şey oyunun kendisi.
    kur: async pg => pg.evaluate(() => { window.sliceStart(1); }),
    kare: async (pg, f, toplam) => pg.evaluate(({ f, toplam }) => {
      // Dört pencere, her birinde bir tema: 1, 5, 9, 13. bölümler.
      const dilim = Math.min(3, Math.floor(f / (toplam / 4)));
      const bolum = 1 + dilim * 4;
      // Tur bittiyse yeniden başlıyor. İlk çekimde bu yoktu ve klip
      // beşinci saniyesini çarpma görüntüsünde geçirdi: kamera demire
      // yapışıyor, ekranın tamamı kırmızı duruyor ve "başka bir yer"
      // diyen klip hiçbir yer göstermiyor. Kanıt da onu görmüyordu,
      // çünkü yalnızca temaya bakıyordu — o yüzden aşağıda "tur
      // sürüyor" kapısı var.
      const p0 = window.sliceProbe();
      if (p0.level !== bolum || p0.state !== 'playing') window.sliceStart(bolum);
      window.sliceAutoPlay();
      const p = window.sliceStep(1 / 30);
      return { bolum, tema: window.sliceTheme().ad, cut: p.cut, state: p.state,
               tur: bolum };
    }, { f, toplam }),
    kanit: (s) => {
      const temalar = [...new Set(s.map(x => x.tema))];
      // Her tema göz görecek kadar durmalı.
      const enKisa = Math.min(...temalar.map(t => s.filter(x => x.tema === t).length));
      const canli = yasayanKare(s);
      return {
        ok: temalar.length >= 4 && enKisa >= 20 && canli >= s.length * 0.9,
        yazi: `${temalar.length} yer: ${temalar.join(' → ')} · en kısa duran ${enKisa} kare · ` +
              `${canli}/${s.length} karede tur sürüyor`,
        neden: `yer klibi yer değiştirmiyor: ${temalar.length} tema, en kısa ${enKisa} kare, ` +
               `${canli}/${s.length} canlı kare`,
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
  console.error('www-slicer yok. Önce: node build-www.mjs');
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

  const ctx = await browser.newContext({ viewport: { width: W, height: H } });
  const pg = await ctx.newPage();
  const hatalar = [];
  pg.on('pageerror', e => hatalar.push(String(e)));
  await pg.addInitScript(() => localStorage.clear());
  await pg.addInitScript(SAHTE_SAAT);
  await pg.goto(`http://localhost:${PORT}/`, { waitUntil: 'load', timeout: 90000 });
  await pg.waitForFunction(() => typeof window.sliceProbe === 'function', { timeout: 60000 });
  // Günlük ödül penceresi ilk açılışta her şeyin önüne geliyor.
  await pg.evaluate(() => {
    document.getElementById('dOk')?.click();
    for (const s of document.querySelectorAll('.screen')) s.classList.remove('show');
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
  if (!k.ok || hatalar.length) {
    // Tutmayan klip **yazılmıyor**.
    console.log(`  DÜŞTÜ — ${hatalar.length ? hatalar[0] : k.neden}`);
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
