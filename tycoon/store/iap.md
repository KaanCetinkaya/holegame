# Play Console'da açılacak üç ürün — Motor Works

Kod hazır ve üç kimliği bekliyor; açılana kadar mağaza satırları
"KAPALI" görünüyor. Değerler `tycoon/index.html` → `SKUS` ve `T`
tablosundan alındı, elle yazılmadı.

Hepsi **tek seferlik ürün** (managed product / "Uygulama içi ürün"),
abonelik değil.

| Ürün kimliği | Ad | Açıklama | Fiyat |
|---|---|---|---|
| `motorworks_double` | Double income | Every shipment pays twice as much, forever. | $2.99 |
| `motorworks_managers` | All four managers | Derya, Marco, Ines and Kwame, hired at once. | $4.99 |
| `motorworks_skip12` | 12 hours of production | Paid in at the rate your line runs right now. | $1.99 |

**Kimlikler birebir bu.** Oyun ürünü kimliğiyle arıyor; bir harf farkı
"ürün bulunamadı" demek ve Console'da bir kez kullanılan kimlik bir daha
geri alınamıyor.

Tüketilebilirlik:

- `motorworks_double` ve `motorworks_managers` **kalıcı** (bir kez
  alınır, devirde korunur)
- `motorworks_skip12` **tüketilebilir** (tekrar tekrar alınabilir)

Açıldıktan sonra kontrol: oyunda mağazayı aç, üç satırın da fiyatı
görünüyor mu. `scratchpad/tymagaza.mjs` ürünler tanınmadığında ne
göründüğünü zaten ölçüyor — "KAPALI" satırı o yüzden var, boş bir ekran
yerine.
