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
**konsepti** (tema). Dokuz tema var — 🏖️ Beach (kum + deniz), ⚽ Match Day
(biçilmiş çim + taç çizgisi + stadyum zemini), 🏠 Indoors (parke),
❄️ Snow Day (kar + buz), 💰 Payday (altın damarlı mermer banka zemini,
bitcoin/euro/rupi/peso madeni paraları, banknot desteleri, dev para kesesi
ve altın külçeleri), 🚀 Orbit (perçinli istasyon güvertesi, uydu, halkalı
gezegen, astronot kaskı, yakıt varili, dev roket), 🍹 Happy Hour (koyu cilalı
bar tezgâhı + bardak halkaları, kokteyl, limon dilimi, shaker, şişe, dev buz
kovası), 🍔 Drive-In (asfalt + park yeri çizgileri, burger, patates, kola,
pizza dilimi, dev sedan ve kamyonet), 📺 Gadget Shop (koyu panel zemin,
televizyon, oyuncak org, kulaklık, saç kurutma makinesi, teyp, vantilatör,
dizüstü, telefon, oyun kolu; dev buzdolabı ve oyuncak helikopter). Bir de
🎲 Everything var (kum, bütün eşyalar karışık) — bölüm listesinde kullanılmıyor, temasız bir desene
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
duvarlar, daireler, sütunlar, huniler, halkalar — ve şeklin dışı boş
kalır. Bir hücre birden çok meyve
taşıyabilir (istif), delik geçerken kule toptan dökülür.

### Basamaklı piramit (🔺 Pyramid)

Üç denemede oturdu; ilk ikisi de **piramit değildi**.

**1. deneme — düz kenarlı kama.** Sayılarla üçgen, ekranda topak. Meyveler
durdukları hücreden geniş çiziliyor, yani eğik bir kenar iki yandan yarım
meyve bulanıyor; üstelik istifleme ortayı kendi siluetini gizleyecek kadar
yükseltiyordu.

**2. deneme — basamaklı ama tek eksende.** Genişlik satıra göre değişiyordu,
yani yukarıdan bakınca üçgen ama üç boyutta **merdiven**: kameradan uzağa
tırmanan bir rampa. Piramit her yöne birden daralır.

**3. deneme (mevcut).** Tarlanın ortasından dışa doğru **kare halkalar**
(Chebyshev uzaklığı, yani çember değil kare kontur). Dört taraça, her biri
**iki hücre basamak genişliğinde** — tek hücrelik basamakta ayağını basacak
düz bir yüzey kalmıyor ve şey, içine bir sivri saplanmış alçak bir tümsek
gibi duruyordu.

    halka   0-1   2-3   4-5    6
    kat      5     3     2     1     istif yüksekliği
    meyve  çilek  elma  muz  karpuz

Hücre cinsinden ölçülüyor, normalize koordinatla değil: hücreler dünya
uzayında kare, dolayısıyla satır ve sütunda eşit adım her tarla boyunda kare
tabanlı bir piramit veriyor. `nx`/`ny` ile taban tarlayla birlikte uzar ve
30. bölüm uzun bir sırt olurdu.

Orta satır yuvarlanıyor; yarım satırlık merkezde halkalar iç içe geçiyor ve
basamak yüzeyleri tırtıklı çıkıyor.

**Her taraça tek meyve.** Basamakların sayılabilir olmasını sağlayan bu.

Eşyalar bu bölümde seyrek (1/25, normalde 1/6): taraçaların okunması her
katın tek parça olmasına bağlı ve normal oranda plaj topları basamakların
tam ortasında delik açıyordu. Desen artık kendi eşya oranını isteyebiliyor.

### Huniler (🔽 Chevrons)

Diğer bütün desenler tarlaya **oturan bir şekil** — piramit, daireler,
kolonad. Bu bir **rota**: önünde bir noktada birleşen iki hat, arkasında bir
tane daha, yani tahta süpürülmeyi beklemek yerine sana nereye gideceğini
söylüyor. Tarlanın uzun olmasını ve kameranın onun boyunca bakmasını
kullanan tek yerleşim bu.

Orta sütuna göre **yapısı gereği simetrik**, yani çarpık çıkması mümkün değil.

Her huni tek meyve — kollar çizgi olarak okunsun diye; karışık meyve
koyunca çapraz duran bir dağınıklığa dönüyor. İç kol bir kat yüksek, huninin
içinde ilerlediğin bir kenarı olsun diye.

Kollar üç hücre kalın. İki hücreyken bölüm 120 parçaya düşüyordu — oyundaki
en ince tahtadan da az, üstelik bu desen sıralamada ikinci, yani oyuncunun
bir bölümün nasıl göründüğüne dair **ikinci izlenimi**.

