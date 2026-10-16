// Küçük telefonlarda Slice Rush'ın ekranları duruyor mu?
//
// Oyun 412×915'te tasarlandı ve bütün ölçümler orada yapıldı. Motor
// Works'te aynı soru sorulunca seviye rozeti kırpılmış çıkmıştı; burada
// aranan hata sınıfı da aynı: **ekranda olan ama kullanılamayan şey**.
//
// Slice Rush'ın ekranları `justify-content:center` ile ortalanıyor ve
// hiçbirinde kaydırma yok. İçerik ekrandan uzunsa taşan kısım **iki
// uçtan birden** kırpılıyor: alttaki düğme ekranın dışında kalır,
// oyuncu onu göremez ve dokunamaz — ve kaydıracak bir yer de yoktur.
//
// Ölçülen, her boyutta:
//   1. Yatay taşma yok
//   2. Her ekranın bütün düğmeleri görünür alanın içinde
//   3. Düğmeler parmak boyutunda (en az 44 piksel)
//   4. HUD hapları birbirine girmiyor ve ekranın içinde
//   5. Bölüm haritası dolu haldeyken KAPAT yerinde duruyor
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-slicer' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8731);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

// Yaygın Android boyutları, CSS pikseli olarak. 360×640 hâlâ ucuz
// cihazlarda yaygın ve Play'in desteklediği taban orası.
const BOYUTLAR = [
  // 16:9 bir telefonun **WebView'a kalan** yüksekliği: 640 dp'nin
  // durum çubuğu ve gezinme çubuğu düştükten sonrası. Ölçümün tasarım
  // boyutunda yapılması, oyuncunun gördüğü boyutta yapılmaması demek
  // değil.
  { ad: '360x568', w: 360, h: 568 },
  { ad: '360x592', w: 360, h: 592 },
  { ad: '360x640', w: 360, h: 640 },
  { ad: '360x740', w: 360, h: 740 },
  { ad: '393x851', w: 393, h: 851 },
  { ad: '412x915', w: 412, h: 915 },   // tasarımın yapıldığı boyut
];

const TAP = 44;

// Ekranlar ve onları açan yol. Menü zaten açık; ötekiler düğmeyle
// geliyor. `over` ile `clear` oynayarak geliyor, çünkü onları açan
// düğme yok.
const EKRANLAR = ['menu', 'map', 'shop', 'goals', 'over', 'clear'];

async function ekranAc(pg, ad) {
  if (ad === 'menu') return pg.evaluate(() => {
    document.getElementById('quitBtn')?.click();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('show'));
    document.getElementById('menu').classList.add('show');
  });
  if (ad === 'map')   return pg.evaluate(() => document.getElementById('mapBtn').click());
  if (ad === 'shop')  return pg.evaluate(() => document.getElementById('shopBtn').click());
  if (ad === 'goals') return pg.evaluate(() => document.getElementById('goalsBtn').click());
  if (ad === 'clear') return pg.evaluate(() => {
    window.sliceStart(3);
    window.sliceRun(6000);
  });
  if (ad === 'over') return pg.evaluate(() => {
    // Sürücüsüz koşu: er geç bir demire giriliyor. Şansla bölümü
    // bitirirse tekrar deneniyor — yoksa ölçüm `over` sanıp `clear`
    // ekranına bakıyor.
    for (let k = 0; k < 12; k++) {
      window.sliceStart(12);
      let p = window.sliceProbe();
      for (let i = 0; i < 6000 && p.state === 'playing'; i++) p = window.sliceStep(1 / 60);
      if (p.state === 'over') return;
    }
  });
}

const sorun = [];

