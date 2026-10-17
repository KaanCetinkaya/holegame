// Mağazaya yapıştırılacak metinleri ayrı dosyalara çıkarır.
//
//   node fruithole/store-paste.mjs
//   -> fruithole/store/paste/*.txt
//
// `listing-en.md` 29 bin karakter, çünkü içinde metinlerin yanında neden o
// metin olduğu da yazıyor — on beş sürümün notu, adın neden değiştiği, hangi
// sayımın neden kırpıldığı. O bilgi duruyor: bir cümlenin neden orada olduğu
// unutulursa cümle bir sonraki oturumda geri geliyor.
//
// Ama Play Console'un karşısında duran birinin istediği şey o değil: doğru
// bloğu bulup, üç ters tırnağı almadan, tam sınıra kadar kopyalamak. Elle
// yapıldığında iki şey oluyor — ya tırnaklar da kopyalanıyor ya da blok
// yanlış seçiliyor, ve ikisi de ancak mağaza sayfasında görünüyor.
//
// Çıkan dosyalar üretilmiş dosyalar: elle düzenlenmiyor, kaynağı hep
// `listing-en.md`. İkisi ayrı ayrı düzenlenebilseydi bir gün ayrışırlardı ve
// hangisinin doğru olduğu bilinemezdi.

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const KAYNAK = join(HERE, 'store', 'listing-en.md');
const OUT = join(HERE, 'store', 'paste');
mkdirSync(OUT, { recursive: true });

const lines = readFileSync(KAYNAK, 'utf8').split('\n');

// `## Başlık (≤ N chars)` -> altındaki ilk ``` bloğu.
const ISTENEN = [
  [/^##\s+App name/, 'app-name', 30],
  [/^##\s+Short description/, 'short-description', 80],
  [/^##\s+Full description/, 'full-description', 4000],
];

let hata = 0;
for (const [desen, ad, sinir] of ISTENEN) {
  const bas = lines.findIndex(l => desen.test(l));
  if (bas < 0) { console.log(`  YOK  ${ad} — başlık bulunamadı`); hata++; continue; }

  const ac = lines.findIndex((l, i) => i > bas && l.trim() === '```');
  const kapa = lines.findIndex((l, i) => i > ac && l.trim() === '```');
  if (ac < 0 || kapa < 0) { console.log(`  YOK  ${ad} — blok bulunamadı`); hata++; continue; }

  const metin = lines.slice(ac + 1, kapa).join('\n').trim();
  // Play sınırı UTF-16 kod birimiyle sayıyor, yani emoji iki karakter.
  const n = metin.length;
  writeFileSync(join(OUT, `${ad}.txt`), metin + '\n');
  const durum = n <= sinir ? 'OK  ' : 'UZUN';
  if (n > sinir) hata++;
  console.log(`  ${durum} ${ad}.txt   ${n}/${sinir}`);
}

console.log(`\n${OUT}`);
process.exit(hata ? 1 : 0);
