# Installazione

## Requisiti

- Node.js 22+
- PostgreSQL 16+
- bucket S3-compatible opzionale per allegati

## Passi

1. Configura `.env` a partire da `.env.example`.
2. Installa dipendenze:

```bash
npm install
```

3. Genera Prisma Client:

```bash
npm run db:generate
```

4. Applica migration:

```bash
npm run db:migrate
```

5. Carica seed demo:

```bash
npm run db:seed
```

6. Avvia ambiente di sviluppo:

```bash
npm run dev
```

## Note

- Tutte le date sono pensate per `Europe/Rome`.
- Gli utenti demo del seed usano password `demo1234`.
