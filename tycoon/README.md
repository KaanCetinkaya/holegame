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

## Ürün hattı

    Şehir ▸ SUV ▸ Kamyonet ▸ Spor ▸ Lüks
    ×1     ×3.2  ×10        ×34    ×115   araç başına fiyat

Fabrikanın en büyük eksiği **görünmemekti**: beşinci dakikada da üçüncü
saatte de aynı şehir arabası çıkıyordu, sadece tezgâh sayısı artıyordu.
Kademe atlayınca montaj hattındaki gövdeler, tırlardaki yük ve üçüncü
bandın kasaları o ürünün rengini alıyor, gövdeler de büyüyor — malzemeler
paylaşımlı olduğu için rengi değiştirmek yetiyor, mesh'lere dokunmuyoruz.

Kademe **zincirin en zayıf halkasına** bakıyor, en güçlüsüne değil. Tek bir
istasyonu 200. seviyeye çıkarıp yeni ürün açabilmek, oyunun bütün öğrettiği
"dengeli büyüt" fikrinin tam tersi olurdu. Ölçüldü: 201/1/1/1 hâlâ Şehir.

Eşikler en zayıf istasyonun seviyesi: **0 / 45 / 110 / 220 / 400**.

İlk hali 0/60/150/300/520'ydi ve ölçünce oyuncunun SUV'da takıldığı görüldü:
otuz dakikada 119. seviyeye geliyor, üç saatte ancak 148'e — Kamyonet için
gereken 150'nin tam dibinde. Üçüncü ürünü görüp bir türlü alamamak motive
etmiyor, sinirlendiriyor. Eşikler indirildi: ilk turda iki ürün rahat
açılıyor, üçüncüsü prestijden sonrasına kalan havuç oluyor.

| en zayıf | ürün | araç başına | gelir/sn |
|---|---|---|---|
| 1 | Şehir | 10 | 10 |
| 45 | SUV | 32 | — |
| 110 | Kamyonet | 100 | — |
| 220 | Spor | 340 | — |
| 400 | Lüks | 1.1K | — |

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
    çarpan = 1 + puan × 0.02

**Ölçek.** Puan `/1e9` ile hesaplanırken üç saatlik bir tur beş puan (+%10)
ediyordu — koca bir fabrikayı teslim etmek için kimsenin kabul etmeyeceği bir
zam. `/1e6` ile ilk devir yüzlerce puan veriyor.

**Bir ara bileşikti, geri alındı.** Doğrusal çarpan yakınsıyor görünüyordu:
altı şube boyunca kazanç artışı %59, %10, %21, %10, %4 diye sönüyordu. Onun
üzerine `1.02^puan` yapıldı. Ama o yakınsama **tampon tavanının kendisiydi**
(bkz. Tamponlar) — erişim büyüyemediği için sadece gelir büyüyordu, gelir de
tek başına karekökten geçip düz bir çizgiye girince sabit noktaya düşüyor.

Tavan kaldırılınca erişim kendi kendine büyümeye başladı ve bileşik çarpan
çift üstel oldu: 205x → 2.9e107 → `Infinity` → kayıtta `NaN`. Doğrusala
dönüldü; artık fazlasıyla yetiyor.

Ölçülen sonuç — 30 dakikalık turlarla, altı şube, her devirde puanların
tamamı **hat hızına** konarak (bkz. Araştırma):

| şube | 30 dk sonunda | gelir/sn | çarpan |
|---|---|---|---|
| 1 | 156/157/159/160 | 499K | 1.0× |
| 2 | 191/192/194/192 | 5.24M | 8.6× |
| 3 | 215/213/217/221 | 44.6M | 32.7× |
| 4 | 237/239/238/249 | 450M | 87.3× |
| 5 | 255/255/259/258 | 1.29B | 231.8× |
| 6 | 267/266/267/273 | 2.83B | 489.0× |

Seviyeler de geliri de büyüyor — asıl istenen buydu. 6. şubede Spor (220)
açılıyor, yani ürün hattının havucu da yerini buluyor.

Bu tablo bir öncekinin iki-üç katı. Sebebi oyunun kolaylaşması değil,
**ölçümün düzelmesi**: sahte oyuncu müdür almıyordu, yani her istasyondaki
×2 hiç hesaba girmiyordu ve tablo gerçek oyunu olduğundan zayıf gösteriyordu.
Gerçek oyuncu müdürü görür görmez alıyor, çünkü ×2 her zaman kârlı.

## Müdürler devirde duruyor

Müdür bir istasyonu ikiye katlıyor ve yükseltme gibi değil, kilometre taşı
gibi fiyatlanıyor: her seviyenin aynı hissettirdiği yerde uğruna para
biriktirilen şey. İlk şubede tam olarak bu işi görüyor.

