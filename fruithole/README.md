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
  ve `100 + yıldız×50 + bölüm×8` kadar rastgele bir meyve verir. O bölümde bir
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
Yükseklikler artık hat başına ayrı yazılıyor.

**Kuleler bir kez uzatıldı.** Eskiden iç hatlar ~5, dış hatlar ~3.8 birimde
duruyordu; rakip oyunların yanında kule değil çubuk gibi okunuyorlardı.
Şimdi iç hatlar **~9.5**, dış hatlar **~6.5** birim.

Ama yalnızca yüksekliği artırmak yetmiyor. Oyun kamerasının açısında bir
kule ekrana yaklaşık `h·sin(27°)`, yani dünya birimi başına ~17px
yükseliyor. Kule uzadıkça tepesi, aynı hatta arkasında duran kulenin
tabanını geçiyor ve ikisi tek bir şerit olarak okunuyor — aradan
geçilebildiği görünmez oluyor. Eski dört satırlık aralıkta dokuz birimlik
bir kule bunu yapıyor.

O yüzden aralık da yükseklikle birlikte açıldı: **dört satır yerine altı**.
Değişiklikten sonra ölçüldü (`fruitHolePillarGaps`, 412×915): en sıkışık iç
çiftte **49px**, dış hatlarda **100px** zemin görünüyor. Daha az ama çok
daha iri kule — kopyalanmak istenen şekle de bu daha yakın.

Bölüm bundan zorlaşmıyor: 42. bölüm 127 saniyede 277 meyve taşıyor, saniyede
2.18. Yanındaki Chevrons 2.52'de duruyor.

Ölçen dosya `scratchpad/holepillar.mjs`. Sayı tek başına yetmiyor, kareye de
bakmak gerekiyor — `/tmp/pillar/play.png` yazıyor.

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

## Bir kare kaça patlıyor

Ölçüldü, ve sayı iyi değil: **oynanırken en ağır kare ~1000 çizim çağrısı**
(24. bölüm, tarla). Orta segment bir Android'de rahat sınır kabaca 300.

```
 düzen     | tema             | meyve | çizim çağrısı
 Cross     | tarla            |   504 |           995
 Ring      | arabalı sinema   |   458 |           762
 Pyramid   | kumsal           |   254 |           701
 Blocks    | mağaza           |   445 |           437
 Wave      | pazar            |   163 |           346
 Piles     | pazar            |   115 |           279
```

Sebep tek cümle: **her meyve ayrı bir nesne**, yani her biri ayrı bir çizim
çağrısı. Beş yüz meyvelik bir tarla beş yüz çağrı demek.

`scratchpad/holecost.mjs` bu soruyu zaten soruyordu ama yanlış kameradan:
tahtayı kurup ölçüyor ve o sırada kamera bütün tarlayı kadraja alıyor —
telefonda öyle bir kare yok. `scratchpad/holeframe.mjs` bölümü başlatıp
gerçekten oynuyor ve on karenin en kötüsünü alıyor. Beklenenin aksine sayı
**düşmedi**: oyunun kendi kamerası da tarlanın çoğunu görüyor.

**Gölge geçişi bu sayının içinde değil.** `renderer.info` yalnızca ana geçişi
sayıyor — aynı kare gölge açık, gölge kapalı ve meyve gölgeleri kapalı
çizilip sayaç okundu, üçü de aynı çıktı (`fruitHoleFrameSplit`). Gölgenin
bedeli süreyle ölçüldü: 19. bölümde kare 3.42 ms'den 2.08 ms'ye iniyor, yani
karenin kabaca %40'ı. Telefonda oran başka olur ama sıfır değil.

Çözüm belli: aynı geometri ve malzemeyi paylaşan meyveleri tek çağrıda çizmek
(instancing). Bin çağrı yirmiye iner. Ama düşme animasyonu, yeme animasyonu,
mıknatıs ve gölgeler meyvenin kendi nesnesine dokunuyor, yani bu oyunun çizim
yolunu baştan kurmak demek. Ölçüm burada duruyor; karar, gerçek telefonda
takılma görülürse verilecek.

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

## Günlük meydan okuma

Oyunun cevabı olmayan tek şey buydu: **yarın açmak için bir sebep yok.**
Bölümler bitmiyor ama bitmemesi de bir şey vermiyor — desenler mod ile
dönüyor, tarla 34 satırda duruyor, yani 200. bölüm 40. bölümle aynı. Oyunun
kendi içinde ikinci bir gün açmak için bir neden yoktu.

Artık günde bir tarla var ve **herkeste aynı tarla.**

**Çevrimdışı, bilerek.** Hesap yok, sunucu yok, giriş yok: tohum tarihin
kendisi, dolayısıyla iki telefon hiç konuşmadan aynı sonuca varıyor. Liderlik
tablosu sonradan üstüne konabilir ve tarla o gün geldiğinde zaten adil olur.

### Tek iddia: aynı gün, aynı tarla, aynı delik

İkisinden biri doğru değilse iki koşuyu karşılaştırmak anlamsız, yani mod
anlamsız.

**Aynı tarla** için tarlayı kuran rastgelelik tohumlandı (`rnd()`, mulberry32).
Ayrıntısı yukarıda değil aşağıda: bkz. *Tohumlu tarla*.

**Aynı delik** için günlük koşuda yükseltmeler kapalı. Tek satır:

```js
function upg(id) { return dailyRun ? 0 : (upgrades[id] || 0); }
```

Delik boyutu, hız, saat ve mıknatıs — dördü de `upg()`'den okuyor, o yüzden
bir satır hepsini kapsıyor. Açık bıraksaydım skor **oyunu ne kadar oynadığını**
ölçerdi, o gün nasıl oynadığını değil; ve liderlik tablosu geldiği an tablo
kimin daha önce başladığının listesi olurdu.

`sizeStage` de 1'e sabitleniyor, yani bölüm başına gelen açılış payı da yok.

### İlerlemeye dokunmuyor

Ne bölüm ilerliyor, ne yıldız yazılıyor, ne sandık düşüyor. Günlük koşu o
günün skoru ve seri için oynanıyor. Meyve de ödeseydi "herkese aynı tarla"
bir tarlaya dönerdi ve avantajı doğrudan en çok tekrar oynayana geri verirdi
— tasarımın kaçındığı şeyin ta kendisi.

### Seri gün sayıyor, koşu değil

Tekrar oynamak serbest, en iyi skor tutuluyor. Ama seri yalnızca günün **ilk
bitmiş koşusunda** ilerliyor; yoksa aynı gün ikinci koşu ikinci gün sayılırdı.

### Günün üç sayısı da tohumdan, `rnd()`'den değil

Desen, satır sayısı ve tohum ayrı ayrı `seedFromKey(gün)`'den çekiliyor.
`rnd()` ile seçilselerdi, seçim tarlanın kurulacağı üreteci ilerletirdi —
tahta, kendisinden önce kaç seçim yapıldığına bağlı olurdu. Bugün sorun
değil; ama o seçimlerden biri değiştiği gün **geçmişteki her günün tarlası
sessizce başka bir tarlaya dönerdi.**

### Ölçüm

`scratchpad/holedaily.mjs`, 15 kontrol. En önemlisi ilki: iki bambaşka oyuncu
profili açılıyor — biri 3. bölümde, hiç yükseltmesi yok; öbürü 44. bölümde,
hepsi dolu — ve ikisi de günlük koşuyu başlatıyor.

| | A | B |
|---|---|---|
| profil | bölüm 3, yükseltmesiz | bölüm 44, hepsi dolu |
| tarla parmak izi | `ff9f36ec` | `ff9f36ec` |
| meyve | 116 | 116 |
| deliğin açılışı | 0.55 | 0.55 |

Normal bölümde ise aynı iki oyuncunun deliği 0.59 ve 0.72 — yani yükseltmeler
gerçekten satın alınmış, günlükte yalnızca yok sayılıyor.

