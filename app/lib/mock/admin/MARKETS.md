# Crypto Pools și Stock & Markets

Console: `/dashboard/admin/liquidity` și `/dashboard/admin/stocks`.
Ambele gestionează execuția pentru clienți, nu portofoliul personal al adminului.

## Surse și separarea responsabilităților

- `app/lib/types/admin/markets.ts`: instrumente, routing, inventar bancă, wallet,
  ordine, audit, comenzi administrative și cereri de tranzacționare.
- `app/lib/mock/admin/markets.ts`: un singur seed pentru cele două domenii.
  Prețurile crypto provin din `mock/crypto`, iar acțiunile din `mock/stocks`;
  simbolurile suplimentare din portofoliul vechi folosesc valoare / cantitate.
  USDT are cotația demo 1 USD. Cotațiile sunt manuale, în USD.
- `app/lib/markets/engine.ts`: funcții pure pentru validare, pricing, execuție,
  rezervări, anulare, swapuri și audit. Nu depinde de React sau de browser.
- `app/lib/markets/store.ts`: adaptor reactiv persistent în `mbank_markets_v1`.
  Scrie rezultatul complet înainte de publicare; o eroare de persistare nu
  publică modificarea. Datele corupte blochează mutațiile și afișează avertizare.
- `app/lib/markets/projections.ts`: proiecții comune pentru portofoliile client,
  Market Explorer, Crypto Market, Buying Power și formularele de schimb.
- `app/components/ui/admin/markets`: registru, filtre, paginare, CSV, detalii,
  formulare cu review și confirmare, coada ordinelor și audit before/after.
- `app/components/ui/markets`: confirmări client, status și istoricul execuțiilor.
  Notificările reutilizează providerul Sonner existent prin `OperationNotification`.

Fiecare email client primește separat walletul inițial din fixtures. Soldul USD
este comun pentru crypto și stocks în acest motor, iar EUR/RON au solduri și FX
fixe demonstrative. Adminul nu poate plasa ordine de client.

## Reguli operaționale implementate

`ACTIVE` permite cumpărare/vânzare; `SELL_ONLY` blochează cumpărarea;
`HALTED` blochează orice execuție. Se verifică atât routingul domeniului, cât și
instrumentul. `STALE` blochează execuția până la aprobarea manuală a cotației.
Starea nu detectează automat vechimea unui feed extern.

Comisionul și spreadul sunt în basis points: 100 bps = 1%. Spreadul se aplică
pe fiecare sens față de prețul de referință; comisionul se adaugă la cumpărare
și se scade din încasarea vânzării. Limitele sunt valori USD înainte de comision.
Fiat se rotunjește la două zecimale, cantitățile la maximum opt. Dezactivarea
fracțiilor este blocată când există ordine fracționare în așteptare.

Cumpărarea consumă inventarul de unități al băncii și mărește rezerva USD;
vânzarea face invers. Se verifică soldurile disponibile, deținerile, limitele,
fracțiile și inventarul înainte de aplicarea atomică a unui ordin. Nu există
solduri negative sau vânzare short. Noile listări din formular pornesc suspendate,
fără rezerve; adminul adaugă lichiditate și apoi deschide tranzacționarea.

Crypto acceptă ordine MARKET și swapuri. Stocks acceptă MARKET, LIMIT și STOP.
MARKET se execută imediat în simulare. LIMIT/STOP sunt înregistrate PENDING și
rezervă numerar/unități; nu se execută prin timer. Adminul procesează coada FIFO
la cotația curentă. Un LIMIT trebuie să respecte prețul sau unul mai bun; STOP
se declanșează la prag și nu garantează prețul execuției. Ordinul rămâne PENDING
cu explicație dacă nu se poate executa; rezervarea rămâne activă. Adminul sau
clientul proprietar poate anula un ordin PENDING, eliberând rezervarea.

Swapurile cu două active aplică ambele sensuri într-o singură mutație sau nu
aplică nimic; ambele instrumente trebuie să permită sensul respectiv. Schimbul
fiat-fiat actualizează walletul, fără a crea un ordin crypto/stock în istoric.
CSV-ul client exportă numai ordinele domeniului și emailului respectiv.

Fiecare mutație administrativă cere motiv de 10–500 caractere și păstrează
operator, timestamp și before/after. Suspendările, retragerile de lichiditate,
routingul și anulările cer și tastarea țintei. Versiunile instrumentului și
routingului invalidează confirmările vechi; schimburile verifică revizia globală.

## Ce rămâne demonstrativ

Persistența este locală browserului; taburile primesc evenimente storage, dar
localStorage nu oferă tranzacții concurente între taburi sau sincronizare între
dispozitive. Autentificarea existentă deduce rolul din email și nu este securitate
server. Nu sunt implementate aici verificări KYC/AML/eligibilitate investițională.

Nu există conexiuni reale la brokeri, exchange-uri, custody sau blockchain.
Routingul este manual, fără calendar bursier sau sesiuni automate. Graficele,
P&L istoric, știrile, dividendele și restul dashboardului bancar păstrează
snapshoturile vechi; nu sunt reconstruite din execuțiile acestui motor. Soldurile
bancare din alte module nu reprezintă încă același ledger. Formularele vechi de
alimentare/retragere din Buying Power sunt preview-uri, fără mutație de ledger.
Planurile recurring sunt demo locale paginii; validarea folosește controalele
comune, dar execuția automată necesită schedulerul backendului.

## Contract propus pentru Go — nu endpointuri existente

| Resursă | Operații / date necesare |
| --- | --- |
| `/admin/markets/{domain}/instruments` | Listare/creare, filtre/paginare; simbol, venue, reguli, versiune |
| `/admin/markets/{domain}/routing` | Citire/modificare status, expectedVersion, motiv |
| `/admin/markets/instruments/{symbol}` | Modificare preț demo/reguli, expectedVersion, motiv |
| `/admin/markets/instruments/{symbol}/liquidity` | Ajustare inventar semnată, expectedVersion, motiv |
| `/markets/quotes` | Cotație executabilă cu bid/ask, fee, FX, expirare, quoteId |
| `/markets/orders` | Creare idempotentă și istoric pentru clientul autentificat |
| `/markets/orders/{id}/cancel` | Anulare PENDING autorizată, eliberare rezervări |
| `/admin/markets/orders` | Coada globală, filtre, procesare și anulare cu motiv |
| `/markets/exchanges` | Swap atomic, quoteId și idempotency key |
| `/markets/portfolio` | Solduri totale/disponibile/rezervate, poziții și cost basis |
| `/admin/markets/audit` | Evenimente persistente cu operator și before/after |

Backendul trebuie să derive actorul din sesiunea autentificată, să verifice
permisiuni, KYC și eligibilitate, să facă rezervările/settlementul în tranzacții
SQL și să ofere idempotency, locking/version checks și un ledger contabil.
Folosește decimal/fixed-point și monedă explicită pentru sume, timestampuri UTC,
un calendar bursier și feeduri cu expirare. Brokerul/exchange-ul este sursa
execuției reale; workerul reconciliat procesează ordinele și schedulerul DCA.
Clientul trebuie să consume rezultatul serverului și să invalideze toate
proiecțiile afectate, înlocuind adaptorul local fără duplicarea regulilor în UI.

## Verificare

`npm run test:markets` acoperă motorul, rezervările, anularea, restricțiile,
versiunile, rolurile, lichiditatea, swapurile atomice și erorile de persistare.
Se verifică separat TypeScript, ESLint, buildul și fluxurile desktop/mobile.
