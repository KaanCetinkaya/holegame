#!/usr/bin/env node
// İmzalı .aab üretir — Android Studio'ya hiç girmeden.
//
//   npm run aab:fruithole
//
// İmza bilgileri depo kökündeki keystore.properties dosyasından okunur
// (git'e girmez). Örnek:
//
//   storeFile=C:/Users/HP/Desktop/fruithole-key.jks
//   storePassword=sifren
//   keyAlias=fruithole
//   keyPassword=sifren
//
// Native proje `cap add` ile yeniden üretildiğinde app/build.gradle sıfırlanır,
// bu yüzden imza bloğu her çalıştırmada yeniden enjekte edilir (varsa dokunmaz).

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const ROOT = dirname(fileURLToPath(import.meta.url));
const APPS = {
  hole: 'android',
  fruithole: 'android-fruithole',
  slicer: 'android-slicer',
  tycoon: 'android-tycoon',
};

const appName = process.env.APP || 'hole';
const projectDir = APPS[appName];
if (!projectDir) {
  console.error(`Bilinmeyen APP="${appName}". Geçerli: ${Object.keys(APPS).join(', ')}`);
  process.exit(1);
}

// --- bağımlılıklar gerçekten kurulu mu? ---
//
// `npx cap sync` eklentileri node_modules'tan okuyor, package.json'dan değil.
// Yani depoya yeni bir eklenti girdiğinde `npm install` çalıştırılmazsa sync
// onu hiç görmüyor ve derleme **sorunsuz** tamamlanıyor — eklenti içeride
// olmadan.
//
// 16 Eylül 2026: liderlik tablosu haftalardır cihazda açılmıyordu. Kod
// doğruydu, Play Console kurulumu doğruydu, test kullanıcıları doğruydu.
// @modbender/capacitor-play-games package.json'daydı ama node_modules'ta
// değildi; sync satırı `Found 2 Capacitor plugins` diyordu, 3 demesi
// gerekirken. O satır çıktının ortasında akıp gidiyor ve kimse saymıyor.
{
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const deps = Object.keys(pkg.dependencies || {});
  const eksik = deps.filter(d => !existsSync(join(ROOT, 'node_modules', d, 'package.json')));
  if (eksik.length) {
    console.error(
      `\nnode_modules'ta olmayan bağımlılık: ${eksik.join(', ')}\n\n` +
      `Bunlar package.json'da var ama kurulu değil. Capacitor eklentileri\n` +
      `node_modules'tan okunuyor, yani böyle bir eklenti derlemeye hiç\n` +
      `girmez ve derleme yine de başarılı olur — hatayı ancak cihazda,\n` +
      `özellik çalışmadığında görürsün.\n\n` +
      `  npm install\n`
    );
    process.exit(1);
  }

  // Kurulu olanların içinden Capacitor eklentisi olanları say ve yaz.
  // `cap sync`'in "Found N Capacitor plugins" satırıyla karşılaştırılacak
  // sayı bu; ikisi tutmuyorsa sync eski bir çıktıdan geliyor demektir.
  const plugins = deps.filter(d => {
    if (d === '@capacitor/core' || d === '@capacitor/android' || d === '@capacitor/cli') return false;
    try {
      const p = JSON.parse(readFileSync(join(ROOT, 'node_modules', d, 'package.json'), 'utf8'));
      return !!p.capacitor;
    } catch { return false; }
  });
  console.log(`Capacitor eklentisi (${plugins.length}): ${plugins.join(', ') || '-'}`);
}

const projectPath = join(ROOT, projectDir);
if (!existsSync(projectPath)) {
  console.error(`${projectDir} yok. Önce: npm run add:${appName}`);
  process.exit(1);
}

