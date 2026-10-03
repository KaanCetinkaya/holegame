// Bildirim ne zaman kuruluyor, ne zaman susuyor?
//
//   node build-www.mjs && node scratchpad/holenotif.mjs
//
// Oyunun tek geri çağırma yolu bu, ve yanlış kurulunca iki türlü zarar
// veriyor. Erken izin sorarsan Android reddi kalıcı sayıyor ve bir daha
// soramıyorsun. Yanlış zamanlarsan bugün oynamış oyuncuya bugün için
// bildirim gidiyor — o da sessize alıyor, geri dönüşü yok.
//
// Cihazda test edilemez: bildirimin gerçekten düşmesi Android'in işi. Burada
// ölçülen, plugine **ne gönderdiğimiz** — izin akışı, zamanlama, ve zaten
// oynamış oyuncunun rahat bırakılması. Sahte eklenti çağrıları kaydediyor.

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-fruithole' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8247);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

const fails = [];
const check = (ok, what, saw) => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what}${saw === undefined ? '' : `   ${saw}`}`);
  if (!ok) fails.push(what);
};

// Sahte LocalNotifications. Gerçek eklentinin adları ve dönüş şekilleri.
const fake = (opts = {}) => `
  window.__ln = { calls: [] };
  window.Capacitor = {
    isNativePlatform: () => true,
    Plugins: {
      LocalNotifications: {
        async checkPermissions() {
          window.__ln.calls.push({ name: 'check' });
          return { display: '${opts.already || 'prompt'}' };
        },
        async requestPermissions() {
          window.__ln.calls.push({ name: 'request' });
          return { display: '${opts.grant === false ? 'denied' : 'granted'}' };
        },
        async schedule(o) {
          window.__ln.calls.push({ name: 'schedule', n: o.notifications });
        },
        async cancel(o) { window.__ln.calls.push({ name: 'cancel', n: o.notifications }); },
      },
    },
  };
