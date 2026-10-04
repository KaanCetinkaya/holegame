# Sürüm notları

Play Console > Release > "What's new in this release" kutusuna yapıştırılan
metin. Sınır **500 karakter** ve Play boşlukları da sayıyor: uzunsa kutu
kırmızıya dönüyor ve sürüm kaydedilmiyor. Metni yazdıktan sonra sayılıyor,
tahmin edilmiyor.

Kural: oyuncunun **göreceği** şey yazılıyor. Çizim çağrısının 1299'dan 130'a
inmesi buraya girmiyor, "daha akıcı" giriyor. Düzeltilen hatalardan da yalnızca
oyuncunun başına gelmiş olanlar — beyaz ekran gibi.

Her sürümün metni burada kalıyor, çünkü bir sonrakini yazarken "geçen sefer
neyi duyurmuştuk" sorusunun tek cevabı bu dosya: Play Console eski notu
gösteriyor ama ikisini yan yana koymuyor.

---

## 37 (1.13) — 492 karakter (eski hâli, hiç kullanılmadı)

```
New in this update:

- Twenty-three new places: Hawaii, Manhattan, Dubai, Tokyo, Rio, Istanbul, Egypt and more, each with its own ground, light and objects.
- Five football leagues, and a cup final: sweep the pitch, then take the giant trophy at the far end.
- Puzzle levels: rock walls split the board into rooms.
- New boards drawn in fruit: pictures, spirals, rings and webs.
- Fixed mission levels that could not be beaten.
- Fixed a white screen after the app had been in the background.
```

37 henüz Play'e gönderilmedi (`app-version.json` > `uploaded` 36'da bitiyor),
yani not yeniden yazıldı — ayrı bir 38 notu değil. Aradaki fark, eskisinin
yazıldığı günden sonra gelen iki şey: **hedef kartları** (bölümün ne istediğini
değiştiren en büyük oynanış değişikliği, yani listenin başına geçmesi gereken
madde) ve dört yer daha.

## 39 (1.13) — 492 karakter

```
New in this update:

- Cards at the top now say which fruit to collect and how many, instead of sweeping the whole field.
- Twenty-seven new places, each with its own ground, light and objects.
- Five football leagues and a cup final, with a giant trophy at the far end.
- Puzzle levels, picture boards, and new shapes to clear.
- Spikes: they do not stop you - running over one costs you a size.
- Fixed unbeatable mission levels and a white screen after the app had been in the background.
```

Bu not bir kez yeniden yazıldı. İlk hâli 36'dan sonra yapılan işin yarısını
anlatıyordu — bulmaca, resim, şerit — çünkü o gün iş orada bitmişti. Sonra
yirmi üç yer, beş lig ve bir final eklendi ve not eskidi: 37 hâlâ
yüklenmemişti, yani oyuncunun göreceği değişikliklerin çoğu notun dışında
kalacaktı.

Ders, notu bir sürümün sonunda yazmak değil, **yüklemeden hemen önce**
okumak: aradaki her commit notu biraz daha eskitiyor.

İlk taslak 559, ikincisi 518 karakterdi. Kırpılan yerler: bulmacanın kapı
genişliği ve "saat yok" cümlesi (deliğin küçülmemesi zaten kuralı söylüyor),
şeridin ayrı satırı (resimle tek satırda birleşti), "ızgara tahtaları artık
karışık durmuyor" ve "eski telefonlarda daha akıcı" — ikisi de bir önceki
sürümün yanında küçük kalıyor.

Yirmi üç sayısı elle sayılmadı: `THEMES` tablosu bugün 34 yer (artı `mixed`),
36 yüklenirken 11'di.

---

## 37 ve 38 nereye gitti

Bu notun başlığı önce 37'ydi, sonra 39 oldu ve arada yazılmamış iki sürüm
var. Sebebi burada dursun, çünkü aynı hata `1.10 / versionCode 31` notunda
da yazılı ve ikinci kez oldu.

37 ve 38 Play'e yüklendi, ama yükledikten sonra `npm run uploaded:fruithole`
çalıştırılmadı. Depo hâlâ "son yüklenen 36" sanıyordu, yani bir sonraki
derleme 38'i **ikinci kez** üretti ve Play reddetti: *"38 sürüm kodu daha
önce kullanıldı."*

