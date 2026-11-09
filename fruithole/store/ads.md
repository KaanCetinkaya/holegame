# Ücretli reklam — ₺1000'lik ölçüm turu

19 Ekim 2026'da Kaan ₺1000'lik bir reklam turu vermeye karar verdi.
Bu dosya kararın **neyi satın aldığını** ve sonunda neye bakılacağını
tutuyor; yoksa harcanan para bir sayı bırakmadan gider.

## Para geri gelmiyor, ve bu biliniyor

Kendi verisiyle, 19 Ekim:

| sayı | kaynak |
|---|---|
| günlük kazanç ₺0,74 · 22 gösterim · eBGBM ₺33,51 | AdMob ana sayfa |
| oyunu yüklü tutan kullanıcı 3-8, çoğu Türkiye | Play Console → İstatistikler |
| son 28 gün: **14 yeni edinme**, 18 aylık etkin cihaz | Play Console ana sayfası, 5 Kasım |
| **indirme başına ~₺1,5** | durağan durumda günlük kazanç ÷ günlük yeni yükleme |

**Düzeltme, 5 Kasım.** Bu tablo ilk yazıldığında "günlük yükleme 3-8"
diyordu ve oradan "indirme başına ₺0,12" çıkıyordu. İkisi de yanlıştı:
o grafik günlük *yeni* yüklemeyi değil, o gün oyunu **yüklü tutan**
kullanıcı sayısını gösteriyordu. Gerçek yeni yükleme son 28 günde 14,
yani günde yarım; ₺0,74'lük günlük kazançla indirme başına ~₺1,5 eder.
Kazanç tek bir günün okuması (bir gün önce ₺1,60'tı), yani aralık
kabaca ₺1,5-3.

Sonuç yön değiştirmiyor ama **büyüklüğü** değişiyor: Türkiye'de
satın alınan indirme ₺3-6, yani reklam indirme başına "yüz kat" değil
**kabaca iki-dört kat** zarar. Hâlâ geri dönmeyen bir harcama, ama
"saçma" değil ölçülebilir bir açık.

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

## 5 Kasım: üç oyunun 28 günü

Play Console ana sayfası, son 28 gün:

| oyun | kanal | edinme | ilk açılış | aylık etkin cihaz |
|---|---|---|---|---|
| Slice Rush | kapalı test | 10 | 9 | 10 |
| Motor Works | kapalı test | **1** | 1 | **2** |
| Fruit Hole | üretim | 14 (+%600) | — | 18 (+%350) |

Fruit Hole'un son güncellemesi **6 Ekim**. Türkçe, teşhis ekranı
düzeltmesi ve kayıt satırlarını taşıyan v51 hiç yüklenmedi; yani bu
dosyadaki reklam turunun "ölçülebilir kohort" gerekçesi, gelen
oyuncunun Türkçe görmediği bir sürüm üzerinden okunurdu.

Motor Works'ün sayısı ayrı bir risk: 12 testçi kayıtlı ama 28 günde
yalnızca 2 cihaz oyunu açmış. Üretim başvurusu "test gerçekten
yapıldı mı"ya bakıyor; Slice Rush'ta 12 testçinin 9'u oyunu açmış,
Motor Works'te neredeyse hiçbiri.

## 6 Kasım: son yedi günün AdMob raporu

| | |
|---|---|
| istek | **3** |
| gösterim | **2** |
| tahmini kazanç | **₺0,29** |
| eBGBM | ₺146 (iki gösterimden, gürültü) |
| eşleşme | %100 |

Yedi günün altısı sıfır; bütün hareket tek günde. Bu, yukarıdaki
"indirme başına ~₺1,5" düzeltmesini de düzeltiyor: o hesap ₺0,74'lük
**tek bir günden** yapılmıştı. Haftalık ortalama günde ~₺0,04, yani
indirme başına (günde yarım yükleme) **~₺0,1**. Tek günlük bir okumadan
indirme başına değer çıkarmak iki kez yanlış sonuç verdi; bundan sonra
en az yedi günlük ortalama.

İki okuma mümkün ve ikisi ayrılmadan bir şey söylenemez:

1. **Oyunu açan yok.** 28 günde 14 yükleme ve haftada 3 reklam isteği
   birbiriyle uyumlu.
2. **Reklam isteği gitmiyor.** 19 Ekim'de günde 30 istek vardı; kod 6
   Ekim'den beri değişmedi, yani bozulmuş olması beklenmez ama
   bakılmadı.

Ayıran deneme beş dakika: oyunu aç, bir bölüm oyna, reklam şeridi
görünüyor mu bak, ertesi gün istek sayısı bir artmış mı kontrol et.
Şerit görünüyorsa sorun (1), görünmüyorsa (2).

Her iki durumda da ücretli reklam şu an anlamsız: satın alınan indirme
₺3-6, getirisi ~₺0,1.

### Aynı gün, AdMob ana sayfası: aylık sayı ve eksik bir kurulum adımı

| | |
|---|---|
| **Ekim toplamı** | **₺10,70** |
| Kasım (ilk altı gün) | ₺0,29 |
| dün / bugün | ₺0,00 / ₺0,00 |
| son 7 gün, önceki 7 güne göre | istek 3 (−%50), gösterim 2 (−%50) |

Doğru ölçü bu: bir aylık toplam. Yukarıdaki iki hesap — önce tek
günden ₺0,12 ve ₺1,5, sonra tek haftadan ₺0,1 — kısa pencerelerden
indirme başına değer çıkardı ve üçü de birbirini tuttu ya da tutmadı,
tesadüfen. Ekim'in ₺10,70'i, son 28 günün 14 yüklemesiyle, indirme
başına **~₺0,75** ediyor. Satın alınan indirme Türkiye'de ₺3-6: reklam
hâlâ dört-sekiz kat zarar.

Aynı sayfada AdMob kurulumu **3/4** görünüyor. Eksik adım: "Uygulama
mağazasına bağlantı oluştur — reklam yayınlamaya başlamadan önce
uygulamaların onaylanması gerekir". Fruit Hole yayında, yani
bağlanabilir; Slice Rush ve Motor Works kapalı testte olduğu için
henüz bağlanamaz (AdMob yalnızca herkese açık mağaza sayfasına
bağlanıyor). Bu bağlantı düşük istek sayısını açıklamıyor — eşleşme
%100, yani gelen istek dolduruluyor — ama zorunlu bir adım ve
eksikti.

### AdMob uygulamayı doğrulayamadı: `app-ads.txt` kökte yok

6 Kasım, AdMob "Uygulama kurulumunu tamamlayın": *Peelo: Fruit Hole
(Android) uygulamasını doğrulayamadık.* Tarayıcı Play'deki geliştirici
sitesini (`kaancetinkaya.github.io`) okumuş ve kökte dosya bulamamış:

```
https://kaancetinkaya.github.io/app-ads.txt   → 404
http://kaancetinkaya.github.io/app-ads.txt    → 404
```

Sebep yapısal: bu deponun sayfaları **proje sitesi** olarak
`kaancetinkaya.github.io/holegame/…` altında yayınlanıyor, ve
`app-ads.txt` alan adının **kökünde** aranıyor. Kökü yalnızca adı
`KaanCetinkaya.github.io` olan bir **kullanıcı sitesi** deposu
yayınlayabiliyor. Doğrulanmamış uygulamaya reklam sınırlı sunuluyor.

Dosyanın içeriği AdMob'un verdiği satır (yayıncı kimliği gizli değil,
bu dosya tasarım gereği herkese açık):

