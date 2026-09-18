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
  // Bir tema tek düzende kalırsa ilk tur boyunca bir kez görünüyor; bu
  // kabul edilebilir ama üç düzen bir temayı öne çıkarıyor ve öteki
  // temaların yerini alıyor.
  const sisen = gercek.filter(t => t.patterns.length > 2);
  check(sisen.length === 0, 'hiçbir tema ikiden fazla düzen tutmuyor',
    sisen.map(t => `${t.name}:${t.patterns.length}`).join(' ') || '-');
  check(gercek.every(t => t.props && t.props.length >= 4),
    'her temanın en az dört nesnesi var',
    gercek.map(t => `${t.name}:${(t.props || []).length}`).join(' '));
}

console.log('\n3. her tema gerçekten çiziliyor');
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

console.log('\n4. dev-only nesneler hücre boyunda çıkmıyor');
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

console.log('\n5. resimler');
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