İki sürüm kodu yandı ve hangi notun hangi pakete gittiği kayboldu: 37 ile
38'in "What's new" kutusuna ne yazıldığı artık bilinmiyor. Sürüm kodunu
Play sayıyor, notu depo tutuyor, ve ikisini birbirine bağlayan tek şey o
komut.

Doğrusunun tek kaynağı **Play Console > Sürüm > Uygulama paketi gezgini**.
Oraya bakıldığında 38 (1.13) bugün 14:11'de kapalı teste yayınlanmış
durumdaydı; kayıt ona göre düzeltildi.

---

## 40 (1.13) — 466 karakter

```
New in this update: five new things on the board.

- A rival hole. The red one eats the crop too, and everything it takes is something you will not. It never takes the last of what your cards need.
- Catapults throw a bomb at wherever you are standing. A red ring marks where it lands.
- Rollers are stone drums running back and forth across a bare lane.
- Mud. You can cross it at half speed, or go round.
- Wind. Inside the marked band you drift, so steer into it.
```

39 yüklendikten sonra yazıldı, yani ayrı bir not: 39'un kutusunda mancınık
yoktu ve o sürüm testçilere gitti. Aynı notu ikinci kez göndermek, oyuncuya
zaten oynadığı şeyi yeni diye anlatmak olurdu.

## 41 (1.13) — 467 karakter

```
New in this update: five new things on the board.

- A rival hole. The red one eats the crop too, and everything it takes is something you will not.
- Catapults throw a bomb at wherever you are standing. A red ring marks where it lands.
- Rollers are stone drums running back and forth across a bare lane.
- Mud. Cross it at half speed, or go round.
- Wind. Inside the marked band you drift, so steer into it.
- Fixed a freeze that could stop the game on some levels.
```

40 ile aynı beş madde, artı bir satır: **donma**. O satır 40'ın notunda
yoktu, çünkü not 40 yüklenmeden önce yazılmıştı ve donmanın sebebi
(gerçek olmayan bir para birimi isteyen on beş nesne) daha bulunmamıştı.
Testçiler 39'u oynadı ve 39 donuyordu — yani bu, listedeki tek madde
arasında **başlarına gelmiş olanı**, ve dosyanın kuralı da o: oyuncunun
göreceği şey yazılıyor.

Rakip maddesinden "It never takes the last of what your cards need" cümlesi
düştü. Doğru bir cümle — `rivalCanEat` tam olarak bunu garanti ediyor — ama
oyuncu daha rakibi görmeden ona bir güvence vermek, olmayan bir korkuya
cevap vermek. Kalan yer de bir karakter kalmamıştı.

## 42 (1.13) — 486 karakter

```
New in this update: five new things on the board.

- A rival hole. The red one eats the crop too, and everything it takes is something you will not.
- Catapults throw a bomb at wherever you stand. A ring marks where it lands.
- Rollers are stone drums running across a bare lane.
- Mud. Cross it at half speed, or go round.
- Wind. In the marked band you drift, so steer into it.

Whatever costs you time or size now says so, where it happened.

Fixed a freeze that could stop the game.
```

41'in notu hiç kullanılmadı: paket yüklendi ama sürüm yayına alınmadı, yani
testçilere gitmedi. Kod yandı, not yanmadı — buradaki tek fark, 41'in
maddelerinin aynen 42'ye geçmesi, çünkü oyuncu ikisinin arasındaki hiçbir
şeyi görmedi.

Eklenen tek satır **bedel etiketleri**. Kaan 45. bölümü oynadı ve "bir şeye
dokununca süreden gidiyor ama neye anlayamadım" dedi; artık bomba kendi
üstünde `−5s`, mancınık `−3s`, diken `−1 SIZE` yazıyor. Tek satırda
duruyor, çünkü oyuncunun göreceği şey üç ayrı özellik değil tek bir
değişiklik: "ne oldu" sorusu artık cevaplanıyor.

