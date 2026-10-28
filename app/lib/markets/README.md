# Crypto Pools — audit și integrare

## Evaluarea modulului inițial

Existau deja reguli pure pentru disponibilitate, cotații aprobate manual,
limite, alimentare/retragere de inventar, listare, ordine și audit before/after.
Execuțiile utilizau walletul comun cu Overview, Transfers și Crypto.

Lipseau un adaptor HTTP administrativ, validarea răspunsurilor serviciului,
stări de încărcare/eroare, sesiunea reală din header, grafice alimentate din
inventar, vizibilitatea impactului asupra clientului și stilul noilor module.
Prețurile buy/sell afișau aceeași referință fără a aplica pricingul clientului;
acum afișăm explicit referința, iar fee/spreadul rămân în motorul central.

Defectul principal: delta de inventar a fiecărui client nu era însumată în
rezerva văzută de ceilalți clienți sau de admin. Același inventar putea fi
consumat separat. `inventory.ts` agregă acum jurnalele observate, inclusiv
versiunile și revizia. Adaptorul client exclude jurnalul proprietarului din
agregare, deoarece `projectTrading` îl aplică o singură dată. Modificările admin
persistă numai diferența față de inventarul proiectat. Baseline-ul local poate
conține offsets semnate după retrageri din inventarul alimentat de clienți;
acesta nu este rezerva disponibilă și nu trebuie expus ca atare prin API.

## Contractul serviciului Go

Configurare comună cu restul aplicației:
`NEXT_PUBLIC_TRANSFERS_MODE=demo|http`, `NEXT_PUBLIC_TRANSFERS_API_URL`.

- `GET /v1/admin/markets/snapshot` → `{schema_version:1, as_of:UTC, state}`.
- `POST /v1/admin/markets/commands` cu header `Idempotency-Key` și body
  `{schema_version:1, command}` → snapshotul autoritativ după operație.
- Autentificare prin cookie (`credentials: include`); actorul se derivă exclusiv
  pe server. Rolul și emailul operatorului nu sunt trimise în body.
- Erori: `{error:{code:string,message:string}}`, cu 401/403 pentru acces,
  409 pentru versiune/idempotency conflict, 422 pentru reguli și 503 pentru
  dependențe indisponibile. Frontendul păstrează eroarea; nu revine la mock în HTTP.

`openapi.json` definește resursele, snapshotul și cele șase comenzi.
Numele câmpurilor interne sunt păstrate explicit în JSON (camelCase), pentru
compatibilitate cu motorul existent. Sumele, cantitățile și prețurile sunt
**șiruri zecimale**, fără notație exponențială, până la 8 zecimale pentru active;
versiunile și basis points sunt numere întregi. Timestampurile sunt RFC3339 UTC.
`response.ts` face conversia la limita UI și respinge payloaduri invalide.
`as_of` reprezintă observația serverului, nu data unui seed.

Exemplu comandă:

```json
{"schema_version":1,"command":{"action":"LIQUIDITY","symbol":"BTC","expectedVersion":4,"unitsDelta":"0.005","usdDelta":"1000","reason":"Replenish BTC pool after treasury review."}}
```

Go trebuie să decodeze decimalurile în fixed-point/decimal, să verifice sesiunea,
permisiunile și `expectedVersion`, apoi să blocheze poolul în tranzacția SQL.
Inventarul global, soldurile și rezervările clientului, execuția și auditul se
salvează atomic. Idempotency key + hash payload + răspuns se păstrează împreună;
retry cu același payload întoarce rezultatul inițial, alt payload produce 409.
La PROCESS se folosește ordine FIFO globală, fără double settlement. La CANCEL
se eliberează numai rezervarea ordinului. UPDATE/ROUTING nu modifică deținerile.

Serviciul trebuie să proiecteze numai rezerve globale efective, nenegative;
nu baseline-urile sau offseturile adaptorului demo. Auditul păstrează operator,
motiv, timestamp și before/after. Același ledger servește endpointurile client
Crypto/Currencies/Overview/Transfers. Fee/spread/plan vin din Rates & Fee Engine.

## Interfață și comportament

