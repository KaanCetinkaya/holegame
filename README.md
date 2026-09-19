# Hole

Bu depo **iki ayrı oyun** barındırıyor. İkisi de tek dosyalık Three.js oyunu; tarayıcıda oynanır, Capacitor ile ayrı Android uygulamalarına paketlenir.

| Oyun | Kaynak | Build klasörü | appId |
|---|---|---|---|
| **Hole** | `index.html` | `www/` | `com.kaancetinkaya.hole` |
| **Fruit Hole** | `fruithole/index.html` | `www-fruithole/` | `com.kaancetinkaya.fruithole` |

**Hole** — Rapier fizikli, şehri yutan klasik delik oyunu.
**Fruit Hole** — meyve tarlasında süreye karşı, parmakla sürüklenen ve yuttukça büyüyen delik. Ayrıntı: [`fruithole/README.md`](fruithole/README.md).

## Yapı

- **`index.html`** — Hole'un tamamı (tek dosya). Kütüphaneleri CDN'den (esm.sh) çeker. Geliştirme/test için: çift tıkla, tarayıcıda açılır (internet gerekir).
- **`fruithole/index.html`** — Fruit Hole'un tamamı (tek dosya), yine CDN'li.
- **`www/`** — Hole'un uygulama build'i. Three.js + Rapier **yerel dosyalara gömülü** (internetsiz çalışır).
  - `www/index.html`, `www/three.module.js`, `www/rapier.es.js`
- **`www-fruithole/`** — Fruit Hole'un uygulama build'i (`three.module.js` build sırasında `www/`'den kopyalanır, bu yüzden git'e girmez).
- **`capacitor.config.js`**, **`package.json`**, **`build-www.mjs`** — paketleme yapılandırması.

> Oyunu değiştirdikten sonra ilgili kaynak dosyayı düzenle, sonra `npm run build:www` ile **iki** build klasörünü birden yenile.

## Hangi uygulama paketleniyor?

Capacitor kök dizindeki tek bir config dosyası okur ve `sync`/`copy` için bir
`--config` bayrağı **yoktur**. Bu yüzden hedefi `APP` ortam değişkeni seçer
(`capacitor.config.js`), her uygulamanın native projesi de kendi klasöründe durur:

Hazır komutlar var; hepsi Windows/macOS/Linux'ta aynı şekilde çalışır
(`cross-env` sayesinde, `APP=...` yazmana gerek yok):

```bash
npm run add:fruithole      # native projeyi oluştur  -> android-fruithole/
npm run sync:fruithole     # www'yu üret + native'e kopyala
npm run open:fruithole     # Android Studio'da aç
npm run assets:fruithole   # ikon + splash üret
```

Hole için aynıları: `add:hole`, `sync:hole`, `open:hole`.

Elle çalıştırmak istersen değişken şöyle (bash):
`APP=fruithole npx cap sync android`

## Tarayıcıda çalıştırma

`index.html`'e çift tıkla (veya bir statik sunucuyla aç). CDN'den kütüphane çeker, internet gerekir.

## Android (Play Store) build

Gereksinimler: **Node.js**, **Android Studio** (Android SDK), **Google Play Developer hesabı** ($25 tek seferlik).

> **Capacitor 8** kullanılıyor; varsayılan hedef API düzeyi **36**. Google
> Play yeni yüklemelerde en az **35** istiyor, Capacitor 6 ise 34'te
> kalıyordu — bu yüzden 6'dan yükseltildi. Native proje (`android/`,
> `android-fruithole/`) Capacitor 6 ile üretilmişse **silip yeniden
> oluştur**, yoksa eski SDK ayarları kalır.

```bash
# 1) Bağımlılıkları kur
npm install

# 2) www/ HTML'ini kök index.html'den yenile
npm run build:www

# 3) Capacitor'ı başlat (sadece ilk sefer)
npm run add:hole

# 4) Web içeriğini native projeye kopyala
npm run sync:hole

# 5) Android Studio'da aç
npm run open:hole
```

