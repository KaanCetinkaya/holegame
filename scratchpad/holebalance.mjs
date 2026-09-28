// Deve yetişmek tarlanın yüzde kaçını süpürmeyi gerektiriyor? Her bölüm için.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
const srv = createServer((req,res)=>{
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try { const b=readFileSync('/home/user/holegame/www-fruithole'+p);
    res.writeHead(200,{'content-type':p.endsWith('.js')?'text/javascript':'text/html'}); res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8163);
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=swiftshader'] });
const pg = await b.newPage({ viewport:{width:412,height:915}, deviceScaleFactor:1 });
const errs=[]; pg.on('pageerror',e=>errs.push(String(e)));
pg.on('console', m => { if (m.type()==='error' && !m.text().includes('404')) errs.push('CONSOLE: '+m.text()); });
await pg.goto('http://localhost:8163/', { waitUntil:'load' });
await pg.waitForFunction(() => typeof window.fruitHoleProbe === 'function', { timeout: 20000 });

// Kaç bölüm? Oyunun kendi sırasından. Sabit 15 yazıyordu ve düzen sayısı
// 19'dan 24'e çıkınca son dokuz düzen — beşi yepyeni — hiç ölçülmedi.
const order = await pg.evaluate(() => window.fruitHoleThemeTable().order);

// Her meyve bir birim büyütmüyor: büyük 3×, dev 9×, sıradan 1× (eatFruit).
//
// Bu satır eskiden yoktu ve hesap her meyveyi 1 sayıyordu — yani "deve
// yetişmek tahtanın yüzde kaçını süpürmeyi gerektiriyor" sorusuna, başlığı
// bunu söylediği hâlde, cevap vermiyordu. Tahtada zaten %10 kadar iri meyve
// olduğu için sayı hep olduğundan yüksek çıkıyordu; iri payı %28'e çıkınca
// fark artık görmezden gelinemez oldu ve test değişikliği hiç göremedi.
//
// Ağırlık tahtanın kendi karışımından geliyor (`fruitHoleMix`), tahminden
// değil: desenden desene bambaşka.
console.log(' blm | düzen     | meyve | iri % | açılış r | birim   | çarpan | gereken r | süpürme %  | süre');
console.log('-----+-----------+-------+-------+----------+---------+--------+-----------+------------+------');
for (let lvl = 1; lvl <= order.length; lvl++) {
  const r = await pg.evaluate(n => {
    const p = window.fruitHoleProbe(n);
    const g = window.fruitHoleGiants();
    const gr = window.fruitHoleGrow();
    const m = window.fruitHoleMix();
    return { fruit: p.fruit, secs: p.seconds, start: gr.r, unit: gr.unit,
             ilkFazla: gr.ilkFazla,
             need: g.needR, giantR: g.needR ? +(g.needR*0.92).toFixed(2) : null,
             iri: m.iriPay,
             carpan: +((m.siradan + m.buyuk * 3 + m.dev * 9) / Math.max(1, m.toplam)).toFixed(3) };
  }, lvl);
  // Kaç meyve yemek gerekiyor: ilk lokmaların fazladan büyümesi hesaba
  // katılarak.
  //
  // Model eskiden doğrusaldı (her meyve `unit * carpan` büyütür) ve `eatFruit`
  // öne yüklenen bir eğri kazandığında sessizce yanlış oldu — hata oyuncunun
  // **lehine** olduğu için hiçbir sınır düşmüyordu, yani test doğru cevabı
  // vermeyi bırakmıştı ve bunu söylemiyordu. Sabitler oyundan okunuyor
  // (`fruitHoleGrow`), burada ikinci kez yazılmıyor.
  const meyveSayisi = (hedef) => {
    const adim = r.unit * r.carpan;
    // İlk lokmaların bütçesi (`EARLY_CAP`) yarıçap cinsinden sabit: tahta ne
    // olursa olsun aynı miktar. Model de öyle — hedeften düşülüyor, gerisi
    // doğrusal. Eskiden bütçe meyve cinsindendi ve küçük tahtalarda büyüme
    // aralığının yarısını yiyordu; hem oyun hem model o yüzden değişti.
    const kalan = Math.max(0, hedef - r.start - (r.ilkFazla || 0));
    return kalan / adim;
  };
  const pct = r.need ? 100 * meyveSayisi(r.need) / r.fruit : null;
  console.log(` ${String(lvl).padStart(3)} | ${order[lvl - 1].padEnd(9)} | ${String(r.fruit).padStart(5)} | ` +
              `${('%' + (r.iri * 100).toFixed(0)).padStart(5)} | ` +
              `${r.start.toFixed(2).padStart(8)} | ${r.unit.toFixed(4)} | ${r.carpan.toFixed(2).padStart(6)} | ` +
              `${String(r.need ?? '-').padStart(9)} | ` +
              `${(pct === null ? '-' : '%' + pct.toFixed(0)).padStart(10)} | ${Math.round(r.secs)}s`);
}
console.log('errors:', errs.length ? errs : 'none');
// Hata varsa çıkış kodu da söylesin.
//
// Bu dosya hatayı **basıyordu ama çıkış kodu 0 dönüyordu**, yani onu çağıran
// her şey — toplu koşu, ileride bir CI — "geçti" diye okuyordu. Tam koşuda on
// üç test böyle çıktı: hata basan ama başarı sinyali veren bir test, hiç test
// olmamasından kötü, çünkü bakılmış olduğu izlenimi veriyor.
process.exitCode = errs.length ? 1 : 0;
await b.close(); srv.close();
