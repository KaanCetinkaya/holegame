# Slice Rush

Bir bıçak koridorda kendi ilerliyor; parmak yalnızca **yüksekliğini**
ayarlıyor. Değdiği her şey gerçekten ikiye bölünüyor, kesik yüzü görünüyor,
parçalar savruluyor.

    slicer/index.html          oyunun tamamı
    slicer/make-assets.py      ikon ve açılış görselleri
    slicer/store/              mağaza görselleri ve metni

Tarayıcıda denemek için `slicer/index.html`'e çift tıkla. Paketlenmiş sürüm
için `node build-www.mjs` → `www-slicer/`.

## Kesme gerçek

Önceden kırılmış bir modelle değiştirmiyoruz. Nesne iki kez kopyalanıyor ve
her kopya bıçağın bulunduğu yükseklikteki bir **kırpma düzlemiyle** budanıyor:
tepesinden kesilen bir karpuz bir kapak ve bir kâse veriyor, her seferinde
aynı iki yarım değil.

Üç ayrıntı bunu ayakta tutuyor:

- **Kesik yüz kırpılmıyor.** Kabuğu budayan düzlemin tam üstünde duruyor ve
  "bu yüzey düzlemin hangi tarafında" sorusunun cevabı orada kayan noktaya
  kalıyor — ilk sürüm her karpuzu kesiyordu ama hiç kırmızı göstermiyordu.
- **Kesik yüzün yarıçapı kesme yüksekliğine göre hesaplanıyor.** Kutbuna
  yakın kesilen bir küre küçük bir disk bırakır; tam genişlikte bir disk
  koymak kesik değil, çıkartma gibi duruyor.
- **Kırpma düzlemi parçayla birlikte taşınıyor.** Kırpma düzlemleri dünya
  uzayında yaşıyor; kesildiği yerde bırakılan bir düzlem, parça savrulurken
  onu budamaya devam edip yiyor.

## Parkur ekranın içine doğru gidiyor

İlk deneme yandan görünümdü ve dikey telefonda yaşamadı: görüş alanı dikey
olduğu için 46 derece ve on bir birim mesafede ekran dünya uzayında yalnızca
iki birim genişliğinde kalıyor — bıçak sol kenarın dışında duruyordu ve
gelecek şeyi koyacak yer yoktu. Parkuru ekranın içine çevirmek uzun ekseni
**mesafeye** harcıyor, yani asıl ihtiyaç duyulan eksene: altı engel ileriyi
görebiliyorsun.

Bıçak +X'e bakacak şekilde kuruluyor ve bir sarmalayıcı Group ile -Z'ye
çevriliyor. Tek Euler'de hem çevirip hem eğemezsin: `'XYZ'` sırası nesneyi
eğmeden önce çeviriyor, dolayısıyla bıçağı parkura nişanlayan tek bir
dönüş onu artık burnundan aşağı yukarı oynatamıyor.

## Çarpışma

Bıçak bir nokta değil, bir **parça**. Saniyede on beş birimde bir kare yarım
hücre ediyor ve nokta testi nesnelerin içinden geçip gidiyor. Bu yüzden
bıçağın o karede hizasına geldiği her şey, geçtiği andaki yüksekliğiyle
kontrol ediliyor.

## Para ve bıçaklar

Kesilen her nesne para veriyor, kombo büyüdükçe fazlası: `1 + kombo/4`.
Kombo, oyunda güvenli sürmeyi değil **iyi sürmeyi** ödüllendiren tek şey.

Para altı bıçağa gidiyor. Tek özellik `reach` — bıçağın merkezinin ne kadar
önünde kestiği. Renkten ibaret bir dükkân için para biriktirilmez; iki
özellik olsaydı her bölümü her bıçak için ayrı dengelemek gerekirdi.

Para **tur sonunda** banka yazılıyor, kesildikçe değil: çarpınca turun
kazancı gidiyor, devam etmediğin sürece. Bitiş ekranından çıkan bütün yollar
(sonraki bölüm, tekrar, ana menü) önce parayı yatırıyor — bunu yalnızca
"×2 al" düğmesine bırakmak, menüye çıkanın kazancını sessizce çöpe atıyordu.
`paidOut` bayrağı ikinci ödemeyi engelliyor; onsuz hızlı iki dokunuş iki kez
ödüyordu.

## Reklamlar

Yalnızca **ödüllü video**, iki yerde, ikisi de oyuncunun istemesiyle:

- **Çarpınca devam et** — tur başına bir kez. Çarpılan demir parkurdan
  siliniyor ve bıçak durduğu yerin biraz ilerisine bırakılıyor: aynı engelin
  önüne aynı yükseklikte düşürmek devam etmek değil, aynı kazayı tekrar
  yaşamaktır. İki hak vermek de bölümü sürüş değil sabır meselesine
  çeviriyor.
- **Bölüm sonunda ×2 para.**

Bölüm arası geçiş reklamı **bilerek yok** — bu tür bir oyunda en bariz yer
orası, ve oyuncuların uygulamayı sildiği reklam tam olarak o.

Cihaz dışında `showRewarded()` `true` dönüyor, yani tarayıcıda akış
yürünebiliyor. Şu an Google'ın herkese açık test birimi kullanılıyor; yayından
önce `AD_UNITS` ve `ADS_TESTING` değişmeli.

## Bölümler ve set parçaları

Parkur her bölümde yeniden üretiliyor: 24 + 2×bölüm yuva, en fazla 48.

Yuva yuva rastgele yükseklik seçiliyordu ve bu her bölümü birbirinin aynısı
yapıyordu — hep aynı dağınık yığın, hatırlanacak hiçbir an yok. Artık parkur
**elle kurulmuş parçalardan** diziliyor:

| parça | ne yapıyor | açılış |
|---|---|---|
| **run** | 5-8 nesne aynı hizada — kombonun kurulduğu yer | 1 |
| **stair** | tek yönde düzenli tırmanış/iniş | 1 |
| **rest** | kısa boşluk; her yuvası dolu parkur okunmuyor | 1 |
| **gate** | bir demir, ardından boşluk hizasında meyveler | 2 |
| **zig** | yukarı-aşağı, her adım bıçağın yetişebileceği kadar | 3 |
| **tunnel** | iki demir aynı taraftan, arada uzun düz koşu | 5 |
| **mine** | hattın üstünde kesilmemesi gereken şey; hat bırakılıyor | 8 |
| **squeeze** | karşılıklı iki demir, aralarında dar pencere | 12 |
| **sweep** | sırayla tavandan ve yerden üç kapı | 18 |
| **weave** | arka arkaya iki pencere, farklı yüksekliklerde | 23 |
| **gauntlet** | dar pencere, hemen arkasında aynı hizada mayın | 28 |

Her parça nereden başladığını ve nerede bittiğini biliyor, bir sonraki
oradan devam ediyor. Yeni bir parça türünün açılması da bir ilerleme
biçimi: zikzak 3., tünel 5., kapan 28. bölümde giriyor.

Bu tablo elle yazılıyor ve iki kez bayatladı — mayın, mengene ve salınım
eklendiğinde kimse buraya dokunmadı. `scratchpad/slbelge.mjs` artık
kodda olup burada yazmayan bir parça kalırsa hata veriyor.

Parçalar `c` kalemiyle çiziyor — `fruit`, `bar`, `skip`, `clamp`, `reach`.
Yuva sayacı ve engel aralığı kuralı orada tutuluyor, yani bir parça
kurallara aykırı bir şey yazamıyor: `bar()` yerleştiremezse `false` dönüyor
ve parça meyveye düşüyor.

Açılış hep dört meyve: tur kesmekle başlamalı, yoksa oyunun öğrettiği ilk
şey kaybetmek oluyor.

**Engeller arası aralık zorunlu.** Yerleştirmede hiç aralık kuralı yoktu ve
iki zıt engel yan yana yuvalara düşebiliyordu. Bir yuva bölüm 1'de 0.42
saniye, bölüm 15'te 0.24 saniye; bıçağın şeridi bir uçtan diğerine geçmesi
ise yaklaşık 1 saniye sürüyor. Yani dizi zor değil, **geçilemezdi** — bölüm
1'in bile çarpma sebebi buydu.

Artık her engel, bir öncekinin bıraktığı boşluktan oraya varılacak parkur
var mı diye kontrol ediliyor; yoksa o yuvaya engel yerine meyve konuyor.
`scratchpad/slicegaps.mjs` her bölümü on iki kez üretip en dar geçişi
ölçüyor.

**Geçilen engel öldürmüyor.** Çarpışma, kareyi başlatan noktanın bir
birim gerisindeki her şeye de bakıyordu ve geride kalanı o karenin
başındaki yükseklikle yargılıyordu. Onbeş birim hızda bir birim altmış
yedi milisaniye: temiz geçtiğin demir, sen bir sonraki boşluğa inmeye
başlarken arkandan öldürüyordu — ve oyuncunun bundan öğreneceği hiçbir
şey yok, çünkü ekranda görünen şey engelin geçilmiş olması.

Geriye bakış meyvede kaldı (biraz geç kesilen meyve hediyedir), demirle
mayında kalktı. Ölçüldü (`scratchpad/slsurucu.mjs`): 234 turluk bir
taramada 85 tur geride kalmış bir engelle bitiyordu, yani her beş
ölümün dördü; aynı tarama eski kuralla turların %55'ini, yenisiyle
%92'sini bitiriyor.

O ölçüm aynı zamanda **bölümün bitirilebilirliğini** soruyor.
`slicegaps.mjs` parkurun geometrisine bakıyor — iki demir arası yetişilir
mi, pencere bıçağa yer bırakıyor mu — ama geometrinin tamamı doğruyken
bölüm yine de bitirilemeyebilir, çünkü engeller tek tek değil arka
arkaya çözülüyor.

## Uzun bıçak bölümü geçilemez yapıyor mu

Dükkân bıçağın **menzilini** satıyor, ve aynı menzil mayına da erken
değdiriyor: yükseltme saf kazanç değil, takas. Dükkân bunu artık
söylüyor da — eskiden yalnızca "daha erken ulaşır" yazıyordu, yani
oyuncuya satılan şeyin yarısı gizliydi. Takasın bilerek olması
bölümü geçilemez yapmadığı anlamına gelmiyor, ve bütün ölçümler yeni
bir tarayıcıda — yani en kısa bıçakla — koşuyordu.

Ölçüldü (`scratchpad/slsurucu.mjs`, 3. bölüm): mayınlı on bir bölümde
Steel 59/66, Obsidian 56/66. Fark üç koşuda +5, +3 ve **-3** puan, yani
gürültünün içinde. Menzil 0.9'a çıkarıldığında oran hâlâ %82 — bugünkü
0.22 sınırın çok altında. 2.0'da ölçüm düşüyor: 60. bölüm hiç bitmiyor.

## Dükkân kaç bölümde bitiyor

Altı bıçak satılıyor — 0, 300, 900, 2200, 5000, 11000 — ve bir turun kaç
para verdiği fiyatlarla hiç karşılaştırılmamıştı. Ölçüldü
(`scratchpad/slekonomi.mjs`): oyunun kendi sürücüsü her bölümü bir kez
oynuyor, hedef ödüllerini de alıyor.

| bıçak | fiyat | alınabildiği bölüm |
|---|---|---|
| Copper | 300 | 1 |
| Emerald | 900 | 2 |
| Sapphire | 2200 | 7 |
| Gold | 5000 | 19 |
| Obsidian | 11000 | 94 |

