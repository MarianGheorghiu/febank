# Date demonstrative și integrarea cu backendul Go

Toate seturile demonstrative sunt în `app/lib/mock`. Modelele de date sunt în
`app/lib/types`, separat de React și de valorile mock. Calculatoarele de credite
rămân în `app/lib/loans/calculators.ts`.

## Utilizare

Preferă importul direct al domeniului folosit de componentă:

```ts
import { MOCK_CARDS } from "@/app/lib/mock/cards";
import type { BankCardData } from "@/app/lib/types/cards";
```

Pentru explorare există și un index cu namespace-uri, fără coliziuni între
`Transfer`, `AuditLog`, `Timeframe` sau `ASSET_PRICES` din domenii diferite:

```ts
import { cards, loansRetail, adminUsers } from "@/app/lib/mock";
```

[Inventarul complet](./INVENTORY.md) enumeră modulele, exporturile și contractele.
[Card Issuing admin](./admin/CARD_ISSUING.md) documentează regulile operaționale,
store-ul persistent și contractul propus pentru backendul Go.
[Crypto Pools și Stock & Markets](./admin/MARKETS.md) documentează motorul comun,
inventarul băncii, ordinele clienților, rezervările și integrarea Go propusă.

[Risk Control admin](./admin/RISK_CONTROL.md) documentează cazurile, controalele, screening-ul și integrarea cu motorul de piețe.

[Audit Logs admin](./admin/AUDIT_LOGS.md) documentează registrul unificat, graficele, exporturile și limitele de colectare.

[Subscriptions admin](../subscriptions/README.md) documentează contractele JSON, operațiunile, facturarea demonstrativă și integrarea Go.

[Referrals admin](../referrals/README.md) documentează clasamentul, cohortele de invitații și contractul de raportare Go.

[Business Analytics admin](../business-analytics/README.md) documentează raportarea financiară, cohortele de utilizatori, reconcilierea și contractele Go.

## Organizare

| Domeniu | Fișiere mock | Contracte / rol |
| --- | --- | --- |
| Overview | `dashboard`, `overview-accounts`, `balances`, `summaries` | Istoric, lichiditate, conturi, indicatori afișați |
| Conturi și schimb | `currencies`, `currency-catalog`, `currency-history`, `exchange` | Fiat, crypto, acțiuni, monede disponibile, grafice, cotații |
| Crypto | `crypto`, `crypto-operations` | Market, serii de portofoliu, cotații pentru operațiuni |
| Acțiuni | `stocks`, `stock-catalog`, `dividends`, `recurring-buys` | Dețineri, screener, OHLC, știri, dividende, planuri DCA |
| Carduri | `cards`, `card-analytics` | Carduri, canale permise, tranzacții, limite, cheltuieli |
| Transferuri | `transfers`, `transfer-table`, `recent-transfers` | Catalog de active, transferuri complete și proiecții UI |
| Social | `friends`, `messages` | Prieteni, cereri, mesaje, alertă demonstrativă |
| Analiză | `analytics`, `analytics-ledger` | Istoric, randamente, risc, loguri de portofoliu |
| Credite | `loans/*` | Retail/Lombard, produse, facilități, facturi, venituri, pricing business, fonduri VC |
| Oferte | `offers`, `offer-conversions` | Puncte, lounge, evenimente, cashback, investiții, conversii |
| Securitate / sesiune | `security`, `auth`, `ids`, `page-dates` | Profil, sesiuni, audit, autentificare demo, identificatori, date demo |
| Administrare | `admin/*` | Utilizatori, sesiuni, audit, tranzacții, tarife, telemetrie, simulare comisioane |
| Landing | `landing-ticker`, `landing-stats`, `summaries` | Cotații și indicatori demonstrativi ai paginii publice |

Meniurile, culorile, iconurile React, taburile, textele de butoane și starea
formularelor sunt configurație de interfață. Rămân în componente. Seturile mock
pot conține identificatori de iconuri și unele câmpuri de prezentare moștenite,
dar nu importă componente React sau biblioteci UI.

## Cum înlocuiești datele cu Go

1. Identifică setul în inventar și tipul din `app/lib/types`.
2. Definește contractul JSON și endpointul împreună cu backendul. Tipurile actuale
   descriu ce consumă UI-ul; nu reprezintă un API Go deja implementat.
3. Creează un client de date pentru domeniu (de exemplu `app/lib/api/cards.ts`),
   care validează răspunsul și îl adaptează la modelul consumat de UI.
4. Înlocuiește importul fixture-ului cu încărcarea datelor, apoi transmite datele
   componentelor. Pentru mutații, folosește răspunsul API și reîncarcă datele
   dependente: solduri, istoric, sumar și portofoliu.
