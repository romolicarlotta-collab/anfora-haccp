# Architettura Tecnica

## Scelta stack

Per l'MVP propongo:

- Next.js App Router per UI e backend BFF nella stessa codebase
- TypeScript end-to-end
- Prisma ORM su PostgreSQL
- Auth.js con credenziali o email/password per MVP, estendibile a SSO
- Storage S3-compatible per foto etichette, allegati HACCP e documenti fornitori

Questa scelta riduce complessita' iniziale, accelera il time-to-market e mantiene una struttura pulita per evolvere verso servizi separati quando aumentano sedi, volumi o integrazioni hardware.

## Architettura logica

### Frontend

- UI responsive mobile-first
- layout con sidebar per desktop e quick actions da tablet
- pagine operative ottimizzate per task brevi
- server components per listing e dashboard
- client components solo dove servono form interattivi, filtri e stampa

### Backend

- route handlers/API per operazioni mutative
- moduli dominio per business rules: batching, etichette, traceability, HACCP
- validazioni condivise con Zod
- audit logging centralizzato

### Data layer

- PostgreSQL come source of truth
- Prisma per schema, migration, query e seed
- tabelle append-only per audit log e print log
- relazioni esplicite batch padre-figlio e consumo ingredienti

## Moduli core

- `catalog`: ingredienti, prodotti, allergeni, fornitori
- `inbound`: ricevimento merce, controlli ingresso, allegati
- `inventory`: stock per lotto, movimenti, stati, soglie
- `production`: ricette, produzioni, consumi reali, lotti interni
- `derived-batches`: sublotti, travasi, contenitori, etichette derivate
- `labels`: template, generazione PDF/ZPL, ristampe
- `traceability`: backward/forward trace, export ispezioni
- `haccp`: checklist, temperature, non conformita', azioni correttive
- `iam`: utenti, ruoli, permessi

## Sicurezza

- sessioni HTTP-only
- hashing password
- permessi per ruolo e area operativa
- audit per create/update/delete/print/export/login
- bucket file con URL firmate e ACL private

## Deploy consigliato

- Vercel per app Next.js
- Neon o Supabase per PostgreSQL managed
- Cloudflare R2 o AWS S3 per file
- Sentry per error monitoring
- Logtail o Axiom per logging strutturato

## Estensibilita'

Quando il carico aumenta:

- estrazione modulo etichette in microservizio dedicato
- code asincrone per PDF/ZPL e notifiche
- websocket o polling per dashboard real time
- sensori temperatura via webhook/API dedicata
