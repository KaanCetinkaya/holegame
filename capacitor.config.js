// Bu depo dört ayrı oyun barındırıyor: Hole (kök index.html),
// Fruit Hole (fruithole/), Slice Rush (slicer/) ve Motor Works (tycoon/).
//
// Capacitor kök dizindeki tek bir config dosyasını okur; sync/copy için
// bir --config bayrağı yoktur. Bu yüzden hedef uygulamayı APP ortam
// değişkeni seçer. Her uygulamanın native projesi kendi klasöründe
// durur (android.path), böylece ikisi aynı depoda çakışmadan yaşar.
//
//   npm run build:www                        # iki www dizinini de üretir
//   npx cap sync android                     -> Hole (varsayılan)
//   APP=fruithole npx cap sync android       -> Fruit Hole
//   APP=slicer npx cap sync android          -> Slice Rush
//   APP=tycoon npx cap sync android          -> Motor Works
//
// Not: Capacitor .ts > .js > .json sırasıyla bakar, bu dosya JSON'un
// yerini aldı; ikisi birden bulunursa JSON okunmaz.

const apps = {
  hole: {
    appId: 'com.kaancetinkaya.hole',
    appName: 'Hole',
    webDir: 'www',
    backgroundColor: '#9fd0ff',
    android: {
      path: 'android',
      backgroundColor: '#9fd0ff',
    },
  },

  fruithole: {
    appId: 'com.kaancetinkaya.fruithole',
    appName: 'Fruit Hole',
    webDir: 'www-fruithole',
    backgroundColor: '#e8c07d',
    android: {
      path: 'android-fruithole',
      backgroundColor: '#e8c07d',
    },
  },

  slicer: {
    appId: 'com.kaancetinkaya.slicerush',
    appName: 'Slice Rush',
    webDir: 'www-slicer',
    backgroundColor: '#1b1230',
    android: {
      path: 'android-slicer',
      backgroundColor: '#1b1230',
    },
  },

  tycoon: {
    appId: 'com.kaancetinkaya.motorworks',
    appName: 'Motor Works',
    webDir: 'www-tycoon',
    backgroundColor: '#22242b',
    android: {
      path: 'android-tycoon',
      backgroundColor: '#22242b',
    },
  },
};

const app = process.env.APP || 'hole';

if (!apps[app]) {
  throw new Error(
    `Bilinmeyen APP="${app}". Geçerli değerler: ${Object.keys(apps).join(', ')}`
  );
}

module.exports = apps[app];
