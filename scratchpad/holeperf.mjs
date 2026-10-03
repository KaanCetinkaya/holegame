// Kare ölçer gerçekten ölçüyor mu, ve ölçtüğü şeyi bozmuyor mu?
//
//   node build-www.mjs && node scratchpad/holeperf.mjs
//
// Neden var: bu ölçerin **söylediği sayı** bir karar verdirecek — instancing
// işine girilip girilmeyeceğini. Yanlış sayı veren bir ölçer, hiç ölçmemekten
// kötü: olmayan bir soruna gün harcatır ya da olan birini gizler.
//
// Tarayıcıda kare süresinin kendisi ölçülemiyor (konteynerde GPU yok,
// SwiftShader yük altında zıplıyor). O yüzden burada ölçülen şey sayının
// **doğruluğu** değil, ölçerin kablolaması:
//
//   1. Yalnızca oynarken sayıyor. Menüdeki diorama tek halka meyve, yani
//      oradaki kare süresi oyunun kare süresi hakkında hiçbir şey söylemiyor.
//   2. Koşu bitince saklanıyor. Oturumda kalan bir sayı, tam da bakılacağı
//      anda silinmiş olurdu — oyuncu teşhis ekranını takılmanın hemen
//      ardından açmıyor.
//   3. En kötü karenin **hangi bölümde** olduğunu tutuyor. Takılmanın nerede
//      olduğunu bilmek, ne kadar olduğunu bilmek kadar önemli.
//   4. Teşhis ekranındaki satır ölçerin kendisiyle aynı kaynaktan okuyor.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((req, res) => {
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-fruithole' + p);
    res.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8308);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = [];
pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
await pg.addInitScript(() => localStorage.setItem('fruithole_level', '12'));
await pg.goto('http://localhost:8308/', { waitUntil: 'domcontentloaded' });
await pg.waitForFunction(() => window.fruitHolePerf, { timeout: 60000 });

const fails = [];
const check = (ok, ad, not = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ad}${not ? '   ' + not : ''}`);
  if (!ok) fails.push(ad + (not ? ' — ' + not : ''));
};

await pg.evaluate(() => window.fruitHolePerfReset());
await pg.waitForTimeout(2500);
if (await pg.isVisible('#dailyBtn')) await pg.click('#dailyBtn');
await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 30000 });

// 1. Menüde beklemek sayaca girmemeli.
await pg.waitForTimeout(2500);
const menude = await pg.evaluate(() => window.fruitHolePerf());
console.log(`menüde 2.5 sn bekledikten sonra: açık sayaç ${menude.acik.n} kare`);
check(menude.acik.n === 0, 'menüde geçen kareler sayılmıyor', `${menude.acik.n} kare`);

// 2. Oynarken sayıyor.
await pg.click('#playBtn');
await pg.waitForTimeout(4000);
const oyunda = await pg.evaluate(() => window.fruitHolePerf());
console.log(`oynarken 4 sn: açık sayaç ${oyunda.acik.n} kare, en kötü ${oyunda.acik.worst} ms`);
check(oyunda.acik.n > 5, 'oynarken kare sayılıyor', `${oyunda.acik.n} kare`);
check(oyunda.acik.worst > 0, 'en kötü kare kaydediliyor', `${oyunda.acik.worst} ms`);
// Kaydedilmiş bir şey olmamalı: koşu henüz bitmedi.
check(!oyunda.frames, 'koşu bitmeden saklanmıyor', `${oyunda.frames || 0} kare`);

// 3. Koşu bitince saklanıyor, ve bölüm numarası da.
await pg.evaluate(() => window.fruitHoleTimeUp());
await pg.waitForTimeout(600);
const sonra = await pg.evaluate(() => window.fruitHolePerf());
console.log(`koşu bitince: ${sonra.frames} kare · ort ${sonra.avgMs} ms · ` +
  `en kötü ${sonra.worstMs} ms (bölüm ${sonra.worstLevel}) · ${sonra.runs} koşu`);
check(sonra.frames > 5, 'koşu bitince saklanıyor', `${sonra.frames} kare`);
check(sonra.worstLevel === 12, 'en kötü karenin bölümü kaydediliyor', `bölüm ${sonra.worstLevel}`);
check(sonra.runs === 1, 'koşu sayısı artıyor', `${sonra.runs}`);
check(sonra.acik.n === 0, 'saklandıktan sonra açık sayaç sıfırlanıyor', `${sonra.acik.n}`);

// 4. Sayfa kapanıp açılınca duruyor mu? Oyuncu teşhis ekranını takılmanın
// hemen ardından açmıyor.
await pg.reload({ waitUntil: 'domcontentloaded' });
await pg.waitForFunction(() => window.fruitHolePerf, { timeout: 60000 });
const kalici = await pg.evaluate(() => window.fruitHolePerf());
console.log(`yeniden açılınca: ${kalici.frames} kare · en kötü ${kalici.worstMs} ms`);
check(kalici.frames === sonra.frames, 'ölçüm sayfa kapanınca kaybolmuyor',
  `${kalici.frames} / ${sonra.frames}`);

// 5. Teşhis ekranı aynı kaynaktan okuyor.
// `fruitHoleDiag` bir nesne: { show, text }. Çağrılabilir sanmak testi
// düşürmüştü.
const diag = await pg.evaluate(() => window.fruitHoleDiag && window.fruitHoleDiag.text());
if (typeof diag === 'string') {
  const gecti = diag.includes(String(kalici.worstMs)) &&
    /bölüm\s*12/.test(diag.replace(/<[^>]*>/g, ' '));
  console.log(`  teşhis metninde en kötü kare ve bölüm: ${gecti ? 'var' : 'yok'}`);
  check(gecti, 'teşhis ekranı ölçerle aynı sayıyı gösteriyor');
} else {
  console.log('  (fruitHoleDiag metin döndürmüyor, atlandı)');
}

if (errs.length) fails.push('sayfa hatası: ' + errs[0]);
console.log('\n' + (fails.length ? 'hatalar:\n - ' + fails.join('\n - ') : 'hepsi geçti'));
await br.close(); srv.close();
process.exit(fails.length ? 1 : 0);
