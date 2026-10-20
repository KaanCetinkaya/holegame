# Pazar — kim ne yayınlıyor, biz nereye oynuyoruz

Eylül 2026. Bu dosya "sıradaki oyun ne olsun" sorusuna sayıyla cevap vermek
için yazıldı. Sayıların hepsi dışarıdan tahmin (AppMagic/Sensor Tower tipi
paneller) — denetlenmiş gelir değil, yön göstergesi. Kaynaklar en altta.

## Önce şu: hyper-casual ölmedi, **ödeme biçimi** değişti

- 2025'te indirme bakımından **büyüyen tek segment** hyper-casual: 22,05
  milyar kurulum. Bütün casual pazarında indirme %7,2 düştü (50,4 milyar).
- Ama para orada değil. Hybrid-casual'ın uygulama içi satış geliri 2025'te
  **%20 artıp 4,2 milyar dolara** çıktı; saf hyper-casual geliri düz kaldı.
- Yani: reklam geliriyle yaşayan hyper-casual formülü indirme üretiyor ama
  para üretmiyor. Bugün para kazanan şey **aynı basit çekirdek + üstüne
  ilerleme ve satın alma katmanı**.

Bu bizim zaten yaptığımız şey: Fruit Hole'un çekirdeği hyper-casual (bir
parmak, dokuz saniyede anlaşılıyor), üstünde bölüm ilerlemesi, çilek
ekonomisi, dört booster, görevler ve rozetler var. Tür olarak yanlış yerde
değiliz.

## Büyük yayıncılar — Ocak 2026 aylık gelir

| yayıncı | aylık gelir | nerede | dikkat çeken |
|---|---|---|---|
| **Rollic** | ~$17,1M | İstanbul, Zynga'ya ait | portföyde 2 milyar+ indirme |
| **Voodoo** | ~$10,5M | Paris | reklamdan IAP'ye geçişi endüstrileştirdi |
| **SayGames** | ~$7,5M | — | Tower Wars ömür boyu $34M IAP |
| **Homa** | ~$6,9M | Paris | **All in Hole** portföydeki en yüksek indirme başı gelir |

Dört rakamın toplamı ayda ~$42M. Bu dört şirket **kendi oyunlarını
yapmıyor** — bağımsız stüdyoların prototiplerini alıp yayınlıyorlar.

**Bizim için buradaki tek önemli satır Homa'nınki.** Bana referans olarak
attığın oyunlardan biri olan **All in Hole**, bu sıralamada indirme başına en
çok para kazanan oyun. Yani tam bizim türümüzde, tam bizim mekaniğimizle,
bir yayıncının elinde ne olduğunu gösteriyor.

Rollic'in bilinen işleri: Picker 3D, Water Shooty, Pixel Shot 3D, Touchdrawn,
Zero21 Solitaire. Hepsi tek mekanikli, hepsi 3D, hiçbiri anlatı taşımıyor —
bizim dosyalarımızla aynı ölçekte işler.

## 2026'da yükselen alt türler

**Blok/sıralama bulmacası — yılın patlaması.** Ocak-yaz 2026 arasında blok
bulmaca çizgisi sert yükseldi ve indirmede başa geçti. **Color Block Jam tek
çeyrekte 21,8 milyon kurulumda ~$42M** yaptı. Aynı çizgide Pixel Flow,
Screwdom, Magic Sort — ve All in Hole.

**Arcade idle — elde tutmada en iyi.** D1 tutma ~%50, ilk gün oyun süresi ~25
dakika, CPI ~$0,40. Karşılaştırma için: bizim ölçtüğümüz indirme başı değer
$0,16. Yani arcade idle satın alınan indirmeyi **kâra çevirebilen** ender
türlerden.

**Tower defense + merge.** Basit çekirdeğe en kolay iliştirilen ilerleme
katmanı; Merge Miners tipik örnek.

**.io / survivor.** Survivor.io formülü hâlâ çalışıyor ama artık live-ops
gerektiriyor — tek kişilik iş değil.

## Elimizde ne var

| oyun | dosya | durum |
|---|---|---|
| **Fruit Hole** | `fruithole/index.html`, 12.167 satır | kapalı testte, 34. sürüm hazır |
| **Hole** | `index.html`, 1.566 satır | prototip, Rapier fizikli |
| **Slice Rush** | `slicer/index.html`, 1.590 satır | oynanır, **mağazada değil** |
| **Motor Works** | `tycoon/index.html`, 1.825 satır | oynanır, **mağazada değil** |

