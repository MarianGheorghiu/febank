# Flags & Config — integrare Go

Ruta admin: `/dashboard/admin/config`. Catalogul demonstrativ este în
`app/lib/mock/admin/flags-config.ts`, contractele JSON în
`app/lib/types/admin/flags-config.ts`. Sunt 12 domenii, 41 setări și 24 flags.

`engine.ts` conține validarea, calcularea diferențelor, publicarea imutabilă,
restaurarea și evaluarea flagurilor. UI-ul utilizează interfața `ConfigRepository`;
`mockConfigRepository` persistă configurația și istoricul împreună într-o singură
scriere localStorage (`mbank_flags_config_v1`). Draftul rămâne în memorie și se
pierde la părăsirea paginii. Publicările sunt păstrate separat pentru production,
staging și sandbox; denumirile mediilor sunt exclusiv demonstrative.

## Comportament

- Modificările sunt revizuite cu before/after, motiv și confirmarea mediului.
- Valorile numerice sunt întregi și au limite explicite. Sumele sunt în EUR cents.
- Pragul de review nu poate depăși limita zilnică de transfer.
- Flagurile dependente nu pot fi activate dacă părintele este dezactivat.
- În production nu se pot dezactiva MFA admin și verificarea KYC.
- Restaurarea publică o nouă revizie folosind snapshotul de dinaintea unui release;
  nu șterge istoricul. Orice editare ulterioară transformă restaurarea într-un
  draft obișnuit.
- `expected_revision` respinge drafturile vechi. Evenimentele storage sincronizează
  taburile. Browser storage nu oferă tranzacții inter-proces: CAS autoritativ va fi
  implementat în Go.
- Stocarea invalidă sau indisponibilă nu este suprascrisă; UI afișează defaults cu
  avertizare și blochează publicarea.
- Audit Logs citește release-urile prin `configAuditEvents`, sursa SYSTEM,
  categoria CONFIGURATION. Snapshoturile și auditul provin din aceeași scriere.
- Exportul JSON include numai versiunea publicată pentru mediul selectat.

Simulatorul folosește FNV-1a 32-bit pe octeții UTF-8 ai `flag_key:customer_id`,
modulo 10000. Accesul este permis dacă bucket < rollout_pct × 100, după evaluarea
activării, audienței, dependențelor, master control și maintenance mode. Go trebuie
să implementeze aceeași algoritmică pentru cohorte stabile. Audiența din simulator
este un singur segment; într-un API real aceasta trebuie dedusă din identitatea
autentificată, nu acceptată ca afirmație a clientului.

## Contract propus pentru API (neimplementat)

| Metodă | Resursă | Comportament |
| --- | --- | --- |
| GET | `/admin/config/catalog` | Catalog, constraints, permisiuni și schema version |
| GET | `/admin/config/{environment}` | Snapshot publicat, revision și istoric paginat |
| POST | `/admin/config/{environment}/releases` | Payload complet, expected_revision, reason, restored_from opțional |
| POST | `/admin/config/{environment}/evaluate` | Evaluare server-side pentru un subiect autorizat |

Backendul va furniza actorul din sesiune, nu din body. Publicarea trebuie să
valideze schema și autorizarea server-side, să blocheze prin revision/ETag în
tranzacție și să scrie configurația + release + audit atomic. Răspuns: snapshot
autoritativ; conflict: 409; validare: 422; acces: 403. Înlocuiește repository-ul și
abonamentul local cu fetch/cache invalidation sau SSE, fără importuri mock în
clientul API. Pentru schimbări critice poate fi adăugat un workflow server-side de
aprobare, fără a trata checkboxul UI drept autorizare.

Acest modul nu aplică încă politicile în paginile bancare existente. Integrarea Go
trebuie să consume configurația în fiecare serviciu care execută operațiunea;
ascunderea unui buton nu reprezintă aplicarea unei politici. Ratele/comisioanele,
regulile de risc, inventarul piețelor și planurile de abonament au deja module
dedicate și nu sunt duplicate aici. Secretele rămân într-un secret manager;
catalogul nu acceptă chei sau parole.

Verificare: `npm run test:flags-config`, `npx tsc --noEmit`, ESLint pe fișierele
modulului și `npm run build`.
