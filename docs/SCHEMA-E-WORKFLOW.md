# Schema Dati e Workflow

## Entita' principali

- `users`, `roles`, `user_operational_areas`
- `suppliers`
- `ingredients`
- `ingredient_batches`
- `recipes`, `recipe_items`
- `production_batches`, `production_batch_items`
- `derived_batches`
- `batch_movements`
- `batch_labels`, `label_print_logs`
- `storage_locations`, `operational_areas`
- `temperature_logs`
- `haccp_checks`
- `non_conformities`, `corrective_actions`
- `attachments`
- `audit_logs`

## Stati lotto

- `ACTIVE`
- `LOW_STOCK`
- `DEPLETED`
- `EXPIRED`
- `BLOCKED`

## Workflow: sugo

1. Ricezione di pomodoro, olio e cipolla con lotti fornitore e temperature.
2. Creazione ricetta "Sugo al pomodoro base".
3. Nuova produzione:
   - selezione lotti `POM-240311-A`, `OLV-240308-B`, `CIP-240310-C`
   - resa 5 kg
   - generazione lotto `SG-20260313-01`
4. Calcolo scadenza a 3 giorni e stampa etichetta.
5. Forward trace: dal lotto cipolla si trovano tutti i batch che lo hanno usato.
6. Backward trace: dal lotto sugo si risale ai lotti ingredienti consumati.

## Workflow: sublotti

1. Lotto padre `SG-20260313-01`, quantita' 5 kg.
2. Operatore sceglie "Crea sublotti".
3. Inserisce 5 contenitori da 1 kg.
4. Sistema genera:
   - `SG-20260313-01-A`
   - `SG-20260313-01-B`
   - `SG-20260313-01-C`
   - `SG-20260313-01-D`
   - `SG-20260313-01-E`
5. Ogni sublotto eredita genealogia, allergeni, date e area.
6. Quantita' residua lotto padre aggiornata a 0 kg.
7. Stampa di 5 nuove etichette e storico movimenti.

## Workflow: ristampa

1. L'utente apre un lotto esistente.
2. Seleziona "Ristampa etichetta".
3. Inserisce motivo e numero copie.
4. Sistema crea solo `label_print_logs`.
5. Nessuna nuova riga batch o movimento di stock.