// --- Android SDK'nın yerini bul ---
// `cap add` local.properties üretmiyor; onu Android Studio yazıyor. Yeni bir
// native proje eklendiğinde Gradle SDK'yı bulamayıp "SDK location not found"
// ile düşüyor. Var olan kardeş projelerden ya da ortam değişkeninden
// devralıyoruz, böylece üçüncü ve dördüncü uygulama için de kendiliğinden
// çalışıyor.
function ensureLocalProperties() {
  const target = join(projectPath, 'local.properties');
  if (existsSync(target)) return;

  // Gradle bu dosyayı bir Java properties dosyası olarak okuyor: ters eğik
  // çizgi ve iki nokta kaçış karakteri. Yani dosyadaki değer ZATEN kaçırılmış
  // halde. İlk sürüm kardeş projeden okuduğu satırı bir kez daha kaçırıyordu
  // ve C\:\\Users\\HP yerine C\:\\\\Users\\\\HP yazıyordu — Gradle da
  // olmayan bir klasör arıyordu. Bu yüzden iki ayrı yol var: hazır satır
  // olduğu gibi kopyalanıyor, ham işletim sistemi yolu ise kaçırılıyor.
  let line = null;                  // dosyadan gelen, kaçırılmış satır
  let raw = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || '';

  if (!raw) {
    for (const dir of Object.values(APPS)) {
      const f = join(ROOT, dir, 'local.properties');
      if (!existsSync(f)) continue;
      const m = readFileSync(f, 'utf8').match(/^sdk\.dir\s*=.*$/m);
      if (m) { line = m[0]; break; }
    }
  }
  if (!raw && !line) {
    const home = process.env.LOCALAPPDATA || process.env.HOME || '';
    for (const guess of [
      join(home, 'Android', 'Sdk'),
      join(home, 'Library', 'Android', 'sdk'),
      join(home, 'Android', 'sdk'),
    ]) if (existsSync(guess)) { raw = guess; break; }
  }
  if (!raw && !line) {
    console.error(
      `\n${projectDir}/local.properties yok ve Android SDK bulunamadı.\n\n` +
      `Çözüm: ANDROID_HOME ortam değişkenini kurun, ya da çalışan bir\n` +
      `projeden kopyalayın:\n` +
      `  Copy-Item android-fruithole\\local.properties ${projectDir}\\local.properties\n`);
    process.exit(1);
  }

  const escape = v => v.replace(/\\/g, '\\\\').replace(/:/g, '\\:');
  const out = line || `sdk.dir=${escape(raw)}`;
  writeFileSync(target, out + '\n');
  console.log(`local.properties yazıldı -> ${out}`);
}
ensureLocalProperties();

const propsFile = join(ROOT, 'keystore.properties');
if (!existsSync(propsFile)) {
  console.error(
    `\nkeystore.properties bulunamadı: ${propsFile}\n\n` +
    `Şu içerikle oluştur (yolda ters eğik çizgi yerine düz / kullan):\n\n` +
    `  storeFile=C:/Users/HP/Desktop/fruithole-key.jks\n` +
    `  storePassword=SIFREN\n` +
    `  keyAlias=fruithole\n` +
    `  keyPassword=SIFREN\n`
  );
  process.exit(1);
}

