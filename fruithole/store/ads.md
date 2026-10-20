# Ücretli reklam — ₺1000'lik ölçüm turu

19 Ekim 2026'da Kaan ₺1000'lik bir reklam turu vermeye karar verdi.
Bu dosya kararın **neyi satın aldığını** ve sonunda neye bakılacağını
tutuyor; yoksa harcanan para bir sayı bırakmadan gider.

## Para geri gelmiyor, ve bu biliniyor

Kendi verisiyle, 19 Ekim:

| sayı | kaynak |
|---|---|
| günlük kazanç ₺0,74 · 22 gösterim · eBGBM ₺33,51 | AdMob ana sayfa |
| günlük yükleme 3-8 (son hafta 6-7), çoğu Türkiye | Play Console → İstatistikler |
| **indirme başına ~₺0,12** | durağan durumda günlük kazanç ÷ günlük yükleme |

Satın alınan indirme bunun kat kat üstünde, yani bu tur bir yatırım
değil. `social.md`'deki "reklam vererek indirme almak her indirmede
3-10 kat zarar" hesabı hâlâ doğru yönü gösteriyor ve gerçek veriyle
**daha kötü** çıkıyor: o hesap ARPDAU'yu $0,04 varsaymıştı.

**Düzeltme (aynı gün, aynı konuşmada):** ilk söylenen "satın alınan
indirme ₺20-80" rakamı **Tier-1** fiyatı. Yüklemeler Türkiye'den
geliyor ve orada casual oyun CPI'ı kabaca ₺3-6. Yani ₺1000 ile
150-300 indirme beklenir — para geri gelmez ama **ölçülebilir
büyüklükte bir kohort** alınır. Turun gerekçesi bu.

## Asıl soru: bulunamıyor mu, tutmuyor mu

AdMob'da istekler bir günde %61 düştü ve eşleşme oranı %100 — yani
reklam tarafında arıza yok, oyunu açan yok. Bu turun cevaplayacağı
tek soru şu: **parayla gelen oyuncu da gidiyor mu?**

- Gidiyorsa sorun keşif değil oyunun kendisi, ve bir daha reklam
  konuşulmaz; sıradaki iş ilk beş dakika olur.
- Kalıyorsa keşif sorunu doğrulanır ve ikinci tur konuşulabilir.

İki cevap da ₺1000'e ucuz. Aynı şeyi öğrenmenin pahalı yolu, bunu
ölçmeden on katını harcamak.

## Kurulum

`https://ads.google.com` → Yeni kampanya → **Uygulama tanıtımı** →
Android → `Peelo: Fruit Hole` → hedef **Yükleme sayısı**.

| alan | değer | neden |
|---|---|---|
| Ülke | Türkiye | kitle zaten orada; en ucuz indirme orada |
| Dil | Türkçe + İngilizce | mağaza metni İngilizce, oyuncular Türk |
| Günlük bütçe | ₺150 | 7 güne ₺1050; uygulama kampanyası günlük bütçeyi hedef EBM'nin ~50 katında istiyor |
| Hedef EBM | boş | ilk turda Google hacmi bulsun; eşik koymak erken |
| Süre | 7 gün, sonra **dur** | üst sınır olmayan bir test, test değil |

Video şart. Klipler elimizde ve dokuz saniyelik, dikey, sessiz —
reklam için uygun (Google zaten sessiz oynatıyor). Google Ads
yalnızca **YouTube'daki** videoyu kabul ediyor, o yüzden 2-3 klip
"listelenmemiş" olarak YouTube'a yüklenip linkleri veriliyor.
Görseller `fruithole/store/` altındaki mağaza ekran görüntüleri.

### Başlıklar (30 karakter)

```
Delik büyüdükçe her şeyi yutar
Önce çekirdek, sonra kamyon
Tek parmakla oyna
Dokuz saniyede dev ol
Hole eats everything it fits
```

### Açıklamalar (90 karakter)

```
Deliği sürükle, meyveyi yut, büyü. İnternet gerekmez, kayıt yok.
Küçük başla, tarlayı bitir. Ücretsiz ve çevrimdışı oynanır.
```

## Karar kuralı — harcamadan önce yazıldı

> Yedi gün sonra kampanyadan gelen kohortun **1. gün elde tutması
> %30'un altındaysa** reklam durur ve sıradaki iş oyunun ilk beş
> dakikası olur. %30'un üstündeyse ikinci bir tur konuşulur.

Eşik sonradan yazılırsa sonuç ne çıkarsa çıksın haklı görünür. O
yüzden buraya **önceden** yazıldı; bu dosyanın başlıca işi bu satır.

Okunacak yer: Play Console → **Kullanıcı edinme** → kaynak kırılımı;
Google Ads kohortu orada ayrı duruyor.

## Sonuç

*(tur bittiğinde doldurulacak: harcanan, gelen indirme, gerçekleşen
CPI, 1. gün ve 7. gün elde tutma, ve karar kuralının ne dediği.)*
