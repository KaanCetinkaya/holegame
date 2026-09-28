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

## 40 (1.13) — 410 karakter

```
New in this update: three new things on the board.

- Catapults throw a bomb at wherever you are standing. A red ring marks where it lands and closes as it falls, so the only thing they punish is standing still.
- Rollers are stone drums running back and forth across a bare lane. They take nothing from you - only the way through.
- Mud. You can cross it at half speed, or go round. Sometimes round is faster.
```

39 yüklendikten sonra yazıldı, yani ayrı bir not: 39'un kutusunda mancınık
yoktu ve o sürüm testçilere gitti. Aynı notu ikinci kez göndermek, oyuncuya
zaten oynadığı şeyi yeni diye anlatmak olurdu.
