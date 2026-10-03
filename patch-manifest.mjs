#!/usr/bin/env node
// AdMob'un App ID'sini ve faturalandırma iznini native projenin
// AndroidManifest.xml'ine yazar.
//
// Bu satırlar olmadan uygulama açılır açılmaz çöküyor (AdMob) ya da satın
// alma hiç başlamıyor (faturalandırma); ama manifest `cap add` ile
// üretildiği için native proje her yeniden oluşturulduğunda kayboluyor.
// Elle eklemeyi hatırlamak yerine sync'in parçası yapıyoruz — idempotent,
// zaten varsa dokunmuyor.
//
// Faturalandırma izni: Play Billing kitaplığının kendi manifest'i de bu izni
// bildiriyor ve birleştirici onu zaten ekliyor olmalı, ama eklentinin kendi
// AndroidManifest.xml'i bomboş ve iznin gelip gelmediği ancak derlenmiş
// paketi açıp bakarak görülüyor. İki kez bildirilmesi zararsız (birleştirici
// tekilleştiriyor), hiç bildirilmemesi ise satın almanın sessizce
// çalışmaması demek.
//
//   node patch-manifest.mjs            (APP değişkenine göre hedefi seçer)

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = dirname(fileURLToPath(import.meta.url));

const APPS = {
  hole: {
    dir: 'android',
    appId: 'ca-app-pub-2542927456156553~3347511713',   // Hole'un AdMob App ID'si
  },
  fruithole: {
    dir: 'android-fruithole',
    appId: 'ca-app-pub-2542927456156553~4653695871',
    // Uygulama içi satın alma yalnızca burada var.
    billing: true,
    // Play Games Services proje kimliği (Play Console → Play Oyun
    // Hizmetleri → Yapılandırma → "Proje Kimliği").
    gamesId: '501004425745',
  },
  // Yeni oyunların kendi AdMob uygulamaları henüz açılmadı. Google'ın
  // herkese açık test App ID'si kullanılıyor: gerçek reklam göstermiyor
  // ama manifest'te bir kimlik olmadan uygulama açılışta çöküyor.
  // AdMob'da uygulama açınca buradaki değeri değiştirmek yeterli.
  slicer: {
    dir: 'android-slicer',
    appId: 'ca-app-pub-3940256099942544~3347511713',
  },
  tycoon: {
    dir: 'android-tycoon',
    appId: 'ca-app-pub-3940256099942544~3347511713',
  },
};

// dev sürümünün ekranda görünen adı. `capacitor.config.js` bunu zaten
// biliyor ama o dosya Capacitor'ün formatında; burada tek bir satırlık
// karşılık yeterli.
const APP_LABEL = { hole: 'Hole', fruithole: 'Fruit Hole',
                    slicer: 'Slice Rush', tycoon: 'Motor Works' };

const app = APPS[process.env.APP || 'hole'];
if (!app) {
  console.error(`Bilinmeyen APP="${process.env.APP}"`);
  process.exit(1);
}

const manifest = join(ROOT, app.dir, 'app', 'src', 'main', 'AndroidManifest.xml');
if (!existsSync(manifest)) {
  console.log(`${app.dir} henüz yok, manifest atlandı.`);
  process.exit(0);
}

let xml = readFileSync(manifest, 'utf8');
let changed = false;

