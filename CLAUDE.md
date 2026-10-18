# holegame

## Kaan'a komut verirken

**Her komut bloğu `cd C:\Users\HP\holegame` ile başlar.** Kaan komutları
kopyalayıp yapıştırıyor ve terminali çoğu zaman başka bir klasörde açık
oluyor; `cd`'siz bir blok ya yanlış yerde çalışıyor ya da "nerdeyim" diye
geri dönüp bir tur kaybettiriyor. Tek satırlık komutlarda da geçerli.

```
cd C:\Users\HP\holegame
npm run aab:fruithole
```

Makinesi Windows, kabuk PowerShell. JDK:
`C:\Program Files\Eclipse Adoptium\jdk-21.0.12.8-hotspot`.

**`&&` kullanma, her komut ayrı satır.** Kaan'ın PowerShell'i 5.1 ve `&&`
orada bir ayraç değil: komut hiç çalışmıyor, yerine
*"The token '&&' is not a valid statement separator in this version"* diyor.
Üç komutu tek satıra dizmek, üçünün de çalışmaması demek.

```
cd C:\Users\HP\holegame
git add -A
git commit -m "mesaj"
git push
```

## Derleme

Uygulama başına ayrı komut var ve `node build-aab.mjs` tek başına **Hole**'u
derler, Fruit Hole'u değil. Doğrusu:

```
cd C:\Users\HP\holegame
npm run aab:fruithole      # build-www + cap sync + patch-manifest + imzalı .aab
```

