# Slice Rush — sürüm notları

Play Console'a yapıştırılacak metin burada. Not alanının sınırı dil
başına **500 karakter**; karakter sayıları başlıkların yanında.

Sürüm 1 ve 2 yüklendiğinde burası yoktu ve not yazılmadı. Oyun o günden
beri değişti, ve kapalı testteki kişinin neye bakacağını söyleyen tek
şey bu metin.

---

## Bu sürüm (sürüm kodu 3)

### İngilizce — `en-US` (473 karakter)

```
The corridor keeps asking new questions past level 17, and it stops looking the same while it does.

• An obstacle you have already cleared can no longer kill you
• Six sceneries, changing every four levels
• Two new obstacles: twin windows at different heights, and a mine waiting just past a narrow gap
• The clamp at level 12 no longer arrives at its full difficulty
• A damaged save can no longer stop the game from opening
• Less memory held on to after a long session
```

### Türkçe — `tr-TR` (442 karakter)

```
Koridor 17. bölümden sonra da yeni şeyler soruyor, ve bunu yaparken aynı görünmüyor.

• Temiz geçtiğin engel artık arkandan öldürmüyor
• Altı manzara, dört bölümde bir değişiyor
• İki yeni engel: farklı yüksekliklerde iki pencere, ve dar bir geçidin hemen ardında bekleyen mayın
• 12. bölümdeki mengene artık ilk günden son zorluğunda gelmiyor
• Bozulan kayıt artık oyunun açılmasını engellemiyor
• Uzun oyundan sonra daha az bellek tutuluyor
```

---

## Kısa sürüm (tek satır isteyen yerler için)

```
No more deaths from an obstacle you already cleared, six sceneries, two new obstacles.
```

```
Geçtiğin engel artık arkandan öldürmüyor; altı manzara, iki yeni engel.
```

---

## Bu sürümde ne var (iç liste — Play'e girmiyor)

Kapalı testte bakılacak şeyler:

1. **Manzaralar** — 1-4 alacakaranlık, 5-8 çöl, 9-12 buz, 13-16 orman,
   17-20 volkan, 21-24 gece, sonra başa dönüyor. Gökyüzü, tepeler, sis,
   raylar ve koridorun tonu değişiyor.
2. **Dokuma** (23. bölüm) — arka arkaya iki pencere, farklı
   yüksekliklerde. **Kapan** (28) — dar pencere, hemen arkasında aynı
   hizada mayın.
3. **Mengene** (12) — açıklık 12'de 2.15, 22'de 1.6. İlk karşılaşma
   yumuşadı, geç bölümler aynı kaldı.
4. **Kayıt** — bozuk tek bir anahtar oyunu açılmaz hâle getiriyordu
   (`slicerush_blade` aralık dışıysa siyah ekran, kalıcı). Denemek için:
   tarayıcıda `localStorage.setItem('slicerush_blade','99')` ve yenile.
5. **17 sonrası** — karışım bölümle sertleşiyor: tur başına ortalama
   demir 15-18. bölümlerde 4.4, 27-30'da 9.2.

6. **Arkadan ölüm** — çarpışma, geçilen engele altmış yedi milisaniye
   daha bakıyordu ve bir sonraki boşluğa inerken öldürüyordu. Ölçüldü:
   234 turun 85'i böyle bitiyordu, yani her beş ölümün dördü. Denemek
   için: bir demiri temiz geç ve hemen öteki uca kaç.

Ölçümler: `npm run test:slicer` (on altı ölçüm betiği).
