# Üretim erişimi başvurusu — hazır cevaplar

Play Console → **Kontrol paneli → Üretim → Üretime başvur**. Düğme, 12
testçiyle kesintisiz 14 gün dolmadan aktifleşmiyor.

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
