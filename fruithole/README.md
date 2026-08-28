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
- Tarlaya meyve dışında **eşyalar** da karışıyor: dondurma, donut, kupa,
  plaj topu, oyuncak araba, ördek, deniz yıldızı, deniz kabuğu, güneş
  gözlüğü, parmak arası terlik, kova-kürek, külah. Şemsiye, can simidi,
  şezlong ve flamingo şişme yalnızca **dev** boyda çıkıyor — küçültünce
  okunaklılıklarını veren detay kayboluyor. Hepsi dört meyve sayacından
  birine ödeme yapıyor, yani beşinci bir para birimi yok.
- Her tarlada 4-6 tane de **dev meyve** var: ağzın iki katından geniş,
  çevresi boş bırakılmış. Bölüm 1'de birini açmak için tarlanın yaklaşık
  üçte birini süpürmek gerekiyor; karşılığında 12 kat meyve ve tek
  seferde ciddi bir büyüme veriyor. Bir turda hedef alacağın şey bunlar.
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
- **Bölüm sonu sandığı**: bitiş ekranında bir sandık çıkar, dokununca patlar
  ve `40 + yıldız×30 + bölüm×4` kadar rastgele bir meyve verir. O bölümde bir
  görünüm açıldıysa haberi de buradan verir — tekrar oynanan bölümde yeniden
  vermez.

- **Delik görünümleri** (yükseltmeler ekranının altında): 10 tane. Beşi bir
  bölüme ulaşınca kendiliğinden açılıyor (talep etme adımı yok), beşi meyveyle
  alınıyor. İkisi metalik — aynı ışık altında tamamen farklı okunduğu için
  sondakiler ödül gibi duruyor. Oyunda "bir şey açtım" anını veren tek şey bu;
  yükseltmeler sayı artırıyor, boosterlar tükeniyor.

Kayıtlar `localStorage`'da: `fruithole_level`, `fruithole_currency`,
`fruithole_stars`, `fruithole_upgrades`, `fruithole_boosters`,
`fruithole_daily`, `fruithole_stats`, `fruithole_ach`, `fruithole_muted`,
`fruithole_skins`.

## Bölüm yapısı

Her bölümün **iki** ayırt edici özelliği var: **dizilişi** (desen) ve
**konsepti** (tema). Sekiz tema var — 🏖️ Beach (kum + deniz), ⚽ Match Day
(biçilmiş çim + taç çizgisi + stadyum zemini), 🏠 Indoors (parke),
❄️ Snow Day (kar + buz), 💰 Payday (altın damarlı mermer banka zemini,
bitcoin/euro/rupi/peso madeni paraları, banknot desteleri, dev para kesesi
ve altın külçeleri), 🚀 Orbit (perçinli istasyon güvertesi, uydu, halkalı
gezegen, astronot kaskı, yakıt varili, dev roket), 🍹 Happy Hour (koyu cilalı
bar tezgâhı + bardak halkaları, kokteyl, limon dilimi, shaker, şişe, dev buz
kovası), 🍔 Drive-In (asfalt + park yeri çizgileri, burger, patates, kola,
pizza dilimi, dev sedan ve kamyonet). Bir de 🎲 Everything var (kum, bütün
eşyalar karışık) — bölüm listesinde kullanılmıyor, temasız bir desene
düşüldüğünde devreye giren yedek.

Kokteylin camı **saydam çizilmiyor**: dürüst bir bardak — berrak cam, içinde
daha dar bir sıvı sütunu — tepeden bakınca çamur rengi çıkıyor, çünkü renge
varmadan önce iki boyalı duvardan geçiyorsun. Bu yüzden içki bardağı ağzına
kadar dolduruyor, cam da etrafında sadece bir dudak ve bir taban.

Shaker'ın metalliği düşük tutuldu: sahnede environment map yok, yüksek
metalness'ın yansıtacak bir şeyi olmadığı için ilk hali kömür karası bir çöp
kovası gibi görünüyordu.