Kuyruğun uzunluğu kasadan okunuyor: 30. bölümde 7100, 60'ta 9495,
120'de 12592. Yani **hedefler bitince tur başına gelir ~50 paraya
düşüyor** ve en pahalı bıçak oradan sonra 180 tur uzakta. Üstelik bu
sayı iyimser — sürücü hiçbir şey satın almıyor, oysa gerçek oyuncu
ondan önce 8400 para harcamış oluyor.

Sürücü temkinli oynuyor: demirden kaçmayı meyve kesmeye tercih ediyor
ve tarlanın yaklaşık %60'ını kesiyor. İyi bir oyuncu tur başına iki-üç
kat kazanır, yani Obsidian onda 60 tur civarı. İki ucu da uzun.

Ölçüm bir fiyat önermiyor; ulaşılamaz bir şey kalmadığını ve dükkânın
ilk beş bölümde bitmediğini kontrol ediyor. Eğri burada yazılı olduğu
için fiyat değişince nereye oturduğu da görülüyor.

## İlk bölümler ne kadar bağışlayıcı — ve neden ölçüsü yok

Fruit Hole'da yeni oyuncunun ilk altmış saniyesi ölçülmüş ve orada
gerçek bir hata çıkmıştı: tasarlanan zorluk birinci bölüme uygulanınca
oyuncu parmağını nasıl süreceğini öğrenmeden kaybediyordu. Aynı soru
burada da soruldu, ve **sorulamadı**.

İki acemi modeli denendi, ikisi de hiçbir şey ölçmedi:

- **Tepki gecikmesi** (sürücü her karede değil, k karede bir karar
  versin). 300 ms gecikmeyle 1-5. bölümlerin hepsi 12/12 bitti, ve
  denetim olarak konan 30. bölümde fark 11'e karşı 10 — yani gürültü.
  Sebebi oyunun kendisi: parmağın yaptığı tek şey bir yükseklik
  seçmek, bıçak son verilen hedefe gitmeye devam ediyor ve hedef
  doğruysa seyrek karar vermek bir şey kaybettirmiyor.
- **Nişan hatası** (hedef ±0.5 birim kaydırılsın, altı karede bir
  yenilensin). 30. bölümde 12'ye karşı 11, ve 0.30 sapmada 10,
  0.50'de 11 — sıralama bile tutmuyor.

Yani ilk beş bölüm, kurulabilen her oynayış biçimine açık: kesilen
oran acemide de %90'ın üstünde. Bu iyi haber, ama **ölçü olarak
yazılamaz**: denetimi geçemeyen bir ölçüm, geçtiğinde de bir şey
söylemiyor. Deponun kuralı bunu zaten söylüyor — ölçümü hatayı geri
koyarak çalıştır, düşmesi gereken yerde düşsün. Düşmedi, ve dosya
silindi. Zorluk eğrisinin ölçüsü `slegri`de duruyor.

## Geri tuşu oyundan çıkarıyordu

Android'de geri tuşu, WebView'ın geçmişi boşsa uygulamayı kapatıyor.
Bu oyun tek sayfa ve hiç gezinmiyor, yani geçmiş hep boştu: dükkânı
kapatmak için geri basan oyuncu oyundan çıkıyordu, tur ortasındaysa
turu da gidiyordu.

Eklentisiz çözüm: menüden başka bir yerdeyken geçmişe bir girdi
konuyor. Geri tuşu önce onu açıyor (`popstate`) ve oyun o ekranı
kapatıyor; oynarken duraklatıyor. Menüdeyken girdi yok, yani oradaki
geri tuşu uygulamadan çıkıyor — Android'in beklediği davranış. Ekran
normal yoldan kapatıldığında girdi geri alınıyor, yoksa yığında bize
ait olmayan bir giriş kalıyor ve menüdeki ilk basış yutuluyor.

Geri tuşu `goBack()` çağırmayan bir yapıda hiçbir şey değişmiyor:
`pushState` zararsız, `popstate` hiç gelmiyor, uygulama eskisi gibi
kapanıyor.

Bir tuzak vardı ve ölçüm onu ilk koşuda yakaladı: **bu dosyada
`history` bıçağın iz dizisi**, tarayıcının geçmişi değil
(`const history = []`). `history.pushState` bir dizide tanımsız, çağrı
`TypeError` atıyor ve try/catch onu yutuyordu — yani özellik sessizce
hiç çalışmıyordu. Artık her çağrı `window.history` diyor.

## Telefonu kulağına götürüp geri gelmek

`requestAnimationFrame` arka planda çağrılmıyor, yani oyun orada devam
etmiyor. Sorun dönüşte: bıçak bırakıldığı yerde ve saniyede on beş
birimle **hareket hâlinde** buluyor oyuncuyu. Bir bildirim, bir arama,
bir kapı — hepsi kendi yapmadığın bir hamleyle ölmek demekti.

Artık gizlenince tur duruyor ve duraklat ekranı açılıyor; geri dönüş
kendiliğinden oynatmıyor, RESUME'a basılıyor. Fruit Hole aynı sebeple
duruyor.

`scratchpad/slgizle.mjs` gizlenmeyi taklit ediyor (`document.hidden`
geçersiz kılınıp olay elle gönderiliyor): başsız tarayıcıda sayfa
gerçekten gizlenmiyor ve o hâlde ölçüm hiçbir şey ölçmez. İlk
yazılışında dinleyici `window`daydı ve olay kabarmadığı için hiç
ulaşmıyordu — ölçüm bunu beş düşen kontrolle söyledi.

## Sesi kapatmanın yolu yoktu

`muted` değişkeni vardı, `tone()` ona bakıyordu, kayda yazılıyordu — ve
bütün dosyada başka hiçbir yerde geçmiyordu. Yani kapatma özelliği
yazılmış ve **ona dokunulacak hiçbir şey konmamıştı**. Bu depodaki
tanıdık sınıf: ekranda olmayan ama var sayılan şey.

Menünün sağ üstünde bir tuş, duraklat ekranında da ikizi — sesi
kapatmak isteyen çoğu zaman oynarken istiyor. İkisi aynı duruma
bakıyor, biri çevirince ötekinin yazısı da değişiyor.

