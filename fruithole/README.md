# Fruit Hole

Meyve tarlasında geçen, süreye karşı oynanan delik oyunu. Tek dosya:
[`index.html`](index.html) — Three.js dışında bağımlılığı yok, ses ve doku
dosyası kullanmaz (hepsi kod içinde üretilir).

Depodaki diğer oyun (Hole) bundan tamamen bağımsızdır; paketleme için
kökteki [`README.md`](../README.md) → "Hangi uygulama paketleniyor?".

## Oynanış

- Ekranın herhangi bir yerine bas ve sürükle: bastığın nokta sanal bir
  joystick'in merkezi olur, delik o yöne gider.
- Delik değdiği **her** meyveyi yutar ve her yutuşta biraz büyür.
- Bazı meyveler normalden iri; delik yeterince büyümeden onları yutamaz,
  değdiğinde meyve titrer ("henüz değil" geri bildirimi).
- **Kayalar** hiçbir boyutta yutulmaz ve deliği durdurur; etraflarından
  dolaşmak gerekir. Bölüm 3'ten itibaren çıkarlar.
- Arka arkaya yenen meyveler **kombo çarpanı** kazandırır (x5'e kadar),
  yani bir öbeği tek geçişte süpürmek tek tek toplamaktan kazançlıdır.
- Tarlayı süre bitmeden temizlersen bölüm biter. Kalan süreye göre
  **1-3 yıldız** alırsın; her bölümün en iyisi kaydedilir.
- Süre biterse tur biter; bölüm başına bir kez ödüllü reklam izleyip
  **+15 saniye** ile kaldığın yerden devam edebilirsin.

## Meta

- **Yükseltmeler** (menüden): hız, başlangıç boyutu, ek süre ve mıknatıs.
  Her biri farklı bir meyveyle ödenir, böylece dört sayaç da işe yarar.
- **Boosterlar**: +15 saniye, anında büyüme, 8 saniyelik süper mıknatıs.
  Sırasıyla bölüm 4, 7 ve 10'da açılır; her biri bir adet hediye gelir.
- **Günlük görevler** her gün yenilenir, **günlük ödül** üst üste girişle
  büyür, beş **başarım** kalıcıdır.

Kayıtlar `localStorage`'da: `fruithole_level`, `fruithole_currency`,
`fruithole_stars`, `fruithole_upgrades`, `fruithole_boosters`,
`fruithole_daily`, `fruithole_stats`, `fruithole_ach`, `fruithole_muted`.

## Zorluk

Her bölümde tarla bir sıra daha uzar (9'dan 16'ya kadar), süre tarla
büyüklüğüne göre hesaplanır (`40 + hücre sayısı × 0.6` saniye) ve delik
biraz daha büyük başlar. Bölüm 1'de bu 78 saniye ediyor.

Sekiz desen bittiğinde oyun durmaz: her tam tur bir **kademe** sayılır,
kademe başına süre %7 kısalır (en fazla %28) ve tarlaya daha çok kaya
girer. Yani desenler tekrar eder, zorluk etmez.

## Teknik notlar

- **Grafikler tamamen prosedürel.** Her meyve tipinin kendi geometrisi ve
  canvas'ta çizilen dokusu var: böğürtlen küresi gerçekten girintili
  (köşeler dışarı itiliyor), muz dilimi bir silindir + çekirdekli kesit
  dokusu, kavunda ağ deseni, liçide tepede pembelik. Kamera neredeyse
  tepeden baktığı için doku detayı kürenin **üst kutbuna** denk gelecek
  şekilde çiziliyor (canvas'ın üst satırı = kürenin tepesi).
- **Çukur boyanmış, oyulmuş değil.** Zemin tek parça bir düzlem olduğu için
  gerçek delik ancak stencil ile kesilebilirdi; bu açıdan tuğla duvarı
  karanlığa inen bir disk olarak boyamak aynı derinlik hissini veriyor.
- **Sayaç duvar saatine bağlı.** Hareket için kare farkı sınırlanıyor
  (ani takılmalarda ışınlanmayı önlemek için) ama geri sayım gerçek
  geçen süreyi kullanıyor, yoksa düşük FPS'te süre yavaş akıyor.
- **Ses dosyasız.** Bütün efektler WebAudio ile sentezleniyor; arka arkaya
  yedikçe yeme sesi tizleşiyor. Titreşim varsa `navigator.vibrate` ile.

## Uygulama içi satın alma (IAP)

Mağaza ekranı ve dört ürün hazır; ürün kimlikleri Play Console'da aynı
adlarla oluşturulmalı:

| Ürün kimliği | Tür | İçerik |
|---|---|---|
| `fruithole_remove_ads` | tek seferlik | banner + geçiş reklamları kalkar (ödüllü kalır) |
| `fruithole_starter` | tek seferlik | her meyveden 500, her booster'dan 3, üstüne reklamsız |
| `fruithole_pack_small` | tüketilebilir | her meyveden 400 |
| `fruithole_pack_large` | tüketilebilir | her meyveden 1200 |

**Yapılması gereken tek şey ödeme SDK'sını bağlamak.** Desteklenen yol
[`@revenuecat/purchases-capacitor`](https://github.com/RevenueCat/purchases-capacitor);
Cordova sürümü emekliye ayrıldı ve Google, ona dayalı güncellemeleri
2026-08-31'den sonra kabul etmiyor.

```bash
npm install @revenuecat/purchases-capacitor
APP=fruithole npx cap sync android
```

Sonra `index.html` içindeki `purchase()` ve `restorePurchases()`
fonksiyonlarını eklentinin kendi API'siyle eşle — oradaki çağrı şekli
doğrulanmadı, eklenti kurulunca kendi dokümanına göre bağlanmalı.
Kod tarafında değişmesi gereken **yalnızca bu iki fonksiyon**; ürünlerin
verdiği ödüller ve sahiplik kaydı bağımsız çalışıyor.

Gösterilen fiyatlar tarayıcı sürümü için yer tutucudur; cihazda mağazanın
döndürdüğü **yerel fiyat** gösterilmelidir. Tarayıcıda satın alma yapılmaz,
ürünler akışı denemek için doğrudan verilir.

Sahiplik `localStorage`'da (`fruithole_iap`) tutulur; kullanıcı uygulamayı
silip kurarsa "Satın alımları geri yükle" düğmesi gerekir, o da yalnızca
uygulamada çalışır.

## Reklamlar

Reklam kodu bağlı ama şu an **Google'ın resmi TEST birimleri** kullanılıyor
(`AD_UNITS`). Fruit Hole ayrı bir uygulama olarak yayınlandığı için
**kendi AdMob birimlerine ihtiyacı var** — Hole uygulamasının birimleri
burada kullanılamaz. Yayından önce üçünü de (rewarded / interstitial /
banner) değiştir.

Tarayıcıda reklam çağrıları no-op'tur; ödüllü reklam doğrudan `true`
döner, yani oyun reklam ağı olmadan da birebir aynı oynanır.

| Yer | Reklam | "Reklamsız" alınırsa |
|---|---|---|
| Süre bitti ekranı, "📺 +15 saniye" | rewarded (bölüm başına 1) | kalır (isteğe bağlı, oyuncu lehine) |
| Her 3 bölümde bir, sonraki bölüme geçerken | interstitial | kalkar |
| Oyun sırasında altta | banner | kalkar |

## Geliştirme

`index.html`'i doğrudan tarayıcıda aç (Three.js'i CDN'den çeker, internet
gerekir). Paketlenecek, kütüphanesi yerel sürümü üretmek için depo kökünde:

```bash
npm run build:www        # -> www-fruithole/
```

## İkon, splash ve mağaza görselleri

Hepsi kodla üretiliyor, kaynak görsel tutulmuyor:

```bash
python3 fruithole/make-assets.py     # Pillow gerekir
```

Çıktılar `fruithole/assets/` (ikon 1024², adaptive ön/arka plan, splash 2732²)
ve `fruithole/store/feature-1024x500.png`. Android ikon/splash boyutlarını
üretmek için (native proje eklendikten sonra, depo kökünde):

```bash
APP=fruithole npx @capacitor/assets generate --assetPath fruithole/assets --android
```

`--assetPath` depo köküne **göreli** olmalı; `APP=fruithole` sayesinde çıktı
`android-fruithole/` projesine yazılır.

Mağaza ekran görüntüleri (`fruithole/store/1-menu.png` … `5-goals.png`,
1080×1920) gerçek oynanıştan alındı; listeleme metni ve form cevapları
[`store/listing-tr.md`](store/listing-tr.md), gizlilik politikası
[`store/privacy-policy.html`](store/privacy-policy.html) dosyasında.
Reklam gösterildiği için politikanın bir adreste **yayınlanması** ve URL'sinin
Play Console'a girilmesi zorunlu.

## Tek dosyalık sürüm (paylaşmak / telefonda denemek için)

```bash
python3 fruithole/build-standalone.py /bir/yer/fruit-hole.html
```

Three.js'i sayfanın içine gömer; ortaya çıkan tek HTML dosyası internetsiz,
başka hiçbir dosyaya ihtiyaç duymadan açılır (~1.25 MB). Bir yere yükleyip
telefondan denemek ya da birine göndermek için bunu kullan.