Orbit'in çevreleyen düzlemi **zemin değil**: diğer bütün bölümlerde etraf
kenardan sonra devam ediyor, orada bitiyor ve ötesi karanlık. Bu yüzden
güverte dokusu koyu tutuldu — siyahın üstünde açık renk bir zemin, üstünde
durulan bir yer değil, geceye açılmış bir delik gibi duruyor.

Tema zemini, çevreleyen düzlemi ve o bölümde çıkan **eşyaları** belirler; meyvelere dokunmaz — dört sayaç ve
mağaza ona bağlı olduğu için ürün her yerde aynı. Üstteki etikette ikisi
birden yazar: `⚽ 🔀 Cross`.

Tarla 13 sütun geniş, 22 satırdan başlayıp bölüm bölüm 34'e uzar; ekrandan
taştığı için kamera deliği takip eder. Her bölüm **bir şekildir** — piramit,
kalp, yıldız, ada, halka, elmas, sarmal, çapraz, bloklar, merdiven, yığınlar,
duvarlar, daireler — ve şeklin dışı boş kalır. Bir hücre birden çok meyve
taşıyabilir (istif), delik geçerken kule toptan dökülür.

### Yuvarlak olan bir daire (🫧 Bubbles)

Diğer bütün şekiller `nx`/`ny` ile çiziliyor; ikisi de -1..1 arası, ama tarla
13 hücre geniş ve 22-34 hücre derin. O koordinatlarda çizilen bir çember
ekranda **uzunlamasına bir elips** oluyor. Hücreler dünya uzayında kare
(1.05 × 1.05 birim), dolayısıyla gerçek daire demek **hücre mesafesi** demek —
`hypot(c - cx, r - cy)`.

Beş yuvarlak ada, her biri **tek bir meyveden**. Şeklin ayrı ayrı okunmasını
sağlayan şey bu; aynı meyve karışımı olsa tek bir topak gibi görünürdü. Oynanışı
da değiştiriyor: bir daireyi temizliyor, boş zemini geçiyor, ötekine
başlıyorsun. Diğer bütün desenler tek uzun bir süpürmeyi ödüllendiriyor.

Yerleşim hesaplandı, gözle konmadı. İlk deneme altı daireydi ve iki çift
0.7 hücre aralıkla düşmüştü: tahtada o iki daire değil, bir fıstık oluyor.
Şimdi her çift komşusundan en az **1.5 hücre** açık zeminle ayrılıyor ve
uçtakiler kenardan taşmayacak kadar içeride — hem 26 hem 34 satırda ölçüldü
(`scratchpad/holecircles.mjs`). Ölçü göz kararı olamazdı: `nx`/`ny` ile
çizilmiş bir elips de tepeden bakınca "yuvarlak" görünüyor.

## Delik ne kadar hızlı büyüyor

Meyve başına artış **sabit değil, tarlaya oranlı**: tarlanın %90'ını süpürmek
deliği tavana götürüyor, hangi bölümde olursan ol.

Önceden meyve başına düz 0.017'ydi. Ama tarla 1. bölümde 157 meyveden 15.
bölümde 475'e çıkıyor, dolayısıyla bir devi açmak için süpürmen gereken
oran çöküyordu:

| bölüm | eski | yeni |
|---|---|---|
| 1 | %31 | %34 |
| 5 | %11 | %31 |
| 11 | **%4** | %26 |
| 15 | **%2** | %23 |

Yani oyun tam da zorlaşması gereken yerde kolaylaşıyordu ve devler — bir
turda neye çalıştığının cevabı — bedavaya geliyordu. Artık bir dev her
bölümde tarlanın yaklaşık üçte birine mal oluyor.

Bölüm başına açılış bonusu da 0.05'ten 0.02'ye indi: 15. bölümde delik
1.32'de başlıyordu, dev için gereken 1.46 — neredeyse hazır doğuyordun ve
onu hak etmesi gereken süpürmenin yapacak bir şeyi kalmıyordu.

Dev meyvelerin boyutu da aynı birimden hesaplanıyor, o yüzden artık her
bölümde tam boy (1.34). Eskiden küçük tarlalarda 0.95'e iniyorlardı.

