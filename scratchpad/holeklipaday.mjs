// Hangi bölüm klibe uygun? Yirmi dakikalık çekimden önce otuz saniyelik
// bakış.
//
//   node build-www.mjs && node scratchpad/holeklipaday.mjs
//   node scratchpad/holeklipaday.mjs 37 44 52     # bölüm numaraları
//
// ## Neden var
//
// `make-clips` bir klibi ancak **çekerken** reddedebiliyor: ısınma
// bölümün on altı saniyesini oynuyor, şartları arıyor, tutmazsa
// vazgeçiyor. Konteynerde bir deneme yirmi dakikayı geçiyor (720×1280
// kare SwiftShader'da saniyeler sürüyor) ve üç deneme hakkı var, yani
// tutmayan bir kimlik bir saat yiyebiliyor.
//
// Bugün tam bu oldu: `tulip` iki kez çekildi, ikisinde de "dev çok büyük"
// (1.81 ve 1.89, sınır 1.6) deyip düştü. O cevabı almak için tahtayı
// oynatmaya gerek yoktu — tahtanın **kurulduğu** andaki dev boyutları
// zaten söylüyordu.
//
// Bu betik tahtayı kuruyor, hiç oynamıyor, ve klibin beş şartından
// tahtaya bağlı olanlarını okuyor: kadrajda dev var mı, en yakın devin
// boyu deliğin kaç katı, tahtada hangi engelden kaç tane var. Sonra
// "çekilebilir mi" diye değil, **hangi şart tutmuyor** diye yazıyor —
// karar çeken kişinin.
//
// Eşikler `make-clips`in kendi varsayılanları (`--near 1.6`, `--engelr
// 8`) ve buraya ikinci kez yazılmıyor: aracın kaynağından okunuyor.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const ARAC = readFileSync('/home/user/holegame/fruithole/make-clips.mjs', 'utf8');
const sabit = (ad, varsayilan) => {
  const m = ARAC.match(new RegExp(`const ${ad} = Number\\(arg\\('[a-z]+', ([0-9.]+)\\)\\)`));
  return m ? Number(m[1]) : varsayilan;
};
const NEAR_MAX = sabit('NEAR_MAX', 1.6);
const ENGEL_R = sabit('ENGEL_R', 8);

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-fruithole' + p); } catch {}
  if (b) {
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } else { r.writeHead(404); r.end('no'); }
}).listen(8624);

