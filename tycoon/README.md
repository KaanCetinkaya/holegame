# Motor Works

Boş zamanda kendi kendine çalışan bir oto fabrikası (idle/tycoon). Tek dosya,
Three.js, dışarıdan hiçbir görsel dosyası kullanmıyor — bütün modeller ve
dokular oyun açılırken kodla üretiliyor.

    tycoon/index.html          oyunun tamamı
    tycoon/make-assets.py      ikon ve açılış görselleri
    tycoon/assets/             üretilen görseller (build'e girer)

Tarayıcıda denemek için `tycoon/index.html`'e çift tıkla. Paketlenmiş sürüm
için `node build-www.mjs` → `www-tycoon/`.

## Zincir

    DÖKÜM ──külçe──▶ PRES ──panel──▶ MONTAJ ──araba──▶ SEVKİYAT ──▶ para

Her istasyonun arkasında bir **tampon** var. Bir istasyon ancak önündeki
kadar hızlı çalışabiliyor, yani hat en yavaş halkasının hızında akıyor ve
yavaş olanın önünde mal yığılıyor.

Oyunun bütün öğretisi bu tamponlarda. Dolan çubuk oyuncuya neyi yükselteceğini
söylüyor; başka bir istasyonu yükseltmek gözle görülür şekilde hiçbir şey
yapmıyor. Eğitim ekranı, "önerilen" oku ya da açıklama metni yok.

## Denge — üç deneme

Denge, hep darboğazı satın alan sahte bir oyuncu simüle edilerek ölçüldü
(`scratchpad/tycoon*.mjs`). Her sayı ölçümle geldi, tahminle değil.

**1. deneme.** Üretim hızı zincir boyunca düşüyor, maliyetler 15'ten
30.000'e çıkıyordu. Oynanamazdı: Sevkiyat daha 1. seviyeden darboğazdı ve
Döküm'ün iki yüz katı pahalıydı, dolayısıyla ilk çeyrek saatte oyuncunun
aldığı hiçbir şey geliri kımıldatmıyordu.

**2. deneme.** Maliyetler 15–4200, geç istasyonlara telafi için yüksek
üretim hızı. Seviyeler **14/5/4/2**'de bitti. Bir istasyonun belli bir
kasada ulaşacağı seviye `log(kasa / başlangıçMaliyeti)` gibi gider, yani
280 kat pahalı olan yaklaşık kırk seviye aşağıda kalır — hiçbir hız çarpanı
bu farkı kapatmıyor. Paranın yarısı, aşağısının zaten kullanamayacağı kadar
hızlı olan Döküm'e gitti.

**3. deneme (mevcut).** Maliyetler **15/22/32/45** — neredeyse aynı. Fark
artık başlangıç fiyatında değil, **fiyatın ne kadar hızlı tırmandığında**
(1.09 / 1.085 / 1.08 / 1.075). Seviyeler **38/37/38/37**'de kalıyor ve
darboğaz hat boyunca sürekli yer değiştiriyor. `baseRate` dördünde de 1:
maliyetler bu kadar yakınken telafi edilecek bir şey kalmıyor, sabit hız da
doğru olması gereken bir parametre eksiltiyor.

Artış oranları da başta 1.2–1.128'di, 1.09–1.075'e indirildi. Maliyet
`g^seviye` ile büyürken gelir seviyeyle doğrusal büyüyor — üstel bir eğri
düz bir çizgiye karşı, ve sonunda hep üstel kazanıyor. 1.2'de duvar 70.
seviyede, yarım saat içinde geliyordu; sonraki üç saat yalnızca on yedi
seviye alıyordu. Daha düz eğriler duvarı bir turun değeceği kadar öteye
itiyor. Duvarı **aşan** şey prestij.

## Kilometre taşları

10, 25, 50, 100, 200, 350, 500, 750, 1000. Her biri o istasyonun tamamını
ikiye katlıyor.

Bunlar olmadan seviye almak her seferinde aynı bir birim hız veriyordu, yani
ilk saatten sonra bütün satın almalar birbirinin aynıydı ve oyun bitiyordu.
Kilometre taşları düz tırmanışı bir dizi hedefe çeviriyor — türün cevabı bu,
ve bir idle oyunun bir akşam yerine bir hafta tutmasının sebebi.

## Prestij (şube devri)

Devrettiğinde fabrika sıfırlanır, karşılığında **kalıcı puan** kazanırsın:

    puan   = 20 × √(ömür boyu kazanç / 1e6)
    çarpan = 1.02 ^ puan

İki ayrıntı da ölçümle bulundu:

- **Ölçek.** Puan `/1e9` ile hesaplanırken üç saatlik bir tur beş puan (+%10)
  ediyordu. Koca bir fabrikayı teslim etmek için kimsenin kabul etmeyeceği
  bir zam. `/1e6` ile ilk tur ~2.6 kat veriyor.
- **Bileşik olması.** Çarpan `1 + 0.02 × puan` iken sistem bir sabit noktaya
  yakınsıyordu: tur kazancı ≈ çarpan × erişim, puan bunun karekökü, kökü düz
  bir çizgiden geçirince yakınsıyor. Altı şube boyunca ölçüldü — kazanç
  artışı %59, %10, %21, %10, %4 diye söndü, o noktadan sonra devretmenin bir
  anlamı kalmıyor. Puan başına yüzde ikinin **bileşiği** ise ıraksıyor:
  önce yavaş, sonra idle oyunun olması gerektiği gibi.

Ölçülen sonuç — 30 dakikalık turlarla, altı şube:

| şube | gelir/sn | çarpan |
|---|---|---|
| 1 | 17K | 1.0× |
| 2 | 45K | 2.6× |
| 4 | 107K | 6.2× |
| 6 | 194K | 11.2× |

## Çevrimdışı kazanç

En fazla 4 saat. **Simüle edilmiyor**, kapalı formülle hesaplanıyor: bir hat
dinlenik halde en yavaş halkasının hızında akar, o halkanın önündeki
tamponlar dolu, arkasındakiler boş olur.

İlk sürüm bunu fabrika adımını tek seferde büyük bir `dt` ile çağırarak
yapıyordu, ama her istasyon adım başına yalnızca bir tampon dolusu mal
taşıyabiliyor: 370/sn gelirle 4 saat **4.800** ödedi. Şimdi 5.328.000 ödüyor,
yani gelir × süre. Aynı sebeple canlı adımlarda bir saniyeden uzun aralıklar
tek hamlede değil, adım adım yürütülüyor.

## Hız kutusu

3 dakika ×3, sonra 15 dakika bekleme. Şu an bedava — **ödüllü reklamın
gireceği yer burası**. Şekli zaten doğru: oyuncu istiyor, bitiyor, tekrar
isteyebiliyor. Reklam eklendiğinde bekleme süresinin yerini reklam alır,
başka hiçbir şeyin değişmesi gerekmez.

Kapalıyken boost işlemiyor: çevrimdışı hesap dönüş anındaki hızı okuyor,
boost hâlâ işliyor olsaydı kimsenin izlemediği saatler için üç kat öderdi.

## Görevler

On iki görev: kazanç eşikleri, istasyon seviyeleri, müdürler, şubeler, hız
kutusu kullanımı. Menü → GÖREVLER.

Ödüller sabit para değil, **oyuncunun kendi gelirinin saniyesi** cinsinden.
Sabit 50.000 ilk on dakikada servet, ikinci şubede yuvarlama hatası; "bir
saatlik kazancın" iki uçta da aynı şeyi ifade ediyor, böylece liste oyun
boyunca açmaya değer kalıyor. Ödül hesabı boost'suz gelirle yapılıyor —
yoksa reklam izlerken görev almak bütün listeyi üçe katlardı.

Alınacak ödül varken sağ üstte kırmızı bir nokta çıkıyor. Onsuz görevler
ekranı ikinci kez açılmayan bir oda oluyor.

## Günlük ödül

Yarım saatlik gelir × ardışık gün (en fazla 7). Gün numarası **oyuncunun
kendi saat diliminde** hesaplanıyor: gece 3'te sıfırlanan bir ödülü kimse
anlamıyor. Bir gün kaçırınca seri başa dönüyor, aynı gün ikinci kez ödeme
yapmıyor.

## Reklamlar

Yalnızca **ödüllü video**. Idle oyunun ekranı bir yanda izlenen fabrika, bir
yanda dokunulan panel — banner'ı koyacak yer ikisinden birinin üstü. Ödüllü
zaten türün para kazandığı yer, çünkü oyuncu kendi istiyor.

İki yerde:

- **Hız kutusu** — 3 dakika ×3. Eskiden 15 dakikalık beklemenin arkasındaydı;
  artık bedeli reklam. Zaten bu şekilde kurulmuştu.
- **Çevrimdışı kazanç ×2** — dönüş ekranındaki ikinci düğme.

Cihaz dışında `showRewarded()` `true` dönüyor, yani tarayıcıda akış
yürünebiliyor; orada hız kutusu eski beklemesini fren olarak koruyor.

Şu an Google'ın **herkese açık test birimleri** kullanılıyor. Yayından önce
AdMob'da uygulama açıp `AD_UNITS` içindeki kimliği değiştirmek ve
`ADS_TESTING = false` yapmak gerekiyor.

## Kayıt

Tek anahtar: `motorworks_save`. İçinde kasa, ömür boyu kazanç, şube sayısı,
seviyeler, müdürler, tamponlar, boost zamanlayıcıları ve son görülme zamanı
var. Eski bir kayıt eksik dizi elemanıyla gelebilir; eksik seviye sessizce
`NaN` olup bütün ekonomiyi sıfırladığı için yükleme sırasında tamamlanıyor.

## Test

    node build-www.mjs
    node scratchpad/tycoon.mjs     # işlevsel: zincir, darboğaz, çevrimdışı, sayı biçimi
    node scratchpad/tycoon2.mjs    # üç saatlik ilerleme eğrisi
    node scratchpad/tycoon3.mjs    # altı şubelik prestij döngüsü
    node scratchpad/tycoon4.mjs    # görevler, günlük ödül, çevrimdışı x2

`window.jeProbe()` oyunun bütün durumunu döndürür; `jeGive`, `jeRun`, `jeBuy`,
`jeOffline`, `jeBoost`, `jePrestige`, `jeGoals`, `jeDaily`, `jeReset` testlerin
oyunu parmaksız oynamasını sağlar.

## Eksikler

- AdMob uygulaması açılmadı; test reklam kimlikleri kullanılıyor
- Araştırma ağacı / ikinci para birimi yok
- Uygulama içi satın alma yok
- Mağaza metni ve ekran görüntüleri hazırlanmadı