`git pull` sonrası **`npm install`**. Capacitor eklentileri `node_modules`'tan
okunuyor, `package.json`'dan değil — kurulmamış bir eklenti sessizce
derlemenin dışında kalır ve derleme yine başarılı olur. (`build-aab.mjs` artık
bunu önden yakalıyor; sebebi README'de, "🏆 neden çıkmıyordu".)

Her yükleme yeni bir `versionCode` ister: `app-version.json`'ı artır. Bir
sürüm koduna, hiç gönderilmemiş bir taslağa yüklense bile, bir daha
dokunulamaz.

## Testler

```
cd C:\Users\HP\holegame
npm test
```

Bu, geliştirilen iki oyunu koşturuyor: Motor Works (40 ölçüm, 5 dakika) ve
Slice Rush (23, 17 dakika), toplam **63 ölçüm, ~22 dakika**. Tek tek:
`npm run test:tycoon`,
`npm run test:slicer`. Fruit Hole ayrı, çünkü 90 ölçümü var:
`npm run test:fruithole` yükleme öncesi bakılacak **19 ölçüm, ~29 dakika**,
`npm run test:fruithole:tam` hepsi (saatler). Hepsi birden:
`npm run test:all`.

Listeye `holeboss` eklendi (2 dakika, ölçüldü). Gerekçesi: yükleme öncesi
takımın işi, **oyuncunun göreceği bir şeyin sessizce kaybolmasını**
yakalamak — ve tam bu oldu. Bir turun finali (Cup Night + kupa) 55
bölümde bir geliyor ve o bölüm bulmaca/görev tahtasına denk gelirse o
turda hiç olmuyordu; 56-110 turu böyleydi, yani 90'ın üstündeki bir
oyuncu oyunun "FINAL" dediği şeyi bir kez bile görmüyordu. Aylarca
yüklendi, çünkü hiçbir yükleme öncesi ölçüm ona bakmıyordu. Şimdi
bakıyor: 120 bölümde iki Cup Night, ikisi de ızgara tahtası, ikisinde de
kolos kupa ve tahtanın öbür ucunda.

Takımın süresinin neredeyse tamamı tek betikte: `holeboot` ~1000 saniye,
kalan on yedisi toplam ~720. Sebebi ölçtüğü şey değil, **çizim**: altmış
bölümü altmışar kare oynatıyor ve bu konteynerde bir kare 300-450 ms.
Bayrağı açmıyor ve açmamalı: aradığı şey "bu bölüm oynanırken bir yer
patlıyor mu" ve çizim o yolun yarısı — `renderer.render` atlanırsa orada
patlayan bir satır ölçümün hiç uğramadığı yerde kalır. Pahalı ama
ölçtüğü şeyin parçası.

Sayılar ölçülerek yazıldı ve bir gecede değişti: çizim kapatılınca Fruit
Hole'un yükleme öncesi takımı 37 dakikadan 24'e indi, ve hiçbir şey iddia
etmeyen 22 betik takımdan çıkarıldı (ayrıntısı `scratchpad/kosu.mjs`
içindeki `URETEN` listesinde). Onlar silinmedi, elle koşturuluyor:
`holesheet` bütün düzenleri tek sayfaya diziyor, `tycoon`…`tycoon6` denge
denemelerinin ham çıktısı.

Önce `build-www.mjs` çalışıyor, sonra betikler sırayla; sonunda tek bir
özet, hangisi kaç saniye sürdü ve düşen varsa onun FAIL satırları.

Hepsi Playwright + gerçek sayfa. Konteynerde GPU yok, SwiftShader'la
çiziliyor ve bir kare 300-450 ms sürüyor.

Düşen bir betiğin **tam çıktısı** `scratchpad/ciktilar/<ad>.txt` dosyasında
duruyor. Özet yalnızca FAIL satırlarını gösteriyor ve bir tabloya geri
bakmak gerektiğinde yirmi dakikalık betiği baştan koşturmak, o arada kod
değiştiyse başka bir şeyi ölçmek demek.

**Bot oynatan ölçümler çizimi kapatıyor** (`fruitHoleDrawOff`,
`sliceDrawOff`, `jeDrawOff`). Kareyi tek tek ilerleten bir betik GPU'suz
saatler sürüyordu — `holemayin` toplu koşuda 3483 saniye — ve ölçtüğü şeyin
(botun nereye gittiği, ne yediği, saatin ne kadarını kullandığı) çizimle
ilgisi yok. Bayrak yalnızca `renderer.render`ı atlıyor; fizik, çarpışma,
saat ve büyüme aynen işliyor, ve bu kullanılmadan önce ölçüldü: aynı
tohumlu tahta, 600 kare, çizimli ve çizimsiz — sonuç birebir aynı, süre 366
saniyeden 1.1 saniyeye indi.

Ekrana bakan ölçümler bunu **açmıyor**: görüntü alan, piksel sayan, kare
süresi ölçen bir betik için çizim ölçtüğü şeyin kendisi. Oyun bayrağı hiç
açmıyor.

Uzun bir ölçüm koşuyu **tek sayfada** yapmasın: SwiftShader'ın WebGL
bağlamı altıncı koşudan sonra düşüyor, oyun saati durduruyor (doğru
davranış) ve ölçüm bunu "oyuncu kaybetti" diye okuyor. `holemayin` tam bunu
yaptı ve "12 koşunun 5'i kazandı" dedi; ölçülebilen beş koşunun beşi de
kazanmıştı. Her koşu kendi sayfasında, ve bağlamı düşen koşu "ölçüm
yapılamadı" diye ayrı sayılıyor (`fruitHoleGl().logged`).

**Testler zamanlamaya bağlı yazılmamalı**, ve bu kural kendi eşiklerini de
kapsıyor. Bir günde dördü birden çıktı:

- `holeboot`'un bölüm başına 25 saniyelik sınırı, altmış karelik bir
  döngünün ~24 saniye sürdüğü yerde duruyordu: koşudan koşuya başka
  bölümler düşüyordu. Sınırın işi hızı ölçmek değil asılı kalmayı
  yakalamaktı; doksan saniyeye çıktı.
- `slicewall` bölüm başına beş tahta kurup iki pencereyi oranlıyordu ve
  oran beş koşuda ×1.69 ile ×3.27 arasında geziniyordu. Örneklem yirmi
  dörde çıkınca sabitlendi.
- `slegri` kuyrukta **göreli** düşüşe bakıyordu: oran %20'ye inmişken
  %23'ten %11'e düşmek "−%53" yazıyor. Puan farkına çevrildi.
- `holecatapult` elle yazılmış bir eşiği ölçüyordu ve o eşik oyunun
  verdiği sözden iki kat büyüktü. Artık eşiği oyundan okuyor.

Ve bir gün sonra beşincisi, 213 yerde birden: `waitForFunction(fn,
options)` yazılmıştı. Playwright'ta ikinci parametre sayfaya geçirilen
**argüman**, seçenek değil — yani yazılan zaman aşımı bir argümana
dönüşüyor ve gerçek sınır sessizce varsayılan otuz saniyede kalıyor.
Doksan altısı 40-120 saniye istiyordu, yani istediğinin üçte birini
alıyordu. Bedeli: `slice` toplu koşuda "sayfa otuz saniyede açılmadı"
diye düştü, tek başına sorunsuz geçti. Doğrusu `waitForFunction(fn,
null, options)`, ve `slbelge` artık buna kapı kuruyor — depodaki 182
betiğin hepsini tarıyor, çünkü hata oyuna değil araca ait.

Kural: eşik **seçilmez, ölçülür**. Aynı yapımı üç kez koşturup gürültüyü
gör, eşiği onun üstüne koy. Ve ölçümü bir kere de **hatayı geri koyarak**
çalıştır — geçmesi gereken yerde geçmek yetmez, düşmesi gereken yerde
düşmeli.

Ve bir eşik bulunamıyorsa **uydurulmaz**. `holedagilim` için üç istatistik
denendi, üçü de ölçüldü ve üçü de bırakıldı (dosyanın başında yazılı):
sonuncusu dağılımı güzel topluyordu ama sahte bir yığınla denenince kırk
dokuz tahtanın otuz birinde kör çıktı. Dosya artık kapı kurmadığı şeyi
**tabloya** yazıyor ve tek bir dar iddiayı kapı yapıyor. Her zaman geçen
bir kapıdan da, her zaman düşen bir kapıdan da bu iyi.

Düşen bir ölçüm iki şeyden biri olabilir ve ikisi aynı satır gibi görünür:
**bozulmuş bir oyun**, ya da **verilmemiş bir karar**. `holesaat` bugün
kırmızı duruyor çünkü saat yapması gereken işin 3.3 katı ve onu kısmak canlı
bir oyunu herkes için zorlaştırmak demek — kararın sahibi Kaan, ve betik
bunu çıktısında kendi söylüyor. Böyle bir kırmızıyı sessiz bırakmak, onu
görmezden gelinecek bir satıra çevirir.

## Dil

Kaan'la Türkçe konuşuluyor. Kod yorumları ve belgeler de Türkçe; commit
mesajları İngilizce.