`GROW_SWEEP` ve `growthUnit()` — `fruithole/index.html`. Ölçüm:
`scratchpad/holebalance.mjs`.

Bölüm, tarladaki **her meyve** yendiğinde biter. Süre meyve sayısına göre
değil deliğin tarayacağı alana göre hesaplanır (`60 + meyve × 0.35` saniye),
çünkü büyüyen delik bir geçişte birkaç sütun birden süpürür. Bölüm 1'de bu
~2:20, ileri bölümlerde ~3:30 ediyor.

On iki desen bittiğinde oyun durmaz: her tam tur bir **kademe** sayılır ve
kademe başına süre %7 kısalır (en fazla %28). Yani desenler tekrar eder,
zorluk etmez.

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
- **Bölüm yukarıdan dökülüyor.** Her parçanın gecikmesi deliğe olan
  uzaklığına bağlı, yani tarla durduğun yerden dışarı yayılan bir dalga
  hâlinde iniyor. Satıra göre zamanlamak ekranı süpürürdü ve nerede olduğun
  hakkında hiçbir şey söylemezdi; delikten dışarı olunca ilk oturan şey birazdan
  yiyeceğin meyve oluyor. **Sayaç ve kontrol bu sırada duruyor** — oynayamadığın
  bir buçuk saniyelik geri sayım oyuncudan çalınmış demektir.
- **Kombo tekmesi bir salınım, sıçrama değil.** Çarpan yükseldiğinde kamera
  küçük bir tekme yiyor. İki tuzağa arka arkaya düşüldü.

  İlki: tekme *her yemede* tazeleniyordu. Büyük delikle yoğun tarlada bir
  karede birkaç meyve birden yutuluyor, dolayısıyla sarsıntı tavanda
  çakılı kalıyordu ve bütün bölüm boyunca görüntü uğulduyordu. Artık
  yalnızca çarpan **yükseldiğinde** tetikleniyor.

  İkincisi ve asıl "deprem" olanı: eksenlerden biri kosinüstü ve her tekmede
  `shakeT` sıfırlanıyor, yani `cos(0) = 1` kamerayı **ilk karede tam
  genliğe ışınlıyordu**. Sarsıntının kendisi 0.16 birimken iki kare arası
  sıçrama da 0.16 birimdi: göz sallantı değil, ışınlanma görüyordu — üstelik
  tam oyuncunun iyi gittiği anda. İki eksen de sinüs olunca tekme sıfırdan
  başlayıp birkaç karede şişiyor.

  | | eski | yeni |
  |---|---|---|
  | tepe genlik | 0.16 | 0.07 |
  | ilk karedeki sıçrama (60 FPS) | 0.16 | 0.022 |
  | süre | 0.14 sn | 0.15 sn |
  | frekans | 5.4 / 4.3 Hz | 3.2 / 2.4 Hz |

  Arada bir de fazla kısıldı: genlik düşürülüp çürüme 1.5/sn yapılınca
  zarf, sinüs kendi tepesine varmadan ölüyordu ve geriye tek karelik bir
  pop kalıyordu. **Çürüme yükselişten uzun yaşamalı.**

- **Müzik de dosyasız.** Dört akorluk (F–C–G–Am) bir döngü aynı sentezle
  çalınıyor: bas + arpej. Notalar zamanlayıcıyla değil **ses saatine** yarım
  saniye önceden kuyruklanıyor — `setInterval` kayıyor ve arka plan sekmesinde
  kısılıyor, bu kadar kısa bir döngüde bu duyulur bir aksama oluyor. Oyun
  sırasında ses seviyesi düşüyor (0.09), menüde yükseliyor (0.15); efektler
  saniyede birkaç kez çaldığı için ikisi aynı seviyede yarışırsa ucuz duruyor.

## Dil

Oyunun arayüzü ve mağaza metinleri **İngilizce**; Play Console'da varsayılan
dil de İngilizce seçilmeli. Arayüz metinleri `index.html` içinde doğrudan
gömülü, ayrı bir dil dosyası yok.

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
npm run sync:fruithole
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

