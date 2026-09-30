// Tahtanın sağlığı: yazılmış ama ölçülmemiş kurallar.
//
//   node build-www.mjs && node scratchpad/holekural.mjs
//
// Bu dosya bir hata sınıfının peşinde, tek bir özelliğin değil.
//
// `placeBombs` içinde uzun uzun savunulmuş bir kural vardı — bomba kulenin
// tepesinde durmalı, yoksa kuleyi almak bombayı almak demek — ve onu
// uygulayan satır çalışmıyordu. Seçim `f.mesh.position.y`'ye bakıyordu ama o
// fonksiyon nesneler kurulmadan önce çalışıyor, yani her karşılaştırma
// `0 > 0` idi. Ölçüldüğünde bombaların **%67'si** bir kulenin içindeydi.
//
// Kod çalışıyordu. Testler geçiyordu. Yanlış yalnızca tahtaya bakan
// oyuncuda görünüyordu, ve o da bunu hata diye bildirmedi — oyunun öyle
// olduğunu sandı. Bulunmasının tek sebebi Kaan'ın ekran görüntüsü attığı.
//
// Buradaki ölçüler o sınıfın geri kalanı için: her biri "böyle olmamalı"
// diye bir yerde yazılmış, hiçbirinin sayısı alınmamış. Hepsi sıfır olmalı
// ve sıfır olmadığında oyuncu **görüyor**:
//
//   - üst üste binen parça : ekranda tek şey var, iki kez yeniyor
//   - altı boş meyve       : havada duran bir parça
//   - tahta dışına taşan   : ulaşılamayan meyve, sessizce bitirilemez bölüm
//   - iç içe katı engel    : ekranda tek şey, kuralları iki
//   - doğuşta katı         : ilk hamlede görünmeyen bir duvar
//
// Tarama bütün bölümleri **birkaç tohumla** geziyor, çünkü yerleştirmenin
// çoğu rastgele ve tek tohum şanslı bir tahta demek — `holebalance`
// bölüm başına tek tohumdan üç tohuma geçtiğinde yanlış bir sayı tam
// böyle görünmüştü.

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-fruithole' + p); } catch {}
  if (b) {
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } else { r.writeHead(404); r.end('no'); }
}).listen(8331);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('http://localhost:8331/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.fruitHoleSanity === 'function', { timeout: 25000 });

const fails = [];
const check = (ok, ne, ek = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ne}${ek ? '   ' + ek : ''}`);
  if (!ok) fails.push(`${ne} ${ek}`);
};

const SON = 48, TOHUM = 3;
const topla = { parca: 0, ustUste: 0, bosluk: 0, disarida: 0, katiCakisma: 0,
                dogusKatisi: 0, ulasilmaz: 0 };
const kotu = { ustUste: [], bosluk: [], disarida: [], katiCakisma: [],
               dogusKatisi: [], ulasilmaz: [] };

for (let n = 1; n <= SON; n++) {
  for (let t = 0; t < TOHUM; t++) {
    const o = await pg.evaluate(([l, tohum]) => {
      window.fruitHoleSeedField(3300 + tohum * 911 + l);
      const p = window.fruitHoleProbe(l);
      window.fruitHoleStartLevel();
      const s = window.fruitHoleSanity();
      const u = window.fruitHoleReach(null);
      window.fruitHoleUnseedField();
      return { kind: p.kind, ...s, ulasilmaz: u.ulasilmaz, yerler: u.yerler };
    }, [n, t]);
    // Bulmaca tahtası iki ölçünün dışında, ve sebebi ölçünün kendisinde.
    //
    // Orada kayalar **duvar**: bitişik dizilmeleri tasarımın kendisi, ve
    // duvarlar odaları böldüğü için biri deliğin doğduğu odanın kenarından
    // geçiyor. İkisi de "rastgele yerleştirme bir şeyi bozdu mu" sorusunu
    // soruyor; bulmacada rastgele yerleştirme yok. Kapı genişlikleri ayrı
    // ölçülüyor — `holepuzzle.mjs`, ve oradaki soru bu değil: kapı şu anki
    // delikten geçiyor mu.
    const bulmaca = o.kind === 'bulmaca';
    for (const k of Object.keys(topla)) {
      if (bulmaca && (k === 'katiCakisma' || k === 'dogusKatisi')) continue;
      topla[k] += o[k];
    }
    for (const k of Object.keys(kotu)) {
      if (bulmaca && (k === 'katiCakisma' || k === 'dogusKatisi')) continue;
      if (o[k]) kotu[k].push(`${n}(${o.kind}):${o[k]}`);
    }
  }
}

console.log(`\n${SON} bölüm × ${TOHUM} tohum · ${topla.parca} parça tarandı\n`);
check(topla.parca > 0, 'taranacak parça var', String(topla.parca));
check(!topla.ustUste, 'hiçbir parça bir başkasının tam üstünde değil',
  kotu.ustUste.slice(0, 8).join(' '));
check(!topla.bosluk, 'hiçbir kulede boşluk yok',
  kotu.bosluk.slice(0, 8).join(' '));
check(!topla.disarida, 'hiçbir parça tahtanın dışında değil',
  kotu.disarida.slice(0, 8).join(' '));
check(!topla.katiCakisma, 'katı engeller iç içe geçmiyor',
  kotu.katiCakisma.slice(0, 8).join(' '));
check(!topla.dogusKatisi, 'deliğin doğduğu yerde katı engel yok',
  kotu.dogusKatisi.slice(0, 8).join(' '));

// Ulaşılabilirlik: taramanın en sert sorusu ve tek gerçek hatayı bu buldu.
//
// `placeRocks` bunu **yerel** kurallarla koruyor — iki kaya arası en geniş
// ağızdan geniş, kenarla kaya arası da öyle — ve `holerock.mjs` ikisini de
// ölçüyor. Ama ölçtükleri şey kuralın kendisi, korumak istediği şey değil.
// Doğrudan sorulunca, deliğin doğduğu yerden tahtayı tarayınca, her tahtada
// bir parça ulaşılamaz çıktı.
//
// Hepsinin dibinde bir mancınık vardı. Mancınık kendi zeminini temizliyor
// ama `f.giant`ı atlıyor — ve atlaması doğru, dev bir makine için silinmez.
// Silinmeyince de mancınığın içinde kalıyordu ve mancınık katı: o dev bir
// daha yutulamıyordu. Artık mancınık devin dibine kurulmuyor.
check(!topla.ulasilmaz, 'her parçaya, başlangıç deliğiyle, ulaşılabiliyor',
  kotu.ulasilmaz.slice(0, 8).join(' '));

console.log('\nsayfa hataları: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