Motor Works zaten bir idle/tycoon — yani yukarıdaki "arcade idle" çizgisine
en yakın duran şey elimizde ve yayınlanmamış duruyor.

## Asıl sorun tür değil, dağıtım

Bu, sıradaki oyunu seçmeden önce söylenmesi gereken şey.

Ölçtüğümüz iki sayı yan yana:

- İndirme başına değerimiz **$0,16** (ARPDAU ~$0,04 × ömür ~4 gün).
- Tier-1'de casual bir indirmenin satın alma maliyeti **$0,50-2,00**.

Yani reklam vererek büyümek her indirmede 3-10 kat zarar. Bu yüzden organik
videoya asıldık — ve altı klipte izletme oranını iki katına çıkardık ama
erişim **281-401 izlenme bandından bir kez bile çıkmadı**. Klip tarafında
ayarlanacak şey bitti.

Beşinci bir oyun yapmak bu sayıyı değiştirmiyor. Onu değiştiren iki şey var:

1. **Yayıncıya başvurmak.** Rollic, Voodoo, Homa ve SayGames bağımsız
   stüdyolardan prototip alıyor ve kullanıcı edinme parasını **onlar**
   ödüyor — yani $0,16 ile $2,00 arasındaki uçurumu kapatan taraf onlar. Tek
   kişilik stüdyoların Voodoo ve Homa tarafından yayınlandığı örnekler var.
   Rollic İstanbul'da ve Türkçe konuşuyor; başvuru için en yakın kapı o.
   İstedikleri şey bitmiş oyun değil, **bir prototip ve CPI testi**.
2. **Elimizdeki iki oyunu yayınlamak.** Slice Rush ve Motor Works oynanır
   hâlde duruyor ve mağazada yok. Yeni bir oyuna başlamadan önce bunlar
   çıkarsa, üç mağaza sayfası ve üç klip kaynağı olur — aynı emekle üç kat
   yüzey.

## Öneri — sırayla

**1. Fruit Hole'u production'a çıkar.** Zaten 14 günlük sayacın sonundayız.
Yayıncıya gösterilecek en güçlü şey çalışan bir mağaza sayfası ve gerçek
tutma sayıları.

**2. Slice Rush ile Motor Works'ü yayınla.** İkisi de bitmiş sayılır; eksik
olan mağaza görselleri, metin ve imzalı derleme — Fruit Hole'da kurduğumuz
boru hattı ikisi için de hazır (`build-www.mjs` zaten `www-slicer/` ve
`www-tycoon/` üretiyor).

**3. Sıradaki yeni oyun blok/sıralama bulmacası olsun.** Sebep:

- 2026'nın tek büyüyen indirme çizgisi ve Color Block Jam'in çeyrekte $42M'i
  tavanın nerede olduğunu gösteriyor.
- Bizim için **en ucuz tür**: fizik yok, 3D zorunlu değil, tahta deterministik
  — yani üretilen her tahta test edilebilir ve çözülebilirliği ölçülebilir.
  Fruit Hole'da öğrendiğimiz ders tam burada işe yarıyor: ölçülemeyen denge
  ayarlanamıyor.
- All in Hole'un mekaniği (delikten geçirmek) bizim zaten yazdığımız kod.

**4. Motor Works'ü arcade idle'a yaklaştırmak** dördüncü sırada: tür en iyi
tutmayı veriyor ama meta katmanı en pahalı yazılan şey, ve elimizde
yayınlanmamış iş varken oraya girmek sırayı bozar.

## Kaynaklar

- [AppMagic — Top-10 Hybrid-Casual Games](https://gamedevreports.substack.com/p/appmagic-top-10-hybrid-casual-games)
- [PocketGamer.biz — What happened to hypercasual](https://www.pocketgamer.biz/what-happened-to-hypercasual-the-markets-evolution-over-the-past-year/)
- [Naavik — The Evolution of Hybridcasual](https://naavik.co/deep-dives/evolution-of-hybridcasual-deepdive/)
- [Naavik — The Great Mobile Convergence](https://naavik.co/weekly-digest/the-great-mobile-convergence/)
- [Udonis — Arcade Idle](https://www.blog.udonis.co/mobile-marketing/mobile-games/arcade-idle)
- [Gamesforum — State of Gaming 2026](https://www.globalgamesforum.com/podcasts/state-of-gaming-heres-what-the-mobile-data-actually-says)
- [InvestGame — Hybridcasual games playbook](https://investgame.net/news/pdf/hybridcasual-games-playbook/)
