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

**16 Eylül 2026 — 22 (1.8.2) telefonda denendi, 🏆 çıkmadı.**

Sürüm yazısı `v1.8.2 (22)` diyordu, yani doğru derlemeydi. Geriye üç ihtimal
kaldı ve üçü cihazda aynı görünüyor:

| Sebep | Nasıl anlaşılır |
|---|---|
| Eklenti derlemeye girmemiş | Teşhis: `PlayGames — hayır` |
| Test kullanıcısı değiliz / giriş reddedildi | Teşhis: `PlayGames — evet`, `giriş — hayır` + sebep |
| SHA-1 yanlış | Teşhis: giriş hatası Google'ın kendi metniyle |

Bunları ayırt etmek için sürüm yazısına beş kez dokununca açılan teşhis
ekranı eklendi (23 / 1.8.3). Ayrıntısı README, "Teşhis ekranı: sessizliğin
bedeli".

**Ve aynı gece sebep bulundu: birincisiymiş.** `npm run aab:fruithole`
çıktısında `Found 2 Capacitor plugins` yazıyordu — üç olmalıydı.
`@modbender/capacitor-play-games` `package.json`'daydı ama `node_modules`'ta
değildi, çünkü depo çekildikten sonra `npm install` çalıştırılmamıştı.
`cap sync` eklentileri `node_modules`'tan okuduğu için onu hiç görmedi ve
derleme yine de başarılı oldu.

Yani bu dosyadaki 1–5 arası adımların hepsi doğruydu; eksik olan tek şey bir
`npm install`'dı. `build-aab.mjs` artık bunu derlemeden önce kontrol ediyor
(README, "🏆 neden çıkmıyordu").

**Kural:** `git pull` sonrası `npm install`. Yeni bir eklenti eklendiğinde
`cap sync`'in **"Found N Capacitor plugins"** satırındaki N'i say — o satır
eklentinin derlemeye girip girmediğini söyleyen tek yer.

Play Games Services **test kullanıcıları** ister. Yayınlanmadan önce yalnızca
o listedeki hesaplar giriş yapabilir.

Play Games Services → **Test kullanıcıları** → kendi Gmail'ini ve kapalı test
listesindeki hesapları ekle.

Sonra telefonda: Goals ekranını aç. **🏆 Leaderboard düğmesi görünüyorsa**
giriş yapılmış ve tablo bağlanmış demektir. Görünmüyorsa üçünden biri:
kimlik boş, eklenti yüklenmemiş, ya da giriş reddedilmiş.

### 22 Eylül 2026 — 31 (1.10): düğme var, giriş yok

Teşhis ekranı bu sefer soruyu bitirdi:

```
PlayGames    evet
giriş        hayır
sebep        oyuncu girişi tamamlamadı
cevap        {"signedIn":false}
tanı         4:
tablo id     CgkIkbTDscoOEAIQAA
🏆 düğme     hayır
```

`tanı 4` = **SIGN_IN_REQUIRED**, `10` (DEVELOPER_ERROR) değil. Bu ayrım
bütün bir arama alanını kapatıyor: **SHA-1 ve OAuth istemcisi doğru.** Yanlış
olsalardı Google 10 derdi. Eklenti de yüklü, tablo kimliği de dolu — yani
1'den 5'e kadar bütün adımlar tamam.

Geriye Play Console'un iki durumu kalıyor ve ikisi de cihazda **aynı**
görünüyor, çünkü giriş hakkı olmayan hesaba Google hiçbir ekran göstermeden
`signedIn:false` dönüyor:

* Hesap **Play Games Services test kullanıcıları** listesinde değil. Bu liste
  kapalı test kanalınınkinden ayrı — IAP'de aynı tuzağa bir kez düşülmüştü
  (README, "Test ve sınırı"). Kapalı teste ekli olmak buraya yetmiyor.
* Yapılandırma hiç **yayınlanmamış**. Yayınlanmamış bir yapılandırmaya test
  kullanıcısı bile giremiyor.

İkisi de konsol ayarı; yeni bir `versionCode` harcamıyor.

### 24 Eylül 2026 — Gmail listede, `tanı` hâlâ 4

Kaan Gmail'ini **Play Games Services test kullanıcılarına ekledi** ve teşhis
ekranı hâlâ aynı şeyi diyor: `giriş hayır`, `cevap {"signedIn":false}`,
`tanı 4`. Yani yukarıdaki iki maddeden birincisi elendi.

Kalan: **yapılandırma yayınlanmamış.** Play Games Services'ın kendi
yayınlama adımı var ve kapalı testten ayrı; yayınlanmamış bir yapılandırmaya
test kullanıcısı bile giremiyor ve cihazda görünen şey tam olarak bu —
hiçbir ekran açılmadan `signedIn:false`.

Elenmeyen iki ayrıntı daha, ikisi de bedava kontrol:

* **Telefondaki Play Games hesabı** listeye eklenen Gmail mi? Cihazda birden
  fazla hesap varsa Play Games başka birini kullanıyor olabilir ve sonuç
  aynı görünür.
* Liste değişikliği **hemen yayılmıyor**; Google birkaç saate kadar
  gecikebiliyor.

Bu satır burada, çünkü "Gmail'i ekledin mi" sorusu iki kez soruldu. Konsolun
durumu buradan okunamıyor, yani yazılmazsa her oturumda yeniden sorulur.