### Kuleler (🏛️ Pillars)

Açık zeminde duran dört sıra kule. Sütun hatları arasında üç hücre boşluk
var: bir sütun ancak etrafından dolaşabiliyorsan sütundur, ve deliğin iki
kulenin arasından hiçbirine değmeden geçebilmesi gerekiyor. İç iki hat
dıştakilerden bir baş uzun — her yer aynı yükseklikte olunca duvar kâğıdı
oluyor.

Dış hatlar yarım adım kaydırılmış. Hepsi aynı satırlarda olunca dört sıra
aynı anda yürüyor gibi duruyordu.

Bir hattın tamamı **tek meyve**. Rengi hat boyunca yürütmeyi denedim; göz o
zaman sütunları hatlarına göre değil renklerine göre grupluyor ve kolonad
kolonad olmaktan çıkıyor. Piramidin taraçaları ve dairelerde olduğu gibi:
bir yapı, bir meyve.

**İstif sayısı yükseklik değil.** Ölçüldü: altı çilek 5.63 birim, on karpuz
dilimi 3.34 birim — çilek küre, dilim disk. "İç 10, dış 6" diye yazınca
tahtadaki en uzun kule *dıştaki* hatta düştü, yani kuralın tam tersi oldu.
Yükseklikler artık hat başına ayrı yazılıyor ve iç hatlar ~5, dış hatlar
~3.8 birimde duruyor.

Altı birim, dört hücre aralıkta durabilmek için fazlaydı: oyun kamerasının
açısında bir kule ekrana yaklaşık `h·sin(27°)` kadar artı kendi genişliği
kadar düşüyor, altı birimde bu 3.7 ediyor ve aralık da 3.7 — iç kolonadlar
kesintisiz şeride dönüşüyordu.

**Bu bölümde hiç eşya yok**, düzen kaygısından değil: eşya konan hücre
desenin istediğine bakmaksızın tek katlı kuruluyor, yani bir varil koca bir
on meyvelik kuleyi siliyordu. Bir hat 60 parça olması gerekirken 33 ölçüldü.

### Küçük halkalar (⭕ Rings)

Beş küçük simit. Dairelerle aynı fikir ama ortası boş: içine giriyor ve
dışarı doğru yiyorsun, tahtayı süpürmüyorsun. Yerleşim dairelerinkiyle aynı
mantıkta — konumlar tarlanın kesiri, yarıçaplar hücre cinsinden, yani tarla
büyüdükçe düzen korunuyor ve halka her bölümde aynı boyda.

Bant **bir buçuk hücre** kalın. Daha ince olursa desenin kullandığı istifte
boncuklara ayrılıyor; daha kalın olursa ortadaki delik kapanıyor ve halka
diske dönüyor.

Bu bölümde de eşya yok: bir buçuk hücrelik bantta tek bir nesne çemberi
kırıyor ve halka C harfi gibi okunuyor. Kulelerdekiyle aynı sebep.

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

## Deliğin görüntüsü

Ağız üç parça: dışta ince koyu bir kenar, içinde **geniş düz bir yaka**, onun
da içinde aşağı inen kuyu.

Önceden yaka ince bir simit, içinde daha da ince bir tane daha vardı — yani
telefonda bir çukurun etrafına dolanmış ipti. Deliğin bir bölümün çoğunu
geçirdiği boyutta yaka iki üç piksellik renk ediyordu ve gözün tutunacağı
hiçbir şey kalmıyordu. Geniş bant her boyutta okunuyor.

Kuyunun içindeki tuğla sıraları soğuk taşa çevrildi. Üstündeki karartma
gradyanı %92 opak düz siyahtı ve boyanan her şeyi yutuyordu: ağız, bir yere
inen bir şey değil, sayfaya açılmış bir delik gibi duruyordu.

### Boyut yayı

Yakanın dışında dönen renkli yay, deliğin bu bölümde ulaşabileceği en büyük
boyuta ne kadar yaklaştığını gösteriyor. Deliğin büyümesi oyunun bütün
ilerlemesi ve bunun tek işareti deliğin büyümüş olmasıydı — ki aynı anda
tahta da değiştiği için gözle kıyaslanamıyor. Yay **kaplamanın rengini**
taşıyor, yani satın aldığın şey hâlâ gördüğün şey.

Ölçüm bölümün başladığı yarıçapa göre: başlangıç boyutu yükseltmesini almış
bir oyuncu yolun bir kısmını çoktan geçmiş oluyor, yay ilk meyvede boş
görünmeli.

