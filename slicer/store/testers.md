# Kapalı test için testçi çağrısı — Slice Rush

Yapısı Fruit Hole'unkinin aynısı ve sebebi orada yazılı
(`fruithole/store/production-access.md` → "Ne yazılacak"): kısa,
İngilizce, ve karşıdakine ne yapacağını söyleyen.

**Metin 19 Ekim'de değişti: artık adres istemiyor, üç bağlantı
veriyor.** Eski hâli "bana Gmail adresini yolla, listeye ben eklerim"
diyordu ve gerekçesi doğruydu — kapalı testin katılma adresi listede
olmayan birinde açılmıyor. Ama 18 Ekim'de testçi listesi **Google
Grubu**'na çevrildi (`fenix-game-testers`), yani yabancı artık kendi
kendine listeye girebiliyor: gruba katılıyor, sonra opt-in çalışıyor.
Elle ekleme adımı ortadan kalktı, ve onunla birlikte "Kaan cevap
yazana kadar bekleyen kişi" de.

Uygulama kimliği: `com.kaancetinkaya.slicerush`

---

## r/alphaandbetausers

Başlık:

```
[Android] Slice Rush - a one-finger blade game, looking for closed testers
```

Gövde:

```
I've been building this on my own. A blade flies down a corridor and
the only thing you control is its height: slide your finger up and
down, cut everything it meets, and miss the bars.

The cut is real. Nothing is swapped for a pre-broken model — the object
is split at exactly the height the blade went through, so cutting near
the top of a melon gives you a cap and a bowl, and you cannot cut the
same melon the same way twice.

It is on Google Play's closed test, so there are three steps and they
have to be in this order:

1. Join the group: https://groups.google.com/g/fenix-game-testers
2. Opt in: https://play.google.com/apps/testing/com.kaancetinkaya.slicerush
3. Install: https://play.google.com/store/apps/details?id=com.kaancetinkaya.slicerush

Use the same Google account your phone's Play Store is signed in to —
with any other account step 2 just 404s, and that is where most people
give up.

What I actually need is people who get past level 12. That is where the
corridor starts asking real questions — a clamp with one narrow window,
then gates alternating floor and ceiling, then a mine sitting on the
line the fruit is running along. If something breaks, freezes or just
feels unfair, tell me which level.

Free, no signup, works offline.
```

## r/TestMyApp

Aynı metin, **ilk iki paragraf atılarak**. Orada oyunun ne olduğu değil,
testin ne istediği okunuyor.

## r/AndroidGaming

**Önce kenar çubuğundaki kuralları oku.** Çoğu büyük oyun alt forumu
kendi oyununu tanıtmayı ya tamamen yasaklıyor ya da haftanın belirli bir
gününe bağlıyor. Silinen gönderi + kısıtlanan hesap, oradan gelecek beş
kişiye değmez. İzin varsa metin yukarıdakinin aynısı.

---

## Telegram / karşılıklı test grupları — **iki test için birden**

Bu bölüm Motor Works'ü de kapsıyor: aynı kişi iki listeye birden
girebiliyor, yani tek mesajla iki sayaç birden dolar.

**Hangi kanal? Kayıtta yoktu, bir kez unutuldu.** Depoda bugüne kadar
yalnızca *"Telegram/Discord'da closed testing exchange grupları"* diye
bir **tür** yazılıydı; tek somut şey Fruit Hole'un listesine bağlı
`testers-community@googlegroups.com` ve o bir Google Grubu, Telegram
değil. Aranan kanalın adı hiçbir yere yazılmadığı için kayboldu — bu
dosya onun için var. Aday kanallar, 18 Ekim 2026'da arandı:

