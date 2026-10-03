// Tanıtım satırı: anlattığı şey tahtada var mı?
//
//   node build-www.mjs && node scratchpad/holehint.mjs
//
// Sekiz engelin her biri ilk çıktığı bölümde bir satırla tanıtılıyor —
// ekranın altında, koşu başında görünüp ilk dokunuşta sönen ipucu satırı.
// Ayrı bir öğretici ekran yok, ve olmaması bilinçli: oyunu sekiz saniyede
// bir kurala durdurmak.
//
// Bu dosya tek bir şeyi ölçüyor ve ölçtüğü şey bir hatadan geliyor. Satır
// **bölüm numarasına** bakıyordu, tahtada o şeyin olup olmadığına değil, ve
// yerleştirme rastgele. Ölçüldüğünde tanıtım bölümünde mancınık 40 tohumun
// 29'unda, diken 33'ünde çıkıyordu: oyuncuların dörtte biri "kırmızı halka
// bomba düşeceği yer" satırını üstünde tek mancınık olmayan bir tahtada
// okuyordu.
//
// Bu, elle yazılan bir sayının çürümesiyle aynı hata, başka kılıkta: iki
// ayrı yerde duran iki gerçek, birbirine bakmadan.
//
// İki şey ölçülüyor:
//
//   1. Tanıtım bölümü satırın çıkabileceği bir bölüm mü — sıradan bir
//      ızgara tahtası ve görevsiz. Görev bölümünde `missionRule` erken
//      dönüyor ve engel satırı hiç görünmüyor.
//   2. Tahtada o engel gerçekten var mı, ve yoksa satır susuyor mu.

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-fruithole' + p); } catch {}
  if (b) {
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } else { r.writeHead(404); r.end('no'); }
}).listen(8317);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('http://localhost:8317/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.fruitHoleProbe === 'function', { timeout: 25000 });

const fails = [];
const check = (ok, ne, ek = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ne}${ek ? '   ' + ek : ''}`);
  if (!ok) fails.push(`${ne} ${ek}`);
};

// Engel adı -> ilk bölümü ve "tahtada var mı" sorusu. İsimler oyunun kendi
// kancalarından okunuyor; elle yazılan bir bölüm numarası bu dosyanın
// anlattığı hatanın ta kendisi olurdu.
const ENGELLER = await pg.evaluate(() => ({
  diken: { blm: window.fruitHoleSpikes().ilkBolum, anahtar: 'SPIKES' },
  mancınık: { blm: window.fruitHoleCatapults().ilkBolum, anahtar: 'CATAPULTS' },
  silindir: { blm: window.fruitHoleRollers().ilkBolum, anahtar: 'ROLLERS' },
  çamur: { blm: window.fruitHoleMud().ilkBolum, anahtar: 'MUD' },
  rakip: { blm: window.fruitHoleRival().ilkBolum, anahtar: 'RIVAL' },
  rüzgâr: { blm: window.fruitHoleWind().ilkBolum, anahtar: 'WIND' },
}));

const DENEME = 40;

console.log('\n1. tanıtım bölümü satırın çıkabileceği bir bölüm mü');
for (const [ad, e] of Object.entries(ENGELLER)) {
  const m = await pg.evaluate(l => {
    const p = window.fruitHoleProbe(l);
    return { kind: p.kind, mission: p.mission || '' };
  }, e.blm);
  check(m.kind === 'ızgara' && !m.mission,
    `${ad}: ${e.blm}. bölüm sıradan bir ızgara tahtası`,
    `${m.kind}${m.mission ? ', görev: ' + m.mission : ''}`);
}

console.log('\n2. tanıtılan şey tahtada var mı');
console.log('\n  engel      blm | kaç tohumda var');
console.log('  ---------+-----+----------------');
for (const [ad, e] of Object.entries(ENGELLER)) {
  let kac = 0;
  for (let s = 0; s < DENEME; s++) {
    const o = await pg.evaluate(([l, t, a]) => {
      window.fruitHoleSeedField(t);
      window.fruitHoleProbe(l);
      const m = {
        SPIKES: () => window.fruitHoleSpikes().sayi > 0,
        CATAPULTS: () => window.fruitHoleCatapults().sayi > 0,
        ROLLERS: () => window.fruitHoleRollers().sayi > 0,
        MUD: () => window.fruitHoleMud().sayi > 0,
        RIVAL: () => window.fruitHoleRival().var,
        WIND: () => window.fruitHoleWind().var,
      }[a]();
      window.fruitHoleUnseedField();
      return m;
    }, [e.blm, 4000 + s * 37, e.anahtar]);
    if (o) kac++;
  }
  e.oran = kac / DENEME;
  console.log(`  ${ad.padEnd(9)} ${String(e.blm).padStart(4)} | ${kac}/${DENEME} (%${Math.round(e.oran * 100)})`);
}
for (const [ad, e] of Object.entries(ENGELLER)) {
  // Eşik %90: yerleştirmenin bazı tahtalarda hiç uygun yer bulamaması
  // kabul edilen bir şey (mancınık kenar payı, doğuş yeri, kolosun önü ve
  // her kayadan bir ağız boyu uzaklık şartlarını birden sağlamak zorunda).
  // Kabul edilmeyen, oyuncuların dörtte birinin olmayan bir şeyi anlatan
  // bir satır okuması.
  check(e.oran >= 0.9, `${ad}: tanıtım tahtasında neredeyse hep var`,
    `%${Math.round(e.oran * 100)}`);
}

console.log('\n3. tahtada yoksa satır susuyor mu');
{
  // Satırın tahtaya bağlı olduğu, engelin **hiç olmadığı** bir bölümde
  // ölçülüyor: tanıtım bölümünden bir önceki bölüm. Orada engel tanım
  // gereği yok, ve satır da çıkmamalı.
  const bozuk = [];
  for (const [ad, e] of Object.entries(ENGELLER)) {
    const o = await pg.evaluate(([l, a]) => {
      window.fruitHoleProbe(l);
      window.fruitHoleStartLevel();
      const h = document.getElementById('hint');
      return { yazi: h ? h.textContent : '', anahtar: a };
    }, [e.blm - 1, e.anahtar]);
    if (o.yazi.includes(e.anahtar)) bozuk.push(`${ad}:${e.blm - 1}`);
  }
  check(!bozuk.length, 'engelin olmadığı bölümde satırı çıkmıyor', bozuk.join(' '));
}

console.log('\n4. tanıtım bölümünde satır gerçekten çıkıyor');
{
  const eksik = [];
  for (const [ad, e] of Object.entries(ENGELLER)) {
    const o = await pg.evaluate(([l, a]) => {
      window.fruitHoleProbe(l);
      window.fruitHoleStartLevel();
      const h = document.getElementById('hint');
      const varMi = {
        SPIKES: () => window.fruitHoleSpikes().sayi > 0,
        CATAPULTS: () => window.fruitHoleCatapults().sayi > 0,
        ROLLERS: () => window.fruitHoleRollers().sayi > 0,
        MUD: () => window.fruitHoleMud().sayi > 0,
        RIVAL: () => window.fruitHoleRival().var,
        WIND: () => window.fruitHoleWind().var,
      }[a]();
      return { yazi: h ? h.textContent : '', varMi };
    }, [e.blm, e.anahtar]);
    // Tahtada varsa satır da olmalı; yoksa bu bölüm zaten 2. ölçünün konusu.
    if (o.varMi && !o.yazi.includes(e.anahtar)) eksik.push(`${ad}:${e.blm}`);
  }
  check(!eksik.length, 'tahtada varken satır çıkıyor', eksik.join(' '));
}

console.log('\nsayfa hataları: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
