# Hole

Tek dosyalık Three.js + Rapier "hole" oyunu. Tarayıcıda oynanır; Capacitor ile Android (Play Store) uygulamasına paketlenir.

## Yapı

- **`index.html`** — Oyunun tamamı (tek dosya). Kütüphaneleri CDN'den (esm.sh) çeker. Geliştirme/test için: çift tıkla, tarayıcıda açılır (internet gerekir).
- **`www/`** — Uygulama build'i. Aynı oyun ama Three.js + Rapier **yerel dosyalara gömülü** (internetsiz çalışır). Capacitor bu klasörü paketler.
  - `www/index.html`, `www/three.module.js`, `www/rapier.es.js`
- **`capacitor.config.json`**, **`package.json`**, **`build-www.sh`** — paketleme yapılandırması.

> Oyunu değiştirdikten sonra `index.html`'i düzenle, sonra `npm run build:www` ile `www/index.html`'i yenile.

## Tarayıcıda çalıştırma

`index.html`'e çift tıkla (veya bir statik sunucuyla aç). CDN'den kütüphane çeker, internet gerekir.

## Android (Play Store) build

Gereksinimler: **Node.js**, **Android Studio** (Android SDK), **Google Play Developer hesabı** ($25 tek seferlik).

```bash
# 1) Bağımlılıkları kur
npm install

# 2) www/ HTML'ini kök index.html'den yenile (opsiyonel; ilk seferde www hazır)
npm run build:www

# 3) Capacitor'ı başlat (sadece ilk sefer — capacitor.config.json zaten var)
npx cap add android

# 4) Web içeriğini native projeye kopyala
npx cap sync

# 5) Android Studio'da aç
npx cap open android
```

Android Studio'da:
- **Build > Generate Signed Bundle / APK > Android App Bundle** ile imzalı `.aab` üret.
- İlk seferde bir **keystore** oluştur ve **güvenli sakla** (kaybolursa uygulamayı güncelleyemezsin).

## Play Console

1. Uygulama oluştur; paket adı = `capacitor.config.json` içindeki `appId`.
   - **Önemli:** `appId`'yi (şu an `com.kaancetinkaya.hole`) ilk yüklemeden önce kendi adınla değiştir; yayınlandıktan sonra değişmez.
2. `.aab` yükle: İç test → Kapalı test → Üretim.
3. Gerekenler: gizlilik politikası URL'si (reklam eklenirse zorunlu), içerik derecelendirme anketi, veri güvenliği formu, mağaza görselleri (ikon 512×512, feature grafiği 1024×500, ≥2 ekran görüntüsü), açıklama.

## Reklam (AdMob)

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
