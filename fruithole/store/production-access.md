# Üretim erişimi başvurusu — hazır cevaplar

Play Console → **Kontrol paneli → Üretim → Üretime başvur**. Düğme, 12
testçiyle kesintisiz 14 gün dolmadan aktifleşmiyor.

## 12 Eylül'deki cevap: ret değil, sayaç

Konsoldaki kırmızı kutu "üretim kanalına erişebilmeniz için oyununuzun daha
fazla test edilmesi gerekiyor" diyor ve bu bir kalite reddi gibi okunuyor.
Değil. Altındaki listede ilk iki madde üstü çizili:

```
✓ Kapalı test sürümü yayınlayın
✓ En az 12 test kullanıcısının kapalı testinize kaydolmasını sağlayın
○ İnceleme tarihinden itibaren en az 12 test kullanıcısıyla 14 gün daha
  kapalı test yapın
  "An itibarıyla 12 test kullanıcısı kesintisiz olarak 12 gündür kayıtlı"
```

İnceleme tarihi 12 Eylül 22:41 ve o tarih sayacı **sıfırlamış**. 25 Eylül
itibarıyla 12/14 gün — yani iki gün kalmış.

Buradaki kelime **kesintisiz**. Bir testçi çıkarsa sayaç baştan başlıyor. Bu
yüzden sayaç dolana kadar test kullanıcıları sayfasında hiçbir şey
değiştirilmiyor; kaydetmek testi yeniden incelemeye yolluyor.

Google kapalı testle ilgili birkaç soru soruyor ve bunları **başvuru
formunun içinde**, sayaç dolduktan sonra yanıtlıyorsun. Aşağıdakiler
kopyalanmaya hazır. **`[…]` ile işaretli yerleri sen doldurmalısın** —
oralar depodan bilinemeyecek şeyler, uydurmak da başvurunun reddedilme
sebebi olur.

Cevaplar İngilizce yazıldı; form İngilizce soruyor ve İngilizce yanıt
bekliyor.

---

## 1. Testçileri nasıl buldun?
*(How did you recruit your testers?)*

```
[…]
```

**Ne yazmalı:** kaç kişi, nereden. Gerçekte ne yaptıysan onu yaz —
arkadaş/aile, bir Discord veya Telegram grubu, üniversiteden tanıdıklar,
r/AndroidGaming gibi bir topluluk. Google burada bir pazarlama planı
aramıyor, testçilerin gerçek insanlar olduğunu ve oyunu gerçekten
oynadığını görmek istiyor. Sahte hesap ya da "kendim 12 hesap açtım"
cevabı doğrudan ret.

Bildiğimiz tek kesin sayı: **12 testçi, kesintisiz kayıtlı.**

---

## 2. Geri bildirimi nasıl topladın?
*(How did you gather feedback from your testers?)*

```
Feedback came in three ways.

Testers reported problems directly to me over WhatsApp and in person,
mostly as screenshots of whatever had gone wrong on their screen. Those
screenshots turned out to be the most valuable channel by a distance —
two of the bugs below were invisible to every automated check I had, and
were only ever caught because someone photographed a phone.

I played the closed-test build on a physical device myself, through the
level range testers were actually reaching, rather than only in a
desktop browser.

Alongside that I ran an instrumented build of the game headlessly to
measure the things opinion cannot settle — how much of a field a player
has to clear before a giant fruit opens, how many draw calls each level
costs, whether the menu buttons are reachable at a given screen size.
```

**Not:** WhatsApp/yüz yüze kısmını kendi durumuna göre düzelt. Formda
"anket yaptım", "Google Forms kullandım" gibi yapmadığın bir şey yazma.

---

## 3. Geri bildirimle ne yaptın?
*(How did you act on the feedback? What changed?)*