Yay kırk adıma yuvarlanıyor ve ancak bir adım değişince yeniden üretiliyor,
yani bir bölüm en fazla kırk küçük geometri harcıyor. İlk denemede tam
çemberlik tek bir simit tutulup `setDrawRange` ile kısaltılıyordu; **çalışmaz**
— THREE simiti dış döngü halka, iç döngü tüp olacak şekilde kuruyor, yani
ardışık indeksler yayın değil **tüpün** etrafında ilerliyor. İlk N indeksi
çizmek tüpün bir dilimini veriyor, ekranda da hiçbir şey görünmüyordu.

## Voxel bölüm (🧊 Blocks, bölüm 9)

**Tek bir bölümde** meyveler düz yüzey yerine **kare sütunlardan** kuruluyor.
İki takım da açılışta kuruluyor ve yan yana duruyor; bir desen `voxel: true`
ile istiyor, `buildField()` da tek meyve dizilmeden önce bayrağı çeviriyor —
böylece ızgara meyvesi, devler ve menü dioramasının ödünç aldıkları aynı
fikirde oluyor.

Tek bölüm olması işin kendisi. Baştan sona voxel bir oyun bir üslup; sekiz
bölüm sonra gelen tek bir voxel tahta ise bir olay. Bölümün adının zaten
Blocks olması ve oyunun en köşeli yerleşimi olması da (tek meyveli kasalar,
basamaklı kenar) meyvenin küpe dönmesini "başka bir oyun" değil, "bölümün
fikri" yapıyor.

**Küp değil, sütun.** Bir meyveyi küp ızgarasıyla doldurmak üçgenlerin çoğunu
kimsenin görmediği iç hacme harcıyor. Yükseklik alanı — hücre başına bir kutu,
şeklin altından üstüne kadar — yukarıdan bakan bir kamerada birebir aynı
resmi veriyor, ve komşu sütunlar arasındaki basamaklar zaten voxel olarak
okunan şey.

**Kapalı yüzler atılıyor.** Bir sütunun yan yüzü, ancak o yöndeki komşu yoksa
ya da daha alçaksa çiziliyor. Düz bir dilimde bütün iç sütunlar aynı
yükseklikte, yani dört yanı birden düşüyor; geriye üst, alt ve kenar kalıyor.
Bunu yapmayan bir sürüm dilim başına 570 dörtgen çizerdi, bu ~200 çiziyor.

**Renk, düz meyvelerin zaten kullandığı dokulardan geliyor.** Karpuzun kesik
yüzü bir daire olarak çizilmişti — kabuk halkası, beyaz halka, kırmızı iç,
dokuz çekirdek — ve dilimin ızgarası o dairenin üstüne birebir oturuyor.
Yani voxel'ler sanatı ikinci bir yerde tekrar etmiyor, devralıyor;
çekirdekler hep oldukları yerde. `CanvasTexture` tuvalini `.image`'da
tuttuğu için bunun için hiçbir şeyi yeniden yazmak gerekmedi.

**Doku hücre boyunca ortalanıyor, ortasından okunmuyor.** İlk hali noktadan
örneklüyordu: karpuz çekirdeği birkaç piksel genişliğinde, ya hücreyi ıskalıyor
ya da tamamını siyaha boyuyordu — meyvenin on birde biri kadar bir çekirdek,
yani domino taşı. Küçültme dediğin şey zaten ortalama almak; ortalayınca
çekirdek, değdiği hücrelere koyu bir ton olarak düşüyor.

**Sarma yönü göz kararı olmuyor.** Her yüz kendi normalini ve düzlem
eksenlerini, iki üçgeni dışarıdan bakınca saat yönünün tersine sardıracak
sırayla veriyor. Biri ters olursa o yüz dışarıdan görünmez, içeriden dolu olur.

Maliyet — aynı bölümler, aynı kamera (voxel sütunu, o bölüm voxel olsaydı):

| | düz yüzeyli | voxel |
|---|---|---|
| çilek (üçgen) | 1380 | 820 |
| dilim (üçgen) | 120-136 | 476 |
| dev (üçgen) | 400-660 | 836-1868 |
| bütün oyun voxel olsaydı, en ağır bölüm | 208 bin üçgen | 308 bin |
| bütün oyun voxel olsaydı, en ağır bölüm | **1066 çizim çağrısı** | **660** |

Bugünkü halinde en ağır bölüm voxel olanın kendisi: 210 bin üçgen, 507 çizim
çağrısı — yani eskiden en ağır bölüm ne kadarsa o kadar.

Üçgen %48 arttı ama **çizim çağrısı %38 azaldı**, ki telefonda asıl pahalı
olan o: eski dilimler üç malzemeli bir diziyle çiziliyordu (yan, üst, alt),
yani meyve başına üç çağrı. Renk artık mesh'in içinde, dolayısıyla tahtadaki
bütün meyveler tek malzeme paylaşıyor.

