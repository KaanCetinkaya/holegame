// Bir versionCode'u "Play'e yüklendi" diye işaretle ve sıradakini hazırla.
//
//   node mark-uploaded.mjs fruithole
//   npm run uploaded:fruithole
//
// Neden var: depo ne yüklediğimizi bilmiyordu. Bilmediği için "hangisini
// yüklemiştik" sorusu her seferinde insana soruluyordu, ve iki kez yanlış
// cevaplandı — 25 ve 27 harcandı, derleme yürüdü, Play yükleme kutusunda
// reddetti. Tahmin eden bir uyarı vardı ama durdurmuyordu.
//
// Bu komut iki şeyi birden yapıyor ve ikisinin ayrılmaması önemli: kodu
// listeye ekliyor **ve** versionCode'u artırıyor. Ayrı olsalardı ikincisi
// unutulurdu — zaten unutulan şey tam olarak oydu.

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const app = process.argv[2] || process.env.APP;
if (!app) {
  console.error('Hangi uygulama? Örnek: node mark-uploaded.mjs fruithole');
  process.exit(1);
}

const file = join(ROOT, 'app-version.json');
const data = JSON.parse(readFileSync(file, 'utf8'));
const v = data[app];
if (!v) {
  console.error(`app-version.json içinde "${app}" yok.`);
  process.exit(1);
}

if (!Array.isArray(v.uploaded)) v.uploaded = [];
const code = v.versionCode;
const force = process.argv.includes('--force');

// Derlenmemiş bir paketi yüklemiş olamazsın.
//
// `built` alanını build-aab.mjs başarılı bir .aab'den sonra yazıyor. Bu
// kontrol olmadan komut yanlışlıkla iki kez çalıştırıldığında hiç
// derlenmemiş bir kodu "yüklendi" diye işaretliyordu — kod kaybı değil
// (atlanan numaranın bir maliyeti yok) ama listeyi yalancı yapıyordu, ve
// bu listenin tek işi doğru olmak.
if (!force && v.built !== code) {
  console.error(`DURDU: versionCode ${code} derlenmemiş görünüyor.`);
  console.error(v.built === undefined
    ? '  app-version.json içinde `built` yok — derleme onu yazıyor.'
    : `  En son derlenen: ${v.built}`);
  console.error('');
  console.error('  Önce `npm run aab:<uygulama>` ile derle, yükle, sonra bu komutu çalıştır.');
  console.error('  Kayıt gerçekten doğruysa: --force');
  process.exit(1);
}

if (v.uploaded.includes(code)) {
  console.log(`versionCode ${code} zaten yüklenmiş olarak işaretli.`);
  // Yine de sıradakine geçilmiş mi bak: işaretli ama artırılmamışsa
  // derleme bir sonraki denemede duracak, ve sebebi anlaşılmayacaktı.
  const next = Math.max(...v.uploaded) + 1;
  if (v.versionCode < next) {
    v.versionCode = next;
    writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
    console.log(`versionCode ${next} yapıldı.`);
  }
  process.exit(0);
}

v.uploaded.push(code);
v.uploaded.sort((a, b) => a - b);
v.versionCode = Math.max(...v.uploaded) + 1;
writeFileSync(file, JSON.stringify(data, null, 2) + '\n');

console.log(`${app}: ${code} yüklendi olarak işaretlendi.`);
console.log(`Yüklenenler: ${v.uploaded.join(', ')}`);
console.log(`Sıradaki derleme versionCode ${v.versionCode} ile çıkacak.`);
console.log('\nBunu commit etmeyi unutma — kayıt depoda durmazsa işe yaramaz.');