```
google.com, pub-2542927456156553, DIRECT, f08c47fec0942fa0
```

Kurulum: `KaanCetinkaya.github.io` adında public depo → kökte
`app-ads.txt` → Settings → Pages: main / root → adresin satırı
gösterdiği kontrol edilir → AdMob'da "Güncellemeleri kontrol edin".
Kullanıcı sitesi proje sitelerini bozmuyor; `/holegame/` altındaki
gizlilik sayfaları yerinde kalıyor.

Slice Rush ve Motor Works aynı geliştirici sitesini ve aynı yayıncı
kimliğini kullanıyor, yani üretime çıktıklarında aynı dosya onları
da kapsıyor.

**7 Kasım: dosya yayında.** `KaanCetinkaya.github.io` deposu kuruldu,
`https://kaancetinkaya.github.io/app-ads.txt` satırı gösteriyor (Kaan'ın
telefonundan görüldü; bu konteynerden o alan adına erişim yok). İlk
kayıt boş gitmişti — telefonda yapıştırma çalışmadı ve dosya
"0 lines · 1 Byte" kaldı; tarayıcı da boş sayfayı önbellekten gösterdi.
Kontrol bu yüzden dosyanın kendisinden ("1 lines") ve `?v=2` ile yapıldı.
Sıradaki: AdMob'da "Güncellemeleri kontrol edin"; onay saatler-günler.

