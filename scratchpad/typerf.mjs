// Ucuz bir telefonda bu oyun ne kadar ağır?
//
// TikTok'tan gelen oyuncunun telefonu pahalı değil. Idle oyun saatlerce
// açık duruyor, yani ısınma ve pil de kare hızı kadar önemli. Konteynerde
// GPU yok (SwiftShader), o yüzden kare hızı ölçülemez — ölçülebilen ve
// cihazdan bağımsız olan şey **yük**: çizim çağrısı, üçgen, cisim,
// doku, ve bunların oyun büyüdükçe nasıl değiştiği.
//
// Ölçülen:
//   1. Açılış: ilk kareye kadar geçen süre
//   2. Yük 1. seviyede ve 400. seviyede — büyüme sınırlı mı
//   3. Kasa havuzu: bant üstündeki kasa sayısı patlıyor mu
//   4. Otuz şube devrinden sonra doku ve geometri birikiyor mu
//   5. Uzun koşuda cisim sayısı sabit mi (sızıntı)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8607);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

console.log('\n1) Açılış');
// Üç ölçüm, en iyisi alınıyor: konteyner yük altında ve SwiftShader
// yazılımla çiziyor, yani tek ölçüm gürültülü. Mutlak sayı telefonu
// temsil etmiyor; bakılan şey **sıçrama** olup olmadığı.
const sureler = [];
for (let i = 0; i < 3; i++) {
  const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
  await pg.addInitScript(() => { localStorage.clear(); window.__t0 = performance.now(); });
  await pg.goto('http://localhost:8607/', { waitUntil: 'load', timeout: 90000 });
  await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 60000 });
  await pg.waitForFunction(() => window.jePerf().cagri > 0, { timeout: 60000 });
  sureler.push(await pg.evaluate(() => Math.round(performance.now() - window.__t0)));
  await pg.close();
}
console.log(`     ilk kareye kadar ${sureler.join(' / ')} ms (en iyisi ${Math.min(...sureler)})`);
// SwiftShader'da üç saniye, donanım hızlandırmalı bir telefonda çok daha
// az. Eşik gevşek: aranan şey saniyeler süren bir açılış.
ok(Math.min(...sureler) < 6000, 'açılış makul', `${Math.min(...sureler)} ms`);

const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8607/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 60000 });
await pg.evaluate(() => { document.getElementById('dOk')?.click(); window.jeTutSkip(); });
await pg.waitForTimeout(600);

console.log('\n2) Yük, seviyeye göre');
const yuk = [];
for (const lv of [1, 50, 100, 200, 400, 1000]) {
  const d = await pg.evaluate(async l => {
    window.jeGive(1e18);
    for (let i = 0; i < 4; i++) { window.jeSetLevel(i, l); window.jeGiveManager(i); }
    window.jeRefresh();
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    return window.jePerf();
  }, lv);
  yuk.push({ lv, ...d });
  console.log(`     sv ${String(lv).padStart(4)}  çizim ${String(d.cagri).padStart(4)} · üçgen ${String(d.ucgen).padStart(7)} · cisim ${String(d.cisim).padStart(4)} · doku ${d.doku} · geometri ${d.geometri} · kasa ${d.kasa}`);
}
const ilk = yuk[0];
// Doğru soru "1. seviyeye göre kaç kat" değil. İstasyonların `grow`
// parçaları ilk elli seviyede birer birer görünür oluyor — yük orada
// **bir kez** sıçrıyor ve bu tasarım. Asıl risk ondan sonrası: yük
// seviyeyle artmaya devam ederse 1000. seviyede telefon durur.
const plato = yuk.filter(y => y.lv >= 50);
const enAz = Math.min(...plato.map(y => y.cagri)), enCok = Math.max(...plato.map(y => y.cagri));
console.log(`     sv 1 → 50 sıçrama: çizim ${ilk.cagri} → ${yuk[1].cagri} (modeller açılıyor, tasarım)`);
console.log(`     sv 50 → 1000 plato: çizim ${enAz}-${enCok} · üçgen ${Math.min(...plato.map(y => y.ucgen))}-${Math.max(...plato.map(y => y.ucgen))}`);
// Aradaki oynama bant üstündeki kasa sayısından: örnek alınan karede
// kaç kasa olduğuna göre değişiyor, seviyeye göre değil.
ok(enCok < enAz * 1.3, 'elli seviyeden sonra yük sabit', `${enAz}-${enCok}`);
ok(enCok < 400, 'çizim çağrısı mobil için makul', `${enCok}`);

