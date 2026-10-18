# Slice Rush — sürüm notları

Play Console'a yapıştırılacak metin burada. Not alanının sınırı dil
başına **500 karakter**; karakter sayıları başlıkların yanında.

Sürüm 1 ve 2 yüklendiğinde burası yoktu ve not yazılmadı. Oyun o günden
beri değişti, ve kapalı testteki kişinin neye bakacağını söyleyen tek
şey bu metin.

---

## Bu sürüm (sürüm kodu 3)

### İngilizce — `en-US` (497 karakter)

```
The corridor keeps asking new questions past level 17, and it stops looking the same while it does.

• An obstacle you have already cleared can no longer kill you
• Back closes the screen you are on; leaving the app pauses the run
• A sound toggle in the menu and on pause; the blade buzzes as it cuts
• Six sceneries, changing every four levels
• Three new obstacles: twin windows, a mine past a gap, and a window that will not hold still
• A damaged save can no longer stop the game from opening
```

### Türkçe — `tr-TR` (459 karakter)

```
Koridor 17. bölümden sonra da yeni şeyler soruyor, ve bunu yaparken aynı görünmüyor.

• Temiz geçtiğin engel artık arkandan öldürmüyor
• Geri tuşu oyundan çıkmıyor, açık ekranı kapatıyor; çıkınca tur duruyor
• Menüde ve duraklatta ses tuşu, ve kesimde telefon titriyor
• Altı manzara, dört bölümde bir değişiyor
• Üç yeni engel: iki pencere, dar bir geçidin ardındaki mayın, ve yerinde durmayan bir pencere
• Bozulan kayıt artık oyunun açılmasını engellemiyor
```

---

## Kısa sürüm (tek satır isteyen yerler için)

```
No more deaths from an obstacle you already cleared, six sceneries, three new obstacles.
```

```
Geçtiğin engel artık arkandan öldürmüyor; altı manzara, üç yeni engel.
```

---

## Bu sürümde ne var (iç liste — Play'e girmiyor)

Kapalı testte bakılacak şeyler:

1. **Manzaralar** — 1-4 alacakaranlık, 5-8 çöl, 9-12 buz, 13-16 orman,
   17-20 volkan, 21-24 gece, sonra başa dönüyor. Gökyüzü, tepeler, sis,
   raylar ve koridorun tonu değişiyor.
2. **Dokuma** (23. bölüm) — arka arkaya iki pencere, farklı
   yüksekliklerde. **Kapan** (28) — dar pencere, hemen arkasında aynı
   hizada mayın. **Kayan pencere** (36) — açıklık yerinde durmuyor,
   yukarı aşağı salınıyor; cevap bir yükseklik değil bir an. Genlik
   36'da 1.05, 48'de 1.25; açıklık 2.45'ten 1.90'a iniyor.
3. **Mengene** (12) — açıklık 12'de 2.15, 22'de 1.6. İlk karşılaşma
   yumuşadı, geç bölümler aynı kaldı.
4. **Kayıt** — bozuk tek bir anahtar oyunu açılmaz hâle getiriyordu
   (`slicerush_blade` aralık dışıysa siyah ekran, kalıcı). Denemek için:
   tarayıcıda `localStorage.setItem('slicerush_blade','99')` ve yenile.
5. **17 sonrası** — karışım bölümle sertleşiyor: tur başına ortalama
   demir 15-18. bölümlerde 4.1, 47-50'de 9.0 (üç koşuda ×2.19 ile ×2.52
   arası). Kolay parçaların ağırlığı 32. bölümde ×0.45'e iniyor, zor
   olanlarınki ×1.80'e çıkıyor.

6. **Arkadan ölüm** — çarpışma, geçilen engele altmış yedi milisaniye
   daha bakıyordu ve bir sonraki boşluğa inerken öldürüyordu. Ölçüldü:
   234 turun 85'i böyle bitiyordu, yani her beş ölümün dördü. Denemek
   için: bir demiri temiz geç ve hemen öteki uca kaç.

Ölçümler: `npm run test:slicer` (23 ölçüm betiği).