### 7 Kasım: AdMob'da iki Fruit Hole var

Uygulamalar listesinde iki ayrı kayıt çıktı:

| AdMob'daki ad | kimlik | durum |
|---|---|---|
| `fruit-hole` | `~4653695871` | **oyunun kullandığı** (`patch-manifest.mjs`), reklam birimleri ve Ekim'in ₺10,70'i burada; mağazaya bağlı değil |
| `Peelo: Fruit Hole` | `~1831319279` | mağazaya bağlı, **reklam birimi yok**, kazanç her zaman ₺0; kodda hiç geçmiyor |

"Uygulamayı doğrulayamadık" uyarısı ikincisi içindi. `fruit-hole`'u
mağazaya bağlamak telefondan iki kez "Uygulama kaydedilirken bir sorun
oluştu" ile düştü; büyük ihtimalle Play kaydı zaten öteki AdMob
uygulamasına bağlı olduğu için. Bu bir **tahmin**, doğrulanmadı.

Boş olanı gizlemek bağlantıyı serbest bırakır mı, bilinmiyor; gizleme
geri alınabiliyor ve kaydın birimi yok, yani denemesi zararsız. Kodun
kullandığı kimliğe (`~4653695871`) dokunulmaz.

## 8 Kasım: Play Console ana sayfası, son 28 gün

| | | önceki 28 güne göre |
|---|---|---|
| cihaz edinme | 12 | +%140 |
| cihaz ilk açılış | **6** | +%100 |
| aylık etkin cihaz | 17 | +%143 |
| son üretim sürümü | 6 Ekim, 5 yükleme, yükleme tabanının %62,5'i | |

Edinenlerin **yarısı oyunu hiç açmamış** (12 edinme, 6 ilk açılış).
Altı kişilik bir kohortta elde tutma oranı bir sayı değil, gürültü;
5 Kasım'daki "edinme 14" ile bugünkü 12 de aynı pencerenin kaymasından.

**9 Kasım: karar ve uygulama.** Bilgisayardan bakılan tablo kesinleştirdi:
`fruit-hole` "Sınırlı reklam sunumu — limiti kaldırmak için mağaza
ekleyin", `Peelo: Fruit Hole` "Hazır, reklam sunma etkin, Google Play".
Bağlamayı taşımak yerine **oyun doğrulanmış kayda taşındı**: Kaan
`Peelo: Fruit Hole`'da üç birim açtı (banner `/9507834591`, geçiş
`/1629344577`, ödüllü `/1107755343`), kod ve `patch-manifest.mjs` bunlara
çevrildi. Etkisi v51 yüklenince başlıyor; yeni birimlerin reklam
göstermeye başlaması AdMob'a göre bir saate kadar sürebilir.
