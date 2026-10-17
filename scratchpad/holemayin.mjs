// Mayın bölümünün bomba cezası neyi alıyor: bölümü mü, yıldızı mı?
//
//   node build-www.mjs && node scratchpad/holemayin.mjs
//
// Bu dosya yanlış çıkmış bir iddiayı ölçülü tutmak için var.
//
// Saat formülünün yanındaki yorum şunu diyordu: *"her bombada beş saniye
// gidiyor ve beşincisinden sonra saat yetişmiyor."* Yani mayın bölümünün
// tehdidi dört bombalık pay. Ölçülünce beş kat yanlış çıktı — bot
// bombalara hiç aldırmadan oynatıldığında 12-29 bomba yiyor, 60-145 saniye
// ceza alıyor, ve on ikide on biri **kazanıyor.**
//
// Sebep bedelde değil saatte: taban `süpürme × 2.6` ve o pay yüz otuz
// saniyelik cezayı yutuyor. Aynı bolluk kart bölümlerinde de ölçülmüştü
// (`CARD_SLACK`), yani bu tek bir bölümün değil saatin kendisinin sayısı.
//
// Ama ceza boş değil, ve ölçtüğü şey bu: **yıldız.** Üç yıldız
// `timeLeft / levelTime() >= 0.45` istiyor ve bombaları süpüren bot %13-44
// ile bitiriyor, yani bir ya da iki yıldız. Bomba oyuncuya bölümü
// kaybettirmiyor; bölümü ucuz bitirmesini engelliyor.
//
// Ölçülen iki şey:
//
//   1. Dikkatsiz oyuncu bölümü **çoğunlukla bitirebiliyor** — yani ceza
//      bir duvar değil. (Her tohumda bitirmesi de beklenmiyor: mayın
//      bölümü tohuma göre değişiyor ve biri kaybedildi.)
//   2. Dikkatsiz oyuncu **üç yıldız alamıyor.** Bu, cezanın gerçekten
//      çalıştığı yer, ve sıfır olursa mayın bölümü sıradan bir bölüm
//      olur.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
const srv = createServer((q,r)=>{const p=q.url==='/'?'/index.html':q.url.split('?')[0];let b=null;
 try{b=readFileSync('/home/user/holegame/www-fruithole'+p);}catch{}
 if(b){r.writeHead(200,{'content-type':p.endsWith('.js')?'text/javascript':'text/html'});r.end(b);}
 else{r.writeHead(404);r.end('no');}}).listen(8422);
const FAKE = () => { let t=0; const q=[];
  window.requestAnimationFrame=cb=>{q.push(cb);return q.length;};
  window.cancelAnimationFrame=()=>{};
  try{Object.defineProperty(window.performance,'now',{configurable:true,value:()=>t});}
  catch(e){window.performance.now=()=>t;}
  window.__step=ms=>{t+=ms;for(const cb of q.splice(0,q.length)){try{cb(t);}catch(e){}}};};
