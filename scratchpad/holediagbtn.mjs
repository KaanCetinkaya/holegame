// Teşhis ekranının düğmeleri reklam şeridinin ve sistem çubuğunun üstünde mi?
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
const srv = createServer((req,res)=>{const p=req.url==='/'?'/index.html':req.url.split('?')[0];
 try{const b=readFileSync('/home/user/holegame/www-fruithole'+p);
  res.writeHead(200,{'content-type':p.endsWith('.js')?'text/javascript':'text/html'});
  res.end(b);}catch{res.writeHead(404);res.end('no');}}).listen(8171);
const br = await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=swiftshader']});
const pg = await br.newPage({viewport:{width:412,height:915}});
await pg.goto('http://localhost:8171/',{waitUntil:'domcontentloaded'});
await pg.waitForFunction(()=>window.fruitHoleWhere,{timeout:60000});
await pg.waitForTimeout(2000);
// Telefondaki gibi: reklam şeridi var, sistem çubuğu var.
const AD = 60;
await pg.evaluate(px => window.fruitHoleAdPad(px), AD);
const r = await pg.evaluate(() => {
  // Panel gerçekten doldurularak açılıyor. Sadece .show eklemek boş bir
  // panel veriyordu ve düğmeler tepede duruyordu — test geçiyor ama
  // ölçtüğü şey telefondaki durum değil.
  window.fruitHoleDiag.show();
  const d = document.getElementById('diag');
  d.scrollTop = d.scrollHeight;
  const st = getComputedStyle(document.documentElement);
  const ad = parseFloat(st.getPropertyValue('--adPad')) || 0;
  const nav = parseFloat(st.getPropertyValue('--navPad')) || 0;
  const b = document.getElementById('diagSign').getBoundingClientRect();
  return { alt: Math.round(b.bottom), ekran: innerHeight, ad, nav,
           engel: Math.round(innerHeight - ad - nav) };
});
console.log(`ekran ${r.ekran}  reklam ${r.ad}  gezinme ${r.nav}`);
console.log(`"Sign in again" alt kenarı ${r.alt}, engelsiz alan ${r.engel}'e kadar`);
const ok = r.alt <= r.engel;
console.log(ok ? 'OK   düğme şeridin üstünde' : `FAIL düğme ${r.alt - r.engel}px altta kalıyor`);

// Düzeltmenin gerçekten bir şey değiştirdiğini göster: eski alt boşlukla
// aynı ölçüm. Bunu yapmayan bir test, kendisi olmadan da geçer.
// Kaydırma nerede olursa olsun düğme aynı yerde mi? Yapışık satırın
// sınanacak tek şeyi bu.
const yerler = await pg.evaluate(() => {
  const d = document.getElementById('diag');
  const oku = () => Math.round(document.getElementById('diagSign').getBoundingClientRect().bottom);
  d.scrollTop = 0;            const ust = oku();
  d.scrollTop = d.scrollHeight / 2; const orta = oku();
  d.scrollTop = d.scrollHeight;     const dip = oku();
  return { ust, orta, dip };
});
console.log(`kaydırma başında ${yerler.ust}, ortada ${yerler.orta}, sonunda ${yerler.dip}`);
const sabit = Math.max(yerler.ust, yerler.orta, yerler.dip) -
              Math.min(yerler.ust, yerler.orta, yerler.dip) <= 2;
console.log(sabit ? 'OK   düğme kaydırmadan bağımsız, hep aynı yerde'
                  : 'FAIL düğme kaydırmayla yer değiştiriyor');

const eski = await pg.evaluate(() => {
  const d = document.getElementById('diag');
  d.style.paddingBottom = '18px';
  d.scrollTop = d.scrollHeight;
  const st = getComputedStyle(document.documentElement);
  const ad = parseFloat(st.getPropertyValue('--adPad')) || 0;
  const nav = parseFloat(st.getPropertyValue('--navPad')) || 0;
  const b = document.getElementById('diagSign').getBoundingClientRect();
  return { alt: Math.round(b.bottom), engel: Math.round(innerHeight - ad - nav) };
});
console.log(`eski boşlukla: alt kenar ${eski.alt}, engelsiz alan ${eski.engel}` +
  (eski.alt > eski.engel ? `  -> ${eski.alt - eski.engel}px altta kalıyordu` : '  -> zaten üstteymiş'));
await br.close(); srv.close();
process.exit(ok && sabit ? 0 : 1);
