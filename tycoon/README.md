# Motor Works

Boş zamanda kendi kendine çalışan bir oto fabrikası (idle/tycoon). Tek dosya,
Three.js, dışarıdan hiçbir görsel dosyası kullanmıyor — bütün modeller ve
dokular oyun açılırken kodla üretiliyor.

    tycoon/index.html          oyunun tamamı
    tycoon/make-assets.py      ikon ve açılış görselleri
    tycoon/assets/             üretilen görseller (build'e girer)

Tarayıcıda denemek için `tycoon/index.html`'e çift tıkla. Paketlenmiş sürüm
için `node build-www.mjs` → `www-tycoon/`.

## İşçi

Fabrikanın eksiği elde yapılacak bir şey yoktu: oyuncu darboğazı buluyor, bir
düğmeye basıyor ve izlemeye dönüyordu. `PAZAR.md`'de ölçülen **arcade idle**
hattı (My Little Universe, Homa) bu türde en iyi elde tutmayı veriyor — D1
~%50, ilk gün 25 dakika — ve aradaki tek yapısal fark malı taşıyan bir figür.

Zincirin ortası ikiye bölündü. İstasyon malını artık doğrudan bir sonrakinin
tamponuna basmıyor, **yere** basıyor (`G.pile`). Oradan banda ya işçi taşıyor
ya da o istasyonun müdürü.

Bu, müdürün zaten söylediği şeyi sahneye taşıyor: "bu istasyon artık kendi
kendine dönüyor". Oyun elle başlıyor, para biriktikçe kendiliğinden dönen bir
fabrikaya dönüşüyor — idle oyunun yayı bu.

Ekranın herhangi bir yerinden sürükleyerek yürütülüyor; fabrikada başka
dokunmatik girdi yok. Yön ekran eksenlerinden dünyaya çevriliyor, çünkü
kamera köşeden bakıyor.

### Çevrimdışı da elle çalışan bağda kopuyor

Yokken yalnızca **otomatik** zincir dönüyor (`autoChain`). Bu satır olmadan
oyun kendi kendini deliyordu: açıkken taşımak gerekiyor, kapalıyken
gerekmiyor — yani en verimli oynama biçimi uygulamayı kapatmak oluyordu.
Ölçüldü: müdürsüz bir fabrika dört saatte 144.000 kazanıyordu ve o dört
saatte tek bir külçe taşınmamıştı.

Elle çalışan bağın gerisinde mal yerde birikiyor (tavanına kadar) — döndüğünde
seni bekleyen iş o.

### Denge testleri kusursuz taşıyıcı varsayıyor

`window.jeAutoCarry(true)` — oyunda kapalı, yalnızca ölçüm için. İşçi girince
denge simülasyonları **ölü bir fabrikayı** ölçmeye başladı: taşıyan kimse yok,
hiçbir şey akmıyor, seviye 1'de kalıyor ve testler bunu fark etmeden
geçiyordu. Bayrak "oyuncu taşımaya yetişiyor" varsayımını kuruyor, yani eski
ölçümlerin ölçtüğü şeyi.

## Zincir

    DÖKÜM ──külçe──▶ PRES ──panel──▶ MONTAJ ──araba──▶ SEVKİYAT ──▶ para

Her istasyonun arkasında bir **tampon** var. Bir istasyon ancak önündeki
kadar hızlı çalışabiliyor, yani hat en yavaş halkasının hızında akıyor ve
yavaş olanın önünde mal yığılıyor.

Oyunun bütün öğretisi bu tamponlarda. Dolan çubuk oyuncuya neyi yükselteceğini
söylüyor; başka bir istasyonu yükseltmek gözle görülür şekilde hiçbir şey
yapmıyor. Eğitim ekranı, "önerilen" oku ya da açıklama metni yok.

**Ama çubuk tek başına yetmiyordu.** Oyunu telefonda oynayan ilk kişi
"kırmızı olunca ne oluyor" diye sordu — üç istasyon tıkalıydı, cevap aynı
ekranda **DARBOĞAZ** etiketiyle duruyordu ve ikisi arasındaki bağı kimse
kurmuyordu. Çubuk neyin yanlış olduğunu söylüyor, ne yapılacağını
söylemiyordu. Artık tıkalı istasyonun satırı beklediği istasyonun **adını**
yazıyor: `DOLU — Sevkiyat'ı yükselt`, çubuğun kendi kırmızısıyla.

Kilometre taşı ipucu o sırada gizleniyor: satıra sığmıyor, üstelik üzerine
basılmayacak tek bilgi o — çıkışı tıkalı bir istasyonu yükseltmek hiçbir şey
almıyor.

## Denge — üç deneme

Denge, hep darboğazı satın alan sahte bir oyuncu simüle edilerek ölçüldü
(`scratchpad/tycoon*.mjs`). Her sayı ölçümle geldi, tahminle değil.

    node scratchpad/tyworker.mjs   # işçi: alıyor, bırakıyor, müdürle gerekmiyor

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
(1.09 / 1.085 / 1.08 / 1.075). Seviyeler o gün **38/37/38/37**'de kalıyordu
ve darboğaz hat boyunca sürekli yer değiştiriyordu.

O üç haneli sayı bugün başka: elli dakikalık bir koşuda seviyeler
**137/168/168/168** (ölçüldü, `scratchpad/tydenge.mjs`). Oyun o günden sonra
prestij, araştırma ve ürün kademeleri kazandı, yani 38 sayısı eskidi —
**iddia** eskimedi: dördü birden tırmanıyor (en düşük, en yükseğin %82'si)
ve darboğaz elli dakikada 118 kez el değiştirip dört istasyonun hepsini
görüyor.

Ve artık bir kapı var. Bu bölümün sayıları `tycoon*.mjs` denemelerinden
geldi, o altı dosyada **tek bir iddia yok** (tablo basıp çıkış kodu sıfır
dönüyorlar), yani maliyet eğrilerinden biri değişse seviyeler 14/5/4/2'ye
dönebilir ve takımın hiçbir satırı bunu söylemezdi — ikinci denemenin hatası
tam buydu. `tydenge.mjs` üç şartı kapıya çeviriyor ve kendi denemesi var
(`tydenge.mjs tekyonlu`: oyuncu hep Döküm alıyor, üç şartın üçü de düşüyor). `baseRate` dördünde de 1:
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

**Reklam açılmazsa.** Ağ yoksa ya da envanter boşsa `showRewarded()`
`false` dönüyor, ve bu hâl ikisinde de sessizdi. Dönüş ekranındaki
düğme daha kötüsünü yapıyordu: ekranı kapatıp `pendingOffline`ı
sıfırlıyordu, yani hiçbir reklam izlenmeden ikiye katlama hakkı
yanıyordu ve bir daha gelmiyordu. Artık ekran açık kalıyor, hak
duruyor ve düğmede "REKLAM AÇILMADI" yazıyor. Hız kutusunda aynı
cümle kasanın üstünde beliriyor — hapa sığmıyor.

Ölçüm: `scratchpad/tyreklam.mjs`, reklamın sonucunu `jeReklamSim` ile
dayatıyor.

Cihaz dışında `showRewarded()` `true` dönüyor, yani tarayıcıda akış
yürünebiliyor; orada hız kutusu eski beklemesini fren olarak koruyor.

Şu an Google'ın **herkese açık test birimleri** kullanılıyor. Yayından önce
AdMob'da uygulama açıp `AD_UNITS` içindeki kimliği değiştirmek ve
`ADS_TESTING = false` yapmak gerekiyor.

## Geri tuşu oyundan çıkarıyordu

Android'de geri tuşu, WebView'ın geçmişi boşsa uygulamayı kapatıyor.
Bu oyun tek sayfa ve hiç gezinmiyor, yani geçmiş hep boştu:
araştırma perdesini kapatmak için geri basan oyuncu oyundan
çıkıyordu.

Burada "ev" fabrikanın kendisi — hiçbir perde açık değilken geri tuşu
uygulamadan çıkmalı. Bir perde açıkken geçmişe bir girdi konuyor; geri
tuşu önce onu açıyor ve oyun o perdeyi **kendi kapatma düğmesiyle**
kapatıyor, çünkü bazılarının kapanışında yapılacak iş var (dönüş
ekranı bekleyen parayı sıfırlıyor). Perdeler onlarca yerden
açıldığı için `show` sınıfı bir `MutationObserver` ile izleniyor.

Geri tuşu `goBack()` çağırmayan bir yapıda hiçbir şey değişmiyor.

Ölçüm: `scratchpad/tygeri.mjs`. En önemlisi ilk kontrol — perde
yokken yığında bizim girdimiz olmamalı, yoksa oyuncu uygulamadan
çıkamaz.

## Kayıt

Üç anahtar:

- `motorworks_save` — oyunun hâli: kasa, ömür boyu kazanç, şube sayısı,
  seviyeler, müdürler, tamponlar, araştırma seviyeleri, boost
  zamanlayıcıları, son görülme zamanı
- `motorworks_save_bak` — **bir önceki** kayıt. Her yazma, bir öncekini
  buraya itiyor
- `motorworks_save_bozuk` — okunamayan veri buraya alınıyor, silinmiyor

Eski bir kayıt eksik dizi elemanıyla gelebilir; eksik seviye sessizce `NaN`
olup bütün ekonomiyi sıfırladığı için yükleme sırasında tamamlanıyor.

### Bozuk kayıt fabrikayı götürüyordu

Yükleme tek satırdı: `try { JSON.parse(...) } catch { return {} }`. Yani
yarım yazılmış bir kayıt oyunu sıfırdan açıyor, oyuncuya hiçbir şey
söylemiyor, ve ilk otomatik kayıt bozuk veriyi sıfırla eziyordu. 90.
seviyedeki bir fabrika, tek bir kesintili yazma yüzünden, geri dönüşsüz
gidiyordu — ve bu oyunda oyuncunun kaybedebileceği tek şey o.

Üç şey değişti:

1. Kayıt, `JSON.parse` patlamadığı için değil, **kendi alanları tuttuğu**
   için geçerli sayılıyor. `JSON.parse('5')` patlamıyor ama kayıt da
   değil. Kontrol bilerek hoşgörülü: eksik alan sebep değil, çünkü eski
   bir yapımın kaydında `totalEarned` yok ve `Object.assign` onu zaten
   dolduruyor. Çalışan bir kaydı atmak, bozuğu kabul etmekten pahalı.
2. Yedek yuva **bir önceki kayıt**. Ana yuva bozuksa oyun ondan dönüyor:
   bir otomatik kayıt kaybediliyor, hepsi değil.
3. Oyuncuya söyleniyor — dokunulana kadar duran kırmızı bir şeritle, iki
   dilde. Üç hâl var: yedekten dönüldü, okunacak bir şey kalmadı, ve
   **hiç kaydedilemiyor**. Sonuncusu da sessizdi: telefon doluysa oyun
   saatlerce oynanıyor ve hiçbiri yazılmıyordu.

`jeReset` üç yuvayı da siliyor. Yalnızca anayı silmek, yenilemede
yedekten dönmek demekti — yani sıfırlama sıfırlamıyordu.

## Sürüm ve reklam anahtarı

Menünün altında `v1.0 (8)` yazıyor. Numara `app-version.json`'dan
derlemede giriyor, kaynakta `'dev'` duruyor: elle yazılan ikinci bir yer
yok. "Bu güncel sürüm mü" sorusunun başka cevabı yok ve bilinmeyince
"düzeltme gelmemiş" ile "düzeltme işe yaramamış" birbirine karışıyor.

`ADS_TESTING` kaynakta **her zaman** `true`. Yalnızca
`npm run release:tycoon` (yani `LIVE_ADS=1`) onu `false` yapıyor. Kendi
canlı reklamına tıklamak AdMob hesabını kapattırıyor ve kapatılan
yayıncı yeni hesap açamıyor. İkisi de `scratchpad/tysurum.mjs` ile
ölçülüyor.

## Test

Hepsi Playwright ve gerçek sayfa; hiçbiri zamanlamaya bağlı değil.

    npm run test:tycoon

Bu komut önce `build-www.mjs`'i, sonra bütün `ty*` ölçümlerini sırayla
koşturuyor ve tek bir özet yazıyor. Elle yazılan kabuk döngüsünün yerine
geldi: o döngü PowerShell'de çalışmıyordu, yani ölçümleri yazan onları
koşturabiliyor, oyunu derleyen koşturamıyordu.

`tyshots` ve `tyfeature` ölçüm değil, mağaza görseli üretiyor; onları
listenin dışında tut.

**Ekonomi ve zincir** — `tycoon` (zincir, darboğaz, sayı biçimi),
`tycoon2` (üç saatlik eğri), `tycoon3` (prestij döngüsü), `tycoon5`
(ürün kademeleri ve fiyat), `tycoon6` (MAKS alımı), `tyhiz` (ekrandaki
hız kasayla uyuşuyor mu), `tyduvar` (devir ne zaman açılıyor),
`tykademe` (araç kademeleri ulaşılabilir mi), `tyuzun` (on beş devir:
NaN, taşma, tavan), `tytasi` (elle taşımanın sınırı), `tyblock` (tıkalı
hat).

**Çevrimdışı ve zaman** — `tycevrimdisi` (kapalıyken kazanılan, açıkken
kazanılanla aynı mı), `tydurdu` (fabrika durduysa oyuncu öğreniyor mu),
`tyhizkutusu` (×3 gerçekten üç kat mı), `tybildirim` (depo dolunca).

**Oyuncunun ilk saatleri** — `tyacilis` (ilk on dakika), `tyogretici`,
`tygorev` (günlük görevler), `tyodul` (hedef ödülleri), `tymudur`,
`tyisci` / `tyworker` (işçi yürüyor mu, taşıyor mu), `tynezaret`,
`tymusteri`, `tymuzik` (müzik ve susması), `tyyer`, `tyarastirma`,
`tycoonres`, `tycoon4`.

**Kayıt ve taşınma** — `tykayit` (bozuk kayıt, yedek yuva, yazma
hatası), `tyyedek` (yedek kodu), `tygoc` (eski kayıt yeni sürümde).

**Arayüz ve paket** — `tyekran` (küçük telefonlar), `tydil` (çeviri
tablosu), `tyingilizce` (Türkçe açıkken ekranda İngilizce kalmış metin),
`typerf` (ucuz telefonda yük), `tymagaza` (Play ürünü tanımıyorken
mağaza), `tysatin` (satın alınan teslim ediliyor mu), `tyreklam`
(reklam açılmazsa oyuncu ne görüyor), `tygeri` (donanım geri tuşu
perdeyi mi kapatıyor), `typlaygames`,
`tysurum` (sürüm numarası ve reklam anahtarı), `tylisting` (mağaza metni
oyunla uyuşuyor mu), `tybelge` (bu dosya oyunla aynı şeyi mi anlatıyor).

`window.jeProbe()` oyunun bütün durumunu döndürür. Oyunu parmaksız
oynatanlar: `jeGive`, `jeRun`, `jeStep`, `jeBuy`, `jeSetLevel`,
`jeGiveManager`, `jeTakeManager`, `jeOffline`, `jeBoost`, `jePrestige`,
`jeResBuy`, `jeSetLifetime`, `jeSetEarned`, `jeWipeProgress`, `jeReset`.
Ekranı kuranlar: `jeTutSkip`, `jeGunGoster`, `jeIapSim`, `jeReklamSim`,
`jeDonus`, `jeKayitBoz`, `jeKayitDur`, `jeSave`.

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

Oyunun kendisinde değil, Play tarafında duranlar:

- **Play Games liderlik tablosu**: `LEADERBOARD_ID` hâlâ boş. Kimlik
  girilene kadar 🏆 düğmesi hiç görünmüyor — bu beklenen davranış, ama
  tablo da yok demek
- **Uygulama içi ürünler Play Console'da açılmadı**. Kod hazır ve üç
  kimliği bekliyor: `motorworks_double`, `motorworks_managers`,
  `motorworks_skip12`. Açılana kadar mağaza satırları "KAPALI" görünüyor
- **Kapalı test**: 12 test kullanıcısı, 14 gün. Üretime başvurmanın
  şartı bu
- **Ad araması yapılmadı**: "Motor Works" adı Play'de aranmadı. Fruit
  Hole bu adım atlandığı için 13 bin yorumlu bir rakiple çarpıştı