```
Six things changed as a direct result of the closed test.

1. Difficulty. Testers were clearing late levels without effort. I
measured it and the size gate had effectively stopped existing: by
level 36 the hole started large enough to swallow the biggest fruit for
free. The hole now grows more slowly and opening a giant costs between
24% and 35% of the field on every level from 1 to 45, measured rather
than estimated.

2. The banner ad covered the entire menu bar. Found from a tester's
photo. It could not be reproduced in a browser, because there is no ad
there. Everything anchored to the bottom of the screen is now spaced off
the banner's real height, reported by the ad SDK.

3. That fix then hid the Play button behind the bar it was meant to
clear. The layout read the bar's height once at startup, before its
icons had rendered, and got 82px against a real 108px. It is measured
with a ResizeObserver now, and the test asserts overlap rather than
mere clearance.

4. The board went blank while the interface kept running, usually after
an ad. Android drops the WebGL context when it wants the memory back and
nothing throws — the canvas simply stops drawing while the clock keeps
spending the player's time. The game now pauses when the context is
lost and redraws when it returns.

5. The countdown kept running behind fullscreen ads, phone calls and app
switches, so players came back to a level they had already lost. The run
now pauses whenever the app is backgrounded.

6. The "watch an ad for 15 more seconds" button could die permanently.
It waited on the ad-dismissed event alone, so an ad that showed but
never closed itself left the player on the lost screen with a dead
button and no way out but killing the app. Every exit path is handled
now, with a watchdog for the case where the ad SDK reports nothing.
```

---

## 4. Neden üretime hazır?
*(Why is your app ready for production?)*

```
The closed test did what a closed test is for: it found the problems a
browser cannot show. All six are fixed, and each is covered by an
automated check that runs against the packaged build, so they cannot
come back silently.

The game is content-complete — 45 levels across nineteen layouts and
nine settings, ten hole skins, upgrades, boosters, daily missions and
achievements. It runs fully offline, stores nothing off the device, and
collects no personal data; progress lives in local storage.

Ads are banner, interstitial and an optional rewarded video, all through
AdMob, with an in-app purchase that removes them.
```

---

## Formu göndermeden önce

- [ ] **`.aab`'yi `npm run release:fruithole` ile üret.** Sıradan
      `aab:fruithole` **test reklamı** koyuyor; üretime o giderse iki
      hafta bekleyip sıfır kazanırsın. Derleme çıktısı `REKLAMLAR
      GERÇEK` yazmalı.
- [ ] O `.aab`'yi **kendi telefonuna kurma** — kendi canlı reklamına
      tıklamak AdMob hesabını kapattırır.
- [ ] `app-version.json` içinde `versionCode` bir artmış olmalı.
- [ ] Mağaza görselleri güncel mi: `fruithole/store/` içindeki 7 telefon
      + `tablet/` içindeki 7 tablet karesi ve feature görseli **hâlâ
      Play'e yüklenmedi**, listede eski meyvelerin olduğu kareler duruyor.