// --- Play Games Services proje kimliği ---
//
// Play Games bu meta-data'yı manifest'te **zorunlu** tutuyor. Yoksa giriş
// sessizce başarısız oluyor: hesap seçme ekranı hiç açılmıyor, eklenti
// `{"signedIn":false}` dönüyor, durum kodu 4 (SIGN_IN_REQUIRED) — yani
// "oyuncu giriş yapmadı" diyor, "kurulum eksik" demiyor. Belirti, hesabın
// test listesinde olmamasıyla birebir aynı görünüyor ve günlerce oraya
// bakıldı.
//
// Eklentinin (`@modbender/capacitor-play-games`) kendi manifest'i bomboş:
//
//   <manifest xmlns:android="..." />
//
// Yani bu satırı koyacak başka kimse yok. `leaderboard-setup.md` adım 5
// "eklenti kendi manifest'inde tanımlıyorsa gerekmiyor" diyordu — tanımlamıyor.
//
// Değer doğrudan sayı olarak yazılamıyor: Android bunu tam sayı sanıp
// kırpıyor ve kimlik bozuluyor. Bu yüzden bir dize kaynağına yazılıp ona
// referans veriliyor — Google'ın kendi belgesi de böyle söylüyor.
if (app.gamesId) {
  const strings = join(ROOT, app.dir, 'app', 'src', 'main', 'res', 'values', 'strings.xml');
  if (existsSync(strings)) {
    let s = readFileSync(strings, 'utf8');
    const satir = `    <string name="game_services_project_id">${app.gamesId}</string>`;
    if (!s.includes('game_services_project_id')) {
      s = s.replace('</resources>', `${satir}\n</resources>`);
      writeFileSync(strings, s);
      console.log(`Play Games proje kimliği strings.xml'e yazıldı (${app.gamesId}).`);
    } else if (!s.includes(`>${app.gamesId}<`)) {
      s = s.replace(/<string name="game_services_project_id">[^<]*<\/string>/,
        `<string name="game_services_project_id">${app.gamesId}</string>`);
      writeFileSync(strings, s);
      console.log('Play Games proje kimliği güncellendi.');
    } else {
      console.log('Play Games proje kimliği zaten yerinde.');
    }
  } else {
    console.error(`HATA: ${strings} yok, Play Games kimliği yazılamadı.`);
    process.exit(1);
  }

  if (!xml.includes('com.google.android.gms.games.APP_ID')) {
    if (!xml.includes('</application>')) {
      console.error('HATA: manifest içinde </application> yok, beklenmeyen biçim.');
      process.exit(1);
    }
    const blok =
      `\n        <meta-data\n` +
      `            android:name="com.google.android.gms.games.APP_ID"\n` +
      `            android:value="@string/game_services_project_id" />\n`;
    xml = xml.replace('</application>', `${blok}    </application>`);
    changed = true;
    console.log(`Play Games APP_ID meta-data eklendi -> ${app.dir}`);
  } else {
    console.log('Play Games APP_ID meta-data zaten yerinde.');
  }
}

// --- faturalandırma izni ---
const BILLING = '<uses-permission android:name="com.android.vending.BILLING" />';
if (app.billing && !xml.includes('com.android.vending.BILLING')) {
  if (!xml.includes('<application')) {
    console.error('HATA: manifest içinde <application yok, beklenmeyen biçim.');
    process.exit(1);
  }
  xml = xml.replace('<application', `    ${BILLING}\n\n    <application`);
  changed = true;
  console.log(`Faturalandırma izni eklendi -> ${app.dir}`);
}

