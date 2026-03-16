"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge, Card, DataTable, PageHeader } from "@/components/ui";

interface BatchDetail {
  id: string;
  code: string;
  kind: string;
  status: string;
  productName: string;
  quantityReceived: number;
  quantityAvailable: number;
  unitOfMeasure: string;
  operatorName: string | null;
  dateReceived: string | null;
  producedAt: string | null;
  expiresAt: string | null;
  inboundTemperature: number | null;
  conformityOutcome: string | null;
  supplierLotCode: string | null;
  storageCondition: string | null;
  notes: string | null;
  allergens: string[];
  ingredient: { name: string } | null;
  recipe: { name: string } | null;
  supplier: { name: string } | null;
  operationalArea: { name: string } | null;
  storageLocation: { name: string } | null;
  parentBatch: { id: string; code: string; productName: string } | null;
  childBatches: { id: string; code: string; productName: string; quantityReceived: number; unitOfMeasure: string; status: string }[];
  sourceItems: {
    id: string;
    quantityUsed: number;
    unitOfMeasure: string;
    consumedBatch: { code: string; productName: string };
    ingredient: { name: string } | null;
  }[];
  movements: {
    id: string;
    movementType: string;
    quantity: number;
    unitOfMeasure: string;
    reason: string | null;
    performedBy: string | null;
    createdAt: string;
  }[];
  labels: {
    id: string;
    createdAt: string;
    user: { name: string } | null;
    printLogs: { id: string; reason: string; copies: number; createdAt: string }[];
  }[];
}

function statusTone(status: string): "success" | "danger" | "warning" | "neutral" {
  switch (status) {
    case "ACTIVE": return "success";
    case "DEPLETED": return "neutral";
    case "EXPIRED": return "danger";
    case "BLOCKED": return "danger";
    case "LOW_STOCK": return "warning";
    default: return "neutral";
  }
}

function formatDate(d: string | null): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("it-IT");
}

