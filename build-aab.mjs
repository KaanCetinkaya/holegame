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

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const ROOT = dirname(fileURLToPath(import.meta.url));
const APPS = { hole: 'android', fruithole: 'android-fruithole' };

const appName = process.env.APP || 'hole';
const projectDir = APPS[appName];
if (!projectDir) {
  console.error(`Bilinmeyen APP="${appName}". Geçerli: ${Object.keys(APPS).join(', ')}`);
  process.exit(1);
}

const projectPath = join(ROOT, projectDir);
if (!existsSync(projectPath)) {
  console.error(`${projectDir} yok. Önce: npm run add:${appName}`);
  process.exit(1);
}

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

// --- imza bloğunu app/build.gradle'a enjekte et ---
const gradleFile = join(projectPath, 'app', 'build.gradle');
let gradle = readFileSync(gradleFile, 'utf8');

if (gradle.includes('signingConfigs')) {
  console.log('İmza yapılandırması zaten var.');
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

// --- gradle ile paketle ---
const isWin = process.platform === 'win32';
const gradlew = join(projectPath, isWin ? 'gradlew.bat' : 'gradlew');

console.log(`\n${projectDir}: bundleRelease çalışıyor, bu birkaç dakika sürer...\n`);
const res = spawnSync(gradlew, ['bundleRelease'], {
  cwd: projectPath,
  stdio: 'inherit',
  shell: isWin,
});

if (res.status !== 0) {
  console.error('\nBuild başarısız. Yukarıdaki Gradle çıktısına bak.');
  process.exit(res.status || 1);
}

const out = resolve(projectPath, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
console.log('\n' + '='.repeat(60));
console.log(existsSync(out) ? `HAZIR:\n${out}` : `Build bitti ama dosya bulunamadı: ${out}`);
console.log('='.repeat(60));
