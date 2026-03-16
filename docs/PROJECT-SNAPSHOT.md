# Project Snapshot

## Stato sintetico

Repository MVP impostato per:

- Next.js 15
- TypeScript
- Tailwind
- Prisma
- PostgreSQL
- Auth.js

UI presente e navigabile in locale, ma ancora in fase ibrida:

- shell applicativa pronta
- documentazione solida
- schema dati ampio
- pagine principali scaffoldate
- API core iniziali presenti
- persistente reale ancora incompleto

## Dominio

Prodotto per ristorazione italiana focalizzato su:

- HACCP digitale
- lotti ingredienti
- lotti di produzione interni
- sublotti da porzionamento/travaso
- ristampa etichette auditabile
- temperature
- checklist
- non conformita'
- tracciabilita' backward/forward

## Regole critiche

- produzione nuova != sublotto
- sublotto != ristampa
- ristampa non crea batch
- audit obbligatorio
- controllo quantita' obbligatorio

## File da leggere per capire il progetto

- `docs/PRD.md`
- `docs/ARCHITETTURA.md`
- `docs/SCHEMA-E-WORKFLOW.md`
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `src/lib/domain/batches.ts`
- `src/lib/validators.ts`

## Obiettivo del prossimo sviluppo

Passare da scaffold documentato + demo UI a MVP realmente persistente e usabile da team operativo.