Header comun cu sesiunea, metrici cu tonuri distincte, grafice de rezerve bazate
pe date, atenționări cu acces direct la pool și detalii privind buy/sell,
dețineri observate și ordine pending. Registrul are filtre, export, paginare,
tabel desktop cu header sticky, regiune scrollabilă limitată, căutare și paginare (8/rânduri), respectiv carduri mobile; modalele au review, motiv, confirmare pentru
operațiile sensibile și blocare în timpul cererii. Modalul se închide la click în exterior (pointer down + click pe backdrop), Escape sau X, exceptând salvarea în curs. Manage are X, acțiuni grupate și acces la audit filtrat. Hoverul graficului și al rândurilor folosește contur albastru fără fundal alb. Titlul și descrierea duplicate
sub header au fost eliminate la cererea utilizatorului.

## Limite rămase

Nu există backend Go în acest repository. Endpointurile sunt contracte pentru
implementarea lui; HTTP nu produce tranzacții reale până la conectarea serviciului.
Demo folosește catalog în localStorage și jurnale wallet în sessionStorage:
agregarea acoperă clienții observați în aceeași sesiune de browser. Nu oferă
locking între dispozitive sau taburi independente. Snapshoturile se actualizează
la mutații, focus, storage și Refresh; serviciul Go poate adăuga SSE ulterior.
Demo nu oferă idempotency administrativă persistentă; HTTP trimite chei stabile
pentru retry, iar semantica trebuie implementată pe server.

Quote health este o aprobare manuală, fără feed TTL. Graficele prezintă rezerve
curente; nu inventează istoric, volum sau venituri. Nu există exchange/custody,
reconciliere externă sau scheduler DCA. Clienții observați nu sunt întreg registrul.
Sunt inițializate o singură dată patru identități dedicate `markets-demo-…@example.test`, cu 44 de ordine: 24 FILLED, 4 PENDING, 12 CANCELLED și 4 REJECTED. Execuțiile, rezervările și anulările trec prin jurnalul comun. Exemplele PENDING/REJECTED simulează răspunsuri de venue importate; nu reprezintă un feed extern. Refresh nu rescrie jurnalele existente. Conturile utilizatorilor existenți nu sunt alimentate sau modificate de seed.

## Verificare

`test:markets`, `test:wallet`, `test:crypto`, `test:stocks`, TypeScript, ESLint și
build. Testele noi verifică agregarea între doi clienți, invalidarea versiunilor,
epuizarea globală, ajustări admin fără dublare și transportul HTTP decimal.

## Stock & Markets — verificare și exemple

Stock & Markets folosește etichete de instrumente/acțiuni, cu aceleași controale
și validări. `seedStockMarketDemo` adaugă o singură dată patru identități dedicate
(`equities`, `growth`, `income`, `index`) cu 60 de ordine: 24 FILLED, 20 PENDING,
12 CANCELLED și 4 REJECTED. MARKET, LIMIT și STOP trec prin motorul comun;
PENDING include triggeruri eligibile și neatinse. Procesarea la cotațiile seed
execută 12 ordine și păstrează 8 cu explicație și rezervarea activă. Exemplele
rejected sunt răspunsuri de broker simulate, fără debit sau rezervare.

Lista oferă filtru de tip și afișează targetPrice și rezervele cash/unități pe
desktop și mobil. Auditul unui instrument include și before/after de tip array
pentru PROCESS. Graficul limitează vizualizarea la opt instrumente cu cel mai
mic inventar bilateral, iar valorile tuturor instrumentelor rămân accesibile.

Procesarea demo sortează global după createdAt și id, apoi salvează câte un
ordin în jurnalul proprietarului. Evenimentul intern `processing_order_id`
păstrează replay determinist fără să proceseze restul ordinelor aceluiași client
înaintea altor clienți. API-ul public PROCESS rămâne neschimbat. Batchul demo
nu este o tranzacție SQL globală; backendul trebuie să implementeze locking,
reconciliere și retry idempotent pentru fiecare execuție.

Butonul Close din detalii are fundal roșu și text alb, fără icon, cu aceeași
înălțime (25px) și padding ca badge-ul ACTIVE. Modalele păstrează butonul X
original pe componenta ActionButton.
Limitele rămase pentru stocks sunt integrarea brokerului, calendarul bursei,
feedurile cu expirare, corporate actions și schedulerul recurring; nu sunt
simulate ca servicii reale în această interfață.