| Kanal | Durum |
|---|---|
| `testers-community@googlegroups.com` | **Zaten kullanılıyor** (Fruit Hole'un listesinde bağlı) |
| `t.me/console_testers` | Bir duyurudan geliyor ama duyuru ~923 günlük; yaşıyor mu belirsiz |
| `t.me/GooglePlay20Testers` | ~110 üye, kimin işlettiği doğrulanmadı |

Girmeden önce bakılacak şey: **üyeler gerçek insan mı.** Bu gruplar için
dile getirilen asıl risk bot ağları, ve sahte etkileşim yakalanırsa
ceza uygulamaya değil **geliştirici hesabına** yazılıyor. (Uyarıyı dile
getirenlerin bir kısmı ücretli testçi satan siteler, yani tek taraflı
bir kaynak — ama risk yine de gerçek.)

Uyarı önce: "closed testing exchange" grupları on iki kişiyi hızlı
buluyor ama gelen kişi oyunu **oynamıyor** — kurup bırakıyor. Google'ın
istediği şey gerçek test ve üretim başvurusunda "testçileri nasıl
buldun" diye soruluyor; sahte görünen bir test doğrudan ret sebebi. Bu
kanal kullanılacaksa dürüstçe ve **tek başına değil** kullanılır:
tanıdıklar + TikTok ile karıştır, hepsi buradan gelmesin.

```
Hi — I have two Android games in Google Play closed testing and I need
the 12 testers / 14 days. Happy to join yours back the same day.

  • Slice Rush — one-finger blade game, you set the blade's height and
    cut everything it meets
  • Motor Works — idle car factory, the puzzle is finding the station
    everything else is waiting on

Send me the Gmail address your phone's Play Store is signed in to and
say which one (or both) and I'll add you tonight.

One ask, and I mean it: please actually open it a couple of times
rather than installing and deleting. Google asks how the testers were
found and a test where nobody played reads as exactly that.
```

## Değiş tokuş grubunun kendi biçimi — üç bağlantı

Bu gruplarda herkes aynı kalıbı atıyor ve kalıba uymayan gönderi
okunmuyor. Üç satır, bu sırayla:

```
Join the authorized Google Group: https://groups.google.com/g/<grup-adı>
Opt in: https://play.google.com/apps/testing/<paket>
Install from Google Play with the same Google account: https://play.google.com/store/apps/details?id=<paket>
```

**Üçü de gerekiyor ve sırası önemli.** Sebebi bu dosyanın başka yerinde
zaten yazılı: kapalı testin katılma bağlantısı **listede olmayan birinde
açılmıyor**. Grup o yüzden birinci satırda — yabancı önce gruba
katılıyor, listeye böyle giriyor, ve ancak ondan sonra opt-in
bağlantısı onda çalışıyor. Grubu atlayıp doğrudan opt-in atmak, karşı
tarafa kapalı bir kapı göstermek demek; o kişi bir daha denemiyor ve
grupta itibarın gidiyor.

### Kurulum — 18 Ekim 2026'da yapıldı

Üç oyun da **tek grubu** paylaşıyor:
`fenix-game-testers@googlegroups.com` (grup adı "fenix game", 19 üye).
Ayrı grup kurulmadı; Play Console aynı grup adresini birden çok
uygulamanın testçi listesine kabul ediyor.

Slice Rush ve Motor Works'te yapılan: Kapalı test → **Kanalı yönet** →
Test kullanıcıları → radyo **"Google Gruplar"** → grup adresi → kaydet.
İkisi de önce "E-posta listeleri" kipindeydi ve o kiple değiş tokuş
kalıbı çalışmıyor: yabancı bir e-posta listesine **katılamaz**, ve
grubu bir e-posta listesinin *içine* adres olarak koymak da aynı şey
değil (Console onu tek bir adres sayıyor). Sayfadaki not bunu kendisi
söylüyor: *"Sadece belirlediğiniz Google Grupların üyeleri testinize
katılabilirler."*

Testçiler sekmesindeki iki bağlantıdan kaydolma olanı **"Web'de
katılın"** altında; "Android'de katılın" altındaki mağaza bağlantısı.

### Yapıştırılacak metin — Slice Rush

```
Hi developers, I need 12 testers for my game and I will do the same for
yours — drop your links and I'll join today.

Slice Rush — a one-finger blade game: you set the blade's height, it
cuts everything it meets, and you miss the bars.

Join the authorized Google Group: https://groups.google.com/g/fenix-game-testers
Opt in: https://play.google.com/apps/testing/com.kaancetinkaya.slicerush
Install from Google Play with the same Google account: https://play.google.com/store/apps/details?id=com.kaancetinkaya.slicerush

Please join and I will do the same for your app.
```

### Motor Works

Aynı kalıp, ikinci satır ve bağlantılar değişiyor:

```
Motor Works — an idle car factory: four stations in a chain, and the
whole game is finding the one everything else is waiting on.

Join the authorized Google Group: https://groups.google.com/g/fenix-game-testers
Opt in: https://play.google.com/apps/testing/com.kaancetinkaya.motorworks
Install from Google Play with the same Google account: https://play.google.com/store/apps/details?id=com.kaancetinkaya.motorworks
```

İkisini tek gönderide birleştirme: gruplar tek uygulamalık gönderi
okumaya alışık, iki oyunlu bir gönderide ikincisi atlanıyor. Ayrı ayrı
at, araya biraz zaman koy.

### Karşılığını gerçekten ver

"I will do the same for your app" bir nezaket cümlesi değil, grubun tek
kuralı. Vermeyen atılıyor, ve atılmadan önce senin opt-in'lerinden
çıkılıyor — yani 14 günlük sayaç sıfırlanıyor. Kaç kişiye söz
verdiysen o kadarına gir.

Not: o gruplarda **t.me bağlantısı yasak** (bot otomatik siliyor).
Yukarıdaki üç bağlantının üçü de google.com, sorun çıkmıyor.

## Sorun bildiren birine ne söylenecek

Testçinin elinden gelen tek şey "bir şey oldu" cümlesi ve o cümleyle
geriye hiçbir sayı kalmıyor. İki oyunda da gizli bir teşhis ekranı var,
ve ona yollanacak tek cümle bu:

```
If anything breaks: on the main menu, tap the small version number in
the bottom-left corner five times quickly. A screen of numbers opens —
hit Copy and paste it to me. It tells me your build, your save and the
last errors, and nothing else.
```

Motor Works'te yazı menünün altında ortada, Slice Rush'ta sol alt
köşede; ikisinde de beş **hızlı** dokunuş gerekiyor (araları 1.2
saniyeyi geçerse sayaç sıfırlanıyor).

## Türkçe tanıdıklara

```
Selam, iki Android oyunum Google'ın kapalı testinde ve şartı 12 kişi,
14 gün. Yapman gereken: linkten test kullanıcısı ol, oyunu indir, bir
iki kez aç. Para yok, kayıt yok, internet bile gerekmiyor.

Bana telefonundaki Play Store'un Gmail adresini yollar mısın? Başka bir
adres olursa link sende açılmıyor — en sık buradan patlıyor.

Hangisini istersen: bıçaklı olan (Slice Rush) ya da fabrika olan
(Motor Works). İkisi de olur.
```