5. Înlocuiește și fabricile/simulatoarele de mai jos; mutarea listelor statice
   singură nu conectează operațiunile la backend.

Exemplu de separare a contractului:

```ts
// app/lib/api/cards.ts — exemplu pentru implementarea viitoare
import type { BankCardData } from "@/app/lib/types/cards";

export async function getCards(): Promise<BankCardData[]> {
  // Fetch + validare + adaptare din răspunsul Go la modelul UI.
  throw new Error("Clientul API urmează să fie implementat");
}
```

Familia de resurse necesare rezultă din domeniile inventarului: conturi/solduri,
cotații/istoric, portofolii, carduri/tranzacții, transferuri, prieteni/cereri,
mesaje, credite/eligibilitate, oferte/loialitate, profil/sesiuni/audit și resurse
administrative. URL-urile, metodele HTTP și autorizarea trebuie stabilite la
implementarea backendului.

## Comportamente demonstrative

| Export | De înlocuit prin |
| --- | --- |
| `auth.createMockSession`, `auth.determineRole` | Autentificare și roluri furnizate de Go; în demo rolul este dedus din email |
| `cards.createMockCard` | Emiterea cardului de către backend; PAN/CVV din fixture sunt exclusiv valori demo |
| `currencyCatalog.generateMockAccountRef` | Crearea contului și referința emisă de backend |
| `security.createMockSecurityLog` | Feedul real de audit |
| `ids.createMockId` | Identificatorul entității returnate de backend |
| `currencyHistory.generateMarketData` | Istoric agregat pe clasă de active și interval |
| `adminSimulation.simulateMockFees` | Motorul Go de pricing/simulare, cu aceleași rezultate afișate în UI |
| Generatoarele din `analytics` și `admin/dashboard` | Istoric și telemetrie reale; în prezent sunt deterministe |

Întârzierile `setTimeout` din formulare sunt simulări de încărcare, iar mai multe
acțiuni afișează doar confirmări locale. Integrarea Go trebuie să înlocuiască și
aceste fluxuri cu cereri reale și gestionarea erorilor.

## Aspecte de contract de păstrat în vedere

- Card Issuing admin are un store reactiv persistent separat, documentat mai sus.
- Crypto Pools și Stock & Markets au un store reactiv comun pentru controalele
  admin și execuțiile client, documentat în `admin/MARKETS.md`.
- Centralizarea oferă o sursă globală de import. Datele nu sunt un store global
  reactiv în toate modulele: listele modificate cu `useState` rămân locale componentelor, exact ca
  înainte. La integrare, un cache comun și invalidarea după mutații vor asigura
  sincronizarea între pagini și între utilizatori.
- Nu modifica obiectele/array-urile importate direct. Creează copii când
  editezi date imbricate; folosește `map`, `filter` și object spread pentru state.
- `summaries` păstrează valorile formatate care erau scrise în JSX. Adaptorul API
  trebuie să formateze valori numerice, monede și procente din DTO-uri reale.
- Există scenarii demo independente cu valori diferite pentru același activ:
  `stock-catalog` față de `stocks`, `crypto` față de `currencies`; `exchange`
  folosește o bază USD, iar `crypto-operations` o bază EUR. Aceste scenarii au
  fost păstrate în snapshoturile istorice. Formularele de tranzacționare și
  piețele crypto/stocks folosesc acum cotațiile comune din `admin/markets`.
  API-ul trebuie să furnizeze aceeași
  cotație, moneda de referință și momentul evaluării tuturor ecranelor relevante.
- Transferurile de overview (`types/dashboard`), tabelul simplificat
  (`types/transfer-table`) și transferurile complete (`types/transfers`) au forme
  și statusuri diferite. Sunt proiecții separate; definește mapări explicite
  pentru enumurile Go. Același lucru se aplică logurilor client/admin.
- Unele sume sunt `number`, altele șiruri deja formatate. Stabilește în DTO-ul Go
  precizia și reprezentarea sumelor, apoi adaptează-le pentru UI. Nu deduce moneda
  din simbolul `$` sau din numele câmpului când lipsește din model.
- Datele istorice și `page-dates` sunt snapshoturi fixe, nu data curentă. Stabilește
  timestampuri ISO și timezone-ul la nivelul contractului, iar formatarea locală
  rămâne în UI.
- Contractele de card includ câmpurile demo `pan` și `cvv`. Modelul real de citire
  trebuie stabilit separat, cu datele de afișare permise de serviciul de carduri.

## Verificări

```bash
npx tsc --noEmit
npx eslint app/lib/mock app/lib/types
npm run build
```

System Health: `admin/system-health.ts` provides independent operational fixtures and a fixed UTC snapshot; see [integration and metric definitions](../system-health/README.md).
