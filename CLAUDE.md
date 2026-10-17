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

Bu, geliştirilen iki oyunu koşturuyor: Motor Works (`ty*`) ve Slice Rush
(`sl*`), yaklaşık yirmi beş dakika. Tek tek: `npm run test:tycoon`,
`npm run test:slicer`. Fruit Hole ayrı, çünkü doksan üç betiği var:
`npm run test:fruithole` yükleme öncesi bakılacak on altı ölçüm (~35
dakika), `npm run test:fruithole:tam` hepsi (saatler). Hepsi birden:
`npm run test:all`.

Önce `build-www.mjs` çalışıyor, sonra betikler sırayla; sonunda tek bir
özet, hangisi kaç saniye sürdü ve düşen varsa onun FAIL satırları.

Hepsi Playwright + gerçek sayfa. Konteynerde GPU yok, SwiftShader'la
çiziliyor ve bir kare 300-450 ms sürüyor.

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

Kural: eşik **seçilmez, ölçülür**. Aynı yapımı üç kez koşturup gürültüyü
gör, eşiği onun üstüne koy. Ve ölçümü bir kere de **hatayı geri koyarak**
çalıştır — geçmesi gereken yerde geçmek yetmez, düşmesi gereken yerde
düşmeli.

## Dil

Kaan'la Türkçe konuşuluyor. Kod yorumları ve belgeler de Türkçe; commit
mesajları İngilizce.