// --- AdMob App ID ---
if (xml.includes('com.google.android.gms.ads.APPLICATION_ID')) {
  // Kimlik değişmişse güncelle, aynıysa hiç dokunma.
  const current = xml.match(/APPLICATION_ID"\s*\n?\s*android:value="([^"]+)"/);
  if (current && current[1] === app.appId) {
    console.log('AdMob App ID zaten yerinde.');
  } else {
    xml = xml.replace(/android:value="ca-app-pub-[^"]*"/, `android:value="${app.appId}"`);
    changed = true;
    console.log('AdMob App ID güncellendi.');
  }
} else {
  if (!xml.includes('</application>')) {
    console.error('HATA: manifest içinde </application> yok, beklenmeyen biçim.');
    process.exit(1);
  }
  const block =
    `\n        <meta-data\n` +
    `            android:name="com.google.android.gms.ads.APPLICATION_ID"\n` +
    `            android:value="${app.appId}" />\n`;
  xml = xml.replace('</application>', `${block}    </application>`);
  changed = true;
  console.log(`AdMob App ID eklendi -> ${app.dir}`);
}

// --- yan yana kurulabilen "dev" sürümü ---
//
// Telefonda Play'den kurulu bir sürüm varken aynı paketi elle kurmak mümkün
// değil: paket adı aynı, imza farklı (Play'deki Google'ın imzasıyla, bizimki
// yükleme anahtarıyla) ve Android bunu reddediyor. Kaan'ın telefonunda tam
// olarak bu oldu.
//
// Play'dekini silmek de bir seçenek değil — kapalı testin 14 günlük sayacı
// dönerken uygulamayı kaldırıp takmak, hiç almaya değmeyecek bir risk.
//
// Çözüm hata ayıklama derlemesine ayrı bir kimlik vermek: `.dev` ekiyle paket
// adı başkalaşıyor, yani Android için başka bir uygulama oluyor ve yan yana
// duruyorlar. İmza da hata ayıklama anahtarı, yani çakışacak bir şey yok.
//
// Adı da ayrışıyor: `src/debug` kaynak kümesindeki bir dize, ana kümedekini
// **eziyor** (çoğaltmıyor — çoğaltsaydı derleme "duplicate resource" derdi).
// İki aynı simge, ikisi de "Fruit Hole" yazan, hangisinin hangisi olduğu
// belli olmayan bir telefon, hatanın kendisinden daha kötü.
{
  const gradle = join(ROOT, app.dir, 'app', 'build.gradle');
  if (existsSync(gradle)) {
    let g = readFileSync(gradle, 'utf8');
    // Capacitor'ün bazı sürümleri `debug` bloğunu kendisi üretiyor. İkinci bir
    // tane eklemek Gradle'ı "duplicate build type" ile düşürürdü, o yüzden
    // varsa içine yazılıyor, yoksa yeni bir tane açılıyor.
    const ekler = '            applicationIdSuffix ".dev"\n' +
                  '            versionNameSuffix "-dev"\n';
    const varOlanDebug = /(buildTypes\s*\{[\s\S]*?\bdebug\s*\{)/;
    if (g.includes('applicationIdSuffix')) {
      console.log('dev derlemesi zaten tanımlı.');
    } else if (!g.includes('buildTypes {')) {
      console.error('HATA: build.gradle içinde buildTypes yok, beklenmeyen biçim.');
      process.exit(1);
    } else if (varOlanDebug.test(g)) {
      g = g.replace(varOlanDebug, `$1\n${ekler}`);
      writeFileSync(gradle, g);
      console.log(`dev derlemesi var olan debug bloğuna yazıldı -> ${app.dir}`);
    } else {
      const blok =
        'buildTypes {\n' +
        '        debug {\n' + ekler +
        '        }';
      g = g.replace('buildTypes {', blok);
      writeFileSync(gradle, g);
      console.log(`dev derlemesi tanımlandı (.dev eki) -> ${app.dir}`);
    }
  }

  const devDir = join(ROOT, app.dir, 'app', 'src', 'debug', 'res', 'values');
  const devStrings = join(devDir, 'strings.xml');
  if (existsSync(join(ROOT, app.dir, 'app', 'src', 'main'))) {
    const ad = (APP_LABEL[process.env.APP || 'hole'] || 'App') + ' DEV';
    const istenen =
      '<?xml version=\'1.0\' encoding=\'utf-8\'?>\n' +
      '<resources>\n' +
      `    <string name="app_name">${ad}</string>\n` +
      `    <string name="title_activity_main">${ad}</string>\n` +
      '</resources>\n';
    if (!existsSync(devStrings) || readFileSync(devStrings, 'utf8') !== istenen) {
      mkdirSync(devDir, { recursive: true });
      writeFileSync(devStrings, istenen);
      console.log(`dev sürümünün adı yazıldı: ${ad}`);
    } else {
      console.log('dev sürümünün adı zaten yerinde.');
    }
  }
}

if (changed) writeFileSync(manifest, xml);
else console.log('Manifest zaten güncel.');