Izgara çözünürlüğü: normal meyvede 11, devlerde 17. On bir, bir karpuzun hâlâ
kabuk halkası + beyaz halka + çekirdek gösterebildiği en kaba değer.

Yutunca çıkan parçacıklar o bölümde küp — dönerek uçuyorlar, çünkü
eksenlerini koruyan bir küp sprite gibi duruyor. Diğer bölümlerde boncuk
olarak kalıyorlar. Mesh'ler bölümler arası havuzlandığı için geometri
havuza gömülmüyor, her doğuşta seçiliyor.

## Dev meyveler bütün, dilim değil

Dört meyvenin üçü kesilmiş dilim (silindir): yatıyorlar, siluetleri yok ve
bir tahta dolusu meyve bozuk para yığını gibi okunuyor. Devler bölümde
uğruna çalıştığın tek şey ve onlar da **daha büyük bir bozuk paraydı**.

Artık dev olan her meyve bütün ve dik duruyor:

- **karpuz** — çizgili küre
- **elma** — sapı ve yaprağı olan küre
- **muz** — yarım simit, yani yukarıdan da yandan da hilal
- **çilek** — zaten küreydi

Dilimler olduğu gibi kaldı: bir deliğin yuttuğu şey onlar, ve hepsini topa
çevirmek meyvenin ne olduğunu söyleyen kesik yüzleri götürürdü.

Üç ayrıntı ölçerek değil, **bakarak** çıktı:

- Kabuk dokusu silindir yanı için çizilmiş ve dört kez tekrarlıyor. Küreye
  sarılınca otuz küsur şerit ediyor ve karpuz yeşil bir deniz kestanesine
  dönüyor. Bütün form için tekrar 1.4'e indi — gerçek bir karpuzda bir düzine
  kadar şerit var.
- **Elmanın sapı şart.** Sapsız bütün elma kırmızı bir top, ve tahtada zaten
  kırmızı bir top var: çilek. Bölümün ayırt etmeni istediği iki dev
  yukarıdan aynı görünüyordu.
- **Devler ayrı bir yoldan kuruluyor.** `placeGiants()` ızgaradan sonra
  çalışıyor, dolayısıyla desenin `big` dediği meyveler yuvarlanmışken
  yerleştirilen devler dilim kalmıştı — aynı tahtada ikisi birden hata gibi
  duruyordu, ki öyleydi.

## Teknoloji mağazası (📺 Gadget Shop)

Dokuzuncu mekân, ve eşyaları oyunun geri kalanından iki bakımdan ayrılıyor.

**Ayırt edici bilgi üst yüze konuyor.** Bu kamera neredeyse tepeden bakıyor.
Gerçek bir televizyon gibi modellenmiş bir televizyon — ekranı öne bakan —
buradan turuncu bir sandıktır, o kadar. Ekran kapağa taşındı; düğmeler ön
kenara dizildi, çünkü düğmesiz haliyle bu bir kasa. Aynı sebeple vantilatör
sırtüstü yatıyor: ayakta duran bir vantilatör yukarıdan bir çizgi, yatınca
halka + dört kanat + göbek oluyor.

**Zemin oyunun en koyusu.** Eşyaların hepsi parlak kalıp plastik — turuncu,
mor, pembe — ve açık zeminlerin herhangi birinde bölüm lapaya dönüyor. Panel
dokusundaki dikiş de şart: düz koyu bir kare zemin değil, tahtadaki delik gibi
okunuyor.

Küçük eşyalar: televizyon, oyuncak org, kulaklık, saç kurutma makinesi, teyp,
vantilatör, dizüstü, telefon, oyun kolu. Devler: buzdolabı ve oyuncak
helikopter — helikopterin dört pervanesi gövdeden geniş bir artı çiziyor, ki
tahtada başka hiçbir şeyin silueti artı değil.

Saç kurutma makinesinin sapı ilk halinde namlunun **bittiği yerden**
başlıyordu; yukarıdan iki ayrı nesne aynı hücreye düşmüş gibi duruyordu. Sap
artık namlunun üstüne biniyor.

Tema üç desende çıkıyor: Orbits (3), Blocks (9), Whirl (12). Üçü de daha önce
çim ya da mermer zemindeydi; koyu zemin meyveyi de belirgin hale getirdi.

## Boyut kapısı (neden bölümler kolaydı)

Oyunun bütün zorluğu tek bir kuraldan geliyor: **delik, meyveden büyük
olmadan onu yutamıyor** (`f.r <= holeRadius * 0.92`). Üç kademe var —
sıradan meyve, iri meyve, dev. Bu kapı kapanmışsa bölüm kendini oynuyor.

