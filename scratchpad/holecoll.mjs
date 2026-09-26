// Koleksiyon gerçekten sayıyor mu, gerçekten gösteriyor mu?
//
//   node build-www.mjs && node scratchpad/holecoll.mjs
//
// Koleksiyonun tek işi oyuncuya "şunu buldun, şunu bulmadın" demek. Yanlış
// yapılabileceği üç yer var ve üçü de sessizce yanlış yapıyor:
//
//   1. Nesne yutulunca işaretlenmezse sayaç hiç kıpırdamıyor ve ekran
//      63 siluetten ibaret kalıyor.
//   2. Küçük resimler oyunun kendi geometrisinden çiziliyor; üretilemezse
//      ızgara boş kutulara düşüyor ve kimse hata görmüyor.
//   3. Ekranın zemini saydam kalırsa arkadaki menü sahnesi ızgaranın
//      içinden okunuyor. İlk yazışımda tam olarak bu oldu — .72 alfa ile
//      meyve halkası Payday satırının üstünden geçiyordu, ekran görüntüsü
//      olmasa fark edilmezdi.
//
// Burada üçü de ölçülüyor: sayaç, üretilen resim sayısı, ve ızgaranın
// arkasındaki piksellerin gerçekten ekranın kendi zemini olduğu.

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-fruithole' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8249);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

