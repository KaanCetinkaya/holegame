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

Reklam kodu oyunda **hazır ve bağlı** (`index.html` içindeki `AD_UNITS`, `showRewarded`, `showInterstitial`, `showBanner`):
- "2× Coin" butonu → **rewarded** reklam (izlenince ödül verilir)
- Her 2 level'da bir ve başarısızlıkta → **interstitial** ara reklam
- Ana ekranda alt **banner** reklam
- Tarayıcıda reklam **no-op**'tur (oyun aynı çalışır); sadece native uygulamada gösterilir.

`AD_UNITS` içindeki üç birim **senin gerçek AdMob reklam birimi ID'lerin**
(yayıncı: `ca-app-pub-2542927456156553`). Test ID'si kalmadı.

Kurulum (Android):
```bash
npm install                 # @capacitor-community/admob dahil
npx cap sync
```
`android/app/src/main/AndroidManifest.xml` içinde `<application>` etiketine AdMob App ID ekle:
```xml
<meta-data
  android:name="com.google.android.gms.ads.APPLICATION_ID"
  android:value="ca-app-pub-2542927456156553~XXXXXXXXXX"/>
```
> `~` sonrası kısım **AdMob App ID**'dir (reklam birimi ID'sinden farklı).
> AdMob → Uygulamalar → Hole → Uygulama ayarları'ndan kopyala ve `XXXXXXXXXX`
> yerine yapıştır. Bu adım yapılmazsa uygulama açılışta AdMob ile çöker.

Reklam olduğu için Play Console'da **gizlilik politikası URL'si** ve
**veri güvenliği** formu zorunlu (`store/privacy-policy.html` hazır — bir yere
yayınlayıp URL'sini gir; ör. GitHub Pages).

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

## Yayına çıkış kontrol listesi (kalan işler)

Kod tarafı bitti. Kalanlar **senin bilgisayarında / hesaplarında** yapılacak adımlar:

- [ ] `npm install && npx cap add android && npx cap sync`
- [ ] `npx @capacitor/assets generate --android` (ikon + splash üret)
- [ ] `AndroidManifest.xml` içine **kendi AdMob App ID**'ni ekle (yukarıdaki `~XXXXXXXXXX`)
- [ ] Gerçek cihazda test: reklamlar, ses/titreşim, kayıt (coin/skin/görev) çalışıyor mu
- [ ] **Keystore** oluştur, imzalı `.aab` üret ve keystore'u güvenli sakla (kaybolursa güncelleme yapamazsın)
- [ ] `store/privacy-policy.html`'i yayınla, URL'sini not al
- [ ] Play Console: uygulama oluştur (paket adı `com.kaancetinkaya.hole`), `.aab` yükle
- [ ] Mağaza listesi: `store/listing-tr.md` metinleri + `store/` görselleri + 512×512 ikon
- [ ] İçerik derecelendirme anketi, veri güvenliği formu, hedef kitle (reklam var → "çocuklara yönelik değil" seç)
- [ ] İç test → Kapalı test → Üretim

## Sonraki adımlar (opsiyonel, oyun içi)

- Daha çok level/şehir teması, yeni skinler, liderlik tablosu, bulut kayıt.