Kapı kapanmıştı. Ölçtüğümüzde (`scratchpad/holegate.mjs`):

| bölüm | delik nerede başlıyordu | iri meyve için gereken | dev için |
|---|---|---|---|
| 1 | 0.62 | 27 meyve | tarlanın %31'i |
| 10 | 0.80 | **0** | %24 |
| 36 | 1.32 | **0** | **%6** |
| 45 | 1.50 | **0** | **%0** |

45. bölümde delik her şeyi yutacak boyda **başlıyordu.**

**Sebep bir satırdı:** `holeRadius = BASE_HOLE_R + (sizeStage - 1) * 0.02 + ...`
Bölüm başına 0.02'lik bedava başlangıç, sonsuza kadar. Oysa tarla 34 satırda
duruyor (13. bölüm). Alan büyümeyi bırakıyor, avans bırakmıyordu.

Dört değişiklik:

**Avans tarlayla birlikte duruyor.** `LEVEL_HEADSTART_CAP = 4`, yani en fazla
+0.08.

**Yükseltme kapıyı silmiyor.** Başlangıç boyutu yükseltmesi genel tavan olan
5 seviyeye kadar gidiyordu, 0.06'şar: tek başına +0.30, yani iri meyveyi
bölüm başlamadan açacak kadar. Artık 3 seviye × 0.03 = +0.09. Yükseltme
kapıyı **hafifletmeli**, kaldırmamalı. Bunun için `UPGRADES`'e seviye başına
`max` alanı eklendi.

**Büyüme yavaşladı.** `GROW_SWEEP` 0.90 → **1.4**: tarlanın tamamını
süpürmek artık deliği tavana çıkarmıyor, eksik bırakıyor.

**Kademeler açıldı.** Asıl mesele buydu: sıradan meyve 0.50 yarıçapındaydı,
1.05'lik hücreyi neredeyse dolduruyordu, dolayısıyla deliğin onları yutmak
için 0.62'de açılması gerekiyordu — ve 0.62, iri meyvenin istediği 0.78'e
zaten 0.16 uzaklıkta. Kapı, bölüm başlamadan yarı yarıya açıktı. Sıradan
meyve **0.46**'ya, açılış **0.55**'e indi; aradaki mesafe iki katına çıktı.

Sonuç, yükseltmesi tavanda bir oyuncuda bile:

| bölüm | başlangıç | iri için | dev için |
|---|---|---|---|
| 1 | 0.64 | 27 meyve | %30 |
| 15 | 0.72 | 21 meyve | %24 |
| 36 | 0.72 | 7 meyve | %25 |
| 45 | 0.72 | 8 meyve | %24 |

Devler her bölümde tarlanın dörtte biri ile üçte biri arasında açılıyor —
eskiden geç bölümlerde bedavaydı.

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
- **Kombo tekmesi kaldırıldı.** Çarpan yükseldiğinde kamera küçük bir tekme
  yiyordu. Üç turda düzeltilmeye çalışıldı, sonunda silindi — ve buradaki
  kayıt sayının küçültülmesi değil, silinme gerekçesi.

  İlki: tekme *her yemede* tazeleniyordu. Büyük delikle yoğun tarlada bir
  karede birkaç meyve birden yutuluyor, dolayısıyla sarsıntı tavanda çakılı
  kalıyordu ve bütün bölüm boyunca görüntü uğulduyordu. Sonra yalnızca
  çarpan **yükseldiğinde** tetiklenir oldu.

  İkincisi ve asıl "deprem" olanı: eksenlerden biri kosinüstü ve her tekmede
  `shakeT` sıfırlanıyor, yani `cos(0) = 1` kamerayı **ilk karede tam
  genliğe ışınlıyordu**. Sarsıntının kendisi 0.16 birimken iki kare arası
  sıçrama da 0.16 birimdi: göz sallantı değil, ışınlanma görüyordu — üstelik
  tam oyuncunun iyi gittiği anda. İki eksen de sinüs olunca tekme sıfırdan
  başlayıp birkaç karede şişti.

  Üçüncüsü: küçültülmüş haliyle bile gereksizdi. Görüş alanı ekran ne kadar
  geniş olursa olsun 10.8 birim, yani 1080 piksellik bir telefonda 1 birim =
  100 piksel. Genlik yarıya, eşik x3'ten x4'e indi ve tepe 3.4 piksele düştü;
  yine de kameranın deliği bırakıp oynadığı tek an oydu, hem de tam oyuncu iyi
  giderken. Türün başka hiçbir oyununda yok.

  | | ilk hali | salınım düzeltmesi | küçültülmüş | bugün |
  |---|---|---|---|---|
  | tepe genlik | 0.16 | 0.07 (7 px) | 0.034 (3.4 px) | — |
  | ilk karedeki sıçrama (60 FPS) | 0.16 | 0.022 | 0.010 | — |
  | süre | 0.14 sn | 0.15 sn | 0.15 sn | — |
  | eşik | x3 | x3 | x4 | — |

  Yolda öğrenilen iki şey, bir daha kamera oynatılırsa geçerli:

  **Çürüme yükselişten uzun yaşamalı.** Genlik düşürülüp çürüme 1.5/sn
  yapılınca zarf, sinüs kendi tepesine varmadan ölüyordu; geriye tek karelik
  bir pop kaldı. Sabit çürüme hızıyla genliği yarıya indirmek süreyi de
  yarıya indiriyor ve `sin(20t)` daha tepesindeyken zarf sıfırlanıyor — yani
  kamera tam ofsetten tek karede geri sıçrıyor. Aynı pop, öbür uçtan. Hız
  genlikten türetilirse (`KICK_DECAY = KICK_MAX / 0.17`) boyut şekli
  bozmuyor.

  **Oyun ve ölçüm aynı fonksiyondan geçmeli.** İkisi de kendi kopyasını
  taşıyordu; sayılar değişince test eski tekmeyi ölçmeye devam eder,
  değişiklik hiçbir şey yapmamış gibi görünürdü.

  Yutmanın ağırlığı tekmesiz de duruyor: meyve kendi renginde parçacıklara
  patlıyor, yakanın kenarı şişiyor, çarpan ekrana yazılıyor ve yeme sesinin
  perdesi zincirle yükseliyor.