// --- imza bilgisi tutuyor mu? ---
//
// Gradle imzalamayı en sona bırakıyor, yani yanlış bir şifre ancak birkaç
// dakikalık bir derlemenin sonunda öğreniliyor — ve hata metni
// ("Failed to read key ... keystore password was incorrect") hangi alanın
// yanlış olduğunu söylemiyor.
//
// 16 Eylül 2026'da bu tam olarak başımıza geldi: keystore.properties'te
// `storePassword=9999` yazıyordu. Bu değer o keystore'u hiç açmamış olmalı,
// çünkü keytool 6 karakterden kısa şifreyi **oluştururken** reddediyor — yani
// o dosyaya bir noktada gerçek şifre yerine başka bir şey yazılmış. Bunu
// anlamak saatler aldı; uzunluk kontrolü tek satırda söylerdi.
{
  const props = {};
  for (const line of readFileSync(propsFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([^#=][^=]*)=(.*)$/);
    if (m) props[m[1].trim()] = m[2].replace(/\r$/, '');
  }
  const missing = ['storeFile', 'storePassword', 'keyAlias', 'keyPassword']
    .filter(k => !props[k]);
  if (missing.length) {
    console.error(`\nkeystore.properties eksik alan: ${missing.join(', ')}`);
    process.exit(1);
  }
  if (!existsSync(props.storeFile)) {
    console.error(`\nkeystore bulunamadı: ${props.storeFile}\n` +
      `keystore.properties içindeki storeFile yolunu düzelt.`);
    process.exit(1);
  }
  // keytool'un kendi kuralı: bir keystore 6 karakterden kısa şifreyle
  // oluşturulamaz. Yani buradaki kısa bir değer "yanlış olabilir" değil,
  // "kesinlikle yanlış" demek.
  for (const k of ['storePassword', 'keyPassword']) {
    if (props[k].length < 6) {
      console.error(
        `\nkeystore.properties → ${k} yalnızca ${props[k].length} karakter.\n\n` +
        `keytool 6 karakterden kısa şifreyle keystore oluşturmuyor, yani bu\n` +
        `değer ${props.storeFile} dosyasının şifresi olamaz — bir noktada\n` +
        `yanlış yazılmış. Derlemeyi başlatmıyorum, sonunda imzalamada\n` +
        `düşerdi.`
      );
      process.exit(1);
    }
  }
}

// --- sürüm numarası ---
// Play aynı versionCode'u ikinci kez kabul etmiyor, bu yüzden numara
// depoda tutuluyor: native proje yeniden üretilse de kaybolmaz.
const versionFile = join(ROOT, 'app-version.json');
const versions = JSON.parse(readFileSync(versionFile, 'utf8'));
const version = versions[appName];
if (!version) {
  console.error(`app-version.json içinde "${appName}" yok.`);
  process.exit(1);
}

// Bu kod zaten yüklendiyse derleme hiç başlamıyor.
//
// Aşağıdaki git kontrolü bir **tahmin**: "sürüm artırıldıktan sonra oyun
// değişmiş" diyor ve çoğu zaman haklı, ama harcanmış bir kodu bilemiyor —
// yalnızca şüphelenebiliyor, ve uyarısı derlemeyi durdurmuyordu. 25 ve 27
// tam olarak böyle harcandı: uyarı çıktı, derleme yürüdü, Play yükleme
// kutusunda reddetti, ve o noktaya kadar geçen her şey boşa gitti.
//
// `uploaded` bir tahmin değil, kayıt. Yükledikten sonra
// `npm run uploaded:<uygulama>` çalıştırılıyor; o komut kodu buraya yazıp
// versionCode'u bir artırıyor. Yani "hangisini yüklemiştik" sorusunun
// cevabı dosyada duruyor ve artırmayı unutmak mümkün olmuyor.
const uploaded = Array.isArray(version.uploaded) ? version.uploaded : [];
if (uploaded.includes(version.versionCode)) {
  console.error('\n' + '!'.repeat(60));
  console.error(`DURDU: versionCode ${version.versionCode} zaten Play'e yüklenmiş.`);
  console.error(`Yüklenenler: ${uploaded.join(', ')}`);
  console.error('');
  console.error('Play aynı kodu ikinci kez kabul etmiyor, yani bu paket derlense');
  console.error('bile yükleme kutusunda reddedilirdi.');
  console.error('');
  console.error(`  app-version.json > ${appName}.versionCode -> ${Math.max(...uploaded) + 1}`);
  console.error('');
  console.error('Liste yanlışsa doğrusu Play Console > Release > App bundle');
  console.error('explorer\'da; oradan düzeltip tekrar dene.');
  console.error('!'.repeat(60) + '\n');
  process.exit(1);
}
if (uploaded.length) {
  console.log(`Yüklenmiş kodlar: ${uploaded.join(', ')} — ${version.versionCode} temiz.`);
}

// --- imza bloğunu app/build.gradle'a enjekte et ---
const gradleFile = join(projectPath, 'app', 'build.gradle');
let gradle = readFileSync(gradleFile, 'utf8');

// Şablon versionCode 1 / versionName "1.0" ile geliyor; her build'de
// app-version.json'daki değerlerle üzerine yazıyoruz.
const beforeVersion = gradle;
gradle = gradle
  .replace(/versionCode\s+\d+/, `versionCode ${version.versionCode}`)
  .replace(/versionName\s+"[^"]*"/, `versionName "${version.versionName}"`);
if (gradle === beforeVersion && !gradle.includes(`versionCode ${version.versionCode}`)) {
  console.error('HATA: app/build.gradle içinde versionCode/versionName bulunamadı.');
  process.exit(1);
}
console.log(`Sürüm: ${version.versionName} (code ${version.versionCode})`);


// Oyun app-version.json'dan sonra değiştiyse, bu versionCode muhtemelen
// harcanmıştır.
//
// Play bir versionCode'u ilk yüklemede tüketiyor ve ikincisini kabul
// etmiyor. Numarayı elle artırmayı hatırlamak gerekiyordu ve bir kez
// unutuldu: liderlik tablosu değişiklikleri zaten yüklenmiş olan 21'in
// üstüne yazıldı, paket 21 olarak derlendi ve Play yükleme kutusunda
// reddetti — yani hata, derlemeden dakikalar sonra, tarayıcıda ortaya çıktı.
//
// Buradaki kontrol git'e bakıyor: app-version.json'a dokunan son commit'ten
// sonra oyunun kendi dosyası değişmiş mi? Değiştiyse sürüm o değişiklikle
// birlikte artırılmamış demektir. Kesin değil (aynı commit'te ikisi de
// değişmiş olabilir, o zaman uyarı çıkmaz ve doğrusu da budur), ama
// unutulan durumu tam olarak yakalıyor.
try {
  const git = (args) => spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' }).stdout.trim();
  const verCommit = git(['log', '-1', '--format=%H', '--', 'app-version.json']);
  if (verCommit) {
    // Hole kökte, ötekiler kendi klasörlerinde.
    const src = appName === 'hole' ? 'index.html' : `${appName}/index.html`;
    const after = git(['log', '--oneline', `${verCommit}..HEAD`, '--', src]);
    if (after) {
      console.warn('\n' + '!'.repeat(60));
      console.warn(`UYARI: ${src} sürüm artırıldıktan SONRA değişmiş.`);
      console.warn(`Bu paket code ${version.versionCode} ile derlenecek ve o numara`);
      console.warn('Play\'e daha önce yüklendiyse yükleme kutusunda reddedilir.');
      console.warn('app-version.json içindeki versionCode\'u artırmayı unuttuysan şimdi artır.');
      console.warn('!'.repeat(60) + '\n');
    }
  }
} catch (e) { /* git yoksa ya da depo değilse sessizce geç */ }

if (gradle.includes('signingConfigs')) {
  console.log('İmza yapılandırması zaten var.');
  writeFileSync(gradleFile, gradle);   // sürüm değişmiş olabilir
} else {
  const loader =
    `def keystorePropertiesFile = rootProject.file("../keystore.properties")\n` +
    `def keystoreProperties = new Properties()\n` +
    `if (keystorePropertiesFile.exists()) {\n` +
    `    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))\n` +
    `}\n\n`;

  const signing =
    `    signingConfigs {\n` +
    `        release {\n` +
    `            if (keystorePropertiesFile.exists()) {\n` +
    `                storeFile file(keystoreProperties['storeFile'])\n` +
    `                storePassword keystoreProperties['storePassword']\n` +
    `                keyAlias keystoreProperties['keyAlias']\n` +
    `                keyPassword keystoreProperties['keyPassword']\n` +
    `            }\n` +
    `        }\n` +
    `    }\n`;

  if (!gradle.includes('android {')) {
    console.error('HATA: app/build.gradle beklenmeyen biçimde, "android {" yok.');
    process.exit(1);
  }
  gradle = loader + gradle.replace('android {', 'android {\n' + signing);

  const releaseBlock = '        release {\n            minifyEnabled false';
  if (!gradle.includes(releaseBlock)) {
    console.error('HATA: buildTypes.release bloğu bulunamadı.');
    process.exit(1);
  }
  gradle = gradle.replace(
    releaseBlock,
    '        release {\n            signingConfig signingConfigs.release\n            minifyEnabled false'
  );

  writeFileSync(gradleFile, gradle);
  console.log('İmza yapılandırması eklendi.');
}

// --- uygun JDK'yı bul ---
// Capacitor 8 en az Java 21 istiyor, Gradle 8.14 ise 24'ten yenisini
// kabul etmiyor. Sistemdeki varsayılan Java çoğu zaman bu aralığın
// dışında kalıyor, o yüzden aralığa uyan bir JDK'yı kendimiz arayıp
// yalnızca bu build için JAVA_HOME olarak veriyoruz.
const JDK_MIN = 21, JDK_MAX = 24;

function javaMajor(javaHome) {
  const bin = join(javaHome, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
  if (!existsSync(bin)) return null;
  const out = spawnSync(bin, ['-version'], { encoding: 'utf8' });
  const text = (out.stderr || '') + (out.stdout || '');
  const m = text.match(/version "(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function findJdk() {
  const candidates = [];
  if (process.env.JAVA_HOME) candidates.push(process.env.JAVA_HOME);

  const home = process.env.USERPROFILE || process.env.HOME || '';
  for (const base of [
    'C:/Program Files/Android/Android Studio/jbr',
    'C:/Program Files/Android/Android Studio1/jbr',
    '/Applications/Android Studio.app/Contents/jbr/Contents/Home',
  ]) {
    candidates.push(base);
  }
  // Temurin/Java'nın Windows'taki standart kurulum kökleri
  for (const dir of ['C:/Program Files/Eclipse Adoptium', 'C:/Program Files/Java']) {
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) candidates.push(join(dir, name));
  }
  // ~/.jdks ve linux'ta /usr/lib/jvm altındaki her şey
  for (const dir of [join(home, '.jdks'), '/usr/lib/jvm']) {
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) candidates.push(join(dir, name));
  }

  const seen = [];
  const found = [];
  for (const c of candidates) {
    if (!c || !existsSync(c)) continue;
    const major = javaMajor(c);
    if (major === null) continue;
    seen.push(`${major} -> ${c}`);
    found.push({ path: c, major });
  }

  // Tercih edilen: Gradle'ın resmen desteklediği aralık.
  const exact = found.find(j => j.major >= JDK_MIN && j.major <= JDK_MAX);
  if (exact) return { ...exact, seen };

  // Aralıkta bir şey yoksa daha yenisiyle deniyoruz. Resmî kombinasyon
  // değil ama Android Studio'nun kendi Java 25'iyle build çalışıyor;
  // makineye ayrıca JDK 21 kurdurtmaktan iyi.
  const newer = found.filter(j => j.major > JDK_MAX).sort((a, b) => a.major - b.major)[0];
  if (newer) return { ...newer, seen, fallback: true };

  return { path: null, seen };
}

const jdk = findJdk();
if (!jdk.path) {
  console.error(
    `\nUygun JDK bulunamadı (Java ${JDK_MIN}-${JDK_MAX} gerekiyor).\n` +
    (jdk.seen.length ? `Bulunanlar:\n  ${jdk.seen.join('\n  ')}\n` : '') +
    `\nJDK 21'i adoptium.net/temurin adresinden kurup tekrar dene.\n`
  );
  process.exit(1);
}
console.log(`JDK: Java ${jdk.major} (${jdk.path})`);
if (jdk.fallback) {
  console.log(`  not: Java ${JDK_MIN}-${JDK_MAX} bulunamadı, bununla deneniyor.`);
}

// --- gradle ile paketle ---
// .aab Play'e yüklemek için; telefona doğrudan kurulamaz. Elle kurup denemek
// için `node build-aab.mjs apk` → aynı imzayla .apk üretir.
// `node build-aab.mjs dev` → hata ayıklama imzasıyla ve `.dev` paket ekiyle
// bir .apk. Telefonda Play'den kurulu sürümün **yanına** kuruluyor; mağazadaki
// uygulamaya hiç dokunulmuyor. Sebebi patch-manifest.mjs'te yazılı.
const wantApk = process.argv[2] === 'apk';
const wantDev = process.argv[2] === 'dev';
const task = wantDev ? 'assembleDebug' : wantApk ? 'assembleRelease' : 'bundleRelease';
const out = wantDev
  ? resolve(projectPath, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')
  : wantApk
  ? resolve(projectPath, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk')
  : resolve(projectPath, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');

const isWin = process.platform === 'win32';
const gradlew = join(projectPath, isWin ? 'gradlew.bat' : 'gradlew');

console.log(`\n${projectDir}: ${task} çalışıyor, bu birkaç dakika sürer...\n`);
const res = spawnSync(gradlew, [task], {
  cwd: projectPath,
  stdio: 'inherit',
  shell: isWin,
  env: { ...process.env, JAVA_HOME: jdk.path },
});

if (res.status !== 0) {
  console.error('\nBuild başarısız. Yukarıdaki Gradle çıktısına bak.');
  process.exit(res.status || 1);
}

console.log('\n' + '='.repeat(60));
console.log(existsSync(out) ? `HAZIR:\n${out}` : `Build bitti ama dosya bulunamadı: ${out}`);
console.log('='.repeat(60));

// Hangi kodun gerçekten derlendiği yazılıyor.
//
// .aab her derlemede aynı yolun üstüne yazılıyor (`app-release.aab`), yani
// dosyanın varlığı hangi sürümü taşıdığını söylemiyor. Bu satır söylüyor,
// ve `mark-uploaded.mjs` onu şart koşuyor: derlenmemiş bir paketi yüklemiş
// olamazsın. Kayıt komutunun yanlışlıkla iki kez çalıştırılması da böyle
// duruyor — ikinci seferde sıradaki kod henüz derlenmemiş oluyor.
// `wantDev` de dışarıda: dev derlemesi hata ayıklama imzasıyla çıkıyor ve
// mağazaya hiç gitmiyor, ama `built`e yazılınca `mark-uploaded.mjs` o sürüm
// kodunun paketlendiğini sanıyordu — hiç `bundleRelease` çalışmamışken
// "yüklendi" kaydı açılabiliyordu.
if (!wantApk && !wantDev && existsSync(out)) {
  try {
    const fresh = JSON.parse(readFileSync(versionFile, 'utf8'));
    fresh[appName].built = version.versionCode;
    writeFileSync(versionFile, JSON.stringify(fresh, null, 2) + '\n');
  } catch (e) {
    console.warn('not: app-version.json güncellenemedi, `built` yazılamadı.');
  }
}

// Dosyanın durduğu klasörü aç.
//
// Yolu ekrana yazmak yetmiyordu: Play Console'a yüklemek için dosyayı
// sürüklemek gerekiyor, o da her seferinde bu uzun yolu elle Gezgin'e
// yazmak ya da kopyalamak demekti. Derlemenin son adımı zaten bu, o yüzden
// burada yapılıyor. Açılmazsa bir şey bozulmuyor — yol yukarıda duruyor.
//
// Dev derlemesinde açılmıyor: o .apk'yı kimse sürüklemiyor, telefon onu
// Wi-Fi üstünden indiriyor. Gezgin penceresi bir işe yaramadan önüne
// açılıyordu.
if (!wantDev && existsSync(out)) {
  const dir = dirname(out);
  try {
    // `shell: true` değil: Node 22 kabuk açıkken argüman geçirmeyi
    // uyarıyor (DEP0190) ve uyarı "HAZIR" satırının hemen altına düşüp
    // derleme bozulmuş gibi duruyordu. explorer.exe zaten PATH'te.
    if (isWin) spawnSync('explorer.exe', [dir]);
    else if (process.platform === 'darwin') spawnSync('open', [dir]);
    else spawnSync('xdg-open', [dir]);
  } catch (e) { /* klasör açılamadıysa yol zaten yazıldı */ }
}
if (wantApk && existsSync(out)) {
  console.log('\nBu dosyayı telefona kopyala ve dokun. "Bilinmeyen kaynak" uyarısı');
  console.log('çıkarsa izin ver. Play\'e yüklenecek olan bu değil, .aab.');
}
