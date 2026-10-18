# Kapalı test için testçi çağrısı — Slice Rush

Yapısı Fruit Hole'unkinin aynısı ve sebebi orada yazılı
(`fruithole/store/production-access.md` → "Ne yazılacak"): kısa,
İngilizce, karşıdakine ne yapacağını söyleyen, ve **bağlantı vermiyor,
adres istiyor** — kapalı testin katılma adresi listede olmayan birinde
açılmıyor ve açılmadığında kişi sana değil Google'a kızıp bırakıyor.

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

It's on Google Play's closed test, which means I have to add people by
hand. Comment or DM me the Gmail address you use on your phone and I'll
put you on the list tonight. It has to be the account your phone's Play
Store is signed in to, otherwise the invite just 404s for you.

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

### Önce kurulacak: her oyuna açık bir Google Grubu

Slice Rush ve Motor Works'te bu **yok** (Fruit Hole'da var:
`fruit-hole-testers@googlegroups.com`). Sırayla:

1. groups.google.com → yeni grup, ör. `slice-rush-testers`
2. Katılım ayarı: **"Anyone on the web can join"** — kapalıysa yabancı
   giremez ve bütün kalıp çöker
3. Play Console → Test → Kapalı test → **Test kullanıcıları** →
   Google Grupları → grup adresini yapıştır

### Yapıştırılacak metin — Slice Rush

```
Hi developers, I need 12 testers for my game and I will do the same for
yours — drop your links and I'll join today.

Slice Rush — a one-finger blade game: you set the blade's height, it
cuts everything it meets, and you miss the bars.

Join the authorized Google Group: https://groups.google.com/g/slice-rush-testers
Opt in: https://play.google.com/apps/testing/com.kaancetinkaya.slicerush
Install from Google Play with the same Google account: https://play.google.com/store/apps/details?id=com.kaancetinkaya.slicerush

Please join and I will do the same for your app.
```

### Motor Works

Aynı kalıp, ikinci satır ve bağlantılar değişiyor:

```
Motor Works — an idle car factory: four stations in a chain, and the
whole game is finding the one everything else is waiting on.

Join the authorized Google Group: https://groups.google.com/g/motor-works-testers
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