Ama her devirde sıfırlanıyorlardı ve altıncı şubede bir müdür saniyelik
gelirin binde biri ediyordu — tur başlamadan önce bedavaya basılması gereken
dört düğme. Zaten hiçbir zaman bir karar da değillerdi: bir istasyonda ×2,
kaç seviye alırsan al onu geçiyor. Fiyat sadece bir kapıydı, ve bir kapıdan
bir kere geçmek yeter.

Artık kalıyorlar. Dördü de ×2 olduğu ve zincir en yavaş halkasının hızında
aktığı için akış ×16 değil **×2** artıyor — ikinci şubeden itibaren kalıcı
ve ölçülü bir ödül.

## Tamponlar

Bir istasyon, arkasındaki tamponda ne varsa o kadar çalışabiliyor ve
önündeki tamponda ne kadar yer varsa o kadar üretebiliyor.

Depolama **birim değil, saniye** cinsinden: bir sonraki istasyonun altı
saniyede tüketebileceği kadar. Önceden sabit 480 birimdi ve bu **bütün
ekonomiyi boğuyordu** — bir istasyon adım başına en fazla bir tampon dolusu
mal taşıyabildiği için, hızlar 480'i geçince zincir kendi hızıyla değil o
tavanla akıyor. 1e86'lık bir prestij çarpanıyla ölçüldü: ekran 1e79/sn
yazarken kasaya dakikada 218 bin giriyordu, seviyeler 144'te çakılı
kalıyordu ve son iki ürün hiç açılmıyordu. Tavan kalkınca aynı çarpan beş
dakikada seviye tavanına ve en üst ürüne ulaşıyor.

Sonsuz bir tampon da olmaz: fazla alınmış bir istasyon saatlerce mal
biriktirip sonrasını tek seferde ödetiyordu. Altı saniye, bir istasyon
geride kaldığında yığılmayı göstermeye yetiyor — tamponun tek işi bu.

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

3 dakika ×3, bedeli bir ödüllü video (bkz. Reklamlar). Önce 15 dakikalık
bir beklemenin arkasındaydı; şekil zaten doğruydu — oyuncu istiyor, bitiyor,
tekrar isteyebiliyor — reklam yalnızca beklemenin yerini aldı.

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
seviyeler, müdürler, tamponlar, araştırma seviyeleri, boost zamanlayıcıları
ve son görülme zamanı var. Eski bir kayıt eksik dizi elemanıyla gelebilir; eksik seviye sessizce
`NaN` olup bütün ekonomiyi sıfırladığı için yükleme sırasında tamamlanıyor.

## Test

    node build-www.mjs
    node scratchpad/tycoon.mjs     # işlevsel: zincir, darboğaz, çevrimdışı, sayı biçimi
    node scratchpad/tycoon2.mjs    # üç saatlik ilerleme eğrisi
    node scratchpad/tycoon3.mjs    # altı şubelik prestij döngüsü
    node scratchpad/tycoon4.mjs    # görevler, günlük ödül, çevrimdışı x2
    node scratchpad/tycoon5.mjs    # ürün kademeleri ve fiyat
    node scratchpad/tycoon6.mjs    # MAKS alımı ve yüksek çarpanla 30 dakika
    node scratchpad/tycoonres.mjs  # araştırma: puan muhasebesi ve yedi etki

`window.jeProbe()` oyunun bütün durumunu döndürür; `jeGive`, `jeRun`, `jeBuy`,
`jeOffline`, `jeBoost`, `jePrestige`, `jeGoals`, `jeDaily`, `jeRes`,
`jeResBuy`, `jeSetLifetime`, `jeSetEarned`, `jeReset` testlerin oyunu
parmaksız oynamasını sağlar.

## Mağaza

`tycoon/store/` içinde ikon, öne çıkan grafik, altı telefon ve altı tablet
ekran görüntüsü, ve iki dilde mağaza metni (`listing.md`) hazır duruyor.
Görsellerin hepsi gerçek oynanıştan üretiliyor:

    node build-www.mjs
    node scratchpad/tyshots.mjs      # 6 telefon + 6 tablet
    node scratchpad/tyfeature.mjs    # 1024x500 öne çıkan grafik

İlk iki kare aramada görünen tek karelerdir ve tek işleri büyümeyi
anlatmak: **aynı açıdan, biri dolu bir fabrika, biri ilk dakikalar.** İlk
denemede ikisi de olgun fabrikayı gösteriyordu ve mağazada aynı resmin iki
kopyası gibi duruyordu.

Öne çıkan grafik oyunun kamerasını yeniden çerçeveliyor (`window.jeCam`):
dikey telefon için ayarlanmış 36 birimlik görüş, 1024×500'lük bir yatay
grafikte fabrikayı bir noktaya indiriyor.

Yayın öncesi yapılacaklar `store/listing.md` sonundaki listede.

