# Sosyal medya — Peelo: Fruit Hole

Bu dosya klipleri nereye, hangi metinle koyacağımızı tutuyor.
Klipleri üreten: `node fruithole/make-clips.mjs`.

## Neden burası

İndirme başına değerimiz ~$0.16 (ARPDAU ~$0.04 × ortalama ömür ~4 gün).
Tier-1'de casual oyun için satın alınan indirmenin maliyeti $0.50–$2.00.
Yani **reklam vererek indirme almak her indirmede 3-10 kat zarar**. Ayda
~12.000 indirme hedefi için tek gerçekçi yol organik kısa video.

Hedef ülke ABD ve Avrupa — mağaza metinleri zaten İngilizce. Sosyal medyada
da **İngilizce** yazılıyor, çünkü TikTok ve Reels içeriği dile göre
dağıtıyor. Türkçe bir açıklama bizi Türkiye'ye kilitler ve orada eCPM
beşte bir.

## Hesap

**Kullanıcı adı.** Sırayla dene, biri boştur:

```
peelogame
playpeelo
peelo.game
peeloarcade
```

Aynı adı TikTok, Instagram ve YouTube'da **aynı anda** al — biri doluysa
dördü için de başka bir ada geç. Tek isim üç platformda, aksi halde
yönlendirme yapamazsın.

**Görünen ad:** `Peelo: Fruit Hole`
**Profil fotoğrafı:** `fruithole/store/icon-512.png` — ama **JPG'ye çevirip**
yükle. TikTok PNG'yi kabul etmiyor: kırpma ekranında "Uygula" düğmesi hiç
aktif olmuyor ve hata da vermiyor, sadece hiçbir şey olmuyor.

```
cd C:\Users\HP\holegame
ffmpeg -i fruithole/store/icon-512.png -q:v 2 peelo-profil.jpg
```

**Bio (80 karakter sınırı):**
```
Steer the hole. Swallow the field. 🕳️🍓
New levels every week · Free on Android
```

**Link:** Play mağaza sayfası. Production'a çıkana kadar link koyma —
kapalı testte olan bir linke tıklayan kişi "bulunamadı" görür ve bir daha
gelmez.

## Kliplerin açıklamaları

Yedi klip var, hepsi 9 saniye, sessiz, 1080×1920. **Gün aşırı** yükle;
hepsini bir günde atmak hesabın dağıtımını bölüyor.

Sıra rastgele değil: ilk üçü en yoğun tarlalar, ve `farm.mp4` yeni olan şeyi
gösteriyor.

### 1. farm.mp4 — Cross, sürülmüş tarla  *(ilk yüklenecek)*
Oyundaki en yeni yer ve ikinci en yoğun tarla. İlk kare deliğin tam üç dev
çileğin dibinde durduğu an.
```
POV: you are the hole and the harvest has nowhere to go 🕳️🍓

#satisfying #mobilegame #asmrgaming #indiegame #fruitgame
```

### 2. shop.mp4 — Blocks, teknoloji mağazası
Tarladaki en yoğun bölüm (hücre başına 1.04 meyve) ve voxel görünümü tek
başına bir kanca.
```
The whole shop floor went in. TVs, headphones, one fridge 📺🕳️

#satisfying #mobilegame #voxel #indiegame #oddlysatisfying
```

### 3. drive.mp4 — Ring, arabalı sinema
```
Drive-in cleared. Burgers, fries and the parked cars 🍔🚗

#satisfying #mobilegaming #indiegame #gaming #fyp
```

### 4. boss.mp4 — 10. bölüm, patron
Her onuncu bölümün sonunda devasa bir meyve var ve erkenden alınamıyor.
```
Every 10th level ends in one giant fruit. You cannot take it early 👑🍓

#bossfight #mobilegaming #satisfying #indiedev #gaming
```

### 5. bar.mp4 — Stairs, bar tezgâhı
Oyunun akşam ışığındaki tek yeri; koyu ahşap ve pirinç.
```
Happy hour. The cocktails went first 🍹🕳️

#satisfying #mobilegame #indiegame #oddlysatisfying #gaming
```

### 6. space.mp4 — Heart, istasyon güvertesi
Kenarından ötesi karanlık: tahtanın bittiği yer görünüyor.
```
No floor past the edge. Just the dark 🚀🕳️

#satisfying #mobilegaming #space #indiegame #gaming
```

### 7. beach.mp4 — Pyramid, birinci bölüm
Oyunun en parlak zemini ve ikonun görünümü — yeni oyuncunun gördüğü ilk şey.
```
Started on the beach. Ended with the whole pyramid 🏖️🍓

#satisfying #relaxing #mobilegame #indiegame #beach
```

## Yüklerken — önemli olan üç şey