### Ama `tanı 4` tek başına bir arıza değil

Yukarıdaki bütün çıkarım bir şeyi atlıyordu ve düzeltilmesi gerek:
**teşhis ekranındaki cevap açılıştaki _sessiz_ girişin cevabı.**

`gamesInit()` `_Games.signIn()` çağırıyor, eklentinin varsayılanı `silent:
true`, ve sessiz giriş o oyuna **daha önce hiç girmemiş** bir oyuncuda
reddedilir — tasarım gereği. Yani `{"signedIn":false}` + `tanı 4`, bozuk bir
yapılandırmanın değil, henüz giriş yapmamış bir oyuncunun beklenen cevabı.

Gerçek giriş `signInInteractive()`'de (`silent: false`) ve ona yalnızca
teşhis ekranındaki **"Sign in again"** düğmesinden ulaşılıyor.

Ve o düğmeye 24 Eylül'e kadar **basılamıyordu**: reklam şeridiyle sistem
çubuğunun altında kalıyordu (düzeltildi, düğme satırı artık panele yapışık).
Yani "giriş neden olmuyor" sorusu tartışılırken, girişi başlatan tek yol
denenmemişti.

**Sıradaki adım konsol değil, o düğme.** Hesap seçme ekranı açılıyorsa sorun
yok; hiç açılmıyorsa yapılandırmanın yayınlanmamış olması adayı geri gelir.

### 24 Eylül 2026 akşamı — iki farklı Gmail

36 telefonda: hesap seçme ekranı **açılıyor**, "Devam"a basılıyor, cevap
`signIn signedIn:false döndü`.

Sebep listede değil, telefonda: cihazdaki Google Play hesabı
**eminkaancetinkaya9047@gmail.com**. Test kullanıcılarına eklenen adres
öteki hesap. Google telefonda hangi hesap açıksa ona bakıyor — o listede
yoksa seçme ekranını gösteriyor ama sonra `signedIn:false` dönüyor.

Günlerce "Gmail'i ekledin mi" diye dönülmesinin sebebi buydu: soru doğruydu,
**hangi** Gmail diye sorulmamıştı. Bir hesabın var olması yetmiyor, cihazdaki
hesap olması gerekiyor.

Kontrol yolu: telefonda Play Store → profil → görünen adres. Teşhis ekranı
bunu söyleyemiyor, çünkü eklenti hangi hesabın reddedildiğini vermiyor.

**Ve bu da yanlış çıktı.** Test kullanıcıları listesine bakıldı: **ikisi de
ekli** — `e.kaancetinkaya99@gmail.com` ve `eminkaancetinkaya9047@gmail.com`.
Yani cihazdaki hesap listede ve giriş yine reddediliyor.

İki Gmail'i fark etmek doğruydu, sebep olduğunu varsaymak değildi; liste
açılıp bakılmadan yazılmıştı. Konsolun durumu buradan okunamıyor, o yüzden
her adayda **önce ekran görüntüsü** isteniyor.

Kalan aday: **Sürüm kanalları.** Play Games'in kendi kanal sistemi var ve
yapılandırmanın oyunun bulunduğu kanala bağlı olması gerekiyor. Bağlı
değilse hesap listede olsa bile giriş reddediliyor — cihazda görünen şey
yine aynı: seçme ekranı açılıyor, sonra `signedIn:false`.

### 24 Eylül 2026 — sebep bulundu: manifest'te `games.APP_ID` yokmuş

Düğmeye basıldı, **hiçbir ekran açılmadı** ve cevap değişmedi. Konsolda
yapılandırma **Yayınlandı** görünüyor, yani o aday da elendi.

Kalan yer adım 5'ti ve orada şöyle yazıyordu: *"Eklenti bunu kendi
manifest'inde tanımlıyorsa ekstra bir şey gerekmiyor."* Tanımlamıyor.
`@modbender/capacitor-play-games@0.4.0` paketinin manifest'i bomboş:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android" />
```

Yani şu satırı koyacak kimse yoktu:

```xml
<meta-data android:name="com.google.android.gms.games.APP_ID"
           android:value="@string/game_services_project_id" />
```

Bu satır olmadan Play Games girişi **sessizce** başarısız oluyor: hesap
seçme ekranı hiç açılmıyor, eklenti `{"signedIn":false}` dönüyor ve durum
kodu **4** geliyor. Yani Google "oyuncu giriş yapmadı" diyor, "kurulumun
eksik" demiyor — ve belirti, hesabın test listesinde olmamasıyla birebir
aynı görünüyor. Günlerce test kullanıcısı listesine bakılmasının sebebi bu.

`patch-manifest.mjs` artık hem meta-data'yı hem de `strings.xml` içindeki
`game_services_project_id` dizesini yazıyor (proje kimliği `501004425745`,
Play Console → Play Oyun Hizmetleri → Yapılandırma). Kimlik doğrudan sayı
olarak yazılamıyor — Android onu tam sayı sanıp kırpıyor — o yüzden dize
kaynağına gidiyor.

Bir sonraki derlemede sınanacak.

**Bu, teşhis ekranının kendini ödediği ikinci sefer.** Aynı ekran olmadan
elde yine "düğme çıkmıyor" kalırdı ve arada SHA-1'i yeniden üretip bir
derleme daha yüklemek dururdu — ki durum kodu onun doğru olduğunu zaten
söylüyor.

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
