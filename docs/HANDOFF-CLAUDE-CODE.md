# Handoff per Claude Code

## Prompt pronto da incollare

```text
Agisci come un senior product engineer + full-stack architect specializzato in software per ristorazione, HACCP e tracciabilita' alimentare.

Sto continuando lo sviluppo di una web app chiamata "L'Anfora HACCP", gia' avviata in locale in questa repository.

Obiettivo prodotto:
- software web-based moderno per una realta' italiana che unisce hotel, ristorante, pizzeria, bar/caffetteria
- NON e' un PMS hotel
- focus su HACCP digitale, tracciabilita' alimentare, gestione lotti ingredienti, lotti di produzione interni, sublotti, etichette, temperature, checklist, non conformita', audit trail

Business rules non negoziabili:
1. Nuova produzione = crea un nuovo lotto di produzione
2. Porzionamento/travaso = crea sublotti collegati al lotto padre
3. Copia etichetta = ristampa senza creare alcun nuovo lotto
4. Ogni operazione rilevante deve andare in audit log
5. La somma delle quantita' allocate ai sublotti non deve superare la quantita' disponibile nel lotto padre
6. Lotti scaduti o bloccati non devono essere utilizzabili in produzione
7. Timezone di riferimento: Europe/Rome
8. UI in italiano
9. UX semplice per tablet in cucina e desktop in ufficio

Stack scelto:
- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- Auth.js / NextAuth per MVP
- storage S3-compatible previsto

Stato attuale del repository:
- esiste uno scaffold completo con documentazione prodotto e tecnica
- esiste schema Prisma con entita' principali
- esiste seed demo realistico L'Anfora
- esistono schermate MVP con dati demo
- esistono alcune route API base per ingredienti, fornitori, produzione, sublotti e ristampa etichette
- il frontend oggi e' in gran parte demo/statico, non ancora collegato end-to-end al database
- il server Next.js gira in locale

La tua missione adesso e':
1. leggere prima la documentazione esistente e il codice
2. non ricominciare da zero
3. preservare naming, dominio e logica gia' impostati
4. completare lo sviluppo reale dell'MVP
5. collegare le schermate al database
6. rendere funzionanti i CRUD principali
7. rendere reali i flussi end-to-end:
   - ricevimento merce
   - magazzino lotti
   - ricette
   - nuova produzione interna
   - creazione sublotti
   - ristampa etichette
   - tracciabilita'
   - temperature
   - checklist HACCP
   - dashboard alert
8. mantenere codice modulare, production-ready, ben validato

Ordine di lettura obbligatorio:
1. README.md
2. docs/PRD.md
3. docs/ARCHITETTURA.md
4. docs/SCHEMA-E-WORKFLOW.md
5. prisma/schema.prisma
6. prisma/seed.ts
7. src/lib/domain/batches.ts
8. src/lib/validators.ts
9. src/app/api/*
10. src/app/*

Vincoli implementativi:
- non distruggere la struttura esistente se non necessario
- riusare i componenti esistenti
- mantenere i testi in italiano
- non introdurre complessita' inutile nel MVP
- usare validazioni forti lato server e lato client
- mantenere audit trail per azioni importanti
- preparare il sistema per futura integrazione con stampa etichette termiche

Richiesta operativa:
- analizza il repository
- proponi un piano breve e concreto
- poi implementa direttamente
- esegui le modifiche in piccoli step verificabili
- aggiorna la documentazione se cambi schema o flussi

Priorita' assolute da completare adesso:
- collegare davvero Prisma al frontend
- implementare autenticazione funzionante con persistenza utenti
- trasformare le route API MVP in flussi usabili dalla UI
- creare form reali per produzione, sublotti e ristampa
- creare pagina dettaglio lotto con dati veri
- implementare tracciabilita' forward/backward vera
- migliorare le migration Prisma
- aggiungere gestione errori utente leggibile

Se trovi divergenze tra documentazione e codice, favorisci le business rules sopra e allinea il resto.
```

## Contesto funzionale da trasferire

### Azienda

L'Anfora e' una struttura italiana con:

- hotel
- ristorante
- pizzeria
- bar/caffetteria

Il software non gestisce il PMS hotel. Il focus e' tutto operativo su food safety, lotti e conformita'.

### Focus MVP

- auth
- ingredienti
- fornitori
- ricevimento merce
- magazzino lotti
- ricette
- produzione interna con lotto
- creazione sublotti
- etichette
- ristampa etichette
- tracciabilita'
- temperature
- checklist HACCP
- dashboard alert

### Definizioni operative

#### Lotto di produzione

- nasce da una nuova preparazione reale
- ha genealogia ingredienti propria
- e' un nuovo batch

#### Lotto derivato / sublotto

