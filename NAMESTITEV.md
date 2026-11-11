# Namestitev LiftLab na Samsung Galaxy (One UI 9)

LiftLab je spletna aplikacija, ki se namesti iz brskalnika (PWA). Po namestitvi ima svojo ikono, odpre se v celozaslonskem oknu in deluje brez interneta. Vsi treningi in nastavitve ostanejo v telefonu.

Namestitev ima dva dela: aplikacijo enkrat objaviš na naslovu HTTPS, nato jo na telefonu namestiš iz brskalnika. Naslov HTTPS je pogoj brskalnika za namestitev in delovanje brez povezave. Odpiranje datoteke `index.html` neposredno s telefona zato ne zadošča.

## 1. Enkratna objava na naslovu HTTPS

### Možnost A: GitHub Pages (priporočeno)

Koda je že v repozitoriju `marincanze/LiftLab`. Brezplačen račun GitHub omogoča Pages samo za javne repozitorije.

1. Na računalniku odpri repozitorij na GitHubu in izberi **Settings**.
2. Na dnu strani **General** poišči **Danger Zone**, izberi **Change repository visibility** in nastavi **Public**.
3. V levem meniju izberi **Pages**. Pod **Build and deployment** nastavi **Source: Deploy from a branch**, vejo **main** in mapo **/ (root)**, nato **Save**.
4. Počakaj minuto ali dve. Aplikacija bo na naslovu `https://marincanze.github.io/LiftLab/`.

Javna postane samo koda aplikacije. Tvoji treningi niso v repozitoriju, shranjeni so le v telefonu.

### Možnost B: brez javnega repozitorija

Uporabi storitev, ki sprejme mapo z datotekami in ji dodeli naslov HTTPS, na primer Netlify Drop ali Cloudflare Pages. Naloži celotno mapo `LiftLab` in si zapiši dodeljeni naslov.

## 2. Namestitev na telefon

Telefon mora imeti pri namestitvi internetno povezavo. Imena menijev se med različicami brskalnika lahko malo razlikujejo.

### Chrome

1. V Chromu odpri naslov aplikacije in počakaj, da se naloži.
2. Tapni meni **⋮** zgoraj desno.
3. Izberi **Dodaj na začetni zaslon** in nato **Namesti**. V nekaterih različicah je možnost že v meniju zapisana kot **Namesti aplikacijo**.
4. Potrdi. Ikona LiftLab se pojavi na začetnem zaslonu in med aplikacijami.

### Samsung Internet

1. V brskalniku Samsung Internet odpri naslov aplikacije.
2. Tapni meni **≡** spodaj desno.
3. Izberi **Dodaj na** in nato **Začetni zaslon**. Če je v naslovni vrstici ikona za namestitev, lahko tapneš kar njo.
4. Potrdi.

Uporabljaj en brskalnik. Podatki aplikacije so vezani na brskalnik, s katerim si jo namestil.

## 3. Preveri delovanje brez interneta

1. Aplikacijo prvič odpri s povezavo in se sprehodi čez vse zavihke.
2. Vklopi letalski način.
3. Zapri aplikacijo in jo znova odpri z ikone. Delovati mora enako kot prej.

Internet potrebuje samo povezava do videa vaje, ki odpre iskanje na YouTubu.

## 4. Priporočene nastavitve v One UI

- **Obvestila:** v aplikaciji odpri **Več → Jezik, tema in enote → Dovoli obvestila** in potrdi dovoljenje. Tako te časovnik počitka opozori tudi, ko je aplikacija v ozadju.
- **Baterija:** odpri **Nastavitve → Aplikacije → LiftLab → Baterija** in izberi **Neomejeno**. Če LiftLab ni na seznamu, enako nastavi za brskalnik, s katerim si jo namestil.
- **Spanje aplikacij:** v **Nastavitve → Baterija → Omejitve uporabe v ozadju** preveri, da LiftLab in brskalnik nista med aplikacijami v globokem spanju.

## 5. Varnostna kopija in selitev

- Kopijo narediš v **Več → Podatki → Izvozi podatke (JSON)**. Datoteka se shrani med prenose.
- Na novem telefonu aplikacijo namesti po istem postopku in izberi **Več → Podatki → Uvozi podatke**.
- Brisanje podatkov spletnih mest v brskalniku ali odstranitev aplikacije lahko izbriše tudi treninge. Pred tem naredi kopijo.

## 6. Posodobitve

Ko je na naslovu objavljena nova različica, aplikacijo odpri s povezavo. Nove datoteke si prenese sama in jih shrani za delovanje brez povezave.

## Preizkus na računalniku

```
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Nato odpri `http://localhost:8090`. Ta naslov je namenjen preizkusu na računalniku. Telefon z njega aplikacije ne more namestiti, ker ni HTTPS.

## Datoteka APK

Če želiš pravo datoteko APK, jo lahko iz objavljenega naslova izdela orodje PWABuilder. Korak 1 je potreben tudi v tem primeru.