Testte bir tuzak vardı ve kendi kendini yakaladı: delik ilk sürümde koşu
başladıktan 1.2 saniye sonra ölçülüyordu ve o sırada çoktan meyve yiyip
büyümüş oluyordu (0.5635'e karşı 0.55). İddia açılış genişliği hakkında, o
yüzden ölçüm `startRadius`'tan alınıyor.

## Tohumlu tarla

Tarlayı ne kurduysa `Math.random()` yerine `rnd()`'den çekiyor. Tohumsuzken
`rnd()` zaten `Math.random`, hiçbir şey değişmiyor; tohumlanınca aynı tohum
aynı tarlayı — her parçanın hangi yöne baktığına kadar — yeniden kuruyor.

**Yalnızca düzeni belirleyen on çağrı taşındı:** devlerin yeri, bir hücrenin
eşya alıp almadığı, istifin boyu, parçanın dönüşü, hangi eşyanın seçildiği.
Kalan elli küsuru bilerek `Math.random`'da kaldı — zemin dokuları, konfeti,
ses titremesi. Onları tohumlamak hiçbir şey kazandırmazdı, ve konumu kaç
konfeti çizildiğine bağlı bir üreteç zaten yeniden üretilebilir değil.

Gün anahtarı FNV-1a ile tohuma çevriliyor. Oyuncuya zaten gösterilen yerel
takvim tarihinden kuruluyor, yani tartışılacak bir saat farkı yok.

`fruitHoleFieldHash()` tahtanın parmak izini veriyor: her parçanın yeri,
yüksekliği, türü, boyu ve dönüşü. Ölçüldü — 3, 9, 14 ve 42. bölümlerde aynı
tohum tarlayı birebir tekrar kuruyor (180, 417, 273 ve 262 parça), farklı
tohum farklı tarla veriyor, tohumsuz kuruluş hâlâ koşudan koşuya değişiyor.

## Liderlik tablosu

Oyun tarafı yazıldı, **kapalı duruyor.** Kurulum adımları
`fruithole/store/leaderboard-setup.md` içinde.

Günlük meydan okuma zaten bir liderlik tablosunun zor yarısını çözmüştü:
herkese aynı tarla, herkese aynı delik. Kalan kolay yarısı günün skorunu
herkesin görebileceği bir yere göndermek.

**Oyun eklentinin var olup olmadığını umursamıyor.** Eklenti yoksa —
tarayıcıda, ya da eklenti eklenmeden önce yapılmış her derlemede —
`gamesReady()` false dönüyor, 🏆 düğmesi hiç görünmüyor, skor gönderimi
sessizce hiçbir şey yapmıyor. Bu bilinçli: yayınlanmış eklenti **Capacitor 5
için**, proje **8'de**, ve derlenip derlenmeyeceğini ancak gerçek bir Android
derlemesi söyler. Oyunun o cevap gelene kadar da eksiksiz çalışması gerekiyor.

Bu konteynerde doğrulanamayan şeyler, açıkça: **Android SDK yok ve native
proje burada değil**, o yüzden eklentinin derlendiğini görmedim. Doğrulanan
şey, tarayıcıda eklenti yokken oyunun hiç etkilenmediği
(`scratchpad/holedaily.mjs`, 6. bölüm).

`LEADERBOARD_ID` boş kaldığı sürece tablo kapalı — o satır anahtar.

### Eklenti durumu (12 Eylül 2026'da bakıldı)

Koddaki `GameConnect`, `@openforge/capacitor-game-connect` eklentisinin adı.
npm'de durum: **son sürüm 5.0.2, son yayın 2023-12-04, `@capacitor/core: ^5.0.0`.**
Üç yıla yakın güncellenmemiş ve Capacitor 5 hedefliyor. Bu yol kapalı.

Capacitor 8 için iki alternatif var, ikisi de MIT. İkisinin de yayınlanmış
kodu indirilip okundu (15 Eylül):

| paket | sürüm | liderlik modülü | ilişki |
|---|---|---|---|
| `@idleflowgames/capacitor-play-games` | 0.3.0 | 27 satır: gönder + göster | orijinal |
| `@modbender/capacitor-play-games` | 0.4.0 | 189 satır: üstüne skor listesi, sıralama, metadata | çatallanmışı — Kotlin paket adı hâlâ `com.idleflowgames.playgames` |

İkisi de `com.google.android.gms:play-services-games-v2:22.0.0` kullanıyor,
yani güncel SDK.

**Kod beklenenden iyi.** `submitScoreImmediate` doğru çağrı ve yorumlar
SDK'nın ince noktalarını bilen birinin yorumları: liderlik intent'inin bir,
iki ve üç argümanlı sürümleri arasındaki fark (kısa olanı zaman aralığını
PGS arayüzüne bırakıyor, uzun olanı zorluyor), skor tamponunun ve onu tutan
holder'ın **iki ayrı** serbest bırakılabilir kaynak olduğu, ve yukarıda
`@NonNull` bildirilmiş bir dönüşün yine de null kontrolünden geçirilmesi.
Stub değil.

**Yine de alınmadı.** Sebep kod değil:

- İkisi de **0.x ve bir haftalık**, tek geliştirici, sicil yok. Kodun iyi
  olması bakımın süreceğini göstermiyor.
- SDK **minSdk'yi 24'e çıkarıyor** (build.gradle'daki kendi yorumları
  söylüyor). Projenin şu anki değeri `android-fruithole/variables.gradle`'da
  ve bu depoda o klasör yok; eklemeden önce bakılmalı. Android 6 cihazlar
  düşer.
- Ve asıl sebep: satın alma **henüz telefonda denenmedi**. Native tarafa yeni
  bir bağımlılık sokup derlemeyi bozmak, o an doğrulanması gereken şeyi de
  engeller.

**16 Eylül'de `@modbender/capacitor-play-games` alındı.** Satın alma
telefonda doğrulandıktan sonra, yani beklenen koşul gerçekleşince. İki
adaydan bu seçildi: hem daha eksiksiz hem görünür biçimde daha dikkatli
yazılmış, ve gönder + göster zaten ikisinde de var.

Kodu eklentinin gerçek API'sine uyarlarken **iki sessiz hata** ortaya çıktı.
İkisi de aynı biçimde sessiz: `gamesReady()` false olunca bütün katman
kapanıyor ve her çağrı bir catch bloğunun içinde, yani yanlış olan şey ne
olursa olsun sonuç aynı — tablo çalışmıyor, hiçbir yerde hata yok.

- **Eklenti adı.** Kod `_Cap.Plugins.GameConnect` okuyordu; bu, artık
  kullanılmayan @openforge eklentisinin adı. Yenisi kendini `PlayGames` diye
  kaydediyor (`@CapacitorPlugin(name = "PlayGames")`). Yanlış ad `_Games`'i
  null bırakır, `GAMES_ON` false olur ve eklenti kurulu olsa bile tablo hiç
  açılmaz.
- **Parametre adı.** Çağrılar `leaderboardID` gönderiyordu (büyük D), eski
  eklentinin istediği buydu. Bu eklenti `leaderboardId` bekliyor. Yanlışı
  gönderilince kimlik tanımsız kalıyor, istek reddediliyor, catch onu
  yutuyor.

`scratchpad/holeboard.mjs` eklentinin yerine çağrıları kaydeden bir sahtesini
koyup ikisini de yakalıyor: `PlayGames` adıyla bulunuyor mu, koşu bitince
`submitScore` **`leaderboardId`** anahtarıyla ve doğru kimlikle gidiyor mu,
🏆 düğmesine basınca `showLeaderboard` aynı şekilde çağrılıyor mu. Ayrıca
açılışta zorlayıcı giriş ekranının çıkmadığını (silent giriş) ve oyuncu
girişi reddettiğinde oyunun çalışmaya devam edip düğmenin gizli kaldığını
kontrol ediyor.

**Yine de derlendiği görülmedi.** Bu kutuda Android SDK yok. `npx cap sync
android` çıktısındaki "Found N Capacitor plugins" satırı eklentinin kabul
edilip edilmediğini söyleyen tek yer; satın alma eklentisinin Capacitor 8'le
uyuştuğunu da böyle bilmiştik.

Denendiğinde ilk bakılacak şey `npx cap sync android` çıktısındaki "Found N
Capacitor plugins" satırı — eklenti orada görünmüyorsa Capacitor onu kabul
etmemiştir. (@capgo/native-purchases orada göründüğü için IAP'nin Capacitor
8'le uyuştuğunu böyle bilmiştik.)

Play Console tarafı eklentiden bağımsız ve daha uzun sürüyor: liderlik
tablosunun kendisi, Play Games Services kurulumu ve OAuth istemcisi. O kısma
istenildiği zaman başlanabilir, adımlar `store/leaderboard-setup.md` içinde.

Buradan çıkan ders zaten bir kez ödendi: IAP için aylarca README'de yazan
RevenueCat yolu da aynı şekilde Capacitor 5'te kalmıştı. **Bir eklentiyi
yazmadan önce npm'deki `peerDependencies` satırına bakmak, sonra bir derleme
turunu geri almaktan ucuz.**

Skor **her koşuda** gönderiliyor, yalnızca kişisel rekorda değil: Play zaten
oyuncu başına en yükseği tutuyor, ve yalnızca rekorları göndermek bir günün
ilk skorunu (dünkünden düşükse) kaybettirirdi.

Play Games tabloları GÜNLÜK, HAFTALIK ve TÜM ZAMANLAR pencerelerini kendisi
tuttuğu için tek tablo yetiyor — gece yarısı değişen bir tarla için istenen
şey zaten "bugünün sıralaması".

## Yeni oyuncunun ilk ekranı

Üretime çıkmadan önce oyunun ilk altmış saniyesine bakıldı, çünkü kalan her
şey ona bağlı — insanlar orada bırakıyor. İki şey çıktı, ikisi de kötüydü.

**Oyunu görmeden önce bir reklam teklifi.** Sıfırdan kurulmuş bir telefonda
ilk açılan ekran günlük ödül ekranıydı: *"Daily Reward — Day 1 streak — 35
Banana"*, ve en üstte yeşil bir **📺 Claim double**. Her parçası o an için
yanlış. Bir günlük seri hiçbir şeyin serisi. Otuz beş muz, henüz görülmemiş
bir dükkânın parası. Ve oyunun oyuncudan ilk isteği, ona herhangi bir şey
istemek için sebep vermeden, bir reklam izlemesi.

Artık oyuncu bir bölüm bitirene kadar çıkmıyor (`playedBefore()`). Ödül
kaybolmuyor; ertesi açılışta, bir anlamı olduğu yerde duruyor — o zaman
harcayacağı bir dükkânı ve sürdürmeye değer bir serisi var.

Ölçüt `stats.levels`, `stats` nesnesinin varlığı değil: dört sayaç oyun
yüklenir yüklenmez sıfırlarla dolduruluyor, yani "stats var mı" hiç
çalıştırılmamış bir telefonda da doğru dönüyor. İlk denemem tam olarak bu
yüzden hiçbir şeyi değiştirmedi.

Bir de düğme sırası ters duruyordu: yeşil "Claim double" sarı "Claim"in
üstündeydi. Bedava olan, başparmağa en yakın olan olmalı; isteğe bağlı bir
reklam asla ilk okunan düğme değil.

## Menü sahnesi her yolda kuruluyor

Yukarıdakini düzeltirken ortaya çıktı ve **eskiden beri vardı**: `showMenu()`
yalnızca günlük ödül ekranı kapatılınca çağrılıyordu. O ekranın çıkmadığı her
açılışta — aynı günün ikinci açılışında da — menü hiç kurulmuyordu. Ekrana
gelen şey, açılışta `buildField()`'in kurduğu **1. bölümün tam tarlasıydı**:
logonun arkasında ondört meyvelik halka yerine dolu bir oyun alanı, ve `state`
hiç `'menu'` olmuyordu.

`showMenu()` artık açılışta doğrudan çağrılıyor, günlük ekranı da üstünü
örtüyor. Menüye giden her yol aynı yerden geçiyor.

`scratchpad/holeaudit.mjs` ikisini de tutuyor: ilk açılışta günlük ekranın
çıkmadığını, menünün kurulduğunu (`state === 'menu'`), bir bölüm bitirdikten
sonraki açılışta ödülün çıktığını ve bedava düğmenin reklamlıdan önce
geldiğini.

## İsim: Peelo

Oyun **Peelo: Fruit Hole** oldu. Paket kimliği (`com.kaancetinkaya.fruithole`)
değişmedi — kullanıcıya görünmüyor ve zaten değiştirilemiyor.

**"Fruit Hole" sahiplenilebilir bir isim değildi.** Play'de neredeyse birebir
aynı adı taşıyan dört uygulama var: *Fruit Hole*, *Fruit hole: Black hole*,
*Fruit in Holes*, *Fruits In Hole*. Üstelik o ismi arayanları karşılayan bir
hayran sitesi (fruitholelevel.com) hepsinden önde çıkıyor.

"<bir şey> Hole" kalıbının tamamı da dolu: Munch Hole, Yummy Hole, Feed The
Hole, Hole Swallow All, Eat All: Hole Game, Fill This Hole, Hole Puzzle,
O! Hole! — ve üstlerinde Hole.io, All in Hole, Hole Stars. Yeni bir
uygulamanın "hole" kelimesinde sıralanması bir plan değil.

Aranan ve akılda kalan yarı öne geçti ve bize ait: *Peelo* ne Play'de ne de
marka aramasında karşılık verdi. Açıklayıcı yarı arkada duruyor, anahtar
kelimelerini oradan da kazanıyor — sadece kırk kişilik kuyruğun sonunda
değil.

Başlıkta 13 karakter boş kaldı ve **bilerek boş bırakıldı**: Play başlığa
anahtar kelime tıkıştırmayı spam sayıyor, o iş kısa açıklamada yapılıyor.

Menüde marka, başlığın üstüne küçük ve daha hafif yazılıyor — başlıkla
yarışan ikinci bir başlık değil, üstüne atılmış bir imza. Konturun harfleri
em kutusunun dışına taşırması yüzünden `line-height: 1`'de "Peelo"nun kuyruğu
alttaki F'nin içine giriyordu; kendi satır aralığı ve kendi daha hafif gölgesi
var.

## Patron bölümleri

Bölümler bitmiyordu ve asıl sorun buydu. Desenler on dokuzda, temalar dokuzda
bir dönüyor, tarla 34 satırda duruyor — yani **200. bölüm 40. bölümün ta
kendisi.** Yüzüncü tarlayı temizlemek kırkıncıyı temizlemek gibi geliyordu,
çünkü öyleydi. İleride hiçbir şey yoktu.

Artık her **10. bölümde** tahtanın karşı ucunda tek bir kolos duruyor: deliğin
açıldığı noktanın aynadaki karşılığı, yani ilk kareden itibaren ekranda ve ona
ulaşmak için her şeyi geçmen gerekiyor. Her devden geniş, o yüzden erken
alınamıyor — tek yolu tarlayı süpürmek. Oyunun bütün zorluk eğrisi, görebildiğin
tek bir nesneye doğrultulmuş oluyor.

**Yeni bir kazanma koşulu gerekmiyor.** Tahtadaki en büyük şey olduğu için
zorunlu olarak sonuncu; "tarlayı temizle" zaten "onu yut" demek.

### Ölçüm: %63-84 — ve önceki sayı yanlıştı

Kolos açılana kadar tahtanın **%63-84'ü** yenmiş olmak zorunda (devler için bu
oran %23-34). Kalan pay, kolosun tam anlamıyla son parça olmasını değil, son
iş olmasını sağlıyor.

Burada aylarca **%88 ve %30** yazıyordu ve o sayılar hiçbir zaman doğru
değildi. Üç ayrı yer — `holebalance.mjs`, `holeboss.mjs` ve oyunun kendi dev
boyutlandırması — kaç parça yemek gerektiğini **her parçayı bir birim sayarak**
hesaplıyordu. Oysa `eatFruit` büyük meyveyi 3×, devi 9× büyütüyor. Tahtada
zaten %10 kadar iri meyve olduğu için üç hesap da olduğundan yüksek çıkıyordu.

Görülmesi, iri payının %28'e çıkarılmasıyla oldu: sayı düzelmek yerine **%110**
dedi, yani "tarlanın tamamı bile yetmiyor". Bir testin verdiği imkânsız cevap,
verdiği yanlış cevaptan iyidir — yanlışı üç ay kimse fark etmedi.

Üçü de artık tahtanın kendi karışımıyla ağırlıklandırıyor (`fruitHoleMix()`),
tahminle değil: desenden desene iri payı %19 ile %62 arasında değişiyor, yani
tek bir ortalama da yazılamazdı.

### Zorlaştırmıyor — ama bunu ölçmek üç deneme aldı

**Bir bot oynattım, işe yaramadı.** Bot normal bölümlerde de kaybediyordu
(19. bölümde 501 meyvenin 89'u). Beceriksizliğini patronun zorluğu sanmak
olurdu; kanıt üretmeyen bir testi tutmanın anlamı yok.

**Aynı deseni paylaşan bölümleri karşılaştırdım** (desenler 19'da bir dönüyor,
yani 20↔39). O da yanıltıcı çıktı: aynı desende bile meyve sayısı ve saat
bölümden bölüme değişiyor, ölçtüğüm fark kolostan gelmiyordu.

**Değişkeni gerçekten izole etmek gerekti:** aynı bölüm, aynı tohum, bir
kolosla bir de kolossuz. Tohumlu tarla zaten vardı (günlük meydan okuma için
yazılmıştı), `forceBoss` de test için eklendi. Tarlanın geri kalanı birebir
aynı, aradaki tek fark kolos.

Bu da bir kez yanlış sayıyı okudu: `fruits` dizisi kolosun ayağının altında
temizlenen parçaları da tutuyor (`eaten` işaretli ama dizide duruyorlar), o
yüzden dizinin uzunluğuna bakmak her bölümde "+1" diye cevap verdi. Sayılması
gereken **canlı** parça.

| bölüm | kolossuz | kolosla | fark |
|---|---|---|---|
| 10 | 399 | 376 | −23 |
| 20 | 273 | 274 | +1 |
| 30 | 402 | 386 | −16 |
| 40 | 318 | 318 | 0 |

Saat hiçbirinde değişmiyor. Kolos ayağının altındaki hücreleri temizleyip
yerlerine geçtiği için genelde işi **azaltıyor**; Pyramid ve Chevrons gibi
karşı ucu zaten boş olan desenlerde çıplak zemine düştüğü için tek parça
ekliyor — 273'te 1. Testin sınırı bu yüzden oran: tahtanın %1'inden fazlasını
eklememeli.

### Bölüm haritası

Harita kesintisiz bir sayı duvarıydı — bölümlerin kendisiyle aynı sorun:
nerede olduğunu ve ne kadar geldiğini işaretleyen hiçbir şey yok. Artık onarlı
bloklara ayrılmış, her bloğun başında o blokta toplanan yıldız yazıyor, patron
bölümleri mor ve taçlı.

## Süper mıknatısın görüntüsü

Booster'ın hiç görseli yoktu. Bir zamanlayıcı kuruyor, bir satır yazı basıyor,
sonra sekiz saniye boyunca ekranda **açık olduğunu, nereye kadar eriştiğini
ya da bittiğini** söyleyen hiçbir şey olmuyordu. Meyveler kayıyordu — ama
sıradan mıknatıs *yükseltmesi* de tam olarak bunu yapıyor. Yani para verdiğin
şey, zaten sahip olduğun şeyden ayırt edilemiyordu. **Göremediğin booster'ı
kimse ikinci kez almıyor.**

Artık zeminde çekim menzilini gösteren bir halka var.

**`holeGroup`'un içine konamıyor.** O grup `holeRadius` ile ölçekleniyor, oysa
menzil `holeRadius` **artı sabit 1.6** — grubun içinde olsaydı yanlış çarpanla
gerilir ve çekimin nerede bittiği konusunda yalan söylerdi. Kendi nesnesi,
doğrudan menzile ölçekleniyor.

**İki halka, bir değil.** İlk sürüm tek soluk camgöbeği çizgiydi ve açık kumda
görünmüyordu — ölçülebilir şekilde oradaydı, gözle yoktu. Altına koyu bir
halka kondu; deliğin kendi kenarında da aynı sebeple var ("açık kum üzerinde
açık bir yaka sınırsız kalıyor"). Kumda, karda ve mermer zeminde çalışıyor.

**Nefes almayı kaldırdım.** Halka önce boyutça %2 titriyordu; canlı
görünüyordu ve yalandı: halkanın tek işi çekimin nerede bittiğini söylemek ve
saniyede iki kez oynayan bir yarıçap bunu yanlış söylüyor. Test bunu yakaladı
(halka 2.185, menzil 2.23). Nabız artık opaklıkta, orada hiçbir doğruluk
maliyeti yok.

Son 1.5 saniyede sönerek bitiyor, yani süre dolması izlediğin bir şey —
sonradan "meyveler artık gelmiyor" diye fark ettiğin bir şey değil.

## Menüde sürüm yazısı

Menünün sol alt köşesinde `v1.6 (15)` yazıyor. Oyuncu için değil: "güncelleme
indi mi" sorusu artık tahminle değil bakarak yanıtlanıyor.

**Numara elle yazılmıyor.** Kaynakta `const APP_VERSION = 'dev'` duruyor ve
`build-www.mjs` paketlenen kopyada onu `app-version.json`'daki gerçek
numarayla değiştiriyor. İki yere elle yazılsaydı er geç ayrışırdı — ve
ayrışmış bir sürüm yazısı hiç olmamasından kötüdür, çünkü tam da o soruyu
çözmek için bakacağın şey odur ve yanlış yanıtlar. `index.html`'i doğrudan
tarayıcıda açınca `dev` yazıyor, ki o da doğru.

Ölçen dosya `scratchpad/holemagnet.mjs`: yazının `app-version.json` ile aynı
olduğunu, alt barın üstünde ve Play düğmesinin dışında durduğunu, halkanın
yarıçapının gerçek menzile eşit olduğunu ve sürenin sonunda söndüğünü
doğruluyor.

## 🏆 neden çıkmıyordu: eklenti derlemede hiç yoktu

Cevap 16 Eylül 2026 akşamı `npm run aab:fruithole` çıktısının ortasındaki tek
bir satırdan çıktı:

```
[info] Found 2 Capacitor plugins for android:
       @capacitor-community/admob@8.1.0
       @capgo/native-purchases@8.7.0
```

**İki.** Üç olmalıydı. `@modbender/capacitor-play-games` `package.json`'daydı
ama `node_modules`'ta değildi — depo çekilmişti, `npm install` çalıştırılmamıştı.
`npx cap sync` eklentileri `package.json`'dan değil `node_modules`'tan okuyor,
o yüzden eklentiyi hiç görmedi, **derleme de sorunsuz tamamlandı**. Cihaza
eklentisiz bir uygulama kuruldu ve `_Cap.Plugins.PlayGames` orada `undefined`
olduğu için `gamesReady()` false döndü, düğme de hiç görünmedi.

Yani kod doğruydu, kimlik doğruydu, Play Console kurulumu doğruydu, test
kullanıcıları doğruydu. Eksik olan tek şey bir `npm install`'dı.

O satır çıktının ortasında akıp gidiyor ve kimse saymıyor. Artık
`build-aab.mjs` derlemeden **önce** `package.json`'daki her bağımlılığın
`node_modules`'ta olduğunu doğruluyor, eksikse duruyor ve adını söylüyor;
ayrıca kaç Capacitor eklentisi gördüğünü yazıyor, `cap sync`'in satırıyla
karşılaştırılabilsin diye.

### Aynı gece: imza şifresi

Derleme bu sefer sonuna kadar geldi ve **imzalamada** düştü:

```
Failed to read key fruithole from store "...\fruithole-key.jks":
keystore password was incorrect
```

`keystore.properties` `storePassword=9999` diyordu. Bu değer o keystore'u
hiç açmamış olmalı: **keytool 6 karakterden kısa şifreyle keystore
oluşturmuyor**, yani `9999` hiçbir zaman geçerli bir şifre olamazdı. Dosyaya
bir noktada gerçek şifre yerine başka bir şey yazılmış.

Bunu anlamak saatler aldı, çünkü Gradle imzalamayı en sona bırakıyor — yanlış
şifre ancak dakikalarca süren bir derlemenin sonunda öğreniliyor, ve hata
metni hangi alanın yanlış olduğunu da söylemiyor. `build-aab.mjs` artık
derlemeye başlamadan `storeFile`in var olduğunu, dört alanın da dolu
olduğunu ve iki şifrenin de en az 6 karakter olduğunu kontrol ediyor.

**Ölçen dosya `scratchpad/holebuildguard.mjs`.** `build-aab.mjs`'yi geçici
bir klasöre kopyalayıp (ROOT betiğin yeri olduğu için sahte depo böyle
kurulabiliyor) altı durumu yeniden üretiyor; Gradle hiç çalışmıyor, çünkü
kontroller zaten ondan önce dönüyor.

## Sessiz giriş: yumurta-tavuk

Eklenti derlemeye girdikten sonra 🏆 yine çıkmadı, ama bu sefer teşhis ekranı
sebebini yazdı:

```
PlayGames    evet
giriş        hayır
sebep        signIn signedIn:false döndü
cevap        {"signedIn":false}
```

Eklenti orada, hata yok, Google düpedüz "bu oyuncu giriş yapmamış" diyor.

Sebep eklentinin API'sinde:

```ts
signIn(opts?: { silent?: boolean }): Promise<SignInResult>
// silent varsayılan true. silent: false tam akışı açıyor ve yalnızca
// oyuncunun bir hareketine karşılık çağrılmalı.
```

`gamesInit()` `signIn()`'i parametresiz çağırıyordu, yani hep **sessiz**
giriş. Sessiz giriş bu oyuna daha önce girmiş hesapta çalışıyor, girmemişte
reddediliyor — ve oyun başka hiçbir yerde `silent: false` çağırmıyordu. Döngü
kapalıydı:

> oyuncu giriş yapmamış → sessiz giriş reddediliyor → 🏆 gizleniyor →
> giriş teklif edilmiyor → oyuncu hiç giriş yapmıyor

Yani tablo **hiçbir oyuncuda** açılamıyordu, sadece bizde değil. Play Console
kurulumu, kimlik, test kullanıcıları, eklenti — hepsi doğruyken.

**Düzeltme.** `🏆` düğmesinin artık üç hâli var, ikisi değil:

| Durum | Düğme |
|---|---|
| Giriş yapılmış | `🏆 Leaderboard` — tabloyu açıyor |
| Eklenti + kimlik var, giriş yok | `🏆 Sign in for the leaderboard` — girişi başlatıyor |
| Eklenti yok ya da kimlik boş | gizli |

İkinci satır eksik olandı. Düğmeye basmak oyuncunun hareketi sayıldığı için
`signIn({ silent: false })` çağrılabiliyor ve Google hesap ekranı çıkıyor;
giriş olunca düğme kendiliğinden tabloya dönüyor ve tabloyu açıyor.

Açılışta hâlâ yalnızca sessiz giriş deneniyor — oyunun ilk isteğinin bir
hesap sorusu olmasını istemiyoruz, ve eklentinin belgesi de `silent: false`'u
yalnızca oyuncu hareketine bağlıyor.

Teşhis ekranındaki **Sign in again** düğmesi de aynı hatayı taşıyordu:
parametresiz `signIn()` çağırıyordu, yani teşhis ettiği şeyi yeniden
üretmekten başka bir şey yapmıyordu. O da `silent: false`'a geçti.

**Ölçen dosya `scratchpad/holeboard.mjs`, 4. ve 5. bölümler.** Sahte eklenti
artık gerçek davranışı taklit ediyor: `silent` verilmezse `signedIn:false`,
yalnızca `silent: false` kabul. 5. bölüm döngünün kırıldığını doğruluyor —
düğme çıkıyor, basınca **ikinci** bir `signIn` gidiyor ve o çağrıda
`silent: false` var.

4. bölümün beklentisi de değişti. Eskiden "giriş reddedilirse düğme gizli
kalmalı" diyordu ve geçiyordu — ama beklentinin kendisi yanlıştı: reddetmek
kalıcı bir cevap değil ve düğmeyi gizlemek oyuncuya fikrini değiştirme yolu
bırakmıyordu.

## Deliğin kendisi

Ekranda en çok bakılan şey ve üç yerden zayıftı. Üçü de yalnızca yakından
bakınca görülüyordu — oynarken delik küçük, ve küçükken her şey idare eder
görünüyor.

**Kuyu kuyu gibi okunmuyordu.** Tuğla sıraları vardı ve her sıranın rengi
ışığa göre hesaplanıyordu (`lit = cos(mid - 1.25π)`), ama üstlerine serilen
karanlık **ortalanmış** bir radyal geçişti — yani her yönde aynı. O da ışığı
siliyordu: kuyunun aydınlık yanı da karanlık yanı kadar koyu çıkıyordu ve
geriye bakışımlı, dipsiz bir disk kalıyordu. Yukarıdan bakılan bir çukuru
çukur yapan şey tam olarak o bakışımsızlık.

Karanlığın merkezi ışığın geldiği yönün tersine itildi, sol üst duvara ince
bir parlaklık kondu, ve tuğla kontrastı artırıldı (`46 + lit*72 - i*7`, eski
`52 + lit*44 - i*5`) — karanlık artık bakışımsız olduğu için sıraların
aydınlık yanı ekrana ulaşabiliyor. Eski değerlerde tuğlalar teknik olarak
oradaydı ama görünmüyorlardı.

**Yaka üç düz halkaydı** — turuncu bir disk, krem bir şerit, siyah bir çember
— ve yukarıdan basılmış bir hedef tahtası gibi duruyordu. Artık bir gölge
dokusu taşıyor ve o doku kaplamanın rengiyle **çarpılıyor**: rengi kaplama
veriyor, hacmi doku. On kaplamanın hepsi aynı dokuyu kullanıyor ve hiçbiri
rengini kaybetmiyor.

**Delik zeminin üstünde duruyordu, içinde değil.** Yakanın dışında hiçbir
koyulaşma yoktu, yani tarlayla arasında hiçbir bağ yoktu. Temas gölgesi
`holeGroup`'un içinde, yani delikle birlikte büyüyor — oyundaki her nesnenin
zaten yaptığı şeyin deliğe ait olanı.

Bir de ağzın hemen içine, zeminin kalınlığını söyleyen bir gölge kondu:
onsuz yaka ile kuyu arasında hiçbir geçiş yoktu.

### Görülen ama düzeltilmeyen

Bölüm başında, delik en küçükken, **kaplamanın rengi neredeyse hiç
görünmüyor**: boyut yayı henüz boş ve geriye siyah çember ile ince krem şerit
kalıyor. Yani satın alınan kaplama, bölümün ilk saniyelerinde görünmüyor.
Ayrı bir iş; burada not olarak duruyor.

## Depo ne yüklediğimizi bilmiyordu

İki sürüm kodu boşa gitti — 25 ve 27 — ve ikisi de aynı şekilde: paket
yüklenmiş bir kodla derlendi, derleme yürüdü, hata **Play'in yükleme
kutusunda** ortaya çıktı, yani dakikalarca süren bir derlemeden sonra.

`build-aab.mjs`'de bir koruma vardı ama **tahmin**di: git'e bakıp "sürüm
artırıldıktan sonra oyun değişmiş" diyordu. Çoğu zaman haklıydı, harcanmış bir
kodu bilemiyordu, ve uyarısı derlemeyi **durdurmuyordu**.

Asıl eksik buydu: depo ne yüklediğimizi bilmiyordu. Bilmediği için soru her
seferinde insana soruluyordu, ve insan da unutabiliyordu.

### Kayıt

`app-version.json` artık yüklenmiş kodları tutuyor:

```json
"fruithole": {
  "versionCode": 30,
  "versionName": "1.10",
  "uploaded": [21, 22, 23, 24, 25, 26, 27, 28, 29]
}
```

- **`build-aab.mjs` listedeki bir kodla derlemeyi reddediyor** — uyarmıyor,
  durduruyor, ve sıradaki numarayı söylüyor. Kontrol sürüm dosyası okunur
  okunmaz çalışıyor: harcanmış bir kod için gradle'a dokunmanın anlamı yok.
- **`npm run uploaded:fruithole`** yükledikten sonra çalıştırılıyor. Kodu
  listeye ekliyor **ve** `versionCode`'u bir artırıyor. İkisinin aynı komutta
  olması önemli: ayrı olsalardı ikincisi unutulurdu, ve zaten unutulan şey tam
  olarak oydu.

### Derlenmemiş bir paketi yüklemiş olamazsın

Kayıt komutu ilk hâlinde yanlışlıkla iki kez çalıştırılınca hiç derlenmemiş
bir kodu "yüklendi" diye işaretliyordu. Atlanan numaranın bir maliyeti yok —
Play yalnızca artan ve kullanılmamış kod istiyor — ama listeyi yalancı yapıyor,
ve bu listenin tek işi doğru olmak.

Bunun için `build-aab.mjs` başarılı bir `.aab`'den sonra `built` alanını
yazıyor, kayıt komutu da onu şart koşuyor. `.aab` her derlemede aynı yolun
üstüne yazıldığı için (`app-release.aab`) dosyanın varlığı hangi sürümü
taşıdığını söylemiyor; `built` söylüyor. Gerçekten gerekiyorsa `--force` var.

### Listenin doğruluğu

Buradaki liste depo geçmişinden çıkarıldı: kitaplık listesinde 21-27
görünüyordu, 28 ve 29 derlenip yüklendi. **Tek kaynak değil** — Play Console →
Release → App bundle explorer yüklenmiş her kodu listeliyor, ve ihtilafta
doğru olan o.

`scratchpad/holebuildguard.mjs` üç şey ölçüyor: harcanmış kod derlemeyi
durduruyor ve sıradakini söylüyor, temiz kod durmuyor, ve `uploaded` alanı
olmayan bir dosya (öteki üç uygulama) eskisi gibi derleniyor.

## Havada olan şey

Zemin, ışık ve kenar o yerin **neresi** olduğunu söylüyordu. Hiçbiri orada
**zaman geçtiğini** söylemiyordu: plajdaki dalga dışında on yerin hepsi
duruyordu.

Ama hepsine atmosfer koymak, dağınıklık üretmenin en hızlı yolu. Yalnızca
doğal olarak okunan beş yere kondu:

| yer | havada olan | nasıl |
|---|---|---|
| Snow Day | yağan kar | düşüyor, yanlamasına savruluyor — tek gerçekten hızlı olan |
| Harvest | saman tozu | yavaş düşüyor, çok savruluyor |
| Happy Hour | ışıkta duran toz | düşmüyor, süzülüyor |
| Orbit | kırıntı | yerçekimi yok: süzülüyor, az ve sönük |
| Indoors | ev tozu | neredeyse fark edilmeyecek kadar az |

Plajda zaten dalga var. Saha, banka, otopark ve mağazada havada olması
gereken bir şey yok, ve uydurmak o yerleri anlatmak değil süslemek olurdu.

Tek `THREE.Points`, tema başına parametreli: sayı, boyut, renk, opaklık, düşüş
hızı, savrulma, tepe yüksekliği. Kutu **deliği takip ediyor** — tahtaya
sabitlenmiş bir kutu, uzun bir bölümde oyuncu ilerledikçe ekranın dışında
kalırdı.

### Görünmez çıktı, ve sebebi `size`

İlk sürümde ekranda **hiçbir şey yoktu**. Parçacıklar oradaydı: sonda 110
tanesi, `visible: true`, y 0.27 ile 9.88 arasında, ve `renderer.info` 140
nokta çizdiğini söylüyordu. Yani "kurulmuş olmak" ile "görünüyor olmak" aynı
şey değildi, ve ekran görüntüsü ikisini ayırt edemiyordu.

Sırayla elenen şüpheler:

1. **Hareket kısıtlı mı?** `prefers-reduced-motion` ölçüldü: `false`.
2. **Sürücü nokta boyutunu kısıyor mu?** SwiftShader'ın
   `ALIASED_POINT_SIZE_RANGE` değeri okundu: `[1, 1023]`. Sorun o değil.
3. **Gerçekten çiziliyorlar mı?** Renk mor, boyut 20, derinlik testi kapalı
   yapıldı — ve göründüler. Yani çiziliyorlardı.

Cevap üçüncü adımda çıktı: `size` **dünya birimi değil**. Değerler dünya
birimi sanılarak yazılmıştı (kar için 0.26) ve her parçacık pikselin altında
kalıyordu. Ölçüldü: bu kamerada (y = 13) `size: 20` ekranda ~9 piksel ediyor,
yani birim başına ~0.45 piksel. Bugünkü değerler o ölçümden geliyor — kar 11,
saman 8, toz 5-6.

İkinci hata aynı yerde çıktı: kutu x'te ±12 idi, oysa tarlanın yarı genişliği
6.83. Parçacıkların çoğu kadrajın dışına, tarlanın ötesindeki zemine
saçılıyordu. ±8'e indirildi.

Üçüncüsü sprite'ın kendisiydi: yumuşak bir gradyandı ve durağan karede havada
süzülen zerre gibi değil **masanın üstündeki leke** gibi okunuyordu. Zerreyi
zerre yapan şey küçük ve keskin olması.

### Beyaz kar beyaz zeminde kaybolur

Kar beyazdı ve kar tarlasında görünmüyordu. Yukarıdan bakan bir kamerada bu
fiziksel olarak da doğru: karın üstüne düşen karı ayıran şey gölgesidir.
Gölgeli karın rengi alındı (`#9fc4e4`), yani tarlaya karşı okunuyor.

### Ölçülen

- **birkaç yerde havada bir şey var** (5/10) — hepsinde olmasını beklemiyoruz
- **kurulan her atmosfer görünür ölçekte** — `size` 3'ün, opaklık 0.2'nin
  altındaysa kurulmuş ama görünmez demektir, ve bu bir kez oldu
- **atmosfersiz yerde kalıntı yok** — önceki temanın parçacıkları taşmıyor
- **parçacık bütçesi aşılmıyor** (en çok 110 / 140)
- **parçacıklar kadrajın içinde kalıyor**
- **hareket kısıtlıyken atmosfer hiç kurulmuyor** — ekranın dörtte birini
  kaplayan sürekli hareket, o ayarı açan insanın kapatmak istediği şeyin ta
  kendisi

## Tarlanın dışı düz boyaydı

Tahtanın etrafındaki 200×200 düzlem. Plajda dalgalanan deniz vardı — kendi
dokusu, kendi hareketi. Kalan **dokuz temada tek renk** bir zemindi.

Yani oyunun her şeyi kodla ürettiği bir projede, ekranın kenarındaki geniş
şerit düz boyaydı. Orbit temasının yorumu "kenarından ötesi karanlık" diyordu
ve orada düz lacivert bir şerit vardı; kar temasının dışı denizin mavisiydi.

Artık her yerin dışı da bir yer:

| yer | dışı |
|---|---|
| Beach | dalgalanan deniz *(eskisi)* |
| Orbit | **yıldız alanı** — uzak toz, yakın yıldızlar, birkaçında hale |
| Snow Day | donmuş göl: soluk mavi, çatlaklı |
| Harvest | biçilmemiş ot, şeritli |
| Match Day | stadyum betonu, beyaz çizginin ötesi |
| Payday | mermerin cilalı koyu hâli, altın damarlı |
| Happy Hour | akşam ışığında kalan karanlık oda |
| Drive-In | tahtadakinden koyu asfalt |
| Gadget Shop | tahtadakinden koyu mağaza zemini |
| Indoors | odanın gölgede kalan kısmı |

**Hepsi uzaktan ve karenin kenarında görünüyor**, o yüzden ince ayrıntı işe
yaramıyor: her biri bir bakışta "orası neresi" diyecek kadar, fazlası değil.
Tile boyu da ona göre seçildi — desenin tekrarı görünürse kenar duvar kâğıdına
dönüyor. Yıldız alanı 512px ve 8 tekrar, yani tile başına 25 birim: ekranda
aynı anda bir-iki tane görünüyor ve takımyıldız tekrarı fark edilmiyor.

**Doku varken renk beyaza çekiliyor.** Three.js `map` ile `color`'ı çarpıyor;
temanın kendi `surround` rengi orada kalsaydı doku onun altında boğulurdu.
Rengi artık dokunun kendisi taşıyor.

Zeminler gibi tembel üretiliyorlar: bir tema ilk kez oynandığında.

### Ölçülen

`holetheme.mjs` üç şey daha bakıyor:

- **her yerin tarla dışı da bir yer** — ne dalga ne `beyond` varsa kenar
  sessizce düz renge düşüyor, yani buradaki düzeltme geri alınmış oluyor
- **tarla dışı dokuları tanımlı** — `beyond` adı yanlış yazılırsa üretici
  bulunamıyor
- **her yerin kendi dışı var** — kenar, o yerin neresi olduğunu söyleyen
  ikinci işaret; ikisi aynı dışa bakarsa o işaret kayboluyor

## On yer vardı, tek ışık vardı

Zemin temaya göre değişiyordu, ışık değişmiyordu. Işık rigi açılışta bir kez
kuruluyor ve `applyTheme()` ona hiç dokunmuyordu:

```js
new THREE.HemisphereLight('#ffffff', '#f0b877', 1.5)   // sıcak, kum yansıması
new THREE.AmbientLight('#fff4de', 0.45)
new THREE.DirectionalLight('#fff8e8', 0.72)
```

Üçü de öğle güneşi. Yani uzay istasyonunun güvertesi de, akşam barının cilalı
tezgâhı da, kar da aynı sıcak ışıkla aydınlanıyordu. Zemin "akşam" diyor, ışık
"öğlen" diyordu — ve bu her karede görünüyordu.

Artık her temanın kendi ışığı var:

| yer | ışık |
|---|---|
| Beach | öğle güneşi, kumdan sıcak yansıma (varsayılan) |
| Match Day | kapalı maç günü, aşağıdan çimen |
| Indoors | ampul sarısı, anahtar ışık düşük, dolgu yüksek |
| Snow Day | soğuk mavi, oyundaki **en yüksek dolgu** — kar her şeyi geri yansıtır |
| Payday | nötr tavan, aşağıdan altın |
| Orbit | sert beyaz anahtar, **neredeyse sıfır dolgu** |
| Happy Hour | amber, alçak, koyu ahşap yansıması |
| Drive-In | sodyum lambası: turuncu üstten, gri asfalt alttan |
| Gadget Shop | soğuk mağaza florasanı |
| Harvest | altın saat, aşağıdan toprak ve ekin |

**Anahtar ışık yükseltilmiyor.** Işık rigi kurulurken öğrenilmiş bir şey var ve
yorumu hâlâ orada duruyor: sert bir anahtar ışık her kürenin bir yanını gölgeye
atıyor ve bu boyutta çamur gibi okunuyor. Tema başına ışık bunu bozmamalı —
değişen şey rengin kendisi ve dolgunun oranı. Tek istisna **Orbit**: uzayda
saçılma yok, gölgenin sert olması orada hata değil, yerin kendisi.

### Soğuk ışığın bedeli: muz

Gadget Shop'un ilk değerleri daha maviydi (`#e6f0ff` / `#dce8f7` / `#f2f8ff`) ve
ekran görüntüsünde **muzlar zeytin yeşiline kaçıyordu**. Gerçek florasan altında
sarı gerçekten yeşile kaçar, yani fizik olarak doğruydu — ama bu oyunda dört
meyve rengini birbirinden ayırmak okunurluğun kendisi. Birini boşaltmak üslup
tercihi değil, **oynanış bedeli**. Mavi azaltıldı, soğukluk durdu.

### Ölçülen

`holetheme.mjs` üç şeye bakıyor, çünkü ekran görüntüsüne bakmadan
doğrulanamayan bir değişiklik sessizce varsayılana düşebilir:

- **Her yerin kendi ışığı var mı** — bir temanın `light` alanı unutulursa
  varsayılana düşer ve kimse fark etmez (10/10).
- **Hiçbir yer okunamayacak kadar karanlık değil** — toplam aydınlanma
  (yarımküre + ortam + anahtar) 2.15 ile 2.92 arasında, eşik 1.9. Işığı kısmak
  atmosfer üretiyor ama ekrandaki her şey meyvenin ayırt edilmesine bağlı.
- **Orbit dışında anahtar ışık sertleştirilmemiş** — yukarıdaki kuralın testi.

Menü etkilenmiyor: `buildMenuDiorama()` her zaman `beach` temasını uyguluyor,
yani ön ekran hangi bölümde kalırsan kal aynı ışıkta duruyor.

## Beş yeni düzen: 19'dan 24'e

On dokuz düzen vardı ve 19. bölümden sonra baştan başlıyorlardı. Beş yenisi
turu yirmi dörde çıkarıyor.

| düzen | bölüm | tema | oynanıştaki farkı |
|---|---|---|---|
| **Wave** 🌊 | 5 | Beach | Enine bantlar, ama düz değil: satır sütunun sinüsü kadar kayıyor, yani bant boyunca süpürürken yön sürekli değişiyor. Chevrons da enine gider ama köşelidir ve seni bir ağza huniler; bu takip edilecek bir çizgi. |
| **Checkers** 🏁 | 9 | Drive-In | Üçe üç bloklar, biri dolu biri boş — tahtadaki en parçalı düzen. Her blok ayrı bir ada, zinciri sürdürmek rotayı önceden kurmayı gerektiriyor. |
| **Ladder** 🪜 | 13 | Indoors | İki dikme, aralarında basamaklar. Dikme boyunca koşmak ve basamakları enine kesmek aynı meyveyi farklı sırayla veriyor. |
| **Orchard** 🌳 | 17 | Harvest | Meyve oyununda meyvenin geldiği şekil, ve tahtadaki tek bakışımsız form. Gövde kameraya en yakın uçta: dipten başlayıp tacın içine tırmanıyorsun. |
| **Hourglass** ⌛ | 21 | Payday | İki hazne, arada tek boğaz. Hangisini önce süpüreceğine karar vermek zorundasın — geri dönmek zinciri kırıyor. |

**Araya serpiştirildiler, sona eklenmediler.** Sona eklenseydi ilk on dokuz
bölüm kelimesi kelimesine aynı kalır ve beş yeni şeklin hepsi 20. bölümden
sonraya düşerdi; yani oyuncuların çoğu hiç görmezdi. Sıra `LEVEL_ORDER`'da
duruyor ve "aynı yer arka arkaya iki bölümde çıkmasın" kuralı korundu.

İkisi ölçümle yerine oturdu:

- **Payday tek düzen tutuyordu**, öteki dokuz tema ikişer. Hourglass oraya
  gitti. Şimdi dağılım 2-3 arası, aradaki fark bir.
- **Sayı tutan kural değişti.** `holetheme.mjs` "hiçbir tema ikiden fazla
  düzen tutmasın" diyordu; o kural 19 düzen ile 10 temanın tesadüfüydü. 24
  düzende on temanın hepsi ikide kalamaz. Sabit eşik yerine fark ölçülüyor:
  hiçbir yer ötekilerden bir düzen fazla görünmesin.

### Üç şey yakalandı

**Oyunun kendi koruması.** `LEVEL_ORDER` her düzeni adıyla istiyor ve eksik
olanı açılışta hata vererek söylüyor — beş düzeni ekleyip sıraya yazmayı
unutunca sayfa hiç açılmadı. Sessizce yanlış sırada oynatmaktan iyi.

**İki çift bölüm aynı ikonu taşıyormuş**, ve bu yeni bir hata değildi:
`Ring` ile `Orbits` ikisi de 🎯, `Spiral` ile `Whirl` ikisi de 🌀. Bölüm
haritasında ikisi tek bir şeye benziyordu. Kutupsal olanlar kendi ikonlarını
aldı (💫, 🍥). Yeni düzen `Ladder` da başta `Shelves` adıyla yazılmıştı çünkü
🪜 `Stairs`'te duruyordu — ama ekranda gördüğün şey bir merdiven, ve bir
düzenin adı gördüğün şeyden başka olamaz. İkon buraya geçti, `Stairs` 📶'ya
taşındı.

**`make-shots.mjs` bölümleri numarayla istiyordu.** Beş düzen eklenince 8.
bölüm Snow Day olmaktan, 9. bölüm voxel tahtası olmaktan çıktı. Dosya yine
çalışıyor, yine sekiz resim üretiyordu — sadece `3-snow.png` artık karı
göstermiyordu. Artık düzenin **adını** istiyor ve bölüm numarasını oyunun
kendi sırasından okuyor; bulamazsa gürültüyle duruyor.

`holerelease.mjs` de aynı hastalıktaydı: mağaza metnindeki sayıları elle
tutulan bir tabloyla kontrol ediyordu (`{52:'Fifty-two', 63:'Sixty-three'…}`)
ve 73'e gelince tablonun dışına çıkıp `undefined objects` aramaya başladı —
yani ölçmesi gereken şeyi ölçemez hale geldi. Kutupsal desenleri de "oyundan
okuyoruz" diye yazılmış bir yorumun altında elle yazılmış bir listeden
alıyordu. İkisi de artık oyundan geliyor, ve ölçüm iki yönlü: doğru sayı
yazıyor **ve** eski sayılardan hiçbiri metinde kalmamış.

## Onuncu tema: Harvest 🚜

Oyunun adı **Fruit Hole** ve meyvenin geldiği yer dokuz temanın hiçbiri
değildi: plaj, saha, ev, kar, banka, yörünge, bar, otopark, mağaza. Tarla
vardı, çiftlik yoktu.

**Zemin sürülmüş toprak.** Karıkları olan tek yüzey ve oyundaki en koyu
kahverengi. En zor kısmı ahşaptan ayırmaktı — ikisi de kahverengi, ikisi de
tek yöne giden çizgiler. Ayıran üç şey: toprak belirgin şekilde daha koyu,
karıklar tahta derzi gibi keskin değil yumuşak geçişli, ve aralarına taş ile
filiz serpiştirilmiş.

**On yeni nesne**, koleksiyon 63'ten 73'e çıktı: saman balyası, tavuk,
yumurtalı yuva, süt güğümü, sulama kabı, yaba, meyve kasası, traktör, el
arabası, korkuluk. Son üçü yalnızca dev — küçültülünce okunmaz oluyorlar.

### Üçü tepeden okunmuyordu

Bu temanın kuralı ötekilerle aynı: oyun yukarıdan bakıyor, yani ayakta duran
ince bir şey bir noktadır. İlk çizimde üç nesne bu sınavı geçemedi ve bunu
ancak ekran görüntüsüne bakınca gördüm.

| nesne | ne görünüyordu | ne değişti |
|---|---|---|
| tavuk | beyazdı ve kardan adamdan ayrılmıyordu — iki beyaz küre, önünde beyaz bir koni | kızıl kahve oldu, kuyruk yatık bir yelpaze, ibik başın tepesinde |
| sulama kabı | yeşil bir kova | emzik `-z`'ye, yani kameradan **uzağa** bakıyordu; gövdenin arkasında kayboluyordu |
| el arabası | ayaklı mavi bir kutu | tek teker kasanın arkasındaydı ve hiç görünmüyordu; öne alındı, saplara kırmızı tutamak kondu |

Sulama kabındaki hata, iglonun kapısında bir kez öğrenilmişti: tepeden bakan
bir oyunda "ön", kameraya bakan yön. İkinci kez yapıldı.

### Düzenler

Yeni tema iki düzen aldı, öteki temaların hepsi gibi:

- **Cross (19)** — Orbit üç düzende birden kullanılıyordu ve üçü de keyfiydi;
  halkalı düzenler (Orbits, Whirl, Bloom) o temayı zaten daha iyi taşıyor.
- **Whirl (12)** — Gadget Shop da üç tutuyordu. Tek düzenle kalsaydı yeni tema
  ilk turda yalnızca 19. bölümde görünürdü. Sarmal, sürülmüş toprakta ekin
  dairesi oluyor.

### `scratchpad/holetheme.mjs`

Harvest eklenirken yazıldı ama ölçtüğü şey tek bir tema değil, bütün tablonun
tutarlılığı. Buradaki hataların hepsi **sessiz** — oyun çalışmaya devam ediyor,
sadece o içerik ekrana hiç gelmiyor:

- bir temanın listesinde olmayan bir nesne kimliği → o nesne hiç çıkmıyor
- bir tema hiçbir düzende kullanılmıyor → ilk turda hiç görünmüyor
- bir nesne hiçbir temaya ait değil → yalnızca "Everything" bölümlerinde çıkıyor
- bir temanın zemini tanımsız → zemin sessizce başka bir şeyle çiziliyor
- dev olarak işaretlenmiş bir nesne hücre boyunda çıkıyor → okunmaz bir yumru

Test bir kez de kendi hatasıyla düştü: zeminleri `GROUND_TEX`'e soruyordu, oysa
o bir **önbellek** — açılışta boş ve yalnızca oynanmış temaları içeriyor.
Dağıtıcı `GROUND_MAKERS` adıyla ayrıldı ve soru ona soruluyor.

`holetech.mjs` de düzeltildi: listesinde Whirl vardı, o artık farm. Test
hiçbir şey iddia etmediği için "geçmeye" devam ederdi — ama teknoloji
eşyalarının resmi diye sürülmüş bir tarlanın resmini çekerdi.

## Başarımlar 15. bölümde bitiyordu

Beş tane vardı: 100 meyve ye, 1000 meyve ye, 10. bölüme ulaş, 15 yıldız
topla, x5 kombo yap. Hiçbiri ölçülmemişti. Ölçünce:

| başarım | ne kadar sürüyor |
|---|---|
| 100 meyve | bir bölüm (bölüm başına 60-240 meyve) |
| 1000 meyve | ~9 bölüm |
| 10. bölüm | 10 bölüm |
| 15 yıldız | 5 bölüm |
| x5 kombo | kendiliğinden — ortalama çarpan zaten 4.0-4.7 |

Yani oyuncu **12-15. bölümde beşini de bitiriyor** ve Awards sekmesi ondan
sonra ölü bir ekran oluyor. Dükkânın 3. bölümde bitmesiyle birebir aynı hata,
aynı sebeple: kimse listenin ne kadar sürdüğüne bakmamıştı.

On altıya çıktı. Altı aile, çoğu üç basamaklı:

| aile | basamaklar |
|---|---|
| meyve | 100 · 1000 · 5000 |
| bölüm | 10 · 25 · 50 |
| yıldız | 15 · 60 · 120 |
| zincir | x5 kombo · 50 meyve · 100 meyve |
| koleksiyon | 20 · 40 · 63 nesne |
| seri | 7 gün |

**Basamaklar sırayla açılıyor.** Bir basamak, öncülüne ulaşılmadan listede
görünmüyor: yeni oyuncu on altı satır değil altı satır görüyor, liste
oynadıkça büyüyor, bitirilenler kupa gibi kalıyor. Açılma koşulu "öncül
**kazanıldı**", "öncül **alındı**" değil — alınmamış bir ödül yüzünden
sıradaki hedefi saklamak, oyuncuyu ilerlediğini görmekten mahrum bırakırdı.

**Zincir başarımları çarpanı değil ham zinciri sayıyor.** Çarpan
`Math.min(5, 1 + floor(streak/4))` ile **5'te tavanlı**, yani `bestCombo`
asla 5'i geçmiyor ve "x8 kombo yap" diye bir hedef sonsuza kadar kilitli
kalırdı — ekranda ömür boyu `0/8` yazardı ve kimse sebebini anlamazdı. Bunun
için `stats.bestStreak` eklendi: arka arkaya, arada 0.9 saniyeden fazla boşluk
bırakmadan yutulan meyve sayısı, tavansız.

Hedefler tahminle değil ölçümle konuldu. `fruitHoleIncome()` artık en uzun
zinciri de döndürüyor; kusursuz bir süpürmede bölüme göre:

| bölüm | 1 | 5 | 10 | 16 | 25 | 40 | 50 |
|---|---|---|---|---|---|---|---|
| en uzun zincir | 156 | 61 | 297 | 274 | 66 | 82 | 81 |

En kötü tarlada bile 61, en iyisinde 297. Gerçek oyuncu simülasyondan kötü
olduğu için 50 ulaşılabilir bir hedef, 100 iyi bir tarlayı iyi oynamayı
istiyor.

**Koleksiyona bakan üç basamak var.** 63 nesne üretildi ve hiçbir başarım
onlara bakmıyordu; en üst basamak oyundaki nesne sayısıyla birebir bağlı, yani
tema eklenip nesne sayısı değişirse test onu yakalıyor.

**Ödül ölçeği.** Beş eski başarımın toplamı 4500'dü; şimdi 18 600. Yükseltme
ağacı 26 420, kaplamalar 30 500 — yani başarımlar hâlâ süs, ikinci bir gelir
kapısı değil. Tek bir başarım en fazla 2000, yani bir bölümlük kazancın
(~1500) biraz üstü. Ödüller dört meyveye dengeli dağıtıldı (4400-5000 arası):
hepsi tek meyveye aksaydı yalnızca o dalın yükseltmelerine yarardı.

**Ölçen dosya `scratchpad/holeawards.mjs`.** Listenin uzunluğunu, her hedefin
gerçekten ulaşılabilir olduğunu (en uç durumu tohumlayıp tamamlanıyor mu diye
bakarak), basamakların sırayla açılmasını, iki kez alınamamasını ve ödül
ölçeğini ölçüyor.

## Zamanlı sandık

Oyunun geri dönüş sebeplerinin hepsi **günlük** ölçekteydi: günlük ödül,
günlük görevler, günlük tarla, giriş serisi. Hepsi gece yarısında yenileniyor.
Yani oyuncu bugün oynadıysa oyunun ona diyecek bir şeyi ertesi güne kadar yok.
Raftaki rakiplerin hepsinde gün içinde dolan bir kap var.

Menüde, kumun üstünde duran bir sandık. **Dört saatte bir doluyor** — günde
iki üç sandık eder. Hazırken sallanıyor ve üstünde `Free` yazıyor, dolarken
duruyor ve geri sayıyor (`2:41:09`).

> Oyunda zaten bir sandık var: bölüm sonunda açılan. Bu ondan ayrı, ve bilerek
> ondan küçük. Bölüm sonundaki sandık bir bölümlük kazanç değerinde; bu değil.

**Ödül bilerek küçük.** Bir bölüm o meyveden ~400 ödüyor, sandık 116-260
veriyor (oyuncunun bölümüyle büyüyor, 25. bölümde tavan yapıyor). Sınır şu:
beklemek oynamaktan kârlı olmaya başladığı an sandık oyunu yemeye başlar.

**Ödül rastgele değil, sırayla.** Dört meyve sırayla geliyor, her üçüncü
sandık bir booster (onlar da kendi aralarında dönüyor). İki sebeple:

- Rastgele olsaydı belirli bir yükseltme için biriktiren oyuncu istediği
  meyveyi hiç alamayabilirdi. Sıra, er geç geleceğini garanti ediyor.
- Play'in **ganimet kutusu** kuralları rastgele ödüllü kaplarda oranların
  açıklanmasını istiyor. Sırayla dağıtan bir sandık o tanımın dışında.

Aynı sebeple **ne çıkacağı açmadan yazıyor**: kapalı kutuya basmak kumar
hissi veriyor, beklenen bir ödülü almak vermiyor.

**Sandık ilk bölüm bitmeden görünmüyor.** Günlük ödülde öğrenilen şeyin
aynısı — oyunu hiç oynamamış birine ödül ekonomisini tanıtmak, oyunun
kendisini tanıtmadan önce oluyor.

**Saat oyunu.** Sunucumuz yok; telefonun saati ileri alınırsa sandık erken
açılır ve bunu tamamen çevrimdışı bir oyunda engellemenin yolu yok.
Engellenebilen şey ters yön: saat **geri** alındığında kalan süre bir turluk
aralıktan büyük görünür ve sandık aylarca kilitli kalabilir. O durumda sayaç
bir tur başa sarılıyor — kötü niyetli oyuncu bir şey kazanmıyor, saatini
yanlış kurmuş oyuncu en fazla bir tur bekliyor.

**Ölçen dosya `scratchpad/holechest.mjs`.** Sayaç, ödül ölçeği, sıranın
gerçekten dönmesi, kalıcılık, ve yerleşim. Yerleşim ölçümü iki gerçek hata
yakaladı:

- Sandığın CSS'i `#menu > *`'dan **önce** yazılmıştı. O satır da menünün
  çocuklarına `position: relative` veriyor ve aynı özgüllükte, yani sonra
  yazılan kazanıyor — sandık `position: absolute` almadı ve deliğin üstüne
  oturdu. `#menuTop` ve `#playTray` zaten o satırdan sonra duruyor.
- 360×640'ta sandığın sağ üst köşesi Play tepsisinin köşesine biniyordu.
  İki piksel, ama tepsiye basan parmak sandığı açıyordu.

Testin kendisi de bir kez yanlış ölçtü: kurulum betiği `localStorage.clear()`
çağırıyordu ve `addInitScript` sayfa yenilemede de çalıştığı için
"yeniden açılınca hatırlıyor mu" testi ölçeceği şeyi siliyordu.

## Koleksiyon

Tarlada 63 nesne var. Kumsalda kova, kürek, şemsiye, şezlong; karda penguen,
igloo, kardan adam; bankanın zemininde külçe ve kasa; teknoloji mağazasında
on bir ayrı alet. Mağaza açıklamasının en uzun paragrafı bunları anlatıyor,
ekran görüntülerinin yarısı bunları gösteriyor.

Ve oyuncu hepsini yutuyordu, **hiçbir karşılık almadan**. Ne sayılıyordu, ne
gösteriliyordu, ne de yutulduğu bir yere yazılıyordu. Yani içerik zaten
üretilmişti — eksik olan, üretilmiş olanın görünmesiydi.

`Goals` ekranındaki `🧺 Collection 12/63` düğmesi koleksiyonu açıyor.
Nesneler temaya göre bölünmüş (`Beach 2/12`, `Snow Day 1/7`), bulunanlar
renkli, **bulunmayanlar kararmış siluet**. Siluet kasıtlı: ne olduğunu
söylemeden bir şey olduğunu söylüyor, ve aranacak bir şeyin varlığı aramanın
sebebi. Bir nesne birden çok temada geçiyorsa ilk geçtiği yere yazılıyor.

**Küçük resimler oyunun kendi geometrisinden çiziliyor.** Oyunda tek bir
görsel dosya yok — her şey kodla üretiliyor — dolayısıyla koleksiyonun da
çizilecek bir dosyaya ihtiyacı olmamalı. Ekran ilk açıldığında tek bir ek
`WebGLRenderer` açılıyor, 63 kare 96×96 olarak tek geçişte üretilip
`toDataURL()` ile saklanıyor, ve bağlam hemen `dispose()` +
`forceContextLoss()` ile kapatılıyor. Telefonda eşzamanlı WebGL bağlamı
sayısı sınırlı; oyunun kendi bağlamını riske atmaya değmez.

Bu, tema döngüsüyle birlikte çalışıyor: 19. bölümden sonra aynı şekiller
başka temalarda çıktığı için kalan nesneleri aramak gerçek bir sebep, tek
turluk bir kontrol listesi değil.

**Ekranın zemini ötekilerden koyu** (`rgba(46,26,6,.94)`). İlk yazışımda
`.72` verdim — öteki ikincil ekranlarla aynı — ve ekran görüntüsünde arkadaki
menü sahnesinin meyve halkası ızgaranın içinden okunuyordu. Öteki ekranlarda
sorun çıkmamasının sebebi içeriklerinin opak kart olması; burada içerik zaten
kararmış siluet, arkadan vuran ışık onları yutuyor.

**Ölçen dosya `scratchpad/holecoll.mjs`.** Sayacı, kalıcılığı ve resimlerin
üretildiğini ölçüyor; 4. bölüm ızgaranın hücreleri arasındaki boşluklardan
piksel okuyup zeminin gerçekten ekranın kendi zemini olduğunu doğruluyor —
saydamlığı geri koyup çalıştırınca test düşüyor (`fark 30`, eşik 26).

## Kumsalı kumsal yapan şey

Kaan bir rakip karesi attı: kumsal tahtası, ve tahtanın boyunca tekrar eden
palmiyeler, hindistan cevizi öbekleri, kuma dikili sörf tahtaları. "Bizde de
böyle bir beach konseptli bölüm olsun, aloha Hawaii tarzı."

Tema zaten vardı: kum, deniz, dalga şeridi, on üç nesne. Eksik olan şey
nesnelerin **nerede durduğuydu** — şezlong, şemsiye, deniz yıldızı, terlik,
kova, hepsi yerde duran şeyler. Kumsalı kumsal yapan şey yukarıda.

Üç nesne eklendi ve üçü de yukarıdan bakan bir kameraya göre çizildi:

* **Palmiye.** Bütün ölçü tacın, çünkü kamera gövdeyi görmüyor. Yedi ince
  koniyle denendi ve yukarıdan bir yıldız işareti gibi durdu — yaprak değil,
  çizgi. Şimdi iki sıra: dokuz uzun yaprak dışa ve aşağı, dokuz kısa
  aralarına. Gövde on kısa dilimden ve hafif eğri; tek silindir düz bir çubuk
  oluyordu.
* **Hindistan cevizi.** Hem iri hem küçük durabilen tek nesne: küre olduğu
  için hücreye sığdırılınca da küre kalıyor. Şezlong küçülünce renkli bir
  yumruya dönüyor, bunun kaybedecek ayrıntısı yok. Üstündeki üç göz onu
  başka bir kahverengi küreden ayıran tek şey.
* **Sörf tahtası.** Kuma dikili ve arkaya yatık. Yatık dursaydı yukarıdan
  renkli bir tahta parçası olurdu.

### Ve bir de: çıkmaları lazım

Eklemek yetmedi. Kumsal havuzu on altı nesne ve dev seçilirken havuzdan
rastgele çekiliyor, yani palmiyenin bir tahtada çıkma ihtimali on altıda bir.
Ölçüldü — yirmi dört kumsal tahtasında palmiye **bir** kez çıktı, sörf
tahtası bir kez. Yani oyuncunun kumsalda palmiye görmesi bir tesadüf.

Temaya bir **imza** alanı eklendi (`hero`): dev bir nesne seçilirken önce ona
bakılıyor, yarısından biraz fazlası oradan geliyor. Kumsalın imzası palmiye
ve sörf tahtası.

```
            önce   sonra
palmiye       1      6      (24 kumsal tahtasında)
sörf tahtası  1      8
```

Gerisi hâlâ havuzdan: her kumsal tahtasında palmiye var ama tahta yalnızca
palmiyeden ibaret değil. Ayrım şurada — şezlong ve deniz yıldızı kumsalın
**içindeki** ayrıntılar, palmiye kumsalın kendisi.

## Aloha: ikinci bir kumsal değil

Kaan devam etti: "Hawaii konseptli olsun, bundan sonra diğer şehirlerin
bölümlerini de ekleyelim."

İlk tuzak, kumsal temasına birkaç Hawaii eşyası daha atıp adını değiştirmek
olurdu. Aynı zemin, aynı deniz, yalnızca başka eşyalar — oyuncunun gördüğü
şey iki ayrı yer değil, aynı yerin iki dolabı.

Ayıran şey **zemin** olmalı, çünkü tahtanın en büyük yüzeyi o. Aloha'nın
zemini kara kum, ve uydurma değil: Hawaii'nin sahilleri gerçekten lav
bazaltından. Turkuaz denizin içindeki kara ada, açık kumlu kumsalın yanında
bambaşka bir yer.

Siyah değil koyu gri-kahve (`#3b352f`). Gerçek siyah iki şeyi bozuyordu:
deliğin ağzı zeminden ayırt edilemiyordu — oyunun sürdüğü tek şey o — ve
koyu meyveler zemine yapışıyordu. Serpilen şey de üç türlü: sönük kül, sıcak
kahve, ve arada bir zeytin yeşili bir tutam ot. Ot olmadan yüzey asfalta
benziyor; lav sahilinde ot biter.

Dolgu ışığı öteki yerlerden yüksek (`ambI 0.55`). Sebebi zemin: kara kum
ışığı geri vermiyor, ve varsayılan dolguyla meyvenin alt yarısı zeminin
koyusuna karışıyordu.

### Eşyalar "yaz" değil "burası" demeli

Şemsiye her sahilde var, tiki yalnızca burada. Aloha'nın kendi beşlisi:

* **Tiki** — yukarıdan bakan kamera için oyundaki en zor nesne, çünkü
  dikdörtgen bir direk ve yukarıdan kare görünüyor. Kareyi kıran üç şey:
  tabandaki geniş kaide, yanlardan taşan kaşlar, dışarı uzanan dil. Onlarsız
  tahtada duran şey bir kütük.
* **Lei** — halka olduğu için yukarıdan tam görünüyor. Düz bir simit olsaydı
  şişme simitten ayrılmazdı; ayıran şey kenarının boncuklu olması: on iki
  çiçek, her biri beş yapraklı, sırayla üç renk.
* **Ukulele** — yassı olduğu için en iyi okunanlardan. Sapsız gövde yukarıdan
  bir fıstık şekli; sapı olan gövde çalgı.
* **Ananas** — hindistan cevizi gibi hem iri hem küçük durabiliyor.
  Küçülünce kaybettiği tek şey kabuk deseni, ve sarı gövde + yeşil taç
  ikilisi tek başına ananas demeye yetiyor.
* **Amber çiçeği** — oyundaki en düz nesne ve yukarıdan en kolayı: beş
  yaprak, göbek, ercik. Hücreye sığdırılınca da aynı şey görünüyor.

Palmiye, hindistan cevizi ve sörf tahtası iki temada da var: onlar iki yerin
ortak dili. Aloha'nın imzası (`hero`) tiki ve palmiye.

### İlk turda iki düzen

`holetheme.mjs` iki şey şart koşuyor ve ikisi de yeni tema eklemenin
bedelini söylüyor: her tema ilk turda görünmeli, ve temalar arasındaki düzen
sayısı farkı biri geçmemeli. Yirmi dört düzen on iki temaya ikişer
dağılıyordu; Aloha'ya iki düzen, üçer düzeni olan Indoors ve Harvest'tan
birer tane alınarak verildi.

**Bubbles** gel-git havuzu oluyor (kara kumun üstündeki su birikintileri),
**Whirl** ise su girdabı — sürülmüş toprakta ekin dairesiydi.

### Sıradaki: şehirler

Aloha bir kalıp: yeni bir yer = yeni zemin + beş-altı kendine ait eşya +
kendi ışığı + iki düzen. Kalıbın işlediği burada ölçüldü, ve şehirler aynı
yoldan gelecek.

## Bildirim

Oyunun tek geri çağırma yolu, ve hiç yoktu. Oyuncu oyunu kapattığı an haberi
kesiliyordu: günlük meydan okuma gece yarısı değişiyor, giriş serisi
kırılıyor, günlük görevler sıfırlanıyor — hiçbiri kimseye ulaşmıyordu.
Raftaki rakiplerin hepsinde var.

`@capacitor/local-notifications@8.3.1`, Capacitor'ın **birinci parti**
eklentisi (`@capacitor/core >=8.0.0`, biz 8.5'teyiz) — Play Games'te
yaşadığımız terk edilmiş paket riski yok. Sunucu ve hesap gerekmiyor:
bildirim cihazda zamanlanıyor, oyunun "tamamen çevrimdışı" tasarımına
dokunmuyor.

**Günde bir, o kadar.** Casual oyunların çoğu bunu abartıp sessize
aldırıyor, ve sessize alınan bir uygulamanın geri dönüşü yok.

| Ne zaman | Ne yazıyor |
|---|---|
| Serisi var | `Day 6 streak` — bugünkü tarla bekliyor, seriyi sürdür |
| Serisi yok | `Today's field is up` — yeni günlük meydan okuma |

**İzin üçüncü bölümden sonra isteniyor.** Android 13+ bildirim için çalışma
anında izin soruyor ve ne zaman sorduğun kabul oranını belirliyor: ilk
açılışta soran oyun reddediliyor, ve Android ikinci reddi kalıcı sayıyor —
bir daha soramıyorsun. Üçüncü bölümden sonra soran oyun, oyuncunun oyunu
zaten sevdiği bir anda soruyor. Reddedilirse bir daha hiç sorulmuyor.

**Bugün oynayana bugün bildirim gitmiyor.** Zamanlama her bölüm sonunda
yeniden kuruluyor; oyuncu o gün oynadıysa bildirim yarına kayıyor. Bugün
oynamış birine akşam "tarlan hazır" demek oyuna değil bildirime karşı tepki
üretir.

Her kurulumdan önce eskisi iptal ediliyor — yoksa her açılış bir bildirim
daha ekler.

**Ölçen dosya `scratchpad/holenotif.mjs`.** Bildirimin gerçekten düşmesi
Android'in işi ve buradan görülemez; ölçülen şey eklentiye **ne
gönderdiğimiz**. Testin 4. bölümü ilk yazışımda kendi kurduğu durumu
ölçemiyordu: seriyi 2000 yılının tarihiyle tohumlamıştım, `ensureDaily()`
açılışta onu 1'e düşürüyordu. Dünün tarihiyle tohumlanınca doğru ölçüyor.

## Puan istemi

Raftaki her rakip 4.69 ile 4.89 arasında ve 17 binden 170 bine oy toplamış:

```
Hole Em All: Collect Master   4.89 / 47k     ~2.3M indirme/ay
Hole Em All: Black Hole       4.87 / 150k    ~750k
Hole Stars (Moon Active)      4.69 / 17k     ~760k
All in Hole (Homa Games)      4.76 / 170k    ~570k
Fruit Hole – Juicy Jam        4.53 / 360     ~30k
```

Bizde sıfır oy vardı ve oyuncudan puan isteyen hiçbir yer yoktu. Puan hem
sıralamayı hem mağaza sayfasındaki dönüşümü etkiliyor, yani oy istememek
indirmeyi de kaybettiriyor.

**Duygu filtresi yok, bilerek.** "Beğendin mi?" diye sorup yalnızca evet
diyeni mağazaya yollamak yaygın bir kalıp, ama Play'in kurallarına aykırı —
dürüst puanı caydırmak sayılıyor. Soru düz soruluyor, iki düğme de aynı
dürüst yere çıkıyor; biri şimdi, biri sonra.

Ne zaman: **üç yıldızla** bir bölüm bitince, sandık anının 2.6 saniye
sonrasında. En erken **beşinci bölümden** sonra, en çok **üç kez**, ve iki
istem arası en az **üç gün**. Puan verildiyse bir daha hiç. Tarayıcıda hiç —
gidecek bir mağaza sayfası yok.

Sayacı artıran şey istemin **gösterilmesi**, düğmeye basılması değil:
pencereyi görüp hiçbir şeye dokunmadan dönen oyuncuya da sorulmuş sayılır,
yoksa "en çok üç kez" hiçbir zaman dolmaz.

Mağazaya `market://` ile gidiliyor (Play uygulamasını doğrudan açıyor),
olmazsa `https` ile; ikisi de `_system`, yani oyunun WebView'ünde değil
cihazın kendi uygulamasında — içeride açılsa oyuncu oyundan çıkamaz.

**Ölçen dosya `scratchpad/holerate.mjs`.**

## Üst uçta duvar var mı — yok

`tier()` her 19 bölümde süreyi %7 kısıyor, %28'de duruyor. Birinci bölümde
bulduğumuz şeyin bir eşi diğer uçta olabilir diye ölçüldü:

```
bölüm 20 (tier 1)  acemi 47.3s kaldı   orta 68.9s
bölüm 44 (tier 2)  acemi 13.4s         orta 45.0s
bölüm 58 (tier 3)  acemi KAYBETTİ %64  orta 30.6s
bölüm 77 (tier 4)  acemi KAYBETTİ %98  orta 35.7s
bölüm 96 (tier 5)  acemi  9.4s         orta 28.2s
```

Değişiklik yapılmadı. Acemi tier 3'te kaybetmeye başlıyor, ama buradaki
"acemi" her üç hamlesinden birini rastgele yapan biri; 58. bölüme gelmiş
kimse öyle oynamıyor. Orta seviye en sıkı ayarda bile 28-45 saniye artırarak
bitiriyor — yani kazanılamayan bir bölüm yok.

İki sınır: her hücrede tek koşu var ve simüle oyuncu rastgele, yani sayılar
gürültülü — 96'nın 77'den kolay çıkması bunu gösteriyor, zorluk tier'dan çok
desene göre oynuyor. Ve 77'de acemi **%98'de** kaybetmiş; tek örnek, ama his
olarak en kötü sonuç, bir daha görülürse bakmaya değer.

## Aynı şekil, ikinci turda başka bir yerde

19 desen döngüyle geliyor, ve tema desenin içine yazılı — Pyramid kumsalda,
Blocks teknoloji mağazasında. Bu ilk tur için doğru: hangi şeklin nereye ait
olduğu elle seçilmiş. Ama sonucu şu: **20. bölümde oyuncu her yeri görmüş**
oluyor, 44'te her yeri iki kez.

Birinci turdan sonra tema artık dönüyor. Ölçüldü:

```
Pyramid    bölüm  1 Beach  →  bölüm 20 Snow Day  →  bölüm 39 Happy Hour
Bubbles    bölüm  5 Indoors → bölüm 24 Drive-In  →  bölüm 43 Beach
```

Kayma tur başına 3, ve 3 ile 10 aralarında asal olduğu için on tur boyunca
hiçbir desen aynı temayı iki kez görmüyor. 19 × 10 = 190 birleşim, tek bir
yeni varlık üretmeden.

Asıl kazanç zemin rengi değil: **nesneler temanın havuzundan okunuyor**, yani
Pyramid kara taşındığında içine kardan adam, iglo ve şeker kamışı düşüyor;
Bubbles arabalı sinemaya taşındığında burger, patates ve pizza. Yer gerçekten
değişiyor.

İlk tur bilerek dokunulmadan bırakıldı — oyunun ilk izlenimi o kürasyon.

(Desen sayısı o ölçümden sonra 24'e çıktı. Tema kayması 3 ve 10 tema
olduğundan aynı mantıkla çalışıyor; aşağıdaki iki ekleme 24'e göre.)

### Tema dönüyordu, tahta dönmüyordu

Tema kayması bir şeyi çözmüyordu: **tahtanın şekli** ikinci turda birebir
aynıydı. 25. bölüm yine Pyramid'di, aynı teraslar, aynı yerde. Kalan tek
fark %7 daha kısa süreydi, ve kimse süreyi görmüyor — şekli görüyor. Yani
oyunu 25. bölüme kadar getiren oyuncu, tam da elde tutulmaya değer oyuncu,
orada "bunu gördüm" diyordu.

İki ekleme var, ve ikisi ayrı işi yapıyor:

**1. Tahta çevriliyor.** Desenin fonksiyonlarına hücrenin kendi indisi yerine
çevrilmiş indisi veriliyor — hücre yerinde duruyor, şekil aynalanıyor.
Maliyeti iki çıkarma, yeni bir düzen yazmak yok. Üç çevirme sırayla geliyor
(sol-sağ aynası, ön-arka aynası, yarım tur), dolayısıyla bir düzen ancak
dördüncü turda kendine dönüyor: 96 bölüm.

Ayna simetrik bir tahtada hiçbir şey değiştirmez, ve bu tahmin edilecek bir
şey değil — ölçüldü (`scratchpad/holeloop.mjs`, desenin kendi cevabından
imza çıkarıp karşılaştırıyor):

```
mirrorX  20/24 düzende tahtayı değiştiriyor
mirrorZ  23/24
half     23/24
hiçbirinden etkilenmeyen: Orbits
```

Orbits'in `empty` ve `type` fonksiyonları yalnızca halka numarasına bakıyor,
açıya değil — açıyı yansıtmak şeklini değiştirmiyor. (Devlerinin yeri yine de
değişiyor: `big` açıyı okuyor.) Test bu listeyi iki yönlü tutuyor: yeni bir
düzen sessizce sabitlenirse de, Orbits bir gün değişmeye başlarsa da düşüyor.

Izgarada ayna bir eşleme olduğu için dolu hücre sayısı birebir korunuyor, ve
test bunu sınır olarak kullanıyor: değiştiyse indis tahtanın dışına taşmış
demektir. Kutupsalda korunmuyor, sebebi ölçüldü — halkalar tahtanın
dikdörtgen kenarında kesiliyor, yani daire tam değil, ve açıyı yansıtmak
kesilen yerle dolu yeri takas ediyor (Whirl 630 → 528). Bu desenin kendi
şekli, ama sınırsız da değil: dörtte birden fazla boşalıyorsa test düşüyor.

**2. Sıra kayıyor.** Çevirme simetrik tahtalarda yetmediği için 25. bölümün
yine Pyramid olmaması ayrıca sağlanıyor: tur başına 7 kayma. 7 ile 24
aralarında asal, yani hiçbir tur bir düzeni atlamıyor — sıra değişiyor,
kadro değişmiyor. Test her turda 24 düzenin hepsinin göründüğünü sayıyor.

```
 25 | tur 2 | mirrorX | Rings
 49 | tur 3 | mirrorZ | Whirl
 73 | tur 4 | half    | Bloom
 97 | tur 5 | none    | Wave
```

**Tur ekranda yazıyor.** Düzen adının önüne `LOOP 2 ·` geliyor. Aynı ismi
ikinci kez gören oyuncunun "hata mı" değil "ikinci tur" diye okuması için;
tekrar, tekrar olduğu söylendiğinde ilerleme olur.

Günlük koşu yine dışarıda, yukarıdaki sebeple: `tier()` oyuncunun bölümünü
okuyor, çevirme günlüğe de işleseydi 12. bölümdeki oyuncuyla 44. bölümdeki
oyuncu aynı gün farklı tahta görürdü. `holedaily.mjs` bunu zaten ölçüyor —
karşılaştırdığı iki profilden biri 44. bölümde, yani ikinci turda.

Bir de sayfayı hiç açtırmayan bir tuzak çıktı: tur etiketi için `tier()`
çağrılıyor, `tier()` desen listesini okuyor, ve o listeyi kuran satır
dosyanın çok altında. Etiketi tazeleyen fonksiyon açılışta bir kez oradan
geçiyor, o an liste henüz yok, ve oyun hiç açılmadan düşüyor. Etiket artık
tahta kurulmuşsa yazılıyor.

**Günlük meydan okuma da dışarıda, ama bu ikinci denemede oldu.** İlk sürüm
"günlüğe dokunmuyorum" varsayıyordu; günlük tarla da aynı yoldan geçiyor ve
`tier()` oyuncunun bölümünü okuyor, yani 12. bölümdeki oyuncuyla 44.
bölümdeki oyuncu aynı gün için farklı tema, farklı nesne, farklı tarla
görüyordu. Oyunun günlük için verdiği tek söz buydu.
`scratchpad/holedaily.mjs` iki koşunun tarla özetini karşılaştırıyor ve
yakaladı — `dailyRun` artık en başta eleniyor.

## Sipariş bölümleri 📋

Yirmi dört düzenin hepsi aynı işi istiyordu: tarlayı süpür. Düzen **tahtanın
şeklini** değiştiriyor, yapılan işi değiştirmiyor — ve tur çevirmesi de
(yukarıda) şekli değiştiren bir şey, işi değil.

Görev bölümleri işi değiştiriyor. Dört tip var ve sırayla geliyorlar — 5
sipariş, 15 devler, 25 rush, 35 mayın, 45 sipariş… — yani iki görev arası on
bölüm ve aynı tip kırk bölümde bir.

Bulmaca bu sıranın içinde değil, kendi sayacında (18, 28, 38…); sebebi aşağıda,
"Bulmaca bölümleri" başlığında.

Sipariş: bölüm tarlanın tamamı bittiğinde değil, **tek bir meyvenin hepsi**
yendiğinde bitiyor. Rota bambaşka — süpürmek yerine bir
rengi kovalamak, ve yoldaki öteki meyveler yalnızca büyümek için.

Sonu 5 olan bölümler: 5, 15, 25… Patronla (her onuncu) hiç çakışmıyor ve iki
sipariş arası on bölüm. Menüde, bölüm listesinde ve üst satırda 📋 ile
işaretli; kuralı ipucu satırı söylüyor, yani yeni bir ekran açmıyor.

### Saat: süpürme modeli burada yanlış cevap veriyor

Oyunun saati `sweepSeconds()` ile veriliyor ve o model **alanı** ölçüyor:
tarlanın tamamı, delik genişledikçe hızlanarak. Sipariş bölümünde oyuncu boş
bölgeleri atlayıp hedeften hedefe düz gidiyor, yani ölçü alan değil **yol**.

Ölçüldü (`scratchpad/holeorder.mjs`, gerçek tarlada en yakın komşu turu):

```
tek bir meyvenin hepsini toplama turu    5-34 sn
bölümün süpürme saati                  113-148 sn
```

Yani sipariş süpürme saatiyle verilseydi altıda bir sürede biterdi: her koşu
üç yıldız, hiçbir koşu kaybedilemez, "+15 saniye" reklamının anlamı yok.

### Hedef meyve sayıya göre seçilmiyor

Bir türden çok olması yolun uzun olması demek değil — hepsi bir köşede
olabilir. İlk kural "tarlanın dörtte birine en yakın tür"dü ve tur süresini
5.1 ile 33.9 saniye arasında bıraktı, yani altı kat: aynı görev bir bölümde
sprint, ötekinde gezinti.

Dört türün turu da ölçülüp **hedefe (25 sn) en yakın olanı** seçiliyor. Bu tek
başına yayılmayı 6 kattan 4 kata indiriyor (6.4-28.2 sn). Kalan iki uç,
Pillars ve Bloom, tarlanın kendisi küçük olduğu için daha uzun bir tur
sunamıyor; onlar için 30 saniyelik bir taban var.

### Kat sayı kopyalanmadı, ölçüldü

İlk hâli süpürmenin katsayısıydı (2.6). `scratchpad/holeorderplay.mjs` sipariş
bölümlerini sahte saatle gerçekten oynuyor — otomatik oyuncu hedef meyveye
gidiyor, yutamadığı bir hedefe denk gelince büyümek için en yakın meyveye
sapıyor. İlk ölçüm:

```
 blm | hedef | saat | kullanılan | yıldız
   5 |    46 |   60 |       27.2 |    3
  15 |    63 |   56 |       19.3 |    3
  25 |    65 |   45 |       21.5 |    3
```

Saatin %36-45'i kullanılmış, üçünde de üç yıldız — yani kaybetmek mümkün
değil. 2.0'a çekildi.

### Tur modeli deliğin ağzını bilmiyordu

İkinci ölçümde yayılma hâlâ genişti: bot bir bölümde saatin %50'sini,
ötekinde %29'unu kullanıyordu. Sebep modeldeydi — tur her hedef meyveye tek
tek uğruyor, oysa **büyümüş bir delik bir geçişte yan yana üçünü birden
alıyor**. Yani model sıkışık tahtalarda gerçeğin iki katını söylüyor, seyrek
tahtalarda isabet ediyordu; ölçüdeki imza tam olarak buydu.

Birbirine 2.2 birimden yakın meyveler artık tek durak. 2.2, deliğin bölüm
ortasındaki ağzı (taban 0.55, tavan 2.75); sabit, çünkü saat tahta kurulurken
veriliyor ve deliğin o an nerede olacağı bilinmiyor.

Düzeltmeden sonra, aynı katsayıyla (2.0):

```
 blm | hedef | saat | kullanılan | kalan | yıldız
   5 |    57 |   41 |       18.3 |  22.7 |    3
  15 |    71 |   35 |       19.6 |  15.4 |    2
  25 |   109 |   29 |       15.1 |  13.9 |    3
  35 |    32 |   33 |       15.9 |  17.1 |    3
  45 |   126 |   33 |       16.9 |  16.1 |    3
```

Kullanım %45-56 aralığına oturdu (önce %29-50) ve bir bölüm iki yıldıza
düştü. Kalan pay bot ile insan arasındaki fark: bot kusursuz dönüyor, hiç
duraksamıyor ve yanlış meyveye gitmiyor.

Nesneler sayılmıyor: "bütün muzları ye" diyen bir görevde sulama kabı muz
değil, ve oyuncu ona bakıp muz saymaz. Günlük koşuda sipariş yok, sebebi
yukarıdaki tur çevirmesiyle aynı.

### Birleştirme öbeği yuttu

Kaan 45. bölümü geçemedi: 105 muzun 62'sini alabildi ve saat bitti. Model o
tahtada **108 muzu yedi durak** sayıyordu.

Bir üstteki düzeltme — yan yana duranlar tek durak — meyve tipleri tahtaya
serpilirken doğruydu: bir hücrede aynı tipten iki-üç şey oluyordu, üstü
kalanı deliğin ağzı örtüyordu. Dizilişin düzensizliği giderilirken tipler
gürültü alanından okunmaya başladı ve aynı tip **öbek öbek** durur oldu.
Birleştirme öbeğin tamamını tek durağa indirdi: 17 saniyelik tur, 33
saniyelik saat, ve gerçekte 108 parçalık bir süpürme.

Durak artık kaç parça yuttuğunu taşıyor ve tur, ilkinden sonraki her parça
için yarım birim ödüyor (ızgara hücresi 1.05, deliğin ağzı bölüm ortasında
iki sıra kadar).

Yan etkisi: hedef meyveyi seçen kural (turu 25 saniyeye en yakın tür) artık
bir öbeğin gerçek bedelini görüyor ve tahtadaki en sıkışık türü seçmiyor.

### Katsayı 2.0 değil 3.0

Öbek düzeltmesinden sonra 85. bölüm kaybetmekten geçmeye döndü ama 205 hâlâ
bitmiyordu. Ölçüm için bota **sınırsız saat** verildi ve bölümü bitirmesi
için gerçekten gereken süre okundu. Model ile gerek aynı koşudan, çünkü tahta
her koşuda yeniden kuruluyor:

```
 blm | verilen saat | gereken | oran
   5 |      52      |  20.0   | 2.60
  45 |      51      |  31.4   | 1.62
  85 |      48      |  40.3   | 1.19
 125 |      35      |  23.2   | 1.51
 165 |      40      |  18.9   | 2.12
 205 |      34      |  38.4   | 0.89   <- kusursuz bot bile yetişmiyor
```

İki şey üst üste biniyordu. Tur modelinin gerçeğe oranı 0.7 ile 1.6 arasında
oynuyor, yani 2.0 katsayı bu salınıma bile yer bırakmıyor — köşeyi kaçıran,
büyümek için sapan bir insana hiç bırakmıyor. Üstüne geç turlarda saat ayrıca
%28 kısılıyordu.

Katsayı 3.0 oldu ve geç tur kısıtlaması sipariş bölümüne uygulanmıyor: o
kısıtlama `sweepSeconds() * 2.6`'nın —kaba bir üst sınırın— yağını almak için
var, siparişin saati ise o tahtadaki hedef meyvelerin ölçülmüş turu ve
alınacak yağı yok.

Sonuç:

```
 blm | verilen saat | gereken | oran
   5 |      74      |  20.2   | 3.66
  45 |      74      |  18.1   | 4.09
  85 |      91      |  39.3   | 2.32
 125 |      76      |  17.7   | 4.29
 165 |      79      |  41.2   | 1.92
 205 |      70      |  28.3   | 2.47
```

En kötü tahtada bot saatin %52'sini kullanıyor, en iyisinde %23. Sipariş
bölümü yine de sıradan bir bölümden sıkı: aynı tahtanın görevsiz saati
124-152 saniye, siparişinki 64-74.

### Üçüncü tip: ⏱ Rush

İlk iki görev **ne yiyeceğini** değiştiriyor. Üçüncüsü **ne kadar
durabileceğini**: saat 12 saniyede başlıyor, yenen her meyve 0.35 ekliyor,
tavan 30 saniye. İş yine tarlayı süpürmek ama tempoyu tahta değil oyuncu
belirliyor — duran kaybediyor.

Eşik aritmetikten çıkıyor: saniyede 1 saniye harcanıyor, 0.35 × (saniyedeki
meyve) kazanılıyor, yani **saniyede ~3 meyve** başa baş. Altında saat eriyor,
üstünde doluyor.

Tavan olmasaydı geç safhada saat yüz saniyeye çıkardı ve bölüm sıradan bir
süpürmeye dönerdi.

Ölçüm (`scratchpad/holeorderplay.mjs`, iki rush bölümü):

```
 blm | hedef | bitti mi | kalan saat | yıldız
  25 |   197 | bitti    |  22.0 / 30 |    3
  55 |   388 | bitti    |  23.8 / 30 |    3
```

Ve ölçümün gösterdiği, tasarlanmayan ama doğru olan şey: **gerilim bölümün
sonunda.** Bot koşunun ortasında saati tavana dayıyor, sonlara doğru tarla
seyrekleşince saat beslenmeyi bırakıyor ve düşmeye başlıyor. Yani rush'ın zor
yeri son otuz meyve.

İki şey de saatin şekli yüzünden yanlış ölçüyordu:

* **Yıldızlar** bölümün başlangıç saatine bakıyordu. Rush'ta saat 12'de
  başlayıp tavana tırmandığı için oran hep 1'in üstündeydi — her koşu üç
  yıldız. Artık tavana göre: hiç sıkışmadan geçen üç, son saniyede yetişen bir.
* **Testin kare bütçesi** "saat + 5 saniye"ydi. Rush'ta saat, bölümün ne kadar
  süreceğini değil ne kadar durabileceğini söylüyor; bot tarlanın üçte ikisini
  yemişken bütçe bitti ve test "bitirilemedi" dedi. Saat o sırada tavandaydı.

### Görevlerin ödülü

Başarım listesi görevleri görmüyordu: oyun on bölümde bir görev veriyor, ama
on altı hedefin hiçbiri onlara bakmıyordu. Üç basamak eklendi ve sayılar
seyrekliğe göre seçildi — görev on bölümde bir geldiği için "10 görev" yüz
bölüm demek:

```
📋 Order up        1 görev bitir              →  beşinci bölümü bitiren herkes
🧾 Regular        10 görev bitir              →  ~yüz bölüm
🍉 Heavy lifting   5 dev bölümü temizle       →  ~doksan bölüm
```

Görev bölümleri ayrı sayılıyor, bölüm sayacına karışmıyorlar: karışsalardı
"on görev bitir" ile "on bölüm bitir" aynı şey olurdu.

`holeawards.mjs` yeni hedefleri kendiliğinden ölçüyor ama bir yeri elle
güncellemek gerekti: test "her hedef en uç durumda tamamlanıyor mu" diye
bakarken o uç durumu kendisi kuruyor, ve yeni sayaçlar orada yoktu. Yani yeni
hedefler ulaşılamaz göründü ve test düştü — doğru davranış.

Sayaçların gerçekten arttığını tablo göstermiyor; onu `holeorderplay.mjs`
ölçüyor: bölümü oynayıp bitiriyor, sonra sayaca bakıyor. Artmayan bir sayaç
ekranda hedefi sonsuza kadar 0/10'da tutar ve hiçbir hata vermez.

### Açılışta düşen oyun

Bu iş çalışırken üçüncü kez aynı tuzağa düşüldü, ve bu sefer oyuncuya
çıkacaktı: sipariş görevi **tarla kurulurken** hesaplanıyor, hesap deliğin
hızını okuyor, hız ise dosyanın en sonunda `const` ile duruyordu. Tarla ise
sayfa açılırken kuruluyor. Sonuç: kaydı 5. bölümde olan herkes için oyun
açılmıyordu — yükleme perdesi hiç kalkmıyordu.

Birinci bölümde açılıyordu, çünkü orada görev yok. Yani her zamanki deneme
(yeni profil, birinci bölüm) bunu göremezdi.

`scratchpad/holeboot.mjs` artık bu çizgiyi tutuyor: oyunu sıradan bir
bölümde, sipariş bölümünde, patron bölümünde, ikinci turda ve dördüncü turda,
hem gerçek hem sahte saatle açıyor, ve yalnızca perde kalkıp menüye
varılıyorsa geçiyor. Hızı eski yerine geri koyunca 5, 25 ve 35. bölümlerde
tam o hatayla düşüyor.

## Yeni oyuncu birinci bölümü kaybediyordu

Ölçüm, tahmin değil. `scratchpad/holefirst.mjs` temiz bir profille ilk
dakikayı geçiyor; ona eşlik eden koşu birinci bölümü üç beceri seviyesinde
sonuna kadar oynuyor. Beceri burada "en yakın meyveye doğru sürme olasılığı"
— yeni oyuncu aşağı yukarı böyle oynuyor, satır satır süpürmüyor.

```
beceri 0.55   KAYBETTİ   tarlanın %49'u, süre bitti
beceri 0.80   kazandı    3.6 saniye kalarak
beceri 1.00   kazandı    15.9 saniye kalarak
```

Yani parmağını nasıl süreceğini henüz öğrenmemiş oyuncu ilk bölümü
kaybediyor, ve temiz oynayan bile 101 saniyenin 16'sını artırabiliyor.
TikTok'tan gelen herkesin oynayacağı bölüm bu.

**2.6 katsayısına dokunulmadı.** Üstündeki yorum neden öyle olduğunu zaten
yazıyor: eski formül %42-82 boş süre bırakıyordu, hiçbir bölüm
kaybedilemiyordu, her koşu üç yıldız veriyordu ve "+15 saniye" ödüllü
reklamı hiç çıkmıyordu. O gerekçe yerinde. Hesaba katmadığı tek şey
**birinci** bölümdü.

Zorluk kaldırılmadı, geciktirildi — `ease()`, ilk dört bölüme sırasıyla
1.45, 1.30, 1.18 ve 1.08 çarpanı veriyor, beşinciden itibaren 1. Sonuç:

```
bölüm 1   acemi 47.5s kaldı    orta 75.5s
bölüm 2   acemi 39.8s          orta 72.4s
bölüm 3   acemi 34.8s          orta 60.8s
bölüm 5   acemi 27.0s          orta 45.4s   ← ek süre yok
bölüm 8   acemi  5.5s          orta 14.5s
```

Gerilim 8. bölümde geliyor ve acemi orayı 5.5 saniyeyle sıyırıyor. Yıldız
tarafı da kendiliğinden düzgün: üç yıldız sürenin %45'ini istiyor, birinci
bölümde acemi %32'de kalıyor (iki yıldız, geliştirecek bir şey var), orta
seviye %52 alıyor.

**Ölçümün sınırı:** otomatik oyuncu en yakın meyveyi kovalıyor, bu kötü bir
süpürme. İyi bir insanı temsil etmiyor — onu olduğundan zayıf gösteriyor.
Ama yeni oyuncuyu iyi temsil ediyor, ve burada önemsediğimiz durum oydu.

## Teşhis ekranı: sessizliğin bedeli

Sürüm yazısına **beş kez** dokununca teşhis ekranı açılıyor.

Sebebi şu: oyunun iki katmanı bilerek sessiz. Liderlik tablosu kurulu
değilse 🏆 düğmesi hiç görünmüyor, mağaza fiyatı gelmezse `—` yazıyor.
Oyuncu için doğrusu bu — çalışmayan bir düğme, olmayan bir düğmeden
kötüdür, "bozuk" diye okunur. Ama aynı sessizlik geliştiriciye de
uygulanınca üç ayrı sebep cihazda **tıpatıp aynı** görünüyor:

* eklenti derlemeye hiç girmemiş,
* eklenti var ama giriş reddedildi (ya da test kullanıcısı değiliz),
* imza parmak izi yanlış ve giriş Google tarafında düşüyor.

22 (1.8.2) telefona kuruldu, doğru derleme olduğu sürüm yazısından
doğrulandı, ve 🏆 yine çıkmadı. O noktada elimizde ihtimalleri ayırt edecek
hiçbir şey yoktu: her tahmin bir versionCode ve bir inceleme turu demekti.
Bu ekran onu tek dokunuşa indiriyor.

Okuduğu şeyler: native mi, Capacitor'ın tanıdığı eklentilerin listesi,
`PlayGames` bulundu mu, girişin sonucu ve **başarısızsa Google'ın kendi hata
metni**, tablo kimliği, `gamesReady()`; aynısı mağaza için — `NativePurchases`
bulundu mu, kaç ürünün fiyatı geldi, gelmediyse sebebi, neye sahibiz.

Üç düğmesi var. **Sign in again** girişi elle deniyor: sessiz giriş bu oyuna
daha önce girmemiş oyuncuda zaten reddediliyor, o yüzden "reddedildi" tek
başına arıza işareti değil — elle çağrılan giriş oyuncunun bir hareketine
karşılık geldiği için Google hesap ekranını göstermeye hakkı var, ve
göstermezse sebebini yazıyor. **Open leaderboard** düğmenin gizli olduğu
durumda bile çağrının ne dediğini gösteriyor. **Copy** metni panoya alıyor,
çünkü ekran görüntüsü her zaman okunaklı çıkmıyor.

Hata metinlerini saklamak için `_gamesErr`, `_gamesRaw` ve `_iapErr`
eklendi. Akışta kullanılmıyorlar, yalnızca bu ekran okuyor — yani sessizlik
oyuncu için aynen duruyor.

Beş dokunuş kazara olmaz, ve dokunuşlar arası 1.2 saniyeyi geçerse sayaç
sıfırlanıyor; yoksa gün içine dağılmış beş dokunuş birikip ekranı
kendiliğinden açardı. `#verTag`'in `pointer-events`'i bu yüzden `auto`
oldu — eskiden `none`'dı, yani hiç açılmazdı.

**Ölçen dosya `scratchpad/holediag.mjs`.** Asıl kontrol şu: üç durum sahte
eklentilerle ayrı ayrı kuruluyor ve üçünün çıktısının **birbirinden farklı**
olduğu doğrulanıyor. Ekran üçüne de aynı şeyi yazsaydı hiçbir işe yaramazdı,
ve bunu "ekran açılıyor mu" diye bakarak fark edemezdin.

## Menünün üst satırı beş haneli bakiyede taşıyordu

Kaan'ın telefonundan gelen fotoğrafta dört sayaç 17359, 18269, 21583 ve
22560 yazıyordu; satırı öyle şişirmişlerdi ki **mağaza ve ses düğmeleri
ekranın dışına taşmıştı** ve "Peelo" yazısı sayaçların altında kalmıştı.

Ölçünce (`scratchpad/holetop.mjs`) daha kötüsü çıktı: **360px'lik bir
telefonda sıfır bakiyeli yeni oyuncuda bile ses düğmesi ekran dışındaydı.**
Yani hata ekonomiden önce de vardı, ekonomi onu yalnızca görünür yaptı — en
pahalı kaplama 11.000 ve bütün ağaç 26.000 olduğu için beş haneli bakiye
artık istisna değil, oyuncunun içinde dolaşması beklenen aralık.

Bu, mağaza düğmesi için ayrıca kötü: satın alma katmanının tamamı o düğmeye
basılabilsin diye var.

Üç değişiklik:

- **Cüzdan esner, tuşlar esnemez.** `#menuWallet` artık `flex: 1 1 auto;
  min-width: 0` ile daralıyor; tuşlar `flex: none`. Eskiden dört pill kendi
  doğal genişliğinde duruyor ve tuşları önüne katıp kenardan atıyordu.
- **Dört basamağı geçen sayı kısaltılıyor** (`fmtCount`): 17359 yerine
  17.4k, 123456 yerine 123k. Dört basamağa kadar tam sayı kalıyor, orada tek
  tek meyve sayısı hâlâ anlamlı.
- **385px altında tuşlar 38px'e iniyor.** Parmakla basılabilir en küçük
  ölçünün altına inilmiyor; dar telefonda dört sayacın dördünü birden
  göstermenin başka yolu yoktu.

Test dördünü de kontrol ediyor: iki tuş da ekranın içinde, başlık örtülmüyor
ve **dört sayacın dördü de görünüyor** — kaydırılabilir olması yetmiyor,
çünkü kaydırılabildiğini söyleyen hiçbir şey yok.

## Bomba: tahtadaki ilk direnç

O ana kadar bölümler birbirinden yalnızca **düzen** ve **saat** ile
ayrılıyordu. Yutulacak her şey pasifti; seni durduran, cezalandıran, etrafından
dolaşmanı isteyen hiçbir şey yoktu. Kaan'ın saydığı üç oyundan **Hole Stars**
(Moon Active) tam olarak bunu yapıyor: *"sinsi blokerlerden kaçın, engelleri
alt et."* Aradaki tek gerçek oynanış farkı buydu.

Bomba her boyutta yutulabiliyor — yani bir **kapı** değil, bir **karar**.
Yutarsan saatten 5 saniye gidiyor; para vermiyor, büyütmüyor, zinciri de
bozmuyor (aynı hatayı iki kez ödetmemek için). İlk kez "nereye gitmeyeceğim"
diye bir soru doğuyor, ve kalabalık bir öbeğin ortasındaki bomba o öbeğin
tamamını riskli yapıyor.

Ayarlar: 6. bölümden itibaren (yeni oyuncu önce oyunun ne olduğunu öğreniyor),
hücrelerin %1.2'si, deliğin doğduğu yere 4.5 birimden yakın değil, ve günlük
koşuda hiç yok — o tahta herkeste aynı olmak zorunda ve tek rastgele öğe bile
adaleti bozar.

### Dört şey, ve dördü de oynamadan görünmüyor

**Bitirme şartına girmemeli.** Girseydi "kaçın" denen şeyi yemek zorunlu
olurdu. `levelGoal` onu saymıyor — bombalar tahtada kalabilir.

**Aynı şeyi görev hedefleri de yapıyordu.** `rush` hedefi `fruits.length`
diyordu ve bombalar oraya giriyordu, ama yenince sayaca girmiyorlardı: 25.
bölüm 187/189'da kilitlendi, `holeorderplay` yakaladı. Sipariş görevinde de
aynısı vardı — bomba, yerini aldığı meyvenin tipini taşımaya devam ediyor.

**Tek parçalık hücrelerde durmalı.** Bir hücre kule tutabiliyor ve kuledeki
her parça listede ayrı bir girdi: aday listesine alınınca aynı hücreye iki
bomba düşüyordu (ikisi de zemine konduğu için üst üste biniyorlardı), ve bir
kulenin altındaki bomba üstündeki meyvelerin arkasında kalıyordu. Görünmeyen
bir cezadan kaçınılamaz.

**Mıknatıs onu çekmemeli.** Çekseydi parayla alınan bir yükseltme, oyuncunun
kaçtığı şeyi ona doğru sürükleyen bir ceza olurdu.

### Siyahtı, kırmızı oldu

İlk hâli koyu gri bir küreydi ve ilk ekran görüntüsünde sorun ortaya çıktı:
yukarıdan bakınca **oyuncunun kendi deliğine benziyordu.** Tahtadaki tek koyu
daire delikti ve ikinci bir tane koymak "hangisi benim" sorusunu doğuruyor.
Gövde koyu kırmızı oldu, üstüne açık renkli bir kuşak (yukarıdan düz bir
daireyi halkaya çeviriyor) ve daha parlak bir fitil kıvılcımı.

Bomba `PROPS`'a **girmiyor**: oradaki her şey koleksiyonun parçası ve "63
şeyden 41'ini buldun" listesine bir ceza nesnesi koymak, onu bulunacak bir
şeymiş gibi gösterirdi.

## Kare ölçer: "takılıyor mu" sorusu artık tahmin değil

Çizim çağrısı bütçesi aylardır aşılıyor — 800-1500 karşı 300 — ve instancing
işi haftalardır "önce telefonda takılıyor mu bakalım" diye bekliyor. O soru
hiç cevaplanmadı, çünkü cevaplayacak bir ölçü yoktu.

**Bu konteynerde kare süresi ölçülemiyor.** GPU yok, SwiftShader'la çiziliyor
ve süre yük altında zıplıyor: aynı kare için yapılan üç ölçüm "meyve gölgesini
kapatmak %20 **daha yavaş**" diyebiliyor, ki saçma. Çizim çağrısı güvenilir
(sayaç), süre değil. Yani buradan yapılacak bir optimizasyonun işe yarayıp
yaramadığı **doğrulanamaz** — körlemesine olur.

Ölçer bunu çözüyor: oynarken kare süreleri toplanıyor, en kötüsü ve **hangi
bölümde** olduğu saklanıyor, teşhis ekranı da okuyor. Üç satır:

```
kare       58 fps ort · 12.400 kare · 9 koşu
takılan    34 kare (%0.3) 20 fps altında
en kötü    96 ms · bölüm 24
```

### Neden saklanıyor

Oyuncu teşhis ekranını takılmanın hemen ardından açmıyor — oyunu bırakıp
menüye dönüyor, belki kapatıp sonra bakıyor. Oturumda kalan bir sayı tam da
bakılacağı anda silinmiş olurdu.

Yazma koşu bitince oluyor, her karede değil: `localStorage`'a saniyede altmış
kez yazmak ölçtüğü şeyi bozar.

### Neden yalnızca oynarken

Menüdeki diorama tek halka meyve. Oradaki kare süresi oyunun kare süresi
hakkında hiçbir şey söylemiyor, ve menüde geçirilen dakikalar ortalamayı
oyunun hiç olmadığı kadar iyi gösterirdi.

### En kötü karenin bölümü de tutuluyor

Takılmanın **nerede** olduğunu bilmek, ne kadar olduğunu bilmek kadar önemli:
"96 ms" tek başına ne yapılacağını söylemiyor, "96 ms, bölüm 24" söylüyor.

`scratchpad/holeperf.mjs` kablolamayı ölçüyor — sayının doğruluğunu değil, ki
o burada ölçülemez: menüde sayılmıyor mu, koşu bitince saklanıyor mu, sayfa
kapanınca duruyor mu, ve teşhis ekranı ölçerle aynı kaynaktan mı okuyor.

## Hedef rozeti: ne topladığın artık ekranda

İlerleme çubuğu **"ne kadar"** diyordu ama **"ne"** demiyordu, ve bir sayı da
taşımıyordu. Görev bölümlerinde sayı vardı ama desen satırının içine
gömülüydü — küçük, ortada, turun ve düzenin adıyla aynı satırda. Sıradan bir
bölümde ise hiç yoktu.

Rozet duraklat düğmesinin altında: görev simgesi (ya da sıradan bölümde 🍇) ve
`kaçta kaç`. O köşe zaten boştu ve soldaki bölüm rozetini dengeliyor. Hedef
dolunca yeşile dönüyor.

### Sayı artık tek yerde

Desen satırından çıkarıldı. Aynı sayının iki yerde durması, ikisinden birinin
güncellenip ötekinin unutulacağı yer — bu dosyada o hata birkaç kez yaşandı
(en son "hepsini bul" hedefi). Satır artık yalnızca görevin **ne** olduğunu
söylüyor, rozet **kaçta kaç** olduğunu.

Bunun bir yan faydası da var: sayı orada olduğu için desen satırının tamamı
her yemede yeniden yazılıyordu. Artık yalnızca bölüm değişince yazılıyor.

### Çubuğa bağlanan bir sayı donuk kalırdı

Rozet her yemede güncelleniyor, çubuk ise yalnızca yüzde değişince. 480
parçalık bir tahtada yüzde beş yemede bir değişiyor — çubuğun güncellemesine
bağlanan bir sayı dört yemede bir hareketsiz kalırdı.

### Perde açıldığında gizlenmesi ayrı yazılmak zorunda

`updateProgressUI` bitiş perdesinden sonra bir daha çağrılmıyor, yani rozeti
gizleyecek kimse yok — perdenin üstünde asılı kalırdı. `showOverlay` ve
`showMenu` onu ayrıca gizliyor, ve `scratchpad/holegoal.mjs` bunu ölçüyor.

## Dördüncü booster: kasırga

Kaan'ın attığı ekran görüntülerinde alt barda **dört yuva** vardı, bizde üç.
Ama asıl sebep sayı değil: üç booster üç meyveyi kullanıyordu ve **çilek
boştaydı** — oyunun ilk meyvesi, en çok biriken sayaç, harcanacak tek yeri
yoktu. Dört booster dört sayaç, ve hiçbiri ötekinin parasına ortak değil.

Ötekilerden farkı fiili: süre ve büyüme sana bir şey veriyor, mıknatıs
süpürmeye yardım ediyor. Kasırga **tahtadan bir parça siliyor** — çevredeki
4.5 birimdeki her şeyi tek seferde yutuyor.

### Neyi almadığı, tasarımın kendisi

* **Devi almıyor.** Alsaydı oyunun tek büyüme kapısı 130 çileğe satılmış
  olurdu: bir bölümün asıl işi deve yetişecek kadar büyümek.
* **Bombayı almıyor.** Alsaydı sıkıştığın yeri boşaltmak için bastığın düğme
  saatinden yirmi saniye götürebilirdi — yardım eden bir şeyin cezalandırması,
  en kötü türden sürpriz.
* **Zincir çarpanı tavanda.** Kasırga zaten bir süpürme ve süpürmenin ödülü bu
  oyunda zincir; tek tek yemiş gibi ödemek aynı işi yapan iki yoldan birini
  sebepsiz ucuzlatırdı.

Fiyat 130 çilek — bir bölümün çilek kazancının %42'si, ötekilerin (%44, %32,
%41) tam ortasında.

### Dördüncü yuva dar telefonda kenara dayandı

320 piksellik bir ekranda bar iki yanda **dörder piksel** bırakıyordu.
Taşmıyordu, ama o payla yaşamak bir sonraki eklemede taşmak demek. 385
pikselin altında yuva 66'dan 58'e, aralık 16'dan 10'a iniyor; pay 29 piksele
çıktı. `scratchpad/holetwister.mjs` 360 ve 320'de ölçüyor.

### `holerelease` cümlenin sözcüklerine bağlıydı

Mağaza metnini karakter sınırına sığdırmak için bir cümleyi kısaltınca test
düştü: `/Three throw out the grid/` arıyordu. Oysa metin hâlâ "Three … rings
around you" diyordu, yani bağlaması gereken **sayı** yerindeydi. Cümlenin
sözcüklerine bağlı bir test, metnin her düzenlemesinde olmayan bir hata
uyduruyor.

## Devin ne ödediği artık yazıyor

Kaan'ın attığı ekran görüntülerinde topların üstünde **"+2"** yazıyordu:
hangisinin değerli olduğunu tahtada söylüyorlar. Bizde o bilgi vardı ama
hiçbir yerde görünmüyordu — ve bizdeki hâli çok daha çarpıcı: **bir dev,
sıradan meyvenin on iki katı ödüyor** (`bumpCurrency(f.type, f.giant ? mult *
12 : mult)`). Oyuncu bunu ancak sayacı gözleyip çıkarabilirdi, ki kimse
yapmıyor.

Artık dev yutulunca ödediği sayı, yutulduğu yerde, meyvenin kendi renginde
uçuyor. **Yalnızca devlerde**: bir bölümde 500 parça var ve her birine uçan
bir sayı koymak hem okunmaz bir kalabalık hem yüzlerce DOM düğümü demek.
Gösterilecek bilgi zaten devde.

### Üçü de ölçümle çıktı, gözle değil

**Etiket ilk 160 milisaniyede görünmüyordu.** Animasyon sıfır opaklıkla
açılıp %18'de bire çıkıyordu; ölçüldüğünde 160. ms'de opaklık hâlâ 0'dı. Kare
hızı düşükken animasyonun ilk aralığı hiç boyanmıyor ve etiket bir anlığına
belirip kayboluyor — yani en çok ihtiyaç duyulan cihazda hiç görünmüyor.
Artık ilk kareden itibaren görünür.

**Kadrajın kenarındaki dev yutulunca etiket ekranın dışına düşüyordu**
(ölçüldü: y = -32). Artık kenarlara sıkıştırılıyor; kenara yapışık da olsa
okunuyor.

**Kameranın arkasındaki bir nokta ekranın ortasına yansıyor.** Yansıtmanın
`z > 1` olduğu durumda etiket hiç çıkmıyor, yoksa kadraj dışında yutulan bir
devin sayısı ekranın ortasında belirirdi.

### Ölçüm aracının kendisi yanılttı

Ekran görüntüsü üç kez boş çıktı ve etiketin çizilmediği sanıldı. Sebep
oyunda değildi: bu konteynerde `page.screenshot()` saniyeler sürüyor (GPU yok,
2-4 fps) ve bir saniyelik animasyon o arada bitip etiketi siliyordu. Ölçüm
"opaklık 1, konum (343,359)" derken kare boştu, çünkü ikisi **farklı anlara**
bakıyordu. Karede görebilmek için animasyonsuz bir kopya bırakmak gerekti.

`scratchpad/holepay.mjs` dördünü de tutuyor: etiket çıkıyor mu, sayı devin
katı mı, ekranın içinde mi, ve kendini siliyor mu.

## Dördüncü görev tipi: mayın tarlası

Üç görev tipi de aynı fiili istiyordu — **topla**. Sipariş bir rengi, devler
boyutu, rush hızı. Eksik olan fiil **kaçın**, ve bomba katmanı yeni yapılmıştı:
ikisi birleşti.

Mayın bölümünde hücrelerin **%7'si** bomba (sıradan bölümde %1.2). Hedef
tahtanın tamamı, tıpkı rush gibi; değişen şey tahtanın kendisi.

**Yeni bir kaybetme şartı yok, ve bu bilerek.** Ceza zaten var olan saatte:
her bomba beş saniye götürüyor, ve saat sıradan bir bölümün saati artı **dört
bombalık pay**. Temiz süpüren oyuncu o payı hiç harcamıyor; beşinci bombadan
sonra saat yetişmiyor. Ayrı bir "can" sayacı, ekranda ikinci bir kural ve
kodda ikinci bir bitiş yolu demekti — ikisi de bir şeyin bozulacağı yer.

Sıra artık dörtlü: **5 sipariş, 15 devler, 25 rush, 35 mayın, 45 sipariş…**
Yani döngü 30 bölümden 40 bölüme çıktı.

### Bombalar hücrenin tepesine taşındı

Mayın bölümü %7 isterken **%2.9** aldı ve sebebi aday havuzundaydı. Bombalar
"yalnızca tek parçalık hücreler"e konuyordu — iki bombanın aynı hücreye düşüp
üst üste binmesini ve bir kulenin altında görünmez kalmasını önlemek için. Ama
iri meyve payı %28'e çıkıp kuleler geldikten sonra tek parçalık hücre
neredeyse kalmadı.

Doğrusu hücreyi seçip **en üstteki** parçayı bombaya çevirmek: tepede olduğu
için görünüyor, hücre başına bir tane olduğu için üst üste binmiyor, ve
kulenin tepesindeki bir bomba gerçek bir karar — kuleyi almak onu da yutmak
demek.

### Ölçülemeyen şey: zorluğu

`holeorderplay` 35. bölümü bitiriyor (206/206, 174 saniyenin 98.5'i). Ama
**otomatik oyuncu bombaları hiç yemiyor** — `fruitHoleNearest` onları hedef
saymıyor, ki klipler ve öteki ölçümler için doğrusu o. Yani elimizdeki sayı
mükemmel kaçınan bir oyuncunun sayısı, yani **en iyi durum**.

Mayın bölümünün gerçekten ısırıp ısırmadığı ancak telefonda oynayan biriyle
belli olur. Payı (dört bomba) ya da oranı (%7) oradan gelecek bir cevaba göre
ayarlanacak.

### `holeorder` elmayla armudu karşılaştırıyordu

Yeni tip eklenirken görüldü: test görev saatini `sweepSeconds() * 2.6` ile
karşılaştırıyordu — o ham taban, oysa `levelTime()` onu tur baskısı,
kolaylaştırma ve süre yükseltmesiyle çarpıp topluyor. Mayın bölümünün 20
saniyelik payı o yüzden 7 saniye ölçülüyordu. Oyun artık aynı bölümün
**görevsiz** saatini de veriyor (`fruitHoleOrder().duzSaat`) ve karşılaştırma
onunla.

## Kuleler ve dev hayvanlar

Kaan üç ekran görüntüsü attı (tür liderlerinden) ve üç şey istedi: **top**,
**hayvan**, **kule**. Üçü de aynı şeyi söylüyordu — tahtada göze çarpan,
bakılacak bir kütle yok.

**Top** zaten yapılmıştı: iri meyve payı %10'dan %28'e çıkarken tahtanın
dörtte biri yuvarlak, bütün meyveye dönmüştü (bir üstteki bölüm).

### Kule: sınır kat sayısında değil, dünyada

Tahtadaki en yüksek şey beş katlıydı ve yukarıdan bakınca her yer aynı
yükseklikte bir doku gibi okunuyordu. Artık **blob**'la seçilen bitişik bir
hücre kümesinde 5-7 katlı sütunlar var: dağılım `rnd()` ile olsaydı tek tek
uzun sütunlar tarlada hata gibi dururdu, bitişik olunca duvar gibi duruyor.

İlk deneme 9-13 kat verdi ve **ekranda hiçbir şey değişmedi**. Sebebi ölçünce
çıktı: 19. bölümün en yüksek kulesi **y=18.4**'e ulaşıyordu, kamera ise
**y=13**'te. Kule kameranın üstünden geçiyordu.

Yükseklik artık dünya biriminde sınırlı (`TOWER_Y_MAX = 8.0`), kat sayısında
değil — parça yarıçapı 0.46 ile 0.72 arasında değişiyor, yani aynı kat sayısı
iki kat farklı yükseklik verebiliyor. Sınırın değeri de eskisinin **üstünde**
seçildi: ilk denemede 4.6 kondu ve yeni kuleyi eklerken eski tahtayı
düzleştirdi, her bölüm dört kata indi.

`window.fruitHoleTowers()` hücre başına kat sayısını ve en yüksek tepenin
dünyadaki y'sini veriyor — "kule ekledim ama görünmüyor" sorusu ancak buradan
cevaplanıyor.

### İri meyve yüksek kuleye girmiyor

33'ü hazırlarken `holepillar` düştü ve sebebi kuleler değil, **iri meyve
tabanıydı**. Pillars'ın tahtası zaten dört kuleden ibaret — sütunları bilerek
7, 18, 21 ve 12 katlı (`PILLAR_H`) — ve aralarına karışan her iri parça hatayı
katlıyor. Ölçüldü: sütunlar ekranda üst üste binip geçilmez bir şeride
dönüyordu (**en dar aralık -231 piksel**) ve tepesi HUD'un altına giriyordu
(**445px**, sınır 420).

İri taban artık yalnızca **dört kattan alçak** hücrelere uygulanıyor. İri meyve
alçak yığınlarda tahtayı iri gösteriyor; yüksek kulede ise kuleyi bozuyor.

İki yanlış deneme daha oldu ve ikisi de aynı dersi verdi — *bir sınır, ait
olduğu yerden geniş uygulanırsa başka bir şeyi bozar*:

* `TOWER_Y_MAX` önce **bütün** yüksekliklere uygulandı ve desenlerin kendi
  kulelerini kesti: 4. bölüm 129 meyveden 70'e düştü, `holerelease` "en seyrek
  bölüm 80'in altında" dedi. Sınır artık yalnızca blob'un eklediği kümeye.
* `holemix`'in "hiçbir desen halı olmasın" kuralı Pillars'ı halı saydı. Muafiyet
  isimle değil ölçüyle: hücre başına ortalama beş kattan yüksek desenler kule
  deseni sayılıyor (`fruitHoleMix().ortKat`).

### Hayvan: devler hep cansız şeylerdi

Traktör, buzdolabı, helikopter, sedan. Tahtanın uzak ucunda durup "oraya
gideceğim" dedirten şey hep bir makineydi. Üç dev hayvan eklendi: **inek**
(Harvest), **yengeç** (Beach), **kutup ayısı** (Snow Day).

Hepsi **yukarıdan** okunacak şekilde çizildi, ki hayvanda bu nesnelerden zor:
bir hayvanı tanıtan şey profilidir ve tepeden bakınca profil yok. Üçü de
plandan ayırt edilebilir bir şeye dayanıyor — ineğin lekeleri, yengecin
kıskaçları, ayının kulakları. Ayının gövdesi bembeyaz değil gri-mavi, çünkü
kar temasının zemini de beyaz.

### "Hepsini bul" hedefi artık elle yazılmıyor

Nesne sayısı iki yerde duruyordu: `ALL_PROPS` ve başarım tablosundaki
`goal: 80`. Market Day yedi nesne eklerken hatırlanıp güncellenmişti; üç
hayvan eklenirken hatırlanacağının garantisi yoktu, ve unutulursa hedef ya
ulaşılamaz oluyor ya da tahtada bulunacak şey bitmeden veriliyor. İkisi de
sessiz. Hedef artık `ALL_PROPS.length`'ten türetiliyor.

## Kaya: oyunun ilk çarpışması

Bomba bir **karar**dı — yutabilirsin, bedelini ödersin. Kaya bir **duvar**:
yutulamıyor ve deliğin içinden geçmesine izin vermiyor. O ana kadar oyunda
hiç çarpışma yoktu; delik tahtadaki her şeyin altından geçiyordu, yani
"geçilemeyen yer" diye bir kavram da yoktu.

Fizik basit ve doğru okunuyor: kaya toprağa çakılı, ağzın kenarı onun dibine
değince duruyor. Yani **büyük delik daha uzaktan durduruluyor** — ağız
genişledikçe kayanın etrafından dolaşmak zorlaşıyor. Oyunun geri kalanında
büyümek her şeyi kolaylaştırıyor; burada ilk kez bir bedeli var.

Durdurmuyor, **kaydırıyor**: geri itme yalnızca temas doğrultusunda, ona dik
bileşen olduğu gibi kalıyor. Sert durdurmak, dokunmatik kontrolde parmağın
hâlâ hareket ettiği hâlde ekranda hiçbir şeyin olmaması demekti.

Kaya `fruits` listesine **girmiyor**, ayrı bir listede. Girseydi yutma
kontrolü, hedef sayısı, görev sayaçları, mıknatıs ve otomatik oyuncu — hepsi
tek tek "kaya hariç" diye yazılmak zorunda kalırdı; bombada tam olarak bunu
yapmak gerekti ve dört yeri kaçırdım.

### Tahtayı kapatmamak

Bir engelin en kötü hâli bölümü bitirilemez yapması, ve oyun bunu hata olarak
göstermiyor: saat doluyor, oyuncu kaybediyor, sebep görünmüyor. Üç kural:

* İki kaya arası, **en geniş ağız** aradan geçecek kadar (`HOLE_MAX*2 + …`).
* Kenarla kaya arası da öyle. Bunun ölçülen sonucu kabul edildi: tahta 13.65
  birim geniş ve en geniş ağız 5.5, yani kayalar zorunlu olarak **orta
  koridorda** kalıyor (merkeze ±2.2 birim). Kenara yaklaştırmak, arkasında
  ağzın giremeyeceği bir şerit bırakır ve oradaki meyveye geç kalındığında
  hiç ulaşılamaz. Orta koridor zaten deliğin en çok geçtiği yer.
* Deliğin doğduğu yer ve kolosun yeri açık.

### Kaya önce, dev sonra

İlk hâlinde kayalar devlerden **sonra** konuyordu ve yer bulamıyordu: orta
koridor dar, bir dev o koridorun tamamını kapatıyor, ve patron bölümleri üç
denemeden ikisinde **hiç kaya almadı**. Bir engelin sessizce yok olması,
onu düzeltmekten daha kötü.

Sıra çevrildi. Kaya seçiyor, dev ona göre yerleşiyor — devin tahtada gidecek
çok daha fazla yeri var. Devin kayadan uzaklığı da `HOLE_MAX` ile değil, **o
devi yerken ağzın ne kadar geniş olacağıyla** ölçülüyor (`r / 0.92`): tavan
ağızla ölçmek üç kısıtı üst üste bindiriyordu.

### Çarpışma yarıçapı görünen taşa eşit olmalı

Kaya önce nesneler gibi değil, dar çizilmişti: geometri 0.86'ya kadar
gidiyordu, çarpışma 1.0'a. Aradaki fark tam olarak "buraya neden
giremiyorum" — görünmez duvar. Artık nesneler gibi **yarım genişliği 1**
olacak şekilde çiziliyor.

### `holeboss`'un saat eşitliği fazla katıydı

Kayalar gelince `holeboss` 20. ve 40. bölümde düştü: kolos varken ve yokken
saat bir saniye farklı çıkıyordu. Sebep kayalar değildi — kaya meyve alıyor,
devler başka yere düşüyor, kolosun oturduğu yerin yoğunluğu değişiyor, ve
kolosun altından aldığı parça sayısı 7 ile 35 arasında oynuyor. Saat de
tahtanın son hâlinde benzetilen bir süpürmeden geliyor.

Yani test, ölçtüğü şeyden bir tık daha katı bir şey istiyordu: sorulan soru
"kolos bölümü uzatıyor mu", cevabı da bir saniye değil. Sınır ±2 saniye oldu.

### `holeecon` tek tohuma bağlıydı

Kayalar rastgele akışa yeni bir şey eklediği için aynı tohum **başka bir
tahta** üretti ve karpuz kazancı %17 oynadı: test "mıknatıs güçlendiricisi
pahalı" dedi. Fiyat değişmemişti, örnek değişmişti.

Ölçüm bölüm başına tek tohum yerine **üç tohumun ortalaması** oldu. Ve o
zaman görüldü ki hata gerçekmiş, sadece sebebi başkaymış: süper mıknatıs bir
bölümün karpuz kazancının %52'siydi (kural yarısını geçmemesini istiyor), tek
tohumla %44 diyen ölçüm şanslı bir tahtaya bakıyormuş. Fiyat 135 → 120.

### Yol boyunca çıkan eski hata: patron bölümü bitmiyordu

`holebomb.mjs` "hedef = parça − bomba" eşitliğini kontrol edince patron
bölümünde tutmadı, ve sebebi bombalardan değildi.

`placeGiants` ezdiği parçaları listeden düşürüyor ve **sebebini de yazıyor**:
ezilen parçalar "yenmiş" işaretleniyor ki üstlerine başka bir şey konmasın,
ama listede kalırlarsa hedefe sayılıyorlar. `placeColossus` aynı şeyi yapıyor
ve bu temizliği yapmıyordu.

Yani her patron bölümünde hedef, ulaşılabilir olandan **9 parça fazlaydı**:
tahtanın tamamını süpürsen bile bölüm bitmiyor, yalnızca saat dolunca
kapanıyordu. Aylardır öyleydi ve hiçbir test bakmıyordu, çünkü hiçbir test
"hedef gerçekten yenebilecek parça sayısı mı" diye sormamıştı.

## Meyveler tahtada halı gibi duruyordu

Kaan'ın gözlemi: *"diğer oyunlarda yutulacak cisimler biraz daha büyük."*
Ölçüldü, doğru çıktı.

| | ölçülen |
|---|---|
| ekranda görünen genişlik | 10.8 birim |
| sıradan meyve çapı (0.46 yarıçap) | **ekranın %9'u** |
| deliğin açılış çapı | %11 |
| tahtadaki meyve sayısı (24. bölüm) | 478 |
| **tahtanın iri meyve payı** | **%10.4** |
| **1. bölümün iri payı** | **%2.3** |

Yani tahtanın %89.6'sı en küçük meyveydi, ve en kötüsü yeni oyuncunun gördüğü
ilk tahtaydı. Tür liderlerinde (Hole Stars, All in Hole) nesneler ekranın üçte
biri kadar yer kaplıyor.

Bu, TikTok panelindeki *"çoğu izleyici 0:01'de bıraktı"* ile aynı şeyi
söylüyor: ilk bakışta hangi şeyin önemli olduğu belli değil.

### Neden meyveyi doğrudan büyütmek çözüm değil

Hücre 1.05, sıradan meyve 0.46 — yani zaten hücreyi neredeyse kenardan kenara
dolduruyor. Meyveyi büyütmek hücreyi büyütmek demek, o da `COLS`'u ve yirmi
dört desenin hepsini yeniden yazmak demek (desenler 13 sütuna göre yazılmış
`(satır, sütun)` fonksiyonları). Ayrıca 0.46 bilerek seçilmişti: delik 0.55'te
açılabilsin ve boyut kapısı ısırsın diye.

Hücreyi büyütüp meyve sayısını sabit tutmak ise **kamerayı yaklaştırmakla aynı
resmi** veriyor — bir meyvenin ekrandaki boyu yarıçapı bölü kamera genişliği.
Gerçekten farklı olan tek şey meyve **sayısını** azaltmak, onun da bedeli
ekonomi (kazanç meyve sayısıyla orantılı) ve büyüme eğrisi.

### Yapılan: karışım

Desenin kendi `big` kuralına dokunulmadı — o şeklin parçası (ağacın gövdesi,
merdivenin basamağı). Üstüne **%18'lik serpiştirilmiş bir taban** kondu. İri
payı %10.4'ten **%27.9**'a çıktı, 1. bölüm %2.3'ten %19.9'a; hiçbir desen
artık halı değil. Meyve sayısı, hücre, desenler ve ödeme aynı kaldı — büyük
meyve sıradanla aynı parayı ödüyor (yalnızca devler 12×), yani **ekonomi hiç
etkilenmedi.**

Bedeli büyümedeydi: büyük meyve deliği 3× büyütüyor, yani aynı sayıda meyve
süpürmek %25 daha çok büyütür oldu. `GROW_SWEEP` 1.4 → 1.75 ile telafi edildi.
Telafi edilmeseydi kolos tahtanın %68'i yerine %54'ünde açılırdı — "son iş"
olması bozulurdu.

Devler de büyüdü, ve bu bir yan etki değil düzeltme: dev boyu "tahtanın üçte
biri süpürülünce ulaşılabilecek en geniş dev" diye tanımlı ama hesap yine her
meyveyi bir birim sayıyordu. Doğrusuyla gereken yarıçap 1.1'den 1.14-1.46'ya
çıktı.

`scratchpad/holemix.mjs` her desen için oranı sayıyor ve hiçbirinin halıya
dönmemesini bekliyor.

## Ekonomi: dükkân 3. bölümde bitiyordu

Oyunun hiç ölçülmemiş tek parçası buydu. Yükseltmeler 20-30 meyveden başlayıp
her adımda ikiye katlanıyordu, yani **bütün yükseltme ağacı 2620 meyve**;
kaplamalar 300-900. Bunların bir bölümün ne kadar ödediğine karşı hiç
bakılmamıştı.

### Ölçüm

`fruitHoleClear()` bütün tarlayı tek bir zaman damgasında yiyor, dolayısıyla
zincir çarpanı ×5'te takılı kalıyor ve verdiği rakam kimsenin ulaşamayacağı
bir tavan. Tabanı (meyve başına 1, dev başına 12) almak da gerçekçi değil,
çünkü zincir zaten süpürmenin doğal sonucu.

Bu yüzden süpürme **benzetiliyor** (`window.fruitHoleIncome()`): delik en
yakın meyveye kendi gerçek hızıyla gidiyor, vardığında ağzına girmiş olan her
şeyi aynı anda yutuyor, `eatFruit()`'in büyüme ve zincir kurallarıyla birebir
büyüyor. Çarpan tahmin edilmiyor — meyvelerin ne kadar sıkışık durduğundan ve
deliğin ne kadar hızlı gittiğinden çıkıyor.

Çıkan sonuç, kendi varsayımımı da düzeltti: ortalama çarpan **×4.0-4.7**.
Yani zincir gerçekten tavana yakın duruyor, "×5 abartı" uyarısı gereksizmiş.

| | eski | yeni |
|---|---|---|
| bölüm başına kazanç | ~1500 (her türden ~400) | değişmedi |
| yükseltme ağacı | 2620 | 26 420 |
| kaplamalar | 2100 | 30 500 |
| ağaç kaç bölümde biter | **3** | **24** |
| her şey kaç bölümde alınır | **5** | **37** |

Eskisi şu demekti: oyuncu daha üçüncü bölümdeyken üstünde çalışacağı her şeyi
bitiriyordu. HUD'daki dört sayaç geri kalan kırk küsur bölüm boyunca süstü,
dükkân ölüydü, ve mağazadaki iki meyve paketi **yapıları gereği satılamazdı** —
küçüğü, oyuncunun çoktan bitirdiği bir ağacın %61'ini, büyüğü %183'ünü
karşılıyordu.

### Ne değişti

Fiyatlar on kat arttı; **kazanç hiç elleşilmedi**. Yutulan meyveden fırlayan
sayı oyunun iyi hissettiren kısmı; oranı onu küçülterek düzeltmek, oyunu daha
kötü oynanır hale getirerek düzeltmek olurdu.

- Yükseltme tabanları: hız 250, boyut 320, süre 250, mıknatıs 280.
  Boyut üç adımda bitiyor (dalı ötekilerin üçte biri kadar), o yüzden tabanı
  yüksek — muz sayacı da öbürleri kadar uzun süre işe yarasın diye. Artan
  boşluk Gold kaplamanın fiyatlandığı yer.
- Kaplamalar 6000-11 000. Her biri, parasını paylaştığı dalın son adımından
  pahalı: ağaç 24. bölümde bittikten sonra hâlâ biriktirilecek bir şey olsun
  diye. Yükseltmelerin hepsi bitiyor, oyun bitmiyor.
- Boosterlar 120-150, yani o meyveden bir bölümlük kazancın ~%30-40'ı. Tek
  tekrar eden gider bunlar; 40-50'de adı vardı kendi yoktu.
- Sandık, görevler, başarımlar ve günlük ödül de aynı oranda büyüdü. Sandık
  artık bir bölümlük kazanç değerinde — onu ikiye katlayan ödüllü reklam
  ancak o zaman bir teklif.
- Meyve paketleri en pahalı dalın %21'i (küçük) ve %69'u (büyük): alınmaya
  değecek kadar çok, oyunu satın alıp bitirtmeyecek kadar az.

`scratchpad/holeecon.mjs` bunların hepsini ölçüyor ve eşiklerle bekliyor.
Tarla tohumlanıyor: tohumsuz bırakıldığında aynı bölüm her çalıştırmada farklı
bir dağılım veriyordu (20. bölüm bir seferde 240 çilek, bir seferde 58), yani
eşik koyan bir testin geçip geçmemesi zara bağlıydı.

Eşikler keyfî değil: tarla 34 satırda (13. bölüm) büyümeyi bırakıyor ve
desenler ondokuzda bir başa dönüyor, yani oyunun yeni bir şey gösterdiği kısım
25 civarında bitiyor; kapalı testte kimse 45'i geçmedi. Ağacın o ilk kısım
boyunca sürmesi, her şeyin ise ancak bilinen en uzak noktaya yaklaşırken
tamamlanması isteniyor.

**Kapalı testteki kayıtlara dokunulmadı.** Fiyatlar arttı ama kimsenin kesesi
küçülmedi; eski ekonomide zaten her şeyi almış olan oyuncu her şeye sahip
kalıyor, yarıda kalan da elindekiyle ilk birkaç adımı almaya devam ediyor.
Göç kodu yazmak, yalnızca yanlış gidebilecek yeni bir yol açardı.

## Menü, kaldığın yerin artığını miras alıyordu

Menünün arkasında canlı bir 3B diorama var — gerçek delik, gerçek meyveler,
yavaşça dönen bir tarla. Ama `buildMenuDiorama()` yalnızca meyveleri yeniden
diziyordu; **zemin, tema ve voksel bayrağı son oynanan bölümden kalıyordu.**

Sonuç şu: 9. bölümden sonra temalar koyulaşıyor (mağaza zemini, istasyon
güvertesi, uzay) ve menü de sessizce onlarla birlikte kararıyordu. Oyunun ilk
ekranı, her mağaza görselinde görünen ekran, oyuncunun oynamayı nerede
bıraktığına göre belirleniyordu. Kimse öyle olsun demedi. Kapkara bir zeminin
üstünde oyun ızgarası görünüyordu ve ekran yarım kalmış gibi duruyordu.

Aynı hatanın ikinci yüzü: **voksel bayrağı da miras kalıyordu.** 9. bölümde
(Blocks) durduysan menüdeki meyveler piksel oluyordu. On dokuz bölümden biri
voksel; menüde onları göstermek oyunun kendini büyük ölçüde olmadığı bir şey
olarak tanıtması demek. Mağaza karesi tam olarak böyle çekilmişti.

İkisi de artık menüde sabit:

```js
const MENU_THEME = 'beach';
function buildMenuDiorama() {
  applyTheme(THEMES[MENU_THEME]);
  setVoxelField(false);
  ...
```

Kum oyunun sahip olduğu en parlak şey ve herkesin başladığı bölüm, yani menü
artık son tarlaya değil oyunun kendisine benziyor.

**Logo da bu yüzden değişti.** Beyaz harf, camgöbeği kontur — koyu zemin
varsayımıyla seçilmişti. Denizin üstünde camgöbeği camgöbeğine biniyor ve
kontur kayboluyordu; başlık tam da en yüksek sesle konuşması gereken yerde
kısılıyordu. Şimdi krem dolgu, koyu turuncu kontur ve altında sert bir gölge
var, yani sahnenin üstüne boyanmış değil önünde duruyor.

### Booster rafı su hattını kesiyordu

Raf **ekran yüksekliğinin bir oranıyla** (%23.5) konuluyor, su hattı ise 3B
sahne tarafından — ve ikisi birlikte ölçeklenmiyor. Ölçüldü:

| Ekran | Kum nerede başlıyor | Raf nerede |
|---|---|---|
| 412×915 | 300 | 215–323 |
| 412×732 | 209 | 172–280 |
| 360×800 | 263 | 188–296 |

Her boyutta kesiyordu: kaideler denizde, etiketler kumda, düşmüş gibi.

**Rafı su hattına bağlamayı denedim, daha kötü.** Uzun telefonda meyve
halkasının ve bölüm rozetinin üstüne biniyor; kısa telefonda ise çizginin
üstünde koyacak yer yok — deniz bandı 63px, raf 108px. Yani "hangi tarafa
koyayım" sorusunun doğru cevabı yok.

**Kart çözdü, hem de hiçbir şeyi kıpırdatmadan.** Yarısı suda yarısı kumda
olmak sadece nesnenin kendi zemini olmadığı için yanlış görünüyordu. Zemin
verilince — yumuşak, yarı saydam, yuvarlak bir kart — çizginin nereye
düştüğünden bağımsız olarak açıkça sahnenin üstünde duran bir arayüz parçası
oluyor.

### Alt bardaki her sekmenin adı var

Beş sekmeden yalnızca ortadakinin yazısı vardı (`.lb { display: none }`,
`.mid .lb { display: block }`). Bu, diğer dördünü gidilebilecek dört yer
değil, ortadakinin yanındaki süs gibi gösteriyordu — ve bir kalkanın ya da
kupanın neyi açtığı simgeden anlaşılmıyor. Hepsi adlandırıldı; seçili
olmayanlar biraz daha sönük, böylece bulunduğun sekme yine öne çıkıyor.

Yazılar barı uzattığı için `--navPad` de değişti, ama onu zaten
`fitMenuNav()` ve `ResizeObserver` ölçüyor — Play düğmesinin barın arkasında
kalmasına yol açan hatadan sonra konmuştu. `scratchpad/holead.mjs` beş
düğmenin de reklamın ve barın üstünde durduğunu doğruluyor.

**Ölü dosya:** `fruithole/assets/menu-bg.png`. Boyanmış menü arka planıydı
(`a2741de`), `1052e99`'da yerini canlı dioramaya bıraktı ve o günden beri
hiçbir şey onu yüklemiyor — ama `build-www.mjs` kopyalamaya devam ediyordu,
yani her paket 96KB'ı boşuna taşıyordu. Artık kopyalanmıyor. Kaynak dosya
depoda duruyor, boyanmış görünüm bir gün istenirse diye.

## Uygulama içi satın alma (IAP)

Mağaza ekranı ve dört ürün hazır; ürün kimlikleri Play Console'da aynı
adlarla oluşturulmalı:

| Ürün kimliği | Tür | İçerik |
|---|---|---|
| `fruithole_remove_ads` | tek seferlik | banner + geçiş reklamları kalkar (ödüllü kalır) |
| `fruithole_starter` | tek seferlik | her meyveden 2500, her booster'dan 3, üstüne reklamsız |
| `fruithole_pack_small` | tüketilebilir | her meyveden 1800 |
| `fruithole_pack_large` | tüketilebilir | her meyveden 6000 |

Miktarlar ürünün `fruit` alanında duruyor; açıklama satırı ve `grant()` ikisi
de oradan okuyor, böylece üç yerde birden değiştirilmesi gereken bir sayı
kalmıyor. Neden bu büyüklükte olduğu aşağıdaki "Ekonomi" bölümünde.

### Eklenti

`@capgo/native-purchases`, doğrudan Google Play Billing ile konuşuyor.

Burada aylarca **yanlış bir yol yazılıydı**: `@revenuecat/purchases-capacitor`.
Kontrol edilince hâlâ `@capacitor/core: ^5.0.0` bildirdiği görüldü, bu proje
ise Capacitor 8 — liderlik tablosunu bekleten uyuşmazlığın tıpatıp aynısı.
Üstelik oyunun ihtiyaç duymadığı bir şey için ödemenin arasına üçüncü bir
taraf sokuyor. Seçilen eklenti `>=8.0.0` bildiriyor, baştan sona Capacitor 8
ile derleniyor ve Google'ın artık zorunlu tuttuğu Play Billing Library 8
üzerinde.

```bash
npm install            # package.json'da zaten yazılı
npm run sync:fruithole
```

### Bu katmanın neden tek çağrıdan ibaret olmadığı

Play'in, kaçırılırsa **gerçekten para kaybettiren** iki kuralı var:

- **Tek seferlik ürün üç gün içinde `acknowledge` edilmezse** Google parayı
  kendiliğinden iade ediyor. Oyuncu aldığını kullanmaya devam ediyor, para
  geri gidiyor, uygulamada bunu söyleyen hiçbir şey yok.
- **Tüketilebilir ürün `consume` edilmezse** Play onu hâlâ "sahip olunuyor"
  sayıyor ve oyuncu ikinci kez satın alamıyor. Meyve paketleri tekrar tekrar
  alınsın diye var.

İkisi de satın alma döner dönmez, oyuncuya bir şey verilmeden önce
hallediliyor. `syncPurchases()` ayrıca her açılışta çalışıyor: yarıda kalmış
bir satın alma, yeniden kurulum ya da ikinci bir cihaz kendiliğinden
düzeliyor.

### `entitle` ve `grant`

Ürünün kalıcı yarısı `entitle()`, tek seferlik içeriği `grant()`. Geri
yükleme yalnızca birincisini tekrar uyguluyor.

Bu ayrım bir hatadan çıktı: başlangıç paketi reklamları `grant()`'in içinden
kaldırıyordu, geri yükleme ise yalnızca `iap.starter`'ı yazıyordu. Yani
paketi alıp uygulamayı silip kuran oyuncu, reklamlardan kurtulmak için para
ödemiş olmasına rağmen **reklamları geri alıyordu**. Geri yüklemede
`grant()` çağırmak da tersi hata olurdu: her kurulumda her meyveden 2500,
sonsuza kadar.

### Fiyatlar

Cihazda fiyat Play'den geliyor (`priceString`), `PRODUCTS` içindeki dolar
değerleri yalnızca tarayıcı için yer tutucu. Mağaza dolar kullanmayan
ülkelerde de açılacak ve sabit fiyat göstermek inceleme reddi sebebi.

Tarayıcıda satın alma yapılmaz, ürünler akışı denemek için doğrudan verilir.

### Manifest

`patch-manifest.mjs` fruithole için `com.android.vending.BILLING` iznini de
yazıyor. Play Billing kitaplığının kendi manifest'i bunu bildiriyor olmalı ve
birleştirici eklemeli, ama eklentinin kendi `AndroidManifest.xml`'i bomboş ve
iznin gelip gelmediği ancak derlenmiş paketi açıp bakarak görülüyor. İki kez
bildirilmesi zararsız, hiç bildirilmemesi sessizce çalışmayan bir mağaza.

### Önce satıcı hesabı (13 Eylül 2026'da anlaşıldı)

Kod hazır, ürünler **yok** — ve olamaz da. Play Console → Para kazanın →
Tek seferlik ürünler sayfası şunu diyor:

> Bu sayfaya erişebilmek için Google Payments satıcı hesabı oluşturmanız
> gerekiyor

Yani dört ürün kimliği hiç oluşturulmadı, çünkü satıcı hesabı olmadan Play'de
uygulama içi ürün diye bir şey açılmıyor. Bu, IAP'nin telefonda
denenemeyeceği anlamına geliyor: mağaza açılır, dört ürün de fiyatsız görünür.

Sıra: **ödeme profili → satıcı hesabı → ürünleri oluştur → etkinleştir →
ancak o zaman test.** Google'ın doğrulaması birkaç gün sürebiliyor ve
bireysel hesapta ad/adresin kimlikle birebir uyuşması isteniyor.

**Reklamları etkilemiyor.** AdMob ayrı bir sistem ve kendi hesabıyla zaten
çalışıyor, yani oyun üretime bu olmadan da çıkabilir; yalnızca satın almalar
onay gelene kadar ölü kalır.

Bu, fiyat düzeltmesinin neden doğru iş olduğunu da gösteriyor: ürün yokken
eski kod dolar yer tutucularını gerçek fiyat gibi gösteriyordu ve ilk
telefon denemesinde bu bir kod hatası sanılacaktı.

### Test ve sınırı

`scratchpad/holeiap.mjs` eklentinin yerine çağrıları kaydeden bir sahtesini
koyuyor: tek seferlikte acknowledge var consume yok, tüketilebilirde tersi,
aynı paket ikinci kez alınabiliyor, yarıda kalmış satın alma açılışta
kurtarılıyor, geri yükleme kalıcı hakkı geri veriyor ama içeriği yeniden
vermiyor, iptal hiçbir şey vermiyor.

**Bu testin söylemediği şey:** native tarafın gerçekten derlendiği ve gerçek
para aldığı. Bu kutuda Android SDK yok. Onu telefonda görmek gerekiyor —
Play Console'da kapalı test kanalına yükleyip lisanslı test hesabıyla.

### Telefonda görülen (16 Eylül 2026, sürüm 21)

Mağaza ekranı gerçek bir cihazda açıldı ve dört ürünü Play'in verdiği
fiyatlarla gösterdi:

```
Remove ads     ₺114,99
Starter pack   ₺174,99
Fruit basket   ₺57,99
Fruit truck    ₺144,99
```

Bu üç şeyi birden doğruluyor ve üçü de buradan doğrulanamıyordu:

1. **Eklenti Capacitor 8'de gerçekten derleniyor.** Uyuşmazlık riski en
   büyük bilinmeyendi; RevenueCat ve liderlik eklentisi tam bu yüzden
   elendi.
2. **`getProducts` çalışıyor ve fiyatlar mağazadan geliyor** — ekranda dolar
   yer tutucuları değil, hesabın ülkesine göre biçimlenmiş ₺ değerleri var.
3. **Ürün miktarları doğru bağlanmış**: 2.500 / 1.800 / 6.000, yani
   `PRODUCTS` içindeki `fruit` alanı açıklama satırına doğru yansıyor.

**Hâlâ görülmeyen:** satın almanın kendisi. Play penceresi açılıyor ama
gerçek kartı gösteriyor, yani lisans testi o hesapta etkin değil — lisans
testi listesine eklenen adres ile telefondaki Play hesabının aynı olması ve
ayarın yayılması gerekiyor. Yani `purchaseProduct` → `consumePurchase`
zinciri ve bir paketin **ikinci kez** alınabilmesi hâlâ yalnızca sahte
eklentiyle doğrulanmış durumda.

Kapalı test kanalındaki gruba eklenmiş olmak bunu sağlamıyor: **kapalı test
kimin indirebileceğini, lisans testi kimin ödemeden satın alabileceğini
belirliyor** — ikisi Play Console'da ayrı ayarlar ve ikincisi bu sayfada
"E-posta listeleri" altındaki adreslere bakıyor, oraya yazılmış bir grup
adresini açmıyor.

Sahiplik `localStorage`'da (`fruithole_iap`) tutulur; kullanıcı uygulamayı
silip kurarsa "Satın alımları geri yükle" düğmesi gerekir, o da yalnızca
uygulamada çalışır. Açılıştaki `syncPurchases()` çoğu durumda o düğmeye
basılmadan da halletiyor.

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
| Sandık açıldıktan sonra, "📺 Double it" | rewarded | kalır |
| Günlük ödül ekranı, "📺 Claim double" | rewarded (günde 1) | kalır |
| Booster dükkanı, "📺 free" | rewarded (booster başına günde 1) | kalır |
| Her 3 bölümde bir, sonraki bölüme geçerken | interstitial | kalkar |
| Oyun sırasında altta | banner | kalkar |

### Ödüllü reklam yerleri

Uzun süre tek bir ödüllü yer vardı: kaybettin, "+15 saniye". Türün standardı
en az üç yer ve bunlar oyunun mekaniğine dokunmadığı için gelir tarafında en
ucuz kazanç.

**Hepsi `watchAdFor()` üzerinden geçiyor.** Üçünü ayrı ayrı yazmak aynı iki
hatayı üç kez yapmak demekti: düğmeye iki kez basılıp tek reklamla iki ödül
alınması, ve reklam gelmeyince düğmenin kapalı kalıp bir daha açılmaması.
Tek yol var, düğmeyi kapatıyor, beklerken `…` yazıyor, ödülü yalnızca reklam
gerçekten izlenince veriyor, izlenmezse düğmeyi geri açıyor.

**Sandık.** Katlama, ödül *verildikten sonra* çıkıyor, onun yerine değil.
Meyve zaten sayaca düştü; bu yalnızca üstüne ekliyor, dolayısıyla reddetmek
hiçbir şeye mal olmuyor ve teklif bir geçiş ücreti gibi okunmuyor. Yeni bir
kaplama açıldıysa yazı bir an ona geçiyor, katlama onun üstüne konuşmuyor.

**Booster dükkanı — günde bir, booster başına.** Sınırsız bir "reklam izle,
booster al" düğmesi teklif değil, bedava ikinci para birimi olurdu; hem meyve
ekonomisini hem de başlangıç paketini satın alma sebebini boşaltırdı. Günde
bir olunca yarın oyunu açmak için bir sebep oluyor. Sınır `daily.freeBoosters`
içinde duruyor, yani gün sınırını `ensureDaily()` görevlerle ve giriş ödülüyle
birlikte tek yerden siliyor.

**Renk.** Hepsi yeşil, amber değil. Amber ana eylemin rengi (Next, Buy,
Claim); ödüllü düğme amber olsaydı oyuncu Devam sanıp basardı, ya da tersi —
saklayabileceği meyveyi harcardı.

**"Reklamsız" satın alınsa bile duruyorlar.** Oyuncunun kendi isteğiyle
izlediği, karşılığında bir şey aldığı reklam, kaldırılmasını istediği reklam
değil.

Ölçen dosya `scratchpad/holerewarded.mjs` — 15 kontrol. Tarayıcıda
`showRewarded()` doğrudan `true` döndüğü için sınanan şey reklamın kendisi
değil: ödülün bir kez verilmesi, ikinci basışın engellenmesi ve günlük
sınırın yeniden açılışta da durması.

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

Ölçümler (`node build-www.mjs` sonrası, `scratchpad/hole*.mjs` — sayısı
burada yazmıyor, çünkü her yeni testte eskiyip yanlış oluyordu):

```bash
node scratchpad/holegrow.mjs     # delik ne kadar hızlı büyüyor
node scratchpad/holebalance.mjs  # süpürme süresi ve dev meyve eşiği
node scratchpad/holecircles.mjs  # Bubbles daireleri yuvarlak ve ayrık mı
node scratchpad/holeecon.mjs     # dükkân kaçıncı bölümde bitiyor
node scratchpad/holeiap.mjs      # satın alma acknowledge/consume ediliyor mu
node scratchpad/holecam.mjs      # kamerayı delikten başka bir şey oynatıyor mu
node scratchpad/holebomb.mjs     # bombalar bölümü bitirilemez yapıyor mu
node scratchpad/holerock.mjs     # kayalar tahtayı kapatıyor mu, durduruyorlar mı
```

Hepsi Playwright + başsız Chromium ile çalışıyor. `holecontext.mjs` ayrıca
**Pillow** istiyor (ekran görüntüsündeki renk sayısını sayıyor):

```bash
pip install pillow
```

Bu bir kez kafa karıştırdı: konteyner yeniden kurulunca Pillow kayboldu,
ölçüm sessizce 0 döndü ve test "tarla çizilmiyor" dedi — tarla gayet
çiziliyordu. Artık ölçüm aracı çalışmıyorsa test düşmüyor, durup sebebini
söylüyor. Bir testin verebileceği en pahalı cevap, olmayan bir hatayı varmış
gibi göstermesi.

`window.fruitHoleShake()` kameranın anlık konumunu veriyor. Ölçtüğü kombo
tekmesi kaldırıldı ama kendisi kaldı: artık baktığı şey, kamerayı delikten
başka **hiçbir şeyin** oynatmadığı.

O cümle bir kez yumuşatıldı. Tanıtım klibinin soğuk açılışı için
`fruitHoleCamLook(x, z)` eklendi: kamera bir süre deliği değil verilen
noktayı takip ediyor. Oynanışta hiç çağrılmıyor ve çağrılmadıkça takip hedefi
delik — ama artık çizim döngüsünün ortasında bir dal var, yani sınırının
ölçülmesi gerekiyor. `scratchpad/holecam.mjs` üçünü birden tutuyor:
dokunulmamış oyunda kamera delikte, baktırılınca hedefte kalıyor (delik
uzaklaşırken), bırakılınca deliğe dönüyor. Dördüncüsü `fruitHoleZoom(null)`
— klip yakın plandan normale açılırken "normal"i oyundan soruyor, iki yere
yazılsaydı ayrışırdı.

### Telefonda ileri bir bölümü açmak: `START_LEVEL`

"24. bölüm bu telefonda takılıyor mu" sorusunun cevabı yirmi üç bölüm
oynamaktan geçiyordu. Mağaza sürümünde kaydı elle kurcalamak da mümkün değil:
o derleme hata ayıklamaya kapalı, `chrome://inspect` onu görmüyor.

```
$env:START_LEVEL=24
npm run apk:fruithole
Remove-Item Env:\START_LEVEL
```

Çıkan APK istenen bölümden açılıyor ve haritada oraya kadar her şey açık.
Bayrak `ADS_TESTING` ile aynı yolu izliyor — kaynakta `const START_LEVEL = 0;`
hep kapalı duruyor, değeri `build-www.mjs` derleme sırasında koyuyor. Elle
çevrilen bir sabit olsaydı açık unutulduğunda herkesin oyunu 24. bölümden
başlardı; bunun eşi bir kez zaten yaşandı (aşağıda, "Test reklamı mı, gerçek
reklam mı").

İki koruma var, ikisi de bir hatayı sessiz olmaktan çıkarıyor:

* **İlerleme kaydedilmiyor.** Bölüm yalnızca o oturum için ileri alınıyor,
  `localStorage`'a yazılmıyor. Yoksa test için kurulan APK, üstüne sonradan
  mağaza sürümü gelince gerçek ilerlemeyi 24'e sıçratmış olurdu.
* **Sürüm yazısı değişiyor:** menünün köşesinde `1.11 (33)` yerine
  `1.11 — test L24`. Ekranda hangi derlemenin olduğu karışırsa ölçüm de
  karışır.

Kurarken: bu APK senin yükleme anahtarınla imzalı, mağazadaki ise Google'ın
imza anahtarıyla. İmzalar farklı olduğu için **önce mağaza sürümünü
kaldırman** gerekiyor, yoksa Android "Uygulama yüklenmedi" diyor.

`node scratchpad/holestart.mjs` ikisini birden ölçüyor: bayraklı derleme
istenen bölümden açılıyor mu, ve bayraksız derleme bundan etkilenmemiş mi.

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

## Bulmaca bölümleri 🧩

Fruit Hole bir arcade oyunu: kaybettiren şey parmağın. Yeterince hızlı
süremezsen saat bitiyor, ve **yanlış bir hareket yok** — hangi meyveyi önce
yediğin hiçbir şeyi değiştirmiyor, çünkü sonunda hepsini yiyorsun. Oyuncunun
verdiği tek karar rota, o da yalnızca hızı etkiliyor.

Bulmaca olabilmesi için geri alınamaz bir yanlış lazım. Oyunda tek yönlü olan
bir şey ilk günden beri var: **delik küçülmüyor.** Bugüne kadar bu hep bir
ödüldü. Bulmaca bölümü onu bir borca çeviriyor.

Tahta bir koridor ve odalardan ibaret. Odaların koridora bakan duvarında birer
kapı var ve kapılar farklı genişlikte. Delik yedikçe büyüyor:

* dar kapılı odaya **girmeden önce** şişersen, o oda bir daha açılmıyor;
* bir odayı yedikten sonra **çıkabilmen** de gerekiyor, yani kapının hem
  girişe hem çıkışa yetmesi lazım;
* son oda tek yönlü — sırası gelince girilebiliyor, yendikten sonra
  çıkılamıyor. Zaten yapacak iş kalmadığı için bu bir ceza değil, bir kural.

Saat yok. Üst satırda `∞` yazıyor ve ana döngü bulmacada saate hiç dokunmuyor.
Düşünecek adam acele ettirilmez. Yıldız da saatten okunamadığı için başka bir
şeyi ölçüyor: kaç denemede çıkardığın (ilkinde üç, ikincide iki, sonrası bir).

Bölümler: 18, 28, 38… Kaya 9. bölümde tanıtılıyor ve bulmacanın tamamı kayadan
duvarlar — 8'de olsaydı oyuncunun gördüğü ilk kaya aynı zamanda geçemediği ilk
kapı olurdu, yani kural tanıtılmadan sınav. 9-17 arası sıradan kayalarla "bu
şey deliği durduruyor" öğreniliyor. Üç oda, 28'den sonra dört (tahta orada 34
sıraya ulaşıyor ve dördüncü kapı ancak o derinliğe sığıyor).

### Geçiş kuralı yeni değil, ölçülen bir sonuç

`pushOutOfRocks` deliği her kayadan `holeRadius + kaya.r` uzakta tutuyor. İki
kaya merkez merkeze `D` uzaktaysa aradan geçebilen en büyük delik:

```
limit = D / 2 - ROCK_R
```

Yani kapı için yeni bir çarpışma kodu yazılmadı; var olanın sonucu hesaplandı.
`holepuzzle.mjs` bunu tasarlanan sayıdan değil **konan kayalardan** ölçüyor —
sınırın altındaki deliği kapının ortasına koyup itilmediğini, üstündekini
koyup itildiğini görüyor.

### Tahta önce kuruluyor, soru sonra soruluyor

Sıra önemli ve tersi çalışmıyor:

1. Duvar çizgilerine yakın meyveler ve koridordakiler alınıyor. Koridor
   bilerek boş: orası düşünme yeri. Orada meyve olsaydı oyuncu odalara
   girmeden de büyüyebilirdi.
2. Her odada **kalan** meyvenin büyütme değeri toplanıyor. Ölçülüyor,
   varsayılmıyor — düzen odalara eşit meyve dağıtmıyor.
3. Kapı genişlikleri o toplamlardan hesaplanıyor.
4. Kayalar konuyor.

Kapılar önce seçilseydi tahtaya uymazdı: `growthUnit()` canlı meyve sayısına
bakıyor, yani bir odanın ne kadar büyüteceği ancak ayıklama bittikten sonra
belli oluyor.

Boş kalan oda dolduruluyor (`PUZZLE_MIN_ROOM = 30`). Ölçüldü: bazı düzenler
kocaman boşluklar bırakıyor ve 38. bölümde bir oda **sıfır** meyveyle çıktı —
soru sormayan bir oda, yani kapısının genişliğinin anlamı olmayan bir oda.
18. bölüm de toplam 71 meyveyle çıkıyordu, bölüm olmaya yetmiyordu.

### "Sıkıştın" kararı tek yönlü olmak zorunda

Yanlışlıkla "sıkıştın" demek, hâlâ yolu olan bir oyuncunun bölümünü elinden
almak demek. O yüzden oyun içindeki karar arama yapmıyor, yalnızca
kanıtlanabilir iki hâle bakıyor — delik küçülmediği için ikisi de geri
dönüşsüz:

* içinde olduğun odanın kapısından artık çıkamıyorsun ve dışarıda meyve kalmış;
* koridordasın ve meyve kalan odaların hiçbirine sığmıyorsun.

Odayı yarım bırakıp dönmek gibi ince oyunlar bu kuralı yanıltmıyor: ikisi de
yalnızca yarıçapa bakıyor.

Tam arama (`puzzleFeasible`, alt küme üstünde) yalnızca **tahtayı kurarken** ve
testte kullanılıyor. O arama odaların tam yendiğini varsayıyor, yani ihtiyatlı:
"çözülebilir" dediğinde gerçekten çözülebilir, ama "çözülemez" demesi kesin
değil. Bu yüzden oyuncuya o karar hiç gösterilmiyor.

### Ölçüm

`scratchpad/holepuzzle.mjs` — sekiz bulmaca bölümü kuruyor ve her birinde:

```
oda sayısı · tahta çözülebilir (tam arama)
kapı genişliği kayalardan ölçüldü (tasarım ile aynı mı)
kapı odanın bandına sığıyor · her oda dolu
sınırın altındaki delik geçiyor, üstündeki geçmiyor (gerçek çarpışma)
ara duvarlar dolu, iki ucu da kapalı
koridorda meyve yok · her meyveye ulaşılabiliyor
```

Sonra iki koşu oynuyor: tahtanın kurduğu sıra baştan sona yürüyor ve tarla
bitiyor; tembel sıra (doğduğun uçtan başlayıp ilerlemek) ölüyor **ve** oyun
sıkışmayı aritmetiğin dediği adımda görüyor. Sekiz tahtanın sekizinde tembel
sıra düşüyor — yani tahta gerçekten bir soru soruyor.

İki ölçüm ilk yazıldığında yanlıştı, ikisi de sessizce:

* Ara duvarın dolu olduğu, deliği duvarın üstüne koyup itilmesine bakarak
  ölçülüyordu. Kaya deliği **duvar boyunca** itince `z` değişmiyor, yani her
  duvar "sızdırıyor" diye okunuyordu. Doğrusu kayalar arasındaki boşluğu
  ölçmek.
* "Kapan odayı **önce** ye, tahta ölsün" diye bir ölçüm vardı. O odaya önce
  girildiğinde delik küçük ve tek başına o odanın büyümesi kapıyı doldurmuyor,
  yani çıkabiliyor. Oda ancak **sırası gelince** kapan oluyor; ölçülecek
  eşitsizlik o.

## Tarla tek tek nesne değil, yığın

Her meyve kendi `THREE.Mesh`'iydi. Ölçüldü (`scratchpad/holeinstance.mjs`):

```
 blm | meyve | çizim | meyve başına çizim
   1 |   310 |   806 | 2.60
  24 |   537 |  1299 | 2.42
  53 |   451 |  1031 | 2.29
```

Kare hızı bu konteynerde ölçülemiyor — GPU yok, SwiftShader'la çiziliyor ve
zamanlama yük altında anlamsız. Ama çizim çağrısı belirlenimci ve o sayı iki
ayrı sorunun **aynı** sebebiydi:

* **Beyaz ekran.** Bağlam kaybı en ağır tahtalarda geliyordu. Geometri
  sızıntısı kapatıldığında da geçmemişti; kalan şey tahtanın kendi ağırlığı.
* **"Hep aynı tahta."** Rakiplerin tahtası tanınabilir bir şey — mısır
  koçanı, oyuncak ayı, Eyfel Kulesi — çünkü binlerce minik parçadan kurulu.
  Bizim ızgaramız on üç sütun, ve on üç sütunla resim çizilemez. Yoğunluğa
  çıkmanın önündeki duvar buydu.

Aynı geometri ve aynı malzemeden olan her şey artık tek bir `InstancedMesh`.
Meyvenin dört tipi, iri ve normal boyu, voxel tahtada başka geometrisi var —
yani bir tahta sekiz-on yığın, **meyve sayısı ne olursa olsun**.

```
 blm | meyve | çizim | önce
   1 |   292 |    65 |  806
  18 |   116 |   119 |  282     (bulmaca: yarısı kaya)
  24 |   579 |   130 | 1299
  53 |   520 |   103 | 1031
```

Geriye kalan elli kadar tekil nesne devler, kolos, bombalar ve tahtanın
kendisi (zemin, su, delik) — sayıları bölümden bağımsız.

### Çok parçalı olanlar da yığın

İlk geçişte yalnızca tek geometrili meyveler yığına girdi ve sayı 322'de
takıldı. Sebebi ölçüldü: 44. bölümde tahtada **356 tekil nesne** kalmıştı.
Üçü de `Group`:

* **Nesneler** (`propVisual`) — gövde, kol, tekerlek…
* **Saplı elma** — gövde, sap, yaprak. Ve iri meyve bütün çiziliyor, tahtanın
  %28'i iri, yani bu az bir şey değil.
* **Kayalar** — bir kaya üç taş. Elli yedi kayalık bir bulmaca duvarı 171
  nesne demekti; bulmaca tahtasının çizim çağrısının neredeyse tamamı buydu.

Şablonun her alt parçası kendi yığınını alıyor ve kopyanın matrisi parçanın
yerel matrisiyle çarpılıyor. Şablon bir kez kuruluyor, sahneye hiç konmuyor.

Kayaların tutamağı yok: hiç kıpırdamıyorlar, matris bir kez yazılıyor.

### Tarla önce veri, sonra nesne

Izgara döngüsü artık hiçbir şey çizmiyor; kayıt yazıyor. Nesneler en sonda,
`materialiseFruit` ile bir kez kuruluyor.

Erteleme yalnızca yığınlama için değil. Tahtadan parça alan üç yer var — kaya,
dev, kolos — ve üçü de kurulmuş nesneyi sahneden çıkarıp `visible = false`
yapıyordu. Artık kurulmamış olanı çıkarmak diye bir iş yok: `unbuildFruit` bir
bayrak çeviriyor, o kadar.

### Kırk yeri matrise çevirmemek

Dosyada `f.mesh.position.y`, `f.mesh.scale.x`, `f.mesh.rotation.y`,
`f.mesh.userData.ox` okuyan kırktan fazla yer var ve hepsi doğru şeyi okuyor.
Yığına geçerken o kırk yeri tek tek matris aritmetiğine çevirmek, kırk yeni
hata yeri açmak demekti.

Onun yerine yığındaki her parçaya `mesh` gibi davranan bir **tutamak**
veriliyor: konumu, ölçeği, dönüşü ve `userData`'sı olan sade bir nesne.
`fruitFlush(f)` o değerleri yığının matrisine yazıyor ve yalnızca hareket eden
üç yerde çağrılıyor — düşüş, sarsıntı, yutulma. Duran bir meyve için hiç
çalışmıyor.

`castShadow` istisna: gölge yığının tamamına ait, tek parçaya değil. Tutamakta
alıcı/atıcı olarak yığına bağlanmış durumda — tahtanın gölgesini kapatan iki
yardımcı (mağaza görseli ve tanıtım klibi) zaten hepsini birden kapatıyor,
yani istedikleri şey bu.

### Yığın da bırakılmak zorunda

`fieldGroup.clear()` yığını sahneden çıkarıyor ama GPU'daki matris tamponunu
bırakmıyor. Üç bin parçalık bir yığının matrisi 192 KB ve bölüm başına bir
tane — bırakılmasaydı bu tam olarak düzeltmeye çalıştığımız sızıntının aynısı
olurdu. `buildField` her kuruluşta öncekileri `dispose()` ediyor.

## Resim tahtaları

Play'de bu türün önde gidenlerinin tahtası **tanınabilir bir şey**: mısır
koçanı, oyuncak ayı, Eyfel Kulesi, su parkı, ananas. Bizimki yirmi dört
düzendi ve hepsi bir fonksiyon — `blob`, `sin`, kutupsal açı. Fonksiyon soyut
şekil veriyor, soyut şekiller de birbirine benziyor. Oyuncunun gördüğü şey
"hep aynı tahta, rengi değişmiş" ve bu doğru bir gözlem.

Eksik olan düzen sayısı değil, **çözünürlük**. Izgara on üç sütun; on üç
sütunla ayı çizilemez. Yoğunluğun önündeki duvar çizim çağrısıydı, ve o duvar
yığınlarla kalktı (yukarı bak). Şimdi çizilebilir.

Bir resim, kodda harf harf bir harita:

```
'......RRRRRRRRRR......',
'....RRRRRRRRRRRRRR....',
'..RRRRRAARRRRRRRRRRR..',
```

`R` çilek, `A` elma, `B` muz, `M` karpuz, `.` boş. Oyun haritayı
`PICTURE_SCALE` kadar büyütüyor: elle 22×30 çizmek yetiyor, tahtaya 44×60
olarak iniyor ve ekranda 1500-1850 parçalık bir şey oluyor. Elle 44×60 çizmek
de mümkündü ama üç resimde insanın sabrı bitiyor, ve büyütme görüntüyü
bozmuyor — rakiplerin tahtası da parçaları blok blok diziyor.

Bölümler: 3, 13, 23… Şu an sekiz resim var — Mushroom, Balloon, Ice Cream,
Strawberry, Watermelon, Pineapple, Cherries, Flower — yani 73. bölüme kadar
hiçbiri tekrar etmiyor. Liste büyüdükçe döngü uzuyor ve yeni bir resim eklemek
otuz satır metin.

Onda bir bölüm şimdilik bilerek: resim tahtası oynanış olarak süpürme, ve
arada ızgara düzenleri olmasa tahtanın "başka bir şey" olması sönerdi. Oranın
doğrusu telefonda oynanarak bulunur, burada değil.

### Palet dört renk

Oyunun dört meyvesi var: kırmızı, krem, sarı, karpuz. Siyah yok, yeşil yok.
Resimler buna göre seçiliyor ve bu bir kısıt değil bir eleme: ilk denemede bir
uğur böceği çizildi, siyahsız uğur böceği olmadığı için tahtada çiçek gibi
durdu. Yerine sıcak hava balonu geldi — kırmızı, beyaz ve sarı şeritli, yani
paletin tam da olduğu şey.

Haritalar elle sayılmıyor: dairenin ve elipsin denklemi bir betikte yazılıp
harfler oradan üretildi, sonra sonuç dosyaya **düz metin olarak** kondu. Böyle
hem satır uzunlukları tutuyor hem de resim kodda gözle görünüyor.

### Parça meyve değil, boncuk

İlk ölçüm: sıradan meyve geometrisiyle 1848 parçalık bir tahta **1.7 milyon
üçgen** çiziyordu — parça başına 920 üçgen, ekranda birkaç piksel kaplayan bir
şey için. Çizim çağrısı ona inmişti ama sorun yer değiştirmişti.

Bu boyutta parçanın dokusu zaten görünmüyor; görünen tek şey rengi. Sekiz
dilimli bir boncuk 84 üçgen:

```
1848 parça · 9 çizim çağrısı · 148.906 üçgen
```

### Resim ekrana sığmak zorunda

Kamera tahtanın tamamını değil, sabit bir genişliği gösteriyor (`VIEW_HALF_X`,
5.4 birim), oysa tahta 13.65 birim geniş. Resim tahtaya göre ölçeklenince
kenarları ekranın dışında kalıyordu — dondurmanın külahı ekranı taşıyordu ve
tahta resim olmaktan çıkıyordu.

Artık tersi: adım görünen genişlikten hesaplanıyor ve **tahta resme
uyduruluyor**. `fieldHalfX` ve `fieldHalfZ` resmin ölçüsünden çıkıyor, kenarda
yarım birimlik toprak kalıyor. `scratchpad/holepicture.mjs` bunu tahtaya inen
parçaların gerçek sınırlarından ölçüyor, tasarlanan sayıdan değil.

### Dördüncü kez: açılmayan oyun

Resim bloğu ilk yazıldığında kullanıldığı yerin yanında, dosyanın ortasında
duruyordu. Oyun **13. bölümde hiç açılmadı**:

```
ReferenceError: Cannot access 'PICTURES' before initialization
```

`refreshLevelTag` sayfa açılırken bir kez çalışıyor ve kayıtlı bölüm bir resim
bölümüyse `PICTURES`i okuyor — o satır henüz çalışmamış oluyor. Kaydı 3, 13
ya da 23'te olan her oyuncuda oyun beyaz ekranda kalırdı, ve bu kendi
makinemde hiç görünmezdi çünkü ben hep menüden başlıyorum.

Aynı tuzağa bu dosyada dördüncü kez düşüldü (öncekiler: tur etiketi, siparişin
durumu, deliğin hızı). Blok artık `TYPE_BY_ID`nin hemen altında.

`holeboot.mjs` bunu yakalayan test: kayıtlı bölümü elle kurup oyunu gerçek
saatle açıyor ve yalnızca menüye varılıyorsa geçiyor.

## Beyaz ekranın defteri

Beyaz ekran iki kez görüldü ve iki kez de elimizde hiçbir şey kalmadı. Sebebi
basit: sayaç hafızadaydı, beyaz ekran gören oyuncunun ilk yaptığı şey
uygulamayı kapatmak, ve kayıt tam da kanıta ihtiyacımız olan anda siliniyordu.
"Yine beyaz ekran verdi" cümlesiyle, bakılacak hiçbir sayı olmadan kalındı.

Artık `localStorage`'a yazılıyor (`fruithole_gllog`, son on kayıt) ve teşhis
ekranında duruyor — sürüm yazısına beş kez dokun.

Her kayıtta:

```
GL 09-25 16:47   bölüm 3 · 1848 parça · 13 geo · 11 doku · 43 çizim · GERİ GELMEDİ
```

* **bölüm ve parça sayısı** — yük tahtayla mı ilgili, oynanan süreyle mi
* **geo / doku** — sızıntı geri geldiyse burada tırmanır
* **çizim** — yığınlar gerçekten iş görüyor mu
* **geri geldi mi, kaçıncı denemede** — `forceContextRestore` işe yarıyor mu

Ve en önemlisi **tip**. Beyaz ekran iki ayrı şeyden geliyor olabilir ve ikisi
ekranda birebir aynı görünüyor:

* **GL** — WebGL bağlamı düştü.
* **HATA** — çizim döngüsünde bir istisna atıldı, `requestAnimationFrame`
  zinciri koptu, tahta donup kaldı.

Bugüne kadar hangisi olduğu bilinmeden bakıldı. Artık yakalanmayan her hata ve
her reddedilen söz de aynı deftere, mesajı ve satırıyla yazılıyor.

### Beyaz ekranın sebebi: arka plan, tahta değil

Defter ilk kaydını verdi ve iki teorimi birden çürüttü:

```
bölüm 5 · 0 parça · 31 geo · 15 doku · 24 çizim · GERİ GELMEDİ
```

* **"GERİ GELMEDİ"** yalnızca GL kaydı için yazılıyor, yani bu bir bağlam
  kaybı. "Belki koddaki bir hata" değil.
* **"0 parça"** — kayıp olduğunda tahtada hiç meyve yoktu, yani **menüdeydi**.
  Menüde otururken bağlamı düşüren şey tahtanın ağırlığı olamaz. Bellek
  teorisi de, "en ağır tahtalar" teorisi de burada bitiyor.
* **31 geometri, 15 doku** — tertemiz. Sızıntı geri gelmemiş.

Geriye tek açıklama kalıyor: uygulama arka plana düştü (ekran kilidi, başka
bir uygulama, bir reklam) ve Android WebView'in GPU yüzeyini geri aldı.

Ve neden hiç geri gelmediği de aynı yerden çıkıyor. Eski kod dört deneme
yapıyordu, 1.5 saniye arayla — yani **altı saniye içinde**, ve o altı saniyenin
tamamı uygulama arka plandayken geçiyordu. Yüzey yokken `forceContextRestore`
kesin başarısız. Oyuncu geri döndüğünde deneyecek kimse kalmamıştı.

Bu aynı zamanda kaybın neden 46-53. bölümlerde değil de 5'te görüldüğünü
açıklıyor: **bölümle hiç ilgisi yok.** Tarayıcıda hiç üretilememesinin sebebi
de bu — tarayıcı sekmesi arka plana atılınca bağlamı kaybetmiyor.

Şimdi:

* Arka plandayken **hiç denenmiyor**. Her deneme bir GPU ayırma girişimi ve
  yüzey yokken boşa gidiyor.
* Uygulama öne gelince (`visibilitychange`, `focus`, `pageshow`, Capacitor'ün
  `resume`'u) sayaç sıfırlanıp yeniden deneniyor.
* Uyarı artık her ekranda görünüyor. Eskiden tek kopyası duraklama panelinin
  içindeydi ve kayıp menüdeyken hiç görünmüyordu: oyuncu Play'e basıyor,
  bomboş bir tahta geliyor, ekranda bunu söyleyen hiçbir şey olmuyordu.
  Telefonda görülen ekran tam olarak buydu.
* Denemeler tükenirse sayfa **kendiliğinden** yenileniyor (bir buçuk saniye
  sonra; oyuncu ne olduğunu okuyacak kadar görsün diye). Düğme de duruyor. Ağır bir çare ama tek kesin olanı — yeniden yükleme
  bağlamı sıfırdan kuruyor. Kaybedilen tek şey o anki bölüm; ilerleme, para ve
  yıldızlar `localStorage`'da. Oyuncu zaten bomboş bir tahtaya bakıyor, yani
  kaybedecek bir şeyi yok; alternatif uygulamayı kendi eliyle kapatması.

`scratchpad/holeglback.mjs` bunu ölçüyor. Bağlamın gerçekten geri gelmesi
konteynerde ölçülemiyor — GPU yok ve SwiftShader `restoreContext()` çağrısına
`webglcontextrestored` ile cevap vermiyor (üç saniye beklendi, olay hiç
gelmedi). O yüzden test "geri geldi mi" demiyor, **"denenmesi gereken anda
denendi mi"** diyor. Hatanın olduğu yer zaten oydu.

### İkinci kayıt: cihaz bağlamı geri vermiyor

Düzeltmeden sonra ikinci bir kayıt geldi:

```
GL 09-25 17:43  bölüm 7 · 0 parça · 90 geo · 16 doku · 62 çizim · GERİ GELMEDİ
GL 09-25 14:03  bölüm 5 · 0 parça · 31 geo · 15 doku · 24 çizim · GERİ GELMEDİ
```

(Saatler UTC — telefonun saatiyle 17:03 ve 20:43.)

Bu sefer uyarı çubuğu ekranda çıktı ve denemeler uygulama öndeyken yapıldı,
yani bir önceki düzeltme işini gördü. Bağlam yine gelmedi. Sonuç net: **bu
cihazda `forceContextRestore()` çalışmıyor** ve ne kadar beklenirse beklensin
değişmeyecek.

Geriye kurtarmak değil yeniden kurmak kalıyor, ve sayfayı yenilemek bunu kesin
yapıyor. Kaybedilen tek şey o anki bölüm; ilerleme, para ve yıldızlar
`localStorage`'da. Karşılığı ise oyuncunun bomboş bir tahtaya bakıp uygulamayı
kendi eliyle kapatması — yani zaten aynı şeyin daha kötüsü.

İki kaydın ortak yanı hâlâ duruyor ve hâlâ açıklanmadı: **ikisinde de 0
parça**, yani ikisi de tahta kurulu değilken oldu. Geometri ve doku sayıları
(31/15 ve 90/16) hiçbir şeyin birikmediğini söylüyor. Yani kaybın sebebi
oyunun kendi yükü değil; dışarıdan geliyor.

### Bulmaca ekranda görünmüyordu

İlk telefon denemesinden önce iki şey daha düzeltildi. İkisi de "oyun doğru
çalışıyor ama oyuncu göremiyor" türünden, ve ikisi de yalnızca ekran görüntüsü
alınınca fark edildi.

**Kapının sığıp sığmadığı ekranda hiçbir yerde yazmıyordu.** Oyuncunun gördüğü
şey duvarlar ve farklı genişlikte açıklıklardı; "şu an buradan geçebiliyor
muyum" sorusunu ancak kapıya gidip deneyerek öğrenebiliyordu — ve burada
deneyerek öğrenmek bedava değil, çünkü öğrenmek için yenen her meyve deliği
biraz daha büyütüyor. Yani oyuncuyu cezalandıran bir öğrenme yolu.

Artık her kapının eşiğinde bir şerit var: yeşilse geçiyorsun, kırmızıysa o oda
kapandı. Renk her karede yeniden hesaplanıyor, çünkü cevap delik büyüdükçe
değişiyor — ve kapının kırmızıya döndüğü an, o odanın kaybedildiği an.

**Tahtanın kendisi ekrana sığmıyordu.** Delik koridorda doğuyor, koridor
tahtanın sağ ucunda, ve odalar ekranın solunda kalıyordu: ilk karede görünen
tek şey boş kum ve bir kaya duvarıydı. Yani oyuncudan, soruyu görmeden cevap
vermesi isteniyordu.

Bulmacada kamera geri çekiliyor (`fieldHalfX + 0.5`) ve yatayda tahtanın
ortasına kilitleniyor. Derinlikte takip sürüyor, çünkü odalar z ekseninde
dizili ve tahta ekrandan uzun. Sıradan bir bölümde kamera deliği takip etmeye
devam ediyor — orada bakılacak şey deliğin önü, burada tahtanın tamamı.

Koridor da 5.6'dan 4.6'ya indi: genişliği deliğin **tavandaki** hâline göre
ölçülmüştü, oysa delik o boyuta ancak her şeyi yedikten sonra, son odanın
içinde ulaşıyor. Ekranın üçte biri boş kuma gidiyordu. Oda başına en az meyve
de 30'dan 55'e çıktı — üç odalı bir tahta 111 meyveyle çıkıyordu ve odalar
odadan çok koridor gibi duruyordu.

### Bölüm geçişindeki GPU işi

Üç bağlam kaybının üçü de bölüm geçişinde geldi — 5, 7 ve 9. bölümler, üçü de
"Next"e basıldıktan hemen sonra. Reklamla ilgisi yok: reklam üç bölümde bir
çıkıyor ve yalnızca 7'de vardı.

O anda yapılan iki gereksiz iş bulundu ve kaldırıldı:

**Delik her bölümde yeniden kuruluyordu** ve dokuz geometri üretip eskisini
atıyordu. Bunun bir sebebi yoktu: hepsi `BASE_HOLE_R`'den üretiliyor, kaplama
yalnızca **malzemenin** rengini değiştiriyor, yani üretilen şey her bölümde
birebir aynıydı. Daha önce bu geometriler bırakılmadığı için sayı tırmanıyordu
(1. bölümde 13, 30'da 282, 60'ta 572) ve o sızıntı kapatılmıştı — ama doğru
çözüm bırakmak değil, hiç üretmemekmiş.

**Boyut yayı oynarken kırk kez geometri üretip atıyordu.** Yayın kırk bir hâli
artık bir kez kurulup saklanıyor; hepsi yedi bin köşe, yani bellekte durmaları
bedava.

### Sızıntı sanılan şey sızıntı değil

Ölçüm sırasında geometri sayısı 1. bölümde 41, 19'da 318 çıktı ve bu ilk
bakışta sızıntı gibi okundu. Değil: kaybolan geometriler silindir, koni ve
küreydi — yani **nesnelerin** parçaları. Nesneler şablondan klonlanıyor ve
klon geometriyi şablonla paylaşıyor, yani tahta değişince klon sahneden
çıkıyor ama geometri şablonda duruyor. Sahnede görünmemesi bırakılmış olduğu
anlamına gelmiyor.

Uzun ölçüm bunu doğruluyor — sayı bir yerde duruyor:

```
bölüm 20 · 178      bölüm 34 · 272      bölüm 64 · 323
bölüm 24 · 248      bölüm 40 · 272      bölüm 72 · 348
bölüm 28 · 272      bölüm 56 · 272      bölüm 80 · 348
```

Temalar ilerledikçe yeni nesneler tanıtılıyor, hepsi bir kez görülünce sayı
sabitleniyor. Yani bu bir önbellek, ve 348 küçük geometri hiçbir şeyi
zorlamıyor.

### Ayak izi: sebep bellek değil

Bağlam kaybının sebebi olarak bugüne kadar iki kez belleğe bakıldı — önce
geometri sızıntısına, sonra en ağır tahtaların yüküne. İkisi de yanlıştı.
Ölçüldü:

```
geometri   348 (80. bölümde sabitleniyor, hepsi küçük)
doku       sahnede 12 · GPU'da 23 · toplam 3.9 MB
           (7 × 256², 3 × 128², 1 × 64², 1 × 512²)
```

Dört megabayt doku ve üç yüz küçük geometri hiçbir cihazda bağlam düşürmez.
Yani kaybın kaynağı oyunun kendi ayak izi değil — dışarıdan geliyor: WebView'in
yüzeyinin geri alınması, uygulamanın arka plana düşmesi, ya da cihaza özgü bir
davranış.

Bu, o yöne bir daha bakılmaması için yazıldı. Bir sonraki adım tahmin değil,
defterin bir sonraki kaydı: artık kuruluştan kaç ms geçtiğini, oyunun hangi
hâlde olduğunu ve reklamın açık olup olmadığını da yazıyor.

### İlk bulmaca öğretiyor, sınamıyor

18. bölüm telefonda ilk kez oynandı ve oyuncu 161 meyvenin 102'sini yedikten
sonra sıkıştı. Sistem doğru çalıştı — tahta gerçekten bir soru sormuştu ve
cevap yanlıştı — ama kuralı ilk karşılaştığı tahtada, üç dakikasını
harcadıktan sonra öğrenmiş oldu.

Bir mekaniğin ilk örneği onu **göstermeli**. 18. bölümün kapıları artık bandın
izin verdiği kadar geniş: kapan yok, hangi sırayla gidilirse gidilsin bitiyor.
Oyuncu duvarları, kapıları, şeritleri ve deliğin büyüdüğünü görüyor ama bunun
bedelini ödemiyor. Sınav 28'den itibaren.

Önce paylı bir hesap denendi (`PUZZLE_MARGIN` 0.22 yerine 0.9) ve yetmedi:
altı sıradan beşi yürüyor, biri düşüyordu. "Her sıra yürüsün" demek "en geniş
delik her kapıdan geçsin" demek, o da kapının bandın tamamı olması demek —
arada bir pay yok.

`holepuzzle.mjs` ikisini ayrı ölçüyor: ilk bölümde **bütün** sıraların
yürüdüğünü, sonrakilerde tembel sıranın düştüğünü. Kapan ve sıkışma ölçümleri
de 18'den 28'e taşındı — olmaması gereken bir şeyi orada aramak yanlış olurdu.

## Şerit tahtaları

Kaan oynadıktan sonraki tek cümlesi: *"oyunu sıkıcı yapan şey çok fazla küçük
meyve olması ve her bölümde yan yana diziliyor olmaları."*

Doğru gözlem, ve rakiplerin ekran görüntülerinde tam tersi var. Orada parçalar
hücre hücre **doldurulmuyor**, çizgiler boyunca **diziliyor**: sarmal, iç içe
halkalar, yılan, zikzak, mandala. Aralarında boş toprak var ve her şerit **tek
renk** — okunmasını sağlayan şey bu. Üstüne bir de iri meyveler konuyor, yani
bakılacak bir yer oluyor.

Bizim ızgaramız her hücreyi dolduruyor ve renkleri karıştırıyordu: ortaya bir
şekil değil bir doku çıkıyor, ve doku her bölümde aynı dokuya benziyor. Düzen
değişiyor, **diziliş** değişmiyor. Yirmi dört düzen yazmak bunu çözmüyor.

Şerit tahtası bir eğri ailesi seçip boncukları eğrilerin üstüne diziyor:

```
spiral      doğuştan dışarı açılan tek sarmal, her tur başka renk
rings       iç içe halkalar
serpentine  uçlarda dönen yatay şerit
chevron     zikzak sıralar
loops       dağınık halkalar, her birinin ortasında iri meyve
web         merkezden ışınlar + üstlerinden geçen halkalar (mandala)
```

Bölümler: 6, 16, 26, 36, 46, 56… Parça sayısı ızgaradan az (266-386'ya karşı
300-550) ama ekranda daha çok şey var, çünkü **boşluk da bir şey**.

Ölçüler şunlar ve keyfî değil:

* **Boncuk yarıçapı 0.30.** Izgaranın en küçük meyvesi 0.46'ydı ve tahtayı
  halıya çeviren de oydu.
* **Boncuklar arası 0.68.** Bitişik olsalardı şerit düz bir çubuk olurdu;
  aradaki boşluk diziyi boncuk boncuk okutuyor.
* **Şeritler arası 1.9.** Deliğin açılış çapı 1.1, yani iki şeridin arasından
  geçiyor ama ikisini birden yutamıyor. Oyuncunun şeridi **takip etmesi**
  bundan çıkıyor.

Adım dünya biriminde sabit tutuluyor, eğri üstünde değil: eşit olmasaydı
sarmalın içi tıkanır dışı seyrelirdi.

Izgara için yazılmış üç kural buraya uygulanmıyor ve sebebi her testte yazılı —
şerit tahtasında kaya yok (şeridi keserdi), dev yok (aynı sebep), ve iri meyve
payı düşük olduğu için "halı" sayılmıyor (şeridi okutan şey boncukların
eşitliği).

## Izgara tahtası da düzene girdi

Şerit tahtaları onda bir bölümde; kalan dokuzu hâlâ ızgaraydı ve telefondan
gelen cümle onlar içindi: *"cisimler hâlâ düzensiz diziliyor."* 24. bölümün
ekran görüntüsünde karpuz, muz, elma ve çilek hücre hücre birbirine karışmış,
aralarına varil ve kasa serpilmiş, her yerde tek tük yüksek sütunlar duruyordu.

Dört sebep vardı ve dördü de mekânsal olmayan rastgelelikti.

**Renk bölgeleri çok küçüktü.** `blob`un ikinci oktavı (2.7 katı frekans)
bölgelerin kenarını didikliyor, ortaya üç-dört hücrelik benekler çıkıyordu —
uzaktan bakınca karışık renkli kum. Artık tek oktav ve yarı ölçek: bölgeler
iki kat büyük, kenarları hâlâ dalgalı. Rakiplerin tahtasında renk alan alan
duruyor ve göz o zaman bir şekil görüyor, doku değil.

**Rastgele kuleler.** Hücrelerin %7'si, hiçbir şekle bağlı olmadan, üç-altı
katlı bir sütuna dönüyordu: yukarıdan bakınca tahtanın her yerine serpilmiş
dikitler. Kaldırıldı. Desenin kendi kuleleri (`stack`) duruyor — onlar şeklin
parçası — ve blob kümesi de duruyor, çünkü o mekânsal: bir köşede duvar gibi
bir kütle oluşturuyor, serpinti değil.

**İri meyve serpiliyordu.** `scatter` saf rastgeleydi, yani boy farkı düzen
değil gürültü üretiyordu. Mekânsal bir eşik onları öbek öbek topluyor: bir
yerde iri meyve tarlası, başka yerde küçükler.

**Nesneler de serpiliyordu.** Altı hücreden biri, tahtanın her yerine eşit
dağılmış varil, kasa, dirgen. Ekranda bunun adı kalabalık. Aynı sayıda nesne,
birkaç noktada toplanınca "şurada bir şey var" oluyor.

Ortak ders: **rastgeleliğin mekânsal olması gerekiyor.** Hücre başına atılan
zar düzensizlik üretiyor; aynı zar bir gürültü alanından okunduğunda desen
üretiyor.

### Daire tam daire olmalı

Kaan bir rakip ekran görüntüsü attı ve tek cümlesi "bak aşağıdaki gibi circle
yapmıyor" oldu. Karede küçük meyvelerden kusursuz bir çember, içinde daha iri
armutlar, ortada elmalar vardı.

Üç fark bulundu:

**Dairelerimiz daire değildi.** Kamera eğik diye z ekseninde 0.92 ile
eziliyorlardı. Ekrandaki karşılığı elips, ve eğri boyunca eşit aralıklı dizilen
boncuklar elipste eşit aralıklı durmuyor — yanlarda sıkışıp uçlarda açılıyor.
Çarpan kaldırıldı.

**Her şey aynı boydaydı.** Rakipte dıştan içe parçalar büyüyor ve halkaları
birbirinden ayıran şey bu. Artık iç içe halkalarda boncuk 0.30'dan 0.46'ya
çıkıyor: boy farkı süs değil, hangi halkanın ne olduğunu söyleyen şey.

**Halkalarımız boştu.** Rakipte halkanın işi bir şeyi **çevrelemek**. Dağınık
halkaların ortasına artık üç iri meyve konuyor.

### Piramit

Bir rakip ekran görüntüsü daha geldi: tek bir meyveden (çilek), sıkı dizilmiş,
ortaya doğru katlanan basamaklı bir blok — ve etrafı bomboş.

Üç özelliği var ve üçü de kasıtlı:

* **Tek meyve.** Karışık renkli bir yığın piramit değil, yığın olur. Tek renk
  olunca göz katları görüyor.
* **Sıkı dizili.** Şerit tahtalarının aksine parçalar birbirine değiyor;
  aradaki boşluk burada şekli bozuyor.
* **Etrafı boş.** Piramit tahtanın ortasında tek başına duruyor. Tahtanın
  geri kalanını doldurmak, piramidi de doku yapardı.

Ölçüler ekrandan geliyor, tahtadan değil. İlk denemede piramit tahtanın enini
kaplıyordu (13×17 hücre) ve ekranda basamak değil düz bir halı olarak
okunuyordu: şekli görmek için onu bütün olarak görmek gerekiyor, ve kamera
10.8 birim gösteriyor. Şimdi 9×11.

Basamaklar da iki hücre eninde. Tek hücre olduğunda kat farkı bir sıra boncuk
kadar oluyor ve yukarıdan bakınca seçilmiyor — basamağın basamak olması için
üstünde durulabilecek kadar geniş olması lazım.

Doğuştan piramide giden tek sıra meyve var: nereye gideceğini söyleyen şey.
İki yanda da birer halka, tahtanın geri kalanı tamamen boş kalmasın diye.

### Halkanın ortasındaki şey

Bir rakip karesi daha: süt kutularından bir sarmal ve tam ortasında iri, dik
duran bir kahve makinesi. Halkanın işi bir şeyi çevrelemek ve **çevrelediği
şey görünür olmalı**.

Bizim halkalarımızın ortasına önce üç normal iri meyve konmuştu ve yetmedi:
orta dolu görünüyordu ama "bir şeyin etrafı" gibi durmuyordu. Ortadaki nesne,
çevresindekilerin dört-beş katı olmalı.

Sonra dev meyve kondu ve o da tam olmadı: dev meyve de iri ama yine meyve —
yirmi boncuğun ortasındaki yirmi birinci meyve, göz için aynı şeyin büyüğü.
Rakibin karesinde ortada duran şey bir kahve makinesiydi, yani **başka
türden** bir şey.

Artık temanın kendi eşyaları duruyor: kar tahtasında penguen, fincan, eldiven,
iglo; sahilde kova; uzayda roket. Boyut dev meyvenin boyutu (1.34, boncuğun
4.5 katı) ama cinsi başka, ve "burada bir şey var" diyen şey o fark.

İki yan kazanç:

* **Koleksiyon.** Nesneler zaten sayılıyordu ("41/63 buldun") ama tahtaya
  serpiştirilmiş küçük şeylerdi. Şimdi halkanın ortasında duran, gidip alınan
  şeyler.
* **Hedef.** Delik onları ancak tahtanın yarısını süpürdükten sonra yutabiliyor
  (`f.r <= holeRadius * 0.92`), yani halkanın ortasındaki şey hem bakılacak yer
  hem beklenecek şey.

#### "Görünüşleri bi tuhaf"

Nesne konduktan sonra tahta ilk bakışta doğru ama yakından yanlış duruyordu.
Üç ayrı sebep vardı ve üçü de ölçüden:

**Halka nesneden küçüktü.** Yarıçap 1.9 ile 3.1 arasında rastgele seçiliyordu,
dev nesnenin görsel yarıçapı ise 1.94. Dar halkalarda nesne boncukların
üstüne taşıyordu: ekranda çalı halkayı yutmuş, kutup ayısı komşu halkanın
içine girmiş görünüyordu. Yarıçap artık elle seçilmiyor, nesneden çıkıyor —
`GIANT_R * 1.45 + RIBBON_R + 0.3`. Aynı hesap ağ tahtasının ortası için de
geçerli: ışınlar merkezden 1.6'da başlıyordu, yani ilk boncukları ortadaki
nesnenin içinden çıkıyordu.

**Halkalar rastgele yerleşiyordu.** Merkez x rastgele olunca iki halkanın
çakışmaması için satır aralığı bir çapa eşit tutulmak zorundaydı, ve halkalar
büyüyünce tahta yarı yarıya boşaldı (56. bölümde 277 parçadan 146'ya). Artık
ızgara: enine kaç halka sığıyorsa o kadar sütun, boyuna o kadar satır, her
halka kendi hücresinde küçük bir sapmayla. Komşu satırlar yan yana kaydığı
için aralık çaptan küçük olabiliyor — 305 parça.

**Her halkaya ayrı nesne düşüyordu.** On halka, on ayrı nesne, ve nesneler çok
parçalı: her parça bir çizim çağrısı, tek kopyanın yığını da kimseyle
paylaşılmıyor. 56. bölüm 66 çizim çağrısına çıkmıştı. Havuzdan artık **en çok
üç** tane seçiliyor ve bütün tahta o üçünü paylaşıyor: 32 çağrı. Gözle ilgili
tarafı da var — on ayrı nesne tahtayı hurdalığa çeviriyor, üçü tekrar edince
düzen oluyor.

#### Boncuk sekizgen görünüyordu

Şerit tahtası resim tahtasının boncuğunu ödünç almıştı ve o boncuk sekiz
dilimli. Resimde doğruydu: 1848 parça, her biri ekranda birkaç piksel, dokusu
zaten görünmüyor. Şeritte 300 parça var ve her biri ekranda 20-25 piksel — o
boyutta sekiz dilim siluetten okunuyor, boncuklar top değil sekizgen
duruyordu. Kaan'ın sorusu "çözünürlükleri mi düştü bunların" idi ve düşen şey
çözünürlük değil dilim sayısıydı.

Şeridin boncuğu artık ayrı (`BEAD_GEO`), resmin boncuğu olduğu gibi kaldı.

Enine ve boyuna dilim ayrı seçildi, çünkü kamera tepeden bakıyor: siluet
ekvator, yani görünen köşeleri **enine** dilimler veriyor, boyuna dilimler
sadece gölgeyi yumuşatıyor. 18×12 ile 18×8 ekranda ayırt edilmiyor ama biri
396 diğeri 252 üçgen — tahta başına 136 bine karşı 89 bin. Eskisi 30 bindi;
yuvarlak boncuğun bedeli bu ve resim tahtasının zaten çizdiği 149 binin
altında.

Bir de iri meyveler şeritlerin **üstüne** biniyordu: halkanın yarıçapı neyse
iri meyve de oraya konuyordu, yani bir sıra boncuğu eziyordu. Hepsi şeritler
arasına alındı (`+ RIBBON_GAP * 0.5`); şeritler arası 1.9, iri meyve 1.44
eninde, tam ortaya sığıyor.