const fails = [];
const check = (ok, what, saw) => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what}${saw === undefined ? '' : `   ${saw}`}`);
  if (!ok) fails.push(what);
};

async function open(bulunan = null) {
  const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
  pg.on('pageerror', e => { console.log('  SAYFA HATASI: ' + e); fails.push(String(e)); });
  await pg.addInitScript(a => {
    localStorage.clear();
    if (a) localStorage.setItem('fruithole_found', JSON.stringify(a));
  }, bulunan);
  await pg.goto('http://localhost:8249/', { waitUntil: 'load' });
  await pg.waitForFunction(() => window.fruitHoleCollection, { timeout: 40000 });
  return pg;
}

const durum = pg => pg.evaluate(() => window.fruitHoleCollection());

// Koleksiyon ekranını açmanın yolu: Goals ekranından. Günlük ödül penceresi
// açıksa önce o kapanıyor.
async function ekraniAc(pg) {
  await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });
  await pg.waitForSelector('#goalsBtn', { state: 'visible', timeout: 25000 });
  await pg.click('#goalsBtn');
  await pg.waitForTimeout(400);
  await pg.click('#collBtn');
  // Küçük resimler tek geçişte üretiliyor; GPU'suz konteynerde bu birkaç
  // saniye sürüyor.
  await pg.waitForFunction(() => window.fruitHoleCollection().thumbs > 0, { timeout: 40000 });
  await pg.waitForTimeout(300);
}

console.log('\n1. nesne yutunca işaretleniyor');
{
  const pg = await open();
  let d = await durum(pg);
  check(d.total > 40, 'oyunun bütün nesneleri listede', `${d.total} nesne`);
  check(d.found === 0, 'yeni oyuncuda hiçbiri bulunmamış');

  await pg.evaluate(() => window.fruitHoleMarkFound('bucket'));
  check((await durum(pg)).found === 1, 'işaretlenen sayılıyor');

  // Aynı nesne iki kez yutuluyor: sayaç bir kez artmalı.
  await pg.evaluate(() => window.fruitHoleMarkFound('bucket'));
  check((await durum(pg)).found === 1, 'aynı nesne iki kez sayılmıyor');

  // Kayıt: koleksiyon oturumlar arasında duruyor, yoksa toplamanın anlamı yok.
  const kayit = await pg.evaluate(() => localStorage.getItem('fruithole_found'));
  check(/bucket/.test(kayit || ''), 'diske yazılıyor', kayit);
  await pg.close();
}

console.log('\n2. yeniden açılınca hatırlıyor');
{
  const pg = await open(['bucket', 'donut', 'penguin']);
  check((await durum(pg)).found === 3, 'kayıttan okunuyor');
  // Düğmenin üstündeki sayı: koleksiyonu ekranı açmadan duyuran tek şey.
  const yazi = await pg.evaluate(() => document.getElementById('collBtn').textContent);
  check(/3\/\d+/.test(yazi), 'düğmede sayı görünüyor', yazi);
  await pg.close();
}

console.log('\n3. ekran');
{
  const pg = await open(['bucket', 'donut', 'penguin', 'lolly', 'car']);
  await ekraniAc(pg);
  check(await pg.evaluate(() => document.getElementById('collection').classList.contains('show')),
    'Goals üzerinden açılıyor');

  const d = await durum(pg);
  check(d.thumbs === d.total, 'her nesnenin küçük resmi üretildi', `${d.thumbs}/${d.total}`);
  check(d.groups.length > 3 && d.groups.every(g => g.n > 0),
    'temalara bölünmüş', d.groups.map(g => `${g.name}:${g.n}`).join(' '));

  const say = await pg.evaluate(() => ({
    metin: document.getElementById('collCount').textContent,
    hucre: document.querySelectorAll('#collList .coll').length,
    bulunan: document.querySelectorAll('#collList .coll.got').length,
    resim: document.querySelectorAll('#collList .coll img').length,
  }));
  check(say.metin.startsWith('5 /'), 'sayaç doğru', say.metin);
  check(say.hucre === d.total, 'her nesne için bir hücre', String(say.hucre));
  check(say.bulunan === 5, 'bulunanlar işaretli', String(say.bulunan));
  check(say.resim === d.total, 'her hücrede resim var', String(say.resim));

  // Kapat: geldiği yere dönüyor.
  await pg.click('#collClose');
  await pg.waitForTimeout(200);
  check(await pg.evaluate(() => !document.getElementById('collection').classList.contains('show')
    && document.getElementById('goals').classList.contains('show')),
    'Kapat Goals ekranına dönüyor');
  await pg.close();
}

console.log('\n4. zemin ızgarayı taşıyor');
{
  // Asıl ölçüm bu. Ekran saydam kaldığında arkadaki 3B menü sahnesi
  // ızgaranın içinden görünüyor ve siluetler okunmuyordu. Burada ızgaranın
  // iki hücresi arasındaki boşluktan piksel okunuyor: orası ekranın kendi
  // zemini olmalı, yani koyu ve hücreden hücreye neredeyse aynı. Menü
  // sahnesi sızıyorsa o boşluklar renk renk oluyor.
  const pg = await open(['bucket']);
  await ekraniAc(pg);
  const png = await pg.screenshot({ clip: { x: 0, y: 0, width: 412, height: 820 } });

  // Hücrelerin arasındaki boşlukların ekran koordinatları.
  const bosluklar = await pg.evaluate(() => {
    const c = [...document.querySelectorAll('#collList .coll')];
    const out = [];
    for (let i = 0; i + 1 < c.length && out.length < 12; i++) {
      const a = c[i].getBoundingClientRect(), b = c[i + 1].getBoundingClientRect();
      if (b.left > a.right && b.top === a.top) {
        out.push({ x: Math.round((a.right + b.left) / 2), y: Math.round(a.top + a.height / 2) });
      }
    }
    return out;
  });
  check(bosluklar.length >= 6, 'ölçülecek boşluk bulundu', String(bosluklar.length));

  // PNG'yi okumak için sayfanın kendi canvas'ını kullanıyoruz: konteynerde
  // resim kütüphanesi yok, tarayıcı zaten burada.
  const renkler = await pg.evaluate(async (a) => {
    const blob = new Blob([new Uint8Array(a.png)], { type: 'image/png' });
    const bmp = await createImageBitmap(blob);
    const cv = document.createElement('canvas');
    cv.width = bmp.width; cv.height = bmp.height;
    cv.getContext('2d').drawImage(bmp, 0, 0);
    const cx = cv.getContext('2d');
    return a.noktalar.map(p => [...cx.getImageData(p.x, p.y, 1, 1).data].slice(0, 3));
  }, { png: [...png], noktalar: bosluklar });

  const parlak = renkler.map(c => (c[0] + c[1] + c[2]) / 3);
  const enParlak = Math.max(...parlak), enKoyu = Math.min(...parlak);
  // Menü sahnesi sızmıyorsa bütün boşluklar aynı koyu zemin.
  check(enParlak < 110, 'boşluklar koyu, arka sahne vurmuyor',
    `en parlak ${enParlak.toFixed(0)}/255`);
  check(enParlak - enKoyu < 26, 'boşluklar birbirinin aynı',
    `fark ${(enParlak - enKoyu).toFixed(0)}`);
  await pg.close();
}

console.log(fails.length ? `\n${fails.length} kontrol düştü` : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length ? 1 : 0);