- **`put()` dönüşü kurar, eklemez.** Eşyalar `put(grup, mesh, x, y, z, rx,
  ry, rz)` ile diziliyor ve fonksiyon içeride `mesh.rotation.set(...)`
  çağırıyor. Yani çağrıdan **önce** mesh'e verilen bir dönüş sessizce
  siliniyor. Parmak arası terliğin Y kayışı ile formanın kolları tam olarak
  böyle yazılmıştı: kod açıyı veriyor, ekranda hiç dönmüyorlardı. Terlik
  yukarıdan pembe bir yumurtanın üstünde iki paralel çubuktu ve sorun
  renkte, kalınlıkta, oranda arandı — hiçbiri değildi, açı hiç
  uygulanmıyordu. Açılar artık argüman olarak geçiyor; dönmesi gereken
  parçalar (vantilatör kanadı, helikopter pervanesi) zaten bir `Group`
  içinde, o yüzden onlar etkilenmiyordu.

- **Banner reklam menüyü yutuyordu.** Reklam native bir görünüm ve web
  görünümünün üstünde duruyor; sayfanın ondan haberi yok, ekranın tamamı
  kendisininmiş gibi yerleşiyor. Menüde en altta duran şey navigasyon
  şeridiydi — Levels, Upgrades, Goals, Awards — yani **reklam gören bir
  oyuncunun o dört ekrana ulaşma yolu yoktu.** Üstelik `#menu` içinde
  `overflow: hidden` vardı, dolayısıyla kaydırıp da bulunamıyordu. Telefonda
  çekilen bir kareyle ortaya çıktı; tarayıcıda reklam olmadığı için hiçbir
  testte görünmüyordu.

  Üç parça düzeltme:

  `--adPad` — bannerın yüksekliği. Adaptive banner sabit boyda değil, ekrana
  göre değişiyor, o yüzden sayı tahmin edilmiyor, eklentinin
  `bannerAdSizeChanged` olayından geliyor. Ama yalnız ona da güvenilmiyor:
  banner gösterilir gösterilmez 60px ayrılıyor, olay gelince gerçek değerle
  düzeltiliyor. Eklenti olayın adını değiştirirse menü sessizce yine
  ulaşılmaz hale gelirdi.

  Şerit **sabitlendi** (`position: absolute; bottom: var(--adPad)`). Akışın
  son elemanı olduğu sürece, üstündeki her şey biraz uzadığında aşağı
  itiliyordu.

  **Play düğmesi de sabitlendi.** O da akışın sonundaydı; kısa ekranda
  menünün var olma sebebi olan düğme reklamın altında kalıyordu.

  Ayrılan yer artık elle yazılmış bir sayı değil, şeridin ve tepsinin
  ölçülen yükseklikleri (`--navPad`, `--botPad`) — elle yazılan sayı,
  şeridin kendi dolgusu ve güvenli alan kadar yanlıştı.

  Ve düzeltmenin kendisi bir hata doğurdu: şeridin yüksekliği **açılışta bir
  kez** ölçülüyordu, oysa şeridin ikonları o ölçümden sonra yerleşiyor ve
  şeridi büyütüyor. Ölçüm 82 piksel, gerçeği 108. Play de 82 piksel yukarıya
  sabitlendiği için şeridin **arkasında** kaldı — şerit ondan sonra
  çizildiği için düğme ekrandan tamamen kayboldu. Yine telefondan gelen bir
  kareyle görüldü. Artık `ResizeObserver` ile şerit ya da tepsi her boyut
  değiştirdiğinde yeniden ölçülüyor; sıfır asla yazılmıyor, çünkü ikisi de
  bölüm oynanırken `display:none` olan `#menu` içinde.

  Bölüm yazısı (`#menuSub`) da aynı sebeple Play'in arkasında kaldı: Play
  akıştan çıkınca altındaki akış içeriği onun bulunduğu yere indi. O da
  sabitlendi, aynı bloğun parçası.

  `scratchpad/holead.mjs` bunu üç ekran boyunda kontrol ediyor: reklamı gri
  bir şeritle taklit edip her düğmenin alt kenarının reklamın üstünde
  kaldığını ölçüyor. Üstelik artık **üst üste binmeye** de bakıyor — Play
  şeridin, bölüm yazısı da Play'in üstünde mi. İlk hâli buna bakmadığı için
  ikinci hatayı yakalayamamıştı.

