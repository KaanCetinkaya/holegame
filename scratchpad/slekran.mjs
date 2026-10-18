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
  await pg.waitForFunction(() => typeof window.sliceProbe === 'function', null, { timeout: 60000 });
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
  await pg.waitForFunction(() => typeof window.sliceProbe === 'function', null, { timeout: 60000 });
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

  // HUD: oyun içindeyken dört hap tek satırda.
  //
  // Koşunun **başında** değil, en geniş olduğu anda bakılıyor. Hap
  // genişlikleri yazıyla büyüyor: 60. bölümde kesim sayısı üç haneye,
  // para da öyle çıkıyor, ve tam o anda dört hap 360 pikseli
  // zorluyor. Koşu başlar başlamaz bakmak "🔪 0 · 🪙 0" ölçmek, yani
  // rahat olanı ölçmek.
  const hud = await pg.evaluate(() => {
    const ids = ['levelTag', 'scoreTag', 'coinTag', 'pauseBtn'];
    const olc = () => ids.map(i => {
      const e = document.getElementById(i);
      const b = e.getBoundingClientRect();
      // Hap küçülüyor mu: `.pill` esnek bir öğe ve `flex-shrink`
      // kapatılmamış, yani satıra sığmayan yazı hapın yuvarlak
      // zeminini taşıyor. Ekranda görünen şey rakamın kenarlığın
      // dışına taşması.
      return { i, l: b.left, r: b.right, w: b.width, yazi: e.textContent.trim(),
               tasan: e.scrollWidth > e.clientWidth + 1 ? e.scrollWidth - e.clientWidth : 0 };
    });
    window.sliceStart(60);
    // HUD görünür değilse bütün kutular sıfır genişlikte ölçülür ve
    // ölçüm hiçbir şey ölçmeden "tamam" der. İlk yazılışında tam bu
    // oldu: koşu bitmiş oluyordu ve dört hap 0+0+0+0 çıkıyordu.
    if (!document.getElementById('hud').classList.contains('show'))
      return { gizli: window.sliceProbe().state };
    // Satıra kalan yer, HUD **görünürken** ölçülüyor: koşu bittiğinde
    // `#hud` display:none oluyor ve kutusu sıfır genişlik veriyor.
    const kutu = document.getElementById('hud').getBoundingClientRect();
    const cs = getComputedStyle(document.getElementById('hud'));
    const ic = kutu.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    let enGenis = olc(), enGenisW = 0;
    for (let i = 0; i < 4000; i++) {
      window.sliceAutoPlay();
      const p = window.sliceStep(1 / 60);
      if (p.state !== 'playing') break;
      if (i % 20) continue;
      const r = olc();
      const w = r[3].r - r[0].l;
      if (w > enGenisW) { enGenisW = w; enGenis = r; }
    }
    // Sürücünün o koşuda ulaştığı sayı en büyük sayı değil: 60.
    // bölümde doksan parada kalıyor çünkü meyvenin yarısını kaçırıyor,
    // oyuncu ise üç haneye çıkıyor. En büyük sayıları oyunun kendisi
    // söylüyor (`sliceEnCok`) — testin kesim başına kazancı kendi
    // hesaplaması, formül değiştiğinde ölçümün eski formülü ölçmesi
    // olurdu.
    window.sliceStart(60);
    const enc = window.sliceEnCok();
    document.getElementById('scoreTag').textContent = '🔪 ' + enc.kesim;
    document.getElementById('coinTag').textContent = '🪙 ' + enc.para;
    document.getElementById('hud').classList.add('show');
    const r2 = olc();
    if (r2.reduce((a, x) => a + x.w, 0) > enGenis.reduce((a, x) => a + x.w, 0)) enGenis = r2;
    const r = enGenis;
    const cakisma = [];
    for (let i = 1; i < r.length; i++)
      if (r[i].l < r[i - 1].r - 1) cakisma.push(`${r[i - 1].i}|${r[i].i}`);
    const disari = r.filter(x => x.l < -1 || x.r > innerWidth + 1).map(x => x.i);
    const tasan = r.filter(x => x.tasan).map(x => `${x.i} +${Math.round(x.tasan)}px`);
    const toplamW = r.reduce((a, x) => a + x.w, 0);
    return { cakisma, disari, tasan, genislik: r.map(x => Math.round(x.w)).join('+'),
             yazi: r.map(x => x.yazi).join(' '),
             toplam: Math.round(toplamW), yer: Math.round(ic),
             pay: Math.round(ic - toplamW), ekran: innerWidth };
  });
  const hd = [];
  if (hud.gizli) hd.push(`HUD görünmüyor (state ${hud.gizli}) — ölçülemedi`);
  if (hud.cakisma?.length) hd.push(`çakışma: ${hud.cakisma.join(', ')}`);
  if (hud.disari?.length) hd.push(`dışarıda: ${hud.disari.join(', ')}`);
  if (hud.tasan?.length) hd.push(`yazı hapı taşıyor: ${hud.tasan.join(', ')}`);
  console.log(`  hud    ${hud.gizli ? '-' : `${hud.genislik} = ${hud.toplam} / ${hud.yer}  pay ${hud.pay}px  "${hud.yazi}"`}` +
    (hd.length ? '  ' + hd.join(' · ') : '  tamam'));
  if (hd.length) sorun.push(`${b.ad} hud: ${hd.join(' · ')}`);

  // Köşedeki ses tuşu başlığın üstüne binmiyor.
  //
  // Tuş menünün sağ üstünde ve başlık ortalanmış: 360 pikselde 42
  // piksellik "🔪 Slice Rush" yazısının son harfleri tuşun altına
  // giriyordu (ölçüldü — yazı 291'e kadar, tuş 291'de başlıyor).
  // Öğenin kutusuna değil **yazının kendisine** bakılıyor: ortalanmış
  // bir başlığın kutusu satırın tamamı, harfler ortada.
  await pg.evaluate(() => {
    for (const s of ['levels', 'map', 'shop', 'goals', 'collection', 'over', 'clear', 'pause'])
      document.getElementById(s)?.classList.remove('show');
    document.getElementById('menu').classList.add('show');
  });
  await pg.waitForTimeout(200);
  const bas = await pg.evaluate(() => {
    const m = document.getElementById('muteBtn');
    const h = document.querySelector('#menu h1');
    if (!m || !h) return { yok: true };
    const rg = document.createRange(); rg.selectNodeContents(h);
    const a = m.getBoundingClientRect(), t = rg.getBoundingClientRect();
    const kesis = !(a.right <= t.left || a.left >= t.right || a.bottom <= t.top || a.top >= t.bottom);
    // Dikeyde ayrıysa yatay pay bir şey ifade etmiyor: başlık ekranın
    // ortasındayken tuşun altından geçmiyor.
    const ayniBant = !(a.bottom <= t.top || a.top >= t.bottom);
    return { kesis, ayniBant, pay: ayniBant ? Math.round(a.left - t.right) : null,
             tuş: [Math.round(a.left), Math.round(a.right)],
             yazi: [Math.round(t.left), Math.round(t.right)] };
  });
  console.log(`  başlık yazı ${bas.yazi?.join('..')} · ses tuşu ${bas.tuş?.join('..')} · ` +
    (bas.ayniBant ? `aynı bantta, pay ${bas.pay}px` : 'ayrı bantta'));
  if (bas.yok || bas.kesis)
    sorun.push(`${b.ad} ses tuşu başlığın üstünde (pay ${bas.pay}px)`);

  if (hata.length) { sorun.push(`${b.ad} sayfa hatası: ${hata[0]}`); console.log(`  HATA ${hata[0]}`); }
  await ctx.close();
}

console.log('');
ok(!sorun.length, 'her boyutta bütün ekranlar kullanılabilir', sorun.length ? `\n        ` + sorun.join('\n        ') : '');

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