console.log('\n3) Bant üstündeki kasalar');
// Kasalar havuzdan geliyor. Hızlı bir fabrika saniyede onlarca
// üretiyor; havuz çalışmazsa sahnede binlerce kasa birikir.
const kasa = await pg.evaluate(async () => {
  const say = [];
  for (let k = 0; k < 10; k++) {
    for (let i = 0; i < 20; i++) window.jeStep(0.05);
    await new Promise(r => requestAnimationFrame(r));
    say.push(window.jePerf().kasa);
  }
  return say;
});
console.log(`     kasa sayısı: ${kasa.join(' ')}`);
// Sayı 3 ile 42 arasında salınıyor: kasalar bandın ucunda toplu
// halde siliniyor, yani örneklemenin hangi ana denk geldiği sonucu
// belirliyor. İlk hâli iki tek örneği karşılaştırıyordu (`kasa[2]` ile
// `kasa[9]`) ve koşudan koşuya bazen geçip bazen düşüyordu — ölçüm
// değil, zar atışı. Trend iki yarının ortalamasından okunuyor.
const ort = a => a.reduce((x, y) => x + y, 0) / a.length;
const ilkYari = ort(kasa.slice(0, 5)), sonYari = ort(kasa.slice(5));
console.log(`     ilk yarı ortalama ${ilkYari.toFixed(1)} · son yarı ${sonYari.toFixed(1)}`);
ok(Math.max(...kasa) < 400, 'kasa sayısı sınırlı', `en çok ${Math.max(...kasa)}`);
ok(sonYari < ilkYari * 1.5 + 5, 'kasa sayısı zamanla büyümüyor',
   `${ilkYari.toFixed(1)} → ${sonYari.toFixed(1)}`);

console.log('\n4) Otuz şube devri');
// Her devirde zemin dokusu yeniden üretiliyor ve ağaç renkleri
// değişiyor. Eskisi atılmazsa GPU'da birikiyor.
// İki tur: tek tur ölçmek yanıltıyor. İlk turda geometri sayısı 70'ten
// 99'a çıkıyor ve bu sızıntı değil — düşük seviyede gizli duran
// parçalar ilk kez görünür olup GPU'ya yükleniyor. Sızıntı olsaydı
// **ikinci tur da** aynı kadar artardı.
const turlar = await pg.evaluate(async () => {
  const kare = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const o = [];
  await kare(); o.push(window.jePerf());
  for (let t = 0; t < 3; t++) {
    for (let i = 0; i < 30; i++) window.jeSetBranch(i % 5);
    await kare(); o.push(window.jePerf());
  }
  return o;
});
// Kasalar sahnenin çocuğu ve sayıları banda göre 3 ile 42 arasında
// gidip geliyor, yani ham cisim sayısı örneklemenin **anına** bağlı.
// Kasalar çıkarılınca geriye sabit olması gereken sahne kalıyor.
const sabit = d => d.cisim - d.kasa;
turlar.forEach((d, i) => console.log(`     ${i ? i + '. tur' : 'başta '}  geometri ${d.geometri} · doku ${d.doku} · cisim ${d.cisim} (kasasız ${sabit(d)})`));
const t1 = turlar[1], t3 = turlar[3];
ok(t3.doku === t1.doku, 'doku birikmiyor', `${t1.doku} → ${t3.doku}`);
ok(t3.geometri === t1.geometri, 'geometri birikmiyor (ilk turdan sonra sabit)',
   `${t1.geometri} → ${t3.geometri}`);
ok(sabit(t3) === sabit(t1), 'kasalar dışında sahne sabit',
   `${sabit(t1)} → ${sabit(t3)}`);

console.log('\n5) Uzun koşu');
// Beş dakikalık oyun: müşteri gelip gidiyor, kasalar akıyor, hedefler
// doluyor. Hiçbiri sahnede iz bırakmamalı.
const uzunOnce = turlar[3];
const uzunSonra = await pg.evaluate(async () => {
  for (let k = 0; k < 60; k++) {
    for (let i = 0; i < 100; i++) window.jeStep(0.05);
    window.jeMusAdim(5);
    if (k % 10 === 0) { window.jeMusBelir(); window.jeMusAdim(2); window.jeMusDokun(0, 0); }
  }
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  return window.jePerf();
});
console.log(`     kasasız cisim ${sabit(uzunOnce)} → ${sabit(uzunSonra)} · geometri ${uzunOnce.geometri} → ${uzunSonra.geometri} · doku ${uzunOnce.doku} → ${uzunSonra.doku}`);
ok(sabit(uzunSonra) === sabit(uzunOnce), 'sahne büyümedi',
   `${sabit(uzunOnce)} → ${sabit(uzunSonra)}`);
ok(uzunSonra.geometri <= uzunOnce.geometri + 2, 'geometri sızmadı', `${uzunOnce.geometri} → ${uzunSonra.geometri}`);
ok(uzunSonra.doku <= uzunOnce.doku + 1, 'doku sızmadı', `${uzunOnce.doku} → ${uzunSonra.doku}`);

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