- [ ] Veri güvenliği formu ve içerik derecelendirmesi dolu mu
      (`listing-en.md`'de ne yazılacağı duruyor).

## Sayaç hakkında

Şart **"kesintisiz 14 gün, en az 12 testçi"**. Testçi sayısı 12'nin
altına düşerse 14 gün **sıfırdan** başlıyor — kimseyi listeden çıkarma ve
kimse testten ayrılmasın. Yeni sürüm yüklemek sayacı etkilemiyor;
sayaç testçilerin kayıtlı kalmasıyla ilgili, hangi sürümü oynadıklarıyla
değil.

**24 Eylül 2026: Kaan testçi sayısını kontrol etti, 12'nin üstünde.** Sayaç
işliyor ve ~27 Eylül'de doluyor. Bu satır burada, çünkü sayı yalnızca Play
Console'da görünüyor ve buradan okunamıyor — yazılmazsa her oturumda yeniden
sorulur, nitekim soruldu.

## 29 Eylül: 12 kayıtlı, 5 kurulu

Kapalı test sayfası iki ayrı sayı gösteriyor ve karıştırılıyor:

| Sayı | Ne demek | Şarta etkisi |
|---|---|---|
| **Kaydolan testçi** | listedeki e-postalardan kaç kişi bağlantıyı açıp katıldı | **14 günlük sayacı bu besliyor** |
| **İndiren kişi** | kaçı oyunu telefonuna gerçekten kurdu | sayaca girmiyor |

Yani 5 indirme sayacı durdurmuyor — 29 Eylül itibarıyla sayaç dolmuş ve
üretim başvurusu gönderilmiş durumda. Ama başvuruyu **bir insan** okuyor ve
"12 kişi kaydoldu, 5'i açtı" tablosu, testin gerçekten yapılıp yapılmadığı
sorusuna kötü bir cevap. Formun 2. ve 3. maddesi zaten testçilerden gelen
geri bildirimi anlatıyor; onu destekleyen tek şey oynayan insan sayısı.

Kaldıraç **konsol değil**, kaydolmuş ama kurmamış yedi kişi. Test
kullanıcıları sayfasına dokunulmuyor: orada kaydetmek testi yeniden
incelemeye yolluyor ve sayacı riske atıyor.

WhatsApp/Telegram'a olduğu gibi atılacak metin:

```
Selam, oyunun test grubuna kayıtlısın ama henüz kurmamışsın gibi
görünüyor — Google'a "12 kişi kaydoldu, 5'i oynadı" diye gidiyor ve
oyunu yayınlayabilmem tam da buna bakıyor.

İki dakikalık iş:
1. Şu bağlantıyı aç: [kapalı test bağlantısı]
2. "Download it on Google Play" de, kur.
3. Beş on bölüm oyna, takıldığın ya da tuhaf gelen bir şey olursa
   ekran görüntüsü at.

Silmeni istemiyorum, bir hafta telefonda kalsın yeter. Sağ ol.
```

`[kapalı test bağlantısı]`: Play Console → Test → Kapalı test → **Testçiler**
sekmesinin altındaki "Katılma bağlantısı"nı kopyala. Sayfada hiçbir şeyi
değiştirme, yalnızca bağlantıyı al.

Bir de sürüm 40 bu akşam çıkıyor ve **donmayı düzelten sürüm o**. Kurmuş
olan beş kişi bugüne kadar donan bir oyun oynadı; mesajı 40 yayına
girdikten sonra atmak, gelen ilk izlenimi de düzeltiyor.

## Yeni testçi bulmak

Önce kaybetmemek: şart **"kesintisiz 14 gün, en az 12 testçi"** ve testçi
**çıkarmak** sayacı sıfırlıyor. Eklemek sayacı düşürmüyor, ama listeyi her
değiştirdiğinde sayfayı kaydediyorsun; bu yüzden ekleme **toplu** yapılıyor,
birer birer değil.

### Önce mekanizma: Google Grubu

Test kullanıcıları sekmesinde iki seçenek var — **e-posta listesi** ve
**Google Grupları**. Bugün liste kullanılıyor, ve her yeni kişi Play
Console'a girip listeyi düzenlemek demek.

Bir Google Grubu kurulursa (groups.google.com, "Yeni grup", herkese açık
katılım), Console'a bir kez o grubun adresi yazılıyor ve bir daha
dokunulmuyor. Sonrasında testçi eklemek **gruba üye eklemek** — Play
Console'a hiç girilmiyor, yani kaydetme riski de yok.

Bu, listenin kendisinden daha değerli: asıl istenmeyen şey testçi eklemek
değil, testçi eklemek için o sayfayı açmak.

Grubun ikinci ve daha büyük işi: **kapalı testin katılma bağlantısı
listede olmayan birinde çalışmıyor.** Yabancı bağlantıya bastığında "bu
uygulama sizin için kullanılamıyor" görüyor. Yani e-posta listesiyle
yürürken hiçbir yere "şuraya tıkla ve test et" yazılamıyor — çağrı ancak
"bana gmail adresini yolla" olabiliyor. Grup açık katılımlıysa yabancı
önce gruba katılıyor ve bağlantı çalışır hâle geliyor.

**Sırası önemli ve bugün yapılmıyor.** Listeyi e-postadan gruba çevirmek,
mevcut on iki kişi grupta değilse onları listeden düşürüyor — ve sayı
12'nin altına inerse 14 günlük sayaç sıfırdan başlıyor. Üretim başvurusu
incelemedeyken alınacak bir risk değil. Doğru sıra:

1. Üretim başvurusu sonuçlansın.
2. Grup kurulsun, **mevcut on iki adres gruba eklensin.**
3. En son Console'da liste gruba çevrilsin.

Bu sırayla sayı bir an bile düşmüyor.

### Sonra insan: nereden

Sırayla, en güvenilirden en zayıfa:

1. **Tanıdıklar.** Bugüne kadar çalışan tek kanal bu ve kurulum oranı da en
   yüksek burada. Zayıf yanı: on iki kişiden sonra bitiyor.
2. **TikTok hesabı.** Klipler zaten gidiyor ve izleyen insanlar oyunu
   görmüş oluyor — yani en sıcak kitle orada. Profil açıklamasına bir
   satır ve sabitlenmiş bir videonun altına bir yorum yetiyor.
3. **Reddit.** r/AndroidGaming, r/alphaandbetausers, r/TestMyApp. Kurallar
   alt forumdan alt foruma değişiyor, "ben yaptım" tarzı gönderilere izin
   verilen günler var. Buradan gelen kişi oyunla ilgilenen kişi.
4. **Karşılıklı test grupları** (Telegram/Discord'da "closed testing
   exchange"). On iki kişiyi hızlı buluyor, ama gelen kişi oyunu oynamıyor
   — kurup bırakıyor. Google'ın istediği şey **gerçek test** ve başvuru
   formunda "testçileri nasıl buldun" diye soruyor. Riski şu: sahte
   görünen bir test doğrudan ret sebebi. Kullanılacaksa dürüstçe yazılır.

### Ne yazılacak

Kısa, İngilizce (mağaza ve klipler zaten İngilizce), ve karşıdakine ne
yapacağını söyleyen. **Bağlantı verilmiyor, adres isteniyor** — kapalı
testin katılma adresi listede olmayan birinde açılmıyor.

**r/alphaandbetausers** — başlık:
`[Android] Peelo: Fruit Hole - a one-finger arcade game, looking for closed testers`

```
I've been building this on my own for a few months. You steer a hole
around a field of fruit and swallow what fits; the more you eat the
bigger you get, until the melons go down too. 48 levels, each one a
different shape on a different ground, and nothing in it is an image
file - the fruit, the floors and the objects are all drawn in code.

It's on Google Play's closed test, which means I have to add people by
hand. Comment or DM me the Gmail address you use on your phone and I'll
put you on the list tonight.

What I actually need is people who install it and play past level 10 -
the first few levels are easy and everything interesting starts after
them. If something breaks, freezes or just feels wrong, tell me. Two of
the bugs I fixed this month only turned up because someone photographed
their screen.

Free, no signup, works offline.
```

**r/TestMyApp** — aynı metin, ilk paragraf atılarak. Orada oyunun ne
olduğu değil, testin ne istediği okunuyor.

**r/AndroidGaming** — **önce kenar çubuğundaki kuralları oku.** Çoğu
büyük oyun alt forumu kendi oyununu tanıtmayı ya tamamen yasaklıyor ya
da haftanın belirli bir gününe bağlıyor ("Self-promotion Saturday"
gibi). Kuralı çiğneyen gönderi siliniyor ve hesap kısıtlanıyor; buradan
gelecek beş kişi için o riske girilmez. İzin varsa metin yukarıdakinin
aynısı.

Gelen adresler biriktirilip **tek seferde** ekleniyor.

Türkçe konuşulan tanıdıklara giden metin `29 Eylül` başlığının altında.

## Kapalı testin zaman çizelgesi

Başvuruda tarih sorulursa depo geçmişinden:

| Tarih | Ne oldu |
|---|---|
| 30 Ağu | 1.4 (10) kapalı teste çıktı |
| 31 Ağu | 1.4.1 (11) — banner menü şeridini kapatıyordu |
| 1 Eyl | 1.4.2 (12) — düzeltme Play düğmesini gizlemişti |
| 2 Eyl | 1.5 (13) — boyut kapısı + boş tarla |
| 3 Eyl | 1.5 (13) yayınlandı |
| 3 Eyl | Saat reklam arkasında işliyordu, ödüllü reklam askıda kalıyordu |
| 5 Eyl | Reklam kipi derleme komutuna bağlandı |