- **Tarla bomboş kalıyordu, arayüz çalışmaya devam ediyordu.** Android
  WebView, sistem belleği geri istediğinde WebGL bağlamını düşürüyor —
  telefonda bu çoğu zaman uygulama arka plana atıldığında, yani her reklam
  ekranda kaldığında oluyor. Hiçbir şey hata fırlatmıyor: tuval çizmeyi
  bırakıyor, HUD, düğmeler ve geri sayım hiçbir şey olmamış gibi devam
  ediyor. Oyuncu bomboş bir tarlaya bakarken süresi işliyor ve bölümü
  kaybediyor.

  Varsayılan davranış hiçbir şey yapmamaktan da kötü: `webglcontextlost`
  olayı **iptal edilmezse** tarayıcı bağlamı hiç geri getirmiyor.

  Üç satır: olay iptal ediliyor, oyun duraklatılıyor (boş ekrana bakarken
  bölüm kaybetmek, boş ekrandan da kötü tek sonuç), ve bağlam geri gelince
  `renderer.resetState()` ile three'nin kendi GL durumu sıfırlanıyor. Bütün
  dokular ve geometriler kodla üretildiği ve bellekte durduğu için ilk
  karede kendiliğinden yeniden yükleniyorlar.

  `scratchpad/holecontext.mjs` bunu `WEBGL_lose_context` uzantısıyla bilerek
  düşürüp ölçüyor: kare boşalıyor mu, saat duruyor mu, geri gelince tarla
  yeniden çiziliyor mu. Ölçüm sayfanın ekran görüntüsünden alınıyor —
  WebGL tuvalini 2B tuvale `drawImage` ile kopyalamak işe yaramıyor, çünkü
  `preserveDrawingBuffer` olmadan çizim tamponu kare sonunda siliniyor ve
  her ölçüm "tek renk" çıkıyor.

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

### Test reklamı mı, gerçek reklam mı: hatırlamak zorunda değilsin

`index.html` içinde `const ADS_TESTING = true;` duruyor ve **kaynak dosyada
hep true kalıyor.** Elle çevirmiyorsun; hangi komutu çalıştırdığın
belirliyor:

| Komut | Reklamlar | Nerede kullanılır |
|---|---|---|
| `npm run aab:fruithole` | **test** | kapalı test, kendi telefonunda deneme |
| `npm run release:fruithole` | **gerçek** | yalnızca üretime yüklenecek derleme |

`build-www.mjs` `LIVE_ADS=1` görürse `www-fruithole/`'a yazarken sabiti
`false`'a çeviriyor — `fruithole/index.html`'e dokunmuyor, yani depo hep
güvenli halde duruyor. Her derleme hangisini ürettiğini de yazıyor:

```
www-fruithole/index.html güncellendi (Fruit Hole) — reklamlar test.
www-fruithole/index.html güncellendi (Fruit Hole) — REKLAMLAR GERÇEK. ...
```

Bunun elle çevrilen bir sabit olması iki yönde birden tuzaktı ve ikisi de
pahalıydı: **açık unutulursa** üretim sürümü test reklamı gösterir, iki
hafta beklersin ve sıfır kazanırsın; **kapalı unutulursa** kendi
telefonunda kendi canlı reklamına tıklarsın, bu da AdMob hesabını
kapattırır. Tek savunma "unutma" idi. Artık yanlış olan şey yanlış komut
çalıştırmak, o da çıktıda yazıyor.