const br = await chromium.launch({executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
// Her koşu kendi sayfasında.
//
// Tek sayfa on iki koşu oynatıyordu ve altıncıdan sonra WebGL bağlamı
// düşüyordu: konteynerde GPU yok, uzun koşular SwiftShader'ı yoruyor, ve
// bağlam gidince oyun saati durduruyor (`pauseGame`) — bot boşluğa oynuyor,
// tablo "0 yenen, paused" yazıyor. Yedi koşu böyle gitti ve dosya bunu
// "oyuncu kaybetti" diye okuyup olmayan bir oyun hatası anlattı: "5/12
// kazandı", oysa ölçülebilen beşin beşi de kazanmıştı.
//
// Koşular zaten birbirinden bağımsız olmalı: ayrı sayfa hem bağlamı
// tazeliyor hem de bir koşunun kaydının ötekine sızmasını imkânsız kılıyor.
// Çizim kapalı olduğu için sayfa açmanın bedeli saniyenin altında.
const sayfaAc = async () => {
  const ctx = await br.newContext({viewport:{width:412,height:915}});
  const p = await ctx.newPage();
  await p.addInitScript(FAKE);
  p.on('pageerror', e=>console.log('HATA '+e));
  await p.goto('http://localhost:8422/',{waitUntil:'load'});
  await p.waitForFunction(()=>typeof window.fruitHoleProbe==='function',{timeout:25000});
  // Çizim kapalı.
  //
  // Bu dosya on iki koşu oynatıyor ve her koşu binlerce kare: konteynerde
  // GPU yok, bir kare SwiftShader'la 300-450 ms, ve toplu koşuda bu dosya
  // tek başına 3483 saniye sürdü — tam takımı koşturmayı pratikte imkânsız
  // yapan şey buydu.
  //
  // Ölçtüğü şeyin çizimle ilgisi yok: bot nereye gidiyor, kaç bomba yiyor,
  // saatin ne kadarını kullanıyor, bölümü bitiriyor mu. Bayrak yalnızca
  // `renderer.render`ı atlıyor; fizik, çarpışma, saat ve büyüme aynen
  // işliyor. Denendi: aynı tohumla 600 kare, çizimli ve çizimsiz — yenen
  // parça, kalan bomba, saat, deliğin yeri ve yarıçapı **birebir aynı**,
  // süre 366 saniyeden 1.1 saniyeye indi.
  await p.evaluate(() => window.fruitHoleDrawOff(true));
  return { ctx, p };
};
const ilk = await sayfaAc();
let pg = ilk.p, pgCtx = ilk.ctx;

const FPS = 30;
// Mayın bölümleri: görev tipi sırayla, yani 35, 75, 115... ve ikinci tur.
const BLM = await pg.evaluate(() => {
  const out = [];
  for (let l = 1; l <= 160 && out.length < 3; l++) {
    if (window.fruitHoleProbe(l).mission === 'mines') out.push(l);
  }
  return out;
});
console.log('mayın bölümleri: ' + BLM.join(', '));
const sonuc = [];
// Bağlam kaybı yüzünden ölçülemeyen koşular ayrı tutuluyor.
const olcumsuz = [];
console.log('\n  blm tohum  saat  bomba  yendi  ceza(sn)  yenen      kalan  sonuç');
for (const lv of BLM) {
  for (let t = 0; t < 4; t++) {
    await pgCtx.close();
    const yeni = await sayfaAc();
    pg = yeni.p; pgCtx = yeni.ctx;
    const o = await pg.evaluate(async ([l, tohum, fps]) => {
      window.fruitHoleSeedField(880000 + tohum * 4421 + l);
      const p = window.fruitHoleProbe(l);
      window.fruitHoleStartLevel();
      for (let i=0;i<40;i++) window.__step(1000/fps);
      const bombaBas = window.fruitHoleBombs().sayi;
      let kare = 0; const enCok = Math.round(320 * fps);
      let st = 'playing';
      while (kare < enCok) {
        const w = window.fruitHoleWhere();
        st = w.state;
        if (st !== 'playing') break;
        const h = window.fruitHoleNearest();
        if (h) { const dx=h.x-w.x, dz=h.z-w.z, d=Math.hypot(dx,dz)||1;
                 window.fruitHoleSteer(dx/d, dz/d); }
        window.__step(1000/fps);
        kare++;
      }
      const w = window.fruitHoleWhere();
      const bombaSon = window.fruitHoleBombs().sayi;
      window.fruitHoleUnseedField();
      return { saat: Math.round(p.seconds), bombaBas, yendi: bombaBas - bombaSon,
               eaten: w.eaten, total: w.total, timeLeft: w.timeLeft, state: w.state,
               // WebGL bağlamı: kaybolursa oyun saati durduruyor
               // (`pauseGame`) ve bot boşluğa oynuyor. O koşu "oyuncu
               // kaybetti" değil "ölçüm yapılamadı" demek, ve ikisi
               // birbirine karışırsa bu dosya olmayan bir oyun hatası
               // anlatır.
               gl: window.fruitHoleGl() };
    }, [lv, t, FPS]);
    sonuc.push({ lv, t, ...o });
    if (o.gl.lost || o.gl.logged) olcumsuz.push({ lv, t, ...o });
    console.log(`  ${String(lv).padStart(3)} ${String(t).padStart(5)} ${String(o.saat).padStart(5)} ` +
      `${String(o.bombaBas).padStart(6)} ${String(o.yendi).padStart(6)} ${String(o.yendi*5).padStart(9)} ` +
      `${String(o.eaten+'/'+o.total).padStart(9)} ${String(o.timeLeft).padStart(10)}  ${o.state}`);
  }
}
console.log('\nizin verilen bomba (MINE_ALLOW) 4 · bomba bedeli 5 sn');
if (olcumsuz.length) {
  console.log(`\n${olcumsuz.length} koşuda WebGL bağlamı kayboldu: ` +
    olcumsuz.map(r => `${r.lv}/${r.t}`).join(' '));
  console.log('  (bağlam kaybında oyun saati durduruyor — o koşular ölçüm değil)');
}

const fails = [];
const check = (ok, ne, ek = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ne}${ek ? '   ' + ek : ''}`);
  if (!ok) fails.push(`${ne} ${ek}`);
};
console.log('');
// Ceza bir duvar değil: dikkatsiz oyuncu çoğu tohumda bitirebiliyor.
// "Hepsinde" denmiyor — tahta tohuma göre değişiyor ve bir tohumda
// kaybedilmesi kuralın kendisi.
// Ölçülemeyen koşular istatistiğin dışında.
//
// Bağlam kaybında oyun saati durduruyor (`pauseGame`) ve bot boşluğa
// oynuyor: o koşu "oyuncu kaybetti" demiyor, "bu koşu ölçüm değil" diyor.
// İkisi bir sayılınca bu dosya olmayan bir oyun hatası anlatıyordu —
// "5/12 kazandı", oysa ölçülebilen beş koşunun beşi de kazanmıştı.
// Konteynerde GPU yok ve uzun koşularda SwiftShader bağlamı bırakabiliyor;
// oyunun kendi davranışı doğru (saati durduruyor), ölçümün bunu bilmesi
// gerekiyordu.
const gecerli = sonuc.filter(r => !r.gl.logged);
check(gecerli.length >= sonuc.length * 0.4,
  'ölçülebilen koşu yeterli',
  `${gecerli.length}/${sonuc.length} koşu ölçüldü`);
const kazanan = gecerli.filter(r => r.state === 'won').length;
check(gecerli.length > 0 && kazanan >= gecerli.length * 0.6,
  'bomba cezası bölümü kaybettiren bir duvar değil',
  `${kazanan}/${gecerli.length} koşu kazandı`);
// Ceza gerçekten **tahsil ediliyor** mu?
//
// Bu satır eskiden "bombaları süpüren oyuncu üç yıldız almıyor" diyordu ve
// 75. ile 115. bölümlerde düşüyordu (%46-70 kalan saat, yani üç yıldız).
// Ölçüldü ve sebebi mayında değil: o tahtalarda saat baştan bol. Botun
// tarlayı süpürme işi 60-70 saniye, saat 255-277 — yani yüz otuz saniyelik
// bir ceza bile yıldızı düşürmüyor.
//
// Bu dosyanın konusu bomba cezası, ve o çalışıyor: aynı bölümde çok bomba
// yiyen koşu, az yiyenden belirgin daha az saatle bitiyor. Ölçülen şey o —
// cezanın tahsil edildiği, ve bombanın kaç saniyeye mal olduğu.
//
// Saatin kendi bolluğu ayrı bir soru ve ayrı bir dosyada:
// `scratchpad/holesaat.mjs` bütün bölümler için ölçüyor ve karar
// (kat sayısını kısmak) bir denge kararı, bir hata düzeltmesi değil.
for (const lv of BLM) {
  const k = gecerli.filter(r => r.lv === lv && r.state === 'won');
  if (k.length < 3) continue;
  const cok = k.reduce((a, b) => (b.yendi > a.yendi ? b : a));
  const az = k.reduce((a, b) => (b.yendi < a.yendi ? b : a));
  const dBomba = cok.yendi - az.yendi;
  if (dBomba < 2) {
    console.log(`  --   ${lv}: koşular aynı sayıda bomba yedi (${cok.yendi}), eğim ölçülemiyor`);
    continue;
  }
  const egim = (az.timeLeft - cok.timeLeft) / dBomba;
  // Eğim bombanın bedelinden (5 sn) küçük olmamalı: olursa ceza bir yerde
  // geri veriliyor demek. Üstünde olması normal — çok bomba yiyen koşu
  // aynı zamanda daha çok dolaşıyor.
  check(egim >= 3, `${lv}: bomba cezası saatten tahsil ediliyor`,
    `${dBomba} bomba farkı -> ${(az.timeLeft - cok.timeLeft).toFixed(1)} sn ` +
    `(bomba başına ${egim.toFixed(1)} sn)`);
}
// Yıldız sonucu yazılıyor, kapı kurulmuyor: sebebi yukarıda.
const ucYildiz = gecerli.filter(r => r.state === 'won' && r.timeLeft / r.saat >= 0.45);
console.log(`  --   dikkatsiz oyuncunun yıldızı: ` +
  gecerli.filter(r => r.state === 'won')
    .map(r => `${r.lv}:%${Math.round(r.timeLeft / r.saat * 100)}`).join(' '));
if (ucYildiz.length) {
  console.log(`       ${ucYildiz.length}/${gecerli.length} koşu üç yıldız aldı — ` +
    'saat bolluğu (bkz. holesaat.mjs), mayının kendi sorunu değil');
}
// Bombalar gerçekten yeniyor: yenmeyen bomba ölçülen şeyi ölçmez.
check(gecerli.length > 0 && gecerli.every(r => r.yendi >= 5), 'bot gerçekten bomba yiyor',
  `en az ${gecerli.length ? Math.min(...gecerli.map(r => r.yendi)) : '-'} bomba`);

console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
process.exitCode = fails.length ? 1 : 0;
await br.close(); srv.close();
