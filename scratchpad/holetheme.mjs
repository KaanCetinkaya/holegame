// Temalar ve nesneler birbirine gerçekten bağlı mı?
//
//   node build-www.mjs && node scratchpad/holetheme.mjs
//
// Bu dosya, Harvest teması eklenirken yazıldı — ama ölçtüğü şey tek bir tema
// değil, bütün tablonun tutarlılığı. Buradaki hataların hepsi **sessiz**:
// oyun çalışmaya devam ediyor, sadece o içerik hiç ekrana gelmiyor.
//
//   - Bir temanın nesne listesinde olmayan bir kimlik varsa o nesne hiç
//     çıkmıyor ve hata da vermiyor.
//   - Bir tema hiçbir düzende kullanılmıyorsa ilk turda hiç görünmüyor.
//   - Bir nesne hiçbir temaya ait değilse yalnızca "Everything" bölümlerinde
//     çıkıyor, yani neredeyse hiç.
//   - Bir temanın zemini tanımlı değilse zemin sessizce kumla çiziliyor.
//
// Dördü de yalnızca bütün tabloya birden bakınca görülüyor; tek tek bölüm
// açarak değil.

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync, mkdirSync } from 'fs';

mkdirSync('/tmp/theme', { recursive: true });

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-fruithole' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8263);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

