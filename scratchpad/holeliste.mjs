// bolumler.md ve yerler.md'yi oyundan ölçüp üretiyor.
//
// İki belge de elle yazılmıştı ve bir tur 48 bölümken doğruydu. Altı düzen
// eklenince ikisi de sessizce yanlışa döndü: hem satır sayısı, hem "ikinci
// tur için 48 ekle" cümlesi, hem de hangi bölümde hangi yerin olduğu. Elle
// yazılmış bir sayı, düzen listesi değiştiğinde haber vermiyor — bu yüzden
// artık iki belgenin de gövdesi buradan çıkıyor.
//
// Çıktı: scratchpad/liste-bolumler.md ve scratchpad/liste-yerler.md.
// Türkçe açıklamalar (hangi yerde ne nesne var) elle yazılmış metin; onlar
// aşağıdaki NE_VAR tablosundan geliyor ve yeni bir yer eklendiğinde buraya
// bir satır eklemek gerekiyor — eksik kalırsa betik bunu söylüyor.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync, writeFileSync } from 'fs';

const NE_VAR = {
  'Valley of Kings': 'Mısır — sfenks, dikilitaş, hiyeroglif zemin',
  'Neon Night': 'Tokyo — torii kapısı, ramen, neon sokak',
  'Beach': 'kumsal — deniz yıldızı, deniz kabuğu, parmak arası terlik',
  'Matchday Germany': 'Almanya maçı — bira bardağı, bratwurst, bas davul',
  'Manhattan': 'New York — sarı taksi, yangın musluğu, sosisli, yaya çizgisi',
  'Highlands': 'İskoçya — gayda, tüylü inek, viski fıçısı, tartan zemin',
  'Copacabana': 'Rio — tukan, samba davulu, teleferik, mozaik kaldırım',
  'Aloha': 'Hawaii — palmiye, sörf tahtası, tiki, siyah kum',
  'Cup Night': 'kupa gecesi — kocaman kupa, madalya, TV kamerası, yıldızlı saha',
  'Match Day': 'maç günü — top, krampon, forma, çim',
  'Playground': 'oyun parkı — salıncak, kaydırak, tahterevalli',
  'Hollywood': 'Hollywood — klaket, film makarası, projektör, kaldırım',
  'Market Day': 'pazar — terazi, sepet, ekmek, peynir, arnavut kaldırımı',
  'Matchday Italy': 'İtalya maçı — Vespa, espresso, tifo, kavisli saha',
  'Gadget Shop': 'teknoloji mağazası — televizyon, piyano, kulaklık',
  'Indoors': 'ev içi — ahşap zemin, dondurma, donut, kupa',
  'Matchday England': 'İngiltere maçı — atkı, korner bayrağı, kareli saha',
  'Orbit': 'uzay — uydu, gezegen, kask, istasyon güvertesi',
  'Castle Keep': 'kale — miğfer, kalkan, taştaki kılıç, mancınık',
  'Rangoli': 'Hindistan — fil, baharat tepsisi, çay güğümü, tabla, rangoli zemin',
  'Drive-In': 'arabalı sinema — burger, patates, kola, asfalt',
  'Suburb Night': 'banliyö gecesi — BMX, ampul dizisi, bal kabağı, posta kutusu, biçilmiş çim',
  'Harvest': 'hasat — saman balyası, tavuk, yumurta, sürülmüş toprak',
  'Fiesta': 'Meksika — sombrero, marakas, kaktüs, piñata, talavera çini',
  'Frontier': 'Vahşi Batı — at arabası, boğa kafatası, şerif yıldızı, kurak toprak',
  'The Arena': 'Kolezyum — miğfer, kalkan, sütun, defne, arena kumu',
  'Grand Bazaar': 'Kapalıçarşı — simit, çay, nazar boncuğu, lokum, kilim',
  'Gold Coast': 'Dubai — kule, süper araba, şahin, deve, meydan taşı',
  'Le Jardin': 'Paris — demir kule, kruvasan, kafe sandalyesi, sokak lambası',
  'Pirate Cove': 'korsan koyu — çapa, dümen, top, papağan, gemi güvertesi',
  'Tulip Fields': 'Hollanda — yel değirmeni, bisiklet, takunya, peynir, lale tarlası',
  'Red Square': 'Moskova — soğan kubbe, matruşka, semaver, kar',
  'Forbidden City': 'Yasak Şehir — ejder, fener, panda, çay, kiremit',
  'Savanna': 'savan — zürafa, zebra, akasya, davul, kurak çim',
  'Tikal': 'kayıp şehir — Maya piramidi, taş maske, liyan, totem',
  'Overgrown': 'terk edilmiş şehir — çökmüş çatı, rüzgârgülü, fıçı, kaktüs',
  'Happy Hour': 'bar — neon tabela, taburе, kokteyl, plak',
  'Funfair': 'lunapark — dönme dolap, atlıkarınca, pamuk şeker, balon',
  'The Reef': 'resif — mercan, denizanası, istiridye, kum dalgası',
  'Jurassic': 'dinozor — stegosaurus, dino yumurtası, eğrelti otu, kaburga, volkanik kül',
  'Nazca': 'Nazca — lama, pan flüt, chullo, dokuma, pampa çizgileri',
  'Outback': 'Avustralya — kanguru, koala, okaliptüs, yol tabelası, kızıl toprak',
  'Payday': 'para — bitcoin, euro, rupi, peso, mermer zemin',
  'Academy': 'akademi — şamdan, gargoyle, demir kapı, kitap yığını, taş döşeme',
  'Matchday France': 'Fransa maçı — bere, tricolore, konfeti, dikey çizgili saha',
  'Matchday Spain': 'İspanya maçı — flama, portakal, paella, çapraz çizgili saha',
  'Red Planet': 'Mars — keşif aracı, iniş aracı, bayrak, drone, kızıl toz',
  'Snow Day': 'kar — kardan adam, eldiven, baston şeker, penguen',
  'Rooftop': 'çizgi roman çatısı — su deposu, yangın merdiveni, projektör, telefon kulübesi',
  'Cube World': 'küp dünya — kazma, meşale, sandık, küp örümcek, blok çim',
  'Pit Lane': 'pist — lastik yığını, damalı bayrak, pit tabelası, asfalt ve kerb',
  'Arcade': 'atari salonu — oyun dolabı, joystick, piksel hayalet, neon halı',
  'Drop Zone': 'ada — ganimet sandığı, paraşüt, erzak kutusu, fırtına duvarı',
};

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-fruithole' + p); } catch {}
  if (b) {
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } else { r.writeHead(404); r.end('no'); }
}).listen(8477);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.goto('http://localhost:8477/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.fruitHoleProbe === 'function', { timeout: 25000 });

const tbl = await pg.evaluate(() => window.fruitHoleThemeTable());
const TUR = tbl.order.length;
// Tur kayması oyundan okunuyor, buraya yazılmıyor.
const KAY = await pg.evaluate(() => {
  // patternForLevel'in kaymasını geri çöz: 2. turun ilk bölümünde hangi
  // düzen var?
  const n = window.fruitHoleThemeTable().order.length + 1;
  window.fruitHoleProbe(n);
  return window.fruitHoleThemeTable().order.indexOf(window.fruitHoleLevelName());
});
const adlar = Object.fromEntries(tbl.themes.map(t => [t.id, t.name]));

// Her düzenin kendi teması var; yerin adı ve rozeti oradan geliyor.
const satir = [];
for (let lv = 1; lv <= TUR; lv++) {
  const o = await pg.evaluate(async (l) => {
    window.fruitHoleSeedField(3100 + l);
    const p = window.fruitHoleProbe(l);
    window.fruitHoleStartLevel();
    const engel = [];
    if (window.fruitHoleCatapults().sayi) engel.push('mancınık');
    if (window.fruitHoleRollers().sayi) engel.push('silindir');
    if (window.fruitHoleMud().sayi) engel.push('çamur');
    if (window.fruitHoleWind().var) engel.push('rüzgâr');
    if (window.fruitHoleRival().var) engel.push('rakip');
    if (window.fruitHoleBombs().sayi) engel.push('bomba');
    const dev = window.fruitHoleGiants().count;
    window.fruitHoleUnseedField();
    return { ...p, engel, dev };
  }, lv);
  satir.push({ lv, ...o, tema: tbl.patternThemes[lv - 1], ikon: tbl.icons[lv - 1] });
}

const eksik = satir.filter(s => !NE_VAR[adlar[s.tema]]);

const KIND = { 'resim': 'RESİM', 'şerit': 'ŞERİT', 'bulmaca': '**BULMACA**', 'ızgara': 'ızgara' };
const GOREV = {
  order: '**SİPARİŞ**', giants: '**DEVLER**', rush: '**RUSH**',
  mines: '**MAYIN**', puzzle: '**BULMACA**',
};

let b = `# Bölüm bölüm ne var

${TUR} düzen bir **tur**. ${TUR + 1}. bölüm 1. düzene dönüyor, ama bölüm numarası
devam ettiği için engeller ve saat değişiyor: 2. turda her tahta kendi
engel çiftini alıyor (1. turda eşikler henüz geçilmemiş olabiliyor) ve
saat tur tur sıkılaşıyor.

Yani **bölüm ${TUR + 1} = 1. düzen değil.** Oyun her turda sırayı ${KAY} adım
ötelliyor, bu yüzden ikinci turun ilk bölümü listenin ${KAY + 1}. düzeni oluyor.
Hangi yerin ikinci turda hangi bölümde çıktığı yerler.md'de yazılı.

Engeller tohuma göre biraz değişir — bu liste tek bir tohumun ölçümü.
Eşikler sabit: bomba 7, kaya 9, diken 12, mancınık 20, silindir 24,
çamur 29, rakip 31, rüzgâr 34.

Bu dosya elle yazılmıyor: \`node scratchpad/holeliste.mjs\` üretiyor.

| blm | yer | düzen | tahta | meyve | dev | saat | engeller |
|---|---|---|---|---|---|---|---|
`;
for (const s of satir) {
  const tahta = s.mission ? GOREV[s.mission] || KIND[s.kind] : KIND[s.kind];
  b += `| **${s.lv}** | ${adlar[s.tema]} | ${s.pattern} | ${tahta} | ${s.fruit} | ${s.dev} | ${Math.round(s.seconds)}s | ${s.engel.join(', ') || '—'} |\n`;
}

// İkinci turda aynı yer hangi bölümde?
//
// "Bölüm numarasına ${TUR} ekle" diye yazıyordu ve yanlıştı. Oyun turdan
// tura sırayı kaydırıyor (`TIER_SHIFT`), yani 55. bölüm 1. düzen değil.
// Kaymayı oyunun kendi formülünden geri çözüyor: t. turda i. düzen
// (n-1 + t*KAY) % TUR === i olan n'de çıkıyor.
const ikinciTur = (i) => ((i - KAY + TUR * 2) % TUR) + TUR + 1;

let y = `# Hangi bölümde hangi yer

${TUR} yer, ${TUR} bölüm, sonra baştan — ama **sıra her turda kayıyor**, o
yüzden ikinci tur bölüm numarasına ${TUR} eklemek değil. Oyun her turda
sırayı ${KAY} adım ötelliyor, yani aynı yer ikinci turda başka bir numarada
çıkıyor. Aşağıdaki sütun o numarayı veriyor.

Yerin adı bölüm başında rozette yazıyor, ve bölüm başlarken kamera bütün
tahtayı gösteriyor — zemin ve nesneler orada görünüyor.

Bu dosya elle yazılmıyor: \`node scratchpad/holeliste.mjs\` üretiyor.

| blm | 2. tur | yer | ne var |
|---|---|---|---|
`;
for (const s of satir) {
  const ad = adlar[s.tema];
  y += `| **${s.lv}** | ${ikinciTur(s.lv - 1)} | ${s.ikon} ${ad} | ${NE_VAR[ad] || '**açıklama eksik**'} |\n`;
}

// Dosyaya doğrudan yazıyor, araya bir dosya koymuyor.
//
// İlk yazışta betik `scratchpad/liste-*.md` üretiyordu ve onu belgenin
// içine taşımak elle yapılıyordu. Elle yapılan adım bir dahaki sefere
// yapılmıyor — belgenin iki yıl yanlış kalmasının sebebi tam buydu.
// Tablonun altındaki elle yazılmış bölümler (görevler, konsept grupları)
// korunuyor: ilk `## ` başlığından sonrası olduğu gibi kalıyor.
function yaz(yol, govde) {
  const tam = '/home/user/holegame/' + yol;
  let alt = '';
  try {
    const eski = readFileSync(tam, 'utf8');
    const i = eski.indexOf('\n## ');
    if (i >= 0) alt = eski.slice(i);
  } catch {}
  writeFileSync(tam, govde.replace(/\s+$/, '') + '\n' + alt);
}
yaz('fruithole/store/bolumler.md', b);
yaz('fruithole/store/yerler.md', y);
console.log(`\n  ${TUR} bölüm yazıldı`);
if (eksik.length) {
  console.log('  açıklaması eksik yer: ' + eksik.map(s => adlar[s.tema]).join(', '));
} else {
  console.log('  her yerin açıklaması var');
}

await br.close(); srv.close();