**1. Ses ekle.** Kliplerimiz bilerek sessiz, ve TikTok sessiz videoyu
neredeyse hiç dağıtmıyor. Yükleme ekranında **"Sounds"**tan o an trend olan
bir parça seç. Sessiz olmaları bunu kolaylaştırmak için — üstüne ne koyarsan
uyar, ve telif sorunu çıkmaz.

**2. İlk saniyeye yazı koy.** TikTok'un kendi editöründe metin ekle, ilk
1-2 saniyede görünsün. Öneriler:

```
wait for the giant one
this is weirdly satisfying
i cleared the whole field
POV: you're the hole
```

**3. Dikey ve tam ekran.** Klipler 1080×1920, yani doğru. Kırpma, filtre
ekleme.

## Ölçüm — 1. video (17 Eylül, space.mp4, 15 sn)

```
izlenme            266
toplam oynatma     9dk 41sn
ortalama izlenme   2.34 sn
tamamlanma         %4
yeni takipçi       0
beğeni             0
```

**Okunuşu: dağıtım sorunu yok, kanca sorunu var.** TikTok videoyu 266 kişiye
gösterdi; izleyici ortalama 2.34 saniyede bıraktı. Yani mesele videonun
görülmemesi değil, görülünce tutmaması.

Buna göre iki şey değişti (`make-clips.mjs`):

* **Süre 15 → 9 saniye.** Tamamlanma TikTok'un en ağır tarttığı sinyal ve bu
  görüntü için 15 saniye uzun.
* **Kayıt koşunun 6. saniyesinden başlıyor.** Eski kliplerin ilk saniyesinde
  delik küçüktü ve tarla açılmamıştı — ilk kare "ne oluyor" sorusunu
  cevaplamıyordu. Artık kamera döndüğünde delik büyümüş ve süpürülmüş bir yol
  var.

Bir sonraki ölçümde bakılacak tek sayı: **ortalama izlenme**. 2.34'ten
yukarı gitmiyorsa sorun süre değil, görüntünün kendisi.

### İkinci tur: kaydın başladığı an

Süreyi 9'a indirmek ve 6 saniye ısınmak yetmedi. 24. bölümün ilk karesine
bakınca sebep görüldü: **ekranın alt yarısı süpürülmüş boş toprak**tı. Sabit
bir gecikme, deliğin o sırada tarlanın neresinde olduğunu bilmiyor — altı
saniyede delik büyüyor ama arkasında geniş bir temiz alan bırakıyor ve kamera
onu takip ediyor.

Artık kaydın ne zaman başlayacağına **ölçerek** karar veriliyor
(`window.fruitHoleAhead()`): delik en az üç saniye ısındıktan sonra, çevresinde
50 meyve olan **ve** tarlanın kenarından en az 2.5 birim içeride olduğu ilk
kare aranıyor.

İkinci şart birincisinin eksiğinden çıktı: yalnızca meyve sayısına bakınca
delik yoğun bir öbeğe yapıştı, ama öbek tarlanın sol kenarındaydı ve karenin
üçte biri tarlanın dışındaki düz yeşil zemin oldu. Kalabalık bir kare
istiyoruz, kalabalığın yanında boş bir şerit değil.

Eşik de ölçümden: 26 denendi ve zayıf çıktı (delik seyrek bir bölgede
duruyordu), 50'de ilk kare deliğin üç dev çileğin dibinde durduğu an oldu.

## Ne kadar sıklıkla

Günde bir, en fazla. Yedi klip yedi gün eder; bitince
`node fruithole/make-clips.mjs` ile yenilerini üretiriz. Tarla her
çalıştırmada farklı çıkıyor (klipler tohumlanmıyor), yani aynı bölüm bile
aynı videoyu vermiyor.

Klipler artık bölüm numarasıyla değil **düzenin adıyla** isteniyor. Numaralar
bir kez kaydı: on dokuz düzen yirmi dörde çıkınca 9. bölüm voxel tahtası, 15.
bölüm arabalı sinema olmaktan çıktı — dosya yine beş video üretiyordu, sadece
`shop.mp4`'te mağaza yoktu.

İlk 5-10 videonun hiç izlenmemesi normal. Hesap ısınana kadar dağıtım
düşük olur, ve bu bir şeyin yanlış olduğu anlamına gelmez.

## Instagram Reels ve YouTube Shorts

Aynı dosyalar, aynı açıklamalar. TikTok'un logosu videoda olmadığı için
(indirmek yerine bizim mp4'ü yüklüyorsun) diğer platformlar cezalandırmıyor
— TikTok'tan indirilmiş, filigranlı bir video Reels'te neredeyse hiç
dağıtılmıyor. Her platforma **dosyayı** yükle.
