# Bölüm bölüm ne var

55 düzen bir **tur**. 56. bölüm 1. düzene dönüyor, ama bölüm numarası
devam ettiği için engeller ve saat değişiyor: 2. turda her tahta kendi
engel çiftini alıyor (1. turda eşikler henüz geçilmemiş olabiliyor) ve
saat tur tur sıkılaşıyor.

Yani **bölüm 56 = 1. düzen değil.** Oyun her turda sırayı 7 adım
ötelliyor, bu yüzden ikinci turun ilk bölümü listenin 8. düzeni oluyor.
Hangi yerin ikinci turda hangi bölümde çıktığı yerler.md'de yazılı.

Engeller tohuma göre biraz değişir — bu liste tek bir tohumun ölçümü.
Eşikler sabit: bomba 7, kaya 9, diken 12, mancınık 20, silindir 24,
çamur 29, rakip 31, rüzgâr 34.

Bu dosya elle yazılmıyor: `node scratchpad/holeliste.mjs` üretiyor.

| blm | yer | düzen | tahta | meyve | dev | saat | engeller |
|---|---|---|---|---|---|---|---|
| **1** | Valley of Kings | Pyramid | ızgara | 126 | 12 | 54s | — |
| **2** | Neon Night | Chevrons | ızgara | 259 | 8 | 66s | — |
| **3** | Beach | Island | RESİM | 1848 | 0 | 126s | — |
| **4** | Matchday Germany | Orbits | ızgara | 188 | 10 | 76s | — |
| **5** | Manhattan | Pillars | **SİPARİŞ** | 160 | 9 | 54s | — |
| **6** | Highlands | Lattice | ŞERİT | 427 | 0 | 206s | — |
| **7** | Copacabana | Wave | ızgara | 214 | 9 | 58s | bomba |
| **8** | Pit Lane | Circuit | ızgara | 169 | 10 | 110s | bomba |
| **9** | Aloha | Bubbles | ızgara | 192 | 8 | 37s | bomba |
| **10** | Cup Night | Crown | ızgara | 534 | 11 | 230s | bomba |
| **11** | Match Day | Rings | ızgara | 147 | 11 | 152s | bomba |
| **12** | Playground | Hopscotch | ızgara | 511 | 9 | 167s | bomba |
| **13** | Hollywood | Checkers | RESİM | 1640 | 0 | 99s | — |
| **14** | Rooftop | Blast | ızgara | 232 | 8 | 218s | bomba |
| **15** | Arcade | Flipper | **DEVLER** | 407 | 10 | 68s | bomba |
| **16** | Market Day | Piles | ŞERİT | 548 | 24 | 269s | — |
| **17** | Matchday Italy | Ribs | ızgara | 369 | 9 | 275s | bomba |
| **18** | Gadget Shop | Blocks | **BULMACA** | 281 | 0 | 9999s | — |
| **19** | Indoors | Ladder | ızgara | 320 | 8 | 239s | bomba |
| **20** | Matchday England | Stairs | ızgara | 462 | 11 | 193s | mancınık, bomba |
| **21** | Orbit | Heart | ızgara | 187 | 13 | 137s | bomba |
| **22** | Drop Zone | Zone | ızgara | 298 | 7 | 189s | bomba |
| **23** | Castle Keep | Keep | RESİM | 1440 | 0 | 102s | — |
| **24** | Rangoli | Whirl | ızgara | 208 | 9 | 108s | mancınık, silindir, bomba |
| **25** | Drive-In | Arrow | **RUSH** | 231 | 10 | 12s | bomba |
| **26** | Suburb Night | House | ŞERİT | 429 | 0 | 269s | — |
| **27** | Cube World | Cubes | ızgara | 392 | 10 | 234s | silindir, bomba |
| **28** | Harvest | Orchard | **BULMACA** | 220 | 0 | 9999s | — |
| **29** | Everything | Lanes | ızgara | 536 | 13 | 168s | mancınık, çamur, bomba |
| **30** | Fiesta | Star | ızgara | 265 | 11 | 122s | mancınık, çamur, bomba |
| **31** | Frontier | Horseshoe | ızgara | 181 | 15 | 179s | silindir, rakip, bomba |
| **32** | The Arena | Ring | ızgara | 308 | 9 | 161s | mancınık, rakip, bomba |
| **33** | Grand Bazaar | Crescent | RESİM | 1760 | 0 | 102s | — |
| **34** | Gold Coast | Diamond | ızgara | 210 | 8 | 88s | silindir, rüzgâr, rakip, bomba |
| **35** | Le Jardin | Maze | **MAYIN** | 623 | 9 | 297s | bomba |
| **36** | Pirate Cove | Anchor | ŞERİT | 190 | 0 | 269s | — |
| **37** | Tulip Fields | Comb | ızgara | 283 | 11 | 182s | silindir, çamur, rakip, bomba |
| **38** | Overgrown | Crack | **BULMACA** | 288 | 0 | 9999s | — |
| **39** | The Reef | Lens | ızgara | 239 | 11 | 157s | çamur, rüzgâr, rakip, bomba |
| **40** | Red Square | Onion | ızgara | 299 | 12 | 172s | mancınık, rüzgâr, rakip, bomba |
| **41** | Forbidden City | Gate | ızgara | 278 | 21 | 140s | mancınık, çamur, rakip, bomba |
| **42** | Happy Hour | Bloom | ızgara | 457 | 10 | 195s | mancınık, rüzgâr, rakip, bomba |
| **43** | Savanna | Patches | RESİM | 1632 | 0 | 90s | — |
| **44** | Funfair | Cogs | ızgara | 273 | 10 | 150s | çamur, rüzgâr, rakip, bomba |
| **45** | Rooftop | Bolt | **SİPARİŞ** | 335 | 9 | 78s | bomba |
| **46** | Tikal | Ballcourt | ŞERİT | 216 | 0 | 269s | — |
| **47** | Jurassic | Track | ızgara | 243 | 8 | 149s | silindir, rüzgâr, rakip, bomba |
| **48** | Nazca | Condor | **BULMACA** | 252 | 0 | 9999s | — |
| **49** | Outback | Boomerang | ızgara | 159 | 7 | 93s | çamur, rüzgâr, rakip, bomba |
| **50** | Payday | Hourglass | ızgara | 335 | 10 | 105s | çamur, rüzgâr, rakip, bomba |
| **51** | Academy | Key | ızgara | 194 | 12 | 140s | mancınık, silindir, rakip, bomba |
| **52** | Matchday France | Cross | ızgara | 289 | 9 | 172s | mancınık, çamur, rakip, bomba |
| **53** | Matchday Spain | Spiral | RESİM | 1464 | 0 | 109s | — |
| **54** | Red Planet | Dial | ızgara | 278 | 10 | 130s | mancınık, çamur, rakip, bomba |
| **55** | Snow Day | Walls | **DEVLER** | 472 | 9 | 112s | çamur, bomba |

## Görev bölümleri

Her onuncu bölümde bir görev var ve sırası sabit: sipariş, devler, rush,
mayın, sonra baştan.

| bölüm | görev | ne istiyor |
|---|---|---|
| 5, 45 | SİPARİŞ | tek bir meyvenin **hepsini** topla |
| 15, 55 | DEVLER | büyü, sonra **bütün devleri** yut |
| 25, 65 | RUSH | saat 12 saniye başlıyor, her meyve ekliyor |
| 35, 75 | MAYIN | tahta bomba dolu, her biri 5 saniye |
| 18'den sonra her 10 bölümde | BULMACA | saat yok; kapılar dar, sıra önemli |

## Tahta türleri

- **ızgara** — sıradan tahta, meyveler hücrelere diziliyor
- **RESİM** — 1400-1800 parça, meyveler bir resim oluşturuyor
- **ŞERİT** — parçalar çizgiler boyunca diziliyor, ızgara yok
- **BULMACA** — odalar ve kapılar, saat yok