Tuş titreşimi de kapatıyor. Kesimde kısa bir tık, çarpmada uzun bir
buzz var (`navigator.vibrate`, Fruit Hole'daki ile aynı biçim) ve
sesi kapatan kişi telefonun sessiz kalmasını istiyor — titremesini
değil.

`scratchpad/slses.mjs` yalnızca simgeye bakmıyor: `AudioContext`in
osilatör üretimini ve `navigator.vibrate` çağrılarını sayıyor. Simge
değişip sesin devam etmesi, düğmenin hiç olmamasından beter olurdu.

## Akşamlar

Koridor her bölümde aynı mordu. Karışım bölümle sertleştikten sonra 30.
bölüm 17'den farklı **oynuyor** ama aynı **görünüyordu**, ve oyuncunun
ilerlediğini ilk hisseden yer göz.

Altı tema, dört bölümde bir değişiyor: alacakaranlık (oyunun bilinen
yüzü, 1. bölüm değişmedi), çöl, buz, orman, volkan, gece. Her biri
gökyüzü gradyanını, tepeleri, diski, sisi, koridorun ötesindeki zemini,
ray rengini ve koridorun kendi tonunu değiştiriyor.

Zemin dokusu mor çizilmiş ve tema başına yeniden çizmek bölüm açılışına
ikinci bir tuval koyardı; malzemenin rengi dokuyla çarpılıyor, tek
satırla aynı iş. İlk denemede bu atlanmıştı ve buz temasında mavi gök
altında mor bir koridor duruyordu — tema oradan çöküyordu.

`scene.environment` yerinde bırakılıyor: her temada PMREM'i yeniden
çalıştırmak bölüm açılışında duraklama demek, yansımadaki ton farkı ise
bıçağın üstünde zar zor görülüyor. Pahalı olan görünmüyor, görünen ucuz.

Gökyüzü dokusu her tema değişiminde yeniden üretiliyor ve eskisi
atılıyor. `scratchpad/sltema.mjs` elli bölüm açılışı yapıp doku sayısının
sabit kaldığını doğruluyor — atılmasa bu tam da `sldon.mjs`'in aradığı
türden sessiz bir birikme olurdu.

## Zorluk eğrisi

`slicewall.mjs` geç bölümlerin erken bölümlerden farklı olduğunu,
`slicegaps.mjs` her engel dizisinin geçilebilir olduğunu söylüyor. İkisi
de "düzgün artıyor mu" sorusunu cevaplamıyor — bir bölüm ötekinin iki
katı zorlaşıyorsa oyuncu orada bırakır ve iki ölçüm de bunu görmez.

`slegri.mjs` her bölümde on altı tur oynatıp kesilen oranını çıkarıyor.

`slyildiz.mjs` aynı sürücüyle otuz bölüm oynayıp **yıldızı** ölçüyor, ve
eşikleri buraya kopyalamıyor: "Earn 30 stars" hedefi toplam yıldızı veriyor,
bölüm başına fark alınıyor. Ölçüldü (üç koşu — parkur `Math.random()` ile
kurulduğu için sayılar oynuyor): 27-30 bölüm bitiyor, kesim oranı %33-100,
üç kademenin üçü de çıkıyor, otuz bölümde ~54 yıldız — yani "Earn 30 stars"
hedefi 17. bölüm civarında doluyor.

Kapılar performans değil **ulaşılabilirlik** soruyor: üç yıldız alınabiliyor
mu, ve üç kademenin üçü de çıkıyor mu. Bir kapı yazılıp geri alındı
("bitirilen her bölüm en az bir yıldız verir") — oyunun iddiası değilmiş:
eşikler 0.9/0.7/0.4, yani meyvenin %40'ından azını keserek bitirmek bilerek
sıfır yıldız veriyor.
Ölçtüğü ilk şey oyunun gerçek duvarıydı ve kimsenin beklediği yerde
değildi: **12. bölüm**, mengenenin girdiği yer. 9-11'de %85, 12-14'te
%42. Oyunun başka hiçbir basamağı bu kadar sert değil.

İki ayar yumuşattı: açıklık 12'de 2.15 ve 22'de eski değeri olan 1.6
(geç bölümler aynı kaldı, yalnızca tanışma yumuşadı), ve ağırlık 12'de
0.6'dan 18'de 2'ye çıkıyor. Bir parkurda bir mengene bir şey öğretir,
üç mengene bir duvardır.

Ölçü **puan farkı**, oran değil. İlk hâli göreliydi ve kuyrukta çöktü:
oran zaten %20'ye inmişken %23'ten %11'e düşmek "−%53" yazıyor, ve üç
koşunun ikisi rastgele düşüyordu. Eşik de seçilerek değil ölçülerek
kondu — aynı yapım üç kez koşturulup gürültünün beş puan olduğu görüldü.

## Hızlı yürütme

`sliceStep(dt)` ve `sliceRun()` oyunu kare beklemeden ilerletiyor.
`tick` artık iki parça: `adim(dt)` benzetimin tamamı, `tick` onu çağırıp
çiziyor. Tek kopya olması şart — iki ayrı yürütme yolu olsaydı ölçüm
oyunun yapmadığı bir şeyi ölçerdi.

Sebep: konteynerde GPU yok ve bir kare 300-450 ms sürüyor, yani bir turu
gerçek karelerle oynatmak dakikalar alıyordu; otuz bölümlük bir ölçüm
yarım saati geçiyordu. Şimdi bir tur 200 ms. Üstelik **daha doğru**:
kare beklendiğinde dt 0.05'e dayanıyor (yirmi kare), oysa telefon altmış
kare çeviriyor ve bıçağın hedefi takip hızı dt'ye bağlı.

## Otomatik oyuncu

`sliceAutoPlay()` testlerin oyunu parmaksız oynamasını sağlıyor. İlk hali
sadece **en yakın** nesneye bakıyordu: önünde engelden daha yakın bir meyve
varsa ona yöneliyor, engeli de kaçacak yer kalmayınca fark ediyordu. Turlar
rastgele ölüyordu ve onunla alınan her ölçüm gürültüydü. Artık engellere
öncelik veriyor ve onları daha uzaktan (bıçağın şeridi geçme süresi kadar)
değerlendiriyor.

Yine de mükemmel değil — bir sonraki engele bakıyor, ondan sonrakine değil —
bu yüzden turların bir kısmında çarpıyor. Parkurun geçilebilir olup
olmadığının ölçüsü bu değil, `slicegaps.mjs`.

Yıldızlar kesilen orana göre: %90 / %70 / %40.

## Bölüm haritası

Önceden ileri gitmenin tek yolu "sonraki bölüm" düğmesiydi: yıldızlar
veriliyor ama bir daha görünmüyordu, dolayısıyla hiçbir şey oyuncuyu üçüncü
yıldız için geri çağırmıyordu. Harita ilerlemenin durduğu yer — geçilen her
bölüm ve ne verdiği, ardından **üç kilitli bölüm** daha, ki devamı olduğu
görünsün.

Bu, kayıtta duran sayının ikiye ayrılmasını gerektirdi:

- **`maxLevel`** — oyuncunun geldiği yer, `slicerush_level` olarak kaydediliyor
- **`level`** — şu an ekranda olan bölüm

Tek değişkenle 30. bölümdeki biri üçüncü yıldız için 3'ü tekrar oynadığında
kaydı 4'e geri sarıyordu. Bölüm bitince yalnızca `maxLevel` ilerliyor; `level`
oyuncu "sonraki" dediğinde artıyor.

Harita **gösterildikten sonra** dolduruluyor. Gizli bir eleman sıfır ölçer,
dolayısıyla `display:none` iken hesaplanan kaydırma herkesi 1. bölümde
bırakıyordu — 40. bölümdeki oyuncunun haritası da baştan açılıyordu.

## Günlük ödül

7 günlük seri: 30 / 45 / 65 / 95 / 140 / 200 / 300 para. Yedide tavan
yapıyor, bir gün atlanınca başa dönüyor. Bakır bıçak 300 para, yani seriyi
tamamlamak ilk bıçağın üçte ikisini veriyor — turlardan kazanılanın yerine
geçmeyecek, ama geri gelmeye değecek kadar.

Günler **oyuncunun kendi saat diliminde** sayılıyor; gece 3'te sıfırlanan bir
ödülü kimse planlayamaz.

Seri, para gerçekten **alındığında** yazılıyor. Ekranı açıp uygulamadan
çıkmak günü yakıp hiçbir şey ödememeliydi.

## Kayıt

`slicerush_level`, `slicerush_stars`, `slicerush_combo`, `slicerush_coins`,
`slicerush_blades`, `slicerush_blade`, `slicerush_dayLast`,
`slicerush_dayStreak`, `slicerush_stats`, `slicerush_goals`,
`slicerush_muted`.

Anahtarların ayrı olması bir şans: bozulan biri ötekileri götürmüyor.

### Tek bozuk anahtar oyunu öldürüyordu

Okuma tek satırdı: `JSON.parse` patlarsa varsayılan, patlamazsa **ne
gelirse**. Patlamamak yetmiyor — `JSON.parse('"muz"')` sorunsuz çalışıyor.
Ölçüldü (`scratchpad/slkayit.mjs`) ve üç şey çıktı:

- `slicerush_blade: 99` → `BLADES[99]` tanımsız, oyun **hiç açılmıyor**.
  Kayıt her açılışta okunduğu için kendiliğinden de düzelmiyor: siyah
  ekran kalıcı ve oyuncunun yapabileceği tek şey uygulamayı silmek
- `slicerush_level: -5` → hiçbir parça seçilemiyor, bölüm kurma patlıyor
- `slicerush_coins: "muz"` → menüde "🪙 muz", sonraki her hesap NaN

`store.sayi/dizi/nesne` okunan şeyin ne olduğuna da bakıyor ve
olmadığında varsayılana dönüyor: tek alan kayboluyor, ilerlemenin geri
kalanı duruyor. Bıçak kimlikleri `BLADES.length`'e göre kırpılıyor —
elle yazılmış bir "6" yedinci bıçak eklendiği gün yalan olurdu.

## Test

    npm run test:slicer

Bütün `sl*` ölçümlerini sırayla koşturup tek özet yazıyor (`npm test`
ikisini birden). Tek tek de koşturulabilir:

    node build-www.mjs
    node scratchpad/slice.mjs      # açılış + bir turda kesme
    node scratchpad/slicefull.mjs  # üç bölümü baştan sona bitir
    node scratchpad/slicemeta.mjs  # para, çift ödeme, devam etme, dükkân
    node scratchpad/slicegaps.mjs  # engel dizileri geçilebilir mi
    node scratchpad/slicemap.mjs   # harita, ilerleme, günlük ödül serisi
    node scratchpad/slicewall.mjs  # içerik kaçıncı bölümde tükeniyor
    node scratchpad/slicemine.mjs  # mayınlar geçilebilir mi
    node scratchpad/slblade.mjs    # bıçak nasıl görünüyor (kare çeker)
    node scratchpad/slicegoals.mjs # hedefler: sayma, ödeme, zincir, ekran
    node scratchpad/slicecut.mjs   # kesim sayısı: çıkıyor mu, birikiyor mu
    node scratchpad/sldon.mjs      # uzun oynandıkça sahne büyüyor mu
    node scratchpad/sltema.mjs     # bölümler birbirinden farklı görünüyor mu
    node scratchpad/slegri.mjs     # zorluk düzgün mü artıyor, uçurum var mı
    node scratchpad/slkayit.mjs    # bozuk kayıt anahtarı oyunu öldürüyor mu
    node scratchpad/slsurucu.mjs   # bölüm bitirilebiliyor mu, geçilen engel öldürüyor mu
    node scratchpad/slses.mjs      # ses kapatılabiliyor mu, kapanınca susuyor mu
    node scratchpad/slgizle.mjs    # ekran elden gidince tur duruyor mu
    node scratchpad/slekonomi.mjs  # bıçaklar ve hedefler kaç bölümde geliyor
    node scratchpad/slgeri.mjs     # donanım geri tuşu ekranı mı kapatıyor
    node scratchpad/slekran.mjs    # küçük telefonlarda ekranlar duruyor mu
    node scratchpad/slyildiz.mjs   # yıldız ekonomisi: üç yıldız alınabiliyor mu
    node scratchpad/slparca.mjs    # her parça tahtaya çıkıyor ve engelini koyuyor mu
    node scratchpad/slbelge.mjs    # bu dosya oyunla aynı şeyi mi anlatıyor

Sonuncusu belgenin bayatlayan kısımlarını ölçüyor: parça tablosu, betik
listesi, anılan kancalar, tavan ifadeleri, reklam anahtarı — ve iki tanesi
`store/release-notes.md` içinde: notun karakter sayısı (Play'in sınırı 500
ve uzun bir not kaydedilmiyor) ile notun sonundaki betik sayısı. İkincisi
ölçüldüğü gün yanlıştı: "on altı ölçüm betiği" yazıyordu, yirmi bir
tanesi vardı. Tarayıcı açmıyor, bir saniyenin altında bitiyor.

`window.sliceProbe()` durumu döndürür; `sliceMeta`, `sliceMap`, `sliceDaily`,
`sliceStart`, `sliceSetTarget`, `sliceAutoPlay`, `sliceGive`, `sliceRevive`,
`sliceDouble`, `sliceSetDay`, `sliceReset` testlerin oyunu parmaksız
oynamasını sağlar.

## İçerik 17. bölümde tükeniyordu

Bölüm üretimi sonsuz — `buildCourse(n)` her n için parkur kuruyor. Ama üç
ayarın üçü de sonlu ve `scratchpad/slicewall.mjs` nerede durduklarını ölçtü:

| ölçü | tavana çıktığı bölüm | tavan |
|---|---|---|
| parça havuzu (`PIECES`) | **28** | on bir parça, en yüksek `minLevel` 28 |
| parkur boyu | **12** | `Math.min(24 + n * 2, 48)` yuva → 165.8 |
| hız | **17** | `Math.min(8 + (n - 1) * 0.45, 15)` |

Boy ve hız tavanları yerinde: daha uzun bir tur yorucu, daha hızlı bir
bıçak okunmuyor. Yani duvarı iten şey o ikisi olamazdı.

**Havuz.** 5'te doluyordu; mayın (8), mengene (12), salınım (18), dokuma
(23) ve kapan (28) eklendi. Son ikisi bu türün sorduğu iki yeni soru:

- **dokuma** — arka arkaya iki pencere, farklı yüksekliklerde. Mengene tek
  pencere, yani "şu yüksekliğe git ve orada kal". Burada ikinci pencere
  başka bir yerde: cevap bir yükseklik değil, bir sıra.
- **kapan** — dar pencere, hemen arkasında aynı hizada mayın. Pencere "tam
  şurada ol", mayın "tam orada kalma" diyor. İkisi tek tek vardı.

**Karışım.** Havuz dolduktan sonra bile bölüm numarasının bir anlamı
olmalı. Ağırlıklar artık bölümle kayıyor: 17'de 0, 32'de 1 olan bir
sertlik katsayısı kolay dolgu parçalarını (`run`, `stair`, `rest`)
seyreltiyor, karar gerektirenleri (`mine`, `squeeze`, `sweep`, `weave`,
`gauntlet`) sıklaştırıyor. Hiçbiri sıfıra inmiyor — yalnızca zor
parçalardan kurulu bir parkur okunmuyor.

### Havuzda olmak tahtada olmak değil

Bu bölümün sayıları havuzun sayıları: "on bir parça, 28'de doluyor". Arada
iki şey var ve ikisi de ölçülmüyordu — **ağırlık** (seçim ağırlıklı kura ve
ağırlıklar bölümle kayıyor) ve **vazgeçme** (parça seçilip hiçbir şey
koymayabiliyor: `bar()` yer bulamazsa false dönüyor, `window()`
ulaşılamaz açıklıkta vazgeçiyor, `mine()` arkasından kaçış hattı
gelemeyecekse hiç konmuyor — üçü de doğru davranış, geçilemez bir tahta
zorluk değil hata).

`slparca` oyunun kendi dökümünü okuyor (`sliceParcalar`: hangi parça
seçildi, kaç meyve/demir/mayın koydu) ve kırk bölüm × otuz tahta kuruyor.
Ölçülen hâli:

| parça | açılış | seçildi | engelsiz geçti |
|---|---|---|---|
| `gate`, `tunnel`, `squeeze`, `sweep`, `weave` | 2-23 | 400-1000 | %0 |
| `mine` | 8 | ~1100 | %15-18 |
| `gauntlet` | 28 | ~280 | %15-23 |

Yani on bir parçanın on biri tahtaya çıkıyor, ve en çok vazgeçen parça
(`gauntlet`: dar pencere, hemen arkasında mayın — en çok yer isteyen dizi)
beşte birden az. Kapı %45'te: ölçülenin iki katına yakın, "parça artık
hiçbir şey koymuyor"u yakalayacak kadar dar.

Ölçümün kendisi bir kez yanlış kuruldu ve bunu **hatayı geri koyma**
denemesi gösterdi: engelli parçalar "hiç engel koymuş olanlar" diye
gözlemden ayrılıyordu, yani `gauntlet` bilerek bozulup hiç engel koymaz
hâle gelince sessizce meyve parçası sayıldı ve kapı geçti. Artık sınıf
oyundan okunuyor — parçanın kodu `c.bar`, `c.window` ya da `c.mine`
çağırıyorsa engel koymayı vaat ediyor demektir (`slicePieces().engel`).

Ölçülen sonuç: 15-18. bölümlerde tur başına ortalama **4.4** demir,
27-30. bölümlerde **9.2** — iki katından fazla. `slicewall.mjs` bunu artık
rapor etmekle kalmıyor, **kontrol ediyor**: fark 1.4 katının altına
düşerse hata veriyor, yani duvar geri gelirse sessiz kalmıyor.

Geçilebilirlik ayrı ölçülüyor ve bozulmadı: `slicegaps.mjs` 30. bölüme
kadar her engel dizisini geçilebilir buluyor, `slicemine.mjs` mayınlı
bölümlerin bitirilebildiğini gösteriyor. Otomatik sürücü o gün 26 ve 30'da
ölüyordu ama bu değişiklikten önce de ölüyordu — ölçüldü, iki sürüm yan yana
koşturuldu.

O satır artık geçerli değil ve sebebi karışım değil **arkadan ölüm**
hatasıydı (`slsurucu.mjs`'in başında yazılı: çarpışma, geçilmiş bir demiri
bıçağın arkasından öldürüyordu). Düzeltildikten sonra ölçüm: her bölüm en az
bir kez bitiyor, turların **%94'ü** bitiyor, 26. bölüm altı koşuda beş.
Bitirme oranı bölümle düşüyor — 40'ta 4/6, 55'te 3/6 — ve zorluk eğrisinin
istediği şey tam olarak bu; kapı "turların çoğu bitiyor" diyor, "hepsi"
demiyor.

## Kesimin geri bildirimi

Kesmek ekranda iz bırakmıyordu: nesne bölünüyor, bir avuç kıvılcım çıkıyor,
devam. Kombo sayacı vardı ama kesimin **kendisi** hiçbir şey söylemiyordu.

İki ekleme. Her kesimde kesim noktasında **+N** beliriyor (kazanılan para,
komboyla büyüyor) ve kamera küçük bir tepki alıyor — kombo büyüdükçe artan,
0.09'da duran bir sarsıntı. Tavanı var, çünkü oyuncunun yönettiği tek şey
yükseklik ve zıplayan bir kamera o okumayı bozar.

Rakiplerde ("Slice It All", "Slice Master") her kesimde bir sayı fırlıyor ve
tarif edilen "juicy" hissin yarısı bu. Bkz. `PAZAR.md`.

Etiketin iki bozulma yolu `slicecut.mjs` ile kapatıldı, ikisi de Fruit
Hole'da bir kez yaşanmıştı: kadraj dışındaki bir nokta kameranın arkasına
düşünce ekranın ortasına yansıyor, ve silinmeyen etiketler bir turda yüzlerce
birikiyor.

## Arayüz İngilizce

Oyunun yazıları Eylül 2026'da Türkçeden çevrildi. Sebebi mağaza metninde
duruyordu ve kimse yan yana koymamıştı: listeleme İngilizce yazılmıştı, hedef
ülke ABD ve Avrupa, ama oyun açılınca ekranda **BÖLÜM 1** yazıyordu. İndiren
kişi ilk saniyede anladığı şeyin yanlış dilde olduğunu görüyordu.

Değişen yalnızca oyuncunun okuduğu satırlar. Kod yorumları ve bu belgeler
Türkçe kalıyor.

## Mağazaya derleme

    npm run release:slicer

`aab:slicer` **değil**. Aradaki tek fark `ADS_TESTING`: `release:` olan onu
kapatıyor, öteki test reklamıyla derliyor. İkisi de "başarılı" diyor ve
üretilen `.aab` ikisinde de yükleniyor — fark ancak AdMob panelinde aylar
sonra sıfır görülerek anlaşılır. Bu anahtar eskiden yalnızca Fruit Hole için
çevriliyordu; Slice Rush'ın her derlemesi test reklamı taşıyordu.

Sürüm yazısı menünün sol alt köşesinde. Kaynakta `dev`, gerçek numarayı
`build-www.mjs` `app-version.json`'dan yazıyor — "güncelleme telefona indi
mi" sorusunun tek cevabı o.

## Klipler

    node build-www.mjs
    node slicer/make-clips.mjs                 # hepsi
    node slicer/make-clips.mjs --only=kesim    # tek klip

Dört klip, `store/clips/` altına 1080×1920 mp4: `kesim` (her şey gerçekten
ikiye bölünüyor), `demir` (demirin arasından), `mayin` (hattı bırakmak
zorundasın), `yer` (dört bölümde bir başka yer).

Üç oyunun ikisinin klip aracı vardı ve kapalı testteki bu oyunun yoktu.
Mağaza görselleri (`slshots`, `slframe`) duruyor ama onlar tek kare, ve bu
oyunun anlattığı şey — bıçağın meyveyi ikiye bölmesi, demirin arasından
geçmek — hareketsiz bir karede görünmüyor.

Araç Motor Works'ünkiyle aynı iki kurala dayanıyor, ikisi de Fruit Hole'da
ölçülerek öğrenildi: **sahte saat** (konteynerde GPU yok, gerçek saatle
çekilen klipte oyun kareler arasında sıçrıyor) ve **sert ret** — klip
anlatacağı şeyi anlatmadıysa dosya yazılmıyor.

Fark oyuncuda: Motor Works'te ekonomi ileri sarılıyor, burada **turun
kendisi oynanıyor**. Oyunun kendi otomatik sürücüsü kare kare sürüyor,
yani klipteki tur gerçek — kaçırdığı meyve de, son anda kaçışı da. Her
klibin kanıtı kendi iddiası: `kesim` için kesim sayısı, aynı anda havada
duran yarım sayısı ve kombo; `demir` için geçilen demir, bıçağın gezdiği
mesafe ve çarpmamış olması; `mayin` için geçilen ve **kesilmemiş** mayın;
`yer` için dört ayrı tema ve her birinin ekranda yirmi kareden uzun
durması.

Üç şey ölçülerek eklendi ve üçü de ilk çekimin hatasıydı:

- **Tur sürüyor mu.** Klip sekiz saniye, tur ondan kısa: bölüm bitince
  kamera duruyor ve bitiş ekranı kalan saniyeleri yiyor. İlk çekimde `yer`
  klibi beşinci saniyesini demire yapışmış hâlde geçirdi ve kanıtı bunu
  görmedi, çünkü yalnızca temaya bakıyordu. Artık her klip turun
  sürdüğünü de kanıtlıyor (240 karenin 240'ı, `yer` için 216) ve tur
  bitince bir sonraki başlıyor.
- **Sayaçlar tur başına.** Tur yenilenince parkur sıfırlanıyor, yani
  "kaç demir geçildi" de sıfırlanıyor; toplam artık turların en yüksek
  değerlerinin toplamı, son karenin değeri değil.
- **Mayınlı tahta aranıyor.** Sekiz saniyede bıçak parkurun ilk ~120
  biriminde kalıyor ve mayın orada olmayabiliyor — mayın parçası havuzda
  bir seçenek ve yer bulamazsa vazgeçiyor (`slparca`: altı turun birinde).
  İlk iki çekimde `mayin` klibi "0 mayın geçildi" deyip düştü. Araç artık
  mayını erken olan bir tahta bulana kadar tahtayı yeniden kuruyor, seksen
  denemede bulamazsa klibi çekmiyor.

Ölçülen son çekim: 36 kesim ve havada sekiz yarım, sekiz demir geçildi
çarpmadan, beş mayın geçildi hiçbiri kesilmeden, dört yer.

## Hedefler

Oyunun meta katmanı yoktu: bölüm geçiliyor, para birikiyor, bıçak alınıyor ve
orada bitiyordu. Sayılar zaten tutuluyordu ama hiçbir yerde toplanmıyordu.

Dokuz hedef, her biri bir sayıyı okuyor ve para ödüyor. Ödüller bıçak
fiyatlarına göre ayarlandı (300 / 900 / 2200 / 5000 / 11000): hepsi toplanınca
bir bıçak ediyor — yani hedefler dükkânın yerini almıyor, ona başlangıç
veriyor.

**Zincirin ikinci halkası birincisi alınmadan görünmüyor.** Dokuz satırı
birden göstermek listeyi yapılacaklar listesine çeviriyor; altısı görünüyor,
üçü sırasını bekliyor.

Ömür boyu sayaçlar (`slicerush_stats`) tur içi sayaçlardan ayrı: `cutCount`
bir turun, `stats.cuts` hepsinin.

### Dokuzunun dokuzu da gerçekten alınıyor mu

`slicegoals.mjs` hedeflerin **mekanizmasını** ölçüyor: sayaç artıyor mu, ödül
iki kez ödeniyor mu, zincirin ikinci halkası gizli mi. Bunu değerleri elle
vererek yapıyor — "x12 kombo" yazıp hedefin açıldığını görüyor. Yani bir
oyuncunun x25 komboyu gerçekten yapıp yapmadığı ölçülmüyordu.

Bu depoda iki kez ölü içerik çıkmış bir soru (Motor Works'te beş araç
modelinin ikisi, beş kaplamanın ikisi), ve hedeflerde daha sessiz olurdu:
ulaşılamayan bir hedef ekranda durur ve oyuncuya "yapılabilir" der.
`slekonomi.mjs` artık 120 bölümlük taramasında hangi hedefin **kaçıncı
bölümde** düştüğünü yazıyor:

| hedef | ölçülen bölüm |
|---|---|
| `combo10`, `combo25`, `blades3`, `cut100` | ilk beş |
| `lvl10` | 9 |
| `stars30` | 12-13 |
| `lvl25` | 24-25 |
| `cut1000` | 44-48 |
| `day7` | oynayarak değil: yedi günlük zincirle |

Dokuzu da alınıyor ve kapı bunu koruyor. İki ayrıntı ölçümün kendisinden:
`day7` takvimle geliyor, o yüzden tarama `sliceSetDay` ile yedi günü
kuruyor ve zincirin 1→7 yürüdüğünü görüyor; `blades3` ise sahiplik
istiyor, yani tarama **sonunda** dükkândan bıçak satın alıyor —
`sliceBlade` bir ölçüm kancası ve para almıyor, oyuncunun yaptığı şey
dükkân satırına dokunmak. Satın alma taramanın ortasında yapılsa
"bıçak kaçıncı bölümde alınabilir" ölçüsü bozulurdu; o ölçü harcanmamış
kasayı soruyor.

### Ekranı haritaya eklemeyi unutma

`showScreen` yalnızca `screens` haritasındaki ekranları tanıyor. Haritada
olmayan bir ad verilince **hepsini gizliyor ve hiçbirini göstermiyor** —
düğme çalışıyor gibi görünüp boş bir sahne bırakıyor. Hedef ekranı bir tur
böyle unutuldu ve testler bunu görmedi, çünkü hepsi probe okuyordu.
`slicegoals.mjs` artık DOM'a da bakıyor.

## Eksikler

Oyunun kendisinde değil, Play tarafında duranlar:

- **Kapalı test**: 12 test kullanıcısı, 14 gün. Üretime başvurmanın şartı
  bu ve şu an kayıtlı testçi sayısı sıfır
- Gizlilik politikası sayfasının yayında olduğu **doğrulanmadı**
  (`docs/privacy-slicerush.html`); konteynerden GitHub Pages'e çıkış kapalı
- "Slice Rush" adı Play'de aratılmadı

AdMob tarafı tamam: kendi ödüllü birimi ve uygulama kimliği 7 Ekim 2026'da
girildi, sürüm 1 ve 2 `release:slicer` ile derlenip yüklendi.
