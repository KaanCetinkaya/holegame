// Bütün ölçümleri sırayla koştur ve tek bir özet yaz.
//
//   node scratchpad/kosu.mjs            # hepsi
//   node scratchpad/kosu.mjs ty         # yalnızca Motor Works
//   node scratchpad/kosu.mjs sl slice   # Slice Rush
//
// Neden var: takımı koşturmanın tek yolu elle yazılan bir kabuk
// döngüsüydü, ve o döngü Kaan'ın makinesinde çalışmıyor — orası
// PowerShell, `for f in ...; do` orada bir şey ifade etmiyor. Yani
// ölçümleri yazan kişi onları koşturabiliyordu, oyunu derleyen kişi
// koşturamıyordu.
//
// Görsel üreten betikler listede yok: ölçüm değiller, dosya yazıyorlar.
import { readdirSync } from 'fs';
import { spawnSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

// Ölçüm değil, üretim: mağaza görselleri ve klipler. Çalıştırılırsa
// dakikalar harcayıp dosya yazıyorlar ve hiçbir şey ölçmüyorlar.
const URETEN = ['tyshots', 'tyfeature', 'slshots', 'slframe', 'slblade',
                'holeshot', 'kosu'];

// Önek verilmezse **yalnızca geliştirilen iki oyun**: Motor Works ve
// Slice Rush, yaklaşık yirmi dakika. Fruit Hole'un doksan üç betiği
// ayrı bir komutta (`npm run test:fruithole`) ve saatler sürüyor —
// `npm test` yazan birinin beklediği şey o değil.
const VARSAYILAN = ['ty', 'sl', 'slice'];
const arg = process.argv.slice(2).filter(a => !a.startsWith('-'));
const onek = arg.length ? arg : VARSAYILAN;
const hepsi = readdirSync(HERE)
  .filter(f => f.endsWith('.mjs'))
  .map(f => f.replace(/\.mjs$/, ''))
  .filter(n => !URETEN.includes(n))
  .filter(n => onek.some(p => n.startsWith(p)))
  .sort();

if (!hepsi.length) {
  console.error('eşleşen betik yok:', onek.join(' '));
  process.exit(1);
}

console.log(`${hepsi.length} ölçüm\n`);
const dusen = [];
const bas = Date.now();
for (const ad of hepsi) {
  const t = Date.now();
  const r = spawnSync(process.execPath, [join(HERE, ad + '.mjs')],
    { cwd: ROOT, encoding: 'utf8' });
  const sn = ((Date.now() - t) / 1000).toFixed(0);
  // Betikler "geçti"yi farklı söylüyor; tek doğru ölçü çıkış kodu.
  // Son satırı yalnızca okunur bir özet olsun diye yazıyoruz.
  const son = (r.stdout || '').trimEnd().split('\n').pop() || '';
  const iyi = r.status === 0;
  if (!iyi) dusen.push(ad);
  console.log(`  ${iyi ? 'OK  ' : 'DÜŞTÜ'} ${ad.padEnd(14)} ${sn.padStart(4)}sn  ${son.trim().slice(0, 52)}`);
  if (!iyi) {
    // Düşen betiğin çıktısı lazım, yoksa özet "bir şey bozuk" demekten
    // ibaret kalıyor.
    const satir = (r.stdout || '').trimEnd().split('\n');
    for (const l of satir.filter(l => /FAIL|HATA|Error/.test(l)).slice(0, 6))
      console.log(`        ${l.trim().slice(0, 90)}`);
    if (r.stderr && r.stderr.trim())
      console.log(`        ${r.stderr.trim().split('\n')[0].slice(0, 90)}`);
  }
}
const toplam = ((Date.now() - bas) / 1000 / 60).toFixed(1);
console.log(`\n${hepsi.length - dusen.length}/${hepsi.length} geçti · ${toplam} dakika`);
if (dusen.length) console.log('düşen: ' + dusen.join(', '));
process.exitCode = dusen.length ? 1 : 0;
