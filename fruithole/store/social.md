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

Beş klip var, beşi de 15 saniye, sessiz. Sıraya göre değil, **gün aşırı**
yükle; hepsini bir günde atmak hesabın dağıtımını bölüyor.

### space.mp4 — Cross, yörünge
İlk yüklenecek olan bu. En yoğun tarla, en çok "izlenmiş" hissi veriyor.
```
POV: you are the hole and the fruit has nowhere to go 🕳️🍉

#satisfying #mobilegame #asmrgaming #indiegame #fruitgame
```

### boss.mp4 — 10. bölüm, devasa çilek
```
Every 10th level ends in one giant fruit. You cannot take it early 👑🍓

#bossfight #mobilegaming #satisfying #indiedev #gaming
```

### shop.mp4 — Blocks, teknoloji mağazası
```
The whole shop floor went in. TVs, headphones, one fridge 📺🕳️

#satisfying #mobilegame #voxel #indiegame #oddlysatisfying
```

### drive.mp4 — Ring, arabalı sinema
```
Drive-in cleared. Burgers, fries and the parked cars 🍔🚗

#satisfying #mobilegaming #indiegame #gaming #fyp
```

### beach.mp4 — Pyramid, kumsal
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

## Ne kadar sıklıkla

Günde bir, en fazla. Beş klip beş gün eder; bitince
`node fruithole/make-clips.mjs --seconds 20` ile yenilerini üretiriz —
bölüm numarasını değiştirmek yeni bir tarla ve yeni bir tema demek.

İlk 5-10 videonun hiç izlenmemesi normal. Hesap ısınana kadar dağıtım
düşük olur, ve bu bir şeyin yanlış olduğu anlamına gelmez.

## Instagram Reels ve YouTube Shorts

Aynı dosyalar, aynı açıklamalar. TikTok'un logosu videoda olmadığı için
(indirmek yerine bizim mp4'ü yüklüyorsun) diğer platformlar cezalandırmıyor
— TikTok'tan indirilmiş, filigranlı bir video Reels'te neredeyse hiç
dağıtılmıyor. Her platforma **dosyayı** yükle.
