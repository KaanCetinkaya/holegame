# Android build — kontrol listesi ve karşılaşılan hatalar

Bu dosya, Fruit Hole'u ilk kez Play'e yüklerken **gerçekten çıkan** hataları
ve çözümlerini tutuyor. Çoğu artık otomatik hallediliyor; kalanlar burada.

---

## Normal akış (her yeni sürüm için)

```bash
git pull
# app-version.json içindeki versionCode'u 1 artır
npm run aab:fruithole
```

Bu tek komut şunları yapıyor:

1. `www-fruithole/`'u kaynak HTML'den üretir (CDN → yerel Three.js)
2. Capacitor sync
3. AdMob App ID'sini manifeste yazar
4. `app-version.json`'daki sürümü `build.gradle`'a yazar
5. `keystore.properties`'ten imza yapılandırmasını enjekte eder
6. Uygun JDK'yı bulur (Java 21-24) ve `bundleRelease` çalıştırır
7. `.aab`'nin tam yolunu basar

Çıktı: `android-fruithole/app/build/outputs/bundle/release/app-release.aab`

**Android Studio'ya girmeye gerek yok.**

---

## Telefonda denemek (Play'e uğramadan)

`.aab` **telefona kurulamaz** — o sadece Play'e yüklenen paket biçimi.
Cihazda denemek için `.apk` gerekiyor:

```bash
npm run apk:fruithole
```

Çıktı: `android-fruithole/app/build/outputs/apk/release/app-release.apk`

Telefona geçirmenin en kolay yolu **kablo değil**, aynı Wi-Fi:

```bash
npm run send:fruithole
```

Ekrana `http://192.168.x.x:8787` gibi bir adres yazıyor. Telefonun
tarayıcısına onu yaz, düğmeye bas, APK iniyor. Windows ilk seferde güvenlik
duvarı izni sorarsa "İzin ver" de. İşin bitince Ctrl+C.

> Bunun için kendi küçük sunucumuz var (`serve-apk.mjs`), çünkü tarayıcının
> `.apk`'yı kurulabilir dosya sayması için doğru MIME türüyle
> (`application/vnd.android.package-archive`) sunulması gerekiyor —
> sıradan bir dosya sunucusu onu `.zip` diye indiriyor.

USB kablo / WhatsApp "Kendine mesaj" / Drive de olur. Aynı keystore ile
imzalı, yani Play'den gelen sürümle **aynı** uygulama sayılır.

> Play'den gelen sürüm zaten kuruluysa APK "uygulama yüklenemedi" diyebilir.
> Önce Play sürümünü kaldır, ya da tersi.

Alternatif (Play üzerinden): Play Console → Test etme → Dahili test →
**Test kullanıcıları** sekmesi → e-postanı listeye ekle → **"Web'de katılın"**
linkini telefondan aç.

---

## İlk kurulumda bir kez yapılacaklar