`release:fruithole` ile ürettiğin `.aab`'yi **kendi telefonuna kurma.**
Play'e yükle, gerisini testçiler oynasın.

Tarayıcıda reklam çağrıları no-op'tur; ödüllü reklam doğrudan `true`
döner, yani oyun reklam ağı olmadan da birebir aynı oynanır.

| Yer | Reklam | "Reklamsız" alınırsa |
|---|---|---|
| Süre bitti ekranı, "📺 +15 saniye" | rewarded (bölüm başına 1) | kalır (isteğe bağlı, oyuncu lehine) |
| Her 3 bölümde bir, sonraki bölüme geçerken | interstitial | kalkar |
| Oyun sırasında altta | banner | kalkar |

### Reklam ekranı kaplarken saat işliyordu

Telefondan gelen bir kare: **42. bölüm, tarla bomboş beyaz, saat 2:02**, ve
üstünde boyanmayan bir geçiş reklamının kalıntısı — kırık bir resim simgesi,
sağda sessize alma şeridi, bir geri sayım. Oyunun kendisinden gelemezdi:
`index.html` içinde **tek bir `<img>` etiketi yok** (her şey prosedürel
geometri ve tuval dokusu), ekranda gördüğü "Size 1" yazısı da dosyanın
hiçbir yerinde geçmiyor. Yani beyaz alanın üstündeki her şey reklam
görünümüydü, altındaki boş tarla ise düşen WebGL bağlamıydı.

Asıl mesele şuydu: **arkada bölüm çalışmaya devam ediyordu.** `nextLevel()`
geçiş reklamını gösterip hemen `startLevel()` çağırıyor, yani tarla kuruluyor
ve geri sayım reklamın altında işlemeye başlıyor. Oyuncu reklamı kapattığında
zaten kaybetmiş oluyor.

`visibilitychange` zaten dinleniyordu ama yalnızca müziği susturuyordu. Artık
**oyunu da duraklatıyor**:

```js
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { pauseGame(); music.stop(); }
  else refreshMusic();
});
```

Duraklamayı reklam SDK'sının kendi olaylarına değil buna bağlamak bilinçli:
hangi isimle gelirse gelsin **her tam ekran reklam web görünümünü arka plana
atıyor**, gelen arama da atıyor, oyuncunun başka uygulamaya geçmesi de.
Üçünün de doğru cevabı aynı. Geri gelindiğinde oyun kendiliğinden devam
etmiyor, duraklama paneli duruyor — yarım bırakılmış bir sürüklemeye
körlemesine dönmek yerine oyuncu kendi başlatıyor.

Ölçümü `scratchpad/holehide.mjs` yapıyor. Oradaki gizlenme taklit: headless
Chromium'da ikinci bir sayfayı öne getirmek sekmeyi gizli saymıyor
(`document.hidden` false kalıyor, test hiçbir şey ölçmemiş oluyor), o yüzden
özellik geçersiz kılınıp olay elle gönderiliyor. Sınanan şey olayın kendisi
değil, oyunun ona verdiği tepki.

### Ödüllü reklam asla askıda kalmamalı

`showRewarded()` yalnızca `onRewardedVideoAdDismissed` olayını bekliyordu.
Gösterilip de kendini kapatmayan bir reklam — boyanmayan bir kreatif tam
olarak bunu yapıyor — sözü sonsuza kadar askıda bırakıyordu. Çağıran taraf
`revive()` ve ilk iş olarak kendi düğmesini kapatıyor; yani oyuncu, artık
hiçbir şey yapmayan bir "📺 +15 saniye" düğmesiyle kayıp ekranında kalıyor,
tek çıkış uygulamayı öldürmek oluyordu.

Artık her çıkış kapalı: ödül, kapanma, **iki başarısızlık olayı**
(`onRewardedVideoAdFailedToLoad`, `onRewardedVideoAdFailedToShow`) ve
eklentiden hiçbir şey gelmemesi ihtimaline karşı 90 saniyelik bir bekçi.
Ne olursa olsun söz **bir kez** çözülüyor.

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
node scratchpad/holecircles.mjs  # Bubbles daireleri yuvarlak ve ayrık mı
```

`window.fruitHoleShake()` kameranın anlık konumunu veriyor. Ölçtüğü kombo
tekmesi kaldırıldı ama kendisi kaldı: artık baktığı şey, kamerayı delikten
başka **hiçbir şeyin** oynatmadığı.

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
