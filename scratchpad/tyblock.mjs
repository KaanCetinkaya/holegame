import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
const OUT='/tmp/claude-0/-home-user-holegame/69f8c7ec-ec6d-510e-8b3f-e83d17995163/scratchpad';
const srv=createServer((q,r)=>{const p=q.url==='/'?'/index.html':q.url.split('?')[0];
 try{const b=readFileSync('/home/user/holegame/www-tycoon'+p);
 r.writeHead(200,{'content-type':p.endsWith('.js')?'text/javascript':'text/html'});r.end(b);}
 catch{r.writeHead(404);r.end('no');}}).listen(8157);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const pg=await b.newPage({viewport:{width:412,height:892},deviceScaleFactor:2});
const errs=[]; pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('http://localhost:8157/',{waitUntil:'load'});
await pg.waitForFunction(()=>window.jeProbe); await pg.waitForTimeout(600);
await pg.evaluate(()=>document.getElementById('dOk')?.click());
// Kaan'ın ekranındaki durumu kur: sevkiyat çok geride, üçü tıkalı
await pg.evaluate(()=>{ jeGive(1e12);
  jeBuy(0,77-1); jeBuy(1,88-1); jeBuy(2,95-1); jeBuy(3,51-1);
  for(let i=0;i<4;i++) jeBuyManager(i);
  jeRun(120); });
await pg.waitForTimeout(900);
const meta = await pg.evaluate(()=>[...document.querySelectorAll('.st .meta')].map(e=>e.textContent));
const red  = await pg.evaluate(()=>[...document.querySelectorAll('.st .buf i')].map(e=>e.classList.contains('full')));
console.log('meta:', JSON.stringify(meta,null,1));
console.log('kırmızı:', red);
console.log('darboğaz:', (await pg.evaluate(()=>jeProbe())).neck);
await pg.screenshot({path:OUT+'/t_block.png'});
console.log('errors:', errs.length?errs:'none');
await b.close(); srv.close();
