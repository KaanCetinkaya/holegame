// `tycoon/README.md` oyunla aynı şeyi mi anlatıyor?
//
// Bu depoda tekrar eden hata sınıflarından biri: **elle yazılmış bir
// sayı ya da liste, kod değişince yerinde kalıyor.** Belgede de aynısı
// oldu — "Tek anahtar: motorworks_save" yazıyordu, oysa üç yuva var;
// "Eksikler" başlığı altında "uygulama içi satın alma yok" yazıyordu,
// oysa üç ürün kodda duruyor; test listesi sekiz betik sayıyordu, oysa
// kırk bir tane var.
//
// Belgenin tamamı ölçülemez, ama bayatlayan kısmı hep aynı üç şey:
// betik listesi, test kancalarının adları, ve kayıt anahtarları. Üçü de
// burada.
//
// Ölçüm hiçbir tarayıcı açmıyor; saniyenin altında bitiyor.
import { readFileSync, readdirSync } from 'fs';

const KOK = '/home/user/holegame';
const belge = readFileSync(KOK + '/tycoon/README.md', 'utf8');
const oyun = readFileSync(KOK + '/tycoon/index.html', 'utf8');

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

console.log('\n1) Her ölçüm betiği belgede anılıyor');
// `tyshots` ve `tyfeature` ölçüm değil, mağaza görseli üretiyor.
const URETEN = ['tyshots', 'tyfeature'];
const betikler = readdirSync(KOK + '/scratchpad')
  .filter(f => /^ty.*\.mjs$/.test(f))
  .map(f => f.replace(/\.mjs$/, ''))
  .filter(n => !URETEN.includes(n));
const anilmayan = betikler.filter(n => !belge.includes(n));
console.log(`     ${betikler.length} betik · belgede olmayan ${anilmayan.length}`);
if (anilmayan.length) console.log(`     ${anilmayan.join(', ')}`);
ok(anilmayan.length === 0, 'listede eksik betik yok', anilmayan.join(', '));

// Ters yön: belgede anılan ama artık var olmayan bir betik, okuyanı
// olmayan bir dosyaya gönderiyor.
const hepsi = readdirSync(KOK + '/scratchpad').map(f => f.replace(/\.mjs$/, ''));
const hayalet = [...belge.matchAll(/`(ty[a-z0-9]+)`/g)].map(m => m[1])
  .filter((n, i, a) => a.indexOf(n) === i && !hepsi.includes(n));
console.log(`     belgede anılan ama olmayan: ${hayalet.length ? hayalet.join(', ') : 'yok'}`);
ok(hayalet.length === 0, 'silinmiş betiğe gönderme yok', hayalet.join(', '));

console.log('\n2) Belgede adı geçen her kanca oyunda var');
const kancalar = [...belge.matchAll(/`(je[A-Za-zÇĞİÖŞÜçğıöşü0-9]+)`/g)]
  .map(m => m[1]).filter((n, i, a) => a.indexOf(n) === i);
const yok = kancalar.filter(k => !new RegExp(`window\\.${k}\\s*=`).test(oyun));
console.log(`     ${kancalar.length} kanca anılıyor · bulunmayan ${yok.length}`);
if (yok.length) console.log(`     ${yok.join(', ')}`);
ok(yok.length === 0, 'belgedeki kancaların hepsi var', yok.join(', '));

console.log('\n3) Kayıt anahtarları');
const anahtarlar = [...belge.matchAll(/`(motorworks_save[a-z_]*)`/g)]
  .map(m => m[1]).filter((n, i, a) => a.indexOf(n) === i);
const olmayan = anahtarlar.filter(a => !oyun.includes(`'${a}'`));
console.log(`     ${anahtarlar.join(', ')}`);
ok(anahtarlar.length >= 3, 'üç yuva da anlatılıyor', `${anahtarlar.length}`);
ok(olmayan.length === 0, 'anlatılan her anahtar kodda var', olmayan.join(', '));

console.log('\n4) Uygulama içi ürün kimlikleri');
// Kodda duran kimlik ile belgede yazan kimlik ayrışırsa, Play Console'a
// yanlış kimlik girilir ve mağaza sessizce boş kalır.
const kodKimlik = [...oyun.matchAll(/id: '(motorworks_[a-z0-9]+)'/g)].map(m => m[1]);
const belgeKimlik = kodKimlik.filter(k => belge.includes(k));
console.log(`     kodda ${kodKimlik.length} · belgede ${belgeKimlik.length}`);
ok(kodKimlik.length === 3, 'kodda üç ürün var', `${kodKimlik.length}`);
ok(belgeKimlik.length === kodKimlik.length, 'üçü de belgede yazıyor',
   kodKimlik.filter(k => !belge.includes(k)).join(', '));

console.log('\n5) "Eksikler" hâlâ doğru mu');
// Yalnızca **yanlış olduğunda** düşüyor: kimlik girildiği hâlde belge
// hâlâ "boş" diyorsa.
const kimlik = (oyun.match(/const LEADERBOARD_ID = '([^']*)'/) || [])[1];
const belgeBosDiyor = /LEADERBOARD_ID`? hâlâ boş/.test(belge);
console.log(`     LEADERBOARD_ID "${kimlik}" · belge "boş" diyor ${belgeBosDiyor}`);
ok(!(kimlik && belgeBosDiyor),
   'liderlik tablosu anlatımı kodla uyuşuyor',
   kimlik ? 'kimlik girilmiş, belgeyi güncelle' : '');

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