- nasce da un lotto esistente
- non e' una nuova produzione
- eredita tracciabilita', ingredienti, allergeni, date e dati principali dal lotto madre
- puo' avere quantita', contenitore e posizione diversi

#### Ristampa etichetta

- non crea alcun nuovo lotto
- crea solo uno storico di ristampa

## Esempi reali da preservare

### Workflow produzione sugo

Ingredienti usati:

- Pomodoro pelato, lotto `POM-240311-A`, 4.5 kg
- Olio EVO, lotto `OLV-240308-B`, 0.2 l
- Cipolla bianca, lotto `CIP-240310-C`, 0.6 kg

Output:

- Ricetta: `Sugo al pomodoro base`
- Lotto prodotto: `SG-20260313-01`
- Quantita': 5 kg
- Scadenza: 3 giorni

### Workflow sublotti sugo

Padre:

- `SG-20260313-01`
- quantita' originaria 5 kg

Figli:

- `SG-20260313-01-A`
- `SG-20260313-01-B`
- `SG-20260313-01-C`
- `SG-20260313-01-D`
- `SG-20260313-01-E`

Regola:

- 5 contenitori da 1 kg
- piena genealogia dal padre
- pieno storico dei movimenti

### Workflow ristampa

- ristampare un'etichetta di un lotto esistente
- registrare utente, data/ora, motivo, numero copie
- nessuna creazione batch

## Stato attuale del codice

### File di documentazione

- `README.md`
- `docs/PRD.md`
- `docs/ARCHITETTURA.md`
- `docs/SCHEMA-E-WORKFLOW.md`
- `docs/DESIGN-SYSTEM.md`
- `docs/SPRINT-BACKLOG.md`
- `docs/INSTALLAZIONE.md`
- `docs/DEPLOY.md`

### File tecnici principali

- `package.json`
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `src/lib/prisma.ts`
- `src/lib/validators.ts`
- `src/lib/domain/batches.ts`
- `src/auth.ts`

### API gia' presenti

- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/ingredients/route.ts`
- `src/app/api/suppliers/route.ts`
- `src/app/api/production-batches/route.ts`
- `src/app/api/derived-batches/route.ts`
- `src/app/api/label-reprints/route.ts`

### Pagine gia' presenti

- `src/app/dashboard/page.tsx`
- `src/app/ingredienti/page.tsx`
- `src/app/ingredienti/[id]/page.tsx`
- `src/app/fornitori/page.tsx`
- `src/app/ricevimento-merce/page.tsx`
- `src/app/magazzino-lotti/page.tsx`
- `src/app/ricette/page.tsx`
- `src/app/produzione/nuova/page.tsx`
- `src/app/lotti/[code]/page.tsx`
- `src/app/lotti/[code]/sublotti/page.tsx`
- `src/app/etichette/ristampa/page.tsx`
- `src/app/tracciabilita/page.tsx`
- `src/app/temperature/page.tsx`
- `src/app/checklist-haccp/page.tsx`
- `src/app/non-conformita/page.tsx`
- `src/app/documenti/page.tsx`
- `src/app/impostazioni/page.tsx`
- `src/app/utenti/page.tsx`

## Gap attuali noti

- molte schermate usano ancora `src/lib/demo-data.ts`
- login MVP non e' ancora realmente persistito su database
- migration Prisma iniziale e' ancora placeholder
- non tutte le pagine leggono dati veri dal database
- manca wiring completo form -> API -> database -> refresh UI
- manca enforcement completo dei permessi per ruolo
- manca export PDF/CSV reale
- manca stampa etichetta reale

## Cosa e' gia' stato verificato

- il progetto si avvia con `npm run dev`
- l'interfaccia e' visibile in locale su `http://localhost:3000`
- il server Next gira
- nell'ambiente in cui e' stato generato il repository `psql` non era nel PATH

## Comandi utili

```bash
cd "/Users/cacio/Documents/Anfora HCCP"
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

## Struttura repository

```text
docs/
prisma/
src/
  app/
  components/
  lib/
  types/
```

## Priorita' consigliata di completamento

1. sistemare schema Prisma e migration reali
2. collegare le liste principali al database
3. implementare form reali per create/update
4. completare produzione interna
5. completare sublotti
6. completare ristampa
7. completare tracciabilita'
8. chiudere auth e permessi
9. rifinire dashboard alert
10. aggiungere test minimi sui servizi dominio

## Note per continuita' progettuale

- evitare di reinventare il dominio: il modello concettuale e' gia' definito
- preservare la terminologia italiana
- preservare il focus tablet-first operativo
- preservare la separazione chiara tra produzione, sublotto e ristampa
- preservare la narrativa del prodotto "ispirato a ePackPro ma costruito per L'Anfora"

