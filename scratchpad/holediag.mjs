// Teşhis ekranı üç sebebi birbirinden ayırabiliyor mu?
//
//   node build-www.mjs && node scratchpad/holediag.mjs
//
// Ekranın varlık sebebi tam olarak bu: cihazda "🏆 düğmesi yok" üç ayrı
// şeyden kaynaklanabiliyor ve üçü dışarıdan aynı görünüyor. Eğer ekran da
// üçüne aynı şeyi yazıyorsa hiçbir işe yaramaz — o yüzden burada üç durumu
// ayrı ayrı kurup çıktının gerçekten farklılaştığına bakıyoruz.
//
// Bir de ekranın kendisi bir risk: oyunun akışında olmayan bir kod, oyunun
// içindeki değişkenleri okuyor. Yanlış sırada tanımlanmış bir sabite dokunsa
// her açılışta patlardı (bu projede üç kez oldu: isBossLevel, BOSS_EVERY,
// iapInit). Onun için her bölümde sayfa hatası da dinleniyor.

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
}).listen(8222);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

const fails = [];
const check = (ok, what, saw) => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what}${saw === undefined ? '' : `   ${saw}`}`);
  if (!ok) fails.push(what);
};

// Üç durum, cihazda karşımıza çıkabilecek hâlleriyle.
const CASES = {
  // 1) Eklenti derlemeye hiç girmemiş: Capacitor native diyor ama PlayGames yok.
  'eklenti yok': `
    window.Capacitor = { isNativePlatform: () => true, Plugins: { AdMob: {} } };`,
  // 2) Eklenti var, giriş reddedildi — test kullanıcısı listesinde olmamak
  //    cihazda tam olarak böyle görünüyor.
  'giriş reddedildi': `
    window.Capacitor = { isNativePlatform: () => true, Plugins: { AdMob: {},
      PlayGames: {
        async signIn() { throw new Error('SIGN_IN_REQUIRED (4)'); },
        async showLeaderboard() { throw new Error('SIGN_IN_REQUIRED (4)'); },
      } } };`,
  // 3) Her şey yerinde.
  'çalışıyor': `
    window.Capacitor = { isNativePlatform: () => true, Plugins: { AdMob: {},
      PlayGames: {
        async signIn() { return { signedIn: true }; },
        async submitScore() { return { results: [] }; },
        async showLeaderboard() { },
      } } };`,
};

async function open(init) {
  const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
  pg.on('pageerror', e => { console.log('  SAYFA HATASI: ' + e); fails.push(String(e)); });
  if (init) await pg.addInitScript(init);
  await pg.goto('http://localhost:8222/', { waitUntil: 'load' });
  await pg.waitForFunction(() => window.fruitHoleDiag, null, { timeout: 30000 });
  await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });
  await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 20000 });
  await pg.waitForTimeout(700);
  return pg;
}

const seen = {};

for (const [ad, init] of Object.entries(CASES)) {
  console.log(`\n--- ${ad} ---`);
  const pg = await open(init);

  // Yazı gerçekten dokunulabilir mi? Asıl risk `pointer-events: none` —
  // öyleyse parmak yazıya hiç değmiyor ve ekranın tek giriş yolu kapanıyor.
  // Bunu tıklayarak değil, o noktada en üstte ne olduğunu sorarak ölçüyoruz.
  check(await pg.evaluate(() => {
    const e = document.getElementById('verTag');
    const b = e.getBoundingClientRect();
    if (!b.width || !b.height) return false;
    return document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2) === e;
  }), 'sürüm yazısı dokunmayı alıyor');

  // Beş dokunuş.
  //
  // Bunlar sayfanın içinden gönderiliyor, Playwright'ın click'iyle değil.
  // Sebebi: sayaç ardışık dokunuşlar arasında 1.2 saniyeden fazla boşluk
  // olursa sıfırlanıyor, ve konteyner yüklüyken (ölçüldü: load 6.7, arka
  // planda klip üretimi) Playwright'ın tek bir tıklaması o süreyi aşabiliyor.
  // O zaman test, ölçmek istediği şeyi değil makinenin o anki yükünü ölçüyor.
  // Pencerenin kendisi ayrı bir bölümde, kendi zamanıyla ölçülüyor.
  await pg.evaluate(() => {
    const e = document.getElementById('verTag');
    for (let i = 0; i < 5; i++) e.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await pg.waitForTimeout(250);
  const shown = await pg.evaluate(() => document.getElementById('diag').classList.contains('show'));
  check(shown, 'beş dokunuş ekranı açtı');
  if (!shown) { await pg.close(); continue; }

  const txt = await pg.evaluate(() => document.getElementById('diagBody').innerText);
  seen[ad] = txt;
  console.log(txt.split('\n').map(l => '    ' + l).join('\n'));

  if (ad === 'eklenti yok') {
    check(/PlayGames\s*hayır/.test(txt), 'PlayGames yok diyor');
    check(/eklentisi yok/.test(txt), 'sebebi "eklenti yok" olarak yazıyor');
  }
  if (ad === 'giriş reddedildi') {
    check(/PlayGames\s*evet/.test(txt), 'PlayGames var diyor');
    check(/giriş\s*hayır/.test(txt), 'giriş yapılmadı diyor');
    // Asıl kazanç bu satır: eklenti varken girişin neden düştüğünü yazıyor.
    check(/SIGN_IN_REQUIRED/.test(txt), 'Google\'ın hata metnini aynen gösteriyor');
  }
  if (ad === 'çalışıyor') {
    check(/🏆 düğme\s*evet/.test(txt), '🏆 düğmesi açık diyor');
    check(!/sebep/.test(txt), 'sebep satırı yok');
  }

  // Kapatma çalışmazsa ekran oyunun üstünde kilitli kalır.
  await pg.click('#diagClose');
  await pg.waitForTimeout(200);
  check(await pg.evaluate(() => !document.getElementById('diag').classList.contains('show')),
    'kapat düğmesi kapatıyor');
  await pg.close();
}

// Üçü birbirinden gerçekten farklı mı? Aynı metni veren iki durum varsa
// ekran hiçbir şey ayırt etmiyor demektir.
console.log('\n--- üçü ayırt ediliyor mu ---');
const vals = Object.entries(seen);
for (let i = 0; i < vals.length; i++)
  for (let j = i + 1; j < vals.length; j++)
    check(vals[i][1] !== vals[j][1], `"${vals[i][0]}" ile "${vals[j][0]}" farklı okunuyor`);

// Tarayıcıda da açılmalı: burada native yok, yani her şey "hayır" — ve
// ekranın kendisi yine de patlamadan çizilmeli.
console.log('\n--- tarayıcı (native yok) ---');
{
  const pg = await open(null);
  await pg.evaluate(() => {
    const e = document.getElementById('verTag');
    for (let i = 0; i < 5; i++) e.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await pg.waitForTimeout(250);
  const txt = await pg.evaluate(() => document.getElementById('diagBody').innerText);
  check(/native\s*hayır/.test(txt), 'native değil diyor');
  // Burada okunan www-fruithole/, yani build-www.mjs APP_VERSION'ı çoktan
  // app-version.json'daki değerle değiştirmiş durumda. 'dev' yalnızca
  // fruithole/index.html doğrudan açılınca görünüyor — bu satır ilk yazıldığında
  // onu bekliyordu ve testin kendisi yanlıştı.
  check(/sürüm\s*\d+\.\d+/.test(txt), 'sürüm damgalanmış hâliyle yazıyor',
    txt.split('\n').slice(0, 2).join(' '));
  await pg.close();
}

// Dokunuşların arası açılırsa sayaç sıfırlanmalı — yoksa gün içinde dağınık
// beş dokunuş birikip ekranı kendiliğinden açardı.
console.log('\n--- dağınık dokunuş ---');
{
  const pg = await open(null);
  // Burada boşluk kasıtlı, o yüzden sayfanın kendi saatiyle ölçülüyor:
  // dördü aralıklı, beşincisi hemen. Sayaç sıfırlanmazsa ekran açılırdı.
  await pg.evaluate(async () => {
    const e = document.getElementById('verTag');
    const bekle = ms => new Promise(r => setTimeout(r, ms));
    for (let i = 0; i < 4; i++) {
      e.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await bekle(1500);
    }
    e.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await pg.waitForTimeout(250);
  check(await pg.evaluate(() => !document.getElementById('diag').classList.contains('show')),
    'arası açık beş dokunuş açmıyor');
  await pg.close();
}

// Oyunun bir yeri bozukken ekran yine açılıyor mu?
//
// Bu ekranın açıldığı an, bir şeyin bozulduğu an — ve tam orada
// çalışmıyordu. `diagText()` tek parçaydı: okuduğu şeylerden biri
// patlayınca `body.innerHTML` hiç yazılmıyor, `show` sınıfı hiç
// eklenmiyor ve **ekran açılmıyordu**. Oyuncu beş kez dokunup hiçbir
// şey olmadığını görüyor; bizim tarafta ise "teşhis ekranı var"
// sanıldığı için bakılmıyor. İki oyunda daha aynı yapı yazılırken
// fark edildi ve üçünde birden düzeltildi: her bölüm kendi içinde
// korunuyor, patlayan bölüm kırmızı bir satır oluyor.
//
// Kapı iki şey istiyor: ekran açılacak, ve kalan bölümler yazılmaya
// devam edecek. Birincisi olmadan ikincisi ölçülemiyor; ikincisi
// olmadan ekran açılıyor ama boş.
console.log('\n--- oyun bozukken ---');
{
  const pg = await open(null);
  // Bozulacak şey dışarıdan erişilebilir olmalı ve oyunun okuduğu
  // şeylerden biri olmalı: ekranın okuduğu değerler modül içinde, yani
  // `window` üstünden bozulamıyor. `Object.keys` ikisini birden
  // sağlıyor — başlık (eklenti listesi) ve MAĞAZA (sahip olunanlar) onu
  // çağırıyor, kalan dört bölüm çağırmıyor. Yama beş tık boyunca duruyor
  // ve hemen geri alınıyor; metin tık işleyicisinin içinde, aynı karede
  // üretildiği için araya başka bir şey giremiyor.
  const d = await pg.evaluate(() => {
    document.getElementById('diagBody').innerHTML = '';
    const asil = Object.keys;
    Object.keys = () => { throw new Error('TANIDENEME bozuk'); };
    try {
      const e = document.getElementById('verTag');
      for (let i = 0; i < 5; i++) e.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    } finally { Object.keys = asil; }
    return {
      acik: document.getElementById('diag').classList.contains('show'),
      metin: document.getElementById('diagBody').innerText,
    };
  });
  check(d.acik, 'sonda bozukken ekran yine açılıyor');
  const bolumler = ['LİDERLİK', 'MAĞAZA', 'BİLDİRİM', 'EKRAN', 'KAYIT', 'REKLAM'];
  const yazan = bolumler.filter(b => d.metin.includes(b));
  console.log(`    yazılan bölümler: ${yazan.join(', ') || '(hiçbiri)'}`);
  check(yazan.length === bolumler.length, 'bozukken altı bölüm de yazılıyor',
    `${yazan.length}/${bolumler.length}`);
  check(/okunamadı/.test(d.metin), 'bozuk bölüm sebebini söylüyor');
  // Başlık yalnızca `bolum` tarafından basılıyor, yani bölüm adlarının
  // görünmesi içeriğin yazıldığını söylemiyor. Asıl kanıt, bozulan
  // bölümden **sonra** gelen gerçek satırlar: koruma olmasaydı metin
  // orada kesilirdi.
  //
  // Seçilen iki satır `Object.keys`e dokunmayan bölümlerden: BİLDİRİM
  // ve REKLAM. Bu satır bir ara KAYIT'tan okuyordu ve KAYIT'a anahtar
  // taraması eklenince düştü — haklı olarak, çünkü o bölüm de artık
  // `Object.keys` çağırıyor. Kapının sorduğu şey "şu bölüm sağlam"
  // değil, "bozulmayan bölümler yazılmaya devam ediyor".
  check(/izin/.test(d.metin) && /AdMob/.test(d.metin),
    'bozuk bölümden sonrakiler yazılmaya devam ediyor',
    `izin ${/izin/.test(d.metin)} · AdMob ${/AdMob/.test(d.metin)}`);
  await pg.close();
}

// KAYIT bölümü: bozuk anahtarı adıyla söylüyor, son yazmayı tutuyor.
//
// Üç satırın üçü de "ilerlemem gitti" cümlesinin arkasındaki üç ayrı
// arızayı ayırmak için var ve üçü aynı cümleyle bildiriliyor: anahtar
// bozuldu mu (oyun açılıyor ama o alan varsayılana döndü), yazma
// patlıyor mu (depo dolu), yoksa yazıldı da sonradan mı kayboldu
// (hata yok ama son yazma çok önce).
console.log('\n--- kayıt satırları ---');
{
  const pg = await open(null);
  const ac = () => pg.evaluate(() => {
    document.getElementById('diagBody').innerHTML = '';
    const e = document.getElementById('verTag');
    for (let i = 0; i < 5; i++) e.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return [...document.querySelectorAll('#diagBody .row')]
      .map(x => x.querySelector('b').textContent + '=' + x.querySelector('span').textContent);
  });
  const satir = ad => (s) => (s.find(x => x.startsWith(ad + '=')) || '').slice(ad.length + 1);

  // Sağlam durumda: okunamayan yok, ve bir yazmadan sonra "son yazma"
  // doluyor. Oyun açılışta zaten yazıyor, yine de elle bir yazma
  // tetikleniyor ki satır boş kalmasın.
  await pg.evaluate(() => document.getElementById('menuSound').click());
  await pg.waitForTimeout(150);
  let s1 = await ac();
  const an1 = await pg.evaluate(() => window.fruitHoleYazma().an);
  console.log(`    anahtar=${satir('anahtar')(s1)} · okunamayan=${satir('okunamayan')(s1)}`);
  console.log(`    son yazma=${satir('son yazma')(s1)} · kanca ${an1}`);
  check(/\d+ tane/.test(satir('anahtar')(s1)), 'anahtar sayısı yazılıyor', satir('anahtar')(s1));
  check(satir('okunamayan')(s1) === 'yok', 'sağlam kayıtta okunamayan yok',
    satir('okunamayan')(s1));
  check(an1 > 0 && satir('son yazma')(s1).startsWith(new Date(an1).toTimeString().slice(0, 8)),
    'son yazma kancayla aynı anı söylüyor', `${satir('son yazma')(s1)} / ${an1}`);

  // Bozuk anahtar adıyla görünmeli.
  await pg.evaluate(() => {
    document.getElementById('diagClose').click();
    localStorage.setItem('fruithole_stats', '{bozuk');
  });
  const s2 = await ac();
  console.log(`    bozukken okunamayan=${satir('okunamayan')(s2)}`);
  check(/fruithole_stats/.test(satir('okunamayan')(s2)), 'bozuk anahtar adıyla yazılıyor',
    satir('okunamayan')(s2));

  // Patlayan yazma "son yazma"yı ilerletmemeli: ilerletseydi satır tam
  // güvenilmesi gereken yerde yalan söylerdi.
  const an2 = await pg.evaluate(() => {
    document.getElementById('diagClose').click();
    localStorage.removeItem('fruithole_stats');
    window.fruitHoleYazmaBoz(true);
    document.getElementById('menuSound').click();
    return { an: window.fruitHoleYazma().an, hata: window.fruitHoleYazma().hata };
  });
  const s3 = await ac();
  console.log(`    bozuk yazmadan sonra: son yazma=${satir('son yazma')(s3)} · ` +
    `yazma hatası=${satir('yazma hatası')(s3)}`);
  check(an2.hata > 0, 'yazma bozuldu', `${an2.hata} hata`);
  check(an2.an === an1, 'patlayan yazma son yazma anını ilerletmiyor', `${an1} → ${an2.an}`);
  await pg.evaluate(() => window.fruitHoleYazmaBoz(false));
  await pg.close();
}

console.log(fails.length ? `\n${fails.length} kontrol düştü` : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length ? 1 : 0);
