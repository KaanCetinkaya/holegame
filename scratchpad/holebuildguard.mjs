// build-aab.mjs derlemeye girmeden önce ne yakalıyor?
//
//   node scratchpad/holebuildguard.mjs
//
// 16 Eylül 2026'da iki saat iki şeye gitti ve ikisi de derlemenin **başında**
// bilinebilirdi:
//
//   * @modbender/capacitor-play-games package.json'daydı ama node_modules'ta
//     değildi. `cap sync` onu görmedi, derleme başarılı oldu, eklenti içeride
//     değildi. Cihazda liderlik tablosu haftalardır açılmıyordu ve sebebi
//     buydu — kod, Play Console kurulumu, test kullanıcıları hepsi doğruydu.
//   * keystore.properties'te `storePassword=9999` yazıyordu. Gradle imzalamayı
//     en sona bıraktığı için bu ancak dakikalarca süren bir derlemenin
//     sonunda öğrenildi.
//
// Bu dosya, build-aab.mjs'yi geçici bir klasöre kopyalayıp (ROOT betiğin
// bulunduğu yer olduğu için sahte bir depo böyle kurulabiliyor) o iki durumu
// ve birkaç kardeşini yeniden üretiyor. Gradle hiç çalışmıyor: kontroller
// zaten ondan önce dönüyor, ve amaç da tam olarak bu.

import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawnSync } from 'child_process';

const SRC = '/home/user/holegame/build-aab.mjs';

