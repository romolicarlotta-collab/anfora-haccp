# Product Requirements Document

## Visione

L'Anfora HACCP e' una piattaforma SaaS-style pensata per hotel con ristorazione integrata, ristorante, pizzeria e bar. Il prodotto digitalizza HACCP, tracciabilita' alimentare e gestione lotti operativi con UX semplice da tablet e controllo amministrativo da desktop.

## Problemi da risolvere

- Registri HACCP frammentati tra carta, foto e fogli Excel.
- Tracciabilita' incompleta tra ricezione, produzione e porzionamento.
- Difficolta' a ricostruire rapidamente la genealogia di un lotto in caso di controllo o richiamo.
- Etichettatura manuale e ristampe non auditabili.
- Mancanza di alert immediati per scadenze, lotti in esaurimento e non conformita'.

## Obiettivi MVP

- Ridurre a meno di 2 minuti il tempo medio per registrare una produzione standard.
- Garantire genealogia completa backward e forward per ogni lotto attivo.
- Rendere auditabile ogni stampa o ristampa etichetta.
- Rendere consultabili da dashboard tutte le criticita' operative giornaliere.
- Supportare aree operative separate: cucina, pizzeria, bar/colazioni, laboratorio.

## Utenti

- Admin: configurazione completa, utenti, ruoli, template e integrazioni.
- Responsabile HACCP: controlli, audit, non conformita', documentazione.
- Responsabile cucina: produzioni, magazzino lotti, ricette, supervisione operatori.
- Operatore cucina: ricevimento, produzioni, sublotti, etichette, checklist assegnate.
- Operatore bar/pizzeria: controlli area, lotti area, ricevimento e porzionamenti.
- Supervisore/titolare: dashboard, audit trail, ispezioni, report export.

## Use case primari

### 1. Ricezione merce

L'operatore registra ingredienti ricevuti, lotto fornitore, quantita', temperatura in ingresso, esito conformita' e allega foto etichetta.

### 2. Produzione interna

Dal ricettario seleziona una ricetta, sceglie i lotti reali usati, indica resa prodotta e genera un nuovo lotto di produzione interno con allergeni e shelf life.

### 3. Sublotti e travasi

Un lotto esistente viene porzionato o trasferito in nuovi contenitori. Il sistema genera codici figli, aggiorna la quantita' residua del padre e stampa nuove etichette senza alterare la genealogia ingredienti.

### 4. Ristampa etichetta

L'utente ristampa una o piu' etichette di un lotto esistente indicando il motivo. Non nasce alcun nuovo lotto ma si registra un evento auditabile.

### 5. Tracciabilita'

Per ogni lotto l'utente puo' vedere albero genealogico, ingredienti origine, batch derivati, movimenti, stampe, non conformita' collegate ed esportare PDF/CSV.

## Regole di business

- Un lotto di produzione nasce solo da una nuova produzione.
- Un sublotto nasce solo da un lotto esistente e ne eredita i dati principali.
- Una ristampa non crea nuovi lotti.
- I lotti scaduti o bloccati non possono essere usati in nuove produzioni.
- La somma delle quantita' assegnate ai sublotti non puo' superare la disponibilita' del lotto padre.
- Ogni evento operativo rilevante genera un audit log.
- Tutti i timestamp applicativi usano timezone `Europe/Rome`.

## KPI iniziali

- produzioni registrate/giorno
- checklist completate entro fascia oraria
- lotti prossimi a scadenza
- non conformita' aperte
- tempo medio di ricerca lotto in ispezione
- percentuale lotti con etichettatura conforme

## Non obiettivi MVP

- PMS hotel
- contabilita' e fatturazione
- pianificazione menu avanzata
- integrazione sensori IoT in real time
- sync offline multi-device

## Rilasci

### MVP

- auth e ruoli
- ingredienti e fornitori
- ricevimento merce
- magazzino lotti
- ricette
- produzioni interne
- sublotti
- etichette e ristampe
- tracciabilita'
- dashboard alert
- temperature, checklist HACCP, non conformita'

### V2

- QR/barcode scanning
- integrazione Zebra/Brother
- sensori temperatura
- firma digitale
- modalita' offline
- multi-sede