const fails = [];
const check = (ok, what, saw) => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what}${saw === undefined ? '' : `   ${saw}`}`);
  if (!ok) fails.push(what);
};

const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => { console.log('  SAYFA HATASI: ' + e); fails.push(String(e)); });
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8263/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleThemeTable, { timeout: 40000 });

const T = await pg.evaluate(() => window.fruitHoleThemeTable());

console.log('\n1. tablo tutarlı');
{
  const bilinmeyen = [];
  for (const t of T.themes) {
    if (!t.props) continue;
    for (const id of t.props) if (!T.props.includes(id)) bilinmeyen.push(`${t.id}/${id}`);
  }
  check(bilinmeyen.length === 0, 'her tema yalnızca var olan nesneleri istiyor',
    bilinmeyen.join(' ') || '-');

  // "Everything" hariç her tema en az bir düzende kullanılmalı, yoksa ilk
  // turda hiç görünmüyor ve ancak 19. bölümden sonraki döngüde çıkıyor.
  const kullanilmayan = T.themes.filter(t => t.id !== 'mixed' && t.patterns.length === 0);
  check(kullanilmayan.length === 0, 'her tema ilk turda en az bir bölümde çıkıyor',
    kullanilmayan.map(t => t.id).join(' ') || '-');

  const sahipsiz = T.props.filter(id => !T.themes.some(t => t.props && t.props.includes(id)));
  check(sahipsiz.length === 0, 'her nesnenin bir teması var', sahipsiz.join(' ') || '-');

  const zeminsiz = T.themes.filter(t => !T.grounds.includes(t.ground));
  check(zeminsiz.length === 0, 'her temanın zemini tanımlı',
    zeminsiz.map(t => `${t.id}:${t.ground}`).join(' ') || '-');

  // Aynı zemin iki temada kullanılabiliyor (mixed, beach'inkini alıyor) ama
  // ikiden fazlası temaların birbirine benzemeye başladığı yer.
  const sayim = {};
  T.themes.forEach(t => { sayim[t.ground] = (sayim[t.ground] || 0) + 1; });
  const cok = Object.entries(sayim).filter(([, n]) => n > 2);
  check(cok.length === 0, 'hiçbir zemin ikiden fazla temada kullanılmıyor',
    cok.map(([k, n]) => `${k}:${n}`).join(' ') || '-');
}

console.log('\n2. dağılım');
{
  const gercek = T.themes.filter(t => t.id !== 'mixed');
  console.log('    ' + gercek.map(t => `${t.name}(${t.patterns.length})`).join(' '));
  // Denge, sabit bir tavanla değil aradaki farkla ölçülüyor.
  //
  // İlk yazışımda kural "hiçbir tema ikiden fazla düzen tutmasın"dı ve o,
  // 19 düzen ile 10 temanın tesadüfüydü. 24 düzende on temanın hepsi ikide
  // kalamaz — dördü zorunlu olarak üçe çıkıyor. Sayıya bağlı bir eşik,
  // içerik büyüdüğünde anlamını kaybediyor; asıl kural şu: hiçbir yer
  // ötekilerden bir düzen fazla görünmesin.
  const say = gercek.map(t => t.patterns.length);
  const enCok = Math.max(...say), enAz = Math.min(...say);
  check(enCok - enAz <= 1, 'temalar arasındaki düzen farkı en fazla bir',
    `${enAz}-${enCok}`);
  check(gercek.every(t => t.props && t.props.length >= 4),
    'her temanın en az dört nesnesi var',
    gercek.map(t => `${t.name}:${(t.props || []).length}`).join(' '));
}

console.log('\n3. bölüm sırası');
{
  // Aynı yerin arka arkaya iki bölümde çıkmaması, düzen sırasının yazılı
  // kuralı — `LEVEL_ORDER`'ın üstündeki yorum bunu söylüyor ama hiçbir şey
  // ölçmüyordu. Araya beş düzen eklenince sırayı elle kontrol etmek gerekti.
  const th = T.patternThemes;
  const ardarda = [];
  for (let i = 0; i < th.length; i++) {
    const j = (i + 1) % th.length;
    if (th[i] === th[j]) ardarda.push(`${T.order[i]}>${T.order[j]}`);
  }
  check(ardarda.length === 0, 'aynı yer arka arkaya iki bölümde çıkmıyor',
    ardarda.join(' ') || '-');

  // İki düzen aynı ikonu taşıyamaz: bölüm haritasında ikisi tek bir şeye
  // benziyor. Ladder eklenirken 🪜 zaten Stairs'teydi.
  const sayim = {};
  T.icons.forEach(i => { sayim[i] = (sayim[i] || 0) + 1; });
  const ayni = Object.entries(sayim).filter(([, n]) => n > 1);
  check(ayni.length === 0, 'her düzenin kendi ikonu var',
    ayni.map(([k, n]) => `${k}:${n}`).join(' ') || '-');

  check(T.order.length === new Set(T.order).size, 'düzen adları benzersiz');
}

console.log('\n4. her tema gerçekten çiziliyor');
{
  // Sırayla bütün bölümler açılıyor ve her temanın en az bir kez, kendi
  // zeminiyle ve yalnızca kendi nesneleriyle çizildiği görülüyor.
  const gorulen = {};
  const kacak = [];
  for (let n = 1; n <= T.patternCount; n++) {
    const r = await pg.evaluate(lvl => {
      window.fruitHoleSeedField(4000 + lvl);
      window.fruitHoleProbe(lvl);
      const t = window.fruitHoleTheme();
      window.fruitHoleUnseedField();
      return { ...t, level: lvl, pattern: window.fruitHoleLevelName() };
    }, n);
    gorulen[r.theme] = r;
    if (r.stray.length) kacak.push(`${r.pattern}:${r.stray.join(',')}`);
  }
  const beklenen = T.themes.filter(t => t.patterns.length).map(t => t.name);
  const eksik = beklenen.filter(name => !gorulen[name]);
  check(eksik.length === 0, 'ilk turda her tema bir kez çiziliyor', eksik.join(' ') || '-');
  check(kacak.length === 0, 'hiçbir bölümde başka temanın nesnesi yok',
    kacak.join(' ') || '-');

  for (const t of T.themes) {
    if (!t.patterns.length) continue;
    const r = gorulen[t.name];
    if (!r) continue;
    check(r.ground === t.ground, `${t.name}: zemin doğru`, `${r.ground}`);
  }
}

console.log('\n5. dev-only nesneler hücre boyunda çıkmıyor');
{
  // Dev olarak işaretlenen nesneler küçültülünce okunmaz hale geliyor —
  // korkuluk bir çubuğa, el arabası bir kutuya iniyor. Bütün ilk tur
  // taranıyor: küçük olarak yerleştirilmiş bir dev varsa yakalanır.
  const hatali = await pg.evaluate(async (giantOnly) => {
    const out = [];
    for (let lvl = 1; lvl <= 40; lvl++) {
      window.fruitHoleSeedField(7000 + lvl);
      window.fruitHoleProbe(lvl);
      const kucuk = window.fruitHoleSmallProps ? window.fruitHoleSmallProps() : null;
      if (kucuk) for (const id of kucuk) if (giantOnly.includes(id)) out.push(`${lvl}:${id}`);
      window.fruitHoleUnseedField();
    }
    return out;
  }, T.giantOnly);
  check(hatali.length === 0, 'dev nesneler yalnızca dev olarak çıkıyor',
    hatali.slice(0, 6).join(' ') || '-');
}

console.log('\n6. ışık');
{
  // Zemin değişiyordu, ışık değişmiyordu: on yer aynı sıcak öğle güneşiyle
  // aydınlanıyordu. Artık her temanın kendi ışığı var, ve burada ölçülen iki
  // şey:
  //
  //   1. Işık gerçekten temaya göre değişiyor mu — bir temanın ışığı sessizce
  //      varsayılana düşerse ekran görüntüsüne bakmadan fark edilmez.
  //   2. Hiçbir tema meyveyi okunmaz hale getirecek kadar karanlık değil.
  //      Işığı kısmak atmosfer üretiyor ama oynanabilirliği bozabilir, ve
  //      bu oyunda ekrandaki her şey meyvenin ayırt edilmesine bağlı.
  const isik = {};
  for (const t of T.themes) {
    if (!t.patterns.length) continue;
    const lvl = T.order.findIndex((_, i) => T.patternThemes[i] === t.id) + 1;
    if (!lvl) continue;
    isik[t.id] = await pg.evaluate(l => {
      window.fruitHoleSeedField(9000 + l);
      window.fruitHoleProbe(l);
      return window.fruitHoleLights();
    }, lvl);
  }
  const imza = o => `${o.hemi.sky}|${o.hemi.bounce}|${o.hemi.i}|${o.amb.c}|${o.amb.i}|${o.sun.c}|${o.sun.i}`;
  const imzalar = Object.entries(isik).map(([k, v]) => [k, imza(v)]);
  const benzersiz = new Set(imzalar.map(([, v]) => v));
  console.log('    ' + Object.entries(isik)
    .map(([k, v]) => `${k}:${v.sun.c}/${v.sun.i}`).join(' '));
  // Kumsal ve "Everything" aynı ışığı paylaşıyor (menü de o temayı kullanıyor),
  // ama geri kalanın hepsi ayrı olmalı.
  check(benzersiz.size >= Object.keys(isik).length - 1,
    'her yerin kendi ışığı var', `${benzersiz.size} / ${Object.keys(isik).length}`);

  // Toplam aydınlanma: yarımküre + ortam + anahtar. Çok düşükse tarla
  // okunmaz, çok yüksekse renkler yıkanır.
  const toplam = o => +(o.hemi.i + o.amb.i + o.sun.i).toFixed(2);
  const zayif = Object.entries(isik).filter(([, v]) => toplam(v) < 1.9);
  check(zayif.length === 0, 'hiçbir yer okunamayacak kadar karanlık değil',
    zayif.map(([k, v]) => `${k}:${toplam(v)}`).join(' ') ||
    Object.entries(isik).map(([k, v]) => `${k}:${toplam(v)}`).join(' '));

  // Anahtar ışık yükseltilmiyor: sert bir anahtar ışık her kürenin bir yanını
  // gölgeye atıyor ve bu boyutta çamur gibi okunuyor. Tek istisna Orbit —
  // uzayda saçılma yok ve gölgenin sert olması orada yerin kendisi.
  const sert = Object.entries(isik).filter(([k, v]) => v.sun.i > 0.8 && k !== 'space');
  check(sert.length === 0, 'Orbit dışında anahtar ışık sertleştirilmemiş',
    sert.map(([k, v]) => `${k}:${v.sun.i}`).join(' ') || '-');
}

console.log('\n7. resimler');
{
  // Karar gözle veriliyor: bir zeminin ötekinden ayrılıp ayrılmadığı
  // ölçülemiyor. Her temadan bir kare.
  for (const t of T.themes) {
    if (!t.patterns.length) continue;
    const lvl = await pg.evaluate(a => {
      for (let n = 1; n <= 40; n++) {
        window.fruitHoleProbe(n);
        if (window.fruitHoleTheme().theme === a) return n;
      }
      return 0;
    }, t.name);
    if (!lvl) continue;
    await pg.evaluate(l => { window.fruitHoleSeedField(9000 + l); window.fruitHoleProbe(l); }, lvl);
    await pg.evaluate(() => {
      for (const s of document.querySelectorAll('.screen')) s.classList.remove('show');
      for (const id of ['topbar', 'hint', 'combo', 'boosterBar', 'hud'])
        { const e = document.getElementById(id); if (e) e.style.display = 'none'; }
    });
    await pg.waitForTimeout(500);
    await pg.screenshot({ path: `/tmp/theme/${t.id}.png` });
  }
  console.log('    /tmp/theme/');
}

console.log(fails.length ? `\n${fails.length} kontrol düştü` : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length ? 1 : 0);