Yerden kazanmak için üç madde kırpıldı ("wherever you are standing" →
"wherever you stand", "back and forth across" → "across", donmanın "on some
levels"ı). İlk hâli 531'di.

## 44 (1.13) — 386 karakter

```
What changed:

- The badge at the top now names the place you are in, not just the shape of the board. There are forty-six places and not one of them said its name.
- Every place has its own two obstacles, chosen by the ground you are standing on: wind on sand, mud on grass, rollers on pavement, catapults on pitches. Arriving somewhere now changes how you play, not only how it looks.
```

İki madde de aynı cümleden çıktı. Kaan 55. bölüme kadar oynadı ve "o
kadar şehir ekledik ama hep aynı bölümü oynuyormuşum gibi" dedi; ondan
önce de "bu yeni ülkeleri bir türlü bulamadım" demişti — dördünden de
geçmiş olduğu hâlde.

Ölçüm ikisini tek bir sebebe indirdi: kırk sekiz yer, kırk sekiz düzen,
**dört meyve**, ve engeller yalnızca bölüm numarasına bağlı. Yani yer ne
adıyla görünüyordu ne de oynanışta bir şey değiştiriyordu.

Notta **olmayan** şey: meyvenin rengini yerden türetme denemesi. Ölçüldü
ve düştü (kırk beş tonun en uzak ikisi 441 üzerinden 6), geri alındı. Bu
kutu oyuncunun gördüğü şeyi yazıyor; görünmeyen bir deneme buraya girmez.

Yıldızların üst satırdan çıkması da yazılmadı. Oyuncu için bir kayıp
değil — yıldızlar bölüm haritasında ve bitiş ekranında duruyor — ve yer
adının sığması için gereken şeydi. Bir satırlık yer açmayı duyurmak,
duyurunun kendisini ucuzlatır.

## 43 (1.13) — 399 karakter

```
What changed:

- Bombs sit on open ground now instead of buried in a stack of fruit, so you can see one coming and go round it.
- Anything that costs you says so where it happened - a bomb, a catapult hit, a spike.
- Mud and wind turn up on mission levels too.
- Past level 48 the clock gets tighter each time round.
- Fixed a giant that could end up inside a catapult, where nothing could reach it.
```

Bu notun tamamı **Kaan'ın oynamasından** çıktı, bir plandan değil. 45.
bölümde "bir şeye dokununca süreden gidiyor ama neye anlayamadım" dedi —
bedel etiketleri oradan. 55'te çilek kulesinin **altında** bir bomba
gördü, düzeltildi; 45'te karpuz kulesinin **üstünde** gördü, ve ikisinin
aynı şey olduğu anlaşıldı: kule tek hamlede iniyor, bomba nerede olursa
olsun kulenin bedeli oluyor. Bomba artık kulede değil.

"Turların sıkılaşması" ölçüden çıktı: dört tur boyunca kart/saniye oranı
1.10, 1.19, 1.16, 1.14 — yani düzdü, ve 55. bölümdeki oyuncu 10.
bölümdekiyle aynı sıkışıklıkta oynuyordu.

Mancınığın içindeki dev notta duruyor çünkü oyuncunun **başına gelen** bir
şey: devler görevinde o devi yutmak zorundasın ve yutamıyorsun. Nasıl
bulunduğu (tahta değişmezlerinin taranması) buraya girmiyor — bu kutu
oyuncunun göreceği şeyi yazıyor.

Yazılmayanlar: ölçüm dosyaları, mağaza metninin üretilmesi, botun sıkışma
kurtarması. Hiçbiri oyuncunun gördüğü bir şey değil.

## 40 ve 41 nereye gitti

40, yarım kalmış bir merge'in içindeki ağaçtan derlendi ve yüklendi; sonra
depo `git reset --hard` ile temizlenince "40 yüklendi" kaydı da silindi ve
bir sonraki derleme 40'ı ikinci kez üretti. Play reddetti: *"40 sürüm kodu
daha önce kullanıldı."*

Bu, 37/38 ile aynı hatanın **üçüncü** tekrarı değil — sebebi başka.
Orada `npm run uploaded:fruithole` hiç çalıştırılmamıştı; burada
çalıştırıldı ama commit edilmedi, ve commit edilmemiş bir kayıt bir
`reset --hard`'a dayanmıyor. Ders, komutun kendisi değil **komut + commit +
push**'un tek bir iş olduğu: kayıt diskte değil, uzakta durursa yaşıyor.

41 de yüklendi ve yine testçilere gitmedi, ama bu sefer sebep başka:
paket Play'e çıktı, sürüm **yayına alınmadı**. Kapalı testin son
yayınlanan sürümü 40'ta kaldı.

Buradan çıkan ayrım, bu dosyanın bundan sonra ayrı tutması gereken şey:
**yüklemek ile yayınlamak aynı iş değil.** `uploaded` listesi sürüm
kodunun harcandığını söylüyor — o kadar. Testçinin telefonunda ne olduğunu
söylemiyor, ve iki soru tek bir listeden okunamaz.

Bir de yanlış bir teşhis: kitaplık listesinde en yüksek kod 40 görünüyordu
ve buradan "41 hiç yüklenmemiş" sonucu çıkarıldı. Yanlıştı — Play yükleme
kutusunda "41 sürüm kodu daha önce kullanıldı" dedi. Kitaplık listesi
sürüm kodlarının tamamını göstermiyor, yani **bir şeyin yokluğu** o
listeden okunamaz. Doğrunun tek kaynağı yükleme kutusunun kendisi ve
uygulama paketi gezgini.

## 45 (1.13) — 211 karakter — **ilk açık test**

```
First public test build.

- The catapult was missing from more than half the boards that are meant to have one - Drive-In, Fiesta, Rangoli. It now turns up every time, so a place plays the way it is supposed to.
```

Sürüm adı (yalnızca panoda görünür, oyuncuya gösterilmez): `45 (1.13)`

Bu not öncekilerden iki yerde ayrılıyor, ve ikisinin de sebebi aynı:
**kutuyu ilk kez yabancılar okuyacak.**

Birincisi, ilk satır. 41-44 doğrudan *"What changed"* ile başlıyordu ve
doğruydu — okuyan herkes bir önceki sürümü oynamıştı. Açık testte okuyanın
çoğu oyunu hiç görmedi, ve değişiklik listesiyle başlayan bir kutu onlara
hiçbir şey söylemiyor. *"First public test build"* ikisine birden çalışıyor:
yeni gelen nerede olduğunu anlıyor, kapalı testteki on iki kişi de
güncellemenin ne olduğunu.

İkincisi, tek madde. Dört sürümdür listeler uzuyordu çünkü her biri Kaan'ın
oynamasından çıkan birkaç düzeltme taşıyordu. 44'ten beri oyuncunun
gördüğü **tek** değişiklik var: mancınık, zemininin onu çağırdığı
tahtalarda gerçekten çıkıyor. Ölçüldü — Drive-In'de kırk tohumun
on yedisinde çıkıyordu (%43), şimdi kırkında. Yani "yerin kendi engeli"
sözü, oyuncuların yarısında tutulmuyordu.

Nota **girmeyenler**: ızgara taramasının kendisi (oyuncu yerleştirme
algoritmasını görmüyor), kaya payının yarıya inmesi (aynı şeyin içi),
mayın saatindeki yorum düzeltmesi (davranış değişmedi, yalnızca yanlış
yazılmış bir sayı düzeldi), ve klip aracının tamamı. Bu kutu oyuncunun
gördüğü şeyi yazıyor.

---

## 46 (1.13)

```
The camera sits closer now, so everything on the board reads at its proper size.

- Towers of stacked objects, and landmarks too big to swallow until you have grown into them
- Big fruit no longer overlaps, so a board reads as laid out rather than poured
- Eleven new layouts and five new places: a comic rooftop, a cube world, a pit lane, an arcade, a drop zone
- Every level opens by showing you the whole board
- An arrow points to the giants you still have to find
- Fixes for the blank screen that could follow an ad
```

426 karakter (sınır 500).

Sürüm adı (yalnızca panoda görünür): `46 (1.13)`

Bu not 45'ten iki yerde ayrılıyor.

Birincisi uzunluğu. 45 tek maddeydi çünkü oyuncunun gördüğü tek değişiklik
vardı. 46'da altı tane var ve altısı da ekranda duruyor — kamera mesafesi,
kuleler, anıtlar, çakışmanın bitmesi, on bir düzen, bölüm açılışı. Liste
uzunsa sebebi listeyi uzatmak değil, sürümün uzun olması.

İkincisi ilk satır. Kamera mesafesi başa alındı çünkü oyunu açan birinin
**ilk saniyede** fark edeceği tek şey o: tahta aynı tahta, ekran yakın.
Öteki beş madde oynadıkça çıkıyor.

Nota **girmeyenler**: iri parçaların dama ızgarasına oturması (oyuncu
kuralı değil sonucunu görüyor — "çakışma bitti" maddesi o), tür desenleri
(şerit, dama, halka — tahtaların tek renk görünmemesinin sebebi ama
oyuncunun okuyacağı bir cümle değil), boy merdiveninin basamakları,
`HIDDEN_SHAPES` bekçisi, ve bütün ölçüm betikleri.