export default function LottoDetailPage() {
  const params = useParams();
  const code = params.code as string;

  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        // Search by code
        const res = await fetch(`/api/batches?search=${encodeURIComponent(code)}`);
        const batches = await res.json();

        if (!Array.isArray(batches) || batches.length === 0) {
          setError("Lotto non trovato");
          setLoading(false);
          return;
        }

        // Find exact match
        const found = batches.find((b: BatchDetail) => b.code === code) || batches[0];

        // Fetch full detail by ID
        const detailRes = await fetch(`/api/batches/${found.id}`);
        if (!detailRes.ok) {
          setError("Errore nel caricamento del lotto");
          setLoading(false);
          return;
        }
        const detail = await detailRes.json();
        setBatch(detail);
      } catch {
        setError("Errore nel caricamento del lotto");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [code]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={`Lotto ${code}`} description="Caricamento..." />
        <div className="text-center text-slate">Caricamento in corso...</div>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="space-y-6">
        <PageHeader title={`Lotto ${code}`} description="Dettaglio lotto" />
        <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{error || "Lotto non trovato"}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Lotto ${batch.code}`}
        description="Dettaglio lotto con genealogia ingredienti, eventi operativi e azioni rapide."
        actionLabel="Crea sublotti"
        actionHref={`/lotti/${batch.code}/sublotti`}
      />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Batch info card */}
        <Card title="Scheda lotto" subtitle={batch.kind === "SUPPLIER" ? "Ricevimento fornitore" : batch.kind === "PRODUCTION" ? "Nuova produzione interna" : "Sublotto derivato"}>
          <dl className="grid gap-3 text-sm md:grid-cols-2">
            <div><dt className="text-slate">Prodotto</dt><dd className="font-semibold">{batch.productName}</dd></div>
            <div><dt className="text-slate">Codice</dt><dd className="font-semibold">{batch.code}</dd></div>
            {batch.recipe && <div><dt className="text-slate">Ricetta</dt><dd className="font-semibold">{batch.recipe.name}</dd></div>}
            {batch.supplier && <div><dt className="text-slate">Fornitore</dt><dd className="font-semibold">{batch.supplier.name}</dd></div>}
            {batch.supplierLotCode && <div><dt className="text-slate">Lotto fornitore</dt><dd className="font-semibold">{batch.supplierLotCode}</dd></div>}
            <div><dt className="text-slate">Operatore</dt><dd className="font-semibold">{batch.operatorName ?? "-"}</dd></div>
            <div><dt className="text-slate">{batch.kind === "SUPPLIER" ? "Ricevuto" : "Produzione"}</dt><dd className="font-semibold">{formatDate(batch.dateReceived || batch.producedAt)}</dd></div>
            <div><dt className="text-slate">Scadenza</dt><dd className="font-semibold">{formatDate(batch.expiresAt)}</dd></div>
            <div><dt className="text-slate">Quantita' ricevuta</dt><dd className="font-semibold">{batch.quantityReceived} {batch.unitOfMeasure}</dd></div>
            <div><dt className="text-slate">Disponibile</dt><dd className="font-semibold">{batch.quantityAvailable} {batch.unitOfMeasure}</dd></div>
            {batch.operationalArea && <div><dt className="text-slate">Area operativa</dt><dd className="font-semibold">{batch.operationalArea.name}</dd></div>}
            {batch.storageLocation && <div><dt className="text-slate">Ubicazione</dt><dd className="font-semibold">{batch.storageLocation.name}</dd></div>}
            <div>
              <dt className="text-slate">Stato</dt>
              <dd><Badge tone={statusTone(batch.status)}>{batch.status}</Badge></dd>
            </div>
            {batch.inboundTemperature != null && <div><dt className="text-slate">Temperatura ingresso</dt><dd className="font-semibold">{batch.inboundTemperature} °C</dd></div>}
            {batch.conformityOutcome && <div><dt className="text-slate">Conformita'</dt><dd className="font-semibold">{batch.conformityOutcome}</dd></div>}
          </dl>
        </Card>

        {/* Actions card */}
        <Card title="Azioni disponibili" subtitle="Distinzione chiara tra i tre casi d'uso.">
          <div className="space-y-3 text-sm">
            <div className="rounded-3xl bg-sand p-4">Nuova produzione: crea un lotto completamente nuovo.</div>
            <div className="rounded-3xl bg-sand p-4">Porzionamento/travaso: crea sublotti figli collegati.</div>
            <div className="rounded-3xl bg-sand p-4">Copia etichetta: ristampa senza creare alcun lotto.</div>
          </div>
          <div className="mt-5 flex gap-3">
            <Link href={`/lotti/${batch.code}/sublotti`} className="inline-flex h-11 items-center rounded-full bg-brass px-5 font-semibold text-white">
              Crea sublotti
            </Link>
            <Link href="/etichette/ristampa" className="inline-flex h-11 items-center rounded-full border border-black/10 px-5 font-semibold">
              Ristampa etichetta
            </Link>
          </div>
        </Card>
      </div>

      {/* Genealogy: source ingredients (for PRODUCTION batches) */}
      {batch.sourceItems.length > 0 && (
        <Card title="Genealogia ingredienti" subtitle="Backward traceability">
          <DataTable
            headers={["Ingrediente", "Lotto", "Quantita' usata"]}
            rows={batch.sourceItems.map((item) => [
              item.ingredient?.name ?? "-",
              item.consumedBatch.code,
              `${item.quantityUsed} ${item.unitOfMeasure}`,
            ])}
          />
        </Card>
      )}

      {/* Parent batch (for DERIVED batches) */}
      {batch.parentBatch && (
        <Card title="Lotto padre" subtitle="Origine sublotto">
          <DataTable
            headers={["Codice", "Prodotto"]}
            rows={[[
              <Link key="parent" href={`/lotti/${batch.parentBatch.code}`} className="font-semibold text-brass underline">
                {batch.parentBatch.code}
              </Link>,
              batch.parentBatch.productName,
            ]]}
          />
        </Card>
      )}

      {/* Child batches (sublots) */}
      {batch.childBatches.length > 0 && (
        <Card title="Sublotti" subtitle="Figli derivati da questo lotto">
          <DataTable
            headers={["Codice", "Prodotto", "Quantita'", "Stato"]}
            rows={batch.childBatches.map((child) => [
              <Link key={child.id} href={`/lotti/${child.code}`} className="font-semibold text-brass underline">
                {child.code}
              </Link>,
              child.productName,
              `${child.quantityReceived} ${child.unitOfMeasure}`,
              <Badge key={`badge-${child.id}`} tone={statusTone(child.status)}>{child.status}</Badge>,
            ])}
          />
        </Card>
      )}

      {/* Movements history */}
      {batch.movements.length > 0 && (
        <Card title="Storico movimenti" subtitle="Tutti i movimenti di magazzino per questo lotto">
          <DataTable
            headers={["Tipo", "Quantita'", "Motivo", "Operatore", "Data"]}
            rows={batch.movements.map((m) => [
              m.movementType,
              `${m.quantity} ${m.unitOfMeasure}`,
              m.reason ?? "-",
              m.performedBy ?? "-",
              formatDate(m.createdAt),
            ])}
          />
        </Card>
      )}

      {/* Labels and print logs */}
      {batch.labels.length > 0 && (
        <Card title="Etichette e log di stampa" subtitle="Storico stampa etichette">
          <DataTable
            headers={["Etichetta", "Creata il", "Utente", "Ristampe"]}
            rows={batch.labels.map((label) => [
              label.id.substring(0, 8),
              formatDate(label.createdAt),
              label.user?.name ?? "-",
              label.printLogs.length > 0
                ? label.printLogs.map((pl) => `${pl.copies} copie - ${pl.reason}`).join(", ")
                : "Nessuna ristampa",
            ])}
          />
        </Card>
      )}
    </div>
  );
}
