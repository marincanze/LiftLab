# LiftLab

Offline trener za trening z utežmi (PWA). Načrtuje treninge glede na tvoj čas, opremo, rutino in prioritete, vodi te skozi vsak set in se uči iz vpisanih setov. Brez računa in brez strežnika: vsi podatki ostanejo na napravi.

## Funkcije
- **Profil po korakih**: osebni podatki, izkušnje, cilj, tekmovalna raven, rutina (priporočena, zgornji/spodnji, celo telo, potisk/poteg/noge, celo telo potisk/poteg, po delih telesa, lastna), mišične skupine, prioritete (vlečenje), RIR in ogrevanje, način, doslednost vaj, razponi ponovitev, dnevi in čas (tudi ciklični urnik), nedavni trening, prehrana, spanje, stres, zdravje, poškodbe.
- **Okolja za trening**: več okolij, oprema s kljukicami, inventar plošč, palic, ročk, kettlebellov, elastik, male prilagoditve, nastavitev naprav (plošče ali blok uteži, razponi teže, osnovna teža) in variante naprav.
- **Načrtovanje**: trening se prilagodi času, deload tedni, predlog dneva počitka, superseti in drop seti (samodejno ali ročno), podaljšanje, preskok, ponovna sestava, razvrščanje.
- **Prikaz izvedbe**: animirana figura za vsako vajo (gib v priporočenem tempu, označena ciljna mišica), deluje brez povezave.
- **Aktivni trening**: trajanje treninga ves čas na vrhu, napovedan konec, priprava → ogrevanje → izvedba → vpis seta → počitek, hitri namigi za težo, kalkulator plošč, elastike in vaje s pomočjo, opombe, zgodovina vaje, celozaslonski način, premor, ocena težavnosti.
- **Rekordi**: obvestilo takoj po vpisu seta, tudi za rekord relativne moči (ista moč pri nižji telesni masi); oznake rekordov pri setih in v zgodovini.
- **Ocena ponovitev glede na počitek**: daljši počitek od časovnika dvigne oceno, krajši jo zniža.
- **Telesna masa**: vpis na zavihku Trening, na Domov in v Statistiki, en vpis na dan.
- **Urejanje setov**: vpisan set urediš v svojem oknu, trening teče naprej brez novih predlogov (npr. drop setov).
- **Tedenski načrt in knjižnica vaj**: vsi treningi v tednu z načrtovanimi seti na mišico; pregled vseh vaj z iskanjem in prikazom izvedbe.
- **Enkratne spremembe tedna**: drugi dnevi treninga in drug split samo za izbrani teden, nato se redni program vrne sam.
- **Deload po potrebi**: predlog lažjega tedna, ko napredek zastane (ne fiksno po koledarju).
- **Koledar in statistika**: opravljeni in načrtovani dnevi, ocena uspešnosti, doslednost, rekordi, volumen po mišicah, napredek e1RM, telesna teža in telesne mere, težavnost; prestavljanje posameznega treninga v koledarju; obdobja od tedna do celotne zgodovine.
- **Obvestila**: sistemsko obvestilo ob izteku časovnika počitka ali ogrevanja (prek service workerja, brez strežnika).
- **Ostalo**: slovenščina/angleščina, temna (privzeta)/svetla tema, izklop vodičev, kg/lbs (tudi po vajah), lastne vaje, vaje, ki se jim izogibaš, izvoz/uvoz podatkov z opomnikom za varnostno kopijo, vodiči ob prvi uporabi.

## Zagon na računalniku
```
powershell -ExecutionPolicy Bypass -File serve.ps1
```
Nato odpri http://localhost:8090.

## Namestitev na telefon
Glej [NAMESTITEV.md](NAMESTITEV.md) (Samsung Galaxy, One UI 9).

## Struktura
- `js/data.js` – mišične skupine, oprema, rutine, baza vaj
- `js/anim.js` – animirane figure izvedbe vaj (SVG, brez zunanjih datotek)
- `js/engine.js` – urnik, deload, sestava treninga, model moči, zaokroževanje na inventar, namigi
- `js/app.js` – jedro (navigacija, okna, vodiči, časovniki); `profile.js`, `settings.js`, `session.js`, `views.js` – zasloni
- `js/i18n.js` – prevodi; `css/app.css` – tema; `sw.js` – delovanje brez povezave

## Privzete odločitve
- **Tehnologija:** spletna aplikacija (PWA) v čistem JavaScriptu, brez orodij za gradnjo. Namesti se iz brskalnika in deluje brez povezave.
- **Podatki:** samo lokalno v napravi (`localStorage`), z izvozom in uvozom varnostne kopije.
- **Videz:** temna, minimalistična tema z modrim poudarkom; svetla tema je na voljo v nastavitvah.

## Kaj ni vključeno
Funkcije, ki potrebujejo strežnik ali drugo napravo: prijava in račun, naročnine, sinhronizacija med napravami, aplikacija za uro in video posnetki vaj. Namesto videa izvedbo pokaže animirana figura (`js/anim.js`); v oknu z informacijami o vaji je še povezava do iskanja videa na spletu.
