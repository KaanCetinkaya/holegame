# Liderlik tablosu — kurulum

Oyun tarafı yazıldı ve **eklenti olmadan da eksiksiz çalışıyor**: eklenti
yoksa `gamesReady()` false dönüyor, 🏆 düğmesi hiç görünmüyor, skor gönderimi
sessizce hiçbir şey yapmıyor. Yani bu dosyadaki adımların hiçbirini yapmasan
da 1.6 sorunsuz yayınlanır.

Aşağıdakiler tabloyu **açmak** için.

## Önce dürüst uyarı

**Bu konteynerde Android SDK yok** ve native proje (`android-fruithole`)
yalnızca senin makinende, yani eklentinin derlenip derlenmediğini buradan
göremiyorum.

Ama aşağıdaki **1. ve 2. adımlar eklentiden tamamen bağımsız** — Play
Console'da tabloyu kurmak, hangi eklentiyi kullanacağımızdan önce gelir ve
onun sonucunu beklemeden yapılabilir. Uzun süren kısım da zaten orası.

## 1. Play Console: oyun servisleri ✅

Play Console → sol menü **Büyüyün** → **Play Games Services** → **Kurulum ve
yönetim** → **Yapılandırma**

1. **"Hayır, oyunum Google API'lerini kullanmıyor"** → yeni bir oyun servisleri
   projesi oluştur. Adı: `Fruit Hole`.
2. Oluştuktan sonra **Kimlik bilgileri ekle** → tür: **Android uygulaması**
   - Uygulamanı seç: **`com.kaancetinkaya.fruithole`**
   - **İmzalama sertifikası parmak izi (SHA-1)** isteyecek. Bu, Play'in senin
     `.aab`'ni yeniden imzaladığı anahtarın parmak izi:
     **Play Console → Test edin ve yayınlayın → Uygulama bütünlüğü →
     Uygulama imzalama** sayfasındaki **SHA-1** değerini kopyala.
   - ⚠️ Kendi `keystore`'unun SHA-1'ini **değil**, Play'in imzalama
     anahtarınınkini ver. Play uygulamayı yeniden imzaladığı için cihazdaki
     imza odur; yanlışını verirsen giriş sessizce başarısız olur ve hata da
     görmezsin.

## 2. Liderlik tablosunu oluştur ✅

Play Games Services → **Liderlik tabloları** → **Liderlik tablosu oluştur**

| Alan | Değer |
|---|---|
| Ad | `Daily Challenge` |
| Puan biçimlendirmesi | **Sayısal** (tam sayı) |
| Sıralama | **Daha yüksek puan daha iyi** |
| Sınır | boş bırak |

Kaydettikten sonra tablonun **kimliğini** kopyala — `CgkI...` diye başlayan
uzun bir dizi.

## 3. Kimliği koda yaz ✅ (16 Eylül 2026'da yapıldı)

```js
const LEADERBOARD_ID = 'CgkIkbTDscoOEAIQAA';
```

**Boş kaldığı sürece tablo kapalıdır** — `gamesReady()` false döner, düğme
görünmez. Yani bu satır bir anahtardır.

Ama tek başına yetmiyor: `gamesReady()` üç şey istiyor — eklenti yüklü
(`GAMES_ON`), giriş yapılmış (`_gamesIn`) **ve** kimlik dolu. Eklenti henüz
kurulmadığı için kimliğin girilmesi cihazda hiçbir şeyi değiştirmedi, düğme
hâlâ gizli. `scratchpad/holedaily.mjs` bunu doğruluyor (6. bölüm).

## 4. Eklentiyi kur

⚠️ **Koddaki `GameConnect` adı ölü bir eklentiye ait.**
`@openforge/capacitor-game-connect@5.0.2` en son **2023 Aralık'ta**
yayınlanmış ve `@capacitor/core: ^5.0.0` bildiriyor; biz Capacitor 8'deyiz.
Bu yol kapalı — aynı tuzağa IAP'de de düşülmüştü (README'deki "Eklenti"
bölümü).

