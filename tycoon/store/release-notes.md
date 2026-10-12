# Motor Works — sürüm notları

Play Console'a yapıştırılacak metin burada. Dahili test sürümü için not
zorunlu değil ama yazılırsa test edenin neye bakacağı belli oluyor.

Not alanının sınırı dil başına **500 karakter**. Aşağıdakiler sınırın
altında; karakter sayıları başlıkların yanında.

---

## versionCode 4 — v1.0 (dahili test)

### İngilizce — `en-US` (368 karakter)

```
Everything that makes a factory feel alive, in one update.

• Background music and a yard that changes with every branch
• A customer car drives in — tap it before it leaves
• Daily missions, a tutorial, and managers with names and perks
• A backup code, so your factory survives a new phone
• Brighter lighting, grass, and a worker you can actually see
```

### Türkçe — `tr-TR` (382 karakter)

```
Fabrikayı canlı hissettiren her şey tek güncellemede.

• Arka plan müziği ve her şubede değişen bir önlük
• Önlüğe müşteri arabası giriyor — gitmeden dokun
• Günlük görevler, öğretici, adı ve yeteneği olan müdürler
• Yedek kodu: fabrikan yeni telefonda da duruyor
• Daha aydınlık ışık, çim, ve görülebilen bir işçi
```

---

## Kısa sürüm (tek satır isteyen yerler için)

```
Music, daily missions, a customer to tap, manager perks, and a backup code.
```

```
Müzik, günlük görevler, dokunulacak müşteri, müdür yetenekleri ve yedek kodu.
```

---

## Bu sürümde ne var (iç liste — Play'e girmiyor)

Dahili testte bakılacak şeyler:

1. **Müzik** — ilk dokunuşta başlıyor, SOUND: OFF susturuyor, telefon
   cebe girince kesiliyor.
2. **Müşteri arabası** — 2-3 dakikada bir geliyor, 16 saniye bekliyor.
   Dokununca 30 saniyelik üretim kadar para veriyor. Kaçırmanın cezası yok.
3. **Günlük görevler** — hedefler ekranının üstünde üç görev, gün dönünce
   yenileniyor.
4. **Şube yerleri** — her prestijte başka bir yer: çayır, çöl, tundra,
   liman, kül. Gökyüzü, zemin ve ağaç renkleri değişiyor.
5. **Müdürler** — dördünün adı, rolü ve bir yeteneği var.
6. **Öğretici** — dört adım, her biri oyuncunun hareketiyle kapanıyor.
7. **Yedek kodu** — Menü → BACKUP. Kodu kopyala, başka bir cihaza yapıştır.
8. **Bildirim** — depo dolunca ya da hat boşta kalınca.
9. **Mağaza** — üç ürün. **Play Console'da ürün kimlikleri açılmadan
   satın alma çalışmaz**, mağaza ekranı boş görünür:
   `motorworks_double`, `motorworks_managers`, `motorworks_skip12`.
10. **Liderlik tablosu** — Play Games bağlanmadan düğme görünmüyor; bu
    beklenen davranış.
