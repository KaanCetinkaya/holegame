# Kapalı test için testçi çağrısı — Motor Works

Yapısı Fruit Hole'unkinin aynısı (`fruithole/store/production-access.md`
→ "Ne yazılacak"): kısa, İngilizce, karşıdakine ne yapacağını söyleyen,
ve **bağlantı vermiyor, adres istiyor**.

Uygulama kimliği: `com.kaancetinkaya.motorworks`

Bir farkı var ve çağrıya giriyor: boşta çalışan bir oyunda testçiden
istenen şey "yarım saat oyna" değil, **kapatıp ertesi gün aç**. Çevrimdışı
kazanç, günlük ödül ve bildirim ancak öyle denenir, ve bugüne kadar
yakalanan hataların ikisi tam oradaydı.

---

## r/alphaandbetausers

Başlık:

```
[Android] Motor Works - an idle car factory where the bottleneck is the puzzle, looking for closed testers
```

Gövde:

```
I've been building this on my own. It's an idle factory: four stations
in a line — press, paint, assembly, delivery — and parts move down the
chain. The whole game is finding which station everything else is
waiting on and spending there, because upgrading any other one buys you
nothing. The game names it for you, so it is a decision rather than a
guessing game.

Every station doubles at 10, 25, 50, 100 levels and so on, and the
factory visibly re-fits itself as it passes them: iron, steel, polished
steel, chrome, gold. When a branch stops paying you hand it over and
start a new one with a permanent multiplier.

It's on Google Play's closed test, which means I have to add people by
hand. Comment or DM me the Gmail address you use on your phone and I'll
put you on the list tonight. It has to be the account your phone's Play
Store is signed in to, otherwise the invite just 404s for you.

What I actually need from an idle game is the thing a single session
cannot show: play for ten minutes, close it, and open it again the next
day. Offline earnings, the daily reward and the notification only get
tested that way. If a number looks wrong when you come back, screenshot
it — that is exactly how the last two bugs here were found.

Free, no signup, works offline.
```

## r/TestMyApp

Aynı metin, **ilk iki paragraf atılarak**.

## r/AndroidGaming

**Önce kuralları oku** — çoğu büyük oyun alt forumu kendi oyununu
tanıtmayı yasaklıyor ya da haftanın bir gününe bağlıyor.

## r/incremental_games

Bu oyunun asıl kitlesi burası ve Reddit'teki en bilgili geri bildirim
oradan geliyor — ama o kitle dengeyi ilk yarım saatte okuyor, yani
övgü de eleştiri de sert olur. Kuralları yine önce oku; birçok alt
forumun tanıtım için ayrı bir günü var.

---

## Telegram, karşılıklı test grupları ve Türkçe tanıdıklar

İkisi de iki testi birden kapsıyor, o yüzden tek yerde duruyor:
`slicer/store/testers.md` → "Telegram / karşılıklı test grupları".

## Sorun bildiren birine ne söylenecek

Aynı sebeple o dosyada: `slicer/store/testers.md` → "Sorun bildiren
birine ne söylenecek". Kısası — menüdeki sürüm yazısına beş hızlı
dokunuş teşhis ekranını açıyor, **Copy** hepsini panoya alıyor.

## 7 Kasım: üretim başvurusu reddedildi — "daha fazla test"

5 Kasım'da yapılan başvuru 7 Kasım 05:08'de incelendi: *"üretim kanalına
erişebilmeniz için oyununuzun daha fazla test edilmesi gerekiyor."* Yeni
şart: **inceleme tarihinden itibaren** 12 testçiyle 14 gün daha kapalı
test. 9 Kasım'da sayaç "12 test kullanıcısı kesintisiz olarak 2 gündür
kayıtlı" diyor; en erken yeniden başvuru **21 Kasım**.

Sebep tahmin değil, sayıda duruyordu (`fruithole/store/ads.md`, 5 Kasım):
12 testçi kayıtlıydı ama 28 günde yalnızca **2 cihaz** oyunu açmıştı.
Slice Rush'ta 12'nin 9'u açmıştı. Yani eksik olan kayıt değil kullanım.

Bu 14 günde yapılacaklar:

1. Testçilerin oyunu **açması** — kayıt yetmiyor. Gruplara, oyunu birkaç
   gün aralıkla açıp birkaç dakika oynamalarını isteyen bir mesaj.
2. Test içinde **bir güncelleme** (versionCode 8 hazır): başvuruda
   "testçi geri bildirimiyle neyi değiştirdiniz" sorusunun cevabı olur.
3. Yeniden başvuruda Play Console'un kendi sayıları (etkin testçi,
   açılış) önce kontrol edilir; 2 cihazla başvurmak aynı cevabı alır.
