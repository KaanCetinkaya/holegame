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
| **zig** | yukarı-aşağı, her adım bıçağın yetişebileceği kadar | 3 |
| **gate** | bir demir, ardından boşluk hizasında meyveler | 2 |
| **tunnel** | iki demir aynı taraftan, arada uzun düz koşu | 5 |
| **rest** | kısa boşluk; her yuvası dolu parkur okunmuyor | 1 |

Her parça nereden başladığını ve nerede bittiğini biliyor, bir sonraki
oradan devam ediyor. Yeni bir parça türünün açılması da bir ilerleme
biçimi: zikzak 3., tünel 5. bölümde giriyor.

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

## Kayıt

`slicerush_level`, `slicerush_stars`, `slicerush_combo`, `slicerush_coins`,
`slicerush_blades`, `slicerush_blade`.

## Test

    node build-www.mjs
    node scratchpad/slice.mjs      # açılış + bir turda kesme
    node scratchpad/slicefull.mjs  # üç bölümü baştan sona bitir
    node scratchpad/slicemeta.mjs  # para, çift ödeme, devam etme, dükkân
    node scratchpad/slicegaps.mjs  # engel dizileri geçilebilir mi

`window.sliceProbe()` durumu döndürür; `sliceMeta`, `sliceStart`, `sliceSetTarget`,
`sliceAutoPlay`, `sliceGive`, `sliceRevive`, `sliceDouble`, `sliceReset` testlerin
oyunu parmaksız oynamasını sağlar.

## Eksikler

- AdMob uygulaması açılmadı; test reklam kimlikleri kullanılıyor
- Bölüm haritası yok (sadece "sonraki bölüm")
- Günlük ödül / başarım yok
- Parkurlar tamamen üretilmiş; elle kurulmuş birkaç "set parça" çeşitliliği artırırdı
