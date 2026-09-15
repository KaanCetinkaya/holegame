# Play Store Listelemesi — Slice Rush

> Bunları Play Console'a yapıştır. Karakter sınırları yazılı.

## Uygulama adı (≤ 30 karakter)

```
Slice Rush: Kes ve Geç
```

İngilizce mağazalar için `Slice Rush: Cut It All`. **Yayına almadan önce
Play'de mutlaka arat** — Fruit Hole'da bu kontrol atlandığı için 13 bin
yorumlu bir rakiple aynı ada düşüldü.

## Kısa açıklama (≤ 80 karakter)

```
Bıçağı yönet, önüne geleni ikiye böl, demire çarpma. Tek parmak.
```

## Tam açıklama (≤ 4000 karakter)

```
Bıçak kendi gidiyor. Sen sadece yüksekliğini ayarlıyorsun. 🔪

Parmağını yukarı aşağı kaydır — bıçak koridorda ilerlerken önüne çıkan her
şeyi ikiye böl. Karpuz, elma, portakal, pasta, fıçı, teneke, sandık… hepsi
gerçekten ikiye ayrılıyor: kesik yüzü görüyorsun, iki yarım havada dönerek
savruluyor.

🔪 KESME GERÇEK
Hazır bir "kırık model" ile değiştirmiyoruz. Nesne tam bıçağın geçtiği
yükseklikten bölünüyor — tepesinden kesersen bir kapak ve bir kâse, ortadan
kesersen iki eşit yarım. Aynı karpuzu iki kez aynı şekilde kesemezsin.

🔥 KOMBO
Arka arkaya kestikçe çarpan büyüyor ve her kesim daha çok para ediyor.
Güvenli sürmek seni bitirir; iyi sürmek kazandırır.

⛔ KIRMIZI DEMİRLER
Tavandan sarkan ve yerden çıkan demirler var. Aralarındaki boşluk, bıçağın
olması gereken yer. Çarparsan tur biter — ya baştan alırsın, ya kısa bir
video izleyip kaldığın yerden devam edersin.

🗡️ ALTI BIÇAK
Kestikçe para birikiyor. Bakır, zümrüt, safir, altın, obsidyen — her biri bir
öncekinden biraz daha uzun, yani dar boşluklarda daha erken değiyor.

⭐ YILDIZLAR
Her bölümde ne kadarını kestiğine göre bir, iki ya da üç yıldız. Hepsini
kesmek her zaman mümkün — mesele nereden geçtiğin.

⚡ TEK PARMAK, İNTERNETSİZ
Tek eksen, tek hareket. Bağlantı gerektirmiyor, kayıtların telefonunda kalıyor.

Bıçağı eline al.
```

## English

**App name**
```
Slice Rush: Cut It All
```

**Short description**
```
Steer the blade, cut everything in half, dodge the bars. One finger.
```

**Full description**
```
The blade flies itself. All you do is set its height. 🔪

Slide your finger up and down and cut everything the blade meets as it runs
down the corridor. Melons, apples, oranges, cake, barrels, cans, crates —
all of them really do come apart: you see the cut face, and the two halves
tumble away.

🔪 THE CUT IS REAL
Nothing is swapped for a pre-broken model. The object is split at exactly
the height the blade passed through — cut near the top and you get a cap and
a bowl, cut through the middle and you get two even halves. You cannot cut
the same melon the same way twice.

🔥 COMBO
Cut without missing and the multiplier climbs, and every cut is worth more.
Playing safe ends the run; playing well pays for it.

⛔ RED BARS
Bars hang from above and stand up from the floor. The gap they leave is
where the blade has to be. Hit one and the run is over — start again, or
watch a short video and carry on from where you were.

🗡️ SIX BLADES
Every cut earns coins. Copper, emerald, sapphire, gold, obsidian — each
reaches a little further than the last, which is worth having in the tight
gaps late on.

⭐ STARS
One, two or three per level depending on how much you cut. Clearing
everything is always possible — the question is the line you take.

⚡ ONE FINGER, FULLY OFFLINE
One axis, one motion. No connection needed, and your save lives on your
phone.

Pick up the blade.
```

## Kategori / etiketler

- Kategori: **Oyunlar → Aksiyon** (ya da Gündelik; tür Play'de ikisinde de var)
- Etiketler: kesme, bıçak, refleks, tek parmak, offline, arcade, satisfying

## İçerik derecelendirmesi

Şiddet yok (kesilen şeyler meyve ve kutu), korku yok, kumar yok, kullanıcılar
arası etkileşim yok. **Reklam içeriyor** (yalnızca ödüllü video). Uygulama içi
satın alma **yok**.

## Veri güvenliği formu

- Toplanan kişisel veri: **yok** (ilerleme `localStorage`'da, cihazda kalıyor)
- Üçüncü taraf: **Google AdMob** (reklam kimliği ve ölçüm verisi)
- Gizlilik politikası: Fruit Hole'unkiyle aynı sayfa ya da `docs/` altına
  ikinci bir sayfa

## Hazır görseller (bu klasörde)

- `icon-512.png` — mağaza ikonu, tam 512×512 (zorunlu)
- `feature-1024x500.png` — öne çıkan grafik (zorunlu)
- `1-cut.png` — karpuz tam ikiye ayrılırken
- `2-combo.png` — kombo çarpanı ekranda
- `3-bars.png` — kırmızı demirler ve aradaki boşluk
- `4-clear.png` — bölüm sonu, üç yıldız
- `5-blades.png` — bıçak dükkânı
- `6-menu.png` — ana menü

Telefon görüntüleri 1080×1920, `tablet/` içindekiler 1440×2560. Aramada
yalnızca ilk iki kare görünüyor, ve o ikisi oyunun ne olduğunu anlatmalı:
**bir kesme anı, bir kombo.**

Görseller `scratchpad/slshots.mjs` ile üretiliyor; oyun değişince komutu
yeniden çalıştırmak yeterli.

## Yayın öncesi kontrol listesi

1. `slicer/index.html` içinde `ADS_TESTING = false`
2. `AD_UNITS.rewarded` gerçek AdMob birimiyle değiştirilmeli
3. `patch-manifest.mjs` içindeki `slicer.appId` gerçek AdMob uygulama
   kimliğiyle değiştirilmeli (şu an Google'ın test kimliği)
4. Uygulama adı Play'de tekrar aratılmalı
5. `app-version.json` → `slicer.versionCode` artırılmalı
