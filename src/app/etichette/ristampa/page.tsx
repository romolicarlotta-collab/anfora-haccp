"use client";

import { useEffect, useState } from "react";
import { Card, DataTable, PageHeader } from "@/components/ui";

interface Batch {
  id: string;
  code: string;
  productName: string;
  labels: { id: string }[];
}
interface ReprintLog {
  id: string;
  reason: string;
  copies: number;
  createdAt: string;
  label?: {
    batch?: { code: string; productName: string } | null;
  } | null;
  user?: { name: string } | null;
}

const inputCls = "h-12 w-full rounded-2xl border border-black/10 px-4";
const selectCls = "h-12 w-full rounded-2xl border border-black/10 px-4";
const btnPrimary = "h-12 w-full rounded-full bg-brass font-semibold text-white disabled:opacity-50";

export default function RistampaEtichettePage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [reprintLogs, setReprintLogs] = useState<ReprintLog[]>([]);

  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [reason, setReason] = useState("");
  const [copies, setCopies] = useState("1");
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/batches").then((r) => r.json()),
      fetch("/api/label-reprints").then((r) => r.json()),
    ]).then(([bat, logs]) => {
      setBatches(Array.isArray(bat) ? bat : []);
      setReprintLogs(Array.isArray(logs) ? logs : []);
    });
  }, []);

  const filteredBatches = searchTerm
    ? batches.filter(
        (b) =>
          b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.productName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : batches;

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedBatch) {
      setError("Seleziona un lotto");
      return;
    }

    // Need a label ID — use first label if available, otherwise show error
    const labelId = selectedBatch.labels?.[0]?.id;
    if (!labelId) {
      setError("Questo lotto non ha etichette associate. Impossibile ristampare.");
      return;
    }

    setLoading(true);

    try {
      const body = {
        batchId: selectedBatch.id,
        labelId,
        userId: "", // Will be set by auth context in production
        reason,
        copies: parseInt(copies),
      };

      const res = await fetch("/api/label-reprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Errore durante la ristampa");
      }

      setSuccess(`Ristampa registrata con successo per lotto ${selectedBatch.code}!`);
      setSelectedBatchId("");
      setReason("");
      setCopies("1");
      setSearchTerm("");

      // Refresh reprint logs
      const freshLogs = await fetch("/api/label-reprints").then((r) => r.json());
      setReprintLogs(Array.isArray(freshLogs) ? freshLogs : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(d: string): string {
    return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ristampa etichette"
        description="Ristampa auditabile senza creare un nuovo lotto. Ogni copia richiede motivo e numero etichette."
      />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card title="Nuova ristampa" subtitle="Non crea batch, genera solo log di stampa.">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <input
                className={inputCls}
                placeholder="Cerca lotto per codice o prodotto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className={selectCls}
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              required
            >
              <option value="">Seleziona lotto...</option>
              {filteredBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} - {b.productName}
                </option>
              ))}
            </select>

            <input
              className={inputCls}
              placeholder="Motivo della ristampa"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              minLength={3}
            />

            <input
              className={inputCls}
              type="number"
              min="1"
              max="20"
              placeholder="Numero di copie"
              value={copies}
              onChange={(e) => setCopies(e.target.value)}
              required
            />

            {error && <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}
            {success && <div className="rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">{success}</div>}

            <button className={btnPrimary} type="submit" disabled={loading}>
              {loading ? "Registrazione..." : "Registra ristampa"}
            </button>
          </form>
        </Card>

        <Card title="Log ristampe" subtitle="Storico completo con utente, data e motivo.">
          <DataTable
            headers={["Lotto", "Utente", "Quando", "Motivo", "Copie"]}
            rows={reprintLogs.map((log) => [
              log.label?.batch?.code ?? "-",
              log.user?.name ?? "-",
              formatDate(log.createdAt),
              log.reason,
              String(log.copies),
            ])}
          />
        </Card>
      </div>
    </div>
  );
}