## Araştırma

Prestij puanları eskiden **harcanmıyordu**: puan geliyordu, çarpan
kendiliğinden büyüyordu, oyuncu hiçbir karar vermiyordu. Oyunun bütün geç
oyunu buydu ve içinde tek bir seçim yoktu. Artık puanlar bir para birimi.

| yükseltme | etki | puan/seviye | tavan |
|---|---|---|---|
| **Hat hızı** | +%2 bütün istasyonlar | 1 | yok |
| **Ürün kalitesi** | +%5 araç fiyatı | 3 | 60 |
| **Toplu alım** | -%1.5 yükseltme maliyeti | 5 | 30 |
| **İnsan kaynakları** | -%4 müdür ücreti | 4 | 15 |
| **Hazır hat** | yeni şube +1 seviyeden başlar | 6 | 10 |
| **Gece vardiyası** | +1 saat çevrimdışı | 8 | 12 |
| **Turbo** | +15 sn reklam hızlandırması | 6 | 20 |

Maliyetler seviye başına **sabit**, katlanarak artmıyor. Katlanan bir merdivende
çarpan puanın logaritması gibi büyür ve binlerce puan basan geç oyun dümdüz
olur. Sabit maliyet takası her ölçekte anlamlı tutuyor.

**Hat hızı tam olarak 1 puan = +%2 fiyatlandırıldı**, yani her şeyi ona koyan
oyuncu eski `1 + puan × 0.02` eğrisine birebir oturuyor. Üç denemede ölçülen
dengeden hiçbir şey oynamıyor; diğer altı yükseltme o puanlarla yarışan
seçenekler. Faydacı olanların tavanı var: erken oyunda gerçek bir karar,
birkaç şubeden sonra hepsi doluyor ve geriye tek sonsuz kuyu olarak hat hızı
kalıyor.

`scratchpad/tycoonres.mjs` puan muhasebesini, yedi etkinin formüllere
girdiğini ve "hepsi hat hızına → eski eğri" iddiasını beş ayrı puan
değerinde ölçüyor.

### Sıfırlama gerçekten sıfırlamıyordu

`jeReset` anahtarı siliyor ve sayfayı yeniliyordu. Ama yenileme `pagehide`
tetikliyor, `pagehide` kaydediyor, ve az önce silinen durum olduğu gibi geri
yazılıyordu. Temiz kayıtla başladığını sanan her test bir öncekinin
durumunu devralıyordu — araştırma testinin on bir kontrolü bu yüzden hatalı
görünmüştü. Artık `wiped` bayrağı sıfırlamadan sonra kaydı susturuyor.

## Fabrika ilerlediğini gösteriyor

Her bandın altı biriminin beşi gizli ve `seviye/6`'da açılıyor — yani zemin
ilk otuz seviyede doluyor, **sonra hiçbir şey değişmiyor**. Yan yana koyup
ölçtüm: şube 1'de 150. seviye ile şube 6'da 230. seviye **birebir aynı
kareydi**. Oyuncu 250. seviyeye çıkıyor, fabrikayı altı kez devrediyor ve
hep aynı resmi görüyor.

İki şey değişiyor artık:

**Donanım kilometre taşlarıyla yenileniyor.** Her iki kilometre taşında bir
kademe: demir → çelik → parlak çelik → krom → altın. Sadece **aksesuar
parçalar** değişiyor — bacalar, pres kasaları, robot kolları, tır rayları —
çünkü bir ocağı baştan boyarsan ocak olmaktan çıkıyor. Siluet duruyor,
işçilik iyileşiyor.

İlk denemede ortada "boyalı mavi" bir kademe vardı ve o kademede bütün
fabrika tek renge dönüyordu; yerini bıraktığı griden daha kötü okuyordu.
Rampa artık renk değil **parlaklık**. Metalik değer de düşük tutuluyor:
sahnede ortam haritası yok, yani metalik bir yüzeyin yansıtacağı bir şey yok
ve neredeyse siyah çıkıyor.

**Avlu şubelerle doluyor.** Devredilen her fabrika için sol tarafa bir sıra
bitmiş araç park ediyor. Prestijin gösterecek hiçbir şeyi yoktu — sayaç
artıyordu ve zemin aynı kalıyordu, yani çalışan bir fabrikayı vermenin
karşılığı köşedeki bir sayıydı.

Sıralar küçük tutuldu. İlk hali sıra başına üç araç ve iki sütundu; altıncı
şubede fabrikadan kalabalık oluyordu ve göz okuması gereken hattı bırakıp
otoparka gidiyordu — üstelik yakın sütun montaj bandının üstüne biniyordu.

## Eksikler

- AdMob uygulaması açılmadı; test reklam kimlikleri kullanılıyor
- Uygulama içi satın alma yok
- Telefonda hiç denenmedi
