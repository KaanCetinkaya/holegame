// Mancınık: nereye konuyor, ne zaman atıyor, ve kaçmak gerçekten mümkün mü?
//
//   node build-www.mjs && node scratchpad/holecatapult.mjs
//
// Oyunun ilk **aktif** tehdidi. Bomba yerde bekliyor, kaya duruyor, diken
// değince alıyor; bu, oyuncunun durduğu yere atıyor. Aktif olması yeni bir
// hata sınıfı açıyor ve hepsi sessiz:
//
//   1. **Kaçılamayan atış.** Uyarı süresi, deliğin işaretin dışına çıkmasına
//      yetmiyor. O zaman ekrandaki halka bir uyarı değil bir duyuru olur:
//      "beş saniyeni alacağım". Oyuncu kaçtığını sanıp yine yiyor.
//   2. **Süpürülemez tahta.** İki atış arası, bir öbeği temizlemeye
//      yetmiyor. Tahtada durulamıyorsa tahta süpürülemiyor.
//   3. **Görünmeyen makine.** Kayanın ya da başka bir mancınığın dibinde,
//      ya da deliğin doğduğu yerde. Katı bir şey orada durursa tahta
//      kapanıyor.
//
// Birincisi geometriyle ölçülüyor (delik hızı × uyarı süresi, patlama
// yarıçapına karşı), ikincisi ve üçüncüsü yerleşimden. Zamanlama gerçek
// saatle değil `fruitHoleCatapultStep` ile adım adım ilerletiliyor:
// konteynerde GPU yok ve kare hızı hiçbir şey söylemiyor.

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
}).listen(8274);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('http://localhost:8274/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleCatapults, { timeout: 25000 });

const fails = [];
const check = (ok, ne, ek = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ne}${ek ? '   ' + ek : ''}`);
  if (!ok) fails.push(`${ne} ${ek}`);
};

// Kuralların hepsi oyundan okunuyor. Bir sayıyı iki yere yazmak, birini
// değiştirip ötekini unutmanın tanımı.
const K = await pg.evaluate(() => {
  const c = window.fruitHoleCatapults();
  const g = window.fruitHoleGrow();
  return { ilk: c.ilkBolum, uyari: c.uyari, arasi: c.arasi, capi: c.capi,
           bedel: c.bedel, agiz: window.fruitHoleRocks().agizTavani, max: g.max };
});
console.log(`\nmancınık ${K.ilk}. bölümde başlıyor · uyarı ${K.uyari}sn · ` +
            `atış arası ${K.arasi}sn · çap ${K.capi} · bedel ${K.bedel}sn`);

const SON = 60;
const satir = [];
console.log('\nblm  düzen       tahta    görev   | mancınık  doğuşa  kayaya  kenara');
console.log('----+-----------+--------+--------+----------+-------+-------+-------');
for (let n = 1; n <= SON; n++) {
  const r = await pg.evaluate(l => {
    window.fruitHoleSeedField(7200 + l);
    const p = window.fruitHoleProbe(l);
    const c = window.fruitHoleCatapults();
    window.fruitHoleUnseedField();
    return { ...p, c };
  }, n);
  satir.push({ n, ...r });
  if (r.c.sayi) {
    console.log(
      `${String(n).padStart(4)} ${String(r.pattern).padEnd(11)} ${r.kind.padEnd(8)} ` +
      `${String(r.mission || '-').padEnd(8)}| ${String(r.c.sayi).padStart(8)} ` +
      `${String(r.c.dogusaEnYakin).padStart(7)} ${String(r.c.katiyaEnYakin ?? '-').padStart(7)} ` +
      `${String(r.c.kenara).padStart(7)}`);
  }
}

const mancinikli = satir.filter(r => r.c.sayi > 0);
console.log(`\n${SON} bölümün ${mancinikli.length}'inde mancınık var`);

console.log('\n1. nerede çıkıyor');
{
  const erken = satir.filter(r => r.n < K.ilk && r.c.sayi);
  check(!erken.length, `${K.ilk}. bölümden önce mancınık yok`, erken.map(r => r.n).join(' '));

  const yanlisTahta = satir.filter(r => r.kind !== 'ızgara' && r.c.sayi);
  check(!yanlisTahta.length, 'resim, şerit ve bulmaca tahtalarında mancınık yok',
    yanlisTahta.map(r => `${r.n}:${r.kind}`).join(' '));

  const gorevde = satir.filter(r => r.mission && r.c.sayi);
  check(!gorevde.length, 'görev bölümlerinde mancınık yok',
    gorevde.map(r => `${r.n}:${r.mission}`).join(' '));

  const enCok = Math.max(...mancinikli.map(r => r.c.sayi));
  check(enCok <= 2, 'hiçbir tahtada ikiden fazla mancınık yok', `en çok ${enCok}`);
  check(mancinikli.length >= 10, 'mancınık gerçekten çıkıyor (ölü kod değil)',
    `${mancinikli.length} tahta`);
}

console.log('\n2. tahtayı kapatmıyor');
{
  // Mancınık katı: kaya kurallarının hepsi geçerli. Doğuş yerinde duran bir
  // katı, oyuncuyu daha ilk karede sıkıştırır.
  const dogusta = mancinikli.filter(r => r.c.dogusaEnYakin < K.agiz + 1);
  check(!dogusta.length, 'hiçbir mancınık deliğin doğduğu yerde değil',
    dogusta.map(r => `${r.n}:${r.c.dogusaEnYakin}`).join(' '));

  // Kenar payı, ve tahtanın kapanmamasının **gerçek** sebebi bu.
  //
  // İlk yazışta burada "kaya ile mancınığın arasından en geniş ağız
  // geçebilmeli" diye bir şart vardı ve o şart gereğinden katıydı: iki katı
  // arasından geçmek zorunda değilsin, etrafından dolaşıyorsun. Tahtayı açık
  // tutan şey kenar payı — her katı, kenardan (merkezden ölçülerek) en az bir
  // ağız boyu artı kendi yarıçapı kadar uzakta duruyor, yani her engelin iki
  // yanında en geniş ağzın geçtiği bir şerit hep kalıyor. Katı bir şeyin
  // tahtayı kapatması ancak kenara yaklaşmasıyla olur.
  const kenarda = mancinikli.filter(r => r.c.kenara < K.agiz);
  check(!kenarda.length, 'her mancınığın iki yanında geçilecek şerit var',
    kenarda.map(r => `${r.n}:${r.c.kenara}`).join(' '));

  // Kayayla arası: geçilmesi değil, **ayırt edilmesi** ölçülüyor. Birbirine
  // yapışmış bir kaya ile mancınık yukarıdan tek bir kütle okunuyor ve
  // oyuncu hangisinin ne yaptığını göremiyor. Bir ağız boyu yetiyor.
  const yapisik = mancinikli.filter(r => r.c.katiyaEnYakin != null
    && r.c.katiyaEnYakin < K.agiz - 0.01);
  check(!yapisik.length, 'kaya ile mancınık birbirine yapışmıyor',
    yapisik.map(r => `${r.n}:${r.c.katiyaEnYakin}`).join(' ') ||
    `en yakını ${Math.min(...mancinikli.filter(r => r.c.katiyaEnYakin != null)
      .map(r => r.c.katiyaEnYakin))}`);
}

console.log('\n3. kaçmak mümkün mü');
{
  // En önemli ölçü. Uyarı süresi boyunca delik ne kadar yol alıyor, ve o yol
  // patlama yarıçapını aşıyor mu? Aşmıyorsa halka bir uyarı değil, bir
  // duyuru.
  //
  // Hız yükseltmesiz, yani oyunun en yavaş deliği: yükseltme almış bir
  // oyuncu zaten daha rahat kaçıyor. Yükseltmeyle ölçmek, hiç yükseltme
  // almamış oyuncunun kaçamadığını görmemek olurdu.
  const h = await pg.evaluate(() => window.fruitHoleSpeed
    ? window.fruitHoleSpeed() : null);
  const hiz = h ? h.taban : null;
  if (hiz == null) {
    console.log('  (hız okunamadı, `fruitHoleSpeed` yok — geometri ölçüsü atlandı)');
  } else {
    const yol = hiz * K.uyari;
    console.log(`  en yavaş delik ${K.uyari}sn'de ${yol.toFixed(2)} birim gidiyor, ` +
                `patlama yarıçapı ${K.capi}`);
    // Pay isteniyor: tam sınırda kaçmak, "kaçılabilir" değil "tam kaçılabilir"
    // demek ve oyuncunun tepki süresi de var.
    check(yol > K.capi * 1.8, 'en yavaş delik bile işaretin dışına rahatça çıkıyor',
      `${yol.toFixed(2)} > ${(K.capi * 1.8).toFixed(2)}`);
  }

  // Ve gerçekten: duran bir delik yiyor, kaçan yemiyor.
  const lv = mancinikli.length ? mancinikli[0].n : null;
  if (lv == null) {
    check(false, 'atış ölçülebilecek bir tahta var');
  } else {
  const duran = await pg.evaluate(l => {
    window.fruitHoleSeedField(7200 + l);
    window.fruitHoleProbe(l);
    window.fruitHoleStartLevel();
    window.fruitHoleCatapultFire(0);
    // Yerinde duruyor: adım adım uyarı süresi geçiriliyor.
    for (let i = 0; i < 40; i++) window.fruitHoleCatapultStep(0.05);
    const n = window.fruitHoleCatapults().isabet;
    window.fruitHoleUnseedField();
    return n;
  }, lv);
  check(duran > 0, 'yerinde duran delik atışı yiyor', `${duran} isabet`);

  const kacan = await pg.evaluate(([l, capi]) => {
    window.fruitHoleSeedField(7200 + l);
    window.fruitHoleProbe(l);
    window.fruitHoleStartLevel();
    const a = window.fruitHoleCatapultFire(0);
    // İşaretin dışına taşınıyor — gerçek oyuncunun yaptığı şey.
    window.fruitHolePushTest(a.tx + capi * 2.5, a.tz, null);
    for (let i = 0; i < 40; i++) window.fruitHoleCatapultStep(0.05);
    const n = window.fruitHoleCatapults().isabet;
    window.fruitHoleUnseedField();
    return n;
  }, [lv, K.capi]);
  check(kacan === 0, 'işaretin dışına çıkan delik atışı yemiyor', `${kacan} isabet`);
  }
}

console.log('\n4. tahta hâlâ süpürülebiliyor mu');
{
  // Hiç kaçmayan bir oyuncunun kaybettiği pay, ve bu pay bölümün saatinden
  // **bağımsız**: saat T ise atış sayısı T/arası, kayıp (T/arası)×bedel,
  // yani oran bedel/arası. İki sabitin oranı, oyunun bütün tahtalarındaki
  // cevabı birden veriyor.
  //
  // İlk ölçüde 5/4.2 = %119'du: mancınık tek başına bölümü bitirebiliyordu,
  // oyuncu tahtayı kusursuz süpürse bile. Bir engelin bölümü kazanılamaz
  // yapması, engel değil duvar demek.
  const pay = K.bedel / K.arasi;
  const enKisa = mancinikli.reduce((a, b) => (b.seconds < a.seconds ? b : a));
  console.log(`  hiç kaçmayan oyuncunun kaybı: saatin %${Math.round(pay * 100)}'i ` +
              `(en kısa saat ${enKisa.seconds}sn, ${enKisa.n}. bölüm)`);
  check(pay < 0.5, 'hiç kaçmayan oyuncu bile saatinin yarısından azını kaybediyor',
    `%${Math.round(pay * 100)}`);
  // Ve tahtada gerçekten bir baskı olmalı: saniyede bir atmıyor ama bölüm
  // boyunca bir avuç atış geliyor.
  const atis = Math.round(enKisa.seconds / K.arasi);
  check(atis >= 5, 'bir bölümde hissedilecek kadar atış var', `${atis} atış`);
}

console.log('\nsayfa hataları: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
