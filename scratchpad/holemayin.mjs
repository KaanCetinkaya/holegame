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
const pg = await br.newPage({viewport:{width:412,height:915}});
await pg.addInitScript(FAKE);
pg.on('pageerror', e=>console.log('HATA '+e));
await pg.goto('http://localhost:8422/',{waitUntil:'load'});
await pg.waitForFunction(()=>typeof window.fruitHoleProbe==='function',{timeout:25000});

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
console.log('\n  blm tohum  saat  bomba  yendi  ceza(sn)  yenen      kalan  sonuç');
for (const lv of BLM) {
  for (let t = 0; t < 4; t++) {
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
               eaten: w.eaten, total: w.total, timeLeft: w.timeLeft, state: w.state };
    }, [lv, t, FPS]);
    sonuc.push({ lv, t, ...o });
    console.log(`  ${String(lv).padStart(3)} ${String(t).padStart(5)} ${String(o.saat).padStart(5)} ` +
      `${String(o.bombaBas).padStart(6)} ${String(o.yendi).padStart(6)} ${String(o.yendi*5).padStart(9)} ` +
      `${String(o.eaten+'/'+o.total).padStart(9)} ${String(o.timeLeft).padStart(10)}  ${o.state}`);
  }
}
console.log('\nizin verilen bomba (MINE_ALLOW) 4 · bomba bedeli 5 sn');

const fails = [];
const check = (ok, ne, ek = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ne}${ek ? '   ' + ek : ''}`);
  if (!ok) fails.push(`${ne} ${ek}`);
};
console.log('');
// Ceza bir duvar değil: dikkatsiz oyuncu çoğu tohumda bitirebiliyor.
// "Hepsinde" denmiyor — tahta tohuma göre değişiyor ve bir tohumda
// kaybedilmesi kuralın kendisi.
const kazanan = sonuc.filter(r => r.state === 'won').length;
check(kazanan >= sonuc.length * 0.6,
  'bomba cezası bölümü kaybettiren bir duvar değil',
  `${kazanan}/${sonuc.length} koşu kazandı`);
// Ama üç yıldız vermiyor. Bu cezanın gerçekten durduğu yer.
const ucYildiz = sonuc.filter(r => r.state === 'won' && r.timeLeft / r.saat >= 0.45);
check(!ucYildiz.length,
  'bombaları süpüren oyuncu üç yıldız almıyor',
  ucYildiz.length ? ucYildiz.map(r => `${r.lv}:${(r.timeLeft / r.saat * 100).toFixed(0)}%`).join(' ')
                  : `en iyisi %${Math.max(...sonuc.filter(r => r.state === 'won')
                      .map(r => Math.round(r.timeLeft / r.saat * 100)))}`);
// Bombalar gerçekten yeniyor: yenmeyen bomba ölçülen şeyi ölçmez.
check(sonuc.every(r => r.yendi >= 5), 'bot gerçekten bomba yiyor',
  `en az ${Math.min(...sonuc.map(r => r.yendi))} bomba`);

console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
process.exitCode = fails.length ? 1 : 0;
await br.close(); srv.close();
