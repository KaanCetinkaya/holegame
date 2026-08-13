// Bu depo iki ayrı oyun barındırıyor: Hole (kök index.html) ve
// Fruit Hole (fruithole/index.html).
//
// Capacitor kök dizindeki tek bir config dosyasını okur; sync/copy için
// bir --config bayrağı yoktur. Bu yüzden hedef uygulamayı APP ortam
// değişkeni seçer. Her uygulamanın native projesi kendi klasöründe
// durur (android.path), böylece ikisi aynı depoda çakışmadan yaşar.
//
//   npm run build:www                        # iki www dizinini de üretir
//   npx cap sync android                     -> Hole (varsayılan)
//   APP=fruithole npx cap sync android       -> Fruit Hole
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
};

const app = process.env.APP || 'hole';

if (!apps[app]) {
  throw new Error(
    `Bilinmeyen APP="${app}". Geçerli değerler: ${Object.keys(apps).join(', ')}`
  );
}

module.exports = apps[app];
