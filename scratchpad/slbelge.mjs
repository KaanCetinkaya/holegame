// `slicer/README.md` oyunla aynı şeyi mi anlatıyor?
//
// Motor Works'teki `tybelge.mjs` ile aynı gerekçe, aynı hata sınıfı: elle
// yazılmış bir liste, kod değişince yerinde kalıyor. Burada iki kere oldu
// ve ikisi de belgenin en çok okunan yerindeydi —
//
//   * parça tablosu altı parça sayıyordu, oysa on bir var (mayın, mengene,
//     salınım, dokuma ve kapan tabloya hiç girmemişti)
//   * "Eksikler" başlığı AdMob kurulmamış ve oyun hiç telefona
//     yüklenmemiş gibi duruyordu; ikisi de 7 Ekim'de yapılmıştı
//
// Belgenin tamamı ölçülemez. Bayatlayan kısmı hep aynı: listeler. Üçü de
// burada, ve hiçbiri tarayıcı açmıyor.
import { readFileSync, readdirSync } from 'fs';

const KOK = '/home/user/holegame';
const belge = readFileSync(KOK + '/slicer/README.md', 'utf8');
const oyun = readFileSync(KOK + '/slicer/index.html', 'utf8');

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

console.log('\n1) Parkur parçaları');
// Kimlikler koddan okunuyor, sayı elle yazılmıyor: "dokuz parça" diye bir
// cümle de bayatlayabilen bir liste.
const parcalar = [...oyun.matchAll(/\{ id: '([a-z]+)', minLevel: (\d+)/g)]
  .map(m => ({ id: m[1], lv: +m[2] }));
const yazmayan = parcalar.filter(p => !new RegExp(`\\*\\*${p.id}\\*\\*`).test(belge));
console.log(`     kodda ${parcalar.length}: ` + parcalar.map(p => `${p.id}@${p.lv}`).join(', '));
ok(parcalar.length >= 9, 'parça listesi okunabildi', `${parcalar.length}`);
ok(yazmayan.length === 0, 'her parça belgede yazıyor', yazmayan.map(p => p.id).join(', '));

// Açılış bölümü de doğru yazmalı: tabloda 18 yazıp kodda 28 olmak,
// olmamaktan beter.
const yanlis = parcalar.filter(p => {
  const sat = belge.split('\n').find(l => l.includes(`**${p.id}**`));
  return sat && !new RegExp(`\\|\\s*${p.lv}\\s*\\|?\\s*$`).test(sat.trim());
});
ok(yanlis.length === 0, 'tablodaki açılış bölümleri kodla aynı',
   yanlis.map(p => `${p.id}@${p.lv}`).join(', '));

console.log('\n2) Ölçüm betikleri belgede anılıyor');
const URETEN = ['slshots', 'slframe', 'slblade'];
const betikler = readdirSync(KOK + '/scratchpad')
  .filter(f => /^sl.*\.mjs$/.test(f) || /^slice.*\.mjs$/.test(f))
  .map(f => f.replace(/\.mjs$/, ''))
  .filter(n => !URETEN.includes(n));
const anilmayan = betikler.filter(n => !belge.includes(n));
console.log(`     ${betikler.length} betik · belgede olmayan ${anilmayan.length}`);
if (anilmayan.length) console.log(`     ${anilmayan.join(', ')}`);
ok(anilmayan.length === 0, 'listede eksik betik yok', anilmayan.join(', '));

// Sürüm notlarındaki sayı da aynı listeden geliyor ve bayatlamıştı:
// "on altı ölçüm betiği" yazıyordu, ölçüm sayısı yirmi bire çıkmıştı.
// Testçinin okuduğu tek metin o, ve orada yanlış bir sayı bu deponun
// en sık hatası — elle yazılmış bir sayı, kod değişince yerinde kalıyor.
const notlar = readFileSync(KOK + '/slicer/store/release-notes.md', 'utf8');
const sayiSatiri = notlar.split('\n').find(l => l.includes('ölçüm betiği')) || '';
const yazanSayi = (sayiSatiri.match(/(\d+) ölçüm betiği/) || [])[1];
console.log(`     sürüm notları: ${sayiSatiri.trim() || '— satır yok'}`);
ok(Number(yazanSayi) === betikler.length,
   'sürüm notlarındaki betik sayısı doğru',
   `notlarda ${yazanSayi || 'yok'} · gerçekte ${betikler.length}`);

console.log('\n3) Belgede adı geçen her kanca oyunda var');
const kancalar = [...belge.matchAll(/`(slice[A-Za-z]+)\(?\)?`/g)]
  .map(m => m[1]).filter((n, i, a) => a.indexOf(n) === i);
const yok = kancalar.filter(k => !new RegExp(`window\\.${k}\\s*=`).test(oyun));
console.log(`     ${kancalar.length} kanca anılıyor: ${kancalar.join(', ') || '—'}`);
ok(yok.length === 0, 'belgedeki kancaların hepsi var', yok.join(', '));

console.log('\n4) Tavanlar');
// Belgedeki tablo üç tavanı sayı sayı veriyor. Koddaki ifadeler
// değişirse tablo sessizce yalan söyler.
const boy = /Math\.min\(24 \+ n \* 2, 48\)/.test(oyun);
const hiz = /Math\.min\(8 \+ \(n - 1\) \* 0\.45, 15\)/.test(oyun);
console.log(`     boy ifadesi ${boy} · hız ifadesi ${hiz}`);
ok(boy, 'parkur boyu ifadesi belgede yazdığı gibi');
ok(hiz, 'hız ifadesi belgede yazdığı gibi');
const enGec = parcalar.reduce((m, p) => Math.max(m, p.lv), 0);
ok(belge.includes(`**${enGec}**`), 'havuzun dolduğu bölüm belgede doğru',
   `kodda ${enGec}`);

console.log('\n5) Reklam anahtarı kaynakta test kipinde');
// Kendi canlı reklamına tıklamak AdMob hesabını kapattırıyor. Kaynakta
// her zaman `true` kalmalı; yalnızca `release:slicer` kapatıyor.
const ads = (oyun.match(/const ADS_TESTING = ([^;]+);/) || [])[1];
console.log(`     ADS_TESTING ${ads}`);
ok(ads === 'true', 'kaynakta reklamlar test', String(ads));

console.log('\n6) Mağaza metni oyunla uyuşuyor mu');
// Oyuncunun indirmeden önce okuduğu tek metin bu, ve içindeki her sayı
// elle yazılmış. Bıçak eklenip metin güncellenmezse mağaza eksik söz
// verir; bıçak çıkarılıp metin kalırsa **tutulmayan** bir söz verir ve
// ikincisi iade ve yorum demek.
const liste = readFileSync(KOK + '/slicer/store/listing.md', 'utf8');
const SAYI = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
               seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
const kelime = n => Object.keys(SAYI).find(k => SAYI[k] === n);

// Düzenleyicinin iki tuzağı burada ödendi: `'Obsidian',steel:` satırında
// virgülden sonra boşluk yok (altıncı bıçak sayılmıyordu), ve metin
// adları küçük harfle sayıyor ("Steel, copper, emerald…").
const bicaklar = [...oyun.matchAll(/\{ name: '([A-Za-z]+)',\s*steel:/g)].map(m => m[1]);
const kucuk = liste.toLowerCase();
const eksikBicak = bicaklar.filter(b => !kucuk.includes(b.toLowerCase()));
console.log(`     ${bicaklar.length} bıçak: ${bicaklar.join(', ')}`);
ok(bicaklar.length > 0, 'bıçak listesi okunabildi');
ok(eksikBicak.length === 0, 'her bıçağın adı mağaza metninde', eksikBicak.join(', '));
ok(new RegExp(`${kelime(bicaklar.length)} blades`, 'i').test(liste),
   'bıçak sayısı metinle aynı', `kodda ${bicaklar.length}`);

const hedefSayisi = (oyun.match(/const GOALS = \[[\s\S]*?\n\];/) || [''])[0]
  .split('id: \'').length - 1;
console.log(`     ${hedefSayisi} hedef`);
ok(new RegExp(`${kelime(hedefSayisi)} of them`, 'i').test(liste),
   'hedef sayısı metinle aynı', `kodda ${hedefSayisi}`);

const temaSayisi = (oyun.match(/const TEMALAR = \[[\s\S]*?\n\];/) || [''])[0]
  .split('ad: \'').length - 1;
console.log(`     ${temaSayisi} tema`);
ok(new RegExp(`${kelime(temaSayisi)} evenings`, 'i').test(liste),
   'tema sayısı metinle aynı', `kodda ${temaSayisi}`);
// Metin "dört bölümde bir" diyor; kod da öyle demeli.
ok(/every four levels/i.test(liste) && /\/ 4\) % TEMALAR\.length/.test(oyun),
   'tema sıklığı metinle aynı');

console.log('\n7) Aynı kanca iki kez tanımlanmış mı');
// Motor Works'te tam bu oldu (`jeCarryMax`): iki tanım, ikincisi
// birincisini eziyor, ve sayı bekleyen ölçüm dizi alıp bütün tablosunu
// NaN basıyor — kapılar NaN karşılaştırmasıyla geçtiği için takımda "OK"
// yazıyordu. Tarama bedava, o yüzden üç oyunda da var.
const tanimlar = [...oyun.matchAll(/^window\.(slice[A-Za-z0-9]+)\s*=/gm)].map(m => m[1]);
const ikiKez = [...new Set(tanimlar.filter((n, i) => tanimlar.indexOf(n) !== i))];
console.log(`     ${tanimlar.length} kanca · iki kez yazılan ${ikiKez.length}`);
ok(ikiKez.length === 0, 'her kanca bir kez tanımlanmış', ikiKez.join(', '));

console.log('\n8) Sürüm notu Play kutusuna sığıyor mu');
// Sınır dil başına 500 karakter ve Play boşlukları da sayıyor: uzunsa
// kutu kırmızıya dönüyor ve sürüm **kaydedilmiyor**. Dosya her bloğun
// uzunluğunu başlığına elle yazıyor, yani iki şey bayatlayabilir — sayı
// ve metnin kendisi. Sınır da dosyadan okunuyor. (`tybelge` aynısını
// Motor Works için yapıyor; sürüm notu o güne kadar hiçbir yerde
// ölçülmüyordu, oysa mağaza metinleri 2024'ten beri ölçülüyor.)
const sinir = Number((notlar.match(/\*\*(\d+) karakter\*\*/) || [])[1] || 500);
const satirlar = notlar.split('\n');
let notSayisi = 0; const uzun = [], yanlisSayi = [];
for (let i = 0; i < satirlar.length; i++) {
  const m = satirlar[i].match(/^###\s+(.+?)\s*\((\d+) karakter\)/);
  if (!m) continue;
  const bas = satirlar.findIndex((l, k) => k > i && l.trim() === '```');
  if (bas === -1) continue;
  const son = satirlar.findIndex((l, k) => k > bas && l.trim() === '```');
  if (son === -1) continue;
  const metin = satirlar.slice(bas + 1, son).join('\n');
  notSayisi++;
  if (metin.length > sinir) uzun.push(`${m[1]} ${metin.length}`);
  if (metin.length !== Number(m[2])) yanlisSayi.push(`${m[1]} yazan ${m[2]} gerçek ${metin.length}`);
}
console.log(`     ${notSayisi} not bloğu · sınır ${sinir}`);
ok(notSayisi >= 2, 'sürüm notu blokları okunabildi', `${notSayisi}`);
ok(uzun.length === 0, 'her not sınırın altında', uzun.join(' · '));
ok(yanlisSayi.length === 0, 'başlıktaki karakter sayısı doğru', yanlisSayi.join(' · '));

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