const fails = [];
const check = (ok, what, saw) => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what}${saw === undefined ? '' : `   ${saw}`}`);
  if (!ok) fails.push(what);
};

// Sahte bir depo: build-aab.mjs'nin okuduğu her şey, istediğimiz hâliyle.
function repo({ deps = {}, installed = null, props, keystore = true, native = true,
                versionCode = 23, uploaded = undefined }) {
  const root = mkdtempSync(join(tmpdir(), 'guard-'));
  copyFileSync(SRC, join(root, 'build-aab.mjs'));
  writeFileSync(join(root, 'package.json'), JSON.stringify({ dependencies: deps }));
  writeFileSync(join(root, 'app-version.json'), JSON.stringify({
    fruithole: {
      versionCode, versionName: '1.8.3',
      ...(uploaded === undefined ? {} : { uploaded }),
    },
  }));

  // installed verilmezse bütün bağımlılıklar kurulmuş sayılıyor.
  for (const d of (installed === null ? Object.keys(deps) : installed)) {
    const dir = join(root, 'node_modules', ...d.split('/'));
    mkdirSync(dir, { recursive: true });
    // `capacitor` alanı olan paket bir eklenti — Capacitor'ın kendi ölçütü.
    writeFileSync(join(dir, 'package.json'),
      JSON.stringify({ name: d, ...(d.includes('capacitor') || d.includes('capgo')
        ? { capacitor: { android: {} } } : {}) }));
  }

  if (native) {
    mkdirSync(join(root, 'android-fruithole', 'app'), { recursive: true });
    // local.properties varsa SDK aranmıyor; bu testin konusu o değil.
    writeFileSync(join(root, 'android-fruithole', 'local.properties'), 'sdk.dir=/x\n');
    // Şablonun kendi satırları: sürüm yazımı bunları arıyor, yoksa derleme
    // daha o adımda duruyor ve sonraki kontroller hiç görülmüyor.
    writeFileSync(join(root, 'android-fruithole', 'app', 'build.gradle'),
      'android {\n  defaultConfig {\n    versionCode 1\n    versionName "1.0"\n  }\n}\n');
  }

  const ksPath = join(root, 'fake.jks');
  if (keystore) writeFileSync(ksPath, 'x'.repeat(2558));
  if (props !== false) {
    writeFileSync(join(root, 'keystore.properties'), (props || {
      storeFile: ksPath, storePassword: 'dogrusifre', keyAlias: 'fruithole', keyPassword: 'dogrusifre',
    }) === false ? '' : Object.entries(props || {
      storeFile: ksPath, storePassword: 'dogrusifre', keyAlias: 'fruithole', keyPassword: 'dogrusifre',
    }).map(([k, v]) => `${k}=${v}`).join('\n') + '\n');
  }
  return { root, ksPath };
}

function run(r) {
  const p = spawnSync('node', [join(r.root, 'build-aab.mjs')], {
    env: { ...process.env, APP: 'fruithole' }, encoding: 'utf8', timeout: 60000,
  });
  return { out: (p.stdout || '') + (p.stderr || ''), code: p.status };
}

const DEPS = {
  '@capacitor/core': '^8.5.0',
  '@capacitor-community/admob': '^8.1.0',
  '@capgo/native-purchases': '^8.7.0',
  '@modbender/capacitor-play-games': '^0.4.0',
};

// ---- 1: eklenti package.json'da var, node_modules'ta yok ----
// Gerçekte olan buydu. Eskiden derleme buradan sessizce geçiyordu.
console.log('\n1. kurulmamış eklenti');
{
  const kurulu = Object.keys(DEPS).filter(d => d !== '@modbender/capacitor-play-games');
  const r = run(repo({ deps: DEPS, installed: kurulu }));
  check(r.code === 1, 'derleme başlamadı', `çıkış ${r.code}`);
  check(/play-games/.test(r.out), 'eksik paketin adını söylüyor');
  check(/npm install/.test(r.out), 'ne yapılacağını söylüyor');
}

// ---- 2: hepsi kurulu ----
// Bu sefer geçmeli, ve kaç eklenti gördüğünü yazmalı: `cap sync`'in
// "Found N Capacitor plugins" satırıyla karşılaştırılacak sayı o.
console.log('\n2. hepsi kurulu');
{
  const r = run(repo({ deps: DEPS }));
  check(!/npm install/.test(r.out), 'bağımlılık uyarısı yok');
  check(/Capacitor eklentisi \(3\)/.test(r.out), 'üç eklenti sayıldı',
    (r.out.match(/Capacitor eklentisi.*/) || ['-'])[0]);
  check(/play-games/.test(r.out), 'liderlik eklentisi listede');
}

// ---- 3: altı karakterden kısa şifre ----
// keytool bu uzunlukta bir keystore oluşturmuyor, yani bu değer "yanlış
// olabilir" değil, kesinlikle yanlış.
console.log('\n3. kısa şifre');
{
  const r0 = repo({ deps: DEPS });
  const r = run(repo({
    deps: DEPS,
    props: { storeFile: r0.ksPath, storePassword: '9999', keyAlias: 'fruithole', keyPassword: '9999' },
  }));
  check(r.code === 1, 'derleme başlamadı', `çıkış ${r.code}`);
  check(/storePassword/.test(r.out), 'hangi alan olduğunu söylüyor');
  check(/6 karakter/.test(r.out), 'sebebini söylüyor');
}

// ---- 4: keyPassword kısa, storePassword uzun ----
// İkisi ayrı ayrı kontrol edilmeli; Gradle'ın hatası ("Failed to read key")
// zaten hangisi olduğunu söylemiyordu.
console.log('\n4. yalnızca keyPassword kısa');
{
  const r0 = repo({ deps: DEPS });
  const r = run(repo({
    deps: DEPS,
    props: { storeFile: r0.ksPath, storePassword: 'dogrusifre', keyAlias: 'fruithole', keyPassword: '123' },
  }));
  check(r.code === 1, 'derleme başlamadı');
  check(/keyPassword/.test(r.out), 'keyPassword olduğunu söylüyor',
    (r.out.match(/keystore\.properties → \w+/) || ['-'])[0]);
}

// ---- 5: keystore dosyası yok ----
console.log('\n5. keystore dosyası kayıp');
{
  const r = run(repo({ deps: DEPS, keystore: false }));
  check(r.code === 1, 'derleme başlamadı');
  check(/keystore bulunamadı/.test(r.out), 'yolu söylüyor');
}

// ---- 6: eksik alan ----
console.log('\n6. keystore.properties eksik alan');
{
  const r0 = repo({ deps: DEPS });
  const r = run(repo({ deps: DEPS, props: { storeFile: r0.ksPath, storePassword: 'dogrusifre' } }));
  check(r.code === 1, 'derleme başlamadı');
  check(/keyAlias/.test(r.out) && /keyPassword/.test(r.out), 'eksik alanları sayıyor',
    (r.out.match(/eksik alan.*/) || ['-'])[0]);
}

// ---- 7: zaten yüklenmiş versionCode ----
console.log('\n7. harcanmış versionCode');
{
  // Bu, depoda kayıt tutulmadığı için iki kez olan şeyin testi: 25 ve 27
  // yüklenmişti, sonraki derleme aynı numarayla çıktı, ve hata ancak Play'in
  // yükleme kutusunda — dakikalarca süren bir derlemeden sonra — görüldü.
  //
  // Eskiden buradaki tek koruma git'e bakan bir tahmindi ve **durdurmuyordu**,
  // yalnızca uyarıyordu. Artık kayıt var ve derleme hiç başlamıyor.
  const r = run(repo({ deps: DEPS, versionCode: 27, uploaded: [21, 25, 27] }));
  check(r.code === 1, 'derleme başlamadı');
  check(/zaten Play'e yüklenmiş/.test(r.out), 'sebebini söylüyor');
  check(/28/.test(r.out), 'sıradaki numarayı söylüyor',
    (r.out.match(/versionCode -> \d+/) || ['-'])[0]);
}

console.log('\n8. temiz versionCode geçiyor');
{
  // Liste varken temiz bir numara engellenmemeli — koruma yalnızca harcanmış
  // olanı durduruyor. Derleme Gradle'a kadar gidip orada düşüyor (bu sahte
  // depoda gradlew yok), yani sürüm kontrolünü geçtiği buradan anlaşılıyor.
  const r = run(repo({ deps: DEPS, versionCode: 28, uploaded: [21, 25, 27] }));
  check(!/zaten Play'e yüklenmiş/.test(r.out), 'sürüm kontrolüne takılmadı');
  check(/Yüklenmiş kodlar: 21, 25, 27/.test(r.out), 'yüklenenleri yine de yazıyor');
}

console.log('\n9. liste yokken eski davranış');
{
  // `uploaded` alanı olmayan bir dosya (öteki uygulamalar, ve depo
  // güncellenmeden önceki hâli) hâlâ derlenebilmeli.
  const r = run(repo({ deps: DEPS, versionCode: 23 }));
  check(!/zaten Play'e yüklenmiş/.test(r.out), 'liste yoksa engellemiyor');
  check(!/Yüklenmiş kodlar/.test(r.out), 'boş liste için satır yazmıyor');
}

console.log(fails.length ? `\n${fails.length} kontrol düştü` : '\nhepsi geçti');
process.exit(fails.length ? 1 : 0);