`;

async function open({ native = true, opts = {}, stats = null, daily = null, notif = null } = {}) {
  const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
  pg.on('pageerror', e => { console.log('  SAYFA HATASI: ' + e); fails.push(String(e)); });
  if (native) await pg.addInitScript(fake(opts));
  await pg.addInitScript(a => {
    localStorage.clear();
    if (a.stats) localStorage.setItem('fruithole_stats', JSON.stringify(a.stats));
    if (a.daily) localStorage.setItem('fruithole_daily', JSON.stringify(a.daily));
    if (a.notif) localStorage.setItem('fruithole_notif', JSON.stringify(a.notif));
  }, { stats, daily, notif });
  await pg.goto('http://localhost:8247/', { waitUntil: 'load' });
  await pg.waitForFunction(() => window.fruitHoleNotif, { timeout: 30000 });
  await pg.waitForTimeout(400);
  return pg;
}

const durum = pg => pg.evaluate(() => window.fruitHoleNotif());
const cagri = pg => pg.evaluate(() => window.__ln ? window.__ln.calls : []);
const bugun = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

console.log('\n1. izin ne zaman isteniyor');
{
  // Üçüncü bölümden önce sorulmaz: erken sorulan izin reddediliyor ve
  // Android ikinci reddi kalıcı sayıyor.
  let pg = await open({ stats: { levels: 1, stars: 3 } });
  await pg.evaluate(() => window.fruitHoleAskNotif());
  await pg.waitForTimeout(250);
  check(!(await cagri(pg)).some(c => c.name === 'request'), 'üçüncü bölümden önce izin istemiyor');
  check((await durum(pg)).asked !== true, 'sorulmuş da işaretlemiyor');
  await pg.close();

  pg = await open({ stats: { levels: 5, stars: 12 } });
  await pg.evaluate(() => window.fruitHoleAskNotif());
  await pg.waitForTimeout(250);
  check((await cagri(pg)).some(c => c.name === 'request'), 'üçüncüden sonra izin istiyor');
  check((await durum(pg)).granted === true, 'izin verildi olarak kaydedildi');
  await pg.close();

  // İkinci kez sorulmuyor: reddeden oyuncuya tekrar sormak Android'de
  // kalıcı redde dönüşüyor.
  pg = await open({ stats: { levels: 9, stars: 20 }, opts: { grant: false } });
  await pg.evaluate(() => window.fruitHoleAskNotif());
  await pg.waitForTimeout(250);
  await pg.evaluate(() => window.fruitHoleAskNotif());
  await pg.waitForTimeout(250);
  check((await cagri(pg)).filter(c => c.name === 'request').length === 1,
    'reddedilince bir daha izin istemiyor');
  check((await durum(pg)).granted === false, 'reddedildi olarak kaydedildi');
  await pg.close();

  // Tarayıcıda eklenti yok: hiçbir şey olmamalı, hata da vermemeli.
  pg = await open({ native: false, stats: { levels: 9, stars: 20 } });
  check((await durum(pg)).on === false, 'tarayıcıda kapalı');
  await pg.evaluate(() => window.fruitHoleAskNotif());
  await pg.waitForTimeout(200);
  check(true, 'tarayıcıda çağrı patlamıyor');
  await pg.close();
}

console.log('\n2. zamanlama');
{
  // İzin zaten verilmişse açılışta kuruluyor.
  let pg = await open({
    opts: { already: 'granted' },
    notif: { asked: true, granted: true },
  });
  let c = await cagri(pg);
  check(c.some(x => x.name === 'schedule'), 'izin varsa açılışta zamanlanıyor',
    c.map(x => x.name).join(' > '));
  // Önce iptal, sonra kurulum: yoksa her açılış bir bildirim daha ekliyor.
  const iIptal = c.findIndex(x => x.name === 'cancel');
  const iKur = c.findIndex(x => x.name === 'schedule');
  check(iIptal !== -1 && iIptal < iKur, 'önce eskisi iptal ediliyor', `${iIptal} < ${iKur}`);

  const s = c.find(x => x.name === 'schedule');
  check(!!s && s.n.length === 1, 'tek bildirim kuruluyor', s ? String(s.n.length) : '-');
  check(!!s && !!s.n[0].title && !!s.n[0].body, 'başlık ve metin dolu',
    s ? `${s.n[0].title} — ${s.n[0].body}` : '-');
  await pg.close();

  // İzin yoksa hiçbir şey kurulmuyor.
  pg = await open({ notif: { asked: true, granted: false } });
  check(!(await cagri(pg)).some(x => x.name === 'schedule'), 'izin yoksa zamanlamıyor');
  await pg.close();
}

console.log('\n3. bugün oynayana bugün bildirim yok');
{
  // Asıl incelik bu. Bugün oynamış oyuncuya bugün akşam "tarlan hazır"
  // demek, oyuna değil bildirime karşı tepki üretiyor.
  const pg = await open({
    opts: { already: 'granted' },
    notif: { asked: true, granted: true },
    daily: { date: bugun(), levels: 4, streak: 3 },
  });
  const d = await durum(pg);
  const ne = new Date(d.when);
  const simdi = new Date();
  check(ne.getDate() !== simdi.getDate() || ne > simdi,
    'bildirim bugüne değil yarına kuruldu', d.when);
  check(ne > simdi, 'zaman gelecekte');
  await pg.close();
}

console.log('\n4. metin duruma göre');
{
  // Seriyi **dünün** tarihiyle tohumlamak gerekiyor: ensureDaily() açılışta
  // çalışıp seriyi yeniden hesaplıyor ve dünden eski bir tarih seriyi 1'e
  // düşürüyor. İlk yazışımda 2000 yılını vermiştim ve test kendi kurduğu
  // durumu ölçemiyordu.
  const dun = new Date(Date.now() - 86400000);
  const dunKey = `${dun.getFullYear()}-${dun.getMonth() + 1}-${dun.getDate()}`;

  // Serisi olana kaybedeceği şey söyleniyor.
  let pg = await open({
    opts: { already: 'granted' }, notif: { asked: true, granted: true },
    daily: { date: dunKey, streak: 5 },
  });
  let t = (await durum(pg)).text;
  check(/streak/i.test(t.title + t.body), 'serisi olana seri hatırlatılıyor',
    `${t.title} — ${t.body}`);
  await pg.close();

  pg = await open({
    opts: { already: 'granted' }, notif: { asked: true, granted: true },
    daily: { date: dunKey, streak: 0 },
  });
  t = (await durum(pg)).text;
  check(/field|challenge/i.test(t.title + t.body), 'serisi olmayana yeni tarla',
    `${t.title} — ${t.body}`);
  await pg.close();
}

console.log(fails.length ? `\n${fails.length} kontrol düştü` : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length ? 1 : 0);