Capacitor 8 için iki aday var ve ikisinin de kodu okundu (README, "Eklenti
durumu"). Kısaca: `@modbender/capacitor-play-games` daha eksiksiz,
`@idleflowgames/capacitor-play-games` daha küçük; ikisi de güncel SDK'da ve
kodları ciddi. **Ama ikisi de 0.x ve çok yeni**, ayrıca SDK minSdk'yi 24'e
çıkarıyor.

Karar: **satın alma telefonda doğrulandıktan sonra** eklenecek. O zaman
kurulum komutu ve `index.html`'deki çağrıların yeni API'ye uyarlanması
buraya yazılacak — şu anki `GameConnect` çağrıları o eklentiye göre
değişecek.

`npx cap sync android` çıktısındaki **"Found N Capacitor plugins"** satırı
eklentinin kabul edilip edilmediğini söyleyen tek yer.

## 5. Manifest

`patch-manifest.mjs` AdMob App ID'sini yazıyor. Play Games ayrıca
`AndroidManifest.xml` içinde şu satırı istiyor:

```xml
<meta-data android:name="com.google.android.gms.games.APP_ID"
           android:value="@string/game_services_project_id" />
```

Eklenti bunu kendi manifest'inde tanımlıyorsa ekstra bir şey gerekmiyor.
Derleme "APP_ID eksik" derse `patch-manifest.mjs`'e ekleriz — AdMob için
zaten yaptığımız şeyin aynısı, ve manifest `cap add` ile yeniden üretildiğinde
kaybolmaması için oraya yazılması gerekir.

## 6. Test

Play Games Services **test kullanıcıları** ister. Yayınlanmadan önce yalnızca
o listedeki hesaplar giriş yapabilir.

Play Games Services → **Test kullanıcıları** → kendi Gmail'ini ve kapalı test
listesindeki hesapları ekle.

Sonra telefonda: Goals ekranını aç. **🏆 Leaderboard düğmesi görünüyorsa**
giriş yapılmış ve tablo bağlanmış demektir. Görünmüyorsa üçünden biri:
kimlik boş, eklenti yüklenmemiş, ya da giriş reddedilmiş.

## B planı: eklenti derlenmezse

Üç seçenek, tercih sırasıyla:

1. **Kendi küçük eklentimizi yazarız.** Play Games'in Android kütüphanesi
   (`com.google.android.gms:play-services-games-v2`) doğrudan çağrılır; bize
   lazım olan üç şey var — giriş, skor gönder, tabloyu aç. Capacitor eklentisi
   yazmak yüz satırlık bir Java dosyası. Capacitor 8'e göre yazılacağı için
   uyumsuzluk olmaz. Ben yazarım, derlemeyi sen yaparsın.
2. **Öbür adayı dene.** İki Capacitor 8 eklentisinden biri derlenmezse
   diğeri denenir; biri ötekinin çatallanmışı olduğu için API'leri birbirine
   yakın.
3. **Tabloyu ertele.** Günlük meydan okuma zaten tek başına çalışıyor; tarla
   ve delik herkeste aynı olduğu için tablo sonradan eklendiğinde geçmişe
   dönük bir adaletsizlik doğmaz.

## Neden günlük skor

Play Games tabloları **GÜNLÜK, HAFTALIK ve TÜM ZAMANLAR** pencerelerini kendisi
tutuyor. Yani tek bir tablo, gece yarısı değişen bir tarla için tam olarak
istenen şeyi bedavaya veriyor: bugünün sıralaması.

Gönderim her koşuda yapılıyor, yalnızca kişisel rekorda değil — Play zaten
oyuncu başına en yükseği tutuyor, ve yalnızca rekorları göndermek bir günün
ilk skorunu (dünkünden düşükse) kaybettirirdi.
