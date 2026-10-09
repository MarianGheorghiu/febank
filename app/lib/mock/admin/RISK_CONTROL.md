# Risk Control admin

Ruta: `/dashboard/admin/fraud-control`, legată deja în meniul administratorului.
Interfața este în `app/components/ui/admin/risk`, contractele în
`app/lib/types/admin/risk.ts`, logica pură în `app/lib/risk/engine.ts`, iar
store-ul în `app/lib/risk/store.ts`. Datele demonstrative sunt separate în `risk.ts`.

## Funcționalitate

- Overview: cazuri active, criticitate, SLA raportat la ceasul curent, valori
  semnalate (nu pierderi confirmate), expunere și scenariu determinist de stres.
- Investigații: căutare, filtre, paginare, atribuire, note, escaladare, rezoluție
  confirmată sau fals pozitiv. Cazurile rezolvate sunt read-only.
- Restricții: email normalizat, motiv obligatoriu, cerere de ridicare și aprobare
  de către alt administrator. Rezolvarea cazului nu ridică restricția.
- Politici per FIAT / CRYPTO / STOCK: plafon per tranzacție, prag de alertă al
  expunerii, scor de review, scor de blocare și stop de urgență.
- Screening sandbox: scor, KYC și potrivire sancțiuni simulate, decizie explicată
  ALLOW / REVIEW / BLOCK și creare caz cu referință unică între cazurile active.
- Audit: actor, timestamp, motiv, before/after, căutare, paginare, export CSV.
  CSV neutralizează formulele și păstrează ghilimelele și newline-urile.

## Integrarea demo

`mbank_risk_v1` persistă politica, cazurile, restricțiile și auditul în localStorage.
`useSyncExternalStore` sincronizează componentele și evenimentele storage între
file. Comenzile citesc starea cea mai recentă, verifică revision, rolul și motivul,
validează rezultatul, apoi publică actualizarea numai după salvare reușită.
Datele corupte sau storage indisponibil blochează modificările și tranzacționarea.

Motorul de piețe verifică restricțiile, cap-ul de tranzacție și stop-ul de domeniu
înainte de persistarea ordinelor noi, a schimburilor care produc ordine crypto/
stocks și a executării ordinelor în așteptare. Un batch PROCESS blocat nu execută
niciun ordin și nu modifică solduri, rezerve sau rezervări. Anularea rămâne permisă.
Un ordin în așteptare este verificat din nou la execuție folosind politica curentă.

Fiat treasury este fixture separat. Expunerea crypto/stocks este inventarul de bază
marcat la prețul comun; rezervele USD sunt afișate separat. Limitele de expunere
alertează, nu resping ordine. Scenariul de stres nu reprezintă VaR și exclude
rezervele USD. Nu există reconciliere omnibus sau agregare a riscului real al clienților.

Scorurile, KYC, sancțiunile și fiat sunt exclusiv sandbox. Transferurile fiat,
cardurile, DCA simulat și operațiunile vechi independente nu sunt controlate de
acest store. Cazurile sunt manuale sau fixture; nu există ingestie automată de alerte.
Nu există conexiune custody, liste reale de sancțiuni, rail de plăți sau raportare
către autorități. Autentificarea existentă este demonstrativă; browser storage
nu este securitate, arhivă imuabilă sau mecanism de concurență distribuită.

## Contract backend Go

Mutațiile trebuie mutate într-un serviciu autorizat server-side, cu identitatea
operatorului extrasă din sesiune, RBAC, CAS/ETag pe revision și idempotency key.
Tranzacția DB trebuie să verifice politica și restricțiile, să rezerve/execute
mișcarea de fonduri și să insereze auditul în aceeași tranzacție. Approval pentru
release trebuie să compare identități server-side. Evitați două store-uri
independente la integrarea plăților; verificarea trebuie să fie atomică cu ledgerul.
Conectați furnizorii KYC/AML/wallet screening și feed-urile de supraveghere, cu
proveniența semnalelor, retry, SLA, politici de retenție și outbox pentru notificări.

Teste: `npm run test:risk`, `npm run test:markets`, `npx tsc --noEmit`.