| Ne | Nasıl |
|---|---|
| Node.js | nodejs.org → LTS |
| Android Studio | developer.android.com/studio (SDK için; IDE'yi kullanmıyoruz) |
| Bağımlılıklar | `npm install` |
| Native proje | `npm run add:fruithole` |
| İkon/splash | `npm run assets:fruithole` |
| Keystore | Android Studio → Generate Signed Bundle → Create new, **ya da** `keytool` |
| `keystore.properties` | depo kökünde, aşağıdaki biçimde (git'e girmez) |
| Gizlilik politikası | GitHub → Settings → Pages → Source: `/docs` (aşağı bak) |

> Diğer oyunlar için aynısı: `add:slicer` / `assets:slicer`,
> `add:tycoon` / `assets:tycoon`, `add:hole` / `assets:hole`. Keystore ve
> `keystore.properties` ortak — tek anahtar dört uygulamayı da imzalıyor.

```properties
storeFile=C:/Users/HP/Desktop/fruithole-key.jks
storePassword=SIFREN
keyAlias=fruithole
keyPassword=SIFREN
```

> Yolda **düz `/`** kullan. `.jks` dosyasını ve şifreyi ayrı yerlere yedekle —
> kaybolursa uygulama bir daha güncellenemez.

### Gizlilik politikasını yayınlama (bir kez)

Reklam olduğu için Play, politikanın **açık bir adreste** durmasını istiyor.
Dosya depoda `docs/privacy.html`; depo herkese açık olduğu için
GitHub Pages bedava yayınlıyor:

GitHub → **Settings → Pages** → Source: **Deploy from a branch** →
Branch: `claude/game-development-continue-awblv7`, klasör: **`/docs`** → Save.

Birkaç dakika sonra adres hazır:

```
https://kaancetinkaya.github.io/holegame/privacy.html
```

Bunu Play Console → Uygulama içeriği → **Gizlilik politikası** alanına yaz.

---

## Çıkan hatalar ve çözümleri

### 1. "hedeflemesi gereken en düşük API düzeyi 35"
Play, yeni yüklemelerin güncel bir API düzeyini hedeflemesini şart koşuyor ve
barajı her yıl (genelde 31 Ağustos) yükseltiyor. Capacitor 6 **34'te sabitti**.

**Çözüm:** Capacitor 8'e yükseltildi (varsayılan 36). Native proje eski
sürümle üretilmişse **sil ve yeniden oluştur**, yoksa eski ayarlar kalır:
```bash
Remove-Item -Recurse -Force android-fruithole
npm run add:fruithole
```

**Ders:** Build almadan önce Play'in güncel baraj seviyesini kontrol et.

### 2. "Version code 1 has already been used"
Play bir versionCode'u ilk yüklemede tüketiyor; aynısı bir daha kabul
edilmiyor — sürüm yayınlanmamış olsa bile. Capacitor şablonu her seferinde
`versionCode 1` ile geliyor ve native proje yeniden üretilince sıfırlanıyor.

**Çözüm:** Numara `app-version.json`'da tutuluyor, build sırasında yazılıyor.
Yeni `.aab` yükleyeceğin her seferde **elle 1 artır**.

### 3. "Incompatible Gradle JVM version 25"
Gradle 8.14, Java 25'i kabul etmiyor (en fazla 24).

### 4. "invalid source release: 21"
Capacitor 8, Java **21** ile derleniyor; JDK 17 ile olmuyor.

**3 ve 4 birlikte:** Resmî aralık **Java 21-24**. Build script'i
`JAVA_HOME`, Android Studio'nun `jbr` klasörü, `~/.jdks` ve `/usr/lib/jvm`
altını tarayıp uygun JDK'yı yalnızca o build için kullanıyor.

Aralıkta bir şey yoksa daha yenisiyle deniyor ama **bu genelde çalışmıyor**:
Java 25 ile Gradle build script'ini bile derleyemiyor
(`Unsupported class file major version 69`). Android Studio'nun kendi JDK'sı
25 ise adoptium.net/temurin'den **JDK 21** kur — script kuruluysa onu tercih
eder, elle bir şey yapmana gerek kalmaz.

### 5. "Android platform not found at .../android"
`@capacitor/assets`, `capacitor.config.js`'i **okumuyor**; iki uygulamalı
kurulumda varsayılan `android/` klasörüne bakıyor.

**Çözüm:** `--androidProject android-fruithole` bayrağı script'e eklendi.

### 6. Uygulama açılır açılmaz çöküyor
AdMob App ID manifestte yoksa Google Mobile Ads SDK başlatılamıyor.
Manifest üretilen bir dosya olduğu için native proje her yeniden
oluşturulduğunda bu satır kayboluyor.

**Çözüm:** `patch-manifest.mjs` bunu `add:*` ve `sync:*` sırasında yazıyor.

### 7. Windows'ta `bash: command not found` / `APP=... tanınmıyor`
`APP=x komut` sözdizimi ve `bash script.sh` PowerShell'de çalışmıyor.

**Çözüm:** Build script'i Node'a taşındı, ortam değişkeni `cross-env` ile
veriliyor. Bütün komutlar `npm run ...` üzerinden.

### 8. Android Studio "Cannot detect a launch configuration"
Kurulum bozulmuştu; üzerine yeniden kurmak çözdü. Ayrıca `npx cap open`
eski kurulumun yolunu çağırıyordu.

**Çözüm:** IDE artık akışın parçası değil — `npm run aab:fruithole` yeterli.

---

## Yayına çıkmadan önce

- [ ] `fruithole/index.html` içinde `ADS_TESTING = false` yap
      (kendi reklamına tıklamak AdMob hesabını kapattırır; test ederken `true` kalmalı)
- [ ] `app-version.json` → `versionCode` artırıldı mı
- [ ] "Yenilikler" metni yazıldı mı — Play her yüklemede istiyor, mağaza
      açıklamasından ayrı bir alan. Hazırı: `fruithole/store/listing-en.md`
      → "What's new" bölümü (İngilizce + Türkçe)
- [ ] Gizlilik politikası bir adreste yayınlandı mı (reklam olduğu için zorunlu)
- [ ] Play Console'da 4 uygulama içi ürün oluşturuldu mu
      (`fruithole_remove_ads`, `fruithole_starter`, `fruithole_pack_small`, `fruithole_pack_large`)
- [ ] Ödeme SDK'sı bağlandı mı (`purchase()` / `restorePurchases()`)

---

## Bilgisayarsız sürüm çıkarmak (GitHub Actions)

`.aab` üretmek normalde Node + Gradle + JDK + imzalama anahtarı ister, yani
bir bilgisayar. `.github/workflows/build-aab.yml` bunu GitHub'ın makinesinde
yapıyor; telefondan tetikleyip çıkan dosyayı indirebilirsin.

### Bir kereye mahsus kurulum

Anahtarı base64'e çevir (kendi bilgisayarında, bir kez):

```bash
# macOS / Linux
base64 -i fruithole-key.jks | tr -d '\n' > key.txt

# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("fruithole-key.jks")) > key.txt
```

`key.txt` içindekini GitHub'a gizli değer olarak ekle:
**Settings → Secrets and variables → Actions → New repository secret**

| Ad | Değer |
|---|---|
| `KEYSTORE_BASE64` | `key.txt` içeriği |
| `KEYSTORE_PASSWORD` | anahtar deposu şifresi |
| `KEY_ALIAS` | takma ad (ör. `fruithole`) |
| `KEY_PASSWORD` | anahtar şifresi (çoğu zaman aynısı) |

Bittikten sonra `key.txt`'yi sil. Anahtarın kendisi depoya **girmez**.

### Her sürümde

1. GitHub'da depoyu aç → **Actions** → **Build signed bundle**
2. **Run workflow**: uygulama (`fruithole`), biçim (`aab`), istersen
   versionCode'u elle gir (boş bırakırsan `app-version.json`'daki kullanılır)
3. 5-10 dakika bekle
4. Çalışmanın sayfasındaki **Artifacts** altından `fruithole-1.1-6.aab`'yi indir
5. Play Console → Kapalı test → yeni sürüm → dosyayı yükle

Telefondan da aynı adımlar; Play Console'da yükleme için Chrome'da
"Masaüstü sitesi"ni açmak işi kolaylaştırıyor.

`apk` seçersen imzası aynı ama telefona doğrudan kurulabilen dosya çıkar —
Play'e yüklenmez, elde denemek içindir.

**Anahtarı kaybetme.** GitHub secret'ı bir yedek değil; oradan geri okunamaz.
Uygulamayı bir daha güncelleyebilmenin tek yolu o `.jks` dosyası.

---

## Play Console kısayolları (Fruit Hole)

Console adresleri geliştirici ve uygulama kimliğini içeriyor, o yüzden menüde
aramak yerine buradan:

| Sayfa | Bağlantı |
|---|---|
| Test kullanıcıları | [tracks/…?tab=testers](https://play.google.com/console/u/2/developers/5308536581047917243/app/4976403972530837161/tracks/4699802296034577937?tab=testers) |
| Sürümler | [tracks/…?tab=releases](https://play.google.com/console/u/2/developers/5308536581047917243/app/4976403972530837161/tracks/4699802296034577937?tab=releases) |

Kimlikler: geliştirici `5308536581047917243`, uygulama `4976403972530837161`,
kapalı test parkuru (Alpha) `4699802296034577937`. Bunlar gizli değil —
Console'u açtığında adres çubuğunda zaten görünüyorlar.

Tester bağlantıları:

- Grup: https://groups.google.com/g/fruit-hole-testers
- Opt-in: https://play.google.com/apps/testing/com.kaancetinkaya.fruithole

**Grup üyesi sayısı ile Play'in saydığı tester sayısı aynı şey değil.** Play,
gruba katılmış *ve* opt-in linkinden "Become a tester" demiş kişileri sayıyor;
gruba girip linki açmayan biri grupta görünür, sayaçta görünmez.
