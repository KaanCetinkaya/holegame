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
| **1** | Valley of Kings | Pyramid | ızgara | 314 | 5 | 44s | — |
| **2** | Neon Night | Chevrons | ızgara | 215 | 5 | 39s | — |
| **3** | Beach | Island | RESİM | 1848 | 0 | 135s | — |
| **4** | Matchday Germany | Orbits | ızgara | 187 | 7 | 58s | — |
| **5** | Manhattan | Pillars | **SİPARİŞ** | 162 | 7 | 49s | — |
| **6** | Highlands | Lattice | ŞERİT | 254 | 0 | 124s | — |
| **7** | Copacabana | Wave | ızgara | 181 | 7 | 45s | bomba |
| **8** | Pit Lane | Circuit | ızgara | 242 | 8 | 78s | bomba |
| **9** | Aloha | Bubbles | ızgara | 159 | 7 | 56s | bomba |
| **10** | Cup Night | Crown | ızgara | 430 | 7 | 162s | bomba |
| **11** | Match Day | Rings | ızgara | 175 | 6 | 73s | bomba |
| **12** | Playground | Hopscotch | ızgara | 326 | 6 | 105s | bomba |
| **13** | Hollywood | Checkers | RESİM | 1640 | 0 | 106s | — |
| **14** | Rooftop | Blast | ızgara | 330 | 5 | 196s | bomba |
| **15** | Arcade | Flipper | **DEVLER** | 376 | 6 | 38s | bomba |
| **16** | Market Day | Piles | ŞERİT | 335 | 1 | 163s | — |
| **17** | Matchday Italy | Ribs | ızgara | 307 | 6 | 103s | bomba |
| **18** | Gadget Shop | Blocks | **BULMACA** | 208 | 0 | 9999s | — |
| **19** | Indoors | Ladder | ızgara | 240 | 5 | 134s | bomba |
| **20** | Matchday England | Stairs | ızgara | 415 | 8 | 175s | mancınık, bomba |
| **21** | Orbit | Heart | ızgara | 399 | 7 | 175s | bomba |
| **22** | Drop Zone | Zone | ızgara | 271 | 6 | 123s | bomba |
| **23** | Castle Keep | Keep | RESİM | 1440 | 0 | 110s | — |
| **24** | Rangoli | Whirl | ızgara | 165 | 7 | 68s | mancınık, silindir, bomba |
| **25** | Drive-In | Arrow | **RUSH** | 235 | 5 | 12s | bomba |
| **26** | Suburb Night | House | ŞERİT | 660 | 0 | 163s | — |
| **27** | Cube World | Cubes | ızgara | 560 | 5 | 210s | silindir, bomba |
| **28** | Harvest | Orchard | **BULMACA** | 145 | 0 | 9999s | — |
| **29** | Everything | Lanes | ızgara | 528 | 7 | 190s | mancınık, çamur, bomba |
| **30** | Fiesta | Star | ızgara | 141 | 6 | 92s | mancınık, çamur, bomba |
| **31** | Frontier | Horseshoe | ızgara | 238 | 6 | 156s | silindir, rakip, bomba |
| **32** | The Arena | Ring | ızgara | 424 | 7 | 172s | mancınık, rakip, bomba |
| **33** | Grand Bazaar | Crescent | RESİM | 1760 | 0 | 110s | — |
| **34** | Gold Coast | Diamond | ızgara | 246 | 6 | 96s | silindir, rüzgâr, rakip, bomba |
| **35** | Le Jardin | Maze | **MAYIN** | 209 | 7 | 188s | bomba |
| **36** | Pirate Cove | Anchor | ŞERİT | 185 | 0 | 163s | — |
| **37** | Tulip Fields | Comb | ızgara | 428 | 9 | 201s | silindir, çamur, rakip, bomba |
| **38** | Overgrown | Crack | **BULMACA** | 192 | 0 | 9999s | — |
| **39** | The Reef | Lens | ızgara | 360 | 3 | 118s | çamur, rüzgâr, rakip, bomba |
| **40** | Red Square | Onion | ızgara | 248 | 6 | 117s | mancınık, rüzgâr, rakip, bomba |
| **41** | Forbidden City | Gate | ızgara | 405 | 5 | 162s | mancınık, çamur, rakip, bomba |
| **42** | Happy Hour | Bloom | ızgara | 486 | 7 | 167s | mancınık, rüzgâr, rakip, bomba |
| **43** | Savanna | Patches | RESİM | 1632 | 0 | 96s | — |
| **44** | Funfair | Cogs | ızgara | 266 | 7 | 79s | çamur, rüzgâr, rakip, bomba |
| **45** | Rooftop | Bolt | **SİPARİŞ** | 319 | 8 | 70s | bomba |
| **46** | Tikal | Ballcourt | ŞERİT | 144 | 0 | 163s | — |
| **47** | Jurassic | Track | ızgara | 203 | 7 | 73s | silindir, rüzgâr, rakip, bomba |
| **48** | Nazca | Condor | **BULMACA** | 169 | 0 | 9999s | — |
| **49** | Outback | Boomerang | ızgara | 174 | 5 | 98s | çamur, rüzgâr, rakip, bomba |
| **50** | Payday | Hourglass | ızgara | 299 | 7 | 160s | çamur, rüzgâr, rakip, bomba |
| **51** | Academy | Key | ızgara | 187 | 6 | 84s | mancınık, silindir, rakip, bomba |
| **52** | Matchday France | Cross | ızgara | 425 | 7 | 175s | mancınık, çamur, rakip, bomba |
| **53** | Matchday Spain | Spiral | RESİM | 1464 | 0 | 116s | — |
| **54** | Red Planet | Dial | ızgara | 208 | 7 | 120s | mancınık, çamur, rakip, bomba |
| **55** | Snow Day | Walls | **DEVLER** | 434 | 6 | 51s | çamur, bomba |

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
