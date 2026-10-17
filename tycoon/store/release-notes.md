# Motor Works — sürüm notları

Play Console'a yapıştırılacak metin burada. Dahili test sürümü için not
zorunlu değil ama yazılırsa test edenin neye bakacağı belli oluyor.

Not alanının sınırı dil başına **500 karakter**. Aşağıdakiler sınırın
altında; karakter sayıları başlıkların yanında.

---

## Bu sürüm (sürüm kodu 8)

### İngilizce — `en-US` (500 karakter)

```
Your factory is harder to lose, and the return screen no longer rounds twenty hours down to four.

• A damaged save falls back to a backup instead of starting you over
• The game says so if it cannot save — a full phone used to be silent
• Back closes the panel you are on instead of quitting
• A failed ad no longer costs you the offline x2
• Time away is the real time, and names the production the yard lost
• One button collects every finished goal
• The menu names the build that is on the phone
```

### Türkçe — `tr-TR` (469 karakter)

```
Fabrikanı kaybetmek zorlaştı, ve dönüş ekranı yirmi saati dörde yuvarlamıyor artık.

• Bozulan kayıt seni sıfırdan başlatmıyor, yedekten dönüyor
• Oyun hiç kaydedemiyorsa söylüyor — dolu telefon eskiden sessizdi
• Geri tuşu oyundan çıkmıyor, açık perdeyi kapatıyor
• Açılmayan reklam artık çevrimdışı ikiye katlamayı yakmıyor
• "Uzak kalınan süre" gerçek süre; boşa giden üretimi de yazıyor
• Biten bütün ödüller tek düğmeyle alınıyor
• Menünün altında derleme numarası
```

---

## Önceki sürüm (sürüm kodu 7)

### İngilizce — `en-US` (415 karakter)

```
Your worker finally has a job after the managers arrive, and two vehicle tiers that were unreachable are now reachable.

• Stand your worker at a station — it runs 25% faster while he is there
• Sports and Luxury now actually unlock, and the panel names what is holding them back
• Three new research branches for the long game
• Ten branch locations instead of five
• Turkish, and a smaller-screen layout that fits
```

### Türkçe — `tr-TR` (370 karakter)

```
Müdürler geldikten sonra işçinin nihayet bir işi var, ve hiç açılmayan iki araç kademesi artık açılıyor.

• İşçiyi bir istasyonun başına park et — orada durduğu sürece %25 hızlı
• Spor ve Lüks gerçekten açılıyor; panel onları neyin beklettiğini söylüyor
• Uzun oyun için üç yeni araştırma dalı
• Beş yerine on şube yeri
• Türkçe arayüz ve küçük ekranlara sığan bir düzen
```

---

## Kısa sürüm (tek satır isteyen yerler için)

```
A damaged save no longer costs you the factory, and time away is the real time.
```

```
Bozulan kayıt artık fabrikaya mal olmuyor, ve uzak kalınan süre gerçek süre.
```

---

## Bu sürümde ne var (iç liste — Play'e girmiyor)

Dahili testte bakılacak şeyler:

1. **Kayıt güvenliği** — her yazma bir öncekini ikinci bir yuvaya itiyor
   (`motorworks_save_bak`). Ana yuva bozulursa oyun ondan dönüyor ve
   kırmızı şeritle söylüyor. Bozuk veri silinmiyor,
   `motorworks_save_bozuk`'a alınıyor.
2. **Kaydedilemiyor uyarısı** — telefonun depolaması doluysa artık
   sessiz kalmıyor. (Denemek için: tarayıcıda `jeKayitBoz()`.)
3. **Dönüş ekranı** — tavanı aşan yoklukta "Uzak kalınan süre" gerçek
   süreyi yazıyor, alt satır önlüğe sığmayan üretimi söylüyor.
4. **Mağaza** — Play ürün kimliklerini tanımadığı sürece satırlar
   "KAPALI" görünüyor ve dokunulmuyor. **Ürünler Play Console'da
   açılınca** fiyatlar oradan gelecek:
   `motorworks_double`, `motorworks_managers`, `motorworks_skip12`.
5. **Türkçe** — hedefler ekranının başlıkları, reklam düğmesinin
   reklamdan sonraki hâli, saat birimleri ("2sa 0dk"), kademe bildirimi.
6. **Liderlik tablosu** — Play Games bağlanmadan düğme görünmüyor; bu
   beklenen davranış.
7. **Açılmayan reklam** — uçak kipinde dönüş ekranındaki "×2 al"a
   dokun: ekran kapanmamalı, para durmalı, düğmede "REKLAM AÇILMADI"
   yazmalı. Hız kutusunda aynı cümle kasanın üstünde belirmeli.
   Eskiden ikisi de sessizdi ve dönüş ekranı hakkı yakıyordu.

Bir önceki sürümden devam eden kontroller: müzik, müşteri arabası,
günlük görevler, şube yerleri, müdür yetenekleri, öğretici, yedek kodu,
depo bildirimi.