Android Studio'da:
- **Build > Generate Signed Bundle / APK > Android App Bundle** ile imzalı `.aab` üret.
- İlk seferde bir **keystore** oluştur ve **güvenli sakla** (kaybolursa uygulamayı güncelleyemezsin).

## Play Console

1. Uygulama oluştur; paket adı = `capacitor.config.js` içindeki `appId`.
   - **Önemli:** `appId`'yi (şu an `com.kaancetinkaya.hole`) ilk yüklemeden önce kendi adınla değiştir; yayınlandıktan sonra değişmez.
2. `.aab` yükle: İç test → Kapalı test → Üretim.
3. Gerekenler: gizlilik politikası URL'si (reklam eklenirse zorunlu), içerik derecelendirme anketi, veri güvenliği formu, mağaza görselleri (ikon 512×512, feature grafiği 1024×500, ≥2 ekran görüntüsü), açıklama.

## Reklam (AdMob)

> Aşağısı **Hole** içindir. Fruit Hole'un kendi reklam kancaları
> `fruithole/index.html` içindedir ve **kendi AdMob birimlerini** ister
> (Hole'unkiler başka bir uygulamaya ait olduğu için orada kullanılamaz);
> ayrıntı: [`fruithole/README.md`](fruithole/README.md).

Reklam kodu oyunda **hazır ve bağlı** (`index.html` içindeki `AD_UNITS`, `showRewarded`, `showInterstitial`):
- "2× Coin" butonu → **rewarded** reklam (izlenince ödül verilir)
- Her 2 level'da bir ve başarısızlıkta → **interstitial** ara reklam
- Tarayıcıda reklam **no-op**'tur (oyun aynı çalışır); sadece native uygulamada gösterilir.

Şu an **Google resmi TEST reklam ID'leri** kullanılıyor — geliştirmede güvenle çalışır.

Kurulum (Android):
```bash
npm install                 # @capacitor-community/admob dahil
npx cap sync
```
`android/app/src/main/AndroidManifest.xml` içinde `<application>` etiketine AdMob App ID ekle:
```xml
<meta-data
  android:name="com.google.android.gms.ads.APPLICATION_ID"
  android:value="ca-app-pub-3940256099942544~3347511713"/>
```

**Yayına çıkmadan önce** (kendi AdMob hesabınla):
1. AdMob'da uygulama + reklam birimleri (rewarded, interstitial) oluştur.
2. Yukarıdaki manifest App ID'sini kendi **App ID**'nle değiştir.
3. `index.html` içindeki `AD_UNITS.rewarded` ve `AD_UNITS.interstitial` değerlerini kendi **reklam birimi ID**'lerinle değiştir, sonra `npm run build:www && npx cap sync`.
4. Reklam varsa Play Console'da **gizlilik politikası** ve **veri güvenliği** formu zorunlu.

## İkon & Splash

Kaynak görseller `assets/` klasöründe hazır (delik temalı):
`icon-only.png`, `icon-foreground.png`, `icon-background.png` (1024×1024),
`splash.png`, `splash-dark.png` (2732×2732).

Tüm platform ikon/splash boyutlarını üretmek için (android eklendikten sonra):
```bash
npx @capacitor/assets generate --android
```
Bu, `assets/`'tan Android ikonlarını (adaptive dahil) ve splash ekranlarını
`android/` projesine yazar. Görseli değiştirmek istersen `assets/` içindeki
PNG'leri değiştirip komutu tekrar çalıştır.

## Mağaza görselleri (Play Console listesi)

`store/` klasöründe hazır:
- `feature-1024x500.png` — feature grafiği (liste başındaki banner, zorunlu)
- `1-home.png … 5-gold.png` — telefon ekran görüntüleri (1080×1920), gerçek oynanış

Play Console'da: en az 2 ekran görüntüsü + feature grafiği + 512×512 ikon
(ikon `@capacitor/assets` çıktısından veya `assets/icon-only.png`'den) yükle.

## Sonraki adımlar (opsiyonel)

- **Banner reklam**, günlük ödül, daha çok skin, level haritası vb.
