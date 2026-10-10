// Mağaza metinleri Play'in karakter sınırlarına sığıyor mu?
//
//   node scratchpad/holelisting.mjs
//
// Bu dosya, hazır metinlerin sığdığı hiç ölçülmediği için yazıldı. Tam
// açıklama 4544 karaktere çıkmıştı — sınır 4000. Yani dosyada duran metin
// Play Console'a yapıştırılamıyordu ve bunu ancak yapıştırmaya çalışırken
// görebilirdik. Sınır aşıldığında Play alanı sessizce kesmiyor, kaydetmiyor.
//
// Ölçüm, başlıktaki "(≤ N chars)" ifadesinden okunuyor — yani yeni bir alan
// eklendiğinde burada bir şey değiştirmek gerekmiyor, başlığa sınırı yazmak
// yetiyor.
//
// Karakter sayımı: Play, alanların altındaki sayacı UTF-16 kod birimiyle
// tutuyor, JavaScript'in `.length`'i de öyle. Yani emoji ikisinde de 2
// sayılıyor ve buradaki sayı Console'da göreceğinle aynı.

import { readFileSync, readdirSync } from 'fs';

const DIR = '/home/user/holegame/fruithole/store';
const files = readdirSync(DIR).filter(f => f.startsWith('listing-') && f.endsWith('.md'));

const fails = [];
const check = (ok, what, saw) => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what}${saw === undefined ? '' : `   ${saw}`}`);
  if (!ok) fails.push(what);
};

if (!files.length) { console.log('listing-*.md bulunamadı'); process.exit(2); }

for (const f of files) {
  console.log(`\n${f}`);
  const text = readFileSync(`${DIR}/${f}`, 'utf8');
  const lines = text.split('\n');

  let found = 0;
  for (let i = 0; i < lines.length; i++) {
    // "## App name (≤ 30 chars)" ya da "English (172 chars):" gibi bir başlık,
    // ardından gelen ilk ``` bloğunun sınırını belirliyor.
    const m = lines[i].match(/^##\s+(.+?)\s*\(≤\s*(\d+)\s*chars?/);
    if (!m) continue;
    const [, name, lim] = m;
    const limit = Number(lim);

    // Bu başlıktan sonraki ``` bloklarının hepsi aynı sınıra tabi: "What's
    // new" altında dil başına bir blok var ve sınır her biri için ayrı.
    const end = lines.findIndex((l, n) => n > i && /^##\s/.test(l));
    const stop = end === -1 ? lines.length : end;
    let n = i + 1;
    while (n < stop) {
      if (lines[n].trim() !== '```') { n++; continue; }
      const close = lines.findIndex((l, k) => k > n && l.trim() === '```');
      if (close === -1 || close > stop) break;
      const body = lines.slice(n + 1, close).join('\n');
      const len = body.length;
      // Blok başlamadan önceki en yakın etiket satırı ("English (172 chars):")
      // varsa adı onunla söyle — hangi dilin düştüğü belli olsun.
      const label = (lines[n - 1] || '').match(/^(\S[^(]*?)\s*\(\d+\s*chars?\)?:?\s*$/);
      const who = label ? `${name} · ${label[1]}` : name;
      check(len <= limit, `${who} sığıyor`, `${len} / ${limit}`);
      found++;
      n = close + 1;
    }
  }
  if (!found) check(false, 'sınırlı hiçbir alan bulunamadı — başlık biçimi değişmiş olabilir');
}

console.log(fails.length ? `\n${fails.length} alan sığmıyor` : '\nhepsi sığıyor');
process.exit(fails.length ? 1 : 0);