Fruit Hole'un **kendi AdMob birimleri** koda girildi (`AD_UNITS`):

| Yer | Kimlik |
|---|---|
| Uygulama (AdMob App ID) | `ca-app-pub-2542927456156553~4653695871` |
| Ödüllü | `ca-app-pub-2542927456156553/4650610263` |
| Geçiş | `ca-app-pub-2542927456156553/3960345120` |
| Banner | `ca-app-pub-2542927456156553/9522879176` |

**App ID koda değil, Android manifest'ine girer** — ve manifest `cap add`
ile üretildiği için native proje her yeniden oluşturulduğunda kaybolur.
Elle eklemeyi hatırlamak gerekmesin diye `patch-manifest.mjs` bunu
`add:*` ve `sync:*` komutlarının parçası olarak yazıyor; zaten varsa
dokunmuyor. Yani ekstra bir şey yapmana gerek yok.

Bu satır olmadan uygulama **açılır açılmaz çöker**.

### Yayına çıkmadan önce: `ADS_TESTING`

`index.html` içinde `const ADS_TESTING = true;` var. Kendi reklamına
tıklamak AdMob hesabını kapattırır, bu yüzden kendi cihazında denerken
**true** kalmalı (test reklamı gösterir). Play'e yüklediğin sürümde
**false** yap, yoksa gerçek reklam gelmez ve gelir olmaz.

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

Ölçümler:

```bash
node scratchpad/holegrow.mjs     # delik ne kadar hızlı büyüyor
node scratchpad/holebalance.mjs  # süpürme süresi ve dev meyve eşiği
node scratchpad/holeshake.mjs    # kombo tekmesinin profili
node scratchpad/holecircles.mjs  # Bubbles daireleri yuvarlak ve ayrık mı
```

`window.fruitHoleShake()` sarsıntının anlık halini, `fruitHoleKick(çarpan)`
ise bölüm oynamadan tek bir tekmeyi tetikler — tekmeyi gerçek bir turla
ölçmek bölüm başına dakikalar sürüyor ve sahte oyuncunun kombo kurabilmesine
bağlı kalıyordu.

## İkon, splash ve mağaza görselleri

Hepsi kodla üretiliyor, kaynak görsel tutulmuyor:

```bash
python3 fruithole/make-assets.py     # Pillow gerekir
```

Çıktılar `fruithole/assets/` (ikon 1024², adaptive ön/arka plan, splash 2732²)
ve `fruithole/store/feature-1024x500.png`. Android ikon/splash boyutlarını
üretmek için (native proje eklendikten sonra, depo kökünde):

```bash
npm run assets:fruithole
```

Çıktı `android-fruithole/` projesine yazılır. Araç `capacitor.config.js`'i
okumadığı için hedef projeyi `--androidProject` ile açıkça veriyoruz;
onsuz varsayılan `android/` klasörüne bakıp "platform bulunamadı" diyor.

Mağaza ekran görüntüleri (`fruithole/store/1-menu.png` … `5-goals.png`,
1080×1920) gerçek oynanıştan alındı; listeleme metni ve form cevapları (İngilizce)
[`store/listing-en.md`](store/listing-en.md) dosyasında.

Reklam gösterildiği için gizlilik politikasının bir adreste **yayınlanması**
zorunlu; bu yüzden [`docs/privacy.html`](../docs/privacy.html)
GitHub Pages ile yayınlanıyor:

```
https://kaancetinkaya.github.io/holegame/privacy.html
```

Politikayı değiştirirsen `docs/` altındaki dosyayı düzenle — Pages doğrudan
oradan yayın yapıyor, ayrıca bir yere kopyalamaya gerek yok.

## Tek dosyalık sürüm (paylaşmak / telefonda denemek için)

```bash
python3 fruithole/build-standalone.py /bir/yer/fruit-hole.html
```

Three.js'i sayfanın içine gömer; ortaya çıkan tek HTML dosyası internetsiz,
başka hiçbir dosyaya ihtiyaç duymadan açılır (~1.25 MB). Bir yere yükleyip
telefondan denemek ya da birine göndermek için bunu kullan.
