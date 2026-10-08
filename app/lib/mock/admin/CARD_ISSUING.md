# Card Issuing — administrarea cardurilor clienților

Ruta: `/dashboard/admin/cards`. UI-ul păstrează tema existentă și identifică
explicit operatorul, clientul vizat și caracterul demonstrativ al operațiunilor.

## Fișiere și responsabilități

- `app/lib/mock/admin/card-issuing.ts`: registrul inițial, profilurile KYC/adrese
  și politica de emitere; clienții sunt derivați din `admin/users.ts`.
- `app/lib/types/admin/card-issuing.ts`: modelele, comenzile și auditul.
- `app/lib/admin/card-issuing.ts`: validări și tranziții pure, fără React/storage.
- `app/lib/admin/mock-card-issuing-store.ts`: store comun reactiv, persistență
  localStorage (`mbank_admin_card_issuing_v1`) și sincronizare între taburi.
- `app/lib/admin/card-issuing-export.ts`: export CSV al rezultatului filtrat.
- `app/components/ui/admin/cards`: registru, detalii, dialoguri, audit și toasturi.

Persistența este pentru demonstrație, în browserul curent. Cardurile admin nu
modifică fixture-urile independente ale dashboardului client. Modificările din
pagina Users sunt încă locale acelei pagini; eligibilitatea Card Issuing folosește
profilurile centralizate inițiale. Backendul trebuie să furnizeze aceeași sursă
actualizată pentru utilizatori, KYC, conturi și carduri.

## Reguli implementate

| Acțiune | Condiții și rezultat |
| --- | --- |
| ISSUE | Cont activ, KYC verificat, maximum 5 carduri deschise; creează PENDING |
| DISPATCH | Card fizic PENDING/ORDERED, tracking obligatoriu → DISPATCHED |
| DELIVER | Card fizic PENDING/DISPATCHED → DELIVERED |
| ACTIVATE | PENDING virtual sau fizic livrat → ACTIVE |
| FREEZE / UNFREEZE | ACTIVE ↔ FROZEN; reactivarea cere client eligibil |
| BLOCK | ACTIVE/FROZEN → BLOCKED permanent; fără deblocare |
| TERMINATE | Orice card deschis → TERMINATED definitiv |
| REPLACE | ACTIVE/FROZEN/BLOCKED + client eligibil; închide sursa și creează PENDING, atomic |
| UPDATE_CONTROLS | ACTIVE/FROZEN + client eligibil; modifică limite/canale |
| EXPORT | CSV filtrat cu date mascate; înregistrează audit |

Clientul blocat/nevalidat poate primi doar restricții suplimentare sau închiderea
cardului, fără emitere, activare, înlocuire ori schimbări de limite. Cardurile
virtuale nu permit ATM/contactless. Cardurile fizice cer adresă de livrare verificată.
Înlocuirea păstrează limitele și canalele, cu legături între sursă și înlocuitor.

Sumele demo au maximum două zecimale: `0 < daily <= monthly <= 100000` și
`0 <= atmDaily <= daily`. Limitele nu pot coborî sub consumul înregistrat.
Limitele sunt exprimate în moneda cardului; nu se însumează monede diferite.

Fiecare comandă cere motiv de 10–500 caractere. Dialogul afișează un rezumat
înainte de aplicare; blocarea, închiderea și înlocuirea cer ultimele patru cifre.
Auditul include operatorul, ținta, motivul, timestamp UTC și snapshoturi before/after.
Cardurile expun numai `last4` și expirarea, fără PAN sau CVV.

## Contract propus pentru Go (de implementat)

Tipurile TypeScript descriu modelul UI, nu endpointuri existente. O posibilă mapare:

- `GET /admin/card-customers`: clienți, starea contului, KYC, adresa verificată.
- `GET /admin/cards`: registru cu filtre/paginare/sortare pe server.
- `GET /admin/card-issuing-policy`: rețele, monede, praguri/defaulturi permise.
- `POST /admin/cards`: payload ISSUE, răspuns card creat + audit.
- `POST /admin/cards/{id}/actions`: acțiune, `expectedVersion`, motiv,
  limite/canale/tracking după caz; răspuns toate cardurile afectate + audit.
- `GET /admin/card-audit`: căutare/paginare, inclusiv lanțul de înlocuiri.
- `POST /admin/cards/export`: filtre, CSV autorizat și audit pe server.

Folosește `CardCommand` pentru discriminarea payloadurilor și `IssuedCard` pentru
proiecția de citire. Pentru REPLACE răspunsul trebuie să includă sursa și noul card.
Backendul atribuie ID-uri, ultimele cifre, expirarea și timestampurile; operatorul
provine din sesiunea autentificată, nu din payloadul clientului. Verifică rolul,
eligibilitatea, versiunea și tranziția în aceeași tranzacție cu scrierea auditului.
Versiunile conflictuale trebuie raportate ca 409, validările ca 422, lipsa rolului
ca 403. Folosește chei de idempotency pentru emitere/înlocuire și erori explicite.

Pentru bani, stabilește DTO-uri cu unități minore sau decimal strings și monedă;
adaptorul frontend le transformă în modelul numeric curent. Consumul real și
limitele provin din procesator, iar livrarea/activarea trebuie reconciliate cu
acesta. Auditul și exportul trebuie autorizate pe server. Protecția UI și rolul
demo din browser nu sunt un mecanism de securitate pentru producție.

Store-ul demo verifică versiunea din storage înainte de mutație și păstrează
starea dacă salvarea eșuează. localStorage nu oferă tranzacții între taburi;
concurența reală trebuie rezolvată în Go. Datele locale corupte blochează mutațiile
și afișează avertizare, fără suprascriere automată.

## Verificare

`npm run test:card-issuing` acoperă eligibilitate, rol, statusuri, livrare,
înlocuire atomică, versiuni, limite, audit, CSV și erori de persistență.