// Varsayılan: aracın çekilmemiş dört kimliğinin bölümleri. Numaralar
// elle değil, aracın kendi listesinden ve oyunun düzen sırasından
// çıkıyor — yani bir düzen kayarsa buradaki numara da kayar.
const ARGV = process.argv.slice(2).map(Number).filter(Boolean);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const hata = [];
pg.on('pageerror', e => hata.push(String(e).split('\n')[0]));
await pg.goto('http://localhost:8624/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.fruitHoleWhere === 'function', null, { timeout: 30000 });
await pg.evaluate(() => window.fruitHoleDrawOff(true));

// Aracın çekilmemiş dört kimliği düzen **adıyla** yazılı; bölüm
// numarasını oyun söylüyor (`fruitHoleProbe(n).pattern`). Numarayı
// buraya yazmak, bir düzen kayınca sessizce başka bir tahtayı ölçmek
// olurdu — aracın kendisi de bu yüzden numarayı sormuyor, arıyor.
const bolumler = ARGV.length ? ARGV : await pg.evaluate((adlar) => {
  const yer = new Map();
  for (let i = 1; i <= 60 && yer.size < adlar.length; i++) {
    const ad = window.fruitHoleProbe(i).pattern;
    if (adlar.includes(ad) && !yer.has(ad)) yer.set(ad, i);
  }
  return adlar.map(a => yer.get(a)).filter(Boolean);
}, ['Dial', 'Comb', 'Boomerang', 'Key']);

console.log(`\n  eşikler araçtan: dev boyu ≤ ${NEAR_MAX} · engel ≤ ${ENGEL_R} birim\n`);
console.log('  blm | düzen       | tahta   | kadrajda dev | en yakın dev | engeller');
console.log('  ----+-------------+---------+--------------+--------------+-----------------');

const satir = [];
for (const n of bolumler) {
  const r = await pg.evaluate((n) => {
    // `fruitHoleProbe` tahtayı kuruyor ve deliği başa alıyor: klibin
    // ısınmadan önce gördüğü hâl bu.
    const p = window.fruitHoleProbe(n);
    const w = window.fruitHoleWhere();
    const g = window.fruitHoleGiantList();
    const onde = g.filter(x => x.dz < 3 && x.dist < 13);
    const engel = {
      'mancınık': (window.fruitHoleCatapults().yerler || []).length,
      'silindir': (window.fruitHoleRollers().yerler || []).length,
      'çamur': (window.fruitHoleMud().yerler || []).length,
      'rüzgâr': window.fruitHoleWind().var ? 1 : 0,
    };
    return {
      n, ad: p.pattern, tur: p.kind,
      dev: onde.length,
      boy: onde.length ? +(onde[0].r / (w.r * 0.92)).toFixed(2) : null,
      enKucuk: g.length ? +(Math.min(...g.map(x => x.r)) / (w.r * 0.92)).toFixed(2) : null,
      engel,
    };
  }, n);
  satir.push(r);
  const eng = Object.entries(r.engel).filter(([, k]) => k > 0)
    .map(([k, v]) => `${k}:${v}`).join(' ') || 'yok';
  console.log(`  ${String(r.n).padStart(3)} | ${(r.ad || '—').padEnd(11)} | ` +
    `${(r.tur || '—').padEnd(7)} | ${String(r.dev).padStart(12)} | ` +
    `${String(r.boy ?? '—').padStart(12)} | ${eng}`);
}

const fails = [];
const check = (ok, ne, ek = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ne}${ek ? '   ' + ek : ''}`);
  if (!ok) fails.push(`${ne} ${ek}`);
};
console.log('');

// Kapı tek ve dar: **bu betik oyunu okuyabiliyor mu.** Hangi bölümün
// klibe uygun olduğu bir karar, kapı değil — tahta her kuruluşta
// rastgele ve "bu bölüm uygun değil" demek oyunun bozuk olduğunu
// söylemez. O yüzden tablo tabloda kalıyor, kapı yalnızca ölçümün
// kendisini koruyor: okuma çalışıyor mu, ve sayfa hata veriyor mu.
check(satir.length > 0 && satir.every(r => r.ad), 'bölümler okunabildi',
  satir.map(r => `${r.n}:${r.ad}`).join(' '));
check(satir.some(r => r.dev > 0), 'en az bir tahtada kadrajda dev var',
  `${satir.filter(r => r.dev > 0).length}/${satir.length}`);
check(hata.length === 0, 'sayfa hatası yok', hata[0] || '');

// ## Bu tablo neyi söyler, neyi söylemez
//
// **Söyler:** tahtanın türü (şerit/resim/bulmaca tahtasına engel
// yerleşmiyor, klip oraya kurulamaz) ve hangi engelden kaç tane var.
// Bu ikisi tahtanın kurulduğu anda belli ve klibin "engel kadrajda"
// şartının asıl belirleyicisi: üç çamuru olan bir tahtada engelin
// kadraja girmesi, tek silindirli bir tahtadakinden çok daha olası —
// aracın kimlik listesinde zaten yazılı olan şey.
//
// **Söylemez:** "dev boyu" şartının tutup tutmayacağını. Buradaki sayı
// tahtanın **ilk** hâli, yani deliğin en küçük olduğu an; araç kaydı
// başlatmadan önce on altı saniye oynuyor ve delik o sürede büyüyor,
// oran düşüyor. Dördünün de burada 1.6'nın üstünde çıkması "bu bölümler
// olmaz" demek değil — yalnızca başlangıçta öyle olduğunu söyler.
//
// Bu ayrımı yazmanın sebebi: ilk hâli "ilk bakışta uygun: yok" diye bir
// satır basıyordu ve o satır, ölçmediği bir şey hakkında karar
// veriyordu. Bir ölçümün en kolay yalanı, elindeki sayıdan daha büyük
// bir soruya cevap vermesi.
const cokEngel = satir.filter(r => Math.max(...Object.values(r.engel)) >= 3);
console.log(`\n  üç ya da daha çok engeli olan tahta (kadraja girme şansı yüksek): ` +
  (cokEngel.length ? cokEngel.map(r => `${r.n} ${r.ad}`).join(' · ') : 'yok'));
console.log('  dev boyu sütunu tahtanın ilk hâli: araç on altı saniye oynadıktan');
console.log('  sonra bakıyor ve delik o sürede büyüyor — bu sütun o şartı tahmin etmez.');

console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
process.exitCode = fails.length ? 1 : 0;
await br.close(); srv.close();
