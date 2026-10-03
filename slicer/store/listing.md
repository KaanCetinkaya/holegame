# Play Store Listelemesi — Slice Rush

> Bunları Play Console'a yapıştır. Karakter sınırları yazılı.

**Oyunun arayüzü İngilizce.** Eylül 2026'da Türkçeden çevrildi: mağaza metni
İngilizceydi ama oyun açılınca "BÖLÜM 1" yazıyordu. Hedef ülke ABD ve Avrupa
(sebebi `fruithole/store/social.md` → "Neden burası": Türkiye'de eCPM beşte
bir). Bu yüzden **Türkçe listeleme açılmıyor** — açılırsa oyun Türkçe
sanılır.

## Uygulama adı (≤ 30 karakter)

```
Slice Rush: Cut It All
```

**Yayına almadan önce Play'de mutlaka arat.** Fruit Hole'da bu kontrol
atlandığı için 13 bin yorumlu bir rakiple aynı ada düşüldü.

## Kısa açıklama (≤ 80 karakter)

```
Steer the blade, cut everything in half, dodge the bars. One finger.
```

## Tam açıklama (≤ 4000 karakter)

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
Every cut earns coins. Steel, copper, emerald, sapphire, gold, obsidian —
each reaches a little further than the last, which is worth having in the
tight gaps late on.

🎯 GOALS
Nine of them, and every one pays coins: a hundred cuts, an unbroken chain, a
week of coming back. The second half of each pair only appears once you have
taken the first.

⭐ STARS
One, two or three per level depending on how much you cut. Clearing
everything is always possible — the question is the line you take. The level
map keeps every score, so you can go back for a star you left behind.

🎁 A REWARD EVERY DAY
Come back tomorrow and the next reward is bigger — seven days in a row and
it is a blade's worth of coins.

⚡ ONE FINGER, FULLY OFFLINE
One axis, one motion. No connection needed, no account, and your save lives
on your phone.

Pick up the blade.
```

Bu metnin karakter sayısı ~1.700, sınır 4.000. Yeri var; doldurmak zorunlu
değil ve Fruit Hole'un 3.989'u bir erdem değil.

## Kategori / etiketler

- Kategori: **Oyunlar → Aksiyon** (ya da Gündelik; tür Play'de ikisinde de var)
- Etiketler: slicing, knife, reflex, one finger, offline, arcade, satisfying

## İçerik derecelendirmesi

Şiddet yok (kesilen şeyler meyve ve kutu), korku yok, kumar yok, kullanıcılar
arası etkileşim yok. **Reklam içeriyor** (yalnızca ödüllü video). Uygulama içi
satın alma **yok**.

## Veri güvenliği formu

- Toplanan kişisel veri: **yok** (ilerleme `localStorage`'da, cihazda kalıyor)
- Üçüncü taraf: **Google AdMob** (reklam kimliği ve ölçüm verisi)
- Gizlilik politikası: **`docs/privacy-slicerush.html`**
  → `https://kaancetinkaya.github.io/holegame/privacy-slicerush.html`

Fruit Hole'unki kullanılmıyor: o sayfa banner, geçiş reklamı ve uygulama içi
satın almadan bahsediyor, Slice Rush'ta üçü de yok. Yanlış beyan Play'in veri
güvenliği formunu yalanlar.

## Hazır görseller (bu klasörde)

- `icon-512.png` — mağaza ikonu, tam 512×512 (zorunlu)
- `feature-1024x500.png` — öne çıkan grafik (zorunlu)
- `1-cut.png` — karpuz tam ikiye ayrılırken
- `2-combo.png` — kombo çarpanı ekranda
- `3-bars.png` — kırmızı demirler ve aradaki boşluk
- `4-clear.png` — bölüm sonu, üç yıldız
- `5-blades.png` — bıçak dükkânı
- `6-map.png` — bölüm haritası, yarısı yıldızlı
- `7-goals.png` — hedefler, ikisi alınmayı bekliyor
- `8-menu.png` — ana menü

Telefon görüntüleri 1080×1920, `tablet/` içindekiler 1440×2560. Aramada
yalnızca ilk iki kare görünüyor, ve o ikisi oyunun ne olduğunu anlatmalı:
**bir kesme anı, bir kombo.**

Görseller `scratchpad/slshots.mjs` ile üretiliyor; oyun değişince komutu
yeniden çalıştırmak yeterli.

**Ama şu an bilerek eski.** 24 Eylül 2026: grafikler üst üste değişiyor (ton
eşlemesi, kenar şeritleri, ortam haritası, bıçağın malzemesi) ve her
değişiklikte on beş kareyi yeniden çekmek yedi dakika. Görünüm oturunca bir
kez çekilecek. Yükleme öncesi son işlerden biri bu — mağazaya oyunun eski
hâlini göstermemek için.

**Kare üstündeki yazıda sayı verme.** Bir tur "on beş bölüm" yazdı; oyunda
öyle bir sınır yok — `buildCourse(n)` her n için parkur üretiyor. Testler
1-15 arasını ölçtüğü için öyle sanılmıştı.

## Yayın öncesi kontrol listesi

0. **Mağaza görsellerini yeniden çek** (`node scratchpad/slshots.mjs`) —
   depodakiler grafik değişikliklerinden eski.
1. **`npm run release:slicer`** ile derle. `aab:slicer` değil: `release:`
   olan `ADS_TESTING`'i kapatıyor, öteki test reklamıyla derliyor ve derleme
   yine başarılı olduğu için bu ancak AdMob panelinde aylar sonra sıfır
   görerek fark edilir.
2. `AD_UNITS.rewarded` gerçek AdMob birimiyle değiştirilmeli (`slicer/index.html`)
3. `patch-manifest.mjs` içindeki `slicer.appId` gerçek AdMob uygulama
   kimliğiyle değiştirilmeli (şu an Google'ın test kimliği)
4. Uygulama adı Play'de tekrar aratılmalı
5. `app-version.json` → `slicer.versionCode` artırılmalı, yükledikten sonra
   `npm run uploaded:slicer`
6. Gizlilik politikası sayfası yayında mı (`docs/privacy-slicerush.html`)
