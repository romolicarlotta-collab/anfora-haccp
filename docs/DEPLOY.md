# Deploy

## Topologia consigliata

- `Vercel`: frontend e route handlers Next.js
- `Neon` o `Supabase`: PostgreSQL managed
- `Cloudflare R2` o `AWS S3`: allegati e foto etichette

## Checklist

1. Configura variabili ambiente in production.
2. Esegui `prisma migrate deploy`.
3. Esegui seed solo su ambienti demo/staging.
4. Attiva monitoraggio errori e audit log centralizzati.
5. Configura backup database e lifecycle policy storage.

## Variabili chiave

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `S3_ENDPOINT`
- `S3_BUCKET`
- `S3_REGION`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `APP_TIMEZONE`

## Hardening successivo

- password hash reali con Argon2 o bcrypt
- RBAC enforcement middleware lato server
- signed URLs per allegati
- code async per stampe e PDF
