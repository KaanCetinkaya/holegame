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
import { readdirSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { spawnSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
// Her betiğin tam çıktısı bir dosyaya yazılıyor.
//
// Özet yalnızca FAIL satırlarını tutuyordu ve bir ölçüm düştüğünde geriye
// bakılacak hiçbir şey kalmıyordu: `holemayin` bir toplu koşuda düştü,
// tablosu gitti, ve neden düştüğünü anlamak için yirmi dakikalık betiği
// baştan koşturmak gerekti — düşen hâliyle değil, aradan geçen
// değişikliklerle birlikte, yani ölçtüğü şey artık aynı değildi.
//
// Klasör her koşuda sıfırlanıyor: eski bir koşunun çıktısı yeni koşunun
// çıktısı sanılırsa, saklamak hiç saklamamaktan kötü.
const CIKTI = join(HERE, 'ciktilar');
try { rmSync(CIKTI, { recursive: true, force: true }); } catch {}
mkdirSync(CIKTI, { recursive: true });

// Ölçüm değil, üretim: mağaza görselleri, klipler, ve **bakılan** testler.
// Çalıştırılırsa dakikalar harcayıp dosya yazıyorlar ve hiçbir şey
// ölçmüyorlar.
//
// Son beşi bu listeye sonradan eklendi ve sebebi tek satırla: hiçbirinde
// bir `check` yok. Yani takımda "OK" yazıyorlar ve o OK bir şey
// söylemiyor — sayfa açıldı, görüntü alındı, çıkış kodu sıfır. Bir şey
// iddia etmeyen bir satırın geçmesi, geçmek değil.
//
// İkinci bedeli süre: `holesheet` otuz dört kareyi tek tek açıp ffmpeg ile
// diziyor ve toplu koşuda yarım saati geçti; `holekare` ile `holefirst`
// ekran görüntüsü alıyor. Tam takımın koşturulabilir olması, içinde ölçüm
// olmayan şeyin bulunmamasına bağlı.
//
// Hâlâ elle koşturuluyorlar ve işleri o: `node scratchpad/holesheet.mjs`
// bütün düzenleri tek sayfaya diziyor, Kaan "şu bölüm yamuk duruyor"
// dediğinde bakılan şey o.
// `tycoon` … `tycoon6`: Motor Works'ün denge **denemeleri**. README'nin
// "Denge — üç deneme" bölümünün ham çıktısı, ve altısında tek bir iddia
// yok: tablo basıp çıkış kodu sıfır dönüyorlar. Takımda "OK" yazdıkları
// sürece korudukları bir şey varmış gibi görünüyorlardı — oysa maliyet
// eğrisi bozulsa altısı da yine OK yazardı. O iddiayı `tydenge.mjs`
// kapıya çevirdi; bunlar elle koşturulacak denemeler olarak duruyor
// (`tycoon2` tek başına 57 saniye).
const URETEN = ['tyshots', 'tyfeature', 'slshots', 'slframe', 'slblade',
                'holeshot', 'kosu',
                'holesheet', 'holekare', 'holefirst', 'holesecim', 'holediagbtn',
                'tycoon', 'tycoon2', 'tycoon3', 'tycoon4', 'tycoon5', 'tycoon6'];

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
  writeFileSync(join(CIKTI, ad + '.txt'),
    `# ${ad} · ${sn}sn · çıkış ${r.status}\n\n${r.stdout || ''}` +
    (r.stderr && r.stderr.trim() ? `\n--- stderr ---\n${r.stderr}` : ''));
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
console.log(`her betiğin tam çıktısı: scratchpad/ciktilar/<ad>.txt`);
process.exitCode = dusen.length ? 1 : 0;
