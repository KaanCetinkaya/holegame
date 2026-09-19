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

`scratchpad/hole*.mjs`. Hepsi Playwright + gerçek sayfa. Konteynerde GPU yok,
SwiftShader'la çiziliyor — yük altında zaman aşımı olabiliyor, bu bir hata
değil. Testler zamanlamaya bağlı yazılmamalı; gerekiyorsa olay sayfanın
içinden gönderilir.

## Dil

Kaan'la Türkçe konuşuluyor. Kod yorumları ve belgeler de Türkçe; commit
mesajları İngilizce.
