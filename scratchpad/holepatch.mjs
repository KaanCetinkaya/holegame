// patch-manifest.mjs gerçekten doğru dosyaları mı yazıyor, ve iki kez
// çalıştırılınca ikinci kez bozuyor mu?
//
//   node scratchpad/holepatch.mjs
//
// Neden var: bu betik **Kaan'ın makinesinde** çalışıyor ve yazdığı dosyalar
// depoda yok (`android-fruithole/` .gitignore'da). Yani burada hiç
// denenmeden gönderiliyor, ve yanlışsa bunu ancak o derlemeyi çalıştırdığında
// öğreniyoruz — bir tur kaybı, üstelik hatanın ne olduğu da belli olmuyor
// çünkü Gradle'ın hatası genelde başka bir şeyi gösteriyor.
//
// Burada sahte bir native proje kuruluyor (Capacitor'ün ürettiğinin küçük
// ama biçim olarak aynı hâli), betik iki kez çalıştırılıyor ve sonuç
// okunuyor. İkinci koşu önemli: `cap sync` her derlemede çalışıyor ve
// betik her seferinde aynı dosyalara dokunuyor.
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';

const ROOT = '/home/user/holegame';
const DIR = join(ROOT, 'android-fruithole');
const vardi = existsSync(DIR);
if (vardi) {
  console.error('android-fruithole zaten var — test onu silmeyecek, çıkılıyor.');
  process.exit(1);
}

const app = join(DIR, 'app');
mkdirSync(join(app, 'src', 'main', 'res', 'values'), { recursive: true });

writeFileSync(join(app, 'build.gradle'), `apply plugin: 'com.android.application'

android {
    namespace "com.kaancetinkaya.fruithole"
    compileSdk rootProject.ext.compileSdkVersion
    defaultConfig {
        applicationId "com.kaancetinkaya.fruithole"
        minSdkVersion rootProject.ext.minSdkVersion
        versionCode 36
        versionName "1.0"
    }
    buildTypes {
        release {
            minifyEnabled false
        }
    }
}
`);

writeFileSync(join(app, 'src', 'main', 'AndroidManifest.xml'), `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:label="@string/app_name">
        <activity android:name=".MainActivity" />
    </application>
    <uses-permission android:name="android.permission.INTERNET" />
</manifest>
`);

writeFileSync(join(app, 'src', 'main', 'res', 'values', 'strings.xml'), `<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">Fruit Hole</string>
    <string name="title_activity_main">Fruit Hole</string>
    <string name="package_name">com.kaancetinkaya.fruithole</string>
</resources>
`);

const fails = [];
const check = (ok, ad, not = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ad}${not ? '   ' + not : ''}`);
  if (!ok) fails.push(ad + (not ? ' — ' + not : ''));
};

const kos = () => spawnSync('node', [join(ROOT, 'patch-manifest.mjs')], {
  cwd: ROOT, encoding: 'utf8', env: { ...process.env, APP: 'fruithole' },
});

console.log('1) ilk koşu');
const r1 = kos();
check(r1.status === 0, 'betik hatasız bitti', r1.status === 0 ? '' : r1.stderr.trim());

const gradle = () => readFileSync(join(app, 'build.gradle'), 'utf8');
const manifest = () => readFileSync(join(app, 'src', 'main', 'AndroidManifest.xml'), 'utf8');
const devStr = join(app, 'src', 'debug', 'res', 'values', 'strings.xml');

check(gradle().includes('applicationIdSuffix ".dev"'), 'dev paket eki yazıldı');
check(gradle().includes('versionNameSuffix "-dev"'), 'dev sürüm adı eki yazıldı');
// Sürüm bloğuna dokunulmamalı: mağazaya giden derleme aynı kalmalı.
check(gradle().includes('release {'), 'release bloğu duruyor');
check(!gradle().includes('release {\n            applicationIdSuffix'),
      'ek release bloğuna girmedi');
check(existsSync(devStr), 'dev sürümünün adı dosyası kuruldu');
if (existsSync(devStr)) {
  const d = readFileSync(devStr, 'utf8');
  check(d.includes('Fruit Hole DEV'), 'dev sürümünün adı "Fruit Hole DEV"');
  // Ana kümedeki dizeyi ezmeli, çoğaltmamalı: yalnızca ad dizeleri olmalı.
  check(!d.includes('package_name'), 'dev dosyası yalnızca adı eziyor');
}
check(manifest().includes('com.google.android.gms.ads.APPLICATION_ID'), 'AdMob kimliği yazıldı');
check(manifest().includes('com.google.android.gms.games.APP_ID'), 'Play Games kimliği yazıldı');
check(manifest().includes('com.android.vending.BILLING'), 'faturalandırma izni yazıldı');

console.log('\n2) ikinci koşu (her cap sync bunu tekrar çalıştırıyor)');
const g1 = gradle(), m1 = manifest(), d1 = readFileSync(devStr, 'utf8');
const r2 = kos();
check(r2.status === 0, 'ikinci koşu hatasız bitti', r2.status === 0 ? '' : r2.stderr.trim());
check(gradle() === g1, 'build.gradle ikinci koşuda değişmedi');
check(manifest() === m1, 'manifest ikinci koşuda değişmedi');
check(readFileSync(devStr, 'utf8') === d1, 'dev adı ikinci koşuda değişmedi');
check((gradle().match(/applicationIdSuffix/g) || []).length === 1,
      'paket eki bir kez yazılı', String((gradle().match(/applicationIdSuffix/g) || []).length));

rmSync(DIR, { recursive: true, force: true });

// --- Capacitor'ün debug bloğunu kendisi ürettiği hâl ---
//
// Bu biçim de dolaşımda ve ikinci bir `debug {` eklemek Gradle'ı "duplicate
// build type" ile düşürürdü. Burada denenmezse o hata ancak Kaan'ın
// makinesinde, derlemenin ortasında çıkardı.
console.log('\n3) build.gradle zaten debug bloğu içeriyorsa');
mkdirSync(join(app, 'src', 'main', 'res', 'values'), { recursive: true });
writeFileSync(join(app, 'build.gradle'), `android {
    defaultConfig {
        applicationId "com.kaancetinkaya.fruithole"
    }
    buildTypes {
        debug {
            minifyEnabled false
        }
        release {
            minifyEnabled false
        }
    }
}
`);
writeFileSync(join(app, 'src', 'main', 'AndroidManifest.xml'), `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application android:label="@string/app_name">
        <activity android:name=".MainActivity" />
    </application>
</manifest>
`);
writeFileSync(join(app, 'src', 'main', 'res', 'values', 'strings.xml'), `<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">Fruit Hole</string>
</resources>
`);
const r3 = kos();
check(r3.status === 0, 'betik hatasız bitti', r3.status === 0 ? '' : r3.stderr.trim());
const g3 = gradle();
check((g3.match(/debug\s*\{/g) || []).length === 1, 'tek bir debug bloğu var',
      String((g3.match(/debug\s*\{/g) || []).length));
check(g3.includes('applicationIdSuffix ".dev"'), 'ek var olan bloğa yazıldı');
check(g3.includes('minifyEnabled false'), 'var olan satır korundu');
rmSync(DIR, { recursive: true, force: true });

console.log('\n' + (fails.length ? 'hatalar:\n - ' + fails.join('\n - ') : 'hepsi geçti'));
process.exit(fails.length ? 1 : 0);
