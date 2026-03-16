# L'Anfora HACCP

Software web-based per HACCP digitale, tracciabilita' lotti, produzioni interne, sublotti e controlli operativi per ristorazione italiana.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- Auth.js con credenziali demo nel MVP
- Archiviazione file S3-compatible

## Avvio locale

1. Installa Node.js 22+ e PostgreSQL 16+.
2. Copia `.env.example` in `.env` e aggiorna le variabili.
3. Installa le dipendenze:

```bash
npm install
```

4. Genera client Prisma e applica la migration:

```bash
npm run db:generate
npm run db:migrate
```

5. Carica i dati demo:

```bash
npm run db:seed
```

6. Avvia l'app:

```bash
npm run dev
```

## Utenti demo

- `admin@anfora.local` / `demo1234`
- `haccp@anfora.local` / `demo1234`
- `cucina@anfora.local` / `demo1234`

## Documentazione

- [PRD](./docs/PRD.md)
- [Architettura tecnica](./docs/ARCHITETTURA.md)
- [Schema dati e workflow](./docs/SCHEMA-E-WORKFLOW.md)
- [Design system](./docs/DESIGN-SYSTEM.md)
- [Backlog sprint](./docs/SPRINT-BACKLOG.md)
- [Installazione](./docs/INSTALLAZIONE.md)
- [Deploy](./docs/DEPLOY.md)
- [Handoff Claude Code](./docs/HANDOFF-CLAUDE-CODE.md)
- [Project Snapshot](./docs/PROJECT-SNAPSHOT.md)

## MVP implementato

- autenticazione base
- dashboard alert
- anagrafica ingredienti e fornitori
- ricevimento merce
- magazzino lotti
- ricette
- produzione interna
- sublotti
- etichette e ristampa
- tracciabilita'
- temperature e checklist HACCP

## Deploy

Deploy consigliato:

- frontend/app su Vercel
- PostgreSQL managed su Neon o Supabase
- bucket S3-compatible su Cloudflare R2 o AWS S3

Dettagli operativi in [ARCHITETTURA](./docs/ARCHITETTURA.md).