for (const b of BOYUTLAR) {
  console.log(`\n=== ${b.ad} ===`);
  const ctx = await br.newContext({ viewport: { width: b.w, height: b.h } });
  const pg = await ctx.newPage();
  const hata = [];
  pg.on('pageerror', e => hata.push(String(e).split('\n')[0]));
  await pg.addInitScript(() => localStorage.clear());
  await pg.goto('http://localhost:8731/', { waitUntil: 'load', timeout: 90000 });
  await pg.waitForFunction(() => typeof window.sliceProbe === 'function', { timeout: 60000 });
  // Gerçekçi en kötü hâl: ileri gitmiş oyuncu. Haplar en genişken,
  // harita en uzunken, dükkân doluyken bakılıyor.
  await pg.evaluate(() => {
    document.getElementById('dOk')?.click();
    localStorage.setItem('slicerush_level', '60');
    localStorage.setItem('slicerush_coins', '999999');
    const y = {}; for (let i = 1; i <= 59; i++) y[i] = 3;
    localStorage.setItem('slicerush_stars', JSON.stringify(y));
  });
  await pg.reload({ waitUntil: 'load', timeout: 90000 });
  await pg.waitForFunction(() => typeof window.sliceProbe === 'function', { timeout: 60000 });
  await pg.evaluate(() => document.getElementById('dOk')?.click());

  for (const ekran of EKRANLAR) {
    await ekranAc(pg, ekran);
    await pg.waitForTimeout(250);
    const d = await pg.evaluate(({ TAP, ekran }) => {
      const out = { acik: null, tasma: null, disari: [], kucuk: [], hud: [] };
      const gorunur = document.querySelector('.screen.show');
      out.acik = gorunur ? gorunur.id : null;
      if (document.documentElement.scrollWidth > innerWidth + 1)
        out.tasma = `${document.documentElement.scrollWidth} > ${innerWidth}`;
      if (!gorunur) return out;
      // Düğmeler ve dokunulabilir kutular: hepsi görünür alanın içinde
      // olmalı. Yarısı dışarıda kalan bir düğme yoktur.
      const hedefler = [...gorunur.querySelectorAll('.btn, .blade, .lv, .goal.ready')];
      for (const el of hedefler) {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        // Kaydırılabilen bir kutunun içindeki şey ulaşılabilir:
        // ekranın dışında duran ama kaydırılarak getirilebilen bir
        // düğme kayıp değil. Kaydırılamayan bir kutuda ise ekranın
        // dışı ulaşılamaz demek.
        //
        // Kutuyu adıyla bilmek yetmiyordu: ekranın kendisi de
        // kaydırılabilir oldu ve ölçüm onu tanımadığı için düzelmiş
        // bir yerleşimi hâlâ hata sayıyordu.
        let kaydirilir = false;
        for (let p = el.parentElement; p; p = p.parentElement) {
          const cs = getComputedStyle(p);
          if (/auto|scroll/.test(cs.overflowY) && p.scrollHeight > p.clientHeight + 1) {
            const k = p.getBoundingClientRect();
            // Kutunun kendisi ekranda olmalı; olmayan bir kutunun
            // içindekine de ulaşılamıyor.
            if (k.top >= -1 && k.bottom <= innerHeight + 1) kaydirilir = true;
            break;
          }
          if (p.classList.contains('screen')) break;
        }
        if (kaydirilir) continue;
        const ad = el.id || el.className.split(' ')[0] + ':' + (el.textContent || '').trim().slice(0, 10);
        if (r.top < -1 || r.bottom > innerHeight + 1)
          out.disari.push(`${ad} [${Math.round(r.top)}..${Math.round(r.bottom)}]`);
        if (el.classList.contains('btn') && r.height < TAP)
          out.kucuk.push(`${ad} ${Math.round(r.height)}px`);
      }
      return out;
    }, { TAP, ekran });

    const dert = [];
    if (d.acik !== ekran) dert.push(`ekran ${d.acik}`);
    if (d.tasma) dert.push(`yatay taşma ${d.tasma}`);
    if (d.disari.length) dert.push(`dışarıda: ${d.disari.join(', ')}`);
    if (d.kucuk.length) dert.push(`küçük: ${d.kucuk.join(', ')}`);
    console.log(`  ${ekran.padEnd(6)} ${dert.length ? dert.join(' · ') : 'tamam'}`);
    if (dert.length) sorun.push(`${b.ad} ${ekran}: ${dert.join(' · ')}`);
  }

  // HUD: oyun içindeyken dört hap tek satırda. Paralar altı haneyken
  // en geniş hâlinde.
  await pg.evaluate(() => { window.sliceStart(60); window.sliceRun(120); });
  await pg.waitForTimeout(200);
  const hud = await pg.evaluate(() => {
    const ids = ['levelTag', 'scoreTag', 'coinTag', 'pauseBtn'];
    // HUD görünür değilse aşağıdaki bütün kutular sıfır genişlikte
    // ölçülür ve ölçüm hiçbir şey ölçmeden "tamam" der. Bu satır o
    // yüzden var: ilk yazılışında koşu bitmiş oluyordu ve dört hap da
    // 0+0+0+0 çıkıyordu.
    if (!document.getElementById('hud').classList.contains('show'))
      return { gizli: window.sliceProbe().state };
    const r = ids.map(i => { const e = document.getElementById(i); const b = e.getBoundingClientRect();
      return { i, l: b.left, r: b.right, t: b.top, b: b.bottom, w: b.width }; });
    const cakisma = [];
    for (let i = 1; i < r.length; i++)
      if (r[i].l < r[i - 1].r - 1) cakisma.push(`${r[i - 1].i}|${r[i].i}`);
    const disari = r.filter(x => x.l < -1 || x.r > innerWidth + 1).map(x => x.i);
    return { cakisma, disari, genislik: r.map(x => Math.round(x.w)).join('+'),
             toplam: Math.round(r[3].r - r[0].l), ekran: innerWidth };
  });
  const hd = [];
  if (hud.gizli) hd.push(`HUD görünmüyor (state ${hud.gizli}) — ölçülemedi`);
  if (hud.cakisma?.length) hd.push(`çakışma: ${hud.cakisma.join(', ')}`);
  if (hud.disari?.length) hd.push(`dışarıda: ${hud.disari.join(', ')}`);
  console.log(`  hud    ${hud.gizli ? '-' : hud.genislik + ' = ' + hud.toplam + ' / ' + hud.ekran}` +
    (hd.length ? '  ' + hd.join(' · ') : '  tamam'));
  if (hd.length) sorun.push(`${b.ad} hud: ${hd.join(' · ')}`);

  if (hata.length) { sorun.push(`${b.ad} sayfa hatası: ${hata[0]}`); console.log(`  HATA ${hata[0]}`); }
  await ctx.close();
}

console.log('');
ok(!sorun.length, 'her boyutta bütün ekranlar kullanılabilir', sorun.length ? `\n        ` + sorun.join('\n        ') : '');

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
