// Silindir: şerit nerede, tahtayı kapatıyor mu, ve geçilebiliyor mu?
//
//   node build-www.mjs && node scratchpad/holeroller.mjs
//
// Oyunun ilk hareketli engeli, ve hiçbir kaynak almıyor — ne saatten, ne
// boydan. Aldığı şey **yol**. Bu, ölçülecek şeyleri de değiştiriyor: burada
// "ne kadar götürüyor" diye bir soru yok, "geçilebiliyor mu" var.
//
// Üç sessiz hata:
//
//   1. **Duvar olmuş merdane.** Şeridi tahtanın enini kaplıyor, yani iki
//      ucunda dolaşacak yer kalmıyor. O zaman tahta ikiye bölünüyor ve
//      oyuncunun tek seçeneği beklemek — engel değil, duraklama.
//   2. **Kayanın içinden geçen merdane.** Şeridin üstünde katı bir şey var.
//      Ekranda taş taşın içinden geçiyor, ve oyunun kendi kuralı bozuluyor.
//   3. **Doğuşta duran merdane.** Oyuncu tahtaya inerken merdanenin altında.
//      İlk hareketi "neden itiliyorum" oluyor.
//
// Dördüncüsü zamanlama: merdane deliğin hızına yakınsa kaçmak oyuncunun
// hatası olmaktan çıkıyor. Bu geometriyle ölçülüyor, oyundan okunan iki
// sayıyla.

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
}).listen(8275);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('http://localhost:8275/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleRollers, { timeout: 25000 });

const fails = [];
const check = (ok, ne, ek = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ne}${ek ? '   ' + ek : ''}`);
  if (!ok) fails.push(`${ne} ${ek}`);
};

const K = await pg.evaluate(() => {
  const r = window.fruitHoleRollers();
  return { ilk: r.ilkBolum, hiz: r.hiz, boy: r.boy,
           agiz: window.fruitHoleRocks().agizTavani,
           deligin: window.fruitHoleSpeed().taban };
});
console.log(`\nsilindir ${K.ilk}. bölümde başlıyor · şerit ${K.boy} birim · ` +
            `hız ${K.hiz} (delik ${K.deligin})`);

const SON = 60;
const satir = [];
console.log('\nblm  düzen       tahta    görev   | silindir  uç boşluk  doğuşa  şeritte katı');
console.log('----+-----------+--------+--------+----------+----------+-------+-------------');
for (let n = 1; n <= SON; n++) {
  const r = await pg.evaluate(l => {
    window.fruitHoleSeedField(7300 + l);
    const p = window.fruitHoleProbe(l);
    const s = window.fruitHoleRollers();
    window.fruitHoleUnseedField();
    return { ...p, s };
  }, n);
  satir.push({ n, ...r });
  if (r.s.sayi) {
    console.log(
      `${String(n).padStart(4)} ${String(r.pattern).padEnd(11)} ${r.kind.padEnd(8)} ` +
      `${String(r.mission || '-').padEnd(8)}| ${String(r.s.sayi).padStart(8)} ` +
      `${String(r.s.ucBosluk).padStart(10)} ${String(r.s.dogusaEnYakin).padStart(7)} ` +
      `${String(r.s.seritteKati).padStart(13)}`);
  }
}

const silindirli = satir.filter(r => r.s.sayi > 0);
console.log(`\n${SON} bölümün ${silindirli.length}'inde silindir var`);

console.log('\n1. nerede çıkıyor');
{
  const erken = satir.filter(r => r.n < K.ilk && r.s.sayi);
  check(!erken.length, `${K.ilk}. bölümden önce silindir yok`, erken.map(r => r.n).join(' '));

  const yanlisTahta = satir.filter(r => r.kind !== 'ızgara' && r.s.sayi);
  check(!yanlisTahta.length, 'resim, şerit ve bulmaca tahtalarında silindir yok',
    yanlisTahta.map(r => `${r.n}:${r.kind}`).join(' '));

  const gorevde = satir.filter(r => r.mission && r.s.sayi);
  check(!gorevde.length, 'görev bölümlerinde silindir yok',
    gorevde.map(r => `${r.n}:${r.mission}`).join(' '));

  // Tanıtım bölümünde gerçekten bir silindir olmalı: ipucu satırı orada
  // çıkıyor ve olmayan bir şeyi anlatan bir ipucu, ipucu değil gürültü.
  // Dikende ve mancınıkta bu elle kontrol edilmişti; burada ölçülüyor,
  // çünkü ilk yazışta 26 seçilmişti ve 26 bir şerit tahtası.
  const tanitim = satir.find(r => r.n === K.ilk);
  check(tanitim && tanitim.kind === 'ızgara' && !tanitim.mission,
    'tanıtım bölümü sıradan bir ızgara tahtası',
    `${K.ilk}: ${tanitim.kind}${tanitim.mission ? '/' + tanitim.mission : ''}`);

  check(silindirli.length >= 8, 'silindir gerçekten çıkıyor (ölü kod değil)',
    `${silindirli.length} tahta`);
}

console.log('\n2. kapı mı, duvar mı');
{
  // Şeridin iki ucunda en geniş ağzın dolaşabileceği yer kalmalı. Kalmazsa
  // merdane tahtayı ikiye bölüyor ve oyuncunun tek seçeneği beklemek.
  const dar = silindirli.filter(r => r.s.ucBosluk < K.agiz);
  check(!dar.length, 'şeridin ucuyla kenar arasına en geniş ağız sığıyor',
    dar.map(r => `${r.n}:${r.s.ucBosluk}`).join(' ') ||
    (silindirli.length ? `uç boşluk ${silindirli[0].s.ucBosluk}, ağız ${K.agiz}` : '-'));

  const kati = silindirli.filter(r => r.s.seritteKati > 0);
  check(!kati.length, 'şeridin üstünde kaya ya da mancınık yok',
    kati.map(r => `${r.n}:${r.s.seritteKati}`).join(' '));

  const dogusta = silindirli.filter(r => r.s.dogusaEnYakin < K.agiz + 1);
  check(!dogusta.length, 'hiçbir silindir deliğin doğduğu yerde değil',
    dogusta.map(r => `${r.n}:${r.s.dogusaEnYakin}`).join(' '));
}

console.log('\n3. geçilebiliyor mu');
{
  // Merdane delikten yavaş olmalı: hızlı olsaydı sıkışmak oyuncunun hatası
  // olmaktan çıkardı. Yükseltmesiz taban hızla ölçülüyor.
  check(K.hiz < K.deligin, 'merdane en yavaş delikten bile yavaş',
    `${K.hiz} < ${K.deligin}`);

  // Ve gerçekten gidip geliyor: bir tur attığında iki uca da değiyor.
  const lv = silindirli.length ? silindirli[0].n : null;
  if (lv == null) {
    check(false, 'hareket ölçülebilecek bir tahta var');
  } else {
    const yol = await pg.evaluate(l => {
      window.fruitHoleSeedField(7300 + l);
      window.fruitHoleProbe(l);
      const x = [];
      // Bir tur: şeridin boyu / hız, iki yönde. Fazlasıyla adım atılıyor.
      for (let i = 0; i < 300; i++) x.push(window.fruitHoleRollerStep(0.05)[0]);
      window.fruitHoleUnseedField();
      return { enAz: Math.min(...x), enCok: Math.max(...x) };
    }, lv);
    const yariBoy = K.boy / 2;
    console.log(`  merdane ${yol.enAz} ile ${yol.enCok} arasında gidip geliyor ` +
                `(şerit ±${yariBoy})`);
    check(Math.abs(yol.enAz + yariBoy) < 0.2 && Math.abs(yol.enCok - yariBoy) < 0.2,
      'merdane şeridin iki ucuna da varıyor ve dışına taşmıyor',
      `${yol.enAz} .. ${yol.enCok}`);
  }
}

console.log('\nsayfa hataları: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
