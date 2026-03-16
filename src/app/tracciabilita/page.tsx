"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Card, DataTable, PageHeader } from "@/components/ui";

interface TraceNode {
  batchId: string;
  code: string;
  productName: string;
  kind: string;
  quantityUsed?: number | string | null;
  unitOfMeasure?: string | null;
  ingredientName?: string | null;
  children: TraceNode[];
}

interface TraceResult {
  batch: {
    id: string;
    code: string;
    productName: string;
    kind: string;
    status: string;
    quantityReceived: number;
    quantityAvailable: number;
    unitOfMeasure: string;
    expiresAt: string | null;
    operatorName: string | null;
  };
  backward: TraceNode[];
  forward: TraceNode[];
}

function kindLabel(kind: string) {
  switch (kind) {
    case "SUPPLIER": return "Ingrediente";
    case "PRODUCTION": return "Produzione";
    case "DERIVED": return "Sublotto";
    default: return kind;
  }
}

function kindTone(kind: string): "neutral" | "success" | "warning" | "danger" {
  switch (kind) {
    case "SUPPLIER": return "neutral";
    case "PRODUCTION": return "success";
    case "DERIVED": return "warning";
    default: return "neutral";
  }
}

function flattenNodes(nodes: TraceNode[], direction: string): Array<[React.ReactNode, React.ReactNode, string]> {
  const rows: Array<[React.ReactNode, React.ReactNode, string]> = [];
  for (const node of nodes) {
    const detail = node.quantityUsed
      ? `${node.productName} ${node.quantityUsed} ${node.unitOfMeasure ?? ""}`
      : node.productName;
    rows.push([
      <Link key={node.batchId} href={`/lotti/${node.code}`} className="font-semibold text-brass underline">{node.code}</Link>,
      <Badge key={`badge-${node.batchId}`} tone={kindTone(node.kind)}>{kindLabel(node.kind)}</Badge>,
      detail,
    ]);
    if (node.children.length > 0) {
      rows.push(...flattenNodes(node.children, direction));
    }
  }
  return rows;
}

export default function TracciabilitaPage() {
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<TraceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch() {
    if (!search.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      // Search batch by code
      const batchRes = await fetch(`/api/batches?search=${encodeURIComponent(search.trim())}`);
      const batches = await batchRes.json();
      const found = Array.isArray(batches) ? batches.find((b: { code: string }) => b.code === search.trim()) : null;

      if (!found) {
        setError("Lotto non trovato. Verifica il codice.");
        setLoading(false);
        return;
      }

      // Fetch traceability
      const traceRes = await fetch(`/api/batches/${found.id}/traceability`);
      if (!traceRes.ok) {
        setError("Errore nel caricamento della tracciabilita'.");
        setLoading(false);
        return;
      }

      const traceData = await traceRes.json();
      setResult({ batch: found, ...traceData });
    } catch {
      setError("Errore di connessione.");
    } finally {
      setLoading(false);
    }
  }

  const backwardRows = result?.backward?.length
    ? flattenNodes(result.backward, "backward")
    : [];
  const forwardRows = result?.forward?.length
    ? flattenNodes(result.forward, "forward")
    : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Tracciabilita'" description="Ricerca per lotto con genealogia backward e forward, relazioni padre-figlio ed export ispezioni." />
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card title="Ricerca lotto" subtitle="Ricostruzione rapida per audit o richiamo.">
          <div className="space-y-4">
            <input
              className="h-12 w-full rounded-2xl border border-black/10 px-4"
              placeholder="Codice lotto (es. SG-20260313-01)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <div className="flex gap-3">
              <button
                className="h-12 rounded-full bg-brass px-5 font-semibold text-white disabled:opacity-50"
                type="button"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? "Ricerca..." : "Cerca"}
              </button>
            </div>
            {error && <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
            {result && (
              <div className="rounded-3xl bg-sand p-4 text-sm">
                <p className="font-semibold">{result.batch.code} — {result.batch.productName}</p>
                <p className="text-slate">
                  {kindLabel(result.batch.kind)} · {result.batch.quantityAvailable}/{result.batch.quantityReceived} {result.batch.unitOfMeasure}
                  {result.batch.expiresAt ? ` · Scad. ${new Date(result.batch.expiresAt).toLocaleDateString("it-IT")}` : ""}
                </p>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          {backwardRows.length > 0 && (
            <Card title="Backward — Origine ingredienti" subtitle="Da dove proviene questo lotto">
              <DataTable
                headers={["Nodo", "Tipo", "Dettaglio"]}
                rows={backwardRows}
              />
            </Card>
          )}
          {forwardRows.length > 0 && (
            <Card title="Forward — Utilizzo e derivazioni" subtitle="Dove e' stato usato questo lotto">
              <DataTable
                headers={["Nodo", "Tipo", "Dettaglio"]}
                rows={forwardRows}
              />
            </Card>
          )}
          {result && backwardRows.length === 0 && forwardRows.length === 0 && (
            <Card title="Genealogia" subtitle="Nessuna relazione trovata">
              <p className="text-sm text-slate">Questo lotto non ha relazioni backward o forward.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
