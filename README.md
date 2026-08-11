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

## Sonraki adımlar (opsiyonel)

- **İkon/Splash:** `@capacitor/assets` ile üret.
- **Reklam (para):** `@capacitor-community/admob`; oyundaki "2× Coin" butonu rewarded reklam için hazır kanca içerir (`setupDouble`).
